/**
 * @fileoverview Friends List Component
 * Displays list of friends with presence status and actions
 */
import React, { useState } from 'react';
import { Button } from '../shared/index.js';
import ConfirmDialog from '../dialogs/ConfirmDialog.jsx';
import './FriendsList.css';

const FriendsList = ({ 
  friends, 
  friendPresence, 
  onRemoveFriend, 
  onBlockUser, 
  loading 
}) => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getPresenceStatus = (friendId) => {
    const presence = friendPresence.get(friendId);
    if (!presence) return 'offline';
    
    const now = Date.now();
    const lastSeen = presence.lastSeen;
    const status = presence.status;
    
    if (status === 'online') return 'online';
    if (status === 'away') return 'away';
    if (now - lastSeen < 300000) return 'recently-online'; // 5 minutes
    return 'offline';
  };

  const getPresenceText = (friendId) => {
    const status = getPresenceStatus(friendId);
    const presence = friendPresence.get(friendId);
    
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'recently-online':
        return 'Recently online';
      case 'offline':
        if (presence?.lastSeen) {
          const diff = Date.now() - presence.lastSeen;
          const days = Math.floor(diff / 86400000);
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor(diff / 60000);
          
          if (days > 0) return `${days}d ago`;
          if (hours > 0) return `${hours}h ago`;
          if (minutes > 0) return `${minutes}m ago`;
          return 'Just now';
        }
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const handleAction = (friend, action) => {
    setSelectedFriend(friend);
    setActionType(action);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedFriend || !actionType) return;

    try {
      if (actionType === 'remove') {
        await onRemoveFriend(selectedFriend.id);
      } else if (actionType === 'block') {
        await onBlockUser(selectedFriend.id);
      }
    } catch (error) {
      console.error(`Failed to ${actionType} friend:`, error);
      alert(`Failed to ${actionType} friend. Please try again.`);
    } finally {
      setShowConfirm(false);
      setSelectedFriend(null);
      setActionType(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirm(false);
    setSelectedFriend(null);
    setActionType(null);
  };

  if (loading) {
    return (
      <div className="friends-list-loading">
        <div className="spinner" />
        <p>Loading friends...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="friends-list-empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2 .97L13.56 11l1.07 1.07L16 10.75V22h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm1.5 1h-3c-1.1 0-2 .9-2 2v5.5h2V22h3v-2.5h2V14c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <h3>No friends yet</h3>
        <p>Add friends to start connecting with people around you!</p>
      </div>
    );
  }

  return (
    <div className="friends-list">
      {friends.map(friend => {
        const status = getPresenceStatus(friend.id);
        const presenceText = getPresenceText(friend.id);
        
        return (
          <div key={friend.id} className="friend-item">
            <div className="friend-avatar">
              {friend.avatar ? (
                <img 
                  src={friend.avatar} 
                  alt={friend.name}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {friend.name[0].toUpperCase()}
                </div>
              )}
              <div className={`presence-indicator ${status}`} />
            </div>

            <div className="friend-info">
              <h4 className="friend-name">{friend.name}</h4>
              <p className="friend-status">{presenceText}</p>
              {friend.mutualFriends > 0 && (
                <p className="mutual-friends">
                  {friend.mutualFriends} mutual friend{friend.mutualFriends !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="friend-actions">
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleAction(friend, 'remove')}
                title="Remove friend"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </Button>
              
              <Button
                variant="danger"
                size="small"
                onClick={() => handleAction(friend, 'block')}
                title="Block user"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                </svg>
              </Button>
            </div>
          </div>
        );
      })}

      {/* Confirmation Dialog */}
      {showConfirm && selectedFriend && (
        <ConfirmDialog
          title={actionType === 'remove' ? 'Remove Friend' : 'Block User'}
          message={
            actionType === 'remove' 
              ? `Are you sure you want to remove ${selectedFriend.name} from your friends list?`
              : `Are you sure you want to block ${selectedFriend.name}? They will not be able to send you messages or friend requests.`
          }
          confirmText={actionType === 'remove' ? 'Remove' : 'Block'}
          cancelText="Cancel"
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
          variant={actionType === 'block' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};

export default FriendsList;
