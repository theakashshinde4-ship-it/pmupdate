const { getDb } = require('../../config/db');

async function listAppointmentsRepository(input) {
  const {
    page,
    limit,
    offset,
    date,
    status,
    doctor_id,
    start_date,
    end_date,
    user
  } = input;

  const db = getDb();

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (user && typeof user === 'object' && user.role === 'doctor') {
    if (user.doctor_id) {
      whereClause += ' AND a.doctor_id = ?';
      params.push(user.doctor_id);
    } else if (user.clinic_id) {
      whereClause += ' AND a.clinic_id = ?';
      params.push(user.clinic_id);
    }
  }

  if (doctor_id) {
    whereClause += ' AND a.doctor_id = ?';
    params.push(doctor_id);
  }

  if (date) {
    whereClause += ' AND DATE(a.appointment_date) = ?';
    params.push(date);
  }

  if (start_date) {
    whereClause += ' AND a.appointment_date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    whereClause += ' AND a.appointment_date <= ?';
    params.push(end_date);
  }

  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  const safeLimit = Number(limit);
  const safeOffset = Number(offset);

  const [appointments] = await db.execute(
    `
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
    `,
    params
  );

  const [countResult] = await db.execute(
    `SELECT COUNT(*) as total FROM appointments a ${whereClause}`,
    params
  );

  const total = countResult[0]?.total || 0;

  return { appointments, total };
}

module.exports = {
  listAppointmentsRepository
};
