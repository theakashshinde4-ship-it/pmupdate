// backend/src/routes/icdRoutes.js
const express = require('express');
const router = express.Router();
const {
  searchICD,
  getICDCode,
  refreshICDData,
  getICDRelated,
  getICDMedications
} = require('../controllers/icdController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Optionally require role, but ICD search is safe for any authenticated user
// const requireRole = require('../middleware/requireRole');

// GET /api/icd/search?q=fever&version=icd11&chapter=mms&linearization=2024-01
// For ICD-10, use version=icd10 (searches local DB)
// For all (both ICD-10 and ICD-11 local), use version=all
router.get('/search', authenticateToken, searchICD);

// GET /api/icd/code/:id?version=icd11|icd10
router.get('/code/:id', authenticateToken, getICDCode);

// Admin-only bulk refresh of ICD dataset
// POST /api/icd/admin/refresh?version=icd10|icd11
router.post('/admin/refresh', authenticateToken, requireRole('admin'), refreshICDData);

// Get related symptoms, diagnoses, and medications for an ICD code (DB-driven)
// GET /api/icd/:code/related?limit=20
router.get('/:code/related', authenticateToken, getICDRelated);

// Get medications suggested for an ICD code (DB-driven)
// GET /api/icd/:code/medications
router.get('/:code/medications', authenticateToken, getICDMedications);

module.exports = router;
