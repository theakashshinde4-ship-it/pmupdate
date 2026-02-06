/**
 * Patient Module - Routes
 * Defines all patient endpoints
 */
const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../../core/decorators/asyncHandler');
const { validateInput } = require('../../middleware/validation.middleware');
const { authMiddleware, requireRole } = require('../../middleware/auth.middleware');

const PatientController = require('./patient.controller');
const {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema
} = require('./patient.validation');

// Public endpoints
router.get(
  '/public/search',
  asyncHandler(PatientController.searchPatients)
);

// Protected endpoints - Require authentication
router.use(authMiddleware);

// List patients with filters
router.get(
  '/',
  validateInput(listPatientsSchema, 'query'),
  asyncHandler(PatientController.listPatients)
);

// Get patient by ID
router.get(
  '/:id',
  asyncHandler(PatientController.getPatient)
);

// Get patient by patient_id (unique identifier)
router.get(
  '/patient-id/:patient_id',
  asyncHandler(PatientController.getPatientByPatientId)
);

// Create patient - Doctor or Admin only
router.post(
  '/',
  requireRole(['doctor', 'admin']),
  validateInput(createPatientSchema, 'body'),
  asyncHandler(PatientController.createPatient)
);

// Update patient - Doctor or Admin only
router.put(
  '/:id',
  requireRole(['doctor', 'admin']),
  validateInput(updatePatientSchema, 'body'),
  asyncHandler(PatientController.updatePatient)
);

// Delete patient (soft delete) - Admin only
router.delete(
  '/:id',
  requireRole(['admin']),
  asyncHandler(PatientController.deletePatient)
);

// Merge duplicate patients - Admin only
router.post(
  '/merge/duplicates',
  requireRole(['admin']),
  asyncHandler(PatientController.mergeDuplicatePatients)
);

// Get patient statistics
router.get(
  '/stats/overview',
  requireRole(['doctor', 'admin']),
  asyncHandler(PatientController.getPatientStats)
);

module.exports = router;
