/**
 * Region Registry Module
 * Extracted from RegionManager.js - Phase 1.3
 * 
 * Manages tracking and registration of region entities across different layers
 */

export class RegionRegistry {
  constructor(viewer) {
    if (!viewer) {
      throw new Error('RegionRegistry requires a Cesium viewer');
    }

    this.viewer = viewer;

    // Active regions tracking: Map<"layerType:regionName", Array<entityId>>
    this.activeRegions = new Map();

    // Loaded regions tracking (for duplicate prevention): Set<"layerType:regionName">
    this.loadedRegions = new Set();

    // Layer visibility tracking: Map<layerType, Set<entityId>>
    this.entitiesByLayer = {
      provinces: new Set(),
      counties: new Set(),
      countries: new Set(),
      continents: new Set()
    };

    console.log('✅ RegionRegistry initialized');
  }

  /**
   * Register a region entity
   * @param {string} layerType - Type of layer (provinces, countries, continents)
   * @param {string} regionName - Name of the region
   * @param {string} entityId - ID of the Cesium entity
   */
  registerRegion(layerType, regionName, entityId) {
    const regionKey = `${layerType}:${regionName}`;

    // Track in activeRegions
    if (!this.activeRegions.has(regionKey)) {
      this.activeRegions.set(regionKey, []);
    }
    this.activeRegions.get(regionKey).push(entityId);

    // Track in loadedRegions
    this.loadedRegions.add(regionKey);

    // Track in entitiesByLayer
    if (this.entitiesByLayer[layerType]) {
      this.entitiesByLayer[layerType].add(entityId);
    }

    console.log(`📝 Registered: ${regionKey} → ${entityId}`);
  }

  /**
   * Check if a region is already loaded
   * @param {string} layerType - Type of layer
   * @param {string} regionName - Name of the region
   * @returns {boolean}
   */
  isRegionLoaded(layerType, regionName) {
    const regionKey = `${layerType}:${regionName}`;
    return this.loadedRegions.has(regionKey);
  }

  /**
   * Get all entity IDs for a specific region
   * @param {string} layerType - Type of layer
   * @param {string} regionName - Name of the region
   * @returns {Array<string>|null}
   */
  getRegionEntities(layerType, regionName) {
    const regionKey = `${layerType}:${regionName}`;
    return this.activeRegions.get(regionKey) || null;
  }

  /**
   * Get all entity IDs for a specific layer
   * @param {string} layerType - Type of layer
   * @returns {Set<string>}
   */
  getLayerEntities(layerType) {
    return this.entitiesByLayer[layerType] || new Set();
  }

  /**
   * Count entities in a layer by prefix
   * @param {string} prefix - Prefix to match (e.g., "countries:", "states:")
   * @returns {number}
   */
  countLayer(prefix) {
    let count = 0;
    this.activeRegions.forEach((entityIds, key) => {
      if (key.startsWith(prefix)) {
        count += entityIds.length;
      }
    });
    return count;
  }

  /**
   * Clear all registered regions
   * @returns {Object} - Result with success status and removed count
   */
  clearAll() {
    try {
      console.log('🗑️ Clearing all registered regions...');

      const keys = Array.from(this.activeRegions.keys());
      let removedCount = 0;

      keys.forEach((key) => {
        const entityIds = this.activeRegions.get(key);
        if (entityIds) {
          entityIds.forEach((id) => {
            const entity = this.viewer.entities.getById(id);
            if (entity) {
              this.viewer.entities.remove(entity);
              removedCount++;
            }
          });
        }
      });

      // Clear the registries
      this.activeRegions.clear();
      this.loadedRegions.clear();

      // Clear layer tracking
      Object.keys(this.entitiesByLayer).forEach(layer => {
        this.entitiesByLayer[layer].clear();
      });

      // Force render after clearing
      this.viewer.scene.requestRender();

      console.log(`✅ Cleared ${removedCount} region entities from registry`);

      // Verify no entities remain
      const remainingCount = this.countLayer("countries:") + this.countLayer("states:");
      if (remainingCount > 0) {
        console.warn(`⚠️ ${remainingCount} entities still remain after clearing`);
      } else {
        console.log("✅ All region entities successfully cleared");
      }

      return {
        success: true,
        removedCount: removedCount,
      };
    } catch (error) {
      console.error("❌ Error clearing regions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear only country entities
   * @returns {Object} - Result with success status and removed count
   */
  clearCountries() {
    try {
      console.log('🗑️ Clearing country entities...');

      const keys = Array.from(this.activeRegions.keys()).filter(key => key.startsWith('countries:'));
      let removedCount = 0;

      keys.forEach((key) => {
        const entityIds = this.activeRegions.get(key);
        if (entityIds) {
          entityIds.forEach((id) => {
            const entity = this.viewer.entities.getById(id);
            if (entity) {
              this.viewer.entities.remove(entity);
              removedCount++;
            }
          });
          this.activeRegions.delete(key);
        }
      });

      // Clear from entitiesByLayer
      this.entitiesByLayer.countries.clear();

      // Force render after clearing
      this.viewer.scene.requestRender();

      console.log(`✅ Cleared ${removedCount} country entities`);

      return {
        success: true,
        removedCount: removedCount,
      };
    } catch (error) {
      console.error("❌ Error clearing countries:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear only province entities
   * @returns {Object} - Result with success status and removed count
   */
  clearProvinces() {
    try {
      console.log('🗑️ Clearing province entities...');

      const keys = Array.from(this.activeRegions.keys()).filter(key => key.startsWith('states:') || key.startsWith('province:'));
      let removedCount = 0;

      keys.forEach((key) => {
        const entityIds = this.activeRegions.get(key);
        if (entityIds) {
          entityIds.forEach((id) => {
            const entity = this.viewer.entities.getById(id);
            if (entity) {
              this.viewer.entities.remove(entity);
              removedCount++;
            }
          });
          this.activeRegions.delete(key);
        }
      });

      // Clear from entitiesByLayer
      this.entitiesByLayer.provinces.clear();

      // Force render after clearing
      this.viewer.scene.requestRender();

      console.log(`✅ Cleared ${removedCount} province entities`);

      return {
        success: true,
        removedCount: removedCount,
      };
    } catch (error) {
      console.error("❌ Error clearing provinces:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get statistics about registered regions
   * @returns {Object} - Statistics object
   */
  getStatistics() {
    const stats = {
      totalRegions: this.activeRegions.size,
      totalLoadedRegions: this.loadedRegions.size,
      byLayer: {},
      totalEntities: 0
    };

    // Count entities by layer
    Object.keys(this.entitiesByLayer).forEach(layer => {
      const count = this.entitiesByLayer[layer].size;
      stats.byLayer[layer] = count;
      stats.totalEntities += count;
    });

    return stats;
  }

  /**
   * Clean up registry
   */
  destroy() {
    console.log('🗑️ Destroying RegionRegistry...');

    try {
      this.clearAll();
      console.log("✅ RegionRegistry destroyed successfully");
    } catch (error) {
      console.error("❌ Error destroying RegionRegistry:", error);
    }
  }
}

export default RegionRegistry;

