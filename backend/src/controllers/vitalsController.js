const { getDb } = require('../config/db');
const { sendSuccess, sendValidationError, sendError } = require('../utils/responseHelper');

exports.exists = async (req, res) => {
  try {
    const { patientId, appointmentId } = req.query;
    if (!patientId) return sendValidationError(res, 'patientId required');
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT 1 FROM patient_vitals
       WHERE patient_id = ?
         AND (appointment_id = ? OR DATE(recorded_at) = CURDATE())
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [patientId, appointmentId || null]
    );
    sendSuccess(res, { exists: rows.length > 0 }, 'Vitals check completed');
  } catch (e) {
    sendError(res, 'Failed to check vitals', 500, e.message);
  }
};
