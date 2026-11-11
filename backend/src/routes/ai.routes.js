/**
 * FinPilot AI - AI Assistant Routes
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect, requireOrganization } = require('../middleware/auth.middleware');
const { validateSendMessage, validateSessionId } = require('../validators/ai.validator');

// Enforce authentication and verified organization membership on all AI routes
router.use(protect, requireOrganization);

// 1. Send query to AI Assistant
router.post('/query', validateSendMessage, aiController.sendMessage);

// 2. Chat sessions management
router.get('/sessions', aiController.getSessions);
router.post('/sessions', aiController.createSession);

// 3. Session message history & cleanup
router.get('/sessions/:sessionId/messages', validateSessionId, aiController.getSessionHistory);
router.delete('/sessions/:sessionId/messages', validateSessionId, aiController.clearSessionMessages);

module.exports = router;

