/**
 * Cesium Batch Renderer - High-performance WebGL entity batching
 * Optimizes rendering of thousands of entities using Cesium primitive collections
 */
import * as Cesium from 'cesium';

class CesiumBatchRenderer {
  constructor(cesiumViewer) {
    this.viewer = cesiumViewer;
    this.scene = cesiumViewer.scene;
    this.camera = cesiumViewer.camera;
    
    // Primitive collections for batched rendering
    this.pointCollection = new Cesium.PointPrimitiveCollection();
    this.billboardCollection = new Cesium.BillboardCollection();
    this.labelCollection = new Cesium.LabelCollection();
    this.primitiveCollection = new Cesium.PrimitiveCollection();
    
    // Entity pools for reuse
    this.entityPools = {
      points: [],
      billboards: [],
      labels: []
    };
    
    // Performance tracking
    this.renderStats = {
      totalEntities: 0,
      drawCalls: 0,
      renderTime: 0,
      lastUpdate: Date.now()
    };

    this.initializeBatchRenderer();
  }

  initializeBatchRenderer() {
    // Add primitive collections to scene
    this.scene.primitives.add(this.pointCollection);
    this.scene.primitives.add(this.billboardCollection);
    this.scene.primitives.add(this.labelCollection);
    
    console.log('🎨 [CesiumBatchRenderer] Initialized with primitive collections');
  }

  /**
   * Batch render channel candidates using primitive collections
   * @param {Array} channels - Array of channels with candidates
   * @param {string} renderMode - 'gps', 'city', 'province', 'country', 'global'
   */
  batchRenderChannels(channels, renderMode = 'gps') {
    const startTime = performance.now();
    console.log(`🎨 [CesiumBatchRenderer] Batch rendering ${channels.length} channels in ${renderMode} mode`);

    // Clear existing entities
    this.clearBatchedEntities();

    let entityCount = 0;

    for (const channel of channels) {
      if (!channel.candidates || channel.candidates.length === 0) continue;

      switch (renderMode) {
        case 'gps':
          entityCount += this.renderGPSLevel(channel);
          break;
        case 'city':
        case 'province':
          entityCount += this.renderClusterLevel(channel, renderMode);
          break;
        case 'country':
        case 'global':
          entityCount += this.renderAggregateLevel(channel, renderMode);
          break;
      }
    }

    const renderTime = performance.now() - startTime;
    this.updateRenderStats(entityCount, renderTime);
    
    console.log(`✅ [CesiumBatchRenderer] Rendered ${entityCount} entities in ${renderTime.toFixed(2)}ms`);
    return entityCount;
  }

  /**
   * Render GPS level with individual candidate entities (optimized)
   */
  renderGPSLevel(channel) {
    let count = 0;
    const maxEntitiesPerChannel = 100; // Limit for performance

    const candidatesToRender = channel.candidates.slice(0, maxEntitiesPerChannel);

    for (const candidate of candidatesToRender) {
      if (!candidate.location || !candidate.location.lat || !candidate.location.lng) continue;

      const position = Cesium.Cartesian3.fromDegrees(
        candidate.location.lng,
        candidate.location.lat,
        candidate.location.height || 100
      );

      // Use point primitive for better performance than entity
      this.pointCollection.add({
        position: position,
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString(channel.color || '#6c47ff'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        id: `candidate-${candidate.id}`,
        candidateData: candidate
      });

      // Add label with batching
      if (candidatesToRender.length <= 20) { // Only show labels for small groups
        this.labelCollection.add({
          position: position,
          text: candidate.name,
          font: '12pt Arial',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          pixelOffset: new Cesium.Cartesian2(0, -30),
          id: `label-${candidate.id}`
        });
      }

      count++;
    }

    return count;
  }

  /**
   * Render cluster level with aggregated representations
   */
  renderClusterLevel(channel, level) {
    const position = this.getChannelCentroid(channel);
    if (!position) return 0;

    const candidateCount = channel.candidates.length;
    const size = Math.min(20, Math.max(8, candidateCount / 10)); // Size based on candidate count

    // Use billboard for cluster representation
    this.billboardCollection.add({
      position: position,
      image: this.createClusterTexture(candidateCount, channel.color),
      width: size * 2,
      height: size * 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      id: `cluster-${channel.id}`,
      channelData: channel
    });

    // Cluster label
    this.labelCollection.add({
      position: position,
      text: `${candidateCount}`,
      font: 'bold 14pt Arial',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      pixelOffset: new Cesium.Cartesian2(0, 0),
      id: `cluster-label-${channel.id}`
    });

    return 1;
  }

  /**
   * Render aggregate level with simplified representation
   */
  renderAggregateLevel(channel, level) {
    const position = this.getChannelCentroid(channel);
    if (!position) return 0;

    const candidateCount = channel.candidates.length;

    // Simple point for aggregate level
    this.pointCollection.add({
      position: position,
      pixelSize: 12,
      color: Cesium.Color.fromCssColorString(channel.color || '#6c47ff'),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      id: `aggregate-${channel.id}`,
      channelData: channel
    });

    return 1;
  }

  /**
   * Create cluster texture for billboard rendering
   */
  createClusterTexture(count, color = '#6c47ff') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw circle background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, 2 * Math.PI);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw count text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 999 ? '999+' : count.toString(), 32, 32);

    return canvas.toDataURL();
  }

  /**
   * Get channel centroid from candidates
   */
  getChannelCentroid(channel) {
    if (!channel.candidates || channel.candidates.length === 0) return null;

    let totalLat = 0;
    let totalLng = 0;
    let validCount = 0;

    for (const candidate of channel.candidates) {
      if (candidate.location && candidate.location.lat && candidate.location.lng) {
        totalLat += candidate.location.lat;
        totalLng += candidate.location.lng;
        validCount++;
      }
    }

    if (validCount === 0) return null;

    const avgLat = totalLat / validCount;
    const avgLng = totalLng / validCount;

    return Cesium.Cartesian3.fromDegrees(avgLng, avgLat, 100);
  }

  /**
   * Level-of-Detail (LOD) based rendering
   */
  renderWithLOD(channels) {
    const cameraHeight = this.getCameraHeight();
    let renderMode;

    if (cameraHeight < 10000) {
      renderMode = 'gps';
    } else if (cameraHeight < 50000) {
      renderMode = 'city';
    } else if (cameraHeight < 200000) {
      renderMode = 'province';
    } else if (cameraHeight < 1000000) {
      renderMode = 'country';
    } else {
      renderMode = 'global';
    }

    console.log(`🎨 [CesiumBatchRenderer] LOD rendering with mode: ${renderMode} (height: ${cameraHeight.toFixed(0)}m)`);
    return this.batchRenderChannels(channels, renderMode);
  }

  /**
   * Frustum culling - only render visible entities
   */
  renderWithCulling(channels) {
    const frustum = this.camera.frustum;
    const culledChannels = channels.filter(channel => {
      return this.isChannelInFrustum(channel, frustum);
    });

    console.log(`🎨 [CesiumBatchRenderer] Culling: ${culledChannels.length}/${channels.length} channels visible`);
    return this.batchRenderChannels(culledChannels);
  }

  /**
   * Check if channel is in camera frustum
   */
  isChannelInFrustum(channel, frustum) {
    const position = this.getChannelCentroid(channel);
    if (!position) return false;

    // Simplified frustum check - in production would use proper frustum culling
    const cameraPosition = this.camera.position;
    const distance = Cesium.Cartesian3.distance(cameraPosition, position);
    
    // Simple distance-based culling for now
    return distance < 10000000; // 10,000 km
  }

  /**
   * Get camera height above ground
   */
  getCameraHeight() {
    const cartographic = this.camera.positionCartographic;
    return cartographic.height;
  }

  /**
   * Clear all batched entities
   */
  clearBatchedEntities() {
    this.pointCollection.removeAll();
    this.billboardCollection.removeAll();
    this.labelCollection.removeAll();
    
    this.renderStats.totalEntities = 0;
  }

  /**
   * Update render performance statistics
   */
  updateRenderStats(entityCount, renderTime) {
    this.renderStats.totalEntities = entityCount;
    this.renderStats.renderTime = renderTime;
    this.renderStats.lastUpdate = Date.now();
    
    // Estimate draw calls (simplified)
    this.renderStats.drawCalls = Math.ceil(entityCount / 1000) + 3; // +3 for primitive collections
  }

  /**
   * Get current render performance stats
   */
  getRenderStats() {
    return { ...this.renderStats };
  }

  /**
   * Cleanup renderer
   */
  cleanup() {
    this.scene.primitives.remove(this.pointCollection);
    this.scene.primitives.remove(this.billboardCollection);
    this.scene.primitives.remove(this.labelCollection);
    
    this.pointCollection.destroy();
    this.billboardCollection.destroy();
    this.labelCollection.destroy();
    
    console.log('🧹 [CesiumBatchRenderer] Cleaned up renderer resources');
  }
}

export default CesiumBatchRenderer;