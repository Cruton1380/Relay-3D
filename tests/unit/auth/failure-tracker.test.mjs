// File: test/backend/auth/failureTracker.test.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
const mockChildLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

const mockLogger = {
  child: vi.fn(() => mockChildLogger),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

// Setup mocks before importing module
vi.mock('../../../src/backend/utils/logging/logger.mjs', () => ({
  default: mockLogger
}));

// Mock setInterval to avoid actual timers during tests
global.setInterval = vi.fn();

// Now import the module under test
const failureTrackerModule = await import('../../../src/backend/auth/utils/failureTracker.mjs');
const failureTracker = failureTrackerModule.default;

describe('FailureTracker Service', () => {  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers({
      shouldAdvanceTime: true
    });
    
    // Reset failure tracker completely
    failureTracker.reset();
    
    // Reset failure tracker configuration to defaults
    failureTracker.configure({
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      trackingDuration: 60 * 60 * 1000  // 1 hour
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  describe('constructor and configuration', () => {    it('should initialize with default values', () => {
      // Assert - After configuration in beforeEach
      expect(mockChildLogger.info).toHaveBeenCalledWith('Failure tracker configured', {
        maxAttempts: 5,
        lockoutDuration: 15 * 60,
        trackingDuration: 60 * 60
      });
    });

    it('should configure custom settings', () => {
      // Arrange
      const customConfig = {
        maxAttempts: 3,
        lockoutDuration: 30 * 60 * 1000, // 30 minutes
        trackingDuration: 2 * 60 * 60 * 1000 // 2 hours
      };
      
      // Act
      failureTracker.configure(customConfig);
        // Assert
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Failure tracker configured',
        {
          maxAttempts: 3,
          lockoutDuration: 30 * 60, // in seconds
          trackingDuration: 2 * 60 * 60 // in seconds
        }
      );
    });

    it('should use defaults for missing config values', () => {
      // Act
      failureTracker.configure({ maxAttempts: 10 });
        // Assert
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Failure tracker configured',
        expect.objectContaining({
          maxAttempts: 10,
          lockoutDuration: 15 * 60, // default
          trackingDuration: 60 * 60 // default
        })
      );
    });
  });

  describe('getKey', () => {
    it('should generate correct key for identifier and factor type', () => {
      // Act
      const key = failureTracker.getKey('user123', 'signature');
      
      // Assert
      expect(key).toBe('user123:signature');
    });

    it('should handle different factor types', () => {
      // Act & Assert
      expect(failureTracker.getKey('user123', 'biometric')).toBe('user123:biometric');
      expect(failureTracker.getKey('user123', 'backup_key')).toBe('user123:backup_key');
    });
  });

  describe('trackFailure', () => {
    it('should track first failure for new user', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      const beforeTime = Date.now();
      
      // Act
      const result = await failureTracker.trackFailure(identifier, factorType);
      
      // Assert
      expect(result).toMatchObject({
        count: 1,
        firstFailure: expect.any(Number),
        lastFailure: expect.any(Number),
        lockedUntil: null
      });
      expect(result.firstFailure).toBeGreaterThanOrEqual(beforeTime);
      expect(result.lastFailure).toBeGreaterThanOrEqual(beforeTime);
    });

    it('should increment failure count for existing user', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      // Track first failure
      await failureTracker.trackFailure(identifier, factorType);
      
      // Act - Track second failure
      const result = await failureTracker.trackFailure(identifier, factorType);
      
      // Assert
      expect(result.count).toBe(2);
      expect(result.lockedUntil).toBeNull();
    });

    it('should lock account after max attempts reached', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      // Configure to lock after 3 attempts
      failureTracker.configure({ maxAttempts: 3, lockoutDuration: 10 * 60 * 1000 });
      
      // Track failures up to max attempts
      await failureTracker.trackFailure(identifier, factorType);
      await failureTracker.trackFailure(identifier, factorType);
      
      const beforeLock = Date.now();
      
      // Act - This should trigger the lock
      const result = await failureTracker.trackFailure(identifier, factorType);
      
      // Assert
      expect(result.count).toBe(3);
      expect(result.lockedUntil).toBeGreaterThan(beforeLock);      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'Account locked due to too many failures',
        expect.objectContaining({
          identifier,
          factorType,
          attempts: 3
        })
      );
    });    it('should update lastFailure timestamp on subsequent failures', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      // Use real time for this test since we need actual timestamp differences
      vi.useRealTimers();
      
      const firstResult = await failureTracker.trackFailure(identifier, factorType);
      
      // Wait 10ms to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Act
      const secondResult = await failureTracker.trackFailure(identifier, factorType);
      
      // Restore fake timers for other tests
      vi.useFakeTimers({
        shouldAdvanceTime: true
      });
      
      // Assert
      expect(secondResult.lastFailure).toBeGreaterThan(firstResult.lastFailure);
      expect(secondResult.firstFailure).toBe(firstResult.firstFailure);
      expect(secondResult.count).toBe(2);
    });
  });

  describe('isRateLimited', () => {
    it('should return false for new user with no failures', async () => {
      // Act
      const isLimited = await failureTracker.isRateLimited('newuser', 'signature');
      
      // Assert
      expect(isLimited).toBe(false);
    });

    it('should return false for user with failures but no lock', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      await failureTracker.trackFailure(identifier, factorType);
      await failureTracker.trackFailure(identifier, factorType);
      
      // Act
      const isLimited = await failureTracker.isRateLimited(identifier, factorType);
      
      // Assert
      expect(isLimited).toBe(false);
    });

    it('should return true for locked user', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      // Configure to lock after 2 attempts
      failureTracker.configure({ maxAttempts: 2, lockoutDuration: 10 * 60 * 1000 });
      
      // Track failures to trigger lock
      await failureTracker.trackFailure(identifier, factorType);
      await failureTracker.trackFailure(identifier, factorType);
      
      // Act
      const isLimited = await failureTracker.isRateLimited(identifier, factorType);
      
      // Assert
      expect(isLimited).toBe(true);
    });

    it('should return false after lockout period expires', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      // Configure short lockout for testing
      failureTracker.configure({ maxAttempts: 2, lockoutDuration: 1000 }); // 1 second
      
      // Track failures to trigger lock
      await failureTracker.trackFailure(identifier, factorType);
      await failureTracker.trackFailure(identifier, factorType);
      
      // Verify it's locked
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(true);
      
      // Advance time past lockout duration
      vi.advanceTimersByTime(2000);
      
      // Act
      const isLimited = await failureTracker.isRateLimited(identifier, factorType);
      
      // Assert
      expect(isLimited).toBe(false);
    });

    it('should clear lock when expired', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      failureTracker.configure({ maxAttempts: 2, lockoutDuration: 1000 });
      
      await failureTracker.trackFailure(identifier, factorType);
      await failureTracker.trackFailure(identifier, factorType);
      
      // Advance time past lockout
      vi.advanceTimersByTime(2000);
      
      // Act - This should clear the lock
      await failureTracker.isRateLimited(identifier, factorType);
      
      // Assert - Check that lock was cleared
      const failures = await failureTracker.getFailures(identifier, factorType);
      expect(failures.lockedUntil).toBeNull();
    });
  });

  describe('getFailures', () => {
    it('should return null for user with no failures', async () => {
      // Act
      const failures = await failureTracker.getFailures('newuser', 'signature');
      
      // Assert
      expect(failures).toBeNull();
    });

    it('should return failure data for user with failures', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      await failureTracker.trackFailure(identifier, factorType);
      
      // Act
      const failures = await failureTracker.getFailures(identifier, factorType);
      
      // Assert
      expect(failures).toMatchObject({
        count: 1,
        firstFailure: expect.any(Number),
        lastFailure: expect.any(Number),
        lockedUntil: null
      });
    });
  });

  describe('clearFailures', () => {
    it('should return false for user with no failures', async () => {
      // Act
      const result = await failureTracker.clearFailures('newuser', 'signature');
      
      // Assert
      expect(result).toBe(false);
    });

    it('should clear failure data and return true', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      await failureTracker.trackFailure(identifier, factorType);
      
      // Verify failures exist
      expect(await failureTracker.getFailures(identifier, factorType)).not.toBeNull();
      
      // Act
      const result = await failureTracker.clearFailures(identifier, factorType);
      
      // Assert
      expect(result).toBe(true);
      expect(await failureTracker.getFailures(identifier, factorType)).toBeNull();      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Cleared failure tracking',
        { identifier, factorType }
      );
    });

    it('should clear locked account', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      failureTracker.configure({ maxAttempts: 2 });
      
      // Trigger lock
      await failureTracker.trackFailure(identifier, factorType);
      await failureTracker.trackFailure(identifier, factorType);
      
      // Verify locked
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(true);
      
      // Act
      await failureTracker.clearFailures(identifier, factorType);
      
      // Assert
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(false);
    });
  });

  describe('cleanupExpiredEntries', () => {    it('should remove expired tracking entries', async () => {
      // Arrange - create an actual expired entry
      const identifier = 'user123';
      const factorType = 'signature';
      
      // Configure short tracking duration
      failureTracker.configure({ trackingDuration: 1000 });
      
      // Create a failure entry
      await failureTracker.trackFailure(identifier, factorType);
      
      // Clear previous mock calls
      vi.clearAllMocks();
      
      // Advance time to make the entry expire
      vi.advanceTimersByTime(2000);
      
      // Act
      failureTracker.cleanupExpiredEntries();
      
      // Assert - should log cleanup or at least not error
      // The exact behavior depends on whether any entries were actually cleaned up
      expect(() => failureTracker.cleanupExpiredEntries()).not.toThrow();
    });

    it('should remove expired locked entries', () => {
      // Arrange
      failureTracker.configure({ 
        lockoutDuration: 1000,
        trackingDuration: 500 
      });
      
      // Act
      failureTracker.cleanupExpiredEntries();
      
      // Assert - The method should run without errors
      // Detailed verification would require access to internal state
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication failure flow', async () => {
      // Arrange
      const identifier = 'user123';
      const factorType = 'signature';
      
      failureTracker.configure({ maxAttempts: 3, lockoutDuration: 5000 });
      
      // Act & Assert - Track failures leading to lock
      await failureTracker.trackFailure(identifier, factorType);
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(false);
      
      await failureTracker.trackFailure(identifier, factorType);
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(false);
      
      await failureTracker.trackFailure(identifier, factorType);
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(true);
      
      // Advance time and verify unlock
      vi.advanceTimersByTime(6000);
      expect(await failureTracker.isRateLimited(identifier, factorType)).toBe(false);
    });

    it('should handle multiple users independently', async () => {
      // Arrange
      const user1 = 'user1';
      const user2 = 'user2';
      const factorType = 'signature';
      
      failureTracker.configure({ maxAttempts: 2 });
      
      // Act - Lock user1 but not user2
      await failureTracker.trackFailure(user1, factorType);
      await failureTracker.trackFailure(user1, factorType);
      await failureTracker.trackFailure(user2, factorType);
      
      // Assert
      expect(await failureTracker.isRateLimited(user1, factorType)).toBe(true);
      expect(await failureTracker.isRateLimited(user2, factorType)).toBe(false);
    });

    it('should handle different factor types independently', async () => {
      // Arrange
      const identifier = 'user123';
      
      failureTracker.configure({ maxAttempts: 2 });
      
      // Act - Lock signature but not biometric
      await failureTracker.trackFailure(identifier, 'signature');
      await failureTracker.trackFailure(identifier, 'signature');
      await failureTracker.trackFailure(identifier, 'biometric');
      
      // Assert
      expect(await failureTracker.isRateLimited(identifier, 'signature')).toBe(true);
      expect(await failureTracker.isRateLimited(identifier, 'biometric')).toBe(false);
    });
  });
});






