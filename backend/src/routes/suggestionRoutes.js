/**
 * Suggestion Routes
 * API routes for getting symptom-based medication, diagnosis, and dosage suggestions
 */

const express = require('express');
const router = express.Router();
const {
  getSymptomBasedSuggestions,
  getDiagnosisMedicationsAndDosages,
  getPrescriptionSuggestion
} = require('../controllers/suggestionController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/suggestions/symptom-based
 * @desc Get medications and diagnoses based on symptoms
 * @access Private
 * @body {
 *   symptoms: string[],
 *   patient_id?: number,
 *   age?: number,
 *   gender?: 'M' | 'F' | 'O' | 'U',
 *   patient_weight?: number,
 *   allergies?: string[],
 *   limit?: number
 * }
 */
router.post('/symptom-based', authenticateToken, getSymptomBasedSuggestions);

/**
 * @route GET /api/suggestions/diagnosis/:icd_code
 * @desc Get medications and dosages for a specific diagnosis
 * @access Private
 * @param {string} icd_code - ICD-10 code
 * @query {
 *   patient_id?: number,
 *   age?: number,
 *   gender?: 'M' | 'F' | 'O' | 'U',
 *   weight?: number,
 *   limit?: number
 * }
 */
router.get('/diagnosis/:icd_code', authenticateToken, getDiagnosisMedicationsAndDosages);

/**
 * @route POST /api/suggestions/prescription
 * @desc Get complete prescription suggestion with symptoms and diagnoses
 * @access Private
 * @body {
 *   symptoms: string[],
 *   diagnoses: string[],
 *   patient_id?: number,
 *   age?: number,
 *   gender?: string,
 *   weight?: number,
 *   allergies?: string[],
 *   limit?: number
 * }
 */
router.post('/prescription', authenticateToken, getPrescriptionSuggestion);

module.exports = router;
