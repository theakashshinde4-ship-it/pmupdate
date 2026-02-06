/**
 * Medication Routes
 * All medication-related endpoints
 */

const express = require('express');
const {
  searchMedications,
  getMedicationsByDiagnosis,
  getMedicationsBySymptom,
  getMedicationProtocol,
  getRecommendedMedications,
  getMedicationAlternatives,
  getPatientRecentMedications,
  getMedicationDetails,
  getMedicationCategories
} = require('../controllers/medicationController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const {
  searchMedicationsSchema,
  medicationsByDiagnosisSchema,
  medicationsBySymptomSchema,
  medicationProtocolSchema,
  patientRecentMedicationsSchema,
  medicationDetailsSchema
} = require('../validation/medicationSchemas');

const router = express.Router();

// Apply authentication to all routes
// Note: Some routes may be intentionally public for medication search
// Consider which routes should be public vs authenticated
router.use(authenticateToken);

// Named routes - MUST be BEFORE /:id routes
router.get('/search', joiValidate(searchMedicationsSchema), searchMedications);
router.get('/categories', getMedicationCategories);
router.post('/by-diagnosis', joiValidate(medicationsByDiagnosisSchema), getMedicationsByDiagnosis);
router.post('/by-symptom', joiValidate(medicationsBySymptomSchema), getMedicationsBySymptom);
router.get('/protocol/:type', joiValidate(medicationProtocolSchema), getMedicationProtocol);
router.get('/recommended', getRecommendedMedications);
router.get('/patient-recent/:patientId', joiValidate(patientRecentMedicationsSchema), getPatientRecentMedications);

// ID-based routes - AFTER named routes
router.get('/:id/alternatives', joiValidate(medicationDetailsSchema), getMedicationAlternatives);
router.get('/:id', joiValidate(medicationDetailsSchema), getMedicationDetails);

module.exports = router;
