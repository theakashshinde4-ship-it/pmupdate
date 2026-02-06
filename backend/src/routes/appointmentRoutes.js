// src/routes/appointmentRoutes.js
const express = require('express');
const {
  listAppointments,
  getAppointment,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  updatePaymentStatus,
  deleteAppointment,
  listFollowUps,
  getBookedSlots
} = require('../modules/appointments/appointments.controller');

// ✅ SAHI IMPORT - Destructuring se authenticateToken le rahe hain
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../platform/security/authorize');
const joiValidate = require('../middleware/joiValidate');
const { validateId } = require('../middleware/validator');
const { createAppointment, updateAppointment: updateAppointmentSchema, updateAppointmentStatus: updateAppointmentStatusSchema, updatePaymentStatus: updatePaymentStatusSchema } = require('../validation/appointmentSchemas');

const router = express.Router();

// Public endpoint - no auth required (landing page booking)
router.get('/booked-slots', getBookedSlots);

// Make appointments list and creation public for testing
router.get('/', listAppointments);
router.post('/', joiValidate(createAppointment), addAppointment);
router.get('/followups', listFollowUps); // Public route for patient followups
router.get('/follow-ups/list', listFollowUps); // Public route for patient followups

// All routes below require authentication
router.use(authenticateToken);

router.get('/:id', authorize('appointments.view'), validateId('id'), getAppointment);
router.put('/:id', authorize('appointments.edit'), validateId('id'), joiValidate(updateAppointmentSchema), updateAppointment);
router.patch('/:id/status', authorize('appointments.edit'), validateId('id'), joiValidate(updateAppointmentStatusSchema), updateAppointmentStatus);
router.patch('/:id/payment', authorize('appointments.edit'), validateId('id'), joiValidate(updatePaymentStatusSchema), updatePaymentStatus);
router.delete('/:id', authorize('appointments.delete'), validateId('id'), deleteAppointment);

module.exports = router;