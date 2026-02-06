/**
 * Request Validation Middleware
 * Validates request data against Joi schemas
 */
const ApiError = require('../errors/ApiError');
const { logger } = require('../../monitoring/logger');

/**
 * Validate request data
 * @param {Object} schema - Joi schema
 * @param {string} source - 'body', 'query', 'params'
 */
const validateInput = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      
      const { value, error } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true, // Remove unknown fields
        convert: true // Convert types if possible
      });

      if (error) {
        const details = error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          details
        });

        throw new ApiError(
          422,
          'Validation failed',
          'VALIDATION_ERROR',
          { fields: details }
        );
      }

      // Replace with validated data
      req[source] = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { validateInput };
