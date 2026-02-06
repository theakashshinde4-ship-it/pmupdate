const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');
const env = require('../config/env');
const otpService = require('../services/otpService');

// Helper function to get doctor_id by user_id
async function getDoctorIdByUserId(userId) {
  try {
    const db = getDb();
    const [doctors] = await db.execute(
      'SELECT id FROM doctors WHERE user_id = ?',
      [userId]
    );
    return doctors.length > 0 ? doctors[0].id : null;
  } catch (error) {
    console.error('Error getting doctor_id:', error);
    return null;
  }
}

// Verify credentials and return mobile number for OTP (Universal - for all users except admin)
async function verifyCredentials(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    const db = getDb();
    let user = null;
    let mobileNumber = null;

    // Check in users table first
    const [users] = await db.execute(`
      SELECT id, email, name, phone, role, is_active, password
      FROM users 
      WHERE email = ? AND is_active = 1
    `, [email]);

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    user = users[0];

    // Exclude admin from OTP login
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin should use regular login' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Source mobile number from users.phone.
    // (Do not query role-specific tables here; schemas vary and missing tables/columns caused 500 errors.)
    mobileNumber = user.phone;

    if (!mobileNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Mobile number not found. Please update your profile.' 
      });
    }

    // Clean mobile number (remove non-digits)
    const cleanMobile = String(mobileNumber).replace(/\D/g, '');

    // Validate mobile number
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid mobile number format' 
      });
    }

    const payload = {
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        doctor_id: user.role === 'doctor' ? await getDoctorIdByUserId(user.id) : null
      },
      mobile_number: cleanMobile,
      user_id: user.id
    };

    // Keep backward compatibility for multiple frontend variants:
    // - some expect { success, data: {...} }
    // - some expect { success, user, mobile_number, user_id }
    res.json({
      success: true,
      data: payload,
      ...payload
    });

  } catch (error) {
    console.error('Verify credentials error:', error);
    const isDev = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';
    res.status(500).json({
      success: false,
      error: 'Failed to verify credentials',
      ...(isDev ? { details: error.message } : {})
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const [users] = await db.execute(
      'SELECT id, email, password, role, name, clinic_id FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Enforce OTP verification before login for all non-admin users
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      const ttlMs = Number(process.env.OTP_LOGIN_TTL_MS || 5 * 60 * 1000);
      const ok = otpService.consumeLoginVerification(email, ttlMs);
      if (!ok) {
        return res.status(403).json({ error: 'OTP verification required' });
      }
    }

    // Get doctor_id if user is a doctor
    let doctor_id = null;
    if (user.role === 'doctor') {
      const [doctorRecord] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      if (doctorRecord.length > 0) {
        doctor_id = doctorRecord[0].id;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, doctor_id, clinic_id: user.clinic_id },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clinic_id: user.clinic_id,
        doctor_id: doctor_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

async function register(req, res) {
  try {
    const { name, email, password, role, clinic_id, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const db = getDb();

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password, role, clinic_id, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        name,
        email,
        hashedPassword,
        role || 'staff',
        clinic_id || null,
        phone || null
      ]
    );

    // Generate token for auto-login
    const token = jwt.sign(
      { id: result.insertId, email, role: role || 'staff' },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        email,
        name,
        role: role || 'staff',
        clinic_id: clinic_id || null
      }
    });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to register user' });
  }
}

// Verify token endpoint
async function verifyToken(req, res) {
  try {
    // The token is already verified by authenticateToken middleware
    // If we reach here, the token is valid
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token verification failed' });
  }
}

// Refresh token endpoint
async function refreshToken(req, res) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const db = getDb();
    
    // Fetch fresh user data from database
    const [users] = await db.execute(
      'SELECT id, email, role FROM users WHERE id = ? AND is_active = 1',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const userData = users[0];
    
    // Generate new token
    const newToken = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: newToken,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to refresh token' });
  }
}

// Logout endpoint
async function logout(req, res) {
  try {
    // Logout on the backend - token becomes invalid
    // Client should remove token from localStorage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
}

module.exports = { login, register, verifyToken, refreshToken, logout, verifyCredentials };

