/**
 * FILAMENT STORE - Append-Only Commit Log
 * 
 * Core invariants:
 * - Commits are NEVER mutated
 * - Commits are NEVER deleted
 * - CommitIndex is monotonically increasing per filament
 * - Every commit has: ref, commitIndex, type, timestamp, authorUnitRef, payload, causalRefs
 * 
 * Part of Relay Physics API v1.1.0
 */

class FilamentStore {
  constructor() {
    // In-memory stores (replace with DB in production)
    this.filaments = new Map(); // filamentId → Filament
    this.commits = new Map();   // commitRef → Commit
    this.subscribers = new Map(); // filamentId → Set<callback>
  }

  /**
   * Create a new filament
   */
  createFilament(filamentId, type, scope, createdBy) {
    if (this.filaments.has(filamentId)) {
      throw new Error(`Filament ${filamentId} already exists`);
    }

    const filament = {
      id: filamentId,
      type,
      scope,
      headRef: null,
      headIndex: 0,
      created: new Date().toISOString(),
      lastAuthor: createdBy
    };

    this.filaments.set(filamentId, filament);
    return filament;
  }

  /**
   * Append a commit to a filament (ONLY way to modify state)
   */
  appendCommit(filamentId, commitData) {
    const filament = this.filaments.get(filamentId);
    if (!filament) {
      throw new Error(`Filament ${filamentId} not found`);
    }

    // Generate commitIndex
    const commitIndex = filament.headIndex + 1;
    const commitRef = `${filamentId}@c${commitIndex}`;

    // Create immutable commit
    const commit = {
      ref: commitRef,
      filamentId,
      commitIndex,
      type: commitData.type,
      timestamp: new Date().toISOString(),
      authorUnitRef: commitData.authorUnitRef,
      payload: Object.freeze({ ...commitData.payload }),
      causalRefs: Object.freeze({
        inputs: commitData.causalRefs?.inputs || [],
        evidence: commitData.causalRefs?.evidence || [],
        authorityRef: commitData.causalRefs?.authorityRef || null
      })
    };

    // Freeze commit (immutability)
    Object.freeze(commit);
    Object.freeze(commit.causalRefs);

    // Store commit
    this.commits.set(commitRef, commit);

    // Update filament head
    filament.headRef = commitRef;
    filament.headIndex = commitIndex;
    filament.lastAuthor = commitData.authorUnitRef;

    // Notify subscribers
    this._notifySubscribers(filamentId, commit);

    return commit;
  }

  /**
   * Get all filaments (with optional filters)
   */
  listFilaments({ scope, type } = {}) {
    let results = Array.from(this.filaments.values());

    if (scope) {
      results = results.filter(f => f.scope === scope || f.scope?.startsWith(scope));
    }

    if (type) {
      results = results.filter(f => f.type === type);
    }

    return results;
  }

  /**
   * Get a specific filament
   */
  getFilament(filamentId) {
    return this.filaments.get(filamentId);
  }

  /**
   * Get commits for a filament (range)
   */
  getCommits(filamentId, fromIndex = 1, toIndex = null) {
    const filament = this.filaments.get(filamentId);
    if (!filament) {
      throw new Error(`Filament ${filamentId} not found`);
    }

    const actualToIndex = toIndex || filament.headIndex;
    const commits = [];

    for (let i = fromIndex; i <= actualToIndex; i++) {
      const commitRef = `${filamentId}@c${i}`;
      const commit = this.commits.get(commitRef);
      if (commit) {
        commits.push(commit);
      }
    }

    return commits;
  }

  /**
   * Get a specific commit by ref
   */
  getCommit(commitRef) {
    return this.commits.get(commitRef);
  }

  /**
   * Subscribe to filament updates (for WebSocket)
   */
  subscribe(filamentId, callback) {
    if (!this.subscribers.has(filamentId)) {
      this.subscribers.set(filamentId, new Set());
    }
    this.subscribers.get(filamentId).add(callback);
  }

  /**
   * Unsubscribe from filament updates
   */
  unsubscribe(filamentId, callback) {
    const subs = this.subscribers.get(filamentId);
    if (subs) {
      subs.delete(callback);
    }
  }

  /**
   * Internal: Notify subscribers of new commit
   */
  _notifySubscribers(filamentId, commit) {
    const subs = this.subscribers.get(filamentId);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(commit);
        } catch (error) {
          console.error(`Subscriber error for ${filamentId}:`, error);
        }
      });
    }
  }

  /**
   * Get stats (for debugging/monitoring)
   */
  getStats() {
    return {
      totalFilaments: this.filaments.size,
      totalCommits: this.commits.size,
      activeSubscriptions: this.subscribers.size
    };
  }
}

// Singleton instance
const filamentStore = new FilamentStore();

export default filamentStore;
