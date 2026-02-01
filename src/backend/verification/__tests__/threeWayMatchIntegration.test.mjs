/**
 * Three-Way Match Integration Test
 * 
 * Verifies that voting engine properly integrates
 * Intent, Reality, and Projection verification.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ThreeWayMatchEngine } from '../threeWayMatchEngine.mjs';

describe('Three-Way Match Integration', () => {
  let engine;

  beforeEach(() => {
    engine = new ThreeWayMatchEngine();
  });

  describe('Valid Three-Way Match', () => {
    it('should pass when all three legs align', async () => {
      const intent = {
        userId: 'user_123',
        action: 'CAST_VOTE',
        candidateId: 'candidate_A',
        topicId: 'topic_1',
        timestamp: Date.now(),
        authority: { authorized: true, scope: 'vote:write' }
      };

      const reality = {
        currentState: { totalVotes: 100, candidateTotal: 50 },
        priorVote: null,
        eventLog: { recentVotes: [], logSize: 0 },
        immutable: true
      };

      const projection = {
        expectedCandidateTotal: 51,
        expectedTotalVotes: 101,
        propagationDepth: 2,
        boundedPropagation: true,
        confidence: 0.95
      };

      const result = await engine.verify({ intent, reality, projection });

      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.dimensions.intent).toBeGreaterThan(0);
      expect(result.dimensions.reality).toBeGreaterThan(0);
      expect(result.dimensions.projection).toBeGreaterThan(0);
    });
  });

  describe('Invalid Three-Way Match', () => {
    it('should fail when intent is missing authority', async () => {
      const intent = {
        userId: 'user_123',
        action: 'CAST_VOTE',
        candidateId: 'candidate_A',
        // Missing authority
      };

      const reality = {
        currentState: { totalVotes: 100 },
        immutable: true
      };

      const projection = {
        expectedCandidateTotal: 51,
        confidence: 0.95
      };

      const result = await engine.verify({ intent, reality, projection });

      expect(result.valid).toBe(false);
      expect(result.dimensions.intent).toBeLessThan(0.7);
    });

    it('should fail when reality is mutable', async () => {
      const intent = {
        userId: 'user_123',
        action: 'CAST_VOTE',
        authority: { authorized: true }
      };

      const reality = {
        currentState: { totalVotes: 100 },
        immutable: false  // MUTABLE STORAGE
      };

      const projection = {
        expectedCandidateTotal: 51,
        confidence: 0.95
      };

      const result = await engine.verify({ intent, reality, projection });

      expect(result.valid).toBe(false);
      expect(result.dimensions.reality).toBeLessThan(0.7);
    });

    it('should fail when projection confidence is low', async () => {
      const intent = {
        userId: 'user_123',
        action: 'CAST_VOTE',
        authority: { authorized: true }
      };

      const reality = {
        currentState: { totalVotes: 100 },
        immutable: true
      };

      const projection = {
        expectedCandidateTotal: 51,
        confidence: 0.3  // LOW CONFIDENCE
      };

      const result = await engine.verify({ intent, reality, projection });

      expect(result.valid).toBe(false);
      expect(result.dimensions.projection).toBeLessThan(0.7);
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate confidence as min of three legs', async () => {
      const intent = {
        userId: 'user_123',
        action: 'CAST_VOTE',
        authority: { authorized: true }
      };

      const reality = {
        currentState: { totalVotes: 100 },
        immutable: true
      };

      const projection = {
        expectedCandidateTotal: 51,
        confidence: 0.8  // WEAKEST LEG
      };

      const result = await engine.verify({ intent, reality, projection });

      // Overall confidence should be minimum of three
      expect(result.confidence).toBeLessThanOrEqual(0.8);
      expect(result.confidence).toBe(
        Math.min(
          result.dimensions.intent,
          result.dimensions.reality,
          result.dimensions.projection
        )
      );
    });
  });
});
