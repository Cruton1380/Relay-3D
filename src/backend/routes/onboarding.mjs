/**
 * @fileoverview Onboarding API routes
 */
import { Router } from 'express';
import onboardingController from '../onboarding/onboardingController.mjs';
import { validateInviteCode } from '../invites/inviteStore.mjs';
import { biometricPasswordDanceService } from '../services/biometricPasswordDanceService.mjs';
import logger from '../utils/logging/logger.mjs';

const router = Router();

/**
 * Validate invite code endpoint
 */
router.post('/validate-invite', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const result = await onboardingController.validateInviteCode(inviteCode);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error validating invite code', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Complete standard onboarding endpoint
 */
router.post('/complete', async (req, res) => {
  try {
    const { inviteCode, biometricData, profile } = req.body;
    
    if (!inviteCode || !biometricData || !profile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required onboarding data'
      });
    }

    const result = await onboardingController.completeOnboarding(
      inviteCode,
      biometricData.hash,
      biometricData.deviceAttestation,
      profile.publicKey || 'temp-key'
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error completing onboarding', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Complete enhanced onboarding with behavioral baseline endpoint
 */
router.post('/complete-enhanced', async (req, res) => {
  try {
    const { inviteCode, biometricData, behavioralBaseline, profile } = req.body;
    
    if (!inviteCode || !biometricData || !profile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required onboarding data'
      });
    }

    // Import the enhanced onboarding service
    const { completeEnhancedOnboarding } = await import('../onboarding/onboardingService.mjs');
    
    const result = await completeEnhancedOnboarding(
      inviteCode,
      biometricData.hash,
      biometricData.deviceAttestation,
      profile.publicKey || 'temp-key',
      behavioralBaseline
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error completing enhanced onboarding', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Verify personhood endpoint
 */
router.post('/verify-personhood', async (req, res) => {
  try {
    const { personhoodData } = req.body;
    
    if (!personhoodData) {
      return res.status(400).json({
        success: false,
        message: 'Personhood data is required'
      });
    }

    const result = await onboardingController.validatePersonhood(personhoodData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying personhood', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Verify biometric uniqueness endpoint
 */
router.post('/verify-biometric', async (req, res) => {
  try {
    const { biometricHash } = req.body;
    
    if (!biometricHash) {
      return res.status(400).json({
        success: false,
        message: 'Biometric hash is required'
      });
    }

    const result = await onboardingController.verifyBiometricUniqueness(biometricHash);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verifying biometric uniqueness', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Complete enhanced onboarding with optional password dance
 */
router.post('/complete-enhanced', async (req, res) => {
  try {
    const { inviteCode, biometricData, profile, passwordDanceData } = req.body;
    
    if (!inviteCode || !biometricData || !profile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required onboarding data'
      });
    }

    // Complete standard onboarding first
    const onboardingResult = await onboardingController.completeOnboarding({
      inviteCode,
      biometricData,
      profile
    });

    let passwordDanceResult = null;

    // If password dance data provided, enroll it
    if (passwordDanceData && onboardingResult.success) {
      try {
        passwordDanceResult = await biometricPasswordDanceService.enrollPasswordDance(
          onboardingResult.userId,
          passwordDanceData
        );
        
        logger.info('Password dance enrolled during onboarding', {
          userId: onboardingResult.userId,
          enrollmentId: passwordDanceResult.enrollmentId
        });
      } catch (error) {
        logger.warn('Password dance enrollment failed during onboarding', {
          userId: onboardingResult.userId,
          error: error.message
        });
        // Don't fail the entire onboarding if password dance fails
        passwordDanceResult = { success: false, error: error.message };
      }
    }

    res.json({
      success: true,
      data: {
        ...onboardingResult,
        passwordDance: passwordDanceResult
      }
    });
  } catch (error) {
    logger.error('Error completing enhanced onboarding', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
