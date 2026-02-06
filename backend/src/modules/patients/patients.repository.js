const { getDb } = require('../../config/db');

async function listPatientsRepository(input) {
  const {
    page,
    limit,
    offset,
    search,
    gender,
    blood_group,
    city,
    doctor_id,
    user
  } = input;

  const db = getDb();

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (user && user.role === 'doctor') {
    let doctorId = user.doctor_id;

    if (!doctorId && user.id) {
      const [doctors] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      if (doctors.length > 0) {
        doctorId = doctors[0].id;
      }
    }

    if (doctorId) {
      whereClause += ' AND p.primary_doctor_id = ?';
      params.push(doctorId);
    } else if (user.clinic_id) {
      whereClause += ' AND p.clinic_id = ?';
      params.push(user.clinic_id);
    }
  }

  if (doctor_id) {
    whereClause += ' AND p.primary_doctor_id = ?';
    params.push(doctor_id);
  }

  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.patient_id LIKE ? OR p.phone LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

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

  const [patients] = await db.execute(
    `
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
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `,
    params
  );

  const [countResult] = await db.execute(
    `SELECT COUNT(*) as total FROM patients p ${whereClause}`,
    params
  );

  const total = countResult[0]?.total || 0;

  return { patients, total };
}

module.exports = {
  listPatientsRepository
};
