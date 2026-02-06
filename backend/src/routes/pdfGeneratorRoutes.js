// =====================================================
// PDF GENERATOR ROUTES
// Purpose: Routes for generating PDFs
// =====================================================

const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfGeneratorController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { generatePdf } = require('../validation/commonSchemas');

// All routes require authentication
router.use(authenticateToken);

// =====================================================
// PRESCRIPTION PDF
// =====================================================

/**
 * @route GET /api/pdf/prescription/:prescriptionId
 * @desc Generate PDF for a prescription
 * @access Private (Authenticated users)
 * @returns PDF file
 */
router.get('/prescription/:prescriptionId', pdfController.generatePrescriptionPDF);

// =====================================================
// BILLING PDF
// =====================================================

/**
 * @route GET /api/pdf/bill/:billId
 * @desc Generate PDF for a bill/invoice
 * @access Private (Authenticated users)
 * @returns PDF file
 */
router.get('/bill/:billId', pdfController.generateBillingPDF);

// =====================================================
// MEDICAL CERTIFICATE PDF
// =====================================================

/**
 * @route GET /api/pdf/certificate/:certificateId
 * @desc Generate PDF for a medical certificate
 * @access Private (Authenticated users)
 * @returns PDF file
 */
router.get('/certificate/:certificateId', pdfController.generateCertificatePDF);

// =====================================================
// REFERRAL PDF
// =====================================================

/**
 * @route GET /api/pdf/referral/:referralId
 * @desc Generate PDF for a referral letter
 * @access Private (Authenticated users)
 * @returns PDF file
 */
router.get('/referral/:referralId', pdfController.generateReferralPDF);

module.exports = router;
