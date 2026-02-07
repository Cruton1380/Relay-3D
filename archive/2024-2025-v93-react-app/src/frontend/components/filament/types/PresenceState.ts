/**
 * RELAY PRESENCE STATE - Tier 1
 * 
 * Ephemeral session channel for multi-party inspectability.
 * NOT committed to Git truth chain.
 */

/**
 * Presence Locus - Where presence attaches
 * 
 * Tier 1: Local only (filamentId + commitIndex for currently rendered filament)
 * Tier 2+: May traverse dependencies
 */
export interface PresenceLocus {
  filamentId: string;
  commitIndex: number;
  lensContext?: string;  // e.g., 'workflow', 'globe', 'spreadsheet'
}

/**
 * Presence State - Minimal ephemeral record
 * 
 * Tier 1: Count only (no identity)
 */
export interface PresenceState {
  locus: PresenceLocus;
  count: number;  // Number of viewers at this locus
  updatedAt: number;  // Timestamp (for TTL)
  ttlMs: number;  // Time-to-live in milliseconds
}

/**
 * Viewer Session (internal to service)
 * 
 * Tracks individual sessions for TTL cleanup
 */
export interface ViewerSession {
  sessionId: string;
  locus: PresenceLocus;
  lastHeartbeat: number;
  actorId?: string;  // Hidden in Tier 1, used in Tier 2+
  visibilityMode?: 'invisible' | 'group' | 'manager' | 'org' | 'public';
}

/**
 * Presence Query Result
 * 
 * What consumers receive when querying presence
 */
export interface PresenceQueryResult {
  locus: PresenceLocus;
  count: number;
  // Tier 2+: roles, identities
}

/**
 * Helper: Create locus key for map lookups
 */
export function locusKey(locus: PresenceLocus): string {
  return `${locus.filamentId}@${locus.commitIndex}${locus.lensContext ? `:${locus.lensContext}` : ''}`;
}

/**
 * Helper: Parse locus key back to PresenceLocus
 */
export function parseLocusKey(key: string): PresenceLocus | null {
  const match = key.match(/^(.+)@(\d+)(?::(.+))?$/);
  if (!match) return null;
  
  return {
    filamentId: match[1],
    commitIndex: parseInt(match[2], 10),
    lensContext: match[3],
  };
}
