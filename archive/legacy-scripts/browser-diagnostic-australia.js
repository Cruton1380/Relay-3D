/**
 * BROWSER DIAGNOSTIC SCRIPT
 * 
 * Copy and paste this entire script into your browser console while
 * the Relay app is running with the 3D globe visible.
 * 
 * This will diagnose why Australia provinces may not be rendering.
 */

(async function diagnoseAustraliaProvinces() {
  console.log('%c🔍 AUSTRALIA PROVINCE DIAGNOSTIC STARTING...', 'background: #222; color: #0f0; font-size: 16px; padding: 10px;');
  console.log('');

  const results = {
    naturalEarthData: null,
    cesiumEntities: null,
    issues: [],
    recommendations: []
  };

  // ============================================================================
  // TEST 1: Check Natural Earth Data Source
  // ============================================================================
  console.log('%c📡 TEST 1: Checking Natural Earth Data...', 'background: #333; color: #ff0; font-size: 14px; padding: 5px;');
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson');
    const data = await response.json();
    
    const australiaFeatures = data.features.filter(f => {
      const admin = (f.properties.admin || f.properties.ADMIN || f.properties.sovereignt || f.properties.SOVEREIGNT || '').toLowerCase();
      return admin.includes('australia');
    });

    results.naturalEarthData = {
      totalFeatures: data.features.length,
      australiaFeatures: australiaFeatures.length,
      provinceNames: australiaFeatures.map(f => f.properties.name || f.properties.NAME),
      geometryTypes: australiaFeatures.map(f => f.geometry.type),
      sizes: australiaFeatures.map(f => ({
        name: f.properties.name || f.properties.NAME,
        sizeMB: (JSON.stringify(f.geometry.coordinates).length / 1024 / 1024).toFixed(2)
      }))
    };

    console.log(`✅ Natural Earth has ${australiaFeatures.length} Australian provinces`);
    console.log('   Province names:', results.naturalEarthData.provinceNames);
    console.table(results.naturalEarthData.sizes);

    if (australiaFeatures.length === 0) {
      results.issues.push('❌ CRITICAL: No Australian provinces found in Natural Earth data!');
    } else if (australiaFeatures.length < 8) {
      results.issues.push(`⚠️ WARNING: Only ${australiaFeatures.length} provinces found (expected 8+)`);
    }
  } catch (error) {
    results.issues.push(`❌ CRITICAL: Failed to fetch Natural Earth data: ${error.message}`);
    console.error('❌ Natural Earth fetch failed:', error);
  }

  // ============================================================================
  // TEST 2: Check Cesium Viewer Entities
  // ============================================================================
  console.log('');
  console.log('%c🌐 TEST 2: Checking Cesium Viewer Entities...', 'background: #333; color: #ff0; font-size: 14px; padding: 5px;');

  if (typeof window.Cesium === 'undefined') {
    results.issues.push('❌ CRITICAL: Cesium library not loaded!');
    console.error('❌ Cesium not available');
  } else if (!window.earthGlobeControls || !window.earthGlobeControls.viewer) {
    results.issues.push('❌ CRITICAL: Cesium viewer not initialized!');
    console.error('❌ Viewer not available');
  } else {
    const viewer = window.earthGlobeControls.viewer;
    
    // Find all province entities
    const allProvinceEntities = viewer.entities.values.filter(e => 
      e.id && e.id.startsWith('province:')
    );

    // Find Australia-specific entities
    const australiaEntities = viewer.entities.values.filter(e => {
      if (!e.properties) return false;
      
      const country = e.properties.country ? e.properties.country.getValue() : null;
      const countryName = e.properties.countryName ? e.properties.countryName.getValue() : null;
      
      return (country && country.toLowerCase().includes('australia')) ||
             (countryName && countryName.toLowerCase().includes('australia')) ||
             (e.name && e.name.toLowerCase().includes('australia'));
    });

    results.cesiumEntities = {
      totalEntities: viewer.entities.values.length,
      totalProvinces: allProvinceEntities.length,
      australiaEntities: australiaEntities.length,
      australiaNames: australiaEntities.map(e => e.name),
      australiaVisibility: australiaEntities.map(e => ({
        name: e.name,
        visible: e.show,
        hasPolygon: e.polygon !== undefined,
        polygonShow: e.polygon ? e.polygon.show : 'N/A'
      }))
    };

    console.log(`✅ Total Cesium entities: ${viewer.entities.values.length}`);
    console.log(`✅ Total province entities: ${allProvinceEntities.length}`);
    console.log(`✅ Australia province entities: ${australiaEntities.length}`);
    
    if (australiaEntities.length > 0) {
      console.log('   Australia province names:', results.cesiumEntities.australiaNames);
      console.table(results.cesiumEntities.australiaVisibility);
    }

    if (australiaEntities.length === 0) {
      results.issues.push('❌ CRITICAL: No Australian province entities found in Cesium viewer!');
    } else if (australiaEntities.length < 8) {
      results.issues.push(`⚠️ WARNING: Only ${australiaEntities.length} Australian entities (expected 8+)`);
    }

    // Check visibility of Australia entities
    const invisibleAustraliaEntities = australiaEntities.filter(e => !e.show);
    if (invisibleAustraliaEntities.length > 0) {
      results.issues.push(`⚠️ WARNING: ${invisibleAustraliaEntities.length} Australian entities have show=false`);
    }

    // Check for polygon rendering issues
    const entitiesWithoutPolygons = australiaEntities.filter(e => !e.polygon);
    if (entitiesWithoutPolygons.length > 0) {
      results.issues.push(`⚠️ WARNING: ${entitiesWithoutPolygons.length} Australian entities missing polygon geometry`);
    }
  }

  // ============================================================================
  // TEST 3: Check Country Name Mapping
  // ============================================================================
  console.log('');
  console.log('%c🗺️ TEST 3: Checking Country Name Mapping...', 'background: #333; color: #ff0; font-size: 14px; padding: 5px;');

  if (window.earthGlobeControls && window.earthGlobeControls.regionManager) {
    const regionManager = window.earthGlobeControls.regionManager;
    
    // Check if extractCountryName method exists
    if (typeof regionManager.extractCountryName === 'function') {
      const testProperties = {
        admin: 'Australia',
        ADMIN: 'Australia',
        sovereignt: 'Australia'
      };
      
      const mappedName = regionManager.extractCountryName(testProperties);
      console.log(`✅ Country name mapping: "Australia" → "${mappedName}"`);
      
      if (mappedName !== 'Australia') {
        results.issues.push(`⚠️ WARNING: Country name mapping may be incorrect: "${mappedName}"`);
      }
    } else {
      console.log('⚠️ extractCountryName method not found (may not be an issue)');
    }

    // Check province counts
    if (regionManager.provinceCountsByCountry) {
      const australiaCount = regionManager.provinceCountsByCountry.get('Australia') || 0;
      console.log(`✅ Provinces tracked for Australia: ${australiaCount}`);
      
      if (australiaCount === 0) {
        results.issues.push('⚠️ WARNING: No provinces tracked in provinceCountsByCountry for Australia');
      }
    }
  } else {
    console.log('⚠️ RegionManager not available (may not be an issue)');
  }

  // ============================================================================
  // TEST 4: Compare with Italy/Spain (working countries)
  // ============================================================================
  console.log('');
  console.log('%c🇮🇹🇪🇸 TEST 4: Comparing with Italy and Spain...', 'background: #333; color: #ff0; font-size: 14px; padding: 5px;');

  if (window.earthGlobeControls && window.earthGlobeControls.viewer) {
    const viewer = window.earthGlobeControls.viewer;
    
    const italyEntities = viewer.entities.values.filter(e => {
      if (!e.properties) return false;
      const country = e.properties.country ? e.properties.country.getValue() : null;
      const countryName = e.properties.countryName ? e.properties.countryName.getValue() : null;
      return (country && country.toLowerCase().includes('italy')) ||
             (countryName && countryName.toLowerCase().includes('italy'));
    });

    const spainEntities = viewer.entities.values.filter(e => {
      if (!e.properties) return false;
      const country = e.properties.country ? e.properties.country.getValue() : null;
      const countryName = e.properties.countryName ? e.properties.countryName.getValue() : null;
      return (country && country.toLowerCase().includes('spain')) ||
             (countryName && countryName.toLowerCase().includes('spain'));
    });

    const comparison = {
      Italy: { entities: italyEntities.length, expected: 110 },
      Spain: { entities: spainEntities.length, expected: 52 },
      Australia: { entities: results.cesiumEntities ? results.cesiumEntities.australiaEntities : 0, expected: 11 }
    };

    console.table(comparison);

    if (comparison.Italy.entities > 0 && comparison.Australia.entities === 0) {
      results.issues.push('❌ CRITICAL: Italy renders but Australia doesn\'t - likely filtering or naming issue');
      results.recommendations.push('Check RegionManager.extractCountryName() and country name variations');
    }

    if (comparison.Spain.entities > 0 && comparison.Australia.entities === 0) {
      results.issues.push('❌ CRITICAL: Spain renders but Australia doesn\'t - likely filtering or naming issue');
      results.recommendations.push('Check if "Australia" vs "Commonwealth of Australia" is causing issues');
    }
  }

  // ============================================================================
  // FINAL REPORT
  // ============================================================================
  console.log('');
  console.log('%c📊 DIAGNOSTIC REPORT', 'background: #000; color: #0ff; font-size: 18px; padding: 10px; font-weight: bold;');
  console.log('');

  if (results.issues.length === 0) {
    console.log('%c✅ NO ISSUES FOUND - Australia should be rendering correctly!', 'background: #0a0; color: #fff; font-size: 14px; padding: 5px;');
    console.log('');
    console.log('If you still don\'t see Australian provinces:');
    console.log('1. Try zooming to Australia (lat: -25, lng: 133)');
    console.log('2. Check if province layer is enabled in Layer Control Panel');
    console.log('3. Try reloading provinces from the Layer Control Panel');
  } else {
    console.log('%c⚠️ ISSUES DETECTED:', 'background: #f80; color: #000; font-size: 14px; padding: 5px;');
    console.log('');
    results.issues.forEach(issue => console.log(issue));
  }

  if (results.recommendations.length > 0) {
    console.log('');
    console.log('%c💡 RECOMMENDATIONS:', 'background: #08f; color: #fff; font-size: 14px; padding: 5px;');
    console.log('');
    results.recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  // Detailed results object
  console.log('');
  console.log('%c📋 Detailed Results:', 'background: #333; color: #fff; font-size: 12px; padding: 5px;');
  console.log(results);

  // Return results for programmatic access
  return results;
})();
