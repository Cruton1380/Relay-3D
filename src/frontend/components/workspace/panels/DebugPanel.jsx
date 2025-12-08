/**
 * Debug Panel - System Information & Development Tools
 * Shows system status, performance metrics, and debug info
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useWindowManagement } from '../../../context/WindowManagementContext.jsx';
import unifiedTestDataService from '../services/unifiedTestDataService';

const DebugPanel = ({ panel, globeState, setGlobeState, layout, updatePanel, onClose }) => {
  const { getWindowData, clearWindowState, resetWindow, getAllWindowData } = useWindowManagement();
  const [windowData, setWindowData] = useState({});
  const [showWindowData, setShowWindowData] = useState(false);

  // Load window data for display
  useEffect(() => {
    setWindowData(getAllWindowData());
  }, [getAllWindowData]);

  const handleResetWindow = (windowId) => {
    resetWindow(windowId);
    setWindowData(getAllWindowData());
  };

  const handleClearAllWindows = () => {
    clearWindowState();
    setWindowData({});
  };

  return (
    <div className="debug-panel" style={{ 
      padding: 12, 
      height: '100%', 
      overflowY: 'auto', 
      display: 'flex', 
      flexDirection: 'column', 
      minWidth: 250, 
      maxWidth: 300,
      color: '#ffffff',
      fontSize: '12px'
    }}>
      {/* Close Button */}
      <button
        style={{ 
          position: 'absolute', 
          top: 6, 
          right: 6, 
          background: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '50%', 
          width: 20, 
          height: 20, 
          fontSize: 13, 
          cursor: 'pointer', 
          zIndex: 1002, 
          lineHeight: '18px', 
          padding: 0 
        }}
        title="Close Debug Panel"
        onClick={() => {
          if (typeof onClose === 'function') onClose();
          if (updatePanel) updatePanel(panel.id, { visible: false });
        }}
      >×</button>

      {/* Header */}
      <div style={{ 
        color: '#fff', 
        fontWeight: 600, 
        fontSize: 14, 
        marginBottom: 16,
        textAlign: 'center'
      }}>
        System Information & Development Tools
      </div>

      {/* Window Management Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          color: '#6c47ff', 
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Window Management</span>
          <button
            onClick={() => setShowWindowData(!showWindowData)}
            style={{
              background: 'rgba(108, 71, 255, 0.2)',
              border: '1px solid #6c47ff',
              color: '#6c47ff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {showWindowData ? 'Hide' : 'Show'} Data
          </button>
        </div>

        {/* Window Data Display */}
        {showWindowData && (
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: '6px', 
            padding: '8px',
            marginBottom: 8,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {Object.keys(windowData).length === 0 ? (
              <div style={{ color: '#666', fontSize: '11px' }}>No persisted window data</div>
            ) : (
              Object.entries(windowData).map(([windowId, data]) => (
                <div key={windowId} style={{ 
                  marginBottom: '6px', 
                  padding: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 600, color: '#6c47ff' }}>{windowId}</div>
                  <div style={{ color: '#ccc' }}>
                    Pos: ({data.position?.x || 'N/A'}, {data.position?.y || 'N/A'})
                  </div>
                  <div style={{ color: '#ccc' }}>
                    Size: {data.size?.width || 'N/A'} × {data.size?.height || 'N/A'}
                  </div>
                  <button
                    onClick={() => handleResetWindow(windowId)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      cursor: 'pointer',
                      marginTop: '2px'
                    }}
                  >
                    Reset
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleClearAllWindows}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Clear All Windows
          </button>
          <button
            onClick={() => setWindowData(getAllWindowData())}
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid #22c55e',
              color: '#22c55e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* System Status */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          color: '#22c55e', 
          marginBottom: 8 
        }}>
          System Status
        </div>
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '6px', 
          padding: '8px',
          fontSize: '11px'
        }}>
          <div style={{ color: '#ccc', marginBottom: '4px' }}>
            Globe State: {globeState ? 'Active' : 'Inactive'}
          </div>
          <div style={{ color: '#ccc', marginBottom: '4px' }}>
            Current Zoom: {globeState?.currentZoom?.name || 'Unknown'}
          </div>
          <div style={{ color: '#ccc', marginBottom: '4px' }}>
            Camera Distance: {globeState?.cameraDistance || 'Unknown'}
          </div>
          <div style={{ color: '#ccc' }}>
            Selected Channel: {globeState?.selectedChannel?.name || 'None'}
          </div>
        </div>
      </div>

      {/* Persistence Info */}
      <div style={{ 
        background: 'rgba(108, 71, 255, 0.1)', 
        border: '1px solid #6c47ff', 
        borderRadius: '6px', 
        padding: '8px',
        fontSize: '11px'
      }}>
        <div style={{ color: '#6c47ff', fontWeight: 600, marginBottom: '4px' }}>
          Window Persistence Active
        </div>
        <div style={{ color: '#ccc', fontSize: '10px' }}>
          Window sizes and positions are automatically saved to localStorage and restored between sessions.
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
