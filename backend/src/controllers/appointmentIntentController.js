const { getDb } = require('../config/db');
const { sendValidationError, sendConflict, sendCreated, sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

async function generateExternalPatientId(db) {
  // Try a few times to generate a unique external patient_id
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `PAT${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 9000 + 1000)}`;
    const [rows] = await db.execute('SELECT id FROM patients WHERE patient_id = ? LIMIT 1', [candidate]);
    if (rows.length === 0) return candidate;
    // small delay could be added here if needed
  }
  throw new Error('Unable to generate unique patient_id');
}

async function addAppointmentIntent(req, res) {
  try {
    console.log('🔍 Appointment Intent request received');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    
    const { full_name, phone, email, speciality, preferred_date, preferred_time, message, auto_create, arrival_type, appointment_type, doctor_id: reqDoctorId } = req.body;

    if (!full_name || !phone) {
      return sendValidationError(res, 'Full name and phone are required');
    }

    const db = getDb();

    // Map arrival_type / appointment_type to correct database values
    // DB expects: 'walk-in' or 'online' (not 'offline')
    let finalArrivalType = arrival_type || appointment_type || 'walk-in';
    console.log('🔍 Original arrival_type:', arrival_type);
    console.log('🔍 Original appointment_type:', appointment_type);

    // Map 'offline' to 'walk-in' (frontend sends 'offline', DB expects 'walk-in')
    if (finalArrivalType === 'offline') {
      finalArrivalType = 'walk-in';
      console.log('🔍 Mapped offline -> walk-in');
    } else if (finalArrivalType === 'online') {
      // 'online' stays as 'online'
      console.log('🔍 Keeping online as online');
    } else if (!['walk-in', 'online', 'scheduled'].includes(finalArrivalType)) {
      // Unknown value, default to walk-in
      finalArrivalType = 'walk-in';
      console.log('🔍 Unknown value, defaulting to walk-in');
    }

    console.log('🔍 Final arrival_type:', finalArrivalType);

    // If auto_create is true, create patient and appointment directly
    if (auto_create) {
      // Check if patient exists by phone
      let [patients] = await db.execute(
        'SELECT id FROM patients WHERE phone = ? LIMIT 1',
        [phone]
      );

      let patientId;
      if (patients.length > 0) {
        patientId = patients[0].id;
      } else {
        // Create new patient
        // Generate a safe unique external patient_id
        const externalPatientId = await generateExternalPatientId(db);

        // Get default clinic_id (first clinic or 1)
        const [clinics] = await db.execute('SELECT id FROM clinics LIMIT 1');
        const clinicId = clinics.length > 0 ? clinics[0].id : 1;

        const [patientResult] = await db.execute(
          `INSERT INTO patients (patient_id, name, phone, email, gender, clinic_id, created_at)
           VALUES (?, ?, ?, ?, 'O', ?, NOW())`,
          [externalPatientId, full_name, phone, email || null, clinicId]
        );
        patientId = patientResult.insertId;
      }

      // Get doctor - use provided doctor_id or first active doctor
      let doctorId;
      let clinicId;
      if (reqDoctorId) {
        doctorId = reqDoctorId;
        const [docRow] = await db.execute('SELECT clinic_id FROM doctors WHERE id = ?', [doctorId]);
        clinicId = docRow.length > 0 ? docRow[0].clinic_id : 2;
      } else {
        const [doctors] = await db.execute(
          "SELECT id, clinic_id FROM doctors WHERE status = 'active' LIMIT 1"
        );
        doctorId = doctors.length > 0 ? doctors[0].id : 1;
        clinicId = doctors.length > 0 ? doctors[0].clinic_id : 2;
      }

      // Create appointment
      const appointmentDate = preferred_date || new Date().toISOString().split('T')[0];
      let appointmentTime = preferred_time || '10:00';

      // Ensure time format is HH:MM:SS for MySQL TIME type
      if (appointmentTime && !appointmentTime.includes(':00:00')) {
        appointmentTime = appointmentTime.length === 5 ? appointmentTime + ':00' : appointmentTime;
      }

      // Check if slot is already booked
      const [existingBooking] = await db.execute(
        `SELECT id FROM appointments
         WHERE doctor_id = ?
           AND appointment_date = ?
           AND appointment_time = ?
           AND status NOT IN ('cancelled', 'no-show')`,
        [doctorId, appointmentDate, appointmentTime]
      );

      if (existingBooking.length > 0) {
        return sendConflict(res, 'This time slot is already booked. Please select another time.');
      }

      const [appointmentResult] = await db.execute(
        `INSERT INTO appointments (
           patient_id, doctor_id, clinic_id, appointment_date, appointment_time,
           arrival_type, reason_for_visit, status, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())`,
        [patientId, doctorId, clinicId, appointmentDate, appointmentTime, finalArrivalType, speciality || 'General consultation']
      );

      return sendCreated(res, {
        id: appointmentResult.insertId,
        patient_id: patientId
      }, 'Appointment created successfully');
    }

    // Normal flow: just create intent
    const [result] = await db.execute(
      `INSERT INTO appointment_intents (full_name, phone, speciality, preferred_date, message, status)
       VALUES (?, ?, ?, ?, ?, 'new')`,
      [full_name, phone, speciality || null, preferred_date || null, message || null]
    );

    sendCreated(res, {
      id: result.insertId
    }, 'Appointment request submitted successfully');
  } catch (error) {
    console.error('Add appointment intent error:', error);
    sendError(res, 'Failed to submit appointment request', 500, error.message);
  }
}

async function listAppointmentIntents(req, res) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM appointment_intents WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      // By default, exclude completed intents
      query += ' AND status != ?';
      params.push('completed');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [intents] = await db.execute(query, params);
    sendSuccess(res, { intents }, 'Appointment intents retrieved successfully');
  } catch (error) {
    console.error('List appointment intents error:', error);
    sendError(res, 'Failed to fetch appointment intents', 500, error.message);
  }
}

async function getAppointmentIntent(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const [intents] = await db.execute(
      'SELECT * FROM appointment_intents WHERE id = ?',
      [id]
    );

    if (intents.length === 0) {
      return sendNotFound(res, 'Appointment intent not found');
    }

    sendSuccess(res, { intent: intents[0] }, 'Appointment intent retrieved successfully');
  } catch (error) {
    console.error('Get appointment intent error:', error);
    sendError(res, 'Failed to fetch appointment intent', 500, error.message);
  }
}

async function updateAppointmentIntentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const db = getDb();

    const validStatuses = ['new', 'contacted', 'scheduled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendValidationError(res, 'Invalid status');
    }

    await db.execute(
      'UPDATE appointment_intents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Log the status change
    if (req.user?.id) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'UPDATE_STATUS', 'appointment_intent', id, JSON.stringify({ old_status: 'unknown', new_status: status, notes })]
      );
    }

    sendSuccess(res, null, 'Appointment intent status updated successfully');
  } catch (error) {
    console.error('Update appointment intent status error:', error);
    sendError(res, 'Failed to update appointment intent status', 500, error.message);
  }
}

async function convertToAppointment(req, res) {
  try {
    const { id } = req.params;
    const { patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, create_patient } = req.body;
    const db = getDb();

    // Get the intent details
    const [intents] = await db.execute(
      'SELECT * FROM appointment_intents WHERE id = ?',
      [id]
    );

    if (intents.length === 0) {
      return sendNotFound(res, 'Appointment intent not found');
    }

    const intent = intents[0];
    let finalPatientId = patient_id;

    // If create_patient is true and patient_id is not provided, create a new patient
    if (create_patient && !patient_id) {
      // Generate patient_id (you might want to use a better ID generation strategy)
      const [existingPatients] = await db.execute('SELECT COUNT(*) as count FROM patients');
      const patientId = `PAT${String(existingPatients[0].count + 1).padStart(6, '0')}`;

      // Create new patient from intent data
      const [patientResult] = await db.execute(
        `INSERT INTO patients (patient_id, name, phone, email, gender, created_at)
         VALUES (?, ?, ?, ?, 'Unknown', CURRENT_TIMESTAMP)`,
        [patientId, intent.full_name, intent.phone, null]
      );

      finalPatientId = patientResult.insertId;

      // Log patient creation
      if (req.user?.id) {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'CREATE', 'patient', finalPatientId, JSON.stringify({ source: 'appointment_intent', intent_id: id })]
        );
      }
    }

    if (!finalPatientId || !doctor_id || !appointment_date || !appointment_time) {
      return sendValidationError(res, 'Patient ID, Doctor ID, Date, and Time are required');
    }

    // Create the appointment
    const [result] = await db.execute(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status, notes)
       VALUES (?, ?, ?, ?, ?, 'scheduled', ?)`,
      [finalPatientId, doctor_id, appointment_date, appointment_time, reason_for_visit || intent.message, `Converted from intent: ${intent.full_name} (${intent.phone})`]
    );

    // Update intent status
    await db.execute(
      'UPDATE appointment_intents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['scheduled', id]
    );

    // Send notification (if notification service is available)
    try {
      const { sendEmailNotification } = require('./notificationController');
      const [patients] = await db.execute('SELECT name, email FROM patients WHERE id = ?', [finalPatientId]);
      const [doctors] = await db.execute('SELECT u.name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [doctor_id]);
      
      if (patients.length > 0 && patients[0].email) {
        // This would be called asynchronously in production
        // For now, we'll just log it
        console.log('Would send appointment confirmation email to:', patients[0].email);
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError);
    }

    // Log the conversion
    if (req.user?.id) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'CONVERT_TO_APPOINTMENT', 'appointment_intent', id, JSON.stringify({ appointment_id: result.insertId, patient_id: finalPatientId, doctor_id })]
      );
    }

    sendSuccess(res, {
      appointment_id: result.insertId,
      patient_id: finalPatientId
    }, 'Appointment created successfully');
  } catch (error) {
    console.error('Convert to appointment error:', error);
    sendError(res, 'Failed to convert intent to appointment', 500, error.message);
  }
}

async function deleteAppointmentIntent(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.execute('DELETE FROM appointment_intents WHERE id = ?', [id]);

    // Log the deletion
    if (req.user?.id) {
      await db.execute(
        'INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'DELETE', 'appointment_intent', id, 'Appointment intent deleted']
      );
    }

    sendSuccess(res, null, 'Appointment intent deleted successfully');
  } catch (error) {
    console.error('Delete appointment intent error:', error);
    sendError(res, 'Failed to delete appointment intent', 500, error.message);
  }
}

module.exports = {
  addAppointmentIntent,
  listAppointmentIntents,
  getAppointmentIntent,
  updateAppointmentIntentStatus,
  convertToAppointment,
  deleteAppointmentIntent
};

