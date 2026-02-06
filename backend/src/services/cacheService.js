/**
 * WEEK 2: Caching Layer Service
 * 
 * Improves performance by:
 * - Caching medication searches (239K+ items)
 * - Caching patient frequently used data
 * - Caching ICD/SNOMED code lookups
 * - Reducing database load
 * - Improving API response times
 * 
 * Can use Redis (distributed) or in-memory (development)
 */

const logger = require('./logger');

class CacheService {
  constructor(useRedis = false) {
    this.useRedis = useRedis;
    this.redisClient = null;
    this.memoryCache = new Map();
    this.initTime = Date.now();
  }

  /**
   * Initialize cache with optional Redis client
   * @param {object} redisClient - Optional Redis client instance
   */
  async init(redisClient = null) {
    if (redisClient) {
      this.redisClient = redisClient;
      this.useRedis = true;
      try {
        await this.redisClient.ping();
        logger.info('Redis cache initialized');
      } catch (error) {
        logger.warn('Redis not available, using memory cache', { error: error.message });
        this.useRedis = false;
      }
    }
  }

  /**
   * Generate cache key with optional prefix
   * @param {string} prefix - Cache key prefix (e.g., 'medications', 'patients')
   * @param {string} identifier - Unique identifier (e.g., search query, patient ID)
   * @returns {string} - Full cache key
   */
  generateKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default 300 = 5 minutes)
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value);

      if (this.useRedis && this.redisClient) {
        await this.redisClient.setex(key, ttlSeconds, serialized);
      } else {
        // Memory cache
        this.memoryCache.set(key, {
          value: serialized,
          expiresAt: Date.now() + ttlSeconds * 1000
        });
      }

      logger.debug('Cache set', { key, ttlSeconds });
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*|null} - Cached value or null if not found/expired
   */
  async get(key) {
    try {
      let cached;

      if (this.useRedis && this.redisClient) {
        cached = await this.redisClient.get(key);
      } else {
        // Memory cache
        const data = this.memoryCache.get(key);
        if (data && data.expiresAt > Date.now()) {
          cached = data.value;
        } else if (data) {
          this.memoryCache.delete(key);
          cached = null;
        }
      }

      if (cached) {
        logger.debug('Cache hit', { key });
        return JSON.parse(cached);
      }

      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }

      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
    }
  }

  /**
   * Clear all cache entries with prefix
   * @param {string} prefix - Cache key prefix
   */
  async clearPrefix(prefix) {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(`${prefix}:*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } else {
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(`${prefix}:`)) {
            this.memoryCache.delete(key);
          }
        }
      }

      logger.info('Cache cleared', { prefix });
    } catch (error) {
      logger.error('Cache clear error', { prefix, error: error.message });
    }
  }

  /**
   * Clear entire cache
   */
  async clearAll() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushdb();
      } else {
        this.memoryCache.clear();
      }

      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Cache clear all error', { error: error.message });
    }
  }

  /**
   * Get or compute cache value (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {function} computeFn - Async function to compute value if not cached
   * @param {number} ttlSeconds - TTL for cache
   * @returns {*} - Cached or computed value
   */
  async getOrCompute(key, computeFn, ttlSeconds = 300) {
    // Try to get from cache
    let value = await this.get(key);
    
    if (value !== null) {
      return value;
    }

    // Compute value
    value = await computeFn();

    // Store in cache
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttlSeconds);
    }

    return value;
  }

  /**
   * Cache medication search results
   * Key format: med:search:{sanitizedQuery}
   * TTL: 30 minutes (medications don't change often)
   * 
   * @param {string} query - Search query
   * @param {array} results - Search results
   */
  async cacheMedicationSearch(query, results) {
    const key = this.generateKey('med:search', query.toLowerCase().replace(/\s+/g, '_'));
    await this.set(key, results, 30 * 60); // 30 minutes
  }

  /**
   * Get cached medication search
   * @param {string} query - Search query
   * @returns {array|null} - Cached results or null
   */
  async getCachedMedicationSearch(query) {
    const key = this.generateKey('med:search', query.toLowerCase().replace(/\s+/g, '_'));
    return await this.get(key);
  }

  /**
   * Cache patient data
   * Key format: patient:{patientId}
   * TTL: 5 minutes (patient data changes frequently)
   * 
   * @param {number} patientId - Patient ID
   * @param {object} data - Patient data
   */
  async cachePatient(patientId, data) {
    const key = this.generateKey('patient', patientId);
    await this.set(key, data, 5 * 60); // 5 minutes
  }

  /**
   * Get cached patient data
   * @param {number} patientId - Patient ID
   * @returns {object|null} - Cached patient data or null
   */
  async getCachedPatient(patientId) {
    const key = this.generateKey('patient', patientId);
    return await this.get(key);
  }

  /**
   * Cache queue data
   * Key format: queue:doctor:{doctorId}
   * TTL: 1 minute (queue changes frequently)
   * 
   * @param {number} doctorId - Doctor ID
   * @param {array} queueData - Queue entries
   */
  async cacheQueue(doctorId, queueData) {
    const key = this.generateKey('queue:doctor', doctorId);
    await this.set(key, queueData, 60); // 1 minute
  }

  /**
   * Get cached queue data
   * @param {number} doctorId - Doctor ID
   * @returns {array|null} - Cached queue data or null
   */
  async getCachedQueue(doctorId) {
    const key = this.generateKey('queue:doctor', doctorId);
    return await this.get(key);
  }

  /**
   * Cache ICD code search
   * Key format: icd:search:{query}
   * TTL: 1 hour (ICD codes don't change)
   * 
   * @param {string} query - Search query
   * @param {array} results - Search results
   */
  async cacheICDSearch(query, results) {
    const key = this.generateKey('icd:search', query.toLowerCase());
    await this.set(key, results, 60 * 60); // 1 hour
  }

  /**
   * Get cached ICD search
   * @param {string} query - Search query
   * @returns {array|null} - Cached results or null
   */
  async getCachedICDSearch(query) {
    const key = this.generateKey('icd:search', query.toLowerCase());
    return await this.get(key);
  }

  /**
   * Cache SNOMED code search
   * Key format: snomed:search:{query}
   * TTL: 1 hour (SNOMED codes don't change often)
   * 
   * @param {string} query - Search query
   * @param {array} results - Search results
   */
  async cacheSNOMEDSearch(query, results) {
    const key = this.generateKey('snomed:search', query.toLowerCase());
    await this.set(key, results, 60 * 60); // 1 hour
  }

  /**
   * Get cached SNOMED search
   * @param {string} query - Search query
   * @returns {array|null} - Cached results or null
   */
  async getCachedSNOMEDSearch(query) {
    const key = this.generateKey('snomed:search', query.toLowerCase());
    return await this.get(key);
  }

  /**
   * Cache prescription data
   * Key format: prescription:{prescriptionId}
   * TTL: 10 minutes (prescriptions are created frequently)
   * 
   * @param {number} prescriptionId - Prescription ID
   * @param {object} data - Prescription data
   */
  async cachePrescription(prescriptionId, data) {
    const key = this.generateKey('prescription', prescriptionId);
    await this.set(key, data, 10 * 60); // 10 minutes
  }

  /**
   * Get cached prescription
   * @param {number} prescriptionId - Prescription ID
   * @returns {object|null} - Cached prescription or null
   */
  async getCachedPrescription(prescriptionId) {
    const key = this.generateKey('prescription', prescriptionId);
    return await this.get(key);
  }

  /**
   * Cache appointment data
   * Key format: appointment:{appointmentId}
   * TTL: 5 minutes
   * 
   * @param {number} appointmentId - Appointment ID
   * @param {object} data - Appointment data
   */
  async cacheAppointment(appointmentId, data) {
    const key = this.generateKey('appointment', appointmentId);
    await this.set(key, data, 5 * 60); // 5 minutes
  }

  /**
   * Get cached appointment
   * @param {number} appointmentId - Appointment ID
   * @returns {object|null} - Cached appointment or null
   */
  async getCachedAppointment(appointmentId) {
    const key = this.generateKey('appointment', appointmentId);
    return await this.get(key);
  }

  /**
   * Invalidate patient-related caches when patient is updated
   * @param {number} patientId - Patient ID
   */
  async invalidatePatient(patientId) {
    await this.delete(this.generateKey('patient', patientId));
  }

  /**
   * Invalidate queue cache when queue changes
   * @param {number} doctorId - Doctor ID (optional, clears all if not provided)
   */
  async invalidateQueue(doctorId = null) {
    if (doctorId) {
      await this.delete(this.generateKey('queue:doctor', doctorId));
    } else {
      await this.clearPrefix('queue');
    }
  }

  /**
   * Invalidate prescription cache
   * @param {number} prescriptionId - Prescription ID (optional, clears all if not provided)
   */
  async invalidatePrescription(prescriptionId = null) {
    if (prescriptionId) {
      await this.delete(this.generateKey('prescription', prescriptionId));
    } else {
      await this.clearPrefix('prescription');
    }
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats (size, hits, misses)
   */
  async getStats() {
    const stats = {
      type: this.useRedis ? 'Redis' : 'Memory',
      uptime: Date.now() - this.initTime
    };

    if (!this.useRedis) {
      stats.entries = this.memoryCache.size;
      let memoryUsage = 0;
      for (const [key, data] of this.memoryCache.entries()) {
        memoryUsage += key.length + JSON.stringify(data).length;
      }
      stats.estimatedMemoryBytes = memoryUsage;
    }

    return stats;
  }
}

module.exports = CacheService;
