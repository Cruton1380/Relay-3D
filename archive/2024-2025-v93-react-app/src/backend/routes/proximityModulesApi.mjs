/**
 * @fileoverview Proximity Channel API Routes
 * Handles proximity channel ownership, onboarding, and invitee initialization
 */

import express from 'express';
import { asyncHandler } from '../utils/middleware/asyncHandler.mjs';
import { authorize } from '../auth/middleware/index.mjs';
import { AUTH_LEVELS } from '../auth/policies/authPolicy.mjs';
import proximityOwnershipManager from '../channel-service/proximityOwnershipManager.mjs';
import proximityOnboardingService from '../onboarding/proximityOnboardingService.mjs';
import inviteeInitializationService from '../onboarding/inviteeInitializationService.mjs';

const router = express.Router();

// Initialize required services
(async () => {
  await proximityOwnershipManager.initialize();
  await proximityOnboardingService.initialize();
  await inviteeInitializationService.initialize();
})();

/**
 * MODULE 0: Proximity Channel Ownership Reset API endpoints
 */

// Initiate a channel ownership reset
router.post('/ownership/reset', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { channelId, signalData } = req.body;
    
    if (!channelId || !signalData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const result = await proximityOwnershipManager.initiateResetClaim(userId, channelId, signalData);
    return res.json(result);
  })
);

// Check ownership reset status
router.get('/ownership/status/:channelId', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { channelId } = req.params;
    
    const isOwner = proximityOwnershipManager.isVerifiedOwner(channelId, userId);
    
    return res.json({
      channelId,
      isVerifiedOwner: isOwner,
      userId
    });
  })
);

// Get a user's owned channels
router.get('/ownership/user-channels', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const ownedChannels = proximityOwnershipManager.getUserOwnedChannels(userId);
    
    return res.json({
      userId,
      ownedChannels
    });
  })
);

/**
 * MODULE 1: Proximity Onboarding API endpoints
 */

// Initiate an onboarding session (founder only)
router.post('/onboarding/initiate', 
  authorize(AUTH_LEVELS.FOUNDER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { inviteTokenCount, parameters } = req.body;
    
    const result = await proximityOnboardingService.initiateOnboarding(
      userId,
      inviteTokenCount || 1,
      parameters || {}
    );
    
    return res.json(result);
  })
);

// Register invitee device for discovery
router.post('/onboarding/:sessionId/register-device', 
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { deviceData } = req.body;
    
    if (!deviceData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing device data' 
      });
    }
    
    const result = await proximityOnboardingService.registerInviteeDevice(sessionId, deviceData);
    return res.json(result);
  })
);

// Discover invitee by proximity (founder only)
router.post('/onboarding/discover-invitee', 
  authorize(AUTH_LEVELS.FOUNDER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { discoveredDevice } = req.body;
    
    if (!discoveredDevice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing discovered device data' 
      });
    }
    
    const result = await proximityOnboardingService.discoverInvitee(userId, discoveredDevice);
    return res.json(result);
  })
);

// Transfer system bundle to invitee
router.post('/onboarding/:sessionId/transfer-bundle', 
  authorize(AUTH_LEVELS.FOUNDER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { bundleData } = req.body;
    
    if (!bundleData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing bundle data' 
      });
    }
    
    const result = await proximityOnboardingService.transferSystemBundle(sessionId, bundleData);
    return res.json(result);
  })
);

// Generate invite tokens for the new user
router.post('/onboarding/:sessionId/generate-tokens', 
  authorize(AUTH_LEVELS.FOUNDER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { inviteeId } = req.body;
    
    if (!inviteeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing invitee ID' 
      });
    }
    
    const result = await proximityOnboardingService.generateInviteTokens(sessionId, inviteeId);
    return res.json(result);
  })
);

// Complete the onboarding process
router.post('/onboarding/:sessionId/complete', 
  authorize(AUTH_LEVELS.FOUNDER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const result = await proximityOnboardingService.completeOnboarding(sessionId);
    return res.json(result);
  })
);

// Get onboarding session status
router.get('/onboarding/:sessionId/status', 
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const status = proximityOnboardingService.getSessionStatus(sessionId);
    return res.json(status);
  })
);

/**
 * MODULE 2: Invitee Initialization API endpoints
 */

// Start invitee initialization
router.post('/initialization/start', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { onboardingSessionId, inviteToken } = req.body;
    
    if (!onboardingSessionId || !inviteToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const result = await inviteeInitializationService.startInitializationSession(
      userId,
      onboardingSessionId,
      inviteToken
    );
    
    return res.json(result);
  })
);

// Process biometric setup
router.post('/initialization/:sessionId/biometric-setup', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { biometricHash } = req.body;
    
    if (!biometricHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing biometric data' 
      });
    }
    
    const result = await inviteeInitializationService.processBiometricSetup(sessionId, biometricHash);
    return res.json(result);
  })
);

// Load global parameters
router.post('/initialization/:sessionId/load-parameters', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { parameters } = req.body;
    
    if (!parameters) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing parameters data' 
      });
    }
    
    const result = await inviteeInitializationService.loadGlobalParameters(sessionId, parameters);
    return res.json(result);
  })
);

// Verify invite token
router.post('/initialization/:sessionId/verify-token', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing invite code' 
      });
    }
    
    const result = await inviteeInitializationService.verifyInviteToken(sessionId, inviteCode);
    return res.json(result);
  })
);

// Initialize device state
router.post('/initialization/:sessionId/device-state', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { deviceState } = req.body;
    
    if (!deviceState) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing device state data' 
      });
    }
    
    const result = await inviteeInitializationService.initializeDeviceState(sessionId, deviceState);
    return res.json(result);
  })
);

// Complete initialization
router.post('/initialization/:sessionId/complete', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const result = await inviteeInitializationService.completeInitialization(sessionId);
    return res.json(result);
  })
);

// Get initialization session status
router.get('/initialization/:sessionId/status', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const status = inviteeInitializationService.getSessionStatus(sessionId);
    return res.json(status);
  })
);

// Get user initialization status
router.get('/initialization/user-status', 
  authorize(AUTH_LEVELS.USER),
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    
    const status = inviteeInitializationService.getUserInitializationStatus(userId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'No active initialization session for this user'
      });
    }
    
    return res.json(status);
  })
);

export default router;
