/**
 * FinPilot AI - Customer Model
 * Multi-tenant customer/debtor entity isolated by organizationId
 */
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required for tenant isolation'],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'customerName is required'],
      trim: true,
      maxlength: [200, 'customerName cannot exceed 200 characters'],
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'companyName cannot exceed 200 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow null or empty for unregistered customers
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'phone cannot exceed 20 characters'],
    },
    address: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
      pincode: { type: String, trim: true, default: '' },
    },
    GSTIN: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow null or empty for unregistered customers
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Please provide a valid 15-character Indian GSTIN format',
      },
    },
    customerType: {
      type: String,
      enum: {
        values: ['Individual', 'Business'],
        message: 'customerType must be either Individual or Business',
      },
      default: 'Business',
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Inactive'],
        message: 'status must be either Active or Inactive',
      },
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for Multi-Tenant Isolation & Uniqueness:
// Prevent duplicate GSTIN within the same organization only when GSTIN is provided
customerSchema.index(
  { organizationId: 1, GSTIN: 1 },
  { unique: true, partialFilterExpression: { GSTIN: { $type: 'string' } } }
);

// Prevent duplicate email within the same organization only when email is provided
customerSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

// Fast search by organization and name
customerSchema.index({ organizationId: 1, customerName: 1 });
customerSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Customer', customerSchema);

