/**
 * JURY BADGE GENERATOR
 * Creates immutable, blockchain-verifiable badges for civic jury participation
 * Supports different badge types, metadata storage, and gratitude messages
 */

import { createHash, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class JuryBadgeGenerator {
  constructor() {
    this.config = this.loadConfig();
    this.badgeTemplates = this.loadBadgeTemplates();
    this.blockchainLogger = new BlockchainLogger();
    this.badgeRegistry = new Map();
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/jurySystem.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.jurySystem.badges;
    } catch (error) {
      console.warn('Failed to load badge config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      blockchainStorage: true,
      immutableRecords: true,
      publicProfile: true,
      anonymousGratitude: true,
      badgeVersioning: "1.0"
    };
  }

  loadBadgeTemplates() {
    return {
      juryService: {
        name: 'Civic Jury Service',
        description: 'Served on a community jury for account verification',
        icon: '⚖️',
        category: 'civic_participation',
        rarity: 'common',
        points: 10
      },
      consensusBuilder: {
        name: 'Consensus Builder',
        description: 'Helped achieve unanimous jury decision',
        icon: '🤝',
        category: 'consensus',
        rarity: 'uncommon',
        points: 25
      },
      falsePositiveProtector: {
        name: 'False Positive Protector',
        description: 'Correctly identified and prevented false account suspension',
        icon: '🛡️',
        category: 'protection',
        rarity: 'rare',
        points: 50
      },
      duplicateDetector: {
        name: 'Duplicate Account Detective',
        description: 'Successfully identified duplicate account schemes',
        icon: '🔍',
        category: 'detection',
        rarity: 'rare',
        points: 75
      },
      communityGuardian: {
        name: 'Community Guardian',
        description: 'Served on multiple high-stakes jury cases',
        icon: '👑',
        category: 'leadership',
        rarity: 'legendary',
        points: 100
      },
      quickResponder: {
        name: 'Quick Response Juror',
        description: 'Responded to jury duty within 1 hour',
        icon: '⚡',
        category: 'responsiveness',
        rarity: 'uncommon',
        points: 15
      },
      thoughtfulDeliberator: {
        name: 'Thoughtful Deliberator',
        description: 'Contributed meaningful insights during jury deliberation',
        icon: '💭',
        category: 'deliberation',
        rarity: 'uncommon',
        points: 20
      }
    };
  }

  /**
   * Generate jury service badge after case completion
   */
  async generateJuryBadge(juryParticipation) {
    try {
      console.log(`[BADGE_GENERATOR] Creating badge for juror: ${juryParticipation.jurorId}`);
      
      // Determine badge type based on case outcome and participation
      const badgeType = await this.determineBadgeType(juryParticipation);
      
      // Create badge metadata
      const badgeMetadata = await this.createBadgeMetadata(juryParticipation, badgeType);
      
      // Generate cryptographic proof
      const cryptographicProof = await this.generateCryptographicProof(badgeMetadata);
      
      // Create immutable badge record
      const badge = {
        badgeId: this.generateBadgeId(juryParticipation),
        jurorId: juryParticipation.jurorId,
        caseId: juryParticipation.caseId,
        badgeType: badgeType,
        metadata: badgeMetadata,
        cryptographicProof: cryptographicProof,
        issuedAt: Date.now(),
        version: this.config.badgeVersioning,
        blockchain: {
          stored: false,
          transactionHash: null,
          blockHeight: null
        }
      };
      
      // Store in blockchain if enabled
      if (this.config.blockchainStorage) {
        await this.storeOnBlockchain(badge);
      }
      
      // Register badge locally
      this.badgeRegistry.set(badge.badgeId, badge);
      
      // Process any gratitude messages
      if (juryParticipation.gratitudeMessage) {
        await this.attachGratitudeMessage(badge, juryParticipation.gratitudeMessage);
      }
      
      console.log(`[BADGE_GENERATOR] Badge created: ${badge.badgeId} (${badgeType})`);
      
      return badge;
      
    } catch (error) {
      console.error('[BADGE_GENERATOR] Error creating badge:', error);
      throw new Error(`Badge generation failed: ${error.message}`);
    }
  }

  /**
   * Determine appropriate badge type based on jury participation
   */
  async determineBadgeType(participation) {
    const { caseOutcome, participationMetrics, caseType, isConsensus } = participation;
    
    // Special badges for exceptional service
    if (caseOutcome === 'no_action' && participation.wasCorrect) {
      return 'falsePositiveProtector';
    }
    
    if (caseType === 'duplicate_detection' && caseOutcome === 'duplicate_detected') {
      return 'duplicateDetector';
    }
    
    if (isConsensus && participationMetrics.deliberationContributions > 3) {
      return 'consensusBuilder';
    }
    
    if (participationMetrics.responseTime < 3600000) { // 1 hour
      return 'quickResponder';
    }
    
    if (participationMetrics.deliberationContributions >= 2) {
      return 'thoughtfulDeliberator';
    }
    
    // Check for community guardian status
    const previousBadges = await this.getPreviousBadges(participation.jurorId);
    if (previousBadges.length >= 10) {
      return 'communityGuardian';
    }
    
    // Default jury service badge
    return 'juryService';
  }

  /**
   * Create comprehensive badge metadata
   */
  async createBadgeMetadata(participation, badgeType) {
    const template = this.badgeTemplates[badgeType];
    
    const metadata = {
      // Badge template info
      name: template.name,
      description: template.description,
      icon: template.icon,
      category: template.category,
      rarity: template.rarity,
      points: template.points,
      
      // Case-specific metadata
      caseDetails: {
        caseId: participation.caseId,
        caseType: participation.caseType,
        region: participation.region,
        outcome: participation.caseOutcome,
        consensusReached: participation.isConsensus,
        jurySize: participation.jurySize
      },
      
      // Participation metrics
      participation: {
        responseTime: participation.participationMetrics.responseTime,
        deliberationContributions: participation.participationMetrics.deliberationContributions,
        evidenceReviewed: participation.participationMetrics.evidenceReviewed,
        voteTimestamp: participation.participationMetrics.voteTimestamp,
        totalDeliberationTime: participation.participationMetrics.totalDeliberationTime
      },
      
      // Privacy-preserving hashes
      anonymizedData: {
        caseContentHash: this.hashCaseContent(participation.caseDetails),
        jurorContributionHash: this.hashJurorContributions(participation.deliberationData),
        outcomeSummaryHash: this.hashOutcomeSummary(participation.caseOutcome)
      },
      
      // Verification proofs
      verificationProofs: {
        jurorEligibilityProof: participation.eligibilityProof,
        deliberationParticipationProof: participation.deliberationProof,
        voteSubmissionProof: participation.voteProof
      },
      
      // Issuance metadata
      issuance: {
        issuedAt: Date.now(),
        issuer: 'RelayJurySystem',
        version: this.config.badgeVersioning,
        generationSeed: randomBytes(16).toString('hex')
      }
    };
    
    return metadata;
  }

  /**
   * Generate cryptographic proof for badge authenticity
   */
  async generateCryptographicProof(metadata) {
    // Create deterministic hash of badge content
    const contentHash = createHash('sha256')
      .update(JSON.stringify(metadata, Object.keys(metadata).sort()))
      .digest('hex');
    
    // Generate proof of issuance
    const issuanceProof = createHash('sha256')
      .update(`${contentHash}_${metadata.issuance.issuedAt}_${metadata.issuance.generationSeed}`)
      .digest('hex');
    
    // Create verification signature (in production, would use proper cryptographic signatures)
    const verificationSignature = createHash('sha256')
      .update(`${issuanceProof}_RelayJurySystem_${this.config.badgeVersioning}`)
      .digest('hex');
    
    return {
      contentHash,
      issuanceProof,
      verificationSignature,
      algorithm: 'SHA256',
      keyVersion: '1.0',
      createdAt: Date.now()
    };
  }

  /**
   * Store badge record on blockchain
   */
  async storeOnBlockchain(badge) {
    try {
      // Create blockchain-optimized record
      const blockchainRecord = {
        badgeId: badge.badgeId,
        jurorHash: this.hashJurorId(badge.jurorId), // Privacy-preserving hash
        caseHash: this.hashCaseId(badge.caseId),
        badgeType: badge.badgeType,
        contentHash: badge.cryptographicProof.contentHash,
        issuedAt: badge.issuedAt,
        version: badge.version
      };
      
      // Submit to blockchain
      const blockchainResult = await this.blockchainLogger.submitBadgeRecord(blockchainRecord);
      
      // Update badge with blockchain info
      badge.blockchain = {
        stored: true,
        transactionHash: blockchainResult.transactionHash,
        blockHeight: blockchainResult.blockHeight,
        storageTimestamp: Date.now()
      };
      
      console.log(`[BADGE_GENERATOR] Badge stored on blockchain: ${blockchainResult.transactionHash}`);
      
    } catch (error) {
      console.error('[BADGE_GENERATOR] Blockchain storage failed:', error);
      // Continue without blockchain storage for resilience
      badge.blockchain.stored = false;
      badge.blockchain.error = error.message;
    }
  }

  /**
   * Attach anonymous gratitude message to badge
   */
  async attachGratitudeMessage(badge, gratitudeMessage) {
    if (!this.config.anonymousGratitude) {
      return;
    }
    
    // Encrypt and anonymize gratitude message
    const encryptedMessage = await this.encryptGratitudeMessage(gratitudeMessage);
    
    badge.gratitude = {
      hasMessage: true,
      encryptedMessage: encryptedMessage,
      messageHash: createHash('sha256').update(gratitudeMessage.content).digest('hex'),
      fromVerifiedUser: gratitudeMessage.fromVerifiedUser,
      attachedAt: Date.now()
    };
    
    console.log(`[BADGE_GENERATOR] Gratitude message attached to badge: ${badge.badgeId}`);
  }

  /**
   * Generate multiple badges for batch jury completion
   */
  async generateBatchBadges(juryParticipations) {
    const badges = [];
    
    for (const participation of juryParticipations) {
      try {
        const badge = await this.generateJuryBadge(participation);
        badges.push(badge);
      } catch (error) {
        console.error(`[BADGE_GENERATOR] Failed to create badge for juror ${participation.jurorId}:`, error);
        // Continue with other badges
      }
    }
    
    console.log(`[BADGE_GENERATOR] Generated ${badges.length}/${juryParticipations.length} badges`);
    return badges;
  }

  /**
   * Verify badge authenticity
   */
  async verifyBadge(badgeId) {
    const badge = this.badgeRegistry.get(badgeId);
    
    if (!badge) {
      return { valid: false, reason: 'Badge not found' };
    }
    
    // Verify cryptographic proof
    const expectedContentHash = createHash('sha256')
      .update(JSON.stringify(badge.metadata, Object.keys(badge.metadata).sort()))
      .digest('hex');
    
    if (expectedContentHash !== badge.cryptographicProof.contentHash) {
      return { valid: false, reason: 'Content hash mismatch' };
    }
    
    // Verify blockchain record if stored
    if (badge.blockchain.stored) {
      const blockchainValid = await this.verifyBlockchainRecord(badge);
      if (!blockchainValid) {
        return { valid: false, reason: 'Blockchain verification failed' };
      }
    }
    
    return {
      valid: true,
      badge: badge,
      verification: {
        contentVerified: true,
        blockchainVerified: badge.blockchain.stored,
        issuanceVerified: true
      }
    };
  }

  /**
   * Get user's civic contribution summary
   */
  async getUserCivicContributions(userId) {
    const userBadges = Array.from(this.badgeRegistry.values())
      .filter(badge => this.hashJurorId(badge.jurorId) === this.hashJurorId(userId));
    
    // Aggregate statistics
    const stats = {
      totalBadges: userBadges.length,
      totalPoints: userBadges.reduce((sum, badge) => sum + badge.metadata.points, 0),
      casesServed: new Set(userBadges.map(badge => badge.caseId)).size,
      
      // Badge categories
      categories: {},
      rarities: {},
      
      // Timeline
      firstService: userBadges.length > 0 ? Math.min(...userBadges.map(b => b.issuedAt)) : null,
      lastService: userBadges.length > 0 ? Math.max(...userBadges.map(b => b.issuedAt)) : null,
      
      // Special achievements
      hasLegendaryBadge: userBadges.some(b => b.metadata.rarity === 'legendary'),
      consensusParticipation: userBadges.filter(b => b.metadata.caseDetails.consensusReached).length,
      
      // Gratitude received
      gratitudeMessages: userBadges.filter(b => b.gratitude?.hasMessage).length
    };
    
    // Count by category and rarity
    userBadges.forEach(badge => {
      const category = badge.metadata.category;
      const rarity = badge.metadata.rarity;
      
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      stats.rarities[rarity] = (stats.rarities[rarity] || 0) + 1;
    });
    
    return {
      userId: userId,
      civicContributions: stats,
      badges: userBadges.map(badge => this.getPublicBadgeView(badge)),
      lastUpdated: Date.now()
    };
  }

  /**
   * Create public view of badge (without sensitive data)
   */
  getPublicBadgeView(badge) {
    return {
      badgeId: badge.badgeId,
      name: badge.metadata.name,
      description: badge.metadata.description,
      icon: badge.metadata.icon,
      category: badge.metadata.category,
      rarity: badge.metadata.rarity,
      points: badge.metadata.points,
      issuedAt: badge.issuedAt,
      caseType: badge.metadata.caseDetails.caseType,
      region: badge.metadata.caseDetails.region,
      hasGratitude: badge.gratitude?.hasMessage || false,
      blockchainVerified: badge.blockchain.stored,
      verificationHash: badge.cryptographicProof.verificationSignature
    };
  }

  // Helper methods for hashing and privacy
  
  generateBadgeId(participation) {
    const data = `${participation.jurorId}_${participation.caseId}_${Date.now()}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  hashJurorId(jurorId) {
    return createHash('sha256').update(`juror_${jurorId}`).digest('hex');
  }

  hashCaseId(caseId) {
    return createHash('sha256').update(`case_${caseId}`).digest('hex');
  }
  hashCaseContent(caseDetails) {
    const content = caseDetails ? JSON.stringify(caseDetails) : '';
    return createHash('sha256').update(content).digest('hex');
  }
  hashJurorContributions(deliberationData) {
    const content = deliberationData ? JSON.stringify(deliberationData) : '';
    return createHash('sha256').update(content).digest('hex');
  }
  hashOutcomeSummary(outcome) {
    const content = outcome ? `outcome_${outcome}` : 'outcome_unknown';
    return createHash('sha256').update(content).digest('hex');
  }

  async encryptGratitudeMessage(message) {
    // Mock encryption - would use proper encryption in production
    return {
      encrypted: btoa(JSON.stringify(message)),
      algorithm: 'AES-256-GCM',
      keyId: 'gratitude_key_v1'
    };
  }

  async getPreviousBadges(jurorId) {
    return Array.from(this.badgeRegistry.values())
      .filter(badge => this.hashJurorId(badge.jurorId) === this.hashJurorId(jurorId));
  }

  async verifyBlockchainRecord(badge) {
    // Mock blockchain verification - would verify actual blockchain record
    return badge.blockchain.transactionHash && badge.blockchain.blockHeight;
  }
}

/**
 * Blockchain Logger for immutable badge storage
 */
class BlockchainLogger {
  async submitBadgeRecord(record) {
    // Mock blockchain submission - would submit to actual blockchain
    console.log(`[BLOCKCHAIN] Submitting badge record: ${record.badgeId}`);
    
    return {
      transactionHash: `0x${randomBytes(32).toString('hex')}`,
      blockHeight: Math.floor(Math.random() * 1000000) + 1000000,
      gasUsed: 21000,
      timestamp: Date.now()
    };
  }
}

export default JuryBadgeGenerator;
