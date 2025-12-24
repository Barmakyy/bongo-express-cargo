import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Not required since we can have guest shipments without customer accounts
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ['M-Pesa', 'Cash', 'Card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentId) {
    this.paymentId = `PAY-${nanoid()}`;
  }
  next();
});

// Add indexes for faster queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ shipment: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;