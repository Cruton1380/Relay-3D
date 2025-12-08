// test/backend/auth/utils/passwordDanceMFA.test.mjs
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generatePasswordDanceChallenge, 
  verifyPasswordDanceResponse 
} from '../../../src/backend/auth/utils/passwordDanceMFA.mjs';

// Mock dependencies
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: vi.fn(() => ({
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn()
    }))
  }
}));

vi.mock('../../../src/backend/security/userIdentityService.mjs', () => ({
  getIdentityProfile: vi.fn(),
  addIdentityFactor: vi.fn(),
  verifyIdentityAgainstProfile: vi.fn()
}));

vi.mock('../../../src/backend/security/deviceManager.mjs', () => ({
  getUserDevices: vi.fn()
}));

describe('Password Dance MFA', () => {
  let mockIdentityService;
  let mockDeviceManager;

  beforeEach(async () => {
    await vi.resetModules();
    
    // Setup mocks
    const { getIdentityProfile, addIdentityFactor, verifyIdentityAgainstProfile } = await import('../../../src/backend/security/userIdentityService.mjs');
    const { getUserDevices } = await import('../../../src/backend/security/deviceManager.mjs');
    
    mockIdentityService = { getIdentityProfile, addIdentityFactor, verifyIdentityAgainstProfile };
    mockDeviceManager = { getUserDevices };
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePasswordDanceChallenge', () => {
    it('should generate basic challenge for users without profile', async () => {
      // Mock no profile found
      mockIdentityService.getIdentityProfile.mockReturnValue(null);
      
      const publicKey = 'test-public-key-123';
      const challenge = await generatePasswordDanceChallenge(publicKey);
      
      expect(challenge).toBeDefined();
      expect(challenge.type).toBe('basic');
      expect(challenge.requiredFactors).toContain('biometric');
      expect(challenge.nonce).toBeDefined();
      expect(challenge.expiresAt).toBeGreaterThan(Date.now());
      expect(challenge.publicKey).toBe(publicKey);
    });

    it('should generate challenge with biometric factor for users with biometric profile', async () => {
      // Mock profile with biometric factor
      const mockProfile = {
        factors: {
          biometric: [{ type: 'facial', enrolled: true }],
          device: [],
          location: [],
          activity: []
        },
        strength: 'medium'
      };
      
      mockIdentityService.getIdentityProfile.mockReturnValue(mockProfile);
      
      const publicKey = 'test-public-key-456';
      const challenge = await generatePasswordDanceChallenge(publicKey);
      
      expect(challenge).toBeDefined();
      expect(challenge.requiredFactors).toContain('biometric');
      expect(challenge.challenges).toBeDefined();
      expect(challenge.challenges.biometric).toBeDefined();
      expect(challenge.challenges.biometric.type).toBe('facialGesture');
      expect(challenge.challenges.biometric.gestures).toBeInstanceOf(Array);
      expect(challenge.publicKey).toBe(publicKey);
    });

    it('should generate challenge with device factor for users with device profile', async () => {
      // Mock profile with device factor
      const mockProfile = {
        factors: {
          biometric: [],
          device: [{ deviceId: 'device-123', trusted: true }],
          location: [],
          activity: []
        },
        strength: 'medium'
      };
      
      mockIdentityService.getIdentityProfile.mockReturnValue(mockProfile);
      mockDeviceManager.getUserDevices.mockResolvedValue([
        { deviceId: 'device-123', name: 'iPhone 12', trusted: true }
      ]);
      
      const publicKey = 'test-public-key-789';
      const challenge = await generatePasswordDanceChallenge(publicKey);
      
      expect(challenge).toBeDefined();
      expect(challenge.requiredFactors).toContain('device');
      expect(challenge.challenges).toBeDefined();
      expect(challenge.challenges.device).toBeDefined();
      expect(challenge.challenges.device.type).toBe('deviceAttestation');
      expect(challenge.challenges.device.knownDevices).toContain('device-123');
    });

    it('should generate challenge with location factor for users with location profile', async () => {
      // Mock profile with location factor
      const mockProfile = {
        factors: {
          biometric: [],
          device: [],
          location: [{ lat: 37.7749, lng: -122.4194, trusted: true }],
          activity: []
        },
        strength: 'medium'
      };
      
      mockIdentityService.getIdentityProfile.mockReturnValue(mockProfile);
      
      const publicKey = 'test-public-key-location';
      const challenge = await generatePasswordDanceChallenge(publicKey);
      
      expect(challenge).toBeDefined();
      expect(challenge.requiredFactors).toContain('location');
      expect(challenge.challenges).toBeDefined();
      expect(challenge.challenges.location).toBeDefined();
      expect(challenge.challenges.location.type).toBe('locationProximity');
      expect(challenge.challenges.location.knownLocations).toBeInstanceOf(Array);
    });

    it('should generate challenge with activity factor for users with activity profile', async () => {
      // Mock profile with activity factor
      const mockProfile = {
        factors: {
          biometric: [],
          device: [],
          location: [],
          activity: [{ pattern: 'typing', confidence: 0.8 }]
        },
        strength: 'medium'
      };
      
      mockIdentityService.getIdentityProfile.mockReturnValue(mockProfile);
      
      const publicKey = 'test-public-key-activity';
      const challenge = await generatePasswordDanceChallenge(publicKey);
      
      expect(challenge).toBeDefined();
      expect(challenge.requiredFactors).toContain('activity');
      expect(challenge.challenges).toBeDefined();
      expect(challenge.challenges.activity).toBeDefined();
      expect(challenge.challenges.activity.type).toBe('behavioralPattern');
      expect(['typing', 'scrolling']).toContain(challenge.challenges.activity.patternType);
    });

    it('should generate multi-factor challenge for high-strength profiles', async () => {
      // Mock high-strength profile with multiple factors
      const mockProfile = {
        factors: {
          biometric: [{ type: 'facial', enrolled: true }],
          device: [{ deviceId: 'device-123', trusted: true }],
          location: [{ lat: 37.7749, lng: -122.4194, trusted: true }],
          activity: [{ pattern: 'typing', confidence: 0.8 }]
        },
        strength: 'high'
      };
      
      mockIdentityService.getIdentityProfile.mockReturnValue(mockProfile);
      mockDeviceManager.getUserDevices.mockResolvedValue([
        { deviceId: 'device-123', name: 'iPhone 12', trusted: true }
      ]);
      
      const publicKey = 'test-public-key-multi';
      const challenge = await generatePasswordDanceChallenge(publicKey);
      
      expect(challenge).toBeDefined();
      expect(challenge.requiredFactors.length).toBeGreaterThan(1);
      expect(challenge.challenges).toBeDefined();
      
      // Should have challenges for each required factor
      challenge.requiredFactors.forEach(factor => {
        expect(challenge.challenges[factor]).toBeDefined();
      });
    });
  });

  describe('verifyPasswordDanceResponse', () => {
    it('should reject expired challenges', async () => {
      const expiredChallenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        requiredFactors: ['biometric'],
        publicKey: 'test-key'
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          biometric: { gestures: ['smile', 'blink'] }
        }
      };
      
      const result = await verifyPasswordDanceResponse(expiredChallenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.reason).toBe('Challenge expired');
    });

    it('should reject invalid nonce', async () => {
      const challenge = {
        nonce: 'correct-nonce',
        expiresAt: Date.now() + 300000, // Valid for 5 minutes
        requiredFactors: ['biometric'],
        publicKey: 'test-key',
        challenges: {
          biometric: { type: 'facialGesture', gestures: ['smile', 'blink'] }
        }
      };
      
      const response = {
        nonce: 'wrong-nonce',
        factors: {
          biometric: { gestures: ['smile', 'blink'] }
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.reason).toBe('Invalid challenge nonce');
    });

    it('should verify valid biometric factor response', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['biometric'],
        publicKey: 'test-key',
        challenges: {
          biometric: { 
            type: 'facialGesture', 
            gestures: ['smile', 'blink'] 
          }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          biometric: { 
            gestures: ['smile', 'blink'],
            biometricHash: 'hash123'
          }
        }
      };
      
      mockIdentityService.addIdentityFactor.mockResolvedValue(true);
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(true);
      expect(result.factors.biometric.verified).toBe(true);
      expect(result.strengthIncreased).toBe(true);
    });

    it('should verify valid device factor response', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['device'],
        publicKey: 'test-key',
        challenges: {
          device: { 
            type: 'deviceAttestation', 
            knownDevices: ['device-123'] 
          }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          device: { 
            deviceId: 'device-123',
            deviceName: 'iPhone 12',
            deviceModel: 'iPhone',
            attestation: { verified: true }
          }
        }
      };
      
      mockIdentityService.addIdentityFactor.mockResolvedValue(true);
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(true);
      expect(result.factors.device.verified).toBe(true);
      expect(result.strengthIncreased).toBe(true);
    });

    it('should verify valid location factor response', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['location'],
        publicKey: 'test-key',
        challenges: {
          location: { 
            type: 'locationProximity', 
            knownLocations: [{ lat: 37.7749, lng: -122.4194 }] 
          }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          location: { 
            lat: 37.7749,
            lng: -122.4194
          }
        }
      };
      
      mockIdentityService.addIdentityFactor.mockResolvedValue(true);
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(true);
      expect(result.factors.location.verified).toBe(true);
      expect(result.strengthIncreased).toBe(true);
    });

    it('should reject missing factor responses', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['biometric', 'device'],
        publicKey: 'test-key',
        challenges: {
          biometric: { type: 'facialGesture', gestures: ['smile'] },
          device: { type: 'deviceAttestation', knownDevices: ['device-123'] }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          biometric: { gestures: ['smile'], biometricHash: 'hash123' }
          // Missing device factor
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.factors.biometric.verified).toBe(true);
      expect(result.factors.device.verified).toBe(false);
      expect(result.factors.device.reason).toBe('Factor response missing');
    });

    it('should reject incomplete biometric gestures', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['biometric'],
        publicKey: 'test-key',
        challenges: {
          biometric: { 
            type: 'facialGesture', 
            gestures: ['smile', 'blink', 'nod'] 
          }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          biometric: { 
            gestures: ['smile', 'blink'], // Missing 'nod'
            biometricHash: 'hash123'
          }
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.factors.biometric.verified).toBe(false);
      expect(result.factors.biometric.reason).toBe('Missing required gestures');
    });

    it('should reject device attestation failures', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['device'],
        publicKey: 'test-key',
        challenges: {
          device: { 
            type: 'deviceAttestation', 
            knownDevices: ['device-123'] 
          }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          device: { 
            deviceId: 'unknown-device',
            attestation: { verified: false }
          }
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.factors.device.verified).toBe(false);
      expect(result.factors.device.reason).toBe('Device attestation failed');
    });

    it('should reject missing location data', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['location'],
        publicKey: 'test-key',
        challenges: {
          location: { 
            type: 'locationProximity', 
            knownLocations: [{ lat: 37.7749, lng: -122.4194 }] 
          }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          location: { 
            // Missing lat/lng data
          }
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.factors.location.verified).toBe(false);
      expect(result.factors.location.reason).toBe('Location data missing');
    });

    it('should verify multi-factor response successfully', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['biometric', 'device'],
        publicKey: 'test-key',
        challenges: {
          biometric: { type: 'facialGesture', gestures: ['smile'] },
          device: { type: 'deviceAttestation', knownDevices: ['device-123'] }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          biometric: { 
            gestures: ['smile'],
            biometricHash: 'hash123'
          },
          device: { 
            deviceId: 'device-123',
            deviceName: 'iPhone 12',
            attestation: { verified: true }
          }
        }
      };
      
      mockIdentityService.addIdentityFactor.mockResolvedValue(true);
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(true);
      expect(result.factors.biometric.verified).toBe(true);
      expect(result.factors.device.verified).toBe(true);
      expect(result.strengthIncreased).toBe(true);
      
      // Verify that identity factors were added for both verified factors
      expect(mockIdentityService.addIdentityFactor).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle unsupported factor types gracefully', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['unsupported'],
        publicKey: 'test-key',
        challenges: {
          unsupported: { type: 'unknown' }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          unsupported: { data: 'test' }
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      expect(result.verified).toBe(false);
      expect(result.factors.unsupported.verified).toBe(false);
      expect(result.factors.unsupported.reason).toBe('Unsupported factor type');
    });

    it('should handle null/undefined responses gracefully', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['biometric'],
        publicKey: 'test-key',
        challenges: {
          biometric: { type: 'facialGesture', gestures: ['smile'] }
        }
      };
      
      const result = await verifyPasswordDanceResponse(challenge, null);
      
      expect(result.verified).toBe(false);
      expect(result.reason).toBe('Invalid challenge nonce');
    });

    it('should handle addIdentityFactor failures gracefully', async () => {
      const challenge = {
        nonce: 'test-nonce',
        expiresAt: Date.now() + 300000,
        requiredFactors: ['biometric'],
        publicKey: 'test-key',
        challenges: {
          biometric: { type: 'facialGesture', gestures: ['smile'] }
        }
      };
      
      const response = {
        nonce: 'test-nonce',
        factors: {
          biometric: { 
            gestures: ['smile'],
            biometricHash: 'hash123'
          }
        }
      };
      
      // Mock addIdentityFactor to throw an error
      mockIdentityService.addIdentityFactor.mockRejectedValue(new Error('Database error'));
      
      const result = await verifyPasswordDanceResponse(challenge, response);
      
      // Should still return success for verification, even if profile update fails
      expect(result.verified).toBe(true);
      expect(result.factors.biometric.verified).toBe(true);
    });
  });
});






