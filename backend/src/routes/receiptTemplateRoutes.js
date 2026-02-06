const express = require('express');
const {
  listReceiptTemplates,
  getReceiptTemplate,
  createReceiptTemplate,
  updateReceiptTemplate,
  deleteReceiptTemplate,
  getDefaultTemplate
} = require('../controllers/receiptTemplateController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createReceiptTemplate: createReceiptTemplateSchema, updateReceiptTemplate: updateReceiptTemplateSchema } = require('../validation/commonSchemas');

const router = express.Router();

router.get('/', authenticateToken, listReceiptTemplates);
router.get('/default', authenticateToken, getDefaultTemplate);
router.get('/:id', authenticateToken, getReceiptTemplate);
router.post('/', authenticateToken, joiValidate(createReceiptTemplateSchema), createReceiptTemplate);
router.put('/:id', authenticateToken, joiValidate(updateReceiptTemplateSchema), updateReceiptTemplate);
router.delete('/:id', authenticateToken, deleteReceiptTemplate);

module.exports = router;
