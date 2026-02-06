const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const {
  getCompletedVisits,
  createBillFromVisit
} = require('../controllers/staffBillingController');

const router = express.Router();

// Get completed visits for billing
router.get('/completed-visits', authenticateToken, getCompletedVisits);

// Create bill from visit
router.post('/create-bill', authenticateToken, auditLogger('BILL'), createBillFromVisit);

module.exports = router;
