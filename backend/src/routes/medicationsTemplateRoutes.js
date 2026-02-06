const express = require('express');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/medicationsTemplateController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createMedicationsTemplate, updateMedicationsTemplate } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getAllTemplates);
router.get('/:id', authenticateToken, getTemplateById);
router.post('/', authenticateToken, joiValidate(createMedicationsTemplate), createTemplate);
router.put('/:id', authenticateToken, joiValidate(updateMedicationsTemplate), updateTemplate);
router.delete('/:id', authenticateToken, deleteTemplate);

module.exports = router;
