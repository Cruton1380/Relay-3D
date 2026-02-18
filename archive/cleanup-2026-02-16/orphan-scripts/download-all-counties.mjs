/**
 * @fileoverview Download All County Boundaries
 * One-time script to download all 163 countries with ADM2 (county) data
 * Saves to /data/boundaries/cities/ for instant local loading
 */

import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'boundaries', 'cities');
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'county-download-progress.json');
const METADATA_TIMEOUT = 15000; // 15 seconds
const DOWNLOAD_TIMEOUT = 600000; // 10 minutes per country
const RETRY_ATTEMPTS = 3;
const DELAY_BETWEEN_COUNTRIES = 2000; // 2 seconds

// All 163 countries with ADM2 data (from GeoBoundaries)
const ALL_COUNTRIES = [
  'USA', 'CHN', 'IND', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'IDN', 'PAK',
  'GUY', 'VEN', 'BGD', 'SYR', 'POL', 'SEN', 'COL', 'BRN', 'SAU', 'CUB',
  'MOZ', 'LKA', 'DOM', 'SRB', 'DNK', 'VNM', 'AFG', 'HND', 'SWE', 'JPN',
  'AZE', 'BWA', 'ESP', 'GHA', 'MRT', 'LSO', 'CIV', 'BOL', 'ERI', 'MMR',
  'TJK', 'TKM', 'TUR', 'MWI', 'IRL', 'RWA', 'PAN', 'SLV', 'SLE', 'TGO',
  'KAZ', 'LBR', 'SSD', 'COD', 'SUR', 'MNG', 'CHE', 'MYS', 'NER', 'ZAF',
  'VUT', 'ARG', 'ARM', 'KWT', 'PNG', 'KOR', 'TLS', 'PER', 'BGR', 'GIN',
  'ROU', 'NLD', 'NOR', 'LVA', 'TON', 'TUV', 'BLZ', 'SLB', 'GRC', 'MKD',
  'JAM', 'CYP', 'MDG', 'COM', 'SOM', 'HRV', 'CMR', 'DJI', 'CAF', 'GEO',
  'CHL', 'PRY', 'KIR', 'PLW', 'TWN', 'CZE', 'ECU', 'ITA', 'QAT', 'NGA',
  'BDI', 'EST', 'BTN', 'PRK', 'SVK', 'ALB', 'HUN', 'UKR', 'YEM', 'CRI',
  'TZA', 'GNB', 'AUT', 'BIH', 'PRT', 'CPV', 'SGP', 'FRA', 'BLR', 'BEN',
  'ETH', 'LTU', 'SVN', 'AGO', 'XKX', 'TCD', 'URY', 'SYC', 'NPL', 'KHM',
  'GTM', 'UGA', 'ISL', 'COG', 'HTI', 'MAR', 'MDV', 'BEL', 'SDN', 'GNQ',
  'NIC', 'FIN', 'JOR', 'DEU', 'NAM', 'ZWE', 'WSM', 'ZMB', 'MLI', 'KEN',
  'BFA', 'ISR', 'SWZ', 'IRN', 'DZA', 'GAB', 'EGY', 'UZB', 'TUN', 'LBN',
  'FJI', 'NZL', 'GBR'
];

// Prioritize large important countries first
const PRIORITY_COUNTRIES = ['USA', 'CHN', 'IND', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'IDN', 'PAK'];

class CountyDownloader {
  constructor() {
    this.progress = this.loadProgress();
    this.stats = {
      total: ALL_COUNTRIES.length,
      downloaded: 0,
      failed: 0,
      skipped: 0,
      totalCounties: 0,
      totalSizeMB: 0,
      startTime: Date.now()
    };
  }

  loadProgress() {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load progress file:', error.message);
    }
    return { completed: [], failed: {} };
  }

  saveProgress() {
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.error('❌ Could not save progress:', error.message);
    }
  }

  async downloadCountry(countryCode, attempt = 1) {
    const outputPath = path.join(OUTPUT_DIR, `${countryCode}-ADM2.geojson`);

    // Skip if already downloaded
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`⏭️  ${countryCode}: Already exists (${sizeMB}MB) - skipping`);
      this.stats.skipped++;
      return { success: true, cached: true, size: stats.size };
    }

    console.log(`📡 ${countryCode}: Fetching metadata (attempt ${attempt}/${RETRY_ATTEMPTS})...`);
    const startTime = Date.now();

    try {
      // Step 1: Get metadata
      const metadataUrl = `https://www.geoboundaries.org/api/current/gbOpen/${countryCode}/ADM2/`;
      const metadata = await this.fetchJSON(metadataUrl, METADATA_TIMEOUT);

      if (!metadata.gjDownloadURL) {
        throw new Error('No download URL in metadata');
      }

      console.log(`📥 ${countryCode}: Downloading GeoJSON...`);
      const geoJsonUrl = metadata.gjDownloadURL;

      // Step 2: Download GeoJSON
      const geoData = await this.fetchJSON(geoJsonUrl, DOWNLOAD_TIMEOUT);

      if (!geoData.features || geoData.features.length === 0) {
        throw new Error('No features in GeoJSON');
      }

      // Step 3: Save to file
      const jsonString = JSON.stringify(geoData, null, 2);
      fs.writeFileSync(outputPath, jsonString, 'utf8');

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const sizeMB = (jsonString.length / 1024 / 1024).toFixed(2);
      const countyCount = geoData.features.length;

      console.log(`✅ ${countryCode}: ${countyCount} counties, ${sizeMB}MB, ${elapsed}s`);

      this.stats.downloaded++;
      this.stats.totalCounties += countyCount;
      this.stats.totalSizeMB += parseFloat(sizeMB);
      this.progress.completed.push(countryCode);
      this.saveProgress();

      return { success: true, counties: countyCount, size: sizeMB, time: elapsed };

    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      // Handle 404 (no ADM2 data)
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`ℹ️  ${countryCode}: No ADM2 data available (404) - expected for some countries`);
        this.progress.failed[countryCode] = 'NO_DATA';
        this.saveProgress();
        return { success: false, error: 'NO_DATA' };
      }

      // Retry on timeout or network error
      if (attempt < RETRY_ATTEMPTS) {
        console.log(`⚠️ ${countryCode}: ${error.message} after ${elapsed}s - retrying...`);
        await this.delay(5000); // Wait 5s before retry
        return this.downloadCountry(countryCode, attempt + 1);
      }

      // Final failure
      console.error(`❌ ${countryCode}: Failed after ${RETRY_ATTEMPTS} attempts - ${error.message}`);
      this.stats.failed++;
      this.progress.failed[countryCode] = error.message;
      this.saveProgress();

      return { success: false, error: error.message };
    }
  }

  async fetchJSON(url, timeout) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          return this.fetchJSON(response.headers.location, timeout)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode === 404) {
          return reject(new Error('404 not found'));
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        let data = '';
        let receivedBytes = 0;
        const totalBytes = parseInt(response.headers['content-length']) || 0;

        response.on('data', (chunk) => {
          data += chunk;
          receivedBytes += chunk.length;

          // Show progress for large files
          if (totalBytes > 10 * 1024 * 1024) { // > 10MB
            const percent = ((receivedBytes / totalBytes) * 100).toFixed(0);
            process.stdout.write(`\r   Progress: ${percent}%`);
          }
        });

        response.on('end', () => {
          if (totalBytes > 10 * 1024 * 1024) {
            process.stdout.write('\r   Progress: 100%\n');
          }

          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(timeout, () => {
        request.destroy();
        reject(new Error(`Timeout after ${timeout}ms`));
      });
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printStats() {
    const elapsed = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
    console.log('\n' + '='.repeat(70));
    console.log('📊 DOWNLOAD STATISTICS');
    console.log('='.repeat(70));
    console.log(`✅ Downloaded:     ${this.stats.downloaded} countries`);
    console.log(`⏭️  Skipped:        ${this.stats.skipped} countries (already downloaded)`);
    console.log(`❌ Failed:         ${this.stats.failed} countries`);
    console.log(`📍 Total counties: ${this.stats.totalCounties.toLocaleString()}`);
    console.log(`💾 Total size:     ${this.stats.totalSizeMB.toFixed(2)} MB`);
    console.log(`⏱️  Time elapsed:   ${elapsed} minutes`);
    console.log('='.repeat(70));
  }

  async run() {
    console.log('🌍 County Boundary Downloader');
    console.log('='.repeat(70));
    console.log(`📂 Output directory: ${OUTPUT_DIR}`);
    console.log(`📋 Total countries: ${ALL_COUNTRIES.length}`);
    console.log(`✅ Already completed: ${this.progress.completed.length}`);
    console.log('='.repeat(70));
    console.log('');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
    }

    // Sort countries: priority first, then alphabetical
    const sortedCountries = [
      ...PRIORITY_COUNTRIES.filter(c => ALL_COUNTRIES.includes(c)),
      ...ALL_COUNTRIES.filter(c => !PRIORITY_COUNTRIES.includes(c)).sort()
    ];

    // Download each country
    for (let i = 0; i < sortedCountries.length; i++) {
      const countryCode = sortedCountries[i];
      const progress = `[${i + 1}/${sortedCountries.length}]`;

      console.log(`\n${progress} ${countryCode}`);
      console.log('-'.repeat(70));

      await this.downloadCountry(countryCode);

      // Print interim stats every 10 countries
      if ((i + 1) % 10 === 0) {
        this.printStats();
      }

      // Delay between countries to avoid rate limiting
      if (i < sortedCountries.length - 1) {
        await this.delay(DELAY_BETWEEN_COUNTRIES);
      }
    }

    // Final stats
    this.printStats();

    // List failed countries
    if (Object.keys(this.progress.failed).length > 0) {
      console.log('\n❌ FAILED COUNTRIES:');
      console.log('-'.repeat(70));
      Object.entries(this.progress.failed).forEach(([country, reason]) => {
        console.log(`  ${country}: ${reason}`);
      });
    }

    console.log('\n✅ Download complete!');
    console.log(`📂 Files saved to: ${OUTPUT_DIR}`);
    console.log(`📊 Total counties: ${this.stats.totalCounties.toLocaleString()}`);
    console.log('');
  }
}

// Run downloader
const downloader = new CountyDownloader();
downloader.run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

