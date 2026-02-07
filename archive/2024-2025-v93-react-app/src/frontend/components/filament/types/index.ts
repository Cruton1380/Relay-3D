/**
 * FILAMENT SYSTEM TYPES
 * 
 * Core type definitions for the Relay Filament System.
 * 
 * INVARIANTS:
 * - X axis = event order (NOT clock time)
 * - Y axis = magnitude/displacement (lens-dependent)
 * - Z axis = co-presence eligibility
 * - Filament = persistent identity through time
 * - Time Box = atomic belief state
 * - Event = discrete operation (glyph)
 * - Theme = governable presentation (never truth)
 * - View Mode = camera/rendering mode (globe vs workflow)
 */

export * from './Filament';
export * from './TimeBox';
export * from './Event';
export * from './Theme';
export * from './ViewMode';
export * from './PresenceState';

// Re-export key types for convenience
export type {
  Filament,
  FilamentCollection,
  FilamentSpacing,
  ZContext,
} from './Filament';

export type {
  TimeBox,
  TimeBoxFaces,
  TimeBoxViewMode,
} from './TimeBox';

export type {
  Event,
  EventType,
  EventCategory,
  EventParams,
  EventStackingSlot,
} from './Event';

export type {
  Theme,
  ThemeColors,
  FilamentThemeStyle,
  GlyphThemeStyles,
  GlyphThemeStyle,
  LabelThemeStyle,
  TimeBoxThemeStyle,
  AxesThemeStyle,
  EnvironmentThemeStyle,
} from './Theme';

export type {
  ViewMode,
  ViewModeConfig,
  ViewModeTransition,
} from './ViewMode';

export type {
  PresenceLocus,
  PresenceState,
  ViewerSession,
  PresenceQueryResult,
} from './PresenceState';

// Re-export validation functions
export {
  validateFilament,
  getTimeBoxAtIndex,
  getEventsAtIndex,
  getLatestTimeBox,
} from './Filament';

export {
  validateTimeBox,
} from './TimeBox';

export {
  validateEvent,
  checkBodyConflict,
  EVENT_CATEGORIES,
  STACKING_RULES,
} from './Event';

export {
  THEME_FORENSIC_MONO,
  THEME_HIGH_CONTRAST,
  THEME_REGISTRY,
  getTheme,
} from './Theme';

export {
  VIEW_MODE_CONFIGS,
  CANONICAL_TRANSITIONS,
  getViewModeConfig,
  getViewModeTransition,
} from './ViewMode';

export {
  locusKey,
  parseLocusKey,
} from './PresenceState';
