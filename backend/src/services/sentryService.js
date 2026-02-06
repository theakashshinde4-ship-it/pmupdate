/**
 * WEEK 4: Sentry Integration Service
 * 
 * Provides error monitoring, alerting, and performance tracking
 * Supports critical error notifications and performance metrics
 * 
 * Features:
 * - Error tracking and reporting
 * - Critical error alerts
 * - Performance metrics monitoring
 * - Database health checks
 * - Snowstorm API availability monitoring
 */

const axios = require('axios');
const logger = require('./logger');

class SentryService {
  constructor() {
    this.initialized = false;
    this.client = null;
    this.alertThresholds = {
      errorRate: 5, // Alert if error rate > 5% in 5 minutes
      responseTime: 2000, // Alert if avg response time > 2s
      dbConnectionFailures: 3, // Alert if > 3 failures in 5 minutes
      snowstormDowntime: 30000, // Alert if Snowstorm down > 30s
    };
    this.metrics = {
      errors: [],
      responseTime: [],
      dbFailures: [],
      snowstormStatus: { available: true, lastCheck: null },
    };
  }

  /**
   * Initialize Sentry service
   * @param {object} config - Configuration object
   * @param {string} config.dsn - Sentry DSN
   * @param {string} config.environment - Environment (dev, staging, prod)
   * @param {string} config.release - Version/release number
   */
  initialize(config) {
    try {
      // For demo: we'll use a lightweight monitoring approach
      // In production, use: npm install @sentry/node @sentry/tracing
      
      this.config = {
        dsn: process.env.SENTRY_DSN || config?.dsn || null,
        environment: process.env.NODE_ENV || config?.environment || 'development',
        release: config?.release || '1.0.0',
      };

      this.initialized = true;
      logger.info('Sentry service initialized', {
        environment: this.config.environment,
        hasDSN: !!this.config.dsn,
      });

      // Start monitoring background tasks
      this.startMonitoring();

      return true;
    } catch (error) {
      logger.error('Failed to initialize Sentry service', { error: error.message });
      return false;
    }
  }

  /**
   * Start background monitoring tasks
   */
  startMonitoring() {
    // Monitor database connection health every 30 seconds
    setInterval(() => this.checkDatabaseHealth(), 30000);

    // Monitor Snowstorm API availability every 60 seconds
    setInterval(() => this.checkSnowstormHealth(), 60000);

    // Cleanup old metrics every 5 minutes
    setInterval(() => this.cleanupMetrics(), 5 * 60 * 1000);

    // Check alert thresholds every minute
    setInterval(() => this.checkAlertThresholds(), 60000);
  }

  /**
   * Track an error event
   * @param {Error} error - Error object
   * @param {object} context - Additional context
   */
  captureException(error, context = {}) {
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      context,
      severity: context.severity || 'error',
      fingerprint: context.fingerprint || [error.message],
    };

    this.metrics.errors.push(errorRecord);

    // Log critical errors immediately
    if (context.severity === 'critical') {
      logger.error('CRITICAL ERROR', errorRecord);
      this.sendAlert('CRITICAL ERROR', errorRecord);
    }

    // Log to file
    logger.error(`${error.constructor.name}: ${error.message}`, {
      stack: error.stack,
      context,
    });

    return errorRecord;
  }

  /**
   * Track an event
   * @param {string} eventName - Event name
   * @param {object} data - Event data
   */
  captureEvent(eventName, data = {}) {
    const event = {
      timestamp: Date.now(),
      name: eventName,
      data,
    };

    logger.info(`Event: ${eventName}`, data);
    return event;
  }

  /**
   * Track response time
   * @param {number} duration - Duration in milliseconds
   * @param {string} endpoint - API endpoint
   */
  trackResponseTime(duration, endpoint) {
    this.metrics.responseTime.push({
      timestamp: Date.now(),
      duration,
      endpoint,
    });
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const db = require('../config/db').getDb();
      
      // Simple health check
      await new Promise((resolve, reject) => {
        db.query('SELECT 1', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      this.metrics.dbFailures = this.metrics.dbFailures.filter(
        (failure) => Date.now() - failure.timestamp < 5 * 60 * 1000
      );
    } catch (error) {
      this.metrics.dbFailures.push({
        timestamp: Date.now(),
        error: error.message,
      });

      logger.warn('Database health check failed', { error: error.message });

      if (this.metrics.dbFailures.length > this.alertThresholds.dbConnectionFailures) {
        this.sendAlert('Database Connection Issues', {
          failures: this.metrics.dbFailures.length,
          recentFailures: this.metrics.dbFailures.slice(-5),
        });
      }
    }
  }

  /**
   * Check Snowstorm API availability
   */
  async checkSnowstormHealth() {
    try {
      const snowstormUrl = process.env.SNOMED_SNOWSTORM_BASE_URL || 'http://localhost:8080';
      const timeout = this.alertThresholds.snowstormDowntime;

      const response = await axios.get(`${snowstormUrl}/snowstorm/snomed-ct/browser`, {
        timeout,
      });

      this.metrics.snowstormStatus = {
        available: response.status === 200,
        lastCheck: Date.now(),
        responseTime: response.headers['x-response-time'] || 'N/A',
      };

      if (response.status === 200) {
        logger.debug('Snowstorm API healthy', {
          endpoint: snowstormUrl,
          responseTime: this.metrics.snowstormStatus.responseTime,
        });
      }
    } catch (error) {
      const downtime = Date.now() - (this.metrics.snowstormStatus.lastCheck || Date.now());

      this.metrics.snowstormStatus = {
        available: false,
        lastCheck: Date.now(),
        error: error.message,
        downtime,
      };

      logger.warn('Snowstorm API health check failed', {
        error: error.message,
        downtime,
      });

      if (downtime > this.alertThresholds.snowstormDowntime) {
        this.sendAlert('Snowstorm API Unavailable', {
          downtime: `${(downtime / 1000).toFixed(0)}s`,
          error: error.message,
        });
      }
    }
  }

  /**
   * Check alert thresholds
   */
  checkAlertThresholds() {
    // Check error rate (in last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentErrors = this.metrics.errors.filter((e) => e.timestamp > fiveMinutesAgo);

    if (recentErrors.length > 10) {
      // Alert if > 10 errors in 5 minutes
      this.sendAlert('High Error Rate Detected', {
        errorCount: recentErrors.length,
        period: '5 minutes',
        sampleErrors: recentErrors.slice(-3).map((e) => ({
          message: e.message,
          type: e.type,
          timestamp: new Date(e.timestamp).toISOString(),
        })),
      });
    }

    // Check response time
    const recentResponseTimes = this.metrics.responseTime.filter(
      (rt) => rt.timestamp > fiveMinutesAgo
    );
    if (recentResponseTimes.length > 0) {
      const avgTime =
        recentResponseTimes.reduce((sum, rt) => sum + rt.duration, 0) /
        recentResponseTimes.length;

      if (avgTime > this.alertThresholds.responseTime) {
        this.sendAlert('High Response Time Detected', {
          averageTime: `${avgTime.toFixed(0)}ms`,
          threshold: `${this.alertThresholds.responseTime}ms`,
          sampleEndpoints: Array.from(new Set(recentResponseTimes.map((rt) => rt.endpoint))),
        });
      }
    }
  }

  /**
   * Send alert (email/Slack/webhook)
   * @param {string} title - Alert title
   * @param {object} data - Alert data
   */
  async sendAlert(title, data) {
    try {
      const alert = {
        timestamp: new Date().toISOString(),
        title,
        environment: this.config.environment,
        data,
      };

      logger.error(`ALERT: ${title}`, data);

      // In production, send to:
      // - Slack webhook: process.env.SLACK_WEBHOOK_URL
      // - Email: sendEmail('admin@clinic.com', title, alert)
      // - Sentry: sentry.captureException(new Error(title))
      // - PagerDuty: notifyPagerDuty(alert)

      // For demo, log to console
      console.error('\n🚨 ALERT:', alert);

      return alert;
    } catch (error) {
      logger.error('Failed to send alert', { error: error.message });
    }
  }

  /**
   * Clean up old metrics
   */
  cleanupMetrics() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    this.metrics.errors = this.metrics.errors.filter((e) => e.timestamp > oneHourAgo);
    this.metrics.responseTime = this.metrics.responseTime.filter(
      (rt) => rt.timestamp > oneHourAgo
    );
    this.metrics.dbFailures = this.metrics.dbFailures.filter(
      (failure) => failure.timestamp > oneHourAgo
    );
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentErrors = this.metrics.errors.filter((e) => e.timestamp > oneHourAgo);
    const recentResponseTimes = this.metrics.responseTime.filter(
      (rt) => rt.timestamp > oneHourAgo
    );

    const avgResponseTime =
      recentResponseTimes.length > 0
        ? (recentResponseTimes.reduce((sum, rt) => sum + rt.duration, 0) /
            recentResponseTimes.length).toFixed(0)
        : 0;

    return {
      period: 'Last 1 hour',
      errorCount: recentErrors.length,
      errorRate: ((recentErrors.length / Math.max(recentResponseTimes.length, 1)) * 100).toFixed(
        2
      ),
      averageResponseTime: `${avgResponseTime}ms`,
      databaseStatus: this.metrics.dbFailures.length === 0 ? 'HEALTHY' : 'ISSUES',
      snowstormStatus: this.metrics.snowstormStatus.available ? 'AVAILABLE' : 'DOWN',
      topErrors: recentErrors.slice(-5).map((e) => ({
        message: e.message,
        type: e.type,
        count: recentErrors.filter((err) => err.message === e.message).length,
      })),
    };
  }

  /**
   * Middleware for Express
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      // Track response time
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackResponseTime(duration, req.path);
      });

      // Attach Sentry to request
      req.sentry = this;

      next();
    };
  }
}

module.exports = new SentryService();
