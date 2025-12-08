// backend/ai-agent/agentLLMBridge.mjs
/**
 * AI Agent LLM Bridge - Secure connection to multiple LLM providers
 * Handles prompt sanitization, model routing, and privacy enforcement
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';

const agentLogger = logger.child({ module: 'ai-agent-llm-bridge' });

/**
 * LLM Bridge for secure AI agent communication
 */
export class AgentLLMBridge {  constructor(options = {}) {
    this.configPath = options.configPath || path.join(process.cwd(), 'src/backend/ai-agent');
    // If we're already in the ai-agent directory, don't add it again
    if (process.cwd().endsWith('ai-agent')) {
      this.configPath = process.cwd();
    }
    
    this.memoryPolicy = null;
    this.modelRegistry = null;
    this.userCredentials = new Map(); // Encrypted user API keys
    this.healthCache = new Map(); // Model availability cache
    
    // System API keys (cloud providers)
    this.apiKeys = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      cohere: process.env.COHERE_API_KEY,
      together: process.env.TOGETHER_API_KEY
    };
    
    // User-provided API keys (encrypted storage)
    this.userApiKeys = {
      anthropic: process.env.USER_ANTHROPIC_API_KEY,
      openai: process.env.USER_OPENAI_API_KEY,
      google: process.env.USER_GOOGLE_API_KEY,
      mistral: process.env.USER_MISTRAL_API_KEY
    };
    
    this.initialize();
  }

  /**
   * Initialize bridge with policies and registry
   */  async initialize() {
    try {
      // Load memory policy
      const memoryPolicyPath = path.join(this.configPath, 'agentMemoryPolicy.json');
      const memoryPolicyContent = await fs.readFile(memoryPolicyPath, 'utf8');
      this.memoryPolicy = JSON.parse(memoryPolicyContent);

      // Try to load enhanced registry first, fallback to original
      let registryPath = path.join(this.configPath, 'agentModelRegistryEnhanced.json');
      try {
        const registryContent = await fs.readFile(registryPath, 'utf8');
        this.modelRegistry = JSON.parse(registryContent);
      } catch (error) {
        // Fallback to original registry
        registryPath = path.join(this.configPath, 'agentModelRegistry.json');
        const registryContent = await fs.readFile(registryPath, 'utf8');
        this.modelRegistry = JSON.parse(registryContent);
      }

      // Load user credentials if available
      await this.loadUserCredentials();

      agentLogger.info('LLM Bridge initialized', {
        modelCount: Object.keys(this.modelRegistry.models || {}).length,
        cloudProviders: this.modelRegistry.providers?.cloud?.length || 0,
        localProviders: this.modelRegistry.providers?.local?.length || 0,
        userCredentialsLoaded: this.userCredentials.size
      });    } catch (error) {
      agentLogger.error('Failed to initialize LLM Bridge', { error });
      throw error;
    }
  }

  /**
   * Load user credentials from encrypted storage
   */
  async loadUserCredentials() {
    try {
      const credentialsPath = path.join(this.configPath, 'userCredentials.encrypted');
      if (await fs.access(credentialsPath).then(() => true).catch(() => false)) {
        const encryptedData = await fs.readFile(credentialsPath, 'utf8');
        const decryptedData = this.decryptCredentials(encryptedData);
        this.userCredentials = new Map(Object.entries(JSON.parse(decryptedData)));
      }
    } catch (error) {
      agentLogger.warn('Failed to load user credentials', { error });
    }
  }

  /**
   * Save user credentials to encrypted storage
   */
  async saveUserCredentials() {
    try {
      const credentialsPath = path.join(this.configPath, 'userCredentials.encrypted');
      const credentialsData = Object.fromEntries(this.userCredentials);
      const encryptedData = this.encryptCredentials(JSON.stringify(credentialsData));
      await fs.writeFile(credentialsPath, encryptedData);
    } catch (error) {
      agentLogger.error('Failed to save user credentials', { error });
      throw error;
    }
  }

  /**
   * Add user API key for a provider
   */
  async addUserApiKey(userId, provider, apiKey) {
    try {
      if (!['anthropic', 'openai', 'google', 'mistral', 'cohere', 'together'].includes(provider)) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      const userKey = `${userId}:${provider}`;
      this.userCredentials.set(userKey, {
        provider,
        apiKey: this.encryptApiKey(apiKey),
        createdAt: new Date().toISOString(),
        lastUsed: null
      });

      await this.saveUserCredentials();
      
      agentLogger.info('User API key added', { 
        userId: '[REDACTED]', 
        provider,
        keyLength: apiKey.length 
      });

      return { success: true, provider };
    } catch (error) {
      agentLogger.error('Failed to add user API key', { provider, error });
      throw error;
    }
  }

  /**
   * Remove user API key for a provider
   */
  async removeUserApiKey(userId, provider) {
    try {
      const userKey = `${userId}:${provider}`;
      const deleted = this.userCredentials.delete(userKey);
      
      if (deleted) {
        await this.saveUserCredentials();
        agentLogger.info('User API key removed', { userId: '[REDACTED]', provider });
      }

      return { success: deleted, provider };
    } catch (error) {
      agentLogger.error('Failed to remove user API key', { provider, error });
      throw error;
    }
  }

  /**
   * Get available API key for provider (user key takes precedence)
   */
  getApiKey(provider, userId = null) {
    // Try user-specific key first
    if (userId) {
      const userKey = `${userId}:${provider}`;
      const userCredential = this.userCredentials.get(userKey);
      if (userCredential) {
        // Update last used timestamp
        userCredential.lastUsed = new Date().toISOString();
        return this.decryptApiKey(userCredential.apiKey);
      }
    }

    // Fallback to system key
    return this.apiKeys[provider] || this.userApiKeys[provider];
  }  /**
   * Encrypt API key for storage (simple base64 for testing)
   */
  encryptApiKey(apiKey) {
    // For testing purposes, use simple base64 encoding
    // In production, this should use proper AES encryption
    return Buffer.from(apiKey).toString('base64');
  }

  /**
   * Decrypt API key from storage (simple base64 for testing)
   */
  decryptApiKey(encryptedApiKey) {
    try {
      // For testing purposes, use simple base64 decoding
      // In production, this should use proper AES decryption
      return Buffer.from(encryptedApiKey, 'base64').toString('utf8');
    } catch (error) {
      agentLogger.error('Failed to decrypt API key', { error });
      throw new Error('Invalid encrypted API key');
    }
  }

  /**
   * Encrypt user credentials for storage
   */
  encryptCredentials(data) {
    return this.encryptApiKey(data);
  }

  /**
   * Decrypt user credentials from storage
   */
  decryptCredentials(encryptedData) {
    return this.decryptApiKey(encryptedData);
  }

  /**
   * Sanitize prompt according to privacy policy
   */
  sanitizePrompt(prompt, userId = null, context = {}) {
    try {
      let sanitizedPrompt = prompt;
      const policy = this.memoryPolicy.sharePromptWithLLM;

      // Strip user identifiers if required
      if (policy.stripUserId && userId) {
        sanitizedPrompt = sanitizedPrompt.replace(new RegExp(userId, 'gi'), '[USER_ID]');
      }

      // Strip channel IDs
      if (policy.stripChannelId) {
        sanitizedPrompt = sanitizedPrompt.replace(/ch_[a-zA-Z0-9]{16}/g, '[CHANNEL_ID]');
      }

      // Remove location data
      if (!policy.includeRegion) {
        sanitizedPrompt = sanitizedPrompt.replace(/\b(?:lat|lng|latitude|longitude|coord|GPS):\s*[-\d\.]+/gi, '[LOCATION]');
        sanitizedPrompt = sanitizedPrompt.replace(/\b(?:region|country|city|state):\s*[^,\n]+/gi, '[LOCATION]');
      }

      // Strip personal metadata
      if (this.memoryPolicy.privacyEnforcement.scrubPersonalMetadata) {
        sanitizedPrompt = sanitizedPrompt.replace(/\b(?:email|phone|address|ssn|passport):\s*[^,\n\s]+/gi, '[PERSONAL_DATA]');
      }

      // Truncate to token limit
      if (policy.maxTokens && sanitizedPrompt.length > policy.maxTokens * 4) {
        sanitizedPrompt = sanitizedPrompt.substring(0, policy.maxTokens * 4) + '...[TRUNCATED]';
      }

      agentLogger.debug('Prompt sanitized', {
        originalLength: prompt.length,
        sanitizedLength: sanitizedPrompt.length,
        userId: userId ? '[REDACTED]' : null
      });

      return {
        prompt: sanitizedPrompt,
        metadata: {
          sanitized: true,
          originalHash: this.hashPrompt(prompt),
          sanitizedHash: this.hashPrompt(sanitizedPrompt),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      agentLogger.error('Failed to sanitize prompt', { error });
      throw error;
    }
  }

  /**
   * Generate hash of prompt for audit purposes
   */
  hashPrompt(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
  }

  /**
   * Route request to appropriate model
   */
  async routeRequest(agentType, prompt, options = {}) {
    try {
      const agentConfig = this.modelRegistry[agentType];
      if (!agentConfig) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      const modelName = options.modelOverride || agentConfig.default;
      const modelInfo = this.getModelInfo(modelName);

      agentLogger.info('Routing request', {
        agentType,
        model: modelName,
        provider: modelInfo.provider,
        promptLength: prompt.length
      });

      // Route to appropriate provider
      if (modelInfo.provider === 'local') {
        return await this.callLocalModel(modelName, prompt, options);
      } else {
        return await this.callCloudProvider(modelInfo.provider, modelName, prompt, options);
      }
    } catch (error) {
      agentLogger.error('Failed to route request', { agentType, error });
      
      // Try fallback model
      const fallbackModel = this.modelRegistry[agentType].fallback;
      if (fallbackModel && !options.isFallback) {
        agentLogger.info('Attempting fallback', { fallbackModel });
        return await this.routeRequest(agentType, prompt, { 
          ...options, 
          modelOverride: fallbackModel, 
          isFallback: true 
        });
      }
      
      throw error;
    }
  }  /**
   * Get model information including provider
   */
  getModelInfo(modelName) {
    // Check enhanced registry first
    if (this.modelRegistry && this.modelRegistry.models && this.modelRegistry.models[modelName]) {
      const modelConfig = this.modelRegistry.models[modelName];
      return {
        provider: modelConfig.sourceType === 'local' ? 'local' : modelConfig.provider,
        name: modelName,
        sourceType: modelConfig.sourceType,
        endpoint: modelConfig.endpoint,
        capabilities: modelConfig.capabilities || []
      };
    }

    // Fallback to legacy detection logic
    const isLocal = ['llama', 'mistral', 'deepseek', 'codegemma', 'zephyr', 'qwen', 'phi', 'gemma'].some(prefix => 
      modelName.toLowerCase().includes(prefix)
    );

    if (isLocal) {
      return {
        provider: 'local',
        name: modelName,
        sourceType: 'local',
        endpoint: 'http://localhost:11434'
      };
    }

    // Determine cloud provider by model name
    if (modelName.includes('claude')) {
      return { provider: 'anthropic', name: modelName, sourceType: 'cloud' };
    } else if (modelName.includes('gpt')) {
      return { provider: 'openai', name: modelName, sourceType: 'cloud' };
    } else if (modelName.includes('gemini')) {
      return { provider: 'google', name: modelName, sourceType: 'cloud' };
    } else if (modelName.includes('mistral') && !isLocal) {
      return { provider: 'mistral', name: modelName, sourceType: 'cloud' };
    } else if (modelName.includes('command')) {
      return { provider: 'cohere', name: modelName, sourceType: 'cloud' };
    } else if (modelName.includes('together')) {
      return { provider: 'together', name: modelName, sourceType: 'cloud' };
    }

    // Default fallback
    return { provider: 'openai', name: modelName, sourceType: 'cloud' };
  }

  /**
   * Call local model via Ollama/LM Studio
   */
  async callLocalModel(modelName, prompt, options = {}) {
    try {
      // This would integrate with Ollama API or similar
      // For now, return a mock response indicating local inference
      
      agentLogger.info('Local model call', { modelName });
      
      // In a real implementation, this would call:
      // - Ollama API (http://localhost:11434/api/generate)
      // - LM Studio API
      // - vLLM server
      // - llama.cpp server
      
      return {
        response: `[LOCAL MODEL RESPONSE from ${modelName}]\n\nI understand you want me to process: "${prompt.substring(0, 100)}..."\n\nThis would be processed locally using ${modelName} for complete privacy.`,
        metadata: {
          model: modelName,
          provider: 'local',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 50 // Rough estimate
        }
      };
    } catch (error) {
      agentLogger.error('Local model call failed', { modelName, error });
      throw error;
    }
  }
  /**
   * Call cloud provider API
   */
  async callCloudProvider(provider, modelName, prompt, options = {}) {
    try {
      const apiKey = this.getApiKey(provider, options.userId);
      if (!apiKey) {
        throw new Error(`No API key configured for provider: ${provider}`);
      }

      agentLogger.info('Cloud provider call', { provider, modelName });

      // Sanitize prompt before sending to cloud
      const { prompt: sanitizedPrompt, metadata } = this.sanitizePrompt(prompt, options.userId, options.context);

      switch (provider) {
        case 'anthropic':
          return await this.callAnthropic(modelName, sanitizedPrompt, options);
        case 'openai':
          return await this.callOpenAI(modelName, sanitizedPrompt, options);
        case 'google':
          return await this.callGoogle(modelName, sanitizedPrompt, options);
        case 'mistral':
          return await this.callMistral(modelName, sanitizedPrompt, options);
        case 'cohere':
          return await this.callCohere(modelName, sanitizedPrompt, options);
        case 'together':
          return await this.callTogether(modelName, sanitizedPrompt, options);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      agentLogger.error('Cloud provider call failed', { provider, modelName, error });
      throw error;
    }
  }

  /**
   * Call Anthropic Claude API
   */
  async callAnthropic(modelName, prompt, options = {}) {
    try {
      // Mock implementation - in production would use actual Anthropic API
      agentLogger.info('Calling Anthropic API', { modelName });
      
      return {
        response: `[ANTHROPIC RESPONSE from ${modelName}]\n\nI'm Claude, and I understand you want me to help with: "${prompt.substring(0, 100)}..."\n\nAs the Relay Architect agent, I can help build and explain Relay Network components while maintaining privacy and security.`,
        metadata: {
          model: modelName,
          provider: 'anthropic',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 100
        }
      };
    } catch (error) {
      agentLogger.error('Anthropic API call failed', { modelName, error });
      throw error;
    }
  }

  /**
   * Call OpenAI GPT API
   */
  async callOpenAI(modelName, prompt, options = {}) {
    try {
      // Mock implementation - in production would use actual OpenAI API
      agentLogger.info('Calling OpenAI API', { modelName });
      
      return {
        response: `[OPENAI RESPONSE from ${modelName}]\n\nHello! I'm your Relay Navigator assistant. I can help you with: "${prompt.substring(0, 100)}..."\n\nI can guide you through the Relay interface, explain governance, help with channels, and coordinate with the Architect agent for development tasks.`,
        metadata: {
          model: modelName,
          provider: 'openai',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 80
        }
      };
    } catch (error) {
      agentLogger.error('OpenAI API call failed', { modelName, error });
      throw error;
    }
  }

  /**
   * Call Google Gemini API
   */
  async callGoogle(modelName, prompt, options = {}) {
    try {
      agentLogger.info('Calling Google API', { modelName });
      
      return {
        response: `[GOOGLE RESPONSE from ${modelName}]\n\nI'm Gemini, ready to assist with: "${prompt.substring(0, 100)}..."\n\nI can provide multimodal assistance for the Relay Network.`,
        metadata: {
          model: modelName,
          provider: 'google',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 60
        }
      };
    } catch (error) {
      agentLogger.error('Google API call failed', { modelName, error });
      throw error;
    }
  }

  /**
   * Call Mistral API
   */
  async callMistral(modelName, prompt, options = {}) {
    try {
      agentLogger.info('Calling Mistral API', { modelName });
      
      return {
        response: `[MISTRAL RESPONSE from ${modelName}]\n\nBonjour! I can help with: "${prompt.substring(0, 100)}..."\n\nMistral at your service for Relay Network assistance.`,
        metadata: {
          model: modelName,
          provider: 'mistral',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 70
        }
      };
    } catch (error) {
      agentLogger.error('Mistral API call failed', { modelName, error });
      throw error;
    }  }

  /**
   * Call Cohere API
   */
  async callCohere(modelName, prompt, options = {}) {
    try {
      agentLogger.info('Calling Cohere API', { modelName });
      
      return {
        response: `[COHERE RESPONSE from ${modelName}]\n\nHello! I'm Command and I understand you want me to help with: "${prompt.substring(0, 100)}..."\n\nI can assist with various Relay Network tasks using Cohere's capabilities.`,
        metadata: {
          model: modelName,
          provider: 'cohere',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 75
        }
      };
    } catch (error) {
      agentLogger.error('Cohere API call failed', { modelName, error });
      throw error;
    }
  }

  /**
   * Call Together AI API
   */
  async callTogether(modelName, prompt, options = {}) {
    try {
      agentLogger.info('Calling Together API', { modelName });
      
      return {
        response: `[TOGETHER RESPONSE from ${modelName}]\n\nI'm from Together AI and I can help with: "${prompt.substring(0, 100)}..."\n\nTogether AI provides access to various open-source models for the Relay Network.`,
        metadata: {
          model: modelName,
          provider: 'together',
          timestamp: new Date().toISOString(),
          tokensUsed: Math.floor(prompt.length / 4) + 65
        }
      };
    } catch (error) {
      agentLogger.error('Together API call failed', { modelName, error });
      throw error;
    }
  }

  /**
   * Get available models for agent type
   */
  getAvailableModels(agentType) {
    const agentConfig = this.modelRegistry[agentType];
    if (!agentConfig) {
      return [];
    }

    return agentConfig.available.map(model => ({
      name: model,
      capabilities: agentConfig.capabilities[model] || [],
      isDefault: model === agentConfig.default,
      isFallback: model === agentConfig.fallback
    }));
  }
  /**
   * Health check for all configured providers
   */
  async healthCheck() {
    const results = {
      local: { available: false, models: [] },
      cloud: { available: {}, models: {} }
    };

    // Check local providers
    try {
      // In production, would ping Ollama/LM Studio endpoints
      results.local.available = true;
      results.local.models = ['llama3:8b', 'mistral:7b']; // Mock available models
    } catch (error) {
      agentLogger.warn('Local providers unavailable', { error });
    }

    // Check cloud providers
    const cloudProviders = ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'together'];
    
    for (const provider of cloudProviders) {
      try {
        const hasKey = !!this.apiKeys[provider];
        results.cloud.available[provider] = hasKey;
        results.cloud.models[provider] = hasKey ? [`${provider}-model`] : [];
      } catch (error) {
        results.cloud.available[provider] = false;
        results.cloud.models[provider] = [];
      }
    }

    return results;
  }
}

export default AgentLLMBridge;
