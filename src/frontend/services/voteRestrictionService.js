/**
 * @fileoverview Vote Restriction Service
 * Modernized vote restriction and eligibility system for Base Model 1
 * Integrates legacy vote restriction logic as clean, modular services
 */
import { apiPost } from './apiClient';

class VoteRestrictionService {
  constructor() {
    this.isInitialized = false;
    this.voteRestrictions = new Map(); // userId -> restrictions
    this.eligibilityCache = new Map(); // cacheKey -> eligibility result
    this.rateLimits = new Map(); // userId -> last vote timestamp
  }

  /**
   * Initialize vote restriction service
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load user vote restrictions if authenticated
      const userId = this.getCurrentUserId();
      if (userId) {
        await this.loadUserVoteRestrictions(userId);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize vote restriction service:', error);
      throw error;
    }
  }

  /**
   * Check if user can vote on a specific topic/candidate
   */
  async checkVoteEligibility(topicId, candidateId = null, channelId = null) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return {
          eligible: false,
          reason: 'Authentication required',
          restrictions: ['authentication']
        };
      }

      // Check cache first
      const cacheKey = `${userId}-${topicId}-${candidateId}-${channelId}`;
      if (this.eligibilityCache.has(cacheKey)) {
        return this.eligibilityCache.get(cacheKey);
      }

      const response = await apiPost('/api/votes/check-eligibility', {
        userId: userId,
        topicId: topicId,
        candidateId: candidateId,
        channelId: channelId
      });

      const eligibility = {
        eligible: response.eligible || false,
        reason: response.reason || '',
        restrictions: response.restrictions || [],
        requirements: response.requirements || [],
        voteTokens: response.voteTokens || 0,
        rateLimit: response.rateLimit || null
      };

      // Cache result for 5 minutes
      this.eligibilityCache.set(cacheKey, eligibility);
      setTimeout(() => this.eligibilityCache.delete(cacheKey), 5 * 60 * 1000);

      return eligibility;
    } catch (error) {
      console.error('Vote eligibility check failed:', error);
      return {
        eligible: false,
        reason: 'Failed to check eligibility',
        restrictions: ['system_error']
      };
    }
  }

  /**
   * Check proximity-based voting restrictions
   */
  async checkProximityVoteRestrictions(channelId, userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        return {
          canVote: false,
          reason: 'Authentication required',
          accessType: 'none'
        };
      }

      const response = await apiPost('/api/votes/proximity-restrictions', {
        userId: currentUserId,
        channelId: channelId
      });

      return {
        canVote: response.canVote || false,
        reason: response.reason || '',
        accessType: response.accessType || 'none',
        proximityData: response.proximityData || null,
        restrictions: response.restrictions || []
      };
    } catch (error) {
      console.error('Proximity vote restriction check failed:', error);
      return {
        canVote: false,
        reason: 'Failed to check proximity restrictions',
        accessType: 'error'
      };
    }
  }

  /**
   * Validate voting action before submission
   */
  async validateVotingAction(topicId, candidateId, voteType, channelId = null) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return {
          isValid: false,
          error: 'Authentication required'
        };
      }

      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return {
          isValid: false,
          error: rateLimitCheck.reason,
          retryAfter: rateLimitCheck.retryAfter
        };
      }

      // Check eligibility
      const eligibility = await this.checkVoteEligibility(topicId, candidateId, channelId);
      if (!eligibility.eligible) {
        return {
          isValid: false,
          error: eligibility.reason,
          restrictions: eligibility.restrictions
        };
      }

      // Check proximity restrictions if channel is specified
      if (channelId) {
        const proximityCheck = await this.checkProximityVoteRestrictions(channelId, userId);
        if (!proximityCheck.canVote) {
          return {
            isValid: false,
            error: proximityCheck.reason,
            accessType: proximityCheck.accessType
          };
        }
      }

      return {
        isValid: true,
        voteTokens: eligibility.voteTokens,
        restrictions: eligibility.restrictions
      };
    } catch (error) {
      console.error('Voting action validation failed:', error);
      return {
        isValid: false,
        error: 'Failed to validate voting action'
      };
    }
  }

  /**
   * Get user's voting restrictions summary
   */
  async getUserVoteRestrictions(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        return {
          canVote: false,
          reason: 'Authentication required',
          restrictions: ['authentication']
        };
      }

      const response = await apiPost('/api/votes/user-restrictions', {
        userId: currentUserId
      });

      return {
        canVote: response.canVote || false,
        reason: response.reason || '',
        restrictions: response.restrictions || [],
        voteTokens: response.voteTokens || 0,
        trustScore: response.trustScore || 0,
        accountAge: response.accountAge || 0,
        totalVotes: response.totalVotes || 0
      };
    } catch (error) {
      console.error('Failed to get user vote restrictions:', error);
      return {
        canVote: false,
        reason: 'Failed to load restrictions',
        restrictions: ['system_error']
      };
    }
  }

  /**
   * Check if user has sufficient vote tokens
   */
  async checkVoteTokens(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        return {
          hasTokens: false,
          tokens: 0,
          reason: 'Authentication required'
        };
      }

      const response = await apiPost('/api/votes/check-tokens', {
        userId: currentUserId
      });

      return {
        hasTokens: response.hasTokens || false,
        tokens: response.tokens || 0,
        requiredTokens: response.requiredTokens || 1,
        reason: response.reason || ''
      };
    } catch (error) {
      console.error('Vote token check failed:', error);
      return {
        hasTokens: false,
        tokens: 0,
        reason: 'Failed to check tokens'
      };
    }
  }

  /**
   * Get voting requirements for a specific topic/channel
   */
  async getVotingRequirements(topicId, channelId = null) {
    try {
      const response = await apiPost('/api/votes/requirements', {
        topicId: topicId,
        channelId: channelId
      });

      return {
        requirements: response.requirements || [],
        minimumTokens: response.minimumTokens || 1,
        minimumTrustScore: response.minimumTrustScore || 0,
        minimumAccountAge: response.minimumAccountAge || 0,
        proximityRequired: response.proximityRequired || false,
        authenticationRequired: response.authenticationRequired || true
      };
    } catch (error) {
      console.error('Failed to get voting requirements:', error);
      return {
        requirements: [],
        minimumTokens: 1,
        minimumTrustScore: 0,
        minimumAccountAge: 0,
        proximityRequired: false,
        authenticationRequired: true
      };
    }
  }

  /**
   * Check rate limiting for user
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const lastVote = this.rateLimits.get(userId) || 0;
    const rateLimitMs = 1000; // 1 second between votes

    if (now - lastVote < rateLimitMs) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: rateLimitMs - (now - lastVote)
      };
    }

    return {
      allowed: true,
      retryAfter: 0
    };
  }

  /**
   * Record vote for rate limiting
   */
  recordVote(userId) {
    this.rateLimits.set(userId, Date.now());
  }

  /**
   * Check if user meets trust requirements
   */
  async checkTrustRequirements(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        return {
          meetsRequirements: false,
          trustScore: 0,
          reason: 'Authentication required'
        };
      }

      const response = await apiPost('/api/votes/check-trust', {
        userId: currentUserId
      });

      return {
        meetsRequirements: response.meetsRequirements || false,
        trustScore: response.trustScore || 0,
        minimumRequired: response.minimumRequired || 0,
        reason: response.reason || ''
      };
    } catch (error) {
      console.error('Trust requirement check failed:', error);
      return {
        meetsRequirements: false,
        trustScore: 0,
        reason: 'Failed to check trust requirements'
      };
    }
  }

  /**
   * Check account age requirements
   */
  async checkAccountAgeRequirements(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        return {
          meetsRequirements: false,
          accountAge: 0,
          reason: 'Authentication required'
        };
      }

      const response = await apiPost('/api/votes/check-account-age', {
        userId: currentUserId
      });

      return {
        meetsRequirements: response.meetsRequirements || false,
        accountAge: response.accountAge || 0,
        minimumRequired: response.minimumRequired || 0,
        reason: response.reason || ''
      };
    } catch (error) {
      console.error('Account age requirement check failed:', error);
      return {
        meetsRequirements: false,
        accountAge: 0,
        reason: 'Failed to check account age'
      };
    }
  }

  /**
   * Get comprehensive voting status for user
   */
  async getVotingStatus(userId = null) {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        return {
          canVote: false,
          reason: 'Authentication required',
          status: 'unauthenticated'
        };
      }

      const [restrictions, tokens, trust, accountAge] = await Promise.all([
        this.getUserVoteRestrictions(currentUserId),
        this.checkVoteTokens(currentUserId),
        this.checkTrustRequirements(currentUserId),
        this.checkAccountAgeRequirements(currentUserId)
      ]);

      const canVote = restrictions.canVote && 
                     tokens.hasTokens && 
                     trust.meetsRequirements && 
                     accountAge.meetsRequirements;

      return {
        canVote: canVote,
        reason: canVote ? 'All requirements met' : this.getFirstFailureReason([
          restrictions, tokens, trust, accountAge
        ]),
        status: canVote ? 'eligible' : 'restricted',
        details: {
          restrictions: restrictions,
          tokens: tokens,
          trust: trust,
          accountAge: accountAge
        }
      };
    } catch (error) {
      console.error('Failed to get voting status:', error);
      return {
        canVote: false,
        reason: 'Failed to check voting status',
        status: 'error'
      };
    }
  }

  /**
   * Get first failure reason from multiple checks
   */
  getFirstFailureReason(checks) {
    for (const check of checks) {
      if (!check.canVote || !check.hasTokens || !check.meetsRequirements) {
        return check.reason;
      }
    }
    return 'Unknown restriction';
  }

  /**
   * Load user vote restrictions from backend
   */
  async loadUserVoteRestrictions(userId) {
    try {
      const restrictions = await this.getUserVoteRestrictions(userId);
      this.voteRestrictions.set(userId, restrictions);
    } catch (error) {
      console.warn('Failed to load user vote restrictions:', error);
    }
  }

  /**
   * Get current user ID from auth context
   */
  getCurrentUserId() {
    // This should be integrated with your auth system
    // For now, return a demo user ID
    return 'demo-user-1';
  }

  /**
   * Clear eligibility cache
   */
  clearCache() {
    this.eligibilityCache.clear();
  }

  /**
   * Clear rate limits
   */
  clearRateLimits() {
    this.rateLimits.clear();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.voteRestrictions.clear();
    this.eligibilityCache.clear();
    this.rateLimits.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
const voteRestrictionService = new VoteRestrictionService();
export default voteRestrictionService; 