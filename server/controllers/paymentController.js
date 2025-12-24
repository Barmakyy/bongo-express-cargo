import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

// @desc    Get all payments with pagination and search
// @route   GET /api/payments
// @access  Private/Admin
export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'All';

    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const customers = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const customerIds = customers.map(c => c._id);
      query = {
        ...query,
        $or: [
          { paymentId: { $regex: search, $options: 'i' } },
          { customer: { $in: customerIds } },
        ],
      };
    }

    const payments = await Payment.find(query)
      .populate('customer', 'name')
      .populate('shipment', 'shipmentId')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Payment.countDocuments(query);

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
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Generate and download an invoice for a payment
// @route   GET /api/payments/:id/invoice
// @access  Private/Admin
export const generateInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email address phone')
      .populate({
        path: 'shipment',
        select: 'shipmentId origin destination packageDetails customer guestDetails',
        populate: {
          path: 'customer',
          select: 'name email phone'
        }
      });

    if (!payment) {
      return res.status(404).json({ status: 'fail', message: 'Payment not found' });
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
    doc.text(description, 20, itemY, { width: 150 }).text(`KSh ${payment.amount.toLocaleString()}`, 0, itemY, { align: 'right' });
    doc.y += 15; // Add space for the item row
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).strokeColor(lightGray).stroke();
    doc.moveDown(1);

    // --- Total ---
    doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor);
    doc.text('TOTAL', 20, doc.y, { align: 'right' }).text(`KSh ${payment.amount.toLocaleString()}`, 0, doc.y, { align: 'right' });
    doc.moveDown(2.5);

    // --- "PAID" Stamp ---
    if (payment.status === 'Completed') {
      doc.fontSize(16).font('Helvetica-Bold').fillColor(secondaryColor).text('PAID', { align: 'center' });
    }

    // --- Footer ---
    doc.fontSize(8).fillColor(darkGray).text('Thank you for your business!', 20, doc.page.height - 50, { align: 'center', width: doc.page.width - 40 });
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

// @desc    Update a payment (e.g., change status to Completed)
// @route   PATCH /api/payments/:id
// @access  Private/Admin
export const updatePayment = async (req, res) => {
  try {
    const { status, method, transactionId } = req.body;

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        method: method || 'M-Pesa', // Allow admin to set method if completing
        transactionId,
        transactionDate: status === 'Completed' ? new Date() : undefined, // Update date if completed
      },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) return res.status(404).json({ status: 'fail', message: 'Payment not found.' });

    res.status(200).json({ status: 'success', data: { payment: updatedPayment } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Create a new payment
// @route   POST /api/payments
// @access  Private/Admin
export const createPayment = async (req, res) => {
  try {
    const { shipmentId, amount, method, status } = req.body;

    // Find the shipment to link the payment to
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: `Shipment with ID ${shipmentId} not found` });
    }

    const newPayment = await Payment.create({
      shipment: shipment._id,
      customer: shipment.customer, // Get customer from the shipment
      amount: amount || shipment.cost, // Use provided amount or default to shipment cost
      method,
      status: status || 'Completed', // Default to 'Completed' since admin is adding it
    });

    res.status(201).json({ status: 'success', data: { payment: newPayment } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// @desc    Get payment summary statistics
// @route   GET /api/payments/summary
// @access  Private/Admin
export const getPaymentSummary = async (req, res) => {
  try {
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const pendingPaymentsResult = await Payment.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingPayments = pendingPaymentsResult.length > 0 ? pendingPaymentsResult[0].total : 0;

    const completedCount = await Payment.countDocuments({ status: 'Completed' });
    const failedOrRefundedCount = await Payment.countDocuments({ status: { $in: ['Failed', 'Refunded'] } });

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        pendingPayments,
        completedCount,
        failedOrRefundedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get payment data for chart
// @route   GET /api/payments/chart-data
// @access  Private/Admin
export const getPaymentChartData = async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'Completed',
          transactionDate: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const chartData = monthlyRevenue.map(item => ({
      month: `${monthNames[item._id.month - 1]} '${String(item._id.year).slice(2)}`,
      revenue: item.revenue,
    }));

    res.status(200).json({ status: 'success', data: { chartData } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ status: 'fail', message: 'Payment not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};