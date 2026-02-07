import React, { useState, useRef, useEffect } from 'react';
import { useMode, MODES, MODE_CONFIGS } from '../../../context/ModeContext.jsx';
import { useWorkspaceState } from '../useWorkspaceState';
import { useMemo } from 'react';

const ModeDropdown = () => {
  const { currentMode, setMode, MODE_CONFIGS } = useMode();
  // Get current mode panels (excluding globe)
  const { panels } = useWorkspaceState ? useWorkspaceState() : { panels: [] };
  
  // Listen for switchMode events
  useEffect(() => {
    const handleSwitchMode = (event) => {
      const { mode } = event.detail;
      console.log('🎯 ModeDropdown: switchMode event received:', mode);
      console.log('🎯 ModeDropdown: Current mode before switch:', currentMode);
      if (Object.values(MODES).includes(mode)) {
        console.log('🎯 ModeDropdown: Switching to mode:', mode);
        setMode(mode);
        console.log('🎯 ModeDropdown: Mode switch completed');
      } else {
        console.warn('🎯 ModeDropdown: Invalid mode received:', mode);
      }
    };
    window.addEventListener('switchMode', handleSwitchMode);
    return () => window.removeEventListener('switchMode', handleSwitchMode);
  }, [setMode, currentMode]);
  
  // Enhanced subpanel configuration for each mode
  const getSubpanelsForMode = (mode) => {
    switch (mode) {
      case MODES.DEVELOPER:
        return [
          'debug_panel',
          'test_data_panel',
          'enhanced_features',
          'governance_panel',
          'ai_assistant',
          'democratic_chatroom',
          'founders_report',
          'channel_topic_row' // Added back for candidate cube interactions
        ];
      case MODES.SEARCH:
        return ['search_panel', 'channel_topic_row'];
      case MODES.CHANNELS:
        return ['channel_chat', 'channel_info', 'channel_topic_row']; // Added back
      case MODES.REGION:
        return ['voting_panel', 'layer_controls', 'channel_topic_row']; // Added for voting
      case MODES.PROXIMITY:
        return ['proximity_panel', 'channel_topic_row']; // Added for nearby channels
      case MODES.MAP:
        return ['channel_topic_row']; // Added for map interactions
      default:
        return [];
    }
  };

  // Get subpanels for current mode
  const subpanels = getSubpanelsForMode(currentMode);

  // Enhanced subpanel icon mapping
  const subpanelIcons = {
    search_panel: '🔎',
    debug_panel: '🛠️',
    enhanced_features: '⚡',
    governance_panel: '🏛️',
    ai_assistant: '🤖',
    democratic_chatroom: '💬',
    test_data_panel: '📊',
    network_topology: '🌐',
    channel_chat: '💬',
    channel_info: 'ℹ️',
    voting_panel: '🗳️',
    layer_controls: '🎚️',
    proximity_panel: '📍',
    // map_panel: '🗺️', // Removed - now handled by floating dock
    founders_report: '👑',
    channel_topic_row: '📊',
  };
  
  const subpanelLabels = {
    search_panel: 'Search',
    debug_panel: 'Debug',
    enhanced_features: 'Enhanced',
    governance_panel: 'Governance',
    ai_assistant: 'AI Assistant',
    democratic_chatroom: 'Chatroom',
    test_data_panel: 'Test Data',
    network_topology: 'Network',
    channel_chat: 'Channel Chat',
    channel_info: 'Channel Info',
    voting_panel: 'Voting',
    layer_controls: 'Layers',
    proximity_panel: 'Proximity',
    // map_panel: 'Map', // Removed - now handled by floating dock
    founders_report: 'Founders Report',
    channel_topic_row: 'Topic Row',
  };

  return (
    <div className="mode-icon-column">
      {Object.values(MODES).map((mode) => {
        const config = MODE_CONFIGS[mode];
        const isActive = currentMode === mode;
        const modeSubpanels = getSubpanelsForMode(mode);
        
        return (
          <div key={mode} style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <button
              className={`mode-icon-btn${isActive ? ' active' : ''}`}
              onClick={() => setMode(mode)}
              title={config.name}
            >
              <span className="mode-icon glow" style={{ fontSize: 22 }}>{config.icon}</span>
            </button>
            {/* Submenu for active mode */}
            {isActive && modeSubpanels.length > 0 && (
              <div className="mode-submenu-column">
                {modeSubpanels.map((panelId) => (
                  <button 
                    key={panelId} 
                    className="mode-submenu-btn" 
                    title={subpanelLabels[panelId] || panelId}
                    onClick={() => {
                      // Open the panel by triggering a custom event
                      const event = new CustomEvent('openPanel', { 
                        detail: { panelId, mode } 
                      });
                      window.dispatchEvent(event);
                      console.log('Opening panel:', panelId);
                    }}
                  >
                    <span className="mode-submenu-icon">{subpanelIcons[panelId] || '🟦'}</span>
                    <span className="mode-submenu-label">{subpanelLabels[panelId] || panelId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        .mode-icon-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: center;
          align-items: center;
          height: 100%;
        }
        .mode-icon-btn {
          background: none;
          border: none;
          outline: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.18s, box-shadow 0.18s;
          color: #b0c4e6;
          font-size: 22px;
          position: relative;
        }
        .mode-icon-btn .glow {
          filter: drop-shadow(0 0 8px #409cff) drop-shadow(0 0 16px #409cff88);
        }
        .mode-icon-btn:hover {
          background: #232b3a;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .mode-icon-btn.active {
          background: #409cff;
          color: #fff;
          box-shadow: 0 4px 16px rgba(64,156,255,0.18);
        }
        .mode-icon-btn:after {
          content: attr(title);
          position: absolute;
          right: 60px;
          top: 50%;
          transform: translateY(-50%);
          background: #232b3a;
          color: #fff;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s;
          white-space: nowrap;
          z-index: 1001;
        }
        .mode-icon-btn:hover:after {
          opacity: 1;
        }
        .mode-submenu-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: absolute;
          right: 60px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(20, 24, 36, 0.98);
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
          padding: 12px 8px;
          border: 1.5px solid #222b3a;
          z-index: 10;
          max-height: 80vh;
          overflow-y: auto;
        }
        .mode-submenu-btn {
          background: none;
          border: none;
          color: #b0c4e6;
          font-size: 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.18s, color 0.18s;
          min-width: 120px;
          white-space: nowrap;
        }
        .mode-submenu-btn:hover {
          background: #232b3a;
          color: #fff;
        }
        .mode-submenu-icon {
          font-size: 18px;
          filter: drop-shadow(0 0 6px #409cff88);
        }
        .mode-submenu-label {
          font-size: 12px;
          color: #b0c4e6;
          text-align: left;
        }
        .mode-submenu-btn:hover .mode-submenu-label {
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default ModeDropdown; 