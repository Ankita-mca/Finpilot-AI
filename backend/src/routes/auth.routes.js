/**
 * FinPilot AI - Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
  validateRegister,
  validateLogin,
  validateOrgSetup,
} = require('../validators/auth.validator');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);

router.get('/me', protect, authController.getMe);
router.post(
  '/organization',
  protect,
  authorizeRoles('owner', 'admin'),
  validateOrgSetup,
  authController.setupOrganization
);

module.exports = router;

