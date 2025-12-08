/**
 * @fileoverview Proximity Channel Ownership Reset Module
 * 
 * Enables legitimate physical owners of Bluetooth or Wi-Fi hotspots to claim 
 * or re-claim their channel as the official candidate linked to that proximity signal.
 * 
 * Updated to integrate with the comprehensive ProximityOwnershipResetService
 * for enhanced channel migration and notification features.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import logger from '../utils/logging/logger.mjs';

const ownershipLogger = logger.child({ module: 'proximity-ownership' });

class ProximityOwnershipManager extends EventEmitter {
  constructor() {
    super();
    this.dataDir = path.join(process.cwd(), 'data', 'proximity');
    this.ownershipFile = path.join(this.dataDir, 'verified-channel-owners.json');
    
    // In-memory storage for ownership claims
    this.verifiedOwners = new Map(); // channelId -> userId
    this.pendingResets = new Map(); // channelId -> { userId, timestamp, originalSignature }
    
    // Configuration - Extended for comprehensive reset system
    this.resetTimeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds (increased from 30 seconds)
    this.initialized = false;
    
    // Integration with comprehensive reset service
    this.proximityOwnershipResetService = null;
  }
    /**
   * Initialize the ownership manager with optional ProximityOwnershipResetService integration
   */
  async initialize(proximityOwnershipResetService = null) {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      
      // Store reference to comprehensive reset service if provided
      this.proximityOwnershipResetService = proximityOwnershipResetService;
      
      this.initialized = true;
      ownershipLogger.info('Proximity Ownership Manager initialized', {
        hasResetService: !!this.proximityOwnershipResetService
      });
      return true;
    } catch (error) {
      ownershipLogger.error('Failed to initialize proximity ownership manager', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Load ownership data from disk
   */
  async loadData() {
    try {
      const data = await fs.readFile(this.ownershipFile, 'utf8');
      const parsed = JSON.parse(data);
      
      this.verifiedOwners = new Map(Object.entries(parsed.verifiedOwners || {}));
      ownershipLogger.info(`Loaded ${this.verifiedOwners.size} verified channel owners`);
    } catch (error) {
      // File doesn't exist yet, start fresh
      ownershipLogger.info('Starting with fresh ownership data');
    }
  }
  
  /**
   * Save ownership data to disk
   */
  async saveData() {
    try {
      const data = {
        verifiedOwners: Object.fromEntries(this.verifiedOwners),
        lastSaved: Date.now()
      };
      
      await fs.writeFile(this.ownershipFile, JSON.stringify(data, null, 2));
    } catch (error) {
      ownershipLogger.error('Failed to save ownership data', { error: error.message });
    }
  }
    /**
   * Initiate a comprehensive channel ownership reset claim
   * Routes to the new ProximityOwnershipResetService if available,
   * otherwise falls back to the basic reset process
   * @param {string} userId - The user requesting ownership
   * @param {string} channelId - The channel to claim ownership of
   * @param {object} hotspotData - Complete hotspot data including location, BSSID, etc.
   * @returns {object} Reset status
   */
  async initiateResetClaim(userId, channelId, hotspotData) {
    if (!this.initialized) throw new Error('Ownership manager not initialized');
    
    // Use comprehensive reset service if available
    if (this.proximityOwnershipResetService) {
      try {
        const resetResult = await this.proximityOwnershipResetService.initiateHotspotReset(
          userId, 
          hotspotData
        );
        
        ownershipLogger.info('Comprehensive hotspot reset initiated', { 
          userId, 
          channelId, 
          resetId: resetResult.resetId 
        });
        
        return {
          success: true,
          resetId: resetResult.resetId,
          type: 'comprehensive',
          message: 'Comprehensive hotspot reset initiated. Complete the required actions within 30 minutes.',
          timeWindow: resetResult.verificationDeadline,
          requiredActions: resetResult.requiredActions,
          affectedChannels: resetResult.affectedChannels
        };
        
      } catch (error) {
        ownershipLogger.error('Comprehensive reset initiation failed, falling back to basic reset', {
          error: error.message,
          userId,
          channelId
        });
        // Fall through to basic reset
      }
    }
    
    // Fallback to basic reset process
    return await this.initiateBasicResetClaim(userId, channelId, hotspotData);
  }
  
  /**
   * Basic channel ownership reset claim (original implementation)
   * @param {string} userId - The user requesting ownership
   * @param {string} channelId - The channel to claim ownership of
   * @param {object} signalData - Current signal data to verify reappearance
   * @returns {object} Reset status
   */
  async initiateBasicResetClaim(userId, channelId, signalData) {
    // Check if user already has a pending reset
    const existingReset = Array.from(this.pendingResets.values())
      .find(reset => reset.userId === userId);
      
    if (existingReset) {
      return { 
        success: false,
        error: 'User already has a pending reset claim',
        pendingChannelId: existingReset.channelId
      };
    }
    
    // Store original signal signature for verification
    const originalSignature = this.createSignalSignature(signalData);
    
    // Record the reset request
    this.pendingResets.set(channelId, {
      userId,
      timestamp: Date.now(),
      originalSignature,
      channelId
    });
    
    ownershipLogger.info('Channel ownership reset initiated', { userId, channelId });
    this.emit('resetClaim.initiated', { userId, channelId });
      return {
      success: true,
      type: 'basic',
      message: 'Basic reset claim initiated. Please turn off your Wi-Fi or Bluetooth device and turn it back on within 30 minutes.',
      timeWindow: this.resetTimeWindow / 1000
    };
  }
  
  /**
   * Verify a channel's disappearance (part of the reset process)
   * @param {string} channelId - The channel ID
   * @returns {boolean} True if the channel disappeared as expected
   */
  verifyChannelDisappearance(channelId) {
    const pendingReset = this.pendingResets.get(channelId);
    
    if (!pendingReset) {
      return false;
    }
    
    // Mark the channel as disappeared
    pendingReset.disappeared = true;
    pendingReset.disappearanceTime = Date.now();
    this.pendingResets.set(channelId, pendingReset);
    
    ownershipLogger.info('Channel disappearance detected', { channelId });
    this.emit('resetClaim.disappeared', { channelId, userId: pendingReset.userId });
    
    return true;
  }
  
  /**
   * Verify a channel's reappearance and complete the ownership claim
   * @param {string} channelId - The channel ID
   * @param {object} signalData - The signal data to verify
   * @returns {object} The verification result
   */
  async verifyChannelReappearance(channelId, signalData) {
    const pendingReset = this.pendingResets.get(channelId);
    
    if (!pendingReset || !pendingReset.disappeared) {
      return { 
        success: false,
        error: 'No pending reset claim or channel has not disappeared yet'
      };
    }
    
    // Check if we're within the time window
    const currentTime = Date.now();
    const elapsedTime = currentTime - pendingReset.disappearanceTime;
    
    if (elapsedTime > this.resetTimeWindow) {
      // Reset timed out
      this.pendingResets.delete(channelId);
      ownershipLogger.info('Reset claim timed out', { channelId });
      this.emit('resetClaim.timedOut', { channelId, userId: pendingReset.userId });
      
      return {
        success: false,
        error: 'Reset time window expired. Please try again.'
      };
    }
    
    // Verify the signal signature matches the original
    const newSignature = this.createSignalSignature(signalData);
    
    // For Bluetooth or Wi-Fi, some parameters like signal strength might change
    // but the essential identifiers should remain consistent
    const signatureMatch = this.compareSignatures(pendingReset.originalSignature, newSignature);
    
    if (!signatureMatch) {
      this.pendingResets.delete(channelId);
      ownershipLogger.warn('Signal signature mismatch during reset', { channelId });
      
      return {
        success: false,
        error: 'The reappeared channel does not match the original. Please ensure you are resetting the same device.'
      };
    }
    
    // Everything checks out, mark as verified owner
    this.verifiedOwners.set(channelId, pendingReset.userId);
    this.pendingResets.delete(channelId);
    
    // Save the updated ownership data
    await this.saveData();
    
    ownershipLogger.info('Channel ownership verified', { 
      channelId, 
      userId: pendingReset.userId,
      resetTime: elapsedTime
    });
    
    this.emit('resetClaim.verified', { 
      channelId, 
      userId: pendingReset.userId,
      timestamp: currentTime
    });
    
    return {
      success: true,
      message: 'Channel ownership verified successfully.',
      isVerifiedOwner: true
    };
  }
  
  /**
   * Create a unique signature for a proximity signal
   * @param {object} signalData - The signal data
   * @returns {object} A signature object with key identifiers
   */
  createSignalSignature(signalData) {
    // Extract essential identifiers that shouldn't change during reset
    if (signalData.type === 'wifi') {
      return {
        type: 'wifi',
        ssid: signalData.ssid,
        bssid: signalData.bssid,
        channel: signalData.channel
      };
    } else if (signalData.type === 'bluetooth') {
      return {
        type: 'bluetooth',
        deviceId: signalData.deviceId,
        name: signalData.name,
        address: signalData.address
      };
    }
    
    // Default case
    return {
      type: signalData.type,
      id: signalData.id
    };
  }
  
  /**
   * Compare two signal signatures to verify they represent the same device
   * @param {object} original - The original signature
   * @param {object} current - The current signature
   * @returns {boolean} True if signatures match
   */
  compareSignatures(original, current) {
    // Both must be of same type
    if (original.type !== current.type) {
      return false;
    }
    
    // For Wi-Fi networks
    if (original.type === 'wifi') {
      // BSSID is the MAC address of the access point - should be consistent
      return original.bssid === current.bssid && original.ssid === current.ssid;
    }
    
    // For Bluetooth devices
    if (original.type === 'bluetooth') {
      // Bluetooth address should be consistent for the same device
      return original.address === current.address;
    }
    
    // For other types
    return original.id === current.id;
  }
  
  /**
   * Check if a user is the verified owner of a channel
   * @param {string} channelId - The channel ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if the user is the verified owner
   */
  isVerifiedOwner(channelId, userId) {
    return this.verifiedOwners.get(channelId) === userId;
  }
  
  /**
   * Get all channels a user has verified ownership of
   * @param {string} userId - The user ID
   * @returns {string[]} Array of channel IDs
   */
  getUserOwnedChannels(userId) {
    const ownedChannels = [];
    
    for (const [channelId, ownerId] of this.verifiedOwners.entries()) {
      if (ownerId === userId) {
        ownedChannels.push(channelId);
      }
    }
    
    return ownedChannels;
  }
  
  /**
   * Clean up expired reset requests
   */
  cleanupExpiredResets() {
    const currentTime = Date.now();
    
    for (const [channelId, reset] of this.pendingResets.entries()) {
      const startTime = reset.timestamp;
      if (currentTime - startTime > this.resetTimeWindow * 2) {
        this.pendingResets.delete(channelId);
        ownershipLogger.info('Expired reset claim cleaned up', { channelId });
      }
    }
  }
  
  /**
   * Check if user can create official proximity channel
   * Integrates with comprehensive reset service if available
   * @param {string} userId - The user ID
   * @param {object} hotspotData - Hotspot data for verification
   * @returns {object} Permission status
   */
  async canCreateOfficialProximityChannel(userId, hotspotData) {
    if (this.proximityOwnershipResetService) {
      return await this.proximityOwnershipResetService.canCreateOfficialProximityChannel(
        userId, 
        hotspotData
      );
    }
    
    // Fallback to basic verification
    const ownedChannels = this.getUserOwnedChannels(userId);
    return {
      canCreate: ownedChannels.length > 0,
      isOfficialOwner: ownedChannels.length > 0,
      reason: ownedChannels.length > 0 ? 'User has verified ownership' : 'No verified ownership'
    };
  }
  
  /**
   * Get reset status for comprehensive reset system
   * @param {string} resetId - Reset ID from comprehensive system
   * @returns {object} Reset status
   */
  getComprehensiveResetStatus(resetId) {
    if (this.proximityOwnershipResetService) {
      return this.proximityOwnershipResetService.getResetStatus(resetId);
    }
    return null;
  }
  
  /**
   * Get migration history for a channel
   * @param {string} channelId - Channel ID
   * @returns {array} Migration history
   */
  getChannelMigrationHistory(channelId) {
    if (this.proximityOwnershipResetService) {
      return this.proximityOwnershipResetService.getMigrationHistory(channelId);
    }
    return [];
  }
}

// Create singleton instance
const proximityOwnershipManager = new ProximityOwnershipManager();

export default proximityOwnershipManager;
