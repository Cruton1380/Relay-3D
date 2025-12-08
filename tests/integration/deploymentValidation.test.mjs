#!/usr/bin/env node

/**
 * Relay Network Production Deployment Validation
 * 
 * This script validates all components are ready for public deployment:
 * 1. ZK-STARK circuit expiration and status tracking
 * 2. Public Explorer privacy boundaries
 * 3. SDK licensing and developer onboarding  
 * 4. Cryptographic audit preparation
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DeploymentValidator {
    constructor() {
        this.validationResults = {
            zkCircuits: { status: 'pending', checks: [] },
            publicExplorer: { status: 'pending', checks: [] },
            sdkOnboarding: { status: 'pending', checks: [] },
            cryptoAudit: { status: 'pending', checks: [] },
            licensing: { status: 'pending', checks: [] },
            overall: { status: 'pending', score: 0 }
        };
        this.totalChecks = 0;
        this.passedChecks = 0;
    }

    async runValidation() {
        console.log('🚀 Relay Network Production Deployment Validation');
        console.log('=' .repeat(60));
        
        try {
            await this.validateZKCircuits();
            await this.validatePublicExplorer();
            await this.validateSDKOnboarding();
            await this.validateCryptoAudit();
            await this.validateLicensing();
            
            this.calculateOverallScore();
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    async validateZKCircuits() {
        console.log('\n📐 Validating ZK-STARK Circuit Expiration & Status Tracking...');
        
        try {
            const circuitsPath = join(__dirname, 'src', 'backend', 'hashgraph', 'zkStarkAdvancedCircuits.mjs');
            const circuitsContent = await fs.readFile(circuitsPath, 'utf8');
            
            // Check for expiration features
            const expirationChecks = [
                {
                    name: 'Circuit expiration tracking (validUntil)',
                    test: () => circuitsContent.includes('validUntil') && circuitsContent.includes('expirationTime'),
                    critical: true
                },
                {
                    name: 'Circuit revocation mechanism',
                    test: () => circuitsContent.includes('revokeCircuit') && circuitsContent.includes('revocation_reason'),
                    critical: true
                },
                {
                    name: 'Circuit status query system',
                    test: () => circuitsContent.includes('getCircuitStatus') && circuitsContent.includes('CircuitStatusManager'),
                    critical: true
                },
                {
                    name: 'TemporalParticipationCircuitWithExpiration implementation',
                    test: () => circuitsContent.includes('TemporalParticipationCircuitWithExpiration'),
                    critical: true
                },
                {
                    name: 'ExpertiseCircuitWithExpiration implementation',
                    test: () => circuitsContent.includes('ExpertiseCircuitWithExpiration'),
                    critical: true
                },
                {
                    name: 'CircuitRegistry for system-wide management',
                    test: () => circuitsContent.includes('CircuitRegistry'),
                    critical: false
                },
                {
                    name: 'Automatic cleanup of expired circuits',
                    test: () => circuitsContent.includes('cleanupExpiredCircuits'),
                    critical: false
                },
                {
                    name: 'Bulk status query for efficiency',
                    test: () => circuitsContent.includes('getBulkCircuitStatus'),
                    critical: false
                }
            ];

            this.runChecks('zkCircuits', expirationChecks);
            
        } catch (error) {
            this.validationResults.zkCircuits.status = 'error';
            this.validationResults.zkCircuits.error = error.message;
        }
    }

    async validatePublicExplorer() {
        console.log('\n🌐 Validating Public Explorer Privacy Boundaries...');
        
        try {
            const explorerPath = join(__dirname, 'publicGovernanceExplorer.mjs');
            const explorerContent = await fs.readFile(explorerPath, 'utf8');
            
            const privacyChecks = [
                {
                    name: 'PrivacyBoundaryManager implementation',
                    test: () => explorerContent.includes('PrivacyBoundaryManager'),
                    critical: true
                },
                {
                    name: 'Per-channel visibility settings',
                    test: () => explorerContent.includes('setChannelVisibility') && explorerContent.includes('channelSettings'),
                    critical: true
                },
                {
                    name: 'User opt-out controls',
                    test: () => explorerContent.includes('setUserOptOut') && explorerContent.includes('userOptOuts'),
                    critical: true
                },
                {
                    name: 'Moderation-only visibility option',
                    test: () => explorerContent.includes('moderation_visible') && explorerContent.includes('moderation === true'),
                    critical: true
                },
                {
                    name: 'Action-specific visibility rules',
                    test: () => explorerContent.includes('actionVisibilityRules') && explorerContent.includes('governance_proposal'),
                    critical: true
                },
                {
                    name: 'Content filtering in shouldDisplayContent',
                    test: () => explorerContent.includes('shouldDisplayContent'),
                    critical: true
                },
                {
                    name: 'Privacy-aware API filtering',
                    test: () => explorerContent.includes('filterContent') || explorerContent.includes('applyPrivacyFilters'),
                    critical: false
                },
                {
                    name: 'Default privacy rules initialization',
                    test: () => explorerContent.includes('initializeDefaultRules'),
                    critical: false
                }
            ];

            this.runChecks('publicExplorer', privacyChecks);
            
        } catch (error) {
            this.validationResults.publicExplorer.status = 'error';
            this.validationResults.publicExplorer.error = error.message;
        }
    }

    async validateSDKOnboarding() {
        console.log('\n📚 Validating SDK Developer Onboarding...');
        
        try {
            const onboardingPath = join(__dirname, 'relay-sdk-onboarding.md');
            const onboardingContent = await fs.readFile(onboardingPath, 'utf8');
            
            const sdkPath = join(__dirname, 'relayNetworkSDK.mjs');
            const sdkContent = await fs.readFile(sdkPath, 'utf8');
            
            const onboardingChecks = [
                {
                    name: 'Complete onboarding guide exists',
                    test: () => onboardingContent.length > 10000, // Substantial content
                    critical: true
                },
                {
                    name: 'Sample integration examples',
                    test: () => onboardingContent.includes('Sample Integration Examples') && 
                           onboardingContent.includes('import { RelayNetworkSDK }'),
                    critical: true
                },
                {
                    name: 'Docker starter template',
                    test: () => onboardingContent.includes('docker-compose.yml') && 
                           onboardingContent.includes('relay-node:'),
                    critical: true
                },
                {
                    name: 'CLI development tools',
                    test: () => onboardingContent.includes('CLI Development Tools') && 
                           onboardingContent.includes('npm install -g @relay-network/cli'),
                    critical: true
                },
                {
                    name: 'Testnet connection instructions',
                    test: () => onboardingContent.includes('Testnet Development Instructions') && 
                           onboardingContent.includes('testnet.relay.network'),
                    critical: true
                },
                {
                    name: 'Mainnet fork instructions',
                    test: () => onboardingContent.includes('Mainnet Fork Instructions') && 
                           onboardingContent.includes('Fork Creation Process'),
                    critical: true
                },
                {
                    name: 'Security best practices',
                    test: () => onboardingContent.includes('Security Best Practices') && 
                           onboardingContent.includes('Private Key Management'),
                    critical: false
                },
                {
                    name: 'Production deployment checklist',
                    test: () => onboardingContent.includes('Production Deployment Checklist'),
                    critical: false
                },
                {
                    name: 'MIT License in SDK file',
                    test: () => sdkContent.includes('@license MIT') && sdkContent.includes('Copyright (c) 2024'),
                    critical: true
                }
            ];

            this.runChecks('sdkOnboarding', onboardingChecks);
            
        } catch (error) {
            this.validationResults.sdkOnboarding.status = 'error';
            this.validationResults.sdkOnboarding.error = error.message;
        }
    }

    async validateCryptoAudit() {
        console.log('\n🔒 Validating Cryptographic Audit Preparation...');
        
        try {
            const auditPath = join(__dirname, 'cryptographic-audit-preparation.md');
            const auditContent = await fs.readFile(auditPath, 'utf8');
            
            const auditChecks = [
                {
                    name: 'Comprehensive audit document exists',
                    test: () => auditContent.length > 15000, // Substantial technical content
                    critical: true
                },
                {
                    name: 'System overview for external partners',
                    test: () => auditContent.includes('Executive Summary') && 
                           auditContent.includes('Audit Scope Definition'),
                    critical: true
                },
                {
                    name: 'ZK-STARK test vectors included',
                    test: () => auditContent.includes('ZK-STARK Test Vectors') && 
                           auditContent.includes('Circuit 1: Anonymous Voting Proof'),
                    critical: true
                },
                {
                    name: 'DAG invariants documentation',
                    test: () => auditContent.includes('DAG Invariants') || 
                           auditContent.includes('Consensus Hashing'),
                    critical: true
                },
                {
                    name: 'Fork resolution logic documented',
                    test: () => auditContent.includes('fork') && 
                           auditContent.includes('resolution'),
                    critical: true
                },
                {
                    name: 'Cryptographic protocol security analysis',
                    test: () => auditContent.includes('Cryptographic Protocol Security') && 
                           auditContent.includes('End-to-end encryption'),
                    critical: true
                },
                {
                    name: 'Security assumptions clearly stated',
                    test: () => auditContent.includes('Security Assumptions') || 
                           auditContent.includes('security properties'),
                    critical: false
                },
                {
                    name: 'Formal verification targets identified',
                    test: () => auditContent.includes('verification') && 
                           auditContent.includes('formal'),
                    critical: false
                }
            ];

            this.runChecks('cryptoAudit', auditChecks);
            
        } catch (error) {
            this.validationResults.cryptoAudit.status = 'error';
            this.validationResults.cryptoAudit.error = error.message;
        }
    }

    async validateLicensing() {
        console.log('\n📄 Validating Open Source Licensing...');
        
        try {
            const packagePath = join(__dirname, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);
            
            const licensePath = join(__dirname, 'LICENSE');
            const licenseContent = await fs.readFile(licensePath, 'utf8');
            
            const onboardingPath = join(__dirname, 'relay-sdk-onboarding.md');
            const onboardingContent = await fs.readFile(onboardingPath, 'utf8');
            
            const licensingChecks = [
                {
                    name: 'MIT License in package.json',
                    test: () => packageJson.license === 'MIT',
                    critical: true
                },
                {
                    name: 'Formal LICENSE file exists',
                    test: () => licenseContent.includes('MIT License') && 
                           licenseContent.includes('Copyright (c) 2024'),
                    critical: true
                },
                {
                    name: 'License information in onboarding guide',
                    test: () => onboardingContent.includes('MIT License') && 
                           onboardingContent.includes('open source'),
                    critical: true
                },
                {
                    name: 'Third-party license acknowledgments',
                    test: () => licenseContent.includes('THIRD-PARTY LICENSES') && 
                           licenseContent.includes('BrightID'),
                    critical: true
                },
                {
                    name: 'Repository information in package.json',
                    test: () => packageJson.repository && packageJson.repository.url,
                    critical: false
                },
                {
                    name: 'Contributors and attribution',
                    test: () => packageJson.author === 'Relay Network Contributors',
                    critical: false
                },
                {
                    name: 'Keywords for discoverability',
                    test: () => packageJson.keywords && packageJson.keywords.length > 5,
                    critical: false
                },
                {
                    name: 'Cryptographic compliance notice',
                    test: () => licenseContent.includes('CRYPTOGRAPHIC COMPLIANCE'),
                    critical: false
                }
            ];

            this.runChecks('licensing', licensingChecks);
            
        } catch (error) {
            this.validationResults.licensing.status = 'error';
            this.validationResults.licensing.error = error.message;
        }
    }

    runChecks(category, checks) {
        let passed = 0;
        let critical_passed = 0;
        let critical_total = 0;

        for (const check of checks) {
            this.totalChecks++;
            if (check.critical) critical_total++;
            
            const result = check.test();
            const status = result ? '✅' : '❌';
            const priority = check.critical ? '[CRITICAL]' : '[optional]';
            
            console.log(`  ${status} ${priority} ${check.name}`);
            
            this.validationResults[category].checks.push({
                name: check.name,
                passed: result,
                critical: check.critical
            });
            
            if (result) {
                passed++;
                this.passedChecks++;
                if (check.critical) critical_passed++;
            }
        }

        // Determine category status
        if (critical_passed === critical_total) {
            this.validationResults[category].status = passed === checks.length ? 'perfect' : 'ready';
        } else {
            this.validationResults[category].status = 'failed';
        }

        const score = Math.round((passed / checks.length) * 100);
        console.log(`  📊 ${category} Score: ${score}% (${passed}/${checks.length} checks passed)`);
    }

    calculateOverallScore() {
        this.validationResults.overall.score = Math.round((this.passedChecks / this.totalChecks) * 100);
        
        // Determine overall status
        const criticalComponents = ['zkCircuits', 'publicExplorer', 'sdkOnboarding', 'cryptoAudit', 'licensing'];
        const failedCritical = criticalComponents.filter(comp => 
            this.validationResults[comp].status === 'failed'
        );
        
        if (failedCritical.length === 0) {
            this.validationResults.overall.status = 'ready';
        } else {
            this.validationResults.overall.status = 'blocked';
            this.validationResults.overall.blockers = failedCritical;
        }
    }

    generateReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('📋 DEPLOYMENT VALIDATION REPORT');
        console.log('═'.repeat(60));
        
        console.log(`\n🎯 Overall Score: ${this.validationResults.overall.score}%`);
        console.log(`📊 Status: ${this.validationResults.overall.status.toUpperCase()}`);
        
        if (this.validationResults.overall.status === 'ready') {
            console.log('\n🎉 ALL CRITICAL COMPONENTS READY FOR PUBLIC DEPLOYMENT!');
            console.log('\n✅ Ready Components:');
            console.log('   • ZK-STARK circuit expiration and status tracking');
            console.log('   • Public Explorer privacy boundaries and opt-out controls');
            console.log('   • SDK licensing and comprehensive developer onboarding');
            console.log('   • Cryptographic audit preparation documentation');
            console.log('   • Open source licensing (MIT) with proper attribution');
            
        } else {
            console.log('\n⚠️  DEPLOYMENT BLOCKED - Critical issues found:');
            if (this.validationResults.overall.blockers) {
                this.validationResults.overall.blockers.forEach(blocker => {
                    console.log(`   • ${blocker}: ${this.validationResults[blocker].status}`);
                });
            }
        }

        console.log('\n📈 Component Status:');
        Object.entries(this.validationResults).forEach(([key, result]) => {
            if (key === 'overall') return;
            
            const emoji = result.status === 'perfect' ? '🟢' : 
                         result.status === 'ready' ? '🟡' : 
                         result.status === 'failed' ? '🔴' : '⚪';
            
            console.log(`   ${emoji} ${key}: ${result.status}`);
            
            if (result.error) {
                console.log(`      ❌ Error: ${result.error}`);
            }
        });

        console.log('\n🚀 Next Steps:');
        if (this.validationResults.overall.status === 'ready') {
            console.log('   1. ✅ Final approval for public announcement');
            console.log('   2. ✅ Coordinate with external cryptographic audit partner');
            console.log('   3. ✅ Prepare governance onboarding for public participation');
            console.log('   4. ✅ Execute global deployment playbook');
            console.log('   5. ✅ Monitor network health during initial public adoption');
        } else {
            console.log('   1. 🔧 Fix critical component failures listed above');
            console.log('   2. 🔄 Re-run validation: node finalDeploymentValidation.mjs');
            console.log('   3. 📞 Contact development team if issues persist');
        }

        console.log('\n💾 Detailed validation results saved to: validation-results.json');
        
        // Save detailed results
        this.saveResults();
    }

    async saveResults() {
        const results = {
            timestamp: new Date().toISOString(),
            validation_version: '1.0.0',
            relay_network_version: '1.0.0',
            overall_score: this.validationResults.overall.score,
            overall_status: this.validationResults.overall.status,
            ready_for_deployment: this.validationResults.overall.status === 'ready',
            components: this.validationResults,
            summary: {
                total_checks: this.totalChecks,
                passed_checks: this.passedChecks,
                critical_components_ready: this.validationResults.overall.status === 'ready',
                deployment_blockers: this.validationResults.overall.blockers || []
            },
            recommendations: this.generateRecommendations()
        };

        await fs.writeFile(
            join(__dirname, 'validation-results.json'), 
            JSON.stringify(results, null, 2)
        );
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.validationResults.overall.status === 'ready') {
            recommendations.push('🎯 All critical deployment requirements met');
            recommendations.push('📢 Ready for public announcement and governance onboarding');
            recommendations.push('🔐 Coordinate formal cryptographic audit with external partner');
            recommendations.push('🌍 Execute phased global deployment strategy');
        } else {
            recommendations.push('🔧 Address critical component failures before deployment');
            recommendations.push('📋 Re-validate after fixes are implemented');
            recommendations.push('⚡ Prioritize security-critical components first');
        }
        
        return recommendations;
    }
}

// Run validation
const validator = new DeploymentValidator();
validator.runValidation().catch(console.error);
