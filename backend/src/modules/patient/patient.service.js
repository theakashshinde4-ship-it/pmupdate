/**
 * Patient Module - Service Layer
 * Contains all business logic for patient operations
 * 
 * Responsibilities:
 * - Business rules and validations
 * - Coordinate between repositories
 * - Handle transactions
 * - Call background jobs
 * - Cache management
 * 
 * NOT responsible for:
 * - HTTP handling (controller)
 * - Database queries (repository)
 * - Formatting responses (DTO)
 */
const ApiError = require('../../core/errors/ApiError');
const PatientRepository = require('./patient.repository');
const { getDatabase, getRedisClient } = require('../../config/database');
const { logger } = require('../../monitoring/logger');

class PatientService {
  /**
   * List patients with filters and pagination
   */
  static async listPatients(filter, user) {
    try {
      // Restrict doctor to their own patients
      if (user.role === 'doctor' && !user.doctor_id) {
        throw new ApiError(400, 'Doctor profile incomplete', 'DOCTOR_INCOMPLETE');
      }

      const { patients, total } = await PatientRepository.list(filter, user);

      logger.debug('Patients listed', { count: patients.length, total });

      return { patients, total };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error listing patients', { error: error.message });
      throw new ApiError(500, 'Failed to list patients');
    }
  }

  /**
   * Get patient by ID with authorization check
   */
  static async getPatient(id, user) {
    try {
      const patient = await PatientRepository.findById(id);

      if (!patient) {
        throw ApiError.notFound('Patient');
      }

      // Check authorization: doctor can only see their patients
      if (user.role === 'doctor' && patient.primary_doctor_id !== user.doctor_id) {
        throw new ApiError(403, 'You do not have access to this patient', 'FORBIDDEN');
      }

      return patient;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching patient', { id, error: error.message });
      throw new ApiError(500, 'Failed to fetch patient');
    }
  }

  /**
   * Get patient by patient_id (unique identifier)
   */
  static async getPatientByPatientId(patient_id, user) {
    try {
      const patient = await PatientRepository.findByPatientId(patient_id);

      if (!patient) {
        throw ApiError.notFound('Patient');
      }

      // Check authorization
      if (user.role === 'doctor' && patient.primary_doctor_id !== user.doctor_id) {
        throw new ApiError(403, 'You do not have access to this patient', 'FORBIDDEN');
      }

      return patient;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching patient by patient_id', { patient_id });
      throw new ApiError(500, 'Failed to fetch patient');
    }
  }

  /**
   * Create patient
   */
  static async createPatient(patientData, user) {
    const db = getDatabase();

    try {
      // Check for duplicates by email
      const existingPatient = await PatientRepository.findByEmail(patientData.email);
      if (existingPatient) {
        throw new ApiError(409, 'Patient with this email already exists', 'DUPLICATE_EMAIL');
      }

      // Check for duplicates by phone
      const existingByPhone = await PatientRepository.findByPhone(patientData.phone);
      if (existingByPhone) {
        throw new ApiError(409, 'Patient with this phone already exists', 'DUPLICATE_PHONE');
      }

      // Generate unique patient_id
      const patient_id = await PatientService.generatePatientId();

      // Create patient in database
      const createdPatient = await PatientRepository.create({
        ...patientData,
        patient_id,
        primary_doctor_id: user.role === 'doctor' ? user.doctor_id : patientData.doctor_id,
        clinic_id: user.clinic_id,
        created_by: user.id,
        created_at: new Date()
      });

      logger.info('Patient created', { id: createdPatient.id, patient_id });

      // Clear list cache
      await PatientService.clearPatientListCache();

      return createdPatient;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      // Handle database errors
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ApiError(409, 'Duplicate patient data', 'DUPLICATE_ENTRY');
      }

      logger.error('Error creating patient', { error: error.message });
      throw new ApiError(500, 'Failed to create patient');
    }
  }

  /**
   * Update patient
   */
  static async updatePatient(id, updateData, user) {
    try {
      // Get existing patient for authorization
      const patient = await PatientRepository.findById(id);
      if (!patient) {
        throw ApiError.notFound('Patient');
      }

      // Check authorization
      if (user.role === 'doctor' && patient.primary_doctor_id !== user.doctor_id) {
        throw new ApiError(403, 'You can only update your own patients', 'FORBIDDEN');
      }

      // Check for email/phone duplicates (if changed)
      if (updateData.email && updateData.email !== patient.email) {
        const existingEmail = await PatientRepository.findByEmail(updateData.email);
        if (existingEmail) {
          throw new ApiError(409, 'Email already in use', 'DUPLICATE_EMAIL');
        }
      }

      if (updateData.phone && updateData.phone !== patient.phone) {
        const existingPhone = await PatientRepository.findByPhone(updateData.phone);
        if (existingPhone) {
          throw new ApiError(409, 'Phone already in use', 'DUPLICATE_PHONE');
        }
      }

      // Update patient
      const updatedPatient = await PatientRepository.update(id, {
        ...updateData,
        updated_at: new Date(),
        updated_by: user.id
      });

      logger.info('Patient updated', { id });

      // Clear cache
      await PatientService.clearPatientCache(id);

      return updatedPatient;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error updating patient', { id, error: error.message });
      throw new ApiError(500, 'Failed to update patient');
    }
  }

  /**
   * Delete patient (soft delete)
   */
  static async deletePatient(id) {
    try {
      const patient = await PatientRepository.findById(id);
      if (!patient) {
        throw ApiError.notFound('Patient');
      }

      await PatientRepository.softDelete(id);

      logger.warn('Patient deleted', { id, patient_id: patient.patient_id });

      await PatientService.clearPatientCache(id);
      await PatientService.clearPatientListCache();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error deleting patient', { id });
      throw new ApiError(500, 'Failed to delete patient');
    }
  }

  /**
   * Search patients by name, email, or patient_id
   */
  static async searchPatients(query, limit) {
    try {
      const patients = await PatientRepository.search(query, limit);
      return patients;
    } catch (error) {
      logger.error('Error searching patients', { query, error: error.message });
      throw new ApiError(500, 'Failed to search patients');
    }
  }

  /**
   * Merge duplicate patients
   */
  static async mergePatients(sourceId, targetId) {
    const db = getDatabase();

    try {
      if (sourceId === targetId) {
        throw new ApiError(400, 'Source and target must be different', 'INVALID_MERGE');
      }

      const source = await PatientRepository.findById(sourceId);
      const target = await PatientRepository.findById(targetId);

      if (!source || !target) {
        throw ApiError.notFound('Patient');
      }

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Move all appointments to target patient
        await connection.execute(
          'UPDATE appointments SET patient_id = ? WHERE patient_id = ?',
          [targetId, sourceId]
        );

        // Move all prescriptions to target patient
        await connection.execute(
          'UPDATE prescriptions SET patient_id = ? WHERE patient_id = ?',
          [targetId, sourceId]
        );

        // Move all bills to target patient
        await connection.execute(
          'UPDATE bills SET patient_id = ? WHERE patient_id = ?',
          [targetId, sourceId]
        );

        // Soft delete source patient
        await connection.execute(
          'UPDATE patients SET deleted_at = NOW() WHERE id = ?',
          [sourceId]
        );

        await connection.commit();
        logger.info('Patients merged', { source_id: sourceId, target_id: targetId });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      // Clear caches
      await PatientService.clearPatientCache(sourceId);
      await PatientService.clearPatientCache(targetId);
      await PatientService.clearPatientListCache();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error merging patients', { sourceId, targetId });
      throw new ApiError(500, 'Failed to merge patients');
    }
  }

  /**
   * Get patient statistics
   */
  static async getPatientStats(user) {
    try {
      const stats = await PatientRepository.getStats(user);
      return stats;
    } catch (error) {
      logger.error('Error fetching patient stats', { error: error.message });
      throw new ApiError(500, 'Failed to fetch statistics');
    }
  }

  /**
   * Generate unique patient ID
   */
  static async generatePatientId() {
    const count = await PatientRepository.count();
    const timestamp = Date.now().toString().slice(-6);
    return `PAT-${timestamp}-${count + 1}`;
  }

  /**
   * Cache Management Utilities
   */
  static async clearPatientCache(id) {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`patient:${id}`);
    }
  }

  static async clearPatientListCache() {
    const redis = getRedisClient();
    if (redis) {
      await redis.del('patients:list');
    }
  }
}

module.exports = PatientService;
