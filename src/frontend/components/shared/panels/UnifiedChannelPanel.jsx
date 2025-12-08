/**
 * @fileoverview Unified Channel Panel Wrapper
 * 
 * Provides a single entry point for all channel types using BaseChannelPanel.
 * Automatically selects the appropriate configuration based on channel type.
 * 
 * This component acts as a drop-in replacement for:
 * - ChannelInfoPanel (global/regional/proximity channels)
 * - BoundaryChannelPanel (boundary channels)
 * 
 * @version 1.0
 * @date October 17, 2025
 */

import React, { useState, useEffect } from 'react';
import BaseChannelPanel from './BaseChannelPanel';
import { getChannelConfigFromChannel } from '../../../config/channelTypeConfigs.jsx';
import { generateAllPreviews } from '../../../utils/BoundaryPreviewGenerator';

/**
 * UnifiedChannelPanel - Automatic channel type detection and configuration
 * 
 * @param {Object} props - Component props
 * @param {Object} props.panel - Panel configuration
 * @param {Object} props.globeState - Global state
 * @param {Function} props.setGlobeState - Global state setter
 * @param {Object} props.layout - Layout configuration
 * @param {Function} props.updatePanel - Panel update callback
 * 
 * Additional boundary-specific props (when applicable):
 * @param {Function} props.onEditBoundary - Boundary edit handler
 * @param {Function} props.onProposeNew - Propose new boundary handler
 * @param {Function} props.onSelectCandidate - Candidate selection handler
 * @param {Function} props.onVote - Vote submission handler
 * @param {Object} props.currentUser - Current user
 * @param {boolean} props.isEditing - Editing mode flag
 * @param {string} props.editMode - Edit mode type
 * @param {Function} props.onEditModeChange - Edit mode change handler
 * @param {number} props.nodeCount - Node count for editing
 * @param {Function} props.onConfirmEdit - Confirm edit handler
 * @param {Function} props.onCancelEdit - Cancel edit handler
 * @param {string} props.regionName - Region name for editing
 * @param {string} props.regionType - Region type
 */
const UnifiedChannelPanel = (props) => {
  const {
    panel,
    globeState,
    setGlobeState,
    layout,
    updatePanel,
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
    onCancelEdit,
    regionName,
    regionType
  } = props;

  const channel = globeState?.selectedChannel;
  const [previewImages, setPreviewImages] = useState({});

  // Get channel-specific configuration
  const channelConfig = channel ? getChannelConfigFromChannel(channel) : null;

  // Generate boundary previews for boundary channels
  useEffect(() => {
    if (channel && (channel.type === 'boundary' || channel.category === 'boundary')) {
      const candidates = channel.candidates || [];
      const officialCandidate = candidates.find(c => c.isOfficial || c.isDefault);
      
      if (officialCandidate && candidates.length > 0) {
        console.log('🖼️ [UnifiedChannelPanel] Generating boundary previews...');
        const previews = generateAllPreviews(candidates, officialCandidate);
        setPreviewImages(previews);
        console.log('✅ [UnifiedChannelPanel] Generated', Object.keys(previews).length, 'previews');
      }
    }
  }, [channel]);

  // No channel selected
  if (!channel) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#6b7280',
        fontSize: '13px'
      }}>
        Click a channel to view competition
      </div>
    );
  }

  // No config found (shouldn't happen with fallback)
  if (!channelConfig) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#ef4444',
        fontSize: '13px'
      }}>
        Unknown channel type: {channel.type || channel.category}
      </div>
    );
  }

  // Prepare extra props for channel-specific features
  const extraProps = {
    // Boundary-specific props
    onEditBoundary,
    onProposeNew,
    previewImages,
    isEditing,
    editMode,
    onEditModeChange,
    nodeCount,
    onConfirmEdit,
    onCancelEdit,
    regionName,
    regionType
  };

  return (
    <BaseChannelPanel
      channel={channel}
      channelTypeConfig={channelConfig}
      globeState={globeState}
      setGlobeState={setGlobeState}
      layout={layout}
      updatePanel={updatePanel}
      onCandidateSelect={onSelectCandidate}
      onVote={onVote}
      currentUser={currentUser}
      {...extraProps}
    />
  );
};

export default UnifiedChannelPanel;
