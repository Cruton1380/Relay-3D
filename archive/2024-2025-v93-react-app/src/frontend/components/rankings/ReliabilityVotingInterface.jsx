import React, { useState } from 'react';

/**
 * Reliability Voting Interface Component
 * Allows users to vote on content reliability
 */
const ReliabilityVotingInterface = ({ contentId, onVote, currentScore = 0 }) => {
  const [selectedReliability, setSelectedReliability] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const reliabilityLevels = [
    { value: 1, label: 'Unreliable', color: '#ff4444' },
    { value: 2, label: 'Questionable', color: '#ff8800' },
    { value: 3, label: 'Neutral', color: '#ffcc00' },
    { value: 4, label: 'Reliable', color: '#88cc00' },
    { value: 5, label: 'Highly Reliable', color: '#44cc44' }
  ];

  const handleVote = async (reliabilityValue) => {
    if (hasVoted || isVoting) return;

    try {
      setIsVoting(true);
      setSelectedReliability(reliabilityValue);

      if (onVote) {
        await onVote({
          contentId,
          reliabilityScore: reliabilityValue,
          timestamp: Date.now()
        });
      }

      setHasVoted(true);
    } catch (error) {
      console.error('Voting failed:', error);
      setSelectedReliability(null);
    } finally {
      setIsVoting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#44cc44';
    if (score >= 3) return '#ffcc00';
    if (score >= 2) return '#ff8800';
    return '#ff4444';
  };

  return (
    <div className="reliability-voting-interface">
      <div className="current-score">
        <h4>Current Reliability Score</h4>
        <div 
          className="score-display"
          style={{ color: getScoreColor(currentScore) }}
        >
          {currentScore.toFixed(1)}/5.0
        </div>
      </div>

      <div className="voting-section">
        <h4>Rate Content Reliability</h4>
        
        {hasVoted ? (
          <div className="vote-submitted">
            <p>Thank you for your vote!</p>
            <p>You voted: {selectedReliability}/5</p>
          </div>
        ) : (
          <div className="reliability-buttons">
            {reliabilityLevels.map(level => (
              <button
                key={level.value}
                className={`reliability-button ${
                  selectedReliability === level.value ? 'selected' : ''
                }`}
                style={{ 
                  backgroundColor: level.color,
                  opacity: isVoting ? 0.6 : 1
                }}
                onClick={() => handleVote(level.value)}
                disabled={isVoting || hasVoted}
              >
                <span className="level-value">{level.value}</span>
                <span className="level-label">{level.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isVoting && (
        <div className="voting-spinner">
          <p>Submitting vote...</p>
        </div>
      )}
    </div>
  );
};

export default ReliabilityVotingInterface;
