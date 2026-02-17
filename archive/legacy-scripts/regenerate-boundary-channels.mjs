/**
 * Regenerate Boundary Channels Script
 * 
 * This script clears all cached boundary channels and regenerates them
 * with fresh geometry data from Natural Earth.
 * 
 * Usage: node regenerate-boundary-channels.mjs
 */

import boundaryChannelService from './src/backend/services/boundaryChannelService.mjs';
import { naturalEarthLoader } from './src/backend/services/naturalEarthLoader.mjs';

console.log('🔄 BOUNDARY CHANNEL REGENERATION TOOL\n');
console.log('=' .repeat(80));

// Initialize with force regenerate flag
console.log('\n📂 Step 1: Initializing Natural Earth data...');
await naturalEarthLoader.initialize();
console.log('✅ Natural Earth data loaded');

console.log('\n🧹 Step 2: Clearing all cached boundary channels...');
await boundaryChannelService.initialize(true); // Force regenerate
console.log('✅ Cache cleared');

console.log('\n🔍 Step 3: Testing sample countries...\n');

const testCountries = [
  { name: 'India', code: 'IND', type: 'country' },
  { name: 'Iran', code: 'IRN', type: 'country' },
  { name: 'United States', code: 'USA', type: 'country' },
  { name: 'China', code: 'CHN', type: 'country' },
  { name: 'Brazil', code: 'BRA', type: 'country' }
];

for (const country of testCountries) {
  const channel = await boundaryChannelService.getOrCreateBoundaryChannel(
    country.name,
    country.type,
    country.code
  );
  
  const officialCandidate = channel.candidates.find(c => c.isOfficial);
  const vertices = officialCandidate?.location?.geometry?.coordinates[0]?.length || 0;
  
  const status = vertices > 10 ? '✅' : '❌';
  console.log(`${status} ${country.name} (${country.code}): ${vertices.toLocaleString()} vertices`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ Boundary channel regeneration complete!');
console.log('\n💡 Next steps:');
console.log('   1. Restart your backend server');
console.log('   2. Test boundary editor with various countries');
console.log('   3. All countries should now show actual geometry instead of rectangles');
