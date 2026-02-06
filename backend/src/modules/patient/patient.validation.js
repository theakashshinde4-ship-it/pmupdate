/**
 * Patient Module - Validation Schemas
 * Centralized input validation using Joi
 */
const Joi = require('joi');

const createPatientSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.empty': 'Patient name is required',
      'string.min': 'Patient name must be at least 2 characters'
    }),

  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Invalid email address',
      'string.empty': 'Email is required'
    }),

  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be 10 digits',
      'string.empty': 'Phone is required'
    }),

  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .messages({
      'date.base': 'Invalid date format',
      'date.max': 'Date of birth cannot be in the future'
    }),

  gender: Joi.string()
    .valid('male', 'female', 'other')
    .insensitive(),

  blood_group: Joi.string()
    .valid('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'),

  city: Joi.string()
    .trim()
    .max(50),

  state: Joi.string()
    .trim()
    .max(50),

  address: Joi.string()
    .max(200),

  emergency_contact_name: Joi.string()
    .trim()
    .max(100),

  emergency_contact_phone: Joi.string()
    .pattern(/^\d{10}$/)
}).required();

const updatePatientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100),

  email: Joi.string()
    .email()
    .lowercase(),

  phone: Joi.string()
    .pattern(/^\d{10}$/),

  date_of_birth: Joi.date()
    .iso()
    .max('now'),

  gender: Joi.string()
    .valid('male', 'female', 'other')
    .insensitive(),

  blood_group: Joi.string()
    .valid('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'),

  city: Joi.string()
    .trim()
    .max(50),

  state: Joi.string()
    .trim()
    .max(50),

  address: Joi.string()
    .max(200),

  emergency_contact_name: Joi.string()
    .trim()
    .max(100),

  emergency_contact_phone: Joi.string()
    .pattern(/^\d{10}$/)
}).min(1); // At least one field required

const listPatientsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .positive()
    .default(1)
    .messages({
      'number.positive': 'Page must be positive'
    }),

  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .default(10)
    .messages({
      'number.max': 'Limit cannot exceed 100'
    }),

  search: Joi.string()
    .trim()
    .max(100),

  gender: Joi.string()
    .valid('male', 'female', 'other')
    .insensitive(),

  blood_group: Joi.string()
    .valid('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'),

  city: Joi.string()
    .trim()
    .max(50),

  state: Joi.string()
    .trim()
    .max(50),

  doctor_id: Joi.number()
    .integer()
    .positive(),

  sort_by: Joi.string()
    .valid('created_at', 'name', 'email')
    .default('created_at'),

  sort_order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
}).unknown(false); // Reject unknown fields

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema
};
