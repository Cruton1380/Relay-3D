/**
 * Test file for Delayed Verification Service
 */

import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import DelayedVerificationService from '../../src/backend/channel-service/delayedVerificationService.mjs';

describe('DelayedVerificationService', () => {
    let service;beforeEach(() => {
        service = new DelayedVerificationService({
            minimumDuration: 10000, // 10 seconds for testing
            maximumDuration: 60000, // 1 minute for testing
            stabilityThreshold: 0.8,
            checkInterval: 1000 // 1 second for testing
        });
        vi.useFakeTimers();
    });    afterEach(() => {
        if (service) {
            service.cleanup();
        }
        vi.useRealTimers();
        vi.restoreAllMocks();
    });describe('Initialization', () => {
        it('should initialize with configuration', () => {
            expect(service.config.minimumDuration).toBe(10000);
            expect(service.config.stabilityThreshold).toBe(0.8);
            expect(service.verificationSessions).toBeInstanceOf(Map);
        });

        it('should start delayed verification interval', () => {
            expect(service.intervalId).not.toBeNull();
        });
    });    describe('Verification Session Management', () => {
        it('should start a new verification session', () => {
            const sessionId = 'test-session-1';
            const proximityData = { confidence: 0.9, factors: {} };

            const session = service.startVerification(sessionId, proximityData);

            expect(session).toBeInstanceOf(Object);
            expect(session.id).toBe(sessionId);
            expect(session.status).toBe('pending');
            expect(session.proximityHistory).toHaveLength(1);
        });

        it('should emit verificationStarted event', async () => {
            return new Promise((resolve) => {
                service.once('verificationStarted', (data) => {
                    expect(data.sessionId).toBe('test-session');
                    expect(data.requiredDuration).toBeTypeOf('number');
                    resolve();
                });

                service.startVerification('test-session', { confidence: 0.8, factors: {} });
            });
        });

        it('should calculate required duration based on confidence', () => {
            const highConfidenceData = { confidence: 0.9, factors: {} };
            const lowConfidenceData = { confidence: 0.3, factors: {} };

            const highConfSession = service.startVerification('high-conf', highConfidenceData);
            const lowConfSession = service.startVerification('low-conf', lowConfidenceData);

            expect(lowConfSession.requiredDuration).toBeGreaterThan(highConfSession.requiredDuration);
        });
    });

    describe('Proximity Reading Processing', () => {
        let sessionId;

        beforeEach(() => {
            sessionId = 'test-session';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });
        });        it('should record valid proximity readings', () => {
            const result = service.recordProximityReading(sessionId, {
                confidence: 0.85,
                factors: { wifi: 0.9, bluetooth: 0.8 }
            });

            expect(result).toBe(true);
            
            const session = service.verificationSessions.get(sessionId);
            expect(session.proximityHistory).toHaveLength(2); // Initial + new reading
        });

        it('should handle gaps in proximity', () => {
            // Record a low confidence reading (gap)
            service.recordProximityReading(sessionId, {
                confidence: 0.5, // Below threshold
                factors: {}
            });

            const session = service.verificationSessions.get(sessionId);
            expect(session.lastGapStart).toBeTypeOf('number');
        });        it('should restart verification on gap too long', async () => {
            return new Promise((resolve) => {
                service.once('verificationRestarted', (data) => {
                    expect(data.sessionId).toBe(sessionId);
                    expect(data.reason).toBe('Gap too long');
                    resolve();
                });

                const session = service.verificationSessions.get(sessionId);
                session.lastGapStart = Date.now() - 10000; // 10 seconds ago
                
                // Record a valid reading after the gap to trigger the gap duration check
                // Use confidence >= 0.8 to meet stabilityThreshold so isValid = true
                service.recordProximityReading(sessionId, {
                    confidence: 0.9, // This will make isValid = true (0.9 >= 0.8)
                    factors: {}
                });
            });
        });

        it('should fail verification on too many gaps', async () => {
            return new Promise((resolve) => {
                service.once('verificationFailed', (data) => {
                    expect(data.sessionId).toBe(sessionId);
                    expect(data.reason).toBe('Too many proximity gaps');
                    resolve();
                });

                const session = service.verificationSessions.get(sessionId);
                session.gapCount = 5; // Exceed allowed gaps
                
                service.recordProximityReading(sessionId, {
                    confidence: 0.5,
                    factors: {}
                });
            });
        });
    });

    describe('Stability Score Calculation', () => {
        let sessionId;

        beforeEach(() => {
            sessionId = 'stability-test';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });
        });

        it('should calculate stability score based on recent readings', () => {
            // Add several consistent readings
            for (let i = 0; i < 5; i++) {
                service.recordProximityReading(sessionId, {
                    confidence: 0.85,
                    factors: {}
                });
            }

            const session = service.verificationSessions.get(sessionId);
            const stability = service.calculateStabilityScore(session);
            
            expect(stability).toBeTypeOf("number");
            expect(stability).toBeGreaterThan(0.7); // High stability expected
        });

        it('should penalize inconsistent readings', () => {
            // Add inconsistent readings
            const confidences = [0.9, 0.3, 0.8, 0.2, 0.9];
            
            for (const confidence of confidences) {
                service.recordProximityReading(sessionId, {
                    confidence,
                    factors: {}
                });
            }

            const session = service.verificationSessions.get(sessionId);
            const stability = service.calculateStabilityScore(session);
            
            expect(stability).toBeLessThan(0.8); // Lower stability due to variance
        });
    });

    describe('Progress Calculation', () => {
        let sessionId;

        beforeEach(() => {
            sessionId = 'progress-test';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });
        });

        it('should calculate progress based on time and stability', () => {
            const session = service.verificationSessions.get(sessionId);
              // Simulate time passing
            vi.advanceTimersByTime(5000); // 5 seconds
            
            const progress = service.calculateProgress(session);            expect(progress).toBeTypeOf("number");
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(1);
        });

        it('should extend time remaining when stability is low', () => {
            const session = service.verificationSessions.get(sessionId);
            session.stabilityScore = 0.5; // Low stability
            
            const timeRemaining = service.calculateTimeRemaining(session);
            expect(timeRemaining).toBeGreaterThan(session.requiredDuration);
        });
    });

    describe('Verification Completion', () => {
        let sessionId;

        beforeEach(() => {
            sessionId = 'completion-test';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });
        });        it('should complete verification when requirements are met', async () => {
            return new Promise((resolve) => {
                service.once('verificationCompleted', (data) => {
                    expect(data.sessionId).toBe(sessionId);
                    expect(data.result.success).toBe(true);
                    resolve();
                });

                const session = service.verificationSessions.get(sessionId);
                session.stabilityScore = 0.9;
                  // Fast forward time to meet duration requirement
                vi.advanceTimersByTime(session.requiredDuration + 1000);
                
                service.processVerificationSessions();
            });
        });        it('should fail verification on timeout', async () => {
            return new Promise((resolve) => {
                service.once('verificationFailed', (data) => {
                    expect(data.sessionId).toBe(sessionId);
                    expect(data.reason).toBe('Maximum duration exceeded');
                    resolve();
                });            // Fast forward beyond maximum duration
                vi.advanceTimersByTime(service.config.maximumDuration + 1000);
                
                service.processVerificationSessions();
            });
        });        it('should fail verification on stalled readings', async () => {
            return new Promise((resolve) => {
                service.once('verificationFailed', (data) => {
                    expect(data.sessionId).toBe(sessionId);
                    expect(data.reason).toBe('No recent proximity readings');
                    resolve();
                });            // Fast forward without any new readings
                vi.advanceTimersByTime(service.config.checkInterval * 4);
                
                service.processVerificationSessions();
            });
        });
    });

    describe('Session Status and Management', () => {
        it('should return verification status', () => {
            const sessionId = 'status-test';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });

            const status = service.getVerificationStatus(sessionId);
            
            expect(status).toBeInstanceOf(Object);
            expect(status.sessionId).toBe(sessionId);
            expect(status.status).toBe('pending');
            expect(status.progress).toBeTypeOf("number");
        });

        it('should return null for non-existent session', () => {
            const status = service.getVerificationStatus('non-existent');
            expect(status).toBeNull();
        });

        it('should cancel verification session', () => {
            const sessionId = 'cancel-test';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });

            const result = service.cancelVerification(sessionId);
            expect(result).toBe(true);
            
            const session = service.verificationSessions.get(sessionId);
            expect(session).toBeUndefined(); // Should be deleted
        });

        it('should return all verification sessions', () => {
            service.startVerification('session1', { confidence: 0.8, factors: {} });
            service.startVerification('session2', { confidence: 0.7, factors: {} });

            const sessions = service.getAllVerificationSessions();
            expect(sessions).toHaveLength(2);
            expect(sessions[0].sessionId).to.be.oneOf(['session1', 'session2']);
        });
    });

    describe('Cleanup and Memory Management', () => {
        it('should clean up expired sessions', () => {
            const sessionId = 'cleanup-test';
            service.startVerification(sessionId, { confidence: 0.8, factors: {} });

            expect(service.verificationSessions.has(sessionId)).toBe(true);

            // Complete the verification
            service.completeVerification(sessionId);
              // Fast forward to cleanup time
            vi.advanceTimersByTime(61000); // 61 seconds
            
            expect(service.verificationSessions.has(sessionId)).toBe(false);
        });

        it('should properly cleanup service', () => {
            service.startVerification('test', { confidence: 0.8, factors: {} });
            
            service.cleanup();
            
            expect(service.intervalId).toBeNull();
            expect(service.verificationSessions.size).toBe(0);
            expect(service.listenerCount()).toBe(0);
        });
    });
});






