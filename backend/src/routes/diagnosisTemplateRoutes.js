const express = require('express');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/diagnosisTemplateController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createDiagnosisTemplate, updateDiagnosisTemplate } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getAllTemplates);
router.get('/:id', authenticateToken, getTemplateById);
router.post('/', authenticateToken, joiValidate(createDiagnosisTemplate), createTemplate);
router.put('/:id', authenticateToken, joiValidate(updateDiagnosisTemplate), updateTemplate);
router.delete('/:id', authenticateToken, deleteTemplate);

module.exports = router;
