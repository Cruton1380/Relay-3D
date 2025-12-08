// Simple import test
console.log('🔍 Testing critical imports...');

try {
  const { regionalGovernanceService } = await import('./backend/services/regionalGovernanceService.mjs');
  console.log('✅ regionalGovernanceService imported');
} catch (e) {
  console.error('❌ regionalGovernanceService failed:', e.message);
}

try {
  const { PasswordDanceMatcher } = await import('./backend/ml/passwordDanceMatcher.mjs');
  console.log('✅ PasswordDanceMatcher imported');
} catch (e) {
  console.error('❌ PasswordDanceMatcher failed:', e.message);
}

try {
  const authService = await import('./src/backend/auth/index.mjs');
  console.log('✅ authService imported');
} catch (e) {
  console.error('❌ authService failed:', e.message);
}

console.log('🎯 Import test complete');
