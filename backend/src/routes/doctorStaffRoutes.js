const express = require('express');
const router = express.Router();
const { listDoctorStaff, createDoctorStaff, updateDoctorStaff, deleteDoctorStaff } = require('../controllers/doctorStaffController');
const { authenticateToken } = require('../middleware/auth');

// Protect all routes
router.use(authenticateToken);

router.get('/:doctorId', listDoctorStaff);
router.post('/', createDoctorStaff);
router.put('/:id', updateDoctorStaff);
router.delete('/:id', deleteDoctorStaff);

module.exports = router;
