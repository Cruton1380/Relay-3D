/**
 * @fileoverview Friend Requests List Component
 * Displays pending and sent friend requests with actions
 */
import React, { useState } from 'react';
import { Button } from '../shared/index.js';
import ConfirmDialog from '../dialogs/ConfirmDialog.jsx';
import './FriendRequestsList.css';

const FriendRequestsList = ({ 
  pendingRequests = [], 
  sentRequests = [], 
  onAcceptRequest, 
  onDeclineRequest, 
  loading 
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('received');

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === 'accept') {
        await onAcceptRequest(selectedRequest.id);
      } else if (actionType === 'decline') {
        await onDeclineRequest(selectedRequest.id);
      }
    } catch (error) {
      console.error(`Failed to ${actionType} friend request:`, error);
      alert(`Failed to ${actionType} friend request. Please try again.`);
    } finally {
      setShowConfirm(false);
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirm(false);
    setSelectedRequest(null);
    setActionType(null);
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="friend-requests-loading">
        <div className="spinner" />
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="friend-requests-list">
      {/* Tabs */}
      <div className="request-tabs">
        <button
          className={`request-tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({pendingRequests.length})
        </button>
        <button
          className={`request-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {/* Content */}
      <div className="requests-content">
        {activeTab === 'received' && (
          <div className="received-requests">
            {pendingRequests.length === 0 ? (
              <div className="requests-empty">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                  </svg>
                </div>
                <h3>No pending requests</h3>
                <p>You don't have any friend requests at the moment.</p>
              </div>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="request-avatar">
                    {request.fromUser?.avatar ? (
                      <img 
                        src={request.fromUser.avatar} 
                        alt={request.fromUser.name}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {request.fromUser?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="request-info">
                    <h4 className="request-name">
                      {request.fromUser?.name || 'Unknown User'}
                    </h4>
                    <p className="request-time">
                      {formatTimeAgo(request.createdAt)}
                    </p>
                    {request.message && (
                      <p className="request-message">"{request.message}"</p>
                    )}
                  </div>

                  <div className="request-actions">
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleAction(request, 'accept')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleAction(request, 'decline')}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="sent-requests">
            {sentRequests.length === 0 ? (
              <div className="requests-empty">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3>No sent requests</h3>
                <p>You haven't sent any friend requests yet.</p>
              </div>
            ) : (
              sentRequests.map(request => (
                <div key={request.id} className="request-item sent">
                  <div className="request-avatar">
                    {request.toUser?.avatar ? (
                      <img 
                        src={request.toUser.avatar} 
                        alt={request.toUser.name}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {request.toUser?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="request-info">
                    <h4 className="request-name">
                      {request.toUser?.name || 'Unknown User'}
                    </h4>
                    <p className="request-time">
                      Sent {formatTimeAgo(request.createdAt)}
                    </p>
                    <p className="request-status">
                      {request.status === 'pending' && (
                        <span className="status-pending">Pending</span>
                      )}
                      {request.status === 'accepted' && (
                        <span className="status-accepted">Accepted</span>
                      )}
                      {request.status === 'declined' && (
                        <span className="status-declined">Declined</span>
                      )}
                    </p>
                    {request.message && (
                      <p className="request-message">"{request.message}"</p>
                    )}
                  </div>

                  <div className="request-actions">
                    {request.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="small"
                        disabled
                      >
                        Waiting...
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && selectedRequest && (
        <ConfirmDialog
          title={actionType === 'accept' ? 'Accept Friend Request' : 'Decline Friend Request'}
          message={
            actionType === 'accept' 
              ? `Accept friend request from ${selectedRequest.fromUser?.name || 'this user'}?`
              : `Decline friend request from ${selectedRequest.fromUser?.name || 'this user'}?`
          }
          confirmText={actionType === 'accept' ? 'Accept' : 'Decline'}
          cancelText="Cancel"
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
          variant={actionType === 'accept' ? 'primary' : 'secondary'}
        />
      )}
    </div>
  );
};

export default FriendRequestsList;
