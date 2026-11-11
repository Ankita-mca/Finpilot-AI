/**
 * FinPilot AI - Customer Controller
 * Handles HTTP requests for customer management
 */
const customerService = require('../services/customer.service');
const { extractOrgId } = require('../validators/customer.validator');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Add a new customer
 * @route   POST /api/customers
 * @access  Multi-tenant (requires organizationId)
 */
const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    return successResponse(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get all customers for an organization (with search, filter, pagination)
 * @route   GET /api/customers
 * @access  Multi-tenant (requires organizationId)
 */
const getCustomers = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const { search, status, customerType, page, limit, sortBy, sortOrder } = req.query;

    const result = await customerService.getCustomers(orgId, {
      search,
      status,
      customerType,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return successResponse(res, result, 'Customers retrieved successfully', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get one customer by ID
 * @route   GET /api/customers/:id
 * @access  Multi-tenant (requires organizationId)
 */
const getCustomerById = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const { id } = req.params;

    const customer = await customerService.getCustomerById(id, orgId);
    return successResponse(res, customer, 'Customer details retrieved', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Update a customer by ID
 * @route   PUT /api/customers/:id
 * @access  Multi-tenant (requires organizationId)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const { id } = req.params;

    const updatedCustomer = await customerService.updateCustomer(id, orgId, req.body);
    return successResponse(res, updatedCustomer, 'Customer updated successfully', 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Delete a customer by ID
 * @route   DELETE /api/customers/:id
 * @access  Multi-tenant (requires organizationId)
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const orgId = req.organizationId || extractOrgId(req);
    const { id } = req.params;

    const deleted = await customerService.deleteCustomer(id, orgId);
    return successResponse(
      res,
      { id: deleted._id, customerName: deleted.customerName },
      'Customer deleted successfully',
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
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};

