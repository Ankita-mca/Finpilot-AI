/**
 * FinPilot AI - AI Chat Message Model
 * Stores individual user messages and assistant replies
 */
const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AISession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: [true, 'Sender role is required (user/assistant)'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [4000, 'Content cannot exceed 4000 characters'],
    },
    intent: {
      type: String,
      enum: [
        'receivables_inquiry',
        'receivables_summary',
        'customer_ledger',
        'customer_details',
        'customer_balance',
        'customer_payment_history',
        'customer_not_found',
        'customer_directory_list',
        'overdue_summary',
        'overdue_invoices',
        'invoices_due_soon',
        'partially_paid_invoices',
        'fully_paid_invoices',
        'last_payment_received',
        'recent_payments',
        'unpaid_30_days',
        'dso_analysis',
        'gst_reconciliation',
        'general_financial_query',
        'unknown',
      ],
      default: 'general_financial_query',
    },
    isCard: {
      type: Boolean,
      default: false,
    },
    cardData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isMockResponse: {
      type: Boolean,
      default: false,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

aiMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('AIMessage', aiMessageSchema);

