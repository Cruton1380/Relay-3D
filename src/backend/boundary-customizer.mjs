import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * BOUNDARY CUSTOMIZER
 * 
 * Modifies GeoJSON boundary files to create custom regions for governance
 * Supports: splitting countries, merging regions, adjusting borders, custom areas
 */
class BoundaryCustomizer {
  constructor() {
    this.boundariesDir = path.join(__dirname, 'data/boundaries');
    this.customDir = path.join(this.boundariesDir, 'custom');
    this.backupDir = path.join(this.boundariesDir, 'backup');
    
    // Ensure directories exist
    [this.customDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Load a boundary file
  loadBoundaryFile(filename) {
    const filePath = path.join(this.boundariesDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Boundary file not found: ${filename}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  // Save a boundary file
  saveBoundaryFile(data, filename, isCustom = false) {
    const dir = isCustom ? this.customDir : this.boundariesDir;
    const filePath = path.join(dir, filename);
    
    // Add metadata
    const output = {
      type: 'FeatureCollection',
      metadata: {
        created: new Date().toISOString(),
        customized: isCustom,
        original_features: data.features ? data.features.length : 0,
        modifications: data.modifications || [],
        version: '1.0.0'
      },
      features: data.features || data
    };
    
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log(`💾 Saved ${isCustom ? 'custom' : 'standard'} boundary file: ${filename}`);
    return filePath;
  }

  // Create backup of original file
  backupOriginal(filename) {
    const originalPath = path.join(this.boundariesDir, filename);
    const backupPath = path.join(this.backupDir, `original-${filename}`);
    
    if (!fs.existsSync(backupPath) && fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, backupPath);
      console.log(`📦 Created backup: original-${filename}`);
    }
  }

  // Split a country into multiple regions
  splitCountry(data, countryCode, splitDefinitions) {
    console.log(`✂️ Splitting country: ${countryCode}`);
    
    const newFeatures = [];
    let splitApplied = false;
    
    data.features.forEach(feature => {
      if (feature.properties.ISO_A3 === countryCode || 
          feature.properties.ADM0_A3 === countryCode) {
        
        // Create multiple features from split definitions
        splitDefinitions.forEach((split, index) => {
          const newFeature = {
            ...feature,
            properties: {
              ...feature.properties,
              NAME: split.name,
              ISO_A3: split.code || `${countryCode}_${index + 1}`,
              ADMIN: split.name,
              CUSTOM_REGION: true,
              ORIGINAL_COUNTRY: countryCode,
              SPLIT_INDEX: index + 1,
              GOVERNANCE_TYPE: split.governanceType || 'autonomous_region'
            }
          };
          
          // Optionally modify geometry for each split
          if (split.geometry) {
            newFeature.geometry = split.geometry;
          }
          
          newFeatures.push(newFeature);
        });
        
        splitApplied = true;
        console.log(`✅ Split ${countryCode} into ${splitDefinitions.length} regions`);
      } else {
        // Keep original feature
        newFeatures.push(feature);
      }
    });
    
    if (!splitApplied) {
      console.warn(`⚠️ Country ${countryCode} not found for splitting`);
    }
    
    return {
      ...data,
      features: newFeatures,
      modifications: [
        ...(data.modifications || []),
        {
          type: 'split_country',
          country: countryCode,
          splits: splitDefinitions.length,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // Merge multiple countries into one region
  mergeCountries(data, countryCodes, mergedName, mergedCode) {
    console.log(`🔗 Merging countries: ${countryCodes.join(', ')}`);
    
    const newFeatures = [];
    const mergedFeatures = [];
    let mergeApplied = false;
    
    data.features.forEach(feature => {
      const countryCode = feature.properties.ISO_A3 || feature.properties.ADM0_A3;
      
      if (countryCodes.includes(countryCode)) {
        mergedFeatures.push(feature);
        mergeApplied = true;
      } else {
        newFeatures.push(feature);
      }
    });
    
    if (mergedFeatures.length > 0) {
      // Create unified region from merged features
      const unifiedFeature = {
        type: 'Feature',
        properties: {
          NAME: mergedName,
          ISO_A3: mergedCode,
          ADMIN: mergedName,
          CUSTOM_REGION: true,
          MERGED_FROM: countryCodes,
          GOVERNANCE_TYPE: 'unified_region',
          ORIGINAL_FEATURES: mergedFeatures.length
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: mergedFeatures.map(f => f.geometry.coordinates).flat()
        }
      };
      
      newFeatures.push(unifiedFeature);
      console.log(`✅ Merged ${countryCodes.length} countries into ${mergedName}`);
    }
    
    if (!mergeApplied) {
      console.warn(`⚠️ No countries found to merge from: ${countryCodes.join(', ')}`);
    }
    
    return {
      ...data,
      features: newFeatures,
      modifications: [
        ...(data.modifications || []),
        {
          type: 'merge_countries',
          countries: countryCodes,
          merged_name: mergedName,
          merged_code: mergedCode,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // Add completely custom region
  addCustomRegion(data, customRegion) {
    console.log(`➕ Adding custom region: ${customRegion.name}`);
    
    const newFeature = {
      type: 'Feature',
      properties: {
        NAME: customRegion.name,
        ISO_A3: customRegion.code,
        ADMIN: customRegion.name,
        CUSTOM_REGION: true,
        GOVERNANCE_TYPE: customRegion.governanceType || 'custom_region',
        CREATED: new Date().toISOString(),
        DESCRIPTION: customRegion.description || 'Custom governance region'
      },
      geometry: customRegion.geometry
    };
    
    return {
      ...data,
      features: [...data.features, newFeature],
      modifications: [
        ...(data.modifications || []),
        {
          type: 'add_custom_region',
          region_name: customRegion.name,
          region_code: customRegion.code,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // Rename a region
  renameRegion(data, targetCode, newName) {
    console.log(`📝 Renaming region ${targetCode} to ${newName}`);
    
    let renamed = false;
    data.features.forEach(feature => {
      if (feature.properties.ISO_A3 === targetCode || 
          feature.properties.ADM0_A3 === targetCode) {
        
        feature.properties.NAME = newName;
        feature.properties.ADMIN = newName;
        feature.properties.CUSTOM_NAME = true;
        feature.properties.ORIGINAL_NAME = feature.properties.ORIGINAL_NAME || feature.properties.NAME;
        renamed = true;
      }
    });
    
    if (renamed) {
      console.log(`✅ Renamed ${targetCode} to ${newName}`);
    } else {
      console.warn(`⚠️ Region ${targetCode} not found for renaming`);
    }
    
    return {
      ...data,
      modifications: [
        ...(data.modifications || []),
        {
          type: 'rename_region',
          region_code: targetCode,
          new_name: newName,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // List all regions in a boundary file
  listRegions(filename) {
    const data = this.loadBoundaryFile(filename);
    console.log(`📋 Regions in ${filename}:`);
    
    data.features.forEach((feature, index) => {
      const name = feature.properties.NAME || feature.properties.ADMIN;
      const code = feature.properties.ISO_A3 || feature.properties.ADM0_A3 || `FEATURE_${index}`;
      const isCustom = feature.properties.CUSTOM_REGION ? '🎯' : '';
      console.log(`  ${isCustom} ${code}: ${name}`);
    });
    
    return data.features.map(f => ({
      name: f.properties.NAME || f.properties.ADMIN,
      code: f.properties.ISO_A3 || f.properties.ADM0_A3,
      custom: !!f.properties.CUSTOM_REGION
    }));
  }

  // Create example customizations
  createExampleCustomizations() {
    console.log('🎨 Creating example boundary customizations...');
    
    // Load the 50m dataset for faster processing
    const data = this.loadBoundaryFile('countries-50m.geojson');
    
    // Example 1: Split USA into regions
    const usaSplits = [
      { name: 'Western USA', code: 'USA_W', governanceType: 'regional_council' },
      { name: 'Central USA', code: 'USA_C', governanceType: 'regional_council' },
      { name: 'Eastern USA', code: 'USA_E', governanceType: 'regional_council' }
    ];
    
    let customData = this.splitCountry(data, 'USA', usaSplits);
    
    // Example 2: Merge Nordic countries
    customData = this.mergeCountries(
      customData, 
      ['NOR', 'SWE', 'DNK', 'FIN', 'ISL'], 
      'Nordic Federation', 
      'NORD'
    );
    
    // Example 3: Add a custom digital governance region
    const digitalRegion = {
      name: 'Digital Governance Zone',
      code: 'DGZ',
      governanceType: 'digital_autonomous',
      description: 'Experimental digital governance region',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [10, 50], [20, 50], [20, 60], [10, 60], [10, 50]
        ]]
      }
    };
    
    customData = this.addCustomRegion(customData, digitalRegion);
    
    // Example 4: Rename regions for governance
    customData = this.renameRegion(customData, 'CHN', 'Eastern Governance Zone');
    
    // Save the customized version
    this.backupOriginal('countries-50m.geojson');
    this.saveBoundaryFile(customData, 'countries-50m-custom.geojson', true);
    
    console.log('✅ Example customizations created!');
    console.log('📁 Check: src/backend/data/boundaries/custom/');
    
    return customData;
  }
}

// CLI Interface
const customizer = new BoundaryCustomizer();

if (process.argv.includes('--example')) {
  customizer.createExampleCustomizations();
} else if (process.argv.includes('--list')) {
  const filename = process.argv[process.argv.indexOf('--list') + 1] || 'countries-50m.geojson';
  customizer.listRegions(filename);
} else {
  console.log('🎨 Boundary Customizer');
  console.log('');
  console.log('Usage:');
  console.log('  node boundary-customizer.mjs --example     # Create example customizations');
  console.log('  node boundary-customizer.mjs --list [file] # List regions in file');
  console.log('');
  console.log('Available for customization:');
  console.log('  ✂️  Split countries into regions');
  console.log('  🔗  Merge countries into federations');
  console.log('  ➕  Add custom governance zones');
  console.log('  📝  Rename regions');
  console.log('  🎯  Modify any boundaries');
}

export default BoundaryCustomizer;
