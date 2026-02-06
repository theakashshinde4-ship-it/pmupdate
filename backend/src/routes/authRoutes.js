const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, register, verifyToken, refreshToken, logout, verifyCredentials } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

// Rate limiter for login endpoint - optimized for 600+ concurrent users
// Allows 50 login attempts per 15 minutes per IP (increased from 10)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 10 to 50 for 600+ concurrent users
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Skip successful requests to reduce load
  skip: (req) => {
    return req.method === 'GET' && req.path === '/api/auth/verify';
  }
});

// Rate limiter for register endpoint
// More lenient than login to allow admins to create multiple users
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many registration attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// In development skip the strict login limiter so local load-tests won't be blocked by single-IP throttling
if (env.nodeEnv === 'development') {
  router.post('/login', login);
  router.post('/verify-credentials', verifyCredentials);
} else {
  router.post('/login', loginLimiter, login);
  router.post('/verify-credentials', loginLimiter, verifyCredentials);
}

router.post('/register', registerLimiter, register);

// Token management endpoints
router.get('/verify', authenticateToken, verifyToken);
router.post('/refresh', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);

module.exports = router;

