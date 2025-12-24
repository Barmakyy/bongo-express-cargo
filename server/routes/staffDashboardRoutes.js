import express from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  getStaffStats,
  getStaffShipments,
  getStaffShipmentById,
  updateShipmentByStaff,
  getStaffMessages,
  replyToMessageByStaff,
  getStaffPayments,
  createShipmentByStaff,
  updateShipmentCost,
  generateStaffInvoice,
} from '../controllers/staffDashboardController.js';

const router = express.Router();

router.use(protect, restrictTo('staff', 'admin')); // Allow both staff and admins

router.get('/stats', getStaffStats);
router.route('/shipments').get(getStaffShipments).post(createShipmentByStaff);
router.get('/shipments/:id', getStaffShipmentById);
router.patch('/shipments/:id', updateShipmentByStaff);
router.patch('/shipments/:id/cost', updateShipmentCost);
router.get('/messages', getStaffMessages);
router.post('/messages/:id/reply', replyToMessageByStaff);
router.get('/payments', getStaffPayments);
router.get('/payments/:id/invoice', generateStaffInvoice);

export default router;