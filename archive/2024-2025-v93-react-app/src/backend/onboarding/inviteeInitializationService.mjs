/**
 * @fileoverview Invitee Initialization Module
 * 
 * Equips newly onboarded users with a full instance of Relay and 
 * their voting/participation permissions.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
import biometricVerifier from '../biometrics/biometricVerifier.mjs';
import biometricTemplateStore from '../biometrics/biometricTemplateStore.mjs';

const inviteeLogger = logger.child({ module: 'invitee-init' });

class InviteeInitializationService extends EventEmitter {
  constructor() {
    super();
    this.dataDir = path.join(process.cwd(), 'data', 'invitee-init');
    this.initSessionsFile = path.join(this.dataDir, 'initialization-sessions.json');
    
    // In-memory storage for active initialization sessions
    this.activeSessions = new Map(); // sessionId -> sessionData
    this.userSessions = new Map(); // userId -> sessionId
    
    // Configuration
    this.sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes
    this.maxBiometricAttempts = 3;
    this.cleanupInterval = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      
      // Set up periodic cleanup of expired sessions
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredSessions();
      }, 60000); // Clean up every minute
      
      this.initialized = true;
      inviteeLogger.info('Invitee Initialization Service initialized');
      return true;
    } catch (error) {
      inviteeLogger.error('Failed to initialize invitee initialization service', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Load initialization data from disk
   */
  async loadData() {
    try {
      const data = await fs.readFile(this.initSessionsFile, 'utf8');
      const parsed = JSON.parse(data);
      
      this.activeSessions = new Map();
      this.userSessions = new Map();
      
      // Restore session data, skipping any that are expired
      const now = Date.now();
      if (parsed.sessions) {
        for (const session of parsed.sessions) {
          if (session.expiresAt > now) {
            this.activeSessions.set(session.sessionId, session);
            
            // Restore user session index
            if (session.userId) {
              this.userSessions.set(session.userId, session.sessionId);
            }
          }
        }
      }
      
      inviteeLogger.info(`Loaded ${this.activeSessions.size} active initialization sessions`);
    } catch (error) {
      // File doesn't exist yet, start fresh
      inviteeLogger.info('Starting with fresh initialization data');
    }
  }
  
  /**
   * Save initialization data to disk
   */
  async saveData() {
    try {
      const data = {
        sessions: Array.from(this.activeSessions.values()),
        lastSaved: Date.now()
      };
      
      await fs.writeFile(this.initSessionsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      inviteeLogger.error('Failed to save initialization data', { error: error.message });
    }
  }
  
  /**
   * Start an invitee initialization session
   * @param {string} userId - The ID of the new user
   * @param {string} onboardingSessionId - The original onboarding session ID
   * @param {string} inviteToken - The invite token
   * @returns {object} Session details
   */
  async startInitializationSession(userId, onboardingSessionId, inviteToken) {
    if (!this.initialized) throw new Error('Initialization service not initialized');
    
    // Check if user already has an active session
    if (this.userSessions.has(userId)) {
      const existingSessionId = this.userSessions.get(userId);
      return {
        sessionId: existingSessionId,
        message: 'User already has an active initialization session'
      };
    }
    
    // Generate a unique session ID
    const sessionId = crypto.randomUUID();
    
    // Create the session
    const session = {
      sessionId,
      userId,
      onboardingSessionId,
      inviteToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeoutMs,
      status: 'started',
      biometricAttempts: 0,
      biometricVerified: false,
      steps: {
        biometricSetup: false,
        globalParamsLoaded: false,
        inviteTokenVerified: false,
        deviceStateInitialized: false,
        completed: false
      }
    };
    
    // Store the session
    this.activeSessions.set(sessionId, session);
    this.userSessions.set(userId, sessionId);
    
    // Save to disk
    await this.saveData();
    
    inviteeLogger.info('Initialization session started', { sessionId, userId });
    this.emit('initialization.started', { sessionId, userId });
    
    return {
      sessionId,
      expiresAt: session.expiresAt,
      status: session.status
    };
  }
  
  /**
   * Process biometric setup for a new user
   * @param {string} sessionId - The initialization session ID
   * @param {string} biometricHash - The biometric hash data
   * @returns {object} Biometric setup result
   */
  async processBiometricSetup(sessionId, biometricHash) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw createError('notFound', 'Initialization session not found');
    }
    
    // Increment attempt counter
    session.biometricAttempts++;
    
    // Check if too many attempts
    if (session.biometricAttempts > this.maxBiometricAttempts) {
      session.status = 'biometric_failed';
      await this.saveData();
      
      throw createError('tooManyAttempts', `Exceeded maximum biometric setup attempts (${this.maxBiometricAttempts})`);
    }
    
    try {
      // Check for duplicate biometric (Sybil resistance)
      const similarUserId = await biometricVerifier.findSimilarBiometricHash(biometricHash);
      if (similarUserId) {
        session.status = 'biometric_duplicate';
        await this.saveData();
        
        inviteeLogger.warn('Duplicate biometric detected', { 
          sessionId, 
          userId: session.userId,
          similarUserId
        });
        
        return {
          success: false,
          error: 'DUPLICATE_BIOMETRIC',
          message: 'This biometric pattern has already been registered. Biometric uniqueness is required.'
        };
      }
      
      // Check biometric quality
      const qualityCheck = await biometricVerifier.assessBiometricQuality(biometricHash);
      if (!qualityCheck.acceptable) {
        return {
          success: false,
          error: 'LOW_QUALITY_BIOMETRIC',
          message: 'Biometric quality too low. Please try again with better lighting/positioning.',
          issues: qualityCheck.issues,
          retryAllowed: true
        };
      }
      
      // Store the biometric template for this user
      await biometricTemplateStore.storeTemplate(session.userId, biometricHash);
      
      // Update session
      session.steps.biometricSetup = true;
      session.biometricVerified = true;
      session.status = 'biometric_verified';
      
      // Save changes
      await this.saveData();
      
      inviteeLogger.info('Biometric setup completed', { sessionId, userId: session.userId });
      this.emit('initialization.biometricSetup', { sessionId, userId: session.userId });
      
      return {
        success: true,
        message: 'Biometric verification successful'
      };
    } catch (error) {
      inviteeLogger.error('Error in biometric setup', { 
        sessionId, 
        error: error.message
      });
      
      return {
        success: false,
        error: 'BIOMETRIC_PROCESSING_ERROR',
        message: 'There was an error processing your biometric data. Please try again.',
        retryAllowed: true
      };
    }
  }
  
  /**
   * Load global parameters for the new user
   * @param {string} sessionId - The initialization session ID
   * @param {object} parameters - The global parameters
   * @returns {object} Operation result
   */
  async loadGlobalParameters(sessionId, parameters) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw createError('notFound', 'Initialization session not found');
    }
    
    // Ensure biometric verification was completed
    if (!session.steps.biometricSetup) {
      throw createError('invalidState', 'Biometric setup must be completed first');
    }
    
    // Store the global parameters
    session.globalParameters = parameters;
    session.steps.globalParamsLoaded = true;
    session.status = 'parameters_loaded';
    
    // Save changes
    await this.saveData();
    
    inviteeLogger.info('Global parameters loaded', { 
      sessionId, 
      userId: session.userId,
      paramCount: Object.keys(parameters).length
    });
    
    this.emit('initialization.parametersLoaded', { 
      sessionId, 
      userId: session.userId
    });
    
    return {
      success: true,
      message: 'Global parameters loaded successfully'
    };
  }
  
  /**
   * Verify invite token and record it
   * @param {string} sessionId - The initialization session ID
   * @param {string} inviteCode - The invite code to verify
   * @returns {object} Verification result
   */
  async verifyInviteToken(sessionId, inviteCode) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw createError('notFound', 'Initialization session not found');
    }
    
    // Ensure parameters are loaded
    if (!session.steps.globalParamsLoaded) {
      throw createError('invalidState', 'Global parameters must be loaded first');
    }
    
    // Verify the invite code matches what was provided at session start
    if (inviteCode !== session.inviteToken) {
      return {
        success: false,
        error: 'INVALID_INVITE_CODE',
        message: 'The invite code does not match the one provided at session start'
      };
    }
    
    // Store the verified token
    session.verifiedToken = inviteCode;
    session.steps.inviteTokenVerified = true;
    session.status = 'token_verified';
    
    // Save changes
    await this.saveData();
    
    inviteeLogger.info('Invite token verified', { 
      sessionId, 
      userId: session.userId
    });
    
    this.emit('initialization.tokenVerified', { 
      sessionId, 
      userId: session.userId
    });
    
    return {
      success: true,
      message: 'Invite token verified successfully'
    };
  }
  
  /**
   * Initialize device state for the new user
   * @param {string} sessionId - The initialization session ID
   * @param {object} deviceState - Initial device state
   * @returns {object} Operation result
   */
  async initializeDeviceState(sessionId, deviceState) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw createError('notFound', 'Initialization session not found');
    }
    
    // Ensure invite token is verified
    if (!session.steps.inviteTokenVerified) {
      throw createError('invalidState', 'Invite token must be verified first');
    }
    
    // Store the device state
    session.deviceState = deviceState;
    session.steps.deviceStateInitialized = true;
    session.status = 'device_initialized';
    
    // Save changes
    await this.saveData();
    
    inviteeLogger.info('Device state initialized', { 
      sessionId, 
      userId: session.userId
    });
    
    this.emit('initialization.deviceInitialized', { 
      sessionId, 
      userId: session.userId
    });
    
    return {
      success: true,
      message: 'Device state initialized successfully'
    };
  }
  
  /**
   * Complete the initialization process
   * @param {string} sessionId - The initialization session ID
   * @returns {object} Completion status
   */
  async completeInitialization(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw createError('notFound', 'Initialization session not found');
    }
    
    // Ensure all steps are completed
    if (!session.steps.deviceStateInitialized) {
      throw createError('invalidState', 'Device state must be initialized first');
    }
    
    // Mark session as completed
    session.steps.completed = true;
    session.status = 'completed';
    session.completionTime = Date.now();
    
    // Save changes
    await this.saveData();
    
    inviteeLogger.info('Initialization process completed', { 
      sessionId, 
      userId: session.userId
    });
    
    this.emit('initialization.completed', { 
      sessionId, 
      userId: session.userId
    });
    
    return {
      success: true,
      message: 'Initialization process completed successfully'
    };
  }
  
  /**
   * Get initialization session status
   * @param {string} sessionId - The session ID
   * @returns {object} Session status
   */
  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw createError('notFound', 'Initialization session not found');
    }
    
    return {
      sessionId,
      userId: session.userId,
      status: session.status,
      expiresAt: session.expiresAt,
      steps: session.steps,
      biometricAttempts: session.biometricAttempts,
      biometricVerified: session.biometricVerified,
      createdAt: session.createdAt
    };
  }
  
  /**
   * Get initialization session by user ID
   * @param {string} userId - The user ID
   * @returns {object|null} Session status or null if not found
   */
  getUserInitializationStatus(userId) {
    const sessionId = this.userSessions.get(userId);
    
    if (!sessionId) {
      return null;
    }
    
    return this.getSessionStatus(sessionId);
  }
  
  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessionIds = [];
    
    // Find expired sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now) {
        expiredSessionIds.push(sessionId);
      }
    }
    
    if (expiredSessionIds.length === 0) {
      return;
    }
    
    // Remove expired sessions
    for (const sessionId of expiredSessionIds) {
      const session = this.activeSessions.get(sessionId);
      
      // Remove from main storage
      this.activeSessions.delete(sessionId);
      
      // Remove from user index
      if (session.userId) {
        this.userSessions.delete(session.userId);
      }
    }
    
    // Save changes
    this.saveData().catch(error => {
      inviteeLogger.error('Failed to save after cleaning up sessions', { error: error.message });
    });
    
    inviteeLogger.info(`Cleaned up ${expiredSessionIds.length} expired initialization sessions`);
  }
}

// Create singleton instance
const inviteeInitializationService = new InviteeInitializationService();

export default inviteeInitializationService;
