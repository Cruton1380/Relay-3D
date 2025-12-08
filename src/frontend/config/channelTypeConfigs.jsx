/**
 * @fileoverview Channel Type Configuration Registry
 * 
 * Central registry for all channel types and their specific behaviors.
 * Each channel type defines its unique rendering, actions, and handlers
 * while sharing the core voting and candidate display logic from BaseChannelPanel.
 * 
 * Adding a new channel type:
 * 1. Create a config object with required/optional properties
 * 2. Add to channelTypeRegistry export
 * 3. Test with BaseChannelPanel
 * 
 * @version 1.0
 * @date October 17, 2025
 */

import React from 'react';
import { 
  calculateArea, 
  formatAreaDelta, 
  getNodeCount, 
  zoomToBoundary,
  getPreviewBounds,
  createBoundaryDescription
} from '../utils/boundaryUtils';
import { generateAllPreviews, generatePlaceholderImage } from '../utils/BoundaryPreviewGenerator';

// ================================
// GLOBAL CHANNEL TYPE
// ================================
export const globalChannelConfig = {
  type: 'global',
  headerIcon: '🌍',
  emptyStateMessage: 'Click a global channel tower to view competition',
  noCandidatesMessage: 'No candidates found for this global channel.',

  /**
   * Render extra metadata in candidate card
   */
  renderMetadata: (candidate, channel) => {
    if (!candidate.location) return null;
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '8px',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        {candidate.location.city && candidate.location.country && (
          <span>📍 {candidate.location.city}, {candidate.location.country}</span>
        )}
      </div>
    );
  },

  /**
   * Render actions specific to global channels
   */
  renderActions: (candidate, channel, extraProps, expandedOptions, setExpandedOptions) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (candidate.location && window.cesiumViewer && window.Cesium) {
            window.cesiumViewer.camera.flyTo({
              destination: window.Cesium.Cartesian3.fromDegrees(
                candidate.location.lng,
                candidate.location.lat,
                50000 // 50km height
              ),
              duration: 1.5
            });
          }
        }}
        style={{
          marginTop: '8px',
          padding: '6px 12px',
          background: 'rgba(99, 102, 241, 0.2)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '6px',
          color: '#a5b4fc',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        📍 Show on Globe
      </button>
    );
  },

  /**
   * Action when candidate is selected
   */
  onCandidateSelect: (candidate, channel, extraProps) => {
    console.log('🌍 [Global] Candidate selected:', candidate.name);
    
    // Zoom to cube location if available
    if (window.cesiumViewer && window.Cesium && candidate.location) {
      window.cesiumViewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          candidate.location.lng,
          candidate.location.lat,
          50000
        ),
        duration: 1.5,
        orientation: {
          heading: window.Cesium.Math.toRadians(0),
          pitch: window.Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      });
    }
  },

  /**
   * Action after successful vote
   */
  onVoteSuccess: (candidateId, result, channel) => {
    console.log('✅ [Global] Vote recorded:', candidateId);
    // Could trigger cube animation or other visual feedback
  }
};

// ================================
// BOUNDARY CHANNEL TYPE
// ================================
export const boundaryChannelConfig = {
  type: 'boundary',
  headerIcon: '🗺️',
  emptyStateMessage: 'Select a boundary channel to view proposals',
  noCandidatesMessage: 'No boundary proposals yet. Click "Propose New" to create one.',

  /**
   * Process candidates (sort with official first)
   */
  processCandidates: (candidates, channel) => {
    const sorted = [...candidates].sort((a, b) => {
      // Official always first
      if (a.isOfficial || a.isDefault) return -1;
      if (b.isOfficial || b.isDefault) return 1;
      
      // Then by votes
      const aVotes = typeof a.votes === 'number' ? a.votes : (a.votes?.total || 0);
      const bVotes = typeof b.votes === 'number' ? b.votes : (b.votes?.total || 0);
      return bVotes - aVotes;
    });
    
    return sorted;
  },

  /**
   * Custom description formatting
   */
  formatDescription: (candidate, channel) => {
    const officialCandidate = channel.candidates?.find(c => c.isOfficial || c.isDefault);
    return createBoundaryDescription(candidate, officialCandidate);
  },

  /**
   * Render boundary-specific metadata (area, nodes, etc.)
   */
  renderMetadata: (candidate, channel, extraProps) => {
    const nodeCount = getNodeCount(candidate.location?.geometry);
    const area = calculateArea(candidate.location?.geometry);
    const officialCandidate = channel.candidates?.find(c => c.isOfficial || c.isDefault);
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '8px',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <span>📏 Area: {formatAreaDelta(candidate, officialCandidate)}</span>
        <span>📍 Nodes: {nodeCount.toLocaleString()}</span>
        
        {candidate.areaChange && (
          <span style={{
            color: candidate.areaChange.deltaArea >= 0 ? '#ef4444' : '#3b82f6',
            fontWeight: 600
          }}>
            {candidate.areaChange.deltaArea >= 0 ? '+' : ''}
            {candidate.areaChange.deltaPercent.toFixed(2)}% area change
          </span>
        )}
      </div>
    );
  },

  /**
   * Render boundary difference preview
   */
  renderPreview: (candidate, channel, extraProps) => {
    const previewImages = extraProps.previewImages || {};
    const isOfficial = candidate.isOfficial || candidate.isDefault;
    
    return (
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
        overflow: 'hidden'
      }}>
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
    );
  },

  /**
   * Render boundary-specific actions
   */
  renderActions: (candidate, channel, extraProps, expandedOptions, setExpandedOptions) => {
    const { onEditBoundary } = extraProps;
    
    return (
      <div style={{ position: 'relative', marginTop: '8px' }}>
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
            justifyContent: 'center'
          }}
        >
          ⚙️
        </button>

        {/* Options Dropdown */}
        {expandedOptions === candidate.id && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 40,
              right: 0,
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
                // View statistics
                console.log('📊 View statistics for:', candidate.name);
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
  },

  /**
   * Action when boundary candidate is selected
   */
  onCandidateSelect: (candidate, channel, extraProps) => {
    console.log('🗺️ [Boundary] Candidate selected:', candidate.name);
    
    // Zoom to boundary area
    const previewImages = extraProps.previewImages || {};
    const preview = previewImages[candidate.id];
    
    if (preview?.bounds && window.cesiumViewer) {
      const { center, maxRange } = preview.bounds;
      const height = maxRange * 200000;
      
      window.cesiumViewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          center.lng,
          center.lat,
          Math.max(height, 50000)
        ),
        duration: 1.5,
        orientation: {
          heading: 0,
          pitch: window.Cesium.Math.toRadians(-45),
          roll: 0
        }
      });
    } else if (candidate.location?.geometry) {
      // Fallback: zoom to geometry bounds
      zoomToBoundary(candidate.location.geometry);
    }
  },

  /**
   * Action after successful vote
   */
  onVoteSuccess: (candidateId, result, channel) => {
    console.log('✅ [Boundary] Vote recorded:', candidateId);
    // Refresh boundary rendering if needed
  },

  /**
   * Data loaded callback - generate previews
   */
  onDataLoaded: (channels, voteCounts, userVotes) => {
    // Preview generation handled by parent component
    console.log('📊 [Boundary] Data loaded:', channels.length, 'channels');
  },

  /**
   * Render extra UI (e.g., editing toolbar, sidebar)
   */
  renderExtraUI: (channel, selectedCandidate, extraProps) => {
    const { 
      isEditing, 
      onProposeNew, 
      onCancelEdit, 
      onConfirmEdit,
      nodeCount,
      editMode,
      onEditModeChange,
      regionName
    } = extraProps;

    return (
      <>
        {/* Editing Toolbar */}
        {isEditing && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 100
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#a5b4fc',
              fontSize: '14px'
            }}>
              <span>✏️ Editing: {regionName}</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>📍 {nodeCount} nodes</span>
            </div>

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
                  opacity: nodeCount >= 3 ? 1 : 0.5
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
                  cursor: 'pointer'
                }}
              >
                ✗ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sidebar with "Propose New" button */}
        {!isEditing && onProposeNew && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button
              onClick={onProposeNew}
              style={{
                flex: 1,
                background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                border: 'none',
                color: '#4ade80',
                cursor: 'pointer',
                fontSize: '24px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              title="Propose New Boundary"
            >
              +
            </button>
          </div>
        )}
      </>
    );
  }
};

// ================================
// PROXIMITY CHANNEL TYPE
// ================================
export const proximityChannelConfig = {
  type: 'proximity',
  headerIcon: '📍',
  emptyStateMessage: 'Click a proximity channel to view local competition',
  noCandidatesMessage: 'No candidates found for this proximity channel.',

  /**
   * Render proximity-specific metadata
   */
  renderMetadata: (candidate, channel) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '8px',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        {candidate.location?.city && (
          <span>🏙️ {candidate.location.city}</span>
        )}
        {candidate.radius && (
          <span>📏 {candidate.radius} km radius</span>
        )}
      </div>
    );
  },

  /**
   * Render proximity-specific actions
   */
  renderActions: (candidate, channel) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (candidate.location && window.cesiumViewer && window.Cesium) {
            window.cesiumViewer.camera.flyTo({
              destination: window.Cesium.Cartesian3.fromDegrees(
                candidate.location.lng,
                candidate.location.lat,
                20000 // Closer zoom for proximity
              ),
              duration: 1.5
            });
          }
        }}
        style={{
          marginTop: '8px',
          padding: '6px 12px',
          background: 'rgba(99, 102, 241, 0.2)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '6px',
          color: '#a5b4fc',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        📍 Show Zone
      </button>
    );
  },

  /**
   * Action when proximity candidate is selected
   */
  onCandidateSelect: (candidate, channel) => {
    console.log('📍 [Proximity] Candidate selected:', candidate.name);
    
    // Zoom to proximity zone
    if (window.cesiumViewer && window.Cesium && candidate.location) {
      window.cesiumViewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          candidate.location.lng,
          candidate.location.lat,
          20000
        ),
        duration: 1.5,
        orientation: {
          heading: 0,
          pitch: window.Cesium.Math.toRadians(-45),
          roll: 0
        }
      });
    }
  },

  /**
   * Action after successful vote
   */
  onVoteSuccess: (candidateId, result, channel) => {
    console.log('✅ [Proximity] Vote recorded:', candidateId);
  }
};

// ================================
// CHANNEL TYPE REGISTRY
// ================================
export const channelTypeRegistry = {
  'global': globalChannelConfig,
  'boundary': boundaryChannelConfig,
  'proximity': proximityChannelConfig,
  
  // Future channel types:
  // 'regional': regionalChannelConfig,
  // 'temporal': temporalChannelConfig,
  // 'environmental': environmentalChannelConfig,
  // ... up to 10 types
};

/**
 * Get configuration for a channel type
 * @param {string} channelType - Channel type identifier
 * @returns {Object} Channel configuration object
 */
export const getChannelConfig = (channelType) => {
  return channelTypeRegistry[channelType] || channelTypeRegistry['global'];
};

/**
 * Get configuration from channel object
 * @param {Object} channel - Channel object
 * @returns {Object} Channel configuration object
 */
export const getChannelConfigFromChannel = (channel) => {
  const type = channel?.type || channel?.category || 'global';
  return getChannelConfig(type);
};

export default {
  globalChannelConfig,
  boundaryChannelConfig,
  proximityChannelConfig,
  channelTypeRegistry,
  getChannelConfig,
  getChannelConfigFromChannel
};
