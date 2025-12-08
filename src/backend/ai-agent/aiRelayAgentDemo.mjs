/**
 * Relay AI Agent System Demo
 * Showcases dual-agent collaboration workflow with Navigator and Architect
 */

import { AIRelayAgent } from './aiRelayAgent.mjs';
import { appLogger } from '../utils/logging/logger.mjs';

const logger = appLogger.child({ module: 'AIRelayAgentDemo' });

class AIRelayAgentDemo {
    constructor() {
        this.agent = new AIRelayAgent();
        this.demoScenarios = [
            'channel_creation',
            'governance_explanation',
            'code_refactoring',
            'keyspace_organization',
            'collaboration_loop'
        ];
    }

    /**
     * Main demo runner
     */
    async runFullDemo() {
        logger.info('🚀 Starting Relay AI Agent System Demo');
        
        try {
            await this.agent.initialize();
            
            console.log('\n=== Relay AI Agent System Demo ===\n');
            
            for (const scenario of this.demoScenarios) {
                await this.runScenario(scenario);
                await this.pause(2000);
            }
            
            await this.demonstrateModelSwitching();
            await this.demonstrateCollaborationLoop();
            
            logger.info('✅ Demo completed successfully');
            
        } catch (error) {
            logger.error('❌ Demo failed:', error);
        } finally {
            await this.agent.shutdown();
        }
    }

    /**
     * Scenario 1: Channel Creation with Navigator
     */
    async runChannelCreationDemo() {
        console.log('\n📊 === Channel Creation Demo ===');
        
        const userRequest = "I want to create a channel for regional news aggregation with automated content ranking and community moderation";
        
        console.log(`User Request: "${userRequest}"\n`);
        
        // Navigator handles initial planning
        const navigatorResponse = await this.agent.query({
            message: userRequest,
            preferredAgent: 'navigator',
            context: { demo: true }
        });
        
        console.log('🧭 Navigator Response:');
        console.log(navigatorResponse.content);
        console.log('\n📋 Navigator Plan:', navigatorResponse.plan);
        
        return navigatorResponse;
    }

    /**
     * Scenario 2: Code Implementation with Architect
     */
    async runCodeImplementationDemo(navigatorPlan) {
        console.log('\n🏗️ === Code Implementation Demo ===');
        
        // Architect receives the plan and implements
        const architectResponse = await this.agent.query({
            message: `Implement the channel creation plan: ${JSON.stringify(navigatorPlan)}`,
            preferredAgent: 'architect',
            context: { 
                demo: true,
                followUp: true,
                previousAgent: 'navigator'
            }
        });
        
        console.log('🔧 Architect Response:');
        console.log(architectResponse.content);
        console.log('\n📝 Implementation Summary:', architectResponse.summary);
        
        return architectResponse;
    }

    /**
     * Scenario 3: Governance Explanation
     */
    async runGovernanceDemo() {
        console.log('\n🗳️ === Governance Explanation Demo ===');
        
        const governanceQuery = "Explain how DAG voting works for badge issuance and what happens during quorum failure";
        
        const response = await this.agent.query({
            message: governanceQuery,
            preferredAgent: 'navigator',
            context: { demo: true }
        });
        
        console.log('🧭 Navigator Governance Explanation:');
        console.log(response.content);
        
        return response;
    }

    /**
     * Scenario 4: KeySpace Organization
     */
    async runKeySpaceDemo() {
        console.log('\n🗂️ === KeySpace Organization Demo ===');
        
        const keyspaceQuery = "Help me organize my project files by topic and set up permission trees for team collaboration";
        
        const response = await this.agent.query({
            message: keyspaceQuery,
            preferredAgent: 'navigator',
            context: { demo: true }
        });
        
        console.log('🗂️ KeySpace Organization Guide:');
        console.log(response.content);
        
        return response;
    }

    /**
     * Demonstrate dual-agent collaboration loop
     */
    async demonstrateCollaborationLoop() {
        console.log('\n🔄 === Dual-Agent Collaboration Loop Demo ===');
        
        const complexRequest = "Create a new voting mechanism for emergency channel moderation with fail-safes";
        
        console.log(`Complex Request: "${complexRequest}"\n`);
        
        // Start collaboration loop
        const loopResult = await this.agent.startCollaborationLoop({
            initialRequest: complexRequest,
            maxIterations: 3,
            demo: true
        });
        
        console.log('🔄 Collaboration Loop Results:');
        console.log(`Iterations: ${loopResult.iterations}`);
        console.log(`Final Status: ${loopResult.status}`);
        console.log('Navigator Contributions:', loopResult.navigatorContributions);
        console.log('Architect Contributions:', loopResult.architectContributions);
        
        return loopResult;
    }

    /**
     * Demonstrate model switching capabilities
     */
    async demonstrateModelSwitching() {
        console.log('\n🔀 === Model Switching Demo ===');
        
        // Show current models
        const currentConfig = await this.agent.getCurrentModelConfig();
        console.log('Current Model Configuration:', currentConfig);
        
        // Switch Architect to different model
        console.log('\nSwitching Architect to DeepSeek-Coder...');
        await this.agent.switchModel('architect', 'deepseek-coder');
        
        // Test with new model
        const testResponse = await this.agent.query({
            message: "Explain the current hashgraph implementation",
            preferredAgent: 'architect',
            context: { demo: true }
        });
        
        console.log('🔧 Architect Response (DeepSeek-Coder):');
        console.log(testResponse.content);
        
        // Switch back to default
        console.log('\nSwitching back to default model...');
        await this.agent.switchModel('architect', 'default');
    }

    /**
     * Run individual scenario
     */
    async runScenario(scenarioName) {
        switch (scenarioName) {
            case 'channel_creation':
                return await this.runChannelCreationDemo();
            case 'governance_explanation':
                return await this.runGovernanceDemo();
            case 'code_refactoring':
                return await this.runCodeRefactoringDemo();
            case 'keyspace_organization':
                return await this.runKeySpaceDemo();
            case 'collaboration_loop':
                return await this.demonstrateCollaborationLoop();
            default:
                console.log(`Unknown scenario: ${scenarioName}`);
        }
    }

    /**
     * Code refactoring demo
     */
    async runCodeRefactoringDemo() {
        console.log('\n⚙️ === Code Refactoring Demo ===');
        
        const refactorRequest = "Review and optimize the channel ranking algorithm for better performance";
        
        const response = await this.agent.query({
            message: refactorRequest,
            preferredAgent: 'architect',
            context: { demo: true }
        });
        
        console.log('🔧 Architect Refactoring Analysis:');
        console.log(response.content);
        
        return response;
    }

    /**
     * Privacy and security demo
     */
    async demonstratePrivacyFeatures() {
        console.log('\n🔐 === Privacy & Security Demo ===');
        
        // Show memory policy enforcement
        const memoryStatus = await this.agent.getMemoryStatus();
        console.log('Memory Policy Status:', memoryStatus);
        
        // Demonstrate prompt scrubbing
        const sensitivePrompt = "User john.doe@email.com in channel #private-location-123 wants to create a channel";
        const scrubbedPrompt = await this.agent.scrubPrompt(sensitivePrompt);
        
        console.log('Original Prompt:', sensitivePrompt);
        console.log('Scrubbed Prompt:', scrubbedPrompt);
        
        // Show opt-out controls
        console.log('\n🚫 Opt-out Controls:');
        console.log('Memory purge available:', await this.agent.canPurgeMemory());
        console.log('Offline mode supported:', await this.agent.supportsOfflineMode());
    }

    /**
     * Utility: Pause execution
     */
    async pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Interactive demo mode
     */
    async runInteractiveDemo() {
        console.log('\n🎮 === Interactive Demo Mode ===');
        console.log('Type your requests, or "quit" to exit\n');
        
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const askQuestion = (question) => {
            return new Promise(resolve => rl.question(question, resolve));
        };
        
        try {
            await this.agent.initialize();
            
            while (true) {
                const userInput = await askQuestion('You: ');
                
                if (userInput.toLowerCase() === 'quit') {
                    break;
                }
                
                const response = await this.agent.query({
                    message: userInput,
                    context: { interactive: true }
                });
                
                console.log(`\n${response.agent}: ${response.content}\n`);
            }
            
        } finally {
            rl.close();
            await this.agent.shutdown();
        }
    }
}

// CLI Runner
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new AIRelayAgentDemo();
    
    const mode = process.argv[2] || 'full';
    
    switch (mode) {
        case 'interactive':
            await demo.runInteractiveDemo();
            break;
        case 'privacy':
            await demo.demonstratePrivacyFeatures();
            break;
        case 'models':
            await demo.demonstrateModelSwitching();
            break;
        default:
            await demo.runFullDemo();
    }
}

export { AIRelayAgentDemo };
