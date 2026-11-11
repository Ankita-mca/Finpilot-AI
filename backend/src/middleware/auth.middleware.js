/**
 * FinPilot AI - Authentication & Tenant Authorization Middleware
 * Validates JWT (HTTP-only cookie or Bearer header) and enforces DB user & org membership
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { errorResponse } = require('../utils/response');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'finpilot-super-secret-jwt-key-dev';
};

/**
 * Parse cookies from raw Cookie header without external dependency
 */
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  });
  return cookies;
};

/**
 * Extract JWT from HTTP-only cookie or Authorization Bearer header
 */
const extractToken = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookies = parseCookies(req.headers.cookie);
  if (cookies.finpilot_token) {
    return cookies.finpilot_token;
  }

  return null;
};

/**
 * Protect middleware: verifies JWT and loads authoritative user record from MongoDB
 */
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return errorResponse(res, 'Authentication required. Please log in to continue.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Your session has expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid authentication token. Please log in again.', 401);
    }

    if (!decoded || !decoded.userId) {
      return errorResponse(res, 'Invalid authentication payload.', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return errorResponse(res, 'User account not found or deactivated.', 401);
    }

    // Authoritative user & tenant context strictly from MongoDB
    req.user = user;
    req.userId = user._id.toString();
    req.organizationId = user.organizationId ? user.organizationId.toString() : null;
    req.orgId = req.organizationId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require verified organization membership on multi-tenant endpoints
 */
const requireOrganization = async (req, res, next) => {
  try {
    if (!req.user || !req.organizationId) {
      return errorResponse(
        res,
        'Organization setup required. Please complete your organization profile.',
        403
      );
    }

    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return errorResponse(res, 'Associated organization was not found.', 403);
    }

    req.organization = org;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control middleware
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        'You do not have permission to perform this action.',
        403
      );
    }
    next();
  };
};

module.exports = {
  protect,
  requireOrganization,
  authorizeRoles,
  getJwtSecret,
  extractToken,
};

