/**
 * FinPilot AI - PaymentAllocation Model
 */
const mongoose = require('mongoose');

const paymentAllocationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentAllocation', paymentAllocationSchema);

