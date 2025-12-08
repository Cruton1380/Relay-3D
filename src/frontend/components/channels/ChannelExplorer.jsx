/**
 * @fileoverview Channel Explorer - Browse and Manage Channels
 * Comprehensive interface for discovering and joining channels across all scopes
 */
import React, { useState, useEffect } from 'react';
import { useChannelUpdates, useWebSocket } from '../../hooks/useWebSocket.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import './ChannelExplorer.css';

const ChannelExplorer = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  
  const [channels, setChannels] = useState([]);
  const [userChannels, setUserChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('discover'); // discover, joined, create
  const [filters, setFilters] = useState({
    scope: 'all', // all, proximity, regional, global
    category: 'all',
    location: '',
    searchTerm: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch channels on component mount and filter changes
  useEffect(() => {
    fetchChannels();
  }, [filters, activeTab]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      
      const endpoint = activeTab === 'joined' 
        ? '/api/channels/user-channels'
        : '/api/channels/discover';
        
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 50
      });

      const response = await fetch(`${endpoint}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const data = await response.json();
      
      if (activeTab === 'joined') {
        setUserChannels(data.channels || []);
      } else {
        setChannels(data.channels || []);
      }
      
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
      const response = await fetch('/api/channels/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channelId })
      });

      if (!response.ok) {
        throw new Error('Failed to join channel');
      }

      // Update local state
      const joinedChannel = channels.find(c => c.id === channelId);
      if (joinedChannel) {
        setUserChannels(prev => [...prev, { ...joinedChannel, membershipStatus: 'member' }]);
        setChannels(prev => prev.map(c => 
          c.id === channelId 
            ? { ...c, memberCount: c.memberCount + 1, userMembership: 'member' }
            : c
        ));
      }

      // Send real-time update
      sendMessage({
        type: 'channel_join',
        channelId,
        userId: user.id
      });

    } catch (err) {
      console.error('Error joining channel:', err);
      setError(err.message);
    }
  };

  const handleLeaveChannel = async (channelId) => {
    try {
      const response = await fetch('/api/channels/leave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channelId })
      });

      if (!response.ok) {
        throw new Error('Failed to leave channel');
      }

      // Update local state
      setUserChannels(prev => prev.filter(c => c.id !== channelId));
      setChannels(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, memberCount: Math.max(0, c.memberCount - 1), userMembership: null }
          : c
      ));

    } catch (err) {
      console.error('Error leaving channel:', err);
      setError(err.message);
    }
  };

  const filteredChannels = (activeTab === 'joined' ? userChannels : channels).filter(channel => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return channel.name.toLowerCase().includes(searchLower) ||
             channel.description?.toLowerCase().includes(searchLower) ||
             channel.tags?.some(tag => tag.toLowerCase().includes(searchLower));
    }
    return true;
  });

  return (
    <div className="channel-explorer">
      <header className="explorer-header">
        <h1>🌐 Channel Explorer</h1>
        <p>Discover and join communities across proximity, regional, and global channels</p>
        
        <div className="tab-navigation">
          <button
            className={activeTab === 'discover' ? 'active' : ''}
            onClick={() => setActiveTab('discover')}
          >
            🔍 Discover Channels
          </button>
          <button
            className={activeTab === 'joined' ? 'active' : ''}
            onClick={() => setActiveTab('joined')}
          >
            📋 My Channels ({userChannels.length})
          </button>
          <button
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Create Channel
          </button>
        </div>
      </header>

      <div className="explorer-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search channels, topics, or tags..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={filters.scope}
            onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Scopes</option>
            <option value="proximity">🏘️ Proximity</option>
            <option value="regional">🌍 Regional</option>
            <option value="global">🌐 Global</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="community">Community</option>
            <option value="business">Business</option>
            <option value="government">Government</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="technology">Technology</option>
          </select>

          <input
            type="text"
            placeholder="Location filter..."
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="location-filter"
          />
        </div>
      </div>

      <div className="channels-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading channels...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Error loading channels: {error}</p>
            <button onClick={fetchChannels} className="retry-button">
              Try Again
            </button>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="empty-state">
            <h3>No channels found</h3>
            <p>Try adjusting your search or filters</p>
            {activeTab === 'discover' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="create-channel-button"
              >
                Create the first channel
              </button>
            )}
          </div>
        ) : (
          <div className="channels-grid">
            {filteredChannels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isJoined={activeTab === 'joined' || channel.userMembership}
                onJoin={() => handleJoinChannel(channel.id)}
                onLeave={() => handleLeaveChannel(channel.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onChannelCreated={(newChannel) => {
            setUserChannels(prev => [...prev, newChannel]);
            setShowCreateModal(false);
            setActiveTab('joined');
          }}
        />
      )}
    </div>
  );
};

const ChannelCard = ({ channel, isJoined, onJoin, onLeave }) => {
  const channelUpdates = useChannelUpdates(channel.id);
  const [localChannel, setLocalChannel] = useState(channel);

  // Update channel data from real-time updates
  useEffect(() => {
    if (channelUpdates) {
      setLocalChannel(prev => ({ ...prev, ...channelUpdates }));
    }
  }, [channelUpdates]);

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'proximity': return '🏘️';
      case 'regional': return '🌍';
      case 'global': return '🌐';
      default: return '📍';
    }
  };

  const getScopeColor = (scope) => {
    switch (scope) {
      case 'proximity': return 'proximity';
      case 'regional': return 'regional';
      case 'global': return 'global';
      default: return 'default';
    }
  };

  return (
    <div className={`channel-card ${getScopeColor(localChannel.scope)}`}>
      <div className="channel-header">
        <div className="channel-title">
          <h3>{localChannel.name}</h3>
          <div className="channel-badges">
            <span className={`scope-badge ${getScopeColor(localChannel.scope)}`}>
              {getScopeIcon(localChannel.scope)} {localChannel.scope}
            </span>
            {localChannel.isVerified && (
              <span className="verified-badge">✓ Verified</span>
            )}
            {localChannel.isOfficial && (
              <span className="official-badge">👑 Official</span>
            )}
          </div>
        </div>
        
        <div className="channel-stats">
          <span className="member-count">
            👥 {localChannel.memberCount || 0}
          </span>
          {localChannel.activityLevel && (
            <span className="activity-level">
              📊 {localChannel.activityLevel}
            </span>
          )}
        </div>
      </div>

      {localChannel.description && (
        <p className="channel-description">{localChannel.description}</p>
      )}

      {localChannel.location && (
        <div className="channel-location">
          📍 {localChannel.location}
        </div>
      )}

      {localChannel.tags && localChannel.tags.length > 0 && (
        <div className="channel-tags">
          {localChannel.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
          {localChannel.tags.length > 3 && (
            <span className="tag-more">+{localChannel.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="channel-meta">
        <div className="channel-info">
          {localChannel.ownerType && (
            <span className="owner-type">{localChannel.ownerType}</span>
          )}
          {localChannel.createdAt && (
            <span className="created-date">
              Created {new Date(localChannel.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {localChannel.recentActivity && (
          <div className="recent-activity">
            <span className="activity-indicator">
              {localChannel.recentActivity > 0 ? '📈' : '💤'}
              {localChannel.recentActivity > 0 ? ' Active' : ' Quiet'}
            </span>
          </div>
        )}
      </div>

      <div className="channel-actions">
        {isJoined ? (
          <>
            <button className="view-button primary">
              Enter Channel
            </button>
            <button 
              className="leave-button secondary"
              onClick={onLeave}
            >
              Leave
            </button>
          </>
        ) : (
          <>
            <button 
              className="join-button primary"
              onClick={onJoin}
            >
              Join Channel
            </button>
            <button className="preview-button secondary">
              Preview
            </button>
          </>
        )}
      </div>

      {localChannel.topicRowPosition && (
        <div className="topic-row-info">
          <span className="position-badge">
            #{localChannel.topicRowPosition} in {localChannel.topicRowName}
          </span>
        </div>
      )}
    </div>
  );
};

const CreateChannelModal = ({ onClose, onChannelCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'proximity',
    category: 'community',
    location: '',
    tags: '',
    isPublic: true,
    requiresApproval: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/channels/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      const newChannel = await response.json();
      onChannelCreated(newChannel);

    } catch (err) {
      console.error('Error creating channel:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Channel</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Channel Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter channel name..."
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your channel..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Scope *</label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                required
              >
                <option value="proximity">🏘️ Proximity</option>
                <option value="regional">🌍 Regional</option>
                <option value="global">🌐 Global</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="community">Community</option>
                <option value="business">Business</option>
                <option value="government">Government</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="technology">Technology</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter location..."
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Enter tags separated by commas..."
            />
          </div>

          <div className="form-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              />
              Public channel (visible to all users)
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
              />
              Require approval to join
            </label>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChannelExplorer; 