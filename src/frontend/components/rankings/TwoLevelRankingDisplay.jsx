/**
 * RELAY NETWORK - TWO LEVEL RANKING DISPLAY
 * Component for displaying channels (top-to-bottom) and topics (left-to-right)
 */

import React, { useState, useEffect } from 'react';
import ReliabilityVotingInterface from './ReliabilityVotingInterface';
import './TwoLevelRankingDisplay.css';

const TwoLevelRankingDisplay = ({ 
  userContext, 
  filterCriteria = {},
  onChannelSelect,
  onTopicSelect
}) => {
  const [channelRankings, setChannelRankings] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    loadChannelRankings();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [filterCriteria]);

  const loadChannelRankings = async () => {
    try {
      setLoading(true);
      
      // Use the actual channels endpoint instead of non-existent rankings endpoints
      const endpoint = '/api/channels';
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success && data.channels) {
        // Transform channels data to the expected format for rankings display
        const transformedChannels = data.channels.map((channel, index) => ({
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.type || 'test', // Default type for test data
          category: channel.category, // Include category from backend
          totalVotes: channel.totalVotes || 0,
          reliabilityScore: channel.reliabilityScore || 80,
          totalTopics: 1, // For test data, assume 1 topic per channel
          topicPreview: channel.candidates && channel.candidates.length > 0 ? {
            topicName: channel.name,
            candidatePreview: channel.candidates[0]?.content?.substring(0, 100) + '...' || 'No preview available',
            timeRemaining: 'Ongoing'
          } : null
        }));
        
        setChannelRankings(transformedChannels);
      }
    } catch (error) {
      console.error('Error loading channel rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = async (channel) => {
    setSelectedChannel(channel);
    setSelectedTopic(null);
    
    if (onChannelSelect) {
      onChannelSelect(channel);
    }
    
    // Load detailed topics for this channel
    if (!isMobile) {
      try {
        const response = await fetch(`/api/rankings/topics/${channel.channelId}`);
        const data = await response.json();
        
        if (data.success) {
          const updatedChannel = { ...channel, detailedTopics: data.data };
          setSelectedChannel(updatedChannel);
        }
      } catch (error) {
        console.error('Error loading detailed topics:', error);
      }
    }
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    
    if (onTopicSelect) {
      onTopicSelect(topic);
    }
  };

  const formatVoteCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const getChannelIcon = (type) => {
    const icons = {
      'GLOBAL': '🌍',
      'REGIONAL': '🏛️',
      'PROXIMITY': '📍'
    };
    return icons[type] || '📍';
  };

  const getReliabilityClass = (score) => {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'very-good';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  if (loading) {
    return <div className="loading">Loading channels and topics...</div>;
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="mobile-ranking-display">
        <div className="mobile-header">
          <h2>🏠 Channels</h2>
          <div className="mobile-filter-status">
            {Object.keys(filterCriteria).length > 0 && (
              <span className="filter-active">Filters Active</span>
            )}
          </div>
        </div>

        {/* Mobile Channel List (Top-to-Bottom by Activity) */}
        <div className="mobile-channel-list">
          {channelRankings.map((channel, index) => (
            <div 
              key={channel.channelId}
              className="mobile-channel-card"
              onClick={() => handleChannelClick(channel)}
            >
              <div className="mobile-channel-header">
                <span className="channel-icon">{getChannelIcon(channel.channelType)}</span>
                <span className="channel-name">{channel.channelName}</span>
                <span className="channel-type">({channel.channelType})</span>
                {channel.category && (
                  <span className="channel-category">{channel.category}</span>
                )}
              </div>
              
              {channel.topicPreview && (
                <div className="mobile-topic-preview">
                  <div className="topic-name">{channel.topicPreview.topicName}:</div>
                  <div className="candidate-preview">
                    {channel.topicPreview.candidatePreview}
                  </div>
                  <div className="topic-stats">
                    {channel.totalVotes} votes • {channel.topicPreview.timeRemaining} • 
                    <span className={`reliability ${getReliabilityClass(channel.reliabilityScore)}`}>
                      {channel.reliabilityScore}% rel
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Topic Detail */}
        {selectedChannel && selectedTopic && (
          <div className="mobile-topic-detail">
            <ReliabilityVotingInterface
              topicId={selectedTopic.topicId}
              channelId={selectedChannel.channelId}
              userContext={userContext}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="desktop-ranking-display">
      <div className="ranking-layout">
        {/* Left Sidebar: Channel List (Top-to-Bottom) */}
        <div className="channel-sidebar">
          <h2>Channels (Ranked by Activity)</h2>
          
          <div className="channel-list">
            {channelRankings.map((channel, index) => (
              <div 
                key={channel.channelId}
                className={`channel-item ${selectedChannel?.channelId === channel.channelId ? 'selected' : ''}`}
                onClick={() => handleChannelClick(channel)}
              >
                <div className="channel-position">#{index + 1}</div>
                <div className="channel-info">
                  <div className="channel-header">
                    <span className="channel-icon">{getChannelIcon(channel.channelType)}</span>
                    <span className="channel-name">{channel.channelName}</span>
                    {channel.category && (
                      <span className="channel-category">{channel.category}</span>
                    )}
                  </div>
                  <div className="channel-meta">
                    <span className="channel-type">({channel.channelType})</span>
                    <span className="vote-count">{formatVoteCount(channel.totalVotes)} votes</span>
                    <span className={`reliability ${getReliabilityClass(channel.reliabilityScore)}`}>
                      {channel.reliabilityScore}% rel
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Selected Channel Topics */}
        <div className="main-content">
          {selectedChannel ? (
            <div className="channel-detail">
              <div className="channel-detail-header">
                <h2>
                  {getChannelIcon(selectedChannel.channelType)} {selectedChannel.channelName}
                  {selectedChannel.category && (
                    <span className="header-category">• {selectedChannel.category}</span>
                  )}
                </h2>
                <div className="channel-stats">
                  <span>Total: {formatVoteCount(selectedChannel.totalVotes)} votes</span>
                  <span>Topics: {selectedChannel.totalTopics}</span>
                  <span className={`reliability ${getReliabilityClass(selectedChannel.reliabilityScore)}`}>
                    Reliability: {selectedChannel.reliabilityScore}%
                  </span>
                </div>
              </div>

              {/* Topics within Channel */}
              {selectedChannel.detailedTopics && (
                <div className="topics-section">
                  <h3>Topics in this Channel:</h3>
                  
                  <div className="topics-list">
                    {selectedChannel.detailedTopics.map((topic) => (
                      <div 
                        key={topic.topicId}
                        className={`topic-card ${selectedTopic?.topicId === topic.topicId ? 'selected' : ''}`}
                        onClick={() => handleTopicClick(topic)}
                      >
                        <div className="topic-header">
                          <h4>{topic.topicName}</h4>
                          <div className="topic-meta">
                            <span>{formatVoteCount(topic.totalVotes)} votes</span>
                            <span className={`reliability ${getReliabilityClass(topic.overallReliability)}`}>
                              {topic.overallReliability}% reliable
                            </span>
                          </div>
                        </div>

                        {/* Left-to-Right Candidate Preview */}
                        <div className="candidates-preview">
                          {topic.candidates.slice(0, 5).map((candidate, index) => (
                            <div key={candidate.id} className="candidate-preview">
                              <span className="candidate-name">{candidate.name}</span>
                              <span className="candidate-votes">{formatVoteCount(candidate.voteCount)}</span>
                              {index < topic.candidates.length - 1 && <span className="arrow">←</span>}
                            </div>
                          ))}
                          {topic.candidates.length > 5 && <span className="more">+{topic.candidates.length - 5} more</span>}
                        </div>

                        {/* Suspicious Pattern Alert */}
                        {topic.suspiciousPatterns && topic.suspiciousPatterns.length > 0 && (
                          <div className="suspicious-alert">
                            ⚠️ {topic.suspiciousPatterns.length} potential issue(s) detected
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select a channel to view topics</h3>
              <p>Choose a channel from the left sidebar to see detailed topic rankings and voting interfaces.</p>
            </div>
          )}
        </div>

        {/* Right Panel: Voting Interface */}
        {selectedTopic && (
          <div className="voting-panel">
            <ReliabilityVotingInterface
              topicId={selectedTopic.topicId}
              channelId={selectedChannel.channelId}
              userContext={userContext}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoLevelRankingDisplay;
