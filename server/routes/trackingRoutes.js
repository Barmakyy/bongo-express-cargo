import express from 'express';
import { getShipmentByTrackingId } from '../controllers/trackingController.js';

const router = express.Router();

router.get('/:trackingId', getShipmentByTrackingId);

export default router;