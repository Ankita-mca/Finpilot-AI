/**
 * FinPilot AI - Authentication Controller
 * Handles user registration, login, session validation, logout, and organization setup
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { getJwtSecret } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/response');

const signToken = (user, rememberMe = true) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: rememberMe ? process.env.JWT_EXPIRES_IN || '30d' : '1d',
  });
};

const setAuthCookie = (res, token, rememberMe = true) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  if (rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  res.cookie('finpilot_token', token, cookieOptions);
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId ? user.organizationId.toString() : null,
});

const sanitizeOrg = (org) => ({
  id: org._id.toString(),
  name: org.name,
  email: org.email,
  phone: org.phone,
  GSTIN: org.GSTIN,
  currency: org.currency,
  structure: org.structure,
  industry: org.industry,
  size: org.size,
  country: org.country,
  state: org.state,
  city: org.city,
  website: org.website,
});

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Prevent duplicate email registrations
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(
        res,
        'An account with this email is already registered. Please log in instead.',
        409
      );
    }

    const user = await User.create({
      name,
      email,
      password,
      organizationId: null,
      role: 'owner',
    });

    const token = signToken(user, true);
    setAuthCookie(res, token, true);

    return successResponse(
      res,
      {
        user: sanitizeUser(user),
        organization: null,
        token,
      },
      'Account registered successfully. Please complete organization setup.',
      201
    );
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(
        res,
        'An account with this email is already registered. Please log in instead.',
        409
      );
    }
    next(error);
  }
};

/**
 * @desc    Authenticate an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe = true } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return errorResponse(
        res,
        'Invalid email or password. Please verify your credentials.',
        401
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(
        res,
        'Invalid email or password. Please verify your credentials.',
        401
      );
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    let organization = null;
    if (user.organizationId) {
      const orgDoc = await Organization.findById(user.organizationId);
      if (orgDoc) {
        organization = sanitizeOrg(orgDoc);
      }
    }

    const token = signToken(user, Boolean(rememberMe));
    setAuthCookie(res, token, Boolean(rememberMe));

    return successResponse(
      res,
      {
        user: sanitizeUser(user),
        organization,
        token,
      },
      'Logged in successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create and link an organization for a newly registered user
 * @route   POST /api/auth/organization
 * @access  Private (authenticated user without an organization)
 */
const setupOrganization = async (req, res, next) => {
  try {
    // Prevent duplicate organizations for users who already belong to one
    if (req.user.organizationId) {
      const existingOrg = await Organization.findById(req.user.organizationId);
      if (existingOrg) {
        return errorResponse(
          res,
          'Your account is already linked to an organization.',
          409
        );
      }
    }

    const {
      name,
      email,
      phone,
      GSTIN = '',
      currency = 'INR',
      structure = '',
      industry = '',
      size = '',
      country = 'India',
      state = '',
      city = '',
      website = '',
    } = req.body;

    const organization = await Organization.create({
      name,
      email,
      phone,
      GSTIN,
      currency,
      structure,
      industry,
      size,
      country,
      state,
      city,
      website,
      ownerId: req.user._id,
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { organizationId: organization._id, role: 'owner' },
      { new: true }
    );

    const token = signToken(updatedUser, true);
    setAuthCookie(res, token, true);

    return successResponse(
      res,
      {
        user: sanitizeUser(updatedUser),
        organization: sanitizeOrg(organization),
        token,
      },
      'Organization configured successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user and organization
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    let organization = null;
    if (req.user.organizationId) {
      const orgDoc = await Organization.findById(req.user.organizationId);
      if (orgDoc) {
        organization = sanitizeOrg(orgDoc);
      }
    }

    return successResponse(
      res,
      {
        user: sanitizeUser(req.user),
        organization,
      },
      'Session verified',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear authentication cookie and log out
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = (req, res) => {
  res.clearCookie('finpilot_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return successResponse(res, {}, 'Logged out successfully', 200);
};

/**
 * @desc    Handle forgot password request cleanly
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return errorResponse(res, 'Please enter a valid registered email address.', 400);
    }

    // Look up silently without leaking account existence
    await User.findOne({ email: email.trim().toLowerCase() }).select('_id');

    return successResponse(
      res,
      {},
      'If an account exists for that email, password reset instructions have been sent.',
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  setupOrganization,
  getMe,
  logout,
  forgotPassword,
};

