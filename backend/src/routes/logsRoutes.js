/**
 * Error Logging Routes
 * Frontend endpoints for client-side error reporting
 */

const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const joiValidate = require('../middleware/joiValidate');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { errorLogSchema, analyticsEventSchema } = require('../validation/logsSchemas');

/**
 * POST /api/logs/error
 * Log client-side errors
 */
router.post('/error', joiValidate(errorLogSchema), (req, res) => {
  try {
    const {
      message,
      stack,
      url,
      userAgent,
      context = {},
      severity = 'error'
    } = req.body;

    // Log the error
    logger.clientError(message, {
      message,
      stack
    }, {
      url,
      userAgent,
      userId: req.user?.id || null,
      sessionId: req.sessionID || null,
      ip: req.ip,
      severity
    });

    // If critical, also log as critical
    if (severity === 'critical') {
      logger.critical('Client-side critical error', {
        message,
        stack
      }, {
        url,
        userAgent,
        userId: req.user?.id,
        ip: req.ip
      });
    }

    sendSuccess(res, null, 'Error logged successfully');
  } catch (error) {
    console.error('Failed to log client error:', error);
    sendError(res, 'Failed to log error', 500, error.message);
  }
});

/**
 * POST /api/logs/analytics
 * Log analytics events
 */
router.post('/analytics', authenticateToken, requireRole('admin'), joiValidate(analyticsEventSchema), (req, res) => {
  try {
    const {
      eventName,
      eventData = {},
      timestamp
    } = req.body;

    logger.info(`Analytics: ${eventName}`, {
      eventName,
      eventData,
      userId: req.user?.id || null,
      timestamp
    });

    sendSuccess(res, null, 'Analytics event logged');
  } catch (error) {
    console.error('Failed to log analytics event:', error);
    sendError(res, 'Failed to log analytics', 500, error.message);
  }
});

/**
 * GET /api/logs/status
 * Get logging status (debug info)
 */
router.get('/status', authenticateToken, requireRole('admin'), (req, res) => {
  sendSuccess(res, {
    logging: 'active',
    level: process.env.LOG_LEVEL || 'INFO',
    timestamp: new Date().toISOString()
  }, 'Logging status retrieved');
});

module.exports = router;
