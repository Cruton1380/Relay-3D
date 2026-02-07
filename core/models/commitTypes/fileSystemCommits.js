/**
 * File System Commit Types
 * 
 * For Desktop Relay Agent: File Organization feature
 * Spec: docs/features/FILE-ORGANIZATION.md
 * 
 * Phase 0: FS_SCOPE_SET, FS_OBSERVED_EVENT
 * Phase 1: FS_PLAN_PROPOSED
 * Phase 2: FS_PLAN_APPROVED, FS_OP_EXECUTED, FS_OP_REFUSED, FS_TIMEBOX_REVERTED
 */

/**
 * FS_SCOPE_SET
 * User defines allowed folders
 * 
 * @typedef {Object} FSScopeSetCommit
 * @property {string} type - 'FS_SCOPE_SET'
 * @property {string[]} approvedFolders - Absolute paths to approved folders
 * @property {number} timestamp - Unix timestamp
 * @property {string} user - User identifier
 */
export const FS_SCOPE_SET = 'FS_SCOPE_SET';

/**
 * FS_OBSERVED_EVENT
 * Read-only event tracking
 * 
 * @typedef {Object} FSObservedEventCommit
 * @property {string} type - 'FS_OBSERVED_EVENT'
 * @property {('create'|'move'|'rename'|'delete')} eventType - Type of filesystem event
 * @property {string} path - Absolute path to file/folder
 * @property {number} timestamp - Unix timestamp
 * @property {string} scope - Approved folder this event belongs to
 * @property {Object} [metadata] - Optional file metadata (size, type)
 */
export const FS_OBSERVED_EVENT = 'FS_OBSERVED_EVENT';

/**
 * FS_PLAN_PROPOSED (Phase 1)
 * Planner generates reorganization plan
 * 
 * @typedef {Object} FSPlanProposedCommit
 * @property {string} type - 'FS_PLAN_PROPOSED'
 * @property {string} planId - Unique plan identifier
 * @property {Object[]} timeboxes - Batched operations
 * @property {number} pressureReduction - Estimated pressure reduction (0.0 to 1.0)
 * @property {boolean} reversible - Whether plan is fully reversible
 * @property {number} timestamp - Unix timestamp
 */
export const FS_PLAN_PROPOSED = 'FS_PLAN_PROPOSED';

/**
 * FS_PLAN_APPROVED (Phase 2)
 * User consents to execution
 * 
 * @typedef {Object} FSPlanApprovedCommit
 * @property {string} type - 'FS_PLAN_APPROVED'
 * @property {string} planId - Plan being approved
 * @property {string[]} timeboxIds - Timeboxes approved for execution
 * @property {number} timestamp - Unix timestamp
 * @property {string} user - User who approved
 */
export const FS_PLAN_APPROVED = 'FS_PLAN_APPROVED';

/**
 * FS_OP_EXECUTED (Phase 2)
 * Operation completed successfully
 * 
 * @typedef {Object} FSOpExecutedCommit
 * @property {string} type - 'FS_OP_EXECUTED'
 * @property {Object} operation - The operation that was executed
 * @property {number} timestamp - Unix timestamp
 * @property {string} timeboxId - Timebox this operation belongs to
 * @property {Object} revertPlan - Plan to undo this operation
 */
export const FS_OP_EXECUTED = 'FS_OP_EXECUTED';

/**
 * FS_OP_REFUSED (Phase 2)
 * Operation failed or refused (explicit, not silent)
 * 
 * @typedef {Object} FSOpRefusedCommit
 * @property {string} type - 'FS_OP_REFUSED'
 * @property {Object} operation - The operation that was refused
 * @property {string} reason - Why it was refused
 * @property {number} timestamp - Unix timestamp
 * @property {string} timeboxId - Timebox this operation belongs to
 */
export const FS_OP_REFUSED = 'FS_OP_REFUSED';

/**
 * FS_TIMEBOX_REVERTED (Phase 2)
 * Undo batch executed
 * 
 * @typedef {Object} FSTimeboxRevertedCommit
 * @property {string} type - 'FS_TIMEBOX_REVERTED'
 * @property {string} timeboxId - Timebox being reverted
 * @property {string} reversePlanId - ID of reverse plan
 * @property {number} timestamp - Unix timestamp
 */
export const FS_TIMEBOX_REVERTED = 'FS_TIMEBOX_REVERTED';

/**
 * Validate commit type
 * @param {Object} commit - Commit to validate
 * @returns {boolean} True if valid
 */
export function isValidFileSystemCommit(commit) {
    const validTypes = [
        FS_SCOPE_SET,
        FS_OBSERVED_EVENT,
        FS_PLAN_PROPOSED,
        FS_PLAN_APPROVED,
        FS_OP_EXECUTED,
        FS_OP_REFUSED,
        FS_TIMEBOX_REVERTED
    ];
    
    if (!commit || typeof commit !== 'object') return false;
    if (!validTypes.includes(commit.type)) return false;
    if (typeof commit.timestamp !== 'number') return false;
    
    // Type-specific validation
    switch (commit.type) {
        case FS_SCOPE_SET:
            return Array.isArray(commit.approvedFolders) && 
                   typeof commit.user === 'string';
        
        case FS_OBSERVED_EVENT:
            return ['create', 'move', 'rename', 'delete'].includes(commit.eventType) &&
                   typeof commit.path === 'string' &&
                   typeof commit.scope === 'string';
        
        case FS_PLAN_PROPOSED:
            return typeof commit.planId === 'string' &&
                   Array.isArray(commit.timeboxes) &&
                   typeof commit.reversible === 'boolean';
        
        case FS_PLAN_APPROVED:
            return typeof commit.planId === 'string' &&
                   Array.isArray(commit.timeboxIds) &&
                   typeof commit.user === 'string';
        
        case FS_OP_EXECUTED:
            return commit.operation && typeof commit.operation === 'object' &&
                   typeof commit.timeboxId === 'string' &&
                   commit.revertPlan && typeof commit.revertPlan === 'object';
        
        case FS_OP_REFUSED:
            return commit.operation && typeof commit.operation === 'object' &&
                   typeof commit.reason === 'string' &&
                   typeof commit.timeboxId === 'string';
        
        case FS_TIMEBOX_REVERTED:
            return typeof commit.timeboxId === 'string' &&
                   typeof commit.reversePlanId === 'string';
        
        default:
            return false;
    }
}
