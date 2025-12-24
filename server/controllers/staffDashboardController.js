import Shipment from '../models/Shipment.js';
import Message from '../models/Message.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { startOfDay, endOfDay, format } from 'date-fns';
import sendEmail from '../utils/email.js';
import PDFDocument from 'pdfkit';

// @desc    Get staff dashboard stats (overview)
// @route   GET /api/staff-dashboard/stats
// @access  Private/Staff
export const getStaffStats = async (req, res) => {
  try {
    const staffId = req.user._id;
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Run queries in parallel for better performance
    const [metricsResult, priorityShipments] = await Promise.all([
      // Combined metrics query
      Shipment.aggregate([
        { $match: { staff: staffId } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            pending: [
              { $match: { status: { $in: ['Pending', 'In Transit'] } } },
              { $count: 'count' }
            ],
            completedToday: [
              {
                $match: {
                  status: 'Delivered',
                  'trackingHistory': {
                    $elemMatch: {
                      status: 'Delivered',
                      timestamp: { $gte: todayStart, $lte: todayEnd }
                    }
                  }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),
      
      // Priority shipments
      Shipment.find({
        staff: staffId,
        status: { $in: ['Pending', 'In Transit'] },
      })
      .populate('customer', 'name phone')
      .sort({ estimatedDelivery: 1 })
      .limit(5)
      .lean()
    ]);

    const assignedShipments = metricsResult[0]?.total[0]?.count || 0;
    const pendingDeliveries = metricsResult[0]?.pending[0]?.count || 0;
    const completedToday = metricsResult[0]?.completedToday[0]?.count || 0;

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
    const { 
      customerName, 
      customerPhone, 
      origin,
      destination,
      packageDetails,
      weight,
      cost,
      paymentMethod,
      paymentStatus 
    } = req.body;
    const staff = req.user; // The logged-in staff member

    // Validate required fields
    if (!customerPhone || !customerName || !origin || !destination || !cost) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide customer phone, name, origin, destination, and cost',
      });
    }

    // Validate cost is a positive number
    if (isNaN(cost) || parseFloat(cost) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cost must be a positive number',
      });
    }

    // Try to find existing customer by phone
    let customer = await User.findOne({ phone: customerPhone, role: 'customer' });

    let shipmentData = {
      origin,
      destination,
      packageDetails,
      weight: weight || 0,
      staff: staff._id,
      createdBy: staff._id,
      branch: staff.branch,
      status: 'Pending',
      cost: parseFloat(cost), // Use manual cost entry
      dispatchDate: new Date(),
      trackingHistory: [
        {
          status: 'Pending',
          location: origin,
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

    // Create payment record with manual cost
    const paymentData = {
      shipment: newShipment._id,
      amount: parseFloat(cost),
      method: paymentMethod || 'Cash',
      status: paymentStatus || 'Pending',
    };

    // Only add customer if it exists
    if (customer) {
      paymentData.customer = customer._id;
    }

    const payment = await Payment.create(paymentData);

    // Send notification if customer exists
    if (customer) {
      await Notification.create({
        user: customer._id,
        text: `Your shipment ${newShipment.shipmentId} from ${origin} to ${destination} has been created. Cost: KSh ${cost}`,
        link: `/customer/dashboard/shipments`,
      });
    }

    res.status(201).json({ 
      status: 'success', 
      data: { 
        shipment: newShipment,
        payment,
        message: 'Shipment and payment record created successfully' 
      } 
    });
  } catch (error) {
    console.error('Error creating shipment by staff:', error);
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Update shipment cost
// @route   PATCH /api/staff-dashboard/shipments/:id/cost
// @access  Private/Staff
export const updateShipmentCost = async (req, res) => {
  try {
    const { cost } = req.body;

    if (!cost || isNaN(cost) || parseFloat(cost) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid cost',
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Shipment not found',
      });
    }

    // Update shipment cost
    shipment.cost = parseFloat(cost);
    await shipment.save();

    // Update related payment amount
    await Payment.findOneAndUpdate(
      { shipment: shipment._id },
      { amount: parseFloat(cost) },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: { shipment },
      message: 'Shipment cost updated successfully',
    });
  } catch (error) {
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

// @desc    Generate payment invoice PDF for staff
// @route   GET /api/staff-dashboard/payments/:id/invoice
// @access  Private/Staff
export const generateStaffInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email address phone')
      .populate({
        path: 'shipment',
        select: 'shipmentId origin destination packageDetails customer guestDetails staff',
        populate: {
          path: 'customer',
          select: 'name email phone'
        }
      });

    if (!payment) {
      return res.status(404).json({ status: 'fail', message: 'Payment not found' });
    }

    // Verify that this payment belongs to a shipment handled by this staff member
    if (payment.shipment.staff.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'You can only download receipts for your own shipments' });
    }

    // Get customer info from payment or shipment
    const customerInfo = payment.customer || payment.shipment?.customer || null;
    const guestInfo = payment.shipment?.guestDetails || null;

    const doc = new PDFDocument({ size: [240, 500], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.paymentId}.pdf`);

    doc.pipe(res);

    // --- Helper Functions ---
    const primaryColor = '#0B1D3A';
    const secondaryColor = '#FBBF24';
    const lightGray = '#E5E7EB';
    const darkGray = '#4B5563';

    const drawSection = (title, contentFn) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text(title);
      doc.moveDown(0.5);
      doc.save();
      contentFn();
      doc.restore();
      doc.moveDown(1.5);
    };

    // --- Header ---
    doc.font('Helvetica-Bold').fontSize(18).fillColor(primaryColor).text('BongoExpress', { align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(darkGray).text('Minhaj Tower, Carlifonia Kamkunji, Nairobi', { align: 'center' });
    doc.moveDown(2);

    // --- Title ---
    doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor).text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(2);

    // --- Payment Details ---
    drawSection('Payment Details', () => {
      doc.font('Helvetica').fontSize(9).fillColor(darkGray);
      doc.text(`Receipt ID: ${payment.paymentId}`);
      doc.text(`Date: ${format(new Date(payment.transactionDate), 'MMM dd, yyyy, h:mm a')}`);
      doc.text(`Method: ${payment.method}`);
    });

    // --- Billed To ---
    drawSection('Billed To', () => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkGray);
      if (customerInfo) {
        doc.text(customerInfo.name);
        doc.font('Helvetica').text(customerInfo.email || 'N/A');
        doc.text(customerInfo.phone || 'N/A');
      } else if (guestInfo) {
        doc.text(guestInfo.name || 'Guest Customer');
        doc.font('Helvetica').text('N/A');
        doc.text(guestInfo.phone || 'N/A');
      } else {
        doc.text('Guest Customer');
        doc.font('Helvetica').text('N/A');
      }
    });

    // --- Items Table ---
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Description', 20, tableTop).text('Amount', 0, tableTop, { align: 'right' });
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).strokeColor(lightGray).stroke();
    doc.moveDown(0.5);

    const itemY = doc.y;
    doc.font('Helvetica').fontSize(9);
    const description = `Shipment Fee (${payment.shipment.shipmentId})`;
    doc.text(description, 20, itemY, { width: 130 });
    doc.text(`KSh ${payment.amount.toLocaleString()}`, 0, itemY, { align: 'right' });
    doc.moveDown(1);

    // --- Total ---
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).strokeColor(lightGray).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Total', 20, doc.y).text(`KSh ${payment.amount.toLocaleString()}`, 0, doc.y, { align: 'right' });
    doc.moveDown(2);

    // --- Footer ---
    doc.font('Helvetica').fontSize(8).fillColor(darkGray).text('Thank you for choosing BongoExpress!', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(7).text('Contact us: +254712274897 | support@bongoexpress.com', { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};