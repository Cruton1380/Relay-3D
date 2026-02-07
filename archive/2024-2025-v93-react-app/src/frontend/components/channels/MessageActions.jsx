/**
 * @fileoverview Message Actions Component
 * Provides action buttons for messages (react, reply, etc.)
 */
import React, { useState } from 'react';
import ContentVoteButtons from './ContentVoteButtons.jsx';
import './MessageActions.css';

const MessageActions = ({ 
  message, 
  isOwn, 
  onReact, 
  onReply, 
  channelService, 
  channelId,
  showVoteButtons = true 
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickEmojis = ['👍', '❤️', '😂', '😮'];

  const handleQuickReact = async (emoji) => {
    if (onReact) {
      await onReact(emoji);
    }
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply();
    }
  };

  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleVoteUpdate = (voteData) => {
    // Propagate vote updates to parent components if needed
    console.log('Vote updated:', voteData);
  };

  return (
    <div className="message-actions">
      {/* Content Voting Buttons */}
      {showVoteButtons && (
        <div className="content-voting-section">
          <ContentVoteButtons
            contentId={message.id}
            contentInfo={{
              type: 'message',
              authorId: message.senderId,
              channelId: channelId,
              timestamp: message.timestamp,
              content: message.content,
              messageType: message.type
            }}
            channelId={channelId}
            size="small"
            variant="horizontal"
            onVoteUpdate={handleVoteUpdate}
          />
        </div>
      )}

      {/* Quick emoji reactions */}
      <div className="quick-reactions">
        {quickEmojis.map(emoji => (
          <button
            key={emoji}
            className="quick-reaction-btn"
            onClick={() => handleQuickReact(emoji)}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        {/* Reply button */}
        <button
          className="action-btn reply-btn"
          onClick={handleReplyClick}
          title="Reply to message"
        >
          <svg viewBox="0 0 24 24" className="action-icon">
            <path d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z"/>
          </svg>
        </button>

        {/* More reactions button */}
        <div className="more-reactions-container">
          <button
            className="action-btn more-reactions-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add reaction"
          >
            <svg viewBox="0 0 24 24" className="action-icon">
              <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L9,7V9C9,9.6 9.4,10 10,10H20C20.6,10 21,9.6 21,9M10,12C10.6,12 11,11.6 11,11V10H13V11C13,11.6 13.4,12 14,12H20C20.6,12 21,11.6 21,11V12H11.41L10,13.41V12M21,15H14C13.4,15 13,14.6 13,14V13H11V14C11,14.6 10.6,15 10,15H3V16H10C10.6,16 11,16.4 11,17V18H13V17C13,16.4 13.4,16 14,16H21V15M12,18C10.9,18 10,18.9 10,20C10,21.1 10.9,22 12,22C13.1,22 14,21.1 14,20C14,18.9 13.1,18 12,18Z"/>
            </svg>
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker-overlay" onClick={() => setShowEmojiPicker(false)}>
              <div className="emoji-picker" onClick={e => e.stopPropagation()}>
                <div className="emoji-picker-header">
                  <span>React to message</span>
                  <button onClick={() => setShowEmojiPicker(false)}>×</button>
                </div>
                <div className="emoji-grid">
                  {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map(emoji => (
                    <button
                      key={emoji}
                      className="emoji-option"
                      onClick={() => {
                        handleQuickReact(emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy button */}
        <button
          className="action-btn copy-btn"
          onClick={handleCopyMessage}
          title="Copy message"
        >
          <svg viewBox="0 0 24 24" className="action-icon">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageActions;
