#!/usr/bin/env node

/**
 * Continent Data Validation Script
 * 
 * Validates continent data consistency and reconciles with country data.
 * Can be run independently to check data quality without updating.
 * 
 * Usage: node scripts/validate-continents.mjs [--detailed] [--fix-assignments]
 */

import fs from 'fs';
import path from 'path';
import { ContinentUpdater, CONFIG } from './update-continents.mjs';

class ContinentValidator extends ContinentUpdater {
  constructor() {
    super();
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  async validateDataConsistency() {
    this.log('🔍 Starting comprehensive continent data validation...');
    
    const results = {
      continents: await this.validateContinentFile(),
      countries: await this.validateCountryAssignments(),
      geometry: await this.validateGeometry(),
      consistency: await this.validateDataConsistency()
    };
    
    return results;
  }

  async validateContinentFile() {
    this.log('📋 Validating continent file structure...');
    
    const continentPath = path.join(CONFIG.paths.public, 'continents.geojson');
    
    if (!fs.existsSync(continentPath)) {
      this.errors.push('Continent file does not exist: ' + continentPath);
      return { valid: false, errors: ['File not found'] };
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(continentPath, 'utf8'));
      const issues = [];
      
      // Validate GeoJSON structure
      if (data.type !== 'FeatureCollection') {
        issues.push('Invalid GeoJSON: must be FeatureCollection');
      }
      
      if (!Array.isArray(data.features)) {
        issues.push('Invalid GeoJSON: features must be array');
      }
      
      // Validate each continent feature
      const continentNames = new Set();
      const duplicates = [];
      
      data.features.forEach((feature, index) => {
        const props = feature.properties || {};
        const name = props.name;
        
        // Check for required properties
        if (!name) {
          issues.push(`Feature ${index}: missing name property`);
        } else {
          if (continentNames.has(name)) {
            duplicates.push(name);
          }
          continentNames.add(name);
        }
        
        if (typeof props.countries !== 'number') {
          issues.push(`${name || 'Feature ' + index}: invalid countries count`);
        }
        
        if (!feature.geometry) {
          issues.push(`${name || 'Feature ' + index}: missing geometry`);
        }
        
        if (feature.geometry && !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
          issues.push(`${name || 'Feature ' + index}: invalid geometry type ${feature.geometry.type}`);
        }
      });
      
      if (duplicates.length > 0) {
        issues.push(`Duplicate continents: ${duplicates.join(', ')}`);
      }
      
      // Check for expected continents (World Atlas 7-continent model)
      const expectedContinents = CONFIG.validation.expectedContinents;
      const missing = expectedContinents.filter(name => !continentNames.has(name));
      
      if (missing.length > 0) {
        issues.push(`Missing expected continents: ${missing.join(', ')}`);
      }
      
      this.log(`📊 Continent file validation: ${issues.length > 0 ? issues.length + ' issues' : 'passed'}`);
      
      return {
        valid: issues.length === 0,
        issues,
        stats: {
          totalContinents: data.features.length,
          continentNames: Array.from(continentNames),
          fileSize: fs.statSync(continentPath).size
        }
      };
      
    } catch (error) {
      const issue = `Failed to parse continent file: ${error.message}`;
      this.errors.push(issue);
      return { valid: false, errors: [issue] };
    }
  }

  async validateCountryAssignments() {
    this.log('🌍 Validating country-to-continent assignments...');
    
    try {
      // Fetch latest country data
      const { data: countryData } = await this.downloadLatestCountryData();
      
      // Group countries by continent using our logic
      const continents = this.groupCountriesByContinent(countryData);
      
      const issues = [];
      const stats = {
        totalCountries: countryData.features.length,
        assignedCountries: 0,
        unassignedCountries: 0,
        continentCounts: {}
      };
      
      // Analyze assignments
      Object.entries(continents).forEach(([continentName, countries]) => {
        stats.continentCounts[continentName] = countries.length;
        stats.assignedCountries += countries.length;
        
        // Check for suspiciously low/high counts
        const minExpected = CONFIG.validation.minCountriesPerContinent[continentName];
        if (minExpected && countries.length < minExpected) {
          issues.push(`${continentName} has too few countries: ${countries.length} < ${minExpected}`);
        }
        
        // Check for countries with missing/invalid data
        countries.forEach(country => {
          const props = country.properties || {};
          const name = props.NAME || props.name || props.ADMIN;
          
          if (!name) {
            issues.push(`Country missing name in ${continentName}`);
          }
          
          if (!country.geometry) {
            issues.push(`Country ${name} missing geometry in ${continentName}`);
          }
        });
      });
      
      // Check for high unassigned count
      const sevenSeasCount = stats.continentCounts['Seven seas (open ocean)'] || 0;
      if (sevenSeasCount > 15) {
        issues.push(`Too many countries assigned to 'Seven seas': ${sevenSeasCount}`);
      }
      
      this.log(`📊 Country assignment validation: ${issues.length > 0 ? issues.length + ' issues' : 'passed'}`);
      this.log(`   Total countries: ${stats.totalCountries}`);
      Object.entries(stats.continentCounts).forEach(([continent, count]) => {
        this.log(`   ${continent}: ${count} countries`);
      });
      
      return {
        valid: issues.length === 0,
        issues,
        stats
      };
      
    } catch (error) {
      const issue = `Country assignment validation failed: ${error.message}`;
      this.errors.push(issue);
      return { valid: false, errors: [issue] };
    }
  }

  async validateGeometry() {
    this.log('🗺️ Validating continent geometry...');
    
    const continentPath = path.join(CONFIG.paths.public, 'continents.geojson');
    
    if (!fs.existsSync(continentPath)) {
      return { valid: false, errors: ['Continent file not found'] };
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(continentPath, 'utf8'));
      const issues = [];
      const stats = {
        totalVertices: 0,
        totalPolygons: 0,
        geometryTypes: {},
        continentSizes: {}
      };
      
      data.features.forEach(feature => {
        const { name } = feature.properties;
        const geometry = feature.geometry;
        
        if (!geometry) return;
        
        const geometryType = geometry.type;
        stats.geometryTypes[geometryType] = (stats.geometryTypes[geometryType] || 0) + 1;
        
        let vertexCount = 0;
        let polygonCount = 0;
        
        if (geometryType === 'Polygon') {
          polygonCount = 1;
          vertexCount = geometry.coordinates[0].length;
        } else if (geometryType === 'MultiPolygon') {
          polygonCount = geometry.coordinates.length;
          vertexCount = geometry.coordinates.reduce((sum, polygon) => {
            return sum + polygon[0].length; // Only count exterior ring
          }, 0);
        } else {
          issues.push(`${name}: invalid geometry type ${geometryType}`);
          return;
        }
        
        stats.totalVertices += vertexCount;
        stats.totalPolygons += polygonCount;
        stats.continentSizes[name] = { vertices: vertexCount, polygons: polygonCount };
        
        // Check for suspiciously small/large geometries
        if (vertexCount < 10) {
          issues.push(`${name}: too few vertices (${vertexCount})`);
        }
        
        if (vertexCount > 100000) {
          this.warnings.push(`${name}: very large geometry (${vertexCount} vertices)`);
        }
        
        // Check for valid coordinate ranges
        const coords = geometryType === 'Polygon' 
          ? geometry.coordinates[0]
          : geometry.coordinates[0][0];
          
        coords.forEach(([lon, lat], i) => {
          if (lon < -180 || lon > 180) {
            issues.push(`${name}: invalid longitude ${lon} at vertex ${i}`);
          }
          if (lat < -90 || lat > 90) {
            issues.push(`${name}: invalid latitude ${lat} at vertex ${i}`);
          }
        });
      });
      
      this.log(`📊 Geometry validation: ${issues.length > 0 ? issues.length + ' issues' : 'passed'}`);
      this.log(`   Total vertices: ${stats.totalVertices.toLocaleString()}`);
      this.log(`   Total polygons: ${stats.totalPolygons}`);
      this.log(`   Geometry types: ${JSON.stringify(stats.geometryTypes)}`);
      
      return {
        valid: issues.length === 0,
        issues,
        warnings: this.warnings,
        stats
      };
      
    } catch (error) {
      const issue = `Geometry validation failed: ${error.message}`;
      this.errors.push(issue);
      return { valid: false, errors: [issue] };
    }
  }

  async generateValidationReport() {
    const results = await this.validateDataConsistency();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        valid: Object.values(results).every(r => r.valid),
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length
      },
      results,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions
    };
    
    // Save report
    const reportPath = path.join(CONFIG.paths.logs, `continent-validation-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    this.log('\\n📋 VALIDATION SUMMARY');
    this.log('==================');
    this.log(`Overall Status: ${report.summary.valid ? '✅ PASSED' : '❌ FAILED'}`);
    this.log(`Errors: ${this.errors.length}`);
    this.log(`Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      this.log('\\n❌ ERRORS:');
      this.errors.forEach(error => this.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      this.log('\\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => this.log(`   - ${warning}`));
    }
    
    if (this.suggestions.length > 0) {
      this.log('\\n💡 SUGGESTIONS:');
      this.suggestions.forEach(suggestion => this.log(`   - ${suggestion}`));
    }
    
    this.log(`\\n📋 Full report saved: ${reportPath}`);
    
    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    detailed: args.includes('--detailed'),
    fixAssignments: args.includes('--fix-assignments')
  };
  
  console.log('🔍 Relay Continent Validation System v1.0');
  console.log('==========================================\\n');
  
  const validator = new ContinentValidator();
  const report = await validator.generateValidationReport();
  
  if (report.summary.valid) {
    console.log('\\n✅ Validation passed - continent data is consistent!');
    process.exit(0);
  } else {
    console.log('\\n❌ Validation failed - issues found in continent data!');
    console.log('Run the update script to fix issues or check the detailed report.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal validation error:', error);
    process.exit(1);
  });
}

export { ContinentValidator };