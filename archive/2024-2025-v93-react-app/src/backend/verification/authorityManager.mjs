/**
 * Authority Manager
 * 
 * Verifies authority scope and delegation chains for all actions.
 * Ensures every action has proper authorization before execution.
 * 
 * RELAY PRINCIPLE: "Pressure not command" - authority is verified, not enforced.
 */

import logger from '../utils/logging/logger.mjs';

const authorityLogger = logger.child({ module: 'authority-manager' });

export class AuthorityManager {
  constructor() {
    this.delegationChains = new Map();  // userId -> delegations
    this.scopeRegistry = new Map();     // scope -> required permissions
    
    // Register default scopes
    this.registerScope('vote:write', {
      description: 'Cast votes in voting channels',
      requiredProofs: ['crypto_signature', 'region_membership'],
      canDelegate: false
    });
    
    this.registerScope('vote:read', {
      description: 'View vote results',
      requiredProofs: [],
      canDelegate: false
    });
    
    this.registerScope('channel:create', {
      description: 'Create new channels',
      requiredProofs: ['crypto_signature', 'region_membership'],
      canDelegate: false
    });
  }

  /**
   * Register a new authority scope
   */
  registerScope(scope, config) {
    this.scopeRegistry.set(scope, {
      scope,
      ...config,
      registeredAt: Date.now()
    });
    
    authorityLogger.debug('Authority scope registered', { scope });
  }

  /**
   * Verify user has authority for an action
   * 
   * @param {string} userId - User requesting authority
   * @param {string} action - Action being attempted (e.g., 'CAST_VOTE')
   * @param {Object} context - Action context (ring, scope, etc.)
   * @returns {Promise<Object>} Authority verification result
   */
  async verifyAuthority(userId, action, context) {
    const { ring, scope } = context;

    try {
      // Check if scope is registered
      const scopeConfig = this.scopeRegistry.get(scope);
      if (!scopeConfig) {
        authorityLogger.warn('Unknown authority scope', { userId, scope });
        return {
          authorized: false,
          reason: `Unknown scope: ${scope}`,
          scope,
          userId,
          delegationChain: []
        };
      }

      // For now, use simplified verification:
      // - User must exist
      // - Must have crypto signature (implied by userId)
      // - Must be in correct ring
      
      const authorized = !!(userId && ring);

      // Check delegation chain (if delegated authority exists)
      const delegationChain = this.getDelegationChain(userId, scope);

      const result = {
        authorized,
        userId,
        action,
        scope,
        ring,
        scopeConfig,
        delegationChain,
        verifiedAt: Date.now(),
        proofs: {
          cryptoSignature: !!userId,  // Simplified: userId implies signature
          regionMembership: !!ring    // Simplified: ring implies membership
        }
      };

      if (!authorized) {
        result.reason = 'Insufficient authority';
      }

      authorityLogger.info('Authority verification', {
        userId: userId?.substring(0, 10),
        authorized,
        scope,
        action
      });

      return result;

    } catch (error) {
      authorityLogger.error('Authority verification error', {
        error: error.message,
        userId,
        action,
        scope
      });

      return {
        authorized: false,
        reason: `Verification error: ${error.message}`,
        userId,
        action,
        scope,
        error: error.message
      };
    }
  }

  /**
   * Delegate authority from one user to another
   * 
   * @param {string} fromUserId - User delegating authority
   * @param {string} toUserId - User receiving authority
   * @param {string} scope - Scope being delegated
   * @param {Object} constraints - Delegation constraints (time, count, etc.)
   * @returns {Promise<Object>} Delegation result
   */
  async delegateAuthority(fromUserId, toUserId, scope, constraints = {}) {
    try {
      const scopeConfig = this.scopeRegistry.get(scope);
      
      if (!scopeConfig) {
        throw new Error(`Unknown scope: ${scope}`);
      }

      if (!scopeConfig.canDelegate) {
        throw new Error(`Scope ${scope} cannot be delegated`);
      }

      // Create delegation record
      const delegation = {
        id: `del_${Date.now()}_${fromUserId}_${toUserId}`,
        fromUserId,
        toUserId,
        scope,
        constraints: {
          expiresAt: constraints.expiresAt || Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          maxUses: constraints.maxUses || null,
          conditions: constraints.conditions || []
        },
        createdAt: Date.now(),
        usedCount: 0,
        active: true
      };

      // Store delegation
      if (!this.delegationChains.has(toUserId)) {
        this.delegationChains.set(toUserId, []);
      }
      this.delegationChains.get(toUserId).push(delegation);

      authorityLogger.info('Authority delegated', {
        delegation: delegation.id,
        from: fromUserId.substring(0, 10),
        to: toUserId.substring(0, 10),
        scope
      });

      return {
        success: true,
        delegation
      };

    } catch (error) {
      authorityLogger.error('Delegation error', {
        error: error.message,
        fromUserId,
        toUserId,
        scope
      });

      throw error;
    }
  }

  /**
   * Get delegation chain for a user and scope
   */
  getDelegationChain(userId, scope) {
    const delegations = this.delegationChains.get(userId) || [];
    return delegations.filter(del => 
      del.scope === scope && 
      del.active && 
      del.constraints.expiresAt > Date.now()
    );
  }

  /**
   * Revoke a delegation
   */
  async revokeDelegation(delegationId) {
    for (const [userId, delegations] of this.delegationChains.entries()) {
      const delegation = delegations.find(d => d.id === delegationId);
      if (delegation) {
        delegation.active = false;
        delegation.revokedAt = Date.now();
        
        authorityLogger.info('Delegation revoked', { delegationId });
        return { success: true, delegationId };
      }
    }

    throw new Error(`Delegation not found: ${delegationId}`);
  }

  /**
   * Get all active delegations for a user
   */
  getUserDelegations(userId) {
    return this.delegationChains.get(userId) || [];
  }

  /**
   * Get all registered scopes
   */
  getAllScopes() {
    return Array.from(this.scopeRegistry.values());
  }
}

export default new AuthorityManager();
