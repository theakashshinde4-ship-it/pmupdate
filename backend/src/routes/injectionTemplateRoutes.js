const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAllInjectionTemplates,
  getInjectionTemplateById,
  createInjectionTemplate,
  updateInjectionTemplate,
  deleteInjectionTemplate,
  incrementTemplateUsage,
  searchInjections,
  getInjectionNames
} = require('../controllers/injectionTemplateController');
const joiValidate = require('../middleware/joiValidate');
const { createInjectionTemplate: createInjectionTemplateSchema, updateInjectionTemplate: updateInjectionTemplateSchema } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Search injections for autocomplete/dropdown - MUST be before /:id route
// GET /api/injection-templates/search?q=<query>&limit=20
router.get('/search', searchInjections);

// Get all unique injection names (simplified list for dropdown)
// GET /api/injection-templates/names
router.get('/names', getInjectionNames);

// Get all injection templates
router.get('/', getAllInjectionTemplates);

// Get injection template by ID
router.get('/:id', getInjectionTemplateById);

// Create new injection template (doctors and admins only)
router.post('/', requireRole('admin', 'doctor'), joiValidate(createInjectionTemplateSchema), createInjectionTemplate);

// Update injection template (doctors can update their own, admins can update any)
router.put('/:id', requireRole('admin', 'doctor'), joiValidate(updateInjectionTemplateSchema), updateInjectionTemplate);

// Delete injection template (soft delete)
router.delete('/:id', requireRole('admin', 'doctor'), deleteInjectionTemplate);

// Increment usage count
router.post('/:id/use', incrementTemplateUsage);

module.exports = router;
