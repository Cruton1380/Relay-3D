/**
 * Boundary Rendering Service
 * 
 * Handles rendering of boundary proposals on the Cesium globe.
 * Supports:
 * - Preview single boundaries (current or proposed)
 * - Compare current vs proposed boundaries
 * - Color-coded styling (green for current, yellow for proposals)
 * - Camera zoom to boundary
 * - Hover glow effects
 * - GeoJSON LineString and Polygon support
 */

export class BoundaryRenderingService {
  constructor(viewer) {
    this.viewer = viewer;
    this.boundaryEntities = new Map(); // Track rendered boundary entities
    this.activePreview = null; // Currently previewed boundary ID
  }

  /**
   * Convert hex color to Cesium Color
   */
  hexToCesiumColor(hex, alpha = 1.0) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new window.Cesium.Color(r, g, b, alpha);
  }

  /**
   * Get Cesium color and material properties based on boundary status
   */
  getBoundaryStyle(isDefault) {
    if (isDefault) {
      return {
        color: this.hexToCesiumColor('#00ff00', 0.8), // Green
        outlineColor: this.hexToCesiumColor('#00ff00', 1.0),
        glowColor: this.hexToCesiumColor('#00ff00', 0.4),
        width: 4,
        dashLength: 0, // Solid line
        label: 'Current Boundary'
      };
    } else {
      return {
        color: this.hexToCesiumColor('#ffff00', 0.8), // Yellow
        outlineColor: this.hexToCesiumColor('#ffff00', 1.0),
        glowColor: this.hexToCesiumColor('#ffff00', 0.4),
        width: 3,
        dashLength: 16, // Dashed line
        label: 'Proposed Boundary'
      };
    }
  }

  /**
   * Render a boundary on the globe from GeoJSON
   */
  renderBoundary(geojson, isDefault, candidateId, metadata = {}) {
    if (!this.viewer || !geojson) {
      console.warn('⚠️ Cannot render boundary: viewer or geojson missing');
      return null;
    }

    const style = this.getBoundaryStyle(isDefault);
    const entityId = `boundary-${candidateId || Date.now()}`;

    try {
      let positions = [];

      // Handle different GeoJSON types
      if (geojson.type === 'LineString') {
        // Convert LineString coordinates to Cesium Cartesian3 positions
        positions = geojson.coordinates.map(coord =>
          window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        );
      } else if (geojson.type === 'Polygon') {
        // For Polygon, use the outer ring (first array)
        positions = geojson.coordinates[0].map(coord =>
          window.Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        );
      } else {
        console.warn(`⚠️ Unsupported GeoJSON type: ${geojson.type}`);
        return null;
      }

      // Create polyline entity for the boundary
      const entity = this.viewer.entities.add({
        id: entityId,
        name: metadata.name || style.label,
        polyline: {
          positions: positions,
          width: style.width,
          material: style.dashLength > 0
            ? new window.Cesium.PolylineDashMaterialProperty({
                color: style.color,
                dashLength: style.dashLength
              })
            : style.color,
          clampToGround: true,
          classificationType: window.Cesium.ClassificationType.TERRAIN
        },
        description: `
          <div style="font-family: Arial; padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: ${isDefault ? '#00ff00' : '#ffff00'};">
              ${metadata.name || style.label}
            </h3>
            ${metadata.direction ? `<p><strong>Direction:</strong> ${metadata.direction}</p>` : ''}
            ${metadata.adjacentRegions ? `<p><strong>Adjacent:</strong> ${metadata.adjacentRegions.join(', ')}</p>` : ''}
            ${metadata.proposer ? `<p><strong>Proposed by:</strong> ${metadata.proposer}</p>` : ''}
            ${metadata.votes !== undefined ? `<p><strong>Votes:</strong> ${metadata.votes}</p>` : ''}
          </div>
        `
      });

      // Store entity reference
      this.boundaryEntities.set(entityId, {
        entity,
        geojson,
        isDefault,
        candidateId,
        metadata
      });

      console.log(`✅ Rendered boundary: ${entityId} (${style.label})`);
      return entity;
    } catch (error) {
      console.error('❌ Error rendering boundary:', error);
      return null;
    }
  }

  /**
   * Preview a single boundary
   */
  previewBoundary(candidateId, geojson, isDefault, metadata = {}) {
    // Clear any existing preview
    this.clearPreview();

    // Render the boundary
    const entity = this.renderBoundary(geojson, isDefault, candidateId, metadata);
    
    if (entity) {
      this.activePreview = candidateId;
      
      // Zoom to the boundary
      this.zoomToBoundary(geojson);
    }

    return entity;
  }

  /**
   * Compare current boundary with proposed boundary
   */
  compareBoundaries(currentGeojson, proposalGeojson, currentMetadata = {}, proposalMetadata = {}) {
    // Clear any existing preview
    this.clearPreview();

    // Render both boundaries
    const currentEntity = this.renderBoundary(
      currentGeojson,
      true,
      'current',
      { ...currentMetadata, name: currentMetadata.name || 'Current Boundary' }
    );

    const proposalEntity = this.renderBoundary(
      proposalGeojson,
      false,
      'proposal',
      { ...proposalMetadata, name: proposalMetadata.name || 'Proposed Boundary' }
    );

    if (currentEntity && proposalEntity) {
      this.activePreview = 'comparison';
      
      // Zoom to show both boundaries
      this.zoomToBothBoundaries(currentGeojson, proposalGeojson);
    }

    return { currentEntity, proposalEntity };
  }

  /**
   * Calculate bounding rectangle from GeoJSON coordinates
   */
  calculateBounds(coordinates) {
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    coordinates.forEach(coord => {
      const lon = coord[0];
      const lat = coord[1];
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return window.Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);
  }

  /**
   * Zoom camera to show a boundary
   */
  zoomToBoundary(geojson) {
    if (!this.viewer || !geojson) return;

    try {
      const coordinates = geojson.type === 'LineString'
        ? geojson.coordinates
        : geojson.coordinates[0]; // Polygon outer ring

      const bounds = this.calculateBounds(coordinates);
      
      // Add padding around the boundary
      const padding = 0.1; // 10% padding
      const width = bounds.east - bounds.west;
      const height = bounds.north - bounds.south;
      
      const paddedBounds = new window.Cesium.Rectangle(
        bounds.west - width * padding,
        bounds.south - height * padding,
        bounds.east + width * padding,
        bounds.north + height * padding
      );

      this.viewer.camera.flyTo({
        destination: paddedBounds,
        duration: 2.0,
        easingFunction: window.Cesium.EasingFunction.CUBIC_IN_OUT
      });

      console.log('📷 Zoomed to boundary');
    } catch (error) {
      console.error('❌ Error zooming to boundary:', error);
    }
  }

  /**
   * Zoom camera to show both boundaries (for comparison)
   */
  zoomToBothBoundaries(geojson1, geojson2) {
    if (!this.viewer || !geojson1 || !geojson2) return;

    try {
      const coords1 = geojson1.type === 'LineString'
        ? geojson1.coordinates
        : geojson1.coordinates[0];

      const coords2 = geojson2.type === 'LineString'
        ? geojson2.coordinates
        : geojson2.coordinates[0];

      // Combine all coordinates
      const allCoords = [...coords1, ...coords2];
      const bounds = this.calculateBounds(allCoords);

      // Add padding
      const padding = 0.15; // 15% padding for comparison view
      const width = bounds.east - bounds.west;
      const height = bounds.north - bounds.south;
      
      const paddedBounds = new window.Cesium.Rectangle(
        bounds.west - width * padding,
        bounds.south - height * padding,
        bounds.east + width * padding,
        bounds.north + height * padding
      );

      this.viewer.camera.flyTo({
        destination: paddedBounds,
        duration: 2.5,
        easingFunction: window.Cesium.EasingFunction.CUBIC_IN_OUT
      });

      console.log('📷 Zoomed to both boundaries for comparison');
    } catch (error) {
      console.error('❌ Error zooming to boundaries:', error);
    }
  }

  /**
   * Clear preview (remove boundary entities)
   */
  clearPreview() {
    if (!this.viewer) return;

    try {
      this.boundaryEntities.forEach((data, entityId) => {
        const entity = this.viewer.entities.getById(entityId);
        if (entity) {
          this.viewer.entities.remove(entity);
        }
      });

      this.boundaryEntities.clear();
      this.activePreview = null;

      console.log('🧹 Cleared boundary preview');
    } catch (error) {
      console.error('❌ Error clearing preview:', error);
    }
  }

  /**
   * Remove a specific boundary entity
   */
  removeBoundary(candidateId) {
    const entityId = `boundary-${candidateId}`;
    const data = this.boundaryEntities.get(entityId);

    if (data && data.entity) {
      this.viewer.entities.remove(data.entity);
      this.boundaryEntities.delete(entityId);
      console.log(`🗑️ Removed boundary: ${entityId}`);
    }
  }

  /**
   * Add hover glow effect to a boundary
   */
  addHoverEffect(entityId) {
    const data = this.boundaryEntities.get(entityId);
    if (!data || !data.entity) return;

    const style = this.getBoundaryStyle(data.isDefault);
    
    // Increase width and add glow
    data.entity.polyline.width = style.width + 2;
    data.entity.polyline.material = new window.Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.3,
      color: style.glowColor
    });
  }

  /**
   * Remove hover glow effect from a boundary
   */
  removeHoverEffect(entityId) {
    const data = this.boundaryEntities.get(entityId);
    if (!data || !data.entity) return;

    const style = this.getBoundaryStyle(data.isDefault);
    
    // Reset to normal appearance
    data.entity.polyline.width = style.width;
    data.entity.polyline.material = style.dashLength > 0
      ? new window.Cesium.PolylineDashMaterialProperty({
          color: style.color,
          dashLength: style.dashLength
        })
      : style.color;
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    this.clearPreview();
    this.viewer = null;
  }
}

export default BoundaryRenderingService;
