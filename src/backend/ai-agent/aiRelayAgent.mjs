// backend/ai-agent/aiRelayAgent.mjs
/**
 * AI Relay Agent - Main orchestrator for dual-agent system
 * Coordinates Navigator and Architect agents with privacy and governance controls
 */

import logger from '../utils/logging/logger.mjs';
import AgentNavigator from './agentNavigator.mjs';
import AgentArchitect from './agentArchitect.mjs';
import AgentLLMBridge from './agentLLMBridge.mjs';
import AgentLocalIndex from './agentLocalIndex.mjs';
import AgentCollaborationLoop from './agentCollaborationLoop.mjs';
import AgentModelSwitcher from './agentModelSwitcher.mjs';
import AgentFailureRecovery from './agentFailureRecovery.mjs';
import { promises as fs } from 'fs';
import path from 'path';

const aiAgentLogger = logger.child({ module: 'ai-relay-agent' });

/**
 * Main AI Relay Agent system
 */
export class AIRelayAgent {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), 'src/backend/ai-agent');
    this.isInitialized = false;
    
    // Core components
    this.llmBridge = null;
    this.localIndex = null;
    this.navigator = null;
    this.architect = null;
    this.collaborationLoop = null;
    this.modelSwitcher = null;
    this.failureRecovery = null;
    
    // System state
    this.memoryPolicy = null;
    this.activeSessions = new Map();
    this.systemStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      startTime: new Date().toISOString()
    };
    
    this.initialize();
  }

  /**
   * Initialize the AI Relay Agent system
   */
  async initialize() {
    try {
      aiAgentLogger.info('Initializing AI Relay Agent system');

      // Load memory policy
      await this.loadMemoryPolicy();

      // Initialize core components
      this.llmBridge = new AgentLLMBridge({ configPath: this.baseDir });
      this.localIndex = new AgentLocalIndex({ 
        baseDir: path.join(process.cwd(), 'data', 'ai-agent') 
      });
      this.modelSwitcher = new AgentModelSwitcher({ configPath: this.baseDir });
      this.failureRecovery = new AgentFailureRecovery();

      // Initialize agents with shared components
      this.navigator = new AgentNavigator({
        llmBridge: this.llmBridge,
        localIndex: this.localIndex
      });
      
      this.architect = new AgentArchitect({
        llmBridge: this.llmBridge,
        localIndex: this.localIndex
      });

      // Initialize collaboration system
      this.collaborationLoop = new AgentCollaborationLoop({
        navigator: this.navigator,
        architect: this.architect
      });

      // Perform initial codebase indexing
      await this.initializeCodebaseIndex();

      this.isInitialized = true;
      
      aiAgentLogger.info('AI Relay Agent system initialized successfully', {
        components: [
          'LLM Bridge',
          'Local Index', 
          'Navigator Agent',
          'Architect Agent',
          'Collaboration Loop',
          'Model Switcher',
          'Failure Recovery'
        ]
      });
    } catch (error) {
      aiAgentLogger.error('Failed to initialize AI Relay Agent system', { error });
      throw error;
    }
  }

  /**
   * Load memory policy configuration
   */
  async loadMemoryPolicy() {
    try {
      const policyPath = path.join(this.baseDir, 'agentMemoryPolicy.json');
      const policyContent = await fs.readFile(policyPath, 'utf8');
      this.memoryPolicy = JSON.parse(policyContent);
      
      aiAgentLogger.info('Memory policy loaded', {
        storeSessionContext: this.memoryPolicy.storeSessionContext,
        storeLongTermMemory: this.memoryPolicy.storeLongTermMemory,
        fineTuningOptOut: this.memoryPolicy.fineTuningOptOut
      });
    } catch (error) {
      aiAgentLogger.error('Failed to load memory policy', { error });
      throw error;
    }
  }

  /**
   * Initialize codebase indexing
   */
  async initializeCodebaseIndex() {
    try {
      aiAgentLogger.info('Starting codebase indexing for semantic search');
      
      const indexStats = await this.localIndex.getStats();
      if (indexStats.totalFiles === 0) {
        aiAgentLogger.info('No existing index found, performing full codebase indexing');
        await this.localIndex.indexCodebase();
      } else {
        aiAgentLogger.info('Using existing codebase index', {
          files: indexStats.totalFiles,
          chunks: indexStats.totalChunks
        });
      }
    } catch (error) {
      aiAgentLogger.warn('Codebase indexing failed, continuing without semantic search', { error });
    }
  }

  /**
   * Process user query with appropriate agent
   */
  async processQuery(userId, query, context = {}) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    const sessionId = context.sessionId || this.generateSessionId();
    
    try {
      this.systemStats.totalRequests++;
      
      aiAgentLogger.info('Processing user query', {
        userId: userId ? '[REDACTED]' : null,
        sessionId,
        queryLength: query.length,
        queryType: this.classifyQuery(query)
      });

      // Check privacy compliance
      this.enforcePrivacyPolicy(userId, query, context);

      // Route to appropriate processing method
      const queryType = this.classifyQuery(query);
      let result;

      if (queryType === 'development' || queryType === 'complex') {
        // Use collaboration loop for development/complex requests
        result = await this.processCollaborativeQuery(userId, query, context, sessionId);
      } else {
        // Use single agent for simple requests
        result = await this.processSingleAgentQuery(userId, query, context, sessionId);
      }

      // Update session and statistics
      this.updateSession(sessionId, userId, query, result);
      this.systemStats.successfulRequests++;

      return {
        sessionId,
        result,
        metadata: {
          agentSystem: 'dual-agent',
          queryType,
          privacy: 'enforced',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.systemStats.failedRequests++;
      aiAgentLogger.error('Query processing failed', { 
        userId: userId ? '[REDACTED]' : null,
        sessionId,
        error 
      });

      // Try graceful error recovery
      return await this.handleQueryError(userId, query, error, sessionId);
    }
  }

  /**
   * Process query requiring agent collaboration
   */
  async processCollaborativeQuery(userId, query, context, sessionId) {
    try {
      return await this.failureRecovery.executeWithRecovery(
        'collaborative-query',
        async () => {
          return await this.collaborationLoop.startCollaboration(userId, query, {
            ...context,
            sessionId
          });
        },
        {
          userId,
          query,
          sessionId,
          agentType: 'collaboration'
        }
      );
    } catch (error) {
      aiAgentLogger.error('Collaborative query failed', { sessionId, error });
      throw error;
    }
  }

  /**
   * Process query with single agent
   */
  async processSingleAgentQuery(userId, query, context, sessionId) {
    try {
      const agentType = this.determineAgentType(query);
      const agent = agentType === 'architect' ? this.architect : this.navigator;

      return await this.failureRecovery.executeWithRecovery(
        `${agentType}-query`,
        async () => {
          if (agentType === 'architect') {
            return await agent.processImplementation(query, { 
              ...context, 
              userId, 
              sessionId 
            });
          } else {
            return await agent.processRequest(userId, query, { 
              ...context, 
              sessionId 
            });
          }
        },
        {
          userId,
          query,
          sessionId,
          agentType,
          llmBridge: this.llmBridge,
          prompt: query
        }
      );
    } catch (error) {
      aiAgentLogger.error('Single agent query failed', { sessionId, agentType: this.determineAgentType(query), error });
      throw error;
    }
  }

  /**
   * Classify query type for routing decisions
   */
  classifyQuery(query) {
    const text = query.toLowerCase();
    
    if (text.includes('build') || text.includes('implement') || text.includes('create code') || text.includes('develop')) {
      return 'development';
    }
    if (text.includes('explain') && (text.includes('how') || text.includes('why'))) {
      return 'explanation';
    }
    if (text.includes('help') || text.includes('assist') || text.includes('guide')) {
      return 'assistance';
    }
    if (text.length > 500 || text.split('and').length > 3) {
      return 'complex';
    }
    
    return 'simple';
  }

  /**
   * Determine which single agent should handle the query
   */
  determineAgentType(query) {
    const text = query.toLowerCase();
    
    if (text.includes('code') || text.includes('implement') || text.includes('architecture') || 
        text.includes('module') || text.includes('api') || text.includes('refactor')) {
      return 'architect';
    }
    
    return 'navigator';
  }

  /**
   * Enforce privacy policy compliance
   */
  enforcePrivacyPolicy(userId, query, context) {
    // Check if user has opted out of memory storage
    const userRole = context.userRole || 'citizen';
    const memoryConfig = this.memoryPolicy.memoryPerRole[userRole];
    
    if (memoryConfig === 'session-only') {
      // Ensure no long-term storage
      context.noLongTermMemory = true;
    }

    // Scrub sensitive data from query if it will be sent to cloud LLM
    if (this.memoryPolicy.sharePromptWithLLM.stripUserId && userId) {
      // This will be handled by LLM Bridge during actual API calls
    }

    // Log privacy enforcement
    aiAgentLogger.debug('Privacy policy enforced', {
      userId: userId ? '[REDACTED]' : null,
      userRole,
      memoryConfig,
      scrubIdentity: this.memoryPolicy.sharePromptWithLLM.stripUserId
    });
  }

  /**
   * Handle query processing errors with graceful degradation
   */
  async handleQueryError(userId, query, error, sessionId) {
    try {
      // Generate graceful error response
      const gracefulResponse = {
        agentType: 'error-handler',
        response: this.generateGracefulErrorMessage(error),
        metadata: {
          isError: true,
          errorType: this.classifyError(error),
          canRetry: this.canRetryError(error),
          timestamp: new Date().toISOString()
        },
        suggestions: this.generateErrorSuggestions(error)
      };

      return {
        sessionId,
        result: gracefulResponse,
        metadata: {
          agentSystem: 'error-recovery',
          privacy: 'enforced',
          timestamp: new Date().toISOString()
        }
      };
    } catch (recoveryError) {
      aiAgentLogger.error('Error recovery failed', { sessionId, recoveryError });
      
      // Final fallback
      return {
        sessionId,
        result: {
          agentType: 'fallback',
          response: "I'm experiencing technical difficulties. Please try again later or contact support.",
          metadata: {
            isError: true,
            errorType: 'system-failure',
            canRetry: true,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }

  /**
   * Generate user-friendly error message
   */
  generateGracefulErrorMessage(error) {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'network':
        return "I'm having trouble connecting to my AI services. Please check your internet connection and try again.";
      case 'rate-limit':
        return "I'm currently experiencing high demand. Please wait a moment and try again.";
      case 'permission':
        return "I don't have permission to perform this action. Please check your access rights.";
      case 'memory':
        return "Your request is too complex for me to process right now. Try breaking it into smaller parts.";
      default:
        return "I encountered an unexpected issue. Please try again or rephrase your request.";
    }
  }

  /**
   * Classify error for appropriate handling
   */
  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('timeout')) return 'network';
    if (message.includes('rate limit') || message.includes('quota')) return 'rate-limit';
    if (message.includes('permission') || message.includes('unauthorized')) return 'permission';
    if (message.includes('memory') || message.includes('too large')) return 'memory';
    
    return 'unknown';
  }

  /**
   * Check if error is retryable
   */
  canRetryError(error) {
    const errorType = this.classifyError(error);
    return ['network', 'rate-limit', 'memory'].includes(errorType);
  }

  /**
   * Generate error recovery suggestions
   */
  generateErrorSuggestions(error) {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'network':
        return ['Check your internet connection', 'Try again in a moment', 'Use offline features if available'];
      case 'rate-limit':
        return ['Wait a moment and try again', 'Simplify your request', 'Try during off-peak hours'];
      case 'memory':
        return ['Break your request into smaller parts', 'Use simpler language', 'Focus on one task at a time'];
      default:
        return ['Try rephrasing your request', 'Check for typos', 'Contact support if the issue persists'];
    }
  }

  /**
   * Update session information
   */
  updateSession(sessionId, userId, query, result) {
    if (!this.memoryPolicy.storeSessionContext) {
      return;
    }

    const session = this.activeSessions.get(sessionId) || {
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      interactions: []
    };

    session.interactions.push({
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      result: result.agentType || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Limit session history
    if (session.interactions.length > 10) {
      session.interactions = session.interactions.slice(-10);
    }

    this.activeSessions.set(sessionId, session);

    // Clean up old sessions
    this.cleanupOldSessions();
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [sessionId, session] of this.activeSessions) {
      const sessionAge = now - new Date(session.startTime).getTime();
      if (sessionAge > maxAge) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Switch model for an agent
   */
  async switchAgentModel(agentType, modelName, userId = null, sessionId = null) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    return await this.modelSwitcher.switchModel(agentType, modelName, userId, sessionId);
  }

  /**
   * Get available models for agent
   */
  getAvailableModels(agentType) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    return this.modelSwitcher.getAvailableModels(agentType);
  }

  /**
   * Get current model for agent
   */
  getCurrentModel(agentType, userId = null, sessionId = null) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    return this.modelSwitcher.getCurrentModel(agentType, userId, sessionId);
  }

  /**
   * Resume a paused collaboration
   */
  async resumeCollaboration(sessionId, userApproval = true) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    return await this.collaborationLoop.resumeCollaboration(sessionId, userApproval);
  }

  /**
   * Cancel an active collaboration
   */
  cancelCollaboration(sessionId) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    return this.collaborationLoop.cancelCollaboration(sessionId);
  }

  /**
   * Get active collaborations for user
   */
  getActiveCollaborations(userId) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    return this.collaborationLoop.getActiveCollaborations(userId);
  }

  /**
   * Clear user data for privacy compliance
   */
  async clearUserData(userId) {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    try {
      // Clear data from all components
      this.navigator.clearUserData(userId);
      this.architect.clearUserData(userId);
      this.collaborationLoop.clearUserData(userId);
      await this.modelSwitcher.clearUserData(userId);

      // Clear sessions
      for (const [sessionId, session] of this.activeSessions) {
        if (session.userId === userId) {
          this.activeSessions.delete(sessionId);
        }
      }

      aiAgentLogger.info('User data cleared from AI agent system', {
        userId: '[REDACTED]'
      });

      return true;
    } catch (error) {
      aiAgentLogger.error('Failed to clear user data', { error });
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    if (!this.isInitialized) {
      return { status: 'not-initialized' };
    }

    try {
      const [llmHealth, indexStats, modelHealth, failureStats] = await Promise.all([
        this.llmBridge.healthCheck(),
        this.localIndex.getStats(),
        this.modelSwitcher.getAvailableModels('navigator'),
        this.failureRecovery.getFailureStats()
      ]);

      return {
        status: 'healthy',
        components: {
          llmBridge: llmHealth,
          localIndex: indexStats,
          modelSwitcher: modelHealth.length > 0,
          failureRecovery: failureStats.totalFailures < 10
        },
        systemStats: this.systemStats,
        uptime: Date.now() - new Date(this.systemStats.startTime).getTime(),
        activeSessions: this.activeSessions.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      ...this.systemStats,
      uptime: Date.now() - new Date(this.systemStats.startTime).getTime(),
      activeSessions: this.activeSessions.size,
      successRate: this.systemStats.totalRequests > 0 
        ? (this.systemStats.successfulRequests / this.systemStats.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      collaborationStats: this.collaborationLoop.getCollaborationStats(),
      failureStats: this.failureRecovery.getFailureStats()
    };
  }

  /**
   * Perform system maintenance
   */
  async performMaintenance() {
    if (!this.isInitialized) {
      throw new Error('AI Relay Agent system not initialized');
    }

    try {
      aiAgentLogger.info('Starting system maintenance');

      // Clean up old sessions
      this.cleanupOldSessions();

      // Clean up expired model overrides
      await this.modelSwitcher.cleanupExpiredOverrides();

      // Clear old failure history
      this.failureRecovery.clearFailureHistory();

      // Update codebase index if needed
      const indexStats = await this.localIndex.getStats();
      if (indexStats.totalFiles === 0) {
        await this.localIndex.indexCodebase();
      }

      aiAgentLogger.info('System maintenance completed');
      return true;
    } catch (error) {
      aiAgentLogger.error('System maintenance failed', { error });
      throw error;
    }
  }

  /**
   * Shutdown the AI Relay Agent system
   */
  async shutdown() {
    try {
      aiAgentLogger.info('Shutting down AI Relay Agent system');

      // Cancel all active collaborations
      const activeCollaborations = this.collaborationLoop.getActiveCollaborations();
      for (const collaboration of activeCollaborations) {
        this.collaborationLoop.cancelCollaboration(collaboration.sessionId);
      }

      // Clear all sessions
      this.activeSessions.clear();

      this.isInitialized = false;
      
      aiAgentLogger.info('AI Relay Agent system shutdown completed');
    } catch (error) {
      aiAgentLogger.error('Error during shutdown', { error });
      throw error;
    }
  }
}

export default AIRelayAgent;
