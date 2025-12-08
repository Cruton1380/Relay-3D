/**
 * Joi validation schemas
 */
import Joi from 'joi';

/**
 * Schema for validating user registration
 */
export const userRegistrationSchema = Joi.object({
  inviteCode: Joi.string().required().length(12),
  publicKey: Joi.string().required().min(32),
  deviceAttestation: Joi.object().required(),
  biometricTemplate: Joi.object().required()
});

/**
 * Schema for validating vote submission
 */
export const voteSchema = Joi.object({
  topic: Joi.string().required(),
  vote: Joi.string().required().valid('yes', 'no', 'abstain'),
  timestamp: Joi.number().required(),
  signature: Joi.string().required()
});

/**
 * Schema for validating location update
 */
export const locationSchema = Joi.object({
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  accuracy: Joi.number().min(0),
  timestamp: Joi.number().required(),
  signature: Joi.string().required()
});

/**
 * Schema for validating region boundaries
 */
export const regionBoundarySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('polygon', 'circle').required(),
  coordinates: Joi.alternatives().conditional('type', {
    is: 'polygon',
    then: Joi.array().items(
      Joi.array().items(
        Joi.array().ordered(
          Joi.number().min(-180).max(180), // longitude
          Joi.number().min(-90).max(90)    // latitude
        ).length(2)
      )
    ).required(),
    otherwise: Joi.object({
      center: Joi.array().ordered(
        Joi.number().min(-180).max(180),   // longitude
        Joi.number().min(-90).max(90)      // latitude
      ).length(2).required(),
      radius: Joi.number().positive().required()
    }).required()
  }),
  properties: Joi.object().optional()
});
