/**
 * Voting Panel - Vote Management & Rankings
 * Integrates with the full voting system
 */
import React, { useState, useEffect, useCallback } from 'react';
import { channelAPI, voteAPI } from '../services/apiClient.js';

const VotingPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [activeTab, setActiveTab] = useState('vote');
  const [candidates, setCandidates] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  
  // Load user votes from localStorage on initialization
  const loadUserVotesFromStorage = () => {
    try {
      const stored = localStorage.getItem('relay_user_votes');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading user votes from localStorage:', error);
    }
    return new Map();
  };
  
  const [userVotes, setUserVotes] = useState(loadUserVotesFromStorage());

  // Load candidates and vote counts
  const loadCandidatesAndVotes = useCallback(async () => {
    const channels = await channelAPI.getChannels();
    setCandidates(channels);
    const counts = {};
    for (const channel of channels) {
      try {
        const vc = await voteAPI.getVoteCounts(channel.id);
        counts[channel.id] = vc;
      } catch (e) {
        counts[channel.id] = { votes: 0 };
      }
    }
    setVoteCounts(counts);
  }, []);

  useEffect(() => {
    loadCandidatesAndVotes();
    // Listen for voteSubmitted events
    const onVote = (e) => {
      loadCandidatesAndVotes();
    };
    window.addEventListener('voteSubmitted', onVote);
    return () => window.removeEventListener('voteSubmitted', onVote);
  }, [loadCandidatesAndVotes]);

  const handleVote = (channelId, voteType) => {
    setUserVotes(prev => {
      const newVotes = new Map(prev);
      const currentVote = newVotes.get(channelId);
      if (currentVote === voteType) {
        newVotes.delete(channelId);
      } else {
        newVotes.set(channelId, voteType);
      }
      
      // Persist to localStorage
      try {
        const votesObj = Object.fromEntries(newVotes);
        localStorage.setItem('relay_user_votes', JSON.stringify(votesObj));
      } catch (error) {
        console.error('Error saving user votes to localStorage:', error);
      }
      
      return newVotes;
    });
    // Optionally, trigger backend vote here
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const renderVoteTab = () => (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Current Topics
        </h3>
        <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
          Vote on active proposals and topics in your area
        </p>
      </div>
      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {candidates.map(candidate => {
          const userVote = userVotes.get(candidate.id);
          const votes = voteCounts[candidate.id]?.votes || candidate.votes || 0;
          return (
            <div
              key={candidate.id}
              style={{
                padding: '10px',
                marginBottom: '8px',
                background: 'rgba(31, 41, 55, 0.5)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '6px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#ffffff',
                    marginBottom: '4px'
                  }}>
                    {candidate.name}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{votes} votes</span>
                    <span>{candidate.reliability || 0}% reliable</span>
                    <span>{getTrendIcon(candidate.trend || 'stable')}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleVote(candidate.id, 'up')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: userVote === 'up' 
                      ? 'rgba(16, 185, 129, 0.8)' 
                      : 'rgba(75, 85, 99, 0.5)',
                    border: userVote === 'up' 
                      ? '1px solid #10b981' 
                      : '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  👍 Support
                </button>
                <button
                  onClick={() => handleVote(candidate.id, 'down')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: userVote === 'down' 
                      ? 'rgba(239, 68, 68, 0.8)' 
                      : 'rgba(75, 85, 99, 0.5)',
                    border: userVote === 'down' 
                      ? '1px solid #ef4444' 
                      : '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  👎 Oppose
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRankingTab = () => (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
          Rankings
        </h3>
        <p style={{ fontSize: '11px', color: '#6b7280' }}>
          Current standings by vote count and reliability
        </p>
      </div>

      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {candidates
          .sort((a, b) => (voteCounts[b.id]?.votes || 0) - (voteCounts[a.id]?.votes || 0))
          .map((candidate, index) => (
            <div
              key={candidate.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                marginBottom: '4px',
                background: index === 0 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'rgba(31, 41, 55, 0.3)',
                border: index === 0 
                  ? '1px solid rgba(245, 158, 11, 0.5)' 
                  : '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '4px'
              }}
            >
              <div style={{ 
                width: '20px', 
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: index === 0 ? '#f59e0b' : '#ffffff'
              }}>
                {index === 0 ? '🏆' : `#${index + 1}`}
              </div>
              
              <div style={{ flex: 1, marginLeft: '8px' }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: '500', 
                  color: '#ffffff',
                  marginBottom: '2px'
                }}>
                  {candidate.name}
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  color: '#6b7280',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <span>{voteCounts[candidate.id]?.votes || 0} votes</span>
                  <span>{candidate.reliability || 0}%</span>
                  <span>{getTrendIcon(candidate.trend || 'stable')}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="voting-panel">
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '12px',
        background: 'rgba(31, 41, 55, 0.5)',
        borderRadius: '4px',
        padding: '2px'
      }}>
        <button
          onClick={() => setActiveTab('vote')}
          style={{
            flex: 1,
            padding: '6px',
            background: activeTab === 'vote' 
              ? 'rgba(59, 130, 246, 0.8)' 
              : 'transparent',
            border: 'none',
            borderRadius: '3px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🗳️ Vote
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          style={{
            flex: 1,
            padding: '6px',
            background: activeTab === 'rankings' 
              ? 'rgba(59, 130, 246, 0.8)' 
              : 'transparent',
            border: 'none',
            borderRadius: '3px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          📊 Rankings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'vote' ? renderVoteTab() : renderRankingTab()}

      {/* Action Buttons */}
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '12px', 
        borderTop: '1px solid rgba(75, 85, 99, 0.3)',
        display: 'flex',
        gap: '6px'
      }}>
        <button
          onClick={() => console.log('Submit Proposal')}
          style={{
            flex: 1,
            padding: '6px',
            background: 'rgba(139, 92, 246, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ➕ Propose
        </button>
        <button
          onClick={() => console.log('View Advanced Voting')}
          style={{
            flex: 1,
            padding: '6px',
            background: 'rgba(75, 85, 99, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🔧 Advanced
        </button>
      </div>
    </div>
  );
};

export default VotingPanel;
