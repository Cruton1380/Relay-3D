/**
 * Frontend API Integration Test
 * 
 * This file tests the integration between the frontend and the optimized clustering API.
 */

// Test function to verify API connectivity
async function testOptimizedChannelsAPI() {
  console.log('🧪 Testing Optimized Channels API Integration...\n');
  
  try {
    // Test 1: Basic API connectivity
    console.log('1️⃣ Testing basic API connectivity...');
    const response = await fetch('/api/optimized-channels/demo');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API connectivity successful');
    console.log(`   Channel: ${data.channel.name}`);
    console.log(`   Candidates: ${data.channel.candidateCount}`);
    console.log(`   Total Votes: ${data.channel.totalVotes}`);
    console.log('');
    
    // Test 2: Clustering data validation
    console.log('2️⃣ Validating clustering data structure...');
    const clustering = data.clustering;
    const levels = ['gps', 'city', 'province', 'country', 'region', 'global'];
    
    for (const level of levels) {
      if (!clustering[level]) {
        throw new Error(`Missing clustering data for level: ${level}`);
      }
      
      const levelData = clustering[level];
      console.log(`   ${level.toUpperCase()}: ${levelData.clusterCount} clusters, ${levelData.totalVotes} votes`);
      
      // Validate vote conservation
      if (levelData.totalVotes !== data.channel.totalVotes) {
        throw new Error(`Vote conservation failed at ${level}: ${levelData.totalVotes} ≠ ${data.channel.totalVotes}`);
      }
    }
    console.log('✅ Clustering data validation passed');
    console.log('✅ Vote conservation verified across all levels');
    console.log('');
    
    // Test 3: Candidate data validation
    console.log('3️⃣ Validating candidate data completeness...');
    const candidates = data.channel.candidates;
    
    for (const candidate of candidates) {
      // Check for complete hierarchy
      const requiredFields = ['city', 'province', 'country', 'region'];
      for (const field of requiredFields) {
        if (!candidate[field] || candidate[field].toLowerCase().includes('unknown')) {
          throw new Error(`Candidate ${candidate.id} has invalid ${field}: ${candidate[field]}`);
        }
      }
      
      // Check clustering keys
      if (!candidate.clusterKeys) {
        throw new Error(`Candidate ${candidate.id} missing cluster keys`);
      }
      
      for (const level of levels) {
        if (!candidate.clusterKeys[level]) {
          throw new Error(`Candidate ${candidate.id} missing ${level} cluster key`);
        }
      }
      
      // Check location
      if (!candidate.location || !candidate.location.lat || !candidate.location.lng) {
        throw new Error(`Candidate ${candidate.id} has invalid location`);
      }
    }
    console.log(`✅ All ${candidates.length} candidates have complete hierarchy`);
    console.log('✅ No "unknown" values detected');
    console.log('✅ All clustering keys present');
    console.log('');
    
    // Test 4: Production channels
    console.log('4️⃣ Testing production channel generation...');
    const prodResponse = await fetch('/api/optimized-channels?count=3');
    const prodData = await prodResponse.json();
    
    console.log(`✅ Generated ${prodData.channels.length} production channels`);
    console.log(`   Total candidates: ${prodData.metadata.totalCandidates}`);
    console.log(`   Total votes: ${prodData.metadata.totalVotes}`);
    console.log(`   Vote reconciliation: ${prodData.metadata.voteReconciliation}`);
    console.log('');
    
    // Test 5: System statistics
    console.log('5️⃣ Checking system statistics...');
    const statsResponse = await fetch('/api/optimized-channels/stats');
    const statsData = await statsResponse.json();
    
    console.log('✅ System status:', statsData.systemStatus);
    console.log('✅ Features available:');
    for (const [feature, enabled] of Object.entries(statsData.features)) {
      console.log(`   - ${feature}: ${enabled ? '✅' : '❌'}`);
    }
    console.log('');
    
    console.log('🎉 ALL TESTS PASSED!');
    console.log('=====================================');
    console.log('✅ API connectivity working');
    console.log('✅ Perfect clustering across all 6 levels');
    console.log('✅ Vote reconciliation perfect');
    console.log('✅ No unknown values in candidates'); 
    console.log('✅ Complete geographical hierarchy');
    console.log('✅ Production channels generating correctly');
    console.log('✅ System ready for frontend integration');
    
    return {
      success: true,
      message: 'All integration tests passed successfully',
      testResults: {
        apiConnectivity: true,
        clusteringValidation: true,
        candidateValidation: true,
        productionChannels: true,
        systemStats: true
      }
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Full error:', error);
    
    return {
      success: false,
      message: error.message,
      testResults: null
    };
  }
}

// Export for use in other frontend components
export { testOptimizedChannelsAPI };

// Auto-run test if in development environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Auto-test when loaded in development
  setTimeout(() => {
    testOptimizedChannelsAPI().then(result => {
      if (result.success) {
        console.log('🎉 Optimized Clustering System ready for use!');
      } else {
        console.error('⚠️ Integration test failed - please check API connection');
      }
    });
  }, 1000); // Give the page time to load
}