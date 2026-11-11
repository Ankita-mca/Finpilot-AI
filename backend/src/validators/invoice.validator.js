/**
 * FinPilot AI - Invoice Request Validators & Financial Calculation Engine
 */
const mongoose = require('mongoose');
const { extractOrgId } = require('./customer.validator');
const { errorResponse } = require('../utils/response');

/**
 * Utility to round monetary values strictly to 2 decimal places (paise precision)
 * avoiding JavaScript floating-point errors
 */
const roundCurrency = (val) => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Middleware: Enforces valid organizationId context
 */
const requireOrganizationId = (req, res, next) => {
  const orgId = extractOrgId(req);

  if (!orgId) {
    return errorResponse(
      res,
      'Organization context is required. Pass via authenticated token or x-organization-id header.',
      401
    );
  }

  if (!mongoose.Types.ObjectId.isValid(orgId)) {
    return errorResponse(res, 'organizationId must be a valid 24-character MongoDB ObjectId.', 400);
  }

  req.organizationId = orgId;
  next();
};

/**
 * Middleware: Validates :id parameter as a valid MongoDB ObjectId
 */
const validateInvoiceId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 'Invalid invoice ID parameter. Must be a valid 24-character ObjectId.', 400);
  }
  next();
};

/**
 * Middleware: Validates payload for creating a new invoice
 */
const validateCreateInvoice = (req, res, next) => {
  const orgId = extractOrgId(req);

  if (!orgId) {
    return errorResponse(res, 'organizationId is required for tenant isolation.', 401);
  }
  if (!mongoose.Types.ObjectId.isValid(orgId)) {
    return errorResponse(res, 'organizationId must be a valid 24-character ObjectId.', 400);
  }
  req.organizationId = orgId;

  const {
    customerId,
    invoiceNumber,
    invoiceDate,
    dueDate,
    items,
    paymentTerms,
    notes,
    status,
  } = req.body;

  const errors = {};

  // 1. Customer ID validation
  if (!customerId) {
    errors.customerId = 'customerId is required';
  } else if (!mongoose.Types.ObjectId.isValid(customerId)) {
    errors.customerId = 'customerId must be a valid 24-character MongoDB ObjectId';
  }

  // 2. Dates validation
  const parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
  if (isNaN(parsedInvoiceDate.getTime())) {
    errors.invoiceDate = 'invoiceDate must be a valid date';
  }

  if (!dueDate) {
    errors.dueDate = 'dueDate is required';
  } else {
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      errors.dueDate = 'dueDate must be a valid date';
    }
  }

  // 3. Line items validation & calculation
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.items = 'At least one invoice line item is required';
  } else {
    const itemErrors = [];
    const sanitizedItems = [];
    let calculatedSubtotal = 0;
    let calculatedGst = 0;

    items.forEach((item, index) => {
      const err = {};
      const desc = (item.description || '').trim();
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;

      if (!desc) {
        err.description = 'Description is required';
      }
      if (isNaN(qty) || qty <= 0) {
        err.quantity = 'Quantity must be a positive number';
      }
      if (isNaN(unitPrice) || unitPrice < 0) {
        err.unitPrice = 'Unit price must be a non-negative number';
      }
      if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
        err.gstRate = 'GST rate must be between 0% and 100%';
      }

      if (Object.keys(err).length > 0) {
        itemErrors.push({ index, errors: err });
      } else {
        const itemSubtotal = roundCurrency(qty * unitPrice);
        const itemGst = roundCurrency(itemSubtotal * (gstRate / 100));
        const itemGrand = roundCurrency(itemSubtotal + itemGst);

        calculatedSubtotal = roundCurrency(calculatedSubtotal + itemSubtotal);
        calculatedGst = roundCurrency(calculatedGst + itemGst);

        sanitizedItems.push({
          description: desc,
          quantity: qty,
          unitPrice: roundCurrency(unitPrice),
          gstRate,
          subtotal: itemSubtotal,
          gstAmount: itemGst,
          grandTotal: itemGrand,
        });
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    } else {
      req.sanitizedItems = sanitizedItems;
      req.calculatedFinancials = {
        subtotal: calculatedSubtotal,
        totalGstAmount: calculatedGst,
        grandTotal: roundCurrency(calculatedSubtotal + calculatedGst),
      };
    }
  }

  // 4. Status validation
  const validStatuses = ['Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    errors.status = `status must be one of: ${validStatuses.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 'Validation failed for invoice creation', 400, errors);
  }

  next();
};

/**
 * Middleware: Validates payload for updating an existing invoice
 */
const validateUpdateInvoice = (req, res, next) => {
  const orgId = extractOrgId(req);
  if (!orgId) {
    return errorResponse(res, 'organizationId is required.', 401);
  }
  req.organizationId = orgId;

  const { items, invoiceDate, dueDate, status, customerId } = req.body;
  const errors = {};

  if (customerId && !mongoose.Types.ObjectId.isValid(customerId)) {
    errors.customerId = 'customerId must be a valid 24-character ObjectId';
  }

  if (invoiceDate) {
    const d = new Date(invoiceDate);
    if (isNaN(d.getTime())) errors.invoiceDate = 'invoiceDate must be a valid date';
  }

  if (dueDate) {
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) errors.dueDate = 'dueDate must be a valid date';
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      errors.items = 'Invoice must contain at least one line item';
    } else {
      const sanitizedItems = [];
      let calculatedSubtotal = 0;
      let calculatedGst = 0;

      items.forEach((item, index) => {
        const desc = (item.description || '').trim();
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : 18;

        if (!desc || isNaN(qty) || qty <= 0 || isNaN(unitPrice) || unitPrice < 0) {
          errors[`items[${index}]`] = 'Invalid item line values';
        } else {
          const itemSubtotal = roundCurrency(qty * unitPrice);
          const itemGst = roundCurrency(itemSubtotal * (gstRate / 100));
          const itemGrand = roundCurrency(itemSubtotal + itemGst);

          calculatedSubtotal = roundCurrency(calculatedSubtotal + itemSubtotal);
          calculatedGst = roundCurrency(calculatedGst + itemGst);

          sanitizedItems.push({
            description: desc,
            quantity: qty,
            unitPrice: roundCurrency(unitPrice),
            gstRate,
            subtotal: itemSubtotal,
            gstAmount: itemGst,
            grandTotal: itemGrand,
          });
        }
      });

      if (!errors.items && Object.keys(errors).length === 0) {
        req.sanitizedItems = sanitizedItems;
        req.calculatedFinancials = {
          subtotal: calculatedSubtotal,
          totalGstAmount: calculatedGst,
          grandTotal: roundCurrency(calculatedSubtotal + calculatedGst),
        };
      }
    }
  }

  const validStatuses = ['Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    errors.status = `status must be one of: ${validStatuses.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 'Validation failed for invoice update', 400, errors);
  }

  next();
};

module.exports = {
  roundCurrency,
  requireOrganizationId,
  validateInvoiceId,
  validateCreateInvoice,
  validateUpdateInvoice,
  extractOrgId,
};

