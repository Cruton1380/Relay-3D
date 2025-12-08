/**
 * @fileoverview Typing Indicator Component
 * Shows when other users are typing in the channel
 */
import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const formatTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name || 'Someone'} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].name || 'Someone'} and ${users[1].name || 'someone else'} are typing...`;
    } else if (users.length === 3) {
      return `${users[0].name || 'Someone'}, ${users[1].name || 'someone'}, and ${users[2].name || 'someone else'} are typing...`;
    } else {
      return `${users[0].name || 'Someone'} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-avatar-group">
        {users.slice(0, 3).map((user, index) => (
          <div key={user.id || index} className="typing-avatar">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {(user.name || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {users.length > 3 && (
          <div className="typing-avatar more-users">
            +{users.length - 3}
          </div>
        )}
      </div>
      
      <div className="typing-bubble">
        <div className="typing-text">
          {formatTypingText()}
        </div>
        <div className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
