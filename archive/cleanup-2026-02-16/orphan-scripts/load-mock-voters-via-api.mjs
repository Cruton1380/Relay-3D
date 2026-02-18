#!/usr/bin/env node

/**
 * Load Mock Voters via API
 * Calls the backend API to load mock voters for all channels
 */

console.log('🗳️  Loading mock voters via API...\n');

try {
  // Fetch all channels
  const channelsResponse = await fetch('http://localhost:3002/api/channels');
  const channelsResult = await channelsResponse.json();
  
  if (!channelsResult.success || !channelsResult.channels) {
    console.error('❌ Failed to fetch channels from backend');
    console.error('Response:', channelsResult);
    process.exit(1);
  }
  
  console.log(`📋 Found ${channelsResult.channels.length} channels\n`);
  
  let totalVoters = 0;
  
  // Load voters for each channel
  for (const channel of channelsResult.channels) {
    console.log(`⏳ Loading voters for channel: ${channel.name}...`);
    
    const response = await fetch('http://localhost:3002/api/mock-voters/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId: channel.id,
        channel: channel,
        votersPerCandidate: 100
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      totalVoters += result.totalVoters;
      console.log(`✅ ${channel.name}: Loaded ${result.totalVoters} voters`);
      console.log(`   - GPS: ${result.breakdown.gps}`);
      console.log(`   - City: ${result.breakdown.city}`);
      console.log(`   - Province: ${result.breakdown.province}`);
      console.log(`   - Country: ${result.breakdown.country}\n`);
    } else {
      console.error(`❌ Failed to load voters for ${channel.name}:`, result.error);
    }
  }
  
  console.log(`\n✅ Complete! Loaded ${totalVoters} total mock voters`);
  console.log('\n📝 Mock voters are now stored in:');
  console.log('   - authoritativeVoteLedger (voting system)');
  console.log('   - userLocationService (location data)');
  console.log('   - userPreferencesService (data granularity)');
  console.log('\n🎯 Next: Refresh your browser and hover over candidates to see voter visualization!');
  
} catch (error) {
  console.error('❌ Error loading mock voters:', error.message);
  console.error('\n💡 Make sure the backend is running on port 3002!');
  console.error('   Run: npm run dev:backend');
  process.exit(1);
}

