/**
 * EVENT (GLYPH) - Discrete Operation on Filament
 * 
 * Events are localized geometric modifications written onto filaments.
 * They form a finite alphabet (like music notation).
 * 
 * CRITICAL INVARIANT: Uniform Δx footprint (unless explicitly span-events).
 */

export type EventType = 
  | 'STAMP'      // Ring collar (operation marker)
  | 'KINK'       // Bend (deterministic transform)
  | 'DENT'       // Radius change (magnitude impact)
  | 'TWIST'      // Torsion (encryption)
  | 'UNTWIST'    // Counter-torsion (decryption)
  | 'GATE'       // Clamp (filter/eligibility)
  | 'SPLIT'      // Y-fork (branch/derivation)
  | 'SCAR';      // Merge band (reconciliation/rollback)

/**
 * EVENT CATEGORY
 * Used for stacking rules
 */
export type EventCategory = 'body' | 'modifier';

export const EVENT_CATEGORIES: Record<EventType, EventCategory> = {
  'STAMP': 'modifier',
  'KINK': 'body',
  'DENT': 'body',
  'TWIST': 'body',
  'UNTWIST': 'body',
  'GATE': 'modifier',
  'SPLIT': 'body',
  'SCAR': 'body',
};

/**
 * EVENT GLYPH
 * 
 * Represents one operation on a filament at a specific event index.
 */
export interface Event {
  /** Unique identifier */
  id: string;
  
  /** Glyph type */
  type: EventType;
  
  /** Event order index (maps to X position via layoutEngine) */
  eventIndex: number;
  
  /** Span width (in Δx units, default = 1) */
  span?: number;
  
  /** Human-readable label (becomes 2D at close zoom) */
  label: string;
  
  /** Operation parameters (type-specific) */
  params: EventParams;
  
  /** Y-offset lane assignment (computed by layoutEngine) */
  lane?: number;
  
  /** Severity/impact (affects visual intensity, NOT size) */
  severity?: 'low' | 'medium' | 'high';
  
  /** Is this event currently selected? */
  selected?: boolean;
}

/**
 * EVENT PARAMETERS
 * Type-specific metadata for each glyph
 */
export type EventParams =
  | StampParams
  | KinkParams
  | DentParams
  | TwistParams
  | UntwistParams
  | GateParams
  | SplitParams
  | ScarParams;

/** STAMP: Generic operation marker */
export interface StampParams {
  type: 'stamp';
  /** Operation name */
  operation: string;
  /** Optional icon/symbol */
  symbol?: string;
}

/** KINK: Deterministic transform */
export interface KinkParams {
  type: 'kink';
  /** Transform type */
  transform: 'cast' | 'parse' | 'normalize' | 'pivot' | 'group' | 'map' | 'other';
  /** Transform direction (Y displacement) */
  direction: 'up' | 'down' | 'none';
  /** Angle (radians) */
  angle?: number;
}

/** DENT: Magnitude impact */
export interface DentParams {
  type: 'dent';
  /** Impact direction */
  impactType: 'swell' | 'pinch';
  /** Delta magnitude */
  delta: number;
  /** Delta unit */
  deltaUnit?: string;
  /** Statistical significance */
  sigma?: number;
}

/** TWIST: Encryption */
export interface TwistParams {
  type: 'twist';
  /** Encryption method */
  method: 'encrypt' | 'sign' | 'mask' | 'obfuscate';
  /** Torsion frequency (rotations per Δx) */
  frequency: number;
  /** Key hint (optional, no actual keys) */
  keyHint?: string;
}

/** UNTWIST: Decryption */
export interface UntwistParams {
  type: 'untwist';
  /** Decryption method */
  method: 'decrypt' | 'verify' | 'unmask' | 'reveal';
  /** Must match paired TWIST frequency */
  frequency: number;
  /** Verification status */
  verified?: boolean;
}

/** GATE: Filter/eligibility */
export interface GateParams {
  type: 'gate';
  /** Filter condition */
  condition: string;
  /** Pass ratio (0-1) */
  passRatio: number;
  /** Records excluded count */
  excludedCount?: number;
}

/** SPLIT: Branch/derivation */
export interface SplitParams {
  type: 'split';
  /** Split type */
  splitType: 'fork' | 'partition' | 'derive_kpi' | 'branch';
  /** Target filament ID(s) */
  targetFilaments: string[];
  /** Split condition */
  condition?: string;
}

/** SCAR: Merge/reconciliation */
export interface ScarParams {
  type: 'scar';
  /** Merge type */
  mergeType: 'merge' | 'rollback' | 'rebase' | 'reconcile';
  /** Source filament IDs */
  sourceFilaments: string[];
  /** Conflict resolution method */
  resolutionMethod?: string;
}

/**
 * EVENT STACKING SLOT
 * 
 * Represents all events that occupy a single Δx window.
 * Enforces stacking rules.
 */
export interface EventStackingSlot {
  /** Event index (X position) */
  eventIndex: number;
  
  /** At most ONE body glyph per slot */
  bodyEvent?: Event;
  
  /** Any number of modifier glyphs */
  modifierEvents: Event[];
}

/**
 * STACKING RULES
 * 
 * These are the "engraving rules" that keep the notation readable.
 */
export const STACKING_RULES = {
  /** Max one body glyph per Δx slot */
  MAX_BODY_PER_SLOT: 1,
  
  /** Modifiers unlimited (but should be practical) */
  MAX_MODIFIERS_PER_SLOT: 3,
  
  /** Y-offset lanes */
  LANES: {
    BODY: 0,        // On filament centerline
    MODIFIER_ABOVE: 1,  // Above filament
    NUMERIC_BELOW: -1,  // Below filament
  },
} as const;

/**
 * Validation: Assert event invariants
 */
export function validateEvent(event: Event): void {
  if (!event.id || !event.type || typeof event.eventIndex !== 'number') {
    throw new Error('Event must have id, type, and eventIndex');
  }
  
  if (event.eventIndex < 0) {
    throw new Error('eventIndex must be non-negative');
  }
  
  if (!event.label || event.label.trim().length === 0) {
    throw new Error('Event must have non-empty label');
  }
  
  if (event.span && event.span < 1) {
    throw new Error('span must be >= 1');
  }
}

/**
 * Validation: Check if two body events conflict in same slot
 */
export function checkBodyConflict(events: Event[]): void {
  const slotMap = new Map<number, Event[]>();
  
  events.forEach(event => {
    const category = EVENT_CATEGORIES[event.type];
    if (category === 'body') {
      const slot = event.eventIndex;
      if (!slotMap.has(slot)) {
        slotMap.set(slot, []);
      }
      slotMap.get(slot)!.push(event);
    }
  });
  
  slotMap.forEach((bodyEvents, slot) => {
    if (bodyEvents.length > 1) {
      throw new Error(
        `Stacking rule violation: ${bodyEvents.length} body glyphs at eventIndex ${slot}. ` +
        `Max 1 body glyph per Δx slot. Events: ${bodyEvents.map(e => e.type).join(', ')}`
      );
    }
  });
}
