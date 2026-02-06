// backend/src/routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { exportAsJSON, exportAsPDF, exportAsExcel } = require('../controllers/exportController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/export/patient/:id
 * @query   format=json|pdf|excel
 * @query   allPatients=true|false (optional, for doctor's all patients)
 * @query   doctorId=integer (optional, to filter patients by doctor)
 * @desc    Export patient data in specified format
 */
router.get('/patient/:id', async (req, res) => {
  const format = (req.query.format || 'excel').toLowerCase();

  try {
    switch (format) {
      case 'json':
        return await exportAsJSON(req, res);
      case 'pdf':
        return await exportAsPDF(req, res);
      case 'excel':
      case 'xlsx':
        return await exportAsExcel(req, res);
      default:
        return res.status(400).json({ 
          error: 'Invalid format. Supported: json, pdf, excel',
          supportedFormats: ['json', 'pdf', 'excel']
        });
    }
  } catch (error) {
    console.error('Export route error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

/**
 * @route   GET /api/export/all-patients
 * @query   format=json|pdf|excel
 * @query   doctorId=integer (optional, filter by doctor)
 * @desc    Export all patients data
 */
router.get('/all-patients', async (req, res) => {
  const format = (req.query.format || 'excel').toLowerCase();
  
  // Redirect to patient endpoint with allPatients flag
  req.query.allPatients = 'true';

  try {
    switch (format) {
      case 'json':
        return await exportAsJSON(req, res);
      case 'excel':
      case 'xlsx':
        return await exportAsExcel(req, res);
      default:
        return res.status(400).json({ 
          error: 'Invalid format for bulk export. Supported: json, excel' 
        });
    }
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ error: 'Bulk export failed', details: error.message });
  }
});

/**
 * @route   GET /api/export/formats
 * @desc    Get available export formats
 */
router.get('/formats', (req, res) => {
  res.json({
    availableFormats: [
      {
        format: 'pdf',
        label: 'PDF (Printable)',
        description: 'Professional formatted PDF document',
        supportsSinglePatient: true,
        supportsAllPatients: false,
        fileExtension: '.pdf'
      },
      {
        format: 'excel',
        label: 'Excel (Spreadsheet)',
        description: 'Multi-sheet Excel workbook with formatted data',
        supportsSinglePatient: true,
        supportsAllPatients: true,
        fileExtension: '.xlsx'
      },
      {
        format: 'json',
        label: 'JSON (Data)',
        description: 'Structured JSON data for system integration',
        supportsSinglePatient: true,
        supportsAllPatients: true,
        fileExtension: '.json'
      }
    ]
  });
});

module.exports = router;
