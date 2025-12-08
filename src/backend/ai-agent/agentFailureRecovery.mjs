// backend/ai-agent/agentFailureRecovery.mjs
/**
 * Agent Failure Recovery - Handles errors, retries, and graceful degradation
 * Provides robust error handling and recovery strategies for dual-agent system
 */

import logger from '../utils/logging/logger.mjs';

const recoveryLogger = logger.child({ module: 'ai-agent-failure-recovery' });

/**
 * Failure recovery and error handling system
 */
export class AgentFailureRecovery {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // milliseconds
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.circuitBreakerResetTime = options.circuitBreakerResetTime || 300000; // 5 minutes
    
    this.failureHistory = new Map();
    this.circuitBreakers = new Map();
    this.retryStrategies = new Map();
    
    this.setupDefaultStrategies();
  }

  /**
   * Setup default recovery strategies
   */
  setupDefaultStrategies() {
    // LLM API failures
    this.retryStrategies.set('llm-api-error', {
      maxRetries: 3,
      retryDelay: 2000,
      shouldRetry: (error) => error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT',
      fallbackAction: 'use-fallback-model'
    });

    // Model overload errors
    this.retryStrategies.set('model-overload', {
      maxRetries: 2,
      retryDelay: 5000,
      shouldRetry: (error) => error.message.includes('overloaded') || error.code === 'RATE_LIMIT',
      fallbackAction: 'use-local-model'
    });

    // Parsing errors
    this.retryStrategies.set('parsing-error', {
      maxRetries: 1,
      retryDelay: 1000,
      shouldRetry: (error) => error.message.includes('JSON') || error.message.includes('parse'),
      fallbackAction: 'simplify-request'
    });

    // Memory errors
    this.retryStrategies.set('memory-error', {
      maxRetries: 1,
      retryDelay: 500,
      shouldRetry: (error) => error.message.includes('memory') || error.code === 'OUT_OF_MEMORY',
      fallbackAction: 'clear-context'
    });

    // Permission errors
    this.retryStrategies.set('permission-error', {
      maxRetries: 0,
      shouldRetry: () => false,
      fallbackAction: 'abort-with-message'
    });
  }

  /**
   * Execute operation with retry and recovery logic
   */
  async executeWithRecovery(operationName, operation, context = {}) {
    const operationId = this.generateOperationId();
    
    try {
      recoveryLogger.debug('Starting operation with recovery', {
        operationId,
        operationName,
        context: Object.keys(context)
      });

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(operationName)) {
        throw new Error(`Circuit breaker open for operation: ${operationName}`);
      }

      return await this.executeWithRetries(operationId, operationName, operation, context);
    } catch (error) {
      return await this.handleFinalFailure(operationId, operationName, error, context);
    }
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetries(operationId, operationName, operation, context) {
    const strategy = this.getRetryStrategy(operationName);
    let lastError = null;
    
    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt, strategy);
          recoveryLogger.info('Retrying operation', {
            operationId,
            operationName,
            attempt,
            delay
          });
          await this.sleep(delay);
        }

        const result = await operation();
        
        // Success - record recovery if this was a retry
        if (attempt > 0) {
          this.recordRecovery(operationName, attempt);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Record failure
        this.recordFailure(operationName, error);
        
        // Check if we should retry
        if (attempt < strategy.maxRetries && strategy.shouldRetry(error)) {
          recoveryLogger.warn('Operation failed, will retry', {
            operationId,
            operationName,
            attempt,
            error: error.message
          });
          continue;
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle final failure and attempt recovery
   */
  async handleFinalFailure(operationId, operationName, error, context) {
    recoveryLogger.error('Operation failed after retries', {
      operationId,
      operationName,
      error: error.message
    });

    const strategy = this.getRetryStrategy(operationName);
    
    try {
      // Attempt fallback action
      const fallbackResult = await this.executeFallbackAction(
        strategy.fallbackAction,
        operationName,
        error,
        context
      );
      
      if (fallbackResult.success) {
        recoveryLogger.info('Fallback action succeeded', {
          operationId,
          operationName,
          fallbackAction: strategy.fallbackAction
        });
        return fallbackResult.data;
      }
    } catch (fallbackError) {
      recoveryLogger.error('Fallback action failed', {
        operationId,
        operationName,
        fallbackError: fallbackError.message
      });
    }

    // Update circuit breaker
    this.updateCircuitBreaker(operationName);
    
    // Generate graceful error response
    return this.generateGracefulError(operationName, error, context);
  }

  /**
   * Execute fallback action based on strategy
   */
  async executeFallbackAction(action, operationName, error, context) {
    switch (action) {
      case 'use-fallback-model':
        return await this.useFallbackModel(context);
        
      case 'use-local-model':
        return await this.useLocalModel(context);
        
      case 'simplify-request':
        return await this.simplifyRequest(context);
        
      case 'clear-context':
        return await this.clearContext(context);
        
      case 'abort-with-message':
        return this.abortWithMessage(error, context);
        
      default:
        return { success: false, message: 'No fallback action available' };
    }
  }

  /**
   * Fallback to alternative model
   */
  async useFallbackModel(context) {
    try {
      if (!context.agentType || !context.llmBridge) {
        return { success: false, message: 'No LLM bridge available for fallback' };
      }

      const fallbackModel = context.llmBridge.modelRegistry[context.agentType].fallback;
      if (!fallbackModel) {
        return { success: false, message: 'No fallback model configured' };
      }

      // Attempt with fallback model
      const result = await context.llmBridge.routeRequest(
        context.agentType,
        context.prompt,
        {
          ...context.requestOptions,
          modelOverride: fallbackModel,
          isFallback: true
        }
      );

      return {
        success: true,
        data: result,
        message: `Used fallback model: ${fallbackModel}`
      };
    } catch (error) {
      return { success: false, message: `Fallback model failed: ${error.message}` };
    }
  }

  /**
   * Force use of local model
   */
  async useLocalModel(context) {
    try {
      if (!context.llmBridge) {
        return { success: false, message: 'No LLM bridge available' };
      }

      // Find a local model
      const availableModels = context.llmBridge.getAvailableModels(context.agentType);
      const localModel = availableModels.find(m => m.provider === 'local');
      
      if (!localModel) {
        return { success: false, message: 'No local model available' };
      }

      const result = await context.llmBridge.routeRequest(
        context.agentType,
        context.prompt,
        {
          ...context.requestOptions,
          modelOverride: localModel.name,
          forceLocal: true
        }
      );

      return {
        success: true,
        data: result,
        message: `Used local model: ${localModel.name}`
      };
    } catch (error) {
      return { success: false, message: `Local model failed: ${error.message}` };
    }
  }

  /**
   * Simplify request to reduce complexity
   */
  async simplifyRequest(context) {
    try {
      if (!context.prompt) {
        return { success: false, message: 'No prompt to simplify' };
      }

      // Truncate prompt to essential parts
      const simplifiedPrompt = this.simplifyPrompt(context.prompt);
      
      if (!context.originalOperation) {
        return { success: false, message: 'No operation to retry with simplified prompt' };
      }

      // Retry with simplified prompt
      const result = await context.originalOperation(simplifiedPrompt);
      
      return {
        success: true,
        data: result,
        message: 'Used simplified prompt'
      };
    } catch (error) {
      return { success: false, message: `Simplified request failed: ${error.message}` };
    }
  }

  /**
   * Clear context to reduce memory usage
   */
  async clearContext(context) {
    try {
      // Create minimal context
      const minimalContext = {
        agentType: context.agentType,
        userId: context.userId,
        prompt: context.prompt?.substring(0, 1000) + '...[context cleared for memory]'
      };

      if (!context.originalOperation) {
        return { success: false, message: 'No operation to retry with cleared context' };
      }

      const result = await context.originalOperation(minimalContext);
      
      return {
        success: true,
        data: result,
        message: 'Cleared context to reduce memory usage'
      };
    } catch (error) {
      return { success: false, message: `Clear context failed: ${error.message}` };
    }
  }

  /**
   * Abort with informative message
   */
  abortWithMessage(error, context) {
    const message = this.generateUserFriendlyError(error, context);
    
    return {
      success: true,
      data: {
        agentType: context.agentType || 'unknown',
        response: message,
        metadata: {
          isError: true,
          errorType: 'permission',
          canRetry: false
        }
      },
      message: 'Aborted with user-friendly message'
    };
  }

  /**
   * Simplify prompt by removing less essential parts
   */
  simplifyPrompt(prompt) {
    // Remove examples and verbose context
    let simplified = prompt
      .replace(/EXAMPLES?:[\s\S]*?(?=\n\n|\nINSTRUCTIONS?:|\nTASK:|$)/gi, '')
      .replace(/CONTEXT:[\s\S]*?(?=\n\n|\nINSTRUCTIONS?:|\nTASK:|$)/gi, '')
      .replace(/CONVERSATION HISTORY:[\s\S]*?(?=\n\n|\nINSTRUCTIONS?:|\nTASK:|$)/gi, '');

    // Truncate if still too long
    if (simplified.length > 2000) {
      simplified = simplified.substring(0, 2000) + '...[truncated]';
    }

    return simplified;
  }

  /**
   * Generate user-friendly error message
   */
  generateUserFriendlyError(error, context) {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'network':
        return "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
        
      case 'rate-limit':
        return "The AI service is currently busy. Please wait a moment and try again.";
        
      case 'permission':
        return "I don't have permission to perform this action. Please check your access rights.";
        
      case 'parsing':
        return "I had trouble understanding the response. Could you try rephrasing your request?";
        
      case 'memory':
        return "The request is too complex for me to process right now. Try breaking it into smaller parts.";
        
      default:
        return "I encountered an unexpected issue. Please try again or contact support if the problem persists.";
    }
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('rate limit') || message.includes('overloaded') || message.includes('quota')) {
      return 'rate-limit';
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }
    if (message.includes('parse') || message.includes('json') || message.includes('format')) {
      return 'parsing';
    }
    if (message.includes('memory') || message.includes('too large') || message.includes('limit exceeded')) {
      return 'memory';
    }
    
    return 'unknown';
  }

  /**
   * Generate graceful error response
   */
  generateGracefulError(operationName, error, context) {
    return {
      agentType: context.agentType || 'unknown',
      response: this.generateUserFriendlyError(error, context),
      metadata: {
        isError: true,
        operationName,
        errorType: this.classifyError(error),
        canRetry: true,
        timestamp: new Date().toISOString()
      },
      suggestions: [
        'Try again in a few moments',
        'Simplify your request',
        'Check your connection'
      ]
    };
  }

  /**
   * Get retry strategy for operation
   */
  getRetryStrategy(operationName) {
    // Try to find specific strategy
    if (this.retryStrategies.has(operationName)) {
      return this.retryStrategies.get(operationName);
    }

    // Find strategy by error pattern
    for (const [pattern, strategy] of this.retryStrategies) {
      if (operationName.includes(pattern)) {
        return strategy;
      }
    }

    // Default strategy
    return {
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      shouldRetry: () => true,
      fallbackAction: 'abort-with-message'
    };
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt, strategy) {
    return strategy.retryDelay * Math.pow(this.backoffMultiplier, attempt - 1);
  }

  /**
   * Record failure for circuit breaker
   */
  recordFailure(operationName, error) {
    const now = Date.now();
    
    if (!this.failureHistory.has(operationName)) {
      this.failureHistory.set(operationName, []);
    }
    
    const failures = this.failureHistory.get(operationName);
    failures.push({
      timestamp: now,
      error: error.message,
      errorType: this.classifyError(error)
    });

    // Keep only recent failures (last hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    this.failureHistory.set(
      operationName,
      failures.filter(f => f.timestamp > oneHourAgo)
    );
  }

  /**
   * Record successful recovery
   */
  recordRecovery(operationName, attemptCount) {
    recoveryLogger.info('Operation recovered successfully', {
      operationName,
      attemptCount
    });

    // Reset circuit breaker if it was tripped
    if (this.circuitBreakers.has(operationName)) {
      const breaker = this.circuitBreakers.get(operationName);
      if (breaker.state === 'open' || breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.lastFailureTime = null;
        recoveryLogger.info('Circuit breaker reset after successful recovery', { operationName });
      }
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen(operationName) {
    const breaker = this.circuitBreakers.get(operationName);
    if (!breaker) return false;

    const now = Date.now();
    
    if (breaker.state === 'open') {
      // Check if we should transition to half-open
      if (now - breaker.lastFailureTime > this.circuitBreakerResetTime) {
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(operationName) {
    const failures = this.failureHistory.get(operationName) || [];
    const recentFailures = failures.length;

    if (recentFailures >= this.circuitBreakerThreshold) {
      const breaker = this.circuitBreakers.get(operationName) || {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: null
      };

      breaker.state = 'open';
      breaker.failureCount = recentFailures;
      breaker.lastFailureTime = Date.now();
      
      this.circuitBreakers.set(operationName, breaker);
      
      recoveryLogger.warn('Circuit breaker opened', {
        operationName,
        recentFailures,
        threshold: this.circuitBreakerThreshold
      });
    }
  }

  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get failure statistics
   */
  getFailureStats() {
    const stats = {
      totalOperations: 0,
      totalFailures: 0,
      operationStats: {},
      circuitBreakerStats: {}
    };

    // Aggregate failure history
    for (const [operationName, failures] of this.failureHistory) {
      stats.operationStats[operationName] = {
        failures: failures.length,
        errorTypes: this.aggregateErrorTypes(failures)
      };
      stats.totalFailures += failures.length;
    }

    // Circuit breaker stats
    for (const [operationName, breaker] of this.circuitBreakers) {
      stats.circuitBreakerStats[operationName] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime
      };
    }

    return stats;
  }

  /**
   * Aggregate error types from failures
   */
  aggregateErrorTypes(failures) {
    const types = {};
    for (const failure of failures) {
      types[failure.errorType] = (types[failure.errorType] || 0) + 1;
    }
    return types;
  }

  /**
   * Reset circuit breaker manually
   */
  resetCircuitBreaker(operationName) {
    if (this.circuitBreakers.has(operationName)) {
      const breaker = this.circuitBreakers.get(operationName);
      breaker.state = 'closed';
      breaker.failureCount = 0;
      breaker.lastFailureTime = null;
      
      recoveryLogger.info('Circuit breaker manually reset', { operationName });
      return true;
    }
    return false;
  }

  /**
   * Clear failure history
   */
  clearFailureHistory(operationName = null) {
    if (operationName) {
      this.failureHistory.delete(operationName);
      recoveryLogger.info('Failure history cleared for operation', { operationName });
    } else {
      this.failureHistory.clear();
      recoveryLogger.info('All failure history cleared');
    }
  }

  /**
   * Add custom retry strategy
   */
  addRetryStrategy(name, strategy) {
    this.retryStrategies.set(name, {
      maxRetries: strategy.maxRetries || this.maxRetries,
      retryDelay: strategy.retryDelay || this.retryDelay,
      shouldRetry: strategy.shouldRetry || (() => true),
      fallbackAction: strategy.fallbackAction || 'abort-with-message'
    });
    
    recoveryLogger.info('Custom retry strategy added', { name });
  }
}

export default AgentFailureRecovery;
