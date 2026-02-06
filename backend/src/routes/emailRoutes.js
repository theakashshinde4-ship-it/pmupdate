const express = require('express');
const rateLimit = require('express-rate-limit');
const enhancedEmailService = require('../services/enhancedEmailService');
const ApiResponse = require('../middleware/apiResponse');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for email sending
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Maximum 50 emails per hour
  message: {
    success: false,
    error: 'Too many email requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Test email configuration (admin only)
router.post('/test', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    const result = await enhancedEmailService.testEmailConfiguration(testEmail);
    
    if (result.success) {
      return ApiResponse.success(res, result, 'Email configuration test successful', 200);
    } else {
      return ApiResponse.error(res, result.message, 500);
    }
    
  } catch (error) {
    console.error('Email test error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send custom email (admin only)
router.post('/send', authenticateToken, requireRole('admin'), emailLimiter, async (req, res) => {
  try {
    const { to, subject, content, template } = req.body;
    
    // Validation
    if (!to || !subject || !content) {
      return ApiResponse.validationError(res, null, 'Recipient email, subject, and content are required');
    }
    
    const result = await enhancedEmailService.sendCustomEmail(to, subject, content, template);
    
    return ApiResponse.success(res, result, 'Email sent successfully', 200);
    
  } catch (error) {
    console.error('Send email error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send appointment confirmation
router.post('/appointment-confirmation', authenticateToken, emailLimiter, async (req, res) => {
  try {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      appointmentDate, 
      appointmentTime, 
      appointmentType 
    } = req.body;
    
    // Validation
    if (!patientEmail || !patientName || !doctorName || !appointmentDate || !appointmentTime) {
      return ApiResponse.validationError(res, null, 'Missing required fields for appointment confirmation');
    }
    
    const result = await enhancedEmailService.sendAppointmentConfirmation(
      patientEmail, 
      patientName, 
      doctorName, 
      appointmentDate, 
      appointmentTime, 
      appointmentType
    );
    
    return ApiResponse.success(res, result, 'Appointment confirmation email sent', 200);
    
  } catch (error) {
    console.error('Appointment confirmation error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send appointment reminder
router.post('/appointment-reminder', authenticateToken, emailLimiter, async (req, res) => {
  try {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      appointmentDate, 
      appointmentTime 
    } = req.body;
    
    // Validation
    if (!patientEmail || !patientName || !doctorName || !appointmentDate || !appointmentTime) {
      return ApiResponse.validationError(res, null, 'Missing required fields for appointment reminder');
    }
    
    const result = await enhancedEmailService.sendAppointmentReminder(
      patientEmail, 
      patientName, 
      doctorName, 
      appointmentDate, 
      appointmentTime
    );
    
    return ApiResponse.success(res, result, 'Appointment reminder email sent', 200);
    
  } catch (error) {
    console.error('Appointment reminder error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send payment confirmation
router.post('/payment-confirmation', authenticateToken, emailLimiter, async (req, res) => {
  try {
    const { 
      patientEmail, 
      patientName, 
      billNumber, 
      amount, 
      paymentMethod, 
      paymentDate 
    } = req.body;
    
    // Validation
    if (!patientEmail || !patientName || !billNumber || !amount || !paymentMethod) {
      return ApiResponse.validationError(res, null, 'Missing required fields for payment confirmation');
    }
    
    const result = await enhancedEmailService.sendPaymentConfirmation(
      patientEmail, 
      patientName, 
      billNumber, 
      amount, 
      paymentMethod, 
      paymentDate || new Date().toISOString().split('T')[0]
    );
    
    return ApiResponse.success(res, result, 'Payment confirmation email sent', 200);
    
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send welcome email
router.post('/welcome', authenticateToken, emailLimiter, async (req, res) => {
  try {
    const { userEmail, userName, userType } = req.body;
    
    // Validation
    if (!userEmail || !userName) {
      return ApiResponse.validationError(res, null, 'User email and name are required');
    }
    
    const result = await enhancedEmailService.sendWelcomeEmail(userEmail, userName, userType);
    
    return ApiResponse.success(res, result, 'Welcome email sent', 200);
    
  } catch (error) {
    console.error('Welcome email error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send prescription ready notification
router.post('/prescription-ready', authenticateToken, emailLimiter, async (req, res) => {
  try {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      prescriptionId, 
      readyDate 
    } = req.body;
    
    // Validation
    if (!patientEmail || !patientName || !doctorName || !prescriptionId) {
      return ApiResponse.validationError(res, null, 'Missing required fields for prescription notification');
    }
    
    const result = await enhancedEmailService.sendPrescriptionReady(
      patientEmail, 
      patientName, 
      doctorName, 
      prescriptionId, 
      readyDate || new Date().toISOString().split('T')[0]
    );
    
    return ApiResponse.success(res, result, 'Prescription ready email sent', 200);
    
  } catch (error) {
    console.error('Prescription ready error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send test results ready notification
router.post('/test-results-ready', authenticateToken, emailLimiter, async (req, res) => {
  try {
    const { 
      patientEmail, 
      patientName, 
      testName, 
      testDate, 
      reportAvailable 
    } = req.body;
    
    // Validation
    if (!patientEmail || !patientName || !testName) {
      return ApiResponse.validationError(res, null, 'Missing required fields for test results notification');
    }
    
    const result = await enhancedEmailService.sendTestResultsReady(
      patientEmail, 
      patientName, 
      testName, 
      testDate || new Date().toISOString().split('T')[0], 
      reportAvailable || new Date().toISOString().split('T')[0]
    );
    
    return ApiResponse.success(res, result, 'Test results ready email sent', 200);
    
  } catch (error) {
    console.error('Test results ready error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Get email statistics (admin only)
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await enhancedEmailService.getEmailStats(parseInt(days));
    
    if (result.success) {
      return ApiResponse.success(res, result, 'Email statistics retrieved', 200);
    } else {
      return ApiResponse.error(res, result.message, 500);
    }
    
  } catch (error) {
    console.error('Email stats error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

module.exports = router;
