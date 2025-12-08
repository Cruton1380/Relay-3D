// ============================================================================
// EarthGlobeSimple.jsx - REFACTORED GLOBE COMPONENT (Clean & Modular)
// ============================================================================
// This is the main 3D globe component - now refactored for efficiency
// 
// ✅ REFACTORED STRUCTURE:
// - Modular architecture with separate concerns
// - Clean initialization and state management
// - Performance optimized rendering
// - Simplified region loading system
// - Proper error handling and recovery
// - Direct clustering controls accessible on globe
//
// 🗂️ MODULES:
// - GlobeInitializer - Cesium setup and configuration
// - GlobeControls - Camera, map, and view controls
// - RegionManager - Country/state boundary loading
// - WeatherManager - Weather overlay system
// - TopographyManager - Terrain and elevation visualization
// ============================================================================

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef, memo } from 'react';
import ReactDOM from 'react-dom';
import PerformancePanel from '../../workspace/components/PerformancePanel.jsx';
import GlobalChannelRenderer from '../../workspace/components/Globe/GlobalChannelRenderer';
import ClusteringControlPanel from '../../workspace/panels/ClusteringControlPanel.jsx';
import CubeSizeControlPanel from '../../workspace/panels/CubeSizeControlPanel.jsx';
import RegionDropdownMenu from './ui/RegionDropdownMenu.jsx';
import GlobeBoundaryEditor from './editors/GlobeBoundaryEditor.jsx'; // ✅ Phase 2
import BoundaryChannelPanel from './panels/BoundaryChannelPanel.jsx'; // ✅ Phase 3.0 - LEGACY
import UnifiedChannelPanel from '../../shared/panels/UnifiedChannelPanel.jsx'; // ✅ NEW: Compositional architecture
import BoundaryEditToolbar from './editors/BoundaryEditToolbar.jsx'; // ✅ Slim floating toolbar
import DragDropContainer from '../../workspace/DragDropContainer.jsx'; // ✅ Draggable panel wrapper
import { channelAPI } from '../../workspace/services/apiClient.js';

// Import modular managers
import { GlobeInitializer } from './managers/GlobeInitializer';
import { GlobeControls } from './managers/GlobeControls';
import { RegionManager } from './managers/RegionManager';
import { WeatherManager } from './managers/WeatherManager';
import { TopographyManager } from './managers/TopographyManager';

// SYSTEM2: County Boundary System (Clean 300-line implementation)
import { useCountySystemV2 } from './useCountySystemV2';
import CountyLoadingIndicator from './CountyLoadingIndicator';

// MAPBOX VECTOR TILES: Working alternative to deck.gl (2D overlay)
import { useMapboxCounties } from './useMapboxCounties';

// CESIUM PRIMITIVE API: True 3D draping (no entity limits)
import { useCesiumPrimitiveCounties } from './useCesiumPrimitiveCounties';

// Feature flags: Choose rendering system
const USE_MAPBOX_VECTOR_TILES = false; // 2D overlay (MapLibre)
const USE_CESIUM_PRIMITIVE_API = true; // True 3D draping (Cesium Primitive)

// Global state management
let globalViewerInstance = null;
let globalInitializationInProgress = false;

// Global cleanup function
window.cleanupEarthGlobe = () => {
  if (globalViewerInstance && !globalViewerInstance.isDestroyed()) {
    console.log('🧹 Cleaning up global Cesium viewer on app shutdown');
    try {
      globalViewerInstance.destroy();
    } catch (e) {
      console.warn('Warning during global cleanup:', e);
    }
  }
  globalViewerInstance = null;
  globalInitializationInProgress = false;
};

const EarthGlobe = forwardRef(({ 
  onCandidateClick, 
  onCandidateHover, 
  selectedCandidate, 
  setSelectedCandidate,
  globeState,
  setGlobeState,
  onVoteUpdate, // New callback for when votes are updated
  onClusterLevelChange // Callback for cluster level changes
}, ref) => {
  // Core refs and state
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const deckOverlayRef = useRef(null); // For vector tile rendering
  
  // Debug: Log when globeState prop changes
  useEffect(() => {
    console.log('🌐 [InteractiveGlobe] globeState prop changed:', {
      hasVoteCounts: !!globeState?.voteCounts,
      voteCountKeys: globeState?.voteCounts ? Object.keys(globeState.voteCounts).length : 0,
      keys: Object.keys(globeState || {})
    });
  }, [globeState]);
  const globalChannelRendererRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showClusteringTest, setShowClusteringTest] = useState(true); // Enable for testing
  const [showCubeSizeControls, setShowCubeSizeControls] = useState(true);
  const [cubeSizeMultiplier, setCubeSizeMultiplier] = useState(1.0);
  
  // Clustering state
  const [clusterLevel, setClusterLevel] = useState('gps'); // Default to continent level for stability
  
  // Region dropdown state
  const [regionDropdown, setRegionDropdown] = useState(null); // { regionName, regionType, position: { x, y } }
  
  // Boundary editor state (NEW - Phase 2)
  const [boundaryEditor, setBoundaryEditor] = useState(null); // { channel, regionName, regionType, regionCode, proposal }
  const [boundaryVertexCount, setBoundaryVertexCount] = useState(0); // Track vertex count for toolbar
  const [boundaryEditorMode, setBoundaryEditorMode] = useState('single'); // 'single', 'multi', 'view'
  
  // Status state
  const [tileSource, setTileSource] = useState('Initializing...');
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [cameraHeight, setCameraHeight] = useState(10000000);

  // Manager instances
  const controlsRef = useRef(null);
  const regionManagerRef = useRef(null);
  const weatherManagerRef = useRef(null);
  const topographyManagerRef = useRef(null);

  // SYSTEM2: County Boundary Manager (300-line clean implementation)
  // OLD: Entity-based system (hits Cesium limits)
  const {
    initializeCountySystem: initializeCountySystemV2,
    loadCounties: loadCountiesV2,
    showCounties: showCountiesV2,
    hideCounties: hideCountiesV2,
    loadingProgress: loadingProgressV2,
    isInitialized: isInitializedV2
  } = useCountySystemV2();

  // Mapbox vector tile system (2D overlay)
  const {
    initializeCountySystem: initializeMapboxCounties,
    showCounties: showMapboxCounties,
    hideCounties: hideMapboxCounties,
    isVisible: isMapboxCountiesVisible,
    isInitialized: isMapboxInitialized
  } = useMapboxCounties(viewerRef);

  // CESIUM PRIMITIVE API: True 3D draping
  const {
    isLoading: isPrimitiveLoading,
    loadingProgress: primitiveProgress,
    error: primitiveError,
    loadCountyData: loadPrimitiveCounties,
    showCounties: showPrimitiveCounties,
    hideCounties: hidePrimitiveCounties,
    initialize: initializePrimitiveCounties
  } = useCesiumPrimitiveCounties(viewerRef.current, { debugMode: true });

  // Choose county system based on feature flags
  const usePrimitiveSystem = USE_CESIUM_PRIMITIVE_API;
  const useMapboxSystem = USE_MAPBOX_VECTOR_TILES && !USE_CESIUM_PRIMITIVE_API;
  const useEntitySystem = !USE_MAPBOX_VECTOR_TILES && !USE_CESIUM_PRIMITIVE_API;

  const initializeCountySystem = usePrimitiveSystem 
    ? initializePrimitiveCounties 
    : (useMapboxSystem ? initializeMapboxCounties : initializeCountySystemV2);
  
  const loadCounties = usePrimitiveSystem
    ? loadPrimitiveCounties
    : (useMapboxSystem ? showMapboxCounties : loadCountiesV2);
  
  const showCounties = usePrimitiveSystem
    ? showPrimitiveCounties
    : (useMapboxSystem ? showMapboxCounties : showCountiesV2);
  
  const hideCounties = usePrimitiveSystem
    ? hidePrimitiveCounties
    : (useMapboxSystem ? hideMapboxCounties : hideCountiesV2);
  
  const loadingProgress = usePrimitiveSystem
    ? primitiveProgress
    : (useMapboxSystem ? { isLoading: false, loaded: 0, total: 0 } : loadingProgressV2);
  
  const isInitialized = usePrimitiveSystem
    ? true // Primitive system initializes on first use
    : (useMapboxSystem ? isMapboxInitialized : isInitializedV2);

  // Clustering level definitions
  const clusterLevels = [
    {
      id: 'gps',
      name: 'GPS',
      description: 'Individual candidate markers at exact locations',
      icon: '📍',
      color: '#10b981'
    },
    {
      id: 'channel',
      name: 'Channel',
      description: 'Channel-based candidate cube stacks by topic',
      icon: '🔗',
      color: '#f97316'
    },
    {
      id: 'city',
      name: 'City',
      description: 'City-level channel clustering',
      icon: '🏙️',
      color: '#3b82f6'
    },
    {
      id: 'state',
      name: 'State',
      description: 'State/province level clustering',
      icon: '🏛️',
      color: '#f59e0b'
    },
    {
      id: 'country',
      name: 'Country',
      description: 'Country level clustering',
      icon: '🏳️',
      color: '#8b5cf6'
    },
    {
      id: 'macro_region',
      name: 'Region',
      description: 'UN Regional level clustering (5 regions)',
      icon: '🌎',
      color: '#ef4444'
    },
    {
      id: 'globe',
      name: 'Globe',
      description: 'Global level clustering',
      icon: '🌐',
      color: '#06b6d4'
    }
  ];

  // Handle cluster level change
  const handleClusterLevelChange = useCallback((newLevel) => {
    console.log(`🔗 Cluster level changed to: ${newLevel}`);
    setClusterLevel(newLevel);
    
    // SYSTEM2: Handle county visibility
    if (newLevel !== 'county') {
      // Hide counties when switching away from county level
      hideCounties();
    }
    
    // Update globe state
    if (setGlobeState) {
      setGlobeState(prev => ({ 
        ...prev, 
        clusterLevel: newLevel,
        channelsUpdated: Date.now()
      }));
    }
    
    // Notify parent component
    if (onClusterLevelChange) {
      onClusterLevelChange(newLevel);
    }
  }, [setGlobeState, onClusterLevelChange]);

  // Handle cube size change
  const handleCubeSizeChange = useCallback((newSize) => {
    console.log(`🧊 Cube size changed to: ${newSize}x`);
    setCubeSizeMultiplier(newSize);
    
    // Update global channel renderer if available
    if (globalChannelRendererRef.current) {
      globalChannelRendererRef.current.setCubeSizeMultiplier(newSize);
    }
  }, []);

  // Region dropdown handlers
  const handleRegionClick = useCallback((regionName, regionType, position) => {
    console.log(`🗺️ Region clicked: ${regionName} (${regionType}) at`, position);
    setRegionDropdown({ regionName, regionType, position });
  }, []);

  const handleCloseRegionDropdown = useCallback(() => {
    setRegionDropdown(null);
  }, []);

  const handleOpenBoundary = useCallback(async (regionName, regionType) => {
    console.log(`🗺️ [BOUNDARY v2.0] Opening boundary channel for ${regionName} (${regionType})`);
    
    try {
      // Generate region code based on type and name
      const regionCode = getRegionCode(regionName, regionType);
      
      console.log(`📞 [BOUNDARY] Calling auto-create API for ${regionCode}...`);
      console.log(`🔍 [BOUNDARY] Region: "${regionName}" → Code: "${regionCode}" (Expected: IRQ for Iraq)`);
      
      // Call auto-create API with forceRefresh to get updated geometry
      const response = await fetch('/api/channels/boundary/get-or-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regionName: regionName,
          regionType: regionType,
          regionCode: regionCode,
          forceRefresh: true // Force refresh to get updated geometry from naturalEarthLoader
        })
      });

      const data = await response.json();

      if (data.success && data.channel) {
        console.log(`✅ [BOUNDARY] Channel ready:`, data.channel);
        
        // Emit event to open channel panel (left side)
        const event = new CustomEvent('open-channel-panel', {
          detail: { 
            channel: data.channel,
            source: 'boundary-editor',
            isBoundaryChannel: true
          }
        });
        window.dispatchEvent(event);
        
        // ✅ Phase 2: Open boundary editor on globe (right side)
        setBoundaryEditor({
          channel: data.channel,
          regionName: regionName,
          regionType: regionType,
          regionCode: regionCode,
          proposal: null // null = start with official boundary
        });
        
        console.log('✅ [BOUNDARY] Dual interface activated: Channel panel (left) + Editor (globe)');
        
        // Close region dropdown
        setRegionDropdown(null);
      } else {
        console.error(`❌ [BOUNDARY] Failed to create channel:`, data.error);
        alert(`Failed to create boundary channel: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ [BOUNDARY] Error creating boundary channel:', error);
      alert(`Error: ${error.message}`);
    }
  }, []);

  // Helper: Generate region code from name and type
  const getRegionCode = (regionName, regionType) => {
    // Simplified region code generation
    // TODO: Implement proper ISO code lookup
    const regionCodeMap = {
      // Countries (ISO 3166-1 alpha-3) - EXPANDED LIST
      'Afghanistan': 'AFG',
      'Albania': 'ALB',
      'Algeria': 'DZA',
      'Andorra': 'AND',
      'Angola': 'AGO',
      'Argentina': 'ARG',
      'Armenia': 'ARM',
      'Australia': 'AUS',
      'Austria': 'AUT',
      'Azerbaijan': 'AZE',
      'Bahrain': 'BHR',
      'Bangladesh': 'BGD',
      'Belarus': 'BLR',
      'Belgium': 'BEL',
      'Belize': 'BLZ',
      'Benin': 'BEN',
      'Bhutan': 'BTN',
      'Bolivia': 'BOL',
      'Bosnia and Herz.': 'BIH',
      'Botswana': 'BWA',
      'Brazil': 'BRA',
      'Brunei': 'BRN',
      'Bulgaria': 'BGR',
      'Burkina Faso': 'BFA',
      'Burundi': 'BDI',
      'Cambodia': 'KHM',
      'Cameroon': 'CMR',
      'Canada': 'CAN',
      'Central African Rep.': 'CAF',
      'Chad': 'TCD',
      'Chile': 'CHL',
      'China': 'CHN',
      'Colombia': 'COL',
      'Congo': 'COG',
      'Costa Rica': 'CRI',
      'Croatia': 'HRV',
      'Cuba': 'CUB',
      'Cyprus': 'CYP',
      'Czechia': 'CZE',
      'Dem. Rep. Congo': 'COD',
      'Denmark': 'DNK',
      'Djibouti': 'DJI',
      'Dominican Rep.': 'DOM',
      'Ecuador': 'ECU',
      'Egypt': 'EGY',
      'El Salvador': 'SLV',
      'Eq. Guinea': 'GNQ',
      'Eritrea': 'ERI',
      'Estonia': 'EST',
      'eSwatini': 'SWZ',
      'Ethiopia': 'ETH',
      'Finland': 'FIN',
      'France': 'FRA',
      'Gabon': 'GAB',
      'Gambia': 'GMB',
      'Georgia': 'GEO',
      'Germany': 'DEU',
      'Ghana': 'GHA',
      'Greece': 'GRC',
      'Guatemala': 'GTM',
      'Guinea': 'GIN',
      'Guinea-Bissau': 'GNB',
      'Guyana': 'GUY',
      'Haiti': 'HTI',
      'Honduras': 'HND',
      'Hungary': 'HUN',
      'Iceland': 'ISL',
      'India': 'IND',
      'Indonesia': 'IDN',
      'Iran': 'IRN',
      'Iraq': 'IRQ',
      'Ireland': 'IRL',
      'Israel': 'ISR',
      'Italy': 'ITA',
      'Japan': 'JPN',
      'Jordan': 'JOR',
      'Kazakhstan': 'KAZ',
      'Kenya': 'KEN',
      'Kosovo': 'XKX',
      'Kuwait': 'KWT',
      'Kyrgyzstan': 'KGZ',
      'Laos': 'LAO',
      'Latvia': 'LVA',
      'Lebanon': 'LBN',
      'Lesotho': 'LSO',
      'Liberia': 'LBR',
      'Libya': 'LBY',
      'Liechtenstein': 'LIE',
      'Lithuania': 'LTU',
      'Luxembourg': 'LUX',
      'Madagascar': 'MDG',
      'Malawi': 'MWI',
      'Malaysia': 'MYS',
      'Mali': 'MLI',
      'Malta': 'MLT',
      'Mauritania': 'MRT',
      'Mexico': 'MEX',
      'Moldova': 'MDA',
      'Monaco': 'MCO',
      'Mongolia': 'MNG',
      'Montenegro': 'MNE',
      'Morocco': 'MAR',
      'Mozambique': 'MOZ',
      'Myanmar': 'MMR',
      'Namibia': 'NAM',
      'Nepal': 'NPL',
      'Netherlands': 'NLD',
      'New Zealand': 'NZL',
      'Nicaragua': 'NIC',
      'Niger': 'NER',
      'Nigeria': 'NGA',
      'North Korea': 'PRK',
      'North Macedonia': 'MKD',
      'Norway': 'NOR',
      'Oman': 'OMN',
      'Pakistan': 'PAK',
      'Palestine': 'PSE',
      'Panama': 'PAN',
      'Papua New Guinea': 'PNG',
      'Paraguay': 'PRY',
      'Peru': 'PER',
      'Philippines': 'PHL',
      'Poland': 'POL',
      'Portugal': 'PRT',
      'Qatar': 'QAT',
      'Romania': 'ROU',
      'Russia': 'RUS',
      'Rwanda': 'RWA',
      'San Marino': 'SMR',
      'Saudi Arabia': 'SAU',
      'Senegal': 'SEN',
      'Serbia': 'SRB',
      'Sierra Leone': 'SLE',
      'Singapore': 'SGP',
      'Slovakia': 'SVK',
      'Slovenia': 'SVN',
      'Somalia': 'SOM',
      'South Africa': 'ZAF',
      'South Korea': 'KOR',
      'South Sudan': 'SSD',
      'S. Sudan': 'SSD',
      'Spain': 'ESP',
      'Sri Lanka': 'LKA',
      'Sudan': 'SDN',
      'Suriname': 'SUR',
      'Sweden': 'SWE',
      'Switzerland': 'CHE',
      'Syria': 'SYR',
      'Tajikistan': 'TJK',
      'Tanzania': 'TZA',
      'Thailand': 'THA',
      'Timor-Leste': 'TLS',
      'Togo': 'TGO',
      'Tunisia': 'TUN',
      'Turkey': 'TUR',
      'Turkmenistan': 'TKM',
      'Uganda': 'UGA',
      'Ukraine': 'UKR',
      'United Arab Emirates': 'ARE',
      'United Kingdom': 'GBR',
      'United States of America': 'USA',
      'United States': 'USA',
      'Uruguay': 'URY',
      'Uzbekistan': 'UZB',
      'Venezuela': 'VEN',
      'Vietnam': 'VNM',
      'W. Sahara': 'ESH',
      'Yemen': 'YEM',
      'Zambia': 'ZMB',
      'Zimbabwe': 'ZWE',
      'Côte d\'Ivoire': 'CIV',
      
      // US States
      'California': 'US-CA',
      'Texas': 'US-TX',
      'Florida': 'US-FL',
      'New York': 'US-NY',
      
      // Continents
      'Asia': 'ASIA',
      'Europe': 'EUROPE',
      'Africa': 'AFRICA',
      'North America': 'NORTH_AMERICA',
      'South America': 'SOUTH_AMERICA',
      'Oceania': 'OCEANIA'
    };

    const code = regionCodeMap[regionName];
    
    if (code) {
      return code;
    }

    // Fallback: Generate code from name
    return regionName.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
  };

  const handleOpenParameters = useCallback((regionName, regionType) => {
    console.log(`⚙️ Opening parameters for ${regionName}`);
    alert(`Regional parameters for ${regionName} will open here.\n\nThis will show regional settings and configuration.`);
  }, []);

  const handleOpenGovernance = useCallback((regionName, regionType) => {
    console.log(`🏛️ Opening governance for ${regionName}`);
    alert(`Governance panel for ${regionName} will open here.\n\nThis will show democratic governance options.`);
  }, []);

  // Initialize globe with modular architecture
  const initializeGlobe = useCallback(async () => {
    // Prevent multiple instances
    if (globalViewerInstance || globalInitializationInProgress) {
      console.log('🔄 Cesium viewer already exists globally, reusing...');
      viewerRef.current = globalViewerInstance;
      if (globalViewerInstance) {
        if (cesiumContainerRef.current && globalViewerInstance.container !== cesiumContainerRef.current) {
          console.log('🔄 Moving global viewer to new container...');
          cesiumContainerRef.current.appendChild(globalViewerInstance.container);
        }
        setIsLoading(false);
        setTileSource('Local Tiles (Reused)');
        setServerStatus('Connected');
      }
      return;
    }

    if (viewerRef.current || cesiumContainerRef.current?.hasChildNodes()) {
      console.log('🔄 Cesium viewer already initialized locally, skipping...');
      return;
    }

    globalInitializationInProgress = true;
    setIsLoading(true);

    try {
      console.log('🌍 Initializing EarthGlobe with modular architecture...');

      // Initialize Cesium viewer
      const viewer = await GlobeInitializer.initialize(cesiumContainerRef.current);
      
      if (!viewer) {
        throw new Error('Failed to initialize Cesium viewer');
      }

      // Store references
      viewerRef.current = viewer;
      globalViewerInstance = viewer;
      globalInitializationInProgress = false;

      // Initialize managers
      controlsRef.current = new GlobeControls(viewer, setTileSource, setServerStatus);
      regionManagerRef.current = new RegionManager(viewer, null, handleRegionClick, clusterLevel); // Pass cluster level
      
      // Ensure viewer is ready for region operations
      viewer.isReadyForRegions = true;
      weatherManagerRef.current = new WeatherManager(viewer, setTileSource);
      topographyManagerRef.current = new TopographyManager(viewer, setTileSource);

      // Set up camera change listener
      viewer.camera.changed.addEventListener(() => {
        const height = viewer.camera.positionCartographic.height;
        setCameraHeight(height);
      });

      // Mark viewer as ready
      viewer.isReadyForRegions = true;

        // Expose controls globally with manager access
  window.earthGlobeControls = {
    ...controlsRef.current,
    regionManager: regionManagerRef.current,
    weatherManager: weatherManagerRef.current,
    topographyManager: topographyManagerRef.current,
    
    // Expose clustering control methods
    changeClusterLevel: (newLevel) => {
      console.log(`🌍 Changing cluster level to: ${newLevel}`);
      setClusterLevel(newLevel);
      if (onClusterLevelChange) {
        onClusterLevelChange(newLevel);
      }
    },
    getCurrentClusterLevel: () => clusterLevel,
    
    // Expose weather control methods directly for compatibility
    addOverlay: (overlayType) => weatherManagerRef.current?.addOverlay(overlayType),
    removeOverlay: (overlayType) => weatherManagerRef.current?.removeOverlay(overlayType),
    clearWeather: () => weatherManagerRef.current?.clearWeather(),
    refreshWeatherData: () => weatherManagerRef.current?.refreshWeatherData(),
        
        // Expose topography control methods directly for compatibility
        addTopography: (topographyType) => topographyManagerRef.current?.addTopography(topographyType),
        removeTopography: (topographyType) => topographyManagerRef.current?.removeTopography(topographyType),
        clearTopography: () => topographyManagerRef.current?.clearTopography(),
        
        // Expose map control methods
        getCurrentMapType: () => controlsRef.current?.getCurrentMapType(),
        setMapType: (style) => controlsRef.current?.setMapType(style),
        
        // Expose vote and candidate controls
        refreshVoteCounts: () => {
          if (globalChannelRendererRef.current) {
            globalChannelRendererRef.current.refreshVoteCounts();
          }
        },
        panToCandidateAndShowVoters: (candidateData, channelData) => {
          console.log('🎯 [earthGlobeControls] panToCandidateAndShowVoters called');
          if (globalChannelRendererRef.current) {
            globalChannelRendererRef.current.panToCandidateAndShowVoters(candidateData, channelData);
          } else {
            console.warn('🎯 [earthGlobeControls] globalChannelRendererRef not available');
          }
        }
      };
      
      console.log('🌍 window.earthGlobeControls set with panToCandidateAndShowVoters:', typeof window.earthGlobeControls.panToCandidateAndShowVoters);

      // Also update existing global controls if they exist (for reuse scenarios)
      if (window.earthGlobeControls && typeof window.earthGlobeControls.setMapType !== 'function') {
        console.log('🔄 Updating existing global controls with new methods...');
        Object.assign(window.earthGlobeControls, {
          setMapType: (style) => controlsRef.current?.setMapType(style),
          getCurrentMapType: () => controlsRef.current?.getCurrentMapType()
        });
      }

      // Set initial status
      setIsLoading(false);
      setTileSource('CartoDB Positron (High Quality)');
      setServerStatus('Connected');

      console.log('✅ EarthGlobe initialization completed successfully!');
      
      // Mapbox overlay initialized later (when counties are loaded)
      
      // Initialize SYSTEM2: County Boundary Manager
      if (viewerRef.current) {
        if (USE_MAPBOX_VECTOR_TILES) {
          // Initialize Mapbox GeoJSON system (NEW - shows ALL counties)
          console.log('🔧 [Mapbox] Initializing Mapbox county system (GeoJSON)...');
          const initialized = await initializeCountySystem(viewerRef.current, {
            debugMode: true
          });
          if (initialized) {
            console.log('✅ [Mapbox] County system initialized - ready to show ALL counties');
          } else {
            console.error('❌ [Mapbox] Failed to initialize county system');
          }
        } else {
          // Initialize entity-based system (old) - ONLY when Mapbox is disabled
          console.warn('⚠️ [SYSTEM2] Entity-based county system is ENABLED (will hit Cesium limits)');
          console.warn('⚠️ [SYSTEM2] To fix: Generate vector tiles and set USE_MAPBOX_VECTOR_TILES = true');
          const initialized = await initializeCountySystem(viewerRef.current);
          if (initialized) {
            console.log('✅ [SYSTEM2] County Boundary Manager initialized');
          } else {
            console.error('❌ [SYSTEM2] Failed to initialize County Boundary Manager');
          }
        }
      } else {
        console.error('❌ [SYSTEM2] No viewer available for initialization');
      }
      
      // Initial layer will be loaded by cluster level useEffect (defaults to GPS/province)
      console.log('🗺️ Initial layer will load based on cluster level (default: GPS/province)');

    } catch (err) {
      console.error('❌ Failed to initialize EarthGlobe:', err);
      setError(err.message);
      setServerStatus('Failed');
      setIsLoading(false);
      globalInitializationInProgress = false;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeGlobe();
  }, [initializeGlobe]);

  // Weather refresh interval
  useEffect(() => {
    const weatherRefreshInterval = setInterval(() => {
      if (window.activeWeatherLayers && window.activeWeatherLayers.size > 0) {
        console.log('🔄 Auto-refreshing weather data...');
        if (window.earthGlobeControls) {
          window.earthGlobeControls.refreshWeatherData();
        }
      }
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(weatherRefreshInterval);
  }, []);

  // Update region manager when cluster level changes
  useEffect(() => {
    // DEBUG: Check what we have
    console.log(`\n\n🔔 ========== USE EFFECT TRIGGERED ==========`);
    console.log(`🔍 [DEBUG] clusterLevel: "${clusterLevel}"`);
    console.log(`🔍 [DEBUG] regionManagerRef.current:`, !!regionManagerRef.current);
    console.log(`🔍 [DEBUG] regionManagerRef.current.adminHierarchy:`, !!regionManagerRef.current?.adminHierarchy);
    console.log(`🔔 ============================================\n`);
    
    if (regionManagerRef.current && regionManagerRef.current.adminHierarchy) {
      console.log(`🔄 Cluster level changed to: ${clusterLevel}`);
      
      // Update RegionManager's active cluster level for hover detection
      regionManagerRef.current.setActiveClusterLevel(clusterLevel);
      console.log(`✅ RegionManager cluster level updated to: ${clusterLevel}`);
      
      // Load appropriate layer using AdministrativeHierarchy (the working system)
      const loadLayer = async () => {
        try {
          const adminHierarchy = regionManagerRef.current.adminHierarchy;
          
          if (clusterLevel === 'province') {
            // Load provinces with optimized settings
            const result = await adminHierarchy.loadLayer('province');
            if (result.success) {
              console.log(`✅ Loaded ${adminHierarchy.entities.province.size} provinces (optimized)`);
              
              // Optimized province styling for performance
              adminHierarchy.entities.province.forEach((entity) => {
                if (entity.polygon) {
                  entity.polygon.outlineColor = window.Cesium.Color.BLACK;
                  entity.polygon.outlineWidth = 1; // Reduced from 2 for performance
                  entity.show = true;
                }
              });
              
              // Hide other layers
              adminHierarchy.entities.country.forEach((entity) => { entity.show = false; });
              adminHierarchy.entities.macro_region.forEach((entity) => { entity.show = false; });
            }
          } else if (clusterLevel === 'country') {
            // Load countries using working AdminHierarchy system
            const result = await adminHierarchy.loadLayer('country');
            if (result.success) {
              console.log(`✅ Loaded countries for ${clusterLevel} level with ${adminHierarchy.entities.country.size} entities`);
              
              // Register countries with RegionManager for tracking and hover
              if (regionManagerRef.current) {
                adminHierarchy.entities.country.forEach((entity) => {
                  regionManagerRef.current.entitiesByLayer.countries.add(entity.id);
                });
                console.log(`📍 Registered ${adminHierarchy.entities.country.size} countries with RegionManager`);
              }
              
              // Make country outlines BLACK and visible
              adminHierarchy.entities.country.forEach((entity) => {
                if (entity.polygon) {
                  entity.polygon.outlineColor = window.Cesium.Color.BLACK;
                  entity.polygon.outlineWidth = 2;
                  entity.show = true;
                }
              });
              // Hide other layers
              adminHierarchy.entities.province.forEach((entity) => { entity.show = false; });
              adminHierarchy.entities.macro_region.forEach((entity) => { entity.show = false; });
            }
          } else if (clusterLevel === 'city') {
            // City level - pure clustering mode (no boundaries)
            console.log('🏙️ City level: Using pure candidate clustering (fast mode)');
            
            // Hide all boundary layers for performance
            if (adminHierarchy.entities.county) {
              adminHierarchy.entities.county.forEach((entity) => { entity.show = false; });
            }
            if (adminHierarchy.entities.province) {
              adminHierarchy.entities.province.forEach((entity) => { entity.show = false; });
            }
            if (adminHierarchy.entities.country) {
              adminHierarchy.entities.country.forEach((entity) => { entity.show = false; });
            }
            if (adminHierarchy.entities.macro_region) {
              adminHierarchy.entities.macro_region.forEach((entity) => { entity.show = false; });
            }
            
            console.log('✅ City level setup complete (clustering mode)');
          } else if (clusterLevel === 'county') {
            // ========================================
            // COUNTY BOUNDARY LOADING
            // ========================================
            if (USE_CESIUM_PRIMITIVE_API) {
              // Cesium Primitive API (TRUE 3D DRAPING - shows ALL counties)
              console.log(`🗺️ [CesiumPrimitive] ========== COUNTY LEVEL SELECTED ==========`);
              console.log(`🗺️ [CesiumPrimitive] Using Cesium Primitive API (TRUE 3D draping, no limits)`);
              
              try {
                // Load and show counties using Primitive API
                await loadCounties(); // This loads data
                showCounties(); // This shows the primitives
                console.log(`✅ [CesiumPrimitive] ALL county boundaries loaded and shown (3D draped)`);
              } catch (error) {
                console.error(`❌ [CesiumPrimitive] County loading failed:`, error);
              }
            } else if (USE_MAPBOX_VECTOR_TILES) {
              // Mapbox vector tile system (2D overlay - shows ALL counties globally)
              console.log(`🗺️ [Mapbox] ========== COUNTY LEVEL SELECTED ==========`);
              console.log(`🗺️ [Mapbox] Using Mapbox GL JS vector tiles (2D overlay, ALL counties, no limits)`);
              
              try {
                // Show counties using Mapbox vector tiles
                showCounties();
                console.log(`✅ [Mapbox] ALL county boundaries shown globally (2D overlay)`);
              } catch (error) {
                console.error(`❌ [Mapbox] County loading failed:`, error);
              }
            } else {
              // Entity-based system (OLD - hits Cesium limits)
              console.warn(`🗺️ [SYSTEM2] ========== COUNTY LEVEL SELECTED ==========`);
              console.warn(`🗺️ [SYSTEM2] ⚠️ WARNING: Using entity-based system (will hit Cesium limits)`);
              console.warn(`🗺️ [SYSTEM2] ⚠️ Only USA/China will render. Others will silently fail.`);
              console.warn(`🗺️ [SYSTEM2] ⚠️ To fix: Set USE_CESIUM_PRIMITIVE_API = true for 3D draping`);
              
              try {
                // Load counties using old entity system
                await loadCounties();
                console.log(`✅ [SYSTEM2] County loading initiated (entity-based)`);
              } catch (error) {
                console.error(`❌ [SYSTEM2] County loading failed:`, error);
              }
            }
          } else if (clusterLevel === 'macro_region') {
            // Load macro-regions using AdminHierarchy system
            const result = await adminHierarchy.loadLayer('macro_region');
            if (result > 0) {
              console.log(`✅ Loaded macro-regions for ${clusterLevel} level with ${adminHierarchy.entities.macro_region.size} entities`);
              
              // Register macro-regions with RegionManager for tracking and hover
              if (regionManagerRef.current) {
                adminHierarchy.entities.macro_region.forEach((entity) => {
                  regionManagerRef.current.entitiesByLayer.macro_regions.add(entity.id);
                });
                console.log(`📍 Registered ${adminHierarchy.entities.macro_region.size} macro-regions with RegionManager`);
              }
              
              // Make macro-region outlines visible
              adminHierarchy.entities.macro_region.forEach((entity) => {
                if (entity.polygon) {
                  entity.polygon.outlineColor = window.Cesium.Color.BLACK;
                  entity.polygon.outlineWidth = 2;
                  entity.show = true;
                }
              });
              // Hide other layers
              adminHierarchy.entities.province.forEach((entity) => { entity.show = false; });
              adminHierarchy.entities.country.forEach((entity) => { entity.show = false; });
            }
          }
        } catch (error) {
          console.error(`❌ Error loading layer for ${clusterLevel}:`, error);
        }
      };
      
      loadLayer();
    }
  }, [clusterLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewerRef.current && viewerRef.current === globalViewerInstance) {
        console.log('🧹 Component unmounting but keeping global Cesium viewer for reuse');
        viewerRef.current = null;
      } else if (viewerRef.current && viewerRef.current !== globalViewerInstance) {
        console.log('🧹 Cleaning up duplicate Cesium viewer');
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn('Warning during cleanup:', e);
        }
        viewerRef.current = null;
      }
    };
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    refreshVoteCounts: () => {
      console.log('🌍 [InteractiveGlobe] refreshVoteCounts called');
      if (globalChannelRendererRef.current) {
        console.log('🌍 [InteractiveGlobe] Forwarding to globalChannelRendererRef.current.refreshVoteCounts()');
        globalChannelRendererRef.current.refreshVoteCounts();
      } else {
        console.warn('🌍 [InteractiveGlobe] globalChannelRendererRef.current is null!');
      }
    },
    changeClusterLevel: (newLevel) => {
      console.log(`🌍 External cluster level change requested: ${newLevel}`);
      handleClusterLevelChange(newLevel);
    },
    getCurrentClusterLevel: () => clusterLevel,
    getClusterLevels: () => clusterLevels
  }));

  // Expose clustering controls globally for easy access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Merge with existing controls to preserve setMapType and other functions
      const existingControls = window.earthGlobeControls || {};
      window.earthGlobeControls = {
        ...existingControls,
        changeClusterLevel: (newLevel) => {
          console.log(`🌍 Global clustering control: changing to ${newLevel}`);
          handleClusterLevelChange(newLevel);
        },
        getCurrentClusterLevel: () => clusterLevel,
        getAvailableLevels: () => clusterLevels.map(l => ({ id: l.id, name: l.name, description: l.description })),
        refreshVoteCounts: () => {
          if (globalChannelRendererRef.current) {
            globalChannelRendererRef.current.refreshVoteCounts();
          }
        },
        // **NEW: Pan camera to candidate and show voters (called from panel)**
        panToCandidateAndShowVoters: (candidateData, channelData) => {
          if (globalChannelRendererRef.current) {
            globalChannelRendererRef.current.panToCandidateAndShowVoters(candidateData, channelData);
          } else {
            console.warn('🎯 globalChannelRendererRef not available');
          }
        },
        // Expose manager instances for external access
        regionManager: regionManagerRef.current,
        weatherManager: weatherManagerRef.current,
        topographyManager: topographyManagerRef.current
      };
      
      // Only log once when controls are actually exposed
      if (!window.earthGlobeControls) {
        console.log('🌍 Global clustering controls exposed at window.earthGlobeControls');
      }
      
      return () => {
        delete window.earthGlobeControls;
      };
    }
  }, [clusterLevel, handleClusterLevelChange]); // Removed clusterLevels dependency since it's static

  // Add keyboard shortcuts for clustering controls
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle shortcuts when the globe is focused or no specific element is focused
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();
      
      // Number keys 1-6 for quick cluster level access
      if (key >= '1' && key <= '6') {
        const levelIndex = parseInt(key) - 1;
        if (levelIndex < clusterLevels.length) {
          const newLevel = clusterLevels[levelIndex].id;
          console.log(`⌨️ Keyboard shortcut: ${key} → ${newLevel}`);
          handleClusterLevelChange(newLevel);
          event.preventDefault();
        }
      }
      
      // Arrow keys for cycling through levels
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        const currentIndex = clusterLevels.findIndex(l => l.id === clusterLevel);
        const nextIndex = (currentIndex + 1) % clusterLevels.length;
        const nextLevel = clusterLevels[nextIndex].id;
        console.log(`⌨️ Keyboard shortcut: Arrow → ${nextLevel}`);
        handleClusterLevelChange(nextLevel);
        event.preventDefault();
      }
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        const currentIndex = clusterLevels.findIndex(l => l.id === clusterLevel);
        const prevIndex = currentIndex === 0 ? clusterLevels.length - 1 : currentIndex - 1;
        const prevLevel = clusterLevels[prevIndex].id;
        console.log(`⌨️ Keyboard shortcut: Arrow → ${prevLevel}`);
        handleClusterLevelChange(prevLevel);
        event.preventDefault();
      }
      
      // Spacebar to cycle through levels
      if (event.key === ' ') {
        const currentIndex = clusterLevels.findIndex(l => l.id === clusterLevel);
        const nextIndex = (currentIndex + 1) % clusterLevels.length;
        const nextLevel = clusterLevels[nextIndex].id;
        console.log(`⌨️ Keyboard shortcut: Space → ${nextLevel}`);
        handleClusterLevelChange(nextLevel);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [clusterLevel, clusterLevels, handleClusterLevelChange]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', zIndex: 1 }}>
      <div 
        ref={cesiumContainerRef} 
        style={{ width: '100%', height: '100vh', minHeight: '600px' }}
      />
      
      {/* Global Channel Renderer with Clustering */}
      {viewerRef.current && (
        <GlobalChannelRenderer
          ref={globalChannelRendererRef}
          viewer={viewerRef.current}
          onCandidateClick={onCandidateClick}
          globeState={globeState}
          setGlobeState={setGlobeState}
          debugMode={true}
          clusterLevel={clusterLevel}
          cubeSizeMultiplier={cubeSizeMultiplier}
          regionManager={regionManagerRef.current}
          onEntitiesRefReady={(entitiesRef) => {
            // Set the entitiesRef in RegionManager for synchronization
            if (regionManagerRef.current) {
              console.log("🔗 InteractiveGlobe: Setting entitiesRef in RegionManager");
              regionManagerRef.current.setEntitiesRef(entitiesRef);
              
              // Also set entitiesRef in AdministrativeHierarchy
              if (regionManagerRef.current.adminHierarchy) {
                regionManagerRef.current.adminHierarchy.setEntitiesRef(entitiesRef);
              }
            } else {
              console.warn("⚠️ InteractiveGlobe: RegionManager not available when setting entitiesRef");
            }
          }}
        />
      )}
      
      {/* Status Panel */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(42, 42, 42, 0.8)',
        padding: '8px',
        borderRadius: '3px',
        color: 'white',
        fontSize: '12px',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div>Tile Source: <span style={{ 
          color: tileSource.includes('Error') ? '#f44336' : '#4CAF50' 
        }}>{tileSource}</span></div>
        <div>Local Server: <span style={{ 
          color: serverStatus.includes('Error') || serverStatus === 'Failed' ? '#f44336' : 
                 serverStatus === 'Connected' ? '#4CAF50' : '#ff9800' 
        }}>{serverStatus}</span></div>
        <div>Status: <span style={{ color: isLoading ? '#ff9800' : error ? '#f44336' : '#4CAF50' }}>
          {isLoading ? 'Loading...' : error ? 'Error' : 'Ready'}
        </span></div>
      </div>

      {/* Performance Toggle Button */}
      <button
        onClick={() => setShowPerformancePanel(!showPerformancePanel)}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: showPerformancePanel ? '#2196F3' : 'rgba(0, 0, 0, 0.6)',
          border: 'none',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 1001,
          backdropFilter: 'blur(5px)',
          transition: 'background-color 0.3s ease'
        }}
        title="Toggle Performance Monitor"
      >
        ⚡ Performance
      </button>

      {/* Performance Panel */}
      <PerformancePanel 
        isVisible={showPerformancePanel}
        onClose={() => setShowPerformancePanel(false)}
      />

      {/* SYSTEM2: County Loading Indicator */}
      <CountyLoadingIndicator 
        progress={loadingProgress}
        isVisible={clusterLevel === 'county' && loadingProgress.isLoading}
      />

      {/* Hierarchical Clustering Controls */}
      <ClusteringControlPanel 
        onClusterLevelChange={handleClusterLevelChange}
        currentLevel={clusterLevel}
        isVisible={true}
      />

      {/* Cube Size Control Panel */}
      <CubeSizeControlPanel
        onCubeSizeChange={handleCubeSizeChange}
        initialSize={cubeSizeMultiplier}
        isVisible={showCubeSizeControls}
        onClose={() => setShowCubeSizeControls(false)}
      />
        
        {/* Help Button - Shows all available controls */}
        <button
          onClick={() => {
            const helpText = `
🔗 Clustering Controls Available:

🎯 Visual Controls:
• Click any clustering button to change level
• Hover for descriptions

⌨️ Keyboard Shortcuts:
• 1-6: Quick access to specific levels
• ← → ↑ ↓: Cycle through levels
• Space: Next level

🌐 Global Access:
• window.earthGlobeControls.changeClusterLevel('gps')
• window.earthGlobeControls.getCurrentClusterLevel()

📱 Current Status:
• Level: ${clusterLevel}
• Available: ${clusterLevels.map(l => l.name).join(', ')}
            `;
            alert(helpText);
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '250px',
            background: 'rgba(99, 102, 241, 0.8)',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            zIndex: 1001,
            backdropFilter: 'blur(5px)',
            transition: 'all 0.2s ease',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(99, 102, 241, 1)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(99, 102, 241, 0.8)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Show clustering help and shortcuts"
        >
          ?
        </button>
        
        {/* Removed clustering test panel - using simple renderer */}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#333',
          fontSize: '16px',
          background: 'rgba(255,255,255,0.95)',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '10px' }}>🌍 Loading EarthGlobe...</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Initializing modular components
          </div>
        </div>
      )}
      
      {/* Error Overlay */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#d32f2f',
          fontSize: '14px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.95)',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>❌ Globe Loading Failed</div>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>{error}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Check console for detailed error information
          </div>
        </div>
      )}

      {/* Region Dropdown Menu */}
      {regionDropdown && (
        <RegionDropdownMenu
          regionName={regionDropdown.regionName}
          regionType={regionDropdown.regionType}
          position={regionDropdown.position}
          onClose={handleCloseRegionDropdown}
          onOpenBoundary={handleOpenBoundary}
          onOpenParameters={handleOpenParameters}
          onOpenGovernance={handleOpenGovernance}
        />
      )}

      {/* ✅ NEW BOUNDARY SYSTEM (Phase 3.0 - Channel Panel + Floating Toolbar) */}
      {(() => {
        const hasViewer = !!(globalViewerInstance || viewerRef.current);
        console.log('🔍 [RENDER CHECK] boundaryEditor:', !!boundaryEditor);
        console.log('🔍 [RENDER CHECK] viewerRef.current:', !!viewerRef.current);
        console.log('🔍 [RENDER CHECK] globalViewerInstance:', !!globalViewerInstance);
        console.log('🔍 [RENDER CHECK] hasViewer (either):', hasViewer);
        console.log('🔍 [RENDER CHECK] Should render panel?:', !!(boundaryEditor && hasViewer));
        if (boundaryEditor) {
          console.log('🔍 [RENDER CHECK] boundaryEditor details:', {
            channel: boundaryEditor.channel?.name,
            regionName: boundaryEditor.regionName,
            candidateCount: boundaryEditor.channel?.candidates?.length
          });
        }
        return null;
      })()}
      {boundaryEditor && (globalViewerInstance || viewerRef.current) && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 99999
          }}>
            {/* Boundary Channel Ranking Panel */}
            <div style={{ pointerEvents: 'auto' }}>
              <DragDropContainer
                panelId="boundary-channel-panel"
                title={`${boundaryEditor.regionName} - Boundaries`}
                totalVotes={boundaryEditor.channel?.candidates?.reduce((sum, c) => 
                  sum + (c.votes?.local || 0) + (c.votes?.foreign || 0), 0
                ) || 0}
                candidateCount={boundaryEditor.channel?.candidates?.length || 0}
                defaultPosition={{ x: 50, y: 100 }}
                defaultSize={{ width: 900, height: 300 }}
            isDraggable={true}
            isResizable={true}
            onClose={() => {
              console.log('❌ Boundary channel closed');
              setBoundaryEditor(null);
            }}
          >
            <UnifiedChannelPanel
              panel={null}
              globeState={{ selectedChannel: boundaryEditor.channel }}
              setGlobeState={() => {}}
              layout={null}
              updatePanel={() => {}}
              regionName={boundaryEditor.regionName}
              regionType={boundaryEditor.regionType}
              isEditing={boundaryEditor.isEditing}
              editMode={boundaryEditorMode}
              nodeCount={boundaryVertexCount}
              onEditModeChange={(mode) => {
                console.log('🔧 [PANEL] Edit mode changed to:', mode);
                setBoundaryEditorMode(mode);
                
                // Enable editing when switching to edit mode
                if (mode === 'edit' && !boundaryEditor.isEditing) {
                  console.log('🔧 [PANEL] Enabling editing mode...');
                  setBoundaryEditor(prev => ({
                    ...prev,
                    isEditing: true
                  }));
                }
              }}
              onConfirmEdit={() => {
                console.log('✅ [PANEL] Confirm button clicked');
                // Trigger save in hidden GlobeBoundaryEditor
                const event = new CustomEvent('boundary-editor-submit');
                window.dispatchEvent(event);
              }}
              onCancelEdit={() => {
                console.log('❌ [PANEL] Cancel edit');
                setBoundaryEditor(prev => ({ ...prev, isEditing: false, editingCandidate: null }));
                setBoundaryVertexCount(0);
              }}
              onEditBoundary={(candidate) => {
                console.log('✏️ Editing boundary candidate:', candidate);
                setBoundaryEditor(prev => ({
                  ...prev,
                  isEditing: true,
                  editingCandidate: candidate
                }));
              }}
              onProposeNew={() => {
                console.log('➕ [ADD CANDIDATE] Button clicked! Enabling editing mode...');
                setBoundaryEditor(prev => ({
                  ...prev,
                  isEditing: true,
                  editingCandidate: null
                }));
              }}
              onSelectCandidate={(candidate) => {
                console.log('🎯 Selected boundary candidate:', candidate);
              }}
              onVote={(candidateId) => {
                // BaseChannelPanel already handles the vote submission and state updates
                // We just need to log it for debugging
                console.log(`✅ [Boundary Vote] Vote submitted for candidate ${candidateId}`);
              }}
              currentUser={null}
            />
              </DragDropContainer>
            </div>
          </div>

          {/* Hidden Globe Boundary Editor - Handles node interactions */}
          {boundaryEditor.isEditing ? (
            <>
              {console.log('🎨 [EDITOR] Rendering GlobeBoundaryEditor - isEditing is TRUE')}
              <div style={{ display: 'none' }}>
                <GlobeBoundaryEditor
                  cesiumViewer={globalViewerInstance || viewerRef.current}
                  channel={boundaryEditor.channel}
                  proposal={boundaryEditor.editingCandidate}
                  regionName={boundaryEditor.regionName}
                  regionType={boundaryEditor.regionType}
                  regionCode={boundaryEditor.regionCode}
                  mode={boundaryEditorMode}
                  onVerticesChange={(count) => {
                    console.log('📊 [InteractiveGlobe] Vertex count updated:', count);
                    setBoundaryVertexCount(count);
                  }}
                  onSave={async (proposal) => {
                    console.log('✅ [InteractiveGlobe] onSave callback triggered with proposal:', proposal);
                    console.log('📊 [InteractiveGlobe] Current boundaryEditor state before save:', {
                      isEditing: boundaryEditor.isEditing,
                      channelId: boundaryEditor.channel?.id,
                      candidateCount: boundaryEditor.channel?.candidates?.length
                    });
                    
                    // Refresh the channel to show new candidate
                    try {
                      console.log('🔄 [InteractiveGlobe] Fetching fresh channel data...');
                      console.log('📍 [InteractiveGlobe] Using regionCode:', boundaryEditor.regionCode);
                      const response = await fetch(`/api/channels/boundary/${boundaryEditor.regionCode}`);
                      const data = await response.json();
                      
                      console.log('📦 [InteractiveGlobe] Fetch response:', {
                        success: data.success,
                        candidateCount: data.channel?.candidates?.length,
                        hasChannel: !!data.channel
                      });
                      console.log('📦 [InteractiveGlobe] Full response data:', data);
                      
                      if (data.success && data.channel) {
                        console.log('🔄 [InteractiveGlobe] Channel refreshed with new candidate');
                        console.log('📊 [InteractiveGlobe] New candidate count:', data.channel.candidates.length);
                        
                        // Update the boundary editor with fresh channel data
                        setBoundaryEditor(prev => {
                          const newState = {
                            ...prev,
                            channel: data.channel, // Updated with new candidate!
                            isEditing: false,
                            editingCandidate: null
                          };
                          console.log('✅ [InteractiveGlobe] Setting new state:', {
                            isEditing: newState.isEditing,
                            candidateCount: newState.channel?.candidates?.length
                          });
                          return newState;
                        });
                        
                        // Reset vertex count
                        setBoundaryVertexCount(0);
                        console.log('🔄 [InteractiveGlobe] Reset vertex count to 0');
                        
                        console.log('🎉 [InteractiveGlobe] State update dispatched - editor should close now');
                      } else {
                        console.error('❌ [InteractiveGlobe] Condition failed:', {
                          hasSuccess: !!data.success,
                          hasChannel: !!data.channel,
                          dataKeys: Object.keys(data)
                        });
                        // Close editor anyway
                        setBoundaryEditor(prev => ({
                          ...prev,
                          isEditing: false,
                          editingCandidate: null
                        }));
                        setBoundaryVertexCount(0);
                      }
                    } catch (error) {
                      console.error('❌ [InteractiveGlobe] Error refreshing channel:', error);
                      // Still close editor even if refresh fails
                      console.log('⚠️ [InteractiveGlobe] Closing editor despite refresh error');
                      setBoundaryEditor(prev => ({
                        ...prev,
                        isEditing: false,
                        editingCandidate: null
                      }));
                      setBoundaryVertexCount(0);
                    }
                    
                    window.dispatchEvent(new CustomEvent('boundary-proposal-saved', {
                      detail: { proposal, channel: boundaryEditor.channel }
                    }));
                    
                    console.log('✅ [InteractiveGlobe] onSave callback completed');
                  }}
                  onCancel={() => {
                    console.log('❌ Boundary editor cancelled');
                    setBoundaryEditor(prev => ({
                      ...prev,
                      isEditing: false,
                      editingCandidate: null
                    }));
                  }}
                />
              </div>
            </>
          ) : (
            console.log('❌ [EDITOR] NOT rendering GlobeBoundaryEditor - isEditing is FALSE')
          )}
        </>
      )}
    </div>
  );
});

EarthGlobe.displayName = 'EarthGlobe';

// Remove memo wrapper - it was preventing re-renders when globeState.voteCounts changed
// causing the hover panel to not update after voting
export default EarthGlobe;
