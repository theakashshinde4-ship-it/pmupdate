const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const {
  searchPatients,
  registerNewPatientAndQueue,
  addExistingPatientToQueue,
  getQueueByDate,
  getAvailableDoctors
} = require('../controllers/patientQueueController');

const router = express.Router();

// Search patients for queue
router.get('/search-patients', authenticateToken, searchPatients);

// Register new patient and add to queue
router.post('/register-and-queue', authenticateToken, auditLogger('PATIENT_QUEUE'), registerNewPatientAndQueue);

// Add existing patient to queue
router.post('/add-to-queue', authenticateToken, auditLogger('PATIENT_QUEUE'), addExistingPatientToQueue);

// Get queue by date
router.get('/queue', authenticateToken, getQueueByDate);

// Get available doctors
router.get('/doctors', authenticateToken, getAvailableDoctors);

module.exports = router;
