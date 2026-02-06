const express = require('express');
const { logCompliance, getComplianceReport } = require('../controllers/complianceController');
const { validateId } = require('../middleware/validator');
const router = express.Router();

// POST /api/compliance/log
router.post('/log', logCompliance);

// GET /api/compliance/patients/:patientId/compliance-report
router.get('/patients/:patientId/compliance-report', validateId('patientId'), getComplianceReport);

module.exports = router;
