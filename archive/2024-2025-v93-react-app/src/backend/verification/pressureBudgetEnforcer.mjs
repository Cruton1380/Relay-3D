/**
 * Pressure Budget Enforcer
 * 
 * INVARIANT 1 (LOCKED):
 * "Pressure frequency and depth are policy-bound and capacity-aware.
 * Excess pressure produces refusal, not overload."
 * 
 * This enforcer ensures the system NEVER overloads itself through
 * excessive verification. It produces REFUSAL states, not crashes.
 */

export class PressureBudgetEnforcer {
  constructor(budget = {}) {
    this.budget = {
      // Global limits (system-wide)
      global: {
        max_verifications_per_second: budget.max_verifications_per_second || 1000000,
        max_cpu_percent: budget.max_cpu_percent || 10, // 10% CPU max
        max_memory_bytes: budget.max_memory_bytes || 500 * 1024 * 1024, // 500MB
        max_network_bytes_per_second: budget.max_network_bytes_per_second || 1 * 1024 * 1024 // 1 Mbps
      },
      
      // Per-anchor limits (individual device/filament)
      per_anchor: {
        max_audits_per_hour: budget.max_audits_per_hour || 100,
        max_audits_per_day: budget.max_audits_per_day || 1000,
        cooldown_seconds: budget.cooldown_seconds || 300, // 5 min
        backoff_on_refusal: budget.backoff_on_refusal !== false
      },
      
      // Per-operator limits (individual user)
      per_operator: {
        max_repair_proposals_per_hour: budget.max_repair_proposals_per_hour || 50,
        max_simultaneous_operations: budget.max_simultaneous_operations || 10,
        rate_limit_window_seconds: budget.rate_limit_window_seconds || 3600
      },
      
      // Adaptive scaling
      adaptive: {
        scale_up_threshold: budget.scale_up_threshold || 0.5, // CPU < 50% → increase
        scale_down_threshold: budget.scale_down_threshold || 0.9, // CPU > 90% → decrease
        adjustment_factor: budget.adjustment_factor || 0.1, // 10% change
        adjustment_interval_seconds: budget.adjustment_interval_seconds || 60
      }
    };
    
    this.current_usage = {
      verifications_this_second: 0,
      cpu_percent: 0,
      memory_bytes: 0,
      network_bytes_this_second: 0,
      last_reset: Date.now()
    };
    
    this.per_anchor_usage = new Map(); // anchor_id -> usage stats
    this.per_operator_usage = new Map(); // operator_id -> usage stats
    
    // Reset counters every second
    setInterval(() => this.resetPerSecondCounters(), 1000);
  }

  /**
   * Check if pressure can be applied
   * Returns { allowed: boolean, reason?: string, backoff_time?: number }
   */
  canApplyPressure(anchor_id = null, operator_id = null) {
    // 1. Check global budget
    if (this.current_usage.verifications_this_second >= this.budget.global.max_verifications_per_second) {
      return {
        allowed: false,
        reason: 'global_verification_limit',
        backoff_time: 1000 // Try again in 1 second
      };
    }
    
    if (this.current_usage.cpu_percent >= this.budget.global.max_cpu_percent) {
      return {
        allowed: false,
        reason: 'global_cpu_limit',
        backoff_time: 5000 // Back off for 5 seconds
      };
    }
    
    if (this.current_usage.memory_bytes >= this.budget.global.max_memory_bytes) {
      return {
        allowed: false,
        reason: 'global_memory_limit',
        backoff_time: 10000 // Back off for 10 seconds
      };
    }
    
    // 2. Check per-anchor budget (if anchor_id provided)
    if (anchor_id) {
      const anchor_usage = this.getAnchorUsage(anchor_id);
      
      if (anchor_usage.audits_this_hour >= this.budget.per_anchor.max_audits_per_hour) {
        return {
          allowed: false,
          reason: 'per_anchor_rate_limit',
          backoff_time: 3600000 // 1 hour
        };
      }
      
      const time_since_last = Date.now() - anchor_usage.last_audit;
      if (time_since_last < this.budget.per_anchor.cooldown_seconds * 1000) {
        return {
          allowed: false,
          reason: 'per_anchor_cooldown',
          backoff_time: (this.budget.per_anchor.cooldown_seconds * 1000) - time_since_last
        };
      }
    }
    
    // 3. Check per-operator budget (if operator_id provided)
    if (operator_id) {
      const operator_usage = this.getOperatorUsage(operator_id);
      
      if (operator_usage.operations_this_hour >= this.budget.per_operator.max_repair_proposals_per_hour) {
        return {
          allowed: false,
          reason: 'per_operator_rate_limit',
          backoff_time: 3600000
        };
      }
      
      if (operator_usage.simultaneous_operations >= this.budget.per_operator.max_simultaneous_operations) {
        return {
          allowed: false,
          reason: 'per_operator_concurrency_limit',
          backoff_time: 5000
        };
      }
    }
    
    // All checks passed
    return { allowed: true };
  }

  /**
   * Record that pressure was applied
   */
  recordPressureApplied(anchor_id = null, operator_id = null, cost = 1) {
    // Update global usage
    this.current_usage.verifications_this_second += cost;
    
    // Update per-anchor usage
    if (anchor_id) {
      const anchor_usage = this.getAnchorUsage(anchor_id);
      anchor_usage.audits_this_hour += 1;
      anchor_usage.last_audit = Date.now();
      this.per_anchor_usage.set(anchor_id, anchor_usage);
    }
    
    // Update per-operator usage
    if (operator_id) {
      const operator_usage = this.getOperatorUsage(operator_id);
      operator_usage.operations_this_hour += 1;
      operator_usage.simultaneous_operations += 1;
      this.per_operator_usage.set(operator_id, operator_usage);
    }
  }

  /**
   * Produce refusal (first-class event, not error)
   */
  produceRefusal(anchor_id, reason) {
    return {
      type: 'pressure_refusal',
      anchor_id,
      reason,
      timestamp: Date.now(),
      retry_after: this.calculateBackoff(reason),
      
      // Refusal is NOT failure - it's honest capacity signaling
      severity: 'info',
      action_required: 'respect_backoff'
    };
  }

  /**
   * Calculate backoff time based on reason
   */
  calculateBackoff(reason) {
    const backoffTable = {
      'global_verification_limit': 1000,
      'global_cpu_limit': 5000,
      'global_memory_limit': 10000,
      'per_anchor_rate_limit': 3600000,
      'per_anchor_cooldown': 300000,
      'per_operator_rate_limit': 3600000,
      'per_operator_concurrency_limit': 5000
    };
    
    return backoffTable[reason] || 5000;
  }

  /**
   * Get anchor usage stats
   */
  getAnchorUsage(anchor_id) {
    if (!this.per_anchor_usage.has(anchor_id)) {
      this.per_anchor_usage.set(anchor_id, {
        audits_this_hour: 0,
        audits_this_day: 0,
        last_audit: 0,
        total_audits: 0
      });
    }
    return this.per_anchor_usage.get(anchor_id);
  }

  /**
   * Get operator usage stats
   */
  getOperatorUsage(operator_id) {
    if (!this.per_operator_usage.has(operator_id)) {
      this.per_operator_usage.set(operator_id, {
        operations_this_hour: 0,
        simultaneous_operations: 0,
        total_operations: 0
      });
    }
    return this.per_operator_usage.get(operator_id);
  }

  /**
   * Reset per-second counters
   */
  resetPerSecondCounters() {
    const now = Date.now();
    const elapsed = now - this.current_usage.last_reset;
    
    if (elapsed >= 1000) {
      this.current_usage.verifications_this_second = 0;
      this.current_usage.network_bytes_this_second = 0;
      this.current_usage.last_reset = now;
    }
  }

  /**
   * Update current resource usage (called by monitoring system)
   */
  updateResourceUsage(cpu_percent, memory_bytes) {
    this.current_usage.cpu_percent = cpu_percent;
    this.current_usage.memory_bytes = memory_bytes;
  }

  /**
   * Get current budget status
   */
  getStatus() {
    return {
      budget: this.budget,
      current_usage: this.current_usage,
      anchor_count: this.per_anchor_usage.size,
      operator_count: this.per_operator_usage.size
    };
  }
}

export default PressureBudgetEnforcer;
