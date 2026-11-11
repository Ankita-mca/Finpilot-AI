/**
 * FinPilot AI - BankTransaction Model
 */
const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['Credit', 'Debit'],
      default: 'Credit',
    },
    utr: {
      type: String,
      trim: true,
      default: '',
    },
    reconciled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);

