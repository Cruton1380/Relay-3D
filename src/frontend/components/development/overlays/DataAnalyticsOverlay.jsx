/**
 * Data Analytics Overlay
 * Displays data insights, analytics, and metrics
 */
import React, { useState, useRef, useEffect } from 'react';
import { Database, BarChart3, Activity, TrendingUp } from 'lucide-react';
import dataService from '../../../services/dataService';
import { useEnhancedGridDraggable } from '../../../hooks/useEnhancedGridDraggable';
import './DevOverlay.css';
import './EnhancedGridLayout.css';

const DataAnalyticsOverlay = ({ isVisible, onClose, position, onPositionChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [dataInfo, setDataInfo] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalChannels: 0,
    totalVotes: 0,
    activeUsers: 0,
    voteVelocity: 0,
    topChannels: [],
    recentActivity: []
  });
  const [windowSize, setWindowSize] = useState({ width: 500, height: 400 });
  
  const overlayRef = useRef(null);
  
  const { 
    isDragging, 
    isResizing,
    showLayoutSuggestions, 
    activeZone, 
    isSnapping,
    gridPositions,
    windowDimensions,
    handleMouseDown,
    handleMouseEnter,
    resizeDirection
  } = useEnhancedGridDraggable({
    ref: overlayRef,
    position,
    onPositionChange,
    onSizeChange: setWindowSize,
    windowType: 'large',
    windowId: 'data-analytics-overlay',
    disabled: isMinimized
  });

  useEffect(() => {
    if (isVisible) {
      loadAnalytics();
      const interval = setInterval(loadAnalytics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const loadAnalytics = async () => {
    try {
      const channels = await dataService.getChannels();
      const sourceInfo = dataService.getDataSourceInfo();
      
      // Robust validation to prevent crashes
      let validChannels = [];
      if (Array.isArray(channels)) {
        validChannels = channels;
      } else if (channels && Array.isArray(channels.channels)) {
        validChannels = channels.channels;
      } else if (channels && typeof channels === 'object') {
        // Convert object to array safely
        validChannels = Object.values(channels).filter(item => 
          item && typeof item === 'object' && (item.id || item.name)
        );
      }
      
      // Final safety check
      if (!Array.isArray(validChannels)) {
        console.warn('DataAnalyticsOverlay: channels is not an array, using empty array');
        validChannels = [];
      }
      
      // Calculate analytics safely
      const totalVotes = validChannels.reduce((sum, channel) => sum + (channel.totalVotes || 0), 0);
      
      // Safe sort with validation
      let topChannels = [];
      if (validChannels.length > 0) {
        try {
          topChannels = [...validChannels] // Create a copy
            .filter(channel => channel && typeof channel === 'object')
            .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
            .slice(0, 5);
        } catch (sortError) {
          console.warn('DataAnalyticsOverlay: Error sorting channels:', sortError);
          topChannels = validChannels.slice(0, 5); // Take first 5 without sorting
        }
      }
      
      setDataInfo({
        channelCount: validChannels.length,
        hasTestMarkers: validChannels.some(c => c.isTestData),
        sourceInfo
      });
      
      setAnalytics({
        totalChannels: validChannels.length,
        totalVotes,
        activeUsers: Math.floor(Math.random() * 200) + 50, // Mock data
        voteVelocity: Math.floor(Math.random() * 30) + 5, // Mock data
        topChannels,
        recentActivity: generateRecentActivity()
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Set safe fallback data
      setAnalytics({
        totalChannels: 0,
        totalVotes: 0,
        activeUsers: 0,
        voteVelocity: 0,
        topChannels: [],
        recentActivity: []
      });
    }
  };

  const generateRecentActivity = () => {
    const activities = [
      'New vote on Local Government',
      'Channel created: Community Events',
      'User joined discussion',
      'Vote threshold reached',
      'New proposal submitted'
    ];
    
    return activities.slice(0, 3).map((activity, index) => ({
      id: index,
      text: activity,
      timestamp: Date.now() - (index * 60000) // Minutes ago
    }));
  };

  const formatTimeAgo = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    return `${minutes}m ago`;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Zone rendering is now handled by GlobalZoneOverlay - removed from individual components */}
      
      <div 
        ref={overlayRef}
        className={`enhanced-draggable-window dev-overlay analytics-overlay ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isSnapping ? 'snapping' : ''}`}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: windowSize.width,
          height: windowSize.height,
          zIndex: 10000
        }}
        onMouseEnter={handleMouseEnter}
      >
      {/* Header */}
      <div 
        className="dev-overlay-header"
        onMouseDown={handleMouseDown}
      >
        <div className="header-info">
          <BarChart3 size={16} />
          <span>Data Analytics</span>
          <div className="refresh-indicator">●</div>
        </div>
        <div className="header-controls">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="dev-overlay-content">
          {/* Key Metrics */}
          <div className="control-group">
            <div className="control-header">
              <Database size={14} />
              <span>Key Metrics</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{analytics.totalChannels}</div>
                <div className="metric-label">Channels</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{analytics.totalVotes}</div>
                <div className="metric-label">Total Votes</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{analytics.activeUsers}</div>
                <div className="metric-label">Active Users</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{analytics.voteVelocity}/min</div>
                <div className="metric-label">Vote Rate</div>
              </div>
            </div>
          </div>

          {/* Top Channels */}
          <div className="control-group">
            <div className="control-header">
              <TrendingUp size={14} />
              <span>Top Channels</span>
            </div>
            <div className="top-channels-list">
              {analytics.topChannels.map((channel, index) => (
                <div key={channel.id} className="channel-item">
                  <span className="channel-rank">#{index + 1}</span>
                  <span className="channel-name">{channel.title}</span>
                  <span className="channel-votes">{channel.totalVotes || 0} votes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="control-group">
            <div className="control-header">
              <Activity size={14} />
              <span>Recent Activity</span>
            </div>
            <div className="activity-list">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-text">{activity.text}</div>
                  <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Source Info */}
          {dataInfo && (
            <div className="control-group">
              <div className="control-header">
                <span>Data Source</span>
              </div>
              <div className="data-source-info">
                <div className="source-item">
                  <span className="source-label">Source:</span>
                  <span className={`source-value ${dataInfo.hasTestMarkers ? 'test' : 'production'}`}>
                    {dataInfo.hasTestMarkers ? 'Test Data' : 'Production Data'}
                  </span>
                </div>
                <div className="source-item">
                  <span className="source-label">Channels:</span>
                  <span className="source-value">{dataInfo.channelCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Resize handles */}
      {!isMinimized && (
        <>
          <div className="resize-handle corner nw" />
          <div className="resize-handle corner ne" />
          <div className="resize-handle corner sw" />
          <div className="resize-handle corner se" />
          <div className="resize-handle edge n" />
          <div className="resize-handle edge s" />
          <div className="resize-handle edge w" />
          <div className="resize-handle edge e" />
        </>
      )}
    </div>
    </>
  );
};

export default DataAnalyticsOverlay;
