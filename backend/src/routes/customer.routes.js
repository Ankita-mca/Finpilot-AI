/**
 * FinPilot AI - Customer Routes
 * REST API routes for multi-tenant Customer Management
 */
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { protect, requireOrganization, authorizeRoles } = require('../middleware/auth.middleware');
const {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerId,
  requireOrganizationId,
} = require('../validators/customer.validator');

// Enforce authentication and verified organization membership on all customer routes
router.use(protect, requireOrganization);

// 1. Create a customer (POST /api/customers)
router.post('/', authorizeRoles('owner', 'admin', 'member'), validateCreateCustomer, customerController.createCustomer);

// 2. Get all customers with search/filter/pagination (GET /api/customers)
router.get('/', requireOrganizationId, customerController.getCustomers);

// 3. Get single customer by ID (GET /api/customers/:id)
router.get('/:id', validateCustomerId, requireOrganizationId, customerController.getCustomerById);

// 4. Update customer by ID (PUT /api/customers/:id)
router.put('/:id', authorizeRoles('owner', 'admin', 'member'), validateUpdateCustomer, requireOrganizationId, customerController.updateCustomer);

// 5. Delete customer by ID (DELETE /api/customers/:id)
router.delete('/:id', authorizeRoles('owner', 'admin'), validateCustomerId, requireOrganizationId, customerController.deleteCustomer);

module.exports = router;

