// src/routes/prescriptionRoutes.js
const express = require('express');
const {
  listPrescriptions,
  addPrescription,
  getPrescription,
  generatePrescriptionPDF,
  getLastPrescription,
  savePrescriptionDiagnoses,
  getPrescriptionDiagnoses,
  addMedicationsToPrescription,
  searchPrescriptions,
  endVisit
} = require('../controllers/prescriptionController');
const { getDb } = require('../config/db');

const {
  saveDraft,
  getDraft,
  deleteDraft,
  listDrafts
} = require('../controllers/prescriptionDraftController');

// ✅ SAHI IMPORT - Destructuring se authenticateToken le rahe hain
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../platform/security/authorize');
const { validateId } = require('../middleware/validator');

const { auditLogger } = require('../middleware/auditLogger');
const joiValidate = require('../middleware/joiValidate');
const { createPrescription, updatePrescription, saveDiagnoses } = require('../validation/prescriptionSchemas');

const router = express.Router();

// Public routes (no auth required)
router.get('/pdf/:prescriptionId', generatePrescriptionPDF);

// All other routes require authentication
router.use(authenticateToken);

// Draft routes (must be before other routes to avoid conflicts)
router.get('/drafts', authorize('prescriptions.view'), listDrafts);
router.get('/draft', authorize('prescriptions.view'), getDraft);
router.post('/draft', authorize('prescriptions.edit'), saveDraft);
router.delete('/draft/:id', authorize('prescriptions.edit'), validateId('id'), deleteDraft);

// Collection search (date range + optional filters)
router.get('/', authorize('prescriptions.view'), searchPrescriptions);

// Get prescription detail by ID
router.get('/detail/:id', authorize('prescriptions.view'), validateId('id'), getPrescription);

// ICD diagnoses for a prescription (define BEFORE generic routes)
router.get('/detail/:id/diagnoses', authorize('prescriptions.view'), validateId('id'), getPrescriptionDiagnoses);
router.post('/detail/:id/diagnoses', authorize('prescriptions.edit'), validateId('id'), joiValidate(saveDiagnoses), auditLogger('PRESCRIPTION'), savePrescriptionDiagnoses);

// Add medications to existing prescription
router.post('/:prescriptionId/add-medications', authorize('prescriptions.edit'), validateId('prescriptionId'), auditLogger('PRESCRIPTION'), addMedicationsToPrescription);

// Get last prescription for a patient
router.get('/patient/:patientId/last', authorize('prescriptions.view'), validateId('patientId'), getLastPrescription);

// List all prescriptions for a patient
router.get('/:patientId', authorize('prescriptions.view'), validateId('patientId'), listPrescriptions);

// Create new prescription
router.post('/', authorize('prescriptions.create'), joiValidate(createPrescription), auditLogger('PRESCRIPTION'), addPrescription);

// End patient visit without prescription
router.post('/end-visit', authorize('prescriptions.create'), auditLogger('PRESCRIPTION'), endVisit);

module.exports = router;