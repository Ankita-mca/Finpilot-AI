/**
 * FinPilot AI - Reminder Model
 */
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
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
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    channel: {
      type: String,
      enum: ['WhatsApp', 'Email', 'SMS'],
      default: 'WhatsApp',
    },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending',
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);

