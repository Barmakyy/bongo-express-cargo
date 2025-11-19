import Shipment from '../models/Shipment.js';

// @desc    Get shipment details by tracking ID
// @route   GET /api/track/:trackingId
// @access  Public
export const getShipmentByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;
    // Use case-insensitive search for the tracking ID
    const shipment = await Shipment.findOne({ shipmentId: { $regex: `^${trackingId}$`, $options: 'i' } }).populate('customer', 'name');

    if (!shipment) {
      return res.status(404).json({ status: 'fail', message: 'Shipment not found with that tracking ID.' });
    }

    res.status(200).json({ status: 'success', data: { shipment } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error while fetching shipment details.', error: error.message });
  }
};