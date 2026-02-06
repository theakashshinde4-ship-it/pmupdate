const express = require('express');
const {
  // New ABHA endpoints
  initiateRegistration,
  verifyRegistrationOtp,
  initiateLogin,
  verifyLoginOtp,
  getAbhaStatus,
  getAbhaStats,
  getAbhaDashboard,
  updateHfrId,
  getAbhaRecords,
  unlinkAbha,

  // Legacy endpoints
  enroll,
  link,
  unlink,
  status
} = require('../controllers/abhaController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const {
  initiateAbhaRegistration,
  verifyAbhaOtp,
  initiateAbhaLogin,
  unlinkAbha: unlinkAbhaSchema
} = require('../validation/commonSchemas');

const router = express.Router();

// New ABHA registration flow (using ABDM v3 APIs)
router.post('/register/init', authenticateToken, joiValidate(initiateAbhaRegistration), initiateRegistration);
router.post('/register/verify-otp', authenticateToken, joiValidate(verifyAbhaOtp), verifyRegistrationOtp);

// New ABHA login flow (for existing ABHA accounts)
router.post('/login/init', authenticateToken, joiValidate(initiateAbhaLogin), initiateLogin);
router.post('/login/verify-otp', authenticateToken, joiValidate(verifyAbhaOtp), verifyLoginOtp);

// ABHA account management
router.get('/status/:patient_id', authenticateToken, getAbhaStatus);
router.get('/stats', authenticateToken, getAbhaStats);
// Dashboard and HFR management
router.get('/dashboard', authenticateToken, getAbhaDashboard);
router.patch('/hfr-id', authenticateToken, updateHfrId);
router.get('/records/:patient_id', authenticateToken, getAbhaRecords);
router.post('/unlink', authenticateToken, joiValidate(unlinkAbhaSchema), unlinkAbha);

// Legacy endpoints (for backward compatibility - deprecated)
router.post('/enroll', authenticateToken, enroll);
router.post('/link', authenticateToken, link);
router.get('/status/:patientId', authenticateToken, status);

module.exports = router;
