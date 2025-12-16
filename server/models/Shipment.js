import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // No longer required, as guest details can be used instead
    },
    guestDetails: {
      name: String,
      phone: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    staff: { // The staff member assigned to handle the shipment
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branch: {
      type: String,
      // This is not strictly required for all shipments (e.g., guest bookings)
      // but is set when a staff member creates one.
      // required: [true, 'A shipment must be associated with a branch.'],
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'],
      default: 'Pending',
    },
    dispatchDate: {
      type: Date,
      default: Date.now,
    },
    estimatedDelivery: {
      type: Date,
    },
    weight: {
      type: Number,
    },
    packageDetails: {
      type: String,
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
    },
    trackingHistory: [
      {
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

shipmentSchema.pre('save', async function (next) {
  if (this.isNew && !this.shipmentId) {
    this.shipmentId = `SHP${nanoid()}`;
  }
  next();
});

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;