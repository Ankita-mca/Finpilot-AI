/**
 * FinPilot AI - Invoice Routes
 * REST API endpoints for multi-tenant GST Tax Invoice Management
 */
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { protect, requireOrganization, authorizeRoles } = require('../middleware/auth.middleware');
const {
  validateCreateInvoice,
  validateUpdateInvoice,
  validateInvoiceId,
  requireOrganizationId,
} = require('../validators/invoice.validator');

// Enforce authentication and verified organization membership on all invoice routes
router.use(protect, requireOrganization);

// 1. Create a new invoice (POST /api/invoices)
router.post('/', authorizeRoles('owner', 'admin', 'member'), validateCreateInvoice, invoiceController.createInvoice);

// 2. Get invoice summary metrics for dashboard (GET /api/invoices/summary)
router.get('/summary', requireOrganizationId, invoiceController.getInvoiceSummary);

// 3. Generate preview of next invoice number (GET /api/invoices/next-number)
router.get('/next-number', requireOrganizationId, invoiceController.getNextNumber);

// 4. Get all invoices with search/filtering/pagination (GET /api/invoices)
router.get('/', requireOrganizationId, invoiceController.getInvoices);

// 5. Get single invoice by ID (GET /api/invoices/:id)
router.get('/:id', validateInvoiceId, requireOrganizationId, invoiceController.getInvoiceById);

// 6. Update invoice by ID (PUT /api/invoices/:id)
router.put('/:id', authorizeRoles('owner', 'admin', 'member'), validateInvoiceId, validateUpdateInvoice, requireOrganizationId, invoiceController.updateInvoice);

// 7. Delete invoice by ID (DELETE /api/invoices/:id)
router.delete('/:id', authorizeRoles('owner', 'admin'), validateInvoiceId, requireOrganizationId, invoiceController.deleteInvoice);

module.exports = router;

