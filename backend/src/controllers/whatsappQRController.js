/**
 * WhatsApp & QR Code Controller
 * Handles WhatsApp verification and Doctor QR code generation
 */

const whatsappVerificationService = require('../services/whatsappVerificationService');
const doctorQRCodeService = require('../services/doctorQRCodeService');

// =====================================================
// WHATSAPP VERIFICATION ENDPOINTS
// =====================================================

/**
 * Verify appointment reminder endpoint
 * POST /api/whatsapp/verify/appointment-reminder
 */
exports.verifyAppointmentReminder = async (req, res) => {
  try {
    const appointmentData = req.body;

    const result = await whatsappVerificationService.verifyAppointmentReminder(appointmentData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Appointment reminder verified',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (err) {
    console.error('Verify appointment reminder error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify appointment reminder',
      details: err.message
    });
  }
};

/**
 * Verify follow-up reminder endpoint
 * POST /api/whatsapp/verify/followup-reminder
 */
exports.verifyFollowupReminder = async (req, res) => {
  try {
    const followupData = req.body;

    const result = await whatsappVerificationService.verifyFollowupReminder(followupData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Follow-up reminder verified',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (err) {
    console.error('Verify followup reminder error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify follow-up reminder',
      details: err.message
    });
  }
};

/**
 * Verify receipt sharing endpoint
 * POST /api/whatsapp/verify/receipt
 */
exports.verifyReceiptSharing = async (req, res) => {
  try {
    const receiptData = req.body;

    const result = await whatsappVerificationService.verifyReceiptSharing(receiptData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Receipt sharing verified',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (err) {
    console.error('Verify receipt sharing error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify receipt sharing',
      details: err.message
    });
  }
};

/**
 * Verify prescription sharing endpoint
 * POST /api/whatsapp/verify/prescription
 */
exports.verifyPrescriptionSharing = async (req, res) => {
  try {
    const prescriptionData = req.body;

    const result = await whatsappVerificationService.verifyPrescriptionSharing(prescriptionData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Prescription sharing verified',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (err) {
    console.error('Verify prescription sharing error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify prescription sharing',
      details: err.message
    });
  }
};

/**
 * Verify QR code sharing endpoint
 * POST /api/whatsapp/verify/qr-code
 */
exports.verifyQRCodeSharing = async (req, res) => {
  try {
    const qrData = req.body;

    const result = await whatsappVerificationService.verifyQRCodeSharing(qrData);

    if (result.success) {
      res.json({
        success: true,
        message: 'QR code sharing verified',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (err) {
    console.error('Verify QR code sharing error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify QR code sharing',
      details: err.message
    });
  }
};

/**
 * Run all WhatsApp verifications
 * POST /api/whatsapp/verify/all
 */
exports.runAllVerifications = async (req, res) => {
  try {
    const testData = req.body;

    // Validate test data
    if (!testData.appointment || !testData.followup || !testData.receipt || !testData.prescription || !testData.qrCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing test data for one or more endpoints'
      });
    }

    const results = await whatsappVerificationService.runAllVerifications(testData);

    res.json({
      success: true,
      message: 'All WhatsApp endpoints verified',
      data: results
    });
  } catch (err) {
    console.error('Run all verifications error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to run all verifications',
      details: err.message
    });
  }
};

/**
 * Get WhatsApp verification logs
 * GET /api/whatsapp/logs
 */
exports.getVerificationLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = whatsappVerificationService.getVerificationLogs(parseInt(limit));

    res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (err) {
    console.error('Get verification logs error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification logs',
      details: err.message
    });
  }
};

/**
 * Clear WhatsApp verification logs
 * DELETE /api/whatsapp/logs
 */
exports.clearVerificationLogs = async (req, res) => {
  try {
    const cleared = whatsappVerificationService.clearVerificationLogs();

    if (cleared) {
      res.json({
        success: true,
        message: 'Verification logs cleared'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No logs to clear'
      });
    }
  } catch (err) {
    console.error('Clear verification logs error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to clear verification logs',
      details: err.message
    });
  }
};

// =====================================================
// DOCTOR QR CODE ENDPOINTS
// =====================================================

/**
 * Generate doctor QR code
 * POST /api/qr-code/doctor
 */
exports.generateDoctorQRCode = async (req, res) => {
  try {
    const doctorData = req.body;
    const options = req.query;

    const result = doctorQRCodeService.generateDoctorQRCode(doctorData, options);

    if (result.success) {
      res.json({
        success: true,
        message: 'Doctor QR code generated',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        fallback: result.fallback
      });
    }
  } catch (err) {
    console.error('Generate doctor QR code error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate doctor QR code',
      details: err.message
    });
  }
};

/**
 * Generate bulk QR codes for multiple doctors
 * POST /api/qr-code/bulk
 */
exports.generateBulkQRCodes = async (req, res) => {
  try {
    const { doctors } = req.body;
    const options = req.query;

    if (!doctors || !Array.isArray(doctors)) {
      return res.status(400).json({
        success: false,
        error: 'Doctors array is required'
      });
    }

    const results = doctorQRCodeService.generateBulkQRCodes(doctors, options);

    res.json({
      success: true,
      message: 'Bulk QR codes generated',
      data: results
    });
  } catch (err) {
    console.error('Generate bulk QR codes error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bulk QR codes',
      details: err.message
    });
  }
};

/**
 * Generate branded QR code
 * POST /api/qr-code/branded
 */
exports.generateBrandedQRCode = async (req, res) => {
  try {
    const { doctorData, brandingOptions } = req.body;

    const result = doctorQRCodeService.generateBrandedQRCode(doctorData, brandingOptions);

    if (result.success) {
      res.json({
        success: true,
        message: 'Branded QR code generated',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Generate branded QR code error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate branded QR code',
      details: err.message
    });
  }
};

/**
 * Generate QR code for WhatsApp sharing
 * POST /api/qr-code/whatsapp
 */
exports.generateQRCodeForWhatsApp = async (req, res) => {
  try {
    const doctorData = req.body;

    const result = doctorQRCodeService.generateQRCodeForWhatsApp(doctorData);

    if (result.success) {
      res.json({
        success: true,
        message: 'QR code for WhatsApp generated',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Generate QR code for WhatsApp error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code for WhatsApp',
      details: err.message
    });
  }
};

/**
 * Generate QR code for email sharing
 * POST /api/qr-code/email
 */
exports.generateQRCodeForEmail = async (req, res) => {
  try {
    const doctorData = req.body;

    const result = doctorQRCodeService.generateQRCodeForEmail(doctorData);

    if (result.success) {
      res.json({
        success: true,
        message: 'QR code for email generated',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Generate QR code for email error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code for email',
      details: err.message
    });
  }
};

/**
 * Generate QR code download link
 * POST /api/qr-code/download
 */
exports.generateQRCodeDownloadLink = async (req, res) => {
  try {
    const { doctorData, format = 'png' } = req.body;

    const result = doctorQRCodeService.generateQRCodeDownloadLink(doctorData, format);

    if (result.success) {
      res.json({
        success: true,
        message: 'QR code download link generated',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Generate QR code download link error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code download link',
      details: err.message
    });
  }
};

/**
 * Generate QR code with new patient registration
 * POST /api/qr-code/registration
 */
exports.generateQRCodeWithRegistration = async (req, res) => {
  try {
    const doctorData = req.body;

    const result = doctorQRCodeService.generateQRCodeWithRegistration(doctorData);

    if (result.success) {
      res.json({
        success: true,
        message: 'QR code with registration flow generated',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Generate QR code with registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code with registration',
      details: err.message
    });
  }
};

/**
 * Validate QR code token
 * GET /api/qr-code/validate/:token
 */
exports.validateQRCodeToken = async (req, res) => {
  try {
    const { token } = req.params;

    const result = doctorQRCodeService.validateQRCodeToken(token);

    if (result.valid) {
      res.json({
        success: true,
        message: 'QR code token is valid',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    console.error('Validate QR code token error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to validate QR code token',
      details: err.message
    });
  }
};

/**
 * Get QR code analytics
 * GET /api/qr-code/analytics/:doctorId
 */
exports.getQRCodeAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { doctorName, scans = 0, conversions = 0 } = req.query;

    const result = doctorQRCodeService.generateQRCodeAnalytics({
      doctorId,
      doctorName,
      scans: parseInt(scans),
      conversions: parseInt(conversions)
    });

    res.json({
      success: true,
      message: 'QR code analytics retrieved',
      data: result
    });
  } catch (err) {
    console.error('Get QR code analytics error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get QR code analytics',
      details: err.message
    });
  }
};
