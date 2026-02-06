/**
 * WEEK 2: SQL Injection Prevention Service
 * 
 * Comprehensive input validation and sanitization
 * Uses parametrized queries throughout application
 * 
 * Examples:
 * ❌ DANGEROUS: `SELECT * FROM patients WHERE id = ${id}`
 * ✅ SAFE: `SELECT * FROM patients WHERE id = ?` with [id] params
 */

// Dangerous characters that could indicate SQL injection attempt
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/gi,
  /(-{2}|\/\*|\*\/|;)/g, // SQL comments and statement terminators
  /('|")(.*?)\1(\s*)(OR|AND)/gi, // Quote-based injection
];

// Safe string patterns for different field types
const SAFE_PATTERNS = {
  name: /^[a-zA-Z\s\-'\.]{1,255}$/, // Allows letters, spaces, hyphens, apostrophes, dots
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Standard email validation
  phone: /^[0-9\-\+\(\)\s]{7,20}$/, // Phone numbers
  date: /^\d{4}-\d{2}-\d{2}$/, // ISO date format YYYY-MM-DD
  number: /^-?\d+(\.\d+)?$/, // Positive or negative numbers
  alphanumeric: /^[a-zA-Z0-9_\-]{1,50}$/, // Safe usernames, IDs
  url: /^https?:\/\/.+$/, // URLs starting with http or https
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/, // IP address format
};

class InputSanitizer {
  /**
   * Check if input contains potential SQL injection
   * @param {string} input - User input to validate
   * @returns {boolean} - True if injection detected
   */
  static containsSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize string input - remove dangerous characters
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, 255) // Limit length
      .replace(/[<>\"']/g, '') // Remove quotes and angle brackets
      .replace(/\0/g, ''); // Remove null bytes
  }

  /**
   * Validate input against specific type pattern
   * @param {string} input - Input to validate
   * @param {string} type - Type (name, email, phone, date, number, alphanumeric, url, ipv4)
   * @returns {boolean} - True if valid
   */
  static validateType(input, type) {
    if (!input) return false;
    
    const pattern = SAFE_PATTERNS[type];
    if (!pattern) throw new Error(`Unknown type: ${type}`);
    
    return pattern.test(input.toString());
  }

  /**
   * Validate patient data
   * @param {object} data - Patient object
   * @returns {object} - { valid: boolean, errors: [] }
   */
  static validatePatient(data) {
    const errors = [];

    if (!data.name || !this.validateType(data.name, 'name')) {
      errors.push('Invalid patient name');
    }

    if (data.email && !this.validateType(data.email, 'email')) {
      errors.push('Invalid email format');
    }

    if (data.phone && !this.validateType(data.phone, 'phone')) {
      errors.push('Invalid phone number');
    }

    if (data.dob && !this.validateType(data.dob, 'date')) {
      errors.push('Invalid date of birth (use YYYY-MM-DD)');
    }

    if (data.gender && !['M', 'F', 'O'].includes(data.gender)) {
      errors.push('Invalid gender');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate medication data
   * @param {object} data - Medication object
   * @returns {object} - { valid: boolean, errors: [] }
   */
  static validateMedication(data) {
    const errors = [];

    if (!data.name || !this.validateType(data.name, 'name')) {
      errors.push('Invalid medication name');
    }

    if (data.strength && typeof data.strength !== 'string') {
      errors.push('Invalid medication strength');
    }

    if (data.dose && !this.validateType(data.dose, 'number')) {
      errors.push('Invalid dose value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate prescription data
   * @param {object} data - Prescription object
   * @returns {object} - { valid: boolean, errors: [] }
   */
  static validatePrescription(data) {
    const errors = [];

    if (!data.patient_id || !this.validateType(data.patient_id.toString(), 'alphanumeric')) {
      errors.push('Invalid patient ID');
    }

    if (!data.medications || !Array.isArray(data.medications)) {
      errors.push('Medications must be an array');
    } else if (data.medications.length === 0) {
      errors.push('At least one medication required');
    }

    if (data.diagnosis && data.diagnosis.length > 500) {
      errors.push('Diagnosis too long (max 500 chars)');
    }

    if (data.notes && data.notes.length > 1000) {
      errors.push('Notes too long (max 1000 chars)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate appointment data
   * @param {object} data - Appointment object
   * @returns {object} - { valid: boolean, errors: [] }
   */
  static validateAppointment(data) {
    const errors = [];

    if (!data.patient_id || !this.validateType(data.patient_id.toString(), 'alphanumeric')) {
      errors.push('Invalid patient ID');
    }

    if (!data.appointment_time || !this.validateType(data.appointment_time, 'date')) {
      errors.push('Invalid appointment time');
    }

    if (data.chief_complaint && data.chief_complaint.length > 500) {
      errors.push('Chief complaint too long (max 500 chars)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize SQL search parameter
   * Used for LIKE queries where wildcards are needed
   * @param {string} input - Search input
   * @returns {string} - Sanitized for LIKE (with wildcards still intact)
   */
  static sanitizeSearchInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, 100) // Limit search length
      .replace(/[%_\\]/g, '\\$&') // Escape LIKE wildcards
      .replace(/[<>\"']/g, ''); // Remove quotes and angle brackets
  }

  /**
   * Validate search query parameter
   * @param {string} query - Search query
   * @param {number} maxLength - Max allowed length (default 100)
   * @returns {object} - { valid: boolean, errors: [], query: sanitized }
   */
  static validateSearchQuery(query, maxLength = 100) {
    const errors = [];

    if (!query || typeof query !== 'string') {
      errors.push('Search query must be a string');
    } else if (query.trim().length === 0) {
      errors.push('Search query cannot be empty');
    } else if (query.length > maxLength) {
      errors.push(`Search query exceeds maximum length of ${maxLength}`);
    } else if (this.containsSQLInjection(query)) {
      errors.push('Invalid characters detected in search query');
    }

    return {
      valid: errors.length === 0,
      errors,
      query: this.sanitizeSearchInput(query)
    };
  }

  /**
   * Validate numeric ID (common in REST APIs)
   * @param {*} id - ID to validate
   * @returns {boolean} - True if valid positive integer
   */
  static validateNumericId(id) {
    const numId = parseInt(id, 10);
    return Number.isInteger(numId) && numId > 0;
  }

  /**
   * Validate UUID format
   * @param {string} uuid - UUID string
   * @returns {boolean} - True if valid UUID
   */
  static validateUUID(uuid) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  }

  /**
   * Batch validate multiple inputs
   * @param {object} data - Object with key-value pairs
   * @param {object} rules - Validation rules { fieldName: 'type' }
   * @returns {object} - { valid: boolean, errors: [] }
   */
  static batchValidate(data, rules) {
    const errors = [];

    Object.entries(rules).forEach(([field, type]) => {
      const value = data[field];
      
      if (value && !this.validateType(value.toString(), type)) {
        errors.push(`Invalid ${field} (expected ${type})`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = InputSanitizer;
