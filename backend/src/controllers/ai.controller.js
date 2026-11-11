/**
 * FinPilot AI - AI Assistant Controller
 */
const aiService = require('../services/ai.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Send message to AI assistant
 * @route   POST /api/ai/query
 * @access  Public (or Tenant Protected when auth enabled)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { queryText, sessionId } = req.body;

    const result = await aiService.processQuery({
      queryText,
      sessionId,
      orgId: req.orgId || null,
      userId: req.userId || null,
    });

    return successResponse(res, result, 'Message processed successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get message history for a specific session
 * @route   GET /api/ai/sessions/:sessionId/messages
 * @access  Public
 */
const getSessionHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const history = await aiService.getSessionHistory(sessionId);

    return successResponse(
      res,
      { sessionId, messages: history, count: history.length },
      'Session history retrieved',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all chat sessions
 * @route   GET /api/ai/sessions
 * @access  Public
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await aiService.getAllSessions();
    return successResponse(res, { sessions, count: sessions.length }, 'Sessions retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new chat session explicitly
 * @route   POST /api/ai/sessions
 * @access  Public
 */
const createSession = async (req, res, next) => {
  try {
    const { title } = req.body;
    const session = await aiService.getOrCreateSession(null, title);
    return successResponse(res, session, 'New session created', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear chat history for a session
 * @route   DELETE /api/ai/sessions/:sessionId/messages
 * @access  Public
 */
const clearSessionMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await aiService.clearSessionMessages(sessionId);
    return successResponse(res, result, 'Session history cleared', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getSessionHistory,
  getSessions,
  createSession,
  clearSessionMessages,
};

