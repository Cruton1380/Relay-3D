import React from 'react';
import { useGlobePerformance } from '../hooks/useGlobePerformance';

const PerformancePanel = ({ isVisible = false, onClose }) => {
  const {
    performanceStats,
    performanceMode,
    setPerformanceMode,
    autoOptimize,
    isPerformanceGood,
    getFpsColor,
    getPerformanceIcon
  } = useGlobePerformance();

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      minWidth: '250px',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        paddingBottom: '8px'
      }}>
        <span style={{ fontWeight: 'bold' }}>
          {getPerformanceIcon()} Globe Performance
        </span>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0'
          }}
        >
          ✕
        </button>
      </div>

      {/* Performance Stats */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: getFpsColor(performanceStats.fps) }}>
            ● FPS: {performanceStats.fps || 0}
          </span>
        </div>
        <div style={{ marginBottom: '5px' }}>
          📊 Tiles: {performanceStats.tileCount || 0} loaded, {performanceStats.loadingTiles || 0} loading
        </div>
        <div style={{ marginBottom: '5px' }}>
          💾 Cache: {performanceStats.cacheSize || 0} tiles
        </div>
        <div style={{ marginBottom: '5px' }}>
          ⏱️ Render: {Math.round(performanceStats.renderTime || 0)}ms
        </div>
        <div style={{ marginBottom: '5px' }}>
          📏 Height: {Math.round(performanceStats.cameraHeight || 0).toLocaleString()}m
        </div>
      </div>

      {/* Performance Mode Controls */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Performance Mode:
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {['ultra_fast', 'balanced', 'quality'].map(mode => (
            <button
              key={mode}
              onClick={() => setPerformanceMode(mode)}
              style={{
                background: performanceMode === mode ? '#2196F3' : 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {mode === 'ultra_fast' ? '🚀 Ultra' : 
               mode === 'balanced' ? '⚖️ Balanced' : 
               '✨ Quality'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Quick Actions:
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={autoOptimize}
            style={{
              background: 'rgba(76, 175, 80, 0.8)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            🎯 Auto-Optimize
          </button>
          <button
            onClick={() => {
              if (window.earthGlobeControls?.refreshTiles) {
                window.earthGlobeControls.refreshTiles();
              }
            }}
            style={{
              background: 'rgba(33, 150, 243, 0.8)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Tiles
          </button>
          <button
            onClick={() => {
              if (window.earthGlobeControls?.setPerformanceMode) {
                window.earthGlobeControls.setPerformanceMode('quality');
                console.log('✨ Switched to crisp quality mode');
              }
            }}
            style={{
              background: 'rgba(156, 39, 176, 0.8)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✨ Max Quality
          </button>
          <button
            onClick={() => {
              if (window.earthGlobeControls?.optimizeForZoomLevel) {
                window.earthGlobeControls.optimizeForZoomLevel();
                console.log('🔍 Optimized tiles for current zoom level');
              }
            }}
            style={{
              background: 'rgba(255, 152, 0, 0.8)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            🔍 Fix Zoom
          </button>
        </div>
      </div>

      {/* Performance Tips */}
      <div style={{ 
        fontSize: '10px', 
        color: 'rgba(255,255,255,0.7)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: '8px'
      }}>
        💡 Tips: {performanceStats.fps < 20 ? 
          'Low FPS - try Ultra Fast mode' :
          performanceStats.fps < 30 ?
          'Moderate FPS - Balanced mode recommended' :
          'Good FPS - Quality mode available'
        }
      </div>
    </div>
  );
};

export default PerformancePanel;
