const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { listLabs, addLab, updateLab, deleteLab } = require('../controllers/labController');
const { auditLogger } = require('../middleware/auditLogger');
const joiValidate = require('../middleware/joiValidate');
const { createInvestigation, updateInvestigation } = require('../validation/commonSchemas');

const router = express.Router();

router.get('/', authenticateToken, listLabs);
router.post('/', authenticateToken, joiValidate(createInvestigation), auditLogger('LAB'), addLab);
router.put('/:id', authenticateToken, joiValidate(updateInvestigation), auditLogger('LAB'), updateLab);
router.delete('/:id', authenticateToken, auditLogger('LAB'), deleteLab);

module.exports = router;
