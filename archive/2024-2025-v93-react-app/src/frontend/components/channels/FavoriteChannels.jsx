/**
 * @fileoverview Favorite Channels Component
 * Manages both historic proximity channels and saved favorite channels
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useEncounterHistory } from '../../hooks/useChannels.js';
import QRCodeGenerator from '../shared/QRCodeGenerator.jsx';
import { Button } from '../shared/index.js';
import './FavoriteChannels.css';

const FavoriteChannels = ({ onChannelSelect, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('favorites');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [favoriteChannels, setFavoriteChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    encounters,
    loading,
    error,
    getEncounterHistory,
    getReadOnlyAccess,
    getChannelStats
  } = useEncounterHistory(user?.id, user?.token);

  useEffect(() => {
    loadFavoriteChannels();
  }, []);

  const loadFavoriteChannels = async () => {
    try {
      // Load user's favorite channels from local storage or API
      const saved = localStorage.getItem(`relay_favorites_${user?.id}`);
      if (saved) {
        setFavoriteChannels(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load favorite channels:', error);
    }
  };

  const saveFavoriteChannels = (channels) => {
    try {
      localStorage.setItem(`relay_favorites_${user?.id}`, JSON.stringify(channels));
      setFavoriteChannels(channels);
    } catch (error) {
      console.error('Failed to save favorite channels:', error);
    }
  };

  const addToFavorites = (channel) => {
    const exists = favoriteChannels.find(fav => fav.channelId === channel.channelId);
    if (!exists) {
      const newFavorites = [...favoriteChannels, {
        ...channel,
        addedAt: Date.now(),
        type: 'favorite'
      }];
      saveFavoriteChannels(newFavorites);
    }
  };

  const removeFromFavorites = (channelId) => {
    const newFavorites = favoriteChannels.filter(fav => fav.channelId !== channelId);
    saveFavoriteChannels(newFavorites);
  };

  const isFavorite = (channelId) => {
    return favoriteChannels.some(fav => fav.channelId === channelId);
  };

  const handleChannelAccess = async (channel) => {
    try {
      // Check access permissions
      const access = await getReadOnlyAccess(channel.channelId);
      
      if (access.hasAccess) {
        onChannelSelect?.(channel.channelId, access.accessType);
      } else {
        alert('No access to this channel. You need to be in proximity to join.');
      }
    } catch (error) {
      console.error('Failed to access channel:', error);
      alert('Failed to access channel. Please try again.');
    }
  };

  const getChannelIcon = (category) => {
    const icons = {
      'Cafe': '☕',
      'Transport': '🚌',
      'Airport': '✈️',
      'Hotel': '🏨',
      'Mobile': '📱',
      'Audio': '🎧',
      'Gaming': '🎮',
      'Computer': '💻',
      'General': '🌐'
    };
    return icons[category] || '📡';
  };

  const getTimeSince = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  };

  const filteredData = () => {
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'favorites') {
      return favoriteChannels.filter(channel => 
        channel.channelName?.toLowerCase().includes(query) ||
        channel.category?.toLowerCase().includes(query)
      );
    } else {
      return encounters.filter(channel =>
        channel.channelName?.toLowerCase().includes(query) ||
        channel.category?.toLowerCase().includes(query)
      );
    }
  };

  if (loading) {
    return (
      <div className="favorite-channels">
        <div className="favorite-channels-header">
          <h3>Channel Collections</h3>
          {onClose && (
            <Button variant="secondary" size="small" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorite-channels">
      <div className="favorite-channels-header">
        <h3>Channel Collections</h3>
        {onClose && (
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="channel-tabs">
        <button 
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ⭐ Favorites ({favoriteChannels.length})
        </button>
        <button 
          className={`tab ${activeTab === 'historic' ? 'active' : ''}`}
          onClick={() => setActiveTab('historic')}
        >
          📜 Historic ({encounters.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Content */}
      <div className="channels-content">
        {error && (
          <div className="error-state">
            <p>Error loading channels: {error}</p>
            <Button onClick={() => getEncounterHistory()}>Retry</Button>
          </div>
        )}

        {filteredData().length === 0 ? (
          <div className="empty-state">
            {activeTab === 'favorites' ? (
              <>
                <p>No favorite channels yet</p>
                <small>Add channels to favorites from your historic encounters</small>
              </>
            ) : (
              <>
                <p>No historic channels found</p>
                <small>Start discovering proximity channels to build your history</small>
              </>
            )}
          </div>
        ) : (
          <div className="channels-list">
            {filteredData().map((channel) => (
              <div key={channel.channelId} className="channel-item">
                <div className="channel-icon">
                  {getChannelIcon(channel.category)}
                </div>
                
                <div className="channel-info">
                  <div className="channel-name">{channel.channelName}</div>
                  <div className="channel-details">
                    <span className="channel-type">{channel.channelType}</span>
                    <span className="channel-category">{channel.category}</span>
                    {channel.lastSeen && (
                      <span className="last-seen">
                        {getTimeSince(channel.lastSeen)}
                      </span>
                    )}
                  </div>
                  {channel.encounterCount && (
                    <div className="encounter-count">
                      {channel.encounterCount} encounters
                    </div>
                  )}
                </div>

                <div className="channel-actions">
                  {activeTab === 'historic' && (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => 
                        isFavorite(channel.channelId) 
                          ? removeFromFavorites(channel.channelId)
                          : addToFavorites(channel)
                      }
                    >
                      {isFavorite(channel.channelId) ? '⭐' : '☆'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                      setSelectedChannel(channel);
                      setShowQRCode(true);
                    }}
                  >
                    📤
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleChannelAccess(channel)}
                  >
                    {channel.isActive ? 'Join' : 'View'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && selectedChannel && (
        <QRCodeGenerator
          type="channel"
          data={{
            channelId: selectedChannel.channelId,
            channelName: selectedChannel.channelName,
            action: 'join',
            message: `Join ${selectedChannel.channelName} on Relay!`
          }}
          onClose={() => {
            setShowQRCode(false);
            setSelectedChannel(null);
          }}
        />
      )}
    </div>
  );
};

export default FavoriteChannels;
