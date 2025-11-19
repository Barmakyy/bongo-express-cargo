import express from 'express';
import {
  register,
  login,
  protect,
  updatePassword,
  updateMe,
  forgotPassword,
  resetPassword,
  setupTwoFactorAuth,
  verifyTwoFactorAuth,
  disableTwoFactorAuth,
  verifyTwoFactorLogin,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/2fa/login', verifyTwoFactorLogin);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.use(protect);

router.patch('/update-password', protect, updatePassword);
router.patch('/update-me', updateMe);

router.post('/2fa/setup', setupTwoFactorAuth);
router.post('/2fa/verify', verifyTwoFactorAuth);
router.post('/2fa/disable', disableTwoFactorAuth);

export default router;