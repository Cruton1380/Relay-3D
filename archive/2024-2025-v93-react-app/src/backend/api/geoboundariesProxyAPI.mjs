/**
 * @fileoverview GeoBoundaries Proxy API
 * Proxies requests to GeoBoundaries GeoJSON files to avoid CORS issues
 */
import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

/**
 * Proxy endpoint for fetching GeoJSON from GeoBoundaries
 * GET /api/geoboundaries-proxy/:countryCode/:adminLevel
 */
router.get('/:countryCode/:adminLevel', async (req, res) => {
  const { countryCode, adminLevel } = req.params;
  const startTime = Date.now();
  
  try {
    console.log(`🌍 [GeoBoundaries Proxy] Fetching ${countryCode} ADM${adminLevel}`);
    
    // First, fetch metadata to get the correct GeoJSON URL
    const metadataUrl = `https://www.geoboundaries.org/api/current/gbOpen/${countryCode}/ADM${adminLevel}/`;
    
    const metadataStart = Date.now();
    const metadata = await new Promise((resolve, reject) => {
      const protocol = metadataUrl.startsWith('https') ? https : http;
      
      const request = protocol.get(metadataUrl, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          const metadataTime = Date.now() - metadataStart;
          if (response.statusCode === 200) {
            try {
              console.log(`✅ [GeoBoundaries Proxy] ${countryCode} metadata fetched in ${metadataTime}ms`);
              resolve(JSON.parse(data));
            } catch (e) {
              console.error(`❌ [GeoBoundaries Proxy] ${countryCode} metadata parse error:`, e.message);
              reject(new Error(`Failed to parse metadata JSON: ${e.message}`));
            }
          } else if (response.statusCode === 404) {
            console.warn(`⚠️ [GeoBoundaries Proxy] ${countryCode} ADM${adminLevel} not found (404) - country may not have this admin level`);
            reject(new Error(`Country ${countryCode} does not have ADM${adminLevel} data`));
          } else {
            console.error(`❌ [GeoBoundaries Proxy] ${countryCode} metadata HTTP ${response.statusCode}`);
            reject(new Error(`Metadata fetch failed with status ${response.statusCode}`));
          }
        });
      });
      
      request.on('error', (error) => {
        console.error(`❌ [GeoBoundaries Proxy] ${countryCode} metadata network error:`, error.message);
        reject(error);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        console.warn(`⏱️ [GeoBoundaries Proxy] ${countryCode} metadata timeout after 10s`);
        reject(new Error('Metadata request timeout'));
      });
    }).catch(error => {
      // Re-throw with country code for better error messages
      throw new Error(`${countryCode} metadata: ${error.message}`);
    });
    
    // Get the GeoJSON URL from metadata
    const geoJsonUrl = metadata.gjDownloadURL;
    
    if (!geoJsonUrl) {
      return res.status(404).json({ 
        error: 'GeoJSON URL not found in metadata',
        countryCode,
        adminLevel 
      });
    }
    
    console.log(`📥 [GeoBoundaries Proxy] Downloading GeoJSON from: ${geoJsonUrl}`);
    
    // Fetch the actual GeoJSON file
    const geoJsonStart = Date.now();
    const geoJsonData = await new Promise((resolve, reject) => {
      const protocol = geoJsonUrl.startsWith('https') ? https : http;
      
      const request = protocol.get(geoJsonUrl, (response) => {
        // Handle redirects (GitHub raw URLs often redirect)
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          console.log(`↪️ [GeoBoundaries Proxy] ${countryCode} following redirect to: ${redirectUrl}`);
          
          const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
          const redirectRequest = redirectProtocol.get(redirectUrl, (redirectResponse) => {
            let data = '';
            let receivedBytes = 0;
            
            redirectResponse.on('data', (chunk) => {
              data += chunk;
              receivedBytes += chunk.length;
            });
            
            redirectResponse.on('end', () => {
              const downloadTime = Date.now() - geoJsonStart;
              if (redirectResponse.statusCode === 200) {
                try {
                  const parsed = JSON.parse(data);
                  console.log(`✅ [GeoBoundaries Proxy] ${countryCode} downloaded ${receivedBytes} bytes in ${downloadTime}ms`);
                  resolve(parsed);
                } catch (e) {
                  reject(new Error(`Failed to parse GeoJSON: ${e.message}`));
                }
              } else {
                reject(new Error(`Redirect fetch failed with status ${redirectResponse.statusCode}`));
              }
            });
          });
          
          redirectRequest.on('error', (error) => {
            console.error(`❌ [GeoBoundaries Proxy] ${countryCode} redirect error:`, error.message);
            reject(error);
          });
          
          redirectRequest.setTimeout(120000, () => {
            redirectRequest.destroy();
            console.warn(`⏱️ [GeoBoundaries Proxy] ${countryCode} redirect timeout after 120s`);
            reject(new Error('GeoJSON redirect request timeout'));
          });
          
          return;
        }
        
        // Handle direct response
        let data = '';
        let receivedBytes = 0;
        
        response.on('data', (chunk) => {
          data += chunk;
          receivedBytes += chunk.length;
        });
        
        response.on('end', () => {
          const downloadTime = Date.now() - geoJsonStart;
          if (response.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              console.log(`✅ [GeoBoundaries Proxy] ${countryCode} downloaded ${receivedBytes} bytes in ${downloadTime}ms`);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse GeoJSON: ${e.message}`));
            }
          } else {
            reject(new Error(`GeoJSON fetch failed with status ${response.statusCode}`));
          }
        });
      });
      
      request.on('error', (error) => {
        console.error(`❌ [GeoBoundaries Proxy] ${countryCode} download error:`, error.message);
        reject(error);
      });
      
      request.setTimeout(120000, () => {
        request.destroy();
        console.warn(`⏱️ [GeoBoundaries Proxy] ${countryCode} download timeout after 120s`);
        reject(new Error('GeoJSON request timeout'));
      });
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [GeoBoundaries Proxy] Successfully fetched ${countryCode} ADM${adminLevel} in ${totalTime}ms total`);
    
    // Send the GeoJSON data with proper CORS headers
    res.set({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    
    res.json(geoJsonData);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [GeoBoundaries Proxy] Error fetching ${countryCode} ADM${adminLevel} after ${totalTime}ms:`, error.message);
    
    // Return 404 for "not found" errors, 500 for other errors
    const statusCode = error.message.includes('not found') || error.message.includes('404') || error.message.includes('does not have') ? 404 : 500;
    
    res.status(statusCode).json({
      error: statusCode === 404 ? 'Country data not available' : 'Failed to fetch GeoJSON data',
      message: error.message,
      countryCode,
      adminLevel
    });
  }
});

export default router;

