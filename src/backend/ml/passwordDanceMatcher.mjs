/**
 * @fileoverview Password Dance Pattern Matcher using ML
 */

export default class PasswordDanceMatcher {
    constructor() {
        this.patterns = new Map();
        this.threshold = 0.85;
    }

    /**
     * Train the matcher with a new password dance pattern
     */
    async trainPattern(userId, pattern) {
        this.patterns.set(userId, {
            pattern: pattern,
            trainedAt: Date.now(),
            confidence: 1.0
        });
        return { success: true, trained: true };
    }

    /**
     * Match a password dance attempt against stored patterns
     */
    async matchPattern(userId, attemptPattern) {
        const storedPattern = this.patterns.get(userId);
        
        if (!storedPattern) {
            return { 
                success: false, 
                match: false, 
                confidence: 0,
                reason: 'No stored pattern'
            };
        }

        // Simple pattern matching for testing
        const similarity = this.calculateSimilarity(storedPattern.pattern, attemptPattern);
        const isMatch = similarity >= this.threshold;

        return {
            success: true,
            match: isMatch,
            confidence: similarity,
            threshold: this.threshold
        };
    }

    /**
     * Calculate similarity between two patterns
     */
    calculateSimilarity(pattern1, pattern2) {
        if (!pattern1 || !pattern2) return 0;
        
        // Simple similarity calculation based on pattern properties
        const factors = [];
        
        if (pattern1.duration && pattern2.duration) {
            const durationDiff = Math.abs(pattern1.duration - pattern2.duration);
            const durationSim = Math.max(0, 1 - (durationDiff / Math.max(pattern1.duration, pattern2.duration)));
            factors.push(durationSim);
        }
        
        if (pattern1.keyPresses && pattern2.keyPresses) {
            const lengthSim = Math.min(pattern1.keyPresses.length, pattern2.keyPresses.length) / 
                             Math.max(pattern1.keyPresses.length, pattern2.keyPresses.length);
            factors.push(lengthSim);
        }

        return factors.length > 0 ? factors.reduce((a, b) => a + b) / factors.length : 0.5;
    }

    /**
     * Clear patterns for a user
     */
    async clearPattern(userId) {
        const deleted = this.patterns.delete(userId);
        return { success: true, deleted };
    }

    /**
     * Get pattern info for a user
     */
    async getPatternInfo(userId) {
        const pattern = this.patterns.get(userId);
        if (!pattern) {
            return { success: false, exists: false };
        }
        
        return {
            success: true,
            exists: true,
            trainedAt: pattern.trainedAt,
            confidence: pattern.confidence
        };
    }
}
