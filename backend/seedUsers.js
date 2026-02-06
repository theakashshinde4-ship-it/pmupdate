/**
 * Seed Users Script
 * Creates / Updates Admin & Sub Admin users
 * ENUM-safe, NO cleanup, NO delete
 *
 * Run: node scripts/seedUsers.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'patient_management'
};

async function seedUsers() {
  let connection;

  try {
    // Connect DB
    connection = await mysql.createConnection(config);
    console.log('✅ Database connected');

    // Get clinic
    const [clinics] = await connection.execute(
      'SELECT id FROM clinics LIMIT 1'
    );

    if (clinics.length === 0) {
      throw new Error('❌ No clinic found. Please create clinic first.');
    }

    const clinicId = clinics[0].id;
    console.log('🏥 Using clinic ID:', clinicId);

    // Users to seed (ENUM SAFE)
    const users = [
      {
        name: 'Admin User',
        email: 'admin@clinic.com',
        password: 'password123',
        role: 'admin',        // ✅ ENUM OK
        phone: '9999999999'
      },
      {
        name: 'Sub Admin User',
        email: 'subadmin@clinic.com',
        password: 'password123',
        role: 'sub_admin',    // ✅ ENUM OK
        phone: '8888888888'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const [result] = await connection.execute(
        `
        INSERT INTO users
        (name, email, password, role, clinic_id, phone, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          role = VALUES(role),
          clinic_id = VALUES(clinic_id),
          phone = VALUES(phone),
          deleted_at = NULL,
          is_active = 1
        `,
        [
          user.name,
          user.email,
          hashedPassword,
          user.role,
          clinicId,
          user.phone
        ]
      );

      console.log(`✅ ${user.email} | affectedRows: ${result.affectedRows}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 LOGIN CREDENTIALS');
    console.log('='.repeat(50));
    console.log('Admin Email    : admin@clinic.com');
    console.log('SubAdmin Email : subadmin@clinic.com');
    console.log('Password       : password123');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

// Run script
seedUsers()
  .then(() => {
    console.log('🎉 Seeding completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
