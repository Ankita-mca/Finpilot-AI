/**
 * FinPilot AI - Invoice Controller
 * HTTP request handlers for GST Tax Invoice Management
 */
const invoiceService = require('../services/invoice.service');
const { extractOrgId } = require('../validators/invoice.validator');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Create a new GST tax invoice
 * @route   POST /api/invoices
 * @access  Multi-tenant (enforced organization context)
 */
const createInvoice = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const invoice = await invoiceService.createInvoice(
      orgId,
      req.body,
      req.sanitizedItems,
      req.calculatedFinancials
    );
    return successResponse(res, invoice, 'GST Tax Invoice created and saved successfully', 201);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get all invoices for the active organization
 * @route   GET /api/invoices
 * @access  Multi-tenant
 */
const getInvoices = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const result = await invoiceService.getInvoices(orgId, req.query);
    return successResponse(res, result, 'Invoices retrieved successfully', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get financial metrics summary for invoices dashboard
 * @route   GET /api/invoices/summary
 * @access  Multi-tenant
 */
const getInvoiceSummary = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const summary = await invoiceService.getInvoiceSummary(orgId);
    return successResponse(res, summary, 'Invoice summary metrics retrieved', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get next sequential invoice number preview
 * @route   GET /api/invoices/next-number
 * @access  Multi-tenant
 */
const getNextNumber = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const nextNumber = await invoiceService.getNextInvoiceNumber(orgId);
    return successResponse(res, { invoiceNumber: nextNumber }, 'Next invoice number generated', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get one invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Multi-tenant
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const invoice = await invoiceService.getInvoiceById(req.params.id, orgId);
    return successResponse(res, invoice, 'Invoice details retrieved', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Update an invoice
 * @route   PUT /api/invoices/:id
 * @access  Multi-tenant
 */
const updateInvoice = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const updated = await invoiceService.updateInvoice(
      req.params.id,
      orgId,
      req.body,
      req.sanitizedItems,
      req.calculatedFinancials
    );
    return successResponse(res, updated, 'Invoice updated successfully', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Delete an invoice
 * @route   DELETE /api/invoices/:id
 * @access  Multi-tenant
 */
const deleteInvoice = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const deleted = await invoiceService.deleteInvoice(req.params.id, orgId);
    return successResponse(
      res,
      { id: deleted._id, invoiceNumber: deleted.invoiceNumber },
      'Invoice deleted successfully',
      200
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceSummary,
  getNextNumber,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};

