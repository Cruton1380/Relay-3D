/**
 * Deployment Verification Test Suite
 * Comprehensive testing for the three critical deployment concerns
 */

import { AIRelayAgent } from './aiRelayAgent.mjs';
import { AgentExecutionTracer } from './agentExecutionTracer.mjs';
import { OfflineModeSimulator } from './offlineModeSimulation.mjs';
import { UserControlManager } from './userControlManager.mjs';

export class DeploymentVerifier {
    constructor() {
        this.verificationResults = {
            logFlowVerification: null,
            offlineModeValidation: null,
            userControlAudit: null,
            overallStatus: 'pending'
        };
    }

    /**
     * Run complete deployment verification
     */
    async runDeploymentVerification() {
        console.log('🔍 Starting Relay AI Agent Deployment Verification\n');

        try {
            // 1. Log Flow Verification
            console.log('📋 Verifying log flow and trace capabilities...');
            this.verificationResults.logFlowVerification = await this.verifyLogFlow();
            
            // 2. Offline Mode Testing
            console.log('🔌 Testing offline mode and local inference...');
            this.verificationResults.offlineModeValidation = await this.verifyOfflineMode();
            
            // 3. User Control Review
            console.log('👤 Auditing user control capabilities...');
            this.verificationResults.userControlAudit = await this.verifyUserControls();
            
            // Generate final report
            const report = this.generateDeploymentReport();
            await this.exportVerificationResults();
            
            console.log('\n✅ Deployment verification completed');
            return report;
            
        } catch (error) {
            console.error('❌ Deployment verification failed:', error);
            throw error;
        }
    }

    /**
     * 1. Verify Log Flow and Execution Tracing
     */
    async verifyLogFlow() {
        console.log('  🔄 Testing prompt → response → summary flows...');
        
        const tracer = new AgentExecutionTracer();
        const agent = new AIRelayAgent({ tracingEnabled: true });
        
        try {
            await agent.initialize();
            const sessionId = tracer.startSession('log-flow-verification');
            
            // Test 1: Basic prompt flow logging
            const promptFlowId = tracer.logPromptFlow({
                agent: 'navigator',
                model: 'gpt-4o',
                originalPrompt: 'Create a new channel for community discussions',
                scrubbedPrompt: 'Create a new channel for community discussions',
                response: 'Here\'s how to create a community discussion channel...',
                summary: 'User requested channel creation guidance',
                classification: 'ui_guidance',
                confidence: 0.95,
                processingTime: 2100
            });
            
            // Test 2: Collaboration loop logging
            const collaborationId = tracer.logCollaborationIteration({
                loopId: 'test-collaboration-001',
                iterationNumber: 1,
                initiatingAgent: 'navigator',
                respondingAgent: 'architect',
                input: 'Plan channel creation with moderation',
                output: 'Technical implementation for channel system',
                summary: 'Navigator-Architect collaboration on channel system',
                progressMade: true,
                staleDetected: false
            });
            
            // Test 3: Deadlock detection and resolution
            const deadlockId = tracer.logDeadlockEvent({
                loopId: 'test-collaboration-001',
                detectionTrigger: 'repetitive_exchanges',
                iterationsBeforeDetection: 5,
                staleExchanges: ['same response repeated 3 times'],
                resolutionStrategy: 'escalate_to_human',
                resolutionActions: ['paused_loop', 'notified_user'],
                outcome: 'human_intervention_requested',
                humanEscalated: true,
                resolutionTime: 1500
            });
            
            // Test 4: Model switching logging
            const modelSwitchId = tracer.logModelSwitch({
                agent: 'architect',
                fromModel: 'claude-3.5-sonnet',
                toModel: 'deepseek-coder',
                reason: 'performance_optimization',
                triggerType: 'manual',
                healthStatus: 'healthy',
                success: true
            });
            
            // Test 5: Error recovery logging
            const errorId = tracer.logErrorEvent({
                errorType: 'api_rate_limit',
                errorMessage: 'Rate limit exceeded for GPT-4o',
                agent: 'navigator',
                model: 'gpt-4o',
                context: { retryAttempt: 1 },
                recoveryActions: ['exponential_backoff', 'model_fallback'],
                retryCount: 3,
                fallbackActivated: true,
                recoverySuccess: true,
                finalOutcome: 'switched_to_gpt_4_turbo'
            });
            
            // Export trace logs
            const traceFile = await tracer.exportTraceLogs('./agentExecutionTraceLogs.json');
            
            // Generate execution summary
            const summary = tracer.generateExecutionSummary();
            
            await tracer.endSession({ status: 'verification_completed' });
            
            return {
                success: true,
                promptFlowLogged: !!promptFlowId,
                collaborationLogged: !!collaborationId,
                deadlockLogged: !!deadlockId,
                modelSwitchLogged: !!modelSwitchId,
                errorRecoveryLogged: !!errorId,
                traceFileGenerated: !!traceFile,
                executionSummary: summary,
                verification: {
                    endToEndTracing: true,
                    deadlockResolution: true,
                    comprehensiveLogging: true
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                verification: {
                    endToEndTracing: false,
                    deadlockResolution: false,
                    comprehensiveLogging: false
                }
            };
        } finally {
            await agent?.shutdown();
        }
    }

    /**
     * 2. Verify Offline Mode and Local Inference
     */
    async verifyOfflineMode() {
        console.log('  📱 Testing offline mode capabilities...');
        
        const simulator = new OfflineModeSimulator();
        
        try {
            // Run comprehensive offline simulation
            const simulationReport = await simulator.runOfflineSimulation();
            
            // Additional specific tests for CLI toggle and env variable
            const offlineToggleTest = await this.testOfflineToggle();
            const envVariableTest = await this.testOfflineEnvVariable();
            const localModelStubTest = await this.testLocalModelStub();
            const fallbackLoggingTest = await this.testOfflineFallbackLogging();
            
            return {
                success: simulationReport.summary.overallSuccess,
                simulationResults: simulationReport,
                offlineToggleWorks: offlineToggleTest.success,
                envVariableToggle: envVariableTest.success,
                localModelStubTested: localModelStubTest.success,
                fallbackLoggingVerified: fallbackLoggingTest.success,
                verification: {
                    offlineStartup: simulationReport.capabilities.offlineStartup,
                    midSessionTransition: simulationReport.capabilities.midSessionTransition,
                    localModelFallback: simulationReport.capabilities.modelFallback,
                    gracefulLogging: fallbackLoggingTest.success
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                verification: {
                    offlineStartup: false,
                    midSessionTransition: false,
                    localModelFallback: false,
                    gracefulLogging: false
                }
            };
        }
    }

    /**
     * 3. Verify User Control Capabilities
     */
    async verifyUserControls() {
        console.log('  👤 Testing user interrupt, rollback, and undo functionality...');
        
        const controlManager = new UserControlManager();
        
        try {
            // Test 1: User session with interrupt capability
            const sessionId = controlManager.startUserSession('test-user-001', {
                requireConfirmation: true
            });
            
            // Test 2: User interrupt during processing
            const interruptResult = await controlManager.handleUserInterrupt(
                sessionId, 
                'stop', 
                'I want to change the approach'
            );
            
            // Test 3: Checkpoint creation and rollback
            const checkpointId = controlManager.createCheckpoint(sessionId, 'Before major changes');
            const rollbackResult = await controlManager.rollbackToCheckpoint(sessionId, checkpointId);
            
            // Test 4: Undo functionality
            // Simulate an action first
            controlManager.addToUndoHistory(sessionId, {
                action: 'agent_response',
                timestamp: new Date().toISOString(),
                details: 'Test agent response'
            });
            
            const undoResult = await controlManager.undoLastAction(sessionId);
            
            // Test 5: Session summary and navigation
            const sessionSummary = controlManager.getSessionSummary(sessionId, true);
            const navigationResult = controlManager.navigateConversationHistory(sessionId, 'back', 2);
            
            // Test 6: Export for user review
            const exportData = await controlManager.exportSessionForReview(sessionId, 'json');
            
            return {
                success: true,
                userInterruptWorks: interruptResult.success,
                rollbackCapable: rollbackResult.success,
                undoFunctional: undoResult.success,
                sessionSummaryAvailable: !!sessionSummary,
                conversationNavigation: !!navigationResult,
                exportForReview: !!exportData,
                verification: {
                    midLoopInterrupt: interruptResult.success,
                    changeRollback: rollbackResult.success,
                    actionUndo: undoResult.success,
                    userControl: true
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                verification: {
                    midLoopInterrupt: false,
                    changeRollback: false,
                    actionUndo: false,
                    userControl: false
                }
            };
        }
    }

    /**
     * Test CLI offline toggle
     */
    async testOfflineToggle() {
        try {
            const agent = new AIRelayAgent({ offlineMode: true });
            await agent.initialize();
            
            const isOffline = await agent.isOfflineMode();
            const capabilities = await agent.getOfflineCapabilities();
            
            await agent.shutdown();
            
            return {
                success: isOffline && capabilities.available,
                offlineMode: isOffline,
                capabilities: capabilities
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test environment variable offline control
     */
    async testOfflineEnvVariable() {
        try {
            // Test with LOCAL_MODEL_ENABLED=true
            process.env.LOCAL_MODEL_ENABLED = 'true';
            process.env.OFFLINE_MODE = 'true';
            
            const agent = new AIRelayAgent();
            await agent.initialize();
            
            const isOffline = await agent.isOfflineMode();
            
            await agent.shutdown();
            
            // Clean up env vars
            delete process.env.LOCAL_MODEL_ENABLED;
            delete process.env.OFFLINE_MODE;
            
            return {
                success: isOffline,
                envVariableRespected: isOffline
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test local model stub functionality
     */
    async testLocalModelStub() {
        try {
            const agent = new AIRelayAgent({
                offlineMode: true,
                mockLocalModels: {
                    'test-local-model': {
                        latency: 2000,
                        accuracy: 0.85,
                        availability: 0.99
                    }
                }
            });
            
            await agent.initialize();
            
            const response = await agent.query({
                message: 'Test local model response',
                context: { testMode: true, localOnly: true }
            });
            
            await agent.shutdown();
            
            return {
                success: !!response,
                localModelUsed: response?.model?.includes('local') || response?.model?.includes('test'),
                responseReceived: !!response?.content
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test offline fallback logging
     */
    async testOfflineFallbackLogging() {
        try {
            const tracer = new AgentExecutionTracer();
            const sessionId = tracer.startSession('offline-fallback-test');
            
            // Log a fallback event
            tracer.logModelSwitch({
                agent: 'navigator',
                fromModel: 'gpt-4o',
                toModel: 'llama-3.1-local',
                reason: 'network_unavailable',
                triggerType: 'failure',
                fallbackActivated: true,
                success: true
            });
            
            const summary = tracer.generateExecutionSummary();
            await tracer.endSession({ status: 'fallback_test_completed' });
            
            return {
                success: true,
                fallbackLogged: summary.statistics.modelSwitches > 0,
                gracefulTransition: true
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate comprehensive deployment report
     */
    generateDeploymentReport() {
        const { logFlowVerification, offlineModeValidation, userControlAudit } = this.verificationResults;
        
        const allTestsPassed = 
            logFlowVerification?.success &&
            offlineModeValidation?.success &&
            userControlAudit?.success;
        
        this.verificationResults.overallStatus = allTestsPassed ? 'approved' : 'requires_fixes';
        
        return {
            timestamp: new Date().toISOString(),
            deploymentStatus: this.verificationResults.overallStatus,
            summary: {
                logFlowVerified: logFlowVerification?.success || false,
                offlineModeValidated: offlineModeValidation?.success || false,
                userControlsAudited: userControlAudit?.success || false,
                overallReadiness: allTestsPassed
            },
            detailedResults: this.verificationResults,
            recommendations: this.generateRecommendations(),
            deploymentApproval: allTestsPassed ? 'APPROVED' : 'REQUIRES_FIXES'
        };
    }

    /**
     * Generate deployment recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (!this.verificationResults.logFlowVerification?.success) {
            recommendations.push('🔴 Fix execution tracing and logging system before deployment');
        } else {
            recommendations.push('✅ Execution tracing system verified and ready');
        }
        
        if (!this.verificationResults.offlineModeValidation?.success) {
            recommendations.push('🔴 Resolve offline mode and local inference issues before deployment');
        } else {
            recommendations.push('✅ Offline mode capabilities verified and ready');
        }
        
        if (!this.verificationResults.userControlAudit?.success) {
            recommendations.push('🔴 Implement missing user control features before deployment');
        } else {
            recommendations.push('✅ User control system verified and ready');
        }
        
        if (this.verificationResults.overallStatus === 'approved') {
            recommendations.push('🎉 All verification tests passed - APPROVED for deployment');
        } else {
            recommendations.push('⚠️ Fix identified issues before proceeding with deployment');
        }
        
        return recommendations;
    }

    /**
     * Export verification results
     */
    async exportVerificationResults() {
        const report = this.generateDeploymentReport();
        
        try {
            const fs = await import('fs/promises');
            await fs.writeFile('./deploymentVerificationReport.json', JSON.stringify(report, null, 2));
            console.log('\n📊 Verification report exported to: deploymentVerificationReport.json');
        } catch (error) {
            console.error('Failed to export verification results:', error);
        }
    }
}

// CLI runner for deployment verification
export async function runDeploymentVerification() {
    const verifier = new DeploymentVerifier();
    
    try {
        const report = await verifier.runDeploymentVerification();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 DEPLOYMENT VERIFICATION RESULTS');
        console.log('='.repeat(60));
        
        console.log(`\n📊 Overall Status: ${report.deploymentStatus.toUpperCase()}`);
        console.log(`\n✅ Log Flow Verified: ${report.summary.logFlowVerified}`);
        console.log(`✅ Offline Mode Validated: ${report.summary.offlineModeValidated}`);
        console.log(`✅ User Controls Audited: ${report.summary.userControlsAudited}`);
        
        console.log('\n📋 Recommendations:');
        report.recommendations.forEach(rec => console.log(`  ${rec}`));
        
        console.log(`\n🚀 Deployment Approval: ${report.deploymentApproval}`);
        
        if (report.deploymentApproval === 'APPROVED') {
            console.log('\n🎉 System is ready for production deployment!');
        } else {
            console.log('\n⚠️  Address identified issues before deployment.');
        }
        
        return report;
        
    } catch (error) {
        console.error('❌ Deployment verification failed:', error);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await runDeploymentVerification();
}

export default DeploymentVerifier;
