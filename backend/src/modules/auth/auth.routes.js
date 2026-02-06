const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  login,
  register,
  verifyToken,
  refreshToken,
  logout,
  verifyCredentials
} = require('./auth.controller');
const { authenticateToken } = require('../../middleware/auth');
const env = require('../../config/env');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: (req) => {
    return req.method === 'GET' && req.path === '/api/auth/verify';
  }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many registration attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

if (env.nodeEnv === 'development') {
  router.post('/login', login);
  router.post('/verify-credentials', verifyCredentials);
} else {
  router.post('/login', loginLimiter, login);
  router.post('/verify-credentials', loginLimiter, verifyCredentials);
}

router.post('/register', registerLimiter, register);

router.get('/verify', authenticateToken, verifyToken);
router.post('/refresh', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);

module.exports = router;
