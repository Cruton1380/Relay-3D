/**
 * Enhanced Proximity Modules API Routes
 * Includes all proximity enhancements and token decay system
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// Enhanced validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Enhanced error handling middleware
const handleAsyncError = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all proximity services from service registry
const getProximityServices = (req) => {
    const { serviceRegistry } = req.app.locals;
    return {
        encounterManager: serviceRegistry.get('proximityEncounterManager'),
        ownershipManager: serviceRegistry.get('proximityOwnershipManager'),
        onboardingService: serviceRegistry.get('proximityOnboardingService'),
        inviteeService: serviceRegistry.get('inviteeInitializationService'),
        multiFactorService: serviceRegistry.get('multiFactorProximityService'),
        delayedVerification: serviceRegistry.get('delayedVerificationService'),
        groupOnboarding: serviceRegistry.get('groupOnboardingService'),
        mobileOptimization: serviceRegistry.get('mobileOptimizationService')
    };
};

// ================== MULTI-FACTOR PROXIMITY ROUTES ==================

/**
 * @route GET /api/proximity/multi-factor/status
 * @desc Get current multi-factor proximity status
 */
router.get('/multi-factor/status', handleAsyncError(async (req, res) => {
    const { multiFactorService } = getProximityServices(req);
    
    if (!multiFactorService) {
        return res.status(503).json({
            success: false,
            message: 'Multi-factor proximity service not available'
        });
    }

    const status = multiFactorService.getProximityStatus();
    
    res.json({
        success: true,
        data: status,
        timestamp: Date.now()
    });
}));

/**
 * @route POST /api/proximity/multi-factor/configure
 * @desc Configure multi-factor proximity settings
 */
router.post('/multi-factor/configure', [
    body('requiredFactors').optional().isInt({ min: 1, max: 4 }),
    body('confidenceThreshold').optional().isFloat({ min: 0, max: 1 }),
    body('signalTimeout').optional().isInt({ min: 1000 }),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { multiFactorService } = getProximityServices(req);
    
    if (!multiFactorService) {
        return res.status(503).json({
            success: false,
            message: 'Multi-factor proximity service not available'
        });
    }

    const { requiredFactors, confidenceThreshold, signalTimeout } = req.body;
    
    // Update configuration
    multiFactorService.config = {
        ...multiFactorService.config,
        requiredFactors: requiredFactors || multiFactorService.config.requiredFactors,
        confidenceThreshold: confidenceThreshold || multiFactorService.config.confidenceThreshold,
        signalTimeout: signalTimeout || multiFactorService.config.signalTimeout
    };

    res.json({
        success: true,
        message: 'Multi-factor proximity configuration updated',
        config: multiFactorService.config
    });
}));

// ================== DELAYED VERIFICATION ROUTES ==================

/**
 * @route POST /api/proximity/delayed-verification/start
 * @desc Start a delayed verification session
 */
router.post('/delayed-verification/start', [
    body('initialProximityData').isObject(),
    body('minimumDuration').optional().isInt({ min: 10000 }),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { delayedVerification } = getProximityServices(req);
    
    if (!delayedVerification) {
        return res.status(503).json({
            success: false,
            message: 'Delayed verification service not available'
        });
    }

    const { initialProximityData, minimumDuration } = req.body;
    
    // Generate session ID
    const sessionId = `dv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update config if provided
    if (minimumDuration) {
        delayedVerification.config.minimumDuration = minimumDuration;
    }
    
    const session = delayedVerification.startVerification(sessionId, initialProximityData);

    res.json({
        success: true,
        message: 'Delayed verification session started',
        data: {
            sessionId,
            requiredDuration: session.requiredDuration,
            estimatedCompletion: Date.now() + session.requiredDuration
        }
    });
}));

/**
 * @route POST /api/proximity/delayed-verification/:sessionId/update
 * @desc Update proximity data for a delayed verification session
 */
router.post('/delayed-verification/:sessionId/update', [
    param('sessionId').isString(),
    body('proximityData').isObject(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { delayedVerification } = getProximityServices(req);
    const { sessionId } = req.params;
    const { proximityData } = req.body;
    
    if (!delayedVerification) {
        return res.status(503).json({
            success: false,
            message: 'Delayed verification service not available'
        });
    }

    const success = delayedVerification.recordProximityReading(sessionId, proximityData);
    
    if (!success) {
        return res.status(404).json({
            success: false,
            message: 'Verification session not found or invalid'
        });
    }

    const status = delayedVerification.getVerificationStatus(sessionId);

    res.json({
        success: true,
        message: 'Proximity data recorded',
        data: status
    });
}));

/**
 * @route GET /api/proximity/delayed-verification/:sessionId/status
 * @desc Get delayed verification session status
 */
router.get('/delayed-verification/:sessionId/status', [
    param('sessionId').isString(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { delayedVerification } = getProximityServices(req);
    const { sessionId } = req.params;
    
    if (!delayedVerification) {
        return res.status(503).json({
            success: false,
            message: 'Delayed verification service not available'
        });
    }

    const status = delayedVerification.getVerificationStatus(sessionId);
    
    if (!status) {
        return res.status(404).json({
            success: false,
            message: 'Verification session not found'
        });
    }

    res.json({
        success: true,
        data: status
    });
}));

// ================== GROUP ONBOARDING ROUTES ==================

/**
 * @route POST /api/proximity/group-onboarding/create-session
 * @desc Create a new group onboarding session
 */
router.post('/group-onboarding/create-session', [
    body('organizerId').isString(),
    body('sessionConfig').optional().isObject(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { groupOnboarding } = getProximityServices(req);
    const { organizerId, sessionConfig } = req.body;
    
    if (!groupOnboarding) {
        return res.status(503).json({
            success: false,
            message: 'Group onboarding service not available'
        });
    }

    const session = await groupOnboarding.createGroupSession(organizerId, sessionConfig);

    res.json({
        success: true,
        message: 'Group onboarding session created',
        data: {
            sessionId: session.id,
            organizerId: session.organizerId,
            config: session.config,
            expiresAt: session.expiresAt
        }
    });
}));

/**
 * @route POST /api/proximity/group-onboarding/:sessionId/add-participants
 * @desc Add participants to a group onboarding session
 */
router.post('/group-onboarding/:sessionId/add-participants', [
    param('sessionId').isString(),
    body('participants').isArray(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { groupOnboarding } = getProximityServices(req);
    const { sessionId } = req.params;
    const { participants } = req.body;
    
    if (!groupOnboarding) {
        return res.status(503).json({
            success: false,
            message: 'Group onboarding service not available'
        });
    }

    const results = await groupOnboarding.addParticipantsToGroup(sessionId, participants);

    res.json({
        success: true,
        message: 'Participants added to group session',
        data: results
    });
}));

/**
 * @route POST /api/proximity/group-onboarding/:sessionId/start
 * @desc Start a group onboarding session
 */
router.post('/group-onboarding/:sessionId/start', [
    param('sessionId').isString(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { groupOnboarding } = getProximityServices(req);
    const { sessionId } = req.params;
    
    if (!groupOnboarding) {
        return res.status(503).json({
            success: false,
            message: 'Group onboarding service not available'
        });
    }

    const session = await groupOnboarding.startGroupSession(sessionId);

    res.json({
        success: true,
        message: 'Group onboarding session started',
        data: {
            sessionId: session.id,
            participantCount: session.participants.size,
            status: session.status
        }
    });
}));

/**
 * @route POST /api/proximity/group-onboarding/:sessionId/onboard/:participantId
 * @desc Onboard a specific participant in a group session
 */
router.post('/group-onboarding/:sessionId/onboard/:participantId', [
    param('sessionId').isString(),
    param('participantId').isString(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { groupOnboarding } = getProximityServices(req);
    const { sessionId, participantId } = req.params;
    
    if (!groupOnboarding) {
        return res.status(503).json({
            success: false,
            message: 'Group onboarding service not available'
        });
    }

    const result = await groupOnboarding.onboardParticipant(sessionId, participantId);

    res.json({
        success: true,
        message: 'Participant onboarded successfully',
        data: result
    });
}));

// ================== MOBILE OPTIMIZATION ROUTES ==================

/**
 * @route GET /api/proximity/mobile/status
 * @desc Get mobile optimization status
 */
router.get('/mobile/status', handleAsyncError(async (req, res) => {
    const { mobileOptimization } = getProximityServices(req);
    
    if (!mobileOptimization) {
        return res.status(503).json({
            success: false,
            message: 'Mobile optimization service not available'
        });
    }

    const status = mobileOptimization.getOptimizationStatus();

    res.json({
        success: true,
        data: status
    });
}));

/**
 * @route POST /api/proximity/mobile/scan
 * @desc Request an optimized proximity scan
 */
router.post('/mobile/scan', [
    body('scanType').isIn(['wifi', 'bluetooth', 'gps', 'ultrasonic']),
    body('priority').optional().isIn(['low', 'normal', 'high']),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { mobileOptimization } = getProximityServices(req);
    const { scanType, priority = 'normal' } = req.body;
    
    if (!mobileOptimization) {
        return res.status(503).json({
            success: false,
            message: 'Mobile optimization service not available'
        });
    }

    try {
        const result = await mobileOptimization.addScanRequest(scanType, priority);
        
        res.json({
            success: true,
            message: 'Scan completed',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}));

/**
 * @route POST /api/proximity/mobile/configure
 * @desc Update mobile optimization configuration
 */
router.post('/mobile/configure', [
    body('batteryThresholds').optional().isObject(),
    body('scanIntervals').optional().isObject(),
    body('networkAdaptation').optional().isObject(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { mobileOptimization } = getProximityServices(req);
    const configUpdate = req.body;
    
    if (!mobileOptimization) {
        return res.status(503).json({
            success: false,
            message: 'Mobile optimization service not available'
        });
    }

    mobileOptimization.updateConfig(configUpdate);

    res.json({
        success: true,
        message: 'Mobile optimization configuration updated',
        data: mobileOptimization.getOptimizationStatus()
    });
}));

// ================== ENHANCED ONBOARDING WITH TOKEN DECAY ==================

/**
 * @route POST /api/proximity/onboarding/initiate-with-decay
 * @desc Initiate onboarding with automatic token decay
 */
router.post('/onboarding/initiate-with-decay', [
    body('founderId').isString(),
    body('overrideTokens').optional().isInt({ min: 1 }),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { onboardingService } = getProximityServices(req);
    const { founderId, overrideTokens } = req.body;
    
    if (!onboardingService) {
        return res.status(503).json({
            success: false,
            message: 'Onboarding service not available'
        });
    }

    const session = await onboardingService.initiateOnboarding(founderId, overrideTokens);

    res.json({
        success: true,
        message: 'Onboarding initiated with token decay',
        data: {
            sessionId: session.sessionId,
            onboardingCode: session.onboardingCode,
            founderCurrentTokens: session.founderCurrentTokens,
            newUserTokens: session.inviteTokenCount,
            tokenDecayApplied: session.tokenDecayApplied,
            expiresAt: session.expiresAt
        }
    });
}));

/**
 * @route GET /api/proximity/onboarding/token-info/:userId
 * @desc Get token information for a user
 */
router.get('/onboarding/token-info/:userId', [
    param('userId').isString(),
    validateRequest
], handleAsyncError(async (req, res) => {
    const { onboardingService } = getProximityServices(req);
    const { userId } = req.params;
    
    if (!onboardingService) {
        return res.status(503).json({
            success: false,
            message: 'Onboarding service not available'
        });
    }

    try {
        const tokenCount = await onboardingService.getFounderTokenCount(userId);
        const userData = await onboardingService.getUserData(userId);

        res.json({
            success: true,
            data: {
                userId,
                currentTokens: tokenCount,
                userData
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'User not found or token info unavailable'
        });
    }
}));

// ================== COMPREHENSIVE STATUS ROUTE ==================

/**
 * @route GET /api/proximity/comprehensive-status
 * @desc Get status of all proximity services
 */
router.get('/comprehensive-status', handleAsyncError(async (req, res) => {
    const services = getProximityServices(req);
    
    const status = {
        timestamp: Date.now(),
        services: {}
    };

    // Check each service availability and status
    for (const [name, service] of Object.entries(services)) {
        if (service) {
            try {
                switch (name) {
                    case 'multiFactorService':
                        status.services[name] = {
                            available: true,
                            status: service.getProximityStatus()
                        };
                        break;
                    case 'delayedVerification':
                        status.services[name] = {
                            available: true,
                            activeSessions: service.getAllVerificationSessions()
                        };
                        break;
                    case 'groupOnboarding':
                        status.services[name] = {
                            available: true,
                            activeSessions: service.getAllGroupSessions()
                        };
                        break;
                    case 'mobileOptimization':
                        status.services[name] = {
                            available: true,
                            status: service.getOptimizationStatus()
                        };
                        break;
                    default:
                        status.services[name] = {
                            available: true,
                            message: 'Service operational'
                        };
                }
            } catch (error) {
                status.services[name] = {
                    available: false,
                    error: error.message
                };
            }
        } else {
            status.services[name] = {
                available: false,
                message: 'Service not registered'
            };
        }
    }

    res.json({
        success: true,
        data: status
    });
}));

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Proximity API Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

export default router;
