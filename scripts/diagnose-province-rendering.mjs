#!/usr/bin/env node

/**
 * Diagnostic Script: Province Rendering Analysis
 * 
 * This script fetches Natural Earth province data and analyzes why
 * some countries render properly while others (like Australia) may not.
 * 
 * Usage: node scripts/diagnose-province-rendering.mjs
 */

import fetch from 'node-fetch';

const NATURAL_EARTH_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

async function diagnoseProvinceRendering() {
  console.log('🔍 Diagnosing Province Rendering Issues...\n');

  try {
    console.log(`📡 Fetching Natural Earth data from:\n   ${NATURAL_EARTH_URL}\n`);
    
    const response = await fetch(NATURAL_EARTH_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.features.length} total province features\n`);

    // Countries we're interested in
    const targetCountries = ['Italy', 'Spain', 'Australia', 'France', 'United States', 'Canada', 'China'];

    // Analyze each target country
    const countryAnalysis = {};

    for (const country of targetCountries) {
      const features = data.features.filter(f => {
        const admin = f.properties.admin || f.properties.ADMIN || f.properties.sovereignt || f.properties.SOVEREIGNT || '';
        return admin.toLowerCase() === country.toLowerCase() ||
               (country === 'United States' && admin.toLowerCase() === 'united states of america');
      });

      countryAnalysis[country] = {
        found: features.length,
        provinces: [],
        geometryStats: {
          totalSize: 0,
          maxSize: 0,
          minSize: Infinity,
          avgSize: 0,
          largestProvince: null
        },
        geometryTypes: {},
        potentialIssues: []
      };

      // Analyze each province
      features.forEach(feature => {
        const provinceName = feature.properties.name || feature.properties.NAME || 'Unknown';
        const geomType = feature.geometry.type;
        const geomSize = JSON.stringify(feature.geometry.coordinates).length;
        const geomSizeMB = geomSize / 1024 / 1024;

        countryAnalysis[country].provinces.push({
          name: provinceName,
          type: geomType,
          sizeMB: geomSizeMB.toFixed(2),
          coordCount: countCoordinates(feature.geometry)
        });

        countryAnalysis[country].geometryStats.totalSize += geomSize;
        
        if (geomSize > countryAnalysis[country].geometryStats.maxSize) {
          countryAnalysis[country].geometryStats.maxSize = geomSize;
          countryAnalysis[country].geometryStats.largestProvince = provinceName;
        }
        
        if (geomSize < countryAnalysis[country].geometryStats.minSize) {
          countryAnalysis[country].geometryStats.minSize = geomSize;
        }

        // Track geometry types
        countryAnalysis[country].geometryTypes[geomType] = 
          (countryAnalysis[country].geometryTypes[geomType] || 0) + 1;

        // Check for potential issues
        if (geomSize > 10000000) { // 10MB limit from code
          countryAnalysis[country].potentialIssues.push(
            `⚠️  ${provinceName}: Exceeds 10MB limit (${geomSizeMB.toFixed(2)} MB)`
          );
        }

        if (geomSize > 50000000) { // Extreme size
          countryAnalysis[country].potentialIssues.push(
            `❌ ${provinceName}: Extremely large (${geomSizeMB.toFixed(2)} MB) - will definitely fail`
          );
        }

        if (geomType === 'GeometryCollection') {
          countryAnalysis[country].potentialIssues.push(
            `⚠️  ${provinceName}: Uses GeometryCollection (may not be supported)`
          );
        }
      });

      // Calculate average size
      if (features.length > 0) {
        countryAnalysis[country].geometryStats.avgSize = 
          countryAnalysis[country].geometryStats.totalSize / features.length;
      }
    }

    // Print comprehensive analysis
    console.log('═'.repeat(80));
    console.log('COMPREHENSIVE PROVINCE RENDERING ANALYSIS');
    console.log('═'.repeat(80));
    console.log();

    for (const [country, analysis] of Object.entries(countryAnalysis)) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`🌍 ${country.toUpperCase()}`);
      console.log(`${'─'.repeat(80)}`);
      
      console.log(`\n📊 Overview:`);
      console.log(`   Provinces found: ${analysis.found}`);
      console.log(`   Geometry types: ${Object.entries(analysis.geometryTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);
      
      console.log(`\n📏 Size Statistics:`);
      console.log(`   Total size: ${(analysis.geometryStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Average size: ${(analysis.geometryStats.avgSize / 1024 / 1024).toFixed(2)} MB per province`);
      console.log(`   Largest: ${analysis.geometryStats.largestProvince} (${(analysis.geometryStats.maxSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   Smallest: ${(analysis.geometryStats.minSize / 1024 / 1024).toFixed(2)} MB`);

      if (analysis.potentialIssues.length > 0) {
        console.log(`\n⚠️  POTENTIAL ISSUES (${analysis.potentialIssues.length}):`);
        analysis.potentialIssues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log(`\n✅ No issues detected - should render correctly`);
      }

      console.log(`\n📋 All Provinces:`);
      // Sort by size descending
      analysis.provinces.sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB));
      analysis.provinces.forEach((prov, idx) => {
        const flag = parseFloat(prov.sizeMB) > 10 ? '⚠️ ' : '✓ ';
        console.log(`   ${flag} ${(idx + 1).toString().padStart(2)}. ${prov.name.padEnd(30)} | ${prov.type.padEnd(12)} | ${prov.sizeMB.padStart(6)} MB | ${prov.coordCount.toLocaleString().padStart(8)} coords`);
      });
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log('COMPARISON: Why Italy/Spain Work but Australia Doesn\'t');
    console.log('═'.repeat(80));
    console.log();

    // Compare working vs problematic countries
    const working = ['Italy', 'Spain'];
    const problematic = ['Australia'];

    console.log('Working Countries (Italy, Spain):');
    working.forEach(country => {
      const analysis = countryAnalysis[country];
      if (analysis) {
        console.log(`   ${country}: ${analysis.found} provinces, avg ${(analysis.geometryStats.avgSize / 1024 / 1024).toFixed(2)} MB, max ${(analysis.geometryStats.maxSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`           Issues: ${analysis.potentialIssues.length}`);
      }
    });

    console.log('\nProblematic Countries (Australia):');
    problematic.forEach(country => {
      const analysis = countryAnalysis[country];
      if (analysis) {
        console.log(`   ${country}: ${analysis.found} provinces, avg ${(analysis.geometryStats.avgSize / 1024 / 1024).toFixed(2)} MB, max ${(analysis.geometryStats.maxSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`           Issues: ${analysis.potentialIssues.length}`);
      }
    });

    console.log('\n🔍 KEY FINDING:');
    const italyMax = countryAnalysis['Italy']?.geometryStats.maxSize || 0;
    const australiaMax = countryAnalysis['Australia']?.geometryStats.maxSize || 0;
    const ratio = (australiaMax / italyMax).toFixed(1);
    
    console.log(`   Australia's largest province is ${ratio}x larger than Italy's largest`);
    console.log(`   This is likely why filtering/processing fails for Australia but not Italy`);

    console.log(`\n${'═'.repeat(80)}`);
    console.log('RECOMMENDATIONS');
    console.log('═'.repeat(80));
    console.log();

    if (countryAnalysis['Australia']?.potentialIssues.length > 0) {
      console.log('❌ Australia WILL have rendering issues with current code');
      console.log('\n💡 Recommended fixes:');
      console.log('   1. Increase complexity limit in BoundaryStreamingService.mjs:');
      console.log('      Change line 795: > 10000000 → > 50000000');
      console.log('   2. Add country-specific complexity thresholds');
      console.log('   3. Use lower-resolution data for large countries (50m instead of 10m)');
      console.log('   4. Implement progressive loading for large provinces');
    } else {
      console.log('✅ Australia should render correctly with current code');
      console.log('   If issues persist, check:');
      console.log('   - Browser console for runtime errors');
      console.log('   - Entity registration/duplicate detection');
      console.log('   - Cesium viewer entity limits');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    process.exit(1);
  }
}

/**
 * Count total coordinates in a geometry
 */
function countCoordinates(geometry) {
  let count = 0;
  
  function countRecursive(coords) {
    if (Array.isArray(coords)) {
      if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        // This is a coordinate pair
        return 1;
      } else {
        // This is an array of arrays
        return coords.reduce((sum, item) => sum + countRecursive(item), 0);
      }
    }
    return 0;
  }
  
  if (geometry.type === 'Polygon') {
    count = countRecursive(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    count = countRecursive(geometry.coordinates);
  } else if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach(geom => {
      count += countCoordinates(geom);
    });
  }
  
  return count;
}

// Run diagnosis
diagnoseProvinceRendering().then(() => {
  console.log('\n✅ Diagnosis complete\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Diagnosis failed:', error);
  process.exit(1);
});
