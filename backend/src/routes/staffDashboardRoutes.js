const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getStaffDashboard,
  getStaffStats,
  getPatientsInQueue,
  updatePatientQueueStatus,
  assignPatientToDoctor
} = require('../controllers/staffDashboardController');

const router = express.Router();

// Batched dashboard endpoint (reduces parallel calls)
router.get('/', authenticateToken, getStaffDashboard);

// Get staff dashboard statistics
router.get('/stats', authenticateToken, getStaffStats);

// Get patients in queue
router.get('/queue', authenticateToken, getPatientsInQueue);

// Update patient queue status
router.put('/patients/:id/queue-status', authenticateToken, updatePatientQueueStatus);

// Assign patient to doctor
router.put('/patients/:id/assign-doctor', authenticateToken, assignPatientToDoctor);

module.exports = router;
