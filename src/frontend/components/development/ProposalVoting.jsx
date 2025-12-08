/**
 * @fileoverview Proposal Voting Interface Component
 * UI for viewing and voting on development proposals
 */
import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, ThumbsDown, DollarSign, Users, Clock, 
  Hash, FileText, Download, ExternalLink, AlertCircle, CheckCircle 
} from 'lucide-react';
import './ProposalVoting.css';

const ProposalVoting = ({ proposal, userVote, onVote, canVote = true, showVoters = false }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [expandedAttachment, setExpandedAttachment] = useState(null);

  const handleVote = async (voteType) => {
    if (!canVote || isVoting) return;
    
    setIsVoting(true);
    try {
      await onVote(proposal.id, voteType);
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      implemented: '#8b5cf6',
      funded: '#06b6d4'
    };
    return colors[status] || '#6b7280';
  };

  const getVotePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const totalVotes = proposal.upvotes + proposal.downvotes;
  const upvotePercentage = getVotePercentage(proposal.upvotes, totalVotes);
  const downvotePercentage = getVotePercentage(proposal.downvotes, totalVotes);

  return (
    <div className="proposal-voting">
      <div className="proposal-header">
        <div className="proposal-title-section">
          <div className="proposal-meta">
            <span 
              className="proposal-status"
              style={{ backgroundColor: getStatusColor(proposal.status) }}
            >
              {proposal.status.toUpperCase()}
            </span>
            <span className="proposal-type">{proposal.type}</span>
            <span className="proposal-date">{formatTimestamp(proposal.createdAt)}</span>
          </div>
          
          {proposal.requestedAmount > 0 && (
            <div className="bounty-amount">
              <DollarSign size={16} />
              <span>{formatAmount(proposal.requestedAmount)} sats</span>
            </div>
          )}
        </div>

        <div className="proposal-creator">
          <span>by {proposal.creatorId}</span>
        </div>
      </div>

      <div className="proposal-content">
        <div className="proposal-description">
          <h3>Description</h3>
          <div className="description-text">
            {proposal.description.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        {proposal.artifactHash && (
          <div className="technical-details">
            <h4>Technical Details</h4>
            
            {proposal.artifactHash && (
              <div className="detail-item">
                <Hash size={16} />
                <span>Artifact Hash:</span>
                <code className="hash-value">{proposal.artifactHash}</code>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {proposal.attachments && proposal.attachments.length > 0 && (
          <div className="proposal-attachments">
            <h4>Attachments</h4>
            <div className="attachment-grid">
              {proposal.attachments.map((attachment, index) => (
                <div key={index} className="attachment-card">
                  <div className="attachment-header">
                    <FileText size={16} />
                    <span className="attachment-name">{attachment.originalName}</span>
                  </div>
                  <div className="attachment-details">
                    <span className="attachment-size">
                      {Math.round(attachment.size / 1024)} KB
                    </span>
                    <button 
                      className="download-btn"
                      onClick={() => window.open(`/api/proposals/attachments/${attachment.filename}`, '_blank')}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voting Section */}
      <div className="voting-section">
        <div className="vote-stats">
          <div className="vote-bar-container">
            <div className="vote-bar">
              <div 
                className="vote-bar-fill upvotes"
                style={{ width: `${upvotePercentage}%` }}
              />
              <div 
                className="vote-bar-fill downvotes"
                style={{ width: `${downvotePercentage}%` }}
              />
            </div>
            
            <div className="vote-counts">
              <span className="upvote-count">
                <ThumbsUp size={14} />
                {proposal.upvotes} ({upvotePercentage}%)
              </span>
              <span className="total-votes">
                <Users size={14} />
                {totalVotes} total
              </span>
              <span className="downvote-count">
                <ThumbsDown size={14} />
                {proposal.downvotes} ({downvotePercentage}%)
              </span>
            </div>
          </div>
        </div>

        {canVote && (
          <div className="vote-actions">
            {!canVote && (
              <div className="vote-restriction">
                <AlertCircle size={16} />
                <span>Voting requires proximity verification</span>
              </div>
            )}
            
            <div className="vote-buttons">
              <button
                className={`vote-btn upvote ${userVote === 'up' ? 'active' : ''}`}
                onClick={() => handleVote('up')}
                disabled={isVoting || !canVote}
              >
                <ThumbsUp size={18} />
                <span>Support</span>
                {isVoting && userVote !== 'up' && <div className="button-spinner" />}
              </button>
              
              <button
                className={`vote-btn downvote ${userVote === 'down' ? 'active' : ''}`}
                onClick={() => handleVote('down')}
                disabled={isVoting || !canVote}
              >
                <ThumbsDown size={18} />
                <span>Oppose</span>
                {isVoting && userVote !== 'down' && <div className="button-spinner" />}
              </button>
              
              {userVote && (
                <button
                  className="vote-btn neutral"
                  onClick={() => handleVote('neutral')}
                  disabled={isVoting}
                >
                  Remove Vote
                  {isVoting && <div className="button-spinner" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Voter List (if enabled and available) */}
        {showVoters && proposal.voters && proposal.voters.length > 0 && (
          <div className="voter-list">
            <h5>Recent Voters</h5>
            <div className="voters">
              {proposal.voters.slice(0, 10).map((voter, index) => (
                <div key={index} className="voter-item">
                  <span className="voter-id">{voter.userId}</span>
                  <span className={`voter-vote ${voter.vote}`}>
                    {voter.vote === 'up' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                  </span>
                </div>
              ))}
              {proposal.voters.length > 10 && (
                <span className="more-voters">+{proposal.voters.length - 10} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Owner/Founder Actions */}
      {(proposal.canApprove || proposal.canReject) && (
        <div className="owner-actions">
          <h4>Owner Actions</h4>
          <div className="action-buttons">
            {proposal.canApprove && (
              <button className="action-btn approve">
                <CheckCircle size={16} />
                Approve Proposal
              </button>
            )}
            {proposal.canReject && (
              <button className="action-btn reject">
                <AlertCircle size={16} />
                Reject Proposal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalVoting;
