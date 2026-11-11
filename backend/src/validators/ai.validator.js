/**
 * FinPilot AI - AI Query Request Validators
 */
const mongoose = require('mongoose');
const { errorResponse } = require('../utils/response');

/**
 * Extract organizationId strictly from verified authenticated user context
 */
const extractOrgId = (req) => {
  if (req.user && req.user.organizationId) {
    return req.user.organizationId.toString();
  }

  return req.organizationId ? req.organizationId.toString() : null;
};

const validateSendMessage = (req, res, next) => {
  const { queryText, sessionId } = req.body;
  const orgId = extractOrgId(req);

  const errors = {};

  if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
    errors.organizationId = 'Valid authenticated organization context is required.';
  } else {
    req.orgId = orgId;
  }

  if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
    errors.queryText = 'Message text is required and cannot be empty.';
  } else if (queryText.trim().length > 2000) {
    errors.queryText = 'Message text cannot exceed 2000 characters.';
  }

  if (sessionId && !mongoose.Types.ObjectId.isValid(sessionId)) {
    errors.sessionId = 'Invalid sessionId format. Must be a valid MongoDB ObjectId.';
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  req.body.queryText = queryText.trim();
  next();
};

const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    return errorResponse(res, 'Invalid or missing sessionId parameter', 400);
  }

  next();
};

module.exports = {
  validateSendMessage,
  validateSessionId,
};

