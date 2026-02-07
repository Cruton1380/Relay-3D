/**
 * AUTO-MATCH ENGINE
 * 
 * Core Principle: Match is NOT a query. It's a deterministic commit
 * generated whenever PO/Receipt/Invoice changes.
 * 
 * Trigger Rule:
 * - Whenever po.<id>, receipt.<id>, or invoice.<id> gets a new commit
 * - Auto-generate MATCH_EVALUATED commit on match.<poId>
 * 
 * No "auto mutation" - each evaluation is a discrete event.
 */

import { createMatchEvaluatedCommit, getLatestCommit, getPODataCommit } from '../schemas/commitSchemas';

/**
 * Auto-generate match evaluation commit
 * 
 * @param {object} poFilament - PO filament
 * @param {object} receiptFilament - Receipt filament (nullable)
 * @param {object} invoiceFilament - Invoice filament (nullable)
 * @returns {object} Match commit
 */
export function evaluateMatch(poFilament, receiptFilament, invoiceFilament) {
  const poSnapshot = getLatestCommit(poFilament);
  const receiptSnapshot = receiptFilament ? getLatestCommit(receiptFilament) : null;
  const invoiceSnapshot = invoiceFilament ? getLatestCommit(invoiceFilament) : null;
  
  if (!poSnapshot) {
    throw new Error('Cannot evaluate match without PO filament');
  }
  
  // For proof: matchFilamentId = match.<poId>
  const matchFilamentId = `match.${poSnapshot.commit.payload.poId}`;
  
  // Get next commit index for match filament (if it exists)
  const commitIndex = 0; // Will be incremented by caller
  
  return createMatchEvaluatedCommit(
    matchFilamentId,
    commitIndex,
    poSnapshot,
    receiptSnapshot,
    invoiceSnapshot
  );
}

/**
 * Check if match state allows ledger posting
 * 
 * @param {object} matchCommit - Latest match commit
 * @returns {boolean} Can post to ledger
 */
export function canPostToLedger(matchCommit) {
  if (!matchCommit || !matchCommit.payload) {
    return false;
  }
  
  const state = matchCommit.payload.state;
  
  // Only PASS or after OVERRIDE_APPROVED
  return state === 'PASS';
}

/**
 * Get match state summary for UI
 * 
 * @param {object} matchFilament - Match filament
 * @returns {object} Summary
 */
export function getMatchSummary(matchFilament) {
  if (!matchFilament || !matchFilament.commits || matchFilament.commits.length === 0) {
    return {
      state: 'PENDING',
      variances: [],
      canPost: false,
      isOverridden: false,
    };
  }
  
  const commits = matchFilament.commits;
  const latestEval = [...commits].reverse().find(c => c.op === 'MATCH_EVALUATED');
  const latestOverride = [...commits].reverse().find(c => c.op === 'MATCH_OVERRIDE_APPROVED');
  
  if (!latestEval) {
    return {
      state: 'PENDING',
      variances: [],
      canPost: false,
      isOverridden: false,
    };
  }
  
  const baseState = latestEval.payload.state;
  const variances = latestEval.payload.variances || [];
  
  // If override exists after eval, state changes to PASS
  const isOverridden = latestOverride && latestOverride.commitIndex > latestEval.commitIndex;
  const effectiveState = isOverridden ? 'PASS' : baseState;
  
  return {
    state: effectiveState,
    variances,
    canPost: effectiveState === 'PASS',
    isOverridden,
    latestEvalCommitIndex: latestEval.commitIndex,
    overrideCommitIndex: latestOverride?.commitIndex,
  };
}

/**
 * Auto-trigger match evaluation (call this whenever PO/Receipt/Invoice changes)
 * 
 * @param {object} matchFilament - Current match filament (may be empty)
 * @param {object} poFilament - PO filament
 * @param {object} receiptFilament - Receipt filament
 * @param {object} invoiceFilament - Invoice filament
 * @returns {object} Updated match filament
 */
export function autoEvaluateMatch(matchFilament, poFilament, receiptFilament, invoiceFilament) {
  // CRITICAL: For PO, we need the PO_CREATED commit (which has lines), not the latest commit
  const poSnapshot = getPODataCommit(poFilament);
  const receiptSnapshot = receiptFilament ? getLatestCommit(receiptFilament) : null;
  const invoiceSnapshot = invoiceFilament ? getLatestCommit(invoiceFilament) : null;
  
  console.log('[MatchEngine] Snapshots:', {
    poSnapshot,
    poPayload: poSnapshot?.commit?.payload,
    poLines: poSnapshot?.commit?.payload?.lines,
    receiptSnapshot,
    invoiceSnapshot,
  });
  
  if (!poSnapshot) {
    console.warn('[MatchEngine] No PO snapshot, cannot evaluate');
    return matchFilament;
  }
  
  // DEDUPE: Check if we already evaluated these exact snapshots
  const lastCommit = matchFilament.commits?.[matchFilament.commits.length - 1];
  if (lastCommit && lastCommit.op === 'MATCH_EVALUATED') {
    const lastBasis = lastCommit.payload.basis;
    const sameInputs = 
      lastBasis.poSnapshot?.commitRef.commitIndex === poSnapshot.commitIndex &&
      lastBasis.receiptSnapshot?.commitRef.commitIndex === (receiptSnapshot?.commitIndex ?? -1) &&
      lastBasis.invoiceSnapshot?.commitRef.commitIndex === (invoiceSnapshot?.commitIndex ?? -1);
    
    if (sameInputs) {
      console.log('[MatchEngine] Skipping duplicate evaluation (same inputs)');
      return matchFilament;
    }
  }
  
  // Generate new match commit
  const nextCommitIndex = matchFilament.commits?.length || 0;
  const newMatchCommit = createMatchEvaluatedCommit(
    matchFilament.id,
    nextCommitIndex,
    poSnapshot,
    receiptSnapshot,
    invoiceSnapshot
  );
  
  console.log('[MatchEngine] Auto-generated match commit:', newMatchCommit);
  
  // Append to match filament
  return {
    ...matchFilament,
    commits: [...(matchFilament.commits || []), newMatchCommit],
  };
}
