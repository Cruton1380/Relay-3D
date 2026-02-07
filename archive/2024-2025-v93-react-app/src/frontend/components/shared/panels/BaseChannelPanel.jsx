/**
 * @fileoverview BaseChannelPanel - Universal Channel Ranking & Voting Interface
 * 
 * A compositional panel component that supports ALL channel types through configuration.
 * Eliminates code duplication by centralizing shared logic for voting, candidate display,
 * and UI rendering while allowing channel-specific customization through config objects.
 * 
 * Features:
 * - Unified vote submission to blockchain
 * - Consistent candidate card rendering
 * - Extensible through channelTypeConfig
 * - Supports 10+ channel types with minimal code overhead
 * 
 * @version 1.0
 * @date October 17, 2025
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoteButton from '../../workspace/ui/VoteButton';
import {
  loadAllChannelsAndVotes,
  handleVoteSubmission,
  calculateVotePercentage,
  formatNumber,
  getCandidateTypeIcon,
  sortCandidatesByVotes,
  calculateCardWidth,
  DEMO_USER_ID
} from '../../../utils/channelPanelUtils';

/**
 * BaseChannelPanel Component
 * 
 * @param {Object} props
 * @param {Object} props.channel - Selected channel object
 * @param {Object} props.channelTypeConfig - Channel-specific configuration (from registry)
 * @param {Object} props.globeState - Global state object
 * @param {Function} props.setGlobeState - Global state setter
 * @param {Function} props.updatePanel - Panel update callback
 * @param {Object} props.layout - Layout configuration
 * @param {Function} props.onCandidateSelect - Callback when candidate is selected
 * @param {Function} props.onVote - Callback when vote is submitted
 * @param {Object} props.currentUser - Current user object
 * @param {Object} props.extraProps - Additional channel-specific props
 */
const BaseChannelPanel = ({
  channel,
  channelTypeConfig = {},
  globeState,
  setGlobeState,
  updatePanel,
  layout,
  onCandidateSelect,
  onVote,
  currentUser,
  ...extraProps
}) => {
  const [allChannels, setAllChannels] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [voteCounts, setVoteCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState(null);
  const scrollContainerRef = useRef(null);

  // ===== SHARED: Load all channels and vote data =====
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { channels, voteCounts: counts, userVotes: votes } = await loadAllChannelsAndVotes();
      setAllChannels(channels);
      setVoteCounts(counts);
      setUserVotes(votes);
      
      // Trigger channel-specific data processing
      if (channelTypeConfig.onDataLoaded) {
        channelTypeConfig.onDataLoaded(channels, counts, votes);
      }
    } catch (error) {
      console.error('Failed to load channel data:', error);
    } finally {
      setLoading(false);
    }
  }, [channelTypeConfig]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== SHARED: Initialize vote counts immediately when channel opens =====
  useEffect(() => {
    if (!channel) return;
    
    // Try to find full channel data with candidates from allChannels
    const fullChannel = allChannels.find(c => c.id === channel.id) || channel;
    const candidates = fullChannel.candidates || channel.candidates;
    
    if (!candidates || candidates.length === 0) {
      console.log(`⚠️ [Immediate Init] No candidates found for channel ${channel.id}`);
      return;
    }
    
    const immediateVoteCounts = {};
    candidates.forEach(candidate => {
      const voteKey = `${channel.id}-${candidate.id}`;
      const immediateVoteCount = candidate.initialVotes || candidate.voteCount || candidate.votes;
      if (immediateVoteCount !== undefined && immediateVoteCount > 0) {
        immediateVoteCounts[voteKey] = immediateVoteCount;
        console.log(`🚀 [Immediate Init] ${candidate.name || candidate.id}: ${immediateVoteCount} votes`);
      }
    });
    
    // Set initial vote counts before API loads
    if (Object.keys(immediateVoteCounts).length > 0) {
      setVoteCounts(prev => ({ ...immediateVoteCounts, ...prev }));
      console.log(`✅ [Immediate Init] Set ${Object.keys(immediateVoteCounts).length} vote counts immediately`);
    }
  }, [channel?.id, allChannels]); // Run when channel or allChannels changes

  // ===== SHARED: Process candidates from channel =====
  useEffect(() => {
    if (!channel) {
      setCandidates([]);
      setSelectedCandidate(null);
      return;
    }

    // Find channel candidates
    const selectedChannel = allChannels.find(c => c.id === channel.id);
    let rawCandidates = selectedChannel?.candidates || channel.candidates || [];

    // Apply channel-specific candidate processing
    if (channelTypeConfig.processCandidates) {
      rawCandidates = channelTypeConfig.processCandidates(rawCandidates, channel);
    }

    // Sort by votes (default behavior, can be overridden)
    const sortedCandidates = channelTypeConfig.disableDefaultSort
      ? rawCandidates
      : sortCandidatesByVotes(rawCandidates, voteCounts, channel.id);

    setCandidates(sortedCandidates);

    // Auto-select winning candidate
    if (sortedCandidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(sortedCandidates[0]);
      onCandidateSelect?.(sortedCandidates[0]);
    }
  }, [channel, allChannels, voteCounts, channelTypeConfig, selectedCandidate, onCandidateSelect]);

  // ===== SHARED: Handle vote submission =====
  const handleVote = async (channelId, candidateId) => {
    if (loading) return;
    if (userVotes[channelId] === candidateId) return;

    const success = await handleVoteSubmission(
      channelId,
      candidateId,
      userVotes,
      voteCounts,
      setUserVotes,
      setVoteCounts,
      (chId, candId, result) => {
        // Success callback
        console.log('✅ Vote successful:', { chId, candId, result });
        
        // Trigger channel-specific vote success handler
        if (channelTypeConfig.onVoteSuccess) {
          channelTypeConfig.onVoteSuccess(candId, result, channel);
        }
        
        // Trigger parent callback
        if (onVote) {
          onVote(candId);
        }
      },
      (error) => {
        // Error callback
        console.error('❌ Vote failed:', error);
        alert(`Failed to register vote: ${error.message}. Please try again.`);
      }
    );

    // Note: We don't call loadData() here anymore because handleVoteSubmission
    // already handles optimistic updates with the actual vote counts from the server.
    // Calling loadData() here was causing race conditions where stale data would
    // overwrite the fresh vote counts.
  };

  // ===== SHARED: Handle candidate selection =====
  const handleCandidateClick = (candidate) => {
    console.log('🎯 [BaseChannelPanel] Candidate clicked:', candidate.name);
    setSelectedCandidate(candidate);
    
    // Trigger parent callback
    if (onCandidateSelect) {
      onCandidateSelect(candidate);
    }
    
    // Trigger channel-specific selection handler
    if (channelTypeConfig.onCandidateSelect) {
      channelTypeConfig.onCandidateSelect(candidate, channel, extraProps);
    }
  };

  // ===== SHARED: Calculate dynamic card width =====
  const dynamicCardWidth = scrollContainerRef.current
    ? calculateCardWidth(scrollContainerRef.current.offsetWidth, candidates.length)
    : 280;

  // ===== SHARED: Calculate total votes =====
  const totalVotes = candidates.reduce((sum, c) => {
    const voteKey = `${channel?.id}-${c.id}`;
    return sum + (Number(voteCounts[voteKey]) || Number(c.voteCount) || 0);
  }, 0);

  // ===== RENDER: No channel selected =====
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
        {channelTypeConfig.emptyStateMessage || 'Click a channel to view competition'}
      </div>
    );
  }

  // ===== RENDER: Loading state =====
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#6b7280',
        fontSize: '12px'
      }}>
        Loading candidates...
      </div>
    );
  }

  // ===== RENDER: Main panel =====
  return (
    <div className="base-channel-panel" style={{ height: '100%', overflowY: 'auto' }}>
      {/* EXTENSIBLE: Pre-header content (e.g., editing toolbar) */}
      {channelTypeConfig.renderPreHeader?.(channel, extraProps)}

      {/* SHARED: Channel Header */}
      <div style={{
        marginBottom: '16px',
        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
        paddingBottom: '12px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {channelTypeConfig.headerIcon || '📡'} {channel.name || 'Unknown Channel'}
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: '#9ca3af'
        }}>
          <span>👥 {candidates.length} candidates</span>
          <span>🗳️ {formatNumber(totalVotes)} total votes</span>
          
          {/* EXTENSIBLE: Extra header metadata */}
          {channelTypeConfig.renderHeaderMetadata?.(channel, candidates)}
          
          {channel.scope && (
            <span style={{
              padding: '2px 6px',
              background: channel.scope === 'global' 
                ? 'rgba(239, 68, 68, 0.2)' 
                : channel.scope === 'regional' 
                ? 'rgba(245, 158, 11, 0.2)' 
                : 'rgba(59, 130, 246, 0.2)',
              borderRadius: '3px',
              textTransform: 'capitalize',
              fontSize: '10px'
            }}>
              {channel.scope}
            </span>
          )}
        </div>
      </div>

      {/* SHARED: Candidates Container */}
      {candidates.length > 0 ? (
        <div style={{
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '8px 0'
        }} ref={scrollContainerRef}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            minWidth: '100%'
          }}>
            {candidates.map((candidate, index) => {
              const voteKey = `${channel.id}-${candidate.id}`;
              const isVoted = userVotes[channel.id] === candidate.id;
              
              // Get vote count with proper fallback chain
              const voteCountFromState = voteCounts[voteKey];
              const candidateVoteCount = candidate.voteCount;
              const candidateInitialVotes = candidate.initialVotes;
              const candidateVotes = candidate.votes;
              const currentVoteCount = Number(voteCountFromState) || Number(candidateVoteCount) || Number(candidateInitialVotes) || Number(candidateVotes) || 0;
              
              // Log vote count resolution for debugging
              if (index === 0) {
                console.log('📊 [Vote Display]', {
                  candidateId: candidate.id,
                  voteKey,
                  voteCountFromState,
                  candidateVoteCount,
                  candidateInitialVotes,
                  candidateVotes,
                  finalCount: currentVoteCount
                });
              }
              
              const votePercentage = calculateVotePercentage(candidate, candidates, voteCounts, channel.id);
              const typeIcon = getCandidateTypeIcon(candidate, channel);

              return (
                <div
                  key={candidate.id}
                  onClick={(e) => {
                    // Only trigger if not clicking button
                    if (e.target.closest('button') || e.target.closest('[data-interactive]')) {
                      return;
                    }
                    handleCandidateClick(candidate);
                  }}
                  style={{
                    minWidth: dynamicCardWidth,
                    maxWidth: dynamicCardWidth + 20,
                    background: isVoted 
                      ? 'rgba(59, 130, 246, 0.12)' 
                      : 'rgba(31, 41, 55, 0.5)',
                    border: isVoted 
                      ? '2px solid #3b82f6' 
                      : '2px solid rgba(75, 85, 99, 0.2)',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    position: 'relative',
                    boxShadow: isVoted 
                      ? '0 2px 12px rgba(59,130,246,0.08)' 
                      : '0 1px 4px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Position Badge & Title */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: '#3b82f6'
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#fff'
                      }}>
                        {candidate.name}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, opacity: 0.8 }}>
                      {typeIcon}
                    </div>
                  </div>

                  {/* EXTENSIBLE: Channel-specific preview/image */}
                  {channelTypeConfig.renderPreview?.(candidate, channel, extraProps)}

                  {/* Description */}
                  <div style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginBottom: 8,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                  }}>
                    {channelTypeConfig.formatDescription 
                      ? channelTypeConfig.formatDescription(candidate, channel)
                      : candidate.description}
                  </div>

                  {/* EXTENSIBLE: Channel-specific metadata */}
                  {channelTypeConfig.renderMetadata?.(candidate, channel, extraProps)}

                  {/* Vote Stats */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8
                  }}>
                    <span style={{
                      fontSize: 13,
                      color: '#3b82f6',
                      fontWeight: 700
                    }}>
                      {formatNumber(currentVoteCount)} votes
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: '#6b7280'
                    }}>
                      ({votePercentage}%)
                    </span>
                    {candidate.trend && (
                      <span style={{
                        fontSize: 13,
                        color: candidate.trend === 'Rising' 
                          ? '#10b981' 
                          : candidate.trend === 'Falling' 
                          ? '#ef4444' 
                          : '#6b7280'
                      }}>
                        {candidate.trend === 'Rising' ? '📈' : candidate.trend === 'Falling' ? '📉' : '➡️'} {candidate.trend}
                      </span>
                    )}
                  </div>

                  {/* Vote Button */}
                  <VoteButton
                    id={voteKey}
                    channelId={channel.id}
                    candidateId={candidate.id}
                    isVoted={isVoted}
                    onVote={() => handleVote(channel.id, candidate.id)}
                    disabled={loading}
                  />

                  {/* EXTENSIBLE: Channel-specific actions */}
                  {channelTypeConfig.renderActions?.(
                    candidate, 
                    channel, 
                    extraProps,
                    expandedOptions,
                    setExpandedOptions
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          color: '#6b7280',
          fontSize: '13px',
          padding: '20px',
          textAlign: 'center'
        }}>
          {channelTypeConfig.noCandidatesMessage || 'No candidates found for this channel.'}
        </div>
      )}

      {/* EXTENSIBLE: Extra UI sections (e.g., sidebar controls) */}
      {channelTypeConfig.renderExtraUI?.(channel, selectedCandidate, extraProps)}
    </div>
  );
};

export default BaseChannelPanel;
