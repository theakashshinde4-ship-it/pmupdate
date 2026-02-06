const express = require('express');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplatesByCategory
} = require('../controllers/symptomsTemplatesController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createSymptomsTemplate, updateSymptomsTemplate } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getAllTemplates);
router.get('/category/:category', getTemplatesByCategory);
router.get('/:id', getTemplateById);
router.post('/', joiValidate(createSymptomsTemplate), createTemplate);
router.put('/:id', joiValidate(updateSymptomsTemplate), updateTemplate);
router.delete('/:id', deleteTemplate);

module.exports = router;
