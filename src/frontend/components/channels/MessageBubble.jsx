/**
 * @fileoverview Message Bubble Component
 * Individual message display with reactions, threading, and encryption indicators
 */
import React, { useState } from 'react';
import MessageReactions from './MessageReactions.jsx';
import MessageActions from './MessageActions.jsx';
import ContentVoteButtons from './ContentVoteButtons.jsx';
import DictionaryTextRenderer from '../dictionary/DictionaryTextRenderer.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSemanticPreferences } from '../../hooks/useSemanticPreferences.js';
import './MessageBubble.css';

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true, 
  showTimestamp = true,
  onReact,
  onReply,
  onToggleThread,
  channelService,
  channelId
}) => {
  const { user } = useAuth();
  const { getChannelPreferences } = useSemanticPreferences();
  const [imageError, setImageError] = useState(false);
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Get semantic preferences for this channel
  const semanticPrefs = getChannelPreferences(channelId);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (showFullTimestamp) {
      return date.toLocaleString();
    }

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return (
          <svg viewBox="0 0 24 24" className="message-type-icon">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        );
      case 'file':
        return (
          <svg viewBox="0 0 24 24" className="message-type-icon">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'encrypted':
        return (
          <svg viewBox="0 0 24 24" className="message-type-icon encrypted">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V16H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="message-image-container">
            {!imageError ? (
              <img
                src={message.content}
                alt="Shared image"
                className="message-image"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="message-image-error">
                <svg viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>Image failed to load</span>
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="message-file">
            <div className="file-icon">
              {getMessageTypeIcon('file')}
            </div>
            <div className="file-info">
              <span className="file-name">{message.fileName || 'Unknown file'}</span>
              <span className="file-size">{message.fileSize || 'Unknown size'}</span>
            </div>
            <button className="file-download" onClick={() => window.open(message.content, '_blank')}>
              Download
            </button>
          </div>
        );

      case 'text':
      default:
        return (
          <div className="message-text">
            {renderTextWithSemanticLinks()}
          </div>
        );
    }
  };

  /**
   * Render text content with semantic dictionary links
   */
  const renderTextWithSemanticLinks = () => {
    // Check if semantic linking is disabled by user
    if (!semanticPrefs.enableSemanticLinking) {
      return <span className="dictionary-plain-text">{message.content}</span>;
    }
    
    // Check if semantic data is available from server
    if (message.semanticData && message.semanticData.entities && message.semanticData.entities.length > 0) {
      return (
        <DictionaryTextRenderer
          content={message.semanticData}
          userId={user?.id}
          options={{
            enableHover: semanticPrefs.enableHoverPreviews,
            enableClick: semanticPrefs.enableClickInteractions,
            showAllTerms: false,
            linkDensity: semanticPrefs.linkDensity,
            showAmbiguityIndicators: semanticPrefs.showAmbiguityIndicators,
            preferredCategories: semanticPrefs.preferredCategories,
            fadeInAnimation: semanticPrefs.fadeInAnimation
          }}
        />
      );
    }
    
    // Fallback to plain text if no semantic data
    return <span className="dictionary-plain-text">{message.content}</span>;
  };

  const handleReaction = async (emoji) => {
    if (onReact) {
      await onReact(message.id, emoji);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleToggleThread = () => {
    if (onToggleThread && message.replyCount > 0) {
      onToggleThread(message.id);
    }
  };

  // Enhanced user info with moderation status
  const getUserInfo = () => {
    const author = message.author || {};
    const moderationStatus = author.moderationStatus || author;
    
    return {
      username: author.username || author.id?.substring(0, 8) || 'Unknown',
      score: moderationStatus.score || 0,
      percentile: moderationStatus.percentile || 0,
      badge: moderationStatus.badge,
      status: moderationStatus.status || 'normal',
      canDownvote: moderationStatus.canDownvote !== false
    };
  };

  const userInfo = getUserInfo();
  const isMuted = userInfo.status === 'muted';
  const isFiltered = userInfo.status === 'filtered';
  const isTrusted = userInfo.status === 'trusted';

  // Check if message should be collapsed
  const shouldCollapse = message.isCollapsed || (isMuted && !message.forceShow);

  const handleToggleCollapsed = () => {
    // Toggle between collapsed and expanded view
    if (message.onToggleCollapsed) {
      message.onToggleCollapsed(message.id);
    }
  };

  const renderReplyToIndicator = () => {
    if (!message.replyToId) return null;
    
    return (
      <div className="reply-to-indicator">
        <svg viewBox="0 0 24 24" className="reply-icon">
          <path d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z"/>
        </svg>
        <span>Replying to message</span>
      </div>
    );
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.replyToId ? 'reply' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="message-avatar">
          {message.senderAvatar ? (
            <img 
              src={message.senderAvatar} 
              alt={message.senderName}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {(message.senderName || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
      )}      {/* Message content */}
      <div className="message-content">
        {/* Enhanced sender info with moderation status */}
        {showAvatar && !isOwn && (
          <div className="message-sender-enhanced">
            <span className="sender-name">
              {userInfo.username}
              {userInfo.badge && <span className="user-badge" title={`${userInfo.percentile}th percentile`}>{userInfo.badge}</span>}
            </span>
            <div className="sender-moderation-info">
              <span className="user-score" title="Community Score">
                ⬆️{Math.max(0, userInfo.score)} ⬇️{Math.max(0, -userInfo.score)}
              </span>
              <span className="user-percentile" title="Percentile Ranking">
                {userInfo.percentile}th
              </span>
              {userInfo.status === 'muted' && (
                <span className="muted-label" title="Muted by Community">🔇</span>
              )}
              {userInfo.status === 'filtered' && (
                <span className="filtered-label" title="Below Filter Threshold">⚠️</span>
              )}
              {userInfo.status === 'trusted' && (
                <span className="trusted-label" title="Trusted Community Member">✨</span>
              )}
            </div>
          </div>
        )}

        {/* Collapsed message handling */}
        {shouldCollapse ? (
          <div className="collapsed-message">
            <div className="collapsed-content">
              <span className="collapsed-text">Message hidden by community moderation</span>
              <button 
                className="show-collapsed" 
                onClick={handleToggleCollapsed}
                title="Click to view hidden message"
              >
                Show Message
              </button>
            </div>
            <div className="collapsed-reason">
              {isMuted ? 'User below community threshold' : 'Message filtered by score'}
            </div>
          </div>
        ) : (
          <>
            {/* Reply indicator */}
            {renderReplyToIndicator()}

            {/* Message bubble */}
            <div 
              className="message-bubble-content"
              onMouseEnter={() => setShowActions(true)}
              onMouseLeave={() => setShowActions(false)}
            >
              {/* Message type indicator */}
              {message.messageType !== 'text' && (
                <div className="message-type-indicator">
                  {getMessageTypeIcon(message.messageType)}
                </div>
              )}

              {/* Encryption indicator */}
              {message.encrypted && (
                <div className="encryption-indicator" title="End-to-end encrypted">
                  <svg viewBox="0 0 24 24" className="encryption-icon">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V16H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
                  </svg>
                </div>
              )}

              {/* Message content */}
              {renderMessageContent()}

              {/* Enhanced Message Actions with voting restrictions */}
              {showActions && (
                <MessageActions
                  message={message}
                  isOwn={isOwn}
                  onReact={handleReaction}
                  onReply={handleReply}
                  channelService={channelService}
                  channelId={channelId}
                  canDownvote={userInfo.canDownvote}
                />
              )}

              {/* Timestamp */}
              {showTimestamp && (
            <div 
              className="message-timestamp"
              onClick={() => setShowFullTimestamp(!showFullTimestamp)}
              title="Click for full timestamp"
            >
              {formatTime(message.timestamp)}
              {message.edited && <span className="edited-indicator">(edited)</span>}
            </div>
          )}

          {/* Delivery status (for own messages) */}
          {isOwn && (
            <div className="message-status">
              {message.status === 'sending' && (
                <svg viewBox="0 0 24 24" className="status-icon sending">
                  <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                </svg>
              )}
              {message.status === 'sent' && (
                <svg viewBox="0 0 24 24" className="status-icon sent">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                </svg>
              )}
              {message.status === 'delivered' && (
                <div className="status-checkmarks">
                  <svg viewBox="0 0 24 24" className="status-icon delivered">
                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" className="status-icon delivered offset">
                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                  </svg>
                </div>
              )}
              {message.status === 'failed' && (
                <svg viewBox="0 0 24 24" className="status-icon failed">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              )}            </div>
          )}
        </div>

        {/* Enhanced Content Voting with Moderation Info */}
        <div className="message-voting-section">
          <ContentVoteButtons
            contentId={message.id}
            contentInfo={{
              voteScore: message.voteScore || 0,
              upvotes: message.upvotes || 0,
              downvotes: message.downvotes || 0,
              userVote: message.userVote || null,
              wilsonScore: message.wilsonScore || 0
            }}
            channelId={channelId}
            size="small"
            variant="horizontal"
            canDownvote={userInfo.canDownvote}
            onVoteUpdate={(voteData) => {
              // Update message data with new vote info
              if (message.onVoteUpdate) {
                message.onVoteUpdate(voteData);
              }
            }}
          />
          
          {/* Downvote restriction notice */}
          {!userInfo.canDownvote && (
            <div className="downvote-restriction" title="Downvoting requires higher community standing">
              <span className="restriction-icon">🔒</span>
              <span className="restriction-text">Downvote locked</span>
            </div>
          )}
        </div>

        {/* Message Reactions */}
        {message.reactions && message.reactions.size > 0 && (
          <MessageReactions
            reactions={message.reactions}
            onReact={handleReaction}
            messageId={message.id}
          />
        )}

        {/* Thread indicator */}
        {message.replyCount > 0 && (
          <div className="thread-indicator" onClick={handleToggleThread}>
            <svg viewBox="0 0 24 24" className="thread-icon">
              <path d="M7,7H17V10H19V7A2,2 0 0,0 17,5H7A2,2 0 0,0 5,7V17A2,2 0 0,0 7,19H10V17H7V7M21,13V19A2,2 0 0,1 19,21H13A2,2 0 0,1 11,19V13A2,2 0 0,1 13,11H19A2,2 0 0,1 21,13M19,13H13V19H19V13M14,15H18V14H14V15M14,17H17V16H14V17Z"/>
            </svg>
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
