import express from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffSummary,
  getStaffList,
} from '../controllers/staffController.js';
import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.route('/').get(getStaff).post(createStaff);
router.route('/:id').put(updateStaff).delete(deleteStaff);
router.get('/summary', getStaffSummary);
router.get('/list', getStaffList);

export default router;