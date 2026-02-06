/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized response
 * 
 * Must be registered LAST in middleware chain
 */
const ApiError = require('../errors/ApiError');
const { logger } = require('../../monitoring/logger');

const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Log error with context
  const errorContext = {
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message,
    timestamp: new Date().toISOString(),
    ...(req.user && { userId: req.user.id }),
    ...(req.correlationId && { correlationId: req.correlationId })
  };

  if (statusCode >= 500) {
    logger.error('Internal Server Error', {
      ...errorContext,
      stack: err.stack
    });
  } else {
    logger.warn('Client Error', errorContext);
  }

  // Joi validation errors
  if (err.isJoi || err.details) {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'This resource already exists';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'Referenced resource does not exist';
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(process.env.NODE_ENV === 'development' && {
        details: err.details || err.message,
        stack: err.stack
      })
    },
    timestamp: new Date().toISOString()
  };

  // Add request ID for debugging
  if (req.correlationId) {
    errorResponse.requestId = req.correlationId;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
