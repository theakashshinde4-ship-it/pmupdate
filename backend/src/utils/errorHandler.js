/**
 * Error Handler Utility
 * Provides consistent error handling and response formatting across all controllers
 */

/**
 * Standardized error response handler
 * @param {object} res - Express response object
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Error message to send to client
 * @param {object} additionalData - Additional data to include in response
 */
const handleError = (res, error, statusCode = 500, message = 'Internal Server Error', additionalData = {}) => {
  console.error(`[${statusCode}] ${message}:`, error);
  
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }),
    ...additionalData
  };

  // Remove undefined properties
  Object.keys(response).forEach(key => response[key] === undefined && delete response[key]);

  res.status(statusCode).json(response);
};

/**
 * Validation error handler
 * @param {object} res - Express response object
 * @param {object} validationError - Joi validation error
 */
const handleValidationError = (res, validationError) => {
  const errors = validationError.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    type: detail.type
  }));

  res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors
  });
};

/**
 * Not found error handler
 * @param {object} res - Express response object
 * @param {string} resource - Name of the resource that was not found
 */
const handleNotFound = (res, resource = 'Resource') => {
  res.status(404).json({
    success: false,
    error: `${resource} not found`
  });
};

/**
 * Unauthorized error handler
 * @param {object} res - Express response object
 * @param {string} message - Custom error message
 */
const handleUnauthorized = (res, message = 'Unauthorized access') => {
  res.status(401).json({
    success: false,
    error: message
  });
};

/**
 * Forbidden error handler
 * @param {object} res - Express response object
 * @param {string} message - Custom error message
 */
const handleForbidden = (res, message = 'Forbidden access') => {
  res.status(403).json({
    success: false,
    error: message
  });
};

/**
 * Database error handler
 * @param {object} res - Express response object
 * @param {Error} error - Database error
 */
const handleDatabaseError = (res, error) => {
  console.error('Database error:', error);

  // Check for specific database error types
  if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(400).json({
      success: false,
      error: 'Invalid foreign key reference',
      details: 'The referenced record does not exist or is in use'
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: 'A record with this data already exists'
    });
  }

  if (error.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
    return res.status(503).json({
      success: false,
      error: 'Database connection timeout',
      details: 'The database is not responding. Please try again later.'
    });
  }

  // Generic database error
  handleError(res, error, 500, 'Database operation failed');
};

/**
 * Success response handler
 * @param {object} res - Express response object
 * @param {object} data - Data to send
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: 'Success')
 */
const handleSuccess = (res, data, statusCode = 200, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper for route handlers
 * @param {function} fn - Async function to wrap
 * @returns {function} Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  handleError,
  handleValidationError,
  handleNotFound,
  handleUnauthorized,
  handleForbidden,
  handleDatabaseError,
  handleSuccess,
  AppError,
  asyncHandler
};
