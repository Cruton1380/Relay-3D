import { describe, it, expect, beforeEach } from 'vitest';
import { calculateTokens } from '../../../src/lib/tokenCalculator.mjs';
import { getSystemParameters } from '../../../src/lib/systemParameters.mjs';

describe('Token Calculation Tests', () => {
  let systemParams;

  beforeEach(async () => {
    systemParams = await getSystemParameters();
  });

  describe('Basic Token Calculation', () => {
    it('should calculate basic participation tokens', async () => {
      const result = await calculateTokens({
        participation: 100,
        quality: 0.8,
        consistency: 0.9
      });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle zero participation', async () => {
      const result = await calculateTokens({
        participation: 0,
        quality: 0.8,
        consistency: 0.9
      });
      
      expect(result).toBe(0);
    });

    it('should apply quality multiplier correctly', async () => {
      const baseResult = await calculateTokens({
        participation: 100,
        quality: 1.0,
        consistency: 1.0
      });
      
      const reducedQualityResult = await calculateTokens({
        participation: 100,
        quality: 0.5,
        consistency: 1.0
      });
      
      expect(reducedQualityResult).toBeLessThan(baseResult);
    });

    it('should respect participation threshold', async () => {
      const belowThreshold = await calculateTokens({
        participation: systemParams.participationThreshold - 1,
        quality: 1.0,
        consistency: 1.0
      });

      const aboveThreshold = await calculateTokens({
        participation: systemParams.participationThreshold + 1,
        quality: 1.0,
        consistency: 1.0
      });

      expect(belowThreshold).toBe(0);
      expect(aboveThreshold).toBeGreaterThan(0);
    });
  });

  describe('Time-based Token Decay', () => {
    it('should apply time decay to older contributions', async () => {
      const recentResult = await calculateTokens({
        participation: 100,
        quality: 0.8,
        consistency: 0.9,
        timestamp: Date.now()
      });
      
      const oldResult = await calculateTokens({
        participation: 100,
        quality: 0.8,
        consistency: 0.9,
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
      });
      
      expect(oldResult).toBeLessThan(recentResult);
    });

    it('should handle very old timestamps gracefully', async () => {
      const veryOldResult = await calculateTokens({
        participation: 100,
        quality: 0.8,
        consistency: 0.9,
        timestamp: 0 // Unix epoch
      });

      expect(veryOldResult).toBeGreaterThanOrEqual(0);
      expect(isFinite(veryOldResult)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative values gracefully', async () => {
      const result = await calculateTokens({
        participation: -10,
        quality: 0.8,
        consistency: 0.9
      });
      
      expect(result).toBe(0);
    });

    it('should handle extremely large values', async () => {
      const result = await calculateTokens({
        participation: Number.MAX_SAFE_INTEGER,
        quality: 0.8,
        consistency: 0.9
      });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
      expect(result).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    });

    it('should handle invalid quality and consistency values', async () => {
      const result = await calculateTokens({
        participation: 100,
        quality: 1.5, // Above valid range
        consistency: -0.5 // Below valid range
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
