/**
 * @fileoverview Content Vote Buttons Component
 * Vote buttons for upvoting/downvoting channel content (messages, media, etc.)
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import ProximityVotingService from '../../services/proximityVotingService.js';
import './ContentVoteButtons.css';

const ContentVoteButtons = ({ 
  contentId, 
  contentInfo = {}, 
  channelId,
  initialScore = null,
  onVoteUpdate = null,
  size = 'small', // 'small', 'medium', 'large'
  variant = 'horizontal' // 'horizontal', 'vertical'
}) => {
  const { user, isAuthenticated } = useAuth();
  const [voteState, setVoteState] = useState({
    userVote: null, // 'upvote', 'downvote', or null
    upvotes: 0,
    downvotes: 0,
    score: 0,
    loading: false,
    error: null
  });
  const [votingRestrictions, setVotingRestrictions] = useState(null);
  const [proximityVotingService] = useState(() => new ProximityVotingService());

  // Initialize vote state
  useEffect(() => {
    if (initialScore) {
      setVoteState(prev => ({
        ...prev,
        upvotes: initialScore.upvotes || 0,
        downvotes: initialScore.downvotes || 0,
        score: initialScore.score || 0,
        userVote: initialScore.userVote || null
      }));
    } else {
      loadVoteState();
    }
  }, [contentId, initialScore]);

  /**
   * Load current vote state from server
   */
  const loadVoteState = async () => {
    if (!isAuthenticated || !contentId) return;

    try {
      setVoteState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/channels/${channelId}/content/${contentId}/votes`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setVoteState(prev => ({
          ...prev,
          upvotes: data.score.upvotes || 0,
          downvotes: data.score.downvotes || 0,
          score: data.score.score || 0,
          userVote: data.userVote || null,
          loading: false
        }));
      } else {
        throw new Error(data.error || 'Failed to load vote state');
      }
    } catch (error) {
      console.error('Failed to load vote state:', error);
      setVoteState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Check voting restrictions
  useEffect(() => {
    if (isAuthenticated && channelId && user?.id) {
      checkVotingRestrictions();
    }
  }, [channelId, user?.id, isAuthenticated]);

  const checkVotingRestrictions = async () => {
    try {
      const restrictions = await proximityVotingService.getVotingRestrictionsSummary(user.id, channelId);
      setVotingRestrictions(restrictions);
    } catch (error) {
      console.error('Failed to check voting restrictions:', error);
    }
  };

  /**
   * Cast a vote
   */
  const castVote = async (voteType) => {
    if (!isAuthenticated) {
      alert('Please log in to vote');
      return;
    }

    if (!contentId || !channelId) {
      console.error('Missing contentId or channelId');
      return;
    }

    // Check voting restrictions
    if (votingRestrictions && !votingRestrictions.canVote) {
      alert(votingRestrictions.reason || 'You cannot vote on this content due to proximity restrictions');
      return;
    }

    // Validate voting action
    try {
      const validation = await proximityVotingService.validateVotingAction(user.id, channelId, contentId, voteType);
      if (!validation.isValid) {
        alert(validation.error || 'Voting not allowed');
        return;
      }
    } catch (error) {
      console.error('Failed to validate voting action:', error);
      alert('Unable to validate voting permissions');
      return;
    }

    try {
      setVoteState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/channels/${channelId}/content/${contentId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voteType,
          contentInfo: {
            type: contentInfo.type || 'message',
            authorId: contentInfo.authorId || contentInfo.senderId,
            channelId,
            createdAt: contentInfo.timestamp || contentInfo.createdAt,
            title: contentInfo.title,
            description: contentInfo.description || contentInfo.content,
            mediaType: contentInfo.messageType || contentInfo.mediaType,
            ...contentInfo
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        const newUserVote = data.removed ? null : voteType;
        setVoteState(prev => ({
          ...prev,
          userVote: newUserVote,
          upvotes: data.score.upvotes || 0,
          downvotes: data.score.downvotes || 0,
          score: data.score.score || 0,
          loading: false
        }));

        // Notify parent component
        if (onVoteUpdate) {
          onVoteUpdate({
            contentId,
            userVote: newUserVote,
            score: data.score,
            removed: data.removed
          });
        }
      } else {
        throw new Error(data.error || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Failed to cast vote:', error);
      setVoteState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const handleUpvote = () => castVote('upvote');
  const handleDownvote = () => castVote('downvote');

  // Render loading state
  if (voteState.loading && !voteState.userVote) {
    return (
      <div className={`content-vote-buttons ${size} ${variant} loading`}>
        <div className="vote-loading">
          <div className="vote-spinner" />
        </div>
      </div>
    );
  }

  // Render error state
  if (voteState.error && !voteState.userVote) {
    return (
      <div className={`content-vote-buttons ${size} ${variant} error`}>
        <span className="vote-error" title={voteState.error}>⚠️</span>
      </div>
    );
  }
  const isUpvoted = voteState.userVote === 'upvote';
  const isDownvoted = voteState.userVote === 'downvote';
  const canVote = votingRestrictions ? votingRestrictions.canVote : true;
  const votingDisabledReason = votingRestrictions && !votingRestrictions.canVote 
    ? votingRestrictions.reason 
    : null;

  return (
    <div className={`content-vote-buttons ${size} ${variant} ${!canVote ? 'restricted' : ''}`}>
      {/* Voting Restriction Notice */}
      {votingDisabledReason && (
        <div className="voting-restriction-notice" title={votingDisabledReason}>
          🚫 Proximity required for voting
        </div>
      )}

      {/* Upvote Button */}
      <button
        className={`vote-btn upvote-btn ${isUpvoted ? 'active' : ''} ${voteState.loading ? 'loading' : ''} ${!canVote ? 'disabled' : ''}`}
        onClick={handleUpvote}
        disabled={voteState.loading || !isAuthenticated || !canVote}
        title={!canVote ? votingDisabledReason : (isUpvoted ? 'Remove upvote' : 'Upvote content')}
        aria-label={!canVote ? votingDisabledReason : (isUpvoted ? 'Remove upvote' : 'Upvote content')}
      >
        <svg viewBox="0 0 24 24" className="vote-icon">
          <path d="M7,14H12V9L20.5,17.5L12,26V21H7A3,3 0 0,1 4,18V15A1,1 0 0,1 5,14V16A1,1 0 0,0 6,17H7V14M5,10A1,1 0 0,1 4,9V6A3,3 0 0,1 7,3H12V8L20.5,16.5L12,25V20H7A1,1 0 0,0 6,21V23A1,1 0 0,1 5,22V10Z"/>
        </svg>
        {variant === 'horizontal' && size !== 'small' && (
          <span className="vote-count">{voteState.upvotes}</span>
        )}
      </button>

      {/* Score Display (for vertical layout or larger sizes) */}
      {(variant === 'vertical' || size === 'large') && (
        <div className="vote-score">
          <span className="score-number">{voteState.score}</span>
          {size === 'large' && (
            <span className="score-label">score</span>
          )}
        </div>
      )}      {/* Downvote Button */}
      <button
        className={`vote-btn downvote-btn ${isDownvoted ? 'active' : ''} ${voteState.loading ? 'loading' : ''} ${!canVote ? 'disabled' : ''}`}
        onClick={handleDownvote}
        disabled={voteState.loading || !isAuthenticated || !canVote}
        title={!canVote ? votingDisabledReason : (isDownvoted ? 'Remove downvote' : 'Downvote content')}
        aria-label={!canVote ? votingDisabledReason : (isDownvoted ? 'Remove downvote' : 'Downvote content')}
      >
        <svg viewBox="0 0 24 24" className="vote-icon">
          <path d="M17,10H12V15L3.5,6.5L12,-2V3H17A3,3 0 0,1 20,6V9A1,1 0 0,1 19,10V8A1,1 0 0,0 18,7H17V10M19,14A1,1 0 0,1 20,15V18A3,3 0 0,1 17,21H12V16L3.5,7.5L12,-1V4H17A1,1 0 0,0 18,3V1A1,1 0 0,1 19,2V14Z"/>
        </svg>
        {variant === 'horizontal' && size !== 'small' && (
          <span className="vote-count">{voteState.downvotes}</span>
        )}
      </button>

      {/* Score Display (for horizontal small layout) */}
      {variant === 'horizontal' && size === 'small' && voteState.score !== 0 && (
        <span className="compact-score" title={`${voteState.upvotes} upvotes, ${voteState.downvotes} downvotes`}>
          {voteState.score > 0 ? '+' : ''}{voteState.score}
        </span>
      )}
    </div>
  );
};

export default ContentVoteButtons;
