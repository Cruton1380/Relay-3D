// backend/ai-agent/agentCollaborationLoop.mjs
/**
 * Agent Collaboration Loop - Manages dual-agent interaction and coordination
 * Handles Navigator-Architect collaboration, loop detection, and workflow automation
 */

import logger from '../utils/logging/logger.mjs';
import AgentNavigator from './agentNavigator.mjs';
import AgentArchitect from './agentArchitect.mjs';

const collaborationLogger = logger.child({ module: 'ai-agent-collaboration' });

/**
 * Dual-agent collaboration orchestrator
 */
export class AgentCollaborationLoop {
  constructor(options = {}) {
    this.navigator = options.navigator || new AgentNavigator();
    this.architect = options.architect || new AgentArchitect();
    this.maxIterations = options.maxIterations || 10;
    this.loopDetectionThreshold = options.loopDetectionThreshold || 5;
    
    this.activeCollaborations = new Map();
    this.collaborationHistory = new Map();
  }

  /**
   * Start a new collaboration session
   */
  async startCollaboration(userId, request, context = {}) {
    try {
      const sessionId = this.generateSessionId();
      
      collaborationLogger.info('Starting collaboration session', {
        sessionId,
        userId: userId ? '[REDACTED]' : null,
        requestType: this.classifyCollaborationRequest(request)
      });

      const collaboration = {
        sessionId,
        userId,
        originalRequest: request,
        context,
        status: 'active',
        iterations: [],
        startTime: new Date().toISOString(),
        currentAgent: 'navigator'
      };

      this.activeCollaborations.set(sessionId, collaboration);

      // Start with Navigator processing the request
      const result = await this.executeCollaborationLoop(sessionId);
      
      return {
        sessionId,
        result,
        metadata: {
          totalIterations: collaboration.iterations.length,
          duration: Date.now() - new Date(collaboration.startTime).getTime(),
          finalAgent: collaboration.currentAgent
        }
      };
    } catch (error) {
      collaborationLogger.error('Collaboration session failed', { error });
      throw error;
    }
  }

  /**
   * Execute the main collaboration loop
   */
  async executeCollaborationLoop(sessionId) {
    const collaboration = this.activeCollaborations.get(sessionId);
    if (!collaboration) {
      throw new Error(`Collaboration session not found: ${sessionId}`);
    }

    let currentRequest = collaboration.originalRequest;
    let iterationCount = 0;

    while (iterationCount < this.maxIterations && collaboration.status === 'active') {
      iterationCount++;
      
      // Check for infinite loops
      if (this.detectInfiniteLoop(collaboration)) {
        collaborationLogger.warn('Infinite loop detected, breaking collaboration', {
          sessionId,
          iterations: iterationCount
        });
        break;
      }

      // Execute current iteration
      const iteration = await this.executeIteration(
        collaboration, 
        currentRequest, 
        iterationCount
      );

      collaboration.iterations.push(iteration);

      // Determine next action
      const nextAction = this.determineNextAction(collaboration, iteration);
      
      if (nextAction.action === 'complete') {
        collaboration.status = 'completed';
        break;
      } else if (nextAction.action === 'continue') {
        currentRequest = nextAction.nextRequest;
        collaboration.currentAgent = nextAction.nextAgent;
      } else if (nextAction.action === 'pause') {
        collaboration.status = 'awaiting_approval';
        break;
      }
    }

    // Finalize collaboration
    const result = this.finalizeCollaboration(collaboration);
    this.archiveCollaboration(collaboration);

    return result;
  }

  /**
   * Execute a single collaboration iteration
   */
  async executeIteration(collaboration, request, iterationCount) {
    try {
      collaborationLogger.debug('Executing collaboration iteration', {
        sessionId: collaboration.sessionId,
        iteration: iterationCount,
        agent: collaboration.currentAgent
      });

      const iteration = {
        number: iterationCount,
        agent: collaboration.currentAgent,
        request,
        timestamp: new Date().toISOString()
      };

      if (collaboration.currentAgent === 'navigator') {
        // Navigator processes request and potentially delegates to Architect
        const navigatorResult = await this.navigator.processRequest(
          collaboration.userId,
          request,
          { 
            ...collaboration.context,
            sessionId: collaboration.sessionId,
            iteration: iterationCount
          }
        );

        iteration.navigatorResult = navigatorResult;

        // Check if Navigator wants to involve Architect
        if (this.shouldInvolveArchitect(navigatorResult)) {
          iteration.architectRequest = this.generateArchitectRequest(navigatorResult);
          collaboration.currentAgent = 'architect';
        } else {
          iteration.complete = true;
        }

      } else if (collaboration.currentAgent === 'architect') {
        // Architect implements solution and reports back to Navigator
        const architectResult = await this.architect.processImplementation(
          request,
          {
            ...collaboration.context,
            sessionId: collaboration.sessionId,
            iteration: iterationCount,
            fromNavigator: true
          }
        );

        iteration.architectResult = architectResult;

        // Generate summary for Navigator review
        iteration.navigatorReviewRequest = this.generateNavigatorReview(architectResult);
        collaboration.currentAgent = 'navigator';
      }

      return iteration;
    } catch (error) {
      collaborationLogger.error('Iteration execution failed', {
        sessionId: collaboration.sessionId,
        iteration: iterationCount,
        error
      });
      
      return {
        number: iterationCount,
        agent: collaboration.currentAgent,
        request,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Detect infinite loops in collaboration
   */
  detectInfiniteLoop(collaboration) {
    if (collaboration.iterations.length < this.loopDetectionThreshold) {
      return false;
    }

    // Check for repeated patterns in the last few iterations
    const recentIterations = collaboration.iterations.slice(-this.loopDetectionThreshold);
    const patterns = [];

    for (const iteration of recentIterations) {
      const pattern = {
        agent: iteration.agent,
        hasError: !!iteration.error,
        hasArchitectRequest: !!iteration.architectRequest,
        hasComplete: !!iteration.complete
      };
      patterns.push(JSON.stringify(pattern));
    }

    // Check if we have repeating patterns
    const patternCounts = {};
    for (const pattern of patterns) {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }

    return Object.values(patternCounts).some(count => count >= 3);
  }

  /**
   * Determine next action in collaboration
   */
  determineNextAction(collaboration, iteration) {
    // If iteration has error, try to recover
    if (iteration.error) {
      return {
        action: 'continue',
        nextAgent: collaboration.currentAgent === 'navigator' ? 'architect' : 'navigator',
        nextRequest: `Please help resolve this error: ${iteration.error}`
      };
    }

    // If Navigator completed without needing Architect
    if (iteration.complete && collaboration.currentAgent === 'navigator') {
      return { action: 'complete' };
    }

    // If Architect completed implementation
    if (iteration.architectResult && iteration.architectResult.implementation) {
      if (iteration.architectResult.implementation.errors.length > 0) {
        return {
          action: 'continue',
          nextAgent: 'navigator',
          nextRequest: iteration.navigatorReviewRequest || 'Please review the implementation results and suggest next steps.'
        };
      } else {
        return { action: 'complete' };
      }
    }

    // If Navigator wants Architect involvement
    if (iteration.architectRequest) {
      return {
        action: 'continue',
        nextAgent: 'architect',
        nextRequest: iteration.architectRequest
      };
    }

    // If we need user approval for implementation
    if (iteration.architectResult && !iteration.architectResult.implementation) {
      return { action: 'pause' };
    }

    // Default to continuing
    return {
      action: 'continue',
      nextAgent: collaboration.currentAgent === 'navigator' ? 'architect' : 'navigator',
      nextRequest: 'Please continue with the next step.'
    };
  }

  /**
   * Check if Navigator result should involve Architect
   */
  shouldInvolveArchitect(navigatorResult) {
    const response = navigatorResult.response.toLowerCase();
    
    return response.includes('implement') ||
           response.includes('code') ||
           response.includes('build') ||
           response.includes('create module') ||
           response.includes('architect') ||
           navigatorResult.metadata?.requiresArchitect;
  }

  /**
   * Generate request for Architect based on Navigator result
   */
  generateArchitectRequest(navigatorResult) {
    if (navigatorResult.metadata?.architectInstructions) {
      return navigatorResult.metadata.architectInstructions.requirements;
    }

    return `Please implement the following based on user requirements: ${navigatorResult.response.substring(0, 500)}`;
  }

  /**
   * Generate Navigator review request based on Architect result
   */
  generateNavigatorReview(architectResult) {
    const summary = architectResult.navigatorSummary;
    
    if (summary?.errors?.length > 0) {
      return `The implementation completed with errors: ${summary.errors.map(e => e.error).join(', ')}. Please suggest how to proceed.`;
    }

    if (summary?.status === 'completed') {
      return `Implementation completed successfully. ${summary.details}. Please summarize the results for the user.`;
    }

    return `Please review the implementation plan and coordinate next steps: ${JSON.stringify(summary)}`;
  }

  /**
   * Finalize collaboration and generate final result
   */
  finalizeCollaboration(collaboration) {
    const lastIteration = collaboration.iterations[collaboration.iterations.length - 1];
    
    let finalResult = {
      status: collaboration.status,
      summary: 'Collaboration completed',
      details: '',
      deliverables: []
    };

    if (lastIteration?.navigatorResult) {
      finalResult.summary = lastIteration.navigatorResult.response.substring(0, 200);
      finalResult.details = lastIteration.navigatorResult.response;
    }

    if (lastIteration?.architectResult?.implementation) {
      finalResult.deliverables = [
        ...lastIteration.architectResult.implementation.createdFiles.map(f => ({
          type: 'file',
          name: f.filename,
          description: f.description
        })),
        ...lastIteration.architectResult.implementation.modifiedFiles.map(f => ({
          type: 'modification',
          name: f.filename,
          description: f.description
        }))
      ];
    }

    // Generate collaboration analytics
    finalResult.analytics = {
      totalIterations: collaboration.iterations.length,
      navigatorIterations: collaboration.iterations.filter(i => i.agent === 'navigator').length,
      architectIterations: collaboration.iterations.filter(i => i.agent === 'architect').length,
      errorCount: collaboration.iterations.filter(i => i.error).length,
      duration: Date.now() - new Date(collaboration.startTime).getTime()
    };

    return finalResult;
  }

  /**
   * Archive completed collaboration
   */
  archiveCollaboration(collaboration) {
    // Remove from active collaborations
    this.activeCollaborations.delete(collaboration.sessionId);
    
    // Store in history
    const history = this.collaborationHistory.get(collaboration.userId) || [];
    history.push({
      sessionId: collaboration.sessionId,
      originalRequest: collaboration.originalRequest,
      status: collaboration.status,
      iterationCount: collaboration.iterations.length,
      startTime: collaboration.startTime,
      endTime: new Date().toISOString()
    });

    // Keep only last 20 collaborations per user
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.collaborationHistory.set(collaboration.userId, history);

    collaborationLogger.info('Collaboration archived', {
      sessionId: collaboration.sessionId,
      status: collaboration.status,
      iterations: collaboration.iterations.length
    });
  }

  /**
   * Classify collaboration request type
   */
  classifyCollaborationRequest(request) {
    const text = request.toLowerCase();
    
    if (text.includes('build') || text.includes('implement') || text.includes('create')) {
      return 'development';
    }
    if (text.includes('explain') || text.includes('help') || text.includes('how')) {
      return 'explanation';
    }
    if (text.includes('fix') || text.includes('debug') || text.includes('error')) {
      return 'debugging';
    }
    
    return 'general';
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active collaboration sessions
   */
  getActiveCollaborations(userId = null) {
    if (userId) {
      return Array.from(this.activeCollaborations.values())
        .filter(c => c.userId === userId);
    }
    return Array.from(this.activeCollaborations.values());
  }

  /**
   * Get collaboration history
   */
  getCollaborationHistory(userId) {
    return this.collaborationHistory.get(userId) || [];
  }

  /**
   * Resume a paused collaboration
   */
  async resumeCollaboration(sessionId, userApproval = true) {
    const collaboration = this.activeCollaborations.get(sessionId);
    if (!collaboration) {
      throw new Error(`Collaboration session not found: ${sessionId}`);
    }

    if (collaboration.status !== 'awaiting_approval') {
      throw new Error(`Collaboration is not awaiting approval: ${collaboration.status}`);
    }

    collaboration.status = 'active';
    collaboration.context.approved = userApproval;

    if (userApproval) {
      return await this.executeCollaborationLoop(sessionId);
    } else {
      collaboration.status = 'cancelled';
      return { status: 'cancelled', reason: 'User declined approval' };
    }
  }

  /**
   * Cancel an active collaboration
   */
  cancelCollaboration(sessionId) {
    const collaboration = this.activeCollaborations.get(sessionId);
    if (collaboration) {
      collaboration.status = 'cancelled';
      this.archiveCollaboration(collaboration);
      return true;
    }
    return false;
  }

  /**
   * Clear user collaboration data
   */
  clearUserData(userId) {
    // Cancel active collaborations for user
    const userCollaborations = this.getActiveCollaborations(userId);
    for (const collaboration of userCollaborations) {
      this.cancelCollaboration(collaboration.sessionId);
    }

    // Clear history
    this.collaborationHistory.delete(userId);
    
    collaborationLogger.info('User collaboration data cleared', { userId: '[REDACTED]' });
  }

  /**
   * Get collaboration statistics
   */
  getCollaborationStats() {
    const active = this.activeCollaborations.size;
    const total = Array.from(this.collaborationHistory.values())
      .reduce((sum, history) => sum + history.length, 0);

    return {
      activeCollaborations: active,
      totalCollaborations: total,
      averageIterations: this.calculateAverageIterations(),
      successRate: this.calculateSuccessRate()
    };
  }

  /**
   * Calculate average iterations per collaboration
   */
  calculateAverageIterations() {
    const allHistory = Array.from(this.collaborationHistory.values()).flat();
    if (allHistory.length === 0) return 0;
    
    const totalIterations = allHistory.reduce((sum, collab) => sum + collab.iterationCount, 0);
    return Math.round(totalIterations / allHistory.length * 100) / 100;
  }

  /**
   * Calculate collaboration success rate
   */
  calculateSuccessRate() {
    const allHistory = Array.from(this.collaborationHistory.values()).flat();
    if (allHistory.length === 0) return 0;
    
    const successful = allHistory.filter(collab => collab.status === 'completed').length;
    return Math.round(successful / allHistory.length * 100);
  }
}

export default AgentCollaborationLoop;
