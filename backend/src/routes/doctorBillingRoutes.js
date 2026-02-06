const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getDoctorBillingDashboard,
  createBillFromVisit
} = require('../controllers/doctorBillingController');

const router = express.Router();

// Get doctor's billing dashboard
router.get('/dashboard', authenticateToken, requireRole('doctor'), getDoctorBillingDashboard);

// Create bill from visit (for doctors)
router.post('/create-bill', authenticateToken, requireRole('doctor'), createBillFromVisit);

module.exports = router;
