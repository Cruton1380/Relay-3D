/**
 * ENGAGE SURFACE LOCK MANAGER
 * 
 * Core invariant: Edits require L6 policy + engage distance + locus lock.
 * 
 * Lock types:
 * - soft: advisory (user can see "someone editing", can still edit)
 * - hard: exclusive (only one user can edit at a time)
 * - no-lock: free-for-all (conflicts → fork)
 * 
 * For proof: use soft-lock mode (demo-friendly)
 */

/**
 * Lock state (in-memory for proof)
 */
const locks = new Map(); // locusId → { userId, timestamp, type }

/**
 * Attempt to acquire lock on locus
 * 
 * @param {string} locusId - Cell/selection identifier
 * @param {string} userId - User requesting lock
 * @param {string} lockType - 'soft' | 'hard' | 'none'
 * @returns {object} { acquired: boolean, currentLock: object | null }
 */
export function acquireLock(locusId, userId, lockType = 'soft') {
  const existing = locks.get(locusId);

  // No existing lock: grant immediately
  if (!existing) {
    const lock = {
      locusId,
      userId,
      lockType,
      timestamp: Date.now(),
    };
    locks.set(locusId, lock);
    return { acquired: true, currentLock: lock };
  }

  // Lock exists
  if (lockType === 'none') {
    // No-lock mode: always allow
    return { acquired: true, currentLock: null };
  }

  if (lockType === 'soft') {
    // Soft lock: advisory, allow but warn
    return { acquired: true, currentLock: existing, warning: 'Another user is editing' };
  }

  if (lockType === 'hard') {
    // Hard lock: exclusive
    if (existing.userId === userId) {
      // Same user: allow
      return { acquired: true, currentLock: existing };
    } else {
      // Different user: deny
      return { acquired: false, currentLock: existing, reason: 'Locked by another user' };
    }
  }

  return { acquired: false, currentLock: existing };
}

/**
 * Release lock on locus
 * 
 * @param {string} locusId - Cell/selection identifier
 * @param {string} userId - User releasing lock
 * @returns {boolean} Success
 */
export function releaseLock(locusId, userId) {
  const existing = locks.get(locusId);
  
  if (!existing) return false;
  
  if (existing.userId === userId) {
    locks.delete(locusId);
    return true;
  }
  
  return false; // Can't release someone else's lock
}

/**
 * Check lock status
 * 
 * @param {string} locusId - Cell/selection identifier
 * @returns {object | null} Current lock or null
 */
export function getLockStatus(locusId) {
  return locks.get(locusId) || null;
}

/**
 * Check if user CAN engage (conditions only, does NOT acquire lock)
 * 
 * Engage contract (Relay-grade):
 * canEngage = (tier === L6) && (distance <= engageDistance) && (hasPermission)
 * 
 * @param {object} tier - Privacy tier from resolveTier()
 * @param {string} locusId - Cell/selection identifier (unused in check, kept for consistency)
 * @param {string} userId - User requesting engagement (unused in check, kept for consistency)
 * @returns {object} { canEngage: boolean, reason: string }
 */
export function canEngage(tier, locusId, userId) {
  // Require L6 (Engage policy) - this checks both policy AND distance
  if (!tier.renderFlags.allowEngage) {
    return {
      canEngage: false,
      reason: `Requires L6 policy + engage distance (<5 units). Current: ${tier.label}`,
    };
  }

  // TODO: Add permission check when user auth is implemented
  // For proof: always allowed if tier permits

  return {
    canEngage: true,
  };
}

/**
 * Clear all locks (for proof reset)
 */
export function clearAllLocks() {
  locks.clear();
}
