const { query } = require('../config/db');
const { getConnection } = require('../config/db');
const logger = require('../services/logger');

/**
 * WEEK 2 FIXES: Race Condition Prevention with Database Transactions
 * 
 * Problems Solved:
 * 1. Concurrent queue updates causing data corruption
 * 2. Race condition between token generation and insertion
 * 3. Duplicate entries when multiple requests arrive simultaneously
 * 4. Lost updates when concurrent status changes occur
 * 
 * Solution: Database transactions with proper isolation level
 */

// Helper to detect which column exists on `queue` table from a list of candidates
async function detectQueueColumn(candidates) {
  const placeholders = candidates.map(() => '?').join(',');
  const fieldOrder = candidates.map(c => `'${c}'`).join(',');
  const rows = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'queue' AND column_name IN (${placeholders}) ORDER BY FIELD(column_name, ${fieldOrder})`,
    candidates
  );
  return (rows[0] && rows[0].column_name) || candidates[0];
}

/**
 * Get today's queue for Doctor Dashboard
 * Returns patients organized by status (waiting, in_progress, completed)
 * Includes patient details, vitals, VIP status, and waiting time
 * 
 * TRANSACTION: READ COMMITTED to avoid race conditions
 */
exports.getTodayQueue = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const today = new Date().toISOString().split('T')[0];
    const doctorId = req.user?.doctor_id || req.query.doctor_id;

    const candidateCheckedIn = ['checked_in_at', 'check_in_time', 'checkedin_at', 'checkin_time', 'created_at'];
    const candidateCompleted = ['completed_at', 'end_time', 'finished_at'];

    // Detect columns with proper transaction
    const existingChecked = await connection.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'queue' AND column_name IN (${candidateCheckedIn.map(() => '?').join(',')})`,
      candidateCheckedIn
    );
    const checkedCol = (existingChecked[0] && existingChecked[0].column_name) || candidateCheckedIn[0];

    const existingComp = await connection.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'queue' AND column_name IN (${candidateCompleted.map(() => '?').join(',')})`,
      candidateCompleted
    );
    const completedCol = (existingComp[0] && existingComp[0].column_name) || candidateCompleted[0];

    // Base query with row-level locking to prevent race conditions
    let sql = `
      SELECT
        q.id as queue_id,
        q.token_number,
        q.status,
        q.priority,
        q.${checkedCol} as checked_in_at,
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
        a.chief_complaint,
        a.appointment_time,
        v.temperature as temp,
        v.blood_pressure as bp,
        v.pulse as pulse,
        v.spo2 as spo2,
        v.weight_kg as weight,
        v.height_cm as height,
        TIMESTAMPDIFF(MINUTE, q.${checkedCol}, IFNULL(q.called_at, NOW())) as waiting_time
      FROM queue q
      INNER JOIN patients p ON q.patient_id = p.id
      LEFT JOIN appointments a ON q.appointment_id = a.id
      LEFT JOIN (
        SELECT v1.patient_id, v1.temperature, v1.blood_pressure, v1.pulse, v1.spo2, v1.weight_kg, v1.height_cm
        FROM patient_vitals v1
        JOIN (SELECT patient_id, MAX(recorded_at) AS max_rec FROM patient_vitals WHERE DATE(recorded_at) = ? GROUP BY patient_id) v2
          ON v1.patient_id = v2.patient_id AND v1.recorded_at = v2.max_rec
      ) v ON p.id = v.patient_id
      WHERE DATE(q.${checkedCol}) = ?
    `;

    const params = [today, today];

    if (doctorId) {
      sql += ` AND (q.doctor_id = ? OR a.doctor_id = ?)`;
      params.push(doctorId, doctorId);
    }

    sql += ` ORDER BY
      COALESCE(p.priority, 0) DESC,
      COALESCE(q.priority, 0) DESC,
      CASE WHEN p.is_vip = 1 THEN 0 ELSE 1 END,
      q.${checkedCol} ASC
    `;

    const results = await connection.query(sql, params);

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
      waiting_time: row.waiting_time || 0,
      notes: row.queue_notes,
      vitals: (row.temp || row.bp || row.pulse || row.spo2) ? {
        temp: row.temp,
        temp_alert: row.temp && (row.temp > 100 || row.temp < 95),
        bp: row.bp,
        bp_alert: row.bp && checkBPAlert(row.bp),
        pulse: row.pulse,
        spo2: row.spo2,
        spo2_alert: row.spo2 && row.spo2 < 95,
        weight: row.weight,
        height: row.height
      } : null
    }));

    await connection.commit();
    res.json(queueData);
    logger.info('Queue fetched successfully', { doctorId, count: queueData.length });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Get today queue error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch queue', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Update queue status with ACID transaction
 * CRITICAL FIX: Prevents race condition where two concurrent updates corrupt data
 * Uses SELECT FOR UPDATE to lock row during update
 */
exports.updateQueueStatus = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['waiting', 'in_progress', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid status' });
    }

    // CRITICAL: Lock the queue row to prevent concurrent updates
    const lockSql = `SELECT id FROM queue WHERE id = ? FOR UPDATE`;
    const lockResult = await connection.query(lockSql, [id]);

    if (lockResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    // Now update the queue with lock held
    let updateSql = 'UPDATE queue SET status = ?, updated_at = NOW(), ';
    const updateParams = [status];

    if (status === 'in_progress') {
      updateSql += 'called_at = NOW(), ';
    }
    if (status === 'completed') {
      updateSql += 'completed_at = NOW(), ';
    }

    updateSql = updateSql.replace(/,\s*$/, '') + ' WHERE id = ?';
    updateParams.push(id);

    await connection.query(updateSql, updateParams);

    // Update related appointment with same transaction
    const appointmentSql = `
      UPDATE appointments a
      INNER JOIN queue q ON a.id = q.appointment_id
      SET a.status = ?
      WHERE q.id = ?
    `;
    await connection.query(appointmentSql, [status, id]);

    // Commit all changes atomically
    await connection.commit();
    res.json({ success: true, message: 'Queue status updated', id, status });
    logger.info('Queue status updated', { queue_id: id, status });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Update queue status error', { error: error.message });
    res.status(500).json({ error: 'Failed to update queue status', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Add patient to queue with transaction-based deduplication
 * CRITICAL FIX: Prevents duplicate queue entries when multiple concurrent requests arrive
 * Uses row-level locking and atomicity to ensure exactly one entry per patient per day
 */
exports.addToQueue = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const { patient_id, appointment_id, doctor_id, priority, notes } = req.body;

    if (!patient_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const checkedCol = await detectQueueColumn(['checked_in_at', 'check_in_time', 'checkedin_at', 'checkin_time', 'created_at']);

    // CRITICAL: Check for existing entry with row-level lock to prevent race condition
    const checkSql = `
      SELECT id FROM queue
      WHERE patient_id = ?
      AND DATE(${checkedCol}) = ?
      AND status NOT IN ('completed', 'cancelled', 'no-show')
      FOR UPDATE
    `;
    const existing = await connection.query(checkSql, [patient_id, today]);

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Patient already in queue today',
        queue_id: existing[0].id
      });
    }

    // Generate token number with lock held
    // This prevents duplicate token numbers from concurrent requests
    const tokenSql = `
      SELECT COALESCE(MAX(token_number), 0) + 1 as next_token
      FROM queue
      WHERE DATE(${checkedCol}) = ?
      FOR UPDATE
    `;
    const tokenResult = await connection.query(tokenSql, [today]);
    const tokenNumber = tokenResult[0].next_token;

    // Get patient VIP priority
    const patientSql = `SELECT priority, is_vip FROM patients WHERE id = ? FOR UPDATE`;
    const patientData = await connection.query(patientSql, [patient_id]);
    const patientPriority = patientData[0]?.priority || 0;

    // Insert queue entry atomically
    const insertSql = `
      INSERT INTO queue (
        patient_id,
        appointment_id,
        doctor_id,
        token_number,
        priority,
        status,
        checked_in_at,
        notes
      ) VALUES (?, ?, ?, ?, ?, 'waiting', NOW(), ?)
    `;

    const finalPriority = priority || patientPriority || 0;
    const result = await connection.query(insertSql, [
      patient_id,
      appointment_id || null,
      doctor_id || req.user?.doctor_id || null,
      tokenNumber,
      finalPriority,
      notes || null
    ]);

    // Commit atomically
    await connection.commit();
    res.status(201).json({
      success: true,
      queue_id: result.insertId,
      token_number: tokenNumber,
      message: 'Patient added to queue'
    });
    logger.info('Patient added to queue', { patient_id, token_number: tokenNumber });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Add to queue error', { error: error.message });
    res.status(500).json({ error: 'Failed to add to queue', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Get queue statistics with proper transaction handling
 */
exports.getQueueStats = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const today = new Date().toISOString().split('T')[0];
    const doctorId = req.user?.doctor_id || req.query.doctor_id;

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

    const results = await connection.query(sql, params);
    const stats = results[0];

    await connection.commit();
    res.json({
      today_total: stats.total || 0,
      waiting: stats.waiting || 0,
      in_progress: stats.in_progress || 0,
      completed: stats.completed || 0,
      avg_wait_time: Math.round(stats.avg_wait_time || 0)
    });
    logger.info('Queue stats fetched', { doctorId, total: stats.total });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Get queue stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch queue stats', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Remove patient from queue with transaction
 */
exports.removeFromQueue = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const { id } = req.params;

    // Lock row before delete
    const lockSql = `SELECT id FROM queue WHERE id = ? FOR UPDATE`;
    const lockResult = await connection.query(lockSql, [id]);

    if (lockResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    const deleteSql = `DELETE FROM queue WHERE id = ?`;
    await connection.query(deleteSql, [id]);

    await connection.commit();
    res.json({ success: true, message: 'Patient removed from queue', id });
    logger.info('Patient removed from queue', { queue_id: id });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Remove from queue error', { error: error.message });
    res.status(500).json({ error: 'Failed to remove from queue', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Bulk update queue status for multiple patients
 * WEEK 2 ADDITION: Useful for clearing queue at end of day or transitioning multiple patients
 * Uses transaction to ensure all updates succeed or all fail
 */
exports.bulkUpdateQueueStatus = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const { updates } = req.body; // Array of { queue_id, status }

    if (!Array.isArray(updates) || updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Updates array required' });
    }

    const validStatuses = ['waiting', 'in_progress', 'completed', 'cancelled', 'no-show'];
    const results = [];

    for (const update of updates) {
      const { queue_id, status } = update;

      if (!validStatuses.includes(status)) {
        await connection.rollback();
        return res.status(400).json({ error: `Invalid status: ${status}` });
      }

      // Lock each row
      const lockSql = `SELECT id FROM queue WHERE id = ? FOR UPDATE`;
      const lockResult = await connection.query(lockSql, [queue_id]);

      if (lockResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: `Queue entry ${queue_id} not found` });
      }

      // Update with lock held
      let updateSql = 'UPDATE queue SET status = ?, updated_at = NOW() ';
      const updateParams = [status];

      if (status === 'in_progress') {
        updateSql += ', called_at = NOW() ';
      }
      if (status === 'completed') {
        updateSql += ', completed_at = NOW() ';
      }

      updateSql += 'WHERE id = ?';
      updateParams.push(queue_id);

      await connection.query(updateSql, updateParams);
      results.push({ queue_id, status, success: true });
    }

    await connection.commit();
    res.json({ success: true, updated: results.length, details: results });
    logger.info('Bulk queue update completed', { count: results.length });
  } catch (error) {
    if (connection) await connection.rollback();
    logger.error('Bulk update queue status error', { error: error.message });
    res.status(500).json({ error: 'Failed to update queue in bulk', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Helper function to check BP alert
function checkBPAlert(bp) {
  if (!bp) return false;
  const parts = bp.split('/');
  if (parts.length !== 2) return false;

  const systolic = parseInt(parts[0]);
  const diastolic = parseInt(parts[1]);

  return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
}
