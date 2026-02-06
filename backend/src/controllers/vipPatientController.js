const { getDb } = require('../config/db');

async function query(sql, params = []) {
  const db = getDb();
  const [rows] = await db.execute(sql, params);
  return rows;
}

// =====================================================
// VIP PATIENT MANAGEMENT CONTROLLER
// =====================================================

/**
 * Mark patient as VIP
 * POST /api/vip-patients
 */
exports.createVIPPatient = async (req, res) => {
  try {
    const {
      patient_id,
      vip_tier = 'gold',
      preferred_doctor_id,
      room_preference,
      special_notes,
      allergies_special,
      communication_preference = 'WhatsApp',
      dedicated_contact_person,
      dedicated_contact_phone,
      dedicated_contact_email,
      priority_level = 1,
      anonymous_queue_display = false,
      restricted_access = false
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Check if patient exists
    const patientCheck = await query('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (patientCheck.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if already VIP
    const vipCheck = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patient_id]);
    if (vipCheck.length > 0) {
      return res.status(400).json({ error: 'Patient is already marked as VIP' });
    }

    const vipData = {
      patient_id,
      is_vip: 1,
      vip_tier,
      preferred_doctor_id: preferred_doctor_id || null,
      room_preference: room_preference || null,
      special_notes: special_notes || null,
      allergies_special: allergies_special || null,
      communication_preference,
      dedicated_contact_person: dedicated_contact_person || null,
      dedicated_contact_phone: dedicated_contact_phone || null,
      dedicated_contact_email: dedicated_contact_email || null,
      priority_level,
      anonymous_queue_display: anonymous_queue_display ? 1 : 0,
      restricted_access: restricted_access ? 1 : 0,
      access_control_list: JSON.stringify([])
    };

    await query('INSERT INTO vip_patients SET ?', vipData);

    // Log activity
    await logVIPActivity(patient_id, 'vip_created', `Patient marked as VIP (${vip_tier})`, req.user?.id);

    res.status(201).json({
      message: 'Patient marked as VIP successfully',
      vip_patient: vipData
    });
  } catch (err) {
    console.error('Create VIP patient error:', err);
    res.status(500).json({ error: 'Failed to create VIP patient' });
  }
};

/**
 * Get VIP patient details
 * GET /api/vip-patients/:patient_id
 */
exports.getVIPPatient = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const vipPatient = await query(
      `SELECT vp.*, p.name, p.phone, p.email, d.user_id as doctor_user_id
       FROM vip_patients vp
       LEFT JOIN patients p ON vp.patient_id = p.id
       LEFT JOIN doctors d ON vp.preferred_doctor_id = d.id
       WHERE vp.patient_id = ?`,
      [patient_id]
    );

    if (vipPatient.length === 0) {
      return res.status(404).json({ error: 'VIP patient not found' });
    }

    const vip = vipPatient[0];
    vip.access_control_list = JSON.parse(vip.access_control_list || '[]');

    res.json(vip);
  } catch (err) {
    console.error('Get VIP patient error:', err);
    res.status(500).json({ error: 'Failed to fetch VIP patient' });
  }
};

/**
 * Update VIP patient preferences
 * PATCH /api/vip-patients/:patient_id
 */
exports.updateVIPPatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const updates = req.body;

    // Validate patient exists
    const vipCheck = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patient_id]);
    if (vipCheck.length === 0) {
      return res.status(404).json({ error: 'VIP patient not found' });
    }

    // Handle access control list
    if (updates.access_control_list) {
      updates.access_control_list = JSON.stringify(updates.access_control_list);
    }

    await query('UPDATE vip_patients SET ? WHERE patient_id = ?', [updates, patient_id]);

    // Log activity
    await logVIPActivity(patient_id, 'vip_updated', 'VIP preferences updated', req.user?.id);

    res.json({ message: 'VIP patient updated successfully' });
  } catch (err) {
    console.error('Update VIP patient error:', err);
    res.status(500).json({ error: 'Failed to update VIP patient' });
  }
};

/**
 * Remove VIP status from patient
 * DELETE /api/vip-patients/:patient_id
 */
exports.removeVIPStatus = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const vipCheck = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patient_id]);
    if (vipCheck.length === 0) {
      return res.status(404).json({ error: 'VIP patient not found' });
    }

    await query('DELETE FROM vip_patients WHERE patient_id = ?', [patient_id]);

    // Log activity
    await logVIPActivity(patient_id, 'vip_removed', 'VIP status removed', req.user?.id);

    res.json({ message: 'VIP status removed successfully' });
  } catch (err) {
    console.error('Remove VIP status error:', err);
    res.status(500).json({ error: 'Failed to remove VIP status' });
  }
};

/**
 * Get all VIP patients
 * GET /api/vip-patients
 */
exports.getAllVIPPatients = async (req, res) => {
  try {
    const { vip_tier, priority_level, limit = 50, offset = 0 } = req.query;

    let sql = `SELECT vp.*, p.name, p.phone, p.email, p.patient_id as uhid
               FROM vip_patients vp
               LEFT JOIN patients p ON vp.patient_id = p.id
               WHERE 1=1`;
    const params = [];

    if (vip_tier) {
      sql += ' AND vp.vip_tier = ?';
      params.push(vip_tier);
    }

    if (priority_level) {
      sql += ' AND vp.priority_level = ?';
      params.push(priority_level);
    }

    sql += ' ORDER BY vp.priority_level ASC, vp.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const vipPatients = await query(sql, params);

    // Parse access control lists
    vipPatients.forEach(vip => {
      vip.access_control_list = JSON.parse(vip.access_control_list || '[]');
    });

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM vip_patients WHERE 1=1';
    const countParams = [];
    if (vip_tier) {
      countSql += ' AND vip_tier = ?';
      countParams.push(vip_tier);
    }
    if (priority_level) {
      countSql += ' AND priority_level = ?';
      countParams.push(priority_level);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      vip_patients: vipPatients,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get all VIP patients error:', err);
    res.status(500).json({ error: 'Failed to fetch VIP patients' });
  }
};

/**
 * Grant record access to staff member
 * POST /api/vip-patients/:patient_id/access-control
 */
exports.grantRecordAccess = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const {
      authorized_user_id,
      access_level = 'view_only',
      record_types = [],
      expires_at
    } = req.body;

    if (!authorized_user_id) {
      return res.status(400).json({ error: 'Authorized user ID is required' });
    }

    // Check if VIP patient exists
    const vipCheck = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patient_id]);
    if (vipCheck.length === 0) {
      return res.status(404).json({ error: 'VIP patient not found' });
    }

    const accessData = {
      vip_patient_id: vipCheck[0].id,
      authorized_user_id,
      access_level,
      record_types: JSON.stringify(record_types),
      granted_by_user_id: req.user?.id,
      expires_at: expires_at || null,
      is_active: 1
    };

    await query('INSERT INTO vip_record_access_control SET ?', accessData);

    // Log activity
    await logVIPActivity(patient_id, 'access_granted', `Record access granted to user ${authorized_user_id}`, req.user?.id);

    res.status(201).json({
      message: 'Record access granted successfully',
      access_control: accessData
    });
  } catch (err) {
    console.error('Grant record access error:', err);
    res.status(500).json({ error: 'Failed to grant record access' });
  }
};

/**
 * Revoke record access
 * DELETE /api/vip-patients/:patient_id/access-control/:access_id
 */
exports.revokeRecordAccess = async (req, res) => {
  try {
    const { patient_id, access_id } = req.params;

    const accessCheck = await query(
      'SELECT id FROM vip_record_access_control WHERE id = ? AND vip_patient_id IN (SELECT id FROM vip_patients WHERE patient_id = ?)',
      [access_id, patient_id]
    );

    if (accessCheck.length === 0) {
      return res.status(404).json({ error: 'Access control record not found' });
    }

    // Use soft delete instead of hard delete
    await query(
      'UPDATE vip_record_access_control SET is_active = 0, deleted_at = NOW() WHERE id = ?',
      [access_id]
    );

    // Log activity
    await logVIPActivity(patient_id, 'access_revoked', `Record access revoked`, req.user?.id);

    res.json({ message: 'Record access revoked successfully' });
  } catch (err) {
    console.error('Revoke record access error:', err);
    res.status(500).json({ error: 'Failed to revoke record access' });
  }
};

/**
 * Get VIP activity logs
 * GET /api/vip-patients/:patient_id/activity-logs
 */
exports.getVIPActivityLogs = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const logs = await query(
      `SELECT * FROM vip_activity_logs
       WHERE patient_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [patient_id, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM vip_activity_logs WHERE patient_id = ?',
      [patient_id]
    );

    res.json({
      activity_logs: logs,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Get VIP activity logs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

/**
 * Generate VIP report
 * GET /api/vip-patients/:patient_id/report
 */
exports.generateVIPReport = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { report_type = 'activity_summary' } = req.query;

    const vipCheck = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patient_id]);
    if (vipCheck.length === 0) {
      return res.status(404).json({ error: 'VIP patient not found' });
    }

    let reportData = {};

    switch (report_type) {
      case 'activity_summary':
        reportData = await generateActivitySummary(patient_id);
        break;
      case 'access_log':
        reportData = await generateAccessLog(patient_id);
        break;
      case 'compliance':
        reportData = await generateComplianceReport(patient_id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Save report
    const reportRecord = {
      vip_patient_id: vipCheck[0].id,
      report_type,
      report_data: JSON.stringify(reportData),
      generated_by_user_id: req.user?.id,
      generated_at: new Date()
    };

    await query('INSERT INTO vip_reports SET ?', reportRecord);

    res.json({
      report_type,
      report_data: reportData,
      generated_at: new Date()
    });
  } catch (err) {
    console.error('Generate VIP report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Check if user has access to VIP patient record
 * GET /api/vip-patients/:patient_id/check-access
 */
exports.checkRecordAccess = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { user_id, record_type } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if patient is VIP
    const vipCheck = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patient_id]);
    if (vipCheck.length === 0) {
      // Not a VIP patient, allow access
      return res.json({ has_access: true, reason: 'Not a VIP patient' });
    }

    // Check access control
    const accessCheck = await query(
      `SELECT * FROM vip_record_access_control
       WHERE vip_patient_id = ? AND authorized_user_id = ? AND is_active = 1
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [vipCheck[0].id, user_id]
    );

    if (accessCheck.length === 0) {
      return res.json({ has_access: false, reason: 'No access granted' });
    }

    const access = accessCheck[0];
    const recordTypes = JSON.parse(access.record_types || '[]');

    // Check if specific record type is allowed
    if (record_type && recordTypes.length > 0 && !recordTypes.includes(record_type)) {
      return res.json({ has_access: false, reason: 'Record type not allowed' });
    }

    res.json({
      has_access: true,
      access_level: access.access_level,
      allowed_record_types: recordTypes
    });
  } catch (err) {
    console.error('Check record access error:', err);
    res.status(500).json({ error: 'Failed to check access' });
  }
};

/**
 * Get VIP queue priority
 * GET /api/vip-patients/queue/priority
 */
exports.getVIPQueuePriority = async (req, res) => {
  try {
    const vipQueue = await query(
      `SELECT vqp.*, p.name, p.patient_id as uhid, a.appointment_date, a.appointment_time
       FROM vip_queue_priority vqp
       LEFT JOIN vip_patients vp ON vqp.vip_patient_id = vp.id
       LEFT JOIN patients p ON vp.patient_id = p.id
       LEFT JOIN appointments a ON vqp.appointment_id = a.id
       WHERE a.appointment_date = CURDATE()
       ORDER BY vqp.priority_position ASC`
    );

    res.json({
      vip_queue: vipQueue,
      total: vipQueue.length
    });
  } catch (err) {
    console.error('Get VIP queue priority error:', err);
    res.status(500).json({ error: 'Failed to fetch VIP queue' });
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Log VIP patient activity
 */
async function logVIPActivity(patientId, actionType, description, userId) {
  try {
    const vipPatient = await query('SELECT id FROM vip_patients WHERE patient_id = ?', [patientId]);
    if (vipPatient.length === 0) return;

    const logData = {
      vip_patient_id: vipPatient[0].id,
      patient_id: patientId,
      action_type: actionType,
      action_description: description,
      accessed_by_user_id: userId || null,
      accessed_by_role: 'staff',
      status: 'success'
    };

    await query('INSERT INTO vip_activity_logs SET ?', logData);
  } catch (err) {
    console.error('Log VIP activity error:', err);
  }
}

/**
 * Generate activity summary report
 */
async function generateActivitySummary(patientId) {
  try {
    const logs = await query(
      `SELECT action_type, COUNT(*) as count FROM vip_activity_logs
       WHERE patient_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY action_type`,
      [patientId]
    );

    const totalAccess = await query(
      `SELECT COUNT(*) as total FROM vip_activity_logs
       WHERE patient_id = ? AND action_type = 'record_access'`,
      [patientId]
    );

    return {
      period: 'Last 30 days',
      activity_breakdown: logs,
      total_record_accesses: totalAccess[0].total,
      generated_at: new Date()
    };
  } catch (err) {
    console.error('Generate activity summary error:', err);
    return {};
  }
}

/**
 * Generate access log report
 */
async function generateAccessLog(patientId) {
  try {
    const accessLogs = await query(
      `SELECT * FROM vip_activity_logs
       WHERE patient_id = ? AND action_type = 'record_access'
       ORDER BY created_at DESC
       LIMIT 100`,
      [patientId]
    );

    return {
      access_logs: accessLogs,
      total_accesses: accessLogs.length,
      generated_at: new Date()
    };
  } catch (err) {
    console.error('Generate access log error:', err);
    return {};
  }
}

/**
 * Generate compliance report
 */
async function generateComplianceReport(patientId) {
  try {
    const vipPatient = await query(
      'SELECT * FROM vip_patients WHERE patient_id = ?',
      [patientId]
    );

    if (vipPatient.length === 0) {
      return { error: 'VIP patient not found' };
    }

    const accessControls = await query(
      'SELECT COUNT(*) as total FROM vip_record_access_control WHERE vip_patient_id = ?',
      [vipPatient[0].id]
    );

    const activityLogs = await query(
      'SELECT COUNT(*) as total FROM vip_activity_logs WHERE patient_id = ?',
      [patientId]
    );

    return {
      vip_tier: vipPatient[0].vip_tier,
      restricted_access: vipPatient[0].restricted_access === 1,
      access_controls_count: accessControls[0].total,
      activity_logs_count: activityLogs[0].total,
      anonymous_queue_display: vipPatient[0].anonymous_queue_display === 1,
      compliance_status: 'compliant',
      generated_at: new Date()
    };
  } catch (err) {
    console.error('Generate compliance report error:', err);
    return {};
  }
}
