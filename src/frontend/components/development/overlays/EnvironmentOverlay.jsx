/**
 * Environment Control Overlay
 * Manages test mode, environment settings, and configuration
 */
import React, { useState, useRef } from 'react';
import { useEnvironment } from '../../../hooks/useEnvironment';
import { Settings, TestTube, AlertCircle } from 'lucide-react';
import { useEnhancedGridDraggable } from '../../../hooks/useEnhancedGridDraggable';
import './DevOverlay.css';
import './EnhancedGridLayout.css';

const EnvironmentOverlay = ({ isVisible, onClose, position, onPositionChange }) => {
  const { 
    isTestMode, 
    shouldShowTestData, 
    settings,
    toggleTestMode, 
    updateSetting,
    resetToProductionState 
  } = useEnvironment();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 320, height: 280 });
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
    windowType: 'small',
    windowId: 'environment-overlay',
    disabled: isMinimized
  });

  if (!isVisible) return null;

  return (
    <>
      {/* Zone rendering is now handled by GlobalZoneOverlay - removed from individual components */}
      
      <div 
        ref={overlayRef}
        className={`enhanced-draggable-window dev-overlay environment-overlay ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isSnapping ? 'snapping' : ''}`}
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
          <Settings size={16} />
          <span>Environment Control</span>
          <div className={`status-dot ${isTestMode ? 'test' : 'production'}`}></div>
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
          {/* Environment Settings */}
          <div className="control-group">
            <div className="control-header">
              <span>Environment Settings</span>
            </div>
            
            {[
              { key: 'showTestData', label: 'Show Test Data', desc: 'Display mock/test data instead of production' },
              { key: 'enableTestVoting', label: 'Enable Test Voting', desc: 'Allow voting in test mode' },
              { key: 'deterministicVotes', label: 'Deterministic Votes', desc: 'Generate consistent vote counts' }
            ].map(setting => (
              <div key={setting.key} className="setting-item compact">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings[setting.key] || false}
                    onChange={(e) => updateSetting(setting.key, e.target.checked)}
                  />
                  <span className="setting-name">{setting.label}</span>
                </label>
                <div className="setting-description">{setting.desc}</div>
              </div>
            ))}
          </div>

          {/* Environment Status */}
          <div className="control-group status-group">
            <div className="control-header">
              <AlertCircle size={14} />
              <span>Status</span>
            </div>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Mode</span>
                <span className={`status-value ${isTestMode ? 'test' : 'production'}`}>
                  {isTestMode ? 'Test' : 'Production'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Test Data</span>
                <span className={`status-value ${shouldShowTestData ? 'enabled' : 'disabled'}`}>
                  {shouldShowTestData ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="control-group">
            <button 
              className="reset-btn"
              onClick={resetToProductionState}
            >
              Reset to Production
            </button>
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

export default EnvironmentOverlay;
