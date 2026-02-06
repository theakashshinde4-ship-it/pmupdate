const { getDb } = require('../config/db');
const { clearCache } = require('../middleware/cache');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { parsePagination, buildPagination } = require('../platform/http/pagination');

async function listPatients(req, res) {
  try {
    console.log('🔍 listPatients called with query:', req.query);
    const { search, gender, blood_group, city, state, tab = 0, doctor_id } = req.query;
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });
    const db = getDb();
    console.log('🔍 Database connection obtained');

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    // If doctor is logged in, filter by primary_doctor_id (most accurate)
    if (req.user && req.user.role === 'doctor') {
      console.log('🔍 Doctor user found:', { user_id: req.user.id, doctor_id: req.user.doctor_id, clinic_id: req.user.clinic_id });

      let doctorId = req.user.doctor_id;

      // If doctor_id not in user object, look it up from doctors table using user_id
      if (!doctorId && req.user.id) {
        const [doctors] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctors.length > 0) {
          doctorId = doctors[0].id;
          console.log('🔍 Found doctor_id from doctors table:', doctorId);
        }
      }

      if (doctorId) {
        whereClause += ' AND p.primary_doctor_id = ?';
        params.push(doctorId);
      } else if (req.user.clinic_id) {
        whereClause += ' AND p.clinic_id = ?';
        params.push(req.user.clinic_id);
      }
    } else {
      // For public access (no authentication), show all patients or filter by clinic_id if provided
      console.log('🔍 Public access - showing all patients');
    }

    // Add manual doctor_id filter if provided
    if (doctor_id) {
      whereClause += ' AND p.primary_doctor_id = ?';
      params.push(doctor_id);
    }

    // Add search filter
    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.patient_id LIKE ? OR p.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add other filters
    if (gender) {
      whereClause += ' AND p.gender = ?';
      params.push(gender);
    }

    if (blood_group) {
      whereClause += ' AND p.blood_group = ?';
      params.push(blood_group);
    }

    if (city) {
      whereClause += ' AND p.city LIKE ?';
      params.push(`%${city}%`);
    }

    console.log('🔍 Final parameters:', params);
    console.log('🔍 Limit:', limit);
    console.log('🔍 Offset:', offset);
    
    // Main query - trimmed fields for list view
    const [patients] = await db.execute(`
      SELECT 
        p.id,
        p.patient_id,
        p.name,
        p.gender,
        p.dob,
        p.phone,
        p.email,
        p.blood_group,
        p.city,
        p.state,
        p.abha_account_id,
        p.created_at,
        p.updated_at
      FROM patients p 
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    console.log('🔍 Query successful, results:', patients.length);
    
    // Count query - simplified without JOIN
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total FROM patients p ${whereClause}
    `, params);
    const total = countResult[0]?.total || 0;
    
    console.log('🔍 Sending response');
    const pagination = buildPagination({ page, limit, total });
    return sendSuccess(res, {
      patients: patients,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages
      }
    });
    
  } catch (error) {
    console.error('🔍 listPatients error:', error);
    sendError(res, 'Failed to fetch patients', 500, process.env.NODE_ENV === 'development' ? error.message : undefined);
  }
}

async function getPatient(req, res) {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Valid Patient ID is required' });
    }

    const db = getDb();
    let rows = [];
    
    // Check if id is purely numeric (database id) or alphanumeric (patient_id like P882724640)
    const isNumericId = /^\d+$/.test(id);
    
    if (isNumericId) {
      // Try to find by numeric database ID
      [rows] = await db.execute('SELECT * FROM patients WHERE id = ?', [parseInt(id, 10)]);
    }
    
    // If not found by numeric ID or ID is alphanumeric, try by patient_id
    if (!rows.length) {
      [rows] = await db.execute('SELECT * FROM patients WHERE patient_id = ?', [String(id)]);
    }
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Patient not found', searchedId: id });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get patient', details: error.message });
  }
}

async function addPatient(req, res) {
  try {
    console.log('🔍 Patient creation request received');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);
    
    const {
      patient_id,
      name,
      email,
      phone,
      dob,
      gender,
      blood_group,
      address,
      city,
      state,
      pincode,
      emergency_contact_name,
      emergency_contact_phone,
      medical_conditions,
      allergies,
      current_medications,
      clinic_id,
      is_vip,
      vip_tier,
      priority
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }

    // Map gender to database ENUM values
    const genderMap = {
      'Male': 'M',
      'male': 'M',
      'M': 'M',
      '1': 'M',
      'Female': 'F',
      'female': 'F',
      'F': 'F',
      '2': 'F',
      'Other': 'O',
      'other': 'O',
      'O': 'O',
      'Unknown': 'U',
      'unknown': 'U',
      'U': 'U'
    };
    const mappedGender = gender ? (genderMap[gender] || 'U') : 'U';
    console.log('🔍 Original gender:', gender);
    console.log('🔍 Mapped gender:', mappedGender);

    const db = getDb();

    // Get clinic_id from request body, user context, or default to 2
    const patientClinicId = clinic_id || req.user?.clinic_id || 2;
    console.log('🔍 Clinic ID:', patientClinicId);

    // Set primary_doctor_id from logged-in doctor
    // If user is a doctor, look up their doctor_id from doctors table using user_id
    let primaryDoctorId = req.user?.doctor_id || null;

    if (!primaryDoctorId && req.user?.role === 'doctor' && req.user?.id) {
      console.log('🔍 Looking up doctor_id for user_id:', req.user.id);
      const [doctors] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (doctors.length > 0) {
        primaryDoctorId = doctors[0].id;
        console.log('🔍 Found doctor_id from doctors table:', primaryDoctorId);
      }
    }

    // Fallback to request body if still not set
    if (!primaryDoctorId) {
      primaryDoctorId = req.body.doctor_id || req.body.primary_doctor_id || null;
    }

    console.log('🔍 Final primary_doctor_id:', primaryDoctorId);

    // Generate patient_id if not provided
    const generatedPatientId = patient_id || `P${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const [result] = await db.execute(
      `INSERT INTO patients (
          patient_id, name, email, phone, dob, gender, blood_group,
          address, city, state, pincode, emergency_contact_name, emergency_contact_phone,
          medical_conditions, allergies, current_medications, clinic_id,
          primary_doctor_id, is_vip, vip_tier, priority, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generatedPatientId,
        name || null,
        email || null,
        phone || null,
        dob || null,
        mappedGender,
        blood_group || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        medical_conditions || null,
        allergies || null,
        current_medications || null,
        patientClinicId,
        primaryDoctorId,
        is_vip || 0,
        vip_tier || null,
        priority || 0,
        req.user?.id || 2 // Default user ID = 2 (first available user) if not logged in
      ]
    );

    // Update patient statistics
    await db.execute('CALL sp_update_patient_stats(?)', [result.insertId]);

    // Clear cache to ensure fresh data on next fetch
    clearCache('/api/patients');

    res.status(201).json({
      id: result.insertId,
      patient_id: generatedPatientId,
      message: 'Patient added successfully'
    });
  } catch (error) {
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Patient ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to add patient', details: error.message });
  }
}

async function updatePatient(req, res) {
  try {
    const { id } = req.params;
    
    console.log('🔍 Update patient request for ID:', id);
    console.log('🔍 Request body:', req.body);
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Valid Patient ID is required' });
    }

    const {
      patient_id,
      name,
      email,
      phone,
      dob,
      gender,
      blood_group,
      address,
      city,
      state,
      pincode,
      emergency_contact_name,
      emergency_contact_phone,
      medical_conditions,
      allergies,
      current_medications
    } = req.body;

    console.log('🔍 Emergency contact name:', emergency_contact_name);
    console.log('🔍 Emergency contact phone:', emergency_contact_phone);

    // Map gender to DB ENUM values (M, F, O, U)
    const genderMap = { 'Male': 'M', 'Female': 'F', 'Other': 'O', 'M': 'M', 'F': 'F', 'O': 'O', 'U': 'U' };
    const mappedGender = gender ? (genderMap[gender] || null) : null;

    const db = getDb();
    
    // Determine if we're updating by numeric ID or patient_id
    const isNumericId = /^\d+$/.test(id);
    let whereClause = isNumericId ? 'id = ?' : 'patient_id = ?';
    let whereValue = isNumericId ? parseInt(id, 10) : id;

    const query = `UPDATE patients SET
        patient_id = ?, name = ?, email = ?, phone = ?, dob = ?, gender = ?,
        blood_group = ?, address = ?, city = ?, state = ?, pincode = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?, medical_conditions = ?,
        allergies = ?, current_medications = ?, updated_at = CURRENT_TIMESTAMP
       WHERE ${whereClause}`;

    const queryParams = [
        patient_id || null,
        name || null,
        email || null,
        phone || null,
        dob || null,
        mappedGender,
        blood_group || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        medical_conditions || null,
        allergies || null,
        current_medications || null,
        whereValue
    ];

    console.log('🔍 Update query:', query);
    console.log('🔍 Query params:', queryParams);

    const [result] = await db.execute(query, queryParams);

    console.log('🔍 Update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Clear cache to ensure fresh data on next fetch
    clearCache('/api/patients');

    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    console.error('🔍 Update patient error:', error);
    console.error('🔍 Error details:', error.message);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update patient', details: error.message });
  }
}

async function deletePatient(req, res) {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Valid Patient ID is required' });
    }

    const db = getDb();

    // Determine if we're deleting by numeric ID or patient_id
    const isNumericId = /^\d+$/.test(id);
    let whereClause = isNumericId ? 'id = ?' : 'patient_id = ?';
    let value = isNumericId ? parseInt(id, 10) : id;

    // First, check if patient exists
    const [existingPatient] = await db.execute(
      `SELECT id FROM patients WHERE ${whereClause}`,
      [value]
    );

    if (existingPatient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientId = existingPatient[0].id;

    // Database has ON DELETE CASCADE, so related records will be automatically deleted
    // Just proceed with deletion
    const [result] = await db.execute(
      `DELETE FROM patients WHERE ${whereClause}`,
      [value]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Clear cache to ensure fresh data on next fetch
    clearCache('/api/patients');

    res.json({
      message: 'Patient deleted successfully',
      note: 'Related appointments, bills, and medical records were also removed due to cascade delete.'
    });
  } catch (error) {

    // Handle foreign key constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        error: 'Cannot delete patient due to existing related records. Please contact administrator.'
      });
    }

    res.status(500).json({ error: 'Failed to delete patient', details: error.message });
  }
}

async function mergePatients(req, res) {
  const { primaryPatientId, patientIdsToMerge } = req.body;

  if (!primaryPatientId || !patientIdsToMerge || !Array.isArray(patientIdsToMerge) || patientIdsToMerge.length < 1) {
    return res.status(400).json({ error: 'Primary patient ID and patients to merge array are required' });
  }

  const db = getDb();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get primary patient data
    const [primaryPatient] = await connection.execute('SELECT * FROM patients WHERE id = ?', [primaryPatientId]);
    if (!primaryPatient.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Primary patient not found' });
    }

    // Build placeholders for IN clause
    const placeholders = patientIdsToMerge.map(() => '?').join(',');
    
    // Get patients to merge
    const [patientsToMerge] = await connection.execute(
      `SELECT * FROM patients WHERE id IN (${placeholders})`, 
      patientIdsToMerge
    );

    // Merge logic: Update primary patient with any missing information from other patients
    const primary = primaryPatient[0];
    let updatedData = { ...primary };

    // Simple merge logic - prioritize non-null values
    patientsToMerge.forEach(patient => {
      if (!updatedData.email && patient.email) updatedData.email = patient.email;
      if (!updatedData.phone && patient.phone) updatedData.phone = patient.phone;
      if (!updatedData.address && patient.address) updatedData.address = patient.address;
      if (!updatedData.city && patient.city) updatedData.city = patient.city;
      if (!updatedData.state && patient.state) updatedData.state = patient.state;
      if (!updatedData.pincode && patient.pincode) updatedData.pincode = patient.pincode;
      if (!updatedData.emergency_contact && patient.emergency_contact) updatedData.emergency_contact = patient.emergency_contact;
      if (!updatedData.emergency_phone && patient.emergency_phone) updatedData.emergency_phone = patient.emergency_phone;
      if (!updatedData.medical_conditions && patient.medical_conditions) updatedData.medical_conditions = patient.medical_conditions;
      if (!updatedData.allergies && patient.allergies) updatedData.allergies = patient.allergies;
      if (!updatedData.current_medications && patient.current_medications) updatedData.current_medications = patient.current_medications;
    });

    // Update primary patient with merged data
    await connection.execute(
      `UPDATE patients SET
        email = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?,
        emergency_contact = ?, emergency_phone = ?, medical_conditions = ?,
        allergies = ?, current_medications = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updatedData.email, updatedData.phone, updatedData.address, updatedData.city,
        updatedData.state, updatedData.pincode, updatedData.emergency_contact,
        updatedData.emergency_phone, updatedData.medical_conditions, updatedData.allergies,
        updatedData.current_medications, primaryPatientId
      ]
    );

    // Update related records to point to primary patient
    const relatedTables = [
      'appointments',
      'medical_records', 
      'prescriptions',
      'bills',
      'lab_investigations',
      'patient_vitals',
      'family_history',
      'insurance_policies',
      'abha_records',
      'patient_tags',
      'queue',
      'test_reports'
    ];

    for (const table of relatedTables) {
      try {
        await connection.execute(
          `UPDATE ${table} SET patient_id = ? WHERE patient_id IN (${placeholders})`,
          [primaryPatientId, ...patientIdsToMerge]
        );
      } catch (err) {
        // Table might not have patient_id or records, continue
        // Skipping table if it doesnt exist
      }
    }

    // Delete merged patients (excluding primary)
    const idsToDelete = patientIdsToMerge.filter(id => id !== primaryPatientId);
    if (idsToDelete.length > 0) {
      const deletePlaceholders = idsToDelete.map(() => '?').join(',');
      await connection.execute(
        `DELETE FROM patients WHERE id IN (${deletePlaceholders})`, 
        idsToDelete
      );
    }

    await connection.commit();
    connection.release();

    // Clear cache to ensure fresh data on next fetch
    clearCache('/api/patients');

    res.json({
      message: 'Patients merged successfully',
      primaryPatientId,
      mergedCount: idsToDelete.length
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: 'Failed to merge patients', details: error.message });
  }
}

// Get patient by patient_id (string ID like P882724640)
async function getPatientByPatientId(req, res) {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM patients WHERE patient_id = ?', [patientId]);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get patient', details: error.message });
  }
}

module.exports = { 
  listPatients, 
  getPatient, 
  getPatientByPatientId,
  addPatient, 
  updatePatient, 
  deletePatient, 
  mergePatients 
};