const express = require('express');
const router = express.Router();
const controller = require('../controllers/qrController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/availability/:doctorId', controller.getDoctorAvailability);
router.get('/doctor/:doctorId', controller.getDoctorQRInfo);
router.post('/book/:doctorId', controller.bookViaQR);

// Protected routes (authentication required)
router.use(authenticateToken);

// POST /api/qr/generate/:doctorId - Generate QR code for doctor
router.post('/generate/:doctorId', controller.generateDoctorQR);

// GET /api/qr/all - Get all QR codes (admin only)
router.get('/all', controller.getAllQRCodes);

// PUT /api/qr/toggle/:doctorId - Toggle QR code active status
router.put('/toggle/:doctorId', controller.toggleQRStatus);

module.exports = router;
