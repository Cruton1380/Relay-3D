/**
 * @fileoverview Verification API routes for adaptive reverification
 * NOW WITH PRODUCTION SECURITY MIDDLEWARE AND REAL BIOMETRIC PROCESSING
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { verificationService } from '../services/verificationService.mjs';
import { trustLevelService } from '../services/trustLevelService.mjs';
import { proximityHotspotVerifier } from '../services/proximityHotspotVerifier.mjs';
import { scheduledReverificationManager } from '../services/scheduledReverificationManager.mjs';
import { adaptiveReverificationTrigger } from '../services/adaptiveReverificationTrigger.mjs';
import { biometricPasswordDanceService } from '../services/biometricPasswordDanceService.mjs';
import SecurityMiddleware from '../middleware/securityMiddleware.mjs';
import DatabaseSecurityService from '../services/databaseSecurityService.mjs';
import logger from '../utils/logging/logger.mjs';

const router = Router();

// Initialize security services
const db = new DatabaseSecurityService();
const security = new SecurityMiddleware(db);

// Apply security middleware to all routes
router.use(security.securityHeaders());
router.use(security.auditLogger());
router.use(security.rateLimit('general'));

/**
 * Initialize verification session
 */
router.post('/initialize', 
  security.authenticateToken(),
  security.validateInput([
    body('riskLevel').isIn(['low', 'medium', 'high']),
    body('context').optional().isObject()
  ]),
  async (req, res) => {
    try {
      const { riskLevel, context } = req.body;
      const { userId } = req.user;
      
      const result = await verificationService.initializeVerification(
        userId,
        riskLevel,
        context || {}
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error initializing verification', { error: error.message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Submit challenge response
 */
router.post('/submit-challenge',
  security.authenticateToken(),
  security.antiReplay(),
  async (req, res) => {
    try {
      const { sessionId, challengeType, result } = req.body;
    
    if (!sessionId || !challengeType || !result) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, challenge type, and result are required'
      });
    }

    const response = await verificationService.submitChallenge(
      sessionId,
      challengeType,
      result
    );
    
    res.json(response);
  } catch (error) {
    logger.error('Error submitting challenge', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get current risk assessment for a user
 */
router.post('/assess-risk', async (req, res) => {
  try {
    const { userId, sessionData, deviceContext } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const riskAssessment = await riskAssessmentEngine.assessRisk(
      userId,
      sessionData || {},
      deviceContext || {}
    );
    
    res.json({
      success: true,
      data: riskAssessment
    });
  } catch (error) {
    logger.error('Error assessing risk', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get verification session status
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = verificationService.getSessionInfo(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Verification session not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        riskLevel: session.riskLevel,
        progress: {
          completed: session.completedChallenges.length,
          total: session.challenges.length
        },
        isComplete: session.isComplete,
        startTime: session.startTime
      }
    });
  } catch (error) {
    logger.error('Error getting session status', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Cancel verification session
 */
router.post('/cancel/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = verificationService.getSessionInfo(sessionId);
    
    if (session) {
      verificationService.activeVerifications.delete(sessionId);
      logger.info('Verification session cancelled', { sessionId });
    }

    res.json({
      success: true,
      message: 'Verification session cancelled'
    });
  } catch (error) {
    logger.error('Error cancelling verification session', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get verification statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In a real implementation, this would query verification history from database
    // For now, return mock statistics
    const stats = {
      totalVerifications: 45,
      successRate: 98.5,
      averageCompletionTime: 32000, // milliseconds
      mostUsedChallenges: ['password', 'biometric', 'device'],
      riskLevelDistribution: {
        light: 60,
        medium: 30,
        strong: 10
      },
      lastVerification: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting verification stats', { error: error.message });    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Enroll biometric password dance - PRODUCTION SECURED
 */
router.post('/password-dance/enroll',
  security.authenticateToken(),
  security.rateLimit('password-dance'),
  security.requireTrustLevel('trusted'),
  security.validatePasswordDanceEnrollment(),
  security.sanitizeBiometricData(),
  security.antiReplay(),
  async (req, res) => {
    try {
      const { phrase, gestureType, audioData, gestureData } = req.body;
      const { userId } = req.user;
      
      // Log enrollment attempt
      await db.logSecurityEvent(
        userId,
        'password_dance_enrollment_attempt',
        { gestureType, phraseLength: phrase.length },
        'medium',
        req.ip
      );

      const result = await biometricPasswordDanceService.enrollPasswordDance(userId, {
        phrase,
        gestureType,
        audioData,
        gestureData
      });
      
      // Log successful enrollment
      await db.logSecurityEvent(
        userId,
        'password_dance_enrollment_success',
        { 
          enrollmentId: result.enrollmentId,
          gestureType,
          qualityScores: result.qualityScores
        },
        'low',
        req.ip
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error enrolling password dance', { 
        error: error.message, 
        userId: req.user?.userId 
      });
      
      // Log failed enrollment
      await db.logSecurityEvent(
        req.user?.userId,
        'password_dance_enrollment_failed',
        { error: error.message },
        'high',
        req.ip
      );
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Verify biometric password dance - PRODUCTION SECURED
 */
router.post('/password-dance/verify',
  security.authenticateToken(),
  security.rateLimit('password-dance'),
  security.validatePasswordDanceChallenge(),
  security.sanitizeBiometricData(),
  security.antiReplay(),
  async (req, res) => {
    try {
      const { phrase, audioData, gestureData } = req.body;
      const { userId } = req.user;
      
      // Log verification attempt
      await db.logSecurityEvent(
        userId,
        'password_dance_verification_attempt',
        { phraseLength: phrase.length },
        'medium',
        req.ip
      );

      const result = await biometricPasswordDanceService.verifyPasswordDance(userId, {
        phrase,
        audioData,
        gestureData
      });
      
      // Log verification result
      await db.logSecurityEvent(
        userId,
        result.verified ? 'password_dance_verification_success' : 'password_dance_verification_failed',
        { 
          confidence: result.confidence,
          scores: result.scores,
          qualityScores: result.qualityScores
        },
        result.verified ? 'low' : 'high',
        req.ip
      );

      // Generate enhanced JWT token for successful strong authentication
      if (result.verified) {
        const enhancedToken = security.generateSecureToken(
          userId,
          req.user.trustLevel,
          'password_dance'
        );
        
        result.enhancedToken = enhancedToken;
      }
      
      res.json(result);
    } catch (error) {
      logger.error('Error verifying password dance', { 
        error: error.message, 
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Get password dance enrollment info - PRODUCTION SECURED
 */
router.get('/password-dance/info/:userId',
  security.authenticateToken(),
  security.rateLimit('general'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.userId;
      
      // Users can only access their own info, unless they're admin
      if (userId !== requestingUserId && req.user.trustLevel !== 'anchor') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const danceInfo = await biometricPasswordDanceService.getDanceInfo(userId);
      
      if (!danceInfo) {
        return res.status(404).json({
          success: false,
          message: 'No password dance enrollment found'
        });
      }
      
      res.json({
        success: true,
        data: danceInfo      });
    } catch (error) {
      logger.error('Error getting password dance info', { 
        error: error.message, 
        userId: req.params.userId 
      });
      
      res.status(500).json({
        success: false,
        message: error.message
      });    }
  }
);

// Apply security error handler to all routes
router.use(security.securityErrorHandler());

export default router;
