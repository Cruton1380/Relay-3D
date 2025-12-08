/**
 * Layer Control Panel - Globe Layer Management
 * Stub for the full LayerControlPanel.jsx integration
 */
import React, { useState } from 'react';

const LayerControlPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [activeLayers, setActiveLayers] = useState(new Set(['channels', 'boundaries']));
  
  // Regions state management
  const [currentRegionLayer, setCurrentRegionLayer] = useState(null); // 'countries' or 'states'
  const [regionEntityCount, setRegionEntityCount] = useState(0);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  // Wait for region manager to be available
  const waitForRegionManager = async (maxAttempts = 20) => {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.earthGlobeControls?.regionManager) {
        console.log('✅ Region manager is now available');
        return true;
      }
      
      // Debug information about what's available
      if (i === 0) {
        console.log('🔍 Debug: window.earthGlobeControls available:', !!window.earthGlobeControls);
        if (window.earthGlobeControls) {
          console.log('🔍 Debug: earthGlobeControls keys:', Object.keys(window.earthGlobeControls));
        }
      }
      
      console.log(`⏳ Waiting for region manager... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
    }
    console.error('❌ Region manager not available after maximum attempts');
    return false;
  };

  const layers = [
    { id: 'channels', name: 'Channel Towers', icon: '📡', category: 'core' },
    { id: 'continent', name: 'Continent', icon: '🌍', category: 'geographic', level: 5 },
    { id: 'countries', name: 'Countries', icon: '🗺️', category: 'geographic', level: 4 },
    { id: 'provinces', name: 'Provinces', icon: '🏛️', category: 'geographic', level: 3 },
    { id: 'cities', name: 'Cities', icon: '🏙️', category: 'geographic', level: 2 },
    { id: 'neighborhood', name: 'Neighborhood', icon: '🏘️', category: 'geographic', level: 1 },
    { id: 'population', name: 'Population Density', icon: '👥', category: 'data' },
    { id: 'voting-activity', name: 'Voting Activity', icon: '🗳️', category: 'activity' },
    { id: 'mesh-connections', name: 'Mesh Network', icon: '🔗', category: 'network' },
    { id: 'proximity-zones', name: 'Proximity Zones', icon: '📍', category: 'spatial' },
    { id: 'reliability-heatmap', name: 'Reliability Heatmap', icon: '🌡️', category: 'analysis' },
    { id: 'real-time-updates', name: 'Real-time Updates', icon: '⚡', category: 'live' }
  ];

  const categories = [
    { id: 'core', name: 'Core', color: '#3b82f6' },
    { id: 'geographic', name: 'Geographic', color: '#10b981' },
    { id: 'data', name: 'Data', color: '#f59e0b' },
    { id: 'activity', name: 'Activity', color: '#ef4444' },
    { id: 'network', name: 'Network', color: '#8b5cf6' },
    { id: 'spatial', name: 'Spatial', color: '#06b6d4' },
    { id: 'analysis', name: 'Analysis', color: '#ec4899' },
    { id: 'live', name: 'Live', color: '#84cc16' }
  ];

        const toggleLayer = (layerId) => {
          console.log('🏙️ toggleLayer called with:', layerId);
          setActiveLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(layerId)) {
              console.log('🏙️ Removing layer:', layerId);
              newSet.delete(layerId);
              // Handle layer-specific cleanup
              if (layerId === 'cities') {
                handleClearCities();
              } else if (layerId === 'countries') {
                handleClearCountries();
              } else if (layerId === 'provinces') {
                handleClearProvinces();
              } else if (layerId === 'neighborhood') {
                handleClearNeighborhoods();
              } else if (layerId === 'continent') {
                handleClearContinents();
              }
            } else {
              console.log('🏙️ Adding layer:', layerId);
              newSet.add(layerId);
              
              // Load layers independently - no hierarchical dependencies
              if (layerId === 'cities') {
                handleLoadCities();
              } else if (layerId === 'provinces') {
                handleLoadProvinces();
              } else if (layerId === 'countries') {
                handleLoadCountries();
              } else if (layerId === 'neighborhood') {
                handleLoadNeighborhoods();
              } else if (layerId === 'continent') {
                handleLoadContinents();
              }
            }
            return newSet;
          });
        };

  const toggleCategory = (categoryId) => {
    const categoryLayers = layers.filter(l => l.category === categoryId);
    const allActive = categoryLayers.every(l => activeLayers.has(l.id));
    
    setActiveLayers(prev => {
      const newSet = new Set(prev);
      categoryLayers.forEach(layer => {
        if (allActive) {
          newSet.delete(layer.id);
        } else {
          newSet.add(layer.id);
        }
      });
      return newSet;
    });
  };

  // Region boundary handlers
  const handleLoadRegions = async (layerType) => {
    if (!window.earthGlobeControls) {
      console.error('❌ Earth globe controls not available');
      return;
    }

    // Wait for region manager to be available
    const regionManagerAvailable = await waitForRegionManager();
    if (!regionManagerAvailable) {
      console.error('❌ Region manager not available after waiting');
      return;
    }

    setIsLoadingRegions(true);
    console.log(`🔄 Loading ${layerType} boundaries...`);
    console.log('🔍 Region manager methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.earthGlobeControls.regionManager)));

    try {
      // Clear existing regions first
      await handleClearRegions();

      // Call the region manager to load regions
      const result = await window.earthGlobeControls.regionManager.loadRegions(layerType);
      
      if (result && result.success) {
        setCurrentRegionLayer(layerType);
        setRegionEntityCount(result.entityCount || 0);
        console.log(`✅ Successfully loaded ${layerType} with ${result.entityCount} entities`);
        
        // Dispatch event to notify channel renderer
        window.dispatchEvent(new CustomEvent('regionLayerLoaded', { 
          detail: { layerType, entityCount: result.entityCount } 
        }));
        
        // Log detailed summary if available
        if (result.summary) {
          console.log(`📊 ${layerType} Summary:`, result.summary);
          console.log(`✅ Created: ${result.summary.created}`);
          console.log(`⚠️ Skipped: ${result.summary.skipped}`);
          console.log(`❌ Errors: ${result.summary.errors}`);
          console.log(`📋 Unique Regions: ${result.summary.uniqueRegions}`);
        }
      } else {
        console.error('❌ Failed to load regions:', result?.error);
      }
    } catch (error) {
      console.error('❌ Error loading regions:', error);
    } finally {
      setIsLoadingRegions(false);
    }
  };



  const handleLoadStates = async () => {
    if (!window.earthGlobeControls) {
      console.error('❌ Earth globe controls not available');
      return;
    }

    // Wait for region manager to be available
    const regionManagerAvailable = await waitForRegionManager();
    if (!regionManagerAvailable) {
      console.error('❌ Region manager not available after waiting');
      return;
    }

    setIsLoadingRegions(true);
    try {
      // Call the region manager to load ALL provinces from Natural Earth
      const result = await window.earthGlobeControls.regionManager.loadAllProvincesFromNaturalEarth();
      
      if (result && result.success) {
        setCurrentRegionLayer('states');
        setRegionEntityCount(result.entityCount || 0);
        console.log(`✅ Successfully loaded ALL provinces from Natural Earth with ${result.entityCount} entities`);
        
        // Dispatch event to notify channel renderer
        window.dispatchEvent(new CustomEvent('regionLayerLoaded', { 
          detail: { layerType: 'states', entityCount: result.entityCount } 
        }));
        
        // Log detailed summary if available
        if (result.summary) {
          console.log(`📊 Provinces Summary:`, result.summary);
          console.log(`🏛️ Created: ${result.summary.created || 0}`);
          console.log(`⚠️ Skipped: ${result.summary.skipped || 0}`);
          console.log(`❌ Errors: ${result.summary.errors || 0}`);
          console.log(`📋 Unique Provinces: ${result.summary.uniqueProvinces || 0}`);
          console.log(`🌐 Total Features: ${result.summary.totalFeatures || 0}`);
        }
      } else {
        console.error('❌ Failed to load provinces from Natural Earth:', result?.error);
      }
    } catch (error) {
      console.error('❌ Error loading provinces from Natural Earth:', error);
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const handleClearRegions = async () => {
    if (!window.earthGlobeControls) {
      console.error('❌ Earth globe controls not available');
      return;
    }

    // Wait for region manager to be available
    const regionManagerAvailable = await waitForRegionManager();
    if (!regionManagerAvailable) {
      console.error('❌ Region manager not available after waiting');
      return;
    }

    try {
      await window.earthGlobeControls.regionManager.clearRegions();
      setCurrentRegionLayer(null);
      setRegionEntityCount(0);
      console.log('✅ All regions cleared');
      
      // Dispatch event to notify channel renderer
      window.dispatchEvent(new CustomEvent('regionLayerChanged', { 
        detail: { action: 'cleared' } 
      }));
    } catch (error) {
      console.error('❌ Error clearing regions:', error);
    }
  };



  const handleLoadCountries = async () => {
    console.log('🗺️ handleLoadCountries called');
    if (!window.earthGlobeControls?.regionManager) {
      console.error('❌ Region manager not available');
      return;
    }

    try {
      const result = await window.earthGlobeControls.regionManager.loadRegions('countries');
      if (result.success) {
        console.log('✅ Countries loaded successfully');
        window.dispatchEvent(new CustomEvent('countriesLoaded', { detail: result }));
      } else {
        console.error('❌ Failed to load countries:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading countries:', error);
    }
  };

  const handleClearCountries = async () => {
    if (!window.earthGlobeControls?.regionManager) {
      console.error('❌ Region manager not available');
      return;
    }

    try {
      await window.earthGlobeControls.regionManager.clearCountries();
      console.log('✅ All country entities cleared');
      window.dispatchEvent(new CustomEvent('countriesCleared'));
    } catch (error) {
      console.error('❌ Error clearing countries:', error);
    }
  };

  const handleLoadProvinces = async () => {
    console.log('🏛️ handleLoadProvinces called');
    if (!window.earthGlobeControls?.regionManager?.adminHierarchy) {
      console.error('❌ Administrative hierarchy not available');
      return;
    }

    // Check if already loaded
    const adminHierarchy = window.earthGlobeControls.regionManager.adminHierarchy;
    if (adminHierarchy.isLayerLoaded('province')) {
      console.log('✅ Provinces already loaded, skipping');
      return;
    }

    // Show loading indicator
    console.log('🔄 Loading provinces... This may take a moment due to network requests.');
    
    try {
      const result = await adminHierarchy.loadLayer('province');
      if (result.success) {
        if (result.alreadyLoaded) {
          console.log('✅ Provinces already loaded');
        } else {
          console.log('✅ Provinces loaded successfully');
        }
        window.dispatchEvent(new CustomEvent('provincesLoaded', { detail: result }));
      } else {
        console.error('❌ Failed to load provinces:', result.error);
        // Show user-friendly error message
        alert('Failed to load provinces from external sources. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('❌ Error loading provinces:', error);
      // Show user-friendly error message
      alert('Error loading provinces: ' + error.message + '\n\nThis may be due to network connectivity issues. The system will attempt to use local fallback data.');
    }
  };

  const handleClearProvinces = async () => {
    if (!window.earthGlobeControls?.regionManager?.adminHierarchy) {
      console.error('❌ Administrative hierarchy not available');
      return;
    }

    try {
      // Use the new lifecycle management
      const adminHierarchy = window.earthGlobeControls.regionManager.adminHierarchy;
      adminHierarchy.clearLayer('province');
      
      console.log('✅ All province entities cleared');
      window.dispatchEvent(new CustomEvent('provincesCleared'));
    } catch (error) {
      console.error('❌ Error clearing provinces:', error);
    }
  };

  const handleLoadCities = async () => {
    console.log('🏙️ handleLoadCities called - USING ORIGINAL REGIONMANAGER');
    
    if (!window.earthGlobeControls?.regionManager) {
      console.error('❌ RegionManager not available');
      return;
    }

    const regionManager = window.earthGlobeControls.regionManager;

    // Check if cities are already loaded
    if (regionManager.cityEntities && regionManager.cityEntities.size > 0) {
      console.log(`✅ Cities already loaded (${regionManager.cityEntities.size} entities), making them visible`);
      regionManager.cityEntities.forEach(entity => {
        entity.show = true;
      });
      return;
    }

    console.log('🔄 Loading cities using original RegionManager.loadCityBoundaries()...');
    
    try {
      // Use the original working RegionManager method
      const result = await regionManager.loadCityBoundaries();
      
      if (result.success) {
        console.log(`✅ ORIGINAL WORKING CITIES: Loaded ${result.entityCount} city entities`);
        window.dispatchEvent(new CustomEvent('citiesLoaded', { detail: result }));
      } else {
        console.error('❌ Failed to load cities:', result.error);
        alert('Failed to load cities: ' + result.error);
      }
      
    } catch (error) {
      console.error('❌ Error loading cities with original method:', error);
      alert('Error loading cities: ' + error.message);
    }
  };

  const handleClearCities = async () => {
    console.log('🗑️ handleClearCities called - USING ORIGINAL REGIONMANAGER');
    
    if (!window.earthGlobeControls?.regionManager) {
      console.error('❌ RegionManager not available');
      return;
    }

    const regionManager = window.earthGlobeControls.regionManager;

    try {
      // Use the original RegionManager clear method
      regionManager.clearCities();
      
      console.log('✅ ORIGINAL WORKING CITIES: All city entities cleared');
      window.dispatchEvent(new CustomEvent('citiesCleared'));
    } catch (error) {
      console.error('❌ Error clearing cities:', error);
    }
  };

  const handleLoadNeighborhoods = async () => {
    console.log('🏘️ handleLoadNeighborhoods called');
    if (!window.earthGlobeControls?.regionManager?.adminHierarchy) {
      console.error('❌ Administrative hierarchy not available');
      return;
    }

    // Check if already loaded
    const adminHierarchy = window.earthGlobeControls.regionManager.adminHierarchy;
    if (adminHierarchy.isLayerLoaded('neighborhood')) {
      console.log('✅ Neighborhoods already loaded, skipping');
      return;
    }

    // Show loading indicator
    console.log('🔄 Loading neighborhoods... This may take a moment due to network requests.');
    
    try {
      const result = await adminHierarchy.loadLayer('neighborhood');
      if (result.success) {
        if (result.alreadyLoaded) {
          console.log('✅ Neighborhoods already loaded');
        } else {
          console.log('✅ Neighborhoods loaded successfully');
        }
        window.dispatchEvent(new CustomEvent('neighborhoodsLoaded', { detail: result }));
      } else {
        console.error('❌ Failed to load neighborhoods:', result.error);
        // Show user-friendly error message
        alert('Failed to load neighborhoods from external sources. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('❌ Error loading neighborhoods:', error);
      // Show user-friendly error message
      alert('Error loading neighborhoods: ' + error.message + '\n\nThis may be due to network connectivity issues. The system will attempt to use local fallback data.');
    }
  };

  const handleClearNeighborhoods = async () => {
    if (!window.earthGlobeControls?.regionManager?.adminHierarchy) {
      console.error('❌ Administrative hierarchy not available');
      return;
    }

    try {
      // Clear neighborhood entities
      const neighborhoodEntities = window.earthGlobeControls.regionManager.adminHierarchy.entities.neighborhood;
      for (const [id, entity] of neighborhoodEntities) {
        window.earthGlobeControls.regionManager.viewer.entities.remove(entity);
      }
      neighborhoodEntities.clear();
      
      // Clear neighborhood Others
      const neighborhoodOthers = window.earthGlobeControls.regionManager.adminHierarchy.othersEntities.neighborhood;
      for (const [id, entity] of neighborhoodOthers) {
        window.earthGlobeControls.regionManager.viewer.entities.remove(entity);
      }
      neighborhoodOthers.clear();
      
      console.log('✅ Neighborhoods cleared');
      window.dispatchEvent(new CustomEvent('neighborhoodsCleared'));
    } catch (error) {
      console.error('❌ Error clearing neighborhoods:', error);
    }
  };

  const handleLoadContinents = async () => {
    console.log('🌍 handleLoadContinents called');
    if (!window.earthGlobeControls?.regionManager?.adminHierarchy) {
      console.error('❌ Administrative hierarchy not available');
      return;
    }

    try {
      const result = await window.earthGlobeControls.regionManager.adminHierarchy.loadLayer('continent');
      if (result.success) {
        console.log('✅ Continents loaded successfully');
        window.dispatchEvent(new CustomEvent('continentsLoaded', { detail: result }));
      } else {
        console.error('❌ Failed to load continents:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading continents:', error);
    }
  };

  const handleClearContinents = async () => {
    if (!window.earthGlobeControls?.regionManager?.adminHierarchy) {
      console.error('❌ Administrative hierarchy not available');
      return;
    }

    try {
      // Clear continent entities
      const continentEntities = window.earthGlobeControls.regionManager.adminHierarchy.entities.continent;
      for (const [id, entity] of continentEntities) {
        window.earthGlobeControls.regionManager.viewer.entities.remove(entity);
      }
      continentEntities.clear();
      
      // Clear country Others
      const countryOthers = window.earthGlobeControls.regionManager.adminHierarchy.othersEntities.country;
      for (const [id, entity] of countryOthers) {
        window.earthGlobeControls.regionManager.viewer.entities.remove(entity);
      }
      countryOthers.clear();
      
      console.log('✅ Continents cleared');
      window.dispatchEvent(new CustomEvent('continentsCleared'));
    } catch (error) {
      console.error('❌ Error clearing continents:', error);
    }
  };

  // Debug: Log layers array on every render
  console.log('🏙️ LayerControlPanel render - layers:', layers.map(l => l.id));
  console.log('🏙️ LayerControlPanel render - activeLayers:', Array.from(activeLayers));

  return (
    <div className="layer-control-panel">
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
            Globe Layers ({activeLayers.size})
          </span>
          {/* Debug: Show cities layer status */}
          <span style={{ fontSize: '10px', color: '#ff0000' }}>
            Cities: {layers.find(l => l.id === 'cities') ? 'FOUND' : 'MISSING'}
          </span>
          <button
            onClick={() => setActiveLayers(new Set())}
            style={{
              background: 'none',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              color: '#9ca3af',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        {/* Regions & Boundaries Section */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: 'rgba(31, 41, 55, 0.5)', 
          borderRadius: '6px',
          border: '1px solid rgba(75, 85, 99, 0.3)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff' }}>
              🌍 Regions & Boundaries
            </span>
            {currentRegionLayer && (
              <span style={{ 
                fontSize: '10px', 
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.2)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                {regionEntityCount} entities
              </span>
            )}
          </div>
          
          {/* Region Layer Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={() => toggleLayer('countries')}
              style={{
                padding: '8px',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '4px',
                background: activeLayers.has('countries') ? '#FF6B35' : 'rgba(31, 41, 55, 0.8)',
                color: activeLayers.has('countries') ? 'white' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px'
              }}
              title="Toggle country boundaries"
            >
              <span style={{ fontSize: '14px' }}>🗺️</span>
              <span>Countries</span>
            </button>

            <button
              onClick={() => toggleLayer('provinces')}
              style={{
                padding: '8px',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '4px',
                background: activeLayers.has('provinces') ? '#10B981' : 'rgba(31, 41, 55, 0.8)',
                color: activeLayers.has('provinces') ? 'white' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px'
              }}
              title="Toggle province/state boundaries"
            >
              <span style={{ fontSize: '14px' }}>🏛️</span>
              <span>Provinces</span>
            </button>

            <button
              onClick={() => toggleLayer('cities')}
              style={{
                padding: '8px',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '4px',
                background: activeLayers.has('cities') ? '#EF4444' : 'rgba(31, 41, 55, 0.8)',
                color: activeLayers.has('cities') ? 'white' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px'
              }}
              title="Toggle city boundaries"
            >
              <span style={{ fontSize: '14px' }}>🏙️</span>
              <span>Cities</span>
            </button>
            <button
              onClick={() => toggleLayer('neighborhood')}
              style={{
                padding: '8px',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '4px',
                background: activeLayers.has('neighborhood') ? '#8B5CF6' : 'rgba(31, 41, 55, 0.8)',
                color: activeLayers.has('neighborhood') ? 'white' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px'
              }}
              title="Toggle neighborhood boundaries (auto-updates Others)"
            >
              <span style={{ fontSize: '14px' }}>🏘️</span>
              <span>Neighborhood</span>
            </button>
            <button
              onClick={() => toggleLayer('continent')}
              style={{
                padding: '8px',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '4px',
                background: activeLayers.has('continent') ? '#059669' : 'rgba(31, 41, 55, 0.8)',
                color: activeLayers.has('continent') ? 'white' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px'
              }}
              title="Toggle continent boundaries (auto-updates Others)"
            >
              <span style={{ fontSize: '14px' }}>🌍</span>
              <span>Continent</span>
            </button>

          </div>

          {/* Clear Regions Button */}
          <button
            onClick={handleClearRegions}
            disabled={isLoadingRegions}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              cursor: isLoadingRegions ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: isLoadingRegions ? 0.6 : 1,
              fontSize: '10px'
            }}
            title="Remove all boundary overlays"
          >
            <span style={{ fontSize: '12px' }}>🧹</span>
            <span>Clear All Boundaries</span>
          </button>

          {/* Status Information */}
          {currentRegionLayer && (
            <div style={{ 
              marginTop: '8px', 
              padding: '6px', 
              background: 'rgba(255, 107, 53, 0.1)', 
              borderRadius: '4px',
              fontSize: '10px',
              color: '#9ca3af',
              border: '1px solid rgba(255, 107, 53, 0.2)'
            }}>
              <div>Current: {currentRegionLayer === 'countries' ? 'Countries (50m)' : 'Provinces (50m)'}</div>
              <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                Source: Natural Earth (50m) - External
              </div>
            </div>
          )}
        </div>

        {/* Layer Categories */}
        <div style={{ marginBottom: '12px' }}>
          {categories.map(category => {
            const categoryLayers = layers.filter(l => l.category === category.id);
            const activeCount = categoryLayers.filter(l => activeLayers.has(l.id)).length;
            const allActive = activeCount === categoryLayers.length;
            
            return (
              <div
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  marginBottom: '2px',
                  background: allActive ? `${category.color}20` : 'rgba(31, 41, 55, 0.5)',
                  border: `1px solid ${category.color}40`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                <span style={{ color: '#ffffff' }}>{category.name}</span>
                <span style={{ 
                  color: category.color,
                  background: `${category.color}20`,
                  padding: '1px 4px',
                  borderRadius: '2px'
                }}>
                  {activeCount}/{categoryLayers.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Individual Layers */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {(() => {
            console.log('🏙️ Rendering layers, total count:', layers.length);
            console.log('🏙️ All layers:', layers.map(l => l.id));
            
            // Filter out layers that are handled by special sections
            const individualLayers = layers.filter(layer => 
              layer.id !== 'channels'
            );
            
            console.log('🏙️ Individual layers after filtering:', individualLayers.map(l => l.id));
            
            return individualLayers.map(layer => {
              // Debug logging for cities layer
              if (layer.id === 'cities') {
                console.log('🏙️ Cities layer found in layers array:', layer);
                console.log('🏙️ Active layers:', Array.from(activeLayers));
                console.log('🏙️ Cities layer active:', activeLayers.has(layer.id));
              }
              return (
            <div
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                marginBottom: '2px',
                background: activeLayers.has(layer.id) 
                  ? 'rgba(59, 130, 246, 0.2)' 
                  : 'rgba(31, 41, 55, 0.3)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{layer.icon}</span>
                <span style={{ color: '#ffffff' }}>{layer.name}</span>
                {layer.id === 'cities' && <span style={{ color: '#ff0000', fontSize: '8px' }}>TEST</span>}
              </div>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: activeLayers.has(layer.id) ? '#3b82f6' : 'rgba(75, 85, 99, 0.5)',
                  border: '1px solid rgba(75, 85, 99, 0.5)'
                }}
              />
            </div>
            );
            });
          })()}
        </div>
      </div>

      <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(75, 85, 99, 0.3)' }}>
        <button
          onClick={() => {
            console.log('Open Advanced Layer Controls');
            // Test city loading
            if (window.earthGlobeControls?.regionManager) {
              console.log('🏙️ Testing city loading...');
              window.earthGlobeControls.regionManager.loadCityBoundaries();
            }
          }}
          style={{
            width: '100%',
            padding: '6px',
            background: 'rgba(16, 185, 129, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '4px'
          }}
        >
          🌐 Advanced Controls
        </button>

        <button
          onClick={async () => {
            console.log('🧪 Testing Others implementation...');
            if (window.earthGlobeControls?.regionManager) {
              try {
                const stats = window.earthGlobeControls.regionManager.getOthersStatistics();
                console.log('📊 Others Statistics:', stats);
                
                const validation = await window.earthGlobeControls.regionManager.validateOthersImplementation();
                console.log('🧪 Others Validation:', validation);
                
                // Show results in alert for quick testing
                alert(`Others Implementation Test Results:\n\n${validation.summary}\n\nStatistics: ${stats.coverage}`);
              } catch (error) {
                console.error('❌ Error testing Others implementation:', error);
                alert('Error testing Others implementation: ' + error.message);
              }
            } else {
              alert('Region manager not available');
            }
          }}
          style={{
            width: '100%',
            padding: '6px',
            background: 'rgba(59, 130, 246, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🧪 Test Others
        </button>
      </div>
    </div>
  );
};

export default LayerControlPanel;
