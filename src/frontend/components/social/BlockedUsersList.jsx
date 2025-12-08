/**
 * @fileoverview Blocked Users List Component
 * Displays list of blocked users with unblock functionality
 */
import React, { useState } from 'react';
import { Button } from '../shared/index.js';
import ConfirmDialog from '../dialogs/ConfirmDialog.jsx';
import './BlockedUsersList.css';

const BlockedUsersList = ({ 
  blockedUsers = [], 
  onUnblockUser, 
  loading 
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUnblock = (user) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const handleConfirmUnblock = async () => {
    if (!selectedUser) return;

    try {
      await onUnblockUser(selectedUser.id);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert('Failed to unblock user. Please try again.');
    } finally {
      setShowConfirm(false);
      setSelectedUser(null);
    }
  };

  const handleCancelUnblock = () => {
    setShowConfirm(false);
    setSelectedUser(null);
  };

  const formatBlockedDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="blocked-users-loading">
        <div className="spinner" />
        <p>Loading blocked users...</p>
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="blocked-users-empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
          </svg>
        </div>
        <h3>No blocked users</h3>
        <p>You haven't blocked anyone yet. Blocked users won't be able to send you messages or friend requests.</p>
      </div>
    );
  }

  return (
    <div className="blocked-users-list">
      <div className="blocked-users-header">
        <h3>Blocked Users ({blockedUsers.length})</h3>
        <p className="blocked-users-description">
          Blocked users cannot send you messages or friend requests. 
          You can unblock them at any time.
        </p>
      </div>

      <div className="blocked-users-content">
        {blockedUsers.map(user => (
          <div key={user.id} className="blocked-user-item">
            <div className="blocked-user-avatar">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="blocked-indicator">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                </svg>
              </div>
            </div>

            <div className="blocked-user-info">
              <h4 className="blocked-user-name">{user.name || 'Unknown User'}</h4>
              <p className="blocked-user-date">
                Blocked {formatBlockedDate(user.blockedAt)}
              </p>
              {user.reason && (
                <p className="blocked-user-reason">
                  Reason: {user.reason}
                </p>
              )}
            </div>

            <div className="blocked-user-actions">
              <Button
                variant="primary"
                size="small"
                onClick={() => handleUnblock(user)}
              >
                Unblock
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && selectedUser && (
        <ConfirmDialog
          title="Unblock User"
          message={`Are you sure you want to unblock ${selectedUser.name || 'this user'}? They will be able to send you messages and friend requests again.`}
          confirmText="Unblock"
          cancelText="Cancel"
          onConfirm={handleConfirmUnblock}
          onCancel={handleCancelUnblock}
          variant="primary"
        />
      )}
    </div>
  );
};

export default BlockedUsersList;
