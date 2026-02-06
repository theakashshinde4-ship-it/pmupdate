const express = require('express');
const rateLimit = require('express-rate-limit');
const otpService = require('../services/otpService');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');
const ApiResponse = require('../middleware/apiResponse');

const router = express.Router();

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 OTP requests per 15 minutes
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for OTP verification
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 verification attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request OTP for doctor login
router.post('/request', otpLimiter, async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;

    // Validation - email is required, mobileNumber is optional
    if (!email) {
      return ApiResponse.validationError(res, null, 'Email is required');
    }

    const db = getDb();
    let doctors = [];
    let mobileNumberToUse = mobileNumber;

    // If mobile number not provided, fetch from database
    if (!mobileNumber) {
      const [doctorRecords] = await db.execute(`
        SELECT d.*, u.email, u.name, u.phone
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.email = ? AND u.role = 'doctor' AND u.is_active = 1
      `, [email]);

      doctors = doctorRecords;
      
      if (doctors.length === 0) {
        return ApiResponse.notFound(res, 'Doctor account not found with this email');
      }

      // Use phone from users table
      mobileNumberToUse = doctors[0].phone;
      
      if (!mobileNumberToUse) {
        return ApiResponse.validationError(res, null, 'Mobile number not found for this doctor. Please update your profile.');
      }
    } else {
      // If mobile number provided, validate both email and mobile
      const [doctorRecords] = await db.execute(`
        SELECT d.*, u.email, u.name, u.phone
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.email = ? AND u.phone = ? AND u.role = 'doctor' AND u.is_active = 1
      `, [email, mobileNumber]);

      doctors = doctorRecords;

      if (doctors.length === 0) {
        return ApiResponse.notFound(res, 'Doctor account not found with this email and mobile number');
      }
    }

    const doctor = doctors[0];

    // Send OTP
    const otpResult = await otpService.sendOTP(email, mobileNumberToUse);

    return ApiResponse.success(res, {
      otpId: otpResult.otpId,
      expiresIn: otpResult.expiresIn,
      doctorName: doctor.name,
      mobileNumber: mobileNumberToUse
    }, 'OTP sent successfully', 200);

  } catch (error) {
    console.error('OTP request error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Send OTP after credential verification (new flow)
router.post('/send', otpLimiter, async (req, res) => {
  try {
    const { email, mobile_number, user_id } = req.body;

    // Validation
    if (!email || !mobile_number || !user_id) {
      return ApiResponse.validationError(res, null, 'Email, mobile number, and user ID are required');
    }

    // Generate and send OTP
    const result = await otpService.sendOTP(email, mobile_number);

    if (result.success) {
      return ApiResponse.success(res, {
        otpId: result.otpId,
        expiresIn: result.expiresIn,
        message: 'OTP sent successfully'
      }, 'OTP sent to your email and mobile', 200);
    } else {
      return ApiResponse.error(res, result.message, 500);
    }

  } catch (error) {
    console.error('OTP send error:', error);
    return ApiResponse.serverError(res, 'Failed to send OTP');
  }
});

// Verify OTP for doctor login (using otpId)
router.post('/verify-doctor', verifyLimiter, async (req, res) => {
  try {
    const { otpId, otp } = req.body;

    // Validation
    if (!otpId || !otp) {
      return ApiResponse.validationError(res, null, 'OTP ID and OTP are required');
    }

    // Verify OTP
    const result = await otpService.verifyOTP(otpId, otp);

    if (result.success) {
      // Get doctor info
      const db = getDb();
      const [doctors] = await db.execute(`
        SELECT d.*, u.email, u.name, u.phone
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.email = ? AND u.role = 'doctor' AND u.is_active = 1
      `, [result.email]);

      if (doctors.length === 0) {
        return ApiResponse.notFound(res, 'Doctor account not found');
      }

      const doctor = doctors[0];

      // Generate JWT token
      const token = jwt.sign(
        {
          id: doctor.user_id,
          doctorId: doctor.id,
          email: doctor.email,
          name: doctor.name,
          role: 'doctor',
          specialization: doctor.specialization
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Update last login
      await db.execute(`
        UPDATE users 
        SET last_login = ?, last_login_ip = ?
        WHERE id = ?
      `, [new Date(), req.ip, doctor.user_id]);

      return ApiResponse.success(res, {
        token,
        user: {
          id: doctor.user_id,
          doctorId: doctor.id,
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          role: 'doctor',
          specialization: doctor.specialization,
          consultation_fee: doctor.consultation_fee
        }
      }, 'Login successful', 200);

    } else {
      return ApiResponse.error(res, result.message, 400);
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return ApiResponse.serverError(res, 'Failed to verify OTP');
  }
});

// Verify OTP (for new credential-based login flow)
router.post('/verify', verifyLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return ApiResponse.validationError(res, null, 'Email and OTP are required');
    }

    // Verify OTP
    const result = await otpService.verifyOTPByEmail(email, otp);

    if (result.success) {
      otpService.markLoginVerified(email);
      return ApiResponse.success(res, {
        verified: true,
        message: 'OTP verified successfully'
      }, 'OTP verification successful', 200);
    } else {
      return ApiResponse.error(res, result.message, 400);
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return ApiResponse.serverError(res, 'Failed to verify OTP');
  }
});

// Check OTP status
router.get('/status/:otpId', async (req, res) => {
  try {
    const { otpId } = req.params;
    const status = otpService.getOTPStatus(otpId);

    return ApiResponse.success(res, status, 'OTP status retrieved', 200);

  } catch (error) {
    console.error('OTP status error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

// Resend OTP
router.post('/resend', otpLimiter, async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;

    // Validation
    if (!email || !mobileNumber) {
      return ApiResponse.validationError(res, null, 'Email and mobile number are required');
    }

    // Check if doctor exists
    const db = getDb();
    const [doctors] = await db.execute(`
      SELECT d.*, u.email, u.name, u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE u.email = ? AND u.phone = ? AND u.role = 'doctor' AND u.is_active = 1
    `, [email, mobileNumber]);

    if (doctors.length === 0) {
      return ApiResponse.notFound(res, 'Doctor account not found with this email and mobile number');
    }

    // Send new OTP
    const otpResult = await otpService.sendOTP(email, mobileNumber);

    return ApiResponse.success(res, {
      otpId: otpResult.otpId,
      expiresIn: otpResult.expiresIn,
      doctorName: doctors[0].name
    }, 'OTP resent successfully', 200);

  } catch (error) {
    console.error('OTP resend error:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

module.exports = router;
