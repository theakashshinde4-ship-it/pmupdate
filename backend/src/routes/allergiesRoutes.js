const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const controller = require('../controllers/allergiesController');

router.use(authenticateToken);

// GET /api/allergies/:patientId?active=1
router.get('/:patientId', controller.listByPatient);

// POST /api/allergies
router.post('/', controller.create);

// PATCH /api/allergies/:id
router.patch('/:id', controller.update);

module.exports = router;
