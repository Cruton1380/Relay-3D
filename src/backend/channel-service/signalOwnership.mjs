/**
 * @fileoverview Signal Ownership & Verification System
 * Implements signal power cycling and verification for spoof protection
 */
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';

const ownershipLogger = logger.child({ module: 'signal-ownership' });

class SignalOwnershipService {
  constructor() {
    // Signal ownership tracking
    this.ownedSignals = new Map(); // userId -> Set of owned signal IDs
    this.signalChallenges = new Map(); // challengeId -> challenge data
    this.verificationHistory = new Map(); // userId -> Array of verification records
    
    // Official channel designation tracking
    this.officialChannels = new Map(); // channelId -> official designation data
    this.channelSignalProofs = new Map(); // channelId -> signal ownership proofs
    
    // Power cycling detection
    this.powerCyclingDetectors = new Map(); // signalId -> detector data
  }

  /**
   * Create signal ownership challenge
   * @param {string} userId - User requesting ownership
   * @param {string} signalId - Signal ID (BT/WiFi device hash)
   * @param {string} signalType - 'bluetooth' or 'wifi'
   * @returns {Object} Challenge data
   */
  async createOwnershipChallenge(userId, signalId, signalType) {
    try {
      const challengeId = crypto.randomUUID();
      const keyPair = generateKeyPair();
      
      // Create unique verification sequence
      const verificationSequence = this.generateVerificationSequence();
      
      const challenge = {
        id: challengeId,
        userId,
        signalId,
        signalType,
        verificationSequence,
        publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
        privateKey: Buffer.from(keyPair.secretKey).toString('hex'),
        startTime: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        status: 'pending',
        powerCycleCount: 0,
        requiredCycles: 3
      };
      
      this.signalChallenges.set(challengeId, challenge);
      
      ownershipLogger.info('Signal ownership challenge created', {
        challengeId,
        userId,
        signalId,
        signalType
      });
      
      return {
        challengeId,
        verificationSequence,
        publicKey: challenge.publicKey,
        instructions: this.generateChallengeInstructions(signalType, verificationSequence),
        expiresAt: challenge.expiresAt
      };
    } catch (error) {
      ownershipLogger.error('Failed to create ownership challenge', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate verification sequence for power cycling
   * @returns {Array} Sequence of power states and timings
   */
  generateVerificationSequence() {
    const sequences = [
      ['off', 'on', 'off', 'on'], // Basic on/off pattern
      ['off', 'off', 'on', 'on'], // Double off, double on
      ['on', 'off', 'on', 'off', 'on'], // Rapid cycling
    ];
    
    const selectedSequence = sequences[Math.floor(Math.random() * sequences.length)];
    
    return selectedSequence.map((state, index) => ({
      step: index + 1,
      state,
      duration: state === 'off' ? 3000 : 5000, // 3s off, 5s on
      tolerance: 1000 // ±1 second tolerance
    }));
  }

  /**
   * Generate human-readable challenge instructions
   * @param {string} signalType - 'bluetooth' or 'wifi'
   * @param {Array} sequence - Verification sequence
   * @returns {Object} Instructions
   */
  generateChallengeInstructions(signalType, sequence) {
    const deviceName = signalType === 'bluetooth' ? 'Bluetooth device' : 'WiFi network/device';
    
    const steps = sequence.map((step, index) => {
      const action = step.state === 'off' ? 'Turn OFF' : 'Turn ON';
      const duration = Math.round(step.duration / 1000);
      
      return {
        step: step.step,
        instruction: `${action} your ${deviceName} for ${duration} seconds`,
        duration: step.duration,
        state: step.state
      };
    });
    
    return {
      title: `Verify ${signalType} signal ownership`,
      description: `Follow these steps to prove you control this ${deviceName}:`,
      steps,
      totalTime: Math.round(sequence.reduce((sum, step) => sum + step.duration, 0) / 1000),
      warning: 'You must complete this within 5 minutes, or the challenge will expire.'
    };
  }

  /**
   * Verify power cycling sequence
   * @param {string} challengeId - Challenge ID
   * @param {Array} detectedStates - Array of detected power states with timestamps
   * @returns {Object} Verification result
   */
  async verifyPowerCycling(challengeId, detectedStates) {
    try {
      const challenge = this.signalChallenges.get(challengeId);
      
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      
      if (challenge.status !== 'pending') {
        throw new Error('Challenge already completed or expired');
      }
      
      if (Date.now() > challenge.expiresAt) {
        challenge.status = 'expired';
        throw new Error('Challenge expired');
      }
      
      // Analyze detected states against expected sequence
      const verification = this.analyzeStateSequence(
        challenge.verificationSequence,
        detectedStates,
        challenge.startTime
      );
      
      if (verification.success) {
        challenge.status = 'verified';
        challenge.completedAt = Date.now();
        
        // Grant signal ownership
        await this.grantSignalOwnership(
          challenge.userId,
          challenge.signalId,
          challenge.signalType,
          verification
        );
        
        ownershipLogger.info('Signal ownership verified', {
          challengeId,
          userId: challenge.userId,
          signalId: challenge.signalId
        });
      } else {
        challenge.status = 'failed';
        challenge.failureReason = verification.reason;
        
        ownershipLogger.warn('Signal ownership verification failed', {
          challengeId,
          reason: verification.reason
        });
      }
      
      return verification;
    } catch (error) {
      ownershipLogger.error('Power cycling verification error', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze detected state sequence against expected pattern
   * @param {Array} expectedSequence - Expected power cycle sequence
   * @param {Array} detectedStates - Detected power states
   * @param {number} startTime - Challenge start time
   * @returns {Object} Analysis result
   */
  analyzeStateSequence(expectedSequence, detectedStates, startTime) {
    const analysis = {
      success: false,
      confidence: 0,
      matchedSteps: 0,
      totalSteps: expectedSequence.length,
      reason: null,
      details: []
    };
    
    let currentTime = startTime;
    let detectionIndex = 0;
    
    for (let i = 0; i < expectedSequence.length; i++) {
      const expectedStep = expectedSequence[i];
      const stepStartTime = currentTime;
      const stepEndTime = currentTime + expectedStep.duration;
      
      // Find state changes within this step's time window
      const stepDetections = detectedStates.filter(detection => 
        detection.timestamp >= stepStartTime - expectedStep.tolerance &&
        detection.timestamp <= stepEndTime + expectedStep.tolerance
      );
      
      const stepMatches = stepDetections.some(detection => 
        detection.state === expectedStep.state
      );
      
      const stepResult = {
        step: expectedStep.step,
        expected: expectedStep.state,
        detected: stepDetections.map(d => d.state),
        matched: stepMatches,
        timeWindow: [stepStartTime, stepEndTime],
        detections: stepDetections
      };
      
      analysis.details.push(stepResult);
      
      if (stepMatches) {
        analysis.matchedSteps++;
      }
      
      currentTime = stepEndTime;
    }
    
    // Calculate confidence and success
    analysis.confidence = analysis.matchedSteps / analysis.totalSteps;
    analysis.success = analysis.confidence >= 0.8; // 80% match required
    
    if (!analysis.success) {
      if (analysis.confidence < 0.5) {
        analysis.reason = 'Insufficient power cycling pattern detected';
      } else {
        analysis.reason = 'Power cycling pattern partially matched but below threshold';
      }
    }
    
    return analysis;
  }

  /**
   * Enhanced signal ownership verification with spoof protection
   */
  async enhancedSignalVerification(challengeId, powerCycleEvents) {
    try {
      const challenge = this.signalChallenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Verify power cycling pattern matches expected sequence
      const isValidPattern = this.verifyPowerCyclingPattern(
        powerCycleEvents, 
        challenge.verificationSequence
      );

      if (isValidPattern) {
        // Grant signal ownership
        await this.grantSignalOwnership(challenge.userId, challenge.signalId);
        
        // Enable official channel designation
        challenge.status = 'verified';
        challenge.verifiedAt = Date.now();
        
        ownershipLogger.info(`Signal ownership verified for user ${challenge.userId}, signal ${challenge.signalId}`);
        
        return {
          success: true,
          challengeId,
          signalId: challenge.signalId,
          verifiedAt: challenge.verifiedAt,
          ownershipProof: this.generateOwnershipProof(challenge)
        };
      } else {
        challenge.status = 'failed';
        throw new Error('Power cycling pattern verification failed');
      }
    } catch (error) {
      ownershipLogger.error('Enhanced signal verification failed:', error);
      throw error;
    }
  }

  /**
   * Grant signal ownership to user
   */
  async grantSignalOwnership(userId, signalId) {
    if (!this.ownedSignals.has(userId)) {
      this.ownedSignals.set(userId, new Set());
    }
    
    this.ownedSignals.get(userId).add(signalId);
    
    // Record ownership history
    if (!this.verificationHistory.has(userId)) {
      this.verificationHistory.set(userId, []);
    }
    
    this.verificationHistory.get(userId).push({
      signalId,
      action: 'ownership_granted',
      timestamp: Date.now(),
      method: 'power_cycling'
    });

    ownershipLogger.info(`Granted signal ownership: ${userId} -> ${signalId}`);
  }

  /**
   * Deactivate all unauthorized channels on a signal
   */
  async deactivateUnauthorizedChannels(signalId, authorizedUserId) {
    try {
      // This would integrate with the channel service to deactivate channels
      // created by users other than the signal owner
      const unauthorizedChannels = await this.findUnauthorizedChannels(signalId, authorizedUserId);
      
      for (const channel of unauthorizedChannels) {
        await this.deactivateChannel(channel.id);
        ownershipLogger.info(`Deactivated unauthorized channel ${channel.id} on signal ${signalId}`);
      }

      return {
        success: true,
        deactivatedChannels: unauthorizedChannels.length,
        signalId,
        authorizedOwner: authorizedUserId
      };
    } catch (error) {
      ownershipLogger.error('Failed to deactivate unauthorized channels:', error);
      throw error;
    }
  }

  /**
   * Allow signal owner to rename their official channel
   */
  async renameOfficialChannel(userId, signalId, newName) {
    try {
      // Verify user owns the signal
      if (!this.userOwnsSignal(userId, signalId)) {
        throw new Error('User does not own this signal');
      }

      // Find official channel for this signal
      const officialChannel = await this.getOfficialChannelForSignal(signalId);
      if (!officialChannel) {
        throw new Error('No official channel found for this signal');
      }

      // Update channel name
      await this.updateChannelName(officialChannel.id, newName);
      
      // Record name change
      this.verificationHistory.get(userId).push({
        signalId,
        action: 'channel_renamed',
        timestamp: Date.now(),
        oldName: officialChannel.name,
        newName
      });

      ownershipLogger.info(`Signal owner ${userId} renamed channel on signal ${signalId} to "${newName}"`);
      
      return {
        success: true,
        channelId: officialChannel.id,
        newName,
        signalId
      };
    } catch (error) {
      ownershipLogger.error('Failed to rename official channel:', error);
      throw error;
    }
  }

  /**
   * Check if user owns a signal
   */
  userOwnsSignal(userId, signalId) {
    return this.ownedSignals.has(userId) && 
           this.ownedSignals.get(userId).has(signalId);
  }

  /**
   * Generate ownership proof for verified signal
   */
  generateOwnershipProof(challenge) {
    const proofData = {
      userId: challenge.userId,
      signalId: challenge.signalId,
      challengeId: challenge.id,
      verifiedAt: challenge.verifiedAt,
      method: 'power_cycling'
    };

    const proof = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    return {
      proof,
      data: proofData,
      signature: this.signData(proofData, challenge.privateKey)
    };
  }

  /**
   * Find unauthorized channels on a signal
   */
  async findUnauthorizedChannels(signalId, authorizedUserId) {
    // This would query the channel service for all channels on this signal
    // and return those not created by the authorized user
    // Implementation depends on channel service integration
    return [];
  }

  /**
   * Get official channel for a signal
   */
  async getOfficialChannelForSignal(signalId) {
    // This would query the channel service for the official channel
    // Implementation depends on channel service integration
    return null;
  }

  /**
   * Update channel name
   */
  async updateChannelName(channelId, newName) {
    // This would update the channel name in the channel service
    // Implementation depends on channel service integration
  }

  /**
   * Deactivate a channel
   */
  async deactivateChannel(channelId) {
    // This would deactivate the channel in the channel service
    // Implementation depends on channel service integration
  }

  /**
   * Clean up expired challenges and verifications
   */
  cleanup() {
    const now = Date.now();
    
    // Clean expired challenges
    for (const [challengeId, challenge] of this.signalChallenges) {
      if (now > challenge.expiresAt) {
        this.signalChallenges.delete(challengeId);
      }
    }
    
    // Clean expired verifications
    for (const [userId, verifications] of this.verificationHistory) {
      const validVerifications = verifications.filter(v => now < v.expiresAt);
      if (validVerifications.length !== verifications.length) {
        this.verificationHistory.set(userId, validVerifications);
        
        // Update owned signals
        const validSignals = validVerifications.map(v => v.signalId);
        this.ownedSignals.set(userId, new Set(validSignals));
      }
    }
    
    // Clean expired official designations
    for (const [channelId, designation] of this.officialChannels) {
      if (now > designation.expiresAt) {
        this.officialChannels.delete(channelId);
        this.channelSignalProofs.delete(channelId);
      }
    }
  }
}

export default new SignalOwnershipService();
