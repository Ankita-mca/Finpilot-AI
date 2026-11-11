/**
 * FinPilot AI - Invoice Model
 * Multi-tenant Indian GST tax invoice entity isolated by organizationId
 */
const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    gstRate: {
      type: Number,
      default: 18,
      min: [0, 'GST rate cannot be negative'],
      max: [100, 'GST rate cannot exceed 100%'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required for tenant isolation'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'customerId is required'],
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    customerGstin: {
      type: String,
      trim: true,
      default: '',
    },
    customerAddress: {
      type: String,
      trim: true,
      default: '',
    },
    invoiceNumber: {
      type: String,
      required: [true, 'invoiceNumber is required'],
      trim: true,
      uppercase: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'dueDate is required'],
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Invoice must contain at least one line item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalGstAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // Backwards-compatible alias for grandTotal used in AI queries
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'paidAmount cannot be negative'],
    },
    outstandingAmount: {
      type: Number,
      default: 0,
      min: [0, 'outstandingAmount cannot be negative'],
    },
    // Backwards-compatible alias for outstandingAmount used in AI queries
    balanceDue: {
      type: Number,
      default: 0,
      min: [0, 'balanceDue cannot be negative'],
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'Net 30 Days (Standard Corporate)',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
        message: 'status must be Draft, Pending, Partially Paid, Paid, Overdue, or Cancelled',
      },
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Keep aliases synchronized on validation
invoiceSchema.pre('validate', function (next) {
  if (this.grandTotal !== undefined) {
    this.amount = this.grandTotal;
  } else if (this.amount !== undefined) {
    this.grandTotal = this.amount;
  }

  if (this.outstandingAmount !== undefined) {
    this.balanceDue = this.outstandingAmount;
  } else if (this.balanceDue !== undefined) {
    this.outstandingAmount = this.balanceDue;
  }

  if (this.invoiceDate) {
    this.issueDate = this.invoiceDate;
  } else if (this.issueDate) {
    this.invoiceDate = this.issueDate;
  }
  next();
});

// Compound Indexes for Multi-Tenant Isolation & Search Performance
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organizationId: 1, customerId: 1 });
invoiceSchema.index({ organizationId: 1, dueDate: 1 });
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
