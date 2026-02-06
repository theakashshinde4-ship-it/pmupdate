/**
 * Patient Module - Controller
 * Handles HTTP requests/responses
 * 
 * Responsibilities:
 * - Parse request data
 * - Call service layer
 * - Format and send responses
 * 
 * NOT responsible for:
 * - Database queries (service/repository)
 * - Business logic (service)
 * - Validation (middleware)
 */
const { asyncHandler } = require('../../core/decorators/asyncHandler');
const ApiResponse = require('../../core/response/ApiResponse');
const ApiError = require('../../core/errors/ApiError');
const PatientService = require('./patient.service');
const PatientDTO = require('./patient.dto');
const { logger } = require('../../monitoring/logger');

class PatientController {
  /**
   * List patients with filters, search, and pagination
   */
  static listPatients = asyncHandler(async (req, res) => {
    const { page, limit, search, gender, blood_group, city, state, doctor_id, sort_by, sort_order } = req.query;
    
    logger.info('Fetching patients', {
      page,
      limit,
      doctor_id: req.user?.doctor_id
    });

    const filter = {
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 10, 100),
      search: search?.trim(),
      gender,
      blood_group,
      city,
      state,
      doctor_id: req.user.role === 'doctor' ? req.user.doctor_id : doctor_id,
      sort_by,
      sort_order
    };

    const { patients, total } = await PatientService.listPatients(filter, req.user);

    const response = ApiResponse.success(
      PatientDTO.toListResponse(patients),
      'Patients retrieved successfully'
    );

    // Add pagination metadata
    response.pagination = {
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit)
    };

    res.json(response);
  });

  /**
   * Get patient by ID
   */
  static getPatient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ApiError(400, 'Invalid patient ID', 'INVALID_ID');
    }

    const patient = await PatientService.getPatient(parseInt(id), req.user);

    res.json(ApiResponse.success(
      PatientDTO.toResponse(patient),
      'Patient retrieved successfully'
    ));
  });

  /**
   * Get patient by patient_id (unique identifier)
   */
  static getPatientByPatientId = asyncHandler(async (req, res) => {
    const { patient_id } = req.params;

    const patient = await PatientService.getPatientByPatientId(patient_id, req.user);

    res.json(ApiResponse.success(
      PatientDTO.toResponse(patient)
    ));
  });

  /**
   * Create patient
   */
  static createPatient = asyncHandler(async (req, res) => {
    const patientData = req.body;

    logger.info('Creating patient', {
      email: patientData.email,
      doctor_id: req.user.doctor_id
    });

    const createdPatient = await PatientService.createPatient(patientData, req.user);

    res.status(201).json(ApiResponse.created(
      PatientDTO.toResponse(createdPatient),
      'Patient created successfully'
    ));
  });

  /**
   * Update patient
   */
  static updatePatient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || isNaN(id)) {
      throw new ApiError(400, 'Invalid patient ID', 'INVALID_ID');
    }

    logger.info('Updating patient', { id, fields: Object.keys(updateData) });

    const updatedPatient = await PatientService.updatePatient(
      parseInt(id),
      updateData,
      req.user
    );

    res.json(ApiResponse.success(
      PatientDTO.toResponse(updatedPatient),
      'Patient updated successfully'
    ));
  });

  /**
   * Delete patient (soft delete)
   */
  static deletePatient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ApiError(400, 'Invalid patient ID', 'INVALID_ID');
    }

    logger.warn('Deleting patient', { id, deletedBy: req.user.id });

    await PatientService.deletePatient(parseInt(id));

    res.json(ApiResponse.success(null, 'Patient deleted successfully'));
  });

  /**
   * Search patients (public endpoint)
   */
  static searchPatients = asyncHandler(async (req, res) => {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters', 'INVALID_QUERY');
    }

    const patients = await PatientService.searchPatients(query, Math.min(parseInt(limit), 20));

    res.json(ApiResponse.success(
      PatientDTO.toListResponse(patients)
    ));
  });

  /**
   * Merge duplicate patients
   */
  static mergeDuplicatePatients = asyncHandler(async (req, res) => {
    const { source_id, target_id } = req.body;

    if (!source_id || !target_id) {
      throw new ApiError(400, 'Both source_id and target_id are required', 'MISSING_FIELDS');
    }

    logger.warn('Merging patients', { source_id, target_id, mergedBy: req.user.id });

    await PatientService.mergePatients(source_id, target_id);

    res.json(ApiResponse.success(null, 'Patients merged successfully'));
  });

  /**
   * Get patient statistics
   */
  static getPatientStats = asyncHandler(async (req, res) => {
    const stats = await PatientService.getPatientStats(req.user);

    res.json(ApiResponse.success(stats));
  });
}

module.exports = PatientController;
