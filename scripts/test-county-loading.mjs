/**
 * Test County Loading Diagnostics
 * Tests individual country loading to diagnose timeout/500 error issues
 */

const BACKEND_URL = 'http://localhost:3002';

// Test countries by size category
const testCountries = {
  tiny: ['BEL', 'BRN'], // <50 counties
  small: ['SYR', 'TJK'], // 50-100 counties
  medium: ['PRT', 'CAN'], // 100-500 counties
  large: ['IND', 'PAK'], // 500-1500 counties
  huge: ['USA', 'CHN', 'BRA'] // 1500+ counties
};

async function testCountry(countryCode, timeout = 300000) {
  console.log(`\n📡 Testing ${countryCode}...`);
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${BACKEND_URL}/api/geoboundaries-proxy/${countryCode}/2`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (response.ok) {
      const data = await response.json();
      const countyCount = data.features?.length || 0;
      const sizeKB = (JSON.stringify(data).length / 1024).toFixed(0);
      console.log(`✅ ${countryCode}: ${countyCount} counties, ${sizeKB}KB, ${elapsed}s`);
      return { code: countryCode, success: true, counties: countyCount, time: elapsed, size: sizeKB };
    } else {
      console.log(`❌ ${countryCode}: HTTP ${response.status} after ${elapsed}s`);
      return { code: countryCode, success: false, error: response.status, time: elapsed };
    }
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const errorType = error.name === 'AbortError' ? 'TIMEOUT' : error.message;
    console.log(`❌ ${countryCode}: ${errorType} after ${elapsed}s`);
    return { code: countryCode, success: false, error: errorType, time: elapsed };
  }
}

async function runDiagnostics() {
  console.log('🔍 County Loading Diagnostics');
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Timeout: 5 minutes per country\n`);
  console.log('='$.repeat(60));
  
  const results = {
    tiny: [],
    small: [],
    medium: [],
    large: [],
    huge: []
  };
  
  // Test each category
  for (const [category, countries] of Object.entries(testCountries)) {
    console.log(`\n📊 Testing ${category.toUpperCase()} countries (${countries.join(', ')})`);
    console.log('-'.repeat(60));
    
    for (const country of countries) {
      const result = await testCountry(country, 300000); // 5 min timeout
      results[category].push(result);
      
      // Wait 2s between requests to avoid overwhelming backend
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(60));
  
  for (const [category, categoryResults] of Object.entries(results)) {
    const successCount = categoryResults.filter(r => r.success).length;
    const totalCount = categoryResults.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(0);
    
    console.log(`\n${category.toUpperCase()}: ${successCount}/${totalCount} success (${successRate}%)`);
    
    categoryResults.forEach(r => {
      const status = r.success ? '✅' : '❌';
      const details = r.success 
        ? `${r.counties} counties, ${r.size}KB, ${r.time}s`
        : `${r.error}, ${r.time}s`;
      console.log(`  ${status} ${r.code}: ${details}`);
    });
  }
  
  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  const allResults = Object.values(results).flat();
  const successfulCountries = allResults.filter(r => r.success);
  const failedCountries = allResults.filter(r => !r.success);
  
  if (successfulCountries.length === 0) {
    console.log('❌ NO COUNTRIES LOADED - Backend may not be running or is misconfigured');
  } else if (failedCountries.some(r => r.error === 500)) {
    console.log('⚠️ Backend 500 errors detected - Backend may be out of memory or crashing');
  } else if (failedCountries.some(r => r.error === 'TIMEOUT')) {
    console.log('⏱️ Timeouts detected - Network is too slow or GeoBoundaries API is down');
    
    const slowestSuccess = successfulCountries.sort((a, b) => b.time - a.time)[0];
    if (slowestSuccess) {
      console.log(`   Slowest success: ${slowestSuccess.code} (${slowestSuccess.time}s)`);
      const recommendedTimeout = Math.ceil(slowestSuccess.time * 2);
      console.log(`   Recommended timeout: ${recommendedTimeout}s`);
    }
  } else {
    console.log('✅ All test countries loaded successfully!');
  }
  
  console.log('\n');
}

// Run diagnostics
runDiagnostics().catch(console.error);

