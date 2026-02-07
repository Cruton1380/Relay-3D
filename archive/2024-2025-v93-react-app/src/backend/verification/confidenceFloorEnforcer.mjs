/**
 * Confidence Floor Enforcer
 * 
 * INVARIANT 2 (LOCKED):
 * "Any ERI score below a minimum confidence must be displayed as 
 * 'indeterminate,' not safe."
 * 
 * This enforcer ensures the system NEVER falsely reassures users.
 * When data is insufficient, we say "indeterminate", not "safe".
 */

export class ConfidenceFloorEnforcer {
  constructor(policy = {}) {
    this.policy = {
      confidence_floor: policy.confidence_floor || 0.7, // 70% minimum
      verified_threshold: policy.verified_threshold || 0.9, // 90% for verified
      degraded_threshold: policy.degraded_threshold || 0.5, // 50% for degraded
      
      display_rules: {
        verified: 'show_score',
        degraded: 'show_with_warning',
        blind: 'show_indeterminate'
      }
    };
  }

  /**
   * Calculate displayable ERI (enforces confidence floor)
   * Returns { score, display, confidence, message, missing_inputs }
   */
  calculateDisplayableERI(raw_eri) {
    const confidence = raw_eri.confidence;
    
    // CRITICAL: Never show definitive score below confidence floor
    if (confidence < this.policy.confidence_floor) {
      return {
        score: null, // No score shown
        display: 'indeterminate',
        message: 'Insufficient data to assess risk',
        confidence,
        missing_inputs: raw_eri.missing_inputs,
        action_required: 'collect_telemetry',
        
        // Honest about uncertainty
        severity: 'warning',
        reason: `Only ${Math.round(confidence * 100)}% of required data available`
      };
    }
    
    // Above floor, but still degraded
    if (confidence < this.policy.verified_threshold) {
      return {
        score: raw_eri.score,
        display: this.scoreToDisplay(raw_eri.score),
        message: `Risk assessment based on ${Math.round(confidence * 100)}% of data (degraded)`,
        confidence,
        missing_inputs: raw_eri.missing_inputs,
        action_required: 'improve_coverage',
        
        // Show score, but flag uncertainty
        severity: 'info',
        caveat: 'Partial data - assessment may change as coverage improves'
      };
    }
    
    // High confidence - show score with confidence
    return {
      score: raw_eri.score,
      display: this.scoreToDisplay(raw_eri.score),
      message: `Risk assessment verified (${Math.round(confidence * 100)}% confidence)`,
      confidence,
      missing_inputs: [],
      
      // High confidence in score
      severity: this.scoreToSeverity(raw_eri.score),
      verified: true
    };
  }

  /**
   * Convert score to display state
   */
  scoreToDisplay(score) {
    if (score < 0.3) return 'safe';
    if (score < 0.6) return 'warning';
    return 'critical';
  }

  /**
   * Convert score to severity
   */
  scoreToSeverity(score) {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    return 'high';
  }

  /**
   * Determine visibility state from confidence
   */
  determineVisibility(confidence) {
    if (confidence >= this.policy.verified_threshold) return 'verified';
    if (confidence >= this.policy.degraded_threshold) return 'degraded';
    return 'blind';
  }
}

export default ConfidenceFloorEnforcer;
