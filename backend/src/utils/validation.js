/**
 * Input Validation Helper Utilities
 * Provides reusable validation functions for common data types
 */

/**
 * Validate numeric ID
 * @param {*} id - ID to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {number} Validated ID
 * @throws {Error} If ID is invalid
 */
const validateId = (id, fieldName = 'ID') => {
  if (!id || typeof id !== 'number' || id <= 0 || !Number.isInteger(id)) {
    throw new Error(`Invalid ${fieldName}: must be a positive integer`);
  }
  return id;
};

/**
 * Validate string ID
 * @param {*} id - ID to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {string} Validated ID
 * @throws {Error} If ID is invalid
 */
const validateStringId = (id, fieldName = 'ID') => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`Invalid ${fieldName}: must be a non-empty string`);
  }
  return id.trim();
};

/**
 * Validate email address
 * @param {*} email - Email to validate
 * @returns {string} Validated email
 * @throws {Error} If email is invalid
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    throw new Error('Invalid email format');
  }
  
  return email.trim().toLowerCase();
};

/**
 * Validate phone number (Indian mobile format)
 */
const validatePhone = (phone) => {
  const phoneRegex = /^(?:\+91[-\s]?)?[6-9]\d{9}$/;
  
  if (!phone || typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
    throw new Error('Invalid phone number format. Expected 10-digit mobile number (optional +91 prefix).');
  }
  
  return phone.trim();
};

/**
 * Validate date
 * @param {*} date - Date to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Date} Validated date
 * @throws {Error} If date is invalid
 */
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    throw new Error(`${fieldName} is required`);
  }
  
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    throw new Error(`Invalid ${fieldName}: must be a valid date`);
  }
  
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid ${fieldName}: must be a valid date`);
  }
  
  return dateObj;
};

/**
 * Validate date is not in the past
 * @param {*} date - Date to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Date} Validated date
 * @throws {Error} If date is in the past
 */
const validateFutureDate = (date, fieldName = 'Date') => {
  const validatedDate = validateDate(date, fieldName);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (validatedDate < now) {
    throw new Error(`${fieldName} must be in the future`);
  }
  
  return validatedDate;
};

/**
 * Validate date is not in the future
 * @param {*} date - Date to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Date} Validated date
 * @throws {Error} If date is in the future
 */
const validatePastDate = (date, fieldName = 'Date') => {
  const validatedDate = validateDate(date, fieldName);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  if (validatedDate > now) {
    throw new Error(`${fieldName} must not be in the future`);
  }
  
  return validatedDate;
};

/**
 * Validate string length
 * @param {*} str - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {string} Validated string
 * @throws {Error} If string length is invalid
 */
const validateStringLength = (str, minLength, maxLength, fieldName = 'String') => {
  if (typeof str !== 'string' || str.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  
  const trimmed = str.trim();
  
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
  
  return trimmed;
};

/**
 * Validate array is not empty
 * @param {*} arr - Array to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Array} Validated array
 * @throws {Error} If array is invalid or empty
 */
const validateArray = (arr, fieldName = 'Array') => {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array`);
  }
  
  return arr;
};

/**
 * Validate number is within range
 * @param {*} num - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {number} Validated number
 * @throws {Error} If number is out of range
 */
const validateNumberRange = (num, min, max, fieldName = 'Number') => {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  
  return num;
};

/**
 * Validate enum value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {*} Validated value
 * @throws {Error} If value is not in allowed list
 */
const validateEnum = (value, allowedValues, fieldName = 'Value') => {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  
  return value;
};

/**
 * Validate required field (not null or undefined)
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {*} Validated value
 * @throws {Error} If value is null or undefined
 */
const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} is required`);
  }
  
  return value;
};

/**
 * Validate blood group
 * @param {*} bloodGroup - Blood group to validate
 * @returns {string} Validated blood group
 * @throws {Error} If blood group is invalid
 */
const validateBloodGroup = (bloodGroup) => {
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  return validateEnum(bloodGroup, validGroups, 'Blood group');
};

/**
 * Validate gender
 * @param {*} gender - Gender to validate
 * @returns {string} Validated gender
 * @throws {Error} If gender is invalid
 */
const validateGender = (gender) => {
  const validGenders = ['M', 'F', 'O', 'U'];
  return validateEnum(gender, validGenders, 'Gender');
};

/**
 * Validate ICD code format
 * @param {*} icdCode - ICD code to validate
 * @returns {string} Validated ICD code
 * @throws {Error} If ICD code is invalid
 */
const validateIcdCode = (icdCode) => {
  const icdRegex = /^[A-Z]\d{2}(\.\d{1,2})?$/;
  
  if (!icdCode || typeof icdCode !== 'string' || !icdRegex.test(icdCode)) {
    throw new Error('Invalid ICD code format. Expected format: A00 or A00.1');
  }
  
  return icdCode.toUpperCase();
};

/**
 * Safe parse JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {object} Parsed object
 * @throws {Error} If JSON is invalid
 */
const parseJSON = (jsonString, fieldName = 'JSON') => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid ${fieldName}: ${error.message}`);
  }
};

module.exports = {
  validateId,
  validateStringId,
  validateEmail,
  validatePhone,
  validateDate,
  validateFutureDate,
  validatePastDate,
  validateStringLength,
  validateArray,
  validateNumberRange,
  validateEnum,
  validateRequired,
  validateBloodGroup,
  validateGender,
  validateIcdCode,
  parseJSON
};
