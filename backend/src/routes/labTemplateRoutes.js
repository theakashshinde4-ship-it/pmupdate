const express = require('express');
const {
  listLabTemplates,
  getLabTemplate,
  createLabTemplate,
  updateLabTemplate,
  deleteLabTemplate
} = require('../controllers/labTemplateController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { validateRequired, validateId } = require('../middleware/validator');
const { cacheMiddleware } = require('../middleware/cache');
const joiValidate = require('../middleware/joiValidate');
const { createLabTemplate: createLabTemplateSchema, updateLabTemplate: updateLabTemplateSchema } = require('../validation/commonSchemas');

const router = express.Router();

router.get('/', authenticateToken, cacheMiddleware(5 * 60 * 1000), listLabTemplates);
router.get('/:id', authenticateToken, validateId('id'), cacheMiddleware(5 * 60 * 1000), getLabTemplate);
router.post('/',
  authenticateToken,
  requireRole('admin', 'doctor'),
  joiValidate(createLabTemplateSchema),
  createLabTemplate
);
router.put('/:id',
  authenticateToken,
  requireRole('admin', 'doctor'),
  validateId('id'),
  joiValidate(updateLabTemplateSchema),
  updateLabTemplate
);
router.delete('/:id', 
  authenticateToken, 
  requireRole('admin'),
  validateId('id'),
  deleteLabTemplate
);

module.exports = router;

