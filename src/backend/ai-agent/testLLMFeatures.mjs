#!/usr/bin/env node

/**
 * Relay AI Agent CLI Tool - Simple Version
 * Command-line interface for testing the enhanced LLM capabilities
 */

import { AIRelayAgent } from './aiRelayAgent.mjs';
import { AgentLLMBridge } from './agentLLMBridge.mjs';
import { AgentModelSwitcher } from './agentModelSwitcher.mjs';

class SimpleAIAgentCLI {
    constructor() {
        this.agent = null;
        this.llmBridge = null;
        this.modelSwitcher = null;
    }

    async initialize() {
        try {
            console.log('🤖 Initializing Relay AI Agent System...');
            
            this.llmBridge = new AgentLLMBridge();
            this.modelSwitcher = new AgentModelSwitcher();
            
            console.log('✅ System initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async healthCheck() {
        if (!await this.initialize()) return;

        try {
            console.log('\n🏥 Running LLM Provider Health Check...\n');
            
            const health = await this.llmBridge.healthCheck();
            
            console.log('Local Providers:');
            console.log(`  • Status: ${health.local.available ? '✅ Available' : '❌ Unavailable'}`);
            if (health.local.models?.length > 0) {
                console.log(`  • Models: ${health.local.models.join(', ')}`);
            }
            
            console.log('\nCloud Providers:');
            for (const [provider, status] of Object.entries(health.cloud.available)) {
                const statusText = status ? '✅ Available' : '❌ No API Key';
                console.log(`  • ${provider}: ${statusText}`);
                
                if (health.cloud.models[provider]?.length > 0) {
                    console.log(`    Models: ${health.cloud.models[provider].join(', ')}`);
                }
            }
            
            console.log('\n📝 Note: This is a test health check with mock data.');
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
        }
    }

    async testLLMSources() {
        if (!await this.initialize()) return;

        try {
            console.log('\n🧪 Testing LLM Source Configuration...\n');
            
            // Test CLI argument parsing
            const testArgs = [
                'node', 'script.js',
                '--llm-source=anthropic',
                '--navigator-model=claude-3-haiku',
                '--architect-model=claude-3-5-sonnet'
            ];
            
            const config = this.modelSwitcher.parseCLIArgs(testArgs);
            console.log('✅ CLI Config Parsed:', JSON.stringify(config, null, 2));
            
            // Test model info detection
            const testModels = ['gpt-4o', 'claude-3-5-sonnet', 'llama3:8b', 'mistral:7b'];
            
            console.log('\n🔍 Model Provider Detection:');
            for (const model of testModels) {
                try {
                    const modelInfo = this.llmBridge.getModelInfo(model);
                    console.log(`  • ${model}: ${modelInfo.provider} (${modelInfo.sourceType || 'unknown'})`);
                } catch (error) {
                    console.log(`  • ${model}: ❌ ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error('❌ LLM source test failed:', error.message);
        }
    }

    async testEncryption() {
        if (!await this.initialize()) return;

        try {
            console.log('\n🔐 Testing API Key Encryption...\n');
            
            const testApiKey = 'sk-test-api-key-12345';
            const testUserId = 'test-user-123';
            
            // Test encryption/decryption
            const encrypted = this.llmBridge.encryptApiKey(testApiKey);
            const decrypted = this.llmBridge.decryptApiKey(encrypted);
            
            console.log('✅ Encryption test:');
            console.log(`  • Original: ${testApiKey}`);
            console.log(`  • Encrypted: ${encrypted.substring(0, 20)}...`);
            console.log(`  • Decrypted: ${decrypted}`);
            console.log(`  • Match: ${testApiKey === decrypted ? '✅' : '❌'}`);
            
            // Test user credential management
            await this.llmBridge.addUserApiKey(testUserId, 'openai', testApiKey);
            const retrievedKey = this.llmBridge.getApiKey('openai', testUserId);
            
            console.log('\n✅ User credential test:');
            console.log(`  • Stored and retrieved key match: ${testApiKey === retrievedKey ? '✅' : '❌'}`);
            
        } catch (error) {
            console.error('❌ Encryption test failed:', error.message);
        }
    }

    async showCurrentConfig() {
        if (!await this.initialize()) return;

        try {
            console.log('\n⚙️  Current System Configuration:\n');
            
            // Show environment variables
            const envVars = [
                'RELAY_USE_LOCAL_LLM',
                'RELAY_CLOUD_PROVIDER',
                'OPENAI_API_KEY',
                'ANTHROPIC_API_KEY',
                'RELAY_ENCRYPTION_KEY'
            ];
            
            console.log('Environment Variables:');
            envVars.forEach(envVar => {
                const value = process.env[envVar];
                if (value) {
                    const maskedValue = envVar.includes('KEY') ? value.substring(0, 8) + '...' : value;
                    console.log(`  • ${envVar}: ${maskedValue}`);
                } else {
                    console.log(`  • ${envVar}: (not set)`);
                }
            });
            
            // Show model preferences
            const navigatorModel = this.modelSwitcher.getCurrentModel('navigator', 'cli-user');
            const architectModel = this.modelSwitcher.getCurrentModel('architect', 'cli-user');
            
            console.log('\nAgent Models:');
            console.log(`  • Navigator: ${navigatorModel}`);
            console.log(`  • Architect: ${architectModel}`);
            
        } catch (error) {
            console.error('❌ Config display failed:', error.message);
        }
    }

    async runAllTests() {
        console.log('🚀 Running Relay AI Agent Enhanced LLM Tests\n');
        
        await this.healthCheck();
        await this.testLLMSources();
        await this.testEncryption();
        await this.showCurrentConfig();
        
        console.log('\n✅ All tests completed!');
        console.log('\n📖 Usage examples:');
        console.log('  node aiAgentCLI.mjs chat --llm-source=openai');
        console.log('  node aiAgentCLI.mjs chat --navigator-model=gpt-4o --architect-model=claude-3-5-sonnet');
        console.log('  node aiAgentCLI.mjs chat --use-local');
        console.log('  node aiAgentCLI.mjs llm health-check');
        console.log('  node aiAgentCLI.mjs llm add-api-key --provider=openai');
    }
}

// Command line argument handling
const command = process.argv[2];
const cli = new SimpleAIAgentCLI();

switch (command) {
    case 'health-check':
    case 'health':
        await cli.healthCheck();
        break;
    case 'test-llm':
        await cli.testLLMSources();
        break;
    case 'test-encryption':
        await cli.testEncryption();
        break;
    case 'config':
        await cli.showCurrentConfig();
        break;
    case 'test-all':
    default:
        await cli.runAllTests();
        break;
}

export { SimpleAIAgentCLI };
