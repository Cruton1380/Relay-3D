// backend/ai-agent/agentNavigator.mjs
/**
 * Relay Navigator Agent - User interface and interaction agent (GPT-4o powered)
 * Handles user requests, planning, summarization, and coordination
 */

import logger from '../utils/logging/logger.mjs';
import AgentLLMBridge from './agentLLMBridge.mjs';
import AgentLocalIndex from './agentLocalIndex.mjs';

const navigatorLogger = logger.child({ module: 'ai-agent-navigator' });

/**
 * Relay Navigator - User-facing AI assistant
 */
export class AgentNavigator {
  constructor(options = {}) {
    this.agentType = 'navigator';
    this.llmBridge = options.llmBridge || new AgentLLMBridge();
    this.localIndex = options.localIndex || new AgentLocalIndex();
    this.conversationHistory = new Map();
    this.userPreferences = new Map();
    
    this.capabilities = [
      'channel-design',
      'governance-explanation', 
      'ui-navigation',
      'keyspace-assistance',
      'prompt-planning',
      'output-review',
      'user-conversation'
    ];
  }

  /**
   * Process user request and route to appropriate handler
   */
  async processRequest(userId, request, context = {}) {
    try {
      navigatorLogger.info('Processing navigator request', {
        userId: userId ? '[REDACTED]' : null,
        requestType: this.classifyRequest(request),
        contextKeys: Object.keys(context)
      });

      // Get user conversation history
      const history = this.getConversationHistory(userId);
      
      // Classify the request type
      const requestType = this.classifyRequest(request);
      
      // Route to specific handler
      let response;
      switch (requestType) {
        case 'channel-design':
          response = await this.handleChannelDesign(request, context, history);
          break;
        case 'governance-query':
          response = await this.handleGovernanceQuery(request, context, history);
          break;
        case 'ui-navigation':
          response = await this.handleUINavigation(request, context, history);
          break;
        case 'keyspace-help':
          response = await this.handleKeySpaceHelp(request, context, history);
          break;
        case 'development-planning':
          response = await this.handleDevelopmentPlanning(request, context, history);
          break;
        case 'general-conversation':
          response = await this.handleGeneralConversation(request, context, history);
          break;
        default:
          response = await this.handleGeneralConversation(request, context, history);
      }

      // Update conversation history
      this.updateConversationHistory(userId, request, response);

      return {
        agentType: this.agentType,
        requestType,
        response: response.content,
        metadata: response.metadata,
        suggestions: response.suggestions || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      navigatorLogger.error('Failed to process navigator request', { userId, error });
      throw error;
    }
  }

  /**
   * Classify the type of user request
   */
  classifyRequest(request) {
    const text = request.toLowerCase();
    
    if (text.includes('channel') && (text.includes('create') || text.includes('design'))) {
      return 'channel-design';
    }
    if (text.includes('voting') || text.includes('governance') || text.includes('badge') || text.includes('dag')) {
      return 'governance-query';
    }
    if (text.includes('navigate') || text.includes('globe') || text.includes('timeline') || text.includes('ui')) {
      return 'ui-navigation';
    }
    if (text.includes('keyspace') || text.includes('file') || text.includes('permission') || text.includes('share')) {
      return 'keyspace-help';
    }
    if (text.includes('build') || text.includes('code') || text.includes('develop') || text.includes('implement')) {
      return 'development-planning';
    }
    
    return 'general-conversation';
  }

  /**
   * Handle channel design requests
   */
  async handleChannelDesign(request, context, history) {
    try {
      // Search for relevant channel examples and schemas
      const searchResults = await this.localIndex.search('channel governance parameters ranking', {
        fileTypes: ['json', 'javascript'],
        limit: 5
      });

      const prompt = this.buildChannelDesignPrompt(request, searchResults, history);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'channel-design' }
      });

      return {
        content: llmResponse.response,
        metadata: {
          ...llmResponse.metadata,
          searchResults: searchResults.results.length,
          sourceFiles: searchResults.results.map(r => r.filePath)
        },
        suggestions: [
          'Would you like me to explain the governance parameters?',
          'Should I help you test the channel configuration?',
          'Want to see examples of similar channels?'
        ]
      };
    } catch (error) {
      navigatorLogger.error('Channel design handling failed', { error });
      throw error;
    }
  }

  /**
   * Handle governance and voting queries
   */
  async handleGovernanceQuery(request, context, history) {
    try {
      // Search for governance-related code and documentation
      const searchResults = await this.localIndex.search('governance voting dag badge sortition moderation', {
        fileTypes: ['javascript', 'markdown', 'json'],
        limit: 8
      });

      const prompt = this.buildGovernancePrompt(request, searchResults, history);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'governance-query' }
      });

      return {
        content: llmResponse.response,
        metadata: {
          ...llmResponse.metadata,
          searchResults: searchResults.results.length,
          governanceRules: this.extractGovernanceRules(searchResults)
        },
        suggestions: [
          'Want me to explain the voting process step-by-step?',
          'Should I show you the badge requirements?',
          'Would you like to see the moderation workflow?'
        ]
      };
    } catch (error) {
      navigatorLogger.error('Governance query handling failed', { error });
      throw error;
    }
  }

  /**
   * Handle UI navigation assistance
   */
  async handleUINavigation(request, context, history) {
    try {
      // Search for UI-related code and navigation logic
      const searchResults = await this.localIndex.search('ui navigation globe timeline interface', {
        fileTypes: ['javascript', 'markdown'],
        limit: 5
      });

      const prompt = this.buildUINavigationPrompt(request, searchResults, history, context);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'ui-navigation' }
      });

      return {
        content: llmResponse.response,
        metadata: {
          ...llmResponse.metadata,
          searchResults: searchResults.results.length,
          currentView: context.currentView || 'unknown'
        },
        suggestions: [
          'Need help with the Globe view features?',
          'Want to explore the Timeline navigation?',
          'Should I guide you through the interface?'
        ]
      };
    } catch (error) {
      navigatorLogger.error('UI navigation handling failed', { error });
      throw error;
    }
  }

  /**
   * Handle KeySpace file management assistance
   */
  async handleKeySpaceHelp(request, context, history) {
    try {
      // Search for KeySpace-related code and documentation
      const searchResults = await this.localIndex.search('keyspace file permission sharing storage encryption', {
        fileTypes: ['javascript', 'markdown'],
        limit: 6
      });

      const prompt = this.buildKeySpacePrompt(request, searchResults, history);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'keyspace-help' }
      });

      return {
        content: llmResponse.response,
        metadata: {
          ...llmResponse.metadata,
          searchResults: searchResults.results.length,
          keyspaceFeatures: this.extractKeySpaceFeatures(searchResults)
        },
        suggestions: [
          'Want help organizing your files?',
          'Need assistance with sharing permissions?',
          'Should I explain the encryption process?'
        ]
      };
    } catch (error) {
      navigatorLogger.error('KeySpace help handling failed', { error });
      throw error;
    }
  }

  /**
   * Handle development planning and coordination with Architect
   */
  async handleDevelopmentPlanning(request, context, history) {
    try {
      // Search for relevant code architecture and patterns
      const searchResults = await this.localIndex.search('architecture module pattern implementation api', {
        fileTypes: ['javascript', 'markdown'],
        limit: 7
      });

      const prompt = this.buildDevelopmentPlanningPrompt(request, searchResults, history);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'development-planning' }
      });

      // Extract architect instructions if this requires collaboration
      const architectInstructions = this.extractArchitectInstructions(llmResponse.response);

      return {
        content: llmResponse.response,
        metadata: {
          ...llmResponse.metadata,
          searchResults: searchResults.results.length,
          requiresArchitect: !!architectInstructions,
          architectInstructions
        },
        suggestions: [
          'Ready to coordinate with the Architect agent?',
          'Would you like me to refine the requirements?',
          'Should I break this into smaller tasks?'
        ]
      };
    } catch (error) {
      navigatorLogger.error('Development planning handling failed', { error });
      throw error;
    }
  }

  /**
   * Handle general conversation
   */
  async handleGeneralConversation(request, context, history) {
    try {
      const prompt = this.buildGeneralConversationPrompt(request, history, context);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'general-conversation' }
      });

      return {
        content: llmResponse.response,
        metadata: llmResponse.metadata,
        suggestions: [
          'How can I help you with Relay today?',
          'Want to explore channels or governance?',
          'Need help with KeySpace or development?'
        ]
      };
    } catch (error) {
      navigatorLogger.error('General conversation handling failed', { error });
      throw error;
    }
  }

  /**
   * Build channel design prompt
   */
  buildChannelDesignPrompt(request, searchResults, history) {
    const contextInfo = searchResults.results.map(r => 
      `${r.filePath}: ${r.summary}`
    ).join('\n');

    return `You are the Relay Navigator, a user-friendly AI assistant for the Relay Network platform.

CONTEXT: Channel Design Request
User wants help with: ${request}

RELEVANT RELAY CODEBASE:
${contextInfo}

CONVERSATION HISTORY:
${this.formatHistory(history.slice(-3))}

INSTRUCTIONS:
1. Help the user design a channel with appropriate governance parameters
2. Explain how ranking, eligibility, and quorum work
3. Suggest realistic configurations based on their needs
4. Keep explanations clear and user-friendly
5. NEVER actually create channels - only provide guidance

Respond as a helpful guide who understands Relay deeply but explains things simply.`;
  }

  /**
   * Build governance query prompt
   */
  buildGovernancePrompt(request, searchResults, history) {
    const contextInfo = searchResults.results.map(r => 
      `${r.filePath}: ${r.summary}`
    ).join('\n');

    return `You are the Relay Navigator, explaining Relay Network governance to users.

CONTEXT: Governance Query
User asks: ${request}

RELEVANT RELAY GOVERNANCE CODE:
${contextInfo}

CONVERSATION HISTORY:
${this.formatHistory(history.slice(-3))}

INSTRUCTIONS:
1. Explain governance concepts clearly (DAG voting, badges, sortition, moderation)
2. Use the codebase context to provide accurate information
3. Never simulate or execute governance actions
4. Break down complex processes into understandable steps
5. Reference specific source files when helpful

Respond as an expert guide who makes governance accessible.`;
  }

  /**
   * Build UI navigation prompt
   */
  buildUINavigationPrompt(request, searchResults, history, context) {
    const contextInfo = searchResults.results.map(r => 
      `${r.filePath}: ${r.summary}`
    ).join('\n');

    return `You are the Relay Navigator, helping users navigate the Relay interface.

CONTEXT: UI Navigation Help
User needs: ${request}
Current view: ${context.currentView || 'unknown'}

RELEVANT UI CODE:
${contextInfo}

CONVERSATION HISTORY:
${this.formatHistory(history.slice(-3))}

INSTRUCTIONS:
1. Guide users through Globe view, Timeline, and other interfaces
2. Explain features and interaction patterns
3. Provide step-by-step navigation help
4. Suggest useful features they might not know about
5. Keep instructions clear and actionable

Respond as a friendly interface guide.`;
  }

  /**
   * Build KeySpace assistance prompt
   */
  buildKeySpacePrompt(request, searchResults, history) {
    const contextInfo = searchResults.results.map(r => 
      `${r.filePath}: ${r.summary}`
    ).join('\n');

    return `You are the Relay Navigator, helping users with KeySpace file management.

CONTEXT: KeySpace Assistance
User needs help with: ${request}

RELEVANT KEYSPACE CODE:
${contextInfo}

CONVERSATION HISTORY:
${this.formatHistory(history.slice(-3))}

INSTRUCTIONS:
1. Help users understand file organization, sharing, and permissions
2. Explain encryption and privacy features
3. Guide through permission trees and access controls
4. Suggest best practices for file management
5. Never access or modify actual files - only provide guidance

Respond as a knowledgeable file management assistant.`;
  }

  /**
   * Build development planning prompt
   */
  buildDevelopmentPlanningPrompt(request, searchResults, history) {
    const contextInfo = searchResults.results.map(r => 
      `${r.filePath}: ${r.summary}`
    ).join('\n');

    return `You are the Relay Navigator, planning development work with users.

CONTEXT: Development Planning
User wants to build: ${request}

RELEVANT CODEBASE PATTERNS:
${contextInfo}

CONVERSATION HISTORY:
${this.formatHistory(history.slice(-3))}

INSTRUCTIONS:
1. Break down the request into clear requirements
2. Identify which Relay modules/patterns to use
3. Plan the collaboration with the Architect agent
4. Create clear, implementable specifications
5. Consider system architecture and integration points

If this requires code implementation, create a detailed prompt for the Architect agent.

Respond as a technical project manager who understands Relay architecture.`;
  }

  /**
   * Build general conversation prompt
   */
  buildGeneralConversationPrompt(request, history, context) {
    return `You are the Relay Navigator, a friendly AI assistant for the Relay Network.

USER REQUEST: ${request}

CONVERSATION HISTORY:
${this.formatHistory(history.slice(-5))}

CONTEXT: ${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Be helpful, friendly, and knowledgeable about Relay
2. Guide users to specific features when appropriate
3. Offer to help with channels, governance, KeySpace, or development
4. Keep responses concise but informative
5. Maintain context from the conversation

Respond as a knowledgeable Relay platform assistant.`;
  }

  /**
   * Format conversation history for prompts
   */
  formatHistory(history) {
    if (!history || history.length === 0) return 'No previous conversation.';
    
    return history.map(item => 
      `User: ${item.request}\nNavigator: ${item.response.substring(0, 200)}...`
    ).join('\n\n');
  }

  /**
   * Extract architect instructions from response
   */
  extractArchitectInstructions(response) {
    // Look for patterns indicating architect collaboration is needed
    const needsArchitect = response.toLowerCase().includes('architect') || 
                          response.toLowerCase().includes('implement') ||
                          response.toLowerCase().includes('build code');
    
    if (!needsArchitect) return null;

    return {
      task: 'Implementation required',
      requirements: response.substring(0, 500),
      collaboration: true
    };
  }

  /**
   * Extract governance rules from search results
   */
  extractGovernanceRules(searchResults) {
    return searchResults.results.filter(r => 
      r.summary.includes('governance') || 
      r.summary.includes('voting') ||
      r.summary.includes('badge')
    ).map(r => r.summary);
  }

  /**
   * Extract KeySpace features from search results
   */
  extractKeySpaceFeatures(searchResults) {
    return searchResults.results.filter(r =>
      r.summary.includes('keyspace') ||
      r.summary.includes('permission') ||
      r.summary.includes('sharing')
    ).map(r => r.summary);
  }

  /**
   * Get conversation history for user
   */
  getConversationHistory(userId) {
    if (!userId) return [];
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(userId, request, response) {
    if (!userId) return;
    
    const history = this.getConversationHistory(userId);
    history.push({
      request,
      response: response.content,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 exchanges
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversationHistory.set(userId, history);
  }

  /**
   * Set user preferences
   */
  setUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, {
      ...this.userPreferences.get(userId),
      ...preferences,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {
      verbosity: 'medium',
      style: 'casual',
      topics: []
    };
  }

  /**
   * Clear user data (privacy compliance)
   */
  clearUserData(userId) {
    this.conversationHistory.delete(userId);
    this.userPreferences.delete(userId);
    navigatorLogger.info('User data cleared', { userId: '[REDACTED]' });
  }
}

export default AgentNavigator;
