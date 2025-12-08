/**
 * Debug Overlay
 * Contains vote debugging tools and development utilities
 */
import React, { useState, useRef, useEffect } from 'react';
import { Bug, Zap, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react';
import { useEnhancedGridDraggable } from '../../../hooks/useEnhancedGridDraggable';
import './DevOverlay.css';
import './EnhancedGridLayout.css';

const DebugOverlay = ({ isVisible, onClose, position, onPositionChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [testChannel, setTestChannel] = useState('sustainable-cities');
  const [testCandidate, setTestCandidate] = useState('oriazoulay768');
  const [debugLog, setDebugLog] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [voteCounts, setVoteCounts] = useState({});
  const [windowSize, setWindowSize] = useState({ width: 400, height: 350 });
  
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
    windowType: 'medium',
    windowId: 'debug-overlay',
    disabled: isMinimized
  });

  const addDebugLog = (message) => {
    setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectVote = async () => {
    addDebugLog(`Testing direct vote: ${testChannel} -> ${testCandidate}`);
    
    try {
      const response = await fetch('http://localhost:3002/api/vote/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: testChannel,
          candidateId: testCandidate,
          userId: 'demo-user-1',
          action: 'vote'
        })
      });

      const result = await response.json();
      addDebugLog(`Direct vote result: ${JSON.stringify(result)}`);
    } catch (error) {
      addDebugLog(`Direct vote error: ${error.message}`);
    }
  };

  const simulateVoteEvent = () => {
    addDebugLog(`Simulating vote event: ${testChannel} -> ${testCandidate}`);
    
    // Simulate frontend vote event
    window.dispatchEvent(new CustomEvent('voteSubmitted', {
      detail: { channelId: testChannel, candidateId: testCandidate }
    }));
    
    addDebugLog('Vote event dispatched');
  };

  const clearDebugLog = () => {
    setDebugLog([]);
    addDebugLog('Debug log cleared');
  };

  const testVoteCountRefresh = async () => {
    addDebugLog('Testing vote count refresh...');
    
    try {
      const response = await fetch(`http://localhost:3002/api/vote-counts/candidate/${testChannel}/${testCandidate}`);
      if (response.ok) {
        const result = await response.json();
        addDebugLog(`Vote count for ${testCandidate}: ${result.voteCount || 'N/A'}`);
      } else {
        addDebugLog(`Vote count fetch failed: ${response.status}`);
      }
    } catch (error) {
      addDebugLog(`Vote count error: ${error.message}`);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Zone rendering is now handled by GlobalZoneOverlay - removed from individual components */}
      
      <div 
        ref={overlayRef}
        className={`enhanced-draggable-window dev-overlay debug-overlay ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMinimized ? 'minimized' : ''} ${isSnapping ? 'snapping' : ''}`}
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
      <div className="dev-overlay-header" onMouseDown={handleMouseDown}>
        <div className="header-left">
          <Bug size={16} />
          <span>Debug Tools</span>
        </div>
        <div className="header-controls">
          <button onClick={() => setIsMinimized(!isMinimized)} className="minimize-btn">
            {isMinimized ? '▲' : '▼'}
          </button>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
      </div>

      {!isMinimized && (
        <div className="dev-overlay-content">
          {/* Vote Testing */}
          <div className="debug-section">
            <h4><Zap size={16} /> Vote Testing</h4>
            
            <div className="debug-input-group">
              <label>Channel ID:</label>
              <input
                type="text"
                value={testChannel}
                onChange={(e) => setTestChannel(e.target.value)}
                placeholder="Channel ID"
              />
            </div>
            
            <div className="debug-input-group">
              <label>Candidate ID:</label>
              <input
                type="text"
                value={testCandidate}
                onChange={(e) => setTestCandidate(e.target.value)}
                placeholder="Candidate ID"
              />
            </div>
            
            <div className="debug-actions">
              <button onClick={testDirectVote} className="debug-btn primary">
                <Play size={14} /> Direct Vote Test
              </button>
              <button onClick={simulateVoteEvent} className="debug-btn">
                <Zap size={14} /> Simulate Event
              </button>
              <button onClick={testVoteCountRefresh} className="debug-btn">
                <RotateCcw size={14} /> Refresh Count
              </button>
            </div>
          </div>

          {/* Debug Log */}
          <div className="debug-section">
            <div className="section-header">
              <h4><AlertTriangle size={16} /> Debug Log</h4>
              <button onClick={clearDebugLog} className="debug-btn small">
                Clear
              </button>
            </div>
            
            <div className="debug-log">
              {debugLog.length === 0 ? (
                <div className="log-empty">No debug messages</div>
              ) : (
                debugLog.map((message, index) => (
                  <div key={index} className="log-entry">
                    {message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vote State Viewer */}
          <div className="debug-section">
            <h4>Current Vote State</h4>
            <div className="vote-state">
              <div className="state-item">
                <span>Test Channel:</span>
                <code>{testChannel}</code>
              </div>
              <div className="state-item">
                <span>Test Candidate:</span>
                <code>{testCandidate}</code>
              </div>
              <div className="state-item">
                <span>Vote Key:</span>
                <code>{testChannel}-{testCandidate}</code>
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

export default DebugOverlay;
