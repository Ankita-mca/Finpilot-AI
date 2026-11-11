/**
 * FinPilot AI - Authentication & Organization Setup Validators
 */
const { errorResponse } = require('../utils/response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (name.trim().length > 100) {
    errors.name = 'Full name cannot exceed 100 characters.';
  } else {
    req.body.name = name.trim();
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid business email address.';
  } else {
    req.body.email = email.trim().toLowerCase();
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0];
    return errorResponse(res, firstError, 400, errors);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid registered email address.';
  } else {
    req.body.email = email.trim().toLowerCase();
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0];
    return errorResponse(res, firstError, 400, errors);
  }

  next();
};

const validateOrgSetup = (req, res, next) => {
  const { name, email, phone } = req.body;
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Organization name must be at least 2 characters.';
  } else {
    req.body.name = name.trim();
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid business email address.';
  } else {
    req.body.email = email.trim().toLowerCase();
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
    errors.phone = 'Please enter a valid phone number.';
  } else {
    req.body.phone = phone.trim();
  }

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0];
    return errorResponse(res, firstError, 400, errors);
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateOrgSetup,
};

