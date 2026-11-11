/**
 * FinPilot AI - AI Query / Message History Model
 * Stores prompt, structured financial intent, response, and telemetry
 */
const mongoose = require('mongoose');

const aiQuerySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AISession',
      required: [true, 'Session ID is required for AI queries'],
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    queryText: {
      type: String,
      required: [true, 'Query text is required'],
      trim: true,
      maxlength: [2000, 'Query text cannot exceed 2000 characters'],
    },
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      default: 'user',
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
    responseText: {
      type: String,
      required: [true, 'Response text is required'],
    },
    responseData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isCard: {
      type: Boolean,
      default: false,
    },
    isMockResponse: {
      type: Boolean,
      default: false,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    queriedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast retrieval of session messages in chronological order
aiQuerySchema.index({ sessionId: 1, queriedAt: 1 });

module.exports = mongoose.model('AIQuery', aiQuerySchema);

