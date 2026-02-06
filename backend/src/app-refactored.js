/**
 * Updated App.js - Clean, Minimal Setup
 * Bootstrap and configure Express app
 * 
 * Responsibilities:
 * - Register middleware
 * - Mount routes
 * - Setup error handling
 * - Configure security headers
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { logger } = require('./monitoring/logger');
const errorHandler = require('./middleware/errorHandler.middleware');
const { asyncHandler } = require('./core/decorators/asyncHandler');

// Create Express app
const app = express();

// ============ SECURITY MIDDLEWARE ============
app.use(helmet()); // Security headers

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false // Disable X-RateLimit-* headers
});
app.use('/api/', limiter);

// ============ BODY PARSING MIDDLEWARE ============
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// ============ LOGGING MIDDLEWARE ============
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// ============ CUSTOM MIDDLEWARE ============
const { authMiddleware } = require('./middleware/auth.middleware');
const { validateInput } = require('./middleware/validation.middleware');

// Add correlation ID for request tracking
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Correlation-ID', req.correlationId);
  next();
});

// ============ ROUTES ============

// Health check endpoint
app.get('/health', asyncHandler(async (req, res) => {
  const { getDatabase, getRedisClient } = require('./config/database');
  
  const db = getDatabase();
  const redis = getRedisClient();

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'unknown',
      cache: 'unknown'
    }
  };

  // Check database
  try {
    await db.execute('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis
  if (redis) {
    try {
      await redis.ping();
      health.services.cache = 'healthy';
    } catch (error) {
      health.services.cache = 'unhealthy';
      health.status = 'degraded';
    }
  } else {
    health.services.cache = 'disabled';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}));

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Patient Management System API',
    version: '1.0.0',
    endpoints: {
      patients: '/api/patients',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      prescriptions: '/api/prescriptions',
      bills: '/api/bills'
    },
    docs: '/swagger-ui.html'
  });
});

// Patient routes (example)
const patientRoutes = require('./modules/patient/patient.routes');
app.use('/api/patients', patientRoutes);

// Other routes would be mounted similarly
// app.use('/api/doctors', doctorRoutes);
// app.use('/api/appointments', appointmentRoutes);
// etc...

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// ============ ERROR HANDLING ============
// Must be last middleware
app.use(errorHandler);

module.exports = app;
