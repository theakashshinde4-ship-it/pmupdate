const { sendSuccess, sendError } = require('../../utils/responseHelper');
const { parsePagination, buildPagination } = require('../../platform/http/pagination');
const { asyncHandler } = require('../../platform/http/asyncHandler');
const { listPatientsService } = require('./patients.service');
const legacyPatientController = require('../../controllers/patientController');

const listPatients = asyncHandler(async (req, res) => {
  try {
    const { search, gender, blood_group, city, state, tab = 0, doctor_id } = req.query;
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });

    const { patients, total } = await listPatientsService({
      page,
      limit,
      offset,
      search,
      gender,
      blood_group,
      city,
      state,
      tab,
      doctor_id,
      user: req.user
    });

    const pagination = buildPagination({ page, limit, total });

    return sendSuccess(res, {
      patients,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages
      }
    });
  } catch (error) {
    return sendError(
      res,
      'Failed to fetch patients',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
});

module.exports = {
  listPatients,
  getPatient: legacyPatientController.getPatient,
  getPatientByPatientId: legacyPatientController.getPatientByPatientId,
  addPatient: legacyPatientController.addPatient,
  updatePatient: legacyPatientController.updatePatient,
  deletePatient: legacyPatientController.deletePatient,
  mergePatients: legacyPatientController.mergePatients
};
