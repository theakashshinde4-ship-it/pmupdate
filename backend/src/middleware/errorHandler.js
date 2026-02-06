// Comprehensive error handler
let logger;
try {
  logger = require('../services/logger');
} catch (e) {
  // Fallback simple logger if service not found
  logger = {
    error: (msg, err, ctx) => console.error('[ERROR]', msg, err?.message || err, ctx),
    critical: (msg, err, ctx) => console.error('[CRITICAL]', msg, err?.message || err, ctx)
  };
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log error with context
  const correlationId = req.correlationId || req.headers['x-request-id'] || req.headers['x-correlation-id'];
  if (correlationId && !res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', correlationId);
  }

  const errorContext = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    user: req.user?.id || 'anonymous',
    correlationId,
    code: err.code,
    sqlMessage: err.sqlMessage
  };

  logger.error('Request error', err, errorContext);

  // Log critical errors
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    logger.critical('Database connection error', err, errorContext);
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      error: 'Database error',
      message: 'Invalid field in query'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Authentication token has expired'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({
      error: err.message || 'Validation error',
      details: err.details || undefined
    });
  }

  // Unauthorized errors
  if (err.status === 401 || err.status === 403) {
    return res.status(err.status).json({
      error: err.message || 'Unauthorized',
      message: err.message || 'You do not have permission to access this resource'
    });
  }

  // Not found errors
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not found',
      message: err.message || 'The requested resource was not found'
    });
  }

  // Default error response
  const status = err.status || err.statusCode || 500;
  const response = {
    error: err.message || 'Internal server error'
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;

