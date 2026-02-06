/**
 * WEEK 2: Rate Limiting Middleware
 * 
 * Prevents:
 * - Brute force attacks
 * - DDoS attacks
 * - API abuse
 * - Medication search spam
 * - Queue manipulation
 */

const logger = require('../services/logger');

// In-memory store for rate limit data
// In production, use Redis for distributed rate limiting across multiple servers
const rateLimitStore = new Map();

// Rate limit configuration by endpoint
const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  'auth:register': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  
  // API endpoints - moderate limits
  'api:medications:search': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  'api:medications:all': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  'api:prescriptions:create': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  'api:prescriptions:list': { windowMs: 60 * 1000, maxRequests: 30 },
  'api:queue:update': { windowMs: 60 * 1000, maxRequests: 50 }, // 50 per minute
  'api:queue:list': { windowMs: 60 * 1000, maxRequests: 30 },
  'api:patients:create': { windowMs: 60 * 60 * 1000, maxRequests: 100 }, // 100 per hour
  'api:patients:update': { windowMs: 60 * 1000, maxRequests: 20 },
  'api:icd:search': { windowMs: 60 * 1000, maxRequests: 30 },
  'api:snomed:search': { windowMs: 60 * 1000, maxRequests: 30 },
  
  // Public endpoints - generous limits
  'api:public': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
};

/**
 * Get client identifier (IP address or user ID)
 * @param {object} req - Express request object
 * @returns {string} - Client identifier
 */
function getClientId(req) {
  // If authenticated, use user ID (allows more requests for legitimate users)
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  
  // Otherwise use IP address
  return req.ip || req.connection.remoteAddress;
}

/**
 * Clean old entries from rate limit store
 * Removes entries older than 1 hour to prevent memory leak
 */
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.lastCleanup > 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if client has exceeded rate limit
 * @param {string} clientId - Client identifier
 * @param {string} endpoint - Endpoint identifier
 * @param {object} limits - Rate limit configuration
 * @returns {object} - { exceeded: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(clientId, endpoint, limits) {
  const key = `${clientId}:${endpoint}`;
  const now = Date.now();

  // Get or initialize client rate limit data
  let data = rateLimitStore.get(key);

  if (!data || now - data.windowStart > limits.windowMs) {
    // New window
    data = {
      requests: 1,
      windowStart: now,
      lastCleanup: now
    };
  } else {
    // Within existing window
    data.requests++;
  }

  rateLimitStore.set(key, data);

  // Calculate remaining requests
  const remaining = Math.max(0, limits.maxRequests - data.requests);
  const resetTime = data.windowStart + limits.windowMs;

  return {
    exceeded: data.requests > limits.maxRequests,
    requests: data.requests,
    maxRequests: limits.maxRequests,
    remaining,
    resetTime,
    windowMs: limits.windowMs
  };
}

/**
 * Rate limiting middleware factory
 * @param {string} endpoint - Endpoint identifier
 * @param {object} customLimits - Optional custom rate limit configuration
 * @returns {function} - Express middleware function
 */
function createRateLimiter(endpoint, customLimits = null) {
  const limits = customLimits || RATE_LIMITS[endpoint] || RATE_LIMITS['api:public'];

  return (req, res, next) => {
    try {
      // Clean expired entries periodically
      if (Math.random() < 0.01) { // 1% of requests trigger cleanup
        cleanExpiredEntries();
      }

      const clientId = getClientId(req);
      const result = checkRateLimit(clientId, endpoint, limits);

      // Set response headers for rate limit info
      res.set({
        'X-RateLimit-Limit': limits.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
      });

      if (result.exceeded) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        
        logger.warn('Rate limit exceeded', {
          clientId,
          endpoint,
          requests: result.requests,
          maxRequests: result.maxRequests
        });

        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
          resetTime: new Date(result.resetTime).toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error: error.message });
      // Don't block requests on rate limiter errors
      next();
    }
  };
}

/**
 * Strict rate limiter for sensitive operations (authentication, bulk operations)
 * @param {string} endpoint - Endpoint identifier
 * @returns {function} - Express middleware function
 */
function strictRateLimiter(endpoint) {
  const limits = RATE_LIMITS[endpoint] || { windowMs: 15 * 60 * 1000, maxRequests: 5 };
  return createRateLimiter(endpoint, { windowMs: limits.windowMs, maxRequests: Math.floor(limits.maxRequests / 2) });
}

/**
 * Generous rate limiter for read operations
 * @param {string} endpoint - Endpoint identifier
 * @returns {function} - Express middleware function
 */
function generousRateLimiter(endpoint) {
  const limits = RATE_LIMITS[endpoint] || RATE_LIMITS['api:public'];
  return createRateLimiter(endpoint, { windowMs: limits.windowMs, maxRequests: limits.maxRequests * 2 });
}

/**
 * Custom rate limiter with specific limits
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {function} - Express middleware function
 */
function customRateLimiter(maxRequests, windowMs) {
  return createRateLimiter('custom', { maxRequests, windowMs });
}

/**
 * Per-user rate limiter (only counts requests from authenticated users)
 * @param {string} endpoint - Endpoint identifier
 * @returns {function} - Express middleware function
 */
function userRateLimiter(endpoint) {
  return (req, res, next) => {
    if (!req.user) {
      // Not authenticated, skip rate limiting
      return next();
    }

    createRateLimiter(endpoint)(req, res, next);
  };
}

/**
 * IP-based rate limiter (ignores authentication)
 * @param {string} endpoint - Endpoint identifier
 * @returns {function} - Express middleware function
 */
function ipRateLimiter(endpoint) {
  return (req, res, next) => {
    const limits = RATE_LIMITS[endpoint] || RATE_LIMITS['api:public'];
    const clientId = req.ip || req.connection.remoteAddress;
    
    const result = checkRateLimit(clientId, endpoint, limits);

    res.set({
      'X-RateLimit-Limit': limits.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    });

    if (result.exceeded) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'Too many requests from this IP address',
        retryAfter
      });
    }

    next();
  };
}

/**
 * Sliding window rate limiter
 * More sophisticated approach where older requests are counted with less weight
 * @param {string} endpoint - Endpoint identifier
 * @returns {function} - Express middleware function
 */
function slidingWindowRateLimiter(endpoint) {
  return (req, res, next) => {
    try {
      const clientId = getClientId(req);
      const limits = RATE_LIMITS[endpoint] || RATE_LIMITS['api:public'];
      const key = `sliding:${clientId}:${endpoint}`;
      const now = Date.now();

      let data = rateLimitStore.get(key);
      
      if (!data) {
        data = { timestamps: [] };
      }

      // Remove timestamps outside the window
      data.timestamps = data.timestamps.filter(ts => now - ts < limits.windowMs);

      // Add current timestamp
      data.timestamps.push(now);

      rateLimitStore.set(key, data);

      // Check limit
      const exceeded = data.timestamps.length > limits.maxRequests;

      res.set({
        'X-RateLimit-Limit': limits.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, limits.maxRequests - data.timestamps.length).toString(),
        'X-RateLimit-Reset': Math.ceil((data.timestamps[0] + limits.windowMs) / 1000).toString()
      });

      if (exceeded) {
        const oldestTimestamp = data.timestamps[data.timestamps.length - limits.maxRequests];
        const retryAfter = Math.ceil((oldestTimestamp + limits.windowMs - now) / 1000);
        
        res.set('Retry-After', retryAfter.toString());
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter
        });
      }

      next();
    } catch (error) {
      logger.error('Sliding window rate limiter error', { error: error.message });
      next();
    }
  };
}

module.exports = {
  createRateLimiter,
  strictRateLimiter,
  generousRateLimiter,
  customRateLimiter,
  userRateLimiter,
  ipRateLimiter,
  slidingWindowRateLimiter,
  RATE_LIMITS,
  checkRateLimit,
  getClientId,
  cleanExpiredEntries
};
