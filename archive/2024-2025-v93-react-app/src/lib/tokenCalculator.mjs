/**
 * @fileoverview Token calculation utilities
 */

import { getSystemParameters } from './systemParameters.mjs';

/**
 * Calculate tokens based on participation metrics
 * @param {Object} params - Calculation parameters
 * @param {number} params.participation - Participation score
 * @param {number} params.quality - Quality multiplier (0-1)
 * @param {number} params.consistency - Consistency multiplier (0-1)
 * @param {number} [params.timestamp] - Timestamp for time decay
 * @returns {number} Calculated token amount
 */
export async function calculateTokens({ participation, quality, consistency, timestamp }) {
  // Get system parameters
  const systemParams = await getSystemParameters();
  
  // Handle edge cases
  if (participation < 0) return 0;
  if (quality < 0 || quality > 1) quality = Math.max(0, Math.min(1, quality));
  if (consistency < 0 || consistency > 1) consistency = Math.max(0, Math.min(1, consistency));
  
  // Check participation threshold
  if (participation < systemParams.participationThreshold) {
    return 0;
  }
  
  // Base calculation with system parameters
  let tokens = systemParams.baseTokenReward * 
               (participation / systemParams.participationThreshold) * 
               (quality * systemParams.qualityMultiplier) * 
               (consistency + systemParams.consistencyBonus);
  
  // Apply time decay if timestamp provided
  if (timestamp) {
    const now = Date.now();
    const daysSince = (now - timestamp) / (24 * 60 * 60 * 1000);
    const decayFactor = Math.exp(-daysSince / 30); // 30-day half-life
    tokens *= decayFactor;
  }
  
  // Ensure finite result within reasonable bounds
  return isFinite(tokens) ? Math.max(0, Math.min(tokens, Number.MAX_SAFE_INTEGER)) : 0;
}