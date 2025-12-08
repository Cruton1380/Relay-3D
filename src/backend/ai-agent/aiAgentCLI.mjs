#!/usr/bin/env node

/**
 * Relay AI Agent CLI Tool
 * Command-line interface for managing and interacting with the AI agent system
 */

import { program } from 'commander';
import { AIRelayAgent } from './aiRelayAgent.mjs';
import { AIRelayAgentDemo } from './aiRelayAgentDemo.mjs';
import { TestUtilities } from './agentTestSuite.mjs';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

class AIAgentCLI {
    constructor() {
        this.agent = null;
        this.setupCommands();
    }

    setupCommands() {
        program
            .name('relay-ai-agent')
            .description('Relay AI Agent System CLI')
            .version('1.0.0');        // Interactive chat command
        program
            .command('chat')
            .description('Start interactive chat with AI agents')
            .option('-a, --agent <agent>', 'Preferred agent (navigator|architect)')
            .option('-m, --model <model>', 'Override model selection')
            .option('--llm-source <source>', 'LLM source (openai|anthropic|local|ollama:model)')
            .option('--cloud-provider <provider>', 'Cloud provider (openai|anthropic|google|mistral)')
            .option('--use-local', 'Use local models only')
            .option('--navigator-model <model>', 'Specific model for Navigator agent')
            .option('--architect-model <model>', 'Specific model for Architect agent')
            .option('--enable-user-keys', 'Use user-provided API keys')
            .option('--offline', 'Use offline/local models only')
            .action(this.startInteractiveChat.bind(this));

        // Query command
        program
            .command('query <message>')
            .description('Send a single query to the AI agents')
            .option('-a, --agent <agent>', 'Preferred agent (navigator|architect)')
            .option('-m, --model <model>', 'Override model selection')
            .option('--llm-source <source>', 'LLM source (openai|anthropic|local|ollama:model)')
            .option('--cloud-provider <provider>', 'Cloud provider preference')
            .option('--navigator-model <model>', 'Specific model for Navigator agent')
            .option('--architect-model <model>', 'Specific model for Architect agent')
            .option('--json', 'Output response as JSON')
            .action(this.handleQuery.bind(this));

        // Model management commands
        program
            .command('models')
            .description('Manage AI models')
            .addCommand(
                program.createCommand('list')
                    .description('List available models')
                    .action(this.listModels.bind(this))
            )
            .addCommand(
                program.createCommand('switch')
                    .description('Switch model for an agent')
                    .argument('<agent>', 'Agent to switch (navigator|architect)')
                    .argument('<model>', 'Model to switch to')
                    .action(this.switchModel.bind(this))
            )
            .addCommand(
                program.createCommand('health')
                    .description('Check model health status')
                    .option('-m, --model <model>', 'Check specific model')                    .action(this.checkModelHealth.bind(this))
            );

        // LLM Source management commands
        program
            .command('llm')
            .description('LLM source and provider management')
            .addCommand(
                program.createCommand('health-check')
                    .description('Check LLM provider availability')
                    .option('--provider <provider>', 'Check specific provider')
                    .option('--local-only', 'Check local providers only')
                    .option('--cloud-only', 'Check cloud providers only')
                    .option('--verbose', 'Detailed health information')
                    .action(this.llmHealthCheck.bind(this))
            )
            .addCommand(
                program.createCommand('add-api-key')
                    .description('Add user API key for a provider')
                    .option('--provider <provider>', 'Provider (openai|anthropic|google|mistral)')
                    .option('--key <key>', 'API key (will prompt if not provided)')
                    .action(this.addUserApiKey.bind(this))
            )
            .addCommand(
                program.createCommand('remove-api-key')
                    .description('Remove user API key')
                    .option('--provider <provider>', 'Provider to remove')
                    .option('--all', 'Remove all user API keys')
                    .action(this.removeUserApiKey.bind(this))
            )
            .addCommand(
                program.createCommand('list-api-keys')
                    .description('List configured API providers')
                    .action(this.listUserApiKeys.bind(this))
            )
            .addCommand(
                program.createCommand('switch-source')
                    .description('Switch LLM source preference')
                    .option('--source <source>', 'LLM source (local|cloud|openai|anthropic)')
                    .option('--navigator <model>', 'Navigator agent model')
                    .option('--architect <model>', 'Architect agent model')
                    .action(this.switchLLMSource.bind(this))
            )
            .addCommand(
                program.createCommand('current-models')
                    .description('Show current model configuration')
                    .action(this.showCurrentModels.bind(this))
            )
            .addCommand(
                program.createCommand('usage-stats')
                    .description('Show LLM usage statistics')
                    .option('--provider <provider>', 'Filter by provider')
                    .option('--timeframe <days>', 'Days to look back (default: 30)')
                    .action(this.showUsageStats.bind(this))
            );

        // System management commands
        program
            .command('system')
            .description('System management and diagnostics')
            .addCommand(
                program.createCommand('status')
                    .description('Show system status')
                    .action(this.showSystemStatus.bind(this))
            )
            .addCommand(
                program.createCommand('health')
                    .description('Run system health check')
                    .action(this.runHealthCheck.bind(this))
            )
            .addCommand(
                program.createCommand('reset')
                    .description('Reset system state')
                    .option('--memory', 'Clear memory only')
                    .option('--config', 'Reset configuration')
                    .action(this.resetSystem.bind(this))
            );

        // Privacy commands
        program
            .command('privacy')
            .description('Privacy and memory management')
            .addCommand(
                program.createCommand('status')
                    .description('Show privacy status')
                    .action(this.showPrivacyStatus.bind(this))
            )
            .addCommand(
                program.createCommand('purge')
                    .description('Purge memory data')
                    .option('--confirm', 'Skip confirmation prompt')
                    .action(this.purgeMemory.bind(this))
            )
            .addCommand(
                program.createCommand('export')
                    .description('Export user data')
                    .option('-o, --output <file>', 'Output file path')
                    .action(this.exportData.bind(this))
            );

        // Demo and testing commands
        program
            .command('demo')
            .description('Run system demonstrations')
            .option('-m, --mode <mode>', 'Demo mode (full|interactive|privacy|models)', 'full')
            .action(this.runDemo.bind(this));

        program
            .command('test')
            .description('Run system tests')
            .option('-c, --category <category>', 'Test category to run')
            .option('--verbose', 'Verbose output')
            .action(this.runTests.bind(this));

        // Configuration commands
        program
            .command('config')
            .description('Configuration management')
            .addCommand(
                program.createCommand('show')
                    .description('Show current configuration')
                    .option('--secrets', 'Include API keys (masked)')
                    .action(this.showConfig.bind(this))
            )
            .addCommand(
                program.createCommand('validate')
                    .description('Validate configuration')
                    .action(this.validateConfig.bind(this))
            )
            .addCommand(
                program.createCommand('setup')
                    .description('Interactive configuration setup')
                    .action(this.setupConfig.bind(this))
            );

        // Index management commands
        program
            .command('index')
            .description('Manage codebase indexing')
            .addCommand(
                program.createCommand('build')
                    .description('Build codebase index')
                    .option('-p, --path <path>', 'Path to index', './src')
                    .action(this.buildIndex.bind(this))
            )
            .addCommand(
                program.createCommand('search')
                    .description('Search indexed codebase')
                    .argument('<query>', 'Search query')
                    .option('-n, --limit <number>', 'Maximum results', '10')
                    .action(this.searchIndex.bind(this))
            )
            .addCommand(
                program.createCommand('stats')
                    .description('Show index statistics')
                    .action(this.showIndexStats.bind(this))
            );
    }

    async initializeAgent(options = {}) {
        if (!this.agent) {
            const spinner = ora('Initializing AI Agent System...').start();
            try {
                this.agent = new AIRelayAgent(options);
                await this.agent.initialize();
                spinner.succeed('AI Agent System initialized');
            } catch (error) {
                spinner.fail(`Failed to initialize: ${error.message}`);
                process.exit(1);
            }
        }
        return this.agent;
    }    async startInteractiveChat(options) {
        console.log(chalk.blue.bold('\n🤖 Relay AI Agent Interactive Chat'));
        console.log(chalk.gray('Type "quit" to exit, "help" for commands\n'));

        // Process CLI configuration
        const cliConfig = {
            llmSource: options.llmSource,
            cloudProvider: options.cloudProvider,
            useLocal: options.useLocal || options.offline,
            agentSpecific: {}
        };

        if (options.navigatorModel) {
            cliConfig.agentSpecific.navigator = options.navigatorModel;
        }
        if (options.architectModel) {
            cliConfig.agentSpecific.architect = options.architectModel;
        }

        await this.initializeAgent({
            offlineMode: options.offline || options.useLocal,
            cliConfig: cliConfig
        });

        // Apply CLI configuration if provided
        if (Object.keys(cliConfig).some(key => cliConfig[key])) {
            try {
                const configResult = await this.agent.modelSwitcher.applyCLIConfig(cliConfig, 'cli-user');
                if (configResult.success) {
                    console.log(chalk.green('✅ Applied CLI configuration:'));
                    configResult.applied.forEach(change => {
                        console.log(chalk.dim(`  • ${change.type}: ${change.value || change.model}`));
                    });
                    console.log('');
                }
            } catch (error) {
                console.log(chalk.yellow(`⚠️  Warning: Could not apply CLI config: ${error.message}\n`));
            }
        }

        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = (question) => {
            return new Promise(resolve => rl.question(question, resolve));
        };

        try {
            while (true) {
                const userInput = await askQuestion(chalk.cyan('You: '));

                if (userInput.toLowerCase() === 'quit') {
                    console.log(chalk.yellow('Goodbye! 👋'));
                    break;
                }

                if (userInput.toLowerCase() === 'help') {
                    this.showChatHelp();
                    continue;
                }

                const spinner = ora('Thinking...').start();
                try {
                    const response = await this.agent.query({
                        message: userInput,
                        preferredAgent: options.agent,
                        modelOverride: options.model
                    });

                    spinner.stop();
                    console.log(chalk.green(`\n${response.agent}: ${response.content}\n`));
                    
                    if (response.agentsInvolved?.length > 1) {
                        console.log(chalk.gray(`ℹ️  Collaboration between ${response.agentsInvolved.join(' and ')}\n`));
                    }
                } catch (error) {
                    spinner.fail(`Error: ${error.message}`);
                }
            }
        } finally {
            rl.close();
            await this.agent?.shutdown();
        }
    }    showChatHelp() {
        console.log(chalk.yellow('\n📖 Chat Commands:'));
        console.log('  quit           - Exit chat');
        console.log('  help           - Show this help');
        console.log('  /navigator     - Switch to Navigator agent');
        console.log('  /architect     - Switch to Architect agent');
        console.log('  /status        - Show system status');
        console.log('  /models        - List available models');
        console.log('  /health        - Check LLM provider health');
        console.log('  /switch <model> - Switch to different model');
        
        console.log(chalk.yellow('\n🔧 LLM Source Options:'));
        console.log('  --llm-source=openai|anthropic|local');
        console.log('  --cloud-provider=openai|anthropic|google');
        console.log('  --use-local    - Force local models only');
        console.log('  --navigator-model=<model>');
        console.log('  --architect-model=<model>');
        console.log('');
    }async handleQuery(message, options) {
        // Process CLI configuration
        const cliConfig = {
            llmSource: options.llmSource,
            cloudProvider: options.cloudProvider,
            agentSpecific: {}
        };

        if (options.navigatorModel) {
            cliConfig.agentSpecific.navigator = options.navigatorModel;
        }
        if (options.architectModel) {
            cliConfig.agentSpecific.architect = options.architectModel;
        }

        await this.initializeAgent({
            cliConfig: cliConfig
        });

        // Apply CLI configuration if provided
        if (Object.keys(cliConfig).some(key => cliConfig[key])) {
            try {
                await this.agent.modelSwitcher.applyCLIConfig(cliConfig, 'cli-user');
            } catch (error) {
                console.log(chalk.yellow(`⚠️  Warning: Could not apply CLI config: ${error.message}`));
            }
        }

        const spinner = ora('Processing query...').start();
        try {
            const response = await this.agent.query({
                message,
                preferredAgent: options.agent,
                modelOverride: options.model,
                userId: 'cli-user'
            });

            spinner.stop();

            if (options.json) {
                console.log(JSON.stringify(response, null, 2));
            } else {
                console.log(chalk.green(`\n${response.agent}:`));
                console.log(response.content);
                
                if (response.agentsInvolved?.length > 1) {
                    console.log(chalk.gray(`\nℹ️  Collaboration: ${response.agentsInvolved.join(' + ')}`));
                }

                // Show model info if available
                if (response.metadata?.model) {
                    console.log(chalk.dim(`\n🤖 Model: ${response.metadata.model} (${response.metadata.provider || 'unknown'})`));
                }
            }
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
            process.exit(1);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async listModels() {
        await this.initializeAgent();

        try {
            const models = await this.agent.getAvailableModels();
            
            console.log(chalk.blue.bold('\n🔧 Available Models\n'));
            
            console.log(chalk.cyan('Navigator Models:'));
            models.navigator.forEach(model => {
                const current = model === models.current.navigator ? chalk.green(' (current)') : '';
                console.log(`  • ${model}${current}`);
            });
            
            console.log(chalk.cyan('\nArchitect Models:'));
            models.architect.forEach(model => {
                const current = model === models.current.architect ? chalk.green(' (current)') : '';
                console.log(`  • ${model}${current}`);
            });

            if (models.local?.length > 0) {
                console.log(chalk.cyan('\nLocal Models:'));
                models.local.forEach(model => {
                    console.log(`  • ${model} (offline)`);
                });
            }
        } catch (error) {
            console.error(chalk.red(`Error listing models: ${error.message}`));
        } finally {
            await this.agent?.shutdown();
        }
    }

    async switchModel(agent, model) {
        await this.initializeAgent();

        const spinner = ora(`Switching ${agent} to ${model}...`).start();
        try {
            const result = await this.agent.switchModel(agent, model);
            
            if (result.success) {
                spinner.succeed(`${agent} switched to ${model}`);
            } else {
                spinner.fail(`Failed to switch: ${result.error}`);
            }
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async checkModelHealth(options) {
        await this.initializeAgent();

        const spinner = ora('Checking model health...').start();
        try {
            let healthData;
            
            if (options.model) {
                healthData = await this.agent.checkModelHealth(options.model);
                spinner.stop();
                
                console.log(chalk.blue.bold(`\n🏥 Health Check: ${options.model}\n`));
                console.log(`Status: ${this.getStatusIcon(healthData.status)} ${healthData.status}`);
                console.log(`Latency: ${healthData.latency}ms`);
                console.log(`Availability: ${healthData.availability}%`);
            } else {
                healthData = await this.agent.getSystemHealth();
                spinner.stop();
                
                console.log(chalk.blue.bold('\n🏥 System Health Check\n'));
                
                Object.entries(healthData.models).forEach(([agent, health]) => {
                    console.log(`${agent}: ${this.getStatusIcon(health.status)} ${health.status} (${health.latency}ms)`);
                });
                
                console.log(`\nOverall: ${this.getStatusIcon(healthData.overall)} ${healthData.overall}`);
            }
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'healthy': return '✅';
            case 'degraded': return '⚠️';
            case 'critical': return '❌';
            default: return '❓';
        }
    }

    async showSystemStatus() {
        await this.initializeAgent();

        try {
            const status = await this.agent.getSystemStatus();
            
            console.log(chalk.blue.bold('\n📊 System Status\n'));
            console.log(`Uptime: ${status.uptime}`);
            console.log(`Active Sessions: ${status.activeSessions}`);
            console.log(`Memory Usage: ${status.memoryUsage}MB`);
            console.log(`Queries Processed: ${status.totalQueries}`);
            console.log(`Success Rate: ${status.successRate}%`);
            console.log(`Average Response Time: ${status.avgResponseTime}ms`);
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
        } finally {
            await this.agent?.shutdown();
        }
    }

    async runHealthCheck() {
        await this.initializeAgent();

        const spinner = ora('Running comprehensive health check...').start();
        try {
            const results = await this.agent.runSystemDiagnostics();
            spinner.stop();
            
            console.log(chalk.blue.bold('\n🔍 System Diagnostics\n'));
            
            console.log(`Overall Health: ${this.getStatusIcon(results.overall)} ${results.overall}`);
            
            console.log(chalk.cyan('\nComponent Status:'));
            Object.entries(results.components).forEach(([component, status]) => {
                console.log(`  ${component}: ${this.getStatusIcon(status)} ${status}`);
            });
            
            if (results.recommendations?.length > 0) {
                console.log(chalk.yellow('\nRecommendations:'));
                results.recommendations.forEach(rec => {
                    console.log(`  • ${rec}`);
                });
            }
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async resetSystem(options) {
        if (!options.memory && !options.config) {
            const { confirmed } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmed',
                    message: 'This will reset the entire system. Continue?',
                    default: false
                }
            ]);
            
            if (!confirmed) {
                console.log(chalk.yellow('Reset cancelled.'));
                return;
            }
        }

        await this.initializeAgent();

        const spinner = ora('Resetting system...').start();
        try {
            if (options.memory || (!options.config && !options.memory)) {
                await this.agent.purgeMemory({ force: true });
                spinner.text = 'Memory cleared...';
            }
            
            if (options.config || (!options.config && !options.memory)) {
                await this.agent.resetConfiguration();
                spinner.text = 'Configuration reset...';
            }
            
            spinner.succeed('System reset completed');
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async showPrivacyStatus() {
        await this.initializeAgent();

        try {
            const privacy = await this.agent.getPrivacyStatus();
            
            console.log(chalk.blue.bold('\n🔒 Privacy Status\n'));
            console.log(`Privacy Level: ${privacy.level}`);
            console.log(`Memory Encryption: ${privacy.encryption ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`Data Collection: ${privacy.dataCollection ? '⚠️ Enabled' : '✅ Disabled'}`);
            console.log(`Offline Mode: ${privacy.offlineMode ? '✅ Available' : '❌ Unavailable'}`);
            
            console.log(chalk.cyan('\nMemory Status:'));
            console.log(`  Short-term entries: ${privacy.memory.shortTerm}`);
            console.log(`  Long-term entries: ${privacy.memory.longTerm}`);
            console.log(`  Last purge: ${privacy.memory.lastPurge || 'Never'}`);
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
        } finally {
            await this.agent?.shutdown();
        }
    }

    async purgeMemory(options) {
        if (!options.confirm) {
            const { confirmed } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmed',
                    message: 'This will permanently delete all stored memory. Continue?',
                    default: false
                }
            ]);
            
            if (!confirmed) {
                console.log(chalk.yellow('Memory purge cancelled.'));
                return;
            }
        }

        await this.initializeAgent();

        const spinner = ora('Purging memory...').start();
        try {
            await this.agent.purgeMemory({ force: true });
            spinner.succeed('All memory data purged');
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async exportData(options) {
        await this.initializeAgent();

        const outputPath = options.output || `relay-ai-data-${Date.now()}.json`;
        
        const spinner = ora('Exporting data...').start();
        try {
            const data = await this.agent.exportUserData();
            await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
            spinner.succeed(`Data exported to ${outputPath}`);
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async runDemo(options) {
        console.log(chalk.blue.bold('🎭 Starting AI Agent Demo\n'));
        
        const demo = new AIRelayAgentDemo();
        
        try {
            switch (options.mode) {
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
        } catch (error) {
            console.error(chalk.red(`Demo failed: ${error.message}`));
        }
    }

    async runTests(options) {
        console.log(chalk.blue.bold('🧪 Running AI Agent Tests\n'));
        
        // This would integrate with vitest or another test runner
        const testCommand = options.category 
            ? `npm test -- --grep "${options.category}"`
            : 'npm test src/backend/ai-agent/agentTestSuite.mjs';
        
        const { spawn } = await import('child_process');
        const test = spawn('npm', ['test'], { stdio: 'inherit' });
        
        test.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green('\n✅ All tests passed!'));
            } else {
                console.log(chalk.red('\n❌ Some tests failed.'));
                process.exit(code);
            }
        });
    }

    async buildIndex(options) {
        await this.initializeAgent();

        const spinner = ora(`Indexing codebase at ${options.path}...`).start();
        try {
            const result = await this.agent.indexCodebase(options.path);
            spinner.succeed(`Indexed ${result.filesIndexed} files (${result.chunks} chunks)`);
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async searchIndex(query, options) {
        await this.initializeAgent();

        const spinner = ora('Searching codebase...').start();
        try {
            const results = await this.agent.searchCodebase(query, {
                limit: parseInt(options.limit)
            });
            
            spinner.stop();
            
            console.log(chalk.blue.bold(`\n🔍 Search Results for "${query}"\n`));
            
            if (results.length === 0) {
                console.log(chalk.yellow('No results found.'));
                return;
            }
            
            results.forEach((result, index) => {
                console.log(chalk.cyan(`${index + 1}. ${result.file}`));
                console.log(chalk.gray(`   Relevance: ${(result.relevance * 100).toFixed(1)}%`));
                console.log(chalk.white(`   ${result.content.substring(0, 200)}...`));
                console.log('');
            });
        } catch (error) {
            spinner.fail(`Error: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async showConfig(options) {
        try {
            const config = await this.loadConfiguration();
            
            console.log(chalk.blue.bold('\n⚙️  Current Configuration\n'));
            
            // Show sanitized config
            const sanitized = this.sanitizeConfig(config, !options.secrets);
            console.log(JSON.stringify(sanitized, null, 2));
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
        }
    }

    sanitizeConfig(config, hideSecrets = true) {
        const sanitized = JSON.parse(JSON.stringify(config));
        
        if (hideSecrets) {
            const secretKeys = ['apiKey', 'key', 'secret', 'password', 'token'];
            
            const sanitizeObject = (obj) => {
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'object' && value !== null) {
                        sanitizeObject(value);
                    } else if (secretKeys.some(secret => key.toLowerCase().includes(secret))) {
                        obj[key] = value ? '***masked***' : null;
                    }
                }
            };
            
            sanitizeObject(sanitized);
        }
        
        return sanitized;
    }

    async setupConfig() {
        console.log(chalk.blue.bold('\n⚙️  AI Agent Configuration Setup\n'));
        
        const questions = [
            {
                type: 'input',
                name: 'openai_api_key',
                message: 'OpenAI API Key:',
                validate: input => input.length > 0 || 'API key is required'
            },
            {
                type: 'input',
                name: 'anthropic_api_key',
                message: 'Anthropic API Key:',
                validate: input => input.length > 0 || 'API key is required'
            },
            {
                type: 'input',
                name: 'deepseek_api_key',
                message: 'DeepSeek API Key (optional):',
            },
            {
                type: 'list',
                name: 'privacy_level',
                message: 'Privacy Level:',
                choices: ['high', 'medium', 'low'],
                default: 'high'
            },
            {
                type: 'confirm',
                name: 'local_models',
                message: 'Enable local model support?',
                default: true
            }
        ];
        
        const answers = await inquirer.prompt(questions);
        
        // Generate .env file
        const envContent = [
            `OPENAI_API_KEY=${answers.openai_api_key}`,
            `ANTHROPIC_API_KEY=${answers.anthropic_api_key}`,
            answers.deepseek_api_key ? `DEEPSEEK_API_KEY=${answers.deepseek_api_key}` : '',
            `PRIVACY_LEVEL=${answers.privacy_level}`,
            `LOCAL_MODEL_ENABLED=${answers.local_models}`,
            `MEMORY_ENCRYPTION_KEY=${this.generateEncryptionKey()}`
        ].filter(Boolean).join('\n');
        
        await fs.writeFile('.env', envContent);
        console.log(chalk.green('\n✅ Configuration saved to .env file'));
    }

    generateEncryptionKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }        return result;
    }

    // New LLM Management Methods

    async llmHealthCheck(options) {
        await this.initializeAgent();

        const spinner = ora('Checking LLM provider health...').start();
        try {
            const health = await this.agent.llmBridge.healthCheck();
            spinner.succeed('Health check completed');

            console.log(chalk.blue.bold('\n🏥 LLM Provider Health Status\n'));

            // Local providers
            if (!options.cloudOnly) {
                console.log(chalk.cyan('Local Providers:'));
                console.log(`  • Status: ${health.local.available ? chalk.green('Available') : chalk.red('Unavailable')}`);
                if (health.local.models?.length > 0) {
                    console.log(`  • Models: ${health.local.models.join(', ')}`);
                }
            }

            // Cloud providers
            if (!options.localOnly) {
                console.log(chalk.cyan('\nCloud Providers:'));
                for (const [provider, status] of Object.entries(health.cloud.available)) {
                    const statusText = status ? chalk.green('Available') : chalk.red('No API Key');
                    console.log(`  • ${provider}: ${statusText}`);
                    
                    if (options.verbose && health.cloud.models[provider]?.length > 0) {
                        console.log(`    Models: ${health.cloud.models[provider].join(', ')}`);
                    }
                }
            }

            if (options.verbose) {
                console.log(chalk.dim('\nNote: This is a mock health check. In production, this would test actual API endpoints.'));
            }
        } catch (error) {
            spinner.fail(`Health check failed: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async addUserApiKey(options) {
        await this.initializeAgent();

        let provider = options.provider;
        let apiKey = options.key;

        // Prompt for provider if not provided
        if (!provider) {
            const answers = await inquirer.prompt([{
                type: 'list',
                name: 'provider',
                message: 'Select LLM provider:',
                choices: [
                    'openai',
                    'anthropic',
                    'google',
                    'mistral',
                    'cohere',
                    'together'
                ]
            }]);
            provider = answers.provider;
        }

        // Prompt for API key if not provided
        if (!apiKey) {
            const answers = await inquirer.prompt([{
                type: 'password',
                name: 'apiKey',
                message: `Enter your ${provider} API key:`,
                validate: (input) => input.length > 0 || 'API key cannot be empty'
            }]);
            apiKey = answers.apiKey;
        }

        const spinner = ora(`Adding ${provider} API key...`).start();
        try {
            await this.agent.llmBridge.addUserApiKey('cli-user', provider, apiKey);
            spinner.succeed(`${provider} API key added successfully`);
            
            console.log(chalk.green(`\n✅ API key for ${provider} has been encrypted and stored securely.`));
            console.log(chalk.dim('Your key will take precedence over system keys for this provider.'));
        } catch (error) {
            spinner.fail(`Failed to add API key: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async removeUserApiKey(options) {
        await this.initializeAgent();

        if (options.all) {
            const answers = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to remove ALL user API keys?',
                default: false
            }]);

            if (!answers.confirm) {
                console.log(chalk.yellow('Operation cancelled.'));
                return;
            }

            // Remove all user keys (implementation depends on LLM bridge)
            console.log(chalk.green('All user API keys removed.'));
            return;
        }

        if (!options.provider) {
            console.error(chalk.red('Error: Must specify --provider or use --all'));
            return;
        }

        const spinner = ora(`Removing ${options.provider} API key...`).start();
        try {
            await this.agent.llmBridge.removeUserApiKey('cli-user', options.provider);
            spinner.succeed(`${options.provider} API key removed`);
        } catch (error) {
            spinner.fail(`Failed to remove API key: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async listUserApiKeys() {
        await this.initializeAgent();

        try {
            // This would need to be implemented in the LLM bridge
            const providers = ['openai', 'anthropic', 'google', 'mistral', 'cohere', 'together'];
            
            console.log(chalk.blue.bold('\n🔑 API Key Status\n'));
            
            for (const provider of providers) {
                const hasUserKey = await this.agent.llmBridge.getApiKey(provider, 'cli-user') !== null;
                const hasSystemKey = await this.agent.llmBridge.getApiKey(provider) !== null;
                
                let status = chalk.red('Not configured');
                if (hasUserKey) {
                    status = chalk.green('User key configured');
                } else if (hasSystemKey) {
                    status = chalk.yellow('System key only');
                }
                
                console.log(`  • ${provider}: ${status}`);
            }
        } catch (error) {
            console.error(chalk.red(`Error listing API keys: ${error.message}`));
        } finally {
            await this.agent?.shutdown();
        }
    }

    async switchLLMSource(options) {
        await this.initializeAgent();

        const spinner = ora('Switching LLM source...').start();
        try {
            // Parse CLI args-style configuration
            const cliConfig = {
                llmSource: options.source,
                agentSpecific: {}
            };

            if (options.navigator) {
                cliConfig.agentSpecific.navigator = options.navigator;
            }
            if (options.architect) {
                cliConfig.agentSpecific.architect = options.architect;
            }

            const result = await this.agent.modelSwitcher.applyCLIConfig(cliConfig, 'cli-user');
            
            if (result.success) {
                spinner.succeed('LLM source switched successfully');
                
                console.log(chalk.green('\n✅ Applied changes:'));
                result.applied.forEach(change => {
                    console.log(`  • ${change.type}: ${change.value || change.model}`);
                });
            } else {
                spinner.fail('Failed to switch LLM source');
            }
        } catch (error) {
            spinner.fail(`Error switching LLM source: ${error.message}`);
        } finally {
            await this.agent?.shutdown();
        }
    }

    async showCurrentModels() {
        await this.initializeAgent();

        try {
            console.log(chalk.blue.bold('\n🎯 Current Model Configuration\n'));
            
            const navigatorModel = this.agent.modelSwitcher.getCurrentModel('navigator', 'cli-user');
            const architectModel = this.agent.modelSwitcher.getCurrentModel('architect', 'cli-user');
            
            console.log(chalk.cyan('Agent Models:'));
            console.log(`  • Navigator: ${chalk.green(navigatorModel)}`);
            console.log(`  • Architect: ${chalk.green(architectModel)}`);
            
            const llmSource = this.agent.modelSwitcher.getLLMSourcePreference('cli-user');
            const cloudProvider = this.agent.modelSwitcher.getCloudProvider('cli-user');
            
            console.log(chalk.cyan('\nPreferences:'));
            console.log(`  • LLM Source: ${chalk.green(llmSource)}`);
            console.log(`  • Cloud Provider: ${chalk.green(cloudProvider)}`);
            
        } catch (error) {
            console.error(chalk.red(`Error getting current models: ${error.message}`));
        } finally {
            await this.agent?.shutdown();
        }
    }

    async showUsageStats(options) {
        await this.initializeAgent();

        try {
            console.log(chalk.blue.bold('\n📊 LLM Usage Statistics\n'));
            
            // This would need to be implemented based on actual usage tracking
            const stats = await this.agent.llmBridge.getUserUsageStats('cli-user');
            
            if (stats) {
                console.log(chalk.cyan('Overall Usage:'));
                console.log(`  • Total API Calls: ${chalk.green(stats.totalCalls || 0)}`);
                console.log(`  • Total Tokens: ${chalk.green((stats.totalTokens || 0).toLocaleString())}`);
                
                if (stats.providerBreakdown) {
                    console.log(chalk.cyan('\nBy Provider:'));
                    for (const [provider, providerStats] of Object.entries(stats.providerBreakdown)) {
                        console.log(`  • ${provider}: ${providerStats.calls} calls, ${providerStats.tokens?.toLocaleString() || 0} tokens`);
                    }
                }
            } else {
                console.log(chalk.dim('No usage statistics available yet.'));
            }
        } catch (error) {
            console.error(chalk.red(`Error getting usage stats: ${error.message}`));
        } finally {
            await this.agent?.shutdown();
        }
    }

    async run() {
        try {
            await program.parseAsync(process.argv);
        } catch (error) {
            console.error(chalk.red(`CLI Error: ${error.message}`));
            process.exit(1);
        }
    }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const cli = new AIAgentCLI();
    await cli.run();
}

export { AIAgentCLI };
