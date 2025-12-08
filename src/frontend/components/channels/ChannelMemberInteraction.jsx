/**
 * @fileoverview Channel Member Interaction Component
 * Provides friend request and social interaction options for channel members
 */
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useSocialService } from '../../hooks/useSocial.js';
import FriendRequestIntegration from '../../services/friendRequestIntegration.js';
import QRCodeGenerator from '../shared/QRCodeGenerator.jsx';
import './ChannelMemberInteraction.css';

const ChannelMemberInteraction = ({ 
  member, 
  channelId, 
  channelName,
  onClose,
  socialService,
  channelService 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState('unknown');
  const [showQRCode, setShowQRCode] = useState(false);
  const [friendMessage, setFriendMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  // Initialize friend request integration
  const friendRequestIntegration = React.useMemo(() => {
    return new FriendRequestIntegration(socialService, channelService);
  }, [socialService, channelService]);

  React.useEffect(() => {
    if (member && socialService) {
      checkFriendshipStatus();
    }
  }, [member, socialService]);

  const checkFriendshipStatus = async () => {
    try {
      const status = await socialService.getFriendshipStatus(member.userId);
      setFriendshipStatus(status.status || 'none');
    } catch (error) {
      console.error('Failed to check friendship status:', error);
      setFriendshipStatus('unknown');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendMessage.trim()) {
      setShowMessageInput(true);
      return;
    }

    setLoading(true);
    try {
      // Check if request is allowed
      const permission = await friendRequestIntegration.canSendFriendRequest(
        user.id, 
        member.userId, 
        'channel'
      );

      if (!permission.allowed) {
        alert(permission.reason);
        return;
      }

      // Send friend request with channel context
      const result = await friendRequestIntegration.sendFriendRequestFromChannel(
        user.id,
        member.userId,
        channelId,
        friendMessage
      );

      if (result.success) {
        setFriendshipStatus('pending');
        alert('Friend request sent successfully!');
        setFriendMessage('');
        setShowMessageInput(false);
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

  const getFriendshipStatusDisplay = () => {
    switch (friendshipStatus) {
      case 'friends':
        return { text: 'Friends', color: 'text-green-600', icon: '✅' };
      case 'pending':
        return { text: 'Request Pending', color: 'text-yellow-600', icon: '⏳' };
      case 'blocked':
        return { text: 'Blocked', color: 'text-red-600', icon: '🚫' };
      default:
        return { text: 'Not Friends', color: 'text-gray-600', icon: '👤' };
    }
  };

  const statusDisplay = getFriendshipStatusDisplay();

  return (
    <div className="channel-member-interaction">
      <div className="interaction-backdrop" onClick={onClose} />
      <div className="interaction-content">
        <div className="interaction-header">
          <div className="member-info">
            <div className="member-avatar">
              {member.avatar ? (
                <img src={member.avatar} alt={member.displayName} />
              ) : (
                <div className="avatar-placeholder">
                  {(member.displayName || member.userId)?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3>{member.displayName || member.userId}</h3>
              <p className="channel-context">In: {channelName}</p>
              <div className={`friendship-status ${statusDisplay.color}`}>
                <span className="status-icon">{statusDisplay.icon}</span>
                <span>{statusDisplay.text}</span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="interaction-body">
          {friendshipStatus === 'friends' && (
            <div className="friends-actions">
              <p className="text-center text-green-600 mb-4">
                You are already friends with this user!
              </p>
              <button 
                className="btn btn-outline full-width"
                onClick={() => {/* Navigate to chat */}}
              >
                💬 Send Message
              </button>
            </div>
          )}

          {friendshipStatus === 'pending' && (
            <div className="pending-actions">
              <p className="text-center text-yellow-600 mb-4">
                Friend request is pending...
              </p>
            </div>
          )}

          {friendshipStatus === 'blocked' && (
            <div className="blocked-actions">
              <p className="text-center text-red-600 mb-4">
                This user has been blocked.
              </p>
            </div>
          )}

          {(friendshipStatus === 'none' || friendshipStatus === 'unknown') && (
            <div className="friend-request-actions">
              <h4>Send Friend Request</h4>
              <p className="context-info">
                Send a friend request to connect with this user from the <strong>{channelName}</strong> channel.
              </p>

              {!showMessageInput ? (
                <div className="quick-actions">
                  <button 
                    className="btn btn-primary full-width"
                    onClick={() => setShowMessageInput(true)}
                    disabled={loading}
                  >
                    ➕ Add as Friend
                  </button>
                  <button 
                    className="btn btn-outline full-width"
                    onClick={handleShareFriendRequest}
                    disabled={loading}
                  >
                    📤 Share Friend Request QR
                  </button>
                </div>
              ) : (
                <div className="message-input-section">
                  <label htmlFor="friend-message">Optional Message:</label>
                  <textarea
                    id="friend-message"
                    value={friendMessage}
                    onChange={(e) => setFriendMessage(e.target.value)}
                    placeholder={`Hi! I'd like to connect with you from the ${channelName} channel.`}
                    rows={3}
                    className="message-textarea"
                  />
                  <div className="message-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowMessageInput(false);
                        setFriendMessage('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSendFriendRequest}
                      disabled={loading || !friendMessage.trim()}
                    >
                      {loading ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="privacy-note">
            <p className="text-sm text-gray-500">
              🔒 Friend requests respect user privacy settings. If they decline requests from channel members, your request may not be delivered.
            </p>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <QRCodeGenerator
            type="friend"
            data={{
              userId: user.id,
              targetUserId: member.userId,
              targetUserName: member.displayName || member.userId,
              channelId,
              channelName,
              action: 'channel_request',
              message: `Friend request from ${channelName} channel`
            }}
            onClose={() => setShowQRCode(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChannelMemberInteraction;
