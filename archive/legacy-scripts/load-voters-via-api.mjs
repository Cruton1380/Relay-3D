// scripts/load-voters-via-api.mjs
/**
 * Load test voters into the RUNNING backend via API
 */

const API_URL = 'http://localhost:3002/api/voters/bulk';

const candidates = [
  { id: 'candidate-1761087996622-0-d8ikdust4', name: 'twat Candidate 1', lat: 18.5507, lng: -68.7537 },
  { id: 'candidate-1761087996622-1-5ko8jyq1q', name: 'twat Candidate 2', lat: 7.4681, lng: 80.0437 },
  { id: 'candidate-1761087996622-2-u7hijoryl', name: 'twat Candidate 3', lat: -11.3779, lng: 21.5476 },
  { id: 'candidate-1761087996622-3-oop6ieriq', name: 'twat Candidate 4', lat: 27.5511, lng: 54.5451 }
];

const voters = [];
const votersPerCandidate = 100;

console.log('🗳️  Generating test voters...\n');

for (const candidate of candidates) {
  console.log(`📍 Generating ${votersPerCandidate} voters for ${candidate.name}...`);
  
  for (let i = 0; i < votersPerCandidate; i++) {
    const radiusDegrees = 2;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees;
    
    const lat = candidate.lat + (distance * Math.cos(angle));
    const lng = candidate.lng + (distance * Math.sin(angle));
    
    voters.push({
      userId: `test_voter_${candidate.id}_${i}`,
      candidateId: candidate.id,
      channelId: 'created-1761087996653-4de3ew0hu',
      privacyLevel: 'gps',
      location: {
        lat: lat,
        lng: lng
      }
    });
  }
}

console.log(`\n💾 Loading ${voters.length} voters via API...`);

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ voters }) // Wrap in object
  });

  const result = await response.json();
  
  if (result.success) {
    console.log(`✅ Successfully loaded ${result.inserted} voters!`);
    console.log(`⚡ Insert rate: ${result.rate}`);
    console.log('\n🎯 Now hover over a candidate in the UI to see voter towers!\n');
  } else {
    console.error(`❌ Failed: ${result.error}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ API Error: ${error.message}`);
  process.exit(1);
}

