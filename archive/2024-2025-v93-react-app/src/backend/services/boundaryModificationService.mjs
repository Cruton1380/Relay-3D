/**
 * Boundary Modification Service
 * 
 * Generates realistic boundary modifications with:
 * - Region boundary loading from regions.json
 * - Random/specific boundary modifications
 * - Snapshot generation (comparison images)
 * - Animation frame generation
 * - Natural language change descriptions
 * 
 * Used by Channel Generator for GPS Map Channels → Boundary Modifications
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { appLogger } from '../utils/logging/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BoundaryModificationService {
  constructor() {
    this.regionsDataPath = path.join(__dirname, '../../../data/regions.json');
    this.snapshotsDir = path.join(__dirname, '../../../data/channels/boundary-snapshots');
    this.animationsDir = path.join(__dirname, '../../../data/channels/boundary-animations');
    this.regionsData = null;
  }

  /**
   * Initialize service - load regions data
   */
  async initialize() {
    try {
      // Ensure directories exist
      await fs.mkdir(this.snapshotsDir, { recursive: true });
      await fs.mkdir(this.animationsDir, { recursive: true });

      // Load regions.json
      const data = await fs.readFile(this.regionsDataPath, 'utf-8');
      this.regionsData = JSON.parse(data);

      appLogger.info(`🗺️ BoundaryModificationService initialized with ${Object.keys(this.regionsData.regions || {}).length} regions`);
    } catch (error) {
      appLogger.error('❌ Failed to initialize BoundaryModificationService:', error);
      throw error;
    }
  }

  /**
   * Load region boundary from regions.json
   * @param {string} regionName - Region name (e.g., "California", "United States")
   * @param {string} regionType - Optional: "country", "state", "metro", "city"
   * @returns {Object} Region data with boundary
   */
  async loadRegionBoundary(regionName, regionType = null) {
    if (!this.regionsData) {
      await this.initialize();
    }

    const regions = this.regionsData.regions || {};

    // Search for matching region
    for (const [regionId, regionData] of Object.entries(regions)) {
      const nameMatch = regionData.name.toLowerCase() === regionName.toLowerCase();
      const typeMatch = !regionType || regionData.type === regionType;

      if (nameMatch && typeMatch) {
        appLogger.info(`✅ Found region: ${regionData.name} (${regionData.type}, ID: ${regionId})`);
        
        return {
          id: regionId,
          name: regionData.name,
          type: regionData.type,
          boundary: regionData.boundary,
          boundarySegments: regionData.boundarySegments,
          centroid: this.calculateCentroid(regionData.boundary)
        };
      }
    }

    appLogger.warn(`⚠️ Region not found: ${regionName} (type: ${regionType || 'any'})`);
    return null;
  }

  /**
   * Calculate centroid of a polygon
   * @param {Object} boundary - GeoJSON Polygon
   * @returns {Array} [longitude, latitude]
   */
  calculateCentroid(boundary) {
    if (!boundary || boundary.type !== 'Polygon') {
      return null;
    }

    const coords = boundary.coordinates[0]; // Outer ring
    let sumLng = 0;
    let sumLat = 0;
    let count = coords.length - 1; // Exclude closing point

    for (let i = 0; i < count; i++) {
      sumLng += coords[i][0];
      sumLat += coords[i][1];
    }

    return [sumLng / count, sumLat / count];
  }

  /**
   * Generate a modified version of a boundary
   * @param {Object} originalBoundary - GeoJSON Polygon or LineString
   * @param {string} modificationType - "expand", "contract", "shift", "adjust_segment"
   * @param {Object} options - Modification options
   * @returns {Object} Modified GeoJSON and metadata
   */
  generateModification(originalBoundary, modificationType = 'random', options = {}) {
    if (!originalBoundary) {
      throw new Error('Original boundary is required');
    }

    // Random modification type if not specified
    const types = ['expand', 'contract', 'shift', 'adjust_segment'];
    const type = modificationType === 'random' 
      ? types[Math.floor(Math.random() * types.length)]
      : modificationType;

    appLogger.info(`🔧 Generating modification: ${type}`);

    // Generate modification based on type
    switch (type) {
      case 'expand':
        return this.expandBoundary(originalBoundary, options.percentage || (Math.random() * 5 + 2)); // 2-7%
      
      case 'contract':
        return this.contractBoundary(originalBoundary, options.percentage || (Math.random() * 5 + 2));
      
      case 'shift':
        return this.shiftBoundary(originalBoundary, options.direction || this.randomDirection());
      
      case 'adjust_segment':
        return this.adjustSegment(originalBoundary, options.segment || this.randomSegment());
      
      default:
        throw new Error(`Unknown modification type: ${type}`);
    }
  }

  /**
   * Expand boundary by a percentage
   */
  expandBoundary(boundary, percentage) {
    const centroid = this.calculateCentroid(boundary);
    if (!centroid) {
      throw new Error('Cannot calculate centroid for expansion');
    }

    const factor = 1 + (percentage / 100);
    const coords = boundary.coordinates[0].map(coord => {
      const [lng, lat] = coord;
      const newLng = centroid[0] + (lng - centroid[0]) * factor;
      const newLat = centroid[1] + (lat - centroid[1]) * factor;
      return [newLng, newLat];
    });

    const modifiedBoundary = {
      type: 'Polygon',
      coordinates: [coords]
    };

    const areaChange = this.calculateAreaChange(boundary, modifiedBoundary);

    return {
      modifiedBoundary,
      modificationType: 'expand',
      percentage: percentage.toFixed(1),
      areaChange,
      description: `Expands boundary outward by ${percentage.toFixed(1)}% from center`,
      affectedSegments: ['all']
    };
  }

  /**
   * Contract boundary by a percentage
   */
  contractBoundary(boundary, percentage) {
    const centroid = this.calculateCentroid(boundary);
    if (!centroid) {
      throw new Error('Cannot calculate centroid for contraction');
    }

    const factor = 1 - (percentage / 100);
    const coords = boundary.coordinates[0].map(coord => {
      const [lng, lat] = coord;
      const newLng = centroid[0] + (lng - centroid[0]) * factor;
      const newLat = centroid[1] + (lat - centroid[1]) * factor;
      return [newLng, newLat];
    });

    const modifiedBoundary = {
      type: 'Polygon',
      coordinates: [coords]
    };

    const areaChange = this.calculateAreaChange(boundary, modifiedBoundary);

    return {
      modifiedBoundary,
      modificationType: 'contract',
      percentage: percentage.toFixed(1),
      areaChange,
      description: `Contracts boundary inward by ${percentage.toFixed(1)}% toward center`,
      affectedSegments: ['all']
    };
  }

  /**
   * Shift boundary in a direction
   */
  shiftBoundary(boundary, direction) {
    const shiftAmount = (Math.random() * 0.3 + 0.1); // 0.1-0.4 degrees (~10-40km)
    
    let deltaLng = 0;
    let deltaLat = 0;

    switch (direction) {
      case 'north': deltaLat = shiftAmount; break;
      case 'south': deltaLat = -shiftAmount; break;
      case 'east': deltaLng = shiftAmount; break;
      case 'west': deltaLng = -shiftAmount; break;
    }

    const coords = boundary.coordinates[0].map(coord => {
      return [coord[0] + deltaLng, coord[1] + deltaLat];
    });

    const modifiedBoundary = {
      type: 'Polygon',
      coordinates: [coords]
    };

    const distanceKm = (shiftAmount * 111).toFixed(0); // Rough conversion to km

    return {
      modifiedBoundary,
      modificationType: 'shift',
      direction,
      shiftAmount: distanceKm,
      areaChange: 0, // Area stays same, just moves
      description: `Shifts entire boundary ${distanceKm} km ${direction}ward`,
      affectedSegments: ['all']
    };
  }

  /**
   * Adjust a specific segment (side) of the boundary
   */
  adjustSegment(boundary, segment) {
    const coords = boundary.coordinates[0];
    const adjustAmount = (Math.random() * 0.2 + 0.05); // 0.05-0.25 degrees

    // Identify which coordinates to adjust based on segment
    const adjustedCoords = coords.map((coord, index) => {
      const [lng, lat] = coord;
      let newLng = lng;
      let newLat = lat;

      // Simple heuristic: adjust coords based on segment
      switch (segment) {
        case 'north':
          if (index < coords.length / 4 || index > coords.length * 3 / 4) {
            newLat += adjustAmount;
          }
          break;
        case 'south':
          if (index >= coords.length / 4 && index <= coords.length * 3 / 4) {
            newLat -= adjustAmount;
          }
          break;
        case 'east':
          if (index >= coords.length / 4 && index <= coords.length / 2) {
            newLng += adjustAmount;
          }
          break;
        case 'west':
          if (index >= coords.length / 2 && index <= coords.length * 3 / 4) {
            newLng -= adjustAmount;
          }
          break;
      }

      return [newLng, newLat];
    });

    const modifiedBoundary = {
      type: 'Polygon',
      coordinates: [adjustedCoords]
    };

    const areaChange = this.calculateAreaChange(boundary, modifiedBoundary);
    const distanceKm = (adjustAmount * 111).toFixed(0);

    return {
      modifiedBoundary,
      modificationType: 'adjust_segment',
      segment,
      adjustAmount: distanceKm,
      areaChange,
      description: `Adjusts ${segment}ern border by ~${distanceKm} km`,
      affectedSegments: [segment]
    };
  }

  /**
   * Calculate approximate area change between two boundaries
   * @returns {number} Area change in km² (approximate)
   */
  calculateAreaChange(boundary1, boundary2) {
    // Rough area calculation using bounding box
    const area1 = this.calculateApproximateArea(boundary1);
    const area2 = this.calculateApproximateArea(boundary2);
    return Math.abs(area2 - area1);
  }

  /**
   * Calculate approximate area using bounding box
   */
  calculateApproximateArea(boundary) {
    const coords = boundary.coordinates[0];
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const widthKm = (maxLng - minLng) * 111 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    const heightKm = (maxLat - minLat) * 111;

    return widthKm * heightKm * 0.7; // Factor to account for non-rectangular shape
  }

  /**
   * Generate change description in natural language
   */
  generateChangeDescription(regionName, modificationData) {
    const { modificationType, percentage, direction, segment, adjustAmount, areaChange } = modificationData;

    let description = '';

    switch (modificationType) {
      case 'expand':
        description = `Proposes expanding ${regionName}'s boundary by ${percentage}%, `;
        description += areaChange > 0 
          ? `adding approximately ${Math.round(areaChange).toLocaleString()} km² to the region.`
          : 'with minimal area change.';
        break;

      case 'contract':
        description = `Proposes contracting ${regionName}'s boundary by ${percentage}%, `;
        description += areaChange > 0
          ? `reducing the region by approximately ${Math.round(areaChange).toLocaleString()} km².`
          : 'with minimal area change.';
        break;

      case 'shift':
        description = `Proposes shifting ${regionName}'s entire boundary ${adjustAmount} km ${direction}ward, `;
        description += `relocating the region without changing its size or shape.`;
        break;

      case 'adjust_segment':
        description = `Proposes adjusting ${regionName}'s ${segment}ern border by approximately ${adjustAmount} km, `;
        description += areaChange > 0
          ? `affecting approximately ${Math.round(areaChange).toLocaleString()} km² along the ${segment}ern edge.`
          : 'with minimal impact to total area.';
        break;

      default:
        description = `Proposes modifying ${regionName}'s boundary.`;
    }

    return description;
  }

  /**
   * Generate animation frames (interpolation between original and modified)
   */
  async generateAnimationFrames(originalBoundary, modifiedBoundary, channelId, candidateId, frameCount = 15) {
    const frames = [];
    
    const originalCoords = originalBoundary.coordinates[0];
    const modifiedCoords = modifiedBoundary.coordinates[0];

    // Ensure both have same number of points (simplification may be needed)
    const minLength = Math.min(originalCoords.length, modifiedCoords.length);

    for (let i = 0; i <= frameCount; i++) {
      const t = i / frameCount; // 0 to 1
      const frameCoords = [];

      for (let j = 0; j < minLength; j++) {
        const origLng = originalCoords[j][0];
        const origLat = originalCoords[j][1];
        const modLng = modifiedCoords[j][0];
        const modLat = modifiedCoords[j][1];

        // Linear interpolation
        const lng = origLng + (modLng - origLng) * t;
        const lat = origLat + (modLat - origLat) * t;

        frameCoords.push([lng, lat]);
      }

      frames.push({
        type: 'Polygon',
        coordinates: [frameCoords]
      });
    }

    // Save animation frames
    const animationPath = path.join(this.animationsDir, `${channelId}-${candidateId}-frames.json`);
    await fs.writeFile(animationPath, JSON.stringify({ frames, frameCount }, null, 2));

    appLogger.info(`📹 Generated ${frameCount} animation frames: ${animationPath}`);

    return {
      frames,
      frameCount,
      path: `/boundary-animations/${channelId}-${candidateId}-frames.json`
    };
  }

  /**
   * Create boundary modification candidate (main orchestrator)
   */
  async createBoundaryModificationCandidate(regionName, modificationType = 'random', candidateIndex = 1) {
    const region = await this.loadRegionBoundary(regionName);

    if (!region) {
      throw new Error(`Region not found: ${regionName}`);
    }

    const candidateId = crypto.randomUUID();
    const channelId = crypto.randomUUID(); // Temporary, will be set by caller

    // Generate modification
    const modificationData = this.generateModification(region.boundary, modificationType);
    
    // Generate description
    const description = this.generateChangeDescription(regionName, modificationData);

    // Generate candidate name
    let candidateName = '';
    switch (modificationData.modificationType) {
      case 'expand':
        candidateName = `Expand ${modificationData.percentage}%`;
        break;
      case 'contract':
        candidateName = `Contract ${modificationData.percentage}%`;
        break;
      case 'shift':
        candidateName = `Shift ${modificationData.direction.charAt(0).toUpperCase() + modificationData.direction.slice(1)} ${modificationData.shiftAmount}km`;
        break;
      case 'adjust_segment':
        candidateName = `Adjust ${modificationData.segment.charAt(0).toUpperCase() + modificationData.segment.slice(1)} Border`;
        break;
    }

    return {
      candidateId,
      candidateName,
      description,
      originalBoundary: region.boundary,
      modifiedBoundary: modificationData.modifiedBoundary,
      changeMetrics: {
        areaChange: modificationData.areaChange,
        percentChange: modificationData.percentage || 0,
        affectedSegments: modificationData.affectedSegments,
        modificationType: modificationData.modificationType
      },
      isDefault: false,
      rank: candidateIndex + 1, // Will be after default candidate
      votes: 0,
      initialVotes: 0, // New proposals start with 0 base votes
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Create complete boundary channel with multiple candidates
   */
  async createBoundaryChannel(regionName, candidateCount = 3, regionType = null) {
    // Load region data
    const region = await this.loadRegionBoundary(regionName, regionType);

    if (!region) {
      throw new Error(`Region not found: ${regionName}`);
    }

    const channelId = crypto.randomUUID();

    // Create default candidate (current boundary)
    const defaultCandidate = {
      candidateId: crypto.randomUUID(),
      candidateName: 'Current Official Boundary',
      description: `The current official boundary of ${regionName} as recognized by governmental authorities.`,
      originalBoundary: region.boundary,
      modifiedBoundary: region.boundary, // Same as original
      changeMetrics: {
        areaChange: 0,
        percentChange: 0,
        affectedSegments: [],
        modificationType: 'none'
      },
      isDefault: true,
      rank: 1,
      votes: 0,
      initialVotes: Math.floor(Math.random() * 50) + 100, // Base demo votes: 100-150
      createdAt: new Date().toISOString()
    };

    // Generate modification candidates
    const modificationCandidates = [];
    for (let i = 0; i < candidateCount; i++) {
      const candidate = await this.createBoundaryModificationCandidate(regionName, 'random', i);
      candidate.channelId = channelId; // Associate with channel
      modificationCandidates.push(candidate);
    }

    // Create channel object
    const channel = {
      id: channelId,
      name: `${regionName} Boundary`,
      category: 'gps_map',
      subtype: 'boundary',
      type: 'boundary',
      location: {
        lat: region.centroid[1],
        lng: region.centroid[0]
      },
      regionName: regionName,
      regionType: region.type,
      regionId: region.id,
      description: `Official channel for proposing modifications to the ${regionName} boundaries. The leading candidate determines the recognized boundary.`,
      isOfficial: true,
      isRelayOfficial: true,
      channelPurpose: 'boundary_modification',
      color: '#8b5cf6', // Purple
      candidates: [defaultCandidate, ...modificationCandidates],
      createdAt: new Date().toISOString()
    };

    appLogger.info(`✅ Created boundary channel: ${channel.name} with ${channel.candidates.length} candidates`);

    return channel;
  }

  // Helper methods
  randomDirection() {
    const directions = ['north', 'south', 'east', 'west'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  randomSegment() {
    return this.randomDirection(); // Same as direction for now
  }
}

// Export singleton instance
const boundaryModificationService = new BoundaryModificationService();
export default boundaryModificationService;
