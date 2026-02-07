/**
 * POLICY VALIDATION ENGINE
 * 
 * Validates posting classification against assignment filaments.
 * 
 * Policy rules:
 * - Cost center must be assigned to the specified department
 * - Account must be allowed for the specified department
 * - Effective dates must be valid
 * 
 * Returns:
 * - { valid: true } if policy allows
 * - { valid: false, reason: '...' } if policy blocks
 */

/**
 * Validate posting classification against policy
 * 
 * @param {Object} classification - { costCenter, department, legalEntity, account }
 * @param {Object} assignmentFilament - assign.costCenterToDept filament
 * @param {Date} postingDate - Date of posting (for temporal validation)
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validatePostingPolicy(
  classification,
  assignmentFilament,
  postingDate = new Date()
) {
  console.log('[PolicyEngine] Validating:', {
    classification,
    assignmentFilament,
    postingDate,
  });

  // Check if assignment filament exists
  if (!assignmentFilament || !assignmentFilament.commits || assignmentFilament.commits.length === 0) {
    return {
      valid: false,
      reason: `No assignment found for cost center ${classification.costCenter} to department ${classification.department}`,
    };
  }

  // Get latest assignment commit
  const latestCommit = assignmentFilament.commits[assignmentFilament.commits.length - 1];
  
  console.log('[PolicyEngine] Latest assignment commit:', latestCommit);

  // Check if assignment is valid
  if (latestCommit.op === 'ASSIGN_CREATED' || latestCommit.op === 'ASSIGN_UPDATED') {
    const payload = latestCommit.payload;
    
    // Check if assignment matches
    if (
      payload.costCenterId === classification.costCenter &&
      payload.departmentId === classification.department
    ) {
      // Check effective dates
      const effectiveFrom = payload.effectiveFrom ? new Date(payload.effectiveFrom) : null;
      const effectiveTo = payload.effectiveTo ? new Date(payload.effectiveTo) : null;
      
      if (effectiveFrom && postingDate < effectiveFrom) {
        return {
          valid: false,
          reason: `Assignment not yet effective (effective from ${payload.effectiveFrom})`,
        };
      }
      
      if (effectiveTo && postingDate > effectiveTo) {
        return {
          valid: false,
          reason: `Assignment expired (effective until ${payload.effectiveTo})`,
        };
      }
      
      // Policy allows
      return { valid: true };
    } else {
      return {
        valid: false,
        reason: `Cost center ${classification.costCenter} is not assigned to department ${classification.department}`,
      };
    }
  }
  
  // If latest commit is ASSIGN_UNASSIGNED, policy blocks
  if (latestCommit.op === 'ASSIGN_UNASSIGNED') {
    return {
      valid: false,
      reason: `Assignment terminated for cost center ${classification.costCenter}`,
    };
  }
  
  // Unknown state
  return {
    valid: false,
    reason: 'Unknown assignment state',
  };
}

/**
 * Check if classification has been overridden (GATE approval)
 * 
 * @param {Object} classificationFilament - classification.<postingId> filament
 * @returns {boolean} - true if override exists
 */
export function hasClassificationOverride(classificationFilament) {
  if (!classificationFilament || !classificationFilament.commits) {
    return false;
  }
  
  return classificationFilament.commits.some(
    c => c.op === 'CLASSIFICATION_POLICY_EXCEPTION'
  );
}

/**
 * Get policy validation summary
 * 
 * @param {Object} classificationFilament - classification filament
 * @param {Object} assignmentFilament - assignment filament
 * @returns {Object} - { canPost: boolean, state: string, reason?: string, isOverridden: boolean }
 */
export function getPolicyValidationSummary(
  classificationFilament,
  assignmentFilament
) {
  if (!classificationFilament || !classificationFilament.commits || classificationFilament.commits.length === 0) {
    return {
      canPost: false,
      state: 'NO_CLASSIFICATION',
      reason: 'No classification declared',
      isOverridden: false,
    };
  }
  
  // Check if there's an override
  const isOverridden = hasClassificationOverride(classificationFilament);
  
  if (isOverridden) {
    return {
      canPost: true,
      state: 'PASS',
      isOverridden: true,
    };
  }
  
  // Get latest classification commit
  const latestCommit = classificationFilament.commits[classificationFilament.commits.length - 1];
  
  if (latestCommit.op !== 'CLASSIFICATION_DECLARED') {
    return {
      canPost: false,
      state: 'UNKNOWN',
      reason: 'Unknown classification state',
      isOverridden: false,
    };
  }
  
  // Validate policy
  const validation = validatePostingPolicy(
    latestCommit.payload,
    assignmentFilament
  );
  
  if (validation.valid) {
    return {
      canPost: true,
      state: 'PASS',
      isOverridden: false,
    };
  } else {
    return {
      canPost: false,
      state: 'POLICY_BLOCK',
      reason: validation.reason,
      isOverridden: false,
    };
  }
}
