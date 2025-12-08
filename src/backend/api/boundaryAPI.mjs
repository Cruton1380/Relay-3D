// ============================================================================
// boundaryAPI.mjs - Administrative Boundary API Routes
// ============================================================================
// RESTful API for serving country, province, and city boundary data
// Used by Channel Generator and Globe visualization
// ============================================================================

import express from 'express';
import { boundaryService } from '../services/boundaryService.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();
const apiLogger = logger.child({ module: 'boundary-api' });

// ============================================================================
// List Endpoints (For Dropdowns)
// ============================================================================

/**
 * GET /api/boundaries/countries
 * List all available countries
 */
router.get('/countries', async (req, res) => {
  try {
    const countries = await boundaryService.listCountries();
    
    apiLogger.info(`Listed ${countries.length} countries`);
    
    res.json({
      success: true,
      count: countries.length,
      data: countries
    });
  } catch (error) {
    apiLogger.error('Failed to list countries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundaries/provinces/:countryCode
 * List all provinces for a country
 */
router.get('/provinces/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const provinces = await boundaryService.listProvinces(countryCode.toUpperCase());
    
    apiLogger.info(`Listed ${provinces.length} provinces for ${countryCode}`);
    
    res.json({
      success: true,
      count: provinces.length,
      countryCode: countryCode.toUpperCase(),
      data: provinces
    });
  } catch (error) {
    apiLogger.error(`Failed to list provinces for ${req.params.countryCode}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundaries/cities/:countryCode
 * GET /api/boundaries/cities/:countryCode/:provinceCode
 * List all cities for a country (optionally filtered by province)
 */
router.get('/cities/:countryCode/:provinceCode?', async (req, res) => {
  try {
    const { countryCode, provinceCode } = req.params;
    const cities = await boundaryService.listCities(
      countryCode.toUpperCase(),
      provinceCode?.toUpperCase()
    );
    
    apiLogger.info(`Listed ${cities.length} cities for ${countryCode}${provinceCode ? `/${provinceCode}` : ''}`);
    
    res.json({
      success: true,
      count: cities.length,
      countryCode: countryCode.toUpperCase(),
      provinceCode: provinceCode?.toUpperCase(),
      data: cities
    });
  } catch (error) {
    apiLogger.error(`Failed to list cities:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Reverse Geocoding Endpoint (Coordinates to Administrative Levels)
// ============================================================================

/**
 * GET /api/boundaries/reverse-geocode
 * Query params: lat, lng, countryCode (optional)
 * Convert coordinates to country, province, city
 */
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng, countryCode } = req.query;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Provide lat and lng as numbers.'
      });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        error: 'Latitude must be between -90 and 90'
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Longitude must be between -180 and 180'
      });
    }
    
    // Default to US if no country code provided
    // In production, you'd detect country from coordinates first
    const targetCountryCode = countryCode?.toUpperCase() || 'US';
    
    // Perform reverse geocoding
    const location = await boundaryService.detectAdministrativeLevels(
      latitude,
      longitude,
      targetCountryCode
    );
    
    apiLogger.info(`Reverse geocoded [${latitude}, ${longitude}]`, {
      country: targetCountryCode,
      province: location.province,
      city: location.city
    });
    
    res.json({
      success: true,
      location: {
        lat: latitude,
        lng: longitude,
        country: targetCountryCode, // TODO: Detect from boundaries
        countryCode: targetCountryCode,
        province: location.province,
        provinceCode: location.provinceCode,
        city: location.city,
        cityCode: location.cityCode
      }
    });
  } catch (error) {
    apiLogger.error('Reverse geocoding failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// GeoJSON Endpoints (For Visualization)
// ============================================================================

/**
 * GET /api/boundaries/geojson/country/:countryCode
 * Get GeoJSON for a country boundary
 */
router.get('/geojson/country/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const boundary = await boundaryService.getBoundary(countryCode.toUpperCase(), 'ADM0');
    
    if (!boundary) {
      return res.status(404).json({
        success: false,
        error: `Country boundary not found: ${countryCode}`
      });
    }
    
    apiLogger.info(`Served country boundary: ${countryCode}`);
    
    res.json({
      success: true,
      data: boundary
    });
  } catch (error) {
    apiLogger.error(`Failed to get country boundary for ${req.params.countryCode}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundaries/geojson/provinces/:countryCode
 * Get GeoJSON for all provinces in a country
 */
router.get('/geojson/provinces/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const boundary = await boundaryService.getBoundary(countryCode.toUpperCase(), 'ADM1');
    
    if (!boundary) {
      return res.status(404).json({
        success: false,
        error: `Province boundaries not found: ${countryCode}`
      });
    }
    
    apiLogger.info(`Served province boundaries: ${countryCode}`);
    
    res.json({
      success: true,
      data: boundary
    });
  } catch (error) {
    apiLogger.error(`Failed to get province boundaries for ${req.params.countryCode}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundaries/geojson/cities/:countryCode
 * Get GeoJSON for all cities in a country
 */
router.get('/geojson/cities/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const boundary = await boundaryService.getBoundary(countryCode.toUpperCase(), 'ADM2');
    
    if (!boundary) {
      return res.status(404).json({
        success: false,
        error: `City boundaries not found: ${countryCode}`
      });
    }
    
    apiLogger.info(`Served city boundaries: ${countryCode}`);
    
    res.json({
      success: true,
      data: boundary
    });
  } catch (error) {
    apiLogger.error(`Failed to get city boundaries for ${req.params.countryCode}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundaries/admin2/:countryCode
 * Get GeoJSON for all ADM2 (county/district) boundaries in a country
 * This endpoint serves as fallback for local files when GeoBoundaries API is unavailable
 */
router.get('/admin2/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { simplified } = req.query;
    
    apiLogger.info(`Fetching ADM2 (county) boundaries for ${countryCode} (simplified: ${simplified})`);
    
    const boundary = await boundaryService.getBoundary(countryCode.toUpperCase(), 'ADM2');
    
    if (!boundary) {
      // Return helpful message pointing to GeoBoundaries API
      return res.status(404).json({
        success: false,
        error: `No local ADM2 data for ${countryCode}. Use GeoBoundaries API instead.`,
        apiUrl: `https://www.geoboundaries.org/api/current/gbOpen/${countryCode.toUpperCase()}/ADM2/`,
        message: 'Local files not downloaded. Frontend will automatically use GeoBoundaries API.'
      });
    }
    
    const featureCount = boundary.features?.length || 0;
    apiLogger.info(`Served ${featureCount} ADM2 boundaries for ${countryCode} from local files`);
    
    res.json({
      success: true,
      source: 'local_files',
      countryCode: countryCode.toUpperCase(),
      adminLevel: 'ADM2',
      featureCount: featureCount,
      data: boundary
    });
  } catch (error) {
    apiLogger.error(`Failed to get ADM2 boundaries for ${req.params.countryCode}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Coordinate Generation (For Channel Generator)
// ============================================================================

/**
 * POST /api/boundaries/generate-coordinates
 * Generate random coordinates within a region using point-in-polygon
 * 
 * Body: {
 *   countryCode: string (required)
 *   provinceCode?: string
 *   cityCode?: string
 *   count?: number (default: 1)
 * }
 */
router.post('/generate-coordinates', async (req, res) => {
  try {
    const { countryCode, provinceCode, cityCode, count = 1 } = req.body;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        error: 'countryCode is required'
      });
    }
    
    const coordinates = await boundaryService.generateCoordinatesInRegion(
      countryCode.toUpperCase(),
      provinceCode?.toUpperCase(),
      cityCode?.toUpperCase(),
      count
    );
    
    apiLogger.info(`Generated ${count} coordinates for ${countryCode}${provinceCode ? `/${provinceCode}` : ''}${cityCode ? `/${cityCode}` : ''}`);
    
    res.json({
      success: true,
      count: coordinates.length,
      data: coordinates
    });
  } catch (error) {
    apiLogger.error('Failed to generate coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/boundaries/bounds/:countryCode/:provinceCode?/:cityCode?
 * Get bounding box for a region
 */
router.get('/bounds/:countryCode/:provinceCode?/:cityCode?', async (req, res) => {
  try {
    const { countryCode, provinceCode, cityCode } = req.params;
    
    const bounds = await boundaryService.getBounds(
      countryCode.toUpperCase(),
      provinceCode?.toUpperCase(),
      cityCode?.toUpperCase()
    );
    
    if (!bounds) {
      return res.status(404).json({
        success: false,
        error: 'Bounds not found'
      });
    }
    
    apiLogger.info(`Served bounds for ${countryCode}${provinceCode ? `/${provinceCode}` : ''}${cityCode ? `/${cityCode}` : ''}`);
    
    res.json({
      success: true,
      data: bounds
    });
  } catch (error) {
    apiLogger.error('Failed to get bounds:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Cache Management
// ============================================================================

/**
 * DELETE /api/boundaries/cache
 * Clear boundary service cache
 */
router.delete('/cache', async (req, res) => {
  try {
    boundaryService.clearCache();
    
    apiLogger.info('Boundary cache cleared');
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    apiLogger.error('Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Service Status
// ============================================================================

/**
 * GET /api/boundaries/status
 * Get boundary service status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const countries = await boundaryService.listCountries();
    
    res.json({
      success: true,
      status: 'operational',
      statistics: {
        totalCountries: countries.length,
        cacheSize: boundaryService.cache.size,
        hasIndex: !!boundaryService.index
      }
    });
  } catch (error) {
    apiLogger.error('Failed to get status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
