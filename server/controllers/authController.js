import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import sendEmail from '../utils/email.js';

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

export const protect = async (req, res, next) => {
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return res.status(401).json({ status: 'fail', message: 'You are not logged in. Please log in to get access.' });
	}

	try {
		const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

		const currentUser = await User.findById(decoded.id);
		if (!currentUser) {
			return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
		}

		req.user = currentUser;
		next();
	} catch (error) {
		return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
	}
};

export const restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				status: 'fail',
				message: 'You do not have permission to perform this action.',
			});
		}
		next();
	};
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'customer' // Ensure role is set, default to 'customer' if not provided
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

export const updatePassword = async (req, res) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) {
    return res.status(401).json({ status: 'fail', message: 'Your current password is wrong.' });
  }

  // 3) If so, update password
  user.password = req.body.password;
  // The passwordConfirm is not a field in the DB, but it's required for the validator on the User model.
  // We don't have a passwordConfirm field, but the frontend already checks for matching passwords.
  // To satisfy the model validation, we can temporarily set it.
  // Note: A better long-term solution might be a dedicated `passwordChangedAt` field.

  // 4) Save user and log them in, send JWT
  try {
    await user.save();
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
     res.status(500).json({ status: 'error', message: 'Error saving new password.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
    }

    // If 2FA is enabled, send a temporary response
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        status: '2fa_required',
        message: 'Please enter your 2FA token.',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    // Omit password from the output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during login.',
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({ status: 'fail', message: 'This route is not for password updates. Please use /update-password.' });
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = {};
    if (req.body.name) filteredBody.name = req.body.name;
    if (req.body.email) filteredBody.email = req.body.email;
    // Allow updating the phone number, even to an empty string
    if (req.body.phone !== undefined) filteredBody.phone = req.body.phone;
    if (req.body.profilePicture) filteredBody.profilePicture = req.body.profilePicture;

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Verify 2FA token during login
// @route   POST /api/auth/2fa/login
// @access  Public
export const verifyTwoFactorLogin = async (req, res) => {
  const { email, password, token: twoFactorToken } = req.body;

  if (!email || !password || !twoFactorToken) {
    return res.status(400).json({ status: 'fail', message: 'Please provide email, password, and 2FA token.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ status: 'fail', message: '2FA is not enabled for this account.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken,
    });

    if (!verified) {
      return res.status(401).json({ status: 'fail', message: 'Invalid 2FA token.' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    user.password = undefined;
    user.twoFactorSecret = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Something went wrong during 2FA login.' });
  }
};

// @desc    Set up 2FA for a user
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setupTwoFactorAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    const secret = speakeasy.generateSecret({ name: `BongoExpressCargo (${user.email})` });
    user.twoFactorSecret = secret.base32;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) throw err;
      res.status(200).json({
        status: 'success',
        data: { qrCode: data_url, secret: secret.base32 },
      });
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to set up 2FA.' });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
export const verifyTwoFactorAuth = async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user.id).select('+twoFactorSecret');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    user.twoFactorEnabled = true;
    await user.save();
    res.status(200).json({ status: 'success', message: '2FA enabled successfully.' });
  } else {
    res.status(400).json({ status: 'fail', message: 'Invalid 2FA token.' });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disableTwoFactorAuth = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();
  res.status(200).json({ status: 'success', message: '2FA disabled.' });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'There is no user with that email address.' });
    }

    // 2) Generate the random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    // Note: You need to configure your email transport in `utils/email.js`
    // and set environment variables (e.g., for SendGrid, Mailgun, etc.)
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        text: message,
        // html: '...'
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ status: 'error', message: 'There was an error sending the email. Try again later!' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Something went wrong.' });
  }
};

// @desc    Reset password
// @route   PATCH /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is a user, set the new password
    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'Token is invalid or has expired' });
    }

    user.password = req.body.password;
    // The user model's 'save' middleware will handle hashing the password
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Log the user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({ status: 'success', token });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};