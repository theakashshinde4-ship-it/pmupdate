const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  enrollPatient,
  getPatientSubscriptions,
  trackSessionUsage
} = require('../controllers/subscriptionPackageController');
const joiValidate = require('../middleware/joiValidate');
const { createSubscriptionPackage, updateSubscriptionPackage } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all packages
router.get('/', getAllPackages);

// Get package by ID
router.get('/:id', getPackageById);

// Create package (admin and doctor)
router.post('/', requireRole('admin', 'doctor'), joiValidate(createSubscriptionPackage), createPackage);

// Update package
router.put('/:id', requireRole('admin', 'doctor'), joiValidate(updateSubscriptionPackage), updatePackage);

// Delete package
router.delete('/:id', requireRole('admin', 'doctor'), deletePackage);

// Enroll patient in package
router.post('/enroll', enrollPatient);

// Track session usage (decrement remaining sessions)
router.patch('/:id/session', trackSessionUsage);

// Get patient subscriptions
router.get('/patient/:patient_id', getPatientSubscriptions);

module.exports = router;
