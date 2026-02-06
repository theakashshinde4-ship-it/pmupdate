const express = require('express');
const {
  getFamilyHistory,
  addFamilyHistory,
  updateFamilyHistory,
  deleteFamilyHistory
} = require('../controllers/familyHistoryController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequired, validateId } = require('../middleware/validator');
const joiValidate = require('../middleware/joiValidate');
const {
  createFamilyHistory: createFamilyHistorySchema,
  updateFamilyHistory: updateFamilyHistorySchema
} = require('../validation/commonSchemas');

const router = express.Router();

router.get('/:patientId', authenticateToken, getFamilyHistory);
router.post('/:patientId',
  authenticateToken,
  joiValidate(createFamilyHistorySchema),
  addFamilyHistory
);
router.put('/:id',
  authenticateToken,
  validateId('id'),
  joiValidate(updateFamilyHistorySchema),
  updateFamilyHistory
);
router.delete('/:id', authenticateToken, validateId('id'), deleteFamilyHistory);

module.exports = router;

