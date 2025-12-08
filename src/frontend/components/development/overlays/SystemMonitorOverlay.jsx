/**
 * System Monitor Overlay
 * Real-time system monitoring, performance metrics, and health status
 */
import React, { useState, useRef, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, WifiOff, Server } from 'lucide-react';
import { useEnhancedGridDraggable } from '../../../hooks/useEnhancedGridDraggable';
import './DevOverlay.css';
import './EnhancedGridLayout.css';

const SystemMonitorOverlay = ({ isVisible, onClose, position, onPositionChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    network: 0,
    activeConnections: 0,
    responseTime: 0,
    errorRate: 0
  });
  const [services, setServices] = useState({
    frontend: 'running',
    backend: 'offline',
    websocket: 'offline',
    database: 'offline'
  });
  const [history, setHistory] = useState({
    cpu: [],
    memory: [],
    network: []
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
    windowId: 'system-monitor-overlay',
    disabled: isMinimized
  });

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const updateMetrics = () => {
    // Generate realistic mock metrics
    const newMetrics = {
      cpu: Math.max(10, Math.min(90, metrics.cpu + (Math.random() - 0.5) * 20)),
      memory: Math.max(20, Math.min(85, metrics.memory + (Math.random() - 0.5) * 10)),
      network: Math.max(0, Math.min(100, Math.random() * 50)),
      activeConnections: Math.floor(Math.random() * 100) + 20,
      responseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: Math.random() * 5
    };
    
    setMetrics(newMetrics);
    
    // Update history for charts (keep last 20 points)
    setHistory(prev => ({
      cpu: [...prev.cpu.slice(-19), newMetrics.cpu],
      memory: [...prev.memory.slice(-19), newMetrics.memory],
      network: [...prev.network.slice(-19), newMetrics.network]
    }));

    // Update service status
    setServices({
      frontend: 'running',
      backend: Math.random() > 0.8 ? 'running' : 'offline',
      websocket: Math.random() > 0.7 ? 'running' : 'offline',
      database: Math.random() > 0.9 ? 'running' : 'offline'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#28a745';
      case 'offline': return '#dc3545';
      case 'warning': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getMetricColor = (value, type) => {
    if (type === 'cpu' || type === 'memory') {
      if (value > 80) return '#dc3545';
      if (value > 60) return '#ffc107';
      return '#28a745';
    }
    return '#007acc';
  };

  const renderMiniChart = (data, color) => {
    if (data.length < 2) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg className="mini-chart" viewBox="0 0 60 20">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
      </svg>
    );
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Zone rendering is now handled by GlobalZoneOverlay - removed from individual components */}
      
      <div 
        ref={overlayRef}
        className={`enhanced-draggable-window dev-overlay system-monitor-overlay ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isSnapping ? 'snapping' : ''}`}
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
          <Activity size={16} />
          <span>System Monitor</span>
          <div className="pulse-indicator"></div>
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
          {/* Performance Metrics */}
          <div className="control-group">
            <div className="control-header">
              <Cpu size={14} />
              <span>Performance</span>
            </div>
            
            <div className="metrics-list">
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">CPU</span>
                  <span 
                    className="metric-value"
                    style={{ color: getMetricColor(metrics.cpu, 'cpu') }}
                  >
                    {Math.round(metrics.cpu)}%
                  </span>
                </div>
                <div className="metric-chart">
                  {renderMiniChart(history.cpu, getMetricColor(metrics.cpu, 'cpu'))}
                </div>
              </div>
              
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">Memory</span>
                  <span 
                    className="metric-value"
                    style={{ color: getMetricColor(metrics.memory, 'memory') }}
                  >
                    {Math.round(metrics.memory)}%
                  </span>
                </div>
                <div className="metric-chart">
                  {renderMiniChart(history.memory, getMetricColor(metrics.memory, 'memory'))}
                </div>
              </div>
              
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">Network</span>
                  <span className="metric-value">
                    {Math.round(metrics.network)} KB/s
                  </span>
                </div>
                <div className="metric-chart">
                  {renderMiniChart(history.network, '#007acc')}
                </div>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="control-group">
            <div className="control-header">
              <Server size={14} />
              <span>Services</span>
            </div>
            
            <div className="services-list">
              {Object.entries(services).map(([service, status]) => (
                <div key={service} className="service-row">
                  <div className="service-info">
                    <span className="service-name">{service}</span>
                    <span 
                      className="service-status"
                      style={{ color: getStatusColor(status) }}
                    >
                      {status === 'running' ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Stats */}
          <div className="control-group">
            <div className="control-header">
              <HardDrive size={14} />
              <span>Network</span>
            </div>
            
            <div className="network-stats">
              <div className="stat-item">
                <span className="stat-label">Connections</span>
                <span className="stat-value">{metrics.activeConnections}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Response Time</span>
                <span className="stat-value">{Math.round(metrics.responseTime)}ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Error Rate</span>
                <span className="stat-value">{metrics.errorRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
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

export default SystemMonitorOverlay;
