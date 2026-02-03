// relay-3d/utils/governanceLocks.js
// Canon: Governance constraints to prevent weaponization

/**
 * LOCK #8: Data Minimization + Purpose Limitation
 * Every telemetry collection must declare purpose and retention
 */
export const TELEMETRY_PURPOSES = {
  ERI_COMPUTE: 'eri_compute',
  REPAIR_VERIFY: 'repair_verify',
  CLOSURE_PROOF: 'closure_proof'
};

export function validateTelemetryPurpose(telemetryData) {
  if (!telemetryData.purpose) {
    throw new Error('GOVERNANCE_VIOLATION: Telemetry without purpose');
  }
  
  if (!telemetryData.retention_ttl) {
    throw new Error('GOVERNANCE_VIOLATION: Telemetry without retention TTL');
  }
  
  if (!Object.values(TELEMETRY_PURPOSES).includes(telemetryData.purpose)) {
    throw new Error(`GOVERNANCE_VIOLATION: Invalid telemetry purpose: ${telemetryData.purpose}`);
  }
  
  return true;
}

/**
 * LOCK #9: Learning Cannot Auto-Change Policy
 * RepairEffectivenessTracker can only recommend, never execute
 */
export function validatePolicyChange(change, actor) {
  if (change.type === 'POLICY_RECOMMENDATION') {
    // Recommendations allowed from any source
    return true;
  }
  
  if (change.type === 'POLICY_COMMIT') {
    // Policy commits require human or delegated authority
    if (actor.type === 'automated_learner') {
      throw new Error('GOVERNANCE_VIOLATION: Automated learning cannot commit policy changes');
    }
    
    if (!actor.authorityRef) {
      throw new Error('GOVERNANCE_VIOLATION: Policy change without authorityRef');
    }
    
    if (!change.version_bump) {
      throw new Error('GOVERNANCE_VIOLATION: Policy change without version bump');
    }
  }
  
  return true;
}

/**
 * Pressure Budget - consumable resource constraint
 * Prevents audit storms and governance exhaustion
 */
export class PressureBudget {
  constructor(scope, config = {}) {
    this.scope = scope;
    this.maxChecksPerWindow = config.maxChecksPerWindow || 100;
    this.maxRepairsInflight = config.maxRepairsInflight || 10;
    this.cooldownAfterRefusal = config.cooldownAfterRefusal || 5000; // ms
    
    this.checksUsed = 0;
    this.repairsInflight = 0;
    this.lastRefusalTime = null;
  }
  
  canAttest() {
    if (this.checksUsed >= this.maxChecksPerWindow) {
      return {
        allowed: false,
        reason: 'PRESSURE_BUDGET_EXHAUSTED',
        resetsAt: this.getResetTime()
      };
    }
    
    if (this.lastRefusalTime && (Date.now() - this.lastRefusalTime < this.cooldownAfterRefusal)) {
      return {
        allowed: false,
        reason: 'COOLDOWN_ACTIVE',
        cooldownEndsAt: this.lastRefusalTime + this.cooldownAfterRefusal
      };
    }
    
    return { allowed: true };
  }
  
  canRepair() {
    if (this.repairsInflight >= this.maxRepairsInflight) {
      return {
        allowed: false,
        reason: 'MAX_REPAIRS_INFLIGHT',
        currentInflight: this.repairsInflight
      };
    }
    
    return { allowed: true };
  }
  
  recordAttest() {
    this.checksUsed++;
  }
  
  recordRepairStart() {
    this.repairsInflight++;
  }
  
  recordRepairComplete() {
    this.repairsInflight = Math.max(0, this.repairsInflight - 1);
  }
  
  recordRefusal() {
    this.lastRefusalTime = Date.now();
  }
  
  reset() {
    this.checksUsed = 0;
    // Don't reset repairsInflight or cooldown - they persist
  }
  
  getResetTime() {
    // Reset at next hour boundary
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour;
  }
}

/**
 * Refusal must always include next legitimate actions
 * Canon: refusal is reconciling, not coercive
 */
export function createRefusalObject(reasonCode, context = {}) {
  const refusal = {
    success: false,
    reason_code: reasonCode,
    timestamp: new Date().toISOString(),
    missing_inputs: context.missingInputs || [],
    allowed_next_actions: []
  };
  
  // Determine legitimate next actions based on reason
  switch (reasonCode) {
    case 'INSUFFICIENT_AUTHORITY':
      refusal.allowed_next_actions = [
        'request_authority',
        'attach_delegation',
        'open_dispute'
      ];
      break;
      
    case 'MISSING_EVIDENCE':
      refusal.allowed_next_actions = [
        'attach_evidence',
        'request_witness',
        'wait_for_proof'
      ];
      break;
      
    case 'PRESSURE_BUDGET_EXHAUSTED':
      refusal.allowed_next_actions = [
        'wait_for_cooldown',
        'request_budget_increase',
        'escalate_to_authority'
      ];
      break;
      
    case 'COOLDOWN_ACTIVE':
      refusal.allowed_next_actions = [
        'wait_for_cooldown',
        'escalate_urgency'
      ];
      break;
      
    case 'DIVERGENCE_TOO_HIGH':
      refusal.allowed_next_actions = [
        'request_reconciliation',
        'open_fork',
        'attach_explanation'
      ];
      break;
      
    default:
      refusal.allowed_next_actions = [
        'open_dispute',
        'request_clarification'
      ];
  }
  
  return refusal;
}

/**
 * Canon selection rate-limits
 * Prevents narrative domination via procedural capture
 */
export class CanonSelectionLimits {
  constructor(scope, config = {}) {
    this.scope = scope;
    this.maxActiveForks = config.maxActiveForks || 5;
    this.maxCanonVotesPerWindow = config.maxCanonVotesPerWindow || 20;
    
    this.activeForks = new Set();
    this.votesUsed = 0;
    this.windowStart = Date.now();
  }
  
  canCreateFork(forkId) {
    if (this.activeForks.size >= this.maxActiveForks) {
      return createRefusalObject('MAX_FORKS_EXCEEDED', {
        currentForks: this.activeForks.size,
        maxForks: this.maxActiveForks
      });
    }
    
    this.activeForks.add(forkId);
    return { success: true };
  }
  
  canVoteOnCanon() {
    if (this.votesUsed >= this.maxCanonVotesPerWindow) {
      return createRefusalObject('CANON_VOTE_LIMIT_EXCEEDED', {
        votesUsed: this.votesUsed,
        maxVotes: this.maxCanonVotesPerWindow
      });
    }
    
    return { success: true };
  }
  
  recordCanonVote() {
    this.votesUsed++;
  }
  
  closeFork(forkId) {
    this.activeForks.delete(forkId);
  }
}

/**
 * Snapshot projection-only constraint
 * Canon: snapshots may never be commit sources
 */
export function validateSnapshotUsage(operation) {
  if (operation.type === 'COMMIT_FROM_SNAPSHOT') {
    throw new Error('GOVERNANCE_VIOLATION: Cannot commit from snapshot without replay proof');
  }
  
  if (operation.type === 'WRITE_FROM_SNAPSHOT' && !operation.event_id_end) {
    throw new Error('GOVERNANCE_VIOLATION: Snapshot write must reference event_id_end');
  }
  
  if (operation.type === 'WRITE_FROM_SNAPSHOT' && !operation.replayProof) {
    throw new Error('GOVERNANCE_VIOLATION: Snapshot write requires replay proof');
  }
  
  return true;
}

/**
 * Policy immutability constraint
 * Canon: No writes to policies/current or policies/latest
 */
export function validatePolicyPath(path) {
  const forbiddenPaths = [
    'policies/current',
    'policies/latest',
    '/policies/current',
    '/policies/latest'
  ];
  
  if (forbiddenPaths.some(forbidden => path.includes(forbidden))) {
    throw new Error('GOVERNANCE_VIOLATION: Cannot write to policies/current or policies/latest. Use versioned paths only.');
  }
  
  // Must include version identifier
  if (!path.match(/policies\/[a-z0-9_-]+\/v\d+/)) {
    throw new Error('GOVERNANCE_VIOLATION: Policy path must include version (e.g., policies/my_policy/v1)');
  }
  
  return true;
}
