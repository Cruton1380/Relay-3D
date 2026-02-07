/**
 * Delayed Verification Service
 * Requires consistent proximity over time before granting access
 */

import EventEmitter from 'events';

export class DelayedVerificationService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            minimumDuration: config.minimumDuration || 30000, // 30 seconds
            maximumDuration: config.maximumDuration || 300000, // 5 minutes
            stabilityThreshold: config.stabilityThreshold || 0.8,
            checkInterval: config.checkInterval || 3000, // 3 seconds
            allowedGaps: config.allowedGaps || 2, // Allow 2 brief disconnections
            gapDuration: config.gapDuration || 5000, // 5 seconds max gap
            ...config
        };
        
        this.verificationSessions = new Map();
        this.intervalId = null;
        
        this.startDelayedVerification();
    }

    startDelayedVerification() {
        this.intervalId = setInterval(() => {
            this.processVerificationSessions();
        }, this.config.checkInterval);
    }

    startVerification(sessionId, initialProximityData) {
        const session = {
            id: sessionId,
            startTime: Date.now(),
            endTime: null,
            status: 'pending',
            proximityHistory: [],
            gapCount: 0,
            lastGapStart: null,
            requiredDuration: this.calculateRequiredDuration(initialProximityData),
            stabilityScore: 0,
            verificationResult: null
        };
        
        this.verificationSessions.set(sessionId, session);
        this.recordProximityReading(sessionId, initialProximityData);
        
        this.emit('verificationStarted', {
            sessionId,
            requiredDuration: session.requiredDuration,
            estimatedCompletion: Date.now() + session.requiredDuration
        });
        
        return session;
    }

    recordProximityReading(sessionId, proximityData) {
        const session = this.verificationSessions.get(sessionId);
        if (!session || session.status !== 'pending') {
            return false;
        }
        
        const reading = {
            timestamp: Date.now(),
            confidence: proximityData.confidence,
            factors: proximityData.factors,
            isValid: proximityData.confidence >= this.config.stabilityThreshold
        };
        
        session.proximityHistory.push(reading);
        
        // Handle gaps in proximity
        if (!reading.isValid) {
            if (!session.lastGapStart) {
                session.lastGapStart = Date.now();
            }
        } else {
            if (session.lastGapStart) {
                const gapDuration = Date.now() - session.lastGapStart;
                if (gapDuration <= this.config.gapDuration) {
                    // Acceptable gap
                    session.gapCount++;
                } else {
                    // Gap too long, restart verification
                    this.restartVerification(sessionId, 'Gap too long');
                    return false;
                }
                session.lastGapStart = null;
            }
        }
        
        // Check if too many gaps
        if (session.gapCount > this.config.allowedGaps) {
            this.failVerification(sessionId, 'Too many proximity gaps');
            return false;
        }
        
        // Update stability score
        session.stabilityScore = this.calculateStabilityScore(session);
        
        this.emit('verificationProgress', {
            sessionId,
            progress: this.calculateProgress(session),
            stabilityScore: session.stabilityScore,
            timeRemaining: this.calculateTimeRemaining(session)
        });
        
        return true;
    }

    calculateRequiredDuration(proximityData) {
        // Higher confidence = shorter required duration
        const baseTime = this.config.minimumDuration;
        const maxTime = this.config.maximumDuration;
        const confidenceFactor = 1 - proximityData.confidence;
        
        return Math.min(
            baseTime + (maxTime - baseTime) * confidenceFactor,
            maxTime
        );
    }

    calculateStabilityScore(session) {
        if (session.proximityHistory.length === 0) return 0;
        
        const recentReadings = session.proximityHistory.slice(-10); // Last 10 readings
        const validReadings = recentReadings.filter(r => r.isValid);
        const stabilityRatio = validReadings.length / recentReadings.length;
        
        // Factor in consistency of confidence levels
        const confidences = validReadings.map(r => r.confidence);
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length || 0;
        const confidenceVariance = this.calculateVariance(confidences);
        const consistencyScore = Math.max(0, 1 - confidenceVariance);
        
        return (stabilityRatio * 0.7) + (avgConfidence * 0.2) + (consistencyScore * 0.1);
    }

    calculateVariance(values) {
        if (values.length === 0) return 1;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateProgress(session) {
        const elapsed = Date.now() - session.startTime;
        const required = session.requiredDuration;
        
        // Progress based on time and stability
        const timeProgress = Math.min(elapsed / required, 1);
        const stabilityProgress = session.stabilityScore;
        
        // Both time and stability must be satisfied
        return Math.min(timeProgress, stabilityProgress);
    }

    calculateTimeRemaining(session) {
        const elapsed = Date.now() - session.startTime;
        const required = session.requiredDuration;
        const timeRemaining = Math.max(0, required - elapsed);
        
        // If stability is low, extend required time
        if (session.stabilityScore < 0.8) {
            const penalty = (0.8 - session.stabilityScore) * required * 0.5;
            return timeRemaining + penalty;
        }
        
        return timeRemaining;
    }

    processVerificationSessions() {
        for (const [sessionId, session] of this.verificationSessions) {
            if (session.status !== 'pending') continue;
            
            const now = Date.now();
            const elapsed = now - session.startTime;
            const progress = this.calculateProgress(session);
            
            // Check for timeout
            if (elapsed > this.config.maximumDuration) {
                this.failVerification(sessionId, 'Maximum duration exceeded');
                continue;
            }
            
            // Check for completion
            if (elapsed >= session.requiredDuration && session.stabilityScore >= this.config.stabilityThreshold) {
                this.completeVerification(sessionId);
                continue;
            }
            
            // Check for stalled verification (no recent readings)
            const lastReading = session.proximityHistory[session.proximityHistory.length - 1];
            if (lastReading && now - lastReading.timestamp > this.config.checkInterval * 3) {
                this.failVerification(sessionId, 'No recent proximity readings');
                continue;
            }
        }
    }

    completeVerification(sessionId) {
        const session = this.verificationSessions.get(sessionId);
        if (!session) return;
        
        session.status = 'completed';
        session.endTime = Date.now();
        session.verificationResult = {
            success: true,
            duration: session.endTime - session.startTime,
            finalStabilityScore: session.stabilityScore,
            readingCount: session.proximityHistory.length,
            gapCount: session.gapCount
        };
        
        this.emit('verificationCompleted', {
            sessionId,
            result: session.verificationResult,
            session: session
        });
        
        // Clean up after a delay
        setTimeout(() => {
            this.verificationSessions.delete(sessionId);
        }, 60000); // Keep for 1 minute for reference
    }

    failVerification(sessionId, reason) {
        const session = this.verificationSessions.get(sessionId);
        if (!session) return;
        
        session.status = 'failed';
        session.endTime = Date.now();
        session.verificationResult = {
            success: false,
            reason: reason,
            duration: session.endTime - session.startTime,
            finalStabilityScore: session.stabilityScore,
            readingCount: session.proximityHistory.length,
            gapCount: session.gapCount
        };
        
        this.emit('verificationFailed', {
            sessionId,
            reason,
            result: session.verificationResult,
            session: session
        });
        
        // Clean up after a delay
        setTimeout(() => {
            this.verificationSessions.delete(sessionId);
        }, 30000); // Keep for 30 seconds for reference
    }

    restartVerification(sessionId, reason) {
        const session = this.verificationSessions.get(sessionId);
        if (!session) return;
        
        this.emit('verificationRestarted', {
            sessionId,
            reason,
            previousDuration: Date.now() - session.startTime
        });
        
        // Reset session
        session.startTime = Date.now();
        session.proximityHistory = [];
        session.gapCount = 0;
        session.lastGapStart = null;
        session.stabilityScore = 0;
    }

    cancelVerification(sessionId) {
        const session = this.verificationSessions.get(sessionId);
        if (!session) return false;
        
        session.status = 'cancelled';
        session.endTime = Date.now();
        
        this.emit('verificationCancelled', { sessionId });
        this.verificationSessions.delete(sessionId);
        
        return true;
    }

    getVerificationStatus(sessionId) {
        const session = this.verificationSessions.get(sessionId);
        if (!session) return null;
        
        return {
            sessionId,
            status: session.status,
            progress: this.calculateProgress(session),
            timeRemaining: this.calculateTimeRemaining(session),
            stabilityScore: session.stabilityScore,
            gapCount: session.gapCount,
            duration: Date.now() - session.startTime,
            requiredDuration: session.requiredDuration
        };
    }

    getAllVerificationSessions() {
        const sessions = [];
        for (const [sessionId, session] of this.verificationSessions) {
            sessions.push(this.getVerificationStatus(sessionId));
        }
        return sessions;
    }

    cleanup() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.verificationSessions.clear();        this.removeAllListeners();
    }
}

export default DelayedVerificationService;
