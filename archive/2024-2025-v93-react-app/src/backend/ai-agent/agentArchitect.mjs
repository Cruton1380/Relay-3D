// backend/ai-agent/agentArchitect.mjs
/**
 * Relay Architect Agent - Development and system building agent (Claude powered)
 * Handles code generation, architecture, refactoring, and technical implementation
 */

import logger from '../utils/logging/logger.mjs';
import AgentLLMBridge from './agentLLMBridge.mjs';
import AgentLocalIndex from './agentLocalIndex.mjs';

const architectLogger = logger.child({ module: 'ai-agent-architect' });

/**
 * Relay Architect - Technical implementation AI assistant
 */
export class AgentArchitect {
  constructor(options = {}) {
    this.agentType = 'architect';
    this.llmBridge = options.llmBridge || new AgentLLMBridge();
    this.localIndex = options.localIndex || new AgentLocalIndex();
    this.implementationHistory = new Map();
    this.codebaseKnowledge = new Map();
    
    this.capabilities = [
      'code-generation',
      'architecture-design',
      'refactoring',
      'debugging',
      'module-creation',
      'api-development',
      'system-integration',
      'technical-validation'
    ];
  }

  /**
   * Process implementation request from Navigator or direct user input
   */
  async processImplementation(request, context = {}) {
    try {
      architectLogger.info('Processing architect implementation', {
        requestType: this.classifyImplementation(request),
        contextKeys: Object.keys(context),
        fromNavigator: !!context.fromNavigator
      });

      // Analyze the implementation request
      const analysis = await this.analyzeImplementationRequest(request, context);
      
      // Generate implementation plan
      const plan = await this.generateImplementationPlan(analysis);
      
      // Execute implementation if approved
      let implementation = null;
      if (context.autoExecute || context.approved) {
        implementation = await this.executeImplementation(plan, context);
      }

      // Generate summary for Navigator agent
      const navigatorSummary = this.generateNavigatorSummary(plan, implementation);

      return {
        agentType: this.agentType,
        analysis,
        plan,
        implementation,
        navigatorSummary,
        metadata: {
          timestamp: new Date().toISOString(),
          complexity: this.assessComplexity(analysis),
          estimatedTime: this.estimateImplementationTime(plan),
          dependencies: this.identifyDependencies(analysis)
        }
      };
    } catch (error) {
      architectLogger.error('Failed to process implementation', { error });
      throw error;
    }
  }

  /**
   * Classify the type of implementation request
   */
  classifyImplementation(request) {
    const text = request.toLowerCase();
    
    if (text.includes('module') || text.includes('class') || text.includes('component')) {
      return 'module-creation';
    }
    if (text.includes('api') || text.includes('endpoint') || text.includes('route')) {
      return 'api-development';
    }
    if (text.includes('refactor') || text.includes('optimize') || text.includes('improve')) {
      return 'refactoring';
    }
    if (text.includes('bug') || text.includes('fix') || text.includes('debug')) {
      return 'debugging';
    }
    if (text.includes('integrate') || text.includes('connect') || text.includes('bridge')) {
      return 'system-integration';
    }
    if (text.includes('architecture') || text.includes('design') || text.includes('structure')) {
      return 'architecture-design';
    }
    
    return 'code-generation';
  }

  /**
   * Analyze implementation request against codebase
   */
  async analyzeImplementationRequest(request, context) {
    try {
      // Search for relevant code patterns and architecture
      const searchResults = await this.localIndex.search(request, {
        fileTypes: ['javascript', 'typescript', 'json'],
        limit: 15
      });

      // Build analysis prompt
      const prompt = this.buildAnalysisPrompt(request, searchResults, context);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        userId: context.userId,
        context: { type: 'implementation-analysis' }
      });

      const analysis = this.parseAnalysisResponse(llmResponse.response);
      
      architectLogger.debug('Implementation analysis completed', {
        searchResults: searchResults.results.length,
        complexity: analysis.complexity
      });

      return {
        ...analysis,
        searchResults: searchResults.results,
        sourceFiles: searchResults.results.map(r => ({
          path: r.filePath,
          relevance: r.similarity,
          summary: r.summary
        }))
      };
    } catch (error) {
      architectLogger.error('Implementation analysis failed', { error });
      throw error;
    }
  }

  /**
   * Generate detailed implementation plan
   */
  async generateImplementationPlan(analysis) {
    try {
      const prompt = this.buildPlanningPrompt(analysis);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        context: { type: 'implementation-planning' }
      });

      const plan = this.parsePlanningResponse(llmResponse.response);
      
      architectLogger.debug('Implementation plan generated', {
        steps: plan.steps.length,
        filesToCreate: plan.filesToCreate.length,
        filesToModify: plan.filesToModify.length
      });

      return plan;
    } catch (error) {
      architectLogger.error('Implementation planning failed', { error });
      throw error;
    }
  }

  /**
   * Execute the implementation plan
   */
  async executeImplementation(plan, context) {
    try {
      architectLogger.info('Starting implementation execution', {
        steps: plan.steps.length,
        files: plan.filesToCreate.length + plan.filesToModify.length
      });

      const implementation = {
        executedSteps: [],
        createdFiles: [],
        modifiedFiles: [],
        errors: [],
        warnings: []
      };

      // Execute each step in the plan
      for (const step of plan.steps) {
        try {
          const stepResult = await this.executeImplementationStep(step, context);
          implementation.executedSteps.push({
            ...step,
            result: stepResult,
            status: 'completed'
          });

          if (stepResult.createdFiles) {
            implementation.createdFiles.push(...stepResult.createdFiles);
          }
          if (stepResult.modifiedFiles) {
            implementation.modifiedFiles.push(...stepResult.modifiedFiles);
          }
        } catch (error) {
          implementation.errors.push({
            step: step.name,
            error: error.message
          });
          implementation.executedSteps.push({
            ...step,
            status: 'failed',
            error: error.message
          });
        }
      }

      // Validate implementation
      const validation = await this.validateImplementation(implementation);
      implementation.validation = validation;

      architectLogger.info('Implementation execution completed', {
        success: implementation.errors.length === 0,
        createdFiles: implementation.createdFiles.length,
        modifiedFiles: implementation.modifiedFiles.length,
        errors: implementation.errors.length
      });

      return implementation;
    } catch (error) {
      architectLogger.error('Implementation execution failed', { error });
      throw error;
    }
  }

  /**
   * Execute a single implementation step
   */
  async executeImplementationStep(step, context) {
    try {
      const prompt = this.buildStepExecutionPrompt(step, context);
      
      const llmResponse = await this.llmBridge.routeRequest(this.agentType, prompt, {
        context: { type: 'step-execution', step: step.name }
      });

      const stepResult = this.parseStepExecutionResponse(llmResponse.response, step);
      
      architectLogger.debug('Implementation step executed', {
        stepName: step.name,
        type: step.type,
        outputType: stepResult.type
      });

      return stepResult;
    } catch (error) {
      architectLogger.error('Implementation step failed', { step: step.name, error });
      throw error;
    }
  }

  /**
   * Build analysis prompt for implementation request
   */
  buildAnalysisPrompt(request, searchResults, context) {
    const relevantCode = searchResults.results.map(r => 
      `File: ${r.filePath}\nRelevance: ${(r.similarity * 100).toFixed(1)}%\nSummary: ${r.summary}\nType: ${r.type}\n`
    ).join('\n');

    return `You are the Relay Architect, a technical AI agent specialized in Relay Network development.

IMPLEMENTATION REQUEST:
${request}

RELEVANT RELAY CODEBASE:
${relevantCode}

CONTEXT:
${JSON.stringify(context, null, 2)}

ANALYSIS TASK:
1. Understand what needs to be implemented
2. Identify existing patterns and modules to leverage
3. Assess complexity and dependencies
4. Determine integration points with existing systems
5. Identify potential challenges and solutions

OUTPUT FORMAT:
{
  "summary": "Brief summary of what needs to be implemented",
  "complexity": "low|medium|high",
  "requirements": ["requirement1", "requirement2"],
  "dependencies": ["dependency1", "dependency2"],
  "integrationPoints": ["system1", "system2"],
  "challenges": ["challenge1", "challenge2"],
  "recommendations": ["rec1", "rec2"]
}

Provide a thorough technical analysis focused on Relay Network architecture.`;
  }

  /**
   * Build planning prompt for implementation
   */
  buildPlanningPrompt(analysis) {
    return `You are the Relay Architect creating a detailed implementation plan.

ANALYSIS RESULTS:
${JSON.stringify(analysis, null, 2)}

PLANNING TASK:
Create a step-by-step implementation plan that:
1. Follows Relay Network architectural patterns
2. Integrates properly with existing systems
3. Maintains code quality and security standards
4. Is modular and testable
5. Includes proper error handling and logging

OUTPUT FORMAT:
{
  "overview": "Implementation overview",
  "steps": [
    {
      "name": "Step name",
      "type": "create|modify|configure|test",
      "description": "What this step does",
      "files": ["file1.mjs", "file2.mjs"],
      "dependencies": ["step1", "step2"],
      "estimatedTime": "time estimate"
    }
  ],
  "filesToCreate": ["new-file1.mjs", "new-file2.mjs"],
  "filesToModify": ["existing-file1.mjs"],
  "testingStrategy": "How to test the implementation",
  "rollbackPlan": "How to rollback if needed"
}

Focus on creating maintainable, secure, and well-integrated code.`;
  }

  /**
   * Build step execution prompt
   */
  buildStepExecutionPrompt(step, context) {
    return `You are the Relay Architect implementing a specific development step.

STEP TO EXECUTE:
${JSON.stringify(step, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

EXECUTION TASK:
Generate the actual code or configuration for this step.

REQUIREMENTS:
1. Follow Relay Network coding standards
2. Include proper error handling and logging
3. Add comprehensive JSDoc documentation
4. Follow ES modules syntax (import/export)
5. Integrate with existing Relay systems
6. Include input validation and security checks

OUTPUT FORMAT:
{
  "type": "code|config|documentation",
  "content": "The actual implementation content",
  "filename": "target-file.mjs",
  "description": "What this implementation does",
  "imports": ["module1", "module2"],
  "exports": ["export1", "export2"],
  "tests": "Suggested test cases",
  "usage": "How to use this implementation"
}

Generate production-ready code that integrates seamlessly with Relay.`;
  }

  /**
   * Parse analysis response from LLM
   */
  parseAnalysisResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse structured response manually
      return {
        summary: this.extractSection(response, 'summary') || 'Implementation analysis',
        complexity: this.extractSection(response, 'complexity') || 'medium',
        requirements: this.extractList(response, 'requirements') || [],
        dependencies: this.extractList(response, 'dependencies') || [],
        integrationPoints: this.extractList(response, 'integrationPoints') || [],
        challenges: this.extractList(response, 'challenges') || [],
        recommendations: this.extractList(response, 'recommendations') || []
      };
    } catch (error) {
      architectLogger.warn('Failed to parse analysis response', { error });
      return {
        summary: 'Analysis parsing failed',
        complexity: 'high',
        requirements: [],
        dependencies: [],
        integrationPoints: [],
        challenges: ['Response parsing failed'],
        recommendations: ['Manual review required']
      };
    }
  }

  /**
   * Parse planning response from LLM
   */
  parsePlanningResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        overview: this.extractSection(response, 'overview') || 'Implementation plan',
        steps: this.extractSteps(response) || [],
        filesToCreate: this.extractList(response, 'filesToCreate') || [],
        filesToModify: this.extractList(response, 'filesToModify') || [],
        testingStrategy: this.extractSection(response, 'testingStrategy') || 'Manual testing required',
        rollbackPlan: this.extractSection(response, 'rollbackPlan') || 'Revert file changes'
      };
    } catch (error) {
      architectLogger.warn('Failed to parse planning response', { error });
      return {
        overview: 'Planning parsing failed',
        steps: [],
        filesToCreate: [],
        filesToModify: [],
        testingStrategy: 'Manual testing required',
        rollbackPlan: 'Manual rollback required'
      };
    }
  }

  /**
   * Parse step execution response from LLM
   */
  parseStepExecutionResponse(response, step) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Extract code blocks
      const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : response;

      return {
        type: 'code',
        content: code,
        filename: step.files?.[0] || 'generated-file.mjs',
        description: `Implementation for ${step.name}`,
        imports: this.extractImports(code),
        exports: this.extractExports(code),
        tests: 'Standard unit tests recommended',
        usage: 'Import and use according to documentation'
      };
    } catch (error) {
      architectLogger.warn('Failed to parse step execution response', { error });
      return {
        type: 'code',
        content: `// Implementation failed to parse\n// Manual review required\n${response}`,
        filename: 'failed-implementation.mjs',
        description: 'Implementation parsing failed',
        imports: [],
        exports: [],
        tests: 'Manual testing required',
        usage: 'Manual review and correction needed'
      };
    }
  }

  /**
   * Extract section from text response
   */
  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}[:\s]*([^\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract list items from text response
   */
  extractList(text, listName) {
    const regex = new RegExp(`${listName}[:\s]*\\[(.*?)\\]`, 'is');
    const match = text.match(regex);
    if (match) {
      return match[1].split(',').map(item => item.trim().replace(/['"]/g, ''));
    }
    return [];
  }

  /**
   * Extract steps from planning response
   */
  extractSteps(text) {
    const steps = [];
    const stepPattern = /step[s]?[:\s]*\[(.*?)\]/is;
    const match = text.match(stepPattern);
    
    if (match) {
      // This is a simplified extraction - in production would be more sophisticated
      const stepCount = (text.match(/step \d+/gi) || []).length;
      for (let i = 1; i <= stepCount; i++) {
        steps.push({
          name: `Step ${i}`,
          type: 'create',
          description: `Implementation step ${i}`,
          files: [],
          dependencies: [],
          estimatedTime: '30 minutes'
        });
      }
    }
    
    return steps;
  }

  /**
   * Extract imports from code
   */
  extractImports(code) {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * Extract exports from code
   */
  extractExports(code) {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    const exports = [];
    let match;
    
    while ((match = exportRegex.exec(code)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  /**
   * Validate implementation
   */
  async validateImplementation(implementation) {
    const validation = {
      isValid: true,
      syntaxErrors: [],
      logicWarnings: [],
      securityIssues: [],
      integrationConcerns: []
    };

    // Basic validation checks
    for (const file of implementation.createdFiles) {
      if (file.content && file.filename.endsWith('.mjs')) {
        // Check for basic syntax issues
        if (!file.content.includes('export')) {
          validation.logicWarnings.push(`${file.filename}: No exports detected`);
        }
        
        // Check for security patterns
        if (file.content.includes('eval(') || file.content.includes('new Function(')) {
          validation.securityIssues.push(`${file.filename}: Potentially unsafe code execution`);
        }
      }
    }

    validation.isValid = validation.syntaxErrors.length === 0 && validation.securityIssues.length === 0;
    
    return validation;
  }

  /**
   * Generate summary for Navigator agent
   */
  generateNavigatorSummary(plan, implementation) {
    if (!implementation) {
      return {
        status: 'planned',
        summary: `Implementation plan created with ${plan.steps.length} steps`,
        details: plan.overview,
        nextSteps: 'Awaiting approval to execute implementation'
      };
    }

    const successfulSteps = implementation.executedSteps.filter(s => s.status === 'completed').length;
    const failedSteps = implementation.errors.length;

    return {
      status: failedSteps === 0 ? 'completed' : 'partial',
      summary: `Implementation ${failedSteps === 0 ? 'completed successfully' : 'completed with errors'}`,
      details: `${successfulSteps}/${implementation.executedSteps.length} steps completed, ${implementation.createdFiles.length} files created`,
      files: implementation.createdFiles.map(f => f.filename),
      errors: implementation.errors,
      nextSteps: failedSteps > 0 ? 'Manual review and error correction needed' : 'Implementation ready for testing'
    };
  }

  /**
   * Assess implementation complexity
   */
  assessComplexity(analysis) {
    const factors = [
      analysis.dependencies.length,
      analysis.integrationPoints.length,
      analysis.challenges.length,
      analysis.requirements.length
    ];
    
    const totalComplexity = factors.reduce((sum, factor) => sum + factor, 0);
    
    if (totalComplexity <= 5) return 'low';
    if (totalComplexity <= 15) return 'medium';
    return 'high';
  }

  /**
   * Estimate implementation time
   */
  estimateImplementationTime(plan) {
    const baseTime = plan.steps.length * 30; // 30 minutes per step
    const fileComplexity = (plan.filesToCreate.length + plan.filesToModify.length) * 15; // 15 minutes per file
    
    return `${baseTime + fileComplexity} minutes`;
  }

  /**
   * Identify dependencies
   */
  identifyDependencies(analysis) {
    return [
      ...analysis.dependencies,
      ...analysis.integrationPoints
    ].filter((dep, index, arr) => arr.indexOf(dep) === index);
  }

  /**
   * Get implementation history
   */
  getImplementationHistory(userId) {
    return this.implementationHistory.get(userId) || [];
  }

  /**
   * Update implementation history
   */
  updateImplementationHistory(userId, implementation) {
    const history = this.getImplementationHistory(userId);
    history.push({
      ...implementation,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 implementations
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    this.implementationHistory.set(userId, history);
  }

  /**
   * Clear user implementation data
   */
  clearUserData(userId) {
    this.implementationHistory.delete(userId);
    architectLogger.info('User implementation data cleared', { userId: '[REDACTED]' });
  }
}

export default AgentArchitect;
