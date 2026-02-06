/**
 * Dashboard Controller
 * Handles dashboard metrics and patient management endpoints
 */

const db = require('../config/database');
const { sendSuccess, sendError, sendNotFound, sendCreated, sendValidationError } = require('../utils/responseHelper');

/**
 * GET /dashboard/metrics
 * Fetch dashboard metrics and analytics
 */
async function getDashboardMetrics(req, res) {
  try {
    const { dateRange = 'week' } = req.query;
    const doctorId = req.user.id;

    // Calculate date range
    const now = new Date();
    let fromDate = new Date();
    
    if (dateRange === 'day') {
      fromDate.setDate(now.getDate() - 1);
    } else if (dateRange === 'week') {
      fromDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      fromDate.setMonth(now.getMonth() - 1);
    }

    // Get prescriptions for doctor
    const [prescriptions] = await db.query(
      'SELECT * FROM prescriptions WHERE doctorId = ? AND createdAt >= ?',
      [doctorId, fromDate]
    );

    // Get patients
    const [patients] = await db.query(
      'SELECT COUNT(DISTINCT patientId) as count, SUM(consultationFee) as revenue FROM prescriptions WHERE doctorId = ? AND createdAt >= ?',
      [doctorId, fromDate]
    );

    // Calculate metrics
    const totalPatients = patients[0]?.count || 0;
    const totalRevenue = patients[0]?.revenue || 0;

    // Get today's stats
    const today = new Date().toDateString();
    const todayPrescs = prescriptions.filter(p => 
      new Date(p.createdAt).toDateString() === today
    );

    // Calculate avg consultation time (placeholder - would need to track actual time)
    const avgConsultationTime = 15; // minutes

    // Generate chart data (last 7 days)
    const chartData = generateChartData(prescriptions, 7);

    // Get top diagnoses
    const topDiagnoses = getTopDiagnoses(prescriptions, 5);

    // Weekly trend
    const weeklyTrend = generateWeeklyTrend(prescriptions);

    sendSuccess(res, {
      totalPatients,
      todayPatients: new Set(todayPrescs.map(p => p.patientId)).size,
      totalRevenue,
      todayRevenue: todayPrescs.reduce((sum, p) => sum + (p.consultationFee || 0), 0),
      avgConsultationTime,
      prescriptionsFilled: prescriptions.length,
      chartData,
      topDiagnoses,
      weeklyTrend,
      performanceMetrics: {
        efficiency: calculateEfficiency(prescriptions),
        satisfaction: 4.8,
        templateUsage: calculateTemplateUsage(prescriptions)
      }
    }, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    sendError(res, 'Failed to fetch dashboard metrics', 500, error.message);
  }
}

/**
 * GET /patients/:id
 * Get patient details with stats
 */
async function getPatientDetails(req, res) {
  try {
    const { id } = req.params;

    const [patient] = await db.query(
      'SELECT * FROM patients WHERE id = ? LIMIT 1',
      [id]
    );

    if (!patient.length) {
      return sendNotFound(res, 'Patient not found');
    }

    const p = patient[0];

    // Get prescription count
    const [prescsStats] = await db.query(
      'SELECT COUNT(*) as count, MAX(createdAt) as lastVisit FROM prescriptions WHERE patientId = ?',
      [id]
    );

    // Get compliance score (percentage of follow-up visits completed)
    const [complianceData] = await db.query(
      'SELECT SUM(IF(followupCompleted = 1, 1, 0)) as completed, COUNT(*) as total FROM prescriptions WHERE patientId = ?',
      [id]
    );

    const complianceScore = complianceData[0]?.total > 0
      ? Math.round((complianceData[0]?.completed / complianceData[0]?.total) * 100)
      : 75;

    // Calculate next follow-up
    const [nextFollowUp] = await db.query(
      'SELECT DATE_ADD(createdAt, INTERVAL followupDays DAY) as nextDate FROM prescriptions WHERE patientId = ? ORDER BY createdAt DESC LIMIT 1',
      [id]
    );

    sendSuccess(res, {
      ...p,
      prescriptionCount: prescsStats[0]?.count || 0,
      lastVisit: prescsStats[0]?.lastVisit || null,
      complianceScore,
      nextFollowUp: nextFollowUp[0]?.nextDate || null
    }, 'Patient details retrieved successfully');
  } catch (error) {
    console.error('Patient details error:', error);
    sendError(res, 'Failed to fetch patient details', 500, error.message);
  }
}

/**
 * GET /prescriptions/patient/:id
 * Get all prescriptions for a patient
 */
async function getPatientPrescriptions(req, res) {
  try {
    const { id } = req.params;

    const [prescriptions] = await db.query(
      `SELECT p.*, 
              GROUP_CONCAT(DISTINCT d.name) as diagnoses,
              GROUP_CONCAT(DISTINCT m.name) as medications,
              u.firstName as doctorName
       FROM prescriptions p
       LEFT JOIN prescription_diagnosis pd ON p.id = pd.prescriptionId
       LEFT JOIN diagnoses d ON pd.diagnosisId = d.id
       LEFT JOIN prescription_medication pm ON p.id = pm.prescriptionId
       LEFT JOIN medicines m ON pm.medicineId = m.id
       LEFT JOIN users u ON p.doctorId = u.id
       WHERE p.patientId = ?
       GROUP BY p.id
       ORDER BY p.createdAt DESC`,
      [id]
    );

    sendSuccess(res, prescriptions.map(p => ({
      ...p,
      diagnoses: p.diagnoses ? p.diagnoses.split(',') : [],
      medications: p.medications ? p.medications.split(',') : []
    })), 'Patient prescriptions retrieved successfully');
  } catch (error) {
    console.error('Patient prescriptions error:', error);
    sendError(res, 'Failed to fetch patient prescriptions', 500, error.message);
  }
}

/**
 * POST /prescriptions
 * Save/Create prescription
 */
async function savePrescription(req, res) {
  try {
    const {
      patientId,
      diagnoses = [],
      medications = [],
      advice,
      investigations = [],
      followupDays,
      consultationFee = 500
    } = req.body;

    const doctorId = req.user.id;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert prescription
      const [result] = await connection.query(
        `INSERT INTO prescriptions (patientId, doctorId, advice, followupDays, consultationFee, status, createdAt)
         VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
        [patientId, doctorId, advice, followupDays, consultationFee]
      );

      const prescriptionId = result.insertId;

      // Insert diagnoses
      for (const diagnosis of diagnoses) {
        const [diagRes] = await connection.query(
          'SELECT id FROM diagnoses WHERE name = ?',
          [diagnosis]
        );

        if (diagRes.length > 0) {
          await connection.query(
            'INSERT INTO prescription_diagnosis (prescriptionId, diagnosisId) VALUES (?, ?)',
            [prescriptionId, diagRes[0].id]
          );
        }
      }

      // Insert medications
      for (const med of medications) {
        const [medRes] = await connection.query(
          'SELECT id FROM medicines WHERE name = ?',
          [med.name]
        );

        if (medRes.length > 0) {
          await connection.query(
            'INSERT INTO prescription_medication (prescriptionId, medicineId, frequency, duration) VALUES (?, ?, ?, ?)',
            [prescriptionId, medRes[0].id, med.frequency, med.duration]
          );
        }
      }

      // Insert investigations
      for (const inv of investigations) {
        await connection.query(
          'INSERT INTO prescription_investigation (prescriptionId, name) VALUES (?, ?)',
          [prescriptionId, inv]
        );
      }

      await connection.commit();

      sendCreated(res, { prescriptionId }, 'Prescription saved successfully');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Save prescription error:', error);
    sendError(res, 'Failed to save prescription', 500, error.message);
  }
}

/**
 * PATCH /prescriptions/:id
 * Update prescription status
 */
async function updatePrescription(req, res) {
  try {
    const { id } = req.params;
    const { status, followupCompleted } = req.body;

    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (typeof followupCompleted === 'boolean') {
      updates.push('followupCompleted = ?');
      values.push(followupCompleted);
    }

    if (updates.length === 0) {
      return sendValidationError(res, 'No updates provided');
    }

    values.push(id);

    await db.query(
      `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    sendSuccess(res, null, 'Prescription updated successfully');
  } catch (error) {
    console.error('Update prescription error:', error);
    sendError(res, 'Failed to update prescription', 500, error.message);
  }
}

// Helper functions
function generateChartData(prescriptions, days) {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayPrescs = prescriptions.filter(p =>
      p.createdAt && new Date(p.createdAt).toISOString().split('T')[0] === dateStr
    );

    const revenue = dayPrescs.reduce((sum, p) => sum + (p.consultationFee || 0), 0);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue,
      count: dayPrescs.length
    });
  }

  return data;
}

function getTopDiagnoses(prescriptions, limit) {
  const diagMap = {};

  prescriptions.forEach(p => {
    if (p.diagnoses) {
      const diags = p.diagnoses.split(',');
      diags.forEach(d => {
        diagMap[d] = (diagMap[d] || 0) + 1;
      });
    }
  });

  return Object.entries(diagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / prescriptions.length) * 100)
    }));
}

function generateWeeklyTrend(prescriptions) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trends = {};

  days.forEach(day => {
    trends[day] = 0;
  });

  prescriptions.forEach(p => {
    if (p.createdAt) {
      const dayIndex = new Date(p.createdAt).getDay();
      trends[days[dayIndex]]++;
    }
  });

  return Object.entries(trends).map(([day, patients]) => ({
    day,
    patients
  }));
}

function calculateEfficiency(prescriptions) {
  // Average time between first and last prescription
  if (prescriptions.length < 2) return 100;

  const avgMedsPerPrescs = prescriptions.reduce((sum, p) => {
    const medCount = p.medications ? p.medications.split(',').length : 0;
    return sum + medCount;
  }, 0) / prescriptions.length;

  // Higher avg meds = more efficient (less searching)
  return Math.min(100, Math.round((avgMedsPerPrescs / 10) * 100));
}

function calculateTemplateUsage(prescriptions) {
  const templatePrescs = prescriptions.filter(p => p.usedTemplate === true).length;
  return Math.round((templatePrescs / prescriptions.length) * 100) || 0;
}

module.exports = {
  getDashboardMetrics,
  getPatientDetails,
  getPatientPrescriptions,
  savePrescription,
  updatePrescription
};
