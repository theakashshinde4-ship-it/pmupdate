const { getDb } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { parsePagination, buildPagination } = require('../platform/http/pagination');

// Default consultation fee (configurable via env)
const DEFAULT_CONSULTATION_FEE = parseInt(process.env.DEFAULT_CONSULTATION_FEE || '500', 10);

async function listAppointments(req, res) {
  let whereClause = '';
  let params = [];
  try {
    console.log('🔍 listAppointments called');
    console.log('🔍 Request headers:', req.headers.authorization ? 'Token present' : 'No token');
    console.log('🔍 User object:', req.user);
    console.log('🔍 User role:', req.user?.role);
    
    const { date, status, doctor_id, start_date, end_date } = req.query;
    const { page, limit: limitNum, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    const db = getDb();

    // Build WHERE clause
    whereClause = 'WHERE 1=1';
    params = [];

    // If doctor is logged in, filter by their doctor_id or clinic_id
    if (req.user && typeof req.user === 'object' && req.user.role === 'doctor') {
      console.log('🔍 Doctor user found:', { user_id: req.user.id, doctor_id: req.user.doctor_id, clinic_id: req.user.clinic_id });
      if (req.user.doctor_id) {
        whereClause += ' AND a.doctor_id = ?';
        params.push(req.user.doctor_id);
        console.log('🔍 Added doctor_id filter:', req.user.doctor_id);
      } else if (req.user.clinic_id) {
        whereClause += ' AND a.clinic_id = ?';
        params.push(req.user.clinic_id);
        console.log('🔍 Added clinic_id filter:', req.user.clinic_id);
      } else {
        console.log('🔍 No doctor_id or clinic_id found in user object');
      }
    } else {
      console.log('🔍 No doctor user found or user not set, using default query');
    }

    // Add manual doctor_id filter if provided
    if (doctor_id) {
      whereClause += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }

    // Add single date filter
    if (date) {
      whereClause += ' AND DATE(a.appointment_date) = ?';
      params.push(date);
    }

    // Add date range filters
    if (start_date) {
      whereClause += ' AND a.appointment_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND a.appointment_date <= ?';
      params.push(end_date);
    }

    // Add status filter
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    console.log('🔍 Final parameters:', params);
    console.log('🔍 Limit:', limitNum);
    console.log('🔍 Offset:', offset);
    console.log('🔍 limitNum:', limitNum);
    console.log('🔍 offset:', offset);

    // Main query - simplified to fix SQL parameter issues
    const safeLimit = Number(limitNum);
    const safeOffset = Number(offset);
    console.log('🔍 Executing main query with params:', params);
    console.log('🔍 Using LIMIT/OFFSET:', { safeLimit, safeOffset });
    const [appointments] = await db.execute(`
      SELECT 
        a.id,
        a.patient_id,
        a.patient_id as patient_db_id,
        a.doctor_id,
        a.clinic_id,
        a.appointment_date,
        a.appointment_time,
        a.arrival_type,
        a.appointment_type,
        a.reason_for_visit,
        a.status,
        a.payment_status,
        a.notes,
        a.checked_in_at,
        a.visit_started_at,
        a.visit_ended_at,
        a.created_at,
        a.updated_at,
        b.id as bill_id,
        b.total_amount as bill_total,
        b.amount_paid as amount_paid,
        b.balance_due as amount_due,
        b.payment_status as bill_payment_status,
        p.patient_id as uhid,
        p.name as patient_name, 
        p.phone as contact,
        p.gender as patient_gender,
        u.name as doctor_name,
        d.specialization as doctor_specialization,
        c.name as clinic_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN (
        SELECT b1.*
        FROM bills b1
        INNER JOIN (
          SELECT appointment_id, MAX(id) AS max_id
          FROM bills
          WHERE appointment_id IS NOT NULL
          GROUP BY appointment_id
        ) b2 ON b1.id = b2.max_id
      ) b ON b.appointment_id = a.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `, params);

    console.log('🔍 Query successful, results:', appointments.length);
    
    // Count query
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total FROM appointments a ${whereClause}
    `, params);
    const total = countResult[0]?.total || 0;
    
    console.log('🔍 Sending response');
    const pagination = buildPagination({ page, limit: limitNum, total });
    return sendSuccess(res, {
      appointments: appointments,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages
      }
    });
    
  } catch (error) {
    console.error('🔍 listAppointments error:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql || 'N/A',
      params: error.params || 'N/A',
      whereClause: whereClause || 'N/A'
    });
    sendError(res, 'Failed to fetch appointments', 500, process.env.NODE_ENV === 'development' ? error.message : undefined);
  }
}

async function getAppointment(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const [appointments] = await db.execute(`
      SELECT 
        a.id,
        a.patient_id as patient_db_id,
        a.doctor_id,
        a.clinic_id,
        a.appointment_date,
        a.appointment_time,
        a.slot_time,
        a.arrival_type,
        a.appointment_type,
        a.reason_for_visit,
        a.status,
        a.notes,
        a.checked_in_at,
        a.visit_started_at,
        a.visit_ended_at,
        a.created_at,
        a.updated_at,
        p.patient_id as uhid,
        p.name as patient_name,
        p.phone as contact,
        p.email as patient_email,
        p.gender as patient_gender,
        p.dob as patient_dob,
        p.abha_number,
        p.blood_group,
        p.address as patient_address,
        u.name as doctor_name,
        d.specialization as doctor_specialization,
        c.name as clinic_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN clinics c ON a.clinic_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const apt = appointments[0];
    apt.patient_id = apt.uhid; // For backward compatibility

    res.json({ appointment: apt });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
}

async function addAppointment(req, res) {
  try {
    console.log('🔍 Appointment creation request received');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);
    
    const {
      patient_id,      // This should be the database ID (INT)
      doctor_id,       // Database ID of doctor
      clinic_id,
      appointment_date,
      appointment_time,
      slot_time,
      arrival_type,
      appointment_type, // Consultation type from frontend (online/offline)
      reason_for_visit,
      notes
    } = req.body;

    // Validate required fields
    if (!patient_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        error: 'patient_id, appointment_date, and appointment_time are required' 
      });
    }

    const db = getDb();
    
    // Verify patient exists
    const [patients] = await db.execute(
      'SELECT id, name, patient_id as uhid FROM patients WHERE id = ?',
      [patient_id]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Verify doctor exists (optional)
    let doctor = null;
    if (doctor_id) {
      const [doctors] = await db.execute(
        'SELECT d.id, u.name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
        [doctor_id]
      );
      
      if (doctors.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      doctor = doctors[0];
    }

    // Map appointment_type to arrival_type if not provided
    let finalArrivalType = arrival_type;
    console.log('🔍 Original arrival_type:', arrival_type);
    console.log('🔍 Original appointment_type:', appointment_type);
    
    if (!finalArrivalType && appointment_type) {
      // Map frontend consultation types to backend arrival types
      if (appointment_type === 'offline') {
        finalArrivalType = 'walk-in'; // Offline appointments become walk-in
        console.log('🔍 Mapped offline -> walk-in');
      } else if (appointment_type === 'online') {
        finalArrivalType = 'online'; // Online appointments stay online
        console.log('🔍 Mapped online -> online');
      } else {
        finalArrivalType = 'walk-in'; // Default fallback
        console.log('🔍 Used default walk-in');
      }
    } else if (finalArrivalType) {
      console.log('🔍 Using provided arrival_type:', finalArrivalType);
    } else {
      finalArrivalType = 'walk-in'; // Default fallback
      console.log('🔍 Used default fallback walk-in');
    }
    
    console.log('🔍 Final arrival_type:', finalArrivalType);

    // Check for duplicate appointment
    let duplicateQuery = `
      SELECT id FROM appointments 
      WHERE patient_id = ? AND appointment_date = ? AND appointment_time = ?
      AND status NOT IN ('cancelled', 'no-show')
    `;
    let duplicateParams = [patient_id, appointment_date, appointment_time];
    
    if (doctor_id) {
      duplicateQuery += ' AND doctor_id = ?';
      duplicateParams.push(doctor_id);
    }

    const [existing] = await db.execute(duplicateQuery, duplicateParams);

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'An appointment already exists for this patient at the same date and time' 
      });
    }

    const [result] = await db.execute(`
      INSERT INTO appointments (
        patient_id, doctor_id, clinic_id, appointment_date,
        appointment_time, slot_time, arrival_type, reason_for_visit, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        patient_id, 
        doctor_id, 
        clinic_id || null, 
        appointment_date, 
        appointment_time, 
        slot_time || appointment_time,
        finalArrivalType || 'walk-in',
        reason_for_visit || null, 
        notes || null
      ]
    );

    // Logging removed for production

    res.status(201).json({
      id: result.insertId,
      patient_id: patient_id,
      patient_name: patients[0].name,
      patient_uhid: patients[0].uhid,
      doctor_name: doctor?.name || null,
      doctor_id: doctor_id || null,
      arrival_type: finalArrivalType,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    console.error('Appointment creation error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status against your ENUM
    const allowedStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` 
      });
    }

    const db = getDb();
    
    // Get current status for history
    const [current] = await db.execute(
      'SELECT status FROM appointments WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const oldStatus = current[0].status;

    // Update appointment
    let updateQuery = 'UPDATE appointments SET status = ?, updated_at = NOW()';
    const params = [status];

    // Handle special status updates
    if (status === 'completed') {
      updateQuery += ', visit_ended_at = NOW()';
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await db.execute(updateQuery, params);

    // Update patient statistics if appointment is completed
    if (status === 'completed') {
      try {
        const [appt] = await db.execute('SELECT patient_id, clinic_id FROM appointments WHERE id = ?', [id]);
        if (appt.length > 0) {
          await db.execute('CALL sp_update_patient_stats(?, ?)', [appt[0].patient_id, appt[0].clinic_id]);
        }
      } catch (statsErr) {
        // Warning logged silently - don't fail the main operation
      }
    }

    // Log status change in history table
    try {
      await db.execute(`
        INSERT INTO appointment_status_history (appointment_id, old_status, new_status, notes)
        VALUES (?, ?, ?, ?)
      `, [id, oldStatus, status, notes || null]);
    } catch (historyErr) {
      // Warning logged silently
    }

    // Logging removed for production

    // Track subscription session usage if appointment completed
    if (status === 'completed' && oldStatus !== 'completed') {
      try {
        // Get patient_id from appointment
        const [apts] = await db.execute('SELECT patient_id FROM appointments WHERE id = ?', [id]);
        if (apts.length > 0) {
          const patientId = apts[0].patient_id;
          
          // Find active subscription for this patient
          const [subscriptions] = await db.execute(`
            SELECT id FROM patient_subscriptions 
            WHERE patient_id = ? AND status = 'active' AND end_date >= CURDATE()
            LIMIT 1
          `, [patientId]);

          // If subscription exists, track session usage
          if (subscriptions.length > 0) {
            const subscriptionId = subscriptions[0].id;
            await db.execute(`
              UPDATE patient_subscriptions
              SET sessions_used = sessions_used + 1, last_session_date = NOW()
              WHERE id = ?
            `, [subscriptionId]);
            // Logging removed for production
          }
        }
      } catch (subErr) {
        // Warning logged silently
        // Continue even if subscription tracking fails
      }
    }

    res.json({ 
      message: `Appointment status updated to ${status}`,
      id: parseInt(id),
      status,
      previous_status: oldStatus
    });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const {
      appointment_date,
      appointment_time,
      slot_time,
      reason_for_visit,
      notes,
      doctor_id,
      clinic_id,
      arrival_type
    } = req.body;

    // Logging removed for production

    const db = getDb();

    const [result] = await db.execute(`
      UPDATE appointments SET
        appointment_date = COALESCE(?, appointment_date),
        appointment_time = COALESCE(?, appointment_time),
        slot_time = COALESCE(?, slot_time),
        reason_for_visit = COALESCE(?, reason_for_visit),
        notes = COALESCE(?, notes),
        doctor_id = COALESCE(?, doctor_id),
        clinic_id = COALESCE(?, clinic_id),
        arrival_type = COALESCE(?, arrival_type),
        updated_at = NOW()
      WHERE id = ?
    `, [
      appointment_date || null,
      appointment_time || null,
      slot_time || null,
      reason_for_visit || null,
      notes || null,
      doctor_id || null,
      clinic_id || null,
      arrival_type || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Logging removed for production

    res.json({
      message: 'Appointment updated successfully',
      id: parseInt(id)
    });
  } catch (error) {
    // Error handled by global handler
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to update appointment', message: error.message });
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const [result] = await db.execute(
      'DELETE FROM appointments WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
}

async function checkInAppointment(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.execute(`
      UPDATE appointments 
      SET checked_in_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Patient checked in successfully' });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to check in patient' });
  }
}

async function startVisit(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    // Calculate waiting time if checked in
    const [apt] = await db.execute(
      'SELECT checked_in_at FROM appointments WHERE id = ?',
      [id]
    );

    let waitingTime = null;
    if (apt.length > 0 && apt[0].checked_in_at) {
      const checkedIn = new Date(apt[0].checked_in_at);
      const now = new Date();
      waitingTime = Math.round((now - checkedIn) / 60000); // minutes
    }

    await db.execute(`
      UPDATE appointments 
      SET visit_started_at = NOW(), 
          waiting_time_minutes = ?,
          status = 'in-progress',
          updated_at = NOW()
      WHERE id = ?
    `, [waitingTime, id]);

    res.json({ 
      message: 'Visit started',
      waiting_time_minutes: waitingTime
    });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to start visit' });
  }
}

async function endVisit(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    // Calculate actual duration
    const [apt] = await db.execute(
      'SELECT visit_started_at FROM appointments WHERE id = ?',
      [id]
    );

    let duration = null;
    if (apt.length > 0 && apt[0].visit_started_at) {
      const started = new Date(apt[0].visit_started_at);
      const now = new Date();
      duration = Math.round((now - started) / 60000); // minutes
    }

    await db.execute(`
      UPDATE appointments 
      SET visit_ended_at = NOW(), 
          actual_duration_minutes = ?,
          status = 'completed',
          updated_at = NOW()
      WHERE id = ?
    `, [duration, id]);

    res.json({ 
      message: 'Visit completed',
      actual_duration_minutes: duration
    });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to end visit' });
  }
}

// Get today's appointments summary
async function getTodaysSummary(req, res) {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no-show' THEN 1 ELSE 0 END) as no_show,
        SUM(CASE WHEN checked_in_at IS NOT NULL AND visit_started_at IS NULL THEN 1 ELSE 0 END) as waiting
      FROM appointments
      WHERE appointment_date = ?
    `, [today]);

    res.json({ 
      date: today,
      summary: summary[0] 
    });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to get summary' });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    console.log('🔍 updatePaymentStatus called:', { id, payment_status });

    if (!payment_status) {
      return res.status(400).json({ error: 'Payment status is required' });
    }

    const allowedPaymentStatuses = ['pending', 'paid', 'partial', 'cancelled', 'refunded'];
    if (!allowedPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    console.log('🔍 Payment status is valid:', payment_status);

    const db = getDb();

    // Find the most recent bill for this appointment
    const [bills] = await db.execute(
      'SELECT id FROM bills WHERE appointment_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    console.log('🔍 Bills found for appointment:', bills.length);

    let billId;

    if (bills.length === 0) {
      console.log('🔍 No bills found for appointment, checking patient bills...');

      // Fallback: try to find a bill by the appointment's patient_id (some bills may not have appointment_id set)
      const [appts] = await db.execute(
        'SELECT patient_id, doctor_id, appointment_date FROM appointments WHERE id = ?',
        [id]
      );

      if (appts.length === 0) {
        console.log('❌ Appointment not found');
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const { patient_id: patientDbId } = appts[0];

      if (!patientDbId) {
        console.log('❌ No patient associated with this appointment');
        return res.status(404).json({ error: 'No patient associated with this appointment' });
      }

      // Try to find a recent bill for this patient (created today)
      const [patientBills] = await db.execute(
        `SELECT id FROM bills WHERE patient_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 1`,
        [patientDbId]
      );

      if (patientBills.length === 0) {
        console.log('ℹ️ No bill found for this appointment. Please create a receipt first.');
        return res.status(404).json({
          error: 'No bill found for this appointment. Please create a receipt first.',
          code: 'NO_BILL_FOUND'
        });
      } else {
        billId = patientBills[0].id;
        console.log('🔧 Using existing patient bill ID:', billId);
      }
    } else {
      billId = bills[0].id;
      console.log('🔧 Using existing appointment bill ID:', billId);
    }

    console.log('🔧 Updating bill payment status to:', payment_status, 'for bill ID:', billId);

    // Update the bill's payment status
    await db.execute(
      'UPDATE bills SET payment_status = ?, updated_at = NOW() WHERE id = ?',
      [payment_status, billId]
    );

    console.log('✅ Payment status updated successfully');

    res.json({ message: 'Payment status updated successfully', payment_status, bill_id: billId });
  } catch (error) {
    console.error('❌ updatePaymentStatus error:', error);
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to update payment status', details: error.message });
  }
}

async function listFollowUps(req, res) {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Get all pending and upcoming follow-ups with patient and appointment details
    const patientIdFilter = (req.query && req.query.patient_id) ? parseInt(req.query.patient_id, 10) : null;
    const [followups] = await db.execute(`
      SELECT
        af.id,
        af.appointment_id,
        af.followup_date,
        af.reason,
        af.status,
        af.created_at,
        a.appointment_date as original_appointment_date,
        a.reason_for_visit,
        p.id as patient_db_id,
        p.patient_id as uhid,
        p.name as patient_name,
        p.phone as contact,
        p.phone as patient_phone,
        p.email as patient_email,
        u.name as doctor_name
      FROM appointment_followups af
      JOIN appointments a ON af.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE af.status IN ('pending', 'scheduled')
        AND (? IS NULL OR p.id = ?)
      ORDER BY af.followup_date ASC
    `, [patientIdFilter, patientIdFilter]);

    res.json({ followups });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
}

async function getBookedSlots(req, res) {
  try {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res.status(400).json({ error: 'doctor_id and date are required' });
    }

    const db = getDb();

    // Get all booked slots for the doctor on the specified date
    const [bookedSlots] = await db.execute(`
      SELECT
        appointment_time,
        status
      FROM appointments
      WHERE doctor_id = ?
        AND appointment_date = ?
        AND status NOT IN ('cancelled', 'no-show')
      ORDER BY appointment_time
    `, [doctor_id, date]);

    // Extract time slots from results and format as HH:MM (removing seconds)
    const slots = bookedSlots.map(slot => {
      const time = slot.appointment_time;
      // Convert "HH:MM:SS" to "HH:MM"
      return typeof time === 'string' ? time.substring(0, 5) : time;
    });

    res.json({ bookedSlots: slots, count: slots.length });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
}

module.exports = {
  listAppointments,
  getAppointment,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  updatePaymentStatus,
  deleteAppointment,
  checkInAppointment,
  startVisit,
  endVisit,
  getTodaysSummary,
  listFollowUps,
  getBookedSlots
};