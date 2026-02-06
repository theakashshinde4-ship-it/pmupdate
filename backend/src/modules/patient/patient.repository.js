/**
 * Patient Module - Repository Layer
 * Abstraction for database operations
 * 
 * Responsibilities:
 * - Build SQL queries
 * - Execute database operations
 * - Handle result mapping
 * - Index optimization
 * 
 * NOT responsible for:
 * - Business logic (service)
 * - Authorization (service)
 * - Validation (validation)
 * - HTTP handling (controller)
 */
const { getDatabase } = require('../../config/database');
const PatientModel = require('./patient.model');
const { logger } = require('../../monitoring/logger');

class PatientRepository {
  /**
   * Create patient
   */
  static async create(data) {
    const db = getDatabase();

    const query = `
      INSERT INTO patients (
        patient_id, name, email, phone, blood_group, date_of_birth,
        gender, city, state, address, emergency_contact_name,
        emergency_contact_phone, primary_doctor_id, clinic_id,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.patient_id,
      data.name,
      data.email,
      data.phone,
      data.blood_group || null,
      data.date_of_birth || null,
      data.gender || null,
      data.city || null,
      data.state || null,
      data.address || null,
      data.emergency_contact_name || null,
      data.emergency_contact_phone || null,
      data.primary_doctor_id || null,
      data.clinic_id || null,
      data.created_by || null,
      data.created_at || new Date()
    ];

    const [result] = await db.execute(query, values);

    logger.debug('Patient created in DB', { insertId: result.insertId });

    return {
      id: result.insertId,
      ...data
    };
  }

  /**
   * Find patient by ID (active records only)
   */
  static async findById(id) {
    const db = getDatabase();

    const [rows] = await db.execute(
      `SELECT * FROM patients WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    return rows[0] ? new PatientModel(rows[0]) : null;
  }

  /**
   * Find patient by patient_id (unique identifier)
   */
  static async findByPatientId(patient_id) {
    const db = getDatabase();

    const [rows] = await db.execute(
      `SELECT * FROM patients WHERE patient_id = ? AND deleted_at IS NULL`,
      [patient_id]
    );

    return rows[0] ? new PatientModel(rows[0]) : null;
  }

  /**
   * Find patient by email (case-insensitive)
   */
  static async findByEmail(email) {
    const db = getDatabase();

    const [rows] = await db.execute(
      `SELECT * FROM patients WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL`,
      [email]
    );

    return rows[0] ? new PatientModel(rows[0]) : null;
  }

  /**
   * Find patient by phone
   */
  static async findByPhone(phone) {
    const db = getDatabase();

    const [rows] = await db.execute(
      `SELECT * FROM patients WHERE phone = ? AND deleted_at IS NULL`,
      [phone]
    );

    return rows[0] ? new PatientModel(rows[0]) : null;
  }

  /**
   * List patients with filters and pagination
   */
  static async list(filter, user) {
    const db = getDatabase();

    let whereClause = 'WHERE p.deleted_at IS NULL';
    const params = [];

    // Doctor can only see their patients
    if (user.role === 'doctor') {
      whereClause += ' AND p.primary_doctor_id = ?';
      params.push(user.doctor_id);
    }

    // Clinic filtering
    if (user.clinic_id) {
      whereClause += ' AND p.clinic_id = ?';
      params.push(user.clinic_id);
    }

    // Search filter
    if (filter.search) {
      whereClause += ' AND (p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR p.patient_id LIKE ?)';
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Gender filter
    if (filter.gender) {
      whereClause += ' AND p.gender = ?';
      params.push(filter.gender);
    }

    // Blood group filter
    if (filter.blood_group) {
      whereClause += ' AND p.blood_group = ?';
      params.push(filter.blood_group);
    }

    // City filter
    if (filter.city) {
      whereClause += ' AND p.city LIKE ?';
      params.push(`%${filter.city}%`);
    }

    // State filter
    if (filter.state) {
      whereClause += ' AND p.state LIKE ?';
      params.push(`%${filter.state}%`);
    }

    // Doctor filter (override if specified)
    if (filter.doctor_id && user.role === 'admin') {
      whereClause = whereClause.replace('p.primary_doctor_id = ?', 'p.primary_doctor_id = ?');
      params[0] = filter.doctor_id;
    }

    // Get total count (without pagination)
    const countQuery = `SELECT COUNT(*) as total FROM patients p ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const sortBy = filter.sort_by || 'created_at';
    const sortOrder = filter.sort_order || 'desc';

    // Validate sort fields (prevent SQL injection)
    const allowedSortFields = ['created_at', 'name', 'email', 'patient_id'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'DESC';

    const listQuery = `
      SELECT p.* FROM patients p
      ${whereClause}
      ORDER BY p.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(filter.limit, offset);

    const [patients] = await db.execute(listQuery, params);

    logger.debug('Patients listed', { count: patients.length, total, filter });

    return {
      patients: patients.map(p => new PatientModel(p)),
      total
    };
  }

  /**
   * Search patients
   */
  static async search(query, limit = 10) {
    const db = getDatabase();

    const searchTerm = `%${query}%`;

    const [patients] = await db.execute(`
      SELECT * FROM patients
      WHERE deleted_at IS NULL AND (
        name LIKE ? OR
        email LIKE ? OR
        phone LIKE ? OR
        patient_id LIKE ?
      )
      ORDER BY CASE
        WHEN name LIKE ? THEN 1
        WHEN patient_id LIKE ? THEN 2
        ELSE 3
      END
      LIMIT ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, `${query}%`, `${query}%`, limit]);

    return patients.map(p => new PatientModel(p));
  }

  /**
   * Update patient
   */
  static async update(id, data) {
    const db = getDatabase();

    // Allowed fields (prevent mass assignment)
    const allowedFields = [
      'name', 'email', 'phone', 'blood_group', 'date_of_birth',
      'gender', 'city', 'state', 'address', 'emergency_contact_name',
      'emergency_contact_phone', 'updated_at', 'updated_by'
    ];

    const updateFields = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .map(key => `${key} = ?`);

    if (updateFields.length === 0) {
      const patient = await this.findById(id);
      return patient;
    }

    const values = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .map(key => data[key]);

    values.push(id);

    await db.execute(
      `UPDATE patients SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    logger.debug('Patient updated', { id, fields: updateFields.length });

    return this.findById(id);
  }

  /**
   * Soft delete patient
   */
  static async softDelete(id) {
    const db = getDatabase();

    await db.execute(
      `UPDATE patients SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    logger.debug('Patient soft deleted', { id });
  }

  /**
   * Hard delete patient (use with caution)
   */
  static async hardDelete(id) {
    const db = getDatabase();

    await db.execute(
      `DELETE FROM patients WHERE id = ?`,
      [id]
    );

    logger.warn('Patient hard deleted', { id });
  }

  /**
   * Count total patients
   */
  static async count(filter = {}) {
    const db = getDatabase();

    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (filter.doctor_id) {
      whereClause += ' AND primary_doctor_id = ?';
      params.push(filter.doctor_id);
    }

    const [result] = await db.execute(
      `SELECT COUNT(*) as count FROM patients ${whereClause}`,
      params
    );

    return result[0].count;
  }

  /**
   * Get patient statistics
   */
  static async getStats(user) {
    const db = getDatabase();

    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (user.role === 'doctor') {
      whereClause += ' AND primary_doctor_id = ?';
      params.push(user.doctor_id);
    }

    if (user.clinic_id) {
      whereClause += ' AND clinic_id = ?';
      params.push(user.clinic_id);
    }

    const [result] = await db.execute(`
      SELECT
        COUNT(*) as total_patients,
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female_count,
        COUNT(DISTINCT YEAR(date_of_birth)) as age_groups,
        MAX(created_at) as latest_patient_created
      FROM patients
      ${whereClause}
    `, params);

    return {
      total: result[0].total_patients || 0,
      males: result[0].male_count || 0,
      females: result[0].female_count || 0,
      ageGroups: result[0].age_groups || 0,
      latestCreated: result[0].latest_patient_created
    };
  }
}

module.exports = PatientRepository;
