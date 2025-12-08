/**
 * COMPREHENSIVE TEST SUITE FOR PHASE 1 INVITE PRIVACY UPGRADE
 * Tests temporal mixing, phantom injection, and system integration
 */

import { expect } from 'chai';
import InviteProcessor from '../../../src/backend/inviteProcessor.mjs';
import TemporalMixingEngine from '../../../src/lib/temporalMixingEngine.js';
import PhantomInviteGenerator from '../../../src/lib/generatePhantomInvite.js';
import InternalMetricsLogger from '../../../src/lib/internalMetricsLogger.js';

describe('Phase 1 Invite Privacy Upgrade', () => {
  let inviteProcessor;
  let mixingEngine; 
  let phantomGenerator;
  let metricsLogger;

  beforeEach(() => {
    inviteProcessor = new InviteProcessor();
    mixingEngine = new TemporalMixingEngine();
    phantomGenerator = new PhantomInviteGenerator();
    metricsLogger = new InternalMetricsLogger();
  });

  afterEach(() => {
    if (metricsLogger) {
      metricsLogger.close();
    }
  });
  describe('Temporal Mixing Engine', () => {
    it('should batch invites into time windows', async () => {
      const invites = [];
      
      // Create multiple invites
      for (let i = 0; i < 10; i++) {
        const invite = {
          id: `user_${i}`,
          inviterId: `inviter_${i}`,
          inviteeId: `invitee_${i}`,
          timestamp: Date.now()
        };
        
        const result = await mixingEngine.queueInvite(invite);
        invites.push(result);
        
        expect(result.success).to.be.true;
        expect(result.batchId).to.be.a('string');
        expect(result.scheduledRelease).to.be.a('number');
      }
      
      // All invites should be in the same batch (within 1 hour window)
      const batchIds = invites.map(r => r.batchId);
      const uniqueBatchIds = [...new Set(batchIds)];
      expect(uniqueBatchIds.length).to.equal(1);
      
      console.log(`✅ Successfully batched ${invites.length} invites into batch ${uniqueBatchIds[0]}`);
    });

    it('should randomize timestamps within batch window', async () => {
      const originalTimestamps = [];
      const processedTimestamps = [];
      
      // Create test batch
      const batchTimestamp = mixingEngine.getCurrentBatchTimestamp();
      const testInvites = [];
      
      for (let i = 0; i < 5; i++) {
        const invite = {
          id: `user_test_${i}`,
          inviterId: `inviter_test_${i}`,
          timestamp: Date.now() + i * 1000 // Sequential timestamps
        };
        
        originalTimestamps.push(invite.timestamp);
        testInvites.push(invite);
      }
      
      // Apply temporal mixing
      const mixedInvites = await mixingEngine.applyTemporalMixing(testInvites, batchTimestamp);
      
      mixedInvites.forEach(invite => {
        processedTimestamps.push(invite.timestamp);
      });
      
      // Verify timestamps are randomized
      expect(processedTimestamps).to.not.deep.equal(originalTimestamps);
      
      // Verify all timestamps are within the batch window
      const windowMs = mixingEngine.config.temporalMixing.batchWindowMs;
      processedTimestamps.forEach(timestamp => {
        expect(timestamp).to.be.at.least(batchTimestamp);
        expect(timestamp).to.be.at.most(batchTimestamp + windowMs);
      });
      
      console.log('✅ Timestamps successfully randomized within batch window');
    });

    it('should cryptographically shuffle invite order', () => {
      const originalOrder = [];
      for (let i = 0; i < 20; i++) {
        originalOrder.push({ id: `user_${i}`, order: i });
      }
      
      const shuffled = mixingEngine.cryptographicShuffle([...originalOrder]);
      
      // Verify same length
      expect(shuffled.length).to.equal(originalOrder.length);
      
      // Verify all elements present
      const originalIds = originalOrder.map(u => u.id).sort();
      const shuffledIds = shuffled.map(u => u.id).sort();
      expect(shuffledIds).to.deep.equal(originalIds);
      
      // Verify order is different (very unlikely to be same with 20 items)
      const originalOrderIds = originalOrder.map(u => u.id);
      const shuffledOrderIds = shuffled.map(u => u.id);
      expect(shuffledOrderIds).to.not.deep.equal(originalOrderIds);
      
      console.log('✅ Cryptographic shuffle verified');
    });
  });
  describe('Phantom Invite Generator', () => {
    it('should generate realistic phantom invites', async () => {
      const batchTimestamp = Date.now();
      const phantom = await phantomGenerator.generatePhantomInvite(batchTimestamp);
      
      // Verify phantom structure
      expect(phantom).to.have.property('id');
      expect(phantom).to.have.property('inviterId');
      expect(phantom).to.have.property('timestamp');
      expect(phantom).to.have.property('_phantom');
      expect(phantom).to.have.property('_security');
      expect(phantom).to.have.property('profile');
      
      // Verify phantom flags
      expect(phantom._phantom.isPhantom).to.be.true;
      expect(phantom._security.canVote).to.be.false;
      expect(phantom._security.canInvite).to.be.false;
      expect(phantom._security.canParticipate).to.be.false;
      
      // Verify realistic profile data
      expect(phantom.profile.displayName).to.be.a('string');
      expect(phantom.profile.bio).to.be.a('string');
      expect(phantom.profile.interests).to.be.an('array');
      
      console.log(`✅ Generated phantom invite: ${phantom.id}`);
    });

    it('should generate phantom batch with correct ratio', async () => {
      const realInviteCount = 100;
      const batchTimestamp = Date.now();
      
      const phantoms = await phantomGenerator.generatePhantomBatch(
        realInviteCount, 
        batchTimestamp
      );
      
      const expectedCount = Math.floor(realInviteCount * phantomGenerator.config.phantomInvites.phantomRatio);
      expect(phantoms.length).to.equal(expectedCount);
      
      // Verify all are phantoms
      phantoms.forEach(phantom => {
        expect(phantom._phantom.isPhantom).to.be.true;
      });
      
      console.log(`✅ Generated ${phantoms.length} phantoms for ${realInviteCount} real invites (ratio: ${phantomGenerator.config.phantomInvites.phantomRatio})`);
    });

    it('should correctly identify phantom users', async () => {
      const phantom = await phantomGenerator.generatePhantomInvite(Date.now());
      const realUserId = 'user_real_12345';
      
      // Test phantom detection
      const isPhantomDetected = await phantomGenerator.isPhantom(phantom.id);
      const isRealDetected = await phantomGenerator.isPhantom(realUserId);
      
      expect(isPhantomDetected).to.be.true;
      expect(isRealDetected).to.be.false;
      
      console.log('✅ Phantom detection working correctly');
    });
  });
  describe('Invite Processor Integration', () => {
    it('should process invites through privacy upgrade pipeline', async () => {
      const inviteRequest = {
        inviterId: 'real_user_123',
        inviteeId: 'new_user_456',
        location: { city: 'TestCity', region: 'TestRegion' },
        method: 'proximity_bluetooth'
      };
      
      const result = await inviteProcessor.processInvite(inviteRequest);
      
      expect(result.success).to.be.true;
      expect(result.status).to.equal('queued_for_batch_processing');
      expect(result.batchId).to.be.a('string');
      expect(result.scheduledRelease).to.be.a('number');
      
      console.log(`✅ Invite processed through privacy pipeline: batch ${result.batchId}`);
    });

    it('should prevent phantom users from sending invites', async () => {
      // First create a phantom
      const phantom = await phantomGenerator.generatePhantomInvite(Date.now());
      
      const inviteRequest = {
        inviterId: phantom.id, // Phantom trying to invite
        inviteeId: 'new_user_789',
        location: { city: 'TestCity' }
      };
      
      const result = await inviteProcessor.processInvite(inviteRequest);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Phantom users cannot send invites');
      
      console.log('✅ Phantom invite attempt correctly blocked');
    });

    it('should filter phantoms from public API responses', async () => {
      // Create a phantom
      const phantom = await phantomGenerator.generatePhantomInvite(Date.now());
      
      // Try to retrieve phantom through public API
      const result = await inviteProcessor.getInvite(phantom.id);
      
      expect(result).to.be.null; // Phantom should not be returned
      
      console.log('✅ Phantom filtered from public API');
    });
  });
  describe('System Integration Test - 100+ Invites', () => {
    it('should handle large batch with mixed real and phantom invites', async () => {
      // Vitest timeout is set in config or per-test using { timeout: 10000 }
      
      const realInvites = [];
      const batchTimestamp = Date.now();
      
      // Create 100 real invites
      for (let i = 0; i < 100; i++) {
        const invite = {
          id: `real_user_${i}`,
          inviterId: `inviter_${i % 20}`, // 20 different inviters
          inviteeId: `invitee_${i}`,
          timestamp: Date.now() + Math.random() * 10000,
          location: { city: `City_${i % 10}` }
        };
        realInvites.push(invite);
      }
      
      // Generate phantom batch
      const phantoms = await phantomGenerator.generatePhantomBatch(
        realInvites.length,
        batchTimestamp
      );
      
      // Combine and process
      const allInvites = [...realInvites, ...phantoms];
      const shuffled = mixingEngine.cryptographicShuffle(allInvites);
      
      // Verify composition
      const realCount = shuffled.filter(inv => !inv._phantom?.isPhantom).length;
      const phantomCount = shuffled.filter(inv => inv._phantom?.isPhantom).length;
      
      expect(realCount).to.equal(100);
      expect(phantomCount).to.be.above(5); // At least some phantoms
      expect(realCount + phantomCount).to.equal(shuffled.length);
      
      // Verify indistinguishability (external observer perspective)
      shuffled.forEach(invite => {
        expect(invite).to.have.property('id');
        expect(invite).to.have.property('inviterId');
        expect(invite).to.have.property('timestamp');
        expect(invite).to.have.property('location');
        // _phantom property should only be visible internally
      });
      
      // Verify phantoms have no real permissions
      const phantomInvites = shuffled.filter(inv => inv._phantom?.isPhantom);
      phantomInvites.forEach(phantom => {
        expect(phantom._security.canVote).to.be.false;
        expect(phantom._security.canInvite).to.be.false;
        expect(phantom._security.canParticipate).to.be.false;
      });
      
      console.log(`✅ Large batch test completed: ${realCount} real + ${phantomCount} phantom invites`);
      console.log(`   Phantom ratio: ${(phantomCount / (realCount + phantomCount) * 100).toFixed(1)}%`);
    });
  });
  describe('Privacy Analysis', () => {
    it('should calculate privacy improvement metrics', async () => {
      // Simulate system with activity
      const processor = new InviteProcessor();
      
      // Process several invites to generate metrics
      for (let i = 0; i < 20; i++) {
        await processor.processInvite({
          inviterId: `user_${i}`,
          inviteeId: `new_user_${i}`,
          location: { city: 'TestCity' }
        });
      }
      
      const analysis = await processor.analyzePrivacyImprovement();
      
      expect(analysis).to.have.property('temporalMixing');
      expect(analysis).to.have.property('phantomInjection'); 
      expect(analysis).to.have.property('overallPrivacy');
      
      expect(analysis.temporalMixing.correlationReduction).to.be.a('number');
      expect(analysis.phantomInjection.linkabilityReduction).to.be.a('number');
      expect(analysis.overallPrivacy.entropyIncrease).to.be.a('number');
      
      console.log('✅ Privacy analysis metrics generated:');
      console.log(`   Correlation reduction: ${(analysis.temporalMixing.correlationReduction * 100).toFixed(1)}%`);
      console.log(`   Linkability reduction: ${(analysis.phantomInjection.linkabilityReduction * 100).toFixed(1)}%`);
      console.log(`   Overall entropy increase: ${(analysis.overallPrivacy.entropyIncrease * 100).toFixed(1)}%`);
    });
  });
  describe('Configuration and Governance', () => {
    it('should allow community-votable parameter updates', async () => {
      const processor = new InviteProcessor();
      
      const newConfig = {
        phantomRatio: 0.15 // Increase from default 0.10
      };
      
      const voteResult = {
        passed: true,
        votes: { yes: 150, no: 30 },
        timestamp: Date.now()
      };
      
      await processor.updateConfig(newConfig, voteResult);
      
      const metrics = processor.getMetrics();
      expect(metrics.phantomStats.phantomRatio).to.equal(0.15);
      
      console.log('✅ Community configuration update successful');
    });

    it('should reject non-votable parameter changes', async () => {
      const processor = new InviteProcessor();
      
      const invalidConfig = {
        nonVotableParam: 'invalid'
      };
      
      try {
        await processor.updateConfig(invalidConfig);
        expect.fail('Should have thrown error for non-votable parameter');
      } catch (error) {
        expect(error.message).to.include('not community-votable');
      }
      
      console.log('✅ Non-votable parameter correctly rejected');
    });
  });

  describe('Emergency Controls', () => {
    it('should support emergency disable for rollback', () => {
      const processor = new InviteProcessor();
      
      // Verify mixing is initially enabled
      expect(processor.config.temporalMixing.enabled).to.be.true;
      
      // Emergency disable
      processor.emergencyDisable();
      
      // Verify mixing is disabled
      expect(processor.config.temporalMixing.enabled).to.be.false;
      expect(processor.config.phantomInvites.enabled).to.be.false;
      
      console.log('✅ Emergency disable functionality verified');
    });
  });
  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing invite structure', async () => {
      const legacyInvite = {
        inviterId: 'legacy_user_123',
        inviteeId: 'legacy_new_456'
        // Minimal legacy structure
      };
      
      const result = await inviteProcessor.processInvite(legacyInvite);
      
      expect(result.success).to.be.true;
      expect(result.inviteId).to.equal(legacyInvite.inviteeId);
      
      console.log('✅ Backward compatibility with legacy invites verified');
    });
  });
});

// Run the tests
console.log('🧪 Starting Phase 1 Privacy Upgrade Test Suite...\n');






