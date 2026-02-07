/**
 * GlobalChannelRenderer - Stable clustering system for global regions
 * 
 * This extends the working Canadian clustering system to handle:
 * 1. All global regions (not just Canadian provinces)
 * 2. 6 clustering levels (GPS → City → State → Country → Continent → Globe)
 * 3. Dynamic region data loading from backend
 * 4. Integration with existing ClusteringControlPanel
 * 
 * Stability improvements:
 * - Debounced render cycles
 * - Channel deduplication
 * - Enhanced error boundaries
 * - Debug mode controls
 * - Resilient caching system
 */

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { DEBUG_CONFIG } from '../../constants.js';
import { channelUtils } from '../../utils/channelUtils.js';
import { voteUtils } from '../../utils/voteUtils.js';
import { BoundaryRenderingService } from '../../../../services/boundaryRenderingService.js';
import optimizedChannelsService from '../../../../services/optimizedChannelsService.js';
import cesiumHelpers from '../../../../utils/cesiumHelpers.js';

// Debouncing utilities
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Global region colors - will be dynamically assigned
const REGION_COLORS = {
  // Continents
  'REGION-NAM': '#FF5733', // North America
  'REGION-EU': '#33FF57',  // Europe
  'REGION-APAC': '#3357FF', // Asia Pacific
  'REGION-AF': '#F733FF',  // Africa
  'REGION-SA': '#33F7FF',  // South America
  
  // Countries (major ones)
  'USA': '#FF8C00',
  'CAN': '#FF1493',
  'GBR': '#00CED1',
  'DEU': '#FFD700',
  'FRA': '#FF69B4',
  'CHN': '#32CD32',
  'JPN': '#FF4500',
  'IND': '#9370DB',
  'BRA': '#20B2AA',
  'AUS': '#FF6347',
  
  // Default fallback
  'default': '#888888'
};

// Topic colors for channel clustering (from V40 working implementation)
const TOPIC_COLORS = {
  'Tech Innovation Hub': '#FF6B35',
  'Financial Services Center': '#4ECDC4',
  'Healthcare Innovation Lab': '#45B7D1',
  'Environmental Solutions': '#96CEB4',
  'Education Reform Initiative': '#FFEAA7',
  'Infrastructure Development': '#DDA0DD',
  'Social Justice Coalition': '#FFB6C1',
  'Economic Development Zone': '#F4A261',
  'Community Health Network': '#2A9D8F',
  'Digital Transformation Hub': '#E76F51',
  'Sustainable Energy Collective': '#264653',
  'Innovation District': '#E63946',
  'Creative Arts Council': '#F77F00',
  'Agriculture Modernization': '#FCBF49',
  'Transportation Solutions': '#003566',
  'Housing Development Initiative': '#0077B6',
  'Public Safety Network': '#00B4D8',
  'Veterans Support Coalition': '#90E0EF',
  'Youth Development Program': '#CAF0F8',
  'Small Business Alliance': '#FF9F1C',
  'default': '#888888'
};

const GlobalChannelRenderer = forwardRef(({
  viewer,
  onCandidateClick,
  globeState,
  setGlobeState,
  debugMode = false,
  clusterLevel = 'gps', // Default to GPS level
  cubeSizeMultiplier = 1.0, // Default cube size multiplier
  regionManager = null // RegionManager for geographical boundaries
}, ref) => {
  const [channels, setChannels] = useState([]);
  const [entities, setEntities] = useState([]);
  const [realTimeVoteCounts, setRealTimeVoteCounts] = useState({});
  const [currentClusterLevel, setCurrentClusterLevel] = useState(clusterLevel || 'gps'); // Start with GPS level to show individual candidates
  const [lastRenderTime, setLastRenderTime] = useState(0);
  const [aggregatedVoteCounts, setAggregatedVoteCounts] = useState({}); // Track aggregated vote counts per cluster level

  const [currentCubeSizeMultiplier, setCurrentCubeSizeMultiplier] = useState(cubeSizeMultiplier);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0); // Force re-renders when vote counts update
  
  // **NEW: Voter visualization state**
  const [hoveredCandidate, setHoveredCandidate] = useState(null);
  const [voterEntities, setVoterEntities] = useState([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [voterRenderResult, setVoterRenderResult] = useState(null); // Track cesiumHelpers render result
  const [performanceMetrics, setPerformanceMetrics] = useState(null); // Performance monitoring
  const currentVoterCandidateIdRef = useRef(null); // Track which candidate's voters are displayed (using ref for immediate updates)
  const clearVotersTimeoutRef = useRef(null); // Timeout for delayed voter clearing to prevent flashing
  const voterEntitiesRef = useRef([]); // Ref for voter entities to avoid stale closures
  const hoveredCandidateRef = useRef(null); // Ref for hovered candidate to avoid stale closures
  
  const entitiesRef = useRef(new Map());
  const transitionTimeoutRef = useRef(null);
  const globeStateRef = useRef(globeState); // Always holds latest globeState
  const boundaryServiceRef = useRef(null); // Boundary rendering service
  
  // Sync state to refs to avoid stale closures in effects
  useEffect(() => {
    voterEntitiesRef.current = voterEntities;
  }, [voterEntities]);
  
  useEffect(() => {
    hoveredCandidateRef.current = hoveredCandidate;
  }, [hoveredCandidate]);
  
  // Keep ref updated with latest globeState
  useEffect(() => {
    console.log('🔄 [GlobalChannelRenderer] globeState changed, updating ref:', {
      hasVoteCounts: !!globeState?.voteCounts,
      voteCountKeys: globeState?.voteCounts ? Object.keys(globeState.voteCounts).length : 0
    });
    globeStateRef.current = globeState;
  }, [globeState]);
  
  // Entity caching to avoid recreation when switching cluster levels
  const entityCacheRef = useRef(new Map()); // Cache entities by cluster level
  const lastChannelsHashRef = useRef(''); // Track if channels data changed
  const isUserClearingRef = useRef(false); // Track if user is intentionally clearing channels

  // Debounced render function to prevent excessive render cycles
  const debouncedRender = useDebounce(useCallback(() => {
    if (!viewer || viewer.isFallback || !channels.length) {
      return;
    }
    
    // Trigger the actual render
    setLastRenderTime(Date.now());
  }, [viewer, channels]), 150); // 150ms debounce

  // Convert hex color to Cesium Color
  const hexToCesiumColor = useCallback((hex, alpha = 1.0) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new window.Cesium.Color(r, g, b, alpha);
  }, []);

  // Calculate blue gradient color based on vote count (dark blue at surface → light blue at top)
  // This creates a smooth gradient that curves with Earth's 500km projection
  const calculateHeatmapColor = useCallback((voteCount, maxVotes, baseColor = '#4ECDC4') => {
    if (maxVotes === 0) return baseColor;
    
    const voteRatio = voteCount / maxVotes;
    
    // Blue gradient: Dark Blue (low votes/surface) → Medium Blue → Light Blue (high votes/top)
    // Dark blue at surface (low altitude) → Light blue at 500km (high altitude)
    let r, g, b;
    
    // Dark blue #003366 to Light blue #87CEEB
    const darkBlue = { r: 0, g: 51, b: 102 };      // Dark blue at surface
    const lightBlue = { r: 135, g: 206, b: 235 };   // Light blue at top (500km)
    
    // Interpolate between dark and light blue based on vote ratio
    r = Math.floor(darkBlue.r + (lightBlue.r - darkBlue.r) * voteRatio);
    g = Math.floor(darkBlue.g + (lightBlue.g - darkBlue.g) * voteRatio);
    b = Math.floor(darkBlue.b + (lightBlue.b - darkBlue.b) * voteRatio);
    
    // Ensure values are within 0-255 range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  // Create a vertical gradient material using a canvas texture
  // Gradient on vertical sides (dark bottom → light top), solid color on top face
  const createGradientMaterial = useCallback((voteCount, maxVotes) => {
    // Ensure voteCount is valid and non-negative
    const safeVoteCount = Math.max(0, voteCount || 0);
    const safeMaxVotes = Math.max(1, maxVotes || 1); // Prevent division by zero
    
    const voteRatio = Math.min(1, Math.max(0, safeVoteCount / safeMaxVotes)); // Clamp between 0 and 1
    const exponentialRatio = Math.pow(voteRatio, 0.7); // Match the height calculation
    
    // Ensure exponentialRatio is valid
    const safeExponentialRatio = isNaN(exponentialRatio) ? 0 : Math.max(0, Math.min(1, exponentialRatio));
    
    // Create a canvas for the gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Color calculations
    const darkBlue = { r: 0, g: 51, b: 102 };      // #003366 - base (bottom)
    const lightBlue = { r: 135, g: 206, b: 235 };  // #87CEEB - max (top)
    
    // Top color based on vote ratio - ensure all values are valid numbers
    const topR = Math.floor(darkBlue.r + (lightBlue.r - darkBlue.r) * safeExponentialRatio);
    const topG = Math.floor(darkBlue.g + (lightBlue.g - darkBlue.g) * safeExponentialRatio);
    const topB = Math.floor(darkBlue.b + (lightBlue.b - darkBlue.b) * safeExponentialRatio);
    
    // Ensure color values are valid
    const safeTopR = isNaN(topR) ? darkBlue.r : Math.max(0, Math.min(255, topR));
    const safeTopG = isNaN(topG) ? darkBlue.g : Math.max(0, Math.min(255, topG));
    const safeTopB = isNaN(topB) ? darkBlue.b : Math.max(0, Math.min(255, topB));
    
    const bottomColor = `rgb(${darkBlue.r}, ${darkBlue.g}, ${darkBlue.b})`;
    const topColor = `rgb(${safeTopR}, ${safeTopG}, ${safeTopB})`;
    
    // Create vertical gradient (bottom to top) for the vertical sides
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0); // bottom to top
    gradient.addColorStop(0, bottomColor); // Dark blue at bottom
    gradient.addColorStop(1, topColor);    // Vote-level color at top
    
    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Return Cesium ImageMaterialProperty
    return new window.Cesium.ImageMaterialProperty({
      image: canvas,
      transparent: false
    });
  }, []);

  // Calculate glow intensity based on vote count (higher votes = stronger glow)
  const calculateGlowPower = useCallback((voteCount, maxVotes) => {
    if (maxVotes === 0) return 0.1;
    
    const voteRatio = voteCount / maxVotes;
    
    // Exponential glow: low votes have subtle glow, high votes have intense glow
    // Range: 0.1 (subtle) to 0.8 (intense)
    const glowPower = 0.1 + (voteRatio * voteRatio * 0.7); // Squared for exponential effect
    
    return glowPower;
  }, []);

  // Simple cube sizing with user multiplier only
  const calculateCubeSize = useCallback((baseSize) => {
    const finalSize = baseSize * currentCubeSizeMultiplier;
    
    if (DEBUG_CONFIG.RENDERING) {
      console.log(`🔍 Simple sizing: base=${(baseSize/1000).toFixed(0)}km, multiplier=${currentCubeSizeMultiplier.toFixed(2)}x, final=${(finalSize/1000).toFixed(0)}km`);
    }
    
    return Math.max(finalSize, 1000); // Minimum 1km size
  }, [currentCubeSizeMultiplier]);

  // Calculate total votes for a candidate (handles both old and new vote formats)
  const getCandidateVotes = useCallback((candidate, channelId) => {
    // Get base votes (initial/test votes that come with the candidate)
    // IMPORTANT: Only use initialVotes, NOT candidate.votes (which might already include blockchain votes)
    const baseVotes = candidate?.initialVotes || 0;
    
    // Get blockchain votes (real user votes) from latest globeState
    let blockchainVotes = 0;
    const latestGlobeState = globeStateRef.current;
    
    if (latestGlobeState?.voteCounts && channelId && candidate.id) {
      const voteKey = `${channelId}-${candidate.id}`;
      const globalVoteCount = latestGlobeState.voteCounts[voteKey];
      
      if (globalVoteCount !== undefined) {
        blockchainVotes = globalVoteCount;
      }
    }
    
    // Total = base votes + blockchain votes (additive system)
    const totalVotes = baseVotes + blockchainVotes;
    
    if (blockchainVotes > 0) {
      console.log(`🔍 [getCandidateVotes] ${candidate.name}: ${baseVotes} base + ${blockchainVotes} blockchain = ${totalVotes} total`);
    } else {
      console.log(`🔍 [getCandidateVotes] ${candidate.name}: ${totalVotes} votes (base only, no blockchain votes yet)`);
    }
    
    return totalVotes;
  }, [renderTrigger]); // Include renderTrigger to force recalculation when votes update

  // Calculate aggregated vote counts for different clustering levels
  const calculateAggregatedVoteCounts = useCallback((channels, clusterLevel) => {
    const aggregated = {};
    
    channels.forEach(channel => {
      const channelVotes = channel.candidates?.reduce((sum, candidate) => sum + getCandidateVotes(candidate, channel.id), 0) || 0;
      
      // For GPS level, each candidate is individual, so no aggregation needed
      if (clusterLevel === 'gps') {
        channel.candidates?.forEach(candidate => {
          const candidateId = candidate.id || `candidate-${channel.id}-${candidate.name}`;
          aggregated[candidateId] = getCandidateVotes(candidate, channel.id);
        });
      } else {
        // For other levels, aggregate by region
        const regionKey = clusterLevel === 'city' ? 
          (channel.region_id || channel.primary_region || channel.name) :
          clusterLevel === 'state' ? 
            (channel.region_id?.split('-')[0] || channel.primary_region || channel.name) :
            clusterLevel === 'country' ? 
              (channel.region_id?.split('-')[0] || channel.primary_region || channel.name) :
              clusterLevel === 'continent' ? 
                (channel.primary_region || 'GLOBAL') :
                'GLOBE';
        
        if (!aggregated[regionKey]) {
          aggregated[regionKey] = 0;
        }
        aggregated[regionKey] += channelVotes;
      }
    });
    
    return aggregated;
  }, [getCandidateVotes]);

  // **PAN camera to candidate location (keeping current zoom/altitude)**
  const panCameraToCandidate = useCallback((candidateData, channelData) => {
    if (!viewer || !candidateData) return;
    
    // Extract candidate's GPS coordinates
    let candidateLat, candidateLng;
    
    if (candidateData.location && candidateData.location.latitude && candidateData.location.longitude) {
      candidateLat = candidateData.location.latitude;
      candidateLng = candidateData.location.longitude;
    } else if (candidateData.location && candidateData.location.lat && candidateData.location.lng) {
      candidateLat = candidateData.location.lat;
      candidateLng = candidateData.location.lng;
    } else if (candidateData.lat && candidateData.lng) {
      candidateLat = candidateData.lat;
      candidateLng = candidateData.lng;
    } else if (candidateData.latitude && candidateData.longitude) {
      candidateLat = candidateData.latitude;
      candidateLng = candidateData.longitude;
    } else if (channelData && channelData.location) {
      // Fallback to channel location
      candidateLat = channelData.location.latitude || channelData.location.lat;
      candidateLng = channelData.location.longitude || channelData.location.lng;
    } else {
      console.warn('🎥 No location data available for camera pan');
      return;
    }
    
    console.log(`🎥 Panning camera to ${candidateData.name} at [${candidateLat}, ${candidateLng}] (keeping current altitude)`);
    
    // Get current camera position to preserve altitude
    const currentCameraPosition = viewer.camera.positionCartographic;
    const currentAltitude = currentCameraPosition.height;
    const currentPitch = viewer.camera.pitch;
    const currentHeading = viewer.camera.heading;
    const currentRoll = viewer.camera.roll;
    
    console.log(`🎥 Current altitude: ${(currentAltitude/1000).toFixed(0)}km, pitch: ${window.Cesium.Math.toDegrees(currentPitch).toFixed(1)}°`);
    
    // Pan camera to candidate location while preserving current altitude and orientation
    viewer.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(candidateLng, candidateLat, currentAltitude),
      orientation: {
        heading: currentHeading,
        pitch: currentPitch,
        roll: currentRoll
      },
      duration: 1.5, // 1.5-second smooth pan
      complete: () => {
        console.log(`🎥 Camera panned to ${candidateData.name} at altitude ${(currentAltitude/1000).toFixed(0)}km`);
      }
    });
  }, [viewer]);

  // **NEW: Render voter dots on globe with visible and hidden clusters**
  // Reference to store point primitive collection for performance
  const voterPointsRef = useRef(null);

  const renderVotersOnGlobe = useCallback((clusters, candidateData, level) => {
    if (!viewer || !clusters) {
      console.log('🗳️ No voter clusters to render for', candidateData?.name);
      return;
    }
    
    const { visible = [], hidden = [] } = clusters;
    const totalClusters = visible.length + hidden.length;
    
    if (totalClusters === 0) {
      console.log('🗳️ No voters to render for', candidateData?.name);
      return;
    }
    
    console.log(`🗳️ Rendering ${visible.length} visible + ${hidden.length} hidden clusters at ${level} level for ${candidateData.name}`);
    
    // Clear old point collection IMMEDIATELY to prevent conflicts
    if (voterPointsRef.current) {
      viewer.scene.primitives.remove(voterPointsRef.current);
      voterPointsRef.current = null;
    }
    
    // Clear ALL old voter entities IMMEDIATELY to prevent ID collisions
    // Since we now use timestamps in IDs, this is safe and prevents duplicate ID errors
    const oldVoterEntities = [];
    for (let i = 0; i < viewer.entities.values.length; i++) {
      const entity = viewer.entities.values[i];
      if (entity.id && entity.id.toString().startsWith('voter-')) {
        oldVoterEntities.push(entity);
      }
    }
    
    // Remove old entities SYNCHRONOUSLY before adding new ones (prevents duplicate ID errors)
    oldVoterEntities.forEach(entity => {
      try {
        viewer.entities.remove(entity);
      } catch (e) {
        // Entity may have already been removed
      }
    });
    
    console.log(`🗳️ Cleared ${oldVoterEntities.length} previous voter entities (before adding new ones)`);
    
    // PERFORMANCE MODE: Use PointPrimitiveCollection for rendering many voters
    const usePointPrimitives = totalClusters > 100; // Switch to point primitives if more than 100 clusters
    
    if (usePointPrimitives) {
      console.log(`🚀 Using high-performance point primitives for ${totalClusters} voter clusters`);
      const pointCollection = new window.Cesium.PointPrimitiveCollection();
      
      // Add visible voters as bright cyan points, scaled by cube size multiplier
      visible.forEach((cluster) => {
        // Position point at top of tower height (like candidate cubes)
        const pointAltitude = 5000 * currentCubeSizeMultiplier; // Top of 5km tower
        pointCollection.add({
          position: window.Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, pointAltitude),
          pixelSize: 8 * currentCubeSizeMultiplier, // Pixel size scales with cube size
          color: window.Cesium.Color.fromCssColorString('#00FFFF'), // Bright cyan - FULLY OPAQUE
          outlineColor: window.Cesium.Color.WHITE,
          outlineWidth: 2 * currentCubeSizeMultiplier,
          show: true, // Explicitly show
          id: `voter-visible-${candidateData.id}-${cluster.clusterKey}`
        });
      });
      
      // Add hidden voters as gray points, scaled by cube size multiplier
      hidden.forEach((cluster) => {
        const baseSize = Math.min(12, 6 + Math.log10(cluster.voterCount) * 2); // Base size scales with voter count
        const size = baseSize * currentCubeSizeMultiplier; // Apply cube size multiplier
        // Position point at top of hidden tower height (higher than visible towers)
        const hiddenPointAltitude = 8000 * currentCubeSizeMultiplier; // Top of 8km tower
        pointCollection.add({
          position: window.Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, hiddenPointAltitude),
          pixelSize: size,
          color: window.Cesium.Color.DARKGRAY, // Fully opaque gray (no alpha for solid rendering)
          outlineColor: window.Cesium.Color.DIMGRAY,
          outlineWidth: 1 * currentCubeSizeMultiplier,
          show: true, // Explicitly show
          id: `voter-hidden-${candidateData.id}-${cluster.clusterKey}`
        });
      });
      
      // Add new point collection (old ones already cleared above)
      viewer.scene.primitives.add(pointCollection);
      voterPointsRef.current = pointCollection;
      
      console.log(`🚀 Rendered ${totalClusters} voter points using high-performance primitives`);
      return;
    }
    
    console.log(`📍 Using standard entity rendering for ${totalClusters} voter clusters`);
    
    const newVoterEntities = [];
    
    // Render VISIBLE clusters (colored towers)
    visible.forEach((cluster, index) => {
      try {
        // Small pin-like visualization - neat and visible, scaled by cube size multiplier
        const baseTowerHeight = 5000; // 5km tall base - like a small pin
        const baseTowerRadius = 1500; // 1.5km radius base - visible but not overwhelming
        
        // Apply the same scaling as candidate cubes
        const towerHeight = baseTowerHeight * currentCubeSizeMultiplier;
        const towerRadius = baseTowerRadius * currentCubeSizeMultiplier;
        
        // Position tower center at half its height (like candidate cubes do)
        // This makes the tower extend from ground (0) upward to full height
        const towerCenterAltitude = towerHeight / 2;
        
        // Generate unique ID with timestamp to prevent collisions
        const entityId = `voter-visible-${candidateData.id}-${cluster.clusterKey}-${index}-${Date.now()}`;
        
        // Color: BRIGHT CYAN/NEON for maximum visibility against globe
        // Use FULLY OPAQUE material to prevent rendering artifacts and hollow appearance
        const entity = viewer.entities.add({
          id: entityId,
          position: window.Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, towerCenterAltitude),
          cylinder: {
            length: towerHeight,
            topRadius: towerRadius,
            bottomRadius: towerRadius,
            material: window.Cesium.Color.fromCssColorString('#00FFFF'), // BRIGHT CYAN - FULLY OPAQUE
            outline: true,
            outlineColor: window.Cesium.Color.WHITE, // Fully opaque white outline
            outlineWidth: 2,
            fill: true, // Explicitly enable fill
            numberOfVerticalLines: 8, // Reduce geometry complexity for better rendering
            slices: 16 // Smooth cylinder with 16 sides
            // No heightReference - use absolute altitude like candidate cubes
          },
          show: true, // Explicitly show the entity
          description: `
            <div style="padding: 12px; background: linear-gradient(135deg, #065f46 0%, #10b981 100%); color: white; border-radius: 8px; font-family: Inter, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #d1fae5;">🗳️ Visible Voter Cluster</h4>
              <p style="margin: 4px 0;"><strong>Location:</strong> ${cluster.locationName || 'Unknown'}</p>
              <p style="margin: 4px 0;"><strong>Level:</strong> ${cluster.level}</p>
              <p style="margin: 4px 0;"><strong>Voters:</strong> ${cluster.voterCount}</p>
              <p style="margin: 4px 0;"><strong>Voting for:</strong> ${candidateData.name}</p>
            </div>
          `,
          properties: {
            type: 'voter-cluster-visible',
            voterCount: cluster.voterCount,
            locationName: cluster.locationName,
            level: cluster.level,
            candidateId: candidateData.id,
            candidateName: candidateData.name,
            isVoterMarker: true,
            isVisible: true
          }
        });
        
        newVoterEntities.push(entity);
      } catch (error) {
        console.error('🗳️ Failed to add visible voter entity:', error, cluster);
      }
    });
    
    // Render HIDDEN clusters (gray translucent towers)
    hidden.forEach((cluster, index) => {
      try {
        // Slightly larger for aggregated hidden voters, but still reasonable, scaled by cube size multiplier
        const baseTowerHeight = Math.min(15000, 5000 + cluster.voterCount * 1.5); // Max 15km base, scales with voters
        const baseTowerRadius = Math.min(4000, 1500 + cluster.voterCount * 0.4); // Max 4km base radius
        
        // Apply the same scaling as candidate cubes
        const towerHeight = baseTowerHeight * currentCubeSizeMultiplier;
        const towerRadius = baseTowerRadius * currentCubeSizeMultiplier;
        
        // Position tower center at half its height (like candidate cubes do)
        // This makes the tower extend from ground (0) upward to full height
        const towerCenterAltitude = towerHeight / 2;
        
        // Generate unique ID with timestamp to prevent collisions
        const entityId = `voter-hidden-${candidateData.id}-${cluster.clusterKey}-${index}-${Date.now()}`;
        
        // Color: gray for hidden votes - use FULLY OPAQUE to prevent rendering artifacts
        const entity = viewer.entities.add({
          id: entityId,
          position: window.Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, towerCenterAltitude),
          cylinder: {
            length: towerHeight,
            topRadius: towerRadius,
            bottomRadius: towerRadius,
            material: window.Cesium.Color.DARKGRAY, // FULLY OPAQUE gray (no alpha)
            outline: true,
            outlineColor: window.Cesium.Color.DIMGRAY, // Darker outline for contrast
            outlineWidth: 2,
            fill: true, // Explicitly enable fill
            numberOfVerticalLines: 8, // Reduce geometry complexity for better rendering
            slices: 16 // Smooth cylinder with 16 sides
            // No heightReference - use absolute altitude like candidate cubes
          },
          show: true, // Explicitly show the entity
          label: {
            text: `🔒 ${cluster.voterCount} hidden`,
            font: '14px sans-serif',
            fillColor: window.Cesium.Color.WHITE,
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new window.Cesium.Cartesian2(0, -30),
            scaleByDistance: new window.Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3)
          },
          description: `
            <div style="padding: 12px; background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%); color: white; border-radius: 8px; font-family: Inter, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #e5e7eb;">🔒 Hidden Voter Cluster</h4>
              <p style="margin: 4px 0;"><strong>Location:</strong> ${cluster.locationName || 'Unknown'}</p>
              <p style="margin: 4px 0;"><strong>Level:</strong> ${cluster.level}</p>
              <p style="margin: 4px 0;"><strong>Hidden Voters:</strong> ${cluster.voterCount}</p>
              <p style="margin: 4px 0;"><strong>Reason:</strong> ${cluster.privacyReason || 'Insufficient data granularity'}</p>
              <p style="margin: 4px 0;"><strong>Voting for:</strong> ${candidateData.name}</p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #d1d5db;">These votes cannot be shown at the current detail level due to privacy settings.</p>
            </div>
          `,
          properties: {
            type: 'voter-cluster-hidden',
            voterCount: cluster.voterCount,
            locationName: cluster.locationName,
            level: cluster.level,
            privacyReason: cluster.privacyReason,
            candidateId: candidateData.id,
            candidateName: candidateData.name,
            isVoterMarker: true,
            isHidden: true
          }
        });
        
        newVoterEntities.push(entity);
      } catch (error) {
        console.error('🗳️ Failed to add hidden voter entity:', error, cluster);
      }
    });
    
    setVoterEntities(newVoterEntities);
    
    console.log(`🗳️ Successfully rendered ${visible.length} visible + ${hidden.length} hidden voter clusters for ${candidateData.name}`);
  }, [viewer, currentCubeSizeMultiplier]);

  // **NEW: Load voters for a specific candidate using new storage API and cesiumHelpers**
  const loadVotersForCandidate = useCallback(async (candidateData, channelData, level = 'province') => {
    if (!candidateData || !channelData) return;
    
    console.log('🗳️ [NEW] Loading voters for candidate:', candidateData.name, 'in channel:', channelData.name);
    setLoadingVoters(true);
    
    // Clear previous voter visualization
    if (voterRenderResult) {
      cesiumHelpers.clearVoters(viewer, voterRenderResult);
      setVoterRenderResult(null);
    }
    
    try {
      const queryStartTime = performance.now();
      
      // Use the correct API endpoint: /api/visualization/voters/:topicId/candidate/:candidateId
      const topicId = channelData.id || channelData.topicId || channelData.name;
      const url = `http://localhost:3002/api/visualization/voters/${topicId}/candidate/${candidateData.id}?level=${level}`;
      
      console.log('🗳️ [NEW] Fetching from visualization API:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      const queryTime = performance.now() - queryStartTime;
      
      console.log('🗳️ [NEW] Visualization API response:', {
        success: result.success,
        topicId: result.topicId,
        candidateId: result.candidateId,
        level: result.level,
        visibleClusters: result.clusters?.visible?.length || 0,
        hiddenClusters: result.clusters?.hidden?.length || 0,
        totalVoters: result.totalVoters,
        visibleVoters: result.visibleVoters,
        hiddenVoters: result.hiddenVoters,
        queryTime: `${queryTime.toFixed(2)}ms`
      });
      
      if (!result.success || !result.clusters || 
          (result.clusters.visible.length === 0 && result.clusters.hidden.length === 0)) {
        console.warn('🗳️ [NEW] No voter clusters found for this candidate');
        setLoadingVoters(false);
        return;
      }
      
      // Use the existing renderVotersOnGlobe function which handles visible/hidden clusters
      renderVotersOnGlobe(result.clusters, candidateData, level);
      
      console.log('🗳️ [NEW] Render complete:', {
        visibleClusters: result.clusters.visible.length,
        hiddenClusters: result.clusters.hidden.length,
        totalVoters: result.totalVoters,
        queryTime: `${queryTime.toFixed(2)}ms`
      });
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('🗳️ [NEW] API request timed out');
      } else {
        console.error('🗳️ [NEW] Failed to load voters:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    } finally {
      setLoadingVoters(false);
    }
  }, [viewer, voterRenderResult, renderVotersOnGlobe]);

  // Get region color based on region ID or name
  const getRegionColor = useCallback((regionId, regionName) => {
    // Try region ID first
    if (regionId && REGION_COLORS[regionId]) {
      return REGION_COLORS[regionId];
    }
    
    // Try region name
    if (regionName && REGION_COLORS[regionName]) {
      return REGION_COLORS[regionName];
    }
    
    // Generate consistent color from region name hash
    if (regionName) {
      const hash = regionName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    }
    
    return REGION_COLORS.default;
  }, []);

  // Get geographical centroid using comprehensive province data
  const getGeographicalCentroid = useCallback(async (regionName, regionType = 'country', countryInfo = null) => {
    try {
      // For provinces, get centroid from backend UnifiedBoundaryService
      if (regionType === 'province') {
        const requestBody = { provinceName: regionName };
        if (countryInfo) {
          requestBody.countryCode = countryInfo.countryCode || countryInfo.countryName;
        }
        
        const response = await fetch('/api/channels/unified-boundary/province-centroid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.centroid) {
            console.log(`🗺️ [PROVINCE CENTROID] Using precise centroid for ${regionName}: [${data.centroid[1].toFixed(3)}, ${data.centroid[0].toFixed(3)}]`);
            return data.centroid; // Already in [lng, lat] format
          }
        }
      }
      
      // Fallback: Try RegionManager for other types
      if (regionManager && regionManager.getRegionCentroid) {
        const centroid = regionManager.getRegionCentroid(regionName, regionType);
        if (centroid) {
          console.log(`🌍 📍 Using RegionManager centroid for ${regionName}: [${centroid.latitude.toFixed(3)}, ${centroid.longitude.toFixed(3)}]`);
          return [centroid.longitude, centroid.latitude];
        }
      }
      
      // 🌍 Comprehensive static centroids for countries and major regions (V86 Italy-style implementation)
      const staticCentroids = {
        // === CONTINENTS ===
        'Europe': [10.0, 54.0],
        'Asia': [100.0, 35.0],
        'North America': [-100.0, 45.0],
        'South America': [-60.0, -15.0],
        'Africa': [20.0, 0.0],
        'Oceania': [135.0, -25.0],
        'Australia': [135.0, -25.0],
        
        // === EUROPEAN COUNTRIES ===
        'Italy': [12.5674, 41.8719],  // Rome (capital)
        'Spain': [-3.7492, 40.4637],   // Madrid (capital)
        'France': [2.3522, 48.8566],   // Paris (capital)
        'Germany': [13.4050, 52.5200], // Berlin (capital)
        'United Kingdom': [-0.1276, 51.5074], // London (capital)
        'UK': [-0.1276, 51.5074],
        'Netherlands': [4.8952, 52.3702], // Amsterdam (capital)
        'Belgium': [4.3517, 50.8503],  // Brussels (capital)
        'Switzerland': [7.4474, 46.9480], // Bern (capital)
        'Austria': [16.3738, 48.2082], // Vienna (capital)
        'Poland': [21.0122, 52.2297],  // Warsaw (capital)
        'Portugal': [-9.1393, 38.7223], // Lisbon (capital)
        'Greece': [23.7275, 37.9838],  // Athens (capital)
        'Sweden': [18.0686, 59.3293],  // Stockholm (capital)
        'Norway': [10.7522, 59.9139],  // Oslo (capital)
        'Denmark': [12.5683, 55.6761], // Copenhagen (capital)
        'Finland': [24.9384, 60.1699], // Helsinki (capital)
        'Ireland': [-6.2603, 53.3498], // Dublin (capital)
        'Czech Republic': [14.4378, 50.0755], // Prague (capital)
        'Hungary': [19.0402, 47.4979], // Budapest (capital)
        'Romania': [26.1025, 44.4268],  // Bucharest (capital)
        'Bulgaria': [23.3219, 42.6977], // Sofia (capital)
        
        // === ASIAN COUNTRIES ===
        'China': [116.4074, 39.9042],  // Beijing (capital)
        'Japan': [139.6503, 35.6762],  // Tokyo (capital)
        'India': [77.2090, 28.6139],   // New Delhi (capital)
        'South Korea': [126.9780, 37.5665], // Seoul (capital)
        'Indonesia': [106.8456, -6.2088], // Jakarta (capital)
        'Thailand': [100.5018, 13.7563], // Bangkok (capital)
        'Vietnam': [105.8342, 21.0278],  // Hanoi (capital)
        'Singapore': [103.8198, 1.3521], // Singapore (city-state)
        'Malaysia': [101.6869, 3.1390],  // Kuala Lumpur (capital)
        'Philippines': [121.0244, 14.5995], // Manila (capital)
        
        // === NORTH AMERICAN COUNTRIES ===
        'United States': [-77.0369, 38.9072], // Washington DC (capital)
        'USA': [-77.0369, 38.9072],
        'Canada': [-75.6972, 45.4215],  // Ottawa (capital)
        'Mexico': [-99.1332, 19.4326],  // Mexico City (capital)
        
        // === SOUTH AMERICAN COUNTRIES ===
        'Brazil': [-47.8825, -15.7942],  // Brasília (capital)
        'Argentina': [-58.3816, -34.6037], // Buenos Aires (capital)
        'Chile': [-70.6693, -33.4489],   // Santiago (capital)
        'Colombia': [-74.0721, 4.7110],  // Bogotá (capital)
        'Peru': [-77.0428, -12.0464],    // Lima (capital)
        'Venezuela': [-66.9036, 10.4806], // Caracas (capital)
        'Ecuador': [-78.4678, -0.1807],  // Quito (capital)
        'Bolivia': [-68.1193, -16.5000], // La Paz (de facto capital)
        
        // === AFRICAN COUNTRIES ===
        'South Africa': [28.0473, -26.2041], // Pretoria (capital)
        'Egypt': [31.2357, 30.0444],     // Cairo (capital)
        'Nigeria': [7.4951, 9.0765],     // Abuja (capital)
        'Kenya': [36.8219, -1.2921],     // Nairobi (capital)
        'Morocco': [-6.8498, 33.9716],   // Rabat (capital)
        'Algeria': [3.0588, 36.7538],    // Algiers (capital)
        'Tunisia': [10.1815, 36.8065],   // Tunis (capital)
        'Ghana': [-0.1870, 5.6037],      // Accra (capital)
        
        // === MIDDLE EASTERN COUNTRIES ===
        'Saudi Arabia': [46.6753, 24.7136], // Riyadh (capital)
        'UAE': [54.3773, 24.4539],       // Abu Dhabi (capital)
        'Israel': [35.2137, 31.7683],    // Jerusalem (capital)
        'Turkey': [32.8597, 39.9334],    // Ankara (capital)
        'Iran': [51.3890, 35.6892],      // Tehran (capital)
        
        // === OCEANIA COUNTRIES ===
        'New Zealand': [174.7762, -41.2865], // Wellington (capital)
        
        // === LEGACY UPPERCASE NAMES ===
        'EUROPE': [10.0, 54.0],
        'ASIA': [100.0, 35.0],
        'NORTH_AMERICA': [-100.0, 45.0],
        'SOUTH_AMERICA': [-60.0, -15.0],
        'AFRICA': [20.0, 0.0],
        'AUSTRALIA': [135.0, -25.0]
      };
      
      // Try exact match first
      if (staticCentroids[regionName]) {
        console.log(`🌍 📍 Found hardcoded centroid for ${regionName}: [${staticCentroids[regionName][1].toFixed(4)}, ${staticCentroids[regionName][0].toFixed(4)}]`);
        return staticCentroids[regionName];
      }
      
      // Try case-insensitive match
      const normalizedName = Object.keys(staticCentroids).find(
        key => key.toLowerCase() === regionName.toLowerCase()
      );
      if (normalizedName) {
        console.log(`🌍 📍 Found hardcoded centroid for ${regionName} (matched as ${normalizedName})`);
        return staticCentroids[normalizedName];
      }
      
    } catch (error) {
      console.warn(`🌍 ⚠️ Error getting geographical centroid for ${regionName}:`, error);
    }

    return null;
  }, [regionManager]);

  // Calculate cube height based on vote count (proportional scaling)
  const calculateVoteBasedHeight = useCallback((voteCount, maxVotes, minHeight = 50000, maxHeight = 500000) => {
    if (maxVotes === 0) return minHeight;
    
    // Enhanced scaling for GPS level - more dramatic height differences
    const voteRatio = voteCount / maxVotes;
    
    // Use exponential scaling for more dramatic visual effect
    const exponentialRatio = Math.pow(voteRatio, 0.7); // Makes smaller differences more visible
    const height = minHeight + (exponentialRatio * (maxHeight - minHeight));
    
    // Ensure minimum height for visibility
    return Math.max(minHeight, height);
  }, []);

  // Generate realistic GPS locations for candidates around a center point
  const generateCandidateLocations = useCallback((centerLat, centerLng, candidateCount) => {
    const locations = [];
    const radiusKm = 200; // Increased to 200km radius for better regional spread
    const earthRadiusKm = 6371;
    
    for (let i = 0; i < candidateCount; i++) {
      // Generate random angle and distance for natural scattering
      const angle = (i / candidateCount) * 2 * Math.PI + (Math.random() - 0.5) * 1.5;
      const distance = Math.random() * radiusKm;
      
      // Convert to lat/lng offset
      const latOffset = (distance / earthRadiusKm) * (180 / Math.PI);
      const lngOffset = (distance / earthRadiusKm) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
      
      const candidateLat = centerLat + latOffset * Math.cos(angle);
      const candidateLng = centerLng + lngOffset * Math.sin(angle);
      
      locations.push({
        lat: candidateLat,
        lng: candidateLng
      });
    }
    
    return locations;
  }, []);

  // Removed fallback data generation - system now only uses backend data

  // No camera height tracking - clustering controlled only by UI buttons

  // Debug controls for development
  useEffect(() => {
    window.debugGlobalChannelRenderer = {
      clearCache: () => {
        entityCacheRef.current.clear();
        lastChannelsHashRef.current = '';
      },
      forceRefresh: () => {
        setChannels([]);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      },
      clearAll: () => {
        isUserClearingRef.current = true;
        entityCacheRef.current.clear();
        lastChannelsHashRef.current = '';
        if (viewer && viewer.entities) {
          removeOnlyCandidateEntities(); // Selective removal - protects boundaries
        }
        setTimeout(() => {
          isUserClearingRef.current = false;
        }, 1000);
      },
      getState: () => ({
        channelsCount: channels.length,
        entitiesCount: viewer?.entities?.values?.length || 0,
        cacheKeys: Array.from(entityCacheRef.current.keys()),
        currentClusterLevel
      })
    };
    
    return () => {
      delete window.debugGlobalChannelRenderer;
    };
  }, [channels, viewer, currentClusterLevel]);

  // Load channel data from backend API instead of generating local data
  useEffect(() => {
    // Fetch channel data using utility with enhanced caching
    const fetchBackendChannels = async (forceRefresh = false) => {
      try {
        const backendChannels = await channelUtils.fetchChannels(forceRefresh);
        
        if (backendChannels.length === 0) {
          // Only auto-clear if user is not intentionally clearing channels
          if (!isUserClearingRef.current) {
            // Don't clear existing channels - just log the empty backend response
            return;
          }
          return;
        }
        
        // Use backend data directly - it already has persistent GPS coordinates
        setChannels(backendChannels);
      } catch (error) {
        console.warn('🌍 📡 ❌ Failed to fetch backend channels:', error);
        // No fallback - only show backend data
        setChannels([]);
      }
    };
    
    // Always fetch channels from backend on component mount to ensure we have the latest data
    fetchBackendChannels();
    
    // Listen for channel update events from TestDataPanel (but NOT clustering changes)
    const handleChannelsGenerated = () => {
      fetchBackendChannels(true); // Force refresh to bypass cache
    };

    const handleChannelsUpdated = (event) => {
      // Only refresh if this is a real data update, not a clustering level change
      if (event?.detail?.source !== 'clustering') {
        fetchBackendChannels(true); // Force refresh to bypass cache
      }
    };

    const handleChannelsCleared = () => {
      // Set flag to prevent auto-clearing interference
      isUserClearingRef.current = true;
      
      // Clear the channels state without fetching new data
      setChannels([]);
      
      // Clear entity cache when channels are actually cleared
      entityCacheRef.current.clear();
      lastChannelsHashRef.current = '';
      
      // Set force clear flag in AdministrativeHierarchy to allow removing candidates
      if (regionManager && regionManager.adminHierarchy) {
        regionManager.adminHierarchy._forceClearCandidates = true;
        console.log('🧹 [GlobalChannelRenderer] Force clear flag set - candidates will be removed');
      } else {
        console.warn('🧹 [GlobalChannelRenderer] Could not access AdministrativeHierarchy to set force clear flag');
      }
      
      // Force a selective clear (protect administrative boundaries)
      if (viewer && viewer.entities) {
        const removedCount = removeOnlyCandidateEntities();
        console.log('🧹 [GlobalChannelRenderer] Selective clear:', removedCount, 'candidate entities removed from channels cleared event');
      } else {
        console.log('🧹 [GlobalChannelRenderer] No entities collection available to clear');
      }
      
      // Reset the clearing flag after a short delay
      setTimeout(() => {
        isUserClearingRef.current = false;
        console.log('🧹 [GlobalChannelRenderer] User clearing flag reset');
      }, 1000);
    };

    // DISABLED: Window focus handler causes unnecessary re-renders and clears voters
    // Channels don't change just because you focus the window
    // const handleWindowFocus = () => {
    //   console.log('🔄 [GlobalChannelRenderer] Window focused, checking for channel updates...');
    //   fetchBackendChannels();
    // };

    // Handle vote updates with optimistic UI sync
    const handleVoteUpdate = (event) => {
      const { candidateId, votes, isOptimistic, error } = event.detail;
      
      if (DEBUG_CONFIG.VOTES) {
        console.log(`🗳️ Vote update: ${candidateId} = ${votes} (optimistic: ${isOptimistic})`);
      }
      
      // Update channel data if it exists
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          if (channel.id === candidateId) {
            return { ...channel, votes, isOptimistic, error };
          }
          return channel;
        })
      );
    };

    window.addEventListener('channelsGenerated', handleChannelsGenerated);
    window.addEventListener('channelsUpdated', handleChannelsUpdated);
    window.addEventListener('channelsCleared', handleChannelsCleared);
    // window.addEventListener('focus', handleWindowFocus); // DISABLED - causes unnecessary re-renders
    window.addEventListener('voteUpdate', handleVoteUpdate);
    
    // Initialize boundary rendering service
    if (viewer && !boundaryServiceRef.current) {
      boundaryServiceRef.current = new BoundaryRenderingService(viewer);
      console.log('🗺️ Boundary rendering service initialized');
    }

    // Boundary event listeners for preview and comparison
    const handlePreviewBoundary = (event) => {
      const { candidateId, geojson, direction, isDefault, metadata } = event.detail;
      console.log('🗺️ Preview boundary event received:', { candidateId, isDefault, direction });
      
      if (boundaryServiceRef.current && geojson) {
        boundaryServiceRef.current.previewBoundary(
          candidateId,
          geojson,
          isDefault,
          { direction, ...metadata }
        );
      }
    };

    const handleCompareBoundaries = (event) => {
      const { current, proposal } = event.detail;
      console.log('🗺️ Compare boundaries event received');
      
      if (boundaryServiceRef.current && current?.geojson && proposal?.geojson) {
        boundaryServiceRef.current.compareBoundaries(
          current.geojson,
          proposal.geojson,
          { name: 'Current Boundary', ...current.metadata },
          { name: 'Proposed Boundary', ...proposal.metadata }
        );
      }
    };

    const handleCloseBoundaryPreview = () => {
      console.log('🗺️ Close boundary preview event received');
      
      if (boundaryServiceRef.current) {
        boundaryServiceRef.current.clearPreview();
      }
    };

    window.addEventListener('previewBoundary', handlePreviewBoundary);
    window.addEventListener('compareBoundaries', handleCompareBoundaries);
    window.addEventListener('closeBoundaryPreview', handleCloseBoundaryPreview);
    
    // Set GPS level for individual candidate rendering
    console.log(`🌍 Setting GPS level for individual candidates`);
    setCurrentClusterLevel('gps');
      
    console.log('🌍 Initial setup complete, no transition needed');
    
    // Enable bloom effect for glowing towers
    try {
      // Enable bloom post-processing for glow effects on vote towers
      if (viewer && viewer.scene && !viewer.scene.postProcessStages.bloom) {
        viewer.scene.postProcessStages.bloom = viewer.scene.postProcessStages.add(
          window.Cesium.PostProcessStageLibrary.createBloomStage()
        );
        viewer.scene.postProcessStages.bloom.enabled = true;
        viewer.scene.postProcessStages.bloom.uniforms.glowOnly = false; // Show base + glow
        viewer.scene.postProcessStages.bloom.uniforms.contrast = 128; // Brightness threshold
        viewer.scene.postProcessStages.bloom.uniforms.brightness = -0.3; // Overall brightness adjustment
        viewer.scene.postProcessStages.bloom.uniforms.delta = 1.0; // Blur intensity
        viewer.scene.postProcessStages.bloom.uniforms.sigma = 3.5; // Blur spread radius
        viewer.scene.postProcessStages.bloom.uniforms.stepSize = 5.0; // Blur step size
        console.log('✨ Bloom effect enabled for glowing vote towers');
      }
    } catch (error) {
      console.warn('⚠️ Could not enable bloom effect:', error.message);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('channelsGenerated', handleChannelsGenerated);
      window.removeEventListener('channelsUpdated', handleChannelsUpdated);
      window.removeEventListener('channelsCleared', handleChannelsCleared);
      // window.removeEventListener('focus', handleWindowFocus); // DISABLED - was never added
      window.removeEventListener('voteUpdate', handleVoteUpdate);
      window.removeEventListener('previewBoundary', handlePreviewBoundary);
      window.removeEventListener('compareBoundaries', handleCompareBoundaries);
      window.removeEventListener('closeBoundaryPreview', handleCloseBoundaryPreview);
      
      // Cleanup boundary service
      if (boundaryServiceRef.current) {
        boundaryServiceRef.current.dispose();
        boundaryServiceRef.current = null;
        console.log('🗑️ Boundary rendering service disposed');
      }
      
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [viewer]); // REMOVED clusterLevel dependency to prevent refetching on cluster changes

  // Watch for changes in globeState.voteCounts and recalculate aggregated votes
  useEffect(() => {
    if (channels.length > 0 && globeState?.voteCounts) {
      console.log('🎯 [GlobalChannelRenderer] Detected vote count changes, recalculating aggregated votes');
      const newAggregatedVotes = calculateAggregatedVoteCounts(channels, currentClusterLevel);
      setAggregatedVoteCounts(newAggregatedVotes);
      console.log('🎯 [GlobalChannelRenderer] Updated aggregated votes:', newAggregatedVotes);
    }
  }, [globeState?.voteCounts, globeState?.channelsUpdated, channels, currentClusterLevel, calculateAggregatedVoteCounts]);

  // Helper function: Selective entity removal that PROTECTS administrative boundaries
  const removeOnlyCandidateEntities = useCallback(() => {
    if (!viewer || !viewer.entities) return 0;
    
    const allEntities = viewer.entities.values.slice();
    const protectedEntities = [];
    const removableEntities = [];
    
    // DEBUG: Log first 5 entity IDs to see what we're dealing with
    console.log(`🔍 DEBUG: Total entities in viewer: ${allEntities.length}`);
    console.log(`🔍 DEBUG: First 5 entity IDs:`, allEntities.slice(0, 5).map(e => e.id));
    
    // Count entity types
    let countyCount = 0;
    let provinceCount = 0;
    let candidateCount = 0;
    let otherCount = 0;
    
    allEntities.forEach(entity => {
      // PROTECT: County, province, city, and administrative boundary entities
      if (entity.id && (
        entity.id.startsWith('county-') ||
        entity.id.startsWith('province-') ||
        entity.id.startsWith('city-') ||
        entity.id.startsWith('admin-') ||
        entity.id.startsWith('boundary-')
      )) {
        protectedEntities.push(entity.id);
        if (entity.id.startsWith('county-')) countyCount++;
        if (entity.id.startsWith('province-')) provinceCount++;
      } else {
        // REMOVE: Candidate and vote tower entities
        removableEntities.push(entity);
        if (entity.id && (entity.id.includes('candidate-') || entity.id.includes('cluster-'))) {
          candidateCount++;
        } else {
          otherCount++;
        }
      }
    });
    
    // Remove only candidate/vote entities
    removableEntities.forEach(entity => {
      try {
        viewer.entities.remove(entity);
      } catch (error) {
        console.warn('⚠️ Error removing entity:', entity.id, error);
      }
    });
    
    console.log(`🛡️ Selective entity removal - protecting administrative entities...`);
    console.log(`🛡️ Removal complete: ${removableEntities.length} removed (${candidateCount} candidates, ${otherCount} other), ${protectedEntities.length} protected (${countyCount} counties, ${provinceCount} provinces)`);
    
    return removableEntities.length;
  }, [viewer]);

  // Clear all entities (now uses selective removal)
  const clearEntities = useCallback(() => {
    if (viewer && viewer.entities) {
      console.log('🌍 🧹 SELECTIVE CLEAR - Current count:', viewer.entities.values.length);
      
      // Step 1: Clear from our tracking reference (only tracked candidate entities)
      if (entitiesRef.current.size > 0) {
        console.log('🌍 Step 1: Clearing', entitiesRef.current.size, 'tracked entities from entitiesRef');
        entitiesRef.current.forEach((entity, key) => {
          try {
            if (viewer.entities.contains(entity)) {
              viewer.entities.remove(entity);
            }
          } catch (error) {
            console.warn('🌍 ⚠️ Error removing tracked entity:', key, error);
          }
        });
        entitiesRef.current.clear();
      }
      
      // Step 2: SELECTIVE REMOVAL - Remove only candidate entities, protect boundaries
      try {
        console.log('🌍 Step 2: SELECTIVE removal of candidate entities (protecting boundaries)');
        const removedCount = removeOnlyCandidateEntities();
        console.log(`🌍 ✅ Selective removal executed - removed ${removedCount} candidate entities`);
        
        // Verify administrative entities are still present
        const remainingCount = viewer.entities.values.length;
        const countyCount = viewer.entities.values.filter(e => e.id && e.id.startsWith('county-')).length;
        console.log(`🌍 ✅ SELECTIVE CLEAR RESULT: ${remainingCount} entities remaining (${countyCount} counties preserved)`);
        
      } catch (error) {
        console.error('🌍 ❌ Error during selective clear:', error);
      }
      
      // Step 3: Clear our local state
      setEntities([]);
      
      // Step 4: Force a scene render to update visuals
      try {
        viewer.scene.requestRender();
        console.log('🌍 ✅ Scene render requested');
      } catch (error) {
        console.warn('🌍 ⚠️ Error requesting scene render:', error);
      }
      
      console.log('🌍 ✅ SELECTIVE CLEAR COMPLETE');
    } else {
      console.warn('🌍 ⚠️ Cannot clear entities - viewer or entities not available');
    }
  }, [viewer, removeOnlyCandidateEntities]);

  // Hierarchical clustering functions based on V75 implementation
  
  // OPTIMIZED: Group candidates by clustering level with frontend-compatible approach
  const groupCandidatesByClusterLevel = useCallback(async (channels, level) => {
    console.log(`🌍 📊 groupCandidatesByClusterLevel called with level: ${level} and ${channels?.length || 0} channels`);
    
    if (!channels || channels.length === 0) {
      return new Map();
    }

    // Check if we should use optimized clustering
    const shouldUseOptimized = channels.some(ch => 
      ch.type === 'optimized-production' || 
      ch.type === 'optimized-demo' ||
      ch.productionMetadata?.clusteringOptimized
    );
    
    if (shouldUseOptimized) {
      console.log(`🎯 Using optimized clustering for ${channels.length} channels at ${level} level`);
      
      // Use the optimized channels service for clustering
      try {
        const optimizedData = await optimizedChannelsService.fetchOptimizedChannels();
        if (optimizedData && optimizedData.success) {
          return optimizedChannelsService.generateClustersFromOptimizedData(optimizedData.data, level);
        } else {
          console.warn('No optimized data available, falling back to standard clustering');
        }
      } catch (error) {
        console.warn('Failed to get optimized clustering data:', error);
        // Fall through to standard clustering
      }
    }
    
    // NOTE: Optimized API fetch removed to prevent infinite recursion
    // The fallback clustering logic below handles all clustering properly
    console.log(`🔄 Using fallback clustering logic with province/city/country data from candidates`);
    
    // FALLBACK: Original clustering logic (works with reverse-geocoded data)
    const clusterGroups = new Map();
    
    channels.forEach(channel => {
      if (!channel.candidates || !Array.isArray(channel.candidates)) {
        return;
      }
      
      channel.candidates.forEach(candidate => {
        let clusterId = 'UNKNOWN';
        let clusterName = 'Unknown';
        
        // 🎯 ENHANCED CLUSTERING: Use fallback logic like V86 for robust clustering
        const { channelCountry, channelProvince, channelContinent } = enhanceClusteringData(candidate, channel);
        
        switch (level) {
          case 'gps':
            // Individual GPS positioning - each candidate gets its own cluster
            clusterId = `gps-${candidate.id || Math.random().toString(36).substr(2, 9)}`;
            clusterName = `GPS-${candidate.id || 'Unknown'}`;
            break;
            
          case 'county':
            // County/district level clustering - group by county
            const county = candidate.county || 
                          candidate.district || 
                          candidate.countyName ||
                          'UNKNOWN_COUNTY';
            const province = candidate.province || 
                           candidate.state || 
                           'UNKNOWN_PROVINCE';
            
            clusterId = `${channelCountry}-${province}-${county}`;
            clusterName = county !== 'UNKNOWN_COUNTY' ? 
              `${county}, ${province}, ${channelCountry}` : 
              `${province}, ${channelCountry}`;
            console.log(`🗺️ [COUNTY CLUSTERING] Candidate ${candidate.id} assigned to county: ${clusterName}`);
            break;
            
          case 'province':
            // Province/state level clustering - group by province with fallback
            clusterId = channelProvince !== 'UNKNOWN' ? `${channelCountry}-${channelProvince}` : channelCountry;
            clusterName = channelProvince !== 'UNKNOWN' ? `${channelProvince}, ${channelCountry}` : channelCountry;
            console.log(`🌍 [PROVINCE CLUSTERING] Candidate ${candidate.id} assigned to province: ${clusterName}`);
            break;
            
          case 'country':
            // Country level clustering - group by country with fallback
            clusterId = channelCountry !== 'UNKNOWN' ? channelCountry : `fallback-${channel.id}`;
            clusterName = channelCountry !== 'UNKNOWN' ? channelCountry : `Channel ${channel.name}`;
            console.log(`🌍 [COUNTRY CLUSTERING] Candidate ${candidate.id} assigned to country: ${clusterName}`);
            break;
            
          case 'continent':
            // Continent level clustering - group by continent with coordinate fallback
            clusterId = channelContinent !== 'UNKNOWN' ? channelContinent : 'Unknown Continent';
            clusterName = channelContinent !== 'UNKNOWN' ? channelContinent : 'Unknown Continent';
            console.log(`🌍 [CONTINENT CLUSTERING] Candidate ${candidate.id} assigned to continent: ${clusterName}`);
            break;
            
          case 'global':
            // Global level clustering - all candidates in one group
            clusterId = 'GLOBAL';
            clusterName = 'Global';
            console.log(`🌍 [GLOBAL CLUSTERING] Candidate ${candidate.id} assigned to global cluster`);
            break;
            
          default:
            clusterId = 'UNKNOWN';
            clusterName = 'Unknown';
        }
        
        // Add to cluster group
        if (!clusterGroups.has(clusterId)) {
          clusterGroups.set(clusterId, {
            clusterId: clusterId,
            clusterName: clusterName,
            level: level,
            countryName: channelCountry,
            countryCode: channel.countryCode || channelCountry,
            continent: channelContinent,
            province: channelProvince,
            candidates: [],
            channels: new Set(),
            locations: []
          });
        }
        
        const clusterGroup = clusterGroups.get(clusterId);
        
        // 🗺️ GEOGRAPHIC INHERITANCE: Give candidates proper geographic data from channel
        const enhancedCandidate = {
          ...candidate,
          sourceChannel: channel,
          // Inherit geographic info from channel for clustering consistency
          country: channelCountry,
          province: channelProvince, 
          continent: channelContinent,
          countryCode: channel.countryCode,
          // Ensure candidate has location data for centroid calculation
          location: candidate.location || {
            lat: channel.location?.latitude || 0,
            lng: channel.location?.longitude || 0,
            address: channel.primary_region || 'Unknown Location',
            country: channelCountry,
            province: channelProvince
          }
        };
        
        clusterGroup.candidates.push(enhancedCandidate);
        clusterGroup.channels.add(channel.id);
        
        // Add location for centroid calculation - now guaranteed to exist
        const candidateLocation = enhancedCandidate.location;
        if (candidateLocation && candidateLocation.lat && candidateLocation.lng) {
          clusterGroup.locations.push([candidateLocation.lng, candidateLocation.lat]);
        }
        // Ultimate fallback: use [0,0] to prevent empty locations array
        else {
          console.warn(`🗺️ No location data for candidate ${candidate.id}, using fallback [0,0]`);
          clusterGroup.locations.push([0, 0]);
        }
      });
    });
    
    // Calculate centroids for each cluster group - use geographical centroids when available
    const centroidPromises = Array.from(clusterGroups.entries()).map(async ([clusterId, group]) => {
      try {
        // Try to get geographical centroid first
        let geoCentroid = null;
        
        if (group.level === 'province') {
          geoCentroid = await getGeographicalCentroid(group.clusterName, 'province', {
            countryCode: group.countryCode,
            countryName: group.countryName
          });
        } else if (group.level === 'country') {
          geoCentroid = await getGeographicalCentroid(group.clusterName, 'country');
        } else if (group.level === 'continent') {
          geoCentroid = await getGeographicalCentroid(group.clusterName, 'continent');
        }
        
        if (geoCentroid) {
          group.centroid = geoCentroid;
          group.centroidType = 'geographical';
          console.log(`🗺️ [PROVINCE CLUSTER] Using precise centroid for ${group.clusterName}: [${group.centroid[1].toFixed(3)}, ${group.centroid[0].toFixed(3)}]`);
        } else {
          // Fallback to candidate-based centroid
          if (group.locations.length > 0) {
            const totalLng = group.locations.reduce((sum, loc) => sum + loc[0], 0);
            const totalLat = group.locations.reduce((sum, loc) => sum + loc[1], 0);
            group.centroid = [
              totalLng / group.locations.length,
              totalLat / group.locations.length
            ];
            group.centroidType = 'candidate-based';
            console.log(`🌍 📊 Using candidate-based centroid for ${group.clusterName}: [${group.centroid[1].toFixed(3)}, ${group.centroid[0].toFixed(3)}]`);
          } else {
            group.centroid = [0, 0];
            group.centroidType = 'fallback';
          }
        }
        
        // Calculate total votes for this cluster using getCandidateVotes()
        group.totalVotes = group.candidates.reduce((sum, candidate) => {
          const channelId = candidate.sourceChannel?.id || candidate.channelId;
          return sum + getCandidateVotes(candidate, channelId);
        }, 0);
        
        console.log(`🌍 Cluster Group: ${group.clusterName} (${clusterId}) - ${group.candidates.length} candidates, ${group.totalVotes} votes, centroid: [${group.centroid[1].toFixed(3)}, ${group.centroid[0].toFixed(3)}] (${group.centroidType})`);
        
      } catch (error) {
        console.error(`❌ [CLUSTERING] Error processing centroids for ${group.clusterName}:`, error);
        
        // Emergency fallback
        if (group.locations.length > 0) {
          const totalLng = group.locations.reduce((sum, loc) => sum + loc[0], 0);
          const totalLat = group.locations.reduce((sum, loc) => sum + loc[1], 0);
          group.centroid = [totalLng / group.locations.length, totalLat / group.locations.length];
        } else {
          group.centroid = [0, 0];
        }
        group.centroidType = 'error-fallback';
        group.totalVotes = group.candidates.reduce((sum, candidate) => {
          const channelId = candidate.sourceChannel?.id || candidate.channelId;
          return sum + getCandidateVotes(candidate, channelId);
        }, 0);
      }
    });
    
    // Wait for all centroids to be calculated
    await Promise.all(centroidPromises);
    
    return clusterGroups;
  }, [getGeographicalCentroid]);

  // Generate optimized clusters using candidate's clustering keys
  const generateOptimizedClusters = useCallback(async (channel, level) => {
    console.log(`🎯 Generating optimized clusters for channel ${channel.name} at ${level} level`);
    
    const clusterGroups = new Map();
    
    if (!channel.candidates || !Array.isArray(channel.candidates)) {
      return clusterGroups;
    }
    
    for (const candidate of channel.candidates) {
      // Use the candidate's pre-computed clustering keys
      let clusterId = 'UNKNOWN';
      let clusterName = 'Unknown';
      
      if (candidate.clusterKeys && candidate.clusterKeys[level]) {
        clusterId = candidate.clusterKeys[level];
        
        // Generate appropriate cluster name based on level
        switch (level) {
          case 'gps':
            clusterName = `GPS-${candidate.id}`;
            break;
          case 'city':
            clusterName = candidate.city || clusterId;
            break;
          case 'county':
            clusterName = candidate.county || candidate.district || 'Unknown County';
            break;
          case 'province':
            clusterName = candidate.province ? `${candidate.province}, ${candidate.country}` : candidate.country;
            break;
          case 'country':
            clusterName = candidate.country || clusterId;
            break;
          case 'region':
            clusterName = candidate.region || clusterId;
            break;
          case 'global':
            clusterName = 'Global';
            break;
          default:
            clusterName = clusterId;
        }
      } else {
        // Fallback to legacy clustering if no clustering keys
        console.warn(`⚠️ Candidate ${candidate.id} missing clustering keys, using fallback`);
        
        switch (level) {
          case 'gps':
            clusterId = `gps-${candidate.id}`;
            clusterName = `GPS-${candidate.id}`;
            break;
          case 'city':
            clusterId = candidate.city || 'Unknown City';
            clusterName = candidate.city || 'Unknown City';
            break;
          case 'county':
            clusterId = candidate.county || candidate.district || 'Unknown County';
            clusterName = candidate.county || candidate.district || 'Unknown County';
            break;
          case 'province':
            clusterId = candidate.province || candidate.country || 'Unknown Province';
            clusterName = candidate.province ? `${candidate.province}, ${candidate.country}` : candidate.country || 'Unknown Province';
            break;
          case 'country':
            clusterId = candidate.country || 'Unknown Country';
            clusterName = candidate.country || 'Unknown Country';
            break;
          case 'region':
            clusterId = candidate.region || 'Unknown Region';
            clusterName = candidate.region || 'Unknown Region';
            break;
          case 'global':
            clusterId = 'GLOBAL';
            clusterName = 'Global';
            break;
        }
      }
      
      // Create or update cluster group
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, {
          clusterId: clusterId,
          clusterName: clusterName,
          level: level,
          countryName: candidate.country,
          countryCode: candidate.countryCode,
          continent: candidate.continent,
          region: candidate.region,
          province: candidate.province,
          city: candidate.city,
          candidates: [],
          channels: new Set(),
          locations: [],
          centroid: null,
          centroidType: 'optimized',
          totalVotes: 0
        });
      }
      
      const clusterGroup = clusterGroups.get(clusterId);
      clusterGroup.candidates.push(candidate);
      clusterGroup.channels.add(channel.id);
      clusterGroup.totalVotes += getCandidateVotes(candidate, channel.id);
      
      // Add location for centroid calculation
      if (candidate.location && candidate.location.lat && candidate.location.lng) {
        clusterGroup.locations.push([candidate.location.lng, candidate.location.lat]);
      }
    }
    
    // Calculate centroids for each cluster group
    for (const [clusterId, group] of clusterGroups) {
      if (group.locations.length > 0) {
        const totalLng = group.locations.reduce((sum, loc) => sum + loc[0], 0);
        const totalLat = group.locations.reduce((sum, loc) => sum + loc[1], 0);
        group.centroid = [
          totalLng / group.locations.length,
          totalLat / group.locations.length
        ];
      } else {
        group.centroid = [0, 0];
      }
      
      console.log(`🎯 Optimized Cluster: ${group.clusterName} - ${group.candidates.length} candidates, ${group.totalVotes} votes, centroid: [${group.centroid[1].toFixed(3)}, ${group.centroid[0].toFixed(3)}]`);
    }
    
    return clusterGroups;
  }, []);
  
  // Helper function to determine continent from coordinates (V86 compatibility)
  const getContinentFromCoordinates = useCallback((location) => {
    if (!location || (!location.lat && !location.latitude) || (!location.lng && !location.longitude)) {
      return 'UNKNOWN';
    }
    
    const lat = location.lat || location.latitude;
    const lng = location.lng || location.longitude;
    
    // 🌍 V86 COMPATIBLE: Robust continent detection from coordinates  
    if (lat >= 60) return 'Arctic';
    else if (lat >= 35 && lng >= -170 && lng <= -50) return 'North America';
    else if (lat >= 35 && lng >= -10 && lng <= 40) return 'Europe';
    else if (lat >= 35 && lng >= 40 && lng <= 180) return 'Asia';
    else if (lat >= -35 && lat <= 35 && lng >= -80 && lng <= -30) return 'South America';
    else if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 55) return 'Africa';
    else if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) return 'Oceania';
    else if (lat >= -50 && lat <= -10 && lng >= -180 && lng <= -110) return 'Oceania';
    else return 'Ocean';
  }, []);
  
  // 🔄 FALLBACK CLUSTERING: Handle cases where channel data is incomplete
  const enhanceClusteringData = useCallback((candidate, channel) => {
    // **ENHANCED FIX**: Read from candidate first (where coordinates are actually generated), then fallback to channel
    // Support multiple field names for better compatibility
    const channelCountry = candidate.country || candidate.countryCode || candidate.countryName || 
                          channel.country || channel.countryCode || channel.countryName || 'UNKNOWN';
    
    // Check multiple province field names (province, state, region, provinceName, stateName, regionName)
    const channelProvince = candidate.province || candidate.state || candidate.region || 
                           candidate.provinceName || candidate.stateName || candidate.regionName ||
                           channel.province || channel.state || channel.region || 
                           channel.provinceName || channel.stateName || channel.regionName || 'UNKNOWN';
    
    let channelContinent = candidate.continent || channel.continent;
    
    // If no continent data, try to determine from coordinates
    if (!channelContinent || channelContinent === 'UNKNOWN') {
      const location = candidate.location || channel.location;
      channelContinent = getContinentFromCoordinates(location) || 'UNKNOWN';
    }
    
    // Enhanced logging for debugging province assignment
    if (channelCountry !== 'UNKNOWN' && (channelProvince === 'UNKNOWN' || !channelProvince)) {
      console.warn(`⚠️ [PROVINCE MISSING] Country ${channelCountry} candidate ${candidate.name || candidate.id} has no province data`, {
        candidateFields: Object.keys(candidate),
        hasProvince: !!candidate.province,
        hasState: !!candidate.state,
        hasRegion: !!candidate.region
      });
    } else if (channelProvince !== 'UNKNOWN') {
      console.log(`✅ [PROVINCE ASSIGNED] ${candidate.name || candidate.id} → ${channelProvince}, ${channelCountry}`);
    }
    
    return { channelCountry, channelProvince, channelContinent };
  }, [getContinentFromCoordinates]);
  
  // Create stacked candidates for a cluster group (hierarchical clustering)
  const createClusterStack = useCallback((clusterGroup) => {
    if (!viewer || !clusterGroup.candidates || !Array.isArray(clusterGroup.candidates)) {
      console.log(`🌍 Skipping cluster ${clusterGroup.clusterName} - no valid candidates:`, {
        hasCandidates: !!clusterGroup.candidates,
        candidatesType: typeof clusterGroup.candidates,
        isArray: Array.isArray(clusterGroup.candidates)
      });
      return [];
    }

    const clusterName = clusterGroup.clusterName;
    const clusterId = clusterGroup.clusterId;
    const level = clusterGroup.level;
    const clusterColor = getRegionColor(clusterId, clusterName);
    
    // Use the calculated cluster centroid for stack positioning
    const [centerLng, centerLat] = clusterGroup.centroid;
    
    console.log(`🌍 Creating ${level} level cluster stack for ${clusterName} (${clusterId}) with ${clusterGroup.candidates.length} candidates at centroid [${centerLat.toFixed(3)}, ${centerLng.toFixed(3)}]`);
    
    // Calculate total votes for this cluster using getCandidateVotes()
    const totalVotes = clusterGroup.totalVotes || clusterGroup.candidates.reduce((sum, candidate) => {
      const channelId = candidate.sourceChannel?.id || candidate.channelId;
      return sum + getCandidateVotes(candidate, channelId);
    }, 0);
    
    // Find max votes across all candidates for proportional height scaling
    const allVotes = clusterGroup.candidates.map(candidate => {
      const channelId = candidate.sourceChannel?.id || candidate.channelId;
      return getCandidateVotes(candidate, channelId);
    });
    const maxVotes = Math.max(...allVotes);
    
    // 🔍 DEBUG: Log max votes calculation
    console.log(`📊 [MAX VOTES] Cluster ${clusterName}: maxVotes=${maxVotes}, allVotes=[${allVotes.join(', ')}]`);

    const stackEntities = [];
    
    // Dynamic cube sizing based on cluster level - smaller cubes for better stacking visualization
    let baseCubeSize, baseStackHeight, stackSpacing;
    switch (level) {
      case 'county':
        baseCubeSize = 20000; // 20km cubes - very small for county-level stacking
        baseStackHeight = 40000; // 40km per cube
        stackSpacing = baseStackHeight * 1.15; // 15% spacing
        break;
      case 'province':
        baseCubeSize = 30000; // 30km cubes - smaller for province-level stacking
        baseStackHeight = 50000; // 50km per cube
        stackSpacing = baseStackHeight * 1.2; // 20% spacing
        break;
      case 'country':
        baseCubeSize = 50000; // 50km cubes - medium for country-level stacking
        baseStackHeight = 80000; // 80km per cube
        stackSpacing = baseStackHeight * 1.3; // 30% spacing
        break;
      case 'continent':
        baseCubeSize = 80000; // 80km cubes - larger for continent-level stacking
        baseStackHeight = 120000; // 120km per cube
        stackSpacing = baseStackHeight * 1.4; // 40% spacing
        break;
      case 'global':
        baseCubeSize = 120000; // 120km cubes - largest for global stacking
        baseStackHeight = 150000; // 150km per cube
        stackSpacing = baseStackHeight * 1.5; // 50% spacing
        break;
      default:
        baseCubeSize = 40000; // 40km cubes
        baseStackHeight = 60000; // 60km per cube
        stackSpacing = baseStackHeight * 1.2; // 20% spacing
    }
    
    // Apply simple sizing with user multiplier
    const cubeSize = calculateCubeSize(baseCubeSize);

    // Create stacked cubes representing candidates in this cluster
    clusterGroup.candidates.forEach((candidate, index) => {
      // Generate unique ID to prevent conflicts
      const uniqueId = `cluster-stack-${level}-${clusterId}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get candidate's actual location for display purposes
      let candidateLat = centerLat, candidateLng = centerLng;
      if (candidate.location && candidate.location.lat && candidate.location.lng) {
        candidateLat = candidate.location.lat;
        candidateLng = candidate.location.lng;
      }

      // Calculate vote-based height for this candidate (surface to 500km max - same as GPS)
      const channelId = candidate.sourceChannel?.id || candidate.channelId;
      const candidateVotes = getCandidateVotes(candidate, channelId);
      const voteRatio = maxVotes > 0 ? (candidateVotes / maxVotes) : 0;
      const exponentialRatio = Math.pow(voteRatio, 0.7); // More dramatic height differences
      const height = 1000 + (exponentialRatio * (500000 - 1000)); // 1km to 500km height range
      
      // 🔍 DEBUG: Log height calculation
      console.log(`📏 [CUBE HEIGHT] ${candidate.name}: votes=${candidateVotes}, maxVotes=${maxVotes}, voteRatio=${voteRatio.toFixed(3)}, height=${(height/1000).toFixed(1)}km`);
      
      // Position cube from surface (0 height) to vote-based height - same as GPS
      const cubeCenterHeight = height / 2; // Center the cube at half its height
      const position = new window.Cesium.Cartesian3.fromDegrees(
        centerLng, // Use cluster centroid for proper hierarchical grouping
        centerLat,
        cubeCenterHeight
      );
      
      // 🎨 CONSISTENT VOTE-BASED COLORING: Use same gradient system as GPS level
      // Special handling for boundary channels - make them visually distinct
      const isBoundaryChannel = candidate.sourceChannel?.type === 'boundary' || 
                                candidate.sourceChannel?.subtype === 'boundary' ||
                                candidate.sourceChannel?.isBoundaryChannel;
      
      // Debug logging to see what we're getting
      console.log('🔍 Checking boundary channel:', {
        candidateName: candidate.name,
        sourceChannelType: candidate.sourceChannel?.type,
        sourceChannelSubtype: candidate.sourceChannel?.subtype,
        isBoundaryChannelFlag: candidate.sourceChannel?.isBoundaryChannel,
        isBoundaryChannel: isBoundaryChannel
      });
      
      let gradientMaterial, glowPower, heatmapLevel, heatmapColor;
      
      if (isBoundaryChannel) {
        // 🗺️ BOUNDARY CHANNEL: Purple with pulsing glow effect
        const boundaryColor = window.Cesium.Color.fromCssColorString('#8b5cf6'); // Purple
        const boundaryGlow = window.Cesium.Color.fromCssColorString('#a78bfa'); // Light purple
        
        // Create pulsing effect with sine wave
        gradientMaterial = new window.Cesium.ColorMaterialProperty(
          new window.Cesium.CallbackProperty(() => {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 2) * 0.3 + 0.7; // Oscillate between 0.4 and 1.0
            return window.Cesium.Color.fromCssColorString('#8b5cf6').withAlpha(pulse);
          }, false)
        );
        
        glowPower = 0.8; // High glow for visibility
        heatmapLevel = 'Boundary Modification';
        heatmapColor = '#8b5cf6';
        
        console.log('🗺️ Rendering BOUNDARY channel cube with purple pulsing effect:', candidate.name);
      } else {
        // Regular channel - standard gradient
        gradientMaterial = createGradientMaterial(candidateVotes, maxVotes);
        glowPower = calculateGlowPower(candidateVotes, maxVotes);
        heatmapLevel = voteRatio <= 0.2 ? 'Low' : voteRatio <= 0.4 ? 'Medium-Low' : voteRatio <= 0.6 ? 'Medium' : voteRatio <= 0.8 ? 'Medium-High' : 'High';
        heatmapColor = calculateHeatmapColor(candidateVotes, maxVotes, clusterColor);
      }
      
      // Create candidate cube entity with dynamic sizing controlled by meter slidebar
      const cubeEntity = viewer.entities.add({
        id: uniqueId,
        position: position,
        box: {
          dimensions: new window.Cesium.Cartesian3(cubeSize, cubeSize, height), // Dynamic cube size with meter slidebar control, full height from surface to vote height
          material: gradientMaterial, // 🎨 Consistent gradient material (dark base → vote-level top) OR purple pulsing for boundary
          outline: isBoundaryChannel || glowPower > 0.5, // 🌟 Always outline boundary channels, or high-vote candidates
          outlineColor: isBoundaryChannel 
            ? window.Cesium.Color.fromCssColorString('#a78bfa').withAlpha(0.9) // Bright purple outline for boundary
            : window.Cesium.Color.fromCssColorString('#87CEEB').withAlpha(0.6 + glowPower * 0.4), // 🌟 Vote-based glow outline
          outlineWidth: isBoundaryChannel ? 4 : (2 + Math.floor(glowPower * 3)) // 🌟 Thicker outline for boundary channels (4px) or vote-based (2-5px)
        },
        description: `
          <div style="padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #3b82f6;">${candidate.name || `Candidate ${index + 1}`}</h3>
            <p><strong>Cluster:</strong> ${clusterName} (${level.toUpperCase()})</p>
            <p><strong>Location:</strong> ${candidateLat.toFixed(4)}, ${candidateLng.toFixed(4)}</p>
            <p><strong>Cluster Centroid:</strong> ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}</p>
            <p><strong>Votes:</strong> ${candidateVotes.toLocaleString()} (${((candidateVotes/maxVotes)*100).toFixed(1)}% of max)</p>
            <p><strong>Tower Height:</strong> ${(height/1000).toFixed(0)}km (surface to 500km max)</p>
            <p><strong>Heatmap Level:</strong> ${heatmapLevel}</p>
            <p><strong>Cluster Level:</strong> ${level.toUpperCase()}</p>
          </div>
        `,
        properties: {
          // Core candidate data
          candidateData: candidate,
          channelData: candidate.sourceChannel,
          
          // Clustering attributes (built from creation)
          clusterGroup: clusterGroup,
          clusterName: clusterName,
          clusterId: clusterId,
          clusterLevel: level,
          stackIndex: index,
          baseDimensions: new window.Cesium.Cartesian3(cubeSize, cubeSize, height), // Store base dimensions for efficient cube size updates
          
          // Geographical data
          clusterCentroid: [centerLng, centerLat],
          candidateCoordinates: [candidateLng, candidateLat],
          centerCoordinates: [centerLng, centerLat],
          centroidType: clusterGroup.centroidType || 'candidate-based',
          
          // Vote-based metrics
          candidateVotes: candidateVotes,
          totalVotes: totalVotes,
          maxVotes: maxVotes,
          voteRatio: maxVotes > 0 ? candidateVotes / maxVotes : 0,
          
          // Height and positioning (updated for long rectangles)
          voteBasedHeight: height,
          cubeCenterHeight: cubeCenterHeight,
          heatmapColor: heatmapColor,
          heatmapLevel: heatmapLevel,
          
          // Multi-level clustering support
          gpsLevel: {
            lat: candidateLat,
            lng: candidateLng,
            votes: candidateVotes
          },
          provinceLevel: {
            id: candidate.province || candidate.state || 'UNKNOWN_PROVINCE',
            name: candidate.province || candidate.state || 'Unknown Province'
          },
          countryLevel: {
            id: candidate.country || candidate.countryCode || 'UNKNOWN_COUNTRY',
            name: candidate.countryName || candidate.country || 'Unknown Country'
          },
          continentLevel: {
            id: candidate.continent || candidate.region || 'UNKNOWN_CONTINENT',
            name: candidate.continent || candidate.region || 'Unknown Continent'
          },
          globalLevel: {
            id: 'GLOBAL',
            name: 'Global'
          },
          
          // Interaction properties
          isGlobal: true,
          isClickable: true,
          isHoverable: true,
          entityType: 'candidate',
          entityId: candidate.id || `candidate-${index}`,
          originalChannelId: candidate.sourceChannel?.id || 'unknown'
        }
      });
      
      // Store reference for cleanup
      entitiesRef.current.set(uniqueId, cubeEntity);
      stackEntities.push(cubeEntity);
      
      // Add click handler
      cubeEntity.clickHandler = () => {
        console.log(`🌍 ${level} level candidate clicked:`, candidate.name, 'in cluster', clusterName);
        if (onCandidateClick) {
          onCandidateClick(candidate, candidate.sourceChannel);
        }
      };
    });
    
    console.log(`🌍 ✅ Created ${stackEntities.length} long rectangle towers for ${level} level cluster: ${clusterName} (surface to 500km max, heatmap colors)`);
    return stackEntities;
  }, [viewer, hexToCesiumColor, getRegionColor, onCandidateClick, calculateCubeSize, calculateVoteBasedHeight]);

  // Group candidates by administrative region for proper regional stacking
  const groupCandidatesByRegion = useCallback((channels) => {
    console.log(`🌍 📊 groupCandidatesByRegion called with ${channels?.length || 0} channels`);
    channels?.forEach((channel, index) => {
      console.log(`🌍 📋 Channel ${index + 1}: "${channel.name}" with ${channel.candidates?.length || 0} candidates`);
    });
    
    const regionGroups = new Map();
    
    channels.forEach(channel => {
      if (!channel.candidates || !Array.isArray(channel.candidates)) {
        console.log(`🌍 ⚠️ Skipping channel "${channel.name}" - no valid candidates array`);
        return;
      }
      
      channel.candidates.forEach(candidate => {
        // Process candidate data
        
        // Extract region information from candidate assignment
        let regionId = candidate.region_assignment?.primary_region;
        let regionName = 'Unknown Region';
        let regionCentroid = null;
        
        // Get region details from the region assignment
        if (candidate.region_assignment && candidate.region_assignment.hierarchy) {
          // Use the most appropriate regional level for stacking (state/province level)
          const hierarchy = candidate.region_assignment.hierarchy;
          
          // Find state/province level region (typically the 3rd or 4th level)
          for (let i = hierarchy.length - 1; i >= 0; i--) {
            const regionIdCandidate = hierarchy[i];
            // Look for state/province patterns (USA-CA, USA-NY, CAN-ON, CHN-31, etc.)
            if (regionIdCandidate.includes('-') && regionIdCandidate.split('-').length >= 2) {
              regionId = regionIdCandidate;
              break;
            }
          }
          
          // If no state found, use the smallest region available
          if (!regionId || regionId === candidate.region_assignment.primary_region) {
            regionId = hierarchy[hierarchy.length - 1] || candidate.region_assignment.primary_region;
          }
        }
        
        // If no region_assignment, create region ID from location coordinates
        if (!regionId) {
          let candidateLocation = null;
          
          // Get coordinates from candidate location
          if (candidate.location && candidate.location.lat && candidate.location.lng) {
            candidateLocation = candidate.location;
          } else if (candidate.lat !== undefined && candidate.lng !== undefined) {
            candidateLocation = { lat: candidate.lat, lng: candidate.lng };
          }
          
          if (candidateLocation) {
            // Create region ID based on geographic coordinates (continent-level grouping)
            const lat = candidateLocation.lat;
            const lng = candidateLocation.lng;
            
            // Determine continent/region based on coordinates
            if (lat >= 60) regionId = 'ARCTIC';
            else if (lat >= 35 && lng >= -170 && lng <= -50) regionId = 'NORTH_AMERICA';
            else if (lat >= 35 && lng >= -10 && lng <= 40) regionId = 'EUROPE';
            else if (lat >= 35 && lng >= 40 && lng <= 180) regionId = 'ASIA';
            else if (lat >= -35 && lat <= 35 && lng >= -80 && lng <= -30) regionId = 'SOUTH_AMERICA';
            else if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 55) regionId = 'AFRICA';
            else if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) regionId = 'AUSTRALIA';
            else if (lat >= -50 && lat <= -10 && lng >= -180 && lng <= -110) regionId = 'AUSTRALIA';
            else regionId = 'OCEAN';
            
            // Candidate assigned to region based on coordinates
          } else {
            // Final fallback
            regionId = channel.region_id || channel.primary_region || 'UNKNOWN';
          }
        }
        
        // Create region name from ID
        regionName = regionId.replace(/-/g, ' ').replace(/([A-Z]+)/g, '$1 ').trim();
        
        // Use candidate location as the region point (we'll calculate centroid later)
        let candidateLocation = null;
        
        // Get coordinates from region_assignment where they're actually stored
        if (candidate.region_assignment && candidate.region_assignment.lat !== undefined) {
          candidateLocation = {
            lat: candidate.region_assignment.lat,
            lng: candidate.region_assignment.lng
          };
        } else if (candidate.location && candidate.location.lat && candidate.location.lng) {
          candidateLocation = candidate.location;
        } else if (candidate.lat !== undefined && candidate.lng !== undefined) {
          candidateLocation = {
            lat: candidate.lat,
            lng: candidate.lng
          };
        }
        
        if (candidateLocation && candidateLocation.lat && candidateLocation.lng) {
          regionCentroid = [candidateLocation.lng, candidateLocation.lat];
        }
        
        // Add to region group
        if (!regionGroups.has(regionId)) {
          regionGroups.set(regionId, {
            regionId: regionId,
            regionName: regionName,
            candidates: [],
            channels: new Set(),
            locations: []
          });
        }
        
        const regionGroup = regionGroups.get(regionId);
        regionGroup.candidates.push({
          ...candidate,
          sourceChannel: channel
        });
        regionGroup.channels.add(channel.id);
        
        if (regionCentroid) {
          regionGroup.locations.push(regionCentroid);
        }
      });
    });
    
    // Log region grouping results
    console.log(`🌍 📊 Created ${regionGroups.size} region groups:`, Array.from(regionGroups.keys()));
    
    // Calculate centroids for each region group
    regionGroups.forEach((group, regionId) => {
      if (group.locations.length > 0) {
        // Calculate centroid from all candidate locations in this region
        const totalLng = group.locations.reduce((sum, loc) => sum + loc[0], 0);
        const totalLat = group.locations.reduce((sum, loc) => sum + loc[1], 0);
        group.centroid = [
          totalLng / group.locations.length,
          totalLat / group.locations.length
        ];
      } else {
        // Fallback centroid
        group.centroid = [0, 0];
      }
      
      console.log(`🌍 Region Group: ${group.regionName} (${regionId}) - ${group.candidates.length} candidates at centroid [${group.centroid[1].toFixed(3)}, ${group.centroid[0].toFixed(3)}]`);
    });
    
    return regionGroups;
  }, []);
  // Generate candidate locations within 500km range for regional heatmap
  const generateRegionalCandidateLocations = useCallback((centerLat, centerLng, candidateCount, maxRadiusKm = 250) => {
    const locations = [];
    const earthRadiusKm = 6371;
    
    for (let i = 0; i < candidateCount; i++) {
      // Generate positions in a more distributed pattern for regional clustering
      const angle = (i / candidateCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.5; // Less random scatter
      const distance = Math.random() * maxRadiusKm; // Within the specified radius
      
      // Convert to lat/lng offset
      const latOffset = (distance / earthRadiusKm) * (180 / Math.PI);
      const lngOffset = (distance / earthRadiusKm) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
      
      const candidateLat = centerLat + latOffset * Math.cos(angle);
      const candidateLng = centerLng + lngOffset * Math.sin(angle);
      
      locations.push({
        lat: candidateLat,
        lng: candidateLng,
        distance: distance // Store distance for reference
      });
    }
    
    return locations;
  }, []);

  // Create stacked candidates for a region group with hybrid heatmap + vertical stacking
  const createRegionalStack = useCallback((regionGroup) => {
    if (!viewer || !regionGroup.candidates || !Array.isArray(regionGroup.candidates)) {
      console.log(`🌍 Skipping region ${regionGroup.regionName} - no valid candidates:`, {
        hasCandidates: !!regionGroup.candidates,
        candidatesType: typeof regionGroup.candidates,
        isArray: Array.isArray(regionGroup.candidates)
      });
      return [];
    }

    const regionName = regionGroup.regionName;
    const regionId = regionGroup.regionId;
    const regionColor = getRegionColor(regionId, regionName);
    
    // Use the calculated region centroid for stack positioning
    const [centerLng, centerLat] = regionGroup.centroid;
    
    console.log(`🌍 Creating hybrid heatmap+vertical stack for ${regionName} (${regionId}) with ${regionGroup.candidates.length} candidates at centroid [${centerLat.toFixed(3)}, ${centerLng.toFixed(3)}]`);
    
    // Group candidates by their source channel for proper stacking
    const channelGroups = new Map();
    regionGroup.candidates.forEach(candidate => {
      const channelId = candidate.sourceChannel?.id || candidate.channelId || 'unknown';
      if (!channelGroups.has(channelId)) {
        channelGroups.set(channelId, {
          channelId: channelId,
          channelName: candidate.sourceChannel?.name || 'Unknown Channel',
          candidates: []
        });
      }
      channelGroups.get(channelId).candidates.push(candidate);
    });

    console.log(`🌍 Grouped ${regionGroup.candidates.length} candidates into ${channelGroups.size} channels within ${regionName}`);

    const stackEntities = [];
    let globalStackIndex = 0;

    // Process each channel group separately
    channelGroups.forEach((channelGroup, channelId) => {
      const channelCandidates = channelGroup.candidates;
      const channelName = channelGroup.channelName;
      
      console.log(`🌍 Processing channel "${channelName}" with ${channelCandidates.length} candidates`);

      // Sort candidates by vote count (highest first) for vote-based height positioning
      const sortedCandidates = [...channelCandidates].map(candidate => ({
        ...candidate,
        voteCount: getCandidateVotes(candidate, channelId)
      })).sort((a, b) => b.voteCount - a.voteCount);
      
      // Calculate max votes for heatmap and height scaling
      const maxVotes = Math.max(...sortedCandidates.map(c => c.voteCount));
      
      // Generate candidate locations within a 250km radius for regional distribution
      const candidateLocations = generateRegionalCandidateLocations(centerLat, centerLng, sortedCandidates.length, 250);

      sortedCandidates.forEach((candidate, candidateIndex) => {
        const candidateVotes = candidate.voteCount;
        const location = candidateLocations[candidateIndex];
        
        if (!location) {
          console.warn(`⚠️ No generated location for candidate ${candidate.name || candidate.id}`);
          return;
        }

        // Calculate vote-based height with exponential scaling (surface to 500km max)
        let minHeight, maxHeight, baseCubeSize;
        switch (currentClusterLevel) {
          case 'county':
            minHeight = 1000; maxHeight = 500000; baseCubeSize = 20000; // 1km-500km range, 20km cubes
            break;
          case 'province':
            minHeight = 1000; maxHeight = 500000; baseCubeSize = 30000; // 1km-500km range, 30km cubes
            break;
          case 'country':
            minHeight = 1000; maxHeight = 500000; baseCubeSize = 50000; // 1km-500km range, 50km cubes
            break;
          case 'continent':
            minHeight = 1000; maxHeight = 500000; baseCubeSize = 80000; // 1km-500km range, 80km cubes
            break;
          case 'global':
            minHeight = 1000; maxHeight = 500000; baseCubeSize = 120000; // 1km-500km range, 120km cubes
            break;
          default:
            minHeight = 1000; maxHeight = 500000; baseCubeSize = 40000; // Default 1km-500km range
        }

        const voteRatio = maxVotes > 0 ? (candidateVotes / maxVotes) : 0;
        const exponentialRatio = Math.pow(voteRatio, 0.7); // More dramatic height differences
        const height = minHeight + (exponentialRatio * (maxHeight - minHeight));
        
        // Apply simple cube sizing with user multiplier
        const dynamicCubeSize = calculateCubeSize(baseCubeSize);
        
        // Position cube from surface (0 height) to vote-based height
        const cubeCenterHeight = height / 2; // Center the cube at half its height
        const position = window.Cesium.Cartesian3.fromDegrees(location.lng, location.lat, cubeCenterHeight);
        
        // Generate unique ID to prevent conflicts
        const uniqueId = `hybrid-stack-${regionId}-${channelId}-${candidateIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const heatmapColor = calculateHeatmapColor(candidateVotes, maxVotes, regionColor);
        const heatmapLevel = voteRatio <= 0.2 ? 'Low' : voteRatio <= 0.4 ? 'Medium-Low' : voteRatio <= 0.6 ? 'Medium' : voteRatio <= 0.8 ? 'Medium-High' : 'High';

        // Create hybrid heatmap-style long cube entity with dynamic sizing
        const cubeEntity = viewer.entities.add({
          id: uniqueId,
          position: position,
          box: {
            dimensions: new window.Cesium.Cartesian3(dynamicCubeSize, dynamicCubeSize, height), // Dynamic cube size with meter slidebar control, full height from surface to vote height
            material: hexToCesiumColor(heatmapColor, 0.8),
            outline: true,
            outlineColor: hexToCesiumColor('#2C3E50', 1.0), // Dark blue-gray for clean borders
            outlineWidth: 3
          },
          description: `
            <div style="padding: 10px; max-width: 300px;">
              <h3 style="margin: 0 0 10px 0; color: #3b82f6;">${candidate.name || `Candidate ${candidateIndex + 1}`}</h3>
              <p><strong>Channel:</strong> ${channelName}</p>
              <p><strong>Region:</strong> ${regionName} (${regionId})</p>
              <p><strong>Location:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
              <p><strong>Region Centroid:</strong> ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}</p>
              <p><strong>Votes:</strong> ${candidateVotes}</p>
              <p><strong>Height:</strong> ${(height/1000).toFixed(0)}km (surface to 500km max)</p>
              <p><strong>Heatmap Level:</strong> ${heatmapLevel}</p>
              <p><strong>Cluster Level:</strong> ${currentClusterLevel.toUpperCase()}</p>
              <p><strong>Distance from Center:</strong> ${location.distance.toFixed(1)}km</p>
            </div>
          `,
          properties: {
            candidateData: candidate,
            channelData: candidate.sourceChannel || { id: channelId, name: channelName },
            regionGroup: regionGroup,
            regionName: regionName,
            regionId: regionId,
            channelId: channelId,
            channelName: channelName,
            stackIndex: candidateIndex,
            globalStackIndex: globalStackIndex++,
            voteRank: candidateIndex + 1, // Rank by vote count (1 = highest votes)
            baseDimensions: new window.Cesium.Cartesian3(dynamicCubeSize, dynamicCubeSize, height), // Store base dimensions for efficient cube size updates
            voteBasedHeight: height,
            isGlobal: true,
            regionCentroid: [centerLng, centerLat],
            candidateCoordinates: [location.lng, location.lat],
            centerCoordinates: [centerLng, centerLat],
            heatmapColor: heatmapColor,
            heatmapLevel: heatmapLevel,
            distanceFromCenterKm: location.distance,
            stackContext: {
              stackId: `${regionName}-${channelName}-stack`,
              totalStackCandidates: channelCandidates.length,
              totalStackVotes: channelCandidates.reduce((sum, c) => sum + (c.votes || 0), 0),
              candidateVotes: candidateVotes,
              voteRank: candidateIndex + 1,
              heightMethod: 'hybrid-heatmap-vertical',
              stackPosition: candidateIndex + 1,
              channelGroup: channelGroup,
              clusteringMethod: 'hybrid-heatmap-stacking'
            },
            // Add properties for hover and click functionality
            isClickable: true,
            isHoverable: true,
            entityType: 'candidate',
            entityId: candidate.id || `candidate-${candidateIndex}`,
            originalChannelId: candidate.sourceChannel?.id || 'unknown'
          }
        });

        stackEntities.push(cubeEntity);
        console.log(`🌍 ✅ Created long rectangle tower for ${candidate.name} in channel "${channelName}" at [${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}] - ${candidateVotes} votes, ${(height/1000).toFixed(0)}km height (surface to 500km max), ${heatmapLevel} heatmap (${heatmapColor}), ${location.distance.toFixed(1)}km from center`);
      });
    });

    return stackEntities;
  }, [viewer, hexToCesiumColor, currentClusterLevel, calculateHeatmapColor, generateRegionalCandidateLocations, getRegionColor]);

    // Render individual candidates at their persistent GPS locations from backend
  const renderIndividualCandidates = useCallback(() => {
    console.log('🌍 📍 RENDERING INDIVIDUAL CANDIDATES CALLED!');
    if (!viewer || !channels || channels.length === 0) {
      console.log('🌍 ❌ No channels available for individual rendering:', {
        hasViewer: !!viewer,
        channelsLength: channels?.length,
        channelsType: typeof channels
      });
      return;
    }

    console.log('🌍 📍 Starting individual GPS rendering for all candidates using backend persistent locations');
    console.log(`🌍 📍 Processing ${channels.length} channels with total candidates:`, 
      channels.reduce((sum, ch) => sum + (ch.candidates?.length || 0), 0));
    
    // Don't force clear - entities are managed selectively by the main rendering effect
    // Clearing here causes flicker when clicking candidates
    
    // Calculate maximum votes across all candidates for proportional height scaling
    let maxVotes = 0;
    const allCandidates = [];
    channels.forEach(channel => {
      if (channel.candidates) {
        channel.candidates.forEach(candidate => {
          const votes = getCandidateVotes(candidate, channel.id);
          maxVotes = Math.max(maxVotes, votes);
          allCandidates.push({ candidate, channel });
        });
      }
    });
    
    console.log(`🌍 📍 GPS Tower Heights: Max votes = ${maxVotes}, Total candidates = ${allCandidates.length}`);
    
    let totalCandidates = 0;
    const newEntities = [];

    channels.forEach((channel, channelIndex) => {
      const regionName = channel.name || 'Unknown Region';
      const regionColor = getRegionColor(channel.region_id || channel.primary_region, regionName);
      
      // Skip rendering boundary channels as GPS towers (they're rendered as region polygons)
      if (channel.type === 'boundary' || channel.subtype === 'boundary') {
        console.log(`🗺️ Skipping GPS render for boundary channel: ${regionName} (rendered as region polygon)`);
        return;
      }
      
      console.log(`🌍 📍 Processing channel ${channelIndex + 1}/${channels.length}: ${regionName} with ${channel.candidates?.length || 0} candidates`);

      if (!channel.candidates || channel.candidates.length === 0) {
        console.warn(`🌍 ⚠️ Channel ${regionName} has no candidates, skipping`);
        return;
      }

      channel.candidates.forEach((candidate, index) => {
        // Use the candidate's existing GPS coordinates from backend (persistent locations)
        let candidateLat, candidateLng;
        
        // Extract GPS coordinates from candidate data (backend provides these)
        if (candidate.location && candidate.location.latitude && candidate.location.longitude) {
          candidateLat = candidate.location.latitude;
          candidateLng = candidate.location.longitude;
        } else if (candidate.location && candidate.location.lat && candidate.location.lng) {
          candidateLat = candidate.location.lat;
          candidateLng = candidate.location.lng;
        } else if (candidate.lat && candidate.lng) {
          candidateLat = candidate.lat;
          candidateLng = candidate.lng;
        } else if (candidate.latitude && candidate.longitude) {
          candidateLat = candidate.latitude;
          candidateLng = candidate.longitude;
        } else {
          // Fallback: use channel center if candidate has no specific location
          if (channel.location && channel.location.latitude && channel.location.longitude) {
            candidateLat = channel.location.latitude;
            candidateLng = channel.location.longitude;
          } else if (channel.lat && channel.lng) {
            candidateLat = channel.lat;
            candidateLng = channel.lng;
          } else {
            console.warn(`🌍 No GPS coordinates found for candidate ${candidate.name} in ${regionName}, skipping`);
            return; // Skip this candidate if no coordinates available
          }
        }
        
        // Debug coordinates and check for overlaps
        console.log(`🌍 GPS: ${candidate.name}: [${candidateLat.toFixed(4)}, ${candidateLng.toFixed(4)}]`);
        
        // Track coordinate density to detect overlapping cubes
        const coordKey = `${Math.floor(candidateLat * 100)},${Math.floor(candidateLng * 100)}`;
        if (!window._coordDensity) window._coordDensity = new Map();
        const density = (window._coordDensity.get(coordKey) || 0) + 1;
        window._coordDensity.set(coordKey, density);
        if (density > 1) {
          console.warn(`⚠️ CUBE OVERLAP: ${density} cubes near [${candidateLat.toFixed(2)}, ${candidateLng.toFixed(2)}] - cubes may be stacked/overlapping`);
        }
        
        // Calculate vote-based height for this candidate (surface to 500km max)
        const candidateVotes = getCandidateVotes(candidate, channel.id);
        const safeVoteCount = Math.max(0, candidateVotes);
        const safeMaxVotes = Math.max(1, maxVotes);
        const voteRatio = Math.min(1, Math.max(0, safeVoteCount / safeMaxVotes));
        const exponentialRatio = Math.pow(voteRatio, 0.7); // More dramatic height differences
        const safeExponentialRatio = isNaN(exponentialRatio) ? 0 : Math.max(0, Math.min(1, exponentialRatio));
        const towerHeight = 1000 + (safeExponentialRatio * (500000 - 1000)); // 1km to 500km height range
        
        // Position tower from surface (0 height) to vote-based height
        const towerCenterHeight = towerHeight / 2; // Center the tower at half its height
        const candidatePosition = window.Cesium.Cartesian3.fromDegrees(candidateLng, candidateLat, towerCenterHeight);
        
        // Calculate consistent cube size for GPS level
        const baseCubeSize = 50000; // 50km base cubes - balanced for visibility and separation with regional spread
        const dynamicCubeSize = calculateCubeSize(baseCubeSize);
        console.log(`🌍 CUBE SIZE: ${candidate.name} - Base: ${(baseCubeSize/1000).toFixed(0)}km, Final: ${(dynamicCubeSize/1000).toFixed(0)}km`);
        console.log(`🌍 CUBE POS: [${candidateLat.toFixed(4)}, ${candidateLng.toFixed(4)}] Height: ${(towerHeight/1000).toFixed(0)}km`);
        
        // Calculate gradient material and glow for this candidate
        const gradientMaterial = createGradientMaterial(candidateVotes, maxVotes);
        const glowPower = calculateGlowPower(candidateVotes, maxVotes);
        
        const entityId = `individual-candidate-${channel.id}-${candidate.id}-${index}`;
        
        // Check if entity already exists and update it instead of recreating
        // NOTE: After removeAll(), getById() should return undefined, so this optimization
        // only applies when staying on GPS level and updating existing entities
        const existingEntity = viewer.entities.getById(entityId);
        if (existingEntity && currentClusterLevel === 'gps') {
          // Update existing entity properties for better performance (only on GPS level)
          existingEntity.position = candidatePosition;
          existingEntity.box.dimensions = new window.Cesium.Cartesian3(
            dynamicCubeSize, 
            dynamicCubeSize, 
            towerHeight
          );
          existingEntity.box.material = gradientMaterial;
          existingEntity.box.outline = glowPower > 0.5;
          existingEntity.box.outlineColor = window.Cesium.Color.fromCssColorString('#87CEEB').withAlpha(0.6 + glowPower * 0.4);
          existingEntity.box.outlineWidth = 2 + Math.floor(glowPower * 3);
          // Store reference and continue to next candidate
          const entityKey = `individual-${channel.id}-${candidate.id}-${index}`;
          entitiesRef.current.set(entityKey, existingEntity);
          newEntities.push(existingEntity);
          // Skip to cap entity update
          const capEntityId = `cap-${channel.id}-${candidate.id}-${index}`;
          const existingCapEntity = viewer.entities.getById(capEntityId);
          if (existingCapEntity) {
            // Update cap entity
            const capHeight = 1000;
            const capPosition = window.Cesium.Cartesian3.fromDegrees(candidateLng, candidateLat, towerHeight + (capHeight / 2));
            existingCapEntity.position = capPosition;
            const safeCapVoteCount = Math.max(0, candidateVotes || 0);
            const safeCapMaxVotes = Math.max(1, maxVotes || 1);
            const capVoteRatio = Math.min(1, Math.max(0, safeCapVoteCount / safeCapMaxVotes));
            const capExponentialRatio = Math.pow(capVoteRatio, 0.7);
            const safeCapExponentialRatio = isNaN(capExponentialRatio) ? 0 : Math.max(0, Math.min(1, capExponentialRatio));
            const capDarkBlue = { r: 0, g: 51, b: 102 };
            const capLightBlue = { r: 135, g: 206, b: 235 };
            const capTopR = Math.floor(capDarkBlue.r + (capLightBlue.r - capDarkBlue.r) * safeCapExponentialRatio);
            const capTopG = Math.floor(capDarkBlue.g + (capLightBlue.g - capDarkBlue.g) * safeCapExponentialRatio);
            const capTopB = Math.floor(capDarkBlue.b + (capLightBlue.b - capDarkBlue.b) * safeCapExponentialRatio);
            const safeCapTopR = isNaN(capTopR) ? capDarkBlue.r : Math.max(0, Math.min(255, capTopR));
            const safeCapTopG = isNaN(capTopG) ? capDarkBlue.g : Math.max(0, Math.min(255, capTopG));
            const safeCapTopB = isNaN(capTopB) ? capDarkBlue.b : Math.max(0, Math.min(255, capTopB));
            const solidTopColor = window.Cesium.Color.fromBytes(safeCapTopR, safeCapTopG, safeCapTopB, 255);
            existingCapEntity.box.material = solidTopColor;
          }
          return; // Skip entity creation since we updated existing one
        }
        
        const candidateEntity = viewer.entities.add({
          id: entityId,
          position: candidatePosition,
          box: {
            dimensions: new window.Cesium.Cartesian3(
              dynamicCubeSize, 
              dynamicCubeSize, 
              towerHeight // Vote-based height from surface to 500km max
            ), // Dynamic cube size with meter slidebar control, vote-based height
            material: gradientMaterial, // Vertical gradient (dark base → vote-level top)
            outline: glowPower > 0.5, // Only outline high-vote candidates
            outlineColor: window.Cesium.Color.fromCssColorString('#87CEEB').withAlpha(0.6 + glowPower * 0.4), // Glow outline
            outlineWidth: 2 + Math.floor(glowPower * 3) // Wider outline for high vote candidates (2-5px)
          },
          // No label - information will be shown in hover tooltips
          description: `
            <div style="padding: 10px; max-width: 300px;">
              <h3 style="margin: 0 0 10px 0; color: #3b82f6;">${candidate.name || `Candidate ${index + 1}`}</h3>
              <p><strong>Region:</strong> ${regionName}</p>
              <p><strong>GPS Location:</strong> ${candidateLat.toFixed(4)}, ${candidateLng.toFixed(4)}</p>
              <p><strong>Votes:</strong> ${candidateVotes.toLocaleString()} (${((candidateVotes/maxVotes)*100).toFixed(1)}% of max)</p>
              <p><strong>Tower Height:</strong> ${(towerHeight/1000).toFixed(0)}km (surface to 500km max)</p>
              <p><strong>Heatmap Level:</strong> ${candidateVotes/maxVotes <= 0.2 ? '🔵 Low' : candidateVotes/maxVotes <= 0.4 ? '🟢 Medium-Low' : candidateVotes/maxVotes <= 0.6 ? '🟡 Medium' : candidateVotes/maxVotes <= 0.8 ? '🟠 Medium-High' : '🔴 High'}</p>
              <p><strong>Cluster Level:</strong> GPS (Individual Tower)</p>
            </div>
          `,
          properties: {
            candidateData: candidate,
            channelData: channel,
            regionName: regionName,
            centerCoordinates: [candidateLng, candidateLat], // Add centerCoordinates for click handler
            isGlobal: true,
            isIndividual: true,
            isClickable: true,
            isHoverable: true,
            entityType: 'candidate',
            entityId: candidate.id || `candidate-${index}`,
            baseDimensions: new window.Cesium.Cartesian3(dynamicCubeSize, dynamicCubeSize, towerHeight), // Store base dimensions for efficient cube size updates
            channelId: channel.id || 'unknown',
            gpsCoordinates: [candidateLng, candidateLat]
          }
        });

        // Store reference for cleanup
        const entityKey = `individual-${channel.id}-${candidate.id}-${index}`;
        entitiesRef.current.set(entityKey, candidateEntity);
        newEntities.push(candidateEntity);
        
        // Add a thin solid-color cap on top of the tower to show the final gradient color
        const capHeight = 1000; // 1km thin cap
        const capPosition = window.Cesium.Cartesian3.fromDegrees(candidateLng, candidateLat, towerHeight + (capHeight / 2));
        
        // Calculate solid top color based on vote ratio - with safety checks
        const safeCapVoteCount = Math.max(0, candidateVotes || 0);
        const safeCapMaxVotes = Math.max(1, maxVotes || 1);
        const capVoteRatio = Math.min(1, Math.max(0, safeCapVoteCount / safeCapMaxVotes));
        const capExponentialRatio = Math.pow(capVoteRatio, 0.7);
        const safeCapExponentialRatio = isNaN(capExponentialRatio) ? 0 : Math.max(0, Math.min(1, capExponentialRatio));
        
        const capDarkBlue = { r: 0, g: 51, b: 102 };
        const capLightBlue = { r: 135, g: 206, b: 235 };
        const capTopR = Math.floor(capDarkBlue.r + (capLightBlue.r - capDarkBlue.r) * safeCapExponentialRatio);
        const capTopG = Math.floor(capDarkBlue.g + (capLightBlue.g - capDarkBlue.g) * safeCapExponentialRatio);
        const capTopB = Math.floor(capDarkBlue.b + (capLightBlue.b - capDarkBlue.b) * safeCapExponentialRatio);
        
        // Ensure color values are valid
        const safeCapTopR = isNaN(capTopR) ? capDarkBlue.r : Math.max(0, Math.min(255, capTopR));
        const safeCapTopG = isNaN(capTopG) ? capDarkBlue.g : Math.max(0, Math.min(255, capTopG));
        const safeCapTopB = isNaN(capTopB) ? capDarkBlue.b : Math.max(0, Math.min(255, capTopB));
        
        const solidTopColor = window.Cesium.Color.fromBytes(safeCapTopR, safeCapTopG, safeCapTopB, 255);
        
        const capEntityId = `cap-${channel.id}-${candidate.id}-${index}`;
        
        // Check if cap entity already exists and update it instead of recreating
        const existingCapEntity = viewer.entities.getById(capEntityId);
        if (existingCapEntity) {
          // Update existing cap entity for better performance
          existingCapEntity.position = capPosition;
          existingCapEntity.box.dimensions = new window.Cesium.Cartesian3(
            dynamicCubeSize,
            dynamicCubeSize,
            capHeight
          );
          existingCapEntity.box.material = solidTopColor;
          return; // Skip cap entity creation since we updated existing one
        }
        
        const capEntity = viewer.entities.add({
          id: capEntityId,
          position: capPosition,
          box: {
            dimensions: new window.Cesium.Cartesian3(
              dynamicCubeSize,
              dynamicCubeSize,
              capHeight
            ),
            material: solidTopColor, // Solid vote-level color
            outline: glowPower > 0.5,
            outlineColor: window.Cesium.Color.fromCssColorString('#87CEEB').withAlpha(0.8 + glowPower * 0.2),
            outlineWidth: glowPower > 0.5 ? 3 + Math.floor(glowPower * 2) : 0
          },
          properties: {
            candidateData: candidate,
            channelData: channel,
            isClickable: true,
            entityType: 'candidate-cap',
            baseDimensions: new window.Cesium.Cartesian3(dynamicCubeSize, dynamicCubeSize, capHeight)
          }
        });
        
        const capKey = `cap-${channel.id}-${candidate.id}-${index}`;
        entitiesRef.current.set(capKey, capEntity);
        newEntities.push(capEntity);
        
        // Add click handler to cap (same as tower)
        capEntity.clickHandler = () => {
          console.log('🌍 Individual candidate cap clicked:', candidate.name, 'at GPS:', candidateLat, candidateLng);
          if (onCandidateClick) {
            onCandidateClick(candidate, channel);
          }
        };

        // Add click handler to main tower
        candidateEntity.clickHandler = () => {
          console.log('🌍 Individual candidate clicked:', candidate.name, 'at GPS:', candidateLat, candidateLng);
          if (onCandidateClick) {
            onCandidateClick(candidate, channel);
          }
        };

        // Add hover effects
        candidateEntity.mouseEnterHandler = () => {
          console.log('🌍 Hovering over individual candidate:', candidate.name);
          if (candidateEntity.box) {
            candidateEntity.box.outlineColor = window.Cesium.Color.YELLOW;
            candidateEntity.box.outlineWidth = 5;
          }
        };

        candidateEntity.mouseLeaveHandler = () => {
          if (candidateEntity.box) {
            candidateEntity.box.outlineColor = hexToCesiumColor('#2C3E50', 1.0);
            candidateEntity.box.outlineWidth = 3;
          }
        };

        totalCandidates++;
        // Detailed logs removed to reduce console noise
        // const heatmapColor = calculateHeatmapColor(candidateVotes, maxVotes, regionColor);
        // const heatmapLevel = candidateVotes/maxVotes <= 0.2 ? 'Low' : candidateVotes/maxVotes <= 0.4 ? 'Medium-Low' : candidateVotes/maxVotes <= 0.6 ? 'Medium' : candidateVotes/maxVotes <= 0.8 ? 'Medium-High' : 'High';
        // console.log(`🌍 📍 ✅ Created long rectangle tower for ${candidate.name} at [${candidateLat.toFixed(4)}, ${candidateLng.toFixed(4)}] - ${candidateVotes} votes, ${(towerHeight/1000).toFixed(0)}km height (surface to 500km max), ${heatmapLevel} heatmap (${heatmapColor})`);
      });
    });

    setEntities(newEntities);
    console.log(`🌍 📍 ✅ RENDER COMPLETE: Created ${newEntities.length} entities for ${totalCandidates} individual candidates`);
    console.log(`🌍 📍 ✅ Total entities in viewer: ${viewer.entities.values.length}`);
    console.log(`🌍 📍 ✅ Sample entity IDs:`, newEntities.slice(0, 3).map(e => e.id));
    
    // Report coordinate density for overlap analysis
    if (window._coordDensity) {
      const maxDensity = Math.max(...Array.from(window._coordDensity.values()));
      const uniqueLocations = window._coordDensity.size;
      console.log(`🌍 📊 COORDINATE ANALYSIS: ${totalCandidates} candidates across ${uniqueLocations} unique grid locations (max ${maxDensity} per location)`);
      if (maxDensity > 3) {
        console.warn(`⚠️ HIGH DENSITY WARNING: Up to ${maxDensity} candidates sharing same 0.01° grid square - cubes WILL overlap visually!`);
        console.warn(`💡 SOLUTION: Either spread coordinates more (>0.1° apart) OR zoom in closer to see stacked cubes`);
      }
      window._coordDensity.clear();
    }
    
    // Dispatch visual entity count update event
    const entityCountEvent = new CustomEvent('visualEntityCountUpdated', {
      detail: {
        visualEntities: newEntities.length,
        totalCandidates: totalCandidates,
        viewerEntities: viewer.entities.values.length
      }
    });
    window.dispatchEvent(entityCountEvent);
    
    // DISABLED: Auto-loading voters for all candidates is too slow (5-11 seconds per candidate!)
    // Voters will now only load on-demand when hovering over a specific candidate
    // console.log('🗳️ [AUTO-LOAD] Loading voters for all candidates...');
    // channels.forEach(channel => {
    //   if (channel.candidates) {
    //     channel.candidates.forEach(candidate => {
    //       loadVotersForCandidate(candidate, channel, currentClusterLevel);
    //     });
    //   }
    // });
  }, [channels, viewer, hexToCesiumColor, getRegionColor, generateCandidateLocations, calculateCubeSize, onCandidateClick, loadVotersForCandidate, currentClusterLevel]);

  // Process backend channels to create proper channel-based candidate cubes stacks
  const processBackendClusters = useCallback((channels) => {
    console.log('🔗 processBackendClusters called with:', channels);
    if (!channels || !Array.isArray(channels)) {
      console.log('🔗 processBackendClusters: No valid channels array');
      return [];
    }
    
    // Create one cluster per channel (so candidates stack by channel)
    const clusters = [];
    
    channels.forEach((channel, index) => {
      if (!channel.candidates || !Array.isArray(channel.candidates) || channel.candidates.length === 0) {
        return; // Skip channels without candidates
      }

      // Calculate center position for this channel based on its candidates
      let totalLat = 0, totalLng = 0, validCandidates = 0;
      
      channel.candidates.forEach(candidate => {
        if (candidate.location && candidate.location.lat && candidate.location.lng) {
          totalLat += candidate.location.lat;
          totalLng += candidate.location.lng;
          validCandidates++;
        }
      });

      if (validCandidates === 0) return; // Skip if no valid candidate locations

      const avgLat = totalLat / validCandidates;
      const avgLng = totalLng / validCandidates;
      
      console.log(`🔗 Creating channel stack: ${channel.name} with ${validCandidates} candidates at ${avgLat.toFixed(3)}, ${avgLng.toFixed(3)}`);
      
      const cluster = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [avgLng, avgLat] // Use average position of candidates in channel
        },
        properties: {
          cluster: true,
          cluster_id: `channel-${channel.id}-${index}`,
          point_count: validCandidates,
          topic: channel.topic || channel.name,
          candidates: channel.candidates.filter(c => c.location && c.location.lat && c.location.lng),
          channelData: channel, // Store full channel data for interactions
          lodLevel: 'CHANNEL',
          clustered: true,
          clusterType: 'channel', // Identify this as a channel cluster
          style: {
            color: TOPIC_COLORS[channel.topic || channel.name] || TOPIC_COLORS.default,
            strokeColor: '#000000',
            size: Math.max(12, Math.min(validCandidates * 1.5, 24)),
            label: `${channel.name} (${validCandidates})`
          }
        }
      };
      
      clusters.push(cluster);
    });

    console.log(`🔗 Created ${clusters.length} channel clusters from ${channels.length} channels`);
    
    // Dispatch visual cluster count update event
    const clusterCountEvent = new CustomEvent('visualClusterCountUpdated', {
      detail: {
        totalChannels: channels.length,
        visualClusters: clusters.length,
        clusterLevel: 'CHANNEL'
      }
    });
    window.dispatchEvent(clusterCountEvent);
    
    return clusters;
  }, []);

  // Process clusters from backend data using useMemo for performance
  // 🎯 EXCLUSIVE RENDERING: Only process channel clusters when NOT using main rendering system
  const channelClusters = useMemo(() => {
    // Disable this legacy channel clustering system - it conflicts with main rendering
    // The main rendering effect handles all clustering now for consistency
    return [];
    
    // Legacy code preserved for reference:
    // if (!channels || channels.length === 0) {
    //   return [];
    // }
    // const result = processBackendClusters(channels);
    // return result;
  }, [channels]);

  // Create cube entities from channel clusters
  const createChannelClusterEntities = useCallback(() => {
    if (!viewer || !channelClusters || channelClusters.length === 0) {
      console.log('🔗 No viewer or channel clusters to render');
      return [];
    }

    const newEntities = [];
    
    channelClusters.forEach((cluster, clusterIndex) => {
      const { geometry, properties } = cluster;
      const [lng, lat] = geometry.coordinates;
      const { candidates, channelData, topic, point_count } = properties;
      
      // Calculate height for stack visualization
      const baseHeight = 20000; // 20km base height
      const heightIncrement = 5000; // 5km per candidate
      
      console.log(`🔗 Creating stacked cubes for channel: ${channelData.name} with ${candidates.length} candidates`);
      
      // Create stacked cubes for each candidate in the channel
      candidates.forEach((candidate, candidateIndex) => {
        const stackHeight = baseHeight + (candidateIndex * heightIncrement);
        const position = window.Cesium.Cartesian3.fromDegreesAltitude(lng, lat, stackHeight);
        
        // Get topic color
        const topicColor = TOPIC_COLORS[topic] || TOPIC_COLORS[channelData.name] || TOPIC_COLORS.default;
        const cesiumColor = hexToCesiumColor(topicColor, 0.8);
        
        // Create candidate cube entity
        const cubeEntity = viewer.entities.add({
          id: `channel-cluster-${clusterIndex}-candidate-${candidateIndex}`,
          position: position,
          box: {
            dimensions: new window.Cesium.Cartesian3(
              calculateCubeSize(8000), 
              calculateCubeSize(8000), 
              calculateCubeSize(8000)
            ), // 8km x 8km x 8km base cube - all dimensions equal for proper cubes
            material: cesiumColor,
            outline: true,
            outlineColor: window.Cesium.Color.WHITE,
            outlineWidth: 2
          },
          label: {
            text: `${candidate.user?.displayName || candidate.name}\n${channelData.name}`,
            font: '12pt monospace',
            style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new window.Cesium.Cartesian2(0, -10),
            fillColor: window.Cesium.Color.WHITE,
            outlineColor: window.Cesium.Color.BLACK,
            showBackground: true,
            backgroundColor: window.Cesium.Color.BLACK.withAlpha(0.7)
          },
          properties: {
            candidateData: candidate,
            channelData: channelData,
            clusterData: cluster,
            isChannelCluster: true,
            regionName: channelData.name,
            isIndividual: false,
            baseDimensions: new window.Cesium.Cartesian3(
              calculateCubeSize(8000), 
              calculateCubeSize(8000), 
              height
            ) // Store base dimensions for cube size updates
          }
        });
        
        newEntities.push(cubeEntity);
        entitiesRef.current.set(cubeEntity.id, cubeEntity);
      });
      
      // Create channel summary label at the top of the stack
      const summaryHeight = baseHeight + (candidates.length * heightIncrement) + 10000;
      const summaryPosition = window.Cesium.Cartesian3.fromDegreesAltitude(lng, lat, summaryHeight);
      
      const summaryEntity = viewer.entities.add({
        id: `channel-summary-${clusterIndex}`,
        position: summaryPosition,
        label: {
          text: `📚 ${channelData.name}\n${candidates.length} candidates`,
          font: '14pt monospace',
          style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: window.Cesium.VerticalOrigin.CENTER,
          fillColor: window.Cesium.Color.YELLOW,
          outlineColor: window.Cesium.Color.BLACK,
          showBackground: true,
          backgroundColor: window.Cesium.Color.BLACK.withAlpha(0.8),
          backgroundPadding: new window.Cesium.Cartesian2(8, 4)
        },
        properties: {
          channelData: channelData,
          clusterData: cluster,
          isChannelSummary: true,
          regionName: channelData.name,
          candidateCount: candidates.length
        }
      });
      
      newEntities.push(summaryEntity);
      entitiesRef.current.set(summaryEntity.id, summaryEntity);
    });
    
    console.log(`🔗 Created ${newEntities.length} entities from ${channelClusters.length} channel clusters`);
    return newEntities;
  }, [viewer, channelClusters, hexToCesiumColor, calculateCubeSize]);

  // Separate effect for cluster level changes - only affects visualization, not data
  useEffect(() => {
    if (!viewer || !channels || channels.length === 0) {
      return;
    }
    
    console.log(`🎯 [CLUSTER CHANGE] Cluster level changed to: ${clusterLevel}`);
    console.log(`🎯 [CLUSTER CHANGE] Current level: ${currentClusterLevel}, Target level: ${clusterLevel}`);
    
    // Update the current cluster level if it's different
    if (currentClusterLevel !== clusterLevel) {
      console.log(`🎯 [CLUSTER CHANGE] Updating currentClusterLevel from ${currentClusterLevel} to ${clusterLevel}`);
      setCurrentClusterLevel(clusterLevel);
    } else {
      console.log('� ℹ️ CLUSTER EFFECT: No change needed, already at', clusterLevel);
    }
  }, [clusterLevel, currentClusterLevel, viewer, channels]);

  // Separate effect for cube size multiplier changes - only updates existing entities
  // Track previous cube size to avoid re-rendering when it hasn't actually changed
  const previousCubeSizeRef = useRef(currentCubeSizeMultiplier);
  
  useEffect(() => {
    if (!viewer || !viewer.entities || !channels || channels.length === 0) {
      return;
    }
    
    // Only proceed if cube size actually changed
    if (previousCubeSizeRef.current === currentCubeSizeMultiplier) {
      return; // No change, skip re-render
    }
    
    console.log(`🧊 [CUBE SIZE CHANGE] Cube size multiplier changed from ${previousCubeSizeRef.current}x to: ${currentCubeSizeMultiplier}x`);
    console.log(`🧊 [CUBE SIZE CHANGE] Updating existing entity dimensions without full re-render`);
    
    previousCubeSizeRef.current = currentCubeSizeMultiplier;
    
    // Update existing box entities with new dimensions instead of recreating everything
    const entities = viewer.entities.values;
    let updatedCount = 0;
    
    entities.forEach(entity => {
      if (entity.box && entity.box.dimensions && entity.properties && entity.properties.baseDimensions) {
        try {
          const baseDimensions = entity.properties.baseDimensions.getValue();
          const newDimensions = new window.Cesium.Cartesian3(
            baseDimensions.x * currentCubeSizeMultiplier,
            baseDimensions.y * currentCubeSizeMultiplier,
            baseDimensions.z // Keep height the same
          );
          entity.box.dimensions = newDimensions;
          updatedCount++;
        } catch (error) {
          // If updating fails, we'll need a full re-render for this entity
          console.warn('🧊 Failed to update entity dimensions:', error);
        }
      }
    });
    
      console.log(`🧊 [CUBE SIZE CHANGE] Updated ${updatedCount} entities with new cube dimensions`);
      
      // Re-render voter towers if they're currently displayed (use refs to avoid stale closures)
      if (voterEntitiesRef.current && voterEntitiesRef.current.length > 0 && 
          hoveredCandidateRef.current && currentVoterCandidateIdRef.current) {
        console.log(`🧊 [CUBE SIZE CHANGE] Re-rendering voter towers with new scale for candidate:`, currentVoterCandidateIdRef.current);
        // Clear and reload voters for the currently hovered candidate
        const candidateData = hoveredCandidateRef.current;
        const channelData = globeStateRef.current?.selectedChannel;
        if (candidateData && channelData) {
          // Don't change currentVoterCandidateIdRef - just reload the same candidate's voters with new scale
          loadVotersForCandidate(candidateData, channelData, currentClusterLevel);
        }
      }
      
      // Only trigger full re-render if we couldn't update entities efficiently
      if (updatedCount === 0 && entities.length > 0) {
        console.log(`🧊 [CUBE SIZE CHANGE] No entities could be updated, triggering full re-render`);
        setLastRenderTime(Date.now());
      } else if (updatedCount > 0) {
        console.log(`🧊 [CUBE SIZE CHANGE] Efficient update successful, no full re-render needed`);
      }
  }, [currentCubeSizeMultiplier, viewer, currentClusterLevel, loadVotersForCandidate]);

  // Render all channels with proper clustering level support and entity caching
  useEffect(() => {
    if (DEBUG_CONFIG.RENDERING) {
      console.log(`🌍 🔍 MAIN RENDER EFFECT: Triggered with currentClusterLevel="${currentClusterLevel}"`);
    }
    
    // Enhanced validation with fallback viewer support
    if (!viewer || (!viewer.entities && !viewer.isFallback) || !channels || !Array.isArray(channels) || channels.length === 0) {
      if (DEBUG_CONFIG.RENDERING) {
        console.log('🌍 Skipping render - no valid viewer, entities, channels:', { 
          hasViewer: !!viewer, 
          hasEntities: !!(viewer && (viewer.entities || viewer.isFallback)),
          channelsType: typeof channels, 
          isArray: Array.isArray(channels), 
          length: channels?.length,
          isFallback: viewer?.isFallback
        });
      }
      return;
    }

    // Skip rendering for fallback viewers
    if (viewer.isFallback) {
      if (DEBUG_CONFIG.RENDERING) {
        console.log('🌍 Skipping render - fallback viewer active');
      }
      return;
    }

    // Create a hash of channels data and cube size multiplier to detect if anything changed
    const channelsHash = JSON.stringify(channels.map(ch => ({ id: ch.id, candidateCount: ch.candidates?.length })));
    const cacheKey = `${currentClusterLevel}-${currentCubeSizeMultiplier.toFixed(3)}`;
    const fullCacheKey = `${channelsHash}-${cacheKey}`;
    const dataChanged = fullCacheKey !== lastChannelsHashRef.current;
    
    if (DEBUG_CONFIG.RENDERING) {
      console.log(`🌍 Rendering ${channels.length} channels with ${currentClusterLevel} clustering and ${currentCubeSizeMultiplier.toFixed(3)}x cube size`);
      console.log(`🌍 Data/cube size changed: ${dataChanged}, Cache available: ${entityCacheRef.current.has(cacheKey)}`);
      console.log('🌍 Channels in render effect:', channels.map(ch => `${ch.name} (${ch.candidates?.length || 0} candidates)`));
    }
    
    if (DEBUG_CONFIG.CHANNELS) {
      console.log('🌍 📊 DETAILED CHANNEL DATA:', channels.map(ch => ({ 
        id: ch.id, 
        name: ch.name, 
        candidateCount: ch.candidates?.length,
        hasLocation: !!(ch.location || ch.coordinates),
        firstCandidate: ch.candidates?.[0] ? {
          name: ch.candidates[0].name,
          hasLocation: !!(ch.candidates[0].location || ch.candidates[0].lat || ch.candidates[0].latitude)
        } : null
      })));
    }
    
    // Check if we can use cached entities (same cluster level + same data + same cube size) - DISABLED FOR GPS
    // GPS entities with box geometry are complex and should always be freshly rendered
    if (!dataChanged && entityCacheRef.current.has(cacheKey) && currentClusterLevel !== 'gps') {
      if (DEBUG_CONFIG.RENDERING) {
        console.log(`🌍 🚀 CACHE HIT: Reusing cached entities for ${currentClusterLevel} level with ${currentCubeSizeMultiplier.toFixed(3)}x cube size`);
      }
      const cachedEntities = entityCacheRef.current.get(cacheKey);
      
      // Check if entities are already present and match cache
      const currentEntities = viewer.entities.values;
      const expectedEntityIds = new Set(cachedEntities.map(e => e.id));
      const currentEntityIds = new Set(currentEntities.map(e => e.id));
      
      // Only clear and restore if entities don't match
      const entitiesMatch = expectedEntityIds.size === currentEntityIds.size && 
                          [...expectedEntityIds].every(id => currentEntityIds.has(id));
      
      if (entitiesMatch) {
        console.log(`🌍 ✅ CACHE SKIP: Entities already match cache, no restore needed`);
        return;
      }
      
      console.log(`🌍 🔄 CACHE RESTORE: Selective clear and restoring ${cachedEntities.length} cached entities`);
      
      // Clear only candidate entities (preserve administrative boundaries)
      const removedCount = removeOnlyCandidateEntities();
      console.log(`🌍 🔄 CACHE RESTORE: Removed ${removedCount} candidate entities before restore`);
      
      // Restore cached candidate entities
      cachedEntities.forEach(entityData => {
        try {
          const entity = viewer.entities.add(entityData);
          entitiesRef.current.set(entity.id, entity);
          // Entity restored from cache
        } catch (error) {
          console.warn('🌍 ⚠️ Error restoring cached entity:', error);
        }
      });
      
      const countyCount = viewer.entities.values.filter(e => e.id && e.id.startsWith('county-')).length;
      console.log(`🌍 ✅ CACHE RESTORE: ${cachedEntities.length} entities restored, ${countyCount} counties preserved`);
      return;
    }
    
    // Update channels hash for future cache comparisons (including cube size)
    lastChannelsHashRef.current = fullCacheKey;
    
    // Calculate aggregated vote counts for current cluster level
    const aggregatedVotes = calculateAggregatedVoteCounts(channels, currentClusterLevel);
    setAggregatedVoteCounts(aggregatedVotes);
    
    // SELECTIVE CLEAR before rendering new cluster level (protects administrative boundaries)
    if (viewer && viewer.entities) {
      if (DEBUG_CONFIG.RENDERING) console.log('🌍 🧹 SELECTIVE CLEAR: Clearing candidate entities before cluster level render');
      try {
        const currentEntityCount = viewer.entities.values.length;
        if (currentEntityCount > 0) {
          if (DEBUG_CONFIG.RENDERING) {
            console.log(`🌍 🧹 SELECTIVE CLEAR: ${currentEntityCount} total entities, removing only candidates`);
          }
          // Step 1: Remove ONLY candidate entities from Cesium viewer (protect boundaries)
          const removedCount = removeOnlyCandidateEntities();
          console.log(`🌍 ✅ Selective removal completed: ${removedCount} candidate entities removed`);
          
          // Step 2: Clear our tracking references (only tracks candidates)
          entitiesRef.current.clear();
          setEntities([]);
          
          // Step 3: Verify administrative entities are preserved
          const remainingCount = viewer.entities.values.length;
          const countyCount = viewer.entities.values.filter(e => e.id && e.id.startsWith('county-')).length;
          const provinceCount = viewer.entities.values.filter(e => e.id && e.id.startsWith('province-')).length;
          console.log(`🌍 ✅ SELECTIVE CLEAR COMPLETE: ${remainingCount} entities remain (${countyCount} counties, ${provinceCount} provinces preserved)`);
          
          if (DEBUG_CONFIG.RENDERING) console.log(`🌍 ✅ SELECTIVE CLEAR: Candidate entities cleared, boundaries preserved`);
        } else {
          if (DEBUG_CONFIG.RENDERING) console.log('🌍 ✅ SELECTIVE CLEAR: No entities to clear, proceeding with render');
        }
      } catch (error) {
        console.error('🌍 ❌ SELECTIVE CLEAR: Error clearing entities:', error);
      }
    }
    
    // Shorter delay for faster rendering
    setTimeout(() => {
      // Check if we should render individual GPS locations, channel clusters, or stacked regions
      console.log(`🌍 🔍 RENDER DECISION: currentClusterLevel = "${currentClusterLevel}"`);
      
      if (currentClusterLevel === 'gps') {
        console.log('🌍 📍 GPS MODE: Rendering individual GPS locations for all candidates');
        renderIndividualCandidates();
      } else {
        if (DEBUG_CONFIG.RENDERING) {
          console.log(`🌍 📚 HIERARCHICAL CLUSTERING: Rendering ${currentClusterLevel} level clusters`);
        }
        
        // Use hierarchical clustering system with async province centroid calculation
        (async () => {
          try {
            const clusterGroups = await groupCandidatesByClusterLevel(channels, currentClusterLevel);
            if (DEBUG_CONFIG.CLUSTERING) {
              console.log(`🗺️ 📊 Grouped candidates into ${clusterGroups.size} ${currentClusterLevel} level clusters with province centroids`);
            }
            
            // 🛡️ VALIDATION: Filter out clusters with invalid [0,0] centroids to prevent rendering errors
            const validClusters = new Map();
            let skippedCount = 0;
            clusterGroups.forEach((clusterGroup, clusterId) => {
              const [lng, lat] = clusterGroup.centroid || [0, 0];
              if (lng === 0 && lat === 0) {
                console.warn(`⚠️ Skipping cluster "${clusterGroup.clusterName}" - invalid centroid [0,0]`);
                skippedCount++;
              } else {
                validClusters.set(clusterId, clusterGroup);
              }
            });
            
            if (skippedCount > 0) {
              console.log(`🗺️ ⚠️ Skipped ${skippedCount} clusters with invalid centroids`);
            }
            
            const newEntities = [];
            validClusters.forEach((clusterGroup, clusterId) => {
              const clusterEntities = createClusterStack(clusterGroup);
              newEntities.push(...clusterEntities);
            });
            
            setEntities(newEntities);
            if (DEBUG_CONFIG.RENDERING) {
              console.log(`🗺️ ✅ Created ${newEntities.length} total entities with province-aware clustering for level: ${currentClusterLevel}`);
            }
          } catch (error) {
            console.error('🗺️ ❌ Error in async clustering:', error);
            
            // Fallback to sync clustering if async fails
            const fallbackClusterGroups = new Map();
            channels.forEach(channel => {
              if (channel.candidates) {
                channel.candidates.forEach(candidate => {
                  const clusterId = candidate.province || candidate.country || 'UNKNOWN';
                  if (!fallbackClusterGroups.has(clusterId)) {
                    fallbackClusterGroups.set(clusterId, {
                      clusterId,
                      clusterName: clusterId,
                      level: currentClusterLevel,
                      candidates: [],
                      centroid: [0, 0],
                      centroidType: 'emergency-fallback'
                    });
                  }
                  fallbackClusterGroups.get(clusterId).candidates.push({ ...candidate, sourceChannel: channel });
                });
              }
            });
            
            const newEntities = [];
            fallbackClusterGroups.forEach((clusterGroup, clusterId) => {
              const clusterEntities = createClusterStack(clusterGroup);
              newEntities.push(...clusterEntities);
            });
            
            setEntities(newEntities);
            console.log(`🗺️ 🚑 Emergency fallback clustering created ${newEntities.length} entities`);
          }
        })();
      }
      
      // Cache the entities for this cluster level (after successful rendering)
      // Skip caching for GPS level as box entities are complex and should be freshly rendered
      setTimeout(() => {
        if (viewer && viewer.entities && viewer.entities.values.length > 0 && currentClusterLevel !== 'gps') {
          try {
            const entityData = viewer.entities.values.map(entity => {
              // Create a serializable representation of the entity
              return {
                id: entity.id,
                position: entity.position,
                point: entity.point ? {
                  pixelSize: entity.point.pixelSize,
                  color: entity.point.color,
                  outlineColor: entity.point.outlineColor,
                  outlineWidth: entity.point.outlineWidth,
                  heightReference: entity.point.heightReference
                } : undefined,
                billboard: entity.billboard ? {
                  image: entity.billboard.image,
                  scale: entity.billboard.scale,
                  verticalOrigin: entity.billboard.verticalOrigin,
                  horizontalOrigin: entity.billboard.horizontalOrigin
                } : undefined,
                box: entity.box ? {
                  dimensions: entity.box.dimensions,
                  material: entity.box.material,
                  outline: entity.box.outline,
                  outlineColor: entity.box.outlineColor,
                  outlineWidth: entity.box.outlineWidth,
                  fill: entity.box.fill
                } : undefined,
                label: entity.label ? {
                  text: entity.label.text,
                  font: entity.label.font,
                  fillColor: entity.label.fillColor,
                  outlineColor: entity.label.outlineColor,
                  outlineWidth: entity.label.outlineWidth,
                  style: entity.label.style,
                  pixelOffset: entity.label.pixelOffset,
                  verticalOrigin: entity.label.verticalOrigin
                } : undefined,
                description: entity.description,
                properties: entity.properties
              };
            });
            
            entityCacheRef.current.set(cacheKey, entityData);
            if (DEBUG_CONFIG.RENDERING) {
              console.log(`🌍 💾 CACHE SAVED: ${entityData.length} entities cached for ${currentClusterLevel} level with ${currentCubeSizeMultiplier.toFixed(3)}x cube size`);
            }
          } catch (error) {
            console.warn('🌍 ⚠️ Failed to cache entities:', error);
          }
        } else if (currentClusterLevel === 'gps') {
          if (DEBUG_CONFIG.RENDERING) {
            console.log('🌍 💾 CACHE SKIP: GPS entities not cached - always freshly rendered');
          }
        }
      }, 100); // Small delay to ensure entities are fully created
    }, 50); // Reduced delay for faster rendering - was 100ms
    
  }, [viewer, channels, currentClusterLevel, createRegionalStack, clearEntities, renderIndividualCandidates, calculateAggregatedVoteCounts, groupCandidatesByRegion, createChannelClusterEntities, channelClusters]);

  // Handle cluster level changes from external sources (like ClusteringControlPanel)
  useEffect(() => {
    if (DEBUG_CONFIG.CLUSTERING) {
      console.log(`🌍 🔍 CLUSTER EFFECT: clusterLevel="${clusterLevel}", currentClusterLevel="${currentClusterLevel}"`);
    }
    
    if (clusterLevel !== currentClusterLevel) {
      if (DEBUG_CONFIG.CLUSTERING) {
        console.log(`🌍 🔄 CLUSTER LEVEL TRANSITION: ${currentClusterLevel} → ${clusterLevel}`);
      }
      
      // Clear GPS cache when switching away from GPS to ensure fresh rendering next time
      if (currentClusterLevel === 'gps' && entityCacheRef.current.has('gps')) {
        entityCacheRef.current.delete('gps');
        if (DEBUG_CONFIG.CLUSTERING) {
          console.log('🌍 🧹 CLEARED GPS CACHE: Ensuring fresh GPS rendering next time');
        }
      }
      
      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Set transition flag to prevent other effects from interfering
      setIsTransitioning(true);
      
      // Set the new cluster level immediately
      setCurrentClusterLevel(clusterLevel);
      console.log(`🌍 ✅ CLUSTER LEVEL UPDATED: Now at ${clusterLevel} level`);
      
      // Allow a brief moment for state to settle, then clear transition flag
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        console.log('🌍 ✅ TRANSITION PERIOD ENDED, normal rendering resumed');
      }, 50); // Reduced delay for faster responsiveness
    } else {
      console.log(`🌍 ℹ️ CLUSTER EFFECT: No change needed, already at ${clusterLevel}`);
    }
  }, [clusterLevel, currentClusterLevel]);

  // Setup click and hover handlers with enhanced hover panels (like Canadian system)
  useEffect(() => {
    if (!viewer) return;

    const clickHandler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let hoverTooltip = null;
    
    // Handle clicks
    clickHandler.setInputAction((event) => {
      console.log('🎯 GlobalChannelRenderer: Click detected at position:', event.position);
      const pickedObject = viewer.scene.pick(event.position);
      console.log('🎯 GlobalChannelRenderer: Picked object:', pickedObject);
      
      if (pickedObject && pickedObject.id) {
        console.log('🎯 GlobalChannelRenderer: Picked object has ID:', pickedObject.id.id);
        console.log('🎯 GlobalChannelRenderer: Picked object properties:', pickedObject.id.properties);
        
        if (pickedObject.id.properties) {
          const properties = pickedObject.id.properties;
          
          // Access ConstantProperty values correctly
          const candidateData = properties.candidateData?._value;
          const channelData = properties.channelData?._value;
          const regionName = properties.regionName?._value;
          const centerCoordinates = properties.centerCoordinates?._value;
          
          console.log('🎯 Extracted data:', { candidateData, channelData, regionName, centerCoordinates });
          
          if (candidateData && channelData) {
            console.log('🌍 Candidate clicked:', candidateData.name, 'in', regionName);
            console.log('🎯 Candidate clicked from global system:', candidateData.name, 'in channel:', channelData.name);
            console.log('🎯 Click properties:', { candidateData, channelData, regionName, isIndividual: properties.isIndividual?._value });
            
            // Set the selected channel in globe state (required for ChannelTopicRowPanel)
            // Create a new object to ensure React detects the state change
            if (setGlobeState) {
              console.log('🎯 Setting selected channel in globe state:', channelData.name);
              setGlobeState(prev => ({
                ...prev,
                selectedChannel: { ...channelData }, // Create new reference to trigger re-render
                selectedCandidate: { ...candidateData } // Create new reference for candidate too
              }));
            }
            
            // Dispatch the panel opening event
            const event = new CustomEvent('openPanel', {
              detail: { panelId: 'channel_topic_row' }
            });
            window.dispatchEvent(event);
            console.log('🎯 Dispatched openPanel event for channel_topic_row');
            
            // Also dispatch a candidate clicked event as backup
            const candidateEvent = new CustomEvent('candidateClicked', {
              detail: { 
                candidate: candidateData, 
                channel: channelData,
                panelId: 'channel_topic_row'
              }
            });
            window.dispatchEvent(candidateEvent);
            console.log('🎯 Dispatched candidateClicked event as backup');
            
            if (onCandidateClick) {
              onCandidateClick(
                candidateData,
                channelData,
                centerCoordinates || [0, 0]
              );
            }
            
            // NOTE: Camera pan and voter visualization are now triggered from 
            // the Channel Ranking Panel when user clicks a candidate card,
            // not when clicking the candidate cube on the globe (which just opens the panel)
            
            // 🗺️ BOUNDARY RENDERING: If this is a boundary channel, render the boundary on globe
            if (channelData && channelData.type === 'boundary' && boundaryServiceRef.current) {
              console.log('🗺️ Boundary channel clicked - rendering boundary for:', candidateData.candidateName || candidateData.name);
              
              // Clear any previous boundary previews
              boundaryServiceRef.current.clearPreview();
              
              // Get the boundary data from the candidate
              const boundaryToRender = candidateData.modifiedBoundary || candidateData.originalBoundary;
              
              if (boundaryToRender) {
                console.log('🗺️ Rendering boundary:', {
                  candidateName: candidateData.candidateName,
                  isDefault: candidateData.isDefault,
                  boundaryType: boundaryToRender.type,
                  coordinateCount: boundaryToRender.coordinates ? boundaryToRender.coordinates[0]?.length : 0
                });
                
                // Render the boundary on the globe
                boundaryServiceRef.current.renderBoundary(
                  boundaryToRender,
                  candidateData.isDefault,
                  candidateData.candidateId,
                  {
                    name: candidateData.candidateName || candidateData.name,
                    regionName: channelData.regionName,
                    description: candidateData.description
                  }
                );
                
                // Zoom to the boundary
                boundaryServiceRef.current.zoomToBoundary(boundaryToRender);
                
                console.log('✅ Boundary rendered and camera zoomed');
              } else {
                console.warn('⚠️ No boundary data found in candidate:', candidateData);
              }
            }
          } else {
            console.log('🎯 Missing required data:', { 
              hasCandidateData: !!candidateData, 
              hasChannelData: !!channelData 
            });
          }
        } else {
          console.log('🎯 No properties on picked object');
        }
      } else {
        console.log('🎯 No object picked or no ID on picked object');
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Enhanced hover handler with modern tooltip (like Canadian system)
    clickHandler.setInputAction((event) => {
      const pickedObject = viewer.scene.pick(event.endPosition);
      
      // Remove previous tooltip
      if (hoverTooltip) {
        document.body.removeChild(hoverTooltip);
        hoverTooltip = null;
      }
      
      if (pickedObject && pickedObject.id && pickedObject.id.properties) {
        const entity = pickedObject.id;
        const properties = entity.properties;
        
        // Access ConstantProperty values correctly
        const candidateData = properties.candidateData?._value;
        const channelData = properties.channelData?._value;
        const regionName = properties.regionName?._value;
        const isIndividual = properties.isIndividual?._value;
        
        // Check if we're hovering over a voter tower
        const entityId = entity.id ? entity.id.toString() : '';
        const isVoterTower = entityId.startsWith('voter-visible') || entityId.startsWith('voter-hidden');
        
        // DEBUG: Log what we're hovering over
        console.log('🔍 [HOVER DEBUG] Picked object:', {
          hasCandidate: !!candidateData,
          hasChannel: !!channelData,
          candidateName: candidateData?.name,
          channelName: channelData?.name,
          entityId: entity.id,
          isVoterTower
        });
        
        // **NEW: Load voters when hovering over candidate OR keep voters when hovering over voter towers**
        if (candidateData && channelData) {
          // Cancel any pending voter clearing
          if (clearVotersTimeoutRef.current) {
            clearTimeout(clearVotersTimeoutRef.current);
            clearVotersTimeoutRef.current = null;
          }
          
          // Only load voters if we're hovering over a DIFFERENT candidate than the one currently displayed
          if (currentVoterCandidateIdRef.current !== candidateData.id) {
            console.log('🗳️ [HOVER] Starting voter load for:', candidateData.name, '(previous:', currentVoterCandidateIdRef.current, ')');
            setHoveredCandidate(candidateData);
            currentVoterCandidateIdRef.current = candidateData.id; // Update ref immediately (not async like state)
            loadVotersForCandidate(candidateData, channelData, currentClusterLevel);
          } else {
            // Same candidate, just update hovered state without reloading voters
            setHoveredCandidate(candidateData);
          }
        } else if (isVoterTower && currentVoterCandidateIdRef.current) {
          // Hovering over a voter tower - cancel any pending clearing to keep voters visible
          if (clearVotersTimeoutRef.current) {
            clearTimeout(clearVotersTimeoutRef.current);
            clearVotersTimeoutRef.current = null;
            console.log('🗳️ [HOVER] Hovering over voter tower, keeping voters displayed');
          }
        }
        
        if (candidateData && channelData) {
          // Create enhanced hover tooltip
          hoverTooltip = document.createElement('div');
          hoverTooltip.style.cssText = `
            position: fixed;
            left: ${event.endPosition.x + 15}px;
            top: ${event.endPosition.y - 10}px;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
            color: #e2e8f0;
            border-radius: 16px;
            border: 2px solid rgba(99, 102, 241, 0.4);
            padding: 16px 20px;
            font-size: 13px;
            font-family: Inter, system-ui, sans-serif;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
            min-width: 220px;
            max-width: 320px;
            text-align: left;
            backdrop-filter: blur(12px);
            z-index: 10000;
            pointer-events: none;
          `;
          
          // Get vote count - MUST read globeStateRef.current to get the absolute latest values
          // Use the same getCandidateVotes function that handles vote count logic consistently
          const voteCount = getCandidateVotes(candidateData, channelData.id);
          
          console.log(`🔍 [Hover] ${candidateData.name}: ${voteCount} votes (using getCandidateVotes)`);
          
          const clusterLevelText = isIndividual ? 'GPS (Individual)' : currentClusterLevel.toUpperCase();
          
          hoverTooltip.innerHTML = `
            <div style="font-size: 12px; color: #6366f1; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(99, 102, 241, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.2);">
              🌍 ${regionName} ${isIndividual ? 'Individual' : 'Regional'} Channel
            </div>
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #fbbf24; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              👤 ${candidateData.name || candidateData.username || `Candidate ${candidateData.id}`}
            </div>
            <div style="color: #10b981; font-weight: 600; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);" data-vote-count data-candidate-id="${candidateData.id}" data-channel-id="${channelData.id}">
              🗳️ <strong>${voteCount.toLocaleString()}</strong> votes
            </div>
            ${candidateData.location ? `
              <div style="background: rgba(34, 197, 94, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(34, 197, 94, 0.3);">
                <div style="font-size: 12px; color: #22c55e; font-weight: 600; margin-bottom: 4px;">📍 LOCATION</div>
                <div style="font-size: 11px; color: #cbd5e1;">
                  ${candidateData.location.city || regionName} (${candidateData.location.lat?.toFixed(2) || 'N/A'}°, ${candidateData.location.lng?.toFixed(2) || 'N/A'}°)
                </div>
              </div>
            ` : ''}
            <div style="background: rgba(99, 102, 241, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(99, 102, 241, 0.3);">
              <div style="font-size: 12px; color: #6366f1; font-weight: 600; margin-bottom: 4px;">🔗 CLUSTER LEVEL</div>
              <div style="font-size: 11px; color: #cbd5e1;">
                ${isIndividual ? 'Individual GPS location' : `Stacked in ${regionName}`}
              </div>
              <div style="font-size: 11px; color: #cbd5e1;">
                Total Candidates: ${channelData.candidates?.length || 0}
              </div>
            </div>
            ${candidateData.description ? `
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 8px; line-height: 1.4; background: rgba(203, 213, 225, 0.05); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(203, 213, 225, 0.1);">
                💭 ${candidateData.description}
              </div>
            ` : ''}
            ${loadingVoters ? `
              <div style="background: rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="font-size: 12px; color: #10b981; font-weight: 600;">
                  🗳️ Loading voter locations...
                </div>
              </div>
            ` : voterEntities.length > 0 ? `
              <div style="background: rgba(16, 185, 129, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-bottom: 4px;">
                  🗳️ ${voterEntities.length} VOTER LOCATIONS
                </div>
                <div style="font-size: 11px; color: #cbd5e1;">
                  Green dots show voter locations
                </div>
              </div>
            ` : ''}
            <div style="font-size: 10px; color: #64748b; margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(100, 116, 139, 0.2); text-align: center;">
              Click to open voting panel
            </div>
          `;
          
          document.body.appendChild(hoverTooltip);
        }
      } else {
        // **NEW: Delayed voter clearing to prevent flashing when mouse moves slightly**
        // Don't clear immediately - wait 2 seconds to allow user to move mouse back
        if (hoveredCandidateRef.current && !clearVotersTimeoutRef.current) {
          clearVotersTimeoutRef.current = setTimeout(() => {
            setHoveredCandidate(null);
            // Clear voter entities (use ref to get current list)
            voterEntitiesRef.current.forEach(entity => {
              try {
                viewer.entities.remove(entity);
              } catch (e) {
                console.warn('Failed to remove voter entity:', e);
              }
            });
            setVoterEntities([]);
            currentVoterCandidateIdRef.current = null; // Reset so voters can be loaded again
            clearVotersTimeoutRef.current = null;
            console.log('🗳️ Cleared voter dots after 2s delay - mouse left candidate area');
          }, 2000); // 2 second delay before clearing
        }
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      clickHandler.destroy();
      if (hoverTooltip) {
        document.body.removeChild(hoverTooltip);
        hoverTooltip = null;
      }
      // Clear any pending voter clearing timeout
      if (clearVotersTimeoutRef.current) {
        clearTimeout(clearVotersTimeoutRef.current);
        clearVotersTimeoutRef.current = null;
      }
    };
  }, [viewer, onCandidateClick, currentClusterLevel, setGlobeState, getCandidateVotes, 
      hoveredCandidate, voterEntities, loadingVoters, loadVotersForCandidate]);

  

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    refreshVoteCounts: async () => {
      console.log('🌍 Refreshing vote counts...');
      console.log('🌍 Current globeStateRef.current.voteCounts:', globeStateRef.current?.voteCounts);
      
      // Recalculate aggregated vote counts using the latest globe state
      const newAggregatedVotes = calculateAggregatedVoteCounts(channels, currentClusterLevel);
      setAggregatedVoteCounts(newAggregatedVotes);
      console.log('🌍 Vote counts refreshed:', newAggregatedVotes);
      
      // Force a re-render to ensure hover tooltips use the latest data
      setRenderTrigger(prev => prev + 1);
      
      // Update visible hover tooltip if one is showing
      const voteCountElement = document.querySelector('[data-vote-count]');
      if (voteCountElement) {
        const candidateId = voteCountElement.getAttribute('data-candidate-id');
        const channelId = voteCountElement.getAttribute('data-channel-id');
        
        if (candidateId && channelId) {
          // Find the candidate data
          const channel = channels.find(ch => ch.id === channelId);
          const candidate = channel?.candidates?.find(c => c.id === candidateId);
          
          if (candidate) {
            const freshVoteCount = getCandidateVotes(candidate, channelId);
            voteCountElement.innerHTML = `🗳️ <strong>${freshVoteCount.toLocaleString()}</strong> votes`;
            console.log('🌍 ✅ Updated visible tooltip vote count to:', freshVoteCount);
          }
        }
      }
    },
    // **NEW: Pan camera to candidate and show voters (called from panel)**
    panToCandidateAndShowVoters: (candidateData, channelData) => {
      console.log(`🎯 Panel requested pan to candidate: ${candidateData?.name}`);
      panCameraToCandidate(candidateData, channelData);
      loadVotersForCandidate(candidateData, channelData, currentClusterLevel);
    },
    changeClusterLevel: (newLevel) => {
      console.log(`🌍 GlobalChannelRenderer.changeClusterLevel() called with: ${newLevel}`);
      console.log(`🌍 Previous cluster level was: ${currentClusterLevel}`);
      setCurrentClusterLevel(newLevel);
      console.log(`🌍 Cluster level state updated to: ${newLevel}`);
    },
    setCubeSizeMultiplier: (multiplier) => {
      console.log(`🧊 GlobalChannelRenderer.setCubeSizeMultiplier() called with: ${multiplier}x`);
      setCurrentCubeSizeMultiplier(multiplier);
      console.log(`🧊 Cube size multiplier updated to: ${multiplier}x`);
      // The useEffect will automatically trigger a re-render when currentCubeSizeMultiplier changes
    },
    forceRefreshChannels: () => {
      console.log('🌍 Force refreshing channels...');
      // Force a re-render by temporarily clearing and re-adding channels
      setChannels(prevChannels => [...prevChannels]);
      console.log('🌍 Channels force refreshed');
    },
    getCurrentLevel: () => currentClusterLevel,
    getChannelCount: () => channels.length,
    getEntityCount: () => entities.length,
    getAggregatedVoteCounts: () => aggregatedVoteCounts,
    getTotalVotes: () => {
      const total = Object.values(aggregatedVoteCounts).reduce((sum, count) => sum + count, 0);
      return total;
    }
  }), [channels, currentClusterLevel, calculateAggregatedVoteCounts, aggregatedVoteCounts]);

  // Listen for flyToLocation events from TestDataPanel
  useEffect(() => {
    if (!viewer) return;
    
    const handleFlyToLocation = (event) => {
      const { lat, lng, height = 5000000, duration = 2 } = event.detail || {};
      
      if (lat == null || lng == null) {
        console.warn('📷 flyToLocation event missing coordinates:', event.detail);
        return;
      }
      
      console.log(`📷 [GlobalChannelRenderer] Flying camera to [${lat}, ${lng}] at ${height/1000}km altitude`);
      
      try {
        viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(lng, lat, height),
          orientation: {
            heading: window.Cesium.Math.toRadians(0),
            pitch: window.Cesium.Math.toRadians(-90), // Look straight down
            roll: 0
          },
          duration: duration,
          complete: () => {
            console.log(`📷 Camera flight complete - now viewing [${lat}, ${lng}]`);
          }
        });
      } catch (error) {
        console.error('📷 Error flying camera:', error);
      }
    };
    
    window.addEventListener('flyToLocation', handleFlyToLocation);
    
    return () => {
      window.removeEventListener('flyToLocation', handleFlyToLocation);
    };
  }, [viewer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear entities on unmount - they should persist
      // The entities will be managed by the Cesium viewer itself
      console.log('🌍 Component unmounting, keeping entities visible...');
      console.log('🌍 Entities will persist in the Cesium viewer');
      
      // DEBUG: Check entity count before unmount
      if (viewer && viewer.entities) {
        const entityCount = viewer.entities.values.length;
        console.log('🌍 🔧 DEBUG: Entity count before unmount:', entityCount);
        
        // Check if entities are visible
        const visibleCount = viewer.entities.values.filter(e => e.show !== false).length;
        console.log('🌍 🔧 DEBUG: Visible entities before unmount:', visibleCount);
      }
    };
  }, []);

  // Expose debug functions globally for troubleshooting
  useEffect(() => {
    if (typeof window !== 'undefined' && viewer) {
      window.globalChannelDebug = {
        clearAllEntities: () => {
          console.log('🌍 🔧 DEBUG: Manual clear all entities');
          clearEntities();
        },
        listAllEntities: () => {
          const entities = viewer.entities.values;
          console.log('🌍 🔧 DEBUG: Current entities:', entities.length);
          entities.forEach((entity, index) => {
            console.log(`  ${index + 1}. ID: ${entity.id}, Position: ${entity.position ? 'YES' : 'NO'}, Box: ${entity.box ? 'YES' : 'NO'}`);
          });
          return entities;
        },
        getEntityCount: () => {
          return viewer.entities.values.length;
        },
        forceGpsMode: () => {
          console.log('🌍 🔧 DEBUG: Force GPS mode');
          setCurrentClusterLevel('gps');
        },
        getTrackedEntities: () => {
          console.log('🌍 🔧 DEBUG: Tracked entities:', entitiesRef.current.size);
          return Array.from(entitiesRef.current.keys());
        },
        clearTransition: () => {
          console.log('🌍 🔧 DEBUG: Transition system removed - no longer needed');
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
            transitionTimeoutRef.current = null;
          }
        },
        getTransitionState: () => {
          console.log('🌍 🔧 DEBUG: Transition system removed');
          return false;
        },
        forceRender: () => {
          console.log('🌍 🔧 DEBUG: Force rendering channels');
          // Trigger a re-render by updating the cluster level
          setCurrentClusterLevel(prev => prev);
        }
      };
      
      return () => {
        delete window.globalChannelDebug;
      };
    }
  }, [viewer, clearEntities]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear any pending transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  if (debugMode) {
    const totalVotes = Object.values(aggregatedVoteCounts).reduce((sum, count) => sum + count, 0);
    return (
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>🌍 GlobalChannelRenderer</div>
        <div>Cluster Level: {currentClusterLevel}</div>
        <div>Channels: {channels.length}</div>
        <div>Entities: {entities.length}</div>
        <div>Total Votes: {totalVotes.toLocaleString()}</div>
        <div>Aggregated Regions: {Object.keys(aggregatedVoteCounts).length}</div>
        <div style={{marginTop: '5px', fontSize: '10px'}}>
          {Object.entries(aggregatedVoteCounts).slice(0, 3).map(([region, votes]) => (
            <div key={region}>{region}: {votes.toLocaleString()}</div>
          ))}
        </div>
      </div>
    );
  }

  return null; // This component only renders to Cesium, no DOM elements
});

GlobalChannelRenderer.displayName = 'GlobalChannelRenderer';

export default GlobalChannelRenderer;
