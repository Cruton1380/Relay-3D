/**
 * @fileoverview Encounter History Component
 * Displays user's proximity channel encounter history with filtering and search
 */
import React, { useState, useEffect } from 'react';
import { useEncounterHistory } from '../../hooks/useChannels.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import './EncounterHistory.css';

const EncounterHistory = ({ onChannelSelect, onLocationSearch }) => {
  const { user } = useAuth();
  const {
    encounters,
    loading,
    error,
    getEncounterHistory,
    searchEncountersByLocation,
    getReadOnlyAccess
  } = useEncounterHistory(user?.id, user?.token);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter encounters based on active filter
  const filteredEncounters = encounters.filter(encounter => {
    switch (activeFilter) {
      case 'proximity':
        return encounter.channelType === 'proximity';
      case 'regional':
        return encounter.channelType === 'regional';
      case 'global':
        return encounter.channelType === 'global';
      case 'recent':
        return Date.now() - encounter.timestamp < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      default:
        return true;
    }
  });

  // Sort encounters
  const sortedEncounters = [...filteredEncounters].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleViewChannel = async (encounter) => {
    try {
      // Try to get read-only access to the channel
      const accessData = await getReadOnlyAccess(encounter.channelId);
      if (accessData.success) {
        onChannelSelect?.(encounter.channelId, { readOnly: true, encounter });
      }
    } catch (error) {
      console.error('Failed to access channel:', error);
      // Could show a toast notification here
    }
  };

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          try {
            const result = await searchEncountersByLocation(location, searchRadius);
            onLocationSearch?.(result.encounters, location, searchRadius);
          } catch (error) {
            console.error('Location search failed:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const formatDuration = (duration) => {
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    if (duration < 3600000) return `${Math.round(duration / 60000)}m`;
    return `${Math.round(duration / 3600000)}h ${Math.round((duration % 3600000) / 60000)}m`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getChannelTypeIcon = (type) => {
    switch (type) {
      case 'proximity': return '📡';
      case 'regional': return '🌍';
      case 'global': return '🌐';
      default: return '💬';
    }
  };

  const getInteractionScore = (interaction) => {
    const { messagesSent, reactionsGiven, repliesSent } = interaction;
    return messagesSent * 2 + reactionsGiven + repliesSent;
  };

  if (loading) {
    return (
      <div className="encounter-history">
        <div className="encounter-history-header">
          <h2>Encounter History</h2>
        </div>
        <div className="encounter-history-loading">
          <div className="spinner" />
          <p>Loading encounter history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="encounter-history">
        <div className="encounter-history-header">
          <h2>Encounter History</h2>
        </div>
        <div className="encounter-history-error">
          <p>Error loading encounters: {error}</p>
          <button onClick={() => getEncounterHistory()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="encounter-history">
      {/* Header */}
      <div className="encounter-history-header">
        <h2>Encounter History</h2>
        <div className="encounter-history-stats">
          <span className="stat">
            <strong>{encounters.length}</strong> Total Encounters
          </span>
          <span className="stat">
            <strong>{new Set(encounters.map(e => e.channelId)).size}</strong> Unique Channels
          </span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="encounter-history-controls">
        <div className="filter-tabs">
          {[
            { id: 'all', label: 'All', count: encounters.length },
            { id: 'proximity', label: 'Proximity', count: encounters.filter(e => e.channelType === 'proximity').length },
            { id: 'regional', label: 'Regional', count: encounters.filter(e => e.channelType === 'regional').length },
            { id: 'global', label: 'Global', count: encounters.filter(e => e.channelType === 'global').length },
            { id: 'recent', label: 'Recent', count: encounters.filter(e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000).length }
          ].map(filter => (
            <button
              key={filter.id}
              className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        <div className="encounter-controls">
          <div className="sort-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="timestamp">Date</option>
              <option value="duration">Duration</option>
              <option value="channelName">Channel Name</option>
            </select>
            <button 
              className={`sort-order ${sortOrder === 'desc' ? 'desc' : 'asc'}`}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          <button 
            className="location-search-btn"
            onClick={() => setShowLocationSearch(!showLocationSearch)}
          >
            📍 Search by Location
          </button>
        </div>
      </div>

      {/* Location Search */}
      {showLocationSearch && (
        <div className="location-search">
          <div className="location-search-controls">
            <label>
              Search Radius:
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              />
              <span>{searchRadius}m</span>
            </label>
            <button onClick={handleLocationSearch}>
              Search Near Me
            </button>
          </div>
        </div>
      )}

      {/* Encounters List */}
      <div className="encounters-list">
        {sortedEncounters.length === 0 ? (
          <div className="no-encounters">
            <p>No encounters found for the selected filter.</p>
            <p>Join some proximity channels to start building your encounter history!</p>
          </div>
        ) : (
          sortedEncounters.map(encounter => (
            <div
              key={encounter.id}
              className="encounter-card"
              onClick={() => handleViewChannel(encounter)}
            >
              <div className="encounter-header">
                <div className="encounter-channel">
                  <span className="channel-icon">
                    {getChannelTypeIcon(encounter.channelType)}
                  </span>
                  <div className="channel-info">
                    <h3 className="channel-name">{encounter.channelName}</h3>
                    <span className={`channel-type ${encounter.channelType}`}>
                      {encounter.channelType}
                    </span>
                  </div>
                </div>
                <div className="encounter-date">
                  {formatDate(encounter.timestamp)}
                </div>
              </div>

              {encounter.channelDescription && (
                <p className="encounter-description">
                  {encounter.channelDescription}
                </p>
              )}

              <div className="encounter-stats">
                <div className="stat-item">
                  <span className="stat-label">Duration:</span>
                  <span className="stat-value">{formatDuration(encounter.duration)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Messages:</span>
                  <span className="stat-value">{encounter.interaction.messagesSent}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Reactions:</span>
                  <span className="stat-value">{encounter.interaction.reactionsGiven}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Interaction:</span>
                  <span className="stat-value interaction-score">
                    {getInteractionScore(encounter.interaction)}
                  </span>
                </div>
              </div>

              {encounter.metadata && (
                <div className="encounter-metadata">
                  {encounter.metadata.memberCount && (
                    <span className="metadata-item">
                      👥 {encounter.metadata.memberCount} members
                    </span>
                  )}
                  {encounter.metadata.distance && (
                    <span className="metadata-item">
                      📍 {Math.round(encounter.metadata.distance)}m away
                    </span>
                  )}
                  {encounter.metadata.isOfficial && (
                    <span className="metadata-item official">
                      ✅ Official
                    </span>
                  )}
                </div>
              )}

              <div className="encounter-actions">
                <button className="view-channel-btn">
                  View Channel (Read-Only)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EncounterHistory;
