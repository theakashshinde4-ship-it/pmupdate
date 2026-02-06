const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { parsePagination, buildPagination } = require('../../platform/http/pagination');
const { asyncHandler } = require('../../platform/http/asyncHandler');
const { listAppointmentsService } = require('./appointments.service');
const legacyAppointmentController = require('../../controllers/appointmentController');

const listAppointments = asyncHandler(async (req, res) => {
  let whereClause = '';
  let params = [];
  try {
    const { date, status, doctor_id, start_date, end_date } = req.query;
    const { page, limit: limitNum, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });

    const { appointments, total } = await listAppointmentsService({
      page,
      limit: limitNum,
      offset,
      date,
      status,
      doctor_id,
      start_date,
      end_date,
      user: req.user,
      whereClause,
      params
    });

    const pagination = buildPagination({ page, limit: limitNum, total });

    return sendSuccess(res, {
      appointments,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages
      }
    });
  } catch (error) {
    sendError(res, 'Failed to fetch appointments', 500, process.env.NODE_ENV === 'development' ? error.message : undefined);
  }
});

module.exports = {
  listAppointments,
  getAppointment: legacyAppointmentController.getAppointment,
  addAppointment: legacyAppointmentController.addAppointment,
  updateAppointment: legacyAppointmentController.updateAppointment,
  updateAppointmentStatus: legacyAppointmentController.updateAppointmentStatus,
  updatePaymentStatus: legacyAppointmentController.updatePaymentStatus,
  deleteAppointment: legacyAppointmentController.deleteAppointment,
  listFollowUps: legacyAppointmentController.listFollowUps,
  getBookedSlots: legacyAppointmentController.getBookedSlots
};
