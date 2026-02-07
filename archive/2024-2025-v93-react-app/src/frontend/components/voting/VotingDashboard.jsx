/**
 * @fileoverview Voting Dashboard - Core Democratic Interface
 * Live topic row competition tracking and voting interface
 */
import React, { useState, useEffect } from 'react';
import { useVoteUpdates, useWebSocket } from '../../hooks/useWebSocket.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import './VotingDashboard.css';

const VotingDashboard = () => {
  const { user } = useAuth();
  const { sendMessage, isConnected } = useWebSocket();
  const [topicRows, setTopicRows] = useState([]);
  const [activeVotes, setActiveVotes] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, proximity, regional, global
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch topic rows on component mount
  useEffect(() => {
    fetchTopicRows();
  }, [filter]);

  const fetchTopicRows = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vote/topic-rows?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topic rows');
      }

      const data = await response.json();
      setTopicRows(data.topicRows || []);
      
      // Initialize active votes map
      const votesMap = new Map();
      data.topicRows?.forEach(row => {
        if (row.userVote) {
          votesMap.set(row.id, row.userVote.channelId);
        }
      });
      setActiveVotes(votesMap);
      
    } catch (err) {
      console.error('Error fetching topic rows:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (topicRowId, channelId) => {
    if (!isConnected) {
      setError('Cannot vote - not connected to real-time service. Please refresh the page.');
      return;
    }

    try {
      // 🔗 Import crypto service for signing
      const cryptoService = await import('../../services/cryptoService.js');
      
      // Generate nonce for replay protection
      const nonce = cryptoService.generateNonce();
      
      // Prepare vote data
      const voteData = {
        topicId: topicRowId,
        candidateId: channelId,
        voteType: 'support',
        timestamp: Date.now(),
        nonce
      };
      
      // Hash and sign the vote data
      const voteHash = await cryptoService.hashVoteData(voteData);
      const signature = await cryptoService.signVote(voteHash);
      const publicKey = await cryptoService.exportPublicKey();
      
      const response = await fetch('/api/vote/cast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicId: topicRowId,
          candidateId: channelId,
          voteType: 'support',
          signature,
          publicKey,
          nonce,
          timestamp: voteData.timestamp
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cast vote');
      }

      const result = await response.json();
      
      console.log('✅ Vote recorded to blockchain:', result.blockchain?.transactionHash);
      
      // Update local state
      setActiveVotes(prev => new Map(prev.set(topicRowId, channelId)));
      
      // Send real-time update
      const messageSent = sendMessage({
        type: 'vote_cast',
        topicRowId,
        channelId,
        userId: user.id,
        transactionHash: result.blockchain?.transactionHash
      });

      if (!messageSent) {
        console.warn('Failed to send real-time vote update');
      }

    } catch (err) {
      console.error('Error casting vote:', err);
      setError(err.message);
    }
  };

  const filteredTopicRows = topicRows.filter(row => {
    if (searchTerm) {
      return row.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
             row.channels.some(channel => 
               channel.name.toLowerCase().includes(searchTerm.toLowerCase())
             );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="voting-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading democratic competitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voting-dashboard error">
        <div className="error-message">
          <h3>Unable to load voting data</h3>
          <p>{error}</p>
          <button onClick={fetchTopicRows} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-dashboard">
      <header className="dashboard-header">
        <h1>🗳️ Democratic Competitions</h1>
        <p>Live topic row competitions where communities choose their preferred channels</p>
        
        <div className="dashboard-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search topics and channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Competitions
            </button>
            <button 
              className={filter === 'proximity' ? 'active' : ''}
              onClick={() => setFilter('proximity')}
            >
              🏘️ Proximity
            </button>
            <button 
              className={filter === 'regional' ? 'active' : ''}
              onClick={() => setFilter('regional')}
            >
              🌍 Regional
            </button>
            <button 
              className={filter === 'global' ? 'active' : ''}
              onClick={() => setFilter('global')}
            >
              🌐 Global
            </button>
          </div>
        </div>
      </header>

      <div className="topic-rows-container">
        {filteredTopicRows.length === 0 ? (
          <div className="no-competitions">
            <h3>No active competitions found</h3>
            <p>Try adjusting your search or filter settings</p>
          </div>
        ) : (
          filteredTopicRows.map(row => (
            <TopicRowCompetition
              key={row.id}
              topicRow={row}
              userVote={activeVotes.get(row.id)}
              onVote={handleVote}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TopicRowCompetition = ({ topicRow, userVote, onVote }) => {
  const voteUpdates = useVoteUpdates(topicRow.id);
  const [channels, setChannels] = useState(topicRow.channels || []);

  // Update channels when vote updates come in
  useEffect(() => {
    if (voteUpdates) {
      setChannels(prevChannels => {
        return prevChannels.map(channel => {
          if (channel.id === voteUpdates.channelId) {
            return {
              ...channel,
              voteCount: voteUpdates.newCount,
              isUserVote: voteUpdates.isCurrentUser
            };
          }
          return channel;
        });
      });
    }
  }, [voteUpdates]);

  const sortedChannels = [...channels].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = channels.reduce((sum, channel) => sum + channel.voteCount, 0);
  const leadingChannel = sortedChannels[0];

  return (
    <div className="topic-row-competition">
      <div className="competition-header">
        <h3 className="topic-title">{topicRow.topic}</h3>
        <div className="competition-meta">
          <span className={`scope-badge scope-${topicRow.scope}`}>
            {topicRow.scope === 'proximity' && '🏘️ Proximity'}
            {topicRow.scope === 'regional' && '🌍 Regional'}
            {topicRow.scope === 'global' && '🌐 Global'}
          </span>
          <span className="total-votes">{totalVotes} total votes</span>
          {topicRow.location && (
            <span className="location">📍 {topicRow.location}</span>
          )}
        </div>
      </div>

      <div className="channel-competition">
        {sortedChannels.map((channel, index) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            position={index + 1}
            isLeading={index === 0}
            isStabilized={channel.isStabilized}
            isUserVote={userVote === channel.id}
            totalVotes={totalVotes}
            onVote={() => onVote(topicRow.id, channel.id)}
          />
        ))}
      </div>

      {leadingChannel?.isStabilized && (
        <div className="stabilization-notice">
          <span className="crown">👑</span>
          <strong>{leadingChannel.name}</strong> has stabilized as the community choice
        </div>
      )}
    </div>
  );
};

const ChannelCard = ({ 
  channel, 
  position, 
  isLeading, 
  isStabilized, 
  isUserVote, 
  totalVotes, 
  onVote 
}) => {
  const votePercentage = totalVotes > 0 ? (channel.voteCount / totalVotes) * 100 : 0;
  
  return (
    <div className={`channel-card ${isLeading ? 'leading' : ''} ${isUserVote ? 'user-voted' : ''}`}>
      <div className="channel-header">
        <div className="position-indicator">
          <span className="position-number">#{position}</span>
          {isStabilized && <span className="crown">👑</span>}
        </div>
        
        <div className="channel-info">
          <div className="channel-creator">
            {channel.owner ? `Created by @${channel.owner}` : 
             channel.ownerType ? `Created by ${channel.ownerType}` : 
             'Created by Unknown'}
          </div>
          {channel.description && (
            <p className="channel-description">{channel.description}</p>
          )}
          <div className="channel-meta">
            {channel.memberCount && (
              <span className="member-count">{channel.memberCount} members</span>
            )}
          </div>
        </div>

        <div className="vote-section">
          <div className="vote-count">
            <span className="count">{channel.voteCount}</span>
            <span className="label">votes</span>
          </div>
          <div className="vote-percentage">
            {votePercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="vote-bar">
        <div 
          className="vote-progress" 
          style={{ width: `${votePercentage}%` }}
        ></div>
      </div>

      <div className="channel-actions">
        <button
          className={`vote-button ${isUserVote ? 'voted' : ''}`}
          onClick={onVote}
          disabled={isUserVote}
        >
          {isUserVote ? '✓ Voted' : 'Vote for this channel'}
        </button>
        
        <button className="view-channel-button">
          View Channel
        </button>
      </div>

      {channel.recentActivity && (
        <div className="recent-activity">
          <span className="activity-indicator">
            {channel.recentActivity > 0 ? '📈' : '📊'} 
            {channel.recentActivity > 0 ? '+' : ''}{channel.recentActivity} votes today
          </span>
        </div>
      )}
    </div>
  );
};

export default VotingDashboard; 