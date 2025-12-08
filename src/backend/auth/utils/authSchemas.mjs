/**
 * @fileoverview Authentication Validation Schemas
 * JSON schemas for validating authentication requests
 */

export const loginSchema = {
  type: 'object',
  required: ['publicKey', 'signature', 'nonce'],
  properties: {
    publicKey: {
      type: 'string',
      minLength: 32,
      description: 'User public key'
    },
    signature: {
      type: 'string',
      minLength: 64,
      description: 'Cryptographic signature of the challenge'
    },
    nonce: {
      type: 'string',
      minLength: 16,
      description: 'Unique challenge nonce'
    },
    scheme: {
      type: 'string',
      enum: ['ecdsa', 'ed25519', 'rsa'],
      default: 'ecdsa',
      description: 'Signature scheme used'
    }
  },
  additionalProperties: false
};

export const refreshSchema = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
      minLength: 32,
      description: 'Refresh token for getting a new access token'
    }
  },
  additionalProperties: false
};

export const elevateSchema = {
  type: 'object',
  required: ['factor', 'factorData'],
  properties: {
    factor: {
      type: 'string',
      enum: ['biometric', 'device_attestation'],
      description: 'Authentication factor to add'
    },
    factorData: {
      type: 'object',
      description: 'Data needed to verify the factor'
    }
  },
  additionalProperties: false
};
