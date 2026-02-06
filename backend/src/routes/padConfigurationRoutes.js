/**
 * Pad Configuration Routes
 * Routes for prescription pad settings and customization
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getPadConfiguration,
  savePadConfiguration,
  saveFieldOrder,
  getPatientHistoryForPad,
  addChronicCondition,
  addSurgicalHistory
} = require('../controllers/padConfigurationController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/pad-config
 * @desc Get prescription pad configuration for current doctor
 * @access Private
 */
router.get('/', getPadConfiguration);

/**
 * @route POST /api/pad-config
 * @desc Save/Update prescription pad configuration
 * @access Private
 */
router.post('/', savePadConfiguration);

/**
 * @route POST /api/pad-config/field-order
 * @desc Save field order and section configuration
 * @access Private
 */
router.post('/field-order', saveFieldOrder);

/**
 * @route GET /api/pad-config/patient-history/:patientId
 * @desc Get patient medical history summary for prescription pad
 * @access Private
 */
router.get('/patient-history/:patientId', getPatientHistoryForPad);

/**
 * @route POST /api/pad-config/chronic-condition/:patientId
 * @desc Add chronic condition to patient
 * @access Private
 */
router.post('/chronic-condition/:patientId', addChronicCondition);

/**
 * @route POST /api/pad-config/surgical-history/:patientId
 * @desc Add surgical history to patient
 * @access Private
 */
router.post('/surgical-history/:patientId', addSurgicalHistory);

module.exports = router;
