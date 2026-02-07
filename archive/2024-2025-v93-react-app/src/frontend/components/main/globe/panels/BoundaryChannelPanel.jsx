/**
 * @fileoverview BoundaryChannelPanel - Channel Ranking Panel for Boundary Proposals
 * 
 * MATCHES EXACT LAYOUT OF ChannelTopicRowPanelRefactored
 * Displays boundary candidates with same structure as normal channels
 * 
 * @version 2.0 - Matched Layout
 * @date October 8, 2025
 */

import React, { useState, useEffect, useRef } from 'react';
import './BoundaryChannelPanel.css';
import { generateAllPreviews, generatePlaceholderImage } from '../../../../utils/BoundaryPreviewGenerator.js';

const BoundaryChannelPanel = ({
  channel,
  regionName,
  regionType,
  onEditBoundary,
  onProposeNew,
  onSelectCandidate,
  onVote,
  currentUser,
  isEditing = false,
  editMode = 'simple',
  onEditModeChange,
  nodeCount = 0,
  onConfirmEdit,
  onCancelEdit
}) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [expandedOptions, setExpandedOptions] = useState(null);
  const [voteCounts, setVoteCounts] = useState({});
  const [previewImages, setPreviewImages] = useState({});
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (channel?.candidates) {
      // Sort by vote count (winning candidate first)
      const sorted = [...channel.candidates].sort((a, b) => {
        const aVoteCounts = getVoteCounts(a);
        const bVoteCounts = getVoteCounts(b);
        return bVoteCounts.total - aVoteCounts.total;
      });
      setCandidates(sorted);
      
      // Build vote counts object
      const counts = {};
      sorted.forEach(candidate => {
        const voteKey = `${channel.id}-${candidate.id}`;
        const voteCounts = getVoteCounts(candidate);
        counts[voteKey] = voteCounts.total;
      });
      setVoteCounts(counts);
      
      // Generate preview images for all non-official candidates
      const officialCandidate = sorted.find(c => c.isOfficial);
      if (officialCandidate) {
        console.log('🖼️ [Boundary Panel] Generating preview images...');
        const previews = generateAllPreviews(sorted, officialCandidate);
        setPreviewImages(previews);
        console.log('✅ [Boundary Panel] Generated', Object.keys(previews).length, 'preview images');
      }
      
      // Auto-select winning candidate
      if (sorted.length > 0) {
        setSelectedCandidate(sorted[0]);
        onSelectCandidate?.(sorted[0]);
      }
    }
  }, [channel]);

  /**
   * Handle candidate card click - zoom to changed area on globe
   */
  const handleCandidateClick = (candidate) => {
    console.log('🎯 [Boundary Panel] Candidate clicked:', candidate.name);
    setSelectedCandidate(candidate);
    onSelectCandidate?.(candidate);
    
    // Zoom camera to the changed area if preview bounds exist
    const preview = previewImages[candidate.id];
    if (preview?.bounds && window.cesiumViewer) {
      const { minLng, maxLng, minLat, maxLat, center } = preview.bounds;
      
      console.log('📷 [Boundary Panel] Zooming to changed area:', {
        center,
        bounds: { minLng, maxLng, minLat, maxLat }
      });
      
      // Calculate appropriate camera height based on bounds size
      const lngRange = maxLng - minLng;
      const latRange = maxLat - minLat;
      const maxRange = Math.max(lngRange, latRange);
      const height = maxRange * 200000; // Scale factor for good view
      
      window.cesiumViewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          center.lng,
          center.lat,
          Math.max(height, 50000) // Minimum 50km height
        ),
        duration: 1.5,
        orientation: {
          heading: window.Cesium.Math.toRadians(0),
          pitch: window.Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      });
    }
  };

  /**
   * Calculate area from GeoJSON polygon
   */
  const calculateArea = (geometry) => {
    if (!geometry?.coordinates?.[0]) return 0;
    
    // Simple polygon area estimation (spherical earth)
    const coords = geometry.coordinates[0];
    let area = 0;
    
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      area += (lng2 - lng1) * (lat2 + lat1);
    }
    
    // Convert to km² (rough approximation)
    const km2 = Math.abs(area * 111.32 * 111.32 / 2);
    return Math.round(km2);
  };

  /**
   * Format area with delta
   * Uses areaChange data from proposal if available (more accurate)
   */
  const formatAreaDelta = (candidate, officialCandidate) => {
    // Use areaChange data if available (from editor calculation)
    if (candidate.areaChange) {
      const { proposedArea, deltaArea, deltaPercent } = candidate.areaChange;
      const sign = deltaArea >= 0 ? '+' : '';
      const deltaColor = deltaArea >= 0 ? '#ef4444' : '#3b82f6';
      
      return deltaArea !== 0
        ? `${proposedArea.toLocaleString()} km² (${sign}${deltaArea.toLocaleString()} km², ${sign}${deltaPercent.toFixed(2)}%)`
        : `${proposedArea.toLocaleString()} km²`;
    }
    
    // Fallback to old calculation method
    const candidateArea = calculateArea(candidate.location?.geometry);
    const officialArea = calculateArea(officialCandidate?.location?.geometry);
    
    if (!officialArea) return `${candidateArea.toLocaleString()} km²`;
    
    const delta = candidateArea - officialArea;
    const deltaPercent = ((delta / officialArea) * 100).toFixed(2);
    
    if (delta === 0) return `${candidateArea.toLocaleString()} km²`;
    
    const sign = delta > 0 ? '+' : '';
    return `${candidateArea.toLocaleString()} km² (${sign}${deltaPercent}%)`;
  };

  /**
   * Get vote counts - handle both formats (number or {local, foreign})
   */
  const getVoteCounts = (candidate) => {
    if (typeof candidate.votes === 'number') {
      // Simple number format used by boundary channels
      return { local: candidate.votes, foreign: 0, total: candidate.votes };
    } else if (candidate.votes && typeof candidate.votes === 'object') {
      // Structured format { local, foreign }
      const local = candidate.votes.local || 0;
      const foreign = candidate.votes.foreign || 0;
      return { local, foreign, total: local + foreign };
    }
    return { local: 0, foreign: 0, total: 0 };
  };

  /**
   * Calculate vote percentages
   */
  const getVotePercentages = (candidate) => {
    const counts = getVoteCounts(candidate);
    
    if (counts.total === 0) return { local: 0, foreign: 0 };
    
    return {
      local: Math.round((counts.local / counts.total) * 100),
      foreign: Math.round((counts.foreign / counts.total) * 100)
    };
  };

  /**
   * Calculate dynamic card width (matches ChannelTopicRowPanelRefactored)
   */
  const calculateCardWidth = () => {
    if (!scrollContainerRef.current) return 240;
    const containerWidth = scrollContainerRef.current.offsetWidth;
    const candidateCount = candidates.length;
    
    if (candidateCount === 0) return 240;
    if (candidateCount === 1) return Math.min(500, containerWidth - 32);
    if (candidateCount === 2) return Math.min(380, (containerWidth - 48) / 2);
    if (candidateCount === 3) return Math.min(300, (containerWidth - 64) / 3);
    
    return Math.max(240, Math.min(280, (containerWidth - 64) / Math.min(candidateCount, 4)));
  };

  const officialCandidate = candidates.find(c => c.isOfficial || c.isDefault);
  const totalVotes = candidates.reduce((sum, c) => {
    const voteKey = `${channel.id}-${c.id}`;
    return sum + (voteCounts[voteKey] || 0);
  }, 0);

  // No channel selected
  if (!channel) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8'
      }}>
        <p>No boundary channel selected</p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      minHeight: '100%',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* CSS Styles - Match ChannelTopicRowPanelRefactored */}
      <style>{`
        .boundary-description::-webkit-scrollbar {
          width: 6px;
        }
        .boundary-description::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .boundary-description::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .boundary-description::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Edit Toolbar - Shows when editing */}
      {isEditing && (
        <div style={{
          width: '100%',
          height: '60px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0
        }}>
          {/* Left: Region info */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            maxWidth: '250px',
            overflow: 'hidden'
          }}>
            <span style={{ 
              color: '#a5b4fc', 
              fontSize: '14px', 
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              ✏️ Editing: {regionName}
            </span>
            <span style={{ 
              color: '#64748b', 
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}>
              📍 {nodeCount} nodes
            </span>
          </div>

          {/* Center: Editing instructions legend */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            alignItems: 'center',
            fontSize: '10px',
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 12px',
            borderRadius: '6px'
          }}>
            <span style={{ fontWeight: 600, color: '#6ee7b7' }}>✨ Quick Tips:</span>
            <span>👆 Click vertex → Move</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>⏱️ Hold → Multi-select</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>⏱️+vertex → Delete</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>📍 Click line → Add</span>
            <button
              onClick={() => onEditModeChange?.('edit')}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: 'none',
                color: '#6366f1',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                opacity: 0
              }}
            >
              (hidden)
            </button>
          </div>

          {/* Right: Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onConfirmEdit}
              disabled={nodeCount < 3}
              style={{
                padding: '8px 16px',
                background: nodeCount >= 3 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                border: nodeCount >= 3 ? '2px solid #22c55e' : '2px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '6px',
                color: nodeCount >= 3 ? '#4ade80' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: nodeCount >= 3 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: nodeCount >= 3 ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (nodeCount >= 3) {
                  e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (nodeCount >= 3) {
                  e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                }
              }}
            >
              ✓ Confirm
            </button>
            
            <button
              onClick={onCancelEdit}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '2px solid #ef4444',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Layout - Scrolling Cards + Right Sidebar */}
      <div style={{
        flex: 1,
        display: 'flex',
        height: '100%',
        width: '100%'
      }}>
        {/* LEFT SIDE - Scrolling Container */}
        <div 
          ref={scrollContainerRef}
          style={{
            flex: 1,
            background: 'transparent',
            height: '100%',
            minHeight: '100%',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            padding: '8px',
            overflowX: 'auto',
            overflowY: 'hidden',
            borderRadius: '0',
            border: 'none',
            position: 'relative',
            boxSizing: 'border-box',
          alignItems: 'stretch',
          scrollbarWidth: 'thin',
          scrollBehavior: 'smooth'
        }}
      >
        {candidates.length === 0 ? (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: '#94a3b8'
          }}>
            <p>No boundary proposals yet</p>
            <button 
              onClick={onProposeNew}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ➕ Propose First Boundary
            </button>
          </div>
        ) : (
          candidates.map((candidate, index) => {
            const position = index + 1;
            const nodeCount = candidate.location?.geometry?.coordinates?.[0]?.length || 0;
            const voteKey = `${channel.id}-${candidate.id}`;
            const voteCount = voteCounts[voteKey] || 0;
            const candidateVoteCounts = getVoteCounts(candidate);
            const votePercent = getVotePercentages(candidate);
            const isSelected = selectedCandidate?.id === candidate.id;
            const isOfficial = candidate.isOfficial || candidate.isDefault;
            const dynamicWidth = calculateCardWidth();
            
            // Enhanced description with boundary-specific data
            const boundaryDescription = `${candidate.description || ''}\n\n📍 Nodes: ${nodeCount.toLocaleString()}\n📏 Area: ${formatAreaDelta(candidate, officialCandidate)}\n\n🏠 Local Votes: ${candidateVoteCounts.local} (${votePercent.local}%)\n🌍 Foreign Votes: ${candidateVoteCounts.foreign} (${votePercent.foreign}%)`;

            return (
              <div
                key={candidate.id}
                onClick={(e) => {
                  // Only trigger if not clicking on button or interactive elements
                  if (e.target.closest('button') || e.target.closest('[data-interactive]')) {
                    return; // Let button handle its own click
                  }
                  handleCandidateClick(candidate);
                }}
                style={{
                  width: `${dynamicWidth}px`,
                  minWidth: '280px',
                  maxWidth: '400px',
                  flex: `0 0 ${dynamicWidth}px`,
                  minHeight: '100%',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 8,
                  border: isOfficial ? '2px solid #fbbf24' : isSelected ? '2px solid #6366f1' : '2px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 8px 25px rgba(99, 102, 241, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box'
                }}
              >
                {/* Position Badge - Official only */}
                {isOfficial && (
                  <div style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 32,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 'bold',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)'
                  }}>
                    🏆
                  </div>
                )}

                {/* Title - Inline with icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                  marginTop: isOfficial ? 0 : 8,
                  flexShrink: 0
                }}>
                  {!isOfficial && (
                    <div style={{
                      background: position === 1 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      #{position}
                    </div>
                  )}
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {candidate.name}
                  </div>
                  {isOfficial && (
                    <span style={{
                      background: 'rgba(251, 191, 36, 0.2)',
                      color: '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 600
                    }}>
                      CURRENT
                    </span>
                  )}
                </div>

                {/* Boundary Difference Preview (TODO) */}
                <div style={{
                  width: '100%',
                  height: '120px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 8,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#94a3b8',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {/* Boundary Difference Visualization */}
                  {previewImages[candidate.id]?.dataURL ? (
                    <img 
                      src={previewImages[candidate.id].dataURL} 
                      alt="Boundary Difference"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : isOfficial ? (
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>🗺️</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Official Boundary</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Generating preview...</div>
                    </div>
                  )}
                </div>

                {/* Description with Stats */}
                <div 
                  className="boundary-description"
                  style={{
                    fontSize: 11,
                    lineHeight: '1.4',
                    color: '#e2e8f0',
                    marginBottom: 8,
                    flexGrow: 1,
                    overflowY: 'auto',
                    minHeight: '80px',
                    maxHeight: '120px',
                    paddingRight: 4,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {boundaryDescription}
                </div>

                {/* Vote Stats and Button - Match CandidateCard */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                  minHeight: '60px',
                  flexShrink: 0,
                  paddingTop: '8px',
                  paddingRight: '44px', // Space for settings button
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#cccccc',
                    flexWrap: 'wrap'
                  }}>
                    <span>#{position}</span>
                    <span>•</span>
                    <span>{voteCount.toLocaleString()} votes</span>
                    <span>•</span>
                    <span>{totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote?.(candidate.id);
                      }}
                      style={{
                        background: isSelected ? '#00ff00' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isSelected ? '✓ Voted' : 'Vote'}
                    </button>
                    
                    {/* Options Button - Inline with vote button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOptions(expandedOptions === candidate.id ? null : candidate.id);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        borderRadius: '8px',
                        color: '#a5b4fc',
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      ⚙️
                    </button>
                  </div>
                </div>

                {/* Options Dropdown */}
                {expandedOptions === candidate.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: 48,
                      right: 8,
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '2px solid rgba(99, 102, 241, 0.5)',
                      borderRadius: 8,
                      padding: 8,
                      minWidth: 180,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <button
                      onClick={() => {
                        onEditBoundary?.(candidate);
                        setExpandedOptions(null);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontSize: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ✏️ Edit Boundary
                    </button>
                    <button
                      onClick={() => {
                        // TODO: View stats
                        setExpandedOptions(null);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontSize: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📊 View Statistics
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>

        {/* RIGHT SIDEBAR - Controls */}
        {candidates.length > 0 && (
          <div style={{
            width: '40px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0, 0, 0, 0.3)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0
          }}>
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
              style={{
                width: '100%',
                height: '40px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              title="Scroll Left"
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.2)';
              }}
            >
              ◀
            </button>
            
            {/* Add Candidate Button - Vertical, Full Height */}
            <button
              onClick={onProposeNew}
              style={{
                flex: 1,
                width: '100%',
                background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                border: 'none',
                borderTop: '1px solid rgba(34, 197, 94, 0.2)',
                borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                cursor: 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}
              title="Add Candidate"
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(180deg, rgba(34, 197, 94, 0.35), rgba(22, 163, 74, 0.35))';
                e.target.style.fontSize = '28px';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
                e.target.style.fontSize = '24px';
              }}
            >
              +
            </button>
            
            {/* Scroll Right Button */}
            <button
              onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
              style={{
                width: '100%',
                height: '40px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: 'none',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              title="Scroll Right"
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.2)';
              }}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoundaryChannelPanel;
