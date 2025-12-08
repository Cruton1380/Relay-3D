/**
 * User Control and Session Management System
 * Handles user interrupts, rollbacks, and undo functionality
 */

import { AgentExecutionTracer } from './agentExecutionTracer.mjs';
import crypto from 'crypto';

export class UserControlManager {
    constructor(options = {}) {
        this.tracer = new AgentExecutionTracer();
        this.activeSessions = new Map();
        this.sessionCheckpoints = new Map();
        this.undoHistory = new Map();
        this.maxUndoSteps = options.maxUndoSteps || 10;
        this.autoCheckpointInterval = options.autoCheckpointInterval || 30000; // 30 seconds
    }

    /**
     * Start a new user session with control capabilities
     */
    startUserSession(userId, context = {}) {
        const sessionId = crypto.randomUUID();
        
        const session = {
            sessionId,
            userId,
            startTime: new Date().toISOString(),
            context,
            status: 'active',
            currentState: {
                conversation: [],
                agentStates: {},
                pendingActions: [],
                collaborationLoops: []
            },
            controlState: {
                allowInterrupts: true,
                allowRollbacks: true,
                allowUndo: true,
                requireConfirmation: context.requireConfirmation || false
            }
        };

        this.activeSessions.set(sessionId, session);
        this.sessionCheckpoints.set(sessionId, []);
        this.undoHistory.set(sessionId, []);

        // Start auto-checkpoint timer
        this.startAutoCheckpointing(sessionId);

        this.tracer.logEvent('USER_SESSION_START', {
            sessionId,
            userId,
            controlsEnabled: session.controlState
        });

        return sessionId;
    }

    /**
     * Handle user interrupt during agent processing
     */
    async handleUserInterrupt(sessionId, interruptType = 'stop', userMessage = '') {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (!session.controlState.allowInterrupts) {
            throw new Error('Interrupts not allowed for this session');
        }

        const interruptId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const interrupt = {
            interruptId,
            timestamp,
            type: interruptType, // 'stop', 'pause', 'redirect', 'cancel'
            userMessage,
            sessionState: this.captureSessionState(session),
            agentsAffected: this.getActiveAgents(session)
        };

        // Handle different interrupt types
        switch (interruptType) {
            case 'stop':
                await this.stopAllAgentProcessing(session);
                session.status = 'interrupted';
                break;
                
            case 'pause':
                await this.pauseAgentProcessing(session);
                session.status = 'paused';
                break;
                
            case 'redirect':
                await this.redirectAgentProcessing(session, userMessage);
                break;
                
            case 'cancel':
                await this.cancelCurrentOperations(session);
                await this.rollbackToLastCheckpoint(sessionId);
                break;
        }

        this.tracer.logEvent('USER_INTERRUPT', interrupt);

        return {
            success: true,
            interruptId,
            newStatus: session.status,
            stoppedOperations: interrupt.agentsAffected,
            rollbackAvailable: this.hasCheckpoints(sessionId),
            undoAvailable: this.hasUndoHistory(sessionId)
        };
    }

    /**
     * Create a session checkpoint for rollback capability
     */
    createCheckpoint(sessionId, description = 'Auto checkpoint') {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const checkpointId = crypto.randomUUID();
        const checkpoint = {
            checkpointId,
            timestamp: new Date().toISOString(),
            description,
            sessionState: this.captureSessionState(session),
            conversationLength: session.currentState.conversation.length,
            agentStates: { ...session.currentState.agentStates },
            pendingActions: [...session.currentState.pendingActions]
        };

        const checkpoints = this.sessionCheckpoints.get(sessionId);
        checkpoints.push(checkpoint);

        // Keep only recent checkpoints
        if (checkpoints.length > this.maxUndoSteps) {
            checkpoints.shift();
        }

        this.tracer.logEvent('CHECKPOINT_CREATED', {
            sessionId,
            checkpointId,
            description
        });

        return checkpointId;
    }

    /**
     * Rollback session to a previous checkpoint
     */
    async rollbackToCheckpoint(sessionId, checkpointId = null) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (!session.controlState.allowRollbacks) {
            throw new Error('Rollbacks not allowed for this session');
        }

        const checkpoints = this.sessionCheckpoints.get(sessionId);
        if (!checkpoints || checkpoints.length === 0) {
            throw new Error('No checkpoints available for rollback');
        }

        // Find target checkpoint (latest if not specified)
        const targetCheckpoint = checkpointId 
            ? checkpoints.find(cp => cp.checkpointId === checkpointId)
            : checkpoints[checkpoints.length - 1];

        if (!targetCheckpoint) {
            throw new Error('Checkpoint not found');
        }

        // Store current state for potential redo
        const currentState = this.captureSessionState(session);
        this.addToUndoHistory(sessionId, {
            action: 'rollback',
            fromState: currentState,
            toCheckpoint: targetCheckpoint.checkpointId,
            timestamp: new Date().toISOString()
        });

        // Restore session state
        session.currentState = {
            conversation: targetCheckpoint.sessionState.conversation || [],
            agentStates: targetCheckpoint.agentStates || {},
            pendingActions: targetCheckpoint.pendingActions || [],
            collaborationLoops: targetCheckpoint.sessionState.collaborationLoops || []
        };

        // Remove newer checkpoints
        const checkpointIndex = checkpoints.findIndex(cp => cp.checkpointId === checkpointId);
        if (checkpointIndex >= 0) {
            checkpoints.splice(checkpointIndex + 1);
        }

        this.tracer.logEvent('SESSION_ROLLBACK', {
            sessionId,
            targetCheckpointId: targetCheckpoint.checkpointId,
            rollbackTimestamp: new Date().toISOString()
        });

        return {
            success: true,
            checkpointId: targetCheckpoint.checkpointId,
            rollbackTime: targetCheckpoint.timestamp,
            stateRestored: true,
            conversationTruncated: session.currentState.conversation.length
        };
    }

    /**
     * Undo the last action or set of actions
     */
    async undoLastAction(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (!session.controlState.allowUndo) {
            throw new Error('Undo not allowed for this session');
        }

        const undoHistory = this.undoHistory.get(sessionId);
        if (!undoHistory || undoHistory.length === 0) {
            throw new Error('No actions available to undo');
        }

        const lastAction = undoHistory[undoHistory.length - 1];
        
        // Handle different types of undo operations
        let undoResult;
        switch (lastAction.action) {
            case 'agent_response':
                undoResult = await this.undoAgentResponse(session, lastAction);
                break;
                
            case 'collaboration_loop':
                undoResult = await this.undoCollaborationLoop(session, lastAction);
                break;
                
            case 'model_switch':
                undoResult = await this.undoModelSwitch(session, lastAction);
                break;
                
            case 'rollback':
                undoResult = await this.redoFromRollback(session, lastAction);
                break;
                
            default:
                throw new Error(`Cannot undo action of type: ${lastAction.action}`);
        }

        // Remove from undo history
        undoHistory.pop();

        this.tracer.logEvent('ACTION_UNDONE', {
            sessionId,
            undoneAction: lastAction,
            undoResult
        });

        return undoResult;
    }

    /**
     * Get summary of session state for user review
     */
    getSessionSummary(sessionId, includeHistory = false) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const checkpoints = this.sessionCheckpoints.get(sessionId);
        const undoHistory = this.undoHistory.get(sessionId);

        const summary = {
            sessionId,
            status: session.status,
            startTime: session.startTime,
            currentTime: new Date().toISOString(),
            conversationLength: session.currentState.conversation.length,
            activeAgents: this.getActiveAgents(session),
            pendingActions: session.currentState.pendingActions.length,
            collaborationLoops: session.currentState.collaborationLoops.length,
            controls: {
                checkpointsAvailable: checkpoints?.length || 0,
                undoActionsAvailable: undoHistory?.length || 0,
                canInterrupt: session.controlState.allowInterrupts,
                canRollback: session.controlState.allowRollbacks,
                canUndo: session.controlState.allowUndo
            }
        };

        if (includeHistory) {
            summary.recentActions = this.getRecentActions(session, 5);
            summary.availableCheckpoints = checkpoints?.map(cp => ({
                id: cp.checkpointId,
                timestamp: cp.timestamp,
                description: cp.description
            })) || [];
        }

        return summary;
    }

    /**
     * Navigate through conversation history with user controls
     */
    navigateConversationHistory(sessionId, direction = 'back', steps = 1) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const conversation = session.currentState.conversation;
        const currentIndex = session.currentState.conversationIndex || conversation.length - 1;
        
        let newIndex;
        if (direction === 'back') {
            newIndex = Math.max(0, currentIndex - steps);
        } else if (direction === 'forward') {
            newIndex = Math.min(conversation.length - 1, currentIndex + steps);
        } else {
            newIndex = parseInt(direction); // Absolute position
        }

        session.currentState.conversationIndex = newIndex;
        
        const contextWindow = this.getConversationContext(conversation, newIndex, 3);

        return {
            currentIndex: newIndex,
            totalLength: conversation.length,
            context: contextWindow,
            canGoBack: newIndex > 0,
            canGoForward: newIndex < conversation.length - 1
        };
    }

    /**
     * Export session for user review and approval
     */
    async exportSessionForReview(sessionId, format = 'json') {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const exportData = {
            session: {
                id: sessionId,
                startTime: session.startTime,
                status: session.status
            },
            conversation: session.currentState.conversation,
            agentActions: this.extractAgentActions(session),
            proposedChanges: this.extractProposedChanges(session),
            userApprovalRequired: this.identifyApprovalRequiredItems(session)
        };

        if (format === 'markdown') {
            return this.formatAsMarkdown(exportData);
        } else if (format === 'html') {
            return this.formatAsHTML(exportData);
        } else {
            return exportData;
        }
    }

    // Private helper methods

    captureSessionState(session) {
        return {
            conversation: [...session.currentState.conversation],
            agentStates: { ...session.currentState.agentStates },
            pendingActions: [...session.currentState.pendingActions],
            collaborationLoops: [...session.currentState.collaborationLoops],
            timestamp: new Date().toISOString()
        };
    }

    getActiveAgents(session) {
        return Object.keys(session.currentState.agentStates || {});
    }

    hasCheckpoints(sessionId) {
        const checkpoints = this.sessionCheckpoints.get(sessionId);
        return checkpoints && checkpoints.length > 0;
    }

    hasUndoHistory(sessionId) {
        const undoHistory = this.undoHistory.get(sessionId);
        return undoHistory && undoHistory.length > 0;
    }

    addToUndoHistory(sessionId, action) {
        const undoHistory = this.undoHistory.get(sessionId);
        undoHistory.push(action);

        // Keep only recent actions
        if (undoHistory.length > this.maxUndoSteps) {
            undoHistory.shift();
        }
    }

    startAutoCheckpointing(sessionId) {
        const interval = setInterval(() => {
            const session = this.activeSessions.get(sessionId);
            if (!session || session.status === 'ended') {
                clearInterval(interval);
                return;
            }

            try {
                this.createCheckpoint(sessionId, 'Auto checkpoint');
            } catch (error) {
                // Silently handle checkpoint errors
            }
        }, this.autoCheckpointInterval);
    }

    async stopAllAgentProcessing(session) {
        // Implementation would send stop signals to active agents
        session.currentState.pendingActions = [];
        session.currentState.collaborationLoops.forEach(loop => {
            loop.status = 'interrupted';
        });
    }

    async pauseAgentProcessing(session) {
        // Implementation would pause agents while preserving state
        session.currentState.agentStates.paused = true;
    }

    async redirectAgentProcessing(session, newInstruction) {
        // Implementation would redirect agents to new instruction
        session.currentState.pendingActions.push({
            type: 'redirect',
            instruction: newInstruction,
            timestamp: new Date().toISOString()
        });
    }

    async cancelCurrentOperations(session) {
        // Implementation would cancel all current operations
        session.currentState.pendingActions = [];
        session.currentState.collaborationLoops = [];
    }

    async rollbackToLastCheckpoint(sessionId) {
        const checkpoints = this.sessionCheckpoints.get(sessionId);
        if (checkpoints && checkpoints.length > 0) {
            const lastCheckpoint = checkpoints[checkpoints.length - 1];
            return await this.rollbackToCheckpoint(sessionId, lastCheckpoint.checkpointId);
        }
    }

    async undoAgentResponse(session, action) {
        // Remove the last agent response from conversation
        const conversation = session.currentState.conversation;
        if (conversation.length > 0 && conversation[conversation.length - 1].type === 'agent_response') {
            conversation.pop();
        }
        return { success: true, type: 'agent_response_removed' };
    }

    async undoCollaborationLoop(session, action) {
        // Remove the last collaboration loop
        session.currentState.collaborationLoops.pop();
        return { success: true, type: 'collaboration_loop_removed' };
    }

    async undoModelSwitch(session, action) {
        // Revert model switch
        if (action.previousModel) {
            session.currentState.agentStates[action.agent] = {
                ...session.currentState.agentStates[action.agent],
                model: action.previousModel
            };
        }
        return { success: true, type: 'model_switch_reverted' };
    }

    async redoFromRollback(session, action) {
        // Restore state from before rollback
        if (action.fromState) {
            session.currentState = action.fromState;
        }
        return { success: true, type: 'rollback_undone' };
    }

    getRecentActions(session, count = 5) {
        const conversation = session.currentState.conversation;
        return conversation.slice(-count).map(item => ({
            type: item.type,
            timestamp: item.timestamp,
            agent: item.agent,
            summary: item.content?.substring(0, 100) + '...'
        }));
    }

    getConversationContext(conversation, index, windowSize = 3) {
        const start = Math.max(0, index - windowSize);
        const end = Math.min(conversation.length, index + windowSize + 1);
        return conversation.slice(start, end);
    }

    extractAgentActions(session) {
        return session.currentState.conversation
            .filter(item => item.type === 'agent_response')
            .map(item => ({
                agent: item.agent,
                timestamp: item.timestamp,
                action: item.action,
                summary: item.content?.substring(0, 200) + '...'
            }));
    }

    extractProposedChanges(session) {
        return session.currentState.pendingActions
            .filter(action => action.type === 'proposed_change')
            .map(action => ({
                description: action.description,
                impact: action.impact,
                requiresApproval: action.requiresApproval
            }));
    }

    identifyApprovalRequiredItems(session) {
        return session.currentState.pendingActions
            .filter(action => action.requiresApproval)
            .map(action => ({
                id: action.id,
                description: action.description,
                risk: action.risk || 'low'
            }));
    }

    formatAsMarkdown(exportData) {
        // Implementation would format the export data as markdown
        return `# Session Export\n\n...`; // Simplified
    }

    formatAsHTML(exportData) {
        // Implementation would format the export data as HTML
        return `<html>...</html>`; // Simplified
    }
}

export default UserControlManager;
