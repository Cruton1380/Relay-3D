/**
 * @fileoverview Controller for onboarding API endpoints
 */
import onboardingService from './onboardingService.mjs';
import { validateInviteCode as validateInviteCodeStore } from '../invites/inviteStore.mjs';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';

/**
 * Validate an invite code
 * @param {string} inviteCode - The invite code to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateInviteCode(inviteCode) {
  try {
    return await validateInviteCodeStore(inviteCode);
  } catch (error) {
    logger.error('Error in invite code validation controller', { error: error.message });
    throw createError('validation', 'Failed to validate invite code', { cause: error });
  }
}

/**
 * Complete the enhanced onboarding process
 * @param {string} inviteCode - The invite code
 * @param {string} biometricHash - The biometric hash
 * @param {Object} deviceAttestation - Device attestation data
 * @param {string} publicKey - User's public key
 * @param {Object} behavioralData - User's behavioral baseline data
 * @returns {Promise<Object>} Onboarding result
 */
export async function completeEnhancedOnboarding(inviteCode, biometricHash, deviceAttestation, publicKey, behavioralData) {
  try {
    return await onboardingService.completeEnhancedOnboarding(
      inviteCode, 
      biometricHash, 
      deviceAttestation, 
      publicKey,
      behavioralData
    );
  } catch (error) {
    logger.error('Error in enhanced onboarding completion controller', { error: error.message });
    throw createError('processing', 'Failed to complete enhanced onboarding', { cause: error });
  }
}

/**
 * Complete the onboarding process
 * @param {string} inviteCode - The invite code
 * @param {string} biometricHash - The biometric hash
 * @param {Object} deviceAttestation - Device attestation data
 * @param {string} publicKey - User's public key
 * @returns {Promise<Object>} Onboarding result
 */
export async function completeOnboarding(inviteCode, biometricHash, deviceAttestation, publicKey) {
  try {
    return await onboardingService.completeOnboarding(
      inviteCode, 
      biometricHash, 
      deviceAttestation, 
      publicKey
    );
  } catch (error) {
    logger.error('Error in onboarding completion controller', { error: error.message });
    throw createError('processing', 'Failed to complete onboarding', { cause: error });
  }
}

/**
 * Validate personhood
 * @param {Object} personhoodData - Personhood verification data
 * @returns {Promise<Object>} Validation result
 */
export async function validatePersonhood(personhoodData) {
  try {
    return await onboardingService.validatePersonhood(personhoodData);
  } catch (error) {
    logger.error('Error in personhood validation controller', { error: error.message });
    throw createError('validation', 'Failed to validate personhood', { cause: error });
  }
}

/**
 * Verify biometric uniqueness
 * @param {string} biometricHash - Biometric hash to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBiometricUniqueness(biometricHash) {
  try {
    return await onboardingService.verifyBiometricUniqueness(biometricHash);
  } catch (error) {
    logger.error('Error in biometric uniqueness controller', { error: error.message });
    throw createError('validation', 'Failed to verify biometric uniqueness', { cause: error });
  }
}

export default {
  validateInviteCode,
  completeOnboarding,
  completeEnhancedOnboarding,
  validatePersonhood,
  verifyBiometricUniqueness
};
