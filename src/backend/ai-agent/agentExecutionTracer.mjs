/**
 * Agent Execution Trace Logger
 * Comprehensive logging system for prompt flows, collaboration loops, and deadlock resolution
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class AgentExecutionTracer {
    constructor(options = {}) {
        this.tracingEnabled = options.tracingEnabled !== false;
        this.logDirectory = options.logDirectory || './logs/agent-traces';
        this.maxLogFiles = options.maxLogFiles || 100;
        this.currentSession = null;
        this.executionLogs = [];
        
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        try {
            await fs.mkdir(this.logDirectory, { recursive: true });
        } catch (error) {
            console.warn('Failed to create log directory:', error.message);
        }
    }

    /**
     * Start a new execution session
     */
    startSession(sessionId, context = {}) {
        this.currentSession = {
            sessionId: sessionId || crypto.randomUUID(),
            startTime: new Date().toISOString(),
            context: this.sanitizeContext(context),
            events: [],
            collaborationLoops: [],
            deadlockEvents: [],
            modelSwitches: [],
            errorEvents: []
        };

        this.logEvent('SESSION_START', {
            sessionId: this.currentSession.sessionId,
            context: this.currentSession.context
        });

        return this.currentSession.sessionId;
    }

    /**
     * Log a prompt → response → summary flow
     */
    logPromptFlow(data) {
        if (!this.tracingEnabled || !this.currentSession) return;

        const flowId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const promptFlow = {
            flowId,
            timestamp,
            type: 'PROMPT_FLOW',
            agent: data.agent,
            model: data.model,
            prompt: {
                original: this.sanitizePrompt(data.originalPrompt),
                scrubbed: data.scrubbedPrompt,
                tokenCount: data.tokenCount || null
            },
            response: {
                content: data.response,
                model: data.responseModel,
                processingTime: data.processingTime,
                tokenCount: data.responseTokens || null
            },
            summary: data.summary,
            followUpGenerated: data.followUp || null,
            metadata: {
                classification: data.classification,
                confidence: data.confidence,
                requiresCollaboration: data.requiresCollaboration
            }
        };

        this.currentSession.events.push(promptFlow);
        this.logEvent('PROMPT_FLOW_COMPLETED', promptFlow);

        return flowId;
    }

    /**
     * Log collaboration loop iteration
     */
    logCollaborationIteration(data) {
        if (!this.tracingEnabled || !this.currentSession) return;

        const iterationId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const iteration = {
            iterationId,
            timestamp,
            loopId: data.loopId,
            iterationNumber: data.iterationNumber,
            initiatingAgent: data.initiatingAgent,
            respondingAgent: data.respondingAgent,
            exchange: {
                input: data.input,
                output: data.output,
                summary: data.summary
            },
            context: data.context,
            progressMade: data.progressMade,
            staleDetected: data.staleDetected
        };

        // Find or create collaboration loop
        let loop = this.currentSession.collaborationLoops.find(l => l.loopId === data.loopId);
        if (!loop) {
            loop = {
                loopId: data.loopId,
                startTime: timestamp,
                initialRequest: data.initialRequest,
                iterations: [],
                status: 'active',
                outcome: null
            };
            this.currentSession.collaborationLoops.push(loop);
        }

        loop.iterations.push(iteration);
        this.logEvent('COLLABORATION_ITERATION', iteration);

        return iterationId;
    }

    /**
     * Log deadlock detection and resolution
     */
    logDeadlockEvent(data) {
        if (!this.tracingEnabled || !this.currentSession) return;

        const deadlockId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const deadlockEvent = {
            deadlockId,
            timestamp,
            type: 'DEADLOCK_EVENT',
            loopId: data.loopId,
            detectionTrigger: data.detectionTrigger,
            iterationsBeforeDetection: data.iterationsBeforeDetection,
            staleExchanges: data.staleExchanges,
            resolutionStrategy: data.resolutionStrategy,
            resolutionActions: data.resolutionActions,
            outcome: data.outcome,
            humanEscalated: data.humanEscalated || false,
            resolutionTime: data.resolutionTime
        };

        this.currentSession.deadlockEvents.push(deadlockEvent);
        this.logEvent('DEADLOCK_DETECTED', deadlockEvent);

        // Update collaboration loop status
        const loop = this.currentSession.collaborationLoops.find(l => l.loopId === data.loopId);
        if (loop) {
            loop.status = data.humanEscalated ? 'escalated' : 'resolved';
            loop.outcome = data.outcome;
            loop.endTime = timestamp;
        }

        return deadlockId;
    }

    /**
     * Log model switching events
     */
    logModelSwitch(data) {
        if (!this.tracingEnabled || !this.currentSession) return;

        const switchId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const modelSwitch = {
            switchId,
            timestamp,
            type: 'MODEL_SWITCH',
            agent: data.agent,
            fromModel: data.fromModel,
            toModel: data.toModel,
            reason: data.reason,
            triggerType: data.triggerType, // 'manual', 'health_check', 'failure', 'performance'
            healthStatus: data.healthStatus,
            fallbackActivated: data.fallbackActivated || false,
            success: data.success
        };

        this.currentSession.modelSwitches.push(modelSwitch);
        this.logEvent('MODEL_SWITCH', modelSwitch);

        return switchId;
    }

    /**
     * Log error events and recovery actions
     */
    logErrorEvent(data) {
        if (!this.tracingEnabled || !this.currentSession) return;

        const errorId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const errorEvent = {
            errorId,
            timestamp,
            type: 'ERROR_EVENT',
            errorType: data.errorType,
            errorMessage: data.errorMessage,
            agent: data.agent,
            model: data.model,
            context: data.context,
            recoveryActions: data.recoveryActions,
            retryCount: data.retryCount,
            fallbackActivated: data.fallbackActivated,
            recoverySuccess: data.recoverySuccess,
            finalOutcome: data.finalOutcome
        };

        this.currentSession.errorEvents.push(errorEvent);
        this.logEvent('ERROR_RECOVERY', errorEvent);

        return errorId;
    }

    /**
     * End current session and save trace
     */
    async endSession(outcome = {}) {
        if (!this.currentSession) return null;

        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.duration = Date.parse(this.currentSession.endTime) - Date.parse(this.currentSession.startTime);
        this.currentSession.outcome = outcome;

        this.logEvent('SESSION_END', {
            sessionId: this.currentSession.sessionId,
            duration: this.currentSession.duration,
            outcome
        });

        // Save complete trace log
        const traceFile = await this.saveTraceLog();
        
        // Archive current session
        this.executionLogs.push(this.currentSession);
        this.currentSession = null;

        return traceFile;
    }

    /**
     * Save trace log to file
     */
    async saveTraceLog() {
        if (!this.currentSession) return null;

        const filename = `agent-trace-${this.currentSession.sessionId}-${Date.now()}.json`;
        const filepath = path.join(this.logDirectory, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(this.currentSession, null, 2));
            
            // Clean up old log files
            await this.cleanupOldLogs();
            
            return filepath;
        } catch (error) {
            console.error('Failed to save trace log:', error);
            return null;
        }
    }

    /**
     * Generate comprehensive execution summary
     */
    generateExecutionSummary() {
        if (!this.currentSession) return null;

        const summary = {
            sessionId: this.currentSession.sessionId,
            duration: this.currentSession.duration || (Date.now() - Date.parse(this.currentSession.startTime)),
            statistics: {
                totalEvents: this.currentSession.events.length,
                promptFlows: this.currentSession.events.filter(e => e.type === 'PROMPT_FLOW').length,
                collaborationLoops: this.currentSession.collaborationLoops.length,
                deadlockEvents: this.currentSession.deadlockEvents.length,
                modelSwitches: this.currentSession.modelSwitches.length,
                errorEvents: this.currentSession.errorEvents.length
            },
            agentUsage: this.calculateAgentUsage(),
            collaborationEffectiveness: this.calculateCollaborationEffectiveness(),
            errorRate: this.calculateErrorRate(),
            averageResponseTime: this.calculateAverageResponseTime(),
            deadlockResolutionRate: this.calculateDeadlockResolution()
        };

        return summary;
    }

    /**
     * Export all trace logs for analysis
     */
    async exportTraceLogs(outputPath = './agentExecutionTraceLogs.json') {
        const allSessions = [...this.executionLogs];
        if (this.currentSession) {
            allSessions.push(this.currentSession);
        }

        const exportData = {
            exportTimestamp: new Date().toISOString(),
            totalSessions: allSessions.length,
            sessions: allSessions,
            aggregateStatistics: this.calculateAggregateStatistics(allSessions)
        };

        try {
            await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
            console.log(`Trace logs exported to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Failed to export trace logs:', error);
            throw error;
        }
    }

    // Private helper methods
    sanitizePrompt(prompt) {
        if (!prompt) return null;
        // Remove potential sensitive information for logging
        return prompt
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            .replace(/#[\w-]+/g, '[CHANNEL]')
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
            .replace(/[+-]?\d*\.?\d+,-?\d*\.?\d+/g, '[COORDINATES]');
    }

    sanitizeContext(context) {
        // Create a safe version of context for logging
        const safe = { ...context };
        delete safe.apiKeys;
        delete safe.secrets;
        delete safe.personalData;
        return safe;
    }

    logEvent(type, data) {
        const event = {
            timestamp: new Date().toISOString(),
            type,
            data: this.sanitizeContext(data)
        };

        if (this.currentSession) {
            this.currentSession.events.push(event);
        }
    }

    calculateAgentUsage() {
        const events = this.currentSession.events.filter(e => e.type === 'PROMPT_FLOW');
        const usage = {};
        
        events.forEach(event => {
            const agent = event.data.agent;
            if (!usage[agent]) usage[agent] = 0;
            usage[agent]++;
        });

        return usage;
    }

    calculateCollaborationEffectiveness() {
        const loops = this.currentSession.collaborationLoops;
        if (loops.length === 0) return null;

        const completed = loops.filter(l => l.status === 'resolved').length;
        const escalated = loops.filter(l => l.status === 'escalated').length;
        const avgIterations = loops.reduce((sum, l) => sum + l.iterations.length, 0) / loops.length;

        return {
            completionRate: completed / loops.length,
            escalationRate: escalated / loops.length,
            averageIterations: avgIterations
        };
    }

    calculateErrorRate() {
        const totalEvents = this.currentSession.events.length;
        const errorEvents = this.currentSession.errorEvents.length;
        return totalEvents > 0 ? errorEvents / totalEvents : 0;
    }

    calculateAverageResponseTime() {
        const promptFlows = this.currentSession.events.filter(e => e.type === 'PROMPT_FLOW');
        if (promptFlows.length === 0) return null;

        const totalTime = promptFlows.reduce((sum, flow) => {
            return sum + (flow.data.response?.processingTime || 0);
        }, 0);

        return totalTime / promptFlows.length;
    }

    calculateDeadlockResolution() {
        const deadlocks = this.currentSession.deadlockEvents;
        if (deadlocks.length === 0) return null;

        const resolved = deadlocks.filter(d => d.outcome === 'resolved').length;
        return resolved / deadlocks.length;
    }

    calculateAggregateStatistics(sessions) {
        return {
            totalPromptFlows: sessions.reduce((sum, s) => sum + s.events.filter(e => e.type === 'PROMPT_FLOW').length, 0),
            totalCollaborationLoops: sessions.reduce((sum, s) => sum + s.collaborationLoops.length, 0),
            totalDeadlockEvents: sessions.reduce((sum, s) => sum + s.deadlockEvents.length, 0),
            averageSessionDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length,
            overallErrorRate: this.calculateOverallErrorRate(sessions),
            modelSwitchFrequency: sessions.reduce((sum, s) => sum + s.modelSwitches.length, 0) / sessions.length
        };
    }

    calculateOverallErrorRate(sessions) {
        const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);
        const totalErrors = sessions.reduce((sum, s) => sum + s.errorEvents.length, 0);
        return totalEvents > 0 ? totalErrors / totalEvents : 0;
    }

    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.logDirectory);
            const logFiles = files.filter(f => f.startsWith('agent-trace-') && f.endsWith('.json'));
            
            if (logFiles.length > this.maxLogFiles) {
                // Sort by creation time and remove oldest files
                const filesToDelete = logFiles
                    .sort()
                    .slice(0, logFiles.length - this.maxLogFiles);
                
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.logDirectory, file));
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup old logs:', error.message);
        }
    }
}

export default AgentExecutionTracer;
