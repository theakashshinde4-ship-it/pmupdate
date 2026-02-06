const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAllReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  deleteReferral,
  getReferralNetwork,
  addToNetwork,
  updateNetworkDoctor,
  deleteNetworkDoctor
} = require('../controllers/patientReferralController');
const joiValidate = require('../middleware/joiValidate');
const { createPatientReferral, updatePatientReferral } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Referral CRUD
router.get('/', getAllReferrals);
router.get('/:id', getReferralById);
router.post('/', joiValidate(createPatientReferral), createReferral);
router.put('/:id', joiValidate(updatePatientReferral), updateReferral);
router.delete('/:id', deleteReferral);

// Referral Network
router.get('/network/doctors', getReferralNetwork);
router.post('/network/doctors', addToNetwork);
router.put('/network/doctors/:id', updateNetworkDoctor);
router.delete('/network/doctors/:id', deleteNetworkDoctor);

module.exports = router;
