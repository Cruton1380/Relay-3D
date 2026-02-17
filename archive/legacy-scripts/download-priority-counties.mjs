/**
 * @fileoverview Download Priority County Boundaries (TEST)
 * Downloads just 10 priority countries to test the system
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
const METADATA_TIMEOUT = 15000;
const DOWNLOAD_TIMEOUT = 180000; // 3 minutes for large countries
const RETRY_ATTEMPTS = 2;

// Priority countries only
const PRIORITY_COUNTRIES = ['USA', 'CHN', 'IND', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'IDN', 'PAK'];

class CountyDownloader {
  constructor() {
    this.stats = {
      total: PRIORITY_COUNTRIES.length,
      downloaded: 0,
      failed: 0,
      skipped: 0,
      startTime: Date.now()
    };
  }

  async downloadCountry(countryCode, attempt = 1) {
    const outputPath = path.join(OUTPUT_DIR, `${countryCode}-ADM2.geojson`);

    // Skip if already downloaded
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`⏭️  ${countryCode}: Already exists (${sizeMB}MB) - skipping`);
      this.stats.skipped++;
      return { success: true, cached: true };
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
      return { success: true, counties: countyCount, size: sizeMB, time: elapsed };

    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (attempt < RETRY_ATTEMPTS) {
        console.log(`⚠️ ${countryCode}: ${error.message} - retrying...`);
        await this.delay(3000);
        return this.downloadCountry(countryCode, attempt + 1);
      }

      console.error(`❌ ${countryCode}: Failed - ${error.message}`);
      this.stats.failed++;
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

        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
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

  async run() {
    console.log('🌍 Priority County Downloader (TEST)');
    console.log('='.repeat(70));
    console.log(`📂 Output: ${OUTPUT_DIR}`);
    console.log(`📋 Countries: ${PRIORITY_COUNTRIES.length}`);
    console.log('='.repeat(70));
    console.log('');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`✅ Created directory\n`);
    }

    // Download each country
    for (let i = 0; i < PRIORITY_COUNTRIES.length; i++) {
      const countryCode = PRIORITY_COUNTRIES[i];
      console.log(`\n[${i + 1}/${PRIORITY_COUNTRIES.length}] ${countryCode}`);
      console.log('-'.repeat(70));

      await this.downloadCountry(countryCode);
      await this.delay(2000); // 2 second delay
    }

    // Final stats
    const elapsed = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Downloaded: ${this.stats.downloaded}`);
    console.log(`⏭️  Skipped:    ${this.stats.skipped}`);
    console.log(`❌ Failed:     ${this.stats.failed}`);
    console.log(`⏱️  Time:       ${elapsed} minutes`);
    console.log('='.repeat(70));
    console.log('\n✅ Test download complete!');
  }
}

// Run downloader
const downloader = new CountyDownloader();
downloader.run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

