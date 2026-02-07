// backend/utils/stateCalculator.mjs
/**
 * State Calculator - Indeterminate Everywhere (Principle 6)
 * 
 * Constitutional Rule:
 * "For unknown tech, Relay enforces: intent/reality/projection separation,
 * confidence floors, indeterminate states."
 * 
 * All derived values must carry:
 * - value: the calculated result
 * - confidence: 0.0-1.0
 * - state: VERIFIED | DEGRADED | INDETERMINATE
 * - missing_inputs: [string] - what data is absent
 * - method: how was this calculated
 * - policy_ref: what rules govern this
 */

// State determination thresholds
const VERIFIED_THRESHOLD = 0.8;   // confidence >= 0.8
const DEGRADED_THRESHOLD = 0.5;   // confidence >= 0.5

/**
 * Determine the state based on confidence and data quality
 * @param {Object} params - { confidence, missing_inputs, conflicts }
 * @returns {string} - VERIFIED | DEGRADED | INDETERMINATE
 */
export function determineState({ confidence, missing_inputs = [], conflicts = false }) {
  // If we have conflicts, always INDETERMINATE
  if (conflicts) {
    return 'INDETERMINATE';
  }
  
  // If confidence is high and no missing inputs
  if (confidence >= VERIFIED_THRESHOLD && missing_inputs.length === 0) {
    return 'VERIFIED';
  }
  
  // If confidence is moderate
  if (confidence >= DEGRADED_THRESHOLD) {
    return 'DEGRADED';
  }
  
  // Low confidence or significant missing data
  return 'INDETERMINATE';
}

/**
 * Create a state-aware value wrapper
 * @param {Object} params - Calculation parameters
 * @returns {Object} - State-aware value
 */
export function createStateAwareValue({
  value,
  confidence,
  missing_inputs = [],
  insufficient_data = false,
  conflicting_evidence = false,
  method,
  policy_ref,
  computed_at = Date.now()
}) {
  const state = determineState({
    confidence,
    missing_inputs,
    conflicts: conflicting_evidence
  });
  
  return {
    value,
    confidence: Math.round(confidence * 100) / 100,  // Round to 2 decimals
    state,
    missing_inputs,
    insufficient_data,
    conflicting_evidence,
    method,
    policy_ref,
    computed_at,
    human_readable: getHumanReadableState(state, confidence, missing_inputs)
  };
}

/**
 * Calculate confidence based on data quality
 * @param {Object} params - Data quality metrics
 * @returns {number} - Confidence score 0.0-1.0
 */
export function calculateConfidence({
  total_inputs_required,
  inputs_present,
  data_freshness_hours = 0,
  source_reliability = 1.0,
  validation_passed = true
}) {
  // Base confidence from input completeness
  let confidence = inputs_present / total_inputs_required;
  
  // Penalty for stale data (reduces confidence over time)
  if (data_freshness_hours > 0) {
    const freshness_factor = Math.exp(-data_freshness_hours / 168); // 7-day half-life
    confidence *= (0.7 + 0.3 * freshness_factor);  // 70-100% depending on freshness
  }
  
  // Adjust for source reliability
  confidence *= source_reliability;
  
  // Penalty if validation failed
  if (!validation_passed) {
    confidence *= 0.5;
  }
  
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Check if confidence floor is violated
 * @param {number} confidence - Actual confidence
 * @param {number} required_confidence - Required threshold
 * @returns {Object} - { violated: boolean, gap: number }
 */
export function checkConfidenceFloor(confidence, required_confidence) {
  const violated = confidence < required_confidence;
  const gap = required_confidence - confidence;
  
  return {
    violated,
    gap: Math.max(0, gap),
    message: violated 
      ? `Confidence ${confidence.toFixed(2)} below required ${required_confidence.toFixed(2)}`
      : 'Confidence threshold met'
  };
}

/**
 * Get human-readable state description
 * @param {string} state
 * @param {number} confidence
 * @param {Array<string>} missing_inputs
 * @returns {string}
 */
function getHumanReadableState(state, confidence, missing_inputs) {
  switch (state) {
    case 'VERIFIED':
      return `✓ Verified (${(confidence * 100).toFixed(0)}% confidence)`;
    case 'DEGRADED':
      return `⚠ Degraded (${(confidence * 100).toFixed(0)}% confidence, missing: ${missing_inputs.join(', ')})`;
    case 'INDETERMINATE':
      return `? Indeterminate (${(confidence * 100).toFixed(0)}% confidence, insufficient data)`;
    default:
      return `Unknown state`;
  }
}

/**
 * Create an INDETERMINATE value for insufficient data
 * @param {Object} params
 * @returns {Object}
 */
export function createIndeterminateValue({
  missing_inputs,
  reason,
  method,
  policy_ref
}) {
  return {
    value: null,
    confidence: 0.0,
    state: 'INDETERMINATE',
    missing_inputs,
    insufficient_data: true,
    conflicting_evidence: false,
    method,
    policy_ref,
    computed_at: Date.now(),
    human_readable: `? Indeterminate: ${reason}`,
    reason
  };
}

/**
 * Validate that a state-aware value can be used for action
 * @param {Object} stateAwareValue
 * @param {number} min_confidence - Minimum required confidence
 * @returns {Object} - { can_use: boolean, reason?: string }
 */
export function canUseForAction(stateAwareValue, min_confidence = VERIFIED_THRESHOLD) {
  if (stateAwareValue.state === 'INDETERMINATE') {
    return {
      can_use: false,
      reason: 'Cannot act on INDETERMINATE data',
      missing: stateAwareValue.missing_inputs
    };
  }
  
  if (stateAwareValue.confidence < min_confidence) {
    return {
      can_use: false,
      reason: `Confidence ${stateAwareValue.confidence} below required ${min_confidence}`,
      confidence_gap: min_confidence - stateAwareValue.confidence
    };
  }
  
  if (stateAwareValue.conflicting_evidence) {
    return {
      can_use: false,
      reason: 'Conflicting evidence detected, cannot proceed'
    };
  }
  
  return { can_use: true };
}

/**
 * Aggregate multiple state-aware values
 * Returns the "weakest link" (lowest confidence/state)
 * @param {Array<Object>} values - Array of state-aware values
 * @returns {Object} - Aggregated state-aware value
 */
export function aggregateStates(values) {
  if (values.length === 0) {
    return createIndeterminateValue({
      missing_inputs: ['all'],
      reason: 'No input values provided',
      method: 'aggregate',
      policy_ref: 'default'
    });
  }
  
  // Find weakest state
  const stateRank = { 'INDETERMINATE': 0, 'DEGRADED': 1, 'VERIFIED': 2 };
  let weakestState = 'VERIFIED';
  let lowestConfidence = 1.0;
  let allMissingInputs = new Set();
  
  for (const val of values) {
    if (stateRank[val.state] < stateRank[weakestState]) {
      weakestState = val.state;
    }
    lowestConfidence = Math.min(lowestConfidence, val.confidence);
    val.missing_inputs.forEach(input => allMissingInputs.add(input));
  }
  
  return {
    value: null,  // Aggregate doesn't have single value
    confidence: lowestConfidence,
    state: weakestState,
    missing_inputs: Array.from(allMissingInputs),
    method: 'aggregate',
    policy_ref: 'default',
    computed_at: Date.now(),
    human_readable: getHumanReadableState(weakestState, lowestConfidence, Array.from(allMissingInputs)),
    source_count: values.length
  };
}

/**
 * Test: Calculate KPI with missing data
 * @returns {Object}
 */
export function testKPIWithMissingData() {
  // Example: Policy compliance rate
  const result = createStateAwareValue({
    value: 0.75,  // 75% compliant
    confidence: 0.4,  // Low confidence due to missing data
    missing_inputs: ['purchase_request_documentation', 'competitive_quotes'],
    insufficient_data: true,
    method: 'policy_compliance_calculation',
    policy_ref: 'procurement_policy_v1'
  });
  
  const canUse = canUseForAction(result, VERIFIED_THRESHOLD);
  
  return {
    test: 'KPI calculation with missing data',
    result,
    can_use_for_action: canUse,
    expected_state: 'INDETERMINATE',
    actual_state: result.state,
    passed: result.state === 'INDETERMINATE' && !canUse.can_use
  };
}

export default {
  determineState,
  createStateAwareValue,
  calculateConfidence,
  checkConfidenceFloor,
  createIndeterminateValue,
  canUseForAction,
  aggregateStates,
  testKPIWithMissingData,
  VERIFIED_THRESHOLD,
  DEGRADED_THRESHOLD
};
