/**
 * Search Panel - Integrated Search & Navigation
 * Connects to the full SearchModePanel.jsx for advanced search
 * ENHANCED: Integrated with Channel Discovery Service
 */
import React, { useState, useEffect, useCallback } from 'react';
import channelDiscoveryService from '../../../services/channelDiscoveryService.js';

const SearchPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    scope: 'all',
    reliability: 0,
    sortBy: 'activity',
    minVotes: 0,
    radius: 1000
  });
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discoveryStatus, setDiscoveryStatus] = useState('idle'); // idle, searching, success, error

  // Enhanced channel discovery with real service
  const discoverChannels = useCallback(async () => {
    if (!searchTerm.trim() && filters.scope === 'all') return;
    
    setLoading(true);
    setError(null);
    setDiscoveryStatus('searching');
    
    try {
      const criteria = {
        search: searchTerm,
        channelType: filters.scope === 'all' ? '' : filters.scope,
        minVotes: filters.minVotes,
        minReliability: filters.reliability,
        sortBy: filters.sortBy,
        limit: 20
      };

      const result = await channelDiscoveryService.discoverChannels(criteria);
      setChannels(result.channels || []);
      setDiscoveryStatus('success');
      
      console.log('🔍 Channel discovery results:', result);
    } catch (err) {
      console.error('Channel discovery failed:', err);
      setError(err.message);
      setDiscoveryStatus('error');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  // Auto-search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() || filters.scope !== 'all') {
        discoverChannels();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, discoverChannels]);

  // Load initial channels
  useEffect(() => {
    const loadInitialChannels = async () => {
      try {
        setLoading(true);
        const result = await channelDiscoveryService.discoverGlobalChannels();
        setChannels(result.channels || []);
        setDiscoveryStatus('success');
      } catch (err) {
        console.warn('Initial channel load failed:', err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialChannels();
  }, []);

  const handleChannelSelect = (channel) => {
    setGlobeState(prev => ({ ...prev, selectedChannel: channel }));
  };

  const handleJoinChannel = async (channelId) => {
    try {
      const result = await channelDiscoveryService.joinChannel(channelId, {
        joinMethod: 'discovery'
      });
      
      if (result.success) {
        console.log('✅ Successfully joined channel:', channelId);
        // Refresh channels to show updated join status
        discoverChannels();
      } else {
        console.error('Failed to join channel:', result.message);
      }
    } catch (err) {
      console.error('Join channel error:', err);
    }
  };

  const getStatusIcon = () => {
    switch (discoveryStatus) {
      case 'searching': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div className="search-panel">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginRight: '8px' }}>
            {getStatusIcon()} {discoveryStatus === 'searching' ? 'Searching...' : 'Channel Discovery'}
          </span>
        </div>
        <input
          type="text"
          placeholder="Search channels, topics, or locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(31, 41, 55, 0.8)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#9ca3af' }}>
          Scope
        </label>
        <select
          value={filters.scope}
          onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value }))}
          style={{
            width: '100%',
            padding: '6px',
            background: 'rgba(31, 41, 55, 0.8)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px'
          }}
        >
          <option value="all">All Channels</option>
          <option value="proximity">Proximity</option>
          <option value="regional">Regional</option>
          <option value="global">Global</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#9ca3af' }}>
          Sort by
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          style={{
            width: '100%',
            padding: '6px',
            background: 'rgba(31, 41, 55, 0.8)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px'
          }}
        >
          <option value="activity">Activity</option>
          <option value="votes">Vote Count</option>
          <option value="reliability">Reliability</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#9ca3af' }}>
          Min Votes
        </label>
        <input
          type="number"
          value={filters.minVotes}
          onChange={(e) => setFilters(prev => ({ ...prev, minVotes: parseInt(e.target.value) || 0 }))}
          style={{
            width: '100%',
            padding: '6px',
            background: 'rgba(31, 41, 55, 0.8)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px'
          }}
        />
      </div>

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
          Channels ({channels.length})
        </h3>
        
        {error && (
          <div style={{ 
            padding: '8px', 
            marginBottom: '8px', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '4px',
            color: '#fca5a5',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              ⏳ Loading channels...
            </div>
          ) : channels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              No channels found
            </div>
          ) : (
            channels.map(channel => (
              <div
                key={channel.id}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  background: globeState.selectedChannel?.id === channel.id 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (globeState.selectedChannel?.id !== channel.id) {
                    e.target.style.background = 'rgba(75, 85, 99, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (globeState.selectedChannel?.id !== channel.id) {
                    e.target.style.background = 'rgba(31, 41, 55, 0.5)';
                  }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span 
                    style={{ 
                      fontSize: '13px', 
                      fontWeight: '500', 
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    {channel.name}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {channel.topicReliabilityScore || 0}%
                    </span>
                    <button
                      onClick={() => handleJoinChannel(channel.id)}
                      style={{
                        padding: '2px 6px',
                        background: 'rgba(59, 130, 246, 0.8)',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#ffffff',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Join
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                  {channel.voteCount || 0} votes • {channel.channelType || 'unknown'} • {channel.memberCount || 0} members
                </div>
                {channel.description && (
                  <div style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic' }}>
                    {channel.description.substring(0, 60)}...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(75, 85, 99, 0.3)' }}>
        <button
          onClick={() => console.log('Open Advanced Search')}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(59, 130, 246, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🔍 Advanced Search
        </button>
      </div>
    </div>
  );
};

export default SearchPanel;
