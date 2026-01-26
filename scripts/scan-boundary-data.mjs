/**
 * Boundary Data Scanner
 * 
 * This script scans the Natural Earth data and shows which countries/provinces
 * have actual polygon coordinates vs placeholder geometry.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 BOUNDARY DATA SCANNER\n');
console.log('='.repeat(80));

// Load countries data
console.log('\n📂 Loading countries-10m.geojson...');
const countriesPath = join(__dirname, 'data', 'countries-10m.geojson');
const countriesData = JSON.parse(readFileSync(countriesPath, 'utf-8'));

console.log(`✅ Loaded ${countriesData.features.length} countries\n`);

// Analyze countries
const countryStats = {
  total: countriesData.features.length,
  withGeometry: 0,
  suspicious: [],
  sample: []
};

countriesData.features.forEach((feature) => {
  const name = feature.properties.NAME;
  const isoCode = feature.properties.ISO_A3;
  const geomType = feature.geometry.type;
  
  let totalVertices = 0;
  
  if (geomType === 'Polygon') {
    totalVertices = feature.geometry.coordinates[0].length;
  } else if (geomType === 'MultiPolygon') {
    totalVertices = feature.geometry.coordinates.reduce((sum, poly) => {
      return sum + poly[0].length;
    }, 0);
  }
  
  if (totalVertices > 0) {
    countryStats.withGeometry++;
  }
  
  if (totalVertices < 10) {
    countryStats.suspicious.push({ name, isoCode, vertices: totalVertices });
  }
  
  if (countryStats.sample.length < 20) {
    countryStats.sample.push({ name, isoCode, vertices: totalVertices, geomType });
  }
});

console.log('📊 COUNTRY STATISTICS');
console.log('─'.repeat(80));
console.log(`Total countries: ${countryStats.total}`);
console.log(`Countries with geometry: ${countryStats.withGeometry}`);
console.log(`Suspicious (<10 vertices): ${countryStats.suspicious.length}`);

if (countryStats.suspicious.length > 0) {
  console.log('\n⚠️ SUSPICIOUS COUNTRIES (< 10 vertices):');
  countryStats.suspicious.forEach(c => {
    console.log(`  ❌ ${c.name} (${c.isoCode}): ${c.vertices} vertices`);
  });
}

console.log('\n📋 SAMPLE COUNTRIES (first 20):');
countryStats.sample.forEach((c, i) => {
  const status = c.vertices > 10 ? '✅' : '❌';
  console.log(`${i + 1}. ${status} ${c.name.padEnd(30)} (${c.isoCode}): ${c.vertices.toLocaleString().padStart(6)} vertices [${c.geomType}]`);
});

// Try to load provinces data
console.log('\n' + '='.repeat(80));
console.log('\n📂 Checking provinces-10m.geojson...');

const provincesPath = join(__dirname, 'data', 'provinces-10m.geojson');

try {
  const provincesData = JSON.parse(readFileSync(provincesPath, 'utf-8'));
  console.log(`✅ Loaded ${provincesData.features.length} provinces/states\n`);
  
  const provinceStats = {
    total: provincesData.features.length,
    withGeometry: 0,
    suspicious: [],
    sample: []
  };
  
  provincesData.features.forEach((feature) => {
    const name = feature.properties.name || feature.properties.NAME || 'Unknown';
    const country = feature.properties.admin || feature.properties.ADMIN || 'Unknown';
    const geomType = feature.geometry.type;
    
    let totalVertices = 0;
    
    if (geomType === 'Polygon') {
      totalVertices = feature.geometry.coordinates[0].length;
    } else if (geomType === 'MultiPolygon') {
      totalVertices = feature.geometry.coordinates.reduce((sum, poly) => {
        return sum + poly[0].length;
      }, 0);
    }
    
    if (totalVertices > 0) {
      provinceStats.withGeometry++;
    }
    
    if (totalVertices < 10) {
      provinceStats.suspicious.push({ name, country, vertices: totalVertices });
    }
    
    if (provinceStats.sample.length < 20) {
      provinceStats.sample.push({ name, country, vertices: totalVertices, geomType });
    }
  });
  
  console.log('📊 PROVINCE STATISTICS');
  console.log('─'.repeat(80));
  console.log(`Total provinces: ${provinceStats.total}`);
  console.log(`Provinces with geometry: ${provinceStats.withGeometry}`);
  console.log(`Suspicious (<10 vertices): ${provinceStats.suspicious.length}`);
  
  if (provinceStats.suspicious.length > 0) {
    console.log('\n⚠️ SUSPICIOUS PROVINCES (< 10 vertices):');
    provinceStats.suspicious.forEach(p => {
      console.log(`  ❌ ${p.name}, ${p.country}: ${p.vertices} vertices`);
    });
  }
  
  console.log('\n📋 SAMPLE PROVINCES (first 20):');
  provinceStats.sample.forEach((p, i) => {
    const status = p.vertices > 10 ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${p.name.padEnd(30)} (${p.country.padEnd(20)}): ${p.vertices.toLocaleString().padStart(6)} vertices [${p.geomType}]`);
  });
  
  // Search for specific provinces mentioned by user
  console.log('\n' + '='.repeat(80));
  console.log('\n🔎 SEARCHING FOR USER-MENTIONED PROVINCES:');
  console.log('─'.repeat(80));
  
  const searchTerms = ['Équateur', 'Equateur', 'Tibesti', 'Orientale'];
  
  searchTerms.forEach(term => {
    const found = provincesData.features.filter(f => {
      const name = f.properties.name || f.properties.NAME || '';
      const nameEn = f.properties.name_en || '';
      const nameLocal = f.properties.name_local || '';
      
      return name.toLowerCase().includes(term.toLowerCase()) ||
             nameEn.toLowerCase().includes(term.toLowerCase()) ||
             nameLocal.toLowerCase().includes(term.toLowerCase());
    });
    
    if (found.length > 0) {
      found.forEach(f => {
        const name = f.properties.name || f.properties.NAME;
        const country = f.properties.admin || f.properties.ADMIN;
        const geomType = f.geometry.type;
        
        let totalVertices = 0;
        if (geomType === 'Polygon') {
          totalVertices = f.geometry.coordinates[0].length;
        } else if (geomType === 'MultiPolygon') {
          totalVertices = f.geometry.coordinates.reduce((sum, poly) => sum + poly[0].length, 0);
        }
        
        console.log(`✅ Found: "${name}" in ${country}`);
        console.log(`   Vertices: ${totalVertices.toLocaleString()}`);
        console.log(`   Geometry: ${geomType}`);
        console.log(`   Properties: name=${f.properties.name}, name_en=${f.properties.name_en}, NAME=${f.properties.NAME}`);
        console.log('');
      });
    } else {
      console.log(`❌ Not found: "${term}"`);
    }
  });
  
} catch (error) {
  console.log(`❌ Could not load provinces data: ${error.message}`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ Scan complete!\n');
