/**
 * TEMPORAL MIXING ENGINE
 * Batches and randomizes invite timing to prevent correlation attacks
 */

import { randomBytes, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemporalMixingEngine {
  constructor() {
    this.config = this.loadConfig();
    this.pendingBatches = new Map();
    this.batchTimers = new Map();
    this.auditTrail = [];
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/invitePrivacy.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.invitePrivacy;
    } catch (error) {
      console.warn('Failed to load temporal mixing config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      temporalMixing: {
        enabled: true,
        batchWindow: '1h',
        batchWindowMs: 3600000,
        randomizationRange: 0.8
      },
      security: {
        auditLogging: true
      }
    };
  }

  /**
   * Queue an invite for temporal mixing
   */
  async queueInvite(inviteData) {
    if (!this.config.temporalMixing.enabled) {
      // If mixing disabled, process immediately
      return await this.processImmediately(inviteData);
    }

    const batchTimestamp = this.getCurrentBatchTimestamp();
    const batchId = this.generateBatchId(batchTimestamp);

    // Initialize batch if it doesn't exist
    if (!this.pendingBatches.has(batchId)) {
      this.initializeBatch(batchId, batchTimestamp);
    }

    // Add invite to batch
    const queuedInvite = {
      ...inviteData,
      _mixing: {
        originalTimestamp: Date.now(),
        batchId,
        queuedAt: Date.now(),
        scheduledRelease: batchTimestamp + this.config.temporalMixing.batchWindowMs
      }
    };

    this.pendingBatches.get(batchId).invites.push(queuedInvite);

    // Audit logging
    if (this.config.security.auditLogging) {
      await this.logInviteQueued(queuedInvite);
    }

    return {
      success: true,
      batchId,
      scheduledRelease: queuedInvite._mixing.scheduledRelease,
      message: `Invite queued for batch processing in ${this.config.temporalMixing.batchWindow}`
    };
  }

  /**
   * Initialize a new batch
   */
  initializeBatch(batchId, batchTimestamp) {
    const batch = {
      id: batchId,
      timestamp: batchTimestamp,
      invites: [],
      phantoms: [],
      status: 'collecting',
      createdAt: Date.now()
    };

    this.pendingBatches.set(batchId, batch);

    // Set timer to process batch
    const releaseTime = batchTimestamp + this.config.temporalMixing.batchWindowMs;
    const timeUntilRelease = releaseTime - Date.now();

    const timer = setTimeout(async () => {
      await this.processBatch(batchId);
    }, timeUntilRelease);

    this.batchTimers.set(batchId, timer);

    console.log(`[MIXING] Initialized batch ${batchId} for release at ${new Date(releaseTime).toISOString()}`);
  }

  /**
   * Process a complete batch with temporal mixing
   */
  async processBatch(batchId) {
    const batch = this.pendingBatches.get(batchId);
    if (!batch || batch.status !== 'collecting') {
      console.warn(`[MIXING] Batch ${batchId} not found or already processed`);
      return;
    }

    console.log(`[MIXING] Processing batch ${batchId} with ${batch.invites.length} invites`);

    try {
      batch.status = 'processing';

      // 1. Generate phantom invites if enabled
      const { PhantomInviteGenerator } = await import('./generatePhantomInvite.js');
      const phantomGenerator = new PhantomInviteGenerator();
      
      if (this.config.phantomInvites?.enabled) {
        batch.phantoms = await phantomGenerator.generatePhantomBatch(
          batch.invites.length,
          batch.timestamp,
          { realInvites: batch.invites }
        );
      }

      // 2. Combine real and phantom invites
      const allInvites = [...batch.invites, ...batch.phantoms];

      // 3. Apply temporal randomization
      const mixedInvites = await this.applyTemporalMixing(allInvites, batch.timestamp);

      // 4. Cryptographic shuffle
      const shuffledInvites = this.cryptographicShuffle(mixedInvites);

      // 5. Release invites to the system
      const results = await this.releaseInviteBatch(shuffledInvites, batch);

      // 6. Clean up
      await this.completeBatch(batchId, results);

      console.log(`[MIXING] Batch ${batchId} processed successfully: ${results.real} real + ${results.phantom} phantom invites`);

    } catch (error) {
      console.error(`[MIXING] Error processing batch ${batchId}:`, error);
      batch.status = 'error';
      batch.error = error.message;
    }
  }

  /**
   * Apply temporal randomization to invites
   */
  async applyTemporalMixing(invites, batchTimestamp) {
    const windowMs = this.config.temporalMixing.batchWindowMs;
    const randomizationRange = this.config.temporalMixing.randomizationRange;

    return invites.map(invite => {
      // Generate random timestamp within the batch window
      const randomOffset = Math.random() * windowMs * randomizationRange;
      const mixedTimestamp = batchTimestamp + randomOffset;

      return {
        ...invite,
        // Update public timestamp (what external observers see)
        timestamp: mixedTimestamp,
        
        // Preserve original timing in secure audit trail
        _mixing: {
          ...invite._mixing,
          originalTimestamp: invite._mixing?.originalTimestamp || invite.timestamp,
          mixedTimestamp,
          randomizationSeed: randomBytes(16).toString('hex')
        }
      };
    });
  }

  /**
   * Cryptographically secure shuffle
   */
  cryptographicShuffle(array) {
    const shuffled = [...array];
    
    // Fisher-Yates shuffle with cryptographic randomness
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Generate cryptographically secure random index
      const randomBytes = crypto.getRandomValues(new Uint32Array(1));
      const j = randomBytes[0] % (i + 1);
      
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Release processed batch to the main system
   */
  async releaseInviteBatch(invites, batch) {
    let realCount = 0;
    let phantomCount = 0;

    for (const invite of invites) {
      try {
        if (invite._phantom?.isPhantom) {
          // Handle phantom invite
          await this.storePhantomInvite(invite);
          phantomCount++;
        } else {
          // Handle real invite
          await this.storeRealInvite(invite);
          realCount++;
        }
      } catch (error) {
        console.error('[MIXING] Error storing invite:', error);
      }
    }

    // Audit the batch release
    await this.logBatchRelease(batch, { real: realCount, phantom: phantomCount });

    return { real: realCount, phantom: phantomCount, total: invites.length };
  }

  /**
   * Store real invite in the system
   */
  async storeRealInvite(invite) {
    // Remove mixing metadata before storing
    const cleanInvite = { ...invite };
    delete cleanInvite._mixing;

    // Store in main invite system
    // (In production, this would integrate with the main database)
    console.log(`[MIXING] Storing real invite: ${invite.id} at ${new Date(invite.timestamp).toISOString()}`);
    
    // Trigger any downstream processing
    await this.notifyInviteProcessed(cleanInvite, 'real');
  }

  /**
   * Store phantom invite separately
   */
  async storePhantomInvite(invite) {
    // Store phantom in separate phantom tracking system
    console.log(`[MIXING] Storing phantom invite: ${invite.id} at ${new Date(invite.timestamp).toISOString()}`);
    
    // Phantom invites go to phantom-only storage
    await this.notifyInviteProcessed(invite, 'phantom');
  }

  /**
   * Notify main system that invite has been processed
   */
  async notifyInviteProcessed(invite, type) {
    // Emit event or call callback for integration with main system
    if (this.onInviteProcessed) {
      await this.onInviteProcessed(invite, type);
    }
  }

  /**
   * Complete batch processing and cleanup
   */
  async completeBatch(batchId, results) {
    const batch = this.pendingBatches.get(batchId);
    if (batch) {
      batch.status = 'completed';
      batch.completedAt = Date.now();
      batch.results = results;
    }

    // Clear timer
    if (this.batchTimers.has(batchId)) {
      clearTimeout(this.batchTimers.get(batchId));
      this.batchTimers.delete(batchId);
    }

    // Archive batch (keep for audit)
    setTimeout(() => {
      this.pendingBatches.delete(batchId);
    }, 24 * 60 * 60 * 1000); // Keep for 24 hours
  }

  /**
   * Get current batch timestamp
   */
  getCurrentBatchTimestamp() {
    const windowMs = this.config.temporalMixing.batchWindowMs;
    const now = Date.now();
    
    // Round down to nearest batch window
    return Math.floor(now / windowMs) * windowMs;
  }

  /**
   * Generate batch ID
   */
  generateBatchId(timestamp) {
    return createHash('sha256')
      .update(`batch_${timestamp}_${this.config.temporalMixing.batchWindow}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Process invite immediately (when mixing is disabled)
   */
  async processImmediately(inviteData) {
    console.log('[MIXING] Processing invite immediately (mixing disabled)');
    await this.storeRealInvite(inviteData);
    return {
      success: true,
      processed: 'immediately',
      timestamp: Date.now()
    };
  }

  /**
   * Audit logging methods
   */
  async logInviteQueued(invite) {
    const logEntry = {
      timestamp: Date.now(),
      event: 'invite_queued_for_mixing',
      inviteId: invite.id,
      batchId: invite._mixing.batchId,
      originalTimestamp: invite._mixing.originalTimestamp
    };
    
    this.auditTrail.push(logEntry);
    console.log('[AUDIT] Invite queued for mixing:', logEntry);
  }

  async logBatchRelease(batch, results) {
    const logEntry = {
      timestamp: Date.now(),
      event: 'batch_released',
      batchId: batch.id,
      batchTimestamp: batch.timestamp,
      results,
      processingTime: Date.now() - batch.createdAt
    };
    
    this.auditTrail.push(logEntry);
    console.log('[AUDIT] Batch released:', logEntry);
  }

  /**
   * Get mixing statistics
   */
  getMixingStats() {
    const activeBatches = Array.from(this.pendingBatches.values())
      .filter(batch => batch.status === 'collecting');
    
    return {
      activeBatches: activeBatches.length,
      totalInvitesQueued: activeBatches.reduce((sum, batch) => sum + batch.invites.length, 0),
      batchWindow: this.config.temporalMixing.batchWindow,
      mixingEnabled: this.config.temporalMixing.enabled,
      nextBatchRelease: activeBatches.length > 0 ? 
        Math.min(...activeBatches.map(b => b.timestamp + this.config.temporalMixing.batchWindowMs)) : null
    };
  }

  /**
   * Emergency disable mixing (for rollback)
   */
  emergencyDisable() {
    console.warn('[MIXING] Emergency disable activated - processing all pending batches immediately');
    
    for (const [batchId, batch] of this.pendingBatches.entries()) {
      if (batch.status === 'collecting') {
        this.processBatch(batchId);
      }
    }
    
    this.config.temporalMixing.enabled = false;
  }
}

export default TemporalMixingEngine;
export { TemporalMixingEngine };
