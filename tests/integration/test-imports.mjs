// Test service imports
console.log('Testing service imports...');

try {
  console.log('Testing hardware scanning service...');
  const hardwareService = await import('../../src/backend/hardware-scanning-service/index.mjs');
  console.log('✅ Hardware scanning service imported successfully');
} catch (error) {
  console.error('❌ Hardware scanning service import failed:', error.message);
}

try {
  console.log('Testing channel service...');
  const channelService = await import('../../src/backend/channel-service/index.mjs');
  console.log('✅ Channel service imported successfully');
} catch (error) {
  console.error('❌ Channel service import failed:', error.message);
}

try {
  console.log('Testing social service...');
  const socialService = await import('../../src/backend/social-service/index.mjs');
  console.log('✅ Social service imported successfully');
} catch (error) {
  console.error('❌ Social service import failed:', error.message);
}

console.log('Import tests completed.');
