import React, { useState, useEffect } from 'react';
import { apiPost } from '../services/apiClient.js';

// Demo user ID for testing
const DEMO_USER_ID = 'demo-user-1';

const VoteButton = React.memo(({ id, channelId, candidateId, value = 1, isVoted, onVote, disabled }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState(null);

  // Simplified vote handling - focus on core functionality
  const handleVote = async () => {
    console.log('🗳️ VoteButton: handleVote called', { channelId, candidateId, isVoted, disabled, isVoting });
    console.log('🗳️ VoteButton: Props received:', { id, channelId, candidateId, value, isVoted, onVote, disabled });
    
    if (isVoting || disabled) {
      console.log('🗳️ VoteButton: Vote blocked - isVoting or disabled');
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      if (onVote) {
        console.log('🗳️ VoteButton: Using parent vote handler');
        await onVote();
        console.log('🗳️ VoteButton: Parent vote handler completed successfully');
      } else {
        console.log('🗳️ VoteButton: Using direct API call');
        const response = await apiPost('/api/vote/demo', {
          channelId,
          candidateId,
          userId: 'demo-user-1',
          action: 'vote'
        });
        
        if (response.success) {
          console.log('🗳️ VoteButton: Direct API vote successful:', response);
          // Dispatch vote processed event
          window.dispatchEvent(new CustomEvent('voteProcessed', {
            detail: {
              channelId,
              candidateId,
              result: response
            }
          }));
        } else {
          setError('Vote failed: ' + (response.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('🗳️ VoteButton: Vote error:', error);
      setError('Vote failed: ' + error.message);
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

  console.log('🗳️ VoteButton: Rendering with props:', { channelId, candidateId, isVoted, disabled, isVoting });

  // Test click handler to verify button is clickable
  const testClick = () => {
    console.log('🗳️ VoteButton: Test click detected! Button is clickable.');
  };

  // Add mouse enter/leave handlers for debugging
  const handleMouseEnter = () => {
    console.log('🗳️ VoteButton: Mouse entered button');
  };

  const handleMouseLeave = () => {
    console.log('🗳️ VoteButton: Mouse left button');
  };

  return (
    <div className="vote-button-container">
      <button
        className={getButtonClass()}
        onClick={handleVote}
        onMouseDown={testClick} // Test if button receives mouse events
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || isVoting}
        style={{
          position: 'relative',
          background: isVoted 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : isVoting
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '500',
          cursor: disabled || isVoting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled || isVoting ? 0.6 : 1,
          minWidth: '80px',
          zIndex: 1000, // Ensure button is clickable
          pointerEvents: 'auto', // Explicitly enable pointer events
          userSelect: 'none' // Prevent text selection
        }}
      >
        {getButtonText()}
      </button>
      
      {error && (
        <div style={{ 
          fontSize: '10px', 
          color: '#ef4444', 
          marginTop: '4px',
          padding: '4px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '3px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
});

export default VoteButton;
