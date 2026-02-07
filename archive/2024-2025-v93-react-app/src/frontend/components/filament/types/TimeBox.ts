/**
 * TIME BOX - Atomic Truth Unit
 * 
 * A Time Box is one irreversible state of belief in the filament system.
 * It is NOT a slice of clock time - it is a condensation of time into discrete, inspectable state.
 * 
 * The cube geometry is NOT decorative. Each face has fixed semantic meaning.
 */

export interface TimeBox {
  /** Unique identifier for this Time Box */
  id: string;
  
  /** Filament this belongs to */
  filamentId: string;
  
  /** Event order index (X position) - discrete, monotonic */
  eventIndex: number;
  
  /** Clock timestamp (metadata only, never structural) */
  timestamp?: number;
  
  /** Duration until next Time Box (for time-weighted view) */
  durationMs?: number;
  
  /** Faces define meaning, not geometry */
  faces: TimeBoxFaces;
  
  /** Visual properties (theme-governed) */
  visual?: {
    /** Opacity (0-1) */
    opacity?: number;
    /** Highlight state */
    highlighted?: boolean;
  };
}

/**
 * TIME BOX FACES
 * 
 * Critical Rule: Faces encode meaning. Geometry is constant.
 */
export interface TimeBoxFaces {
  /** +X face: Output / Current Belief
   * - Final values only
   * - No explanations
   * - "What do we think is true now?"
   */
  output: {
    /** Display value (e.g., "$1,250.00", "Approved", "128 votes") */
    value: string | number;
    /** Data type */
    type: 'numeric' | 'text' | 'boolean' | 'object';
    /** Optional precision indicator */
    precision?: number;
  };
  
  /** -X face: Inputs / Dependencies
   * - Pointers to prior Time Boxes
   * - No values, structure only
   * - "What did this depend on?"
   */
  input: {
    /** IDs of upstream Time Boxes */
    dependencies: string[];
    /** Dependency type */
    dependencyType?: 'direct' | 'aggregate' | 'derived';
  };
  
  /** +Y face: Semantic Meaning
   * - Human explanation
   * - Business meaning
   * - No numbers, no formulas
   * - "What does this represent?"
   */
  semanticMeaning: {
    /** Human-readable label */
    label: string;
    /** Business context */
    meaning?: string;
    /** Unit (USD, votes, etc.) */
    unit?: string;
  };
  
  /** -Y face: Magnitude / Confidence
   * - Fill, density, shading
   * - No shape change
   * - "How strong is this belief?"
   */
  magnitude: {
    /** Confidence/completeness (0-1) */
    confidence: number;
    /** Contribution ratio (for aggregates) */
    contributionRatio?: number;
    /** Error bounds */
    errorBounds?: { lower: number; upper: number };
  };
  
  /** +Z face: Identity & Lineage
   * - Filament ID, time index, version hash
   * - Boundary context
   * - "Who does this belong to?"
   */
  identity: {
    /** Filament ID (redundant with TimeBox.filamentId, but semantic) */
    filamentId: string;
    /** Event index (redundant with TimeBox.eventIndex) */
    eventIndex: number;
    /** Version hash / commit hash */
    versionHash?: string;
    /** Boundary context (Z eligibility) */
    boundaryContext?: string;
  };
  
  /** -Z face: Root Evidence Pointer
   * - Pointer to immutable source evidence
   * - Evidence never lives in Time Boxes
   * - "What real-world thing anchors this?"
   */
  evidence: {
    /** Evidence type */
    type: 'contract' | 'receipt' | 'sensor' | 'document' | 'commit' | 'other';
    /** Pointer to evidence (URI, hash, etc.) */
    pointer: string;
    /** Optional human-readable reference */
    reference?: string;
  };
}

/**
 * TIME BOX VIEW MODE
 * Controls which faces are emphasized during rendering
 */
export type TimeBoxViewMode = 
  | 'output'      // Show +X face (values)
  | 'semantic'    // Show +Y face (meaning)
  | 'evidence'    // Show -Z face (source)
  | 'dependencies' // Show -X face (lineage)
  | 'confidence'  // Show -Y face (magnitude)
  | 'full';       // Show all faces

/**
 * Validation: Assert Time Box invariants
 */
export function validateTimeBox(timeBox: TimeBox): void {
  if (!timeBox.id || !timeBox.filamentId) {
    throw new Error('TimeBox must have id and filamentId');
  }
  
  if (typeof timeBox.eventIndex !== 'number' || timeBox.eventIndex < 0) {
    throw new Error('eventIndex must be non-negative integer');
  }
  
  if (!timeBox.faces.output || !timeBox.faces.semanticMeaning) {
    throw new Error('TimeBox must have at least output and semanticMeaning faces defined');
  }
  
  if (timeBox.faces.magnitude.confidence < 0 || timeBox.faces.magnitude.confidence > 1) {
    throw new Error('magnitude.confidence must be between 0 and 1');
  }
}
