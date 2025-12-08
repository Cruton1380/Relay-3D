/**
 * @fileoverview Message Reactions Component
 * Displays and manages message reactions with real-time updates
 */
import React, { useState } from 'react';
import './MessageReactions.css';

const MessageReactions = ({ reactions, onReact, messageId, currentUserId }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Common emojis for quick reactions
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  const handleReactionClick = async (emoji) => {
    if (onReact) {
      await onReact(emoji);
    }
  };

  const handleEmojiSelect = async (emoji) => {
    await handleReactionClick(emoji);
    setShowEmojiPicker(false);
  };

  // Convert reactions Map to array for rendering
  const reactionArray = [];
  if (reactions && typeof reactions.entries === 'function') {
    for (const [emoji, users] of reactions.entries()) {
      if (users && users.size > 0) {
        reactionArray.push({
          emoji,
          count: users.size,
          users: Array.from(users),
          hasCurrentUser: users.has(currentUserId)
        });
      }
    }
  }

  if (reactionArray.length === 0 && !showEmojiPicker) {
    return null;
  }

  return (
    <div className="message-reactions">
      {/* Existing reactions */}
      {reactionArray.map(({ emoji, count, users, hasCurrentUser }) => (
        <button
          key={emoji}
          className={`reaction-pill ${hasCurrentUser ? 'reacted' : ''}`}
          onClick={() => handleReactionClick(emoji)}
          title={`${users.join(', ')} reacted with ${emoji}`}
        >
          <span className="reaction-emoji">{emoji}</span>
          <span className="reaction-count">{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="add-reaction-container">
        <button
          className="add-reaction-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add reaction"
        >
          <svg viewBox="0 0 24 24" className="add-reaction-icon">
            <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M7,14L12,9L17,14H7Z"/>
          </svg>
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="emoji-picker">
            <div className="emoji-picker-content">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
