/**
 * @fileoverview Member Item Component
 * Individual member display with status and action buttons
 */
import React from 'react';
import { Button } from '../shared/index.js';
import './MemberItem.css';

const MemberItem = ({
  member,
  isOnline,
  isCurrentUser,
  isCreator,
  canManage,
  onClick,
  onAction
}) => {
  const displayName = member.displayName || member.userId;
  const avatar = member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.userId}`;

  const getStatusBadge = () => {
    if (isCreator) {
      return <span className="member-badge creator">Creator</span>;
    }
    if (member.role === 'moderator') {
      return <span className="member-badge moderator">Moderator</span>;
    }
    return null;
  };

  const getLastSeenText = () => {
    if (isOnline) return 'Online';
    if (member.lastSeen) {
      const lastSeen = new Date(member.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
    return 'Unknown';
  };

  return (
    <div 
      className={`member-item ${isCurrentUser ? 'current-user' : ''} ${isOnline ? 'online' : 'offline'}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="member-avatar-container">
        <img
          src={avatar}
          alt={displayName}
          className="member-avatar"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${member.userId}`;
          }}
        />
        <div className={`member-status-indicator ${isOnline ? 'online' : 'offline'}`} />
      </div>

      {/* Member Info */}
      <div className="member-info">
        <div className="member-name-row">
          <span className="member-name">
            {displayName}
            {isCurrentUser && <span className="you-label">(You)</span>}
          </span>
          {getStatusBadge()}
        </div>
        <div className="member-details">
          <span className="member-last-seen">{getLastSeenText()}</span>
          {member.joinedAt && (
            <span className="member-joined">
              · Joined {new Date(member.joinedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="member-actions">
        {canManage && (
          <Button
            variant="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="member-action-button"
          >
            <svg viewBox="0 0 24 24" className="action-icon">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </Button>
        )}
        
        {!isCurrentUser && (
          <Button
            variant="primary"
            size="small"            onClick={(e) => {
              e.stopPropagation();
              // Open direct message interface
            }}
            className="member-message-button"
          >
            Message
          </Button>
        )}
      </div>
    </div>
  );
};

export default MemberItem;
