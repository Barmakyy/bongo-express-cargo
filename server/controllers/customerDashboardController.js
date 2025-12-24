import Shipment from '../models/Shipment.js';
import mongoose from 'mongoose'; // Import mongoose for Types.ObjectId
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

// @desc    Get customer dashboard stats
// @route   GET /api/customer-dashboard/stats
// @access  Private/Customer
export const getCustomerStats = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Run queries in parallel for better performance
    const [metricsResult, recentShipments] = await Promise.all([
      // Combined metrics query
      Shipment.aggregate([
        { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            delivered: [
              { $match: { status: 'Delivered' } },
              { $count: 'count' }
            ],
            pending: [
              { $match: { status: { $in: ['Pending', 'In Transit', 'Delayed'] } } },
              { $count: 'count' }
            ]
          }
        }
      ]),
      
      // Recent shipments
      Shipment.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('shipmentId destination status dispatchDate')
        .lean()
    ]);

    const totalShipments = metricsResult[0]?.total[0]?.count || 0;
    const deliveredShipments = metricsResult[0]?.delivered[0]?.count || 0;
    const pendingShipments = metricsResult[0]?.pending[0]?.count || 0;

    res.status(200).json({
      status: 'success',
      data: {
        metrics: { totalShipments, deliveredShipments, pendingShipments },
        recentShipments,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch customer dashboard stats.', error: error.message });
  }
};

// @desc    Get all shipments for the logged-in customer
// @route   GET /api/customer-dashboard/shipments
// @access  Private/Customer
export const getCustomerShipments = async (req, res) => {
  try {
    const customerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'All';

    const query = { customer: customerId };

    if (search) {
      query.shipmentId = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const shipments = await Shipment.find(query)
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
    res.status(500).json({ status: 'error', message: 'Failed to fetch customer shipments.', error: error.message });
  }
};

// @desc    Create a new shipment for the logged-in customer
// @route   POST /api/customer-dashboard/shipments
// @access  Private/Customer
export const createCustomerShipment = async (req, res) => {
  try {
    const { origin, destination, weight, packageDetails } = req.body;

    console.log('Attempting to create new shipment for customer:', req.user.id);
    const newShipment = await Shipment.create({
      customer: req.user.id,
      origin,
      destination,
      weight,
      packageDetails,
      status: 'Pending', // Shipments created by customers start as Pending
      cost: Math.max(20, weight * 5), // Dummy cost calculation
      dispatchDate: new Date(), // Ensure dispatchDate is set
      // Add initial tracking history entry
      trackingHistory: [
        {
          status: 'Pending',
          location: origin,
          timestamp: new Date(),
        },
      ],
    });

    console.log('Shipment created:', newShipment.shipmentId);
    await Payment.create({
      paymentId: `INV-${newShipment.shipmentId}`, // Generate a simple invoice ID
      customer: req.user.id,
      shipment: newShipment._id,
      amount: newShipment.cost,
      method: 'M-Pesa', // Default method for customer-initiated pending payments
      status: 'Pending',
      transactionDate: new Date(),
    });
    console.log('Pending payment created for shipment:', newShipment.shipmentId);
    // --- End payment creation ---

    // --- Create a notification for all admins ---
    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map(admin =>
      Notification.create({
        user: admin._id,
        text: `New shipment (${newShipment.shipmentId}) booked by ${req.user.name}.`,
        link: '/admin/dashboard/shipments',
      })
    );
    await Promise.all(notificationPromises);
    // --- End notification creation ---

    res.status(201).json({ status: 'success', data: { shipment: newShipment } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Get a single shipment for the logged-in customer
// @route   GET /api/customer-dashboard/shipments/:id
// @access  Private/Customer
export const getCustomerShipmentDetails = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      customer: req.user.id,
    }).populate('customer', 'name email');

    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: 'Shipment not found or you do not have permission to view it.' });
    }

    res.status(200).json({
      status: 'success',
      data: { shipment },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch shipment details.', error: error.message });
  }
};

// @desc    Get payment summary for the logged-in customer
// @route   GET /api/customer-dashboard/payments/summary
// @access  Private/Customer
export const getCustomerPaymentSummary = async (req, res) => {
  try {
    const customerId = req.user.id;

    const pendingResult = await Payment.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const paidResult = await Payment.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const completedCount = await Payment.countDocuments({ customer: customerId, status: 'Completed' });
    const totalInvoices = await Payment.countDocuments({ customer: customerId });

    res.status(200).json({
      status: 'success',
      data: {
        pendingAmount: pendingResult[0]?.total || 0,
        totalAmountPaid: paidResult[0]?.total || 0,
        completedPayments: completedCount,
        invoicesGenerated: totalInvoices,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch payment summary.', error: error.message });
  }
};

// @desc    Get payment history for the logged-in customer
// @route   GET /api/customer-dashboard/payments
// @access  Private/Customer
export const getCustomerPaymentHistory = async (req, res) => {
  try {
    const customerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log('Fetching payment history for customer:', customerId);
    const payments = await Payment.find({ customer: customerId })
      .populate('shipment', 'origin destination')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments({ customer: customerId });

    console.log('Found payments:', payments.length, 'Total:', total);
    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch payment history.', error: error.message });
  }
};

// @desc    Generate and download an invoice for a customer's payment
// @route   GET /api/customer-dashboard/payments/:id/invoice
// @access  Private/Customer
export const generateCustomerInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, customer: req.user.id })
      .populate('customer', 'name email address phone')
      .populate('shipment', 'shipmentId origin destination');

    if (!payment) {
      return res.status(404).json({ status: 'fail', message: 'Payment not found or you do not have permission to view it.' });
    }

    const doc = new PDFDocument({ size: [240, 500], margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.paymentId}.pdf`);

    doc.pipe(res);

    // --- PDF Styling ---
    const primaryColor = '#0B1D3A';
    const secondaryColor = '#FBBF24';
    const lightGray = '#E5E7EB';
    const darkGray = '#4B5563';

    // --- Header ---
    doc.font('Helvetica-Bold').fontSize(18).fillColor(primaryColor).text('BongoExpress', { align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(darkGray).text('Minhaj Tower, Carlifonia Kamkunji, Nairobi', { align: 'center' });
    doc.moveDown(2);

    // --- Title & Details ---
    doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor).text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(1.5);
    doc.font('Helvetica').fontSize(9).fillColor(darkGray);
    doc.text(`Receipt ID: ${payment.paymentId}`);
    doc.text(`Date: ${format(new Date(payment.transactionDate), 'MMM dd, yyyy')}`);
    doc.text(`Method: ${payment.method}`);
    doc.moveDown(1.5);

    // --- Billed To ---
    doc.font('Helvetica-Bold').fontSize(9).fillColor(darkGray).text(payment.customer.name);
    doc.font('Helvetica').text(payment.customer.email || 'N/A');
    doc.moveDown(1.5);

    // --- Items Table ---
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Description', 20, tableTop).text('Amount', 0, tableTop, { align: 'right' });
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).strokeColor(lightGray).stroke();
    doc.moveDown(0.5);
    const itemY = doc.y;
    doc.font('Helvetica').fontSize(9);
    doc.text(`Shipment (${payment.shipment.shipmentId})`, 20, itemY, { width: 150 }).text(`KSh ${payment.amount.toLocaleString()}`, 0, itemY, { align: 'right' });
    doc.y += 15;
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).strokeColor(lightGray).stroke();
    doc.moveDown(1);

    // --- Total & Status ---
    doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor).text(`TOTAL: KSh ${payment.amount.toLocaleString()}`, { align: 'right' });
    doc.moveDown(2.5);
    if (payment.status === 'Completed') doc.fontSize(16).font('Helvetica-Bold').fillColor(secondaryColor).text('PAID', { align: 'center' });
    
    // --- Footer ---
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(8).fillColor(darkGray).text('Thank you for choosing BongoExpress!', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(7).text('Contact us: +254712274897 | support@bongoexpress.com', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    // Only send JSON error if response hasn't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: 'Failed to generate invoice.', error: error.message });
    }
  }
};

// @desc    Process a payment for a pending invoice
// @route   POST /api/customer-dashboard/payments/:id/pay
// @access  Private/Customer
export const processCustomerPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, customer: req.user.id, status: 'Pending' });

    if (!payment) {
      return res.status(404).json({ status: 'fail', message: 'Pending payment not found or you do not have permission.' });
    }

    // In a real app, you would integrate with a payment gateway here.
    // For this simulation, we'll just mark it as completed.
    payment.status = 'Completed';
    payment.method = 'M-Pesa'; // Assume M-Pesa for online payments
    payment.transactionId = `MPESA_${Date.now()}`;
    payment.transactionDate = new Date();

    await payment.save();

    res.status(200).json({ status: 'success', data: { payment } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to process payment.', error: error.message });
  }
};

// @desc    Get all messages for the logged-in customer
// @route   GET /api/customer-dashboard/messages
// @access  Private/Customer
export const getCustomerMessages = async (req, res) => {
  try {
    const customerId = req.user.id;
    const messages = await Message.find({ user: customerId }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: {
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch messages.', error: error.message });
  }
};

// @desc    Create a new message from a customer
// @route   POST /api/customer-dashboard/messages
// @access  Private/Customer
export const createCustomerMessage = async (req, res) => {
  try {
    const { subject, body } = req.body;
    const newMessage = await Message.create({
      sender: req.user.name,
      email: req.user.email,
      user: req.user.id, // Use 'user' to match the Message model schema
      subject,
      body,
      status: 'Unread', // New messages from customers are 'Unread' for admins
    });
    res.status(201).json({ status: 'success', data: { message: newMessage } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Delete a message for the logged-in customer
// @route   DELETE /api/customer-dashboard/messages/:id
// @access  Private/Customer
export const deleteCustomerMessage = async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, user: req.user.id });

    if (!message) {
      return res.status(404).json({ status: 'fail', message: 'Message not found or you do not have permission to delete it.' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};