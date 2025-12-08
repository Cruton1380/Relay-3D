// backend/ai-agent/agentModelSwitcher.mjs
/**
 * Agent Model Switcher - Dynamic model selection and hot-swapping
 * Allows runtime model switching for both agents with fallback handling
 */

import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logging/logger.mjs';

const switcherLogger = logger.child({ module: 'ai-agent-model-switcher' });

/**
 * Model switching and management system
 */
export class AgentModelSwitcher {
  constructor(options = {}) {
    this.configPath = options.configPath || path.join(process.cwd(), 'src/backend/ai-agent');
    // If we're already in the ai-agent directory, don't add it again
    if (process.cwd().endsWith('ai-agent')) {
      this.configPath = process.cwd();
    }
    
    this.registryPath = path.join(this.configPath, 'agentModelRegistryEnhanced.json');
    this.fallbackRegistryPath = path.join(this.configPath, 'agentModelRegistry.json');
    this.overridesPath = path.join(this.configPath, 'agentModelOverrides.json');
    
    this.registry = null;
    this.overrides = new Map();
    this.healthStatus = new Map();
    this.llmSourcePreferences = new Map(); // Per-user LLM source preferences
    
    this.initialize();
  }

  /**
   * Initialize the model switcher
   */  async initialize() {
    try {
      // Load model registry
      await this.loadRegistry();
      
      // Load existing overrides
      await this.loadOverrides();
      
      // Load LLM source preferences
      await this.loadLLMSourcePreferences();
      
      // Perform initial health check
      await this.performHealthCheck();
      
      switcherLogger.info('Model switcher initialized', {
        registeredModels: this.getTotalModelCount(),
        activeOverrides: this.overrides.size,
        llmPreferences: this.llmSourcePreferences.size
      });
    } catch (error) {
      switcherLogger.error('Failed to initialize model switcher', { error });
      throw error;
    }
  }
  /**
   * Load model registry from file
   */
  async loadRegistry() {
    try {
      // Try enhanced registry first
      let content;
      try {
        content = await fs.readFile(this.registryPath, 'utf8');
      } catch (error) {
        // Fallback to original registry
        content = await fs.readFile(this.fallbackRegistryPath, 'utf8');
        switcherLogger.info('Using fallback registry');
      }
      this.registry = JSON.parse(content);
    } catch (error) {
      switcherLogger.error('Failed to load model registry', { error });
      throw error;
    }
  }

  /**
   * Load model overrides from file
   */
  async loadOverrides() {
    try {
      const content = await fs.readFile(this.overridesPath, 'utf8');
      const overridesData = JSON.parse(content);
      this.overrides = new Map(Object.entries(overridesData));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        switcherLogger.warn('Failed to load model overrides', { error });
      }
      // Initialize empty overrides if file doesn't exist      this.overrides = new Map();
    }
  }

  /**
   * Parse CLI arguments for LLM source configuration
   */
  parseCLIArgs(args = process.argv) {
    const config = {
      llmSource: null,
      cloudProvider: null,
      useLocal: false,
      modelOverride: null,
      agentSpecific: {}
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // --llm-source=openai | --llm-source=ollama:llama3 | --llm-source=anthropic
      if (arg.startsWith('--llm-source=')) {
        config.llmSource = arg.split('=')[1];
        
        // Handle local model specification (e.g., ollama:llama3)
        if (config.llmSource.includes(':')) {
          const [provider, model] = config.llmSource.split(':');
          if (['ollama', 'lmstudio', 'vllm', 'llamacpp'].includes(provider)) {
            config.useLocal = true;
            config.modelOverride = model;
          }
        }
      }
      
      // --cloud-provider=openai
      else if (arg.startsWith('--cloud-provider=')) {
        config.cloudProvider = arg.split('=')[1];
      }
      
      // --use-local
      else if (arg === '--use-local') {
        config.useLocal = true;
      }
      
      // --navigator-model=gpt-4
      else if (arg.startsWith('--navigator-model=')) {
        config.agentSpecific.navigator = arg.split('=')[1];
      }
      
      // --architect-model=claude-3-5-sonnet
      else if (arg.startsWith('--architect-model=')) {
        config.agentSpecific.architect = arg.split('=')[1];
      }
    }

    return config;
  }

  /**
   * Apply CLI configuration to agent settings
   */
  async applyCLIConfig(config, userId = null) {
    try {
      const results = [];
      
      // Apply global LLM source preference
      if (config.llmSource) {
        await this.setLLMSourcePreference(userId, config.llmSource);
        results.push({ type: 'llm-source', value: config.llmSource });
      }
      
      // Apply cloud provider preference
      if (config.cloudProvider) {
        await this.setCloudProvider(userId, config.cloudProvider);
        results.push({ type: 'cloud-provider', value: config.cloudProvider });
      }
      
      // Apply agent-specific models
      for (const [agentType, model] of Object.entries(config.agentSpecific)) {
        await this.switchModel(agentType, model, userId);
        results.push({ type: 'agent-model', agent: agentType, model });
      }
      
      // Apply model override if specified
      if (config.modelOverride && config.useLocal) {
        // Apply to both agents if no specific models provided
        if (!config.agentSpecific.navigator && !config.agentSpecific.architect) {
          await this.switchModel('navigator', config.modelOverride, userId);
          await this.switchModel('architect', config.modelOverride, userId);
          results.push({ type: 'model-override', model: config.modelOverride });
        }
      }
      
      switcherLogger.info('CLI configuration applied', { results, userId: userId ? '[REDACTED]' : null });
      
      return { success: true, applied: results };
    } catch (error) {
      switcherLogger.error('Failed to apply CLI configuration', { error, config });
      throw error;
    }
  }

  /**
   * Set LLM source preference for user
   */
  async setLLMSourcePreference(userId, source) {
    const key = userId ? `user:${userId}` : 'global';
    this.llmSourcePreferences.set(key, {
      source,
      timestamp: new Date().toISOString()
    });
    
    // Persist preferences
    await this.saveLLMSourcePreferences();
  }

  /**
   * Get LLM source preference for user
   */
  getLLMSourcePreference(userId = null) {
    const userKey = userId ? `user:${userId}` : null;
    
    // Check user-specific preference first
    if (userKey && this.llmSourcePreferences.has(userKey)) {
      return this.llmSourcePreferences.get(userKey).source;
    }
    
    // Fallback to global preference
    const globalPref = this.llmSourcePreferences.get('global');
    if (globalPref) {
      return globalPref.source;
    }
    
    // Default based on environment
    return process.env.RELAY_USE_LOCAL_LLM === 'true' ? 'local' : 'cloud';
  }

  /**
   * Set cloud provider preference
   */
  async setCloudProvider(userId, provider) {
    const key = userId ? `cloudprov:${userId}` : 'cloudprov:global';
    this.llmSourcePreferences.set(key, {
      provider,
      timestamp: new Date().toISOString()
    });
    
    await this.saveLLMSourcePreferences();
  }

  /**
   * Get cloud provider preference
   */
  getCloudProvider(userId = null) {
    const userKey = userId ? `cloudprov:${userId}` : null;
    
    if (userKey && this.llmSourcePreferences.has(userKey)) {
      return this.llmSourcePreferences.get(userKey).provider;
    }
    
    const globalPref = this.llmSourcePreferences.get('cloudprov:global');
    if (globalPref) {
      return globalPref.provider;
    }
    
    return process.env.RELAY_CLOUD_PROVIDER || 'openai';
  }

  /**
   * Save LLM source preferences to file
   */
  async saveLLMSourcePreferences() {
    try {
      const preferencesPath = path.join(this.configPath, 'llmSourcePreferences.json');
      const preferencesData = Object.fromEntries(this.llmSourcePreferences);
      await fs.writeFile(preferencesPath, JSON.stringify(preferencesData, null, 2));
    } catch (error) {
      switcherLogger.error('Failed to save LLM source preferences', { error });
      throw error;
    }
  }

  /**
   * Load LLM source preferences from file
   */
  async loadLLMSourcePreferences() {
    try {
      const preferencesPath = path.join(this.configPath, 'llmSourcePreferences.json');
      const content = await fs.readFile(preferencesPath, 'utf8');
      const preferencesData = JSON.parse(content);
      this.llmSourcePreferences = new Map(Object.entries(preferencesData));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        switcherLogger.warn('Failed to load LLM source preferences', { error });
      }
      this.llmSourcePreferences = new Map();
    }
  }

  /**
   * Save model overrides to file
   */
  async saveOverrides() {
    try {
      const overridesData = Object.fromEntries(this.overrides);
      await fs.writeFile(this.overridesPath, JSON.stringify(overridesData, null, 2));
    } catch (error) {
      switcherLogger.error('Failed to save model overrides', { error });
      throw error;
    }
  }

  /**
   * Switch model for a specific agent type
   */
  async switchModel(agentType, modelName, userId = null, sessionId = null) {
    try {
      if (!this.registry[agentType]) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      if (!this.registry[agentType].available.includes(modelName)) {
        throw new Error(`Model ${modelName} not available for agent ${agentType}`);
      }

      // Create override key
      const overrideKey = this.createOverrideKey(agentType, userId, sessionId);
      
      // Set override
      this.overrides.set(overrideKey, {
        agentType,
        modelName,
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        previousModel: this.getCurrentModel(agentType, userId, sessionId)
      });

      await this.saveOverrides();

      switcherLogger.info('Model switched', {
        agentType,
        modelName,
        userId: userId ? '[REDACTED]' : null,
        sessionId
      });

      return {
        success: true,
        agentType,
        modelName,
        previousModel: this.overrides.get(overrideKey).previousModel
      };
    } catch (error) {
      switcherLogger.error('Model switch failed', { agentType, modelName, error });
      throw error;
    }
  }
  /**
   * Get current model for agent type
   */
  getCurrentModel(agentType, userId = null, sessionId = null) {
    // Check for session-specific override first
    if (sessionId) {
      const sessionKey = this.createOverrideKey(agentType, userId, sessionId);
      const sessionOverride = this.overrides.get(sessionKey);
      if (sessionOverride) {
        return sessionOverride.modelName;
      }
    }

    // Check for user-specific override
    if (userId) {
      const userKey = this.createOverrideKey(agentType, userId, null);
      const userOverride = this.overrides.get(userKey);
      if (userOverride) {
        return userOverride.modelName;
      }
    }

    // Check for global override
    const globalKey = this.createOverrideKey(agentType, null, null);
    const globalOverride = this.overrides.get(globalKey);
    if (globalOverride) {
      return globalOverride.modelName;
    }

    // Return default model from registry if available
    if (this.registry && this.registry[agentType]) {
      return this.registry[agentType].default;
    }

    // Fallback defaults
    const fallbacks = {
      navigator: 'gpt-4o',
      architect: 'claude-3-5-sonnet'
    };
    
    return fallbacks[agentType] || 'gpt-4o';
  }

  /**
   * Get fallback model for agent type
   */
  getFallbackModel(agentType) {
    return this.registry[agentType].fallback;
  }

  /**
   * Create override key for storing model preferences
   */
  createOverrideKey(agentType, userId, sessionId) {
    if (sessionId) {
      return `${agentType}:session:${sessionId}`;
    } else if (userId) {
      return `${agentType}:user:${userId}`;
    } else {
      return `${agentType}:global`;
    }
  }

  /**
   * Remove model override
   */
  async removeOverride(agentType, userId = null, sessionId = null) {
    try {
      const overrideKey = this.createOverrideKey(agentType, userId, sessionId);
      const removed = this.overrides.delete(overrideKey);
      
      if (removed) {
        await this.saveOverrides();
        switcherLogger.info('Model override removed', {
          agentType,
          userId: userId ? '[REDACTED]' : null,
          sessionId
        });
      }

      return removed;
    } catch (error) {
      switcherLogger.error('Failed to remove model override', { agentType, error });
      throw error;
    }
  }

  /**
   * List available models for agent type
   */
  getAvailableModels(agentType) {
    if (!this.registry[agentType]) {
      return [];
    }

    return this.registry[agentType].available.map(modelName => ({
      name: modelName,
      capabilities: this.registry[agentType].capabilities[modelName] || [],
      isDefault: modelName === this.registry[agentType].default,
      isFallback: modelName === this.registry[agentType].fallback,
      isHealthy: this.healthStatus.get(modelName) !== false,
      provider: this.getModelProvider(modelName)
    }));
  }

  /**
   * Get model provider information
   */
  getModelProvider(modelName) {
    const lowerName = modelName.toLowerCase();
    
    if (lowerName.includes('claude')) return 'anthropic';
    if (lowerName.includes('gpt')) return 'openai';
    if (lowerName.includes('gemini')) return 'google';
    if (lowerName.includes('mistral')) return 'mistral';
    if (lowerName.includes('llama') || lowerName.includes('deepseek') || 
        lowerName.includes('codegemma') || lowerName.includes('qwen')) {
      return 'local';
    }
    
    return 'unknown';
  }

  /**
   * Perform health check on all models
   */
  async performHealthCheck() {
    try {
      switcherLogger.info('Starting model health check');
      
      const allModels = new Set();
      for (const agentType of Object.keys(this.registry)) {
        for (const model of this.registry[agentType].available) {
          allModels.add(model);
        }
      }

      for (const model of allModels) {
        try {
          const isHealthy = await this.checkModelHealth(model);
          this.healthStatus.set(model, isHealthy);
        } catch (error) {
          this.healthStatus.set(model, false);
          switcherLogger.warn('Model health check failed', { model, error: error.message });
        }
      }

      const healthyCount = Array.from(this.healthStatus.values()).filter(h => h).length;
      switcherLogger.info('Model health check completed', {
        totalModels: allModels.size,
        healthyModels: healthyCount
      });
    } catch (error) {
      switcherLogger.error('Health check failed', { error });
    }
  }

  /**
   * Check health of a specific model
   */
  async checkModelHealth(modelName) {
    try {
      const provider = this.getModelProvider(modelName);
      
      if (provider === 'local') {
        // For local models, check if the inference server is running
        return await this.checkLocalModelHealth(modelName);
      } else {
        // For cloud models, check API availability
        return await this.checkCloudModelHealth(provider);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check local model health
   */
  async checkLocalModelHealth(modelName) {
    try {
      // In production, would ping Ollama/LM Studio endpoints
      // For now, return true as a mock implementation
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check cloud model health
   */
  async checkCloudModelHealth(provider) {
    try {
      // In production, would make test API calls
      // For now, check if API key is available
      const apiKeyEnvVars = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY', 
        google: 'GOOGLE_API_KEY',
        mistral: 'MISTRAL_API_KEY'
      };
      
      const envVar = apiKeyEnvVars[provider];
      return !!process.env[envVar];
    } catch (error) {
      return false;
    }
  }

  /**
   * Get model switching recommendations
   */
  getModelRecommendations(agentType, context = {}) {
    const recommendations = [];
    const availableModels = this.getAvailableModels(agentType);
    const currentModel = this.getCurrentModel(agentType, context.userId, context.sessionId);

    // Performance recommendations
    if (context.requiresSpeed) {
      const fastModels = availableModels.filter(m => 
        m.provider === 'local' || m.name.includes('turbo')
      );
      if (fastModels.length > 0) {
        recommendations.push({
          type: 'performance',
          suggestion: `Consider switching to ${fastModels[0].name} for faster responses`,
          model: fastModels[0].name
        });
      }
    }

    // Privacy recommendations
    if (context.requiresPrivacy) {
      const localModels = availableModels.filter(m => m.provider === 'local');
      if (localModels.length > 0) {
        recommendations.push({
          type: 'privacy',
          suggestion: `Use ${localModels[0].name} for complete privacy (local inference)`,
          model: localModels[0].name
        });
      }
    }

    // Capability recommendations
    if (context.taskType === 'coding') {
      const codingModels = availableModels.filter(m => 
        m.capabilities.includes('code-generation') ||
        m.name.includes('coder') ||
        m.name.includes('code')
      );
      if (codingModels.length > 0) {
        recommendations.push({
          type: 'capability',
          suggestion: `${codingModels[0].name} is optimized for coding tasks`,
          model: codingModels[0].name
        });
      }
    }

    return recommendations;
  }

  /**
   * Auto-select best model for context
   */
  async autoSelectModel(agentType, context = {}) {
    try {
      const recommendations = this.getModelRecommendations(agentType, context);
      
      if (recommendations.length > 0) {
        // Use the first recommendation
        const recommended = recommendations[0];
        await this.switchModel(
          agentType,
          recommended.model,
          context.userId,
          context.sessionId
        );
        
        return {
          selected: recommended.model,
          reason: recommended.suggestion,
          type: recommended.type
        };
      }

      return {
        selected: this.getCurrentModel(agentType, context.userId, context.sessionId),
        reason: 'Using current model, no better option found',
        type: 'default'
      };
    } catch (error) {
      switcherLogger.error('Auto-selection failed', { agentType, error });
      throw error;
    }
  }

  /**
   * Get model usage statistics
   */
  getModelUsageStats() {
    const stats = {
      totalOverrides: this.overrides.size,
      overridesByAgent: {},
      overridesByModel: {},
      overridesByType: { global: 0, user: 0, session: 0 }
    };

    for (const [key, override] of this.overrides) {
      // Count by agent
      stats.overridesByAgent[override.agentType] = 
        (stats.overridesByAgent[override.agentType] || 0) + 1;

      // Count by model
      stats.overridesByModel[override.modelName] = 
        (stats.overridesByModel[override.modelName] || 0) + 1;

      // Count by type
      if (key.includes(':session:')) {
        stats.overridesByType.session++;
      } else if (key.includes(':user:')) {
        stats.overridesByType.user++;
      } else {
        stats.overridesByType.global++;
      }
    }

    return stats;
  }

  /**
   * Export model configuration
   */
  exportConfiguration() {
    return {
      registry: this.registry,
      overrides: Object.fromEntries(this.overrides),
      healthStatus: Object.fromEntries(this.healthStatus),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import model configuration
   */
  async importConfiguration(config) {
    try {
      if (config.registry) {
        this.registry = config.registry;
      }
      
      if (config.overrides) {
        this.overrides = new Map(Object.entries(config.overrides));
        await this.saveOverrides();
      }
      
      if (config.healthStatus) {
        this.healthStatus = new Map(Object.entries(config.healthStatus));
      }

      switcherLogger.info('Configuration imported successfully');
      return true;
    } catch (error) {
      switcherLogger.error('Configuration import failed', { error });
      throw error;
    }
  }

  /**
   * Reset all overrides
   */
  async resetAllOverrides() {
    try {
      this.overrides.clear();
      await this.saveOverrides();
      switcherLogger.info('All model overrides reset');
      return true;
    } catch (error) {
      switcherLogger.error('Failed to reset overrides', { error });
      throw error;
    }
  }

  /**
   * Get total model count across all agents
   */
  getTotalModelCount() {
    const allModels = new Set();
    for (const agentType of Object.keys(this.registry)) {
      for (const model of this.registry[agentType].available) {
        allModels.add(model);
      }
    }
    return allModels.size;
  }

  /**
   * Clean up expired session overrides
   */
  async cleanupExpiredOverrides(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, override] of this.overrides) {
        if (key.includes(':session:')) {
          const age = now - new Date(override.timestamp).getTime();
          if (age > maxAge) {
            this.overrides.delete(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        await this.saveOverrides();
        switcherLogger.info('Expired overrides cleaned up', { cleanedCount });
      }

      return cleanedCount;
    } catch (error) {
      switcherLogger.error('Override cleanup failed', { error });
      throw error;
    }
  }

  /**
   * Clear user model data
   */
  async clearUserData(userId) {
    try {
      let removedCount = 0;
      
      for (const [key, override] of this.overrides) {
        if (override.userId === userId) {
          this.overrides.delete(key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        await this.saveOverrides();
      }

      switcherLogger.info('User model data cleared', { 
        userId: '[REDACTED]',
        removedOverrides: removedCount
      });

      return removedCount;
    } catch (error) {
      switcherLogger.error('Failed to clear user model data', { error });
      throw error;
    }
  }
}

export default AgentModelSwitcher;
