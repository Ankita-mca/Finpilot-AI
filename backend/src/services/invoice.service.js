/**
 * FinPilot AI - Invoice Business Logic & Service Layer
 * Multi-tenant safe CRUD operations with financial accuracy and tenant isolation
 */
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { roundCurrency } = require('../validators/invoice.validator');

/**
 * Generate the next unique sequential invoice number for an organization
 * Format: INV-YYYY-0001
 */
const getNextInvoiceNumber = async (orgId) => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  // Find highest invoice number for this year and organization
  const latestInvoice = await Invoice.findOne({
    organizationId: orgId,
    invoiceNumber: new RegExp(`^${prefix}\\d+`, 'i'),
  })
    .sort({ createdAt: -1 })
    .lean();

  let nextSequence = 1001;
  if (latestInvoice && latestInvoice.invoiceNumber) {
    const parts = latestInvoice.invoiceNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  // Ensure uniqueness by checking existence
  let candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
  let exists = await Invoice.findOne({ organizationId: orgId, invoiceNumber: candidate }).lean();

  while (exists) {
    nextSequence += 1;
    candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    exists = await Invoice.findOne({ organizationId: orgId, invoiceNumber: candidate }).lean();
  }

  return candidate;
};

/**
 * Create a new GST Tax Invoice
 */
const createInvoice = async (orgId, invoiceData, sanitizedItems, calculatedFinancials) => {
  // 1. Verify customer exists and belongs to the authenticated organization
  const customer = await Customer.findOne({
    _id: invoiceData.customerId,
    organizationId: orgId,
  });

  if (!customer) {
    const error = new Error('Selected customer does not exist in your organization.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Generate or sanitize invoice number
  let invoiceNumber = (invoiceData.invoiceNumber || '').trim().toUpperCase();
  if (!invoiceNumber || invoiceNumber === 'AUTO' || invoiceNumber === 'NEW') {
    invoiceNumber = await getNextInvoiceNumber(orgId);
  }

  // 3. Check for uniqueness within tenant
  const existing = await Invoice.findOne({
    organizationId: orgId,
    invoiceNumber,
  });

  if (existing) {
    const error = new Error(`Invoice number "${invoiceNumber}" already exists in your organization.`);
    error.statusCode = 409;
    throw error;
  }

  // 4. Format customer address string for document snapshot
  const addr = customer.address || {};
  const formattedAddress = [addr.city, addr.state, addr.country, addr.pincode]
    .filter(Boolean)
    .join(', ');

  // 5. Determine initial status
  let initialStatus = invoiceData.status || 'Pending';
  const dueDate = new Date(invoiceData.dueDate);
  if (initialStatus === 'Pending' && dueDate < new Date()) {
    initialStatus = 'Overdue';
  }

  // 6. Build document with accurate decimals
  const invoice = new Invoice({
    organizationId: orgId,
    customerId: customer._id,
    customerName: customer.customerName || customer.companyName,
    customerGstin: customer.GSTIN || 'UNREGISTERED',
    customerAddress: formattedAddress,
    invoiceNumber,
    invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
    issueDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
    dueDate,
    items: sanitizedItems,
    subtotal: calculatedFinancials.subtotal,
    totalGstAmount: calculatedFinancials.totalGstAmount,
    grandTotal: calculatedFinancials.grandTotal,
    amount: calculatedFinancials.grandTotal,
    paidAmount: 0,
    outstandingAmount: calculatedFinancials.grandTotal,
    balanceDue: calculatedFinancials.grandTotal,
    paymentTerms: invoiceData.paymentTerms || 'Net 30 Days (Standard Corporate)',
    notes: (invoiceData.notes || '').trim(),
    status: initialStatus,
  });

  return await invoice.save();
};

/**
 * Get all invoices for an organization with live query, search, filtering & pagination
 */
const getInvoices = async (orgId, queryParams = {}) => {
  const {
    search,
    status,
    customerId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const filter = { organizationId: orgId };

  // Status Filter
  if (status && status !== 'all') {
    const norm = status.toLowerCase().replace(/[\s_-]+/g, '');
    if (norm === 'paid') filter.status = 'Paid';
    else if (norm === 'pending') filter.status = 'Pending';
    else if (norm === 'partiallypaid') filter.status = 'Partially Paid';
    else if (norm === 'overdue') filter.status = 'Overdue';
    else if (norm === 'draft' || norm === 'drafts') filter.status = 'Draft';
    else if (norm === 'cancelled') filter.status = 'Cancelled';
  }

  // Customer Filter
  if (customerId) {
    filter.customerId = customerId;
  }

  // Date Range Filter
  if (startDate || endDate) {
    filter.invoiceDate = {};
    if (startDate) filter.invoiceDate.$gte = new Date(startDate);
    if (endDate) filter.invoiceDate.$lte = new Date(endDate);
  }

  // Search Filter (invoiceNumber, customerName, customerGstin)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { invoiceNumber: searchRegex },
      { customerName: searchRegex },
      { customerGstin: searchRegex },
      { notes: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('customerId', 'customerName companyName email phone GSTIN address')
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  // Synchronize overdue statuses dynamically for unpaid invoices past due date
  const now = new Date();
  const refreshedInvoices = invoices.map((inv) => {
    if (
      inv.status !== 'Paid' &&
      inv.status !== 'Draft' &&
      inv.status !== 'Cancelled' &&
      new Date(inv.dueDate) < now &&
      inv.outstandingAmount > 0
    ) {
      inv.status = 'Overdue';
    }
    return inv;
  });

  return {
    invoices: refreshedInvoices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get financial metrics summary for dashboard cards & tab counters
 */
const getInvoiceSummary = async (orgId) => {
  const allInvoices = await Invoice.find({ organizationId: orgId }).lean();
  const now = new Date();

  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  const counts = {
    all: allInvoices.length,
    paid: 0,
    pending: 0,
    partiallyPaid: 0,
    overdue: 0,
    draft: 0,
    cancelled: 0,
  };

  allInvoices.forEach((inv) => {
    const grand = inv.grandTotal || inv.amount || 0;
    const paid = inv.paidAmount || 0;
    const outstanding = inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.balanceDue || 0);

    totalInvoiced = roundCurrency(totalInvoiced + grand);
    totalPaid = roundCurrency(totalPaid + paid);
    totalOutstanding = roundCurrency(totalOutstanding + outstanding);

    const isPastDue = new Date(inv.dueDate) < now && outstanding > 0;
    let effectiveStatus = inv.status;
    if (inv.status !== 'Paid' && inv.status !== 'Draft' && inv.status !== 'Cancelled' && isPastDue) {
      effectiveStatus = 'Overdue';
    }

    if (effectiveStatus === 'Paid') counts.paid += 1;
    else if (effectiveStatus === 'Partially Paid') counts.partiallyPaid += 1;
    else if (effectiveStatus === 'Overdue') {
      counts.overdue += 1;
      overdueCount += 1;
      overdueAmount = roundCurrency(overdueAmount + outstanding);
    } else if (effectiveStatus === 'Draft') counts.draft += 1;
    else if (effectiveStatus === 'Cancelled') counts.cancelled += 1;
    else counts.pending += 1;
  });

  const paidPercentage = totalInvoiced > 0 ? roundCurrency((totalPaid / totalInvoiced) * 100) : 0;

  return {
    totalInvoices: allInvoices.length,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    paidPercentage,
    overdueCount,
    overdueAmount,
    counts,
  };
};

/**
 * Get single invoice details by ID
 */
const getInvoiceById = async (id, orgId) => {
  const invoice = await Invoice.findOne({ _id: id, organizationId: orgId })
    .populate('customerId', 'customerName companyName email phone GSTIN address customerType')
    .lean();

  if (!invoice) {
    const error = new Error('Invoice not found in your organization.');
    error.statusCode = 404;
    throw error;
  }

  return invoice;
};

/**
 * Update an existing invoice
 */
const updateInvoice = async (id, orgId, updateData, sanitizedItems, calculatedFinancials) => {
  const invoice = await Invoice.findOne({ _id: id, organizationId: orgId });

  if (!invoice) {
    const error = new Error('Invoice not found in your organization.');
    error.statusCode = 404;
    throw error;
  }

  // Update line items and recalculate financials if items changed
  if (sanitizedItems && calculatedFinancials) {
    invoice.items = sanitizedItems;
    invoice.subtotal = calculatedFinancials.subtotal;
    invoice.totalGstAmount = calculatedFinancials.totalGstAmount;
    invoice.grandTotal = calculatedFinancials.grandTotal;
    invoice.amount = calculatedFinancials.grandTotal;

    // Preserve paidAmount accurately and adjust balance
    const outstanding = roundCurrency(calculatedFinancials.grandTotal - invoice.paidAmount);
    invoice.outstandingAmount = Math.max(0, outstanding);
    invoice.balanceDue = invoice.outstandingAmount;

    if (invoice.outstandingAmount === 0 && invoice.paidAmount > 0) {
      invoice.status = 'Paid';
    } else if (invoice.paidAmount > 0 && invoice.outstandingAmount > 0) {
      invoice.status = 'Partially Paid';
    }
  }

  // Update customer if provided
  if (updateData.customerId && updateData.customerId.toString() !== invoice.customerId.toString()) {
    const customer = await Customer.findOne({ _id: updateData.customerId, organizationId: orgId });
    if (!customer) {
      const error = new Error('Customer not found in your organization.');
      error.statusCode = 404;
      throw error;
    }
    invoice.customerId = customer._id;
    invoice.customerName = customer.customerName || customer.companyName;
    invoice.customerGstin = customer.GSTIN || 'UNREGISTERED';
  }

  // Update scalar fields
  if (updateData.dueDate) invoice.dueDate = new Date(updateData.dueDate);
  if (updateData.invoiceDate) {
    invoice.invoiceDate = new Date(updateData.invoiceDate);
    invoice.issueDate = invoice.invoiceDate;
  }
  if (updateData.paymentTerms) invoice.paymentTerms = updateData.paymentTerms;
  if (updateData.notes !== undefined) invoice.notes = updateData.notes;
  if (updateData.status) invoice.status = updateData.status;

  return await invoice.save();
};

/**
 * Delete or archive an invoice
 */
const deleteInvoice = async (id, orgId) => {
  const invoice = await Invoice.findOne({ _id: id, organizationId: orgId });

  if (!invoice) {
    const error = new Error('Invoice not found in your organization.');
    error.statusCode = 404;
    throw error;
  }

  // Enforce financial safety: Do not allow deletion of invoices with recorded payments
  if (invoice.paidAmount > 0) {
    const error = new Error(
      `Cannot delete invoice #${invoice.invoiceNumber} with recorded payments (₹${invoice.paidAmount}). Mark as Cancelled instead to preserve audit trails.`
    );
    error.statusCode = 400;
    throw error;
  }

  await Invoice.deleteOne({ _id: id, organizationId: orgId });
  return invoice;
};

module.exports = {
  getNextInvoiceNumber,
  createInvoice,
  getInvoices,
  getInvoiceSummary,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};

