const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const axios = require('axios');
const { getDb } = require('./config/db');
const { authenticateToken, requireRole } = require('./middleware/auth');
const { performanceMonitor } = require('./middleware/performanceMonitor');
const { requestQueue } = require('./middleware/requestQueue');
const { cacheReferenceData } = require('./middleware/cacheHeaders');
const { etagMiddleware } = require('./middleware/etagMiddleware');
const env = require('./config/env');
const { correlationIdMiddleware } = require('./platform/http/correlationId');

// Performance monitoring
const cluster = require('cluster');

const authRoutes = require('./modules/auth/auth.routes');
const otpAuthRoutes = require('./modules/otp-auth/otpAuth.routes');
const emailRoutes = require('./modules/email/email.routes');
const userRoutes = require('./modules/users/users.routes');
const patientRoutes = require('./modules/patients/patients.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const appointmentIntentRoutes = require('./modules/appointment-intents/appointmentIntents.routes');
const diagnosisSuggestionRoutes = require('./modules/diagnosis-suggestion/diagnosisSuggestion.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescriptions.routes');
const billRoutes = require('./modules/bills/bills.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const abhaRoutes = require('./modules/abha/abha.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const labRoutes = require('./modules/labs/labs.routes');
const patientDataRoutes = require('./modules/patient-data/patientData.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const doctorRoutes = require('./modules/doctors/doctors.routes');
const clinicRoutes = require('./modules/clinics/clinics.routes');
const permissionRoutes = require('./modules/permissions/permissions.routes');
const backupRoutes = require('./modules/backup/backup.routes');
const familyHistoryRoutes = require('./modules/family-history/familyHistory.routes');
const labTemplateRoutes = require('./modules/lab-templates/labTemplates.routes');
const insuranceRoutes = require('./modules/insurance/insurance.routes');
const searchRoutes = require('./modules/search/search.routes');
const receiptTemplateRoutes = require('./modules/receipt-templates/receiptTemplates.routes');
const servicesRoutes = require('./modules/services/services.routes');
const medicalCertificateRoutes = require('./modules/medical-certificates/medicalCertificates.routes');
const enhancedAnalyticsRoutes = require('./modules/enhanced-analytics/enhancedAnalytics.routes');
const symptomsTemplatesRoutes = require('./modules/symptoms-templates/symptomsTemplates.routes');
const staffBillingRoutes = require('./modules/staff-billing/staffBilling.routes');
const doctorBillingRoutes = require('./modules/doctor-billing/doctorBilling.routes');
const patientQueueRoutes = require('./modules/patient-queue/patientQueue.routes');
const prescriptionTemplatesRoutes = require('./modules/prescription-templates/prescriptionTemplates.routes');
const doctorAvailabilityRoutes = require('./modules/doctor-availability/doctorAvailability.routes');
const symptomMedicationRoutes = require('./modules/symptom-medications/symptomMedications.routes');
const diagnosisTemplateRoutes = require('./modules/diagnosis-templates/diagnosisTemplates.routes');
const medicationsTemplateRoutes = require('./modules/medications-templates/medicationsTemplates.routes');
const specialtyRoutes = require('./modules/specialties/specialties.routes');
const vipPatientRoutes = require('./modules/vip-patients/vipPatients.routes');
const whatsappQRRoutes = require('./modules/whatsapp-qr/whatsappQR.routes');
const icdRoutes = require('./modules/icd/icd.routes');
const diagnosisRoutes = require('./modules/diagnosis/diagnosis.routes');
const symptomsRoutes = require('./modules/symptoms/symptoms.routes');
const medicineRoutes = require('./modules/medicines/medicines.routes');
const allergiesRoutes = require('./modules/allergies/allergies.routes');
const adviceRoutes = require('./modules/advice/advice.routes');
const vitalsRoutes = require('./modules/vitals/vitals.routes');
const queueRoutes = require('./modules/queue/queue.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const clinicalRoutes = require('./modules/clinical/clinical.routes');
const injectionTemplateRoutes = require('./modules/injection-templates/injectionTemplates.routes');
const subscriptionPackageRoutes = require('./modules/subscription-packages/subscriptionPackages.routes');
const patientReferralRoutes = require('./modules/patient-referrals/patientReferrals.routes');
const pdfGeneratorRoutes = require('./modules/pdf/pdf.routes');
const complianceRoutes = require('./modules/compliance/compliance.routes');
const myGenieRoutes = require('./modules/my-genie/myGenie.routes');
const googleReviewsRoutes = require('./modules/google-reviews/googleReviews.routes');
const snomedRoutes = require('./modules/snomed/snomed.routes');
const snomedLocalRoutes = require('./modules/snomed-local/snomedLocal.routes');
const medicationRoutes = require('./modules/medications/medications.routes');
const autoStubRoutes = require('./modules/auto-stubs/autoStubs.routes');
const suggestionRoutes = require('./modules/suggestions/suggestions.routes');
const medicalRoutes = require('./modules/medical/medical.routes');
const smartPrescriptionRoutes = require('./modules/smart-prescription/smartPrescription.routes');
const opdRoutes = require('./modules/opd/opd.routes');
const qrRoutes = require('./modules/qr/qr.routes');
const logsRoutes = require('./modules/logs/logs.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const staffDashboardRoutes = require('./modules/staff-dashboard/staffDashboard.routes');
const padConfigurationRoutes = require('./modules/pad-config/padConfig.routes');
const medicalHistoryRoutes = require('./modules/medical-history/medicalHistory.routes');

const app = express();
app.set("trust proxy", 1); // Enable trust proxy for nginx reverse proxy

// Security and parsing middleware
app.use(correlationIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Enforce HSTS in production (requires HTTPS)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true, preload: true }));
}

// CORS configuration - more restrictive
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.length)
      ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
      : [
          process.env.FRONTEND_URL,
          process.env.CORS_ORIGIN,
          ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
        ].filter(Boolean);

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        return callback(new Error('CORS not configured'));
      }
      return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
    }
    // Development: allow any origin or fallbacks above
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'cache-control'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Response compression for faster API responses
app.use(compression());

// Cookie parser for general use
app.use(cookieParser());

// CSRF Protection removed - csurf package deprecated due to security vulnerabilities

// Simple logging: only method, URL, and status code
app.use(morgan(':method :url :status - :response-time ms'));

// Performance monitoring middleware
app.use(performanceMonitor);

// Request queue middleware for high concurrency (600+ users)
if (env.nodeEnv === 'production' && process.env.ENABLE_REQUEST_QUEUE === 'true') {
  app.use('/api', requestQueue({
    queueType: 'general',
    maxConcurrent: 200,
    timeout: 30000
  }));
  
  app.use('/api/auth', requestQueue({
    queueType: 'auth',
    maxConcurrent: 100,
    timeout: 15000,
    priority: 'high'
  }));
  
  app.use('/api/patients', requestQueue({
    queueType: 'database',
    maxConcurrent: 150,
    timeout: 25000
  }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
const { sanitizeInput } = require('./middleware/validator');
app.use(sanitizeInput);

// Swagger/OpenAPI documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Patient Management API Docs',
  swaggerOptions: {
    deepLinking: true,
  }
}));

// JSON spec endpoint
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rate limiting - optimized for high concurrency
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Performance optimizations
    skip: (req) => {
      // Skip rate limiting for health checks and static assets
      return req.path === '/health' || req.path.startsWith('/uploads');
    }
    // Uses default MemoryStore which implements the Store interface
  });
  app.use(limiter);
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/otp-auth', otpAuthRoutes);
app.use('/api/emails', emailRoutes);
// Do NOT enforce admin here — `userRoutes` contains its own per-route role checks
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/appointment-intents', appointmentIntentRoutes);
app.use('/api/diagnosis-suggestion', authenticateToken, diagnosisSuggestionRoutes);
app.use('/api/prescriptions', authenticateToken, prescriptionRoutes);
app.use('/api/bills', authenticateToken, billRoutes);
app.use('/api/staff-billing', authenticateToken, staffBillingRoutes);
app.use('/api/doctor-billing', authenticateToken, doctorBillingRoutes);
app.use('/api/patient-queue', authenticateToken, patientQueueRoutes);
app.use('/api/services', authenticateToken, servicesRoutes);
app.use('/api/notify', authenticateToken, notificationRoutes);
// Compliance logs
app.use('/api/compliance', authenticateToken, complianceRoutes);
// Mount ABHA routes. In development allow unauthenticated access for smoke-testing.
// (ABHA mounting continues below)
// Mount ABHA routes. In development allow unauthenticated access for smoke-testing.
if (env.nodeEnv === 'development') {
  app.use('/api/abha', abhaRoutes);
} else {
  app.use('/api/abha', authenticateToken, abhaRoutes);
}
app.use('/api/analytics', authenticateToken, requireRole('admin'), analyticsRoutes);
app.use('/api/labs', authenticateToken, labRoutes);
app.use('/api/lab-investigations', authenticateToken, labRoutes); // Alias for frontend compatibility
app.use('/api/patient-data', authenticateToken, patientDataRoutes);
app.use('/api/audit', authenticateToken, requireRole('admin'), auditRoutes);
app.use('/api/doctors', authenticateToken, doctorRoutes);
app.use('/api/clinics', authenticateToken, clinicRoutes);
app.use('/api/permissions', authenticateToken, requireRole('admin'), permissionRoutes);
app.use('/api/backup', authenticateToken, requireRole('admin'), backupRoutes);
app.use('/api/family-history', authenticateToken, familyHistoryRoutes);
app.use('/api/lab-templates', authenticateToken, labTemplateRoutes);
app.use('/api/insurance', authenticateToken, insuranceRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api/receipt-templates', authenticateToken, receiptTemplateRoutes);
app.use('/api/medical-certificates', authenticateToken, medicalCertificateRoutes);
app.use('/api/enhanced-analytics', authenticateToken, requireRole('admin', 'doctor'), enhancedAnalyticsRoutes);
app.use('/api/symptoms-templates', authenticateToken, symptomsTemplatesRoutes);
app.use('/api/prescription-templates', authenticateToken, prescriptionTemplatesRoutes);
app.use('/api/doctor-availability', doctorAvailabilityRoutes);
app.use('/api/symptom-medications', authenticateToken, symptomMedicationRoutes);
app.use('/api/diagnosis-templates', authenticateToken, diagnosisTemplateRoutes);
app.use('/api/medications-templates', authenticateToken, medicationsTemplateRoutes);
app.use('/api/specialty', authenticateToken, specialtyRoutes);
app.use('/api/vip-patients', authenticateToken, vipPatientRoutes);
app.use('/api/whatsapp', authenticateToken, whatsappQRRoutes);
app.use('/api/qr-code', authenticateToken, whatsappQRRoutes);
app.use('/api/icd', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), icdRoutes);
app.use('/api/diagnoses', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), diagnosisRoutes);
app.use('/api/symptoms', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), symptomsRoutes);
app.use('/api/medicines', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), medicineRoutes);
app.use('/api/allergies', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), allergiesRoutes);
app.use('/api/advice', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), adviceRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/suggestions', authenticateToken, suggestionRoutes);
app.use('/api/medical', authenticateToken, medicalRoutes);
app.use('/api/smart-prescription', authenticateToken, smartPrescriptionRoutes);
app.use('/api/opd', authenticateToken, opdRoutes);
app.use('/api/qr', qrRoutes); // Mixed - some public, some protected routes
app.use('/api/queue', queueRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api/clinical', authenticateToken, clinicalRoutes);
app.use('/api/injection-templates', authenticateToken, injectionTemplateRoutes);
app.use('/api/subscription-packages', authenticateToken, subscriptionPackageRoutes);
app.use('/api/patient-referrals', authenticateToken, patientReferralRoutes);
app.use('/api/pdf', pdfGeneratorRoutes); // Auth handled within routes (bill is public for sharing)
app.use('/api/my-genie', authenticateToken, myGenieRoutes);
app.use('/api/google-reviews', googleReviewsRoutes); // Public endpoint - no auth needed
app.use('/api/snomed', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), snomedRoutes);
app.use('/api/snomed-local', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), snomedLocalRoutes);
app.use('/api/medications', authenticateToken, cacheReferenceData({ maxAge: 600 }), etagMiddleware(), medicationRoutes); // Protected endpoint - authentication required for safety
app.use('/api/logs', logsRoutes); // Logging endpoint - mixed public/protected routes
app.use('/api/staff-dashboard', authenticateToken, staffDashboardRoutes); // Staff dashboard routes
app.use('/api/pad-config', padConfigurationRoutes); // Prescription pad configuration routes
app.use('/api/medical-history', medicalHistoryRoutes); // Patient medical history for prescription pad

// CSRF Token Endpoint - Disabled due to csurf deprecation
// Consider implementing alternative CSRF protection if needed
app.get('/api/csrf-token', (req, res) => {
  res.json({ message: 'CSRF protection temporarily disabled' });
});

// Performance monitoring endpoint
app.get('/api/performance', authenticateToken, requireRole('admin'), async (req, res) => {
  const { getStats } = require('./middleware/performanceMonitor');
  const { getCacheStats } = require('./middleware/cache');
  const { getPoolStats } = require('./config/db');
  const { getQueueStats } = require('./middleware/requestQueue');
  
  const performanceStats = getStats();
  const cacheStats = getCacheStats();
  const poolStats = getPoolStats();
  const queueStats = await getQueueStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    performance: performanceStats,
    cache: cacheStats,
    database: poolStats,
    queues: queueStats,
    cluster: {
      isWorker: cluster.isWorker,
      workerId: cluster.worker ? cluster.worker.id : null
    }
  });
});

app.get('/livez', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/readyz', async (req, res) => {
  const result = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      db: { ok: false, error: null },
      pool: { stats: null }
    }
  };

  try {
    const db = getDb();
    await db.execute('SELECT 1');
    result.checks.db.ok = true;

    const { getPoolStats } = require('./config/db');
    result.checks.pool.stats = getPoolStats();
  } catch (e) {
    result.checks.db.ok = false;
    result.checks.db.error = e.message || 'DB check failed';
    result.status = 'degraded';
  }

  const httpCode = result.checks.db.ok === true ? 200 : 503;
  res.status(httpCode).json(result);
});

app.get('/health', async (req, res) => {
  const result = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      db: { ok: false, error: null },
      snowstorm: { ok: false, error: null },
      pool: { stats: null }
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  // DB check
  try {
    const db = getDb();
    await db.execute('SELECT 1');
    result.checks.db.ok = true;
    
    // Add pool stats for monitoring
    const { getPoolStats } = require('./config/db');
    result.checks.pool.stats = getPoolStats();
  } catch (e) {
    result.checks.db.ok = false;
    result.checks.db.error = e.message || 'DB check failed';
    result.status = 'degraded';
  }

  const requireSnowstorm = String(process.env.REQUIRE_SNOWSTORM_HEALTH || '').toLowerCase() === 'true';

  // Snowstorm check (browser API or base URL)
  const snowstormConfigured = Boolean(process.env.SNOMED_SNOWSTORM_BASE_URL);
  if (!snowstormConfigured && !requireSnowstorm) {
    result.checks.snowstorm.ok = true;
  } else {
    const base = (process.env.SNOMED_SNOWSTORM_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    try {
      // Try a lightweight endpoint; fall back to root
      const url = `${base}/browser/MAIN/concepts?limit=1`;
      await axios.get(url, { timeout: 3000 });
      result.checks.snowstorm.ok = true;
    } catch (e1) {
      try {
        await axios.get(base, { timeout: 3000 });
        result.checks.snowstorm.ok = true;
      } catch (e2) {
        result.checks.snowstorm.error = e1?.message || e2?.message || 'Snowstorm check failed';
        // Only mark overall health degraded if Snowstorm is explicitly required
        if (requireSnowstorm) {
          result.status = result.status === 'ok' ? 'degraded' : result.status;
        }
      }
    }
  }
  const dbOk = result.checks.db.ok === true;
  const snowstormOk = result.checks.snowstorm.ok === true;

  // If Snowstorm is optional, don't mark overall status degraded due to Snowstorm failures
  if (dbOk && !requireSnowstorm) {
    result.status = 'ok';
  }

  // Debug info in non-production
  if (env.nodeEnv !== 'production') {
    result.debug = {
      nodeEnv: env.nodeEnv,
      requireSnowstorm,
      snowstormConfigured,
      snowstormBase: process.env.SNOMED_SNOWSTORM_BASE_URL || null
    };
  }

  const httpCode = dbOk && (!requireSnowstorm || snowstormOk) ? 200 : 503;
  res.status(httpCode).json(result);
});

// Mount auto-generated stubs for frontend-only endpoints (returns 501) - MUST be just before 404/error handlers
app.use('/api', autoStubRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;

