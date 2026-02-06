/**
 * Standardized API Response Wrapper
 * All endpoints return consistent response format
 * 
 * Success Response:
 * {
 *   success: true,
 *   data: { ... },
 *   message: "Patient created successfully",
 *   timestamp: "2024-02-06T10:30:00Z"
 * }
 * 
 * Error Response:
 * {
 *   success: false,
 *   error: {
 *     code: "PATIENT_NOT_FOUND",
 *     message: "Patient not found"
 *   }
 * }
 */
class ApiResponse {
  constructor(
    success,
    data = null,
    message = '',
    code = null,
    statusCode = 200
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Success response
   * @param {*} data - Response payload
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(data, message = '', statusCode = 200) {
    return new ApiResponse(true, data, message, null, statusCode);
  }

  /**
   * Created response (201)
   */
  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(true, data, message, null, 201);
  }

  /**
   * Error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Additional error details
   */
  static error(message, code = 'ERROR', statusCode = 400, data = null) {
    return new ApiResponse(false, data, message, code, statusCode);
  }

  /**
   * Paginated response
   */
  static paginated(data, pagination, message = '') {
    return {
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    const response = {
      success: this.success,
      ...(this.data && { data: this.data }),
      ...(this.message && { message: this.message }),
      ...(this.code && { code: this.code })
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.timestamp = this.timestamp;
    }
    
    return response;
  }
}

module.exports = ApiResponse;
