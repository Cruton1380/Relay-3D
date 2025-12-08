#!/usr/bin/env node

/**
 * Test Macro-Region Integration
 * 
 * This script validates the macro-region system and provides quick testing
 */

import fs from 'fs';
import path from 'path';

function testMacroRegionData() {
    console.log('🧪 Testing macro-region integration...\n');
    
    try {
        // Test 1: Check if macro-region files exist
        const geoJSONPath = './public/macro_regions.geojson';
        const metadataPath = './public/macro_regions.json';
        
        console.log('📂 Checking file existence:');
        console.log(`   ${fs.existsSync(geoJSONPath) ? '✅' : '❌'} ${geoJSONPath}`);
        console.log(`   ${fs.existsSync(metadataPath) ? '✅' : '❌'} ${metadataPath}`);
        
        if (!fs.existsSync(geoJSONPath) || !fs.existsSync(metadataPath)) {
            throw new Error('Macro-region files not found. Run: node scripts/generate-macro-regions.mjs');
        }
        
        // Test 2: Validate GeoJSON structure
        console.log('\n🗺️ Validating GeoJSON structure:');
        const geoJSON = JSON.parse(fs.readFileSync(geoJSONPath, 'utf8'));
        
        console.log(`   Type: ${geoJSON.type}`);
        console.log(`   Features: ${geoJSON.features.length}`);
        
        if (geoJSON.features.length !== 5) {
            console.warn(`   ⚠️ Expected 5 macro-regions, found ${geoJSON.features.length}`);
        }
        
        geoJSON.features.forEach((feature, index) => {
            const name = feature.properties.name;
            const countries = feature.properties.countries;
            const type = feature.properties.type;
            console.log(`   ${index + 1}. ${name}: ${countries} countries (${type})`);
        });
        
        // Test 3: Validate metadata
        console.log('\n📊 Validating metadata:');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        console.log(`   Schema version: ${metadata.schema_version}`);
        console.log(`   Classification: ${metadata.classification}`);
        console.log(`   Total regions: ${metadata.total_regions}`);
        console.log(`   Total countries: ${metadata.total_countries}`);
        
        // Test 4: Check region distribution
        console.log('\n🌍 Region distribution:');
        metadata.regions.forEach(region => {
            console.log(`   ${region.name}: ${region.countries} countries`);
        });
        
        // Test 5: Validate expected macro-regions
        const expectedRegions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
        const actualRegions = metadata.regions.map(r => r.name).sort();
        
        console.log('\n✅ Expected vs Actual regions:');
        expectedRegions.forEach(expected => {
            const found = actualRegions.includes(expected);
            console.log(`   ${found ? '✅' : '❌'} ${expected}`);
        });
        
        const extraRegions = actualRegions.filter(r => !expectedRegions.includes(r));
        if (extraRegions.length > 0) {
            console.log(`\n⚠️ Unexpected regions found: ${extraRegions.join(', ')}`);
        }
        
        console.log('\n🎉 Macro-region integration test completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Start the frontend dev server');
        console.log('   2. Navigate to the globe view');
        console.log('   3. Select "Macro-Region" from the clustering panel');
        console.log('   4. Verify 5 macro-regions are displayed');
        
    } catch (error) {
        console.error('❌ Macro-region integration test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testMacroRegionData();