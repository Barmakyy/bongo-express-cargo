import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { startOfMonth, endOfMonth } from 'date-fns';

// @desc    Get all shipments with pagination, search, and filtering
// @route   GET /api/shipments
// @access  Private/Admin
export const getShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'All';

    const query = {};

    if (search) {
      query.shipmentId = { $regex: search, $options: 'i' };
    }

    if (statusFilter && statusFilter !== 'All') {
      query.status = statusFilter;
    }

    const shipments = await Shipment.find(query)
      .populate('customer', 'name')
      .populate('agent', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Shipment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        shipments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create a new shipment
// @route   POST /api/shipments
// @access  Private/Admin
export const createShipment = async (req, res) => {
  try {
    const newShipment = await Shipment.create(req.body);
    res.status(201).json({ status: 'success', data: { shipment: newShipment } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Update a shipment
// @route   PUT /api/shipments/:id
// @access  Private/Admin
export const updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: 'No shipment found with that ID' });
    }

    res.status(200).json({ status: 'success', data: { shipment } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Delete a shipment
// @route   DELETE /api/shipments/:id
// @access  Private/Admin
export const deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);

    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: 'No shipment found with that ID' });
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Get shipment summary statistics
// @route   GET /api/shipments/summary
// @access  Private/Admin
export const getShipmentSummary = async (req, res) => {
  try {
    const total = await Shipment.countDocuments();
    const pending = await Shipment.countDocuments({ status: 'Pending' });
    const inTransit = await Shipment.countDocuments({ status: 'In Transit' });
    const delivered = await Shipment.countDocuments({ status: 'Delivered' });

    res.status(200).json({
      status: 'success',
      data: {
        total,
        pending,
        inTransit,
        delivered,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create a shipment for a guest user
// @route   POST /api/shipments/guest-booking
// @access  Public
export const createGuestShipment = async (req, res) => {
  try {
    const { senderName, senderEmail, senderPhone, origin, destination, weight, packageDetails } = req.body;

    if (!senderName || !senderEmail || !senderPhone || !origin || !destination || !weight || !packageDetails) {
      return res.status(400).json({ status: 'fail', message: 'Please provide all required fields.' });
    }

    // Find or create a guest user
    let guestUser = await User.findOne({ email: senderEmail, role: 'guest' });

    if (!guestUser) {
      // Create a new user document without running full validators,
      // as guests don't have passwords.
      guestUser = new User({
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
        role: 'guest',
      });
      await guestUser.save({ validateBeforeSave: false });
    } else {
      // Optionally update guest info if they book again
      guestUser.name = senderName;
      guestUser.phone = senderPhone;
      await guestUser.save({ validateBeforeSave: false });
    }

    const newShipment = await Shipment.create({
      customer: guestUser._id,
      origin,
      destination,
      weight,
      packageDetails,
      status: 'Pending',
      cost: Math.max(20, weight * 5), // Dummy cost calculation
      dispatchDate: new Date(),
      trackingHistory: [
        {
          status: 'Pending',
          location: origin,
          timestamp: new Date(),
        },
      ],
    });

    await Payment.create({
      paymentId: `INV-${newShipment.shipmentId}`,
      customer: guestUser._id,
      shipment: newShipment._id,
      amount: newShipment.cost,
      method: 'M-Pesa',
      status: 'Pending',
      transactionDate: new Date(),
    });

    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map(admin =>
      Notification.create({
        user: admin._id,
        text: `New guest shipment (${newShipment.shipmentId}) booked by ${guestUser.name}.`,
        link: '/admin/dashboard/shipments',
      })
    );
    await Promise.all(notificationPromises);

    res.status(201).json({ status: 'success', data: { shipment: newShipment } });
  } catch (error) {
    console.error('Guest Shipment Error:', error);
    res.status(400).json({ status: 'fail', message: error.message });
  }
};