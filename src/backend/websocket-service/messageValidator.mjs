/**
 * @fileoverview WebSocket message validation service
 */
import Joi from 'joi';
import logger from '../utils/logging/logger.mjs';

// This module provides validation for WebSocket messages
// It replaces the functionality of the old schemaRegistry.mjs

class MessageValidator {
  constructor() {
    this.schemas = new Map();
    this.initializeBaseSchemas();
  }

  initializeBaseSchemas() {
    // Base message schema that all messages should follow
    this.registerSchema('baseMessage', Joi.object({
      type: Joi.string().required(),
      action: Joi.string().required(),
      data: Joi.object().default({})
    }));

    // Authentication message schema
    this.registerSchema('auth', Joi.object({
      type: Joi.string().valid('auth').required(),
      action: Joi.string().valid('authenticate').required(),
      data: Joi.object({
        token: Joi.string().required()
      }).required()
    }));
  }

  registerSchema(name, schema) {
    this.schemas.set(name, schema);
    return this;
  }

  validate(message, schema) {
    try {
      if (typeof schema === 'string') {
        const namedSchema = this.schemas.get(schema);
        if (!namedSchema) {
          logger.error(`Schema not found: ${schema}`);
          return false;
        }
        schema = namedSchema;
      }
      
      // For Joi schemas
      if (schema.validate) {
        const { error } = schema.validate(message);
        if (error) {
          logger.debug(`Message validation failed: ${error.message}`);
          return false;
        }
        return true;
      }
      
      // For JSON Schema objects, use a simple property check
      // In a real implementation, you would use a JSON Schema validator like AJV
      for (const key of (schema.required || [])) {
        if (message[key] === undefined) {
          logger.debug(`Required property missing: ${key}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating message:', error);
      return false;
    }
  }
}

export default new MessageValidator();
