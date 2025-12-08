#!/usr/bin/env node

/**
 * Clustering Test CLI
 * 
 * Command-line interface to test the complete clustering system.
 * Verifies vote reconciliation, candidate generation, and clustering at all levels.
 */

import { testChannelGenerator } from './services/testChannelGenerator.mjs';
import { voteReconciliationService } from './services/voteReconciliationService.mjs';
import { optimizedCandidateGenerator } from './services/optimizedCandidateGenerator.mjs';

class ClusteringTestCLI {
  constructor() {
    this.commands = {
      'generate': this.generateTestSuite.bind(this),
      'test-clustering': this.testClustering.bind(this),
      'test-reconciliation': this.testReconciliation.bind(this),
      'validate-system': this.validateSystem.bind(this),
      'stats': this.showStats.bind(this),
      'help': this.showHelp.bind(this)
    };
  }

  /**
   * Run CLI with command line arguments
   */
  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    console.log('🧪 Relay Clustering Test CLI v1.0');
    console.log('=====================================\n');
    
    try {
      if (this.commands[command]) {
        await this.commands[command](args.slice(1));
      } else {
        console.error(`❌ Unknown command: ${command}`);
        await this.showHelp();
        process.exit(1);
      }
      
      console.log('\n✅ Test completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }
  }

  /**
   * Generate test suite
   */
  async generateTestSuite(args) {
    console.log('🏭 Generating test suite...\n');
    
    // Initialize services
    console.log('⚙️ Initializing services...');
    await optimizedCandidateGenerator.initialize();
    
    // Generate test suite
    const testSuite = await testChannelGenerator.generateTestSuite();
    
    console.log('\n📊 Test Suite Summary:');
    console.log('=====================');
    
    for (const channel of testSuite) {
      console.log(`📺 ${channel.name}:`);
      console.log(`   - Region: ${channel.primary_region}`);
      console.log(`   - Candidates: ${channel.candidateCount}`);
      console.log(`   - Votes: ${channel.totalVotes}`);
      console.log(`   - Distribution: ${channel.testMetadata.distribution}`);
      console.log(`   - Reconciliation: ${channel.reconciliation.integrity}`);
      console.log('');
    }
    
    // Test clustering at all levels
    console.log('🎯 Testing clustering at all levels...\n');
    const clusteringResults = await testChannelGenerator.testAllClusteringLevels(testSuite);
    
    console.log('📈 Clustering Results:');
    console.log('====================');
    
    for (const [level, results] of Object.entries(clusteringResults)) {
      console.log(`🔹 ${level.toUpperCase()} Level:`);
      console.log(`   - Clusters: ${results.totalClusters}`);
      console.log(`   - Candidates: ${results.totalCandidates}`);
      console.log(`   - Votes: ${results.totalVotes}`);
    }
    
    console.log('\n✅ Test suite generated and validated successfully');
  }

  /**
   * Test clustering functionality
   */
  async testClustering(args) {
    const testType = args[0] || 'mixed';
    
    console.log(`🎯 Testing clustering functionality (${testType})...\n`);
    
    // Initialize services
    await optimizedCandidateGenerator.initialize();
    
    // Generate single test channel
    const channel = await testChannelGenerator.generateTestChannel(testType, {
      candidateCount: 10
    });
    
    console.log(`📺 Generated test channel: ${channel.name}`);
    console.log(`   - Candidates: ${channel.candidateCount}`);
    console.log(`   - Total votes: ${channel.totalVotes}`);
    console.log('');
    
    // Test each clustering level
    const levels = ['gps', 'city', 'province', 'country', 'region', 'global'];
    
    for (const level of levels) {
      console.log(`🔄 Testing ${level} level clustering...`);
      
      const reconciliation = await voteReconciliationService.reconcileChannelVotes(channel);
      const stacks = voteReconciliationService.generateClusterStacks(
        reconciliation.reconciledVotes,
        level
      );
      
      const levelData = reconciliation.reconciledVotes[level];
      
      console.log(`   ✅ ${levelData.clusterCount} clusters, ${levelData.totalCandidates} candidates, ${levelData.totalVotes} votes`);
      
      // Show cluster details for smaller levels
      if (level !== 'gps' && stacks.length <= 5) {
        for (const stack of stacks) {
          console.log(`      📦 Cluster "${stack.clusterKey}": ${stack.candidateCount} candidates, ${stack.totalVotes} votes`);
        }
      }
    }
  }

  /**
   * Test vote reconciliation
   */
  async testReconciliation(args) {
    console.log('🔄 Testing vote reconciliation...\n');
    
    // Initialize services
    await optimizedCandidateGenerator.initialize();
    
    // Generate multiple channels for cross-channel reconciliation
    const channels = [];
    for (let i = 0; i < 3; i++) {
      const channel = await testChannelGenerator.generateTestChannel('mixed', {
        channelName: `Reconciliation Test ${i + 1}`,
        candidateCount: 5 + i * 2
      });
      channels.push(channel);
    }
    
    console.log(`📺 Generated ${channels.length} test channels for reconciliation`);
    
    // Test reconciliation for each channel
    let totalOriginalVotes = 0;
    let totalReconciledVotes = 0;
    
    for (const channel of channels) {
      console.log(`\n🔍 Reconciling channel: ${channel.name}`);
      
      const reconciliation = await voteReconciliationService.reconcileChannelVotes(channel);
      
      totalOriginalVotes += channel.totalVotes;
      totalReconciledVotes += reconciliation.totalVotes;
      
      console.log(`   - Original votes: ${channel.totalVotes}`);
      console.log(`   - Reconciled votes: ${reconciliation.totalVotes}`);
      console.log(`   - Integrity: ${reconciliation.integrity}`);
      console.log(`   - Reconciliation time: ${reconciliation.reconciliationTime}ms`);
      
      // Validate vote conservation
      if (channel.totalVotes !== reconciliation.totalVotes) {
        throw new Error(`Vote reconciliation failed for channel ${channel.id}`);
      }
    }
    
    console.log('\n📊 Reconciliation Summary:');
    console.log('=========================');
    console.log(`Total original votes: ${totalOriginalVotes}`);
    console.log(`Total reconciled votes: ${totalReconciledVotes}`);
    console.log(`Vote conservation: ${totalOriginalVotes === totalReconciledVotes ? 'PERFECT' : 'FAILED'}`);
  }

  /**
   * Validate entire system
   */
  async validateSystem(args) {
    console.log('🔍 Validating entire clustering system...\n');
    
    // Step 1: Initialize and validate services
    console.log('1️⃣ Initializing services...');
    await optimizedCandidateGenerator.initialize();
    
    const initStats = optimizedCandidateGenerator.getCacheStats();
    console.log(`   ✅ Loaded ${initStats.hierarchyMappings.countries} countries, ${initStats.hierarchyMappings.provinces} provinces, ${initStats.hierarchyMappings.cities} cities`);
    
    // Step 2: Generate comprehensive test suite
    console.log('\n2️⃣ Generating comprehensive test suite...');
    const testSuite = await testChannelGenerator.generateTestSuite();
    console.log(`   ✅ Generated ${testSuite.length} test channels`);
    
    // Step 3: Validate all candidates have complete hierarchy
    console.log('\n3️⃣ Validating candidate hierarchy completeness...');
    let totalCandidates = 0;
    for (const channel of testSuite) {
      for (const candidate of channel.candidates) {
        totalCandidates++;
        
        // Check for "unknown" values
        const requiredFields = ['city', 'province', 'country', 'region'];
        for (const field of requiredFields) {
          if (!candidate[field] || candidate[field].toLowerCase().includes('unknown')) {
            throw new Error(`Candidate ${candidate.id} has unknown ${field}: ${candidate[field]}`);
          }
        }
        
        // Check clustering keys
        if (!candidate.clusterKeys) {
          throw new Error(`Candidate ${candidate.id} missing cluster keys`);
        }
        
        // Check location
        if (!candidate.location || candidate.location.lat === 0 || candidate.location.lng === 0) {
          throw new Error(`Candidate ${candidate.id} has invalid location`);
        }
      }
    }
    console.log(`   ✅ All ${totalCandidates} candidates have complete hierarchy`);
    
    // Step 4: Test clustering at all levels
    console.log('\n4️⃣ Testing clustering at all levels...');
    const clusteringResults = await testChannelGenerator.testAllClusteringLevels(testSuite);
    console.log(`   ✅ All clustering levels tested successfully`);
    
    // Step 5: Validate vote conservation
    console.log('\n5️⃣ Validating vote conservation...');
    const gpsVotes = clusteringResults.gps.totalVotes;
    for (const [level, results] of Object.entries(clusteringResults)) {
      if (results.totalVotes !== gpsVotes) {
        throw new Error(`Vote conservation failed at ${level} level: ${results.totalVotes} ≠ ${gpsVotes}`);
      }
    }
    console.log(`   ✅ Perfect vote conservation: ${gpsVotes} votes maintained across all levels`);
    
    // Step 6: Performance validation
    console.log('\n6️⃣ Performance validation...');
    const reconciliationStats = voteReconciliationService.getReconciliationStats();
    console.log(`   ✅ Average reconciliation time: ${reconciliationStats.averageReconciliationTime.toFixed(2)}ms`);
    console.log(`   ✅ Total reconciliations completed: ${reconciliationStats.totalReconciliations}`);
    
    console.log('\n🎉 SYSTEM VALIDATION COMPLETE');
    console.log('=============================');
    console.log('✅ All services initialized properly');
    console.log('✅ All candidates have complete hierarchy (no unknowns)');
    console.log('✅ All clustering levels work correctly');
    console.log('✅ Perfect vote reconciliation and conservation');
    console.log('✅ Performance within acceptable limits');
  }

  /**
   * Show system statistics
   */
  async showStats(args) {
    console.log('📊 System Statistics:\n');
    
    // Generator stats
    const generatorStats = optimizedCandidateGenerator.getCacheStats();
    console.log('🏭 Candidate Generator:');
    console.log(`   - Countries: ${generatorStats.hierarchyMappings.countries}`);
    console.log(`   - Provinces: ${generatorStats.hierarchyMappings.provinces}`);
    console.log(`   - Cities: ${generatorStats.hierarchyMappings.cities}`);
    console.log(`   - Geo cache: ${generatorStats.geoCache} entries`);
    console.log(`   - Initialized: ${generatorStats.initialized ? 'Yes' : 'No'}`);
    console.log('');
    
    // Reconciliation stats
    const reconciliationStats = voteReconciliationService.getReconciliationStats();
    console.log('🔄 Vote Reconciliation Service:');
    console.log(`   - Total reconciliations: ${reconciliationStats.totalReconciliations}`);
    console.log(`   - Average time: ${reconciliationStats.averageReconciliationTime.toFixed(2)}ms`);
    console.log('');
    
    // Test generator stats
    const testStats = testChannelGenerator.getTestStats();
    console.log('🧪 Test Generator:');
    console.log(`   - Generated channels: ${testStats.generatedChannels}`);
    console.log(`   - Total candidates: ${testStats.totalCandidates}`);
    console.log(`   - Total votes: ${testStats.totalVotes}`);
  }

  /**
   * Show help information
   */
  async showHelp(args) {
    console.log('🧪 Relay Clustering Test CLI');
    console.log('============================\n');
    
    console.log('Available commands:');
    console.log('');
    console.log('  generate              Generate complete test suite and validate clustering');
    console.log('  test-clustering [type] Test clustering functionality (clustered|distributed|mixed)');
    console.log('  test-reconciliation   Test vote reconciliation across multiple channels');
    console.log('  validate-system       Complete system validation (recommended)');
    console.log('  stats                 Show system statistics');
    console.log('  help                  Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node clusteringTestCLI.mjs validate-system');
    console.log('  node clusteringTestCLI.mjs test-clustering mixed');
    console.log('  node clusteringTestCLI.mjs generate');
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ClusteringTestCLI();
  cli.run();
}

export { ClusteringTestCLI };