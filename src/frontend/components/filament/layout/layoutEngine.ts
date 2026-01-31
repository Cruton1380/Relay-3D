/**
 * LAYOUT ENGINE - Deterministic Event Positioning
 * 
 * Given a list of events, compute:
 * - X positions (eventIndex → world X coordinate)
 * - Y lanes (body vs modifiers)
 * - Z offsets (for filament spacing in collections)
 * 
 * Enforces ALL stacking rules and throws on violations.
 * 
 * This is the "music engraving engine" for computation.
 */

import {
  Event,
  EventType,
  EventCategory,
  EventStackingSlot,
  EVENT_CATEGORIES,
  STACKING_RULES,
  checkBodyConflict,
} from '../types/Event';

/**
 * LAYOUT CONFIGURATION
 * 
 * World-space constants
 */
export interface LayoutConfig {
  /** Δx footprint (world units per event slot) */
  deltaX: number;
  
  /** Y-offset per lane (world units) */
  laneOffsetY: number;
  
  /** Starting X position */
  startX?: number;
  
  /** Filament spacing (for collections) */
  filamentSpacing?: number;
}

/**
 * DEFAULT LAYOUT CONFIG
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  deltaX: 10, // 10 world units per event slot
  laneOffsetY: 2, // 2 world units per lane
  startX: 0,
  filamentSpacing: 5, // 5 world units between filaments
};

/**
 * LAYOUT RESULT
 * 
 * Computed positions for rendering
 */
export interface LayoutResult {
  /** Event ID → position */
  positions: Map<string, EventPosition>;
  
  /** Stacking slots (for validation/debugging) */
  slots: EventStackingSlot[];
  
  /** Bounding box */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * EVENT POSITION
 * 
 * Complete 3D position + metadata for one event
 */
export interface EventPosition {
  /** Event ID */
  eventId: string;
  
  /** Event type */
  eventType: EventType;
  
  /** World X position (center) */
  x: number;
  
  /** World Y position (lane offset) */
  y: number;
  
  /** World Z position (filament index) */
  z: number;
  
  /** Lane assignment */
  lane: number;
  
  /** Span width (in world units) */
  spanWidth: number;
  
  /** Start X (if span > 1) */
  startX: number;
  
  /** End X (if span > 1) */
  endX: number;
}

/**
 * COMPUTE LAYOUT
 * 
 * Main entry point: given events, compute all positions.
 * 
 * @throws Error if stacking rules violated
 */
export function computeLayout(
  events: Event[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutResult {
  // 1. Validate: check body conflicts
  checkBodyConflict(events);
  
  // 2. Build stacking slots
  const slots = buildStackingSlots(events);
  
  // 3. Assign lanes
  const eventsWithLanes = assignLanes(events);
  
  // 4. Compute positions
  const positions = new Map<string, EventPosition>();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  eventsWithLanes.forEach(event => {
    const position = computeEventPosition(event, config);
    positions.set(event.id, position);
    
    // Update bounds
    minX = Math.min(minX, position.startX);
    maxX = Math.max(maxX, position.endX);
    minY = Math.min(minY, position.y - config.laneOffsetY);
    maxY = Math.max(maxY, position.y + config.laneOffsetY);
  });
  
  return {
    positions,
    slots,
    bounds: {
      minX: minX === Infinity ? 0 : minX,
      maxX: maxX === -Infinity ? 0 : maxX,
      minY: minY === Infinity ? -config.laneOffsetY * 2 : minY,
      maxY: maxY === -Infinity ? config.laneOffsetY * 2 : maxY,
    },
  };
}

/**
 * BUILD STACKING SLOTS
 * 
 * Group events by eventIndex into slots.
 * One slot = all events at same X position.
 */
function buildStackingSlots(events: Event[]): EventStackingSlot[] {
  const slotMap = new Map<number, EventStackingSlot>();
  
  events.forEach(event => {
    const idx = event.eventIndex;
    
    if (!slotMap.has(idx)) {
      slotMap.set(idx, {
        eventIndex: idx,
        bodyEvent: undefined,
        modifierEvents: [],
      });
    }
    
    const slot = slotMap.get(idx)!;
    const category = EVENT_CATEGORIES[event.type];
    
    if (category === 'body') {
      if (slot.bodyEvent) {
        throw new Error(
          `Stacking rule violation: multiple body glyphs at eventIndex ${idx}`
        );
      }
      slot.bodyEvent = event;
    } else {
      if (slot.modifierEvents.length >= STACKING_RULES.MAX_MODIFIERS_PER_SLOT) {
        throw new Error(
          `Stacking rule violation: too many modifiers at eventIndex ${idx} ` +
          `(max ${STACKING_RULES.MAX_MODIFIERS_PER_SLOT})`
        );
      }
      slot.modifierEvents.push(event);
    }
  });
  
  return Array.from(slotMap.values()).sort((a, b) => a.eventIndex - b.eventIndex);
}

/**
 * ASSIGN LANES
 * 
 * Compute Y-lane assignment for each event based on category.
 */
function assignLanes(events: Event[]): Event[] {
  return events.map(event => {
    const category = EVENT_CATEGORIES[event.type];
    let lane: number;
    
    if (category === 'body') {
      lane = STACKING_RULES.LANES.BODY;
    } else {
      // Modifiers: alternate above/below if multiple
      // For simplicity, just use MODIFIER_ABOVE for now
      lane = STACKING_RULES.LANES.MODIFIER_ABOVE;
    }
    
    return {
      ...event,
      lane,
    };
  });
}

/**
 * COMPUTE EVENT POSITION
 * 
 * Convert eventIndex + lane → world XYZ coordinates
 */
function computeEventPosition(
  event: Event,
  config: LayoutConfig
): EventPosition {
  const startX = (config.startX || 0) + event.eventIndex * config.deltaX;
  const span = event.span || 1;
  const spanWidth = span * config.deltaX;
  const endX = startX + spanWidth;
  const centerX = startX + spanWidth / 2;
  
  const lane = event.lane || 0;
  const y = lane * config.laneOffsetY;
  
  return {
    eventId: event.id,
    eventType: event.type,
    x: centerX,
    y,
    z: 0, // Z is set by collection renderer
    lane,
    spanWidth,
    startX,
    endX,
  };
}

/**
 * COMPUTE FILAMENT COLLECTION LAYOUT
 * 
 * Layout multiple filaments with spacing
 */
export function computeCollectionLayout(
  filamentEvents: Array<{ filamentId: string; events: Event[] }>,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Map<string, LayoutResult> {
  const layoutsByFilament = new Map<string, LayoutResult>();
  
  filamentEvents.forEach(({ filamentId, events }, index) => {
    const layout = computeLayout(events, config);
    
    // Apply Z offset for this filament
    const zOffset = index * (config.filamentSpacing || 5);
    layout.positions.forEach(pos => {
      pos.z = zOffset;
    });
    
    layoutsByFilament.set(filamentId, layout);
  });
  
  return layoutsByFilament;
}

/**
 * HELPER: Get position for event by ID
 */
export function getEventPosition(
  layout: LayoutResult,
  eventId: string
): EventPosition | undefined {
  return layout.positions.get(eventId);
}

/**
 * HELPER: Get all positions as array
 */
export function getAllPositions(layout: LayoutResult): EventPosition[] {
  return Array.from(layout.positions.values());
}

/**
 * HELPER: Get events at specific eventIndex
 */
export function getEventsAtIndex(
  events: Event[],
  eventIndex: number
): Event[] {
  return events.filter(e => e.eventIndex === eventIndex);
}

/**
 * VALIDATION: Assert layout invariants
 */
export function validateLayout(layout: LayoutResult): void {
  // Check no position overlaps (same X and Y and Z)
  const positionKeys = new Set<string>();
  
  layout.positions.forEach(pos => {
    const key = `${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.z.toFixed(2)}`;
    
    // Body glyphs with same X should not have same Y (unless different Z)
    const category = EVENT_CATEGORIES[pos.eventType];
    if (category === 'body' && positionKeys.has(key)) {
      throw new Error(
        `Layout violation: overlapping body glyphs at ${key}`
      );
    }
    
    positionKeys.add(key);
  });
}
