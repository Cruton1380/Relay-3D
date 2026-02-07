/**
 * RELAY PRESENCE SERVICE - Tier 1 (In-Memory Mock)
 * 
 * Ephemeral presence tracking with TTL cleanup.
 * 
 * NOT persisted. NOT committed to Git.
 * In production: replace with WebSocket/SignalR/regional relay nodes.
 */

import { 
  PresenceLocus, 
  PresenceState, 
  ViewerSession, 
  PresenceQueryResult,
  locusKey 
} from '../types/PresenceState';

/**
 * Default TTL: 8 seconds
 * If no heartbeat within 8s, session is considered stale
 */
const DEFAULT_TTL_MS = 8000;

/**
 * Cleanup interval: 2 seconds
 * Sweep for expired sessions every 2s
 */
const CLEANUP_INTERVAL_MS = 2000;

/**
 * In-memory presence store
 */
class PresenceService {
  private sessions: Map<string, ViewerSession> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Heartbeat: Update viewer's presence at a locus
   * 
   * @param locus Where the viewer is inspecting
   * @param sessionId Unique session identifier
   * @param actorId Optional actor ID (for Tier 2+)
   */
  heartbeat(
    locus: PresenceLocus, 
    sessionId: string, 
    actorId?: string
  ): void {
    const now = Date.now();
    const key = `${sessionId}:${locusKey(locus)}`;

    this.sessions.set(key, {
      sessionId,
      locus,
      lastHeartbeat: now,
      actorId,
    });
  }

  /**
   * Get presence for a specific locus
   * 
   * Tier 1: Returns count only
   * 
   * @param locus The locus to query
   * @returns Presence count at that locus
   */
  getPresenceForLocus(locus: PresenceLocus): PresenceQueryResult {
    const key = locusKey(locus);
    const now = Date.now();
    
    // Count active sessions at this locus
    let count = 0;
    for (const [sessionKey, session] of this.sessions.entries()) {
      if (locusKey(session.locus) === key) {
        // Check if session is still alive (within TTL)
        if (now - session.lastHeartbeat < DEFAULT_TTL_MS) {
          count++;
        }
      }
    }

    return {
      locus,
      count,
    };
  }

  /**
   * Get presence for multiple loci (batch query)
   * 
   * @param loci Array of loci to query
   * @returns Array of presence results
   */
  getPresenceForLoci(loci: PresenceLocus[]): PresenceQueryResult[] {
    return loci.map(locus => this.getPresenceForLocus(locus));
  }

  /**
   * Remove a specific session (e.g., on explicit disconnect)
   * 
   * @param sessionId Session to remove
   */
  removeSession(sessionId: string): void {
    for (const [key, session] of this.sessions.entries()) {
      if (session.sessionId === sessionId) {
        this.sessions.delete(key);
      }
    }
  }

  /**
   * Clear all presence (e.g., for testing)
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Cleanup expired sessions (TTL sweep)
   * 
   * Called automatically every CLEANUP_INTERVAL_MS
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastHeartbeat > DEFAULT_TTL_MS) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.sessions.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.debug(`[PresenceService] Cleaned up ${expiredKeys.length} expired sessions`);
    }
  }

  /**
   * Start automatic TTL cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop cleanup timer (e.g., on unmount)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.sessions.clear();
  }

  /**
   * Get debug info (for dev tools)
   */
  getDebugInfo(): { totalSessions: number; activeLoci: number } {
    const now = Date.now();
    const activeSessions = Array.from(this.sessions.values()).filter(
      s => now - s.lastHeartbeat < DEFAULT_TTL_MS
    );
    const uniqueLoci = new Set(activeSessions.map(s => locusKey(s.locus)));

    return {
      totalSessions: activeSessions.length,
      activeLoci: uniqueLoci.size,
    };
  }
}

/**
 * Singleton instance
 * In production: replace with proper service injection
 */
export const presenceService = new PresenceService();

/**
 * React hook for presence heartbeat
 * 
 * Automatically sends heartbeats while component is mounted
 * 
 * @param locus Current locus (null = no heartbeat)
 * @param sessionId Unique session ID
 * @param intervalMs Heartbeat interval (default: 2s)
 */
export function usePresenceHeartbeat(
  locus: PresenceLocus | null,
  sessionId: string,
  intervalMs: number = 2000
): void {
  React.useEffect(() => {
    if (!locus) return;

    // Send initial heartbeat
    presenceService.heartbeat(locus, sessionId);

    // Set up interval
    const interval = setInterval(() => {
      presenceService.heartbeat(locus, sessionId);
    }, intervalMs);

    return () => {
      clearInterval(interval);
      // Optional: Remove session on unmount (or let TTL handle it)
      // presenceService.removeSession(sessionId);
    };
  }, [locus?.filamentId, locus?.commitIndex, locus?.lensContext, sessionId, intervalMs]);
}

// For backwards compatibility with React import
import React from 'react';
