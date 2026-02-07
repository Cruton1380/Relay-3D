/**
 * FILAMENT - Persistent Identity Through Time
 * 
 * A filament is the minimum irreducible unit of truth in Relay.
 * It is one identity moving forward through time, accumulating irreversible operations.
 * 
 * NOT "data lines", NOT "cells", NOT "UI" - a BIOGRAPHY.
 */

import { TimeBox } from './TimeBox';
import { Event } from './Event';

export interface Filament {
  /** Unique persistent identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Baseline magnitude (thickness reference) */
  baselineMagnitude: number;
  
  /** Unit of magnitude */
  magnitudeUnit?: string;
  
  /** Z-axis co-presence context */
  zContext: ZContext;
  
  /** Time Boxes (discrete belief states) */
  timeBoxes: TimeBox[];
  
  /** Events (operations that created Time Boxes) */
  events: Event[];
  
  /** Creation timestamp (metadata) */
  createdAt?: number;
  
  /** Root evidence pointer */
  rootEvidence?: {
    type: string;
    pointer: string;
    reference?: string;
  };
  
  /** Visual properties (theme-governed) */
  visual?: FilamentVisual;
  
  /** Derived/KPI filament? */
  isDerived?: boolean;
  
  /** If derived, source filament IDs */
  sourceFilaments?: string[];
}

/**
 * Z CONTEXT - Co-presence Eligibility
 * 
 * Z is NOT meaning, NOT encryption, NOT hierarchy.
 * Z exists to answer: "Should these things even be touching?"
 */
export interface ZContext {
  /** Organization/boundary ID */
  boundaryId?: string;
  
  /** Trust domain */
  trustDomain?: string;
  
  /** Jurisdiction */
  jurisdiction?: string;
  
  /** Z coordinate (if spatial projection) */
  zCoordinate?: number;
  
  /** Can this filament interact with others by default? */
  interactionEligible?: boolean;
}

/**
 * FILAMENT VISUAL PROPERTIES
 * 
 * Theme-governed, never semantic
 */
export interface FilamentVisual {
  /** Material properties */
  material?: {
    /** Base color */
    color?: string;
    /** Opacity (0-1) */
    opacity?: number;
    /** Translucency */
    translucent?: boolean;
    /** Metalness (0-1) */
    metalness?: number;
    /** Roughness (0-1) */
    roughness?: number;
  };
  
  /** Microtexture detail level */
  microtextureDetail?: 'none' | 'low' | 'medium' | 'high';
  
  /** Is this filament currently selected? */
  selected?: boolean;
  
  /** Is this filament currently hovered? */
  hovered?: boolean;
  
  /** Visibility */
  visible?: boolean;
}

/**
 * FILAMENT COLLECTION (BUNDLE)
 * 
 * Multiple filaments rendered together.
 * Spacing is typography only, NEVER semantic.
 */
export interface FilamentCollection {
  /** Collection ID */
  id: string;
  
  /** Collection name */
  name?: string;
  
  /** Filaments in this collection */
  filaments: Filament[];
  
  /** Spacing strategy */
  spacing: FilamentSpacing;
  
  /** Ordering strategy */
  ordering?: 'chronological' | 'magnitude' | 'alphabetical' | 'custom';
}

/**
 * FILAMENT SPACING
 * 
 * Pure typography - NOT semantic
 */
export interface FilamentSpacing {
  /** Spacing mode */
  mode: 'tight' | 'normal' | 'wide' | 'custom';
  
  /** Custom gap (if mode = 'custom') */
  customGap?: number;
  
  /** View-aware compression? */
  viewAware?: boolean;
}

/**
 * FILAMENT LIFECYCLE STATE
 */
export type FilamentState = 
  | 'active'      // Normal operation
  | 'paused'      // No new commits
  | 'archived'    // Historical only
  | 'forked'      // Split into branches
  | 'merged';     // Rejoined with another

/**
 * Validation: Assert filament invariants
 */
export function validateFilament(filament: Filament): void {
  if (!filament.id || !filament.name) {
    throw new Error('Filament must have id and name');
  }
  
  if (typeof filament.baselineMagnitude !== 'number' || filament.baselineMagnitude <= 0) {
    throw new Error('baselineMagnitude must be positive number');
  }
  
  // Time Boxes must be ordered by eventIndex
  for (let i = 1; i < filament.timeBoxes.length; i++) {
    if (filament.timeBoxes[i].eventIndex <= filament.timeBoxes[i - 1].eventIndex) {
      throw new Error('TimeBoxes must be ordered by eventIndex (monotonic increasing)');
    }
  }
  
  // Events must be ordered by eventIndex
  for (let i = 1; i < filament.events.length; i++) {
    if (filament.events[i].eventIndex < filament.events[i - 1].eventIndex) {
      throw new Error('Events must be ordered by eventIndex');
    }
  }
  
  // All TimeBox filamentIds must match
  filament.timeBoxes.forEach(tb => {
    if (tb.filamentId !== filament.id) {
      throw new Error(`TimeBox ${tb.id} filamentId mismatch: expected ${filament.id}, got ${tb.filamentId}`);
    }
  });
}

/**
 * Helper: Get Time Box at specific event index
 */
export function getTimeBoxAtIndex(filament: Filament, eventIndex: number): TimeBox | undefined {
  return filament.timeBoxes.find(tb => tb.eventIndex === eventIndex);
}

/**
 * Helper: Get events at specific event index
 */
export function getEventsAtIndex(filament: Filament, eventIndex: number): Event[] {
  return filament.events.filter(e => e.eventIndex === eventIndex);
}

/**
 * Helper: Get latest Time Box (current state)
 */
export function getLatestTimeBox(filament: Filament): TimeBox | undefined {
  if (filament.timeBoxes.length === 0) return undefined;
  return filament.timeBoxes[filament.timeBoxes.length - 1];
}
