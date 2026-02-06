const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const dotenvCandidates = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env')
].filter(Boolean);

let loaded = false;
for (const p of dotenvCandidates) {
  try {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      loaded = true;
      break;
    }
  } catch (_) {
  }
}

if (!loaded) {
  dotenv.config();
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'patient_management',
    // Increase default pool for higher concurrency; override with DB_POOL_LIMIT env var
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 200)
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || process.env.SMTP_EMAIL || '',
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || process.env.SMTP_EMAIL || process.env.SMTP_USER || 'no-reply@example.com'
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || null // Generate a secure key for production
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 2000)
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  // SMS and WhatsApp Cloud API removed - WhatsApp now uses direct links on frontend
};

if (env.nodeEnv === 'production' && (!process.env.JWT_SECRET || env.jwtSecret === 'your-secret-key')) {
  throw new Error('JWT_SECRET must be set to a strong value in production');
}

module.exports = env;

