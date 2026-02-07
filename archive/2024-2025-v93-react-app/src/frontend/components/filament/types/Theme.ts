/**
 * THEME SYSTEM - Governable Presentation Layer
 * 
 * Themes change ONLY presentation, NEVER truth.
 * Themes are votable/governable via vote-button interface.
 * 
 * CANNOT CHANGE:
 * - Topology (split/merge meaning)
 * - Axis semantics (X=time, Y=magnitude, Z=eligibility)
 * - Event type meaning
 * - Δx constraints
 * - Stacking rules
 * 
 * CAN CHANGE:
 * - Materials, translucency
 * - Label rendering style
 * - Thickness, colors
 * - High-contrast palettes
 * - Silhouette variants
 */

export interface Theme {
  /** Theme ID (unique) */
  id: string;
  
  /** Theme display name */
  name: string;
  
  /** Theme description */
  description?: string;
  
  /** Theme version (for governance) */
  version: string;
  
  /** Author/creator */
  author?: string;
  
  /** Base colors */
  colors: ThemeColors;
  
  /** Filament styling */
  filament: FilamentThemeStyle;
  
  /** Glyph styling (per event type) */
  glyphs: GlyphThemeStyles;
  
  /** Label styling */
  labels: LabelThemeStyle;
  
  /** Time Box styling */
  timeBox: TimeBoxThemeStyle;
  
  /** Axes styling */
  axes: AxesThemeStyle;
  
  /** Environment styling */
  environment: EnvironmentThemeStyle;
}

/**
 * THEME COLORS
 */
export interface ThemeColors {
  /** Primary accent */
  primary: string;
  
  /** Secondary accent */
  secondary: string;
  
  /** Background */
  background: string;
  
  /** Foreground/text */
  foreground: string;
  
  /** Grid lines */
  grid: string;
  
  /** Selection highlight */
  selection: string;
  
  /** Hover highlight */
  hover: string;
  
  /** Error/alert */
  alert: string;
  
  /** Success/verified */
  success: string;
  
  /** Warning */
  warning: string;
}

/**
 * FILAMENT THEME STYLE
 */
export interface FilamentThemeStyle {
  /** Base material */
  material: {
    /** Color */
    color: string;
    /** Opacity (0-1) */
    opacity: number;
    /** Translucent? */
    translucent: boolean;
    /** Metalness (0-1) */
    metalness: number;
    /** Roughness (0-1) */
    roughness: number;
  };
  
  /** Pipe geometry */
  geometry: {
    /** Radial segments (detail level) */
    radialSegments: number;
    /** Wall thickness (relative) */
    wallThickness: number;
  };
  
  /** Microtexture */
  microtexture: {
    /** Enabled? */
    enabled: boolean;
    /** Texture type */
    type: 'noise' | 'etched' | 'woven' | 'smooth';
    /** Detail scale */
    scale: number;
  };
}

/**
 * GLYPH THEME STYLES (per event type)
 */
export interface GlyphThemeStyles {
  STAMP: GlyphThemeStyle;
  KINK: GlyphThemeStyle;
  DENT: GlyphThemeStyle;
  TWIST: GlyphThemeStyle;
  UNTWIST: GlyphThemeStyle;
  GATE: GlyphThemeStyle;
  SPLIT: GlyphThemeStyle;
  SCAR: GlyphThemeStyle;
}

/**
 * GLYPH THEME STYLE (individual glyph)
 */
export interface GlyphThemeStyle {
  /** Silhouette color */
  color: string;
  
  /** Silhouette opacity */
  opacity: number;
  
  /** Silhouette variant (if applicable) */
  variant?: 'default' | 'bold' | 'subtle';
  
  /** Geometry detail level */
  detailLevel?: 'low' | 'medium' | 'high';
  
  /** Scale multiplier (default = 1.0) */
  scale?: number;
}

/**
 * LABEL THEME STYLE
 */
export interface LabelThemeStyle {
  /** Font family */
  fontFamily: string;
  
  /** Base font size */
  fontSize: number;
  
  /** Font weight */
  fontWeight: 'normal' | 'bold' | 'light';
  
  /** Text color */
  color: string;
  
  /** Background color (if any) */
  backgroundColor?: string;
  
  /** Background opacity */
  backgroundOpacity?: number;
  
  /** Rendering method */
  renderMethod: 'billboard' | 'sdf' | 'sprite';
  
  /** Distance threshold for near mode (camera distance) */
  nearModeDistance: number;
  
  /** Fade-in transition duration (ms) */
  fadeInDuration: number;
}

/**
 * TIME BOX THEME STYLE
 */
export interface TimeBoxThemeStyle {
  /** Cube material */
  material: {
    /** Color */
    color: string;
    /** Opacity */
    opacity: number;
    /** Wireframe? */
    wireframe: boolean;
  };
  
  /** Face coloring (optional) */
  faceColors?: {
    posX?: string; // +X output
    negX?: string; // -X input
    posY?: string; // +Y semantic
    negY?: string; // -Y magnitude
    posZ?: string; // +Z identity
    negZ?: string; // -Z evidence
  };
  
  /** Size (relative to Δx) */
  size: number;
}

/**
 * AXES THEME STYLE
 */
export interface AxesThemeStyle {
  /** Show axes? */
  visible: boolean;
  
  /** Axis line color */
  lineColor: string;
  
  /** Axis line thickness */
  lineThickness: number;
  
  /** Label color */
  labelColor: string;
  
  /** Label font size */
  labelFontSize: number;
  
  /** Grid */
  grid: {
    /** Show grid? */
    visible: boolean;
    /** Grid color */
    color: string;
    /** Grid opacity */
    opacity: number;
    /** Grid spacing */
    spacing: number;
  };
}

/**
 * ENVIRONMENT THEME STYLE
 */
export interface EnvironmentThemeStyle {
  /** Background color */
  backgroundColor: string;
  
  /** Fog */
  fog?: {
    enabled: boolean;
    color: string;
    near: number;
    far: number;
  };
  
  /** Lighting */
  lighting: {
    /** Ambient light color */
    ambientColor: string;
    /** Ambient light intensity */
    ambientIntensity: number;
    /** Directional light color */
    directionalColor: string;
    /** Directional light intensity */
    directionalIntensity: number;
  };
  
  /** Ground plane */
  ground?: {
    visible: boolean;
    color: string;
    opacity: number;
  };
}

/**
 * PRESET THEMES
 */

/** Forensic Mono - Default truth-first theme */
export const THEME_FORENSIC_MONO: Theme = {
  id: 'forensic-mono',
  name: 'Forensic Mono',
  description: 'Truth-first analytical theme with maximum clarity',
  version: '1.0.0',
  colors: {
    primary: '#4A90E2',
    secondary: '#7AB8F5',
    background: '#0A0E14',
    foreground: '#E6E6E6',
    grid: '#2A2E34',
    selection: '#FFD700',
    hover: '#FFA500',
    alert: '#E74C3C',
    success: '#2ECC71',
    warning: '#F39C12',
  },
  filament: {
    material: {
      color: '#4A90E2',
      opacity: 0.7,
      translucent: true,
      metalness: 0.3,
      roughness: 0.6,
    },
    geometry: {
      radialSegments: 32,
      wallThickness: 0.1,
    },
    microtexture: {
      enabled: true,
      type: 'etched',
      scale: 1.0,
    },
  },
  glyphs: {
    STAMP: { color: '#E6E6E6', opacity: 0.8 },
    KINK: { color: '#4A90E2', opacity: 0.9 },
    DENT: { color: '#F39C12', opacity: 0.85 },
    TWIST: { color: '#9B59B6', opacity: 0.9 },
    UNTWIST: { color: '#9B59B6', opacity: 0.9 },
    GATE: { color: '#E74C3C', opacity: 0.8 },
    SPLIT: { color: '#2ECC71', opacity: 0.9 },
    SCAR: { color: '#E67E22', opacity: 0.85 },
  },
  labels: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'normal',
    color: '#E6E6E6',
    backgroundColor: '#0A0E14',
    backgroundOpacity: 0.8,
    renderMethod: 'billboard',
    nearModeDistance: 50,
    fadeInDuration: 200,
  },
  timeBox: {
    material: {
      color: '#7AB8F5',
      opacity: 0.3,
      wireframe: true,
    },
    size: 1.0,
  },
  axes: {
    visible: true,
    lineColor: '#4A4A4A',
    lineThickness: 2,
    labelColor: '#E6E6E6',
    labelFontSize: 14,
    grid: {
      visible: true,
      color: '#2A2E34',
      opacity: 0.5,
      spacing: 10,
    },
  },
  environment: {
    backgroundColor: '#0A0E14',
    fog: {
      enabled: true,
      color: '#0A0E14',
      near: 100,
      far: 500,
    },
    lighting: {
      ambientColor: '#FFFFFF',
      ambientIntensity: 0.4,
      directionalColor: '#FFFFFF',
      directionalIntensity: 0.8,
    },
    ground: {
      visible: true,
      color: '#1A1E24',
      opacity: 0.5,
    },
  },
};

/** High Contrast - Accessibility theme */
export const THEME_HIGH_CONTRAST: Theme = {
  ...THEME_FORENSIC_MONO,
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Maximum contrast for accessibility',
  version: '1.0.0',
  colors: {
    ...THEME_FORENSIC_MONO.colors,
    background: '#000000',
    foreground: '#FFFFFF',
    grid: '#444444',
  },
  filament: {
    ...THEME_FORENSIC_MONO.filament,
    material: {
      ...THEME_FORENSIC_MONO.filament.material,
      opacity: 0.9,
    },
  },
  labels: {
    ...THEME_FORENSIC_MONO.labels,
    color: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 1.0,
  },
  environment: {
    ...THEME_FORENSIC_MONO.environment,
    backgroundColor: '#000000',
  },
};

/**
 * Theme Registry (for vote-button selection)
 */
export const THEME_REGISTRY: Record<string, Theme> = {
  'forensic-mono': THEME_FORENSIC_MONO,
  'high-contrast': THEME_HIGH_CONTRAST,
};

/**
 * Get theme by ID (with fallback)
 */
export function getTheme(themeId: string): Theme {
  return THEME_REGISTRY[themeId] || THEME_FORENSIC_MONO;
}
