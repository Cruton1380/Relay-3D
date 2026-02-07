import Joi from 'joi';
import { createError } from '../utils/common/errors.mjs';
import logger from '../utils/logging/logger.mjs';
import validationUtils from '../utils/validation/index.mjs';

// Initialize logger
const validationLogger = logger.child({ module: 'validation-middleware' });

/**
 * Middleware to validate request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
export function validateBody(schema, options = {}) {
  return validate(schema, 'body', options);
}

/**
 * Middleware to validate request query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
export function validateQuery(schema, options = {}) {
  return validate(schema, 'query', options);
}

/**
 * Middleware to validate request path parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
export function validateParams(schema, options = {}) {
  return validate(schema, 'params', options);
}

/**
 * Middleware to validate request headers
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
export function validateHeaders(schema, options = {}) {
  return validate(schema, 'headers', options);
}

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function validate(schema, property, options = {}) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      validationLogger.warn(`Validation error for ${property}`, { details });
      
      return next(createError('validation', 'Validation failed', { details }));
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
}

/**
 * Middleware to validate multiple request properties
 * @param {Object} schemas - Object with schemas for different request properties
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
export function validateRequest(schemas, options = {}) {
  return (req, res, next) => {
    const validationErrors = {};
    
    for (const [property, schema] of Object.entries(schemas)) {
      if (!schema) continue;
      
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        ...options
      });
      
      if (error) {
        validationErrors[property] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
      } else {
        req[property] = value;
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      validationLogger.warn('Multiple validation errors', { errors: validationErrors });
      return next(createError('validation', 'Validation failed', { details: validationErrors }));
    }
    
    next();
  };
}

/**
 * Simple validation middleware for basic input validation
 * @param {Object} rules - Validation rules object
 * @returns {Function} Express middleware
 */
export function validateInput(rules) {
  return (req, res, next) => {
    try {
      const errors = [];
      const data = { ...req.body, ...req.query, ...req.params };

      for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];

        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({ field, message: `${field} is required` });
          continue;
        }

        // Skip validation if field is optional and not provided
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Type validation
        if (rule.type) {
          if (rule.type === 'string' && typeof value !== 'string') {
            errors.push({ field, message: `${field} must be a string` });
          } else if (rule.type === 'number' && typeof value !== 'number') {
            errors.push({ field, message: `${field} must be a number` });
          } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
            errors.push({ field, message: `${field} must be a boolean` });
          }
        }

        // Length validation
        if (rule.length && typeof value === 'string' && value.length !== rule.length) {
          errors.push({ field, message: `${field} must be exactly ${rule.length} characters` });
        }

        // Max length validation
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rule.maxLength} characters` });
        }

        // Min/Max for numbers
        if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
          errors.push({ field, message: `${field} must be at least ${rule.min}` });
        }

        if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
          errors.push({ field, message: `${field} must be at most ${rule.max}` });
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push({ field, message: `${field} must be one of: ${rule.enum.join(', ')}` });
        }
      }

      if (errors.length > 0) {
        validationLogger.warn('Input validation failed', { errors });
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      next();
    } catch (error) {
      validationLogger.error('Validation middleware error', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Validation error'
      });
    }
  };
}

// Re-export utility validation functions for convenience
export const utils = validationUtils;

export default validateRequest;
