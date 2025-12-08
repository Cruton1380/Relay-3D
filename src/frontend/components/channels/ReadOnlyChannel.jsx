/**
 * @fileoverview Read-Only Channel Viewer Component
 * Displays historical channel content in read-only mode for past encounters
 */
import React, { useState, useEffect } from 'react';
import { useReadOnlyChannel } from '../../hooks/useChannels.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import './ReadOnlyChannel.css';

const ReadOnlyChannel = ({ channelId, encounter, onClose }) => {
  const { user } = useAuth();
  const {
    channelData,
    messages,
    userEncounters,
    loading,
    error,
    hasAccess,
    permissions
  } = useReadOnlyChannel(channelId, user?.id, user?.token);

  const [activeTab, setActiveTab] = useState('messages');
  const [messageFilter, setMessageFilter] = useState('all');

  // Filter messages based on user's encounter period if available
  const filteredMessages = messages.filter(message => {
    if (messageFilter === 'my-encounter' && encounter) {
      const encounterStart = encounter.timestamp - (encounter.duration || 0);
      const encounterEnd = encounter.timestamp;
      return message.timestamp >= encounterStart && message.timestamp <= encounterEnd;
    }
    return true;
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString();
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (duration) => {
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    if (duration < 3600000) return `${Math.round(duration / 60000)}m`;
    return `${Math.round(duration / 3600000)}h ${Math.round((duration % 3600000) / 60000)}m`;
  };

  const getChannelTypeIcon = (type) => {
    switch (type) {
      case 'proximity': return '📡';
      case 'regional': return '🌍';
      case 'global': return '🌐';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="read-only-channel">
        <div className="read-only-channel-loading">
          <div className="spinner" />
          <p>Loading channel history...</p>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="read-only-channel">
        <div className="read-only-channel-error">
          <h3>Access Denied</h3>
          <p>{error || 'You do not have access to view this channel history.'}</p>
          <p>You can only view channels you have previously encountered.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="read-only-channel">
      {/* Header */}
      <div className="read-only-channel-header">
        <div className="channel-info">
          <div className="channel-title">
            <span className="channel-icon">
              {getChannelTypeIcon(channelData?.type)}
            </span>
            <div>
              <h2>{channelData?.name}</h2>
              <span className="read-only-badge">Read Only</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {channelData?.description && (
          <p className="channel-description">{channelData.description}</p>
        )}

        <div className="channel-metadata">
          <span className="metadata-item">
            📅 Created {new Date(channelData?.createdAt).toLocaleDateString()}
          </span>
          <span className="metadata-item">
            👥 {channelData?.memberCount || 0} members
          </span>
          {channelData?.isOfficial && (
            <span className="metadata-item official">
              ✅ Official Channel
            </span>
          )}
        </div>
      </div>

      {/* Your Encounters Summary */}
      {userEncounters.length > 0 && (
        <div className="user-encounters-summary">
          <h3>Your Encounters</h3>
          <div className="encounters-grid">
            {userEncounters.slice(0, 3).map((enc, index) => (
              <div key={enc.id} className="encounter-summary">
                <div className="encounter-date">
                  {new Date(enc.timestamp).toLocaleDateString()}
                </div>
                <div className="encounter-stats">
                  <span>⏱ {formatDuration(enc.duration)}</span>
                  <span>💬 {enc.interaction.messagesSent} msgs</span>
                  <span>👍 {enc.interaction.reactionsGiven} reactions</span>
                </div>
              </div>
            ))}
            {userEncounters.length > 3 && (
              <div className="more-encounters">
                +{userEncounters.length - 3} more encounters
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="read-only-tabs">
        <button
          className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages ({filteredMessages.length})
        </button>
        <button
          className={`tab ${activeTab === 'encounters' ? 'active' : ''}`}
          onClick={() => setActiveTab('encounters')}
        >
          All Encounters ({userEncounters.length})
        </button>
      </div>

      {/* Content */}
      <div className="read-only-content">
        {activeTab === 'messages' && (
          <div className="messages-view">
            {/* Message Filters */}
            <div className="message-filters">
              <button
                className={`filter-btn ${messageFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMessageFilter('all')}
              >
                All Messages
              </button>
              {encounter && (
                <button
                  className={`filter-btn ${messageFilter === 'my-encounter' ? 'active' : ''}`}
                  onClick={() => setMessageFilter('my-encounter')}
                >
                  During My Visit
                </button>
              )}
            </div>

            {/* Messages List */}
            <div className="messages-list">
              {filteredMessages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages found for the selected filter.</p>
                </div>
              ) : (
                filteredMessages.map(message => (
                  <div
                    key={message.id}
                    className={`message ${message.senderId === user?.id ? 'own-message' : ''}`}
                  >
                    <div className="message-header">
                      <span className="sender-name">
                        {message.senderName || message.senderId}
                      </span>
                      <span className="message-time">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div className="message-content">
                      {message.content}
                    </div>
                    {message.reactions && message.reactions.size > 0 && (
                      <div className="message-reactions">
                        {Array.from(message.reactions.entries()).map(([emoji, users]) => (
                          <span key={emoji} className="reaction">
                            {emoji} {users.size}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Read-Only Notice */}
            <div className="read-only-notice">
              <p>🔒 This is a historical view. You cannot send messages or reactions.</p>
            </div>
          </div>
        )}

        {activeTab === 'encounters' && (
          <div className="encounters-view">
            <div className="encounters-list">
              {userEncounters.map(enc => (
                <div key={enc.id} className="encounter-detail">
                  <div className="encounter-header">
                    <div className="encounter-date-detail">
                      {new Date(enc.timestamp).toLocaleString()}
                    </div>
                    <div className="encounter-duration">
                      {formatDuration(enc.duration)}
                    </div>
                  </div>
                  
                  <div className="encounter-activity">
                    <div className="activity-grid">
                      <div className="activity-item">
                        <span className="activity-icon">💬</span>
                        <span className="activity-count">{enc.interaction.messagesSent}</span>
                        <span className="activity-label">Messages Sent</span>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">👍</span>
                        <span className="activity-count">{enc.interaction.reactionsGiven}</span>
                        <span className="activity-label">Reactions Given</span>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">↩️</span>
                        <span className="activity-count">{enc.interaction.repliesSent}</span>
                        <span className="activity-label">Replies Sent</span>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">📍</span>
                        <span className="activity-count">
                          {enc.metadata?.distance ? `${Math.round(enc.metadata.distance)}m` : 'N/A'}
                        </span>
                        <span className="activity-label">Distance</span>
                      </div>
                    </div>
                  </div>

                  {enc.location && (
                    <div className="encounter-location">
                      <span className="location-icon">📍</span>
                      <span className="location-coords">
                        {enc.location.latitude.toFixed(4)}, {enc.location.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadOnlyChannel;
