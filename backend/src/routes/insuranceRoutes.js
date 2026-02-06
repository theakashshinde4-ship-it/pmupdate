const express = require('express');
const {
  getPatientInsurance,
  getInsurancePolicy,
  createInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy
} = require('../controllers/insuranceController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequired, validateId } = require('../middleware/validator');
const { auditLogger } = require('../middleware/auditLogger');
const joiValidate = require('../middleware/joiValidate');
const { createInsurancePolicy: createInsurancePolicySchema, updateInsurancePolicy: updateInsurancePolicySchema } = require('../validation/commonSchemas');

const router = express.Router();

router.get('/patient/:patientId', authenticateToken, validateId('patientId'), getPatientInsurance);

// Get a single insurance policy
router.get('/:id', authenticateToken, validateId('id'), getInsurancePolicy);

router.post(
  '/',
  authenticateToken,
  joiValidate(createInsurancePolicySchema),
  auditLogger('INSURANCE'),
  createInsurancePolicy
);

// Update an insurance policy
router.put(
  '/:id',
  authenticateToken,
  validateId('id'),
  joiValidate(updateInsurancePolicySchema),
  auditLogger('INSURANCE'),
  updateInsurancePolicy
);

// Delete an insurance policy
router.delete(
  '/:id',
  authenticateToken,
  validateId('id'),
  auditLogger('INSURANCE'),
  deleteInsurancePolicy
);

module.exports = router;

