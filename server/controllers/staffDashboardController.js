import Shipment from '../models/Shipment.js';
import Message from '../models/Message.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { startOfDay, endOfDay } from 'date-fns';
import sendEmail from '../utils/email.js';

// @desc    Get staff dashboard stats (overview)
// @route   GET /api/staff-dashboard/stats
// @access  Private/Staff
export const getStaffStats = async (req, res) => {
  try {
    const staffId = req.user._id;

    const assignedShipments = await Shipment.countDocuments({ staff: staffId });
    const pendingDeliveries = await Shipment.countDocuments({ staff: staffId, status: { $in: ['Pending', 'In Transit'] } });

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const completedToday = await Shipment.countDocuments({
      staff: staffId,
      status: 'Delivered',
      'trackingHistory.timestamp': { $gte: todayStart, $lte: todayEnd },
      'trackingHistory.status': 'Delivered',
    });

    const priorityShipments = await Shipment.find({
      staff: staffId,
      status: { $in: ['Pending', 'In Transit'] },
    })
    .populate('customer', 'name phone')
    .sort({ estimatedDelivery: 1 })
    .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        metrics: { assignedShipments, pendingDeliveries, completedToday },
        priorityShipments,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create a shipment by a staff member
// @route   POST /api/staff-dashboard/shipments
// @access  Private/Staff
export const createShipmentByStaff = async (req, res) => {
  try {
    const { customerName, customerPhone, ...shipmentDetails } = req.body;
    const staff = req.user; // The logged-in staff member

    // Try to find existing customer by phone
    let customer = await User.findOne({ phone: customerPhone, role: 'customer' });

    let shipmentData = {
      ...shipmentDetails,
      staff: staff._id,
      createdBy: staff._id,
      branch: staff.branch,
      status: 'Pending',
      cost: Math.max(20, (shipmentDetails.weight || 1) * 5), // Dummy cost
      dispatchDate: new Date(),
      trackingHistory: [
        {
          status: 'Pending',
          location: shipmentDetails.origin,
          timestamp: new Date(),
        },
      ],
    };

    // If customer exists, link to customer. Otherwise, use guest details
    if (customer) {
      shipmentData.customer = customer._id;
    } else {
      shipmentData.guestDetails = {
        name: customerName,
        phone: customerPhone,
      };
    }

    const newShipment = await Shipment.create(shipmentData);

    // Create a pending payment record
    const paymentData = {
      shipment: newShipment._id,
      amount: newShipment.cost,
      method: 'M-Pesa',
      status: 'Pending',
    };

    // Only add customer if it exists
    if (customer) {
      paymentData.customer = customer._id;
    }

    await Payment.create(paymentData);

    res.status(201).json({ status: 'success', data: { shipment: { shipmentId: newShipment.shipmentId } } });
  } catch (error) {
    console.error('Error creating shipment by staff:', error);
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Get shipments assigned to the logged-in staff member
// @route   GET /api/staff-dashboard/shipments
// @access  Private/Staff
export const getStaffShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'All';
    
    const query = { staff: req.user._id };
    
    // Add search filter for shipment ID
    if (search) {
      query.shipmentId = { $regex: search, $options: 'i' };
    }
    
    // Add status filter
    if (statusFilter && statusFilter !== 'All') {
      query.status = statusFilter;
    }

    const shipments = await Shipment.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Shipment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        shipments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get single shipment details by staff
// @route   GET /api/staff-dashboard/shipments/:id
// @access  Private/Staff
export const getStaffShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, staff: req.user._id })
      .populate('customer', 'name email phone location')
      .populate('staff', 'name email')
      .populate('createdBy', 'name');

    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: 'Shipment not found or not assigned to you.' });
    }

    res.status(200).json({ status: 'success', data: { shipment } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Update a shipment's status and tracking history by staff
// @route   PATCH /api/staff-dashboard/shipments/:id
// @access  Private/Staff
export const updateShipmentByStaff = async (req, res) => {
  try {
    const { status, location } = req.body;
    const shipment = await Shipment.findOne({ _id: req.params.id, staff: req.user._id });

    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: 'Shipment not found or not assigned to you.' });
    }

    shipment.status = status;
    // Add to tracking history
    shipment.trackingHistory.push({ status, location: location || shipment.destination, timestamp: new Date() });

    await shipment.save();

    res.status(200).json({ status: 'success', data: { shipment } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Get messages related to shipments assigned to the staff member
// @route   GET /api/staff-dashboard/messages
// @access  Private/Staff
export const getStaffMessages = async (req, res) => {
  try {
    // 1. Find all shipments assigned to the staff member
    const assignedShipments = await Shipment.find({ staff: req.user._id }).select('customer');
    const customerIds = [...new Set(assignedShipments.map(s => s.customer))];

    // 2. Find all messages from those customers
    const messages = await Message.find({ user: { $in: customerIds } })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', data: { messages } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Reply to a message as a staff member
// @route   POST /api/staff-dashboard/messages/:id/reply
// @access  Private/Staff
export const replyToMessageByStaff = async (req, res) => {
  try {
    const { replyBody } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ status: 'fail', message: 'Message not found' });
    }

    // Optional: Check if staff member is authorized to reply (e.g., is assigned to a shipment from this customer)

    await sendEmail({
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `<p>Hello ${message.sender},</p><p>${replyBody}</p><p>Best regards,<br/>${req.user.name}<br/>BongoExpress Team</p>`,
    });

    message.status = 'Replied';
    message.reply = replyBody;
    await message.save();

    res.status(200).json({ status: 'success', message: 'Reply sent successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send reply.' });
  }
};

// @desc    Get payments related to shipments assigned to the staff member
// @route   GET /api/staff-dashboard/payments
// @access  Private/Staff
export const getStaffPayments = async (req, res) => {
  try {
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'All';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 1. Find all shipments assigned to the staff member
    const assignedShipments = await Shipment.find({ staff: req.user._id }).select('_id');
    const shipmentIds = assignedShipments.map(s => s._id);

    // 2. Build query for payments
    const query = { shipment: { $in: shipmentIds } };

    // Add status filter
    if (statusFilter && statusFilter !== 'All') {
      query.status = statusFilter;
    }

    // 3. Find all payments for those shipments with filters
    let payments = await Payment.find(query)
      .populate('customer', 'name phone')
      .populate('shipment', 'shipmentId')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Apply search filter on populated data (search by customer name or payment ID)
    if (search) {
      payments = payments.filter(payment => 
        payment.paymentId?.toLowerCase().includes(search.toLowerCase()) ||
        payment.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        payment.customer?.phone?.includes(search)
      );
    }

    const total = await Payment.countDocuments(query);

    res.status(200).json({ 
      status: 'success', 
      data: { 
        payments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      } 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};