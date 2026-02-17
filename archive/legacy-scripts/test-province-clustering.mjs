#!/usr/bin/env node

/**
 * Test Province-Based Clustering
 * 
 * This script verifies that province-based coordinate generation
 * and clustering works correctly for all countries including Australia.
 * 
 * Usage: node scripts/test-province-clustering.mjs
 */

import unifiedBoundaryService from '../src/backend/services/unifiedBoundaryService.mjs';
import provinceDataService from '../src/backend/services/provinceDataService.mjs';

async function testProvinceClustering() {
  console.log('🧪 Testing Province-Based Clustering System\n');
  console.log('='.repeat(80));

  // Test countries
  const testCountries = ['IT', 'ES', 'FR', 'US', 'CA', 'AU', 'CN', 'JP'];

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  for (const countryCode of testCountries) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Testing: ${countryCode}`);
    console.log('─'.repeat(80));

    try {
      // Test 1: Get country data
      const countryData = await provinceDataService.getCountryData(countryCode);
      
      if (!countryData) {
        results.warnings.push(`${countryCode}: No country data found`);
        console.log(`⚠️  No country data for ${countryCode} - will use fallback`);
        continue;
      }

      console.log(`✅ Country: ${countryData.name}`);
      console.log(`   Continent: ${countryData.continent}`);
      console.log(`   Provinces: ${countryData.provinces?.length || 0}`);

      if (!countryData.provinces || countryData.provinces.length === 0) {
        results.warnings.push(`${countryCode}: No province data - will use country-level clustering`);
        console.log(`⚠️  No provinces - will cluster at country level`);
        continue;
      }

      // Test 2: Generate coordinates for multiple candidates
      console.log(`\n📍 Generating coordinates for 5 candidates:`);
      const candidates = [];

      for (let i = 0; i < 5; i++) {
        const coordData = await unifiedBoundaryService.generateCandidateCoordinates(countryCode);
        
        if (!coordData) {
          results.failed.push(`${countryCode}: Failed to generate coordinates`);
          console.log(`❌ Failed to generate coordinates for candidate ${i + 1}`);
          break;
        }

        candidates.push(coordData);
        
        console.log(`   ${i + 1}. ${coordData.province || 'No Province'} - [${coordData.location.lat.toFixed(4)}, ${coordData.location.lng.toFixed(4)}]`);

        // Verify province field is set
        if (!coordData.province) {
          results.warnings.push(`${countryCode}: Candidate ${i + 1} missing province field`);
          console.log(`      ⚠️  Province field not set!`);
        }
      }

      // Test 3: Verify province distribution
      const provinces = candidates.map(c => c.province).filter(Boolean);
      const uniqueProvinces = new Set(provinces);
      
      console.log(`\n📊 Province Distribution:`);
      console.log(`   Total candidates: ${candidates.length}`);
      console.log(`   With province: ${provinces.length}`);
      console.log(`   Unique provinces: ${uniqueProvinces.size}`);
      console.log(`   Provinces: ${Array.from(uniqueProvinces).join(', ')}`);

      // Test 4: Verify province centroids
      console.log(`\n🎯 Testing Province Centroids:`);
      for (const provinceName of uniqueProvinces) {
        const centroid = await provinceDataService.getProvinceCentroid(provinceName, countryCode);
        
        if (centroid) {
          console.log(`   ✅ ${provinceName}: [${centroid[1].toFixed(3)}, ${centroid[0].toFixed(3)}]`);
        } else {
          results.warnings.push(`${countryCode}: No centroid for province ${provinceName}`);
          console.log(`   ⚠️  ${provinceName}: No centroid available`);
        }
      }

      // Test 5: Verify clustering would work
      console.log(`\n🔗 Clustering Simulation:`);
      const clusters = new Map();
      
      candidates.forEach((candidate, idx) => {
        const clusterKey = candidate.province || countryCode;
        if (!clusters.has(clusterKey)) {
          clusters.set(clusterKey, {
            name: clusterKey,
            candidates: [],
            centroid: null
          });
        }
        clusters.get(clusterKey).candidates.push(`Candidate ${idx + 1}`);
      });

      for (const [clusterKey, cluster] of clusters) {
        console.log(`   📌 Cluster "${clusterKey}": ${cluster.candidates.length} candidates`);
      }

      // Determine success
      if (provinces.length === candidates.length && uniqueProvinces.size > 1) {
        results.passed.push(`${countryCode}: ✅ All candidates have provinces, distributed across ${uniqueProvinces.size} provinces`);
        console.log(`\n✅ ${countryCode}: PASSED - Province-based clustering working correctly`);
      } else if (provinces.length > 0) {
        results.warnings.push(`${countryCode}: ⚠️ Some candidates missing province data (${provinces.length}/${candidates.length})`);
        console.log(`\n⚠️  ${countryCode}: PARTIAL - Some province data missing`);
      } else {
        results.failed.push(`${countryCode}: ❌ No province data in candidates`);
        console.log(`\n❌ ${countryCode}: FAILED - No province data`);
      }

    } catch (error) {
      results.failed.push(`${countryCode}: ❌ Error: ${error.message}`);
      console.log(`\n❌ ${countryCode}: ERROR - ${error.message}`);
    }
  }

  // Final report
  console.log(`\n${'='.repeat(80)}`);
  console.log('FINAL REPORT');
  console.log('='.repeat(80));

  console.log(`\n✅ PASSED (${results.passed.length}):`);
  results.passed.forEach(msg => console.log(`   ${msg}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(msg => console.log(`   ${msg}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED (${results.failed.length}):`);
    results.failed.forEach(msg => console.log(`   ${msg}`));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const total = testCountries.length;
  const passed = results.passed.length;
  const failed = results.failed.length;
  const warnings = results.warnings.length;

  console.log(`Total countries tested: ${total}`);
  console.log(`Passed: ${passed} (${(passed/total*100).toFixed(1)}%)`);
  console.log(`Warnings: ${warnings}`);
  console.log(`Failed: ${failed} (${(failed/total*100).toFixed(1)}%)`);

  if (failed === 0 && warnings === 0) {
    console.log(`\n🎉 ALL TESTS PASSED! Province-based clustering is working perfectly.`);
    return 0;
  } else if (failed === 0) {
    console.log(`\n✅ All tests passed with ${warnings} warnings. System is functional.`);
    return 0;
  } else {
    console.log(`\n❌ Some tests failed. Please review the failures above.`);
    return 1;
  }
}

// Run tests
testProvinceClustering()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Fatal error running tests:', error);
    process.exit(1);
  });
