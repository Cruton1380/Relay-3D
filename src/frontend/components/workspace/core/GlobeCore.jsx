/**
 * GlobeCore - Original Channel Cube System
 * 
 * Restored original implementation with:
 * - Candidate cubes stacked outwards from center
 * - Hover descriptions with full candidate info
 * - Grid-based positioning around globe
 * - Click interactions for ChannelTopicRowPanel
 */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  SphereGeometry,
  MeshBasicMaterial,
  Vector3,
  CylinderGeometry,
  Object3D
} from 'three';
import { Html } from '@react-three/drei';
import { useEnvironment } from '../hooks/useEnvironment.js';
import { apiPost, apiGet } from '../services/apiClient.js';

const getTotalVotes = (candidate) => {
  // Handle both old format (testVotes + realVotes) and new format (votes)
  if (candidate?.votes !== undefined) {
    return candidate.votes;
  }
  return (candidate?.testVotes || 0) + (candidate?.realVotes || 0);
};

const EARTH_RADIUS = 6371000; // meters

// Helper function to extract province from channel name
const extractProvinceFromName = (name) => {
  if (!name) return 'Unknown';
  // Extract province from names like "Ontario Provincial Channel" or "Alberta"
  const provincePatterns = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ];
  
  for (const province of provincePatterns) {
    if (name.toLowerCase().includes(province.toLowerCase())) {
      return province;
    }
  }
  
  // Fallback to first word if no province found
  return name.split(' ')[0];
};

const GlobeCore = ({ channels = [], viewer, isVisible = true }) => {
  console.log('🌍 GlobeCore component initialized - Original System');
  
  // Component state
  const globeGroupRef = useRef();
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [hoveredCandidate, setHoveredCandidate] = useState(null);
  const [votedCandidates, setVotedCandidates] = useState({});
  const [voteCounts, setVoteCounts] = useState({});
  const [voting, setVoting] = useState(false);
  const { isTestMode } = useEnvironment();

  // Convert lat/lng to world coordinates
  const latLngToWorld = (lat, lng, radius = globeRadius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new Vector3(x, y, z);
  };

  // Load channels from backend (with clustering support)
  useEffect(() => {
    async function loadChannels() {
      try {
        console.log('🔄 Loading channels from backend...');
        
        // Use clustered channels from globeState if available
        if (globeState.clusteredChannels && globeState.clusteredChannels.length > 0) {
          console.log('✅ Using clustered channels from globeState:', globeState.clusteredChannels.length);
          setChannels(globeState.clusteredChannels);
          setIsLoading(false);
          return;
        }
        
        // Otherwise, fetch from the new globe service with clustering
        const clusterLevel = globeState.clusterLevel || 'gps';
        const response = await fetch(`http://localhost:3003/api/globe/channels?clusterLevel=${clusterLevel}`);
        if (response.ok) {
          const data = await response.json();
          const channelData = data.channels || [];
          setChannels(Array.isArray(channelData) ? channelData : []);
          setIsLoading(false);
          console.log('✅ Loaded', channelData.length, 'channels from globe service (level:', clusterLevel, ')');
          
          // Log clustering info
          if (data.metadata) {
            console.log('🔗 Clustering metadata:', data.metadata);
          }
        } else {
          console.error('❌ Failed to fetch channels:', response.status);
          // No fallback - only show backend data
          setChannels([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading channels:', error);
        setIsLoading(false);
      }
    }
    
    loadChannels();
    
    // Listen for channel generation events to refresh
    const handleChannelsGenerated = () => {
      console.log('🔄 Channels generated event received, refreshing...');
      loadChannels();
    };
    
    window.addEventListener('channelsGenerated', handleChannelsGenerated);
    
    return () => {
      window.removeEventListener('channelsGenerated', handleChannelsGenerated);
    };
  }, [globeState.channelsUpdated, globeState.clusterLevel, globeState.clusteredChannels]);

  // Handle vote functionality
  const handleVote = async (channelId, candidateId) => {
    if (voting) return;
    
    setVoting(true);
    try {
      const response = await apiPost('/api/vote', {
        userId: 'demo-user-1',
        channelId,
        candidateId,
        testMode: isTestMode
      });
      
      if (response.success) {
        setVotedCandidates(prev => ({
          ...prev,
          [channelId]: candidateId
        }));
        console.log('✅ Vote cast successfully');
      }
    } catch (error) {
      console.error('❌ Vote failed:', error);
    } finally {
      setVoting(false);
    }
  };

  // Render channel towers with stacked candidate cubes outwards from center
  const renderChannelSpikes = () => {
    console.log('🌍 GlobeCore: Rendering channel spikes, channels:', channels.length);
    
    if (channels.length === 0) {
      console.log('🌍 GlobeCore: No channels to render');
      return null;
    }
    
    // Calculate max vote count for normalization
    const maxVote = Math.max(1, ...channels.flatMap(c => (c.candidates || []).map(cd => getTotalVotes(cd))));
    const globeDiameter = globeRadius * 2;
    const baseOffset = 0.8; // Much larger offset to start channels outside the globe sphere
    const maxDistance = globeDiameter * 1.2; // Max distance from globe for highest vote
    const cubeSize = 0.25; // Increased cube size for better visibility

    // Place channels using geographic coordinates from API only
    const numChannels = channels.length;

    return channels.map((channel, channelIndex) => {
      console.log(`🌍 GlobeCore: Rendering channel ${channelIndex}:`, channel);
      
      // Use geographic coordinates from backend API only - no fallbacks
      let lat, lon;
      if (channel.location && typeof channel.location.latitude === 'number' && typeof channel.location.longitude === 'number') {
        // Convert degrees to radians for sphere positioning
        lat = channel.location.latitude * (Math.PI / 180);
        lon = channel.location.longitude * (Math.PI / 180);
        console.log(`🌍 GlobeCore: Using API coordinates - lat: ${channel.location.latitude}°, lon: ${channel.location.longitude}°`);
      } else {
        // No fallback - skip channels without location data
        console.warn(`🌍 GlobeCore: No location data for channel ${channel.name}, skipping`);
        return null;
      }
      
      console.log(`🌍 GlobeCore: Channel ${channelIndex} positioned at lat: ${lat.toFixed(4)}, lon: ${lon.toFixed(4)}`);
      const channelX = globeRadius * Math.cos(lat) * Math.cos(lon);
      const channelY = globeRadius * Math.sin(lat);
      const channelZ = globeRadius * Math.cos(lat) * Math.sin(lon);
      const normal = new Vector3(channelX, channelY, channelZ).normalize();
      
      // Place each candidate cube along the normal, distance proportional to votes
      const candidates = (channel.candidates || []).slice().sort((a, b) => {
        const voteDiff = getTotalVotes(b) - getTotalVotes(a);
        if (voteDiff !== 0) return voteDiff;
        if (a.id && b.id) return String(a.id).localeCompare(String(b.id));
        if (a.name && b.name) return String(a.name).localeCompare(String(b.name));
        return 0;
      });
      
      return (
        <group key={`channel-spike-${channel.id || channelIndex}`}>
          {candidates.map((candidate, candidateIndex) => {
            // Stack candidates vertically with spacing
            const stackOffset = candidateIndex * (cubeSize + 0.1); // Stack cubes with spacing
            const voteNorm = Math.max(0, Math.min(1, getTotalVotes(candidate) / maxVote));
            const distance = globeRadius + baseOffset + stackOffset + voteNorm * maxDistance;
            const segX = normal.x * distance;
            const segY = normal.y * distance;
            const segZ = normal.z * distance;
            
            console.log(`🌍 GlobeCore: Candidate ${candidate.name} positioned at [${segX.toFixed(2)}, ${segY.toFixed(2)}, ${segZ.toFixed(2)}], distance: ${distance.toFixed(2)}, votes: ${getTotalVotes(candidate)}`);
            
            const isHovered = hoveredCandidate && hoveredCandidate.channelId === (channel.id || channelIndex) && hoveredCandidate.candidateId === (candidate.id || candidateIndex);
            const isSelected = selectedCandidate && selectedCandidate.channelId === (channel.id || channelIndex) && selectedCandidate.candidateId === (candidate.id || candidateIndex);
            
            // Color: gradient by candidate index
            const hue = (candidateIndex / Math.max(1, candidates.length)) * 0.7;
            const color = `hsl(${Math.floor(hue * 360)}, 80%, 55%)`;
            
            return (
              <group key={candidate.id || candidateIndex}>
                <mesh
                  position={[segX, segY, segZ]}
                  onClick={() => {
                    console.log('🎯 Candidate cube clicked:', candidate.name);
                    console.log('🎯 Channel data:', channel);
                    
                    // If already selected, deselect it
                    if (isSelected) {
                      setSelectedCandidate(null);
                      setGlobeState(prev => ({
                        ...prev,
                        selectedChannel: null
                      }));
                      return;
                    }
                    
                    setSelectedCandidate({ 
                      channelId: channel.id || channelIndex, 
                      candidateId: candidate.id || candidateIndex, 
                      position: [segX, segY, segZ], 
                      candidate, 
                      channel 
                    });
                    
                    // Enhanced channel selection for proper voting panel integration
                    const enhancedChannel = {
                      ...channel,
                      id: channel.id || channelIndex,
                      name: channel.name || `Channel ${channelIndex + 1}`,
                      // Ensure candidates array exists and is properly structured
                      candidates: (channel.candidates || []).map((c, idx) => ({
                        ...c,
                        id: c.id || `${channel.id || channelIndex}-candidate-${idx}`,
                        votes: (c.testVotes || 0) + (c.realVotes || 0) + (c.votes || 0),
                        testVotes: c.testVotes || 0,
                        realVotes: c.realVotes || 0
                      })),
                      // Add province/region context for stacking
                      province: channel.province || channel.region || extractProvinceFromName(channel.name),
                      stackContext: {
                        totalCandidates: (channel.candidates || []).length,
                        totalVotes: (channel.candidates || []).reduce((sum, c) => 
                          sum + (c.testVotes || 0) + (c.realVotes || 0) + (c.votes || 0), 0),
                        clickedCandidate: candidate
                      }
                    };
                    
                    // Trigger channel selection for topic row panel
                    setGlobeState(prev => ({
                      ...prev,
                      selectedChannel: enhancedChannel,
                      votingContext: {
                        fromCubeClick: true,
                        stackId: `${enhancedChannel.province || 'unknown'}-stack`,
                        timestamp: Date.now()
                      }
                    }));
                    
                    // Force open the voting panel with enhanced event
                    const event = new CustomEvent('openPanel', {
                      detail: { 
                        panelId: 'channel_topic_row',
                        source: 'cube-click',
                        channelData: enhancedChannel,
                        candidateData: candidate
                      }
                    });
                    window.dispatchEvent(event);
                    console.log('🎯 Enhanced cube click - Dispatched openPanel event for channel_topic_row');
                    console.log('🎯 Enhanced event detail:', event.detail);
                    
                    // Also trigger the global force open as backup
                    if (window.forceOpenPanel) {
                      window.forceOpenPanel('channel_topic_row');
                    }
                  }}
                                     onPointerOver={() => setHoveredCandidate({ 
                     channelId: channel.id || channelIndex, 
                     candidateId: candidate.id || candidateIndex, 
                     position: [segX, segY, segZ], 
                     candidate, 
                     channel 
                   })}
                   onPointerOut={() => {
                     // Clear hover when mouse leaves
                     setHoveredCandidate(null);
                   }}
                >
                  <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
                  <meshStandardMaterial 
                    color={color} 
                    emissive={(isHovered || isSelected) ? '#fff' : '#000'} 
                    emissiveIntensity={(isHovered || isSelected) ? 0.7 : 0.3} 
                  />
                  {(isHovered || isSelected) && (
                    <mesh>
                      <boxGeometry args={[cubeSize * 1.12, cubeSize * 1.12, cubeSize * 1.12]} />
                      <meshBasicMaterial color={'#409cff'} transparent opacity={isSelected ? 0.7 : 0.45} />
                    </mesh>
                  )}
                </mesh>
                
                {/* Enhanced Hover Panel - Modern styled with channel info */}
                {isHovered && !isSelected && (
                  <Html position={[segX, segY + cubeSize * 0.7, segZ]} center style={{ pointerEvents: 'auto', zIndex: 10000 }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
                      color: '#e2e8f0',
                      borderRadius: '16px',
                      border: '2px solid rgba(99, 102, 241, 0.4)',
                      padding: '16px 20px',
                      fontSize: '13px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                      minWidth: '220px',
                      maxWidth: '320px',
                      textAlign: 'left',
                      position: 'relative',
                      backdropFilter: 'blur(12px)'
                    }}>
                      {/* Channel Name Header */}
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6366f1', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}>
                        🏛️ {channel.name || 'Unknown Channel'} 
                      </div>
                      
                      {/* Candidate Name */}
                      <div style={{ 
                        fontWeight: 700, 
                        fontSize: '16px', 
                        marginBottom: '8px',
                        color: '#fbbf24',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        👤 {candidate.name || candidate.username || `Candidate ${candidate.id}`}
                      </div>
                      
                      {/* Vote Count */}
                      <div style={{ 
                        color: '#10b981', 
                        fontWeight: 600, 
                        fontSize: '14px', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        🗳️ <strong>{getTotalVotes(candidate).toLocaleString()}</strong> votes
                      </div>
                      
                      {/* Location info */}
                      {channel.location && (
                        <div style={{ 
                          background: 'rgba(34, 197, 94, 0.15)', 
                          borderRadius: '8px', 
                          padding: '8px 12px', 
                          margin: '8px 0',
                          border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}>
                          <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, marginBottom: '4px' }}>
                            📍 LOCATION
                          </div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            {channel.location.city && `${channel.location.city}`}
                            {channel.location.latitude && ` (${channel.location.latitude.toFixed(2)}°, ${channel.location.longitude.toFixed(2)}°)`}
                          </div>
                        </div>
                      )}
                      
                      {/* Channel clustering info */}
                      {channel.clusterInfo && (
                        <div style={{ 
                          background: 'rgba(99, 102, 241, 0.15)', 
                          borderRadius: '8px', 
                          padding: '8px 12px', 
                          margin: '8px 0',
                          border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, marginBottom: '4px' }}>
                            🔗 {channel.clusterInfo.level.toUpperCase()} LEVEL
                          </div>
                          {channel.clusterInfo.clustered && (
                            <>
                              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                Merged: {channel.clusterInfo.originalChannelCount} channels
                              </div>
                              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                Region: {channel.clusterInfo.regionName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                Total Candidates: {channel.clusterInfo.mergedCandidates}
                              </div>
                            </>
                          )}
                          {!channel.clusterInfo.clustered && (
                            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                              Individual channel (no merging)
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Original channel info for merged candidates */}
                      {candidate.originalChannelId && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#94a3b8', 
                          marginTop: '8px',
                          fontStyle: 'italic',
                          background: 'rgba(148, 163, 184, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.2)'
                        }}>
                          📄 From: {candidate.originalChannelName}
                        </div>
                      )}
                      
                      {/* Description */}
                      {candidate.description && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#cbd5e1', 
                          marginTop: '8px',
                          lineHeight: '1.4',
                          background: 'rgba(203, 213, 225, 0.05)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(203, 213, 225, 0.1)'
                        }}>
                          💬 {candidate.description}
                        </div>
                      )}
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      );
    }).filter(Boolean); // Remove null values for channels without location data
  };

  return (
    <group ref={globeGroupRef}>
      {/* Channel cubes stacked outwards from center - no globe sphere */}
      {renderChannelSpikes()}
    </group>
  );
};

export default GlobeCore;
