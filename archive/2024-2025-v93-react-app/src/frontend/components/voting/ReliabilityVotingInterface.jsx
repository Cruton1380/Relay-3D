/**
 * RELAY NETWORK - RELIABILITY AWARE VOTING INTERFACE
 * React component implementing the complete reliability scoring system
 */

import React, { useState, useEffect } from 'react';
import './ReliabilityVotingInterface.css';

const ReliabilityVotingInterface = ({ 
  topicId, 
  channelId,
  userContext,
  onVoteSubmit,
  onReliabilityRate
}) => {
  const [topicData, setTopicData] = useState(null);
  const [reliabilityData, setReliabilityData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [userReliabilityRatings, setUserReliabilityRatings] = useState({});
  const [showReliabilityDetails, setShowReliabilityDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopicData();
    loadReliabilityData();
    
    // Set up real-time updates
    const eventSource = new EventSource(`/api/realtime/rankings/${topicId}`);
    eventSource.onmessage = (event) => {
      const updatedRankings = JSON.parse(event.data);
      updateCandidateRankings(updatedRankings);
    };

    return () => {
      eventSource.close();
    };
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      const response = await fetch(`/api/topics/${topicId}`);
      const data = await response.json();
      if (data.success) {
        setTopicData(data.data);
        setCandidates(data.data.candidates || []);
      }
    } catch (error) {
      console.error('Error loading topic data:', error);
    }
  };

  const loadReliabilityData = async () => {
    try {
      const response = await fetch(`/api/reliability/topic/${topicId}`);
      const data = await response.json();
      if (data.success) {
        setReliabilityData(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading reliability data:', error);
      setLoading(false);
    }
  };

  const submitVote = async (candidateId) => {
    try {
      const voteData = {
        voterId: userContext.userId,
        topicId: topicId,
        candidateId: candidateId,
        channelId: channelId,
        proximityProof: userContext.proximityProof
      };

      const response = await fetch('/api/rankings/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(voteData)
      });

      const result = await response.json();
      if (result.success) {
        setUserVote(candidateId);
        updateCandidateRankings(result.data.updatedCandidateRankings);
        if (onVoteSubmit) onVoteSubmit(result.data);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  const submitReliabilityRating = async (targetId, reliabilityScore, targetType = 'candidate') => {
    try {
      const ratingData = {
        voterId: userContext.userId,
        topicId: topicId,
        targetId: targetId,
        reliabilityScore: reliabilityScore,
        targetType: targetType
      };

      const response = await fetch('/api/reliability/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ratingData)
      });

      const result = await response.json();
      if (result.success) {
        if (targetType === 'candidate') {
          setUserReliabilityRatings(prev => ({
            ...prev,
            [targetId]: reliabilityScore
          }));
        }
        
        // Reload reliability data to get updated scores
        await loadReliabilityData();
        
        if (onReliabilityRate) onReliabilityRate(result.data);
      }
    } catch (error) {
      console.error('Error submitting reliability rating:', error);
    }
  };

  const updateCandidateRankings = (updatedRankings) => {
    setCandidates(updatedRankings);
  };

  const getReliabilityClass = (score) => {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'very-good';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  const formatVoteCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const formatTimeRemaining = (endTime) => {
    const now = Date.now();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days} days left`;
    if (hours > 0) return `${hours} hours left`;
    return 'Ending soon';
  };

  if (loading) {
    return <div className="loading">Loading voting interface...</div>;
  }

  if (!topicData || !reliabilityData) {
    return <div className="error">Error loading voting data</div>;
  }

  return (
    <div className="reliability-voting-interface">
      {/* Topic Header */}
      <div className="topic-header">
        <h3>{topicData.name}</h3>
        <div className="topic-meta">
          <span className="channel-type">{topicData.channelType}</span>
          <span className="overall-reliability">
            Topic Reliability: 
            <span className={`reliability-score ${getReliabilityClass(reliabilityData.overallTopic)}`}>
              {reliabilityData.overallTopic}% ⭐
            </span>
          </span>
        </div>
      </div>

      {/* Suspicious Patterns Alert */}
      {reliabilityData.suspiciousPatterns && reliabilityData.suspiciousPatterns.length > 0 && (
        <div className="suspicious-patterns-alert">
          ⚠️ Community has flagged potential issues with this topic
          <button 
            className="details-toggle"
            onClick={() => setShowReliabilityDetails(!showReliabilityDetails)}
          >
            {showReliabilityDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      )}

      {showReliabilityDetails && (
        <div className="reliability-details">
          {reliabilityData.suspiciousPatterns.map((pattern, index) => (
            <div key={index} className={`pattern-alert ${pattern.severity}`}>
              <strong>{pattern.type}:</strong> {pattern.description}
              {pattern.candidates && (
                <ul>
                  {pattern.candidates.map(candidate => (
                    <li key={candidate.candidateName}>
                      {candidate.candidateName}: {candidate.voteCount} votes, 
                      {candidate.averageReliability}% reliability
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Left-to-Right Candidate Rankings */}
      <div className="candidates-container">
        <h4>Current Rankings (Left→Right by Vote Count):</h4>
        
        <div className="candidates-row">
          {candidates.map((candidate, index) => {
            const reliabilityInfo = reliabilityData.candidates[candidate.id] || {};
            const isLowReliability = reliabilityInfo.averageReliability < 50;
            
            return (
              <div 
                key={candidate.id} 
                className={`candidate-card position-${index + 1} ${isLowReliability ? 'low-reliability' : ''}`}
                style={{ order: index + 1 }}
              >
                <div className="position-indicator">#{index + 1}</div>
                <div className="candidate-name">{candidate.name}</div>
                <div className="vote-count">{formatVoteCount(candidate.voteCount)} votes</div>
                <div className="vote-percentage">
                  {((candidate.voteCount / topicData.totalVotes) * 100).toFixed(1)}%
                </div>
                
                <div className={`reliability-score ${getReliabilityClass(reliabilityInfo.averageReliability || 0)}`}>
                  {(reliabilityInfo.averageReliability || 0).toFixed(1)}% reliable
                </div>
                
                <div className="action-buttons">
                  <button 
                    className={`vote-button ${userVote === candidate.id ? 'voted' : ''}`}
                    onClick={() => submitVote(candidate.id)}
                    disabled={userVote !== null}
                  >
                    {userVote === candidate.id ? 'Voted ✓' : 'Vote'}
                  </button>
                  
                  <div className="reliability-rating">
                    <span>Rate:</span>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`star-button ${userReliabilityRatings[candidate.id] >= star * 20 ? 'selected' : ''}`}
                        onClick={() => submitReliabilityRating(candidate.id, star * 20)}
                        title={`${star * 20}% reliable`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                
                {isLowReliability && (
                  <div className="reliability-warning">
                    ⚠️ Low community reliability rating
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Statistics */}
      <div className="topic-statistics">
        <div className="stat-item">
          <span className="stat-label">📊 Total Votes:</span>
          <span className="stat-value">{formatVoteCount(topicData.totalVotes)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">👥 Total Raters:</span>
          <span className="stat-value">{reliabilityData.totalRatingVoters}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">⏰ Status:</span>
          <span className="stat-value">{formatTimeRemaining(topicData.endTime)}</span>
        </div>
      </div>

      {/* Overall Topic Rating */}
      <div className="topic-reliability-section">
        <h4>Rate Overall Topic Quality:</h4>
        <div className="topic-rating-controls">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`topic-star-button ${userReliabilityRatings.topic >= star * 20 ? 'selected' : ''}`}
              onClick={() => {
                const rating = star * 20;
                submitReliabilityRating(null, rating, 'topic');
                setUserReliabilityRatings(prev => ({ ...prev, topic: rating }));
              }}
              title={`Rate topic ${star * 20}% quality`}
            >
              ⭐
            </button>
          ))}
          <span className="rating-explanation">
            Rate the overall quality and fairness of this voting topic
          </span>
        </div>
      </div>

      {/* Debug Info (development only) */}
              {import.meta.env.DEV && (
        <div className="debug-info">
          <details>
            <summary>Debug Information</summary>
            <pre>{JSON.stringify({ reliabilityData, topicData }, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ReliabilityVotingInterface;
