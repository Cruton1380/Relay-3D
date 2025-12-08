/**
 * Constants for Base Model 1 Workspace System
 */

// Debug configuration - optimized for performance
export const DEBUG_CONFIG = {
  ENABLED: false, // Disabled for performance
  CESIUM: false,
  CHANNELS: false,
  CLUSTERING: false,
  RENDERING: false,
  VOTES: false,
};

// Dock zones for panel positioning
export const DOCK_ZONES = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
  CENTER: "center",
  FLOATING: "floating",
};

// Default panel configuration
export const DEFAULT_PANELS = [
  {
    id: "channel_info",
    title: "Channel Information",
    type: "info",
    component: "ChannelInfoPanel",
    description: "Channel details and voting interface",
    defaultPosition: DOCK_ZONES.RIGHT,
    isVisible: false,
    order: 1,
  },
];

// Workspace layout configuration
export const WORKSPACE_CONFIG = {
  minPanelWidth: 200,
  minPanelHeight: 150,
  snapThreshold: 50,
  animationDuration: 300,
  maxFloatingPanels: 5,
};
