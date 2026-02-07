/**
 * PHANTOM INVITE GENERATOR
 * Creates synthetic invites indistinguishable from real ones for privacy protection
 */

import { randomBytes, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PhantomInviteGenerator {
  constructor() {
    this.config = this.loadConfig();
    this.phantomPool = new Set();
    this.realisticNames = this.loadRealisticData();
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../config/invitePrivacy.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.invitePrivacy;
    } catch (error) {
      console.warn('Failed to load invite privacy config, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      phantomInvites: {
        enabled: true,
        phantomRatio: 0.10,
        phantomPrefix: 'ph_'
      },
      security: {
        auditLogging: true
      }
    };
  }

  loadRealisticData() {
    // Realistic data for phantom generation
    return {
      firstNames: [
        'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 
        'Cameron', 'Quinn', 'Sage', 'Blake', 'Rowan', 'Skylar', 'River'
      ],
      lastNames: [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 
        'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'
      ],
      cities: [
        'Springfield', 'Franklin', 'Georgetown', 'Clinton', 'Madison',
        'Washington', 'Arlington', 'Fairview', 'Salem', 'Bristol'
      ]
    };
  }

  /**
   * Generate a cryptographically secure phantom invite
   * Indistinguishable from real invites to external observers
   */
  async generatePhantomInvite(batchTimestamp, realInviteContext = {}) {
    const phantomId = await this.generatePhantomId();
    const phantom = {
      // Public metadata (indistinguishable from real)
      id: phantomId,
      inviterId: await this.generatePhantomInviterHash(realInviteContext),
      timestamp: this.generateRealisticTimestamp(batchTimestamp),
      location: this.generateRealisticLocation(),
      
      // Phantom-specific metadata (internal only)
      _phantom: {
        isPhantom: true,
        phantomPrefix: this.config.phantomInvites.phantomPrefix,
        generatedAt: Date.now(),
        batchId: this.generateBatchId(batchTimestamp),
        seed: randomBytes(32).toString('hex')
      },
      
      // Security flags (never exposed to public API)
      _security: {
        canVote: false,
        canInvite: false,
        canParticipate: false,
        canLogin: false,
        auditTrail: `phantom_generated_${Date.now()}`
      },
      
      // Realistic user data (for external indistinguishability)
      profile: this.generateRealisticProfile(),
      
      // Invitation metadata
      inviteData: {
        method: 'proximity_bluetooth',
        verificationLevel: 'standard',
        communityVouchers: this.generatePhantomVouchers()
      }
    };

    // Add to phantom pool for tracking
    this.phantomPool.add(phantomId);
    
    // Audit logging
    if (this.config.security.auditLogging) {
      await this.logPhantomGeneration(phantom);
    }

    return phantom;
  }

  async generatePhantomId() {
    const prefix = this.config.phantomInvites.phantomPrefix;
    const randomSuffix = randomBytes(16).toString('hex');
    const timestamp = Date.now().toString(36);
    
    // Hash to create consistent-looking ID
    const hash = createHash('sha256')
      .update(`${prefix}${randomSuffix}${timestamp}`)
      .digest('hex');
    
    return `user_${hash.substring(0, 16)}`;
  }

  async generatePhantomInviterHash(context) {
    // Generate realistic inviter hash based on real invite patterns
    const baseHash = randomBytes(32).toString('hex');
    
    // If we have context from real invites, make it more realistic
    if (context.commonInviterPatterns) {
      const pattern = context.commonInviterPatterns[
        Math.floor(Math.random() * context.commonInviterPatterns.length)
      ];
      return createHash('sha256')
        .update(`${pattern}_${baseHash}`)
        .digest('hex')
        .substring(0, 32);
    }
    
    return `inviter_${baseHash.substring(0, 32)}`;
  }

  generateRealisticTimestamp(batchTimestamp) {
    // Generate timestamp within the batch window that looks realistic
    const windowMs = this.config.temporalMixing?.batchWindowMs || 3600000; // 1 hour
    const randomOffset = Math.random() * windowMs;
    
    return batchTimestamp + randomOffset;
  }

  generateRealisticLocation() {
    const city = this.realisticNames.cities[
      Math.floor(Math.random() * this.realisticNames.cities.length)
    ];
    
    return {
      city,
      region: 'Region_' + Math.floor(Math.random() * 50),
      country: 'US',
      coordinates: {
        // Approximate coordinates (not exact for privacy)
        lat: (Math.random() * 60) + 20, // 20-80 degrees
        lng: (Math.random() * 120) - 180 // -180 to -60 degrees
      }
    };
  }

  generateRealisticProfile() {
    const firstName = this.realisticNames.firstNames[
      Math.floor(Math.random() * this.realisticNames.firstNames.length)
    ];
    const lastName = this.realisticNames.lastNames[
      Math.floor(Math.random() * this.realisticNames.lastNames.length)
    ];
    
    return {
      displayName: `${firstName} ${lastName}`,
      joinedDate: this.generateRealisticJoinDate(),
      profileImageHash: this.generateProfileImageHash(),
      bio: this.generateRealisticBio(),
      interests: this.generateRealisticInterests()
    };
  }

  generateRealisticJoinDate() {
    // Generate join date within last 2 years
    const twoYearsAgo = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000);
    const randomTime = Math.random() * (Date.now() - twoYearsAgo);
    return new Date(twoYearsAgo + randomTime).toISOString();
  }

  generateProfileImageHash() {
    // Generate hash that looks like a real profile image hash
    return createHash('sha256')
      .update(randomBytes(32))
      .digest('hex')
      .substring(0, 16);
  }

  generateRealisticBio() {
    const bios = [
      'Community organizer passionate about local politics',
      'Teacher and parent advocating for education reform',
      'Small business owner supporting economic development',
      'Environmental activist working on sustainability',
      'Tech worker interested in digital rights',
      'Healthcare professional focused on public health'
    ];
    
    return bios[Math.floor(Math.random() * bios.length)];
  }

  generateRealisticInterests() {
    const allInterests = [
      'local_politics', 'education', 'environment', 'healthcare',
      'technology', 'economics', 'transportation', 'housing',
      'arts_culture', 'public_safety', 'infrastructure'
    ];
    
    // Select 2-4 random interests
    const count = 2 + Math.floor(Math.random() * 3);
    const selected = [];
    
    while (selected.length < count) {
      const interest = allInterests[Math.floor(Math.random() * allInterests.length)];
      if (!selected.includes(interest)) {
        selected.push(interest);
      }
    }
    
    return selected;
  }

  generatePhantomVouchers() {
    // Generate 1-3 phantom vouchers
    const count = 1 + Math.floor(Math.random() * 3);
    const vouchers = [];
    
    for (let i = 0; i < count; i++) {
      vouchers.push({
        voucherId: this.generatePhantomId(),
        voucherType: 'community_member',
        trustLevel: 0.6 + (Math.random() * 0.3), // 0.6 - 0.9
        relationship: ['neighbor', 'coworker', 'friend', 'community_member'][
          Math.floor(Math.random() * 4)
        ]
      });
    }
    
    return vouchers;
  }

  generateBatchId(batchTimestamp) {
    return createHash('sha256')
      .update(`batch_${batchTimestamp}`)
      .digest('hex')
      .substring(0, 16);
  }  /**
   * Security validation - check if user is phantom
   */
  async isPhantom(userId) {
    // Check phantom pool first
    if (this.phantomPool.has(userId)) {
      return true;
    }
    
    // Check phantom prefix
    const prefix = this.config.phantomInvites.phantomPrefix;
    if (userId.includes(prefix)) {
      return true;
    }
    
    // Check if ID follows phantom pattern (user_[hex] from phantom generation)
    if (userId.startsWith('user_') && userId.length === 21) {
      // Additional heuristic check for phantom-generated IDs
      const hash = userId.substring(5);
      if (/^[0-9a-f]{16}$/.test(hash)) {
        // This is likely a phantom-generated ID pattern
        return true;
      }
    }
    
    // Enhanced pattern matching for various phantom ID formats
    // Check for typical phantom ID patterns: user_[16-char hex]
    const phantomPattern = /^user_[0-9a-f]{16}$/;
    if (phantomPattern.test(userId)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate multiple phantoms for a batch
   */
  async generatePhantomBatch(realInviteCount, batchTimestamp, context = {}) {
    if (!this.config.phantomInvites.enabled) {
      return [];
    }
    
    const phantomCount = Math.floor(realInviteCount * this.config.phantomInvites.phantomRatio);
    const phantoms = [];
    
    for (let i = 0; i < phantomCount; i++) {
      const phantom = await this.generatePhantomInvite(batchTimestamp, context);
      phantoms.push(phantom);
    }
    
    return phantoms;
  }

  /**
   * Audit logging for phantom generation
   */
  async logPhantomGeneration(phantom) {
    const logEntry = {
      timestamp: Date.now(),
      event: 'phantom_invite_generated',
      phantomId: phantom.id,
      batchId: phantom._phantom.batchId,
      seed: phantom._phantom.seed,
      realInviteContext: 'batch_processing'
    };
    
    // In production, this would write to secure audit log
    console.log('[AUDIT] Phantom Invite Generated:', {
      id: phantom.id,
      batchId: phantom._phantom.batchId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get phantom statistics for monitoring
   */
  getPhantomStats() {
    return {
      totalPhantoms: this.phantomPool.size,
      phantomRatio: this.config.phantomInvites.phantomRatio,
      enabled: this.config.phantomInvites.enabled,
      configSource: 'config/invitePrivacy.json'
    };
  }
}

export default PhantomInviteGenerator;
export { PhantomInviteGenerator };
