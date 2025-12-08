/**
 * Test Channel Generation Script
 * Tests the DevCenter channel generation API to ensure candidates are properly stored
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3002';

async function generateTestChannel(channelConfig) {
  try {
    console.log(`\n🚀 Generating channel: ${channelConfig.channelName}`);
    
    const response = await fetch(`${BACKEND_URL}/api/dev-center/channels/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(channelConfig)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Channel created: ${result.channel.name}`);
      console.log(`   📊 Candidates: ${result.channel.candidates.length}`);
      console.log(`   🗳️ Total votes: ${result.channel.totalVotes}`);
      console.log(`   🌍 Country: ${result.channel.countryName || 'Global'}`);
      return result.channel;
    } else {
      console.error(`❌ Failed to create channel: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error generating channel:`, error.message);
    return null;
  }
}

async function verifyChannelsLoaded() {
  try {
    console.log(`\n🔍 Verifying channels from API...`);
    
    const response = await fetch(`${BACKEND_URL}/api/channels`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const channels = data.channels || [];
    
    console.log(`✅ Loaded ${channels.length} channels from blockchain`);
    
    channels.forEach((channel, index) => {
      console.log(`\n   Channel ${index + 1}: ${channel.name}`);
      console.log(`   - ID: ${channel.id}`);
      console.log(`   - Candidates: ${channel.candidates?.length || 0}`);
      console.log(`   - Country: ${channel.countryName || channel.country || 'Global'}`);
      
      if (channel.candidates && channel.candidates.length > 0) {
        console.log(`   - Sample candidates:`);
        channel.candidates.slice(0, 3).forEach(c => {
          console.log(`     * ${c.name} (${c.votes || 0} votes) at [${c.location?.lat?.toFixed(4) || '?'}, ${c.location?.lng?.toFixed(4) || '?'}]`);
        });
      } else {
        console.warn(`   ⚠️ No candidates found for this channel!`);
      }
    });
    
    return channels;
  } catch (error) {
    console.error(`❌ Error verifying channels:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🔧 Testing Channel Generation System\n');
  console.log('=' .repeat(60));
  
  // Wait for backend to be ready
  console.log('\n⏳ Waiting for backend to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Generate test channels in different countries
  const testChannels = [
    {
      channelType: 'political',
      channelName: 'US Infrastructure Development',
      candidateCount: 5,
      country: 'US'
    },
    {
      channelType: 'community',
      channelName: 'UK Community Health Initiative',
      candidateCount: 4,
      country: 'GB'
    },
    {
      channelType: 'business',
      channelName: 'India Tech Startup Funding',
      candidateCount: 6,
      country: 'IN'
    },
    {
      channelType: 'political',
      channelName: 'Canada Climate Action Plan',
      candidateCount: 5,
      country: 'CA'
    }
  ];
  
  console.log(`\n📝 Creating ${testChannels.length} test channels...\n`);
  console.log('=' .repeat(60));
  
  const results = [];
  for (const config of testChannels) {
    const channel = await generateTestChannel(config);
    if (channel) {
      results.push(channel);
    }
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`\n✅ Generated ${results.length} out of ${testChannels.length} channels`);
  
  // Wait for blockchain to process
  console.log('\n⏳ Waiting for blockchain to process transactions...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verify channels are loaded correctly
  console.log('\n' + '=' .repeat(60));
  const loadedChannels = await verifyChannelsLoaded();
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 SUMMARY');
  console.log('=' .repeat(60));
  console.log(`   Channels created: ${results.length}`);
  console.log(`   Channels loaded: ${loadedChannels.length}`);
  console.log(`   Total candidates: ${loadedChannels.reduce((sum, ch) => sum + (ch.candidates?.length || 0), 0)}`);
  
  if (loadedChannels.length > 0 && loadedChannels.every(ch => ch.candidates && ch.candidates.length > 0)) {
    console.log('\n✅ SUCCESS! All channels have candidates and can generate towers.');
  } else {
    console.log('\n⚠️ WARNING: Some channels may not have candidates.');
  }
  
  console.log('\n' + '=' .repeat(60));
}

main().catch(console.error);

