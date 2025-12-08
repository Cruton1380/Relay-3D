/**
 * ChannelPerformancePanel - Performance Monitoring and Control
 * 
 * Features:
 * - Real-time performance metrics
 * - LOD level visualization
 * - Channel rendering statistics
 * - Performance mode controls
 * - Optimization settings
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, Settings, Zap, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';

const ChannelPerformancePanel = ({ 
  performanceMetrics = {},
  currentLOD = 'GLOBAL',
  onPerformanceModeChange,
  onOptimizationToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceMode, setPerformanceMode] = useState('balanced');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // LOD level descriptions
  const LOD_DESCRIPTIONS = {
    GLOBAL: {
      name: 'Global View',
      description: 'Space/Continent level - Shows channel clusters',
      maxChannels: 50,
      updateInterval: '5s'
    },
    CONTINENTAL: {
      name: 'Continental View',
      description: 'Continental level - Shows representative channels',
      maxChannels: 200,
      updateInterval: '3s'
    },
    REGIONAL: {
      name: 'Regional View',
      description: 'Regional level - Shows filtered channels',
      maxChannels: 500,
      updateInterval: '2s'
    },
    LOCAL: {
      name: 'Local View',
      description: 'Local level - Shows detailed channels',
      maxChannels: 1000,
      updateInterval: '1s'
    },
    STREET: {
      name: 'Street Level',
      description: 'Street level - Shows all channels',
      maxChannels: 'Unlimited',
      updateInterval: '0.5s'
    }
  };
  
  // Performance mode options
  const PERFORMANCE_MODES = {
    ultra_fast: {
      name: 'Ultra Fast',
      description: 'Maximum performance, minimal detail',
      icon: Zap,
      color: '#ff6b6b'
    },
    balanced: {
      name: 'Balanced',
      description: 'Good performance with reasonable detail',
      icon: BarChart3,
      color: '#4ecdc4'
    },
    quality: {
      name: 'Quality',
      description: 'High detail, may impact performance',
      icon: Eye,
      color: '#45b7d1'
    }
  };
  
  const currentLODInfo = LOD_DESCRIPTIONS[currentLOD];
  const currentModeInfo = PERFORMANCE_MODES[performanceMode];
  
  // Calculate performance indicators
  const frameRate = performanceMetrics.frameTime ? 
    Math.round(1000 / performanceMetrics.frameTime) : 0;
  
  const renderEfficiency = performanceMetrics.renderCount && performanceMetrics.culledCount ?
    Math.round((performanceMetrics.renderCount / (performanceMetrics.renderCount + performanceMetrics.culledCount)) * 100) : 0;
  
  const performanceStatus = frameRate > 30 ? 'good' : frameRate > 15 ? 'warning' : 'poor';
  
  return (
    <div className="channel-performance-panel">
      {/* Header */}
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <BarChart3 size={16} />
          <span>Channel Performance</span>
          <div className="performance-indicator">
            <div className={`status-dot ${performanceStatus}`} />
            <span>{frameRate} FPS</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDebugInfo(!showDebugInfo);
            }}
            title="Toggle debug info"
          >
            {showDebugInfo ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button 
            className="icon-button"
            onClick={(e) => {
              e.stopPropagation();
              // Toggle panel expansion
            }}
          >
            {isExpanded ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          </button>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="panel-content">
          {/* Current LOD Level */}
          <div className="section">
            <h4>Current View Level</h4>
            <div className="lod-info">
              <div className="lod-name">{currentLODInfo.name}</div>
              <div className="lod-description">{currentLODInfo.description}</div>
              <div className="lod-stats">
                <span>Max Channels: {currentLODInfo.maxChannels}</span>
                <span>Update: {currentLODInfo.updateInterval}</span>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="section">
            <h4>Performance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-label">Frame Rate</div>
                <div className={`metric-value ${performanceStatus}`}>
                  {frameRate} FPS
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Visible Channels</div>
                <div className="metric-value">
                  {performanceMetrics.renderCount || 0}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Culled Channels</div>
                <div className="metric-value">
                  {performanceMetrics.culledCount || 0}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Clusters</div>
                <div className="metric-value">
                  {performanceMetrics.clusterCount || 0}
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Render Efficiency</div>
                <div className="metric-value">
                  {renderEfficiency}%
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">Frame Time</div>
                <div className="metric-value">
                  {performanceMetrics.frameTime ? 
                    `${performanceMetrics.frameTime.toFixed(1)}ms` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Mode Controls */}
          <div className="section">
            <h4>Performance Mode</h4>
            <div className="mode-selector">
              {Object.entries(PERFORMANCE_MODES).map(([mode, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={mode}
                    className={`mode-button ${performanceMode === mode ? 'active' : ''}`}
                    onClick={() => {
                      setPerformanceMode(mode);
                      onPerformanceModeChange?.(mode);
                    }}
                    style={{ borderColor: info.color }}
                  >
                    <Icon size={16} color={info.color} />
                    <div className="mode-info">
                      <div className="mode-name">{info.name}</div>
                      <div className="mode-description">{info.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Optimization Settings */}
          <div className="section">
            <h4>Optimization Settings</h4>
            <div className="settings-grid">
              <label className="setting">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  onChange={(e) => onOptimizationToggle?.('clustering', e.target.checked)}
                />
                <span>Channel Clustering</span>
              </label>
              <label className="setting">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  onChange={(e) => onOptimizationToggle?.('culling', e.target.checked)}
                />
                <span>Distance Culling</span>
              </label>
              <label className="setting">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  onChange={(e) => onOptimizationToggle?.('relevance', e.target.checked)}
                />
                <span>Relevance Filtering</span>
              </label>
              <label className="setting">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  onChange={(e) => onOptimizationToggle?.('throttling', e.target.checked)}
                />
                <span>Update Throttling</span>
              </label>
            </div>
          </div>
          
          {/* Debug Information */}
          {showDebugInfo && (
            <div className="section debug-section">
              <h4>Debug Information</h4>
              <div className="debug-info">
                <pre>{JSON.stringify(performanceMetrics, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .channel-performance-panel {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-family: 'Inter', sans-serif;
          min-width: 300px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .performance-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          margin-left: 12px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-dot.good { background: #4ecdc4; }
        .status-dot.warning { background: #ffd93d; }
        .status-dot.poor { background: #ff6b6b; }
        
        .header-actions {
          display: flex;
          gap: 4px;
        }
        
        .icon-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .icon-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .panel-content {
          padding: 16px;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #4ecdc4;
        }
        
        .lod-info {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 6px;
        }
        
        .lod-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .lod-description {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        }
        
        .lod-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .metric {
          background: rgba(255, 255, 255, 0.05);
          padding: 8px;
          border-radius: 4px;
        }
        
        .metric-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }
        
        .metric-value {
          font-size: 14px;
          font-weight: 600;
        }
        
        .metric-value.good { color: #4ecdc4; }
        .metric-value.warning { color: #ffd93d; }
        .metric-value.poor { color: #ff6b6b; }
        
        .mode-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .mode-button {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mode-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .mode-button.active {
          background: rgba(255, 255, 255, 0.15);
          border-color: currentColor;
        }
        
        .mode-info {
          flex: 1;
        }
        
        .mode-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        .mode-description {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 2px;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .setting {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .setting input[type="checkbox"] {
          accent-color: #4ecdc4;
        }
        
        .debug-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 16px;
        }
        
        .debug-info {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          padding: 8px;
        }
        
        .debug-info pre {
          font-size: 10px;
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default ChannelPerformancePanel;
