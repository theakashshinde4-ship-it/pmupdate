const mysql = require('mysql2/promise');
const env = require('./env');

let pool;
let redisClient;

// Redis connection for distributed caching (optional)
async function initRedis() {
  const redisExplicitlyEnabled = String(process.env.ENABLE_REDIS || '').toLowerCase() === 'true';
  if (!redisExplicitlyEnabled) return null;

  try {
    const Redis = require('ioredis');
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      maxRetriesPerRequest: 2, // Allow 2 retries
      retryDelayOnFailover: 100,
      lazyConnect: true,
      enableOfflineQueue: false,
      commandTimeout: 3000,
      connectTimeout: 5000,
      family: 4,
      retryStrategy: () => null
    });
    
    client.on('connect', () => console.log('✅ Redis connected'));
    client.on('error', (err) => {
      console.log('⚠️ Redis connection error:', err.message);
    });
    
    client.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });
    
    // Attempt connection; if it fails, return null and continue without Redis
    try {
      await client.connect();
      await client.ping();
      console.log('✅ Redis connection established');
      return client;
    } catch (error) {
      console.log('⚠️ Redis not available, running without cache (memory-only mode)');
      return null;
    }
  } catch (error) {
    console.log('⚠️ Redis not available, running without cache (memory-only mode)');
    return null;
  }
}

async function initDb() {
  if (pool) return pool;

  try {
    // Create MySQL connection pool with optimized settings
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'patient_management',
      connectionLimit: parseInt(process.env.DB_POOL_LIMIT) || 200,
      connectTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT_MS) || 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Performance optimizations
      multipleStatements: false,
      dateStrings: false,
      // Enable connection pooling
      queueLimit: 0,
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection established');

    // Initialize Redis if available
    redisClient = await initRedis();
    
    // Test database query
    await pool.query('SELECT 1');

    // Note: Admin user should be created using the setup-admin script
    // Run: npm run setup-admin
    // This ensures secure password is set on first setup

    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

function getDb() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return pool;
}

// Convenience query helper used by controllers (returns rows)
async function query(sql, params = []) {
  const pool = getDb();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Enhanced transaction helper for high-concurrency operations
async function transaction(callback) {
  const pool = getDb();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Redis cache helper functions
async function getFromCache(key) {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

async function setCache(key, value, ttl = 300) {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

async function deleteCache(key) {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

// Batch operations for better performance
async function batchCacheGet(keys) {
  if (!redisClient) return {};
  try {
    const values = await redisClient.mget(...keys);
    const result = {};
    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        result[key] = JSON.parse(value);
      }
    });
    return result;
  } catch (error) {
    console.error('Batch cache get error:', error);
    return {};
  }
}

// Connection pool monitoring
function getPoolStats() {
  const pool = getDb();
  const stats = {
    totalConnections: pool._allConnections?.length || 0,
    freeConnections: pool._freeConnections?.length || 0,
    acquiringConnections: pool._acquiringConnections?.length || 0,
    connectionLimit: pool.config?.connectionLimit || 0,
    queueLength: pool._connectionQueue?.length || 0
  };
  
  // Add Redis stats if available
  if (redisClient) {
    return {
      ...stats,
      redis: {
        connected: redisClient.status === 'ready',
        memory: process.memoryUsage()
      }
    };
  }
  
  return stats;
}

module.exports.query = query;
module.exports.transaction = transaction;
module.exports.getPoolStats = getPoolStats;
module.exports.getFromCache = getFromCache;
module.exports.setCache = setCache;
module.exports.deleteCache = deleteCache;
module.exports.getDb = getDb;
module.exports.initDb = initDb;
module.exports.batchCacheGet = batchCacheGet;

