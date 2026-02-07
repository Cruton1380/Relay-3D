/**
 * Test Channel Generator
 * 
 * Creates test channels with optimized candidates for clustering verification.
 * Ensures perfect vote reconciliation and no "unknown" issues.
 */

import { optimizedCandidateGenerator } from './optimizedCandidateGenerator.mjs';
import { voteReconciliationService } from './voteReconciliationService.mjs';

class TestChannelGenerator {
  constructor() {
    this.generatedChannels = [];
    this.testCases = {
      // Different distribution patterns for testing
      clustered: {
        description: 'All candidates in same region/country',
        candidateCount: 5,
        distribution: 'clustered'
      },
      distributed: {
        description: 'Candidates spread across regions',
        candidateCount: 8,
        distribution: 'distributed'
      },
      mixed: {
        description: 'Mix of clustered and distributed',
        candidateCount: 12,
        distribution: 'random'
      }
    };
  }

  /**
   * Generate a complete test channel with reconciliation
   */
  async generateTestChannel(testType = 'mixed', channelConfig = {}) {
    console.log(`🧪 Generating test channel: ${testType}`);
    
    const testCase = this.testCases[testType] || this.testCases.mixed;
    const {
      channelName = `Test Channel ${testType} ${Date.now()}`,
      region = null,
      country = null,
      province = null,
      candidateCount = testCase.candidateCount,
      distribution = testCase.distribution
    } = channelConfig;

    try {
      // Generate candidates with complete hierarchy
      const candidates = await optimizedCandidateGenerator.generateCandidatesForChannel({
        candidateCount,
        region,
        country,
        province,
        distribution
      });

      // Create channel data structure
      const channel = {
        id: `test_channel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: channelName,
        type: 'test',
        
        // Channel metadata
        description: `Test channel - ${testCase.description}`,
        primary_region: candidates[0]?.region || 'Global',
        countryCode: candidates[0]?.countryCode,
        
        // Channel location (first candidate's location as reference)
        location: candidates[0]?.location ? {
          latitude: candidates[0].location.lat,
          longitude: candidates[0].location.lng,
          address: `${candidates[0].city}, ${candidates[0].province}, ${candidates[0].country}`
        } : null,
        
        // Candidates with complete hierarchy
        candidates: candidates,
        
        // Vote summary
        totalVotes: candidates.reduce((sum, c) => sum + (c.votes || 0), 0),
        candidateCount: candidates.length,
        
        // Test metadata
        testMetadata: {
          testType,
          distribution,
          generatedAt: new Date().toISOString(),
          generator: 'TestChannelGenerator'
        }
      };

      // Reconcile votes to ensure perfect clustering
      const reconciliationResult = await voteReconciliationService.reconcileChannelVotes(channel);
      
      // Add reconciliation info to channel
      channel.reconciliation = {
        reconciliationId: reconciliationResult.reconciliationId,
        totalVotes: reconciliationResult.totalVotes,
        reconciliationTime: reconciliationResult.reconciliationTime,
        integrity: reconciliationResult.integrity
      };

      // Store generated channel
      this.generatedChannels.push(channel);
      
      console.log(`✅ Generated test channel: ${channel.name}`);
      console.log(`   - ${channel.candidateCount} candidates`);
      console.log(`   - ${channel.totalVotes} total votes`);
      console.log(`   - Reconciliation: ${channel.reconciliation.integrity}`);
      
      return channel;
      
    } catch (error) {
      console.error(`❌ Failed to generate test channel ${testType}:`, error);
      throw error;
    }
  }

  /**
   * Generate a complete test suite of channels
   */
  async generateTestSuite() {
    console.log('🧪 Generating complete test suite...');
    
    const testSuite = [];
    
    try {
      // Test 1: Single region clustering (Americas)
      const americasChannel = await this.generateTestChannel('clustered', {
        channelName: 'Americas Regional Test',
        country: 'United States',
        candidateCount: 6
      });
      testSuite.push(americasChannel);

      // Test 2: Cross-region distribution
      const globalChannel = await this.generateTestChannel('distributed', {
        channelName: 'Global Distribution Test',
        candidateCount: 10
      });
      testSuite.push(globalChannel);

      // Test 3: European clustering
      const europeChannel = await this.generateTestChannel('clustered', {
        channelName: 'Europe Regional Test', 
        country: 'Germany',
        candidateCount: 4
      });
      testSuite.push(europeChannel);

      // Test 4: Asian clustering
      const asiaChannel = await this.generateTestChannel('clustered', {
        channelName: 'Asia Regional Test',
        country: 'China',
        candidateCount: 7
      });
      testSuite.push(asiaChannel);

      // Test 5: Mixed distribution
      const mixedChannel = await this.generateTestChannel('mixed', {
        channelName: 'Mixed Global Test',
        candidateCount: 15
      });
      testSuite.push(mixedChannel);

      console.log(`✅ Test suite generated: ${testSuite.length} channels`);
      
      // Validate entire test suite
      await this.validateTestSuite(testSuite);
      
      return testSuite;
      
    } catch (error) {
      console.error('❌ Test suite generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate test suite for clustering integrity
   */
  async validateTestSuite(testSuite) {
    console.log('🔍 Validating test suite...');
    
    let totalChannels = 0;
    let totalCandidates = 0;
    let totalVotes = 0;
    const clusteringLevels = ['gps', 'city', 'province', 'country', 'region', 'global'];
    
    for (const channel of testSuite) {
      totalChannels++;
      totalCandidates += channel.candidateCount;
      totalVotes += channel.totalVotes;
      
      // Validate each candidate has complete hierarchy
      for (const candidate of channel.candidates) {
        // Check for "unknown" values
        const requiredFields = ['city', 'province', 'country', 'region'];
        for (const field of requiredFields) {
          if (!candidate[field] || candidate[field].toLowerCase().includes('unknown')) {
            throw new Error(`Validation failed: Candidate ${candidate.id} has unknown ${field}`);
          }
        }
        
        // Check clustering keys
        if (!candidate.clusterKeys) {
          throw new Error(`Validation failed: Candidate ${candidate.id} missing cluster keys`);
        }
        
        for (const level of clusteringLevels) {
          if (!candidate.clusterKeys[level]) {
            throw new Error(`Validation failed: Candidate ${candidate.id} missing ${level} cluster key`);
          }
        }
        
        // Check location
        if (!candidate.location || !candidate.location.lat || !candidate.location.lng) {
          throw new Error(`Validation failed: Candidate ${candidate.id} missing location`);
        }
      }
      
      // Validate reconciliation integrity
      if (!channel.reconciliation || channel.reconciliation.integrity !== 'PERFECT') {
        throw new Error(`Validation failed: Channel ${channel.id} reconciliation not perfect`);
      }
    }
    
    console.log('✅ Test suite validation passed:');
    console.log(`   - ${totalChannels} channels`);
    console.log(`   - ${totalCandidates} candidates`);
    console.log(`   - ${totalVotes} total votes`);
    console.log(`   - All candidates have complete hierarchy`);
    console.log(`   - All reconciliations are PERFECT`);
  }

  /**
   * Test clustering at all levels
   */
  async testAllClusteringLevels(testSuite) {
    console.log('🎯 Testing clustering at all levels...');
    
    const clusteringLevels = ['gps', 'city', 'province', 'country', 'region', 'global'];
    const results = {};
    
    for (const level of clusteringLevels) {
      console.log(`🔄 Testing ${level} level clustering...`);
      
      const levelResults = {
        level,
        totalClusters: 0,
        totalCandidates: 0,
        totalVotes: 0,
        channels: []
      };
      
      for (const channel of testSuite) {
        // Reconcile at this level
        const reconciliation = await voteReconciliationService.reconcileChannelVotes(channel);
        const levelData = reconciliation.reconciledVotes[level];
        
        levelResults.totalClusters += levelData.clusterCount;
        levelResults.totalCandidates += levelData.totalCandidates;
        levelResults.totalVotes += levelData.totalVotes;
        
        levelResults.channels.push({
          channelId: channel.id,
          channelName: channel.name,
          clusters: levelData.clusterCount,
          candidates: levelData.totalCandidates,
          votes: levelData.totalVotes
        });
      }
      
      results[level] = levelResults;
      
      console.log(`✅ ${level} level: ${levelResults.totalClusters} clusters, ${levelResults.totalCandidates} candidates, ${levelResults.totalVotes} votes`);
    }
    
    // Validate vote conservation across levels
    const gpsVotes = results.gps.totalVotes;
    for (const level of clusteringLevels) {
      if (results[level].totalVotes !== gpsVotes) {
        throw new Error(`Vote conservation failed: ${level} has ${results[level].totalVotes}, GPS has ${gpsVotes}`);
      }
    }
    
    console.log('✅ Vote conservation verified across all levels');
    return results;
  }

  /**
   * Get test statistics
   */
  getTestStats() {
    return {
      generatedChannels: this.generatedChannels.length,
      totalCandidates: this.generatedChannels.reduce((sum, ch) => sum + ch.candidateCount, 0),
      totalVotes: this.generatedChannels.reduce((sum, ch) => sum + ch.totalVotes, 0),
      reconciliationStats: voteReconciliationService.getReconciliationStats(),
      generatorStats: optimizedCandidateGenerator.getCacheStats()
    };
  }

  /**
   * Clear generated test data
   */
  clearTestData() {
    this.generatedChannels = [];
    console.log('🧹 Test data cleared');
  }
}

// Export singleton instance
export const testChannelGenerator = new TestChannelGenerator();
export { TestChannelGenerator };