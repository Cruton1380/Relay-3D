/**
 * @fileoverview Public Area Friend Request Component
 * Enables friend requests from public areas like forums, comments, and search results
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSocialService } from '../../hooks/useSocial.js';
import FriendRequestIntegration from '../../services/friendRequestIntegration.js';
import QRCodeGenerator from '../shared/QRCodeGenerator.jsx';
import { Button } from '../shared/index.js';
import './PublicAreaFriendRequest.css';

const PublicAreaFriendRequest = ({ 
  targetUser, 
  context = 'public', 
  contextInfo = {},
  onClose,
  showInline = false 
}) => {
  const { user } = useAuth();
  const socialService = useSocialService();
  const [loading, setLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState('unknown');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [friendMessage, setFriendMessage] = useState('');
  const [privacySettings, setPrivacySettings] = useState(null);

  // Initialize friend request integration
  const friendRequestIntegration = React.useMemo(() => {
    if (socialService) {
      return new FriendRequestIntegration(socialService, null);
    }
    return null;
  }, [socialService]);

  useEffect(() => {
    if (targetUser && socialService) {
      checkFriendshipStatus();
      loadPrivacySettings();
    }
  }, [targetUser, socialService]);

  const checkFriendshipStatus = async () => {
    try {
      const status = await socialService.getFriendshipStatus(targetUser.id);
      setFriendshipStatus(status.status || 'none');
    } catch (error) {
      console.error('Failed to check friendship status:', error);
      setFriendshipStatus('unknown');
    }
  };

  const loadPrivacySettings = async () => {
    try {
      if (friendRequestIntegration) {
        const settings = await friendRequestIntegration.getUserPrivacySettings(targetUser.id);
        setPrivacySettings(settings);
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendMessage.trim()) {
      setShowRequestForm(true);
      return;
    }

    setLoading(true);
    try {
      // Check if request is allowed
      const permission = await friendRequestIntegration.canSendFriendRequest(
        user.id, 
        targetUser.id, 
        context
      );

      if (!permission.allowed) {
        alert(permission.reason);
        return;
      }

      // Send friend request from public context
      const result = await friendRequestIntegration.sendFriendRequestFromPublic(
        user.id,
        targetUser.id,
        context,
        friendMessage
      );

      if (result.success) {
        setFriendshipStatus('pending');
        alert('Friend request sent successfully!');
        setFriendMessage('');
        setShowRequestForm(false);
        onClose?.();
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert(error.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleShareFriendRequest = () => {
    setShowQRCode(true);
  };

  const getContextDisplay = () => {
    const contextDisplays = {
      'public': 'Public Area',
      'proximity_scan': 'Proximity Detection',
      'qr_code': 'QR Code Scan',
      'user_search': 'User Search',
      'comment': 'Comment Thread',
      'post': 'Public Post',
      'forum': 'Forum Discussion'
    };
    return contextDisplays[context] || 'Public Area';
  };

  const getContextMessage = () => {
    switch (context) {
      case 'proximity_scan':
        return `Hi! I detected you nearby and would like to connect.`;
      case 'qr_code':
        return `Hi! I found you through a QR code and would like to connect.`;
      case 'user_search':
        return `Hi! I found your profile in search and would like to connect.`;
      case 'comment':
        return `Hi! I saw your comment and would like to connect.`;
      case 'post':
        return `Hi! I saw your post and would like to connect.`;
      case 'forum':
        return `Hi! I saw your discussion and would like to connect.`;
      default:
        return `Hi! I would like to connect with you on Relay.`;
    }
  };

  const getFriendshipStatusDisplay = () => {
    switch (friendshipStatus) {
      case 'friends':
        return { text: 'Friends', color: 'success', icon: '✅' };
      case 'pending':
        return { text: 'Request Pending', color: 'warning', icon: '⏳' };
      case 'blocked':
        return { text: 'Blocked', color: 'danger', icon: '🚫' };
      default:
        return { text: 'Add Friend', color: 'primary', icon: '➕' };
    }
  };

  // Check privacy restrictions
  const canSendRequest = () => {
    if (!privacySettings) return true;
    
    switch (context) {
      case 'proximity_scan':
        return privacySettings.allowProximityFriendRequests;
      case 'public':
      case 'user_search':
      case 'comment':
      case 'post':
      case 'forum':
        return privacySettings.allowPublicFriendRequests;
      default:
        return privacySettings.allowPublicFriendRequests;
    }
  };

  if (!targetUser || !user) {
    return null;
  }

  if (targetUser.id === user.id) {
    return null; // Don't show for self
  }

  const statusDisplay = getFriendshipStatusDisplay();

  // Inline version for comments/posts
  if (showInline) {
    return (
      <div className="public-friend-request inline">
        {friendshipStatus === 'none' && canSendRequest() && (
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowRequestForm(!showRequestForm)}
            disabled={loading}
          >
            {statusDisplay.icon} Add Friend
          </Button>
        )}
        
        {friendshipStatus === 'friends' && (
          <span className="friendship-status success">
            {statusDisplay.icon} {statusDisplay.text}
          </span>
        )}
        
        {friendshipStatus === 'pending' && (
          <span className="friendship-status warning">
            {statusDisplay.icon} {statusDisplay.text}
          </span>
        )}

        {showRequestForm && (
          <div className="inline-request-form">
            <textarea
              placeholder={getContextMessage()}
              value={friendMessage}
              onChange={(e) => setFriendMessage(e.target.value)}
              rows={2}
              className="message-input"
            />
            <div className="form-actions">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowRequestForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleSendFriendRequest}
                disabled={loading || !friendMessage.trim()}
              >
                {loading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal version
  return (
    <div className="public-friend-request modal">
      <div className="friend-request-overlay" onClick={onClose} />
      
      <div className="friend-request-modal">
        <div className="modal-header">
          <h3>Connect with {targetUser.name || targetUser.username}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="user-info">
            <div className="user-avatar">
              {targetUser.avatar ? (
                <img src={targetUser.avatar} alt={targetUser.name} />
              ) : (
                <div className="default-avatar">
                  {(targetUser.name || targetUser.username || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{targetUser.name || targetUser.username}</div>
              <div className="context-info">
                From: {getContextDisplay()}
                {contextInfo.location && (
                  <span className="location-info"> • {contextInfo.location}</span>
                )}
              </div>
            </div>
          </div>

          {!canSendRequest() && (
            <div className="privacy-notice">
              <p>This user has disabled friend requests from {getContextDisplay().toLowerCase()}.</p>
            </div>
          )}

          {friendshipStatus === 'friends' && (
            <div className="status-display success">
              <span className="status-icon">{statusDisplay.icon}</span>
              <span>You are already friends with this user</span>
            </div>
          )}

          {friendshipStatus === 'pending' && (
            <div className="status-display warning">
              <span className="status-icon">{statusDisplay.icon}</span>
              <span>Friend request is pending</span>
            </div>
          )}

          {friendshipStatus === 'blocked' && (
            <div className="status-display danger">
              <span className="status-icon">{statusDisplay.icon}</span>
              <span>This user has blocked you</span>
            </div>
          )}

          {(friendshipStatus === 'none' || friendshipStatus === 'unknown') && canSendRequest() && (
            <div className="friend-request-form">
              <label htmlFor="friend-message">Optional Message:</label>
              <textarea
                id="friend-message"
                placeholder={getContextMessage()}
                value={friendMessage}
                onChange={(e) => setFriendMessage(e.target.value)}
                rows={3}
                className="message-textarea"
              />
              
              <div className="form-actions">
                <Button
                  variant="outline"
                  onClick={handleShareFriendRequest}
                  disabled={loading}
                >
                  📤 Share QR Code
                </Button>
                
                <Button
                  variant="primary"
                  onClick={handleSendFriendRequest}
                  disabled={loading || !friendMessage.trim()}
                >
                  {loading ? 'Sending...' : 'Send Friend Request'}
                </Button>
              </div>
            </div>
          )}

          <div className="privacy-note">
            <p>🔒 Friend requests respect user privacy settings. Your request may not be delivered if the user has restricted friend requests from this context.</p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeGenerator
          type="friend"
          data={{
            userId: user.id,
            targetUserId: targetUser.id,
            targetUserName: targetUser.name || targetUser.username,
            action: 'public_request',
            context: getContextDisplay(),
            message: friendMessage || getContextMessage()
          }}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
};

export default PublicAreaFriendRequest;
