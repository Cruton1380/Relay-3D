import React, { useState, useEffect, useCallback } from 'react';
import WeatherStatusComponent from '../components/WeatherStatusComponent';

const MapControlsPanel = ({ panelId, title, type }) => {
  // Core state management
  const [activeDockMode, setActiveDockMode] = useState(null);
  const [activeOverlays, setActiveOverlays] = useState(new Set());
  const [currentMapStyle, setCurrentMapStyle] = useState('clean-street');
  const [currentTopography, setCurrentTopography] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(['london', 'newyork', 'berlin', 'sydney']);
  
  // Data source status
  const [dataSourceStatus, setDataSourceStatus] = useState({
    tileServer: 'checking',
    backend: 'checking',
    weather: 'checking'
  });

  // Check data source availability and sync map style
  useEffect(() => {
    const checkDataSources = async () => {
      const status = { ...dataSourceStatus };

      try {
        const tileResponse = await fetch('http://localhost:8081/');
        status.tileServer = tileResponse.ok ? 'online' : 'offline';
      } catch {
        status.tileServer = 'offline';
      }

      try {
        const backendResponse = await fetch('http://localhost:3002/api/globe/channels');
        status.backend = backendResponse.ok ? 'online' : 'offline';
      } catch {
        status.backend = 'offline';
      }

      try {
        const weatherResponse = await fetch('http://localhost:3002/api/globe/weather/clouds/1/0/0.png');
        status.weather = weatherResponse.status === 200 || weatherResponse.status === 404 ? 'online' : 'offline';
      } catch {
        status.weather = 'offline';
      }

      setDataSourceStatus(status);
    };

    // Sync map style with actual globe state
    const syncMapStyle = () => {
      if (window.earthGlobeControls && window.earthGlobeControls.getCurrentMapType) {
        const actualMapStyle = window.earthGlobeControls.getCurrentMapType();
        if (actualMapStyle !== currentMapStyle) {
          console.log(`🔄 Syncing map style: UI shows ${currentMapStyle}, actual is ${actualMapStyle}`);
          setCurrentMapStyle(actualMapStyle);
        }
      }
    };

    checkDataSources();
    syncMapStyle();
    
    const interval = setInterval(checkDataSources, 30000);
    const mapStyleInterval = setInterval(syncMapStyle, 5000); // Check map style every 5 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(mapStyleInterval);
    };
  }, [currentMapStyle]);

  // Dock mode handlers
  const handleDockModeToggle = (mode) => {
    setActiveDockMode(activeDockMode === mode ? null : mode);
  };

  // Map style handlers
  const handleMapStyleChange = (style) => {
    console.log(`🗺️ Changing map style to: ${style}`);
    if (window.earthGlobeControls) {
      try {
        window.earthGlobeControls.setMapType(style);
        setCurrentMapStyle(style);
        console.log(`✅ Map style changed to: ${style}`);
      } catch (error) {
        console.error(`❌ Failed to change map style to ${style}:`, error);
        // Revert the UI state if the change failed
        setCurrentMapStyle('clean-street');
      }
    } else {
      console.warn('⚠️ earthGlobeControls not available');
    }
  };

  // Topography handlers
  const handleTopographyChange = (topography) => {
    setCurrentTopography(currentTopography === topography ? null : topography);
    console.log(`🏔️ Changing topography to: ${topography}`);
    if (window.earthGlobeControls) {
      window.earthGlobeControls.setTopography(topography);
    }
  };
  
  // Clear topography and reset to clean street map
  const handleClearTopography = () => {
    setCurrentTopography(null);
    console.log('🗺️ Clearing topography...');
    if (window.earthGlobeControls) {
      window.earthGlobeControls.clearTopography();
    }
  };

  // Weather overlay handlers
  const handleWeatherToggle = (weatherType) => {
    // Weather overlays are mutually exclusive - only one at a time
    if (activeOverlays.has(weatherType)) {
      // If clicking the same weather type, clear it
      if (window.earthGlobeControls) {
        window.earthGlobeControls.removeOverlay(weatherType);
      }
      setActiveOverlays(new Set());
    } else {
      // Clear any existing weather overlays first
      if (window.earthGlobeControls) {
        window.earthGlobeControls.clearWeather();
      }
      // Add the new weather overlay
      if (window.earthGlobeControls) {
        window.earthGlobeControls.addOverlay(weatherType);
      }
      setActiveOverlays(new Set([weatherType]));
    }
  };
  
  // Public data overlay handlers
  const handlePublicDataToggle = (overlay) => {
    const newOverlays = new Set(activeOverlays);
    if (newOverlays.has(overlay)) {
      newOverlays.delete(overlay);
      // Remove overlay
      if (window.earthGlobeControls) {
        window.earthGlobeControls.removeOverlay(overlay);
      }
    } else {
      newOverlays.add(overlay);
      // Add overlay
      if (window.earthGlobeControls) {
        window.earthGlobeControls.addOverlay(overlay);
      }
    }
    setActiveOverlays(newOverlays);
  };
  
  // Clear all weather overlays
  const handleClearWeather = () => {
    if (window.earthGlobeControls) {
      window.earthGlobeControls.clearWeather();
    }
    setActiveOverlays(new Set());
  };

  // Search and travel handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && window.earthGlobeControls) {
      window.earthGlobeControls.searchLocation(searchQuery.trim());
    }
  };

  const handleQuickTravel = (location) => {
    if (window.earthGlobeControls) {
      window.earthGlobeControls.travelTo(location);
    }
  };

  // Map style previews (simplified for now)
  const mapStyles = [
    { id: 'clean-street', name: 'Clean Street', icon: '🌐', description: 'Clear street map' },
    { id: 'dark', name: 'Dark Mode', icon: '🌃', description: 'Dark theme' },
    { id: 'satellite', name: 'Satellite', icon: '🛰️', description: 'Satellite imagery' },
    { id: 'hybrid', name: 'Hybrid', icon: '🗺️', description: 'Satellite + labels' },
    { id: 'minimalist', name: 'Minimalist', icon: '⚪', description: 'Clean minimal' }
  ];

  // Distinct topography options - three different visualizations
  const topographyOptions = [
    { id: 'contour-data', name: 'Topography', icon: '🗻', description: 'Topographic map with elevation contours' },
    { id: '3d-terrain', name: 'Terrain', icon: '🏔️', description: '3D hillshade terrain visualization' },
    { id: 'elevation-heatmap', name: 'Elevation Heatmap', icon: '🔥', description: 'Color-coded elevation heatmap' }
  ];

  // Weather overlay options (Local Server)
  const weatherOptions = [
    { id: 'weather-clouds', name: 'Clouds', icon: '☁️', description: 'Cloud coverage' },
    { id: 'weather-precipitation', name: 'Precipitation', icon: '🌧️', description: 'Rain and snow' },
    { id: 'weather-temperature', name: 'Temperature', icon: '🌡️', description: 'Temperature map' },
    { id: 'weather-radar', name: 'Radar', icon: '📡', description: 'Weather radar' },
    { id: 'weather-snow', name: 'Snow', icon: '❄️', description: 'Snow coverage' }
  ];
  
  // Public data overlay options
  const publicDataOptions = [
    { id: 'air-quality', name: 'Air Quality', icon: '💨', description: 'Pollution levels' },
    { id: 'parks-public', name: 'Parks', icon: '🌳', description: 'Public areas' },
    { id: 'transport', name: 'Transport', icon: '🚇', description: 'Transport networks' },
    { id: 'natural-features', name: 'Natural', icon: '🏞️', description: 'Forests and lakes' },
    { id: 'protected-areas', name: 'Protected', icon: '🛡️', description: 'Environmental zones' }
  ];

  return (
    <>
      {/* Search Bar - Top Left Overlay */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '25px',
        padding: '8px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places, coordinates..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '14px',
              minWidth: '200px',
              color: '#333'
            }}
          />
          <button type="submit" style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#666'
          }}>
            🔍
          </button>
        </form>
      </div>

      {/* Favorites Bar */}
      <div style={{
        position: 'fixed',
        top: '70px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '8px'
      }}>
        {favorites.map(city => (
          <button
            key={city}
            onClick={() => handleQuickTravel(city)}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {city === 'london' && '🏙️ London'}
            {city === 'newyork' && '🗽 NYC'}
            {city === 'berlin' && '🇩🇪 Berlin'}
            {city === 'sydney' && '🇦🇺 Sydney'}
          </button>
        ))}
      </div>

      {/* Main Floating Dock */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          
          {/* Core Dock Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleDockModeToggle('map-layers')}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: 'none',
                background: activeDockMode === 'map-layers' ? '#2196F3' : 'rgba(255,255,255,0.8)',
                color: activeDockMode === 'map-layers' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Map Layers"
            >
              🗺️
            </button>
            
            <button
              onClick={() => handleDockModeToggle('live-conditions')}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: 'none',
                background: activeDockMode === 'live-conditions' ? '#4CAF50' : 'rgba(255,255,255,0.8)',
                color: activeDockMode === 'live-conditions' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Live Conditions"
            >
              🌤️
            </button>
            
            <button
              onClick={() => handleDockModeToggle('travel-search')}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: 'none',
                background: activeDockMode === 'travel-search' ? '#FF9800' : 'rgba(255,255,255,0.8)',
                color: activeDockMode === 'travel-search' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Travel & Search"
            >
              📍
            </button>
            
            <button
              onClick={() => handleDockModeToggle('public-data')}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: 'none',
                background: activeDockMode === 'public-data' ? '#9C27B0' : 'rgba(255,255,255,0.8)',
                color: activeDockMode === 'public-data' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Public Data"
            >
              📊
            </button>
            
            <button
              onClick={() => handleDockModeToggle('topography')}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: 'none',
                background: activeDockMode === 'topography' ? '#8B4513' : 'rgba(255,255,255,0.8)',
                color: activeDockMode === 'topography' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Topography & Terrain"
            >
              🏔️
            </button>
            
            <button
              onClick={() => handleDockModeToggle('settings')}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: 'none',
                background: activeDockMode === 'settings' ? '#607D8B' : 'rgba(255,255,255,0.8)',
                color: activeDockMode === 'settings' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Settings & Tools"
            >
              ⚙️
            </button>
          </div>

          {/* Active Overlay Toggles */}
          {activeOverlays.size > 0 && (
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              padding: '8px',
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '8px'
            }}>
              {Array.from(activeOverlays).map(overlay => {
                const weatherOption = weatherOptions.find(o => o.id === overlay);
                const publicDataOption = publicDataOptions.find(o => o.id === overlay);
                const option = weatherOption || publicDataOption;
                
                if (!option) return null;
                
                return (
                  <button
                    key={overlay}
                    onClick={() => {
                      if (weatherOption) {
                        handleWeatherToggle(overlay);
                      } else {
                        handlePublicDataToggle(overlay);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      background: weatherOption ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255,255,255,0.9)',
                      color: weatherOption ? 'white' : '#333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {option.icon} {option.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Context-Aware Side Panel */}
      {activeDockMode && (
        <div style={{
          position: 'fixed',
          right: '20px',
          bottom: '90px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          minWidth: '300px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          
          {/* Map Layers Panel */}
          {activeDockMode === 'map-layers' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>🗺️ Map Styles</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px' 
              }}>
                {mapStyles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => handleMapStyleChange(style.id)}
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      background: currentMapStyle === style.id ? '#2196F3' : 'white',
                      color: currentMapStyle === style.id ? 'white' : '#333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={style.description}
                  >
                    <span style={{ fontSize: '20px' }}>{style.icon}</span>
                    <span style={{ fontSize: '12px' }}>{style.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Conditions Panel */}
          {activeDockMode === 'live-conditions' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>🌤️ Live Weather</h3>
              
              {/* Weather Status Component */}
              <div style={{ marginBottom: '16px' }}>
                <WeatherStatusComponent />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weatherOptions.map(weather => (
                  <button
                    key={weather.id}
                    onClick={() => handleWeatherToggle(weather.id)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      background: activeOverlays.has(weather.id) ? '#4CAF50' : 'white',
                      color: activeOverlays.has(weather.id) ? 'white' : '#333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: activeOverlays.has(weather.id) ? 'bold' : 'normal'
                    }}
                    title={weather.description}
                  >
                    <span style={{ fontSize: '16px' }}>{weather.icon}</span>
                    <span>{weather.name}</span>
                  </button>
                ))}
                
                {/* Clear Weather Button */}
                <button
                  onClick={handleClearWeather}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: '#f44336',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                  title="Remove all weather overlays"
                >
                  <span style={{ fontSize: '16px' }}>🧹</span>
                  <span>Clear Weather</span>
                </button>
              </div>
            </div>
          )}

          {/* Travel & Search Panel */}
          {activeDockMode === 'travel-search' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>📍 Quick Travel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['north-america', 'europe', 'asia', 'africa', 'australia', 'south-america'].map(continent => (
                    <button
                      key={continent}
                      onClick={() => handleQuickTravel(continent)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#333',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '12px'
                      }}
                    >
                      {continent === 'north-america' && '🌎 North America'}
                      {continent === 'europe' && '🇪🇺 Europe'}
                      {continent === 'asia' && '🌏 Asia'}
                      {continent === 'africa' && '🌍 Africa'}
                      {continent === 'australia' && '🇦🇺 Australia'}
                      {continent === 'south-america' && '🌎 South America'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Public Data Panel */}
          {activeDockMode === 'public-data' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>📊 Public Data</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {publicDataOptions.map(overlay => (
                  <button
                    key={overlay.id}
                    onClick={() => handlePublicDataToggle(overlay.id)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      background: activeOverlays.has(overlay.id) ? '#9C27B0' : 'white',
                      color: activeOverlays.has(overlay.id) ? 'white' : '#333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    title={overlay.description}
                  >
                    <span style={{ fontSize: '16px' }}>{overlay.icon}</span>
                    <span>{overlay.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topography Panel */}
          {activeDockMode === 'topography' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>🏔️ Topography & Terrain</h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px' 
              }}>
                {topographyOptions.map(topography => (
                  <button
                    key={topography.id}
                    onClick={() => handleTopographyChange(topography.id)}
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      background: currentTopography === topography.id ? '#8B4513' : 'white',
                      color: currentTopography === topography.id ? 'white' : '#333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    title={topography.description}
                  >
                    <span style={{ fontSize: '20px' }}>{topography.icon}</span>
                    <span style={{ fontSize: '14px' }}>{topography.name}</span>
                  </button>
                ))}
                
                {/* Clear Topography Button */}
                <button
                  onClick={handleClearTopography}
                  style={{
                    padding: '12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: '#f44336',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                  title="Clear topography and return to clean street map"
                >
                  <span style={{ fontSize: '20px' }}>🗺️</span>
                  <span style={{ fontSize: '14px' }}>Clear Topography</span>
                </button>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {activeDockMode === 'settings' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>⚙️ Settings & Tools</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  <div>📡 Tile Server: {dataSourceStatus.tileServer}</div>
                  <div>🔗 Backend: {dataSourceStatus.backend}</div>
                  <div>🌤️ Weather: {dataSourceStatus.weather}</div>
                </div>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.refreshTileSystem();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔄 Refresh Tiles
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.refreshWeatherData();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🌤️ Refresh Weather
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.toggleTerrain(true);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🏔️ Enable Terrain
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.toggleTerrain(false);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🌍 Disable Terrain
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.addContourOverlay();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🏔️ Add Contour Lines
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.clearTopography();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🗺️ Clear Topography
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.createCustomContourLines();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🗻 Custom Contour Lines
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.createPureContourLines();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🗻 Pure Contour Lines
                </button>
                <button
                  onClick={() => {
                    if (window.earthGlobeControls) {
                      window.earthGlobeControls.setTopography('contour-data');
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🗻 Quick Contour Data
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* World Mini-Map Globe */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: '80px',
        height: '80px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '32px'
      }}
      onClick={() => handleQuickTravel('world')}
      title="World View"
      >
        🌍
      </div>
    </>
  );
};

export default MapControlsPanel;
