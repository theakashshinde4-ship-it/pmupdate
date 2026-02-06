const express = require('express');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementUsage,
  getTemplatesByCategory
} = require('../controllers/prescriptionTemplatesController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createPrescriptionTemplate, updatePrescriptionTemplate } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getAllTemplates);
router.get('/category/:category', getTemplatesByCategory);
router.get('/:id', getTemplateById);
router.post('/', joiValidate(createPrescriptionTemplate), createTemplate);
router.put('/:id', joiValidate(updatePrescriptionTemplate), updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/use', incrementUsage);

module.exports = router;
