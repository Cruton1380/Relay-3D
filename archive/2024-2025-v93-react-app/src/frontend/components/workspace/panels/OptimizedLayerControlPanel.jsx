// ============================================================================
// OptimizedLayerControlPanel.jsx - Streamlined Layer Management
// ============================================================================
// Fast, simple layer controls without compensation mechanisms
// ============================================================================

import React, { useState, useEffect } from 'react';

const OptimizedLayerControlPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [activeLayers, setActiveLayers] = useState(new Set(['channels']));
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [dataManager, setDataManager] = useState(null);

  // Initialize optimized data manager
  useEffect(() => {
    if (window.earthGlobeControls?.viewer && window.earthGlobeControls?.entitiesRef) {
      const { OptimizedDataManager } = require('../../main/globe/managers/OptimizedDataManager.js');
      const manager = new OptimizedDataManager(
        window.earthGlobeControls.viewer,
        window.earthGlobeControls.entitiesRef
      );
      setDataManager(manager);
      console.log('⚡ Optimized data manager initialized');
    }
  }, []);

  // ============================================================================
  // SIMPLIFIED LAYER DEFINITIONS
  // ============================================================================

  const layers = [
    { id: 'channels', name: 'Channels', icon: '📡', category: 'core' },
    { id: 'provinces', name: 'Provinces', icon: '🏛️', category: 'geographic' },
    { id: 'countries', name: 'Countries', icon: '🗺️', category: 'geographic' },
    { id: 'cities', name: 'Cities', icon: '🏙️', category: 'geographic' }
  ];

  // ============================================================================
  // FAST LAYER TOGGLE
  // ============================================================================

  const toggleLayer = async (layerId) => {
    const startTime = performance.now();
    
    if (activeLayers.has(layerId)) {
      // Remove layer
      await removeLayer(layerId);
      setActiveLayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(layerId);
        return newSet;
      });
    } else {
      // Add layer
      setLoadingStates(prev => new Map(prev).set(layerId, true));
      
      try {
        await addLayer(layerId);
        setActiveLayers(prev => new Set(prev).add(layerId));
      } catch (error) {
        console.error(`❌ Failed to load ${layerId}:`, error);
      } finally {
        setLoadingStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(layerId);
          return newMap;
        });
      }
    }
    
    const endTime = performance.now();
    console.log(`⚡ Layer ${layerId} toggled in ${(endTime - startTime).toFixed(0)}ms`);
  };

  // ============================================================================
  // STREAMLINED LAYER OPERATIONS
  // ============================================================================

  const addLayer = async (layerId) => {
    if (!dataManager) {
      throw new Error('Data manager not initialized');
    }

    switch (layerId) {
      case 'provinces':
        await dataManager.loadProvinces();
        break;
      case 'countries':
        // TODO: Implement countries loading
        console.log('🌍 Countries loading not yet implemented');
        break;
      case 'cities':
        // TODO: Implement cities loading
        console.log('🏙️ Cities loading not yet implemented');
        break;
      default:
        console.log(`📡 ${layerId} layer activated`);
    }
  };

  const removeLayer = async (layerId) => {
    if (!dataManager) return;

    switch (layerId) {
      case 'provinces':
      case 'countries':
      case 'cities':
        dataManager.clearAll();
        break;
      default:
        console.log(`📡 ${layerId} layer deactivated`);
    }
  };

  // ============================================================================
  // PERFORMANCE STATS
  // ============================================================================

  const getPerformanceStats = () => {
    if (!dataManager) return null;
    
    const stats = dataManager.getStats();
    return (
      <div style={{ 
        fontSize: '0.7rem', 
        color: '#888', 
        marginTop: '10px',
        padding: '5px',
        background: 'rgba(0,0,0,0.1)',
        borderRadius: '3px'
      }}>
        <div>📊 Cached: {stats.cachedData} datasets</div>
        <div>🏛️ Entities: {stats.cachedEntities}</div>
        <div>🌍 Viewer: {stats.viewerEntities}</div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!panel.isOpen) return null;

  return (
    <div className="panel-content" style={{ 
      padding: '15px',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      color: 'white',
      minWidth: '250px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>
        ⚡ Optimized Layers
      </h3>

      {/* Layer Buttons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '8px',
        marginBottom: '15px'
      }}>
        {layers.map(layer => {
          const isActive = activeLayers.has(layer.id);
          const isLoading = loadingStates.get(layer.id);
          
          return (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              disabled={isLoading}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: isActive 
                  ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: isLoading ? 'wait' : 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{layer.icon}</span>
              <span>{layer.name}</span>
              {isLoading && <span>⏳</span>}
            </button>
          );
        })}
      </div>

      {/* Performance Stats */}
      {getPerformanceStats()}

      {/* Quick Actions */}
      <div style={{ marginTop: '15px' }}>
        <button
          onClick={() => dataManager?.clearAll()}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid rgba(255, 0, 0, 0.5)',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🧹 Clear All Layers
        </button>
      </div>
    </div>
  );
};

export default OptimizedLayerControlPanel;
