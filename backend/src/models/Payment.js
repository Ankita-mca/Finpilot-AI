/**
 * FinPilot AI - Payment Model
 */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    paymentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      default: 'NEFT',
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Failed'],
      default: 'Completed',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ organizationId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

