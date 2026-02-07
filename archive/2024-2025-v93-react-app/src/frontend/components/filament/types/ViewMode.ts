/**
 * VIEW MODE - Camera/Rendering Modes for Filaments
 * 
 * Filaments render differently depending on the view mode.
 * This is NOT semantic - it's presentation based on camera position/purpose.
 */

export type ViewMode = 
  | 'globe'       // Z-projection + Y-motion (vertical branches)
  | 'region'      // Z refined, X still collapsed
  | 'workflow'    // X horizontal, full history visible
  | 'spreadsheet' // Perpendicular to +X face
  | 'chart';      // Derived filament view

/**
 * VIEW MODE CONFIGURATION
 * 
 * Defines how filaments are rendered in each view mode
 */
export interface ViewModeConfig {
  /** View mode identifier */
  mode: ViewMode;
  
  /** Camera configuration */
  camera: {
    /** Camera position relative to filaments */
    position: 'elevated' | 'side' | 'perpendicular';
    /** Camera angle (degrees) */
    angle?: number;
    /** Camera distance */
    distance?: number;
  };
  
  /** Axis visibility */
  axes: {
    /** Is X axis visible/dominant? */
    xVisible: boolean;
    /** Is Y axis visible/dominant? */
    yVisible: boolean;
    /** Is Z axis visible/dominant? */
    zVisible: boolean;
  };
  
  /** Filament rendering */
  filament: {
    /** Orientation */
    orientation: 'vertical' | 'horizontal' | 'custom';
    /** Is history collapsed? */
    historyCollapsed: boolean;
    /** Show Time Boxes? */
    showTimeBoxes: boolean;
    /** Show glyphs/events? */
    showGlyphs: boolean;
  };
  
  /** Motion behavior */
  motion: {
    /** Animate Y changes? */
    animateY: boolean;
    /** Show live updates? */
    showLiveUpdates: boolean;
  };
}

/**
 * VIEW MODE PRESETS
 */
export const VIEW_MODE_CONFIGS: Record<ViewMode, ViewModeConfig> = {
  globe: {
    mode: 'globe',
    camera: {
      position: 'elevated',
      angle: 45,
      distance: 1000,
    },
    axes: {
      xVisible: false,  // X collapsed
      yVisible: true,   // Y = branch height
      zVisible: true,   // Z = geography
    },
    filament: {
      orientation: 'vertical',
      historyCollapsed: true,  // Only current frontier
      showTimeBoxes: false,
      showGlyphs: false,
    },
    motion: {
      animateY: true,  // Branches rise/fall
      showLiveUpdates: true,
    },
  },
  
  region: {
    mode: 'region',
    camera: {
      position: 'elevated',
      angle: 30,
      distance: 500,
    },
    axes: {
      xVisible: false,  // X still collapsed
      yVisible: true,   // Y dominant
      zVisible: true,   // Z refining
    },
    filament: {
      orientation: 'vertical',
      historyCollapsed: true,
      showTimeBoxes: false,
      showGlyphs: false,
    },
    motion: {
      animateY: true,
      showLiveUpdates: true,
    },
  },
  
  workflow: {
    mode: 'workflow',
    camera: {
      position: 'side',
      angle: 0,
      distance: 100,
    },
    axes: {
      xVisible: true,   // X horizontal (dominant)
      yVisible: true,   // Y measurable
      zVisible: false,  // Z collapsed
    },
    filament: {
      orientation: 'horizontal',
      historyCollapsed: false,  // Full history visible
      showTimeBoxes: true,
      showGlyphs: true,
    },
    motion: {
      animateY: false,  // Static, inspectable
      showLiveUpdates: false,
    },
  },
  
  spreadsheet: {
    mode: 'spreadsheet',
    camera: {
      position: 'perpendicular',
      angle: 0,
      distance: 50,
    },
    axes: {
      xVisible: false,  // Looking at +X face
      yVisible: true,
      zVisible: true,
    },
    filament: {
      orientation: 'custom',
      historyCollapsed: true,  // Latest Time Box only
      showTimeBoxes: false,    // Just values
      showGlyphs: false,
    },
    motion: {
      animateY: false,
      showLiveUpdates: true,   // Values update
    },
  },
  
  chart: {
    mode: 'chart',
    camera: {
      position: 'side',
      angle: 0,
      distance: 100,
    },
    axes: {
      xVisible: true,   // Derived filament
      yVisible: true,
      zVisible: false,
    },
    filament: {
      orientation: 'horizontal',
      historyCollapsed: false,
      showTimeBoxes: true,
      showGlyphs: true,
    },
    motion: {
      animateY: false,
      showLiveUpdates: true,
    },
  },
};

/**
 * Get view mode configuration
 */
export function getViewModeConfig(mode: ViewMode): ViewModeConfig {
  return VIEW_MODE_CONFIGS[mode];
}

/**
 * TRANSITION BETWEEN VIEW MODES
 * 
 * Defines how camera/rendering transitions between modes
 */
export interface ViewModeTransition {
  /** From mode */
  from: ViewMode;
  /** To mode */
  to: ViewMode;
  /** Transition type */
  type: 'rotate' | 'zoom' | 'fade' | 'morph';
  /** Duration (ms) */
  duration: number;
  /** Easing function */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * CANONICAL TRANSITIONS
 */
export const CANONICAL_TRANSITIONS: ViewModeTransition[] = [
  {
    from: 'globe',
    to: 'region',
    type: 'zoom',
    duration: 800,
    easing: 'ease-in-out',
  },
  {
    from: 'region',
    to: 'workflow',
    type: 'rotate',  // THE PIVOT
    duration: 1200,
    easing: 'ease-in-out',
  },
  {
    from: 'workflow',
    to: 'spreadsheet',
    type: 'rotate',
    duration: 600,
    easing: 'ease-out',
  },
];

/**
 * Get transition between two view modes
 */
export function getViewModeTransition(
  from: ViewMode,
  to: ViewMode
): ViewModeTransition | undefined {
  return CANONICAL_TRANSITIONS.find(t => t.from === from && t.to === to);
}
