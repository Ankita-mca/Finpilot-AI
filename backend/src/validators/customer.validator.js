/**
 * FinPilot AI - Customer Request Validators
 */
const mongoose = require('mongoose');
const { errorResponse } = require('../utils/response');

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Extract organizationId strictly from verified authenticated user context
 */
const extractOrgId = (req) => {
  if (req.user && req.user.organizationId) {
    return req.user.organizationId.toString();
  }

  return req.organizationId ? req.organizationId.toString() : null;
};

/**
 * Validates request payload when creating a new customer
 */
const validateCreateCustomer = (req, res, next) => {
  const orgId = extractOrgId(req);
  const { customerName, customerType, status, email, phone, GSTIN, address } = req.body;

  const errors = {};

  // Validate Organization ID
  if (!orgId) {
    errors.organizationId = 'organizationId is required (pass via authenticated session or x-organization-id header).';
  } else if (!mongoose.Types.ObjectId.isValid(orgId)) {
    errors.organizationId = 'organizationId must be a valid 24-character MongoDB ObjectId.';
  } else {
    req.organizationId = orgId;
    req.body.organizationId = orgId;
  }

  // Validate customerName
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    errors.customerName = 'customerName is required and cannot be empty.';
  } else if (customerName.trim().length < 2) {
    errors.customerName = 'customerName must be at least 2 characters.';
  } else if (customerName.trim().length > 200) {
    errors.customerName = 'customerName cannot exceed 200 characters.';
  } else {
    req.body.customerName = customerName.trim();
  }

  // Validate companyName if provided
  if (req.body.companyName !== undefined && req.body.companyName !== null) {
    req.body.companyName = req.body.companyName.toString().trim();
  } else {
    req.body.companyName = '';
  }

  // Validate customerType if provided
  if (customerType) {
    const normalizedType = customerType.charAt(0).toUpperCase() + customerType.slice(1).toLowerCase();
    if (!['Individual', 'Business'].includes(normalizedType)) {
      errors.customerType = 'customerType must be either "Individual" or "Business".';
    } else {
      req.body.customerType = normalizedType;
    }
  } else {
    req.body.customerType = 'Business';
  }

  // Validate status if provided
  if (status) {
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
      errors.status = 'status must be either "Active" or "Inactive".';
    } else {
      req.body.status = normalizedStatus;
    }
  } else {
    req.body.status = 'Active';
  }

  // Validate email if provided (allow blank)
  if (email !== undefined && email !== null && email.toString().trim() !== '') {
    const cleanEmail = email.toString().trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Please provide a valid email address.';
    } else {
      req.body.email = cleanEmail;
    }
  } else {
    req.body.email = null;
  }

  // Validate phone if provided
  if (phone) {
    const cleanPhone = phone.toString().trim();
    if (cleanPhone.length > 20) {
      errors.phone = 'Phone number cannot exceed 20 characters.';
    } else {
      req.body.phone = cleanPhone;
    }
  } else {
    req.body.phone = '';
  }

  // Validate GSTIN if provided (allow blank for unregistered customers)
  if (GSTIN !== undefined && GSTIN !== null && GSTIN.toString().trim() !== '') {
    const cleanGstin = GSTIN.toString().trim().toUpperCase();
    if (!GSTIN_REGEX.test(cleanGstin)) {
      errors.GSTIN = 'Invalid GSTIN format. Expected 15-character alphanumeric format (e.g., 27AABCA4589D1ZF).';
    } else {
      req.body.GSTIN = cleanGstin;
    }
  } else {
    req.body.GSTIN = null;
  }

  // Normalize address structure
  if (address !== undefined && address !== null) {
    if (typeof address === 'object') {
      req.body.address = {
        city: (address.city || '').toString().trim(),
        state: (address.state || '').toString().trim(),
        country: (address.country || 'India').toString().trim(),
        pincode: (address.pincode || '').toString().trim(),
      };
    } else if (typeof address === 'string') {
      req.body.address = {
        city: address.trim(),
        state: '',
        country: 'India',
        pincode: '',
      };
    }
  } else {
    req.body.address = {
      city: '',
      state: '',
      country: 'India',
      pincode: '',
    };
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 'Customer validation failed', 400, errors);
  }

  next();
};

/**
 * Validates request payload when updating an existing customer
 */
const validateUpdateCustomer = (req, res, next) => {
  const { id } = req.params;
  const orgId = extractOrgId(req);
  const { customerName, customerType, status, email, phone, GSTIN } = req.body;

  const errors = {};

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 'Invalid customer ID format in URL parameter.', 400);
  }

  if (orgId) {
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      errors.organizationId = 'organizationId must be a valid 24-character MongoDB ObjectId.';
    } else {
      req.organizationId = orgId;
    }
  }

  if (customerName !== undefined) {
    if (typeof customerName !== 'string' || customerName.trim().length === 0) {
      errors.customerName = 'customerName cannot be empty.';
    } else if (customerName.trim().length < 2) {
      errors.customerName = 'customerName must be at least 2 characters.';
    }
  }

  if (customerType !== undefined) {
    const normalizedType = customerType.charAt(0).toUpperCase() + customerType.slice(1).toLowerCase();
    if (!['Individual', 'Business'].includes(normalizedType)) {
      errors.customerType = 'customerType must be either "Individual" or "Business".';
    } else {
      req.body.customerType = normalizedType;
    }
  }

  if (status !== undefined) {
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
      errors.status = 'status must be either "Active" or "Inactive".';
    } else {
      req.body.status = normalizedStatus;
    }
  }

  if (email !== undefined) {
    if (email === null || email.toString().trim() === '') {
      req.body.email = null;
    } else if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    } else {
      req.body.email = email.trim().toLowerCase();
    }
  }

  if (phone !== undefined && phone !== null) {
    const cleanPhone = phone.toString().trim();
    if (cleanPhone.length > 20) {
      errors.phone = 'Phone number cannot exceed 20 characters.';
    } else {
      req.body.phone = cleanPhone;
    }
  }

  if (GSTIN !== undefined) {
    if (GSTIN === null || GSTIN.toString().trim() === '') {
      req.body.GSTIN = null;
    } else {
      const cleanGstin = GSTIN.toString().trim().toUpperCase();
      if (!GSTIN_REGEX.test(cleanGstin)) {
        errors.GSTIN = 'Invalid GSTIN format. Expected 15-character alphanumeric format (e.g., 27AABCA4589D1ZF).';
      } else {
        req.body.GSTIN = cleanGstin;
      }
    }
  }

  if (req.body.address !== undefined && req.body.address !== null) {
    if (typeof req.body.address === 'object') {
      req.body.address = {
        city: (req.body.address.city || '').toString().trim(),
        state: (req.body.address.state || '').toString().trim(),
        country: (req.body.address.country || 'India').toString().trim(),
        pincode: (req.body.address.pincode || '').toString().trim(),
      };
    } else if (typeof req.body.address === 'string') {
      req.body.address = {
        city: req.body.address.trim(),
        state: '',
        country: 'India',
        pincode: '',
      };
    }
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 'Customer update validation failed', 400, errors);
  }

  next();
};

/**
 * Validates customer ID parameter in route
 */
const validateCustomerId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 'Invalid customer ID format in URL parameter.', 400);
  }
  next();
};

/**
 * Validates presence of organizationId for tenant isolation
 */
const requireOrganizationId = (req, res, next) => {
  const orgId = extractOrgId(req);

  if (!orgId) {
    return errorResponse(
      res,
      'organizationId is required for tenant isolation. Provide via x-organization-id header, query parameter, or request body.',
      400
    );
  }

  if (!mongoose.Types.ObjectId.isValid(orgId)) {
    return errorResponse(
      res,
      'organizationId must be a valid 24-character MongoDB ObjectId.',
      400
    );
  }

  req.organizationId = orgId;
  next();
};

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerId,
  requireOrganizationId,
  extractOrgId,
};

