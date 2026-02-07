/**
 * INVITE PROCESSOR - PHASE 1 PRIVACY UPGRADE
 * Integrates temporal mixing and phantom invite generation for enhanced privacy
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import TemporalMixingEngine from '../lib/temporalMixingEngine.js';
import PhantomInviteGenerator from '../lib/generatePhantomInvite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class InviteProcessor extends EventEmitter {
  constructor() {
    super();
    this.config = this.loadConfig();
    this.mixingEngine = new TemporalMixingEngine();
    this.phantomGenerator = new PhantomInviteGenerator();
    this.metrics = {
      totalInvites: 0,
      realInvites: 0,
      phantomInvites: 0,
      batchesProcessed: 0,
      privacyUpgradeActive: true
    };
    
    this.setupEventHandlers();
    console.log('[INVITE_PROCESSOR] Phase 1 Privacy Upgrade initialized');
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/invitePrivacy.json');
      return JSON.parse(readFileSync(configPath, 'utf8')).invitePrivacy;
    } catch (error) {
      console.warn('Failed to load invite processor config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      temporalMixing: { enabled: true },
      phantomInvites: { enabled: true },
      security: { auditLogging: true },
      compatibility: { backwardCompatible: true }
    };
  }

  setupEventHandlers() {
    // Set up integration with mixing engine
    this.mixingEngine.onInviteProcessed = async (invite, type) => {
      await this.handleProcessedInvite(invite, type);
    };
  }

  /**
   * Main entry point for processing new invites
   * PUBLIC API - maintains backward compatibility
   */
  async processInvite(inviteRequest) {
    try {
      // Validate invite request
      const validatedInvite = await this.validateInviteRequest(inviteRequest);
      
      // Check if privacy upgrades are enabled
      if (this.config.temporalMixing.enabled) {
        // Queue for temporal mixing
        const result = await this.mixingEngine.queueInvite(validatedInvite);
        
        this.metrics.totalInvites++;
        this.metrics.realInvites++;
        
        this.emit('inviteQueued', {
          inviteId: validatedInvite.id,
          batchId: result.batchId,
          scheduledRelease: result.scheduledRelease
        });
        
        return {
          success: true,
          inviteId: validatedInvite.id,
          status: 'queued_for_batch_processing',
          scheduledRelease: result.scheduledRelease,
          batchId: result.batchId,
          message: `Invite will be processed in ${this.config.temporalMixing.batchWindow} for enhanced privacy`
        };
      } else {
        // Process immediately (legacy mode)
        return await this.processInviteImmediately(validatedInvite);
      }
      
    } catch (error) {
      console.error('[INVITE_PROCESSOR] Error processing invite:', error);
      
      this.emit('inviteError', {
        error: error.message,
        inviteRequest,
        timestamp: Date.now()
      });
      
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Validate incoming invite request
   */
  async validateInviteRequest(inviteRequest) {
    // Basic validation
    if (!inviteRequest.inviterId || !inviteRequest.inviteeId) {
      throw new Error('Invalid invite request: missing inviter or invitee ID');
    }

    // Security checks
    await this.performSecurityChecks(inviteRequest);

    // Enhance with metadata
    const validatedInvite = {
      id: inviteRequest.inviteeId,
      inviterId: inviteRequest.inviterId,
      inviteeId: inviteRequest.inviteeId,
      timestamp: Date.now(),
      
      // Additional metadata
      location: inviteRequest.location || await this.inferLocation(inviteRequest),
      method: inviteRequest.method || 'proximity_bluetooth',
      verificationLevel: inviteRequest.verificationLevel || 'standard',
      
      // Security metadata
      ipAddress: inviteRequest.ipAddress,
      userAgent: inviteRequest.userAgent,
      sessionId: inviteRequest.sessionId,
      
      // Privacy metadata (for audit)
      _processing: {
        receivedAt: Date.now(),
        privacyUpgrade: 'phase1_temporal_mixing',
        processorVersion: '1.0.0'
      }
    };

    return validatedInvite;
  }
  /**
   * Perform security checks on invite request
   */
  async performSecurityChecks(inviteRequest) {
    // Check for phantom user attempting to invite
    const isInviterPhantom = await this.phantomGenerator.isPhantom(inviteRequest.inviterId);
    if (isInviterPhantom) {
      throw new Error('Phantom users cannot send invites');
    }

    // Rate limiting check
    await this.checkInviteRateLimit(inviteRequest.inviterId);

    // Duplicate detection
    await this.checkDuplicateInvite(inviteRequest);

    // Additional security validations would go here
  }

  async checkInviteRateLimit(inviterId) {
    // In production, this would check actual rate limits
    // For now, just log the check
    console.log(`[SECURITY] Rate limit check for inviter: ${inviterId}`);
  }

  async checkDuplicateInvite(inviteRequest) {
    // In production, this would check for duplicate invites
    console.log(`[SECURITY] Duplicate check for invite: ${inviteRequest.inviterId} -> ${inviteRequest.inviteeId}`);
  }

  async inferLocation(inviteRequest) {
    // In production, this would use IP geolocation or other methods
    return {
      city: 'Unknown',
      region: 'Unknown', 
      country: 'Unknown'
    };
  }

  /**
   * Handle invites that have been processed through mixing
   */
  async handleProcessedInvite(invite, type) {
    if (type === 'real') {
      await this.storeRealInvite(invite);
      this.emit('realInviteProcessed', invite);
    } else if (type === 'phantom') {
      await this.storePhantomInvite(invite);
      this.emit('phantomInviteProcessed', invite);
      this.metrics.phantomInvites++;
    }

    this.metrics.totalInvites++;
  }

  /**
   * Store real invite in main system
   */
  async storeRealInvite(invite) {
    console.log(`[INVITE_PROCESSOR] Storing real invite: ${invite.id}`);
    
    // In production, this would integrate with the main database
    // For now, just emit an event for integration
    this.emit('storeInvite', {
      type: 'real',
      invite: this.sanitizeInviteForStorage(invite),
      timestamp: Date.now()
    });
  }

  /**
   * Store phantom invite in phantom tracking system
   */
  async storePhantomInvite(invite) {
    console.log(`[INVITE_PROCESSOR] Storing phantom invite: ${invite.id}`);
    
    // Phantom invites are stored separately and never exposed to main UI
    this.emit('storePhantom', {
      type: 'phantom',
      invite: invite,
      timestamp: Date.now()
    });
  }

  /**
   * Remove sensitive metadata before storage
   */
  sanitizeInviteForStorage(invite) {
    const sanitized = { ...invite };
    
    // Remove internal processing metadata
    delete sanitized._mixing;
    delete sanitized._processing;
    delete sanitized._phantom;
    delete sanitized._security;
    
    return sanitized;
  }

  /**
   * Process invite immediately (backward compatibility)
   */
  async processInviteImmediately(invite) {
    console.log('[INVITE_PROCESSOR] Processing invite immediately (legacy mode)');
    
    await this.storeRealInvite(invite);
    
    this.metrics.totalInvites++;
    this.metrics.realInvites++;
    
    return {
      success: true,
      inviteId: invite.id,
      status: 'processed_immediately',
      timestamp: Date.now()
    };
  }
  /**
   * Get invite by ID - PUBLIC API
   * Ensures phantoms are never returned to public API
   */
  async getInvite(inviteId) {
    // Security check - never return phantom invites
    const isPhantom = await this.phantomGenerator.isPhantom(inviteId);
    if (isPhantom) {
      return null; // Phantom invites don't exist in public API
    }

    // In production, query main database
    console.log(`[INVITE_PROCESSOR] Retrieving invite: ${inviteId}`);
    
    // Return mock data for now - in production would query database
    return {
      id: inviteId,
      status: 'active',
      // ... other invite data
    };
  }

  /**
   * List invites with phantom filtering - PUBLIC API
   */
  async listInvites(filters = {}) {
    console.log('[INVITE_PROCESSOR] Listing invites (phantoms filtered out)');
    
    // In production, this would query database with phantom exclusion
    // For now, return empty array
    return [];
  }

  /**
   * Get system metrics and statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      mixingStats: this.mixingEngine.getMixingStats(),
      phantomStats: this.phantomGenerator.getPhantomStats(),
      privacyUpgrade: {
        version: 'phase1',
        features: ['temporal_mixing', 'phantom_invites'],
        status: 'active'
      }
    };
  }

  /**
   * Developer/admin methods for phantom visibility
   */
  async getPhantomInvites() {
    // Only available in development or to authorized admins
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Phantom invite access restricted to development environment');
    }
    
    return this.phantomGenerator.getPhantomStats();
  }
  /**
   * Update configuration (community-votable parameters)
   */
  async updateConfig(newConfig, voteResult = null) {
    // Validate that only community-votable parameters are being changed
    const votableParams = this.config.governance?.communityVotableParams || ['phantomRatio', 'batchWindow', 'enabled'];
    
    for (const param of Object.keys(newConfig)) {
      if (!votableParams.includes(param)) {
        throw new Error(`Parameter ${param} is not community-votable`);
      }
    }

    // Update configuration with nested structure
    if (newConfig.phantomRatio !== undefined) {
      this.config.phantomInvites.phantomRatio = newConfig.phantomRatio;
    }
    if (newConfig.batchWindow !== undefined) {
      this.config.temporalMixing.batchWindow = newConfig.batchWindow;
    }
    if (newConfig.enabled !== undefined) {
      this.config.temporalMixing.enabled = newConfig.enabled;
      this.config.phantomInvites.enabled = newConfig.enabled;
    }
    
    // Save to file
    await this.saveConfig();
    
    // Update engines with new config
    this.mixingEngine.config = this.config;
    this.phantomGenerator.config = this.config;
    
    this.emit('configUpdated', { newConfig, voteResult });
    
    console.log('[INVITE_PROCESSOR] Configuration updated via community vote:', newConfig);
  }

  async saveConfig() {
    try {
      const configPath = join(__dirname, '../config/invitePrivacy.json');
      const fullConfig = { invitePrivacy: this.config };
      writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Emergency controls for rollback
   */
  emergencyDisable() {
    console.warn('[INVITE_PROCESSOR] Emergency disable activated');
    
    this.mixingEngine.emergencyDisable();
    this.config.temporalMixing.enabled = false;
    this.config.phantomInvites.enabled = false;
    
    this.emit('emergencyDisable', { timestamp: Date.now() });
  }

  /**
   * Analysis tool for measuring privacy improvement
   */
  async analyzePrivacyImprovement() {
    const stats = this.getMetrics();
    
    const analysis = {
      temporalMixing: {
        enabled: this.config.temporalMixing.enabled,
        batchWindow: this.config.temporalMixing.batchWindow,
        correlationReduction: this.calculateCorrelationReduction()
      },
      
      phantomInjection: {
        enabled: this.config.phantomInvites.enabled,
        phantomRatio: this.config.phantomInvites.phantomRatio,
        totalPhantoms: stats.phantomStats.totalPhantoms,
        linkabilityReduction: this.calculateLinkabilityReduction()
      },
      
      overallPrivacy: {
        entropyIncrease: this.calculateEntropyIncrease(),
        graphReconstructionDifficulty: this.calculateReconstructionDifficulty()
      }
    };
    
    return analysis;
  }

  calculateCorrelationReduction() {
    // Simplified calculation - in production would be more sophisticated
    const batchSize = this.mixingEngine.getMixingStats().totalInvitesQueued || 1;
    return Math.min(0.95, Math.log(batchSize) / Math.log(100)); // Logarithmic improvement
  }

  calculateLinkabilityReduction() {
    const phantomRatio = this.config.phantomInvites.phantomRatio;
    return phantomRatio * 0.8; // Phantom effectiveness factor
  }

  calculateEntropyIncrease() {
    const correlation = this.calculateCorrelationReduction();
    const linkability = this.calculateLinkabilityReduction();
    return (correlation + linkability) / 2;
  }

  calculateReconstructionDifficulty() {
    const entropy = this.calculateEntropyIncrease();
    return Math.pow(2, entropy * 10); // Exponential difficulty increase
  }
}

export default InviteProcessor;
export { InviteProcessor };
