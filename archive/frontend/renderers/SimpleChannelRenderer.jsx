/**
 * SimpleChannelRenderer - Global channel rendering for  // Load globally distributed data
  useEffect(() => {
    console.log('🌍 SimpleChannelRenderer initialized for global distribution');
    const loadGlobalData = async () => {
      try {
        console.log('🌍 Loading globally distributed channel data...');
        const response = await fetch('http://localhost:3002/api/channels');
        
        if (response.ok) {
          const data = await response.json();
          const globalChannels = data.channels || [];
          console.log('🌍 Global data loaded:', {
            channelCount: globalChannels.length,
            sampleChannel: globalChannels[0]
          });
          setChannels(globalChannels);ibution
 * 
 * This renderer focuses on:
 * 1. Loading globally distributed channel data
 * 2. Rendering candidates as stacks by region/country
 * 3. Clear labels for verification
 * 4. Simple interaction handling
 */

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { apiGet, voteAPI } from '../../services/apiClient';

// Global colors for different regions
const GLOBAL_COLORS = {
  'North America': '#FF5733',
  'Europe': '#33FF57', 
  'Asia': '#3357FF',
  'Africa': '#F733FF',
  'South America': '#FF33F7',
  'Oceania': '#33F7FF',
  'default': '#888888'
};

const SimpleChannelRenderer = forwardRef(({
  viewer,
  onCandidateClick,
  globeState,
  setGlobeState,
  debugMode = false,
  clusterLevel = 'gps', // Add clustering level support
  regionManager = null,  // Add region manager integration
  cubeSizeMultiplier = 1.0  // Add cube size multiplier support
}, ref) => {
  const [channels, setChannels] = useState([]);
  const [entities, setEntities] = useState([]);
  const [cameraHeight, setCameraHeight] = useState(20000000); // Default camera height
  const [realTimeVoteCounts, setRealTimeVoteCounts] = useState({});
  const entitiesRef = useRef(new Map());

  // Dynamic cube sizing based on camera height and user multiplier
  const calculateCubeSize = useCallback((baseSize, cameraHeight) => {
    if (!cameraHeight) return baseSize;
    
    // Define zoom level thresholds and scaling factors with more dramatic differences
    const zoomLevels = [
      { maxHeight: 100000, scale: 0.05 },     // Ultra close - microscopic cubes (100km)
      { maxHeight: 300000, scale: 0.15 },     // Very close - tiny cubes (300km)
      { maxHeight: 800000, scale: 0.4 },      // Close - small cubes (800km)
      { maxHeight: 2000000, scale: 0.8 },     // Medium - medium cubes (2000km)
      { maxHeight: 8000000, scale: 1.5 },     // Far - large cubes (8000km)
      { maxHeight: 20000000, scale: 2.5 },    // Very far - huge cubes (20000km)
      { maxHeight: Infinity, scale: 4.0 }     // Space view - massive cubes
    ];
    
    // Find appropriate scale factor
    const level = zoomLevels.find(level => cameraHeight <= level.maxHeight);
    const scaleFactor = level ? level.scale : 1.0;
    
    // Apply scaling with minimum size constraint
    const scaledSize = baseSize * scaleFactor;
    const minSize = 1000; // Minimum 1km cube size
    
    // Apply user-controlled cube size multiplier with enhanced effect
    // Use a power function to make small values even smaller and large values more dramatic
    const enhancedMultiplier = Math.pow(cubeSizeMultiplier, 1.5);
    const finalSize = Math.max(scaledSize, minSize) * enhancedMultiplier;
    
    return finalSize;
  }, [cubeSizeMultiplier]);

  // Function to fetch real-time vote counts for a channel
  const fetchChannelVoteCounts = useCallback(async (channelId, candidates) => {
    try {
      const voteCountPromises = candidates.map(async (candidate) => {
        const response = await voteAPI.getCandidateVoteCount(channelId, candidate.id);
        return {
          candidateId: candidate.id,
          voteCount: response.voteCount || 0
        };
      });
      
      const voteCounts = await Promise.all(voteCountPromises);
      const totalVotes = voteCounts.reduce((sum, vc) => sum + vc.voteCount, 0);
      
      return { totalVotes, candidateVoteCounts: voteCounts };
    } catch (error) {
      console.warn('� Error fetching vote counts for channel:', channelId, error);
      return { totalVotes: 0, candidateVoteCounts: [] };
    }
  }, []);

  // Load globally distributed data
  useEffect(() => {
    console.log('� SimpleChannelRenderer initialized for global distribution');
    const loadGlobalData = async () => {
      try {
        console.log('� Loading globally distributed channel data...');
        const response = await fetch('http://localhost:3002/api/channels/global');
        
        if (response.ok) {
          const data = await response.json();
          const globalChannels = data.channels || [];
          console.log('� Global data loaded:', {
            channelCount: globalChannels.length,
            sampleChannel: globalChannels[0]
          });
          setChannels(globalChannels);
          
          // Load initial vote counts for all channels
          console.log('� Loading real-time vote counts...');
          const voteCountsMap = {};
          for (const channel of globalChannels) {
            const voteCounts = await fetchChannelVoteCounts(channel.id, channel.candidates);
            voteCountsMap[channel.id] = voteCounts;
          }
          setRealTimeVoteCounts(voteCountsMap);
          console.log('� Real-time vote counts loaded:', Object.keys(voteCountsMap).length, 'channels');
        } else {
          console.error('� Failed to load global data:', response.status);
        }
      } catch (error) {
        console.error('� Error loading global data:', error);
      }
    };

    loadGlobalData();
  }, []);

  // Listen for channel update events from other components
  useEffect(() => {
    const handleChannelsUpdated = async () => {
      console.log('🔄 [SimpleChannelRenderer] Received channelsUpdated event, refreshing...');
      try {
        const response = await fetch('http://localhost:3002/api/channels');
        if (response.ok) {
          const data = await response.json();
          const globalChannels = data.channels || [];
          console.log('🔄 [SimpleChannelRenderer] Updated channels:', {
            channelCount: globalChannels.length,
            source: data.source || 'backend'
          });
          setChannels(globalChannels);
          
          // Update vote counts for new channels
          const voteCountsMap = {};
          for (const channel of globalChannels) {
            const voteCounts = await fetchChannelVoteCounts(channel.id, channel.candidates);
            voteCountsMap[channel.id] = voteCounts;
          }
          setRealTimeVoteCounts(voteCountsMap);
        }
      } catch (error) {
        console.error('🔄 [SimpleChannelRenderer] Error updating channels:', error);
      }
    };

    window.addEventListener('channelsUpdated', handleChannelsUpdated);
    
    return () => {
      window.removeEventListener('channelsUpdated', handleChannelsUpdated);
    };
  }, [fetchChannelVoteCounts]);

  // Listen for channel clear events from TestDataPanel
  useEffect(() => {
    const handleChannelsCleared = () => {
      console.log('🧹 [SimpleChannelRenderer] Received channelsCleared event, clearing display...');
      // Clear the channels state without fetching new data
      setChannels([]);
      setRealTimeVoteCounts({});
      // Clear entities if available - check for correct method
      if (entities && typeof entities.removeAll === 'function') {
        entities.removeAll();
        console.log('🧹 [SimpleChannelRenderer] All entities cleared from channels cleared event');
      } else if (entities && Array.isArray(entities) && entities.length > 0) {
        // If entities is an array, clear it differently
        entities.length = 0;
        setEntities([]);
        console.log('🧹 [SimpleChannelRenderer] Entity array cleared from channels cleared event');
      } else {
        console.log('🧹 [SimpleChannelRenderer] No entities to clear or removeAll method not available');
      }
    };

    window.addEventListener('channelsCleared', handleChannelsCleared);
    
    return () => {
      window.removeEventListener('channelsCleared', handleChannelsCleared);
    };
  }, [entities]);

  // Get region hierarchy for clustering based on current cluster level
  const getRegionForClustering = useCallback((candidate, channel) => {
    // Priority 1: Use RegionManager data if available
    if (regionManager && candidate.region_assignment && candidate.region_assignment.hierarchy) {
      const hierarchy = candidate.region_assignment.hierarchy;
      
      switch (clusterLevel) {
        case 'gps':
          return null; // Individual GPS positioning
        case 'city':
          return hierarchy[4] || hierarchy[3] || hierarchy[2] || 'Unknown City';
        case 'state':
        case 'province':
          return hierarchy[3] || hierarchy[2] || 'Unknown State/Province';
        case 'country':
          return hierarchy[2] || hierarchy[1] || 'Unknown Country';
        case 'continent':
          return hierarchy[1] || 'Unknown Continent';
        case 'globe':
        case 'global':
          return 'GLOBAL';
        default:
          return hierarchy[3] || hierarchy[2] || 'Unknown Region';
      }
    }
    
    // Priority 2: Use channel location data
    if (channel.country && clusterLevel !== 'gps') {
      switch (clusterLevel) {
        case 'city':
          return channel.city || channel.region || channel.country;
        case 'state':
        case 'province':
          return channel.region || channel.country;
        case 'country':
          return channel.country;
        case 'continent':
          return channel.continent || 'Unknown Continent';
        case 'globe':
        case 'global':
          return 'GLOBAL';
        default:
          return channel.country;
      }
    }
    
    // Priority 3: Fallback to simple region names
    return channel.region || channel.country || channel.name || 'Unknown Region';
  }, [regionManager, clusterLevel]);

  // Enhanced convert hex color to Cesium Color
  const hexToCesiumColor = useCallback((hex, alpha = 1.0) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new window.Cesium.Color(r, g, b, alpha);
  }, []);

  // Enhanced entity clearing for better persistence across view mode switches
  const clearEntities = useCallback(() => {
    if (viewer && entitiesRef.current.size > 0) {
      console.log('🧹 Enhanced clearing of', entitiesRef.current.size, 'entities');
      
      // Step 1: Remove from tracking first to prevent re-access
      const entitiesToRemove = Array.from(entitiesRef.current.values());
      entitiesRef.current.clear();
      
      // Step 2: Remove from viewer with error handling
      entitiesToRemove.forEach((entity, index) => {
        try {
          if (entity && viewer.entities.contains(entity)) {
            viewer.entities.remove(entity);
            console.log(`🧹 Removed entity ${index + 1}/${entitiesToRemove.length}: ${entity.id}`);
          }
        } catch (error) {
          console.warn(`🧹 Error removing entity ${entity?.id}:`, error);
        }
      });
      
      // Step 3: Force Cesium scene update to prevent entity ghosting
      if (viewer.scene) {
        viewer.scene.requestRender();
      }
      
      setEntities([]);
      console.log('🧹 Entity clearing complete. Viewer entities remaining:', viewer.entities.values.length);
    }
  }, [viewer]);

w  // Calculate heatmap color based on vote count (hot colors for high votes, cool colors for low votes)
  const calculateHeatmapColor = useCallback((voteCount, maxVotes, baseColor = '#4ECDC4') => {
    if (maxVotes === 0) return baseColor;
    
    const voteRatio = voteCount / maxVotes;
    
    // Heatmap color gradient: Blue (cold) → Green → Yellow → Orange → Red (hot)
    let r, g, b;
    
    if (voteRatio <= 0.2) {
      // Blue to Green (low votes)
      const t = voteRatio / 0.2;
      r = 0;
      g = Math.floor(255 * t);
      b = Math.floor(255 * (1 - t));
    } else if (voteRatio <= 0.4) {
      // Green to Yellow (medium-low votes)
      const t = (voteRatio - 0.2) / 0.2;
      r = Math.floor(255 * t);
      g = 255;
      b = 0;
    } else if (voteRatio <= 0.6) {
      // Yellow to Orange (medium votes)
      const t = (voteRatio - 0.4) / 0.2;
      r = 255;
      g = Math.floor(255 * (1 - t * 0.5));
      b = 0;
    } else if (voteRatio <= 0.8) {
      // Orange to Red-Orange (medium-high votes)
      const t = (voteRatio - 0.6) / 0.2;
      r = 255;
      g = Math.floor(255 * (0.5 - t * 0.3));
      b = Math.floor(255 * t * 0.2);
    } else {
      // Red-Orange to Bright Red (high votes)
      const t = (voteRatio - 0.8) / 0.2;
      r = 255;
      g = Math.floor(255 * (0.2 - t * 0.2));
      b = Math.floor(255 * (0.2 + t * 0.3));
    }
    
    // Ensure values are within 0-255 range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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

  // Create regional stack with enhanced clustering level support and vote aggregation
  const createRegionalStack = useCallback((channel) => {
    if (!viewer || !channel.candidates || !Array.isArray(channel.candidates)) return [];

    // For GPS level, render individual candidates
    if (clusterLevel === 'gps') {
      return []; // Individual rendering will handle GPS level
    }

    // Get the clustering region for this channel
    const firstCandidate = channel.candidates[0];
    const regionName = getRegionForClustering(firstCandidate, channel);
    
    if (!regionName) return [];
    
    console.log(`🌍 Creating ${clusterLevel} cluster stack for "${regionName}" with ${channel.candidates.length} candidates`);

    const regionColor = GLOBAL_COLORS[regionName] || GLOBAL_COLORS.default;
    
    // Use channel coordinates if available, otherwise calculate from candidates
    let centerLat, centerLng;
    
    if (channel.location && channel.location.latitude && channel.location.longitude) {
      centerLat = channel.location.latitude;
      centerLng = channel.location.longitude;
    } else {
      // Fallback: calculate center point from candidates' locations
      let totalLat = 0, totalLng = 0, validCandidates = 0;
      
      channel.candidates.forEach(candidate => {
        if (candidate.location && candidate.location.lat && candidate.location.lng) {
          totalLat += candidate.location.lat;
          totalLng += candidate.location.lng;
          validCandidates++;
        }
      });
      
      if (validCandidates === 0) {
        console.warn(`� No valid candidate locations for ${regionName}`);
        return [];
      }
      
      centerLat = totalLat / validCandidates;
      centerLng = totalLng / validCandidates;
    }
    
    // Calculate total votes for this region using real-time data
    const channelVoteCounts = realTimeVoteCounts[channel.id];
    const totalVotes = channelVoteCounts ? channelVoteCounts.totalVotes : 
                      channel.candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
    
    console.log(`� Creating enhanced stack for ${regionName} (${channel.country}) with ${channel.candidates.length} candidates at [${centerLat.toFixed(3)}, ${centerLng.toFixed(3)}] - Total Votes: ${totalVotes} ${channelVoteCounts ? '(live)' : '(static)'}`);

    const stackEntities = [];
    const baseCubeSize = 100000; // 100km base cubes for visibility
    const dynamicCubeSize = calculateCubeSize(baseCubeSize, cameraHeight); // Apply meter slidebar control
    const stackHeight = 150000; // 150km per cube
    const stackSpacing = stackHeight * 1.2; // 20% spacing between cubes
    
    // Sort candidates by vote count (highest first) for vote-based height positioning
    const sortedCandidates = [...channel.candidates].map(candidate => ({
      ...candidate,
      voteCount: (candidate.testVotes || 0) + (candidate.realVotes || 0) + (candidate.votes || 0)
    })).sort((a, b) => b.voteCount - a.voteCount);
    
    // Enhanced cube creation with vote-based height positioning
    sortedCandidates.forEach((candidate, index) => {
      // Calculate vote-based height: higher vote count = higher position
      // Base height of 100km + vote-proportional height scaling
      const maxVotes = Math.max(...sortedCandidates.map(c => c.voteCount));
      const minVotes = Math.min(...sortedCandidates.map(c => c.voteCount));
      const voteRange = maxVotes - minVotes || 1; // Avoid division by zero
      
      // Height based on vote ranking: 100km base + 0-500km based on vote proportion
      const voteHeightScale = maxVotes > 0 ? ((candidate.voteCount - minVotes) / voteRange) : 0;
      const voteBasedHeight = 100000 + (voteHeightScale * 500000); // 100km-600km range
      
      // Add small spacing between candidates of similar vote counts
      const rankSpacing = index * 50000; // 50km spacing for visual separation
      const height = voteBasedHeight + rankSpacing;
      
      const position = window.Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height);
      
      const entityId = `global-${regionName}-${candidate.id}-${index}`;
      
      // Calculate individual candidate votes with reconciliation
      const candidateVotes = candidate.voteCount;
      
      const entity = new window.Cesium.Entity({
        id: entityId,
        position: position,
        box: {
          dimensions: new window.Cesium.Cartesian3(dynamicCubeSize, dynamicCubeSize, stackHeight * 0.8),
          material: hexToCesiumColor(regionColor, 0.8),
          outline: true,
          outlineColor: hexToCesiumColor('#2C3E50', 1.0), // Dark blue-gray for clean borders
          outlineWidth: 3
        },

        properties: {
          candidateData: candidate,
          channelData: channel,
          regionName: regionName,
          countryName: channel.country,
          stackIndex: index,
          voteRank: index + 1, // Rank by vote count (1 = highest votes)
          voteBasedHeight: height,
          isGlobal: true,
          centerCoordinates: [centerLng, centerLat],
          // Enhanced stacking context for vote reconciliation
          stackContext: {
            stackId: `${regionName}-stack`,
            totalStackCandidates: channel.candidates.length,
            totalStackVotes: totalVotes,
            candidateVotes: candidateVotes,
            voteRank: index + 1,
            heightMethod: 'vote-based', // Track that this uses vote-based positioning
            stackPosition: index + 1,
            reconciliationData: {
              cubeContribution: candidateVotes,
              stackTotal: totalVotes,
              isReconciled: true // Will be validated by backend
            }
          }
        }
      });

      stackEntities.push(entity);
    });

    return stackEntities;
  }, [viewer, hexToCesiumColor, realTimeVoteCounts]);

  // Enhanced individual candidate rendering with stack context
  const renderIndividualCandidates = useCallback(() => {
    let totalCandidates = 0;

    channels.forEach((channel) => {
      // Use channel.country for global channels, fallback to channel.region
      const regionName = channel.country || channel.region || channel.name || 'Unknown Region';
      const regionColor = GLOBAL_COLORS[regionName] || GLOBAL_COLORS.default;
      
      // Calculate stack-level data for context
      const stackTotalVotes = channel.candidates.reduce((sum, candidate) => 
        sum + (candidate.initialVotes || 0) + (candidate.blockchainVotes || 0), 0);

      channel.candidates.forEach((candidate, index) => {
        // For global channels with candidate locations, use individual candidate GPS coordinates
        let candidateLat, candidateLng;
        
        if (candidate.location && candidate.location.lat && candidate.location.lng) {
          // Use individual candidate locations (preferred for global distribution)
          candidateLat = candidate.location.lat;
          candidateLng = candidate.location.lng;
        } else if (channel.location && channel.location.latitude && channel.location.longitude) {
          // Fallback: use channel location if no candidate location
          candidateLat = channel.location.latitude;
          candidateLng = channel.location.longitude;
        } else {
          console.warn(`� No valid location for candidate ${candidate.name || index} in ${regionName}`);
          return; // Skip this candidate
        }
        
        // Calculate vote-based height for individual candidates too
        const candidateVotes = (candidate.testVotes || 0) + (candidate.realVotes || 0) + (candidate.votes || 0);
        
        // Vote-based height: 50km base + up to 200km based on vote count
        const maxVotesInChannel = Math.max(...channel.candidates.map(c => 
          (c.testVotes || 0) + (c.realVotes || 0) + (c.votes || 0)));
        const voteHeightScale = maxVotesInChannel > 0 ? (candidateVotes / maxVotesInChannel) : 0;
        const voteBasedHeight = 50000 + (voteHeightScale * 200000); // 50km-250km range
        
        const candidatePosition = window.Cesium.Cartesian3.fromDegrees(candidateLng, candidateLat, voteBasedHeight);
        
        const candidateEntity = new window.Cesium.Entity({
          id: `individual-candidate-${regionName}-${candidate.id}-${index}`,
          position: candidatePosition,
          box: {
            dimensions: new window.Cesium.Cartesian3(
              calculateCubeSize(80000, cameraHeight), 
              calculateCubeSize(80000, cameraHeight), 
              calculateCubeSize(80000, cameraHeight)
            ), // Dynamic 80km cubes with size multiplier
            material: hexToCesiumColor(regionColor, 0.8),
            outline: true,
            outlineColor: window.Cesium.Color.fromCssColorString('#2C3E50')
          },

          properties: {
            isCandidate: true,
            candidateData: candidate,
            channelData: channel,
            regionName: regionName,
            country: channel.country,
            continent: channel.region,
            centerCoordinates: [candidateLng, candidateLat],
            isGlobal: true,
            isIndividual: true,
            // Enhanced stack relationship context
            stackRelationship: {
              belongsToStack: `${regionName}-stack`,
              stackTotalCandidates: channel.candidates.length,
              stackTotalVotes: stackTotalVotes,
              candidatePosition: index + 1,
              candidateVotes: candidateVotes,
              percentOfStack: stackTotalVotes > 0 ? ((candidateVotes / stackTotalVotes) * 100).toFixed(1) : 0,
              canAggregateToStack: true
            }
          }
        });

        viewer.entities.add(candidateEntity);
        entitiesRef.current.set(candidateEntity.id, candidateEntity);
        totalCandidates++;
      });
    });

    console.log('� Rendered', totalCandidates, 'individual candidates at GPS locations with enhanced stack context');
    setEntities(Array.from(entitiesRef.current.values()));
  }, [channels, viewer, hexToCesiumColor]);

  // Render regional stacks when zoomed out  
  const renderRegionalStacks = useCallback(() => {
    const allEntities = [];

    channels.forEach(channel => {
      const stackEntities = createRegionalStack(channel);
      
      stackEntities.forEach(entity => {
        try {
          viewer.entities.add(entity);
          entitiesRef.current.set(entity.id, entity);
          allEntities.push(entity);
        } catch (error) {
          console.error('� Error adding entity:', error);
        }
      });
    });

    setEntities(allEntities);
    console.log('� Rendered', entitiesRef.current.size, 'total entities (regional stacks)');
  }, [channels, viewer, createRegionalStack]);

  // Enhanced render function with clustering level support
  const renderWithLOD = useCallback(() => {
    if (!viewer || !channels.length) {
      clearEntities();
      return;
    }

    // Get camera height to determine LOD (for automatic LOD when clustering is at GPS level)
    const cameraHeight = viewer.camera.positionCartographic.height;
    const isZoomedIn = cameraHeight < 2500000; // 2500km threshold for individual candidate view
    
    console.log(`� Rendering with Cluster Level: ${clusterLevel} - Height: ${Math.round(cameraHeight/1000)}km, ZoomedIn: ${isZoomedIn}, Channels: ${channels.length}`);
    clearEntities();

    // GPS level: Always show individual candidates (ignore camera height)
    if (clusterLevel === 'gps') {
      console.log('� 📍 GPS Level: Rendering individual candidates');
      renderIndividualCandidates();
    } 
    // Other clustering levels: Show regional stacks
    else {
      console.log(`� �️ ${clusterLevel.toUpperCase()} Level: Rendering clustered stacks`);
      renderRegionalStacks();
    }
  }, [viewer, channels, clusterLevel, clearEntities, renderIndividualCandidates, renderRegionalStacks]);

  // Listen for clustering level changes and camera changes to update rendering
  useEffect(() => {
    if (!viewer) return;

    const updateLOD = () => {
      renderWithLOD();
    };

    // Initial render
    renderWithLOD();

    // Listen for camera move end to update LOD (only for GPS level auto-switching)
    const removeListener = clusterLevel === 'gps' ? 
      viewer.camera.moveEnd.addEventListener(updateLOD) : null;

    return () => {
      if (removeListener) removeListener();
    };
  }, [viewer, channels, clusterLevel, renderWithLOD, realTimeVoteCounts]);

  // Re-render when clustering level changes
  useEffect(() => {
    console.log(`🌍 Clustering level changed to: ${clusterLevel}, re-rendering...`);
    if (viewer && channels.length > 0) {
      renderWithLOD();
    }
  }, [clusterLevel, renderWithLOD]);

  // Re-render when cube size multiplier changes
  useEffect(() => {
    console.log(`🧊 Cube size multiplier changed to: ${cubeSizeMultiplier}x, re-rendering...`);
    if (viewer && channels.length > 0) {
      renderWithLOD();
    }
  }, [cubeSizeMultiplier, renderWithLOD]);

  // Setup click and hover handlers with enhanced hover panels
  useEffect(() => {
    if (!viewer) return;

    const clickHandler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let hoverTooltip = null;
    
    // Enhanced click handler with proper cube-to-stack association
    clickHandler.setInputAction((event) => {
      console.log('🎯 SimpleChannelRenderer: Enhanced click detected at position:', event.position);
      const pickedObject = viewer.scene.pick(event.position);
      console.log('🎯 SimpleChannelRenderer: Picked object:', pickedObject);
      
      if (pickedObject && pickedObject.id && pickedObject.id.properties) {
        const properties = pickedObject.id.properties;
        
        // Access ConstantProperty values correctly
        const candidateData = properties.candidateData?._value;
        const channelData = properties.channelData?._value;
        const provinceName = properties.provinceName?._value;
        const centerCoordinates = properties.centerCoordinates?._value;
        const stackContext = properties.stackContext?._value;
        const stackRelationship = properties.stackRelationship?._value;
        
        if (candidateData && channelData) {
          console.log('🇨🇦 Enhanced candidate clicked:', candidateData.name, 'in', provinceName);
          console.log('🎯 Enhanced candidate click with stack context:', {
            candidateData, 
            channelData, 
            provinceName, 
            stackContext: stackContext || stackRelationship,
            isIndividual: properties.isIndividual?._value
          });
          
          // Create enhanced channel object with complete stack context
          const enhancedChannel = {
            ...channelData,
            // Ensure proper vote aggregation for the channel/stack
            totalVotes: stackContext?.totalStackVotes || stackRelationship?.stackTotalVotes || 
                       (channelData.candidates || []).reduce((sum, c) => 
                         sum + (c.testVotes || 0) + (c.realVotes || 0) + (c.votes || 0), 0),
            // Enhanced candidates array with proper vote reconciliation
            candidates: (channelData.candidates || []).map((c, idx) => ({
              ...c,
              votes: (c.testVotes || 0) + (c.realVotes || 0) + (c.votes || 0),
              stackPosition: idx + 1,
              isClickedCandidate: c.id === candidateData.id
            })),
            // Province/stack metadata
            province: provinceName,
            stackId: stackContext?.stackId || stackRelationship?.belongsToStack || `${provinceName}-stack`,
            stackMetadata: {
              totalCandidates: stackContext?.totalStackCandidates || stackRelationship?.stackTotalCandidates,
              totalVotes: stackContext?.totalStackVotes || stackRelationship?.stackTotalVotes,
              clickSource: properties.isIndividual?._value ? 'individual-cube' : 'stacked-cube',
              reconciled: stackContext?.reconciliationData?.isReconciled || true
            }
          };
          
          // Set the enhanced channel in globe state
          if (setGlobeState) {
            console.log('🎯 Setting enhanced channel in globe state:', enhancedChannel.name);
            setGlobeState(prev => ({
              ...prev,
              selectedChannel: enhancedChannel,
              selectedCandidate: candidateData,
              votingContext: {
                fromStackClick: true,
                stackId: enhancedChannel.stackId,
                clickedCubeType: properties.isIndividual?._value ? 'individual' : 'stacked',
                timestamp: Date.now()
              }
            }));
          }
          
          // Dispatch the enhanced panel opening event
          const event = new CustomEvent('openPanel', {
            detail: { 
              panelId: 'channel_topic_row',
              source: 'enhanced-cube-click',
              channelData: enhancedChannel,
              candidateData: candidateData,
              stackContext: stackContext || stackRelationship
            }
          });
          window.dispatchEvent(event);
          console.log('🎯 Dispatched enhanced openPanel event for channel_topic_row');
          
          // Also dispatch a stack integration event for backend reconciliation
          const stackEvent = new CustomEvent('stackReconciliation', {
            detail: {
              stackId: enhancedChannel.stackId,
              clickedCube: candidateData.id,
              totalStackVotes: enhancedChannel.totalVotes,
              cubeVotes: (candidateData.testVotes || 0) + (candidateData.realVotes || 0) + (candidateData.votes || 0)
            }
          });
          window.dispatchEvent(stackEvent);
          console.log('🎯 Dispatched stack reconciliation event');
          
          // Force open voting panel as backup
          if (window.forceOpenPanel) {
            window.forceOpenPanel('channel_topic_row');
          }
          
          if (onCandidateClick) {
            onCandidateClick(
              candidateData,
              enhancedChannel, // Pass enhanced channel instead of raw data
              centerCoordinates || [0, 0]
            );
          }
        }
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Enhanced hover handler with modern tooltip


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
        const provinceName = properties.provinceName?._value;
        
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
          
          // Get vote count from real-time data
          const channelVoteCounts = realTimeVoteCounts[channelData.id];
          const candidateVoteData = channelVoteCounts?.candidateVoteCounts?.find(vc => vc.candidateId === candidateData.id);
          const voteCount = candidateVoteData?.voteCount || candidateData.votes || 0;
          
          hoverTooltip.innerHTML = `
            <div style="font-size: 12px; color: #6366f1; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(99, 102, 241, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.2);">
              🏛️ ${provinceName} Provincial Channel
            </div>
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #fbbf24; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              👤 ${candidateData.name || candidateData.username || `Candidate ${candidateData.id}`}
            </div>
            <div style="color: #10b981; font-weight: 600; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
              🗳️ <strong>${voteCount.toLocaleString()}</strong> votes
            </div>
            ${candidateData.location ? `
              <div style="background: rgba(34, 197, 94, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(34, 197, 94, 0.3);">
                <div style="font-size: 12px; color: #22c55e; font-weight: 600; margin-bottom: 4px;">📍 LOCATION</div>
                <div style="font-size: 11px; color: #cbd5e1;">
                  ${candidateData.location.city || provinceName} (${candidateData.location.lat?.toFixed(2) || 'N/A'}°, ${candidateData.location.lng?.toFixed(2) || 'N/A'}°)
                </div>
              </div>
            ` : ''}
            <div style="background: rgba(99, 102, 241, 0.15); border-radius: 8px; padding: 8px 12px; margin: 8px 0; border: 1px solid rgba(99, 102, 241, 0.3);">
              <div style="font-size: 12px; color: #6366f1; font-weight: 600; margin-bottom: 4px;">🔗 PROVINCIAL LEVEL</div>
              <div style="font-size: 11px; color: #cbd5e1;">
                Stacked candidate in ${provinceName}
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
            <div style="font-size: 10px; color: #64748b; margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(100, 116, 139, 0.2); text-align: center;">
              Click to open voting panel
            </div>
          `;
          
          document.body.appendChild(hoverTooltip);
        }
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      clickHandler.destroy();
      if (hoverTooltip) {
        document.body.removeChild(hoverTooltip);
        hoverTooltip = null;
      }
    };
  }, [viewer, onCandidateClick, realTimeVoteCounts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEntities();
    };
  }, [clearEntities]);

  // Function to refresh vote counts (called when votes change)
  const refreshVoteCounts = useCallback(async () => {
    if (channels.length === 0) return;
    
    console.log('🇨🇦 Refreshing vote counts...');
    const voteCountsMap = {};
    for (const channel of channels) {
      const voteCounts = await fetchChannelVoteCounts(channel.id, channel.candidates);
      voteCountsMap[channel.id] = voteCounts;
    }
    setRealTimeVoteCounts(voteCountsMap);
    console.log('🇨🇦 Vote counts refreshed');
  }, [channels, fetchChannelVoteCounts]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    refresh: clearEntities,
    refreshVoteCounts,
    getEntityCount: () => entitiesRef.current.size,
    getChannelCount: () => channels.length
  }));

  // This is a render-less component
  return null;
});

SimpleChannelRenderer.displayName = 'SimpleChannelRenderer';

export default SimpleChannelRenderer;
