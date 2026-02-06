const express = require('express');
const {
  exportDatabase,
  exportDatabaseExcel,
  exportDatabaseCSV,
  listBackups,
  downloadBackup,
  deleteBackup,
  exportData
} = require('../controllers/backupController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// All backup routes require admin role
router.post('/export', authenticateToken, requireRole('admin'), exportDatabase);
router.get('/export-excel', authenticateToken, requireRole('admin'), exportDatabaseExcel);
router.get('/export-csv', authenticateToken, requireRole('admin'), exportDatabaseCSV);
router.get('/list', authenticateToken, requireRole('admin'), listBackups);
router.get('/download/:filename', authenticateToken, requireRole('admin'), downloadBackup);
router.delete('/:filename', authenticateToken, requireRole('admin'), deleteBackup);
router.get('/data/export', authenticateToken, requireRole('admin'), exportData);

module.exports = router;

