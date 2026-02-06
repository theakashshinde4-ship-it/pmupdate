const { getDb } = require('../config/db');

// Helper to detect which column exists on `queue` table from a list of candidates
async function detectQueueColumn(candidates) {
  const db = getDb();
  const placeholders = candidates.map(() => '?').join(',');
  // Order by FIELD to respect candidate priority
  const fieldOrder = candidates.map(c => `'${c}'`).join(',');
  const [rows] = await db.execute(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'queue' AND column_name IN (${placeholders}) ORDER BY FIELD(column_name, ${fieldOrder})`,
    candidates
  );
  return (rows[0] && rows[0].column_name) || candidates[0];
}

/**
 * Get today's queue for Doctor Dashboard
 * Returns patients organized by status (waiting, in_progress, completed)
 * Includes patient details, vitals, VIP status, and waiting time
 */
exports.getTodayQueue = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const doctorId = req.user?.doctor_id || req.query.doctor_id;
    const db = getDb();

    console.log('🔍 getTodayQueue called');
    console.log('🔍 Doctor ID:', doctorId);
    console.log('🔍 User:', req.user?.id ? `User ${req.user.id}` : 'Public access');

    try {
      // Simple query to check if queue table exists and has data
      const sql = `
        SELECT
          q.id as queue_id,
          q.token_number,
          q.status,
          q.priority,
          q.check_in_time as checked_in_at,
          q.notes as queue_notes,
          p.id as patient_id,
          p.name,
          TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) as age,
          p.gender,
          p.phone,
          p.is_vip,
          p.vip_tier,
          p.priority as patient_priority,
          p.email,
          a.id as appointment_id,
          a.reason_for_visit as chief_complaint,
          a.appointment_time
        FROM queue q
        INNER JOIN patients p ON q.patient_id = p.id
        LEFT JOIN appointments a ON q.appointment_id = a.id
        WHERE DATE(q.check_in_time) = ?
        ORDER BY q.check_in_time ASC
      `;

      const params = [today];
      const [results] = await db.execute(sql, params);

      // Transform results
      const queueData = results.map(row => ({
        id: row.queue_id,
        patient_id: row.patient_id,
        appointment_id: row.appointment_id,
        token_number: row.token_number,
        status: row.status,
        name: row.name,
        age: row.age,
        gender: row.gender,
        phone: row.phone,
        email: row.email,
        is_vip: row.is_vip === 1,
        vip_tier: row.vip_tier,
        priority: row.priority || row.patient_priority || 0,
        chief_complaint: row.chief_complaint,
        appointment_time: row.appointment_time,
        waiting_time: 0,
        notes: row.queue_notes,
        vitals: null
      }));

      res.json(queueData);
    } catch (dbError) {
      // If queue table doesn't exist, return empty array
      console.error('Queue query error:', dbError.message);
      res.json([]);
    }
  } catch (error) {
    console.error('Get today queue error:', error);
    res.json([]);
  }
};

/**
 * Update queue status (waiting -> in_progress -> completed)
 */
exports.updateQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();

    // Validate status
    const validStatuses = ['waiting', 'in_progress', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update queue status
    let updateSql = 'UPDATE queue SET status = ?, ';
    const updateParams = [status];

    if (status === 'in_progress') {
      updateSql += 'called_at = NOW(), ';
    }
    if (status === 'completed') {
      updateSql += 'completed_at = NOW(), ';
    }

    // Handle skip billing option
    if (req.body.skip_billing === true) {
      updateSql += 'visit_status = "with_staff", ';
    } else if (req.body.skip_billing === false) {
      updateSql += 'visit_status = "unbilled", ';
    }

    // Remove trailing comma and finish
    updateSql = updateSql.replace(/,\s*$/, '') + ' WHERE id = ?';
    updateParams.push(id);

    await db.execute(updateSql, updateParams);

    // Also update appointment status if exists
    const statusMap = {
      waiting: 'checked-in',
      in_progress: 'in-progress',
      completed: 'completed',
      cancelled: 'cancelled',
      'no-show': 'no-show'
    };
    const apptStatus = statusMap[status] || null;

    if (apptStatus) {
      const appointmentSql = `
        UPDATE appointments a
        INNER JOIN queue q ON a.id = q.appointment_id
        SET a.status = ?
        WHERE q.id = ?
      `;
      await db.execute(appointmentSql, [apptStatus, id]);
    }

    res.json({ success: true, message: 'Queue status updated' });
  } catch (error) {
    console.error('Update queue status error:', error);
    res.status(500).json({ error: 'Failed to update queue status', details: error.message });
  }
};

/**
 * Add patient to queue (walk-in or from appointment)
 */
exports.addToQueue = async (req, res) => {
  try {
    const {
      patient_id,
      appointment_id,
      doctor_id,
      priority,
      notes
    } = req.body;
    const db = getDb();

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Detect checked-in column for compatibility
    const checkedCol = await detectQueueColumn(['check_in_time', 'checked_in_at', 'checkin_time', 'created_at']);

    // Check if patient already in queue today
    const checkSql = `
      SELECT id FROM queue
      WHERE patient_id = ?
      AND DATE(${checkedCol}) = ?
      AND status NOT IN ('completed', 'cancelled', 'no-show')
    `;
    const [existing] = await db.execute(checkSql, [patient_id, today]);

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Patient already in queue today',
        queue_id: existing[0].id
      });
    }

    // Generate token number
    const tokenSql = `
      SELECT COALESCE(MAX(CAST(token_number AS UNSIGNED)), 0) + 1 as next_token
      FROM queue
      WHERE DATE(${checkedCol}) = ?
    `;
    const [tokenResult] = await db.execute(tokenSql, [today]);
    const tokenNumber = tokenResult[0].next_token;

    // Get patient VIP priority
    const patientSql = `SELECT priority, is_vip FROM patients WHERE id = ?`;
    const [patientData] = await db.execute(patientSql, [patient_id]);
    const patientPriority = patientData[0]?.priority || 0;

    // Insert into queue
    const insertSql = `
      INSERT INTO queue (
        patient_id,
        appointment_id,
        doctor_id,
        clinic_id,
        token_number,
        priority,
        status,
        ${checkedCol},
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'waiting', NOW(), ?)
    `;

    const finalPriority = priority || patientPriority || 0;

    const [result] = await db.execute(insertSql, [
      patient_id,
      appointment_id || null,
      doctor_id || req.user?.doctor_id || 2, // Use provided doctor_id, then logged-in doctor, then default
      2, // Default clinic_id
      tokenNumber,
      finalPriority,
      notes || null
    ]);

    res.status(201).json({
      success: true,
      queue_id: result.insertId,
      token_number: tokenNumber,
      message: 'Patient added to queue'
    });
  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(500).json({ error: 'Failed to add to queue', details: error.message });
  }
};

/**
 * Get queue statistics for dashboard
 */
exports.getQueueStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const doctorId = req.user?.doctor_id || req.query.doctor_id;
    const db = getDb();

    // Detect timestamp columns used for checked-in and completion
    const checkedCol = await detectQueueColumn(['checked_in_at', 'check_in_time', 'checkedin_at', 'checkin_time', 'created_at']);
    const completedCol = await detectQueueColumn(['completed_at', 'end_time', 'finished_at']);

    let sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE
          WHEN status = 'completed' AND q.${completedCol} IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, q.${checkedCol}, q.${completedCol})
          ELSE NULL
        END) as avg_wait_time
      FROM queue q
      WHERE DATE(q.${checkedCol}) = ?
    `;

    const params = [today];

    if (doctorId) {
      sql += ` AND doctor_id = ?`;
      params.push(doctorId);
    }

    const [results] = await db.execute(sql, params);
    const stats = results[0];

    res.json({
      today_total: stats.total || 0,
      waiting: stats.waiting || 0,
      in_progress: stats.in_progress || 0,
      completed: stats.completed || 0,
      avg_wait_time: Math.round(stats.avg_wait_time || 0)
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch queue stats', details: error.message });
  }
};

/**
 * Remove patient from queue
 */
exports.removeFromQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const deleteSql = `DELETE FROM queue WHERE id = ?`;
    await db.execute(deleteSql, [id]);

    res.json({ success: true, message: 'Patient removed from queue' });
  } catch (error) {
    console.error('Remove from queue error:', error);
    res.status(500).json({ error: 'Failed to remove from queue', details: error.message });
  }
};

// Helper function to check BP alert
function checkBPAlert(bp) {
  if (!bp) return false;
  const parts = bp.split('/');
  if (parts.length !== 2) return false;

  const systolic = parseInt(parts[0]);
  const diastolic = parseInt(parts[1]);

  // Alert if systolic > 140 or < 90, or diastolic > 90 or < 60
  return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
}
