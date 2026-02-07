/**
 * @fileoverview Consolidated onboarding service that handles all onboarding business logic
 */
import { findSimilarBiometricHash, assessBiometricQuality } from '../biometrics/biometricVerifier.mjs';
import { getInvite, isValidInviteFormat, burnInviteCode, validateInviteCode } from '../invites/inviteStore.mjs';
import { createUser, updateUserBiometricStatus } from '../users/userManager.mjs';
import { eventBus } from '../eventBus-service/index.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
// import { adaptiveBiometricManager } from '../biometrics/biometricVerifier.mjs';
import { createBehavioralBaseline } from '../services/behavioralBaselineService.mjs'; // NEW: Import behavioral baseline service

// Create dedicated logger for onboarding
const onboardingLogger = logger.child({ module: 'onboarding' });

/**
 * Complete the enhanced onboarding process with behavioral baseline collection
 * @param {string} inviteCode - The invite code
 * @param {string} biometricHash - The biometric hash
 * @param {Object} deviceAttestation - Device attestation data
 * @param {string} publicKey - User's public key
 * @param {Object} behavioralData - Baseline behavioral data from Password Dance collection
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>} Onboarding result
 */
export async function completeEnhancedOnboarding(inviteCode, biometricHash, deviceAttestation, publicKey, behavioralData) {
  try {
    // 1. Validate invite code
    const inviteValidation = await validateInviteCode(inviteCode);
    if (!inviteValidation.valid) {
      onboardingLogger.warn('Invalid invite code during onboarding', {
        inviteCode,
        reason: inviteValidation.reason
      });
      return { success: false, error: inviteValidation.reason };
    }

    // 2. Check biometric uniqueness
    const biometricCheckResult = await verifyBiometricUniqueness(biometricHash);
    if (!biometricCheckResult.unique) {
      onboardingLogger.warn('Biometric hash matched existing user', { biometricHash });
      return { success: false, error: 'Biometric data matches an existing user' };
    }

    // 3. Verify device attestation
    const attestationResult = await validateDeviceAttestation(deviceAttestation);
    if (!attestationResult.valid) {
      onboardingLogger.warn('Device attestation failed', { 
        reason: attestationResult.reason,
        deviceId: deviceAttestation.deviceId
      });
      return { success: false, error: attestationResult.reason };
    }

    // 4. Create new user
    const userId = await createUser({
      publicKey,
      biometricHash,
      deviceAttestations: [deviceAttestation],
      inviteCode
    });

    // 5. NEW: Create behavioral baseline if data provided
    if (behavioralData) {
      try {
        const baselineResult = await createBehavioralBaseline(userId, behavioralData);
        onboardingLogger.info('Behavioral baseline created during onboarding', { 
          userId, 
          strengthScore: baselineResult.strengthScore 
        });
      } catch (error) {
        onboardingLogger.warn('Failed to create behavioral baseline during onboarding', { 
          userId, 
          error: error.message 
        });
        // Continue onboarding even if baseline creation fails
      }
    }

    // 6. Mark invite as used
    await burnInviteCode(inviteCode);

    // 7. Emit onboarding complete event
    eventBus.emit('user:onboarded', { userId, inviteCode });
    
    onboardingLogger.info('Enhanced user onboarding completed successfully', { userId });
    return { success: true, userId };
  } catch (error) {
    onboardingLogger.error('Error during enhanced onboarding completion', { error: error.message });
    return { success: false, error: 'Onboarding failed: ' + error.message };
  }
}

/**
 * Complete the onboarding process (legacy method - maintained for backward compatibility)
 * @param {string} inviteCode - The invite code
 * @param {string} biometricHash - The biometric hash
 * @param {Object} deviceAttestation - Device attestation data
 * @param {string} publicKey - User's public key
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>} Onboarding result
 */
export async function completeOnboarding(inviteCode, biometricHash, deviceAttestation, publicKey) {
  // Call enhanced onboarding without behavioral data for backward compatibility
  return completeEnhancedOnboarding(inviteCode, biometricHash, deviceAttestation, publicKey, null);
}

/**
 * Verify biometric uniqueness
 * @param {string} biometricHash - Biometric hash to verify
 * @returns {Promise<{unique: boolean, reason?: string}>} Verification result
 */
export async function verifyBiometricUniqueness(biometricHash) {
  try {
    // Check biometric quality first
    const qualityResult = await assessBiometricQuality(biometricHash);
    if (!qualityResult.acceptable) {
      return { unique: false, reason: 'Low quality biometric data' };
    }
    
    // Check for duplicate biometrics
    const similarHash = await findSimilarBiometricHash(biometricHash);
    if (similarHash) {
      return { unique: false, reason: 'Biometric data matches an existing user' };
    }
    
    return { unique: true };
  } catch (error) {
    onboardingLogger.error('Error during biometric uniqueness check', { error: error.message });
    throw new Error('Failed to verify biometric uniqueness');
  }
}

/**
 * Validate device attestation data
 * @param {Object} deviceAttestation - The device attestation data to validate
 * @returns {Promise<{valid: boolean, reason?: string, confidence?: number}>} Validation result
 */
export async function validateDeviceAttestation(deviceAttestation) {
  try {
    // Required device capabilities
    const requiredCapabilities = ['webgl', 'webCrypto'];
    
    // Check for missing attestation data
    if (!deviceAttestation || !deviceAttestation.deviceId) {
      return { valid: false, reason: 'Missing device attestation data', confidence: 0 };
    }

    // Check required capabilities
    for (const capability of requiredCapabilities) {
      if (!deviceAttestation[capability]) {
        return { 
          valid: false, 
          reason: `Missing capability: ${capability}`,
          confidence: 0 
        };
      }
    }
    
    // Verify browser security features
    if (!deviceAttestation.secureContext) {
      return { valid: false, reason: 'No secure context', confidence: 0.3 };
    }
    
    // Calculate confidence based on device security features
    let confidenceScore = 0.7; // Base score
    
    if (deviceAttestation.biometricAuth) confidenceScore += 0.1;
    if (deviceAttestation.hardwareAcceleration) confidenceScore += 0.1;
    if (deviceAttestation.webAuthn) confidenceScore += 0.1;
    
    return { 
      valid: true, 
      confidence: Math.min(confidenceScore, 1.0) 
    };
  } catch (error) {
    onboardingLogger.error('Error validating device attestation', { error: error.message });
    return { valid: false, reason: 'Attestation validation error' };
  }
}

/**
 * Validate personhood through gesture challenges
 * @param {Object} personhoodData - Personhood verification data
 * @returns {Promise<{valid: boolean, confidence: number, reason?: string, verificationId?: string}>} Validation result
 */
export async function validatePersonhood(personhoodData) {
  try {
    const { biometricHash, gestureSequence, deviceData } = personhoodData;
    
    if (!biometricHash || !gestureSequence || !deviceData) {
      throw createError('validation', 'Missing required personhood verification data', { code: 'INVALID_PERSONHOOD_DATA' });
    }
    
    // Verify biometric data
    const biometricResult = await verifyBiometricData(biometricHash);
    if (!biometricResult.valid) {
      return {
        valid: false,
        confidence: biometricResult.confidence,
        reason: biometricResult.reason
      };
    }
    
    // Verify gesture sequence
    const gestureResult = await verifyGestureSequence(gestureSequence);
    if (!gestureResult.valid) {
      return {
        valid: false,
        confidence: gestureResult.confidence,
        reason: gestureResult.reason
      };
    }
    
    // Verify device parameters
    const deviceResult = verifyDeviceParameters(deviceData);
    if (!deviceResult.valid) {
      return {
        valid: false,
        confidence: deviceResult.confidence,
        reason: deviceResult.reason
      };
    }
    
    // Calculate overall confidence score
    const confidenceScore = calculateConfidenceScore(
      biometricResult.confidence,
      gestureResult.confidence,
      deviceResult.confidence
    );
    
    return {
      valid: true,
      confidence: confidenceScore,
      verificationId: crypto.randomUUID()
    };
  } catch (error) {
    onboardingLogger.error('Error during personhood validation', { error: error.message });
    return { 
      valid: false, 
      confidence: 0,
      reason: `Personhood verification failed: ${error.message}`
    };
  }
}

/**
 * Process biometric verification for a user
 * @param {string} userId - The ID of the user
 * @param {Object} biometricData - The biometric data for verification
 * @returns {Promise<{success: boolean, quality?: number, error?: string, message?: string}>} Verification result
 */
export async function processBiometricVerification(userId, biometricData) {
  try {
    onboardingLogger.info(`Processing biometric verification for user ${userId}`);
    
    // Extract features from biometric data
    const { extractBiometricFeatures } = await import('../biometrics/featureExtractor.mjs');
    const biometricFeatures = await extractBiometricFeatures(biometricData.imagePath);
    
    // Check for duplicate biometrics
    const similarHash = await findSimilarBiometricHash(biometricFeatures);
    
    if (similarHash) {
      onboardingLogger.warn(`Duplicate biometric detected for user ${userId}`);
      return {
        success: false,
        error: 'duplicate_biometric',
        message: 'This biometric matches an existing user. Please contact support.'
      };
    }
    
    // Store biometric using adaptive biometric manager
    // Mark as enrollment source
    biometricFeatures.source = 'enrollment';
    // TODO: Re-enable when adaptiveBiometricManager is implemented
    // await adaptiveBiometricManager.updateBiometricTemplates(userId, biometricFeatures, 1.0);
    
    // Update user profile to mark biometric as verified
    await updateUserBiometricStatus(userId, true);
    
    onboardingLogger.info(`Biometric verification successful for user ${userId}`);
    
    return {
      success: true,
      quality: biometricFeatures.quality
    };
  } catch (error) {
    onboardingLogger.error(`Biometric verification failed for user ${userId}`, { error: error.message });
    return {
      success: false,
      error: 'verification_failed',
      message: error.message
    };
  }
}

// Helper functions for personhood verification
async function verifyBiometricData(biometricHash) {
  try {
    // Validate hash format
    if (!biometricHash || typeof biometricHash !== 'string' || biometricHash.length < 32) {
      return { valid: false, reason: 'INVALID_HASH_FORMAT', confidence: 0 };
    }
    
    // Check for duplicate biometrics
    const duplicateCheck = await findSimilarBiometricHash(biometricHash);
    if (duplicateCheck) {
      return { valid: false, reason: 'DUPLICATE_BIOMETRIC', confidence: 0 };
    }
    
    // Validate biometric quality
    const qualityResult = await assessBiometricQuality(biometricHash);
    if (!qualityResult.acceptable) {
      return { valid: false, reason: 'LOW_QUALITY_BIOMETRIC', confidence: qualityResult.score };
    }
    
    return { valid: true, confidence: qualityResult.score };
  } catch (error) {
    onboardingLogger.error('Error in biometric verification', { error: error.message });
    return { valid: false, reason: 'VERIFICATION_ERROR', confidence: 0 };
  }
}

async function verifyGestureSequence(gestureSequence) {
  try {
    // Validate sequence structure
    if (!Array.isArray(gestureSequence) || gestureSequence.length < 3) {
      return { valid: false, reason: 'INVALID_SEQUENCE', confidence: 0 };
    }
    
    // Check sequence complexity and randomness
    const complexityScore = calculateSequenceComplexity(gestureSequence);
    if (complexityScore < 0.5) {
      return { valid: false, reason: 'LOW_COMPLEXITY_SEQUENCE', confidence: complexityScore };
    }
    
    // Validate timing between gestures
    const timingScore = validateGestureTiming(gestureSequence);
    if (timingScore < 0.6) {
      return { valid: false, reason: 'IRREGULAR_TIMING', confidence: timingScore };
    }
    
    // Calculate overall gesture confidence
    const overallConfidence = (complexityScore + timingScore) / 2;
    
    return { valid: true, confidence: overallConfidence };
  } catch (error) {
    onboardingLogger.error('Error in gesture verification', { error: error.message });
    return { valid: false, reason: 'VERIFICATION_ERROR', confidence: 0 };
  }
}

function verifyDeviceParameters(deviceData) {
  // Required device capabilities
  const requiredCapabilities = ['camera', 'webgl', 'webCrypto'];
  
  // Check required capabilities
  for (const capability of requiredCapabilities) {
    if (!deviceData[capability]) {
      return { 
        valid: false, 
        reason: `MISSING_CAPABILITY_${capability.toUpperCase()}`,
        confidence: 0 
      };
    }
  }
  
  // Verify browser security features
  if (!deviceData.secureContext) {
    return { valid: false, reason: 'NO_SECURE_CONTEXT', confidence: 0.3 };
  }
  
  // Calculate confidence based on device security features
  let confidenceScore = 0.7; // Base score
  
  if (deviceData.biometricAuth) confidenceScore += 0.1;
  if (deviceData.hardwareAcceleration) confidenceScore += 0.1;
  if (deviceData.webAuthn) confidenceScore += 0.1;
  
  return { valid: true, confidence: Math.min(confidenceScore, 1.0) };
}

// Placeholder function until properly implemented
function calculateSequenceComplexity(gestureSequence) {
  // This would be a more sophisticated algorithm in production
  return 0.8; // Default good score for test implementation
}

// Placeholder function until properly implemented
function validateGestureTiming(gestureSequence) {
  // This would be a more sophisticated algorithm in production
  return 0.8; // Default good score for test implementation
}

function calculateConfidenceScore(biometricConfidence, gestureConfidence, deviceConfidence) {
  // Weight the different factors
  const weights = {
    biometric: 0.5,
    gesture: 0.3,
    device: 0.2
  };
  
  return (
    biometricConfidence * weights.biometric +
    gestureConfidence * weights.gesture +
    deviceConfidence * weights.device
  );
}

export default {
  completeOnboarding,
  verifyBiometricUniqueness,
  validatePersonhood,
  validateDeviceAttestation,
  processBiometricVerification
};
