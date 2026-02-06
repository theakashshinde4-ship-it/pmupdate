/**
 * Custom API Error Class
 * Extends Error for proper error handling with HTTP status codes
 * 
 * Usage:
 * throw new ApiError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
 * throw new ApiError(409, 'Email already registered', 'EMAIL_EXISTS');
 * throw new ApiError(500, 'Database connection failed');
 */
class ApiError extends Error {
  constructor(
    statusCode,
    message = 'Something went wrong',
    errorCode = 'INTERNAL_ERROR',
    details = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Can be handled by error middleware

    // Maintains proper stack trace in V8 engines
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to response object
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }

  /**
   * Static factory for common errors
   */
  static notFound(resource = 'Resource') {
    return new ApiError(
      404,
      `${resource} not found`,
      `${resource.toUpperCase()}_NOT_FOUND`
    );
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static unprocessable(message, code = 'UNPROCESSABLE_ENTITY') {
    return new ApiError(422, message, code);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

module.exports = ApiError;
