// src/routes/patientRoutes.js
const express = require('express');
const {
  listPatients,
  getPatient,
  addPatient,
  updatePatient,
  deletePatient,
  mergePatients
} = require('../modules/patients/patients.controller');
const {
  getPatientsInQueue,
  updatePatientQueueStatus,
  assignPatientToDoctor
} = require('../controllers/staffDashboardController');
const { listTimeline } = require('../controllers/patientDataController');
const { getComplianceReport } = require('../controllers/complianceController');

// ✅ SAHI IMPORT - Destructuring se dono middleware ek saath
const { authenticateToken, requireRole } = require('../middleware/auth'); // requireRole future ke liye bhi ready
const { authorize } = require('../platform/security/authorize');

const { validateId } = require('../middleware/validator');
const joiValidate = require('../middleware/joiValidate');
const { createPatient, updatePatient: updatePatientSchema } = require('../validation/patientSchemas');
const { cacheMiddleware } = require('../middleware/cache');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Make patient creation and search public for testing
router.post('/',
  joiValidate(createPatient),
  addPatient
);

// Make patient search public for quick check-in
router.get('/', cacheMiddleware(2 * 60 * 1000), listPatients);

// All other routes require authentication
router.use(authenticateToken);

// ⚠️ IMPORTANT: /merge must come BEFORE /:id routes to avoid conflict
router.post('/merge', authorize('patients.merge'), auditLogger('PATIENT'), mergePatients);

// Queue management endpoints for patients
router.get('/queue', authorize('patients.view'), getPatientsInQueue);
router.put('/:id/queue-status', authorize('patients.edit'), validateId('id'), updatePatientQueueStatus);
router.put('/:id/assign-doctor', authorize('patients.edit'), validateId('id'), assignPatientToDoctor);

// Get single patient by ID
router.get('/:id', authorize('patients.view'), validateId('id'), cacheMiddleware(2 * 60 * 1000), getPatient);

// Update patient
router.put('/:id',
  authorize('patients.edit'),
  validateId('id'),
  joiValidate(updatePatientSchema),
  auditLogger('PATIENT'),
  updatePatient
);

// Delete patient
router.delete('/:id', authorize('patients.delete'), validateId('id'), auditLogger('PATIENT'), deletePatient);

// Patient timeline endpoint
router.get('/:id/timeline', authorize('patients.view'), validateId('id'), listTimeline);

// Patient compliance report endpoint
router.get('/:id/compliance-report', authorize('patients.view'), validateId('id'), getComplianceReport);

module.exports = router;