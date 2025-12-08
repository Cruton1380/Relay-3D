/**
 * @fileoverview Integration tests for privacy API endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPrivacyService } from '../../src/services/privacyService.mjs';
import { getSystemParameters } from '../../src/lib/systemParameters.mjs';

describe('Privacy API Integration Tests', () => {
  let privacyService;
  let systemParams;

  beforeEach(async () => {
    systemParams = await getSystemParameters();
    privacyService = await createPrivacyService();
  });

  describe('API Endpoints', () => {
    it('should verify privacy settings', async () => {
      const settings = await privacyService.getPrivacySettings('test-user-1');
      expect(settings).toBeDefined();
      expect(settings.privacyLevel).toBe(systemParams.privacyLevel);
      expect(settings.anonymityThreshold).toBe(systemParams.anonymityThreshold);
    });

    it('should update privacy preferences', async () => {
      const newSettings = {
        privacyLevel: 'maximum',
        locationSharing: false,
        dataRetention: 'minimal'
      };

      const updated = await privacyService.updatePrivacySettings('test-user-1', newSettings);
      expect(updated.success).toBe(true);
      
      const settings = await privacyService.getPrivacySettings('test-user-1');
      expect(settings.privacyLevel).toBe(newSettings.privacyLevel);
      expect(settings.locationSharing).toBe(newSettings.locationSharing);
      expect(settings.dataRetention).toBe(newSettings.dataRetention);
    });

    it('should validate authentication tokens', async () => {
      const result = await privacyService.validateAuthToken('invalid-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid authentication token');
    });
  });

  describe('Data Flow', () => {
    it('should encrypt sensitive data', async () => {
      const testData = { userId: 'test-user-1', location: [40.7128, -74.0060] };
      const encrypted = await privacyService.encryptData(testData);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toContain(testData.userId);
      
      const decrypted = await privacyService.decryptData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should anonymize user data', async () => {
      const userData = {
        userId: 'test-user-1',
        email: 'test@example.com',
        location: [40.7128, -74.0060]
      };

      const anonymized = await privacyService.anonymizeData(userData);
      expect(anonymized.userId).not.toBe(userData.userId);
      expect(anonymized.email).toBeUndefined();
      expect(Array.isArray(anonymized.location)).toBe(true);
      expect(anonymized.location).not.toEqual(userData.location);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed encryption requests', async () => {
      try {
        await privacyService.encryptData(undefined);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Invalid data for encryption');
      }
    });

    it('should handle invalid decryption attempts', async () => {
      try {
        await privacyService.decryptData('invalid-encrypted-data');
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Invalid encrypted data');
      }
    });

    it('should prevent unauthorized settings access', async () => {
      try {
        await privacyService.getPrivacySettings(undefined);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('User ID required');
      }
    });
  });
});






