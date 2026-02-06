/**
 * Global Error Handler with Retry Logic
 * Handles all types of errors with user-friendly messages
 */

class ErrorHandler {
  static async retryWithBackoff(asyncFn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        // Calculate exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        
        if (attempt < maxRetries - 1) {
          console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  static getUserFriendlyMessage(error) {
    // Map technical errors to user-friendly messages
    const statusCodeMap = {
      400: 'Please check your input',
      401: 'Please login again',
      403: 'You do not have permission',
      404: 'Resource not found',
      409: 'Conflict - data may have changed',
      429: 'Too many requests - please wait',
      500: 'Server error - please try again',
      503: 'Service temporarily unavailable'
    };

    if (error.response?.status) {
      return statusCodeMap[error.response.status] || 'Something went wrong';
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Cannot connect to server - check your connection';
    }

    if (error.code === 'ENOTFOUND') {
      return 'Server not found - check configuration';
    }

    return 'An unexpected error occurred';
  }

  static logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      status: error.response?.status,
      url: error.response?.config?.url,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    };

    console.error('Error:', errorLog);

    // In production, send to error logging service
    if (import.meta.env && import.meta.env.PROD) {
      const apiBase = (import.meta.env && import.meta.env.VITE_API_URL) || '';
      const base = String(apiBase).replace(/\/$/, '');
      const url = base ? `${base}/api/logs/error` : '/api/logs/error';

      fetch(url, {
        method: 'POST',
        body: JSON.stringify(errorLog),
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }
  }
}

export default ErrorHandler;
