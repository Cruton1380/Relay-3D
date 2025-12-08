/**
 * Channel Info Panel - Enhanced Channel Competition Interface
 * Shows full candidate competition when a channel tower is clicked on the globe
 * Integrates with voting system and blockchain backend
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoteButton from '../ui/VoteButton';

const DEMO_USER_ID = 'demo-user-1';

const ChannelInfoPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [allChannels, setAllChannels] = useState([]); // all channel data
  const [userVotes, setUserVotes] = useState({}); // userVotes[channelId] = candidateId
  const [voteCounts, setVoteCounts] = useState({}); // voteCounts[`${channelId}-${candidateId}`] = count
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const channel = globeState.selectedChannel;

  // Load all channels and vote counts on mount
  const loadAllChannelsAndVotes = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all channels
      let response = await fetch(`http://localhost:3002/api/channels`);
      let data = await response.json();
      if (data.success && data.channels) {
        setAllChannels(data.channels);
        // Build voteCounts and userVotes for all channels
        const counts = {};
        const userVotesTemp = {};
        await Promise.all(data.channels.map(async (ch) => {
          await Promise.all((ch.candidates || []).map(async (candidate) => {
            const voteKey = `${ch.id}-${candidate.id}`;
            try {
              const countResponse = await fetch(`http://localhost:3002/api/vote/counts/candidate/${ch.id}/${candidate.id}`);
              const countData = await countResponse.json();
              console.log(`🗳️ Loading vote count for ${candidate.name} in ${ch.name}:`, countData);
              if (countData.success) {
                counts[voteKey] = countData.voteCount;
                if (countData.isUserVote) {
                  userVotesTemp[ch.id] = candidate.id;
                }
              } else {
                console.log(`⚠️ Vote count API failed for ${candidate.name}, using fallback:`, candidate.voteCount || 0);
                counts[voteKey] = candidate.voteCount || 0;
              }
            } catch (error) {
              console.log(`❌ Error loading vote count for ${candidate.name}:`, error);
              counts[voteKey] = candidate.voteCount || 0;
            }
          }));
        }));
        setVoteCounts(counts);
        setUserVotes(userVotesTemp);
      }
    } catch (error) {
      console.error('Failed to load channels/candidates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllChannelsAndVotes();
  }, [loadAllChannelsAndVotes]);

  // Refresh vote counts when channel data changes
  useEffect(() => {
    if (channel && allChannels.length > 0) {
      console.log('🔄 Channel data changed, refreshing vote counts...');
      loadAllChannelsAndVotes();
    }
  }, [channel?.id, allChannels.length]);

  // handleVote logic
  const handleVote = async (channelId, candidateId) => {
    const voteKey = `${channelId}-${candidateId}`;
    if (loading) return;
    if (userVotes[channelId] === candidateId) return;
    try {
      const previousCandidate = userVotes[channelId];
      setUserVotes(prev => ({ ...prev, [channelId]: candidateId }));
      // Submit vote to backend
      const voteData = {
        channelId: channelId,
        candidateId: candidateId,
        userId: DEMO_USER_ID,
        action: 'vote'
      };
              const response = await fetch('http://localhost:3002/api/vote/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vote submission failed: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        // Update the new candidate's vote count
        if (result.newCount !== undefined) {
          setVoteCounts(prev => ({ ...prev, [voteKey]: result.newCount }));
        }
        // If vote switching occurred, update previous candidate's count
        if (result.switched && result.previousCandidate) {
          const prevCandidateKey = `${channelId}-${result.previousCandidate}`;
          try {
            const prevResponse = await fetch(`http://localhost:3002/api/vote/counts/candidate/${channelId}/${result.previousCandidate}`);
            if (prevResponse.ok) {
              const prevResult = await prevResponse.json();
              if (prevResult.success) {
                setVoteCounts(prev => ({ ...prev, [prevCandidateKey]: prevResult.voteCount }));
              }
            }
          } catch (err) {
            // Ignore
          }
        }
      }
      window.dispatchEvent(new CustomEvent('voteSubmitted', { detail: { channelId, candidateId, result } }));
    } catch (err) {
      setUserVotes(prev => {
        const copy = { ...prev };
        if (copy[channelId] === candidateId) delete copy[channelId];
        return copy;
      });
      // Optionally reload all data
      await loadAllChannelsAndVotes();
      alert(`Failed to register vote: ${err.message}. Please try again.`);
    }
  };

  if (!channel) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: '13px' }}>
        Click a channel tower to view competition
      </div>
    );
  }

  // Find the selected channel's candidates from allChannels
  const selectedChannel = allChannels.find(c => c.id === channel.id);
  const candidates = selectedChannel ? selectedChannel.candidates || [] : [];

  const getTotalVotes = (candidate) => (candidate.testVotes || 0) + (candidate.realVotes || 0);

  return (
    <div className="channel-info-panel" style={{ height: '100%', overflowY: 'auto' }}>
      {/* Channel Header */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(75, 85, 99, 0.3)', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📡 {channel.name || 'Unknown Channel'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#9ca3af' }}>
          <span>👥 {candidates.length} candidates</span>
          <span>🗳️ {candidates.reduce((sum, candidate) => {
            const voteKey = `${channel.id}-${candidate.id}`;
            return sum + (Number(voteCounts[voteKey]) || Number(candidate.voteCount) || 0);
          }, 0)} total votes</span>
          {channel.scope && (
            <span style={{ padding: '2px 6px', background: channel.scope === 'global' ? 'rgba(239, 68, 68, 0.2)' : channel.scope === 'regional' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)', borderRadius: '3px', textTransform: 'capitalize', fontSize: '10px' }}>{channel.scope}</span>
          )}
        </div>
      </div>
      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#6b7280', fontSize: '12px' }}>
          Loading candidates...
        </div>
      )}
      {/* Candidate Competition Interface - Horizontal Scrollable Row */}
      {!loading && candidates.length > 0 && (
        <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '8px 0' }} ref={scrollRef}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', minWidth: '100%' }}>
            {candidates.map((candidate, index) => {
              const voteKey = `${channel.id}-${candidate.id}`;
              const isVoted = userVotes[channel.id] === candidate.id;
              const currentVoteCount = Number(voteCounts[voteKey]) || Number(candidate.voteCount) || 0;
              console.log(`📊 Displaying vote count for ${candidate.name}:`, {
                voteKey,
                voteCountsFromAPI: voteCounts[voteKey],
                candidateVoteCount: candidate.voteCount,
                finalCount: currentVoteCount
              });
              return (
                <div key={candidate.id} style={{ minWidth: 260, maxWidth: 280, background: isVoted ? 'rgba(59, 130, 246, 0.12)' : 'rgba(31, 41, 55, 0.5)', border: isVoted ? '2px solid #3b82f6' : '2px solid rgba(75, 85, 99, 0.2)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', boxShadow: isVoted ? '0 2px 12px rgba(59,130,246,0.08)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: '#3b82f6' }}>#{index + 1}</span>
                      <span style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{candidate.name}</span>
                    </div>
                    {/* Candidate Type Icon */}
                    <div style={{ fontSize: 16, opacity: 0.8 }}>
                      {(() => {
                        console.log('🔍 ChannelInfoPanel Candidate type debug:', {
                          name: candidate.name,
                          type: candidate.type,
                          scope: candidate.scope,
                          channelType: channel?.type,
                          channelCategory: channel?.category
                        });
                        
                        if (candidate.type === 'proximity') return '📍';
                        if (candidate.type === 'regional') return '🏛️';
                        if (candidate.type === 'global') return '🌍';
                        if (candidate.scope === 'proximity') return '📍';
                        if (candidate.scope === 'regional') return '🏛️';
                        if (candidate.scope === 'global') return '🌍';
                        
                        // Fallback based on channel type
                        if (channel?.type === 'proximity' || channel?.category === 'proximity') return '📍';
                        if (channel?.type === 'regional' || channel?.category === 'regional') return '🏛️';
                        if (channel?.type === 'global' || channel?.category === 'global') return '🌍';
                        
                        return '📍'; // Default to proximity
                      })()}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{candidate.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700 }}>{currentVoteCount.toLocaleString()} votes</span>
                    {candidate.trend && (
                      <span style={{ fontSize: 13, color: candidate.trend === 'Rising' ? '#10b981' : candidate.trend === 'Falling' ? '#ef4444' : '#6b7280' }}>
                        {candidate.trend === 'Rising' ? '📈' : candidate.trend === 'Falling' ? '📉' : '➡️'} {candidate.trend}
                      </span>
                    )}
                  </div>
                  <VoteButton
                    id={voteKey}
                    channelId={channel.id}
                    candidateId={candidate.id}
                    isVoted={isVoted}
                    onVote={() => handleVote(channel.id, candidate.id)}
                    disabled={loading}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* No Candidates State */}
      {!loading && candidates.length === 0 && (
        <div style={{ color: '#6b7280', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
          No candidates found for this channel.
        </div>
      )}
    </div>
  );
};

export default ChannelInfoPanel;
