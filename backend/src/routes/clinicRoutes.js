const express = require('express');
const {
  listClinics,
  getClinic,
  createClinic,
  updateClinic,
  switchClinic
} = require('../controllers/clinicController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { validateRequired, validateId } = require('../middleware/validator');
const joiValidate = require('../middleware/joiValidate');
const { updateClinic: updateClinicSchema } = require('../validation/commonSchemas');

const router = express.Router();

// Make clinics list public for testing
router.get('/', listClinics);
router.get('/:id', validateId('id'), getClinic);
router.post('/', authenticateToken, requireRole('admin'), validateRequired(['name']), createClinic);
router.put('/:id', authenticateToken, requireRole('admin'), validateId('id'), joiValidate(updateClinicSchema), updateClinic);
router.post('/switch', authenticateToken, validateRequired(['clinic_id']), switchClinic);

module.exports = router;

