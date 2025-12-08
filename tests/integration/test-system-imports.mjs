// Simple import test
console.log('🔍 Testing system imports and functionality...');

async function testImports() {
  try {
    console.log('1. Testing core imports...');
    
    // Test blockchain service
    const { default: blockchainService } = await import('./src/backend/blockchain-service/index.mjs');
    console.log('   ✅ Blockchain service imported');
    
    // Test password dance matcher
    const { default: PasswordDanceMatcher } = await import('./backend/ml/passwordDanceMatcher.mjs');
    console.log('   ✅ Password dance matcher imported');
    
    // Test group onboarding service
    const { GroupOnboardingService } = await import('./src/backend/onboarding/groupOnboardingService.mjs');
    console.log('   ✅ Group onboarding service imported');
    
    console.log('\n2. Testing basic functionality...');
    
    // Test creating a password dance matcher instance
    const matcher = new PasswordDanceMatcher();
    console.log('   ✅ Password dance matcher instance created');
    
    console.log('\n✅ All critical imports and basic functionality working!');
    
  } catch (error) {
    console.error('❌ Import test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testImports();
