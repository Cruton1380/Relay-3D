import React, { createContext, useContext, useState } from 'react';

// Define the six modes with their zoom levels and default layouts
const MODES = {
  SEARCH: 'search',      // outermost / global - far zoom
  DEVELOPER: 'developer', // system control - medium zoom
  CHANNELS: 'channels',   // channel interactions - medium zoom
  REGION: 'region',       // governance & borders - medium zoom
  PROXIMITY: 'proximity', // nearby users & broadcasts - close zoom
  MAP: 'map'             // street-level - closest zoom
};

// Export as a frozen object to prevent Fast Refresh issues
export { MODES };

// Mode configurations with zoom levels and default panel layouts
const MODE_CONFIGS = {
  [MODES.SEARCH]: {
    name: 'Search',
    description: 'Find channels, topics, people, or locations',
    zoomLevel: 0.3, // Far out
    defaultPanels: ['search_panel'],
    icon: '🛰️'
  },
  [MODES.DEVELOPER]: {
    name: 'Developer',
    description: 'Logs, system control, AI assistant',
    zoomLevel: 0.6, // Medium
    defaultPanels: ['debug_panel', 'network_topology'],
    icon: '🖥️'
  },
  [MODES.CHANNELS]: {
    name: 'Channels',
    description: 'Interact with nearby/global channels',
    zoomLevel: 0.7, // Medium
    defaultPanels: ['channel_chat', 'channel_info'],
    icon: '📡'
  },
  [MODES.REGION]: {
    name: 'Region',
    description: 'Borders, voting, and governance views',
    zoomLevel: 0.8, // Medium-close
    defaultPanels: ['voting_panel', 'layer_controls'],
    icon: '🛰️'
  },
  [MODES.PROXIMITY]: {
    name: 'Proximity',
    description: 'Nearby users, ephemeral broadcasts, invites',
    zoomLevel: 0.9, // Close
    defaultPanels: ['proximity_panel'],
    icon: '📶'
  },
  [MODES.MAP]: {
    name: 'Map',
    description: 'Flat 2D fallback view of global activity',
    zoomLevel: 1.0, // Closest
    defaultPanels: [], // Map controls now handled by floating dock
    icon: '🌐'
  }
};

// Export as frozen objects to prevent Fast Refresh issues
export { MODE_CONFIGS };

const ModeContext = createContext();

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};

export const ModeProvider = ({ children }) => {
  const [currentMode, setCurrentMode] = useState(MODES.SEARCH); // Default to search mode (no dev/test panels)

  const setMode = (mode) => {
    if (Object.values(MODES).includes(mode)) {
      if (currentMode === mode) {
        setCurrentMode(null); // Deselect if clicking the same mode
        console.log(`Mode deselected: ${mode}`);
      } else {
        setCurrentMode(mode);
        console.log(`Mode switched to: ${mode} - Zoom: ${MODE_CONFIGS[mode].zoomLevel}`);
      }
    } else {
      console.warn(`Invalid mode: ${mode}`);
    }
  };

  const getCurrentModeConfig = () => {
    return MODE_CONFIGS[currentMode];
  };

  const value = {
    currentMode,
    setMode,
    MODES,
    MODE_CONFIGS,
    getCurrentModeConfig
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}; 