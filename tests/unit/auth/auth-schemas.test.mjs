// File: test/backend/auth/authSchemas.test.mjs

import { describe, it, expect } from 'vitest';

// Import the schemas to test
const schemasModule = await import('../../../src/backend/auth/utils/authSchemas.mjs');
const { loginSchema, refreshSchema, elevateSchema } = schemasModule;

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should define correct structure for login requests', () => {
      expect(loginSchema).toEqual({
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
      });
    });

    it('should require publicKey, signature, and nonce', () => {
      expect(loginSchema.required).toContain('publicKey');
      expect(loginSchema.required).toContain('signature');
      expect(loginSchema.required).toContain('nonce');
    });

    it('should have proper length constraints', () => {
      expect(loginSchema.properties.publicKey.minLength).toBe(32);
      expect(loginSchema.properties.signature.minLength).toBe(64);
      expect(loginSchema.properties.nonce.minLength).toBe(16);
    });

    it('should allow supported signature schemes', () => {
      expect(loginSchema.properties.scheme.enum).toEqual(['ecdsa', 'ed25519', 'rsa']);
      expect(loginSchema.properties.scheme.default).toBe('ecdsa');
    });

    it('should not allow additional properties', () => {
      expect(loginSchema.additionalProperties).toBe(false);
    });
  });

  describe('refreshSchema', () => {
    it('should define correct structure for refresh token requests', () => {
      expect(refreshSchema).toEqual({
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
      });
    });

    it('should require refreshToken', () => {
      expect(refreshSchema.required).toContain('refreshToken');
    });

    it('should enforce minimum length for refresh token', () => {
      expect(refreshSchema.properties.refreshToken.minLength).toBe(32);
    });

    it('should not allow additional properties', () => {
      expect(refreshSchema.additionalProperties).toBe(false);
    });
  });

  describe('elevateSchema', () => {
    it('should define correct structure for auth elevation requests', () => {
      expect(elevateSchema).toEqual({
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
      });
    });

    it('should require factor and factorData', () => {
      expect(elevateSchema.required).toContain('factor');
      expect(elevateSchema.required).toContain('factorData');
    });

    it('should allow supported authentication factors', () => {
      expect(elevateSchema.properties.factor.enum).toEqual(['biometric', 'device_attestation']);
    });

    it('should expect factorData as object', () => {
      expect(elevateSchema.properties.factorData.type).toBe('object');
    });

    it('should not allow additional properties', () => {
      expect(elevateSchema.additionalProperties).toBe(false);
    });
  });

  describe('schema consistency', () => {
    it('should all have object type', () => {
      expect(loginSchema.type).toBe('object');
      expect(refreshSchema.type).toBe('object');
      expect(elevateSchema.type).toBe('object');
    });

    it('should all disable additional properties', () => {
      expect(loginSchema.additionalProperties).toBe(false);
      expect(refreshSchema.additionalProperties).toBe(false);
      expect(elevateSchema.additionalProperties).toBe(false);
    });

    it('should all have required fields array', () => {
      expect(Array.isArray(loginSchema.required)).toBe(true);
      expect(Array.isArray(refreshSchema.required)).toBe(true);
      expect(Array.isArray(elevateSchema.required)).toBe(true);
    });

    it('should all have properties object', () => {
      expect(typeof loginSchema.properties).toBe('object');
      expect(typeof refreshSchema.properties).toBe('object');
      expect(typeof elevateSchema.properties).toBe('object');
    });
  });
});






