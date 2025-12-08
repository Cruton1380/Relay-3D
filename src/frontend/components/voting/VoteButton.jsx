import React, { useState, useEffect } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';
import './VoteButton.css';

// Demo user ID for testing
const DEMO_USER_ID = 'demo-user-1';

const VoteButton = ({ id, channelId, candidateId, value = 1, isVoted, onVote, disabled }) => {
  const { isTestMode } = useEnvironment();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState(null);

  // Simple vote handling - if onVote is provided, use it (HomePage approach)
  // Otherwise handle voting internally
  const handleVote = async () => {
    console.log('VoteButton clicked:', { channelId, candidateId, isVoted, disabled, isVoting });
    
    if (isVoted || disabled || isVoting) {
      console.log('Vote blocked:', { isVoted, disabled, isVoting });
      return;
    }

    if (onVote) {
      // Use parent component's vote handler (HomePage)
      console.log('Using parent vote handler');
      onVote();
      return;
    }

    // Internal vote handling for direct use
    console.log('Using internal vote handling');
    setIsVoting(true);
    setError(null);

    try {
      const voteData = {
        channelId: channelId,
        candidateId: candidateId,
        userId: DEMO_USER_ID,
        action: 'vote'
      };
      
      console.log('Submitting vote:', voteData);

      const response = await fetch('http://localhost:3002/api/vote/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData)
      });

      console.log('Vote response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vote response error:', errorText);
        throw new Error(`Vote submission failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Vote submitted successfully:', result);
      
      // Emit custom event for other components to listen
      window.dispatchEvent(new CustomEvent('voteSubmitted', { 
        detail: { channelId, candidateId, result } 
      }));

    } catch (err) {
      console.error('Vote error:', err);
      setError(`Failed to vote: ${err.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  const getButtonText = () => {
    if (isVoting) return 'Voting...';
    if (isVoted) return 'Voted';
    return 'Vote';
  };

  const getButtonClass = () => {
    let className = 'vote-button';
    if (isVoted) className += ' voted';
    if (isVoting) className += ' voting';
    if (disabled) className += ' disabled';
    return className;
  };

  return (
    <div className="vote-button-container">
      <button
        className={getButtonClass()}
        onClick={handleVote}
        disabled={disabled || isVoting || isVoted}
      >
        {getButtonText()}
      </button>
      {error && <div className="vote-error">{error}</div>}
    </div>
  );
};

export default VoteButton;
