import express from 'express';
import { getPayments, getPaymentSummary, getPaymentChartData, createPayment, generateInvoice, updatePayment, deletePayment } from '../controllers/paymentController.js';
import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.patch('/:id', updatePayment);
router.delete('/:id', deletePayment);

router.get('/summary', getPaymentSummary);
router.get('/chart-data', getPaymentChartData);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.get('/:id/invoice', generateInvoice);

export default router;