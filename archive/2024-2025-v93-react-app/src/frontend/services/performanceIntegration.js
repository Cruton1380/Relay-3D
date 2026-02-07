/**
 * Performance Integration Module for GlobalChannelRenderer
 * Integrates the new CesiumBatchRenderer with existing GlobalChannelRenderer
 */

// Performance-optimized replacement functions for GlobalChannelRenderer.jsx

/**
 * Replace the existing renderIndividualCandidates function with batched rendering
 * This function should be integrated into GlobalChannelRenderer.jsx
 */
export function renderIndividualCandidatesOptimized(channels, cesiumViewer) {
  console.log(`🎨 [PERFORMANCE] Optimized rendering for ${channels.length} channels`);
  
  // Import the batch renderer
  if (!window.cesiumBatchRenderer) {
    const CesiumBatchRenderer = require('./cesiumBatchRenderer.js').default;
    window.cesiumBatchRenderer = new CesiumBatchRenderer(cesiumViewer);
  }

  const batchRenderer = window.cesiumBatchRenderer;

  // Use LOD-based rendering for optimal performance
  const entityCount = batchRenderer.renderWithLOD(channels);
  
  // Update performance stats
  const stats = batchRenderer.getRenderStats();
  console.log(`✅ [PERFORMANCE] Rendered ${entityCount} entities in ${stats.renderTime}ms`);
  
  return entityCount;
}

/**
 * Performance-optimized clustering with GPU acceleration hints
 */
export function optimizedClustering(channels, clusterLevel, cesiumViewer) {
  console.log(`⚡ [CLUSTERING] Optimized clustering at ${clusterLevel} level`);
  
  // Pre-filter channels by viewport for performance
  const viewportChannels = filterChannelsByViewport(channels, cesiumViewer);
  
  // Use WebGL batch renderer for clustering
  if (!window.cesiumBatchRenderer) {
    const CesiumBatchRenderer = require('./cesiumBatchRenderer.js').default;
    window.cesiumBatchRenderer = new CesiumBatchRenderer(cesiumViewer);
  }

  const batchRenderer = window.cesiumBatchRenderer;
  const entityCount = batchRenderer.batchRenderChannels(viewportChannels, clusterLevel);
  
  console.log(`✅ [CLUSTERING] Clustered ${viewportChannels.length} channels into ${entityCount} entities`);
  return entityCount;
}

/**
 * Viewport-based channel filtering for performance
 */
function filterChannelsByViewport(channels, cesiumViewer) {
  const camera = cesiumViewer.camera;
  const cameraHeight = camera.positionCartographic.height;
  
  // Distance-based filtering
  const maxDistance = Math.min(10000000, cameraHeight * 2); // 2x camera height or 10,000km max
  
  return channels.filter(channel => {
    if (!channel.location || !channel.location.lat || !channel.location.lng) {
      return false;
    }
    
    const channelPosition = Cesium.Cartesian3.fromDegrees(
      channel.location.lng, 
      channel.location.lat, 
      channel.location.height || 0
    );
    
    const distance = Cesium.Cartesian3.distance(camera.position, channelPosition);
    return distance < maxDistance;
  });
}

/**
 * Performance monitoring integration
 */
export class GlobalRendererPerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 60,
      entityCount: 0,
      renderTime: 0,
      clusterLevel: 'gps',
      memoryUsage: 0,
      lastUpdate: Date.now()
    };
    
    this.frameRateHistory = [];
    this.isMonitoring = false;
  }

  startMonitoring(cesiumViewer) {
    if (this.isMonitoring) return;
    
    this.cesiumViewer = cesiumViewer;
    this.isMonitoring = true;
    
    // Monitor frame rate
    this.frameRateTimer = setInterval(() => {
      this.updateFrameRate();
    }, 1000);
    
    console.log('📊 [PERFORMANCE] Started performance monitoring');
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.frameRateTimer) {
      clearInterval(this.frameRateTimer);
    }
    
    console.log('📊 [PERFORMANCE] Stopped performance monitoring');
  }

  updateFrameRate() {
    if (!this.cesiumViewer) return;
    
    const scene = this.cesiumViewer.scene;
    const fps = Math.round(1.0 / scene.lastRenderTime);
    
    this.metrics.frameRate = fps;
    this.frameRateHistory.push(fps);
    
    // Keep only last 60 samples (1 minute at 1Hz)
    if (this.frameRateHistory.length > 60) {
      this.frameRateHistory.shift();
    }
    
    // Log performance warnings
    if (fps < 30) {
      console.warn(`⚠️ [PERFORMANCE] Low frame rate detected: ${fps} FPS`);
    }
  }

  updateMetrics(entityCount, renderTime, clusterLevel) {
    this.metrics.entityCount = entityCount;
    this.metrics.renderTime = renderTime;
    this.metrics.clusterLevel = clusterLevel;
    this.metrics.lastUpdate = Date.now();
    
    // Estimate memory usage (simplified)
    this.metrics.memoryUsage = entityCount * 0.001; // ~1KB per entity estimate
  }

  getPerformanceReport() {
    const avgFrameRate = this.frameRateHistory.length > 0 ? 
      this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length : 
      this.metrics.frameRate;
    
    return {
      ...this.metrics,
      averageFrameRate: Math.round(avgFrameRate),
      minFrameRate: Math.min(...this.frameRateHistory),
      maxFrameRate: Math.max(...this.frameRateHistory),
      performanceScore: this.calculatePerformanceScore(),
      recommendations: this.getPerformanceRecommendations()
    };
  }

  calculatePerformanceScore() {
    const fpsScore = Math.min(100, (this.metrics.frameRate / 60) * 100);
    const renderScore = Math.max(0, 100 - (this.metrics.renderTime / 10)); // 10ms = 100 score
    const entityScore = Math.max(0, 100 - (this.metrics.entityCount / 50)); // 5000 entities = 0 score
    
    return Math.round((fpsScore + renderScore + entityScore) / 3);
  }

  getPerformanceRecommendations() {
    const recommendations = [];
    
    if (this.metrics.frameRate < 30) {
      recommendations.push('Consider reducing entity count or increasing cluster level');
    }
    
    if (this.metrics.renderTime > 100) {
      recommendations.push('Enable LOD rendering or reduce visual complexity');
    }
    
    if (this.metrics.entityCount > 1000) {
      recommendations.push('Use batch rendering and primitive collections');
    }
    
    if (this.metrics.memoryUsage > 100) {
      recommendations.push('Implement entity pooling and memory optimization');
    }
    
    return recommendations;
  }
}

/**
 * Integration helper to modify existing GlobalChannelRenderer
 */
export function upgradeGlobalChannelRenderer(existingRenderer) {
  console.log('🔧 [UPGRADE] Upgrading GlobalChannelRenderer with performance optimizations');
  
  // Store original methods
  const originalRenderIndividual = existingRenderer.renderIndividualCandidates;
  const originalCluster = existingRenderer.groupCandidatesByClusterLevel;
  
  // Replace with optimized versions
  existingRenderer.renderIndividualCandidatesOptimized = function(channels) {
    return renderIndividualCandidatesOptimized(channels, this.cesiumViewer);
  };
  
  existingRenderer.optimizedClustering = function(channels, clusterLevel) {
    return optimizedClustering(channels, clusterLevel, this.cesiumViewer);
  };
  
  // Add performance monitoring
  existingRenderer.performanceMonitor = new GlobalRendererPerformanceMonitor();
  existingRenderer.performanceMonitor.startMonitoring(existingRenderer.cesiumViewer);
  
  // Add method to switch between original and optimized rendering
  existingRenderer.setOptimizedRendering = function(enabled) {
    if (enabled) {
      this.renderIndividualCandidates = this.renderIndividualCandidatesOptimized;
      this.groupCandidatesByClusterLevel = this.optimizedClustering;
      console.log('✅ [UPGRADE] Optimized rendering enabled');
    } else {
      this.renderIndividualCandidates = originalRenderIndividual;
      this.groupCandidatesByClusterLevel = originalCluster;
      console.log('🔄 [UPGRADE] Original rendering restored');
    }
  };
  
  // Enable optimized rendering by default for large datasets
  existingRenderer.autoOptimize = function(channels) {
    const totalEntities = channels.reduce((sum, ch) => sum + (ch.candidates?.length || 0), 0);
    const shouldOptimize = totalEntities > 500;
    
    this.setOptimizedRendering(shouldOptimize);
    
    if (shouldOptimize) {
      console.log(`⚡ [AUTO-OPTIMIZE] Enabled for ${totalEntities} entities`);
    }
    
    return shouldOptimize;
  };
  
  console.log('✅ [UPGRADE] GlobalChannelRenderer upgrade complete');
  return existingRenderer;
}

// Export for global access
window.upgradeGlobalChannelRenderer = upgradeGlobalChannelRenderer;