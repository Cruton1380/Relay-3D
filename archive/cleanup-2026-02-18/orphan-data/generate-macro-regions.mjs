#!/usr/bin/env node

/**
 * Generate Macro-Regions GeoJSON
 * 
 * This script creates precomputed macro-region boundaries following UN geoscheme
 * with 5 main regions: Africa, Americas, Asia, Europe, Oceania
 * 
 * Approach:
 * 1. Load Natural Earth 10m countries data
 * 2. Group countries by macro-region using UN geoscheme classification
 * 3. Dissolve country polygons for each macro-region using topojson
 * 4. Save clean macro-region boundaries as GeoJSON
 * 
 * Usage: node scripts/generate-macro-regions.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import * as topojson from 'topojson-server';
import * as topojsonClient from 'topojson-client';

// UN Geoscheme-based 5 macro-region classification
const MACRO_REGION_MAPPING = {
    'Africa': [
        // Northern Africa
        'Algeria', 'Egypt', 'Libya', 'Morocco', 'Sudan', 'Tunisia', 'Western Sahara',
        
        // Eastern Africa
        'Burundi', 'Comoros', 'Djibouti', 'Eritrea', 'Ethiopia', 'Kenya', 'Madagascar',
        'Malawi', 'Mauritius', 'Mayotte', 'Mozambique', 'Réunion', 'Rwanda', 'Seychelles',
        'Somalia', 'South Sudan', 'Tanzania', 'Uganda', 'Zambia', 'Zimbabwe',
        
        // Middle Africa
        'Angola', 'Cameroon', 'Central African Republic', 'Chad', 'Democratic Republic of the Congo',
        'Republic of the Congo', 'Equatorial Guinea', 'Gabon', 'São Tomé and Príncipe',
        
        // Southern Africa
        'Botswana', 'Eswatini', 'Lesotho', 'Namibia', 'South Africa',
        
        // Western Africa
        'Benin', 'Burkina Faso', 'Cape Verde', 'Côte d\'Ivoire', 'Gambia', 'Ghana', 'Guinea',
        'Guinea-Bissau', 'Liberia', 'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Senegal',
        'Sierra Leone', 'Togo'
    ],
    
    'Americas': [
        // North America
        'Canada', 'Greenland', 'Saint Pierre and Miquelon', 'United States of America',
        
        // Central America
        'Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama',
        
        // Caribbean
        'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Bonaire', 'British Virgin Islands',
        'Cayman Islands', 'Cuba', 'Curaçao', 'Dominica', 'Dominican Republic', 'Grenada', 'Guadeloupe',
        'Haiti', 'Jamaica', 'Martinique', 'Montserrat', 'Puerto Rico', 'Saint Barthélemy', 'Saint Kitts and Nevis',
        'Saint Lucia', 'Saint Martin', 'Saint Vincent and the Grenadines', 'Sint Maarten', 'Trinidad and Tobago',
        'Turks and Caicos Islands', 'United States Virgin Islands',
        
        // South America
        'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Falkland Islands',
        'French Guiana', 'Guyana', 'Paraguay', 'Peru', 'South Georgia and the South Sandwich Islands',
        'Suriname', 'Uruguay', 'Venezuela'
    ],
    
    'Asia': [
        // Central Asia
        'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan',
        
        // Eastern Asia
        'China', 'Hong Kong', 'Japan', 'Macao', 'Mongolia', 'North Korea', 'South Korea', 'Taiwan',
        
        // South-eastern Asia
        'Brunei', 'Cambodia', 'East Timor', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines',
        'Singapore', 'Thailand', 'Vietnam',
        
        // Southern Asia
        'Afghanistan', 'Bangladesh', 'Bhutan', 'India', 'Iran', 'Maldives', 'Nepal', 'Pakistan', 'Sri Lanka',
        
        // Western Asia (Middle East)
        'Armenia', 'Azerbaijan', 'Bahrain', 'Cyprus', 'Georgia', 'Iraq', 'Israel', 'Jordan', 'Kuwait',
        'Lebanon', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen',
        
        // Russia (transcontinental - majority in Asia)
        'Russia'
    ],
    
    'Europe': [
        // Eastern Europe
        'Belarus', 'Bulgaria', 'Czech Republic', 'Hungary', 'Moldova', 'Poland', 'Romania', 'Slovakia', 'Ukraine',
        
        // Northern Europe
        'Åland Islands', 'Denmark', 'Estonia', 'Faroe Islands', 'Finland', 'Guernsey', 'Iceland', 'Ireland',
        'Isle of Man', 'Jersey', 'Latvia', 'Lithuania', 'Norway', 'Svalbard and Jan Mayen', 'Sweden', 'United Kingdom',
        
        // Southern Europe
        'Albania', 'Andorra', 'Bosnia and Herzegovina', 'Croatia', 'Gibraltar', 'Greece', 'Holy See', 'Italy',
        'Malta', 'Montenegro', 'North Macedonia', 'Portugal', 'San Marino', 'Serbia', 'Slovenia', 'Spain',
        
        // Western Europe
        'Austria', 'Belgium', 'France', 'Germany', 'Liechtenstein', 'Luxembourg', 'Monaco', 'Netherlands', 'Switzerland'
    ],
    
    'Oceania': [
        // Australia and New Zealand
        'Australia', 'Christmas Island', 'Cocos Islands', 'Heard Island and McDonald Islands', 'New Zealand', 'Norfolk Island',
        
        // Melanesia
        'Fiji', 'New Caledonia', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu',
        
        // Micronesia
        'Guam', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'Northern Mariana Islands', 'Palau',
        
        // Polynesia
        'American Samoa', 'Cook Islands', 'French Polynesia', 'Niue', 'Pitcairn Islands', 'Samoa', 'Tokelau',
        'Tonga', 'Tuvalu', 'Wallis and Futuna'
    ]
};

// Manual country-to-macro-region mapping for edge cases and corrections
const MANUAL_COUNTRY_MAPPING = {
    // Handle common alternate names and edge cases
    'United States of America': 'Americas',
    'USA': 'Americas',
    'United States': 'Americas',
    'US': 'Americas',
    
    // Russia - transcontinental but majority in Asia
    'Russia': 'Asia',
    'Russian Federation': 'Asia',
    
    // Turkey - transcontinental but UN classifies as Western Asia
    'Turkey': 'Asia',
    
    // Cyprus - geographically Asia but politically/culturally Europe, UN classifies as Western Asia
    'Cyprus': 'Asia',
    
    // Egypt - transcontinental but UN classifies as Northern Africa
    'Egypt': 'Africa',
    
    // Handle alternate country names
    'Democratic Republic of the Congo': 'Africa',
    'Dem. Rep. Congo': 'Africa',
    'Republic of the Congo': 'Africa',
    'Congo': 'Africa',
    
    'Central African Republic': 'Africa',
    'Central African Rep.': 'Africa',
    
    'Côte d\'Ivoire': 'Africa',
    'Ivory Coast': 'Africa',
    
    'Eswatini': 'Africa',
    'Swaziland': 'Africa',
    
    'North Macedonia': 'Europe',
    'Macedonia': 'Europe',
    
    'Czech Republic': 'Europe',
    'Czechia': 'Europe',
    
    'East Timor': 'Asia',
    'Timor-Leste': 'Asia',
    
    // Antarctica - special case, not part of any macro-region
    'Antarctica': null
};

const DATA_DIR = './data';
const PUBLIC_DIR = './public';

async function downloadCountriesData() {
    const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
    const filePath = path.join(DATA_DIR, 'countries-10m.geojson');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Skip download if file already exists
    if (fs.existsSync(filePath)) {
        console.log('📁 Countries data already exists, using cached version');
        return filePath;
    }
    
    console.log('🌍 Downloading Natural Earth 10m countries data...');
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log('✅ Downloaded countries data');
                resolve(filePath);
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete partial file
            reject(err);
        });
    });
}

function loadCountriesData(filePath) {
    console.log('📖 Loading countries data...');
    const data = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(data);
    console.log(`📊 Loaded ${geojson.features.length} country features`);
    return geojson;
}

function groupCountriesByMacroRegion(countriesGeoJSON) {
    console.log('🗂️ Grouping countries by UN macro-region...');
    
    const macroRegionGroups = {};
    let unassignedCount = 0;
    const unassignedCountries = [];
    
    countriesGeoJSON.features.forEach(country => {
        const properties = country.properties;
        const countryName = properties.NAME || properties.name || properties.NAME_EN;
        
        // First check manual mapping for overrides
        let macroRegion = MANUAL_COUNTRY_MAPPING[countryName];
        
        // If not in manual mapping, find macro-region from MACRO_REGION_MAPPING
        if (!macroRegion) {
            for (const [regionName, countries] of Object.entries(MACRO_REGION_MAPPING)) {
                if (countries.includes(countryName)) {
                    macroRegion = regionName;
                    break;
                }
            }
        }
        
        // Handle special cases (like Antarctica)
        if (macroRegion === null) {
            console.log(`🏳️ Skipping ${countryName} (not assigned to any macro-region)`);
            return;
        }
        
        // Handle unassigned countries
        if (!macroRegion) {
            unassignedCount++;
            unassignedCountries.push(countryName);
            
            // Try to use the original CONTINENT property as fallback for classification
            const originalContinent = properties.CONTINENT || properties.continent;
            if (originalContinent && originalContinent !== 'null' && originalContinent !== '') {
                // Map continent to macro-region
                const continentToMacroRegion = {
                    'Africa': 'Africa',
                    'Asia': 'Asia',
                    'Europe': 'Europe',
                    'North America': 'Americas',
                    'South America': 'Americas',
                    'Oceania': 'Oceania',
                    'Antarctica': null // Skip Antarctica
                };
                
                macroRegion = continentToMacroRegion[originalContinent];
                if (macroRegion) {
                    console.log(`📍 Using fallback macro-region for ${countryName}: ${macroRegion} (from ${originalContinent})`);
                } else if (originalContinent === 'Antarctica') {
                    console.log(`🏳️ Skipping ${countryName} (Antarctica)`);
                    return;
                } else {
                    console.log(`⚠️ No macro-region found for ${countryName}, skipping`);
                    return;
                }
            } else {
                console.log(`⚠️ No macro-region found for ${countryName}, skipping`);
                return;
            }
        }
        
        if (!macroRegionGroups[macroRegion]) {
            macroRegionGroups[macroRegion] = [];
        }
        
        macroRegionGroups[macroRegion].push(country);
        
        // Log first few assignments for verification
        if (macroRegionGroups[macroRegion].length <= 3) {
            console.log(`🗺️ Country: ${countryName} → Macro-region: ${macroRegion}`);
        }
    });
    
    if (unassignedCount > 0) {
        console.log(`\n⚠️ Found ${unassignedCount} countries not in mapping:`);
        unassignedCountries.slice(0, 10).forEach(name => console.log(`   - ${name}`));
        if (unassignedCount > 10) {
            console.log(`   ... and ${unassignedCount - 10} more`);
        }
    }
    
    // Validate macro-region count (should be exactly 5)
    const macroRegionCount = Object.keys(macroRegionGroups).length;
    if (macroRegionCount !== 5) {
        console.warn(`⚠️ Expected exactly 5 macro-regions, got ${macroRegionCount}:`, Object.keys(macroRegionGroups));
    }
    
    // Print macro-region summary
    console.log('\n📊 Macro-region summary:');
    Object.entries(macroRegionGroups).forEach(([name, countries]) => {
        console.log(`   ${name}: ${countries.length} countries`);
    });
    
    return macroRegionGroups;
}

function dissolveMacroRegionBoundaries(macroRegions) {
    console.log('🔧 Dissolving macro-region boundaries using TopJSON...');
    
    const macroRegionFeatures = [];
    
    Object.entries(macroRegions).forEach(([regionName, countries]) => {
        console.log(`\n🌍 Processing ${regionName} (${countries.length} countries)...`);
        
        try {
            // Create FeatureCollection for this macro-region
            const featureCollection = {
                type: 'FeatureCollection',
                features: countries
            };
            
            // Convert to TopoJSON for accurate dissolving
            const topology = topojson.topology({ countries: featureCollection });
            
            // Dissolve by merging all country geometries
            const dissolved = topojsonClient.merge(topology, topology.objects.countries.geometries);
            
            if (dissolved) {
                // Create dissolved macro-region feature
                const macroRegionFeature = {
                    type: 'Feature',
                    properties: {
                        name: regionName,
                        type: 'macro_region',
                        countries: countries.length,
                        // Add some metadata
                        un_classification: 'macro-region',
                        level: 'macro-region'
                    },
                    geometry: dissolved
                };
                
                macroRegionFeatures.push(macroRegionFeature);
                
                // Analyze result
                const geometryType = dissolved.type;
                const partCount = geometryType === 'MultiPolygon' ? dissolved.coordinates.length : 1;
                console.log(`✅ ${regionName}: ${geometryType} with ${partCount} part(s)`);
            } else {
                console.error(`❌ Failed to dissolve ${regionName}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${regionName}:`, error.message);
            
            // Fallback: create MultiPolygon from all countries
            console.log(`🔄 Fallback: Creating MultiPolygon for ${regionName}...`);
            
            const allCoordinates = [];
            countries.forEach(country => {
                if (country.geometry.type === 'Polygon') {
                    allCoordinates.push(country.geometry.coordinates);
                } else if (country.geometry.type === 'MultiPolygon') {
                    allCoordinates.push(...country.geometry.coordinates);
                }
            });
            
            if (allCoordinates.length > 0) {
                const macroRegionFeature = {
                    type: 'Feature',
                    properties: {
                        name: regionName,
                        type: 'macro_region',
                        countries: countries.length,
                        dissolved: false // Mark as non-dissolved
                    },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: allCoordinates
                    }
                };
                
                macroRegionFeatures.push(macroRegionFeature);
                console.log(`⚡ ${regionName}: MultiPolygon fallback with ${allCoordinates.length} parts`);
            }
        }
    });
    
    return {
        type: 'FeatureCollection',
        features: macroRegionFeatures
    };
}

function saveMacroRegionsData(macroRegionsGeoJSON, macroRegionGroups) {
    // Save GeoJSON files
    const dataGeoJSONPath = path.join(DATA_DIR, 'macro_regions.geojson');
    const publicGeoJSONPath = path.join(PUBLIC_DIR, 'macro_regions.geojson');
    
    // Save JSON metadata
    const dataJSONPath = path.join(DATA_DIR, 'macro_regions.json');
    const publicJSONPath = path.join(PUBLIC_DIR, 'macro_regions.json');
    
    // Ensure directories exist
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    
    // Prepare metadata
    const metadata = {
        schema_version: "1.0",
        generated_at: new Date().toISOString(),
        classification: "UN Geoscheme 5 Macro-Regions",
        regions: Object.keys(macroRegionGroups).sort().map(regionName => ({
            name: regionName,
            type: "macro_region",
            countries: macroRegionGroups[regionName].length,
            country_list: macroRegionGroups[regionName].map(c => c.properties.NAME || c.properties.name).sort()
        })),
        total_countries: Object.values(macroRegionGroups).reduce((sum, countries) => sum + countries.length, 0),
        total_regions: Object.keys(macroRegionGroups).length
    };
    
    // Save files
    const geoJsonString = JSON.stringify(macroRegionsGeoJSON, null, 2);
    const metadataString = JSON.stringify(metadata, null, 2);
    
    // Save GeoJSON
    fs.writeFileSync(dataGeoJSONPath, geoJsonString);
    console.log(`💾 Saved macro-regions GeoJSON: ${dataGeoJSONPath}`);
    
    fs.writeFileSync(publicGeoJSONPath, geoJsonString);
    console.log(`💾 Saved macro-regions GeoJSON: ${publicGeoJSONPath}`);
    
    // Save metadata
    fs.writeFileSync(dataJSONPath, metadataString);
    console.log(`💾 Saved macro-regions metadata: ${dataJSONPath}`);
    
    fs.writeFileSync(publicJSONPath, metadataString);
    console.log(`💾 Saved macro-regions metadata: ${publicJSONPath}`);
    
    // Print summary
    console.log(`\n📊 Generated ${macroRegionsGeoJSON.features.length} macro-region boundaries:`);
    macroRegionsGeoJSON.features.forEach(region => {
        const { name, countries } = region.properties;
        const geometryType = region.geometry.type;
        const partCount = geometryType === 'MultiPolygon' ? region.geometry.coordinates.length : 1;
        console.log(`   ✅ ${name}: ${geometryType} (${partCount} parts, ${countries} countries)`);
    });
}

async function main() {
    console.log('🚀 Generating UN macro-region boundaries from country data...\n');
    
    try {
        // Step 1: Download/load countries data
        const countriesPath = await downloadCountriesData();
        const countriesGeoJSON = loadCountriesData(countriesPath);
        
        // Step 2: Group countries by macro-region
        const macroRegions = groupCountriesByMacroRegion(countriesGeoJSON);
        
        // Step 3: Dissolve macro-region boundaries
        const macroRegionsGeoJSON = dissolveMacroRegionBoundaries(macroRegions);
        
        // Step 4: Save results
        saveMacroRegionsData(macroRegionsGeoJSON, macroRegions);
        
        console.log('\n🎉 Macro-region generation complete!');
        console.log('📁 Files created:');
        console.log('   - data/macro_regions.geojson (source data)');
        console.log('   - public/macro_regions.geojson (frontend access)');
        console.log('   - data/macro_regions.json (metadata)');
        console.log('   - public/macro_regions.json (frontend metadata)');
        console.log('\n🔄 Next: Update frontend to use macro-region hierarchy');
        
    } catch (error) {
        console.error('❌ Error generating macro-regions:', error);
        process.exit(1);
    }
}

// Run the script
main();