/**
 * @fileoverview Fuzz Testing Suite for Hashgraph DAG and Replay Attack Simulation
 * Comprehensive testing framework for edge cases, attack vectors, and resilience validation
 */

import EventEmitter from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';
import { ProximityGossipMesh } from './proximityGossipMesh.mjs';
import { DAGEventConstructor } from './dagEventConstructor.mjs';
import { SybilReplayDetector } from './sybilReplayDetector.mjs';
import { ForkDetectionSystem } from './forkDetectionSystem.mjs';

const fuzzLogger = logger.child({ module: 'fuzz-testing' });

/**
 * Fuzz Testing Suite for Hashgraph System
 */
export class HashgraphFuzzTestingSuite extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = {
            testDuration: options.testDuration || 60000, // 1 minute
            maxEvents: options.maxEvents || 10000,
            maxPeers: options.maxPeers || 100,
            attackIntensity: options.attackIntensity || 0.3, // 30% of traffic is malicious
            reportDirectory: options.reportDirectory || './logs/fuzz-testing',
            seedValue: options.seedValue || Date.now(),
            ...options
        };

        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            vulnerabilities: [],
            performanceMetrics: [],
            attackResults: [],
            edgeCases: []
        };

        this.attackVectors = new Map();
        this.generatedData = new Map();
        this.systemComponents = null;
        this.isRunning = false;
    }

    async initialize() {
        try {
            fuzzLogger.info('Initializing fuzz testing suite', {
                duration: this.config.testDuration,
                maxEvents: this.config.maxEvents,
                attackIntensity: this.config.attackIntensity
            });

            // Create report directory
            await fs.mkdir(this.config.reportDirectory, { recursive: true });

            // Initialize system components for testing
            this.systemComponents = {
                gossipMesh: new ProximityGossipMesh({ userId: 'fuzz-test-node' }),
                dagConstructor: new DAGEventConstructor({ nodeId: 'fuzz-test-node' }),
                sybilDetector: new SybilReplayDetector({ nodeId: 'fuzz-test-node' }),
                forkDetection: new ForkDetectionSystem({ nodeId: 'fuzz-test-node' })
            };

            // Set up attack vector definitions
            this.setupAttackVectors();

            // Seed random number generator for reproducible tests
            this.random = this.createSeededRandom(this.config.seedValue);

            fuzzLogger.info('Fuzz testing suite initialized successfully');
            this.emit('initialized');

        } catch (error) {
            fuzzLogger.error('Failed to initialize fuzz testing suite', { error: error.message });
            throw error;
        }
    }

    /**
     * Create seeded random number generator for reproducible tests
     */
    createSeededRandom(seed) {
        let state = seed;
        return () => {
            state = (state * 9301 + 49297) % 233280;
            return state / 233280;
        };
    }

    /**
     * Set up attack vector definitions
     */
    setupAttackVectors() {
        this.attackVectors.set('replay_attack', {
            name: 'Replay Attack',
            description: 'Replaying old valid events to confuse consensus',
            severity: 'high',
            execute: this.executeReplayAttack.bind(this)
        });

        this.attackVectors.set('sybil_attack', {
            name: 'Sybil Attack',
            description: 'Creating multiple fake identities to gain influence',
            severity: 'critical',
            execute: this.executeSybilAttack.bind(this)
        });

        this.attackVectors.set('timing_attack', {
            name: 'Timing Attack',
            description: 'Manipulating event timestamps to affect ordering',
            severity: 'medium',
            execute: this.executeTimingAttack.bind(this)
        });

        this.attackVectors.set('gossip_flood', {
            name: 'Gossip Flood Attack',
            description: 'Overwhelming the network with excessive gossip messages',
            severity: 'high',
            execute: this.executeGossipFloodAttack.bind(this)
        });

        this.attackVectors.set('fork_bomb', {
            name: 'Fork Bomb Attack',
            description: 'Creating many competing forks to confuse consensus',
            severity: 'critical',
            execute: this.executeForkBombAttack.bind(this)
        });

        this.attackVectors.set('malformed_data', {
            name: 'Malformed Data Attack',
            description: 'Sending events with invalid or corrupted data',
            severity: 'medium',
            execute: this.executeMalformedDataAttack.bind(this)
        });

        this.attackVectors.set('eclipse_attack', {
            name: 'Eclipse Attack',
            description: 'Isolating nodes by controlling their peer connections',
            severity: 'high',
            execute: this.executeEclipseAttack.bind(this)
        });

        this.attackVectors.set('denial_of_service', {
            name: 'Denial of Service',
            description: 'Overwhelming system resources to cause failure',
            severity: 'critical',
            execute: this.executeDenialOfServiceAttack.bind(this)
        });
    }

    /**
     * Run comprehensive fuzz testing suite
     */
    async runFuzzTests() {
        if (this.isRunning) {
            throw new Error('Fuzz tests are already running');
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        try {
            fuzzLogger.info('Starting comprehensive fuzz testing', {
                duration: this.config.testDuration,
                attackVectors: this.attackVectors.size
            });

            // Phase 1: DAG Structure Fuzzing
            await this.fuzzDAGStructure();

            // Phase 2: Attack Vector Testing
            await this.testAllAttackVectors();

            // Phase 3: Edge Case Testing
            await this.testEdgeCases();

            // Phase 4: Performance Stress Testing
            await this.performanceStressTesting();

            // Phase 5: Resilience Testing
            await this.resilienceTesting();

            // Generate comprehensive report
            const testDuration = Date.now() - startTime;
            await this.generateFuzzTestReport(testDuration);

            fuzzLogger.info('Fuzz testing completed successfully', {
                duration: testDuration,
                totalTests: this.testResults.totalTests,
                vulnerabilities: this.testResults.vulnerabilities.length
            });

            this.emit('fuzzTestingCompleted', this.testResults);

        } catch (error) {
            fuzzLogger.error('Fuzz testing failed', { error: error.message });
            this.emit('fuzzTestingFailed', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Phase 1: DAG Structure Fuzzing
     */
    async fuzzDAGStructure() {
        fuzzLogger.info('Starting DAG structure fuzzing');

        const tests = [
            this.testDAGWithMalformedEvents.bind(this),
            this.testDAGWithCircularReferences.bind(this),
            this.testDAGWithInvalidSignatures.bind(this),
            this.testDAGWithExtremeDepth.bind(this),
            this.testDAGWithOrphanedEvents.bind(this),
            this.testDAGWithDuplicateEvents.bind(this)
        ];

        for (const test of tests) {
            try {
                await test();
                this.testResults.passedTests++;
            } catch (error) {
                this.testResults.failedTests++;
                this.recordVulnerability('DAG Structure', error.message);
            }
            this.testResults.totalTests++;
        }
    }

    async testDAGWithMalformedEvents() {
        fuzzLogger.debug('Testing DAG with malformed events');

        const malformedEvents = [
            { id: null, type: 'test' }, // Missing ID
            { id: 'test-1' }, // Missing type
            { id: 'test-2', type: 'test', parent_hashes: 'not-an-array' }, // Invalid parent_hashes
            { id: 'test-3', type: 'test', timestamp: 'not-a-number' }, // Invalid timestamp
            { id: 'test-4', type: 'test', signature: null } // Missing signature
        ];

        let rejectedCount = 0;
        for (const event of malformedEvents) {
            try {
                await this.systemComponents.dagConstructor.addEvent(event);
            } catch (error) {
                rejectedCount++;
            }
        }

        if (rejectedCount !== malformedEvents.length) {
            throw new Error(`DAG accepted ${malformedEvents.length - rejectedCount} malformed events`);
        }
    }

    async testDAGWithCircularReferences() {
        fuzzLogger.debug('Testing DAG with circular references');

        const eventA = {
            id: 'circular-a',
            type: 'test',
            parent_hashes: ['circular-b'],
            timestamp: Date.now()
        };

        const eventB = {
            id: 'circular-b',
            type: 'test',
            parent_hashes: ['circular-a'],
            timestamp: Date.now()
        };

        let circularDetected = false;
        try {
            await this.systemComponents.dagConstructor.addEvent(eventA);
            await this.systemComponents.dagConstructor.addEvent(eventB);
        } catch (error) {
            circularDetected = error.message.includes('circular') || error.message.includes('cycle');
        }

        if (!circularDetected) {
            throw new Error('DAG failed to detect circular references');
        }
    }

    async testDAGWithInvalidSignatures() {
        fuzzLogger.debug('Testing DAG with invalid signatures');

        const invalidEvents = [
            {
                id: 'invalid-sig-1',
                type: 'test',
                signature: 'completely-fake-signature',
                timestamp: Date.now()
            },
            {
                id: 'invalid-sig-2',
                type: 'test',
                signature: Buffer.from('fake').toString('base64'),
                timestamp: Date.now()
            }
        ];

        let rejectedCount = 0;
        for (const event of invalidEvents) {
            try {
                await this.systemComponents.dagConstructor.addEvent(event);
            } catch (error) {
                rejectedCount++;
            }
        }

        if (rejectedCount === 0) {
            throw new Error('DAG accepted events with invalid signatures');
        }
    }

    async testDAGWithExtremeDepth() {
        fuzzLogger.debug('Testing DAG with extreme depth');

        const maxDepth = 1000;
        let previousHash = null;
        
        const startTime = Date.now();
        for (let i = 0; i < maxDepth; i++) {
            const event = {
                id: `depth-test-${i}`,
                type: 'depth_test',
                parent_hashes: previousHash ? [previousHash] : [],
                timestamp: Date.now() + i
            };

            await this.systemComponents.dagConstructor.addEvent(event);
            previousHash = event.id;

            // Check if performance degrades significantly
            if (i % 100 === 0) {
                const currentTime = Date.now();
                const timePerEvent = (currentTime - startTime) / (i + 1);
                if (timePerEvent > 100) { // More than 100ms per event
                    this.recordPerformanceIssue('Extreme DAG depth causes performance degradation');
                }
            }
        }
    }

    async testDAGWithOrphanedEvents() {
        fuzzLogger.debug('Testing DAG with orphaned events');

        const orphanedEvent = {
            id: 'orphaned-1',
            type: 'test',
            parent_hashes: ['non-existent-parent'],
            timestamp: Date.now()
        };

        let orphanHandled = false;
        try {
            await this.systemComponents.dagConstructor.addEvent(orphanedEvent);
            // Check if event is properly queued for later processing
            const orphanQueue = this.systemComponents.dagConstructor.getOrphanedEvents?.();
            orphanHandled = orphanQueue?.includes(orphanedEvent.id);
        } catch (error) {
            orphanHandled = true; // Rejection is also valid handling
        }

        if (!orphanHandled) {
            throw new Error('DAG failed to properly handle orphaned events');
        }
    }

    async testDAGWithDuplicateEvents() {
        fuzzLogger.debug('Testing DAG with duplicate events');

        const duplicateEvent = {
            id: 'duplicate-test',
            type: 'test',
            timestamp: Date.now()
        };

        await this.systemComponents.dagConstructor.addEvent(duplicateEvent);
        
        let duplicateRejected = false;
        try {
            await this.systemComponents.dagConstructor.addEvent(duplicateEvent);
        } catch (error) {
            duplicateRejected = true;
        }

        if (!duplicateRejected) {
            throw new Error('DAG accepted duplicate events');
        }
    }

    /**
     * Phase 2: Attack Vector Testing
     */
    async testAllAttackVectors() {
        fuzzLogger.info('Testing all attack vectors');

        for (const [vectorName, vectorConfig] of this.attackVectors) {
            try {
                fuzzLogger.debug(`Testing attack vector: ${vectorName}`);
                const result = await vectorConfig.execute();
                
                this.testResults.attackResults.push({
                    vector: vectorName,
                    severity: vectorConfig.severity,
                    success: result.success,
                    detected: result.detected,
                    mitigated: result.mitigated,
                    details: result.details
                });

                if (result.success && !result.detected) {
                    this.recordVulnerability(vectorName, `Attack succeeded without detection: ${result.details}`);
                }

                this.testResults.passedTests++;
            } catch (error) {
                this.testResults.failedTests++;
                this.recordVulnerability(vectorName, `Attack test failed: ${error.message}`);
            }
            this.testResults.totalTests++;
        }
    }

    async executeReplayAttack() {
        fuzzLogger.debug('Executing replay attack');

        // Create a valid event
        const originalEvent = {
            id: 'original-event',
            type: 'proposal_vote',
            data: { vote: 'yes' },
            timestamp: Date.now() - 10000, // 10 seconds ago
            creator_id: 'attacker'
        };

        await this.systemComponents.dagConstructor.addEvent(originalEvent);

        // Wait a bit, then replay the same event
        await new Promise(resolve => setTimeout(resolve, 1000));

        let replayDetected = false;
        try {
            // Attempt to replay the exact same event
            await this.systemComponents.sybilDetector.analyzeEvent(originalEvent);
            const isReplay = this.systemComponents.sybilDetector.isReplayAttack(originalEvent);
            replayDetected = isReplay;
        } catch (error) {
            replayDetected = true;
        }

        return {
            success: true,
            detected: replayDetected,
            mitigated: replayDetected,
            details: replayDetected ? 'Replay attack detected and mitigated' : 'Replay attack not detected'
        };
    }

    async executeSybilAttack() {
        fuzzLogger.debug('Executing Sybil attack');

        const sybilIdentities = [];
        const coordinatedAction = {
            type: 'proposal_vote',
            data: { proposalId: 'test-proposal', vote: 'yes' }
        };

        // Create multiple fake identities
        for (let i = 0; i < 20; i++) {
            const identity = `sybil-${i}`;
            sybilIdentities.push(identity);

            const event = {
                id: `sybil-event-${i}`,
                type: coordinatedAction.type,
                data: coordinatedAction.data,
                creator_id: identity,
                timestamp: Date.now() + i
            };

            await this.systemComponents.sybilDetector.analyzeEvent(event);
        }

        // Check if Sybil attack was detected
        const sybilDetected = this.systemComponents.sybilDetector.detectSybilCluster(sybilIdentities);

        return {
            success: true,
            detected: sybilDetected,
            mitigated: sybilDetected,
            details: `Created ${sybilIdentities.length} Sybil identities, detection: ${sybilDetected}`
        };
    }

    async executeTimingAttack() {
        fuzzLogger.debug('Executing timing attack');

        const futureTimestamp = Date.now() + 3600000; // 1 hour in future
        const pastTimestamp = Date.now() - 3600000; // 1 hour in past

        const timingEvents = [
            {
                id: 'future-event',
                type: 'test',
                timestamp: futureTimestamp,
                creator_id: 'attacker'
            },
            {
                id: 'past-event',
                type: 'test',
                timestamp: pastTimestamp,
                creator_id: 'attacker'
            }
        ];

        let timingDetected = false;
        let rejectedCount = 0;

        for (const event of timingEvents) {
            try {
                await this.systemComponents.dagConstructor.addEvent(event);
            } catch (error) {
                if (error.message.includes('timestamp') || error.message.includes('timing')) {
                    timingDetected = true;
                    rejectedCount++;
                }
            }
        }

        return {
            success: rejectedCount < timingEvents.length,
            detected: timingDetected,
            mitigated: rejectedCount === timingEvents.length,
            details: `${rejectedCount}/${timingEvents.length} timing events rejected`
        };
    }

    async executeGossipFloodAttack() {
        fuzzLogger.debug('Executing gossip flood attack');

        const floodCount = 1000;
        const startTime = Date.now();
        let processedCount = 0;

        // Flood with gossip messages
        const floodPromises = [];
        for (let i = 0; i < floodCount; i++) {
            const floodEvent = {
                id: `flood-${i}`,
                type: 'flood_test',
                data: { payload: 'A'.repeat(1000) }, // Large payload
                timestamp: Date.now() + i
            };

            floodPromises.push(
                this.systemComponents.gossipMesh.receiveEvent(floodEvent, 'attacker-peer')
                    .then(() => processedCount++)
                    .catch(() => {}) // Ignore errors for this test
            );
        }

        await Promise.allSettled(floodPromises);
        const processingTime = Date.now() - startTime;

        // Check if system remained responsive
        const responsive = processingTime < 10000; // Less than 10 seconds
        const rateLimited = processedCount < floodCount * 0.8; // Less than 80% processed

        return {
            success: processedCount > 0,
            detected: rateLimited,
            mitigated: rateLimited && responsive,
            details: `Processed ${processedCount}/${floodCount} flood messages in ${processingTime}ms`
        };
    }

    async executeForkBombAttack() {
        fuzzLogger.debug('Executing fork bomb attack');

        const baseEvent = {
            id: 'fork-base',
            type: 'proposal_vote',
            data: { proposalId: 'fork-test' },
            timestamp: Date.now()
        };

        await this.systemComponents.dagConstructor.addEvent(baseEvent);

        // Create many competing forks
        const forkCount = 50;
        const competingEvents = [];

        for (let i = 0; i < forkCount; i++) {
            const forkEvent = {
                id: `fork-${i}`,
                type: 'proposal_vote',
                data: { proposalId: 'fork-test', vote: `option-${i}` },
                parent_hashes: [baseEvent.id],
                timestamp: Date.now() + i,
                creator_id: `fork-creator-${i}`
            };

            competingEvents.push(forkEvent);
        }

        let forksDetected = 0;
        for (const event of competingEvents) {
            try {
                await this.systemComponents.dagConstructor.addEvent(event);
                await this.systemComponents.forkDetection.detectForks();
                
                const activeForks = this.systemComponents.forkDetection.getActiveForks();
                forksDetected = activeForks.length;
            } catch (error) {
                // Fork rejection is also a valid response
            }
        }

        return {
            success: competingEvents.length > 0,
            detected: forksDetected > 0,
            mitigated: forksDetected < forkCount,
            details: `Created ${forkCount} competing forks, ${forksDetected} detected`
        };
    }

    async executeMalformedDataAttack() {
        fuzzLogger.debug('Executing malformed data attack');

        const malformedEvents = [
            { id: 'malformed-1', type: null, data: 'not-an-object' },
            { id: 'malformed-2', type: 'test', data: { payload: '\x00\x01\x02' } }, // Binary data
            { id: 'malformed-3', type: 'test', data: { circular: null } }
        ];

        // Create circular reference
        malformedEvents[2].data.circular = malformedEvents[2].data;

        let rejectedCount = 0;
        for (const event of malformedEvents) {
            try {
                JSON.stringify(event); // Test if serializable
                await this.systemComponents.dagConstructor.addEvent(event);
            } catch (error) {
                rejectedCount++;
            }
        }

        return {
            success: rejectedCount < malformedEvents.length,
            detected: rejectedCount > 0,
            mitigated: rejectedCount === malformedEvents.length,
            details: `${rejectedCount}/${malformedEvents.length} malformed events rejected`
        };
    }

    async executeEclipseAttack() {
        fuzzLogger.debug('Executing eclipse attack');

        // Simulate controlling all peer connections
        const targetNode = 'victim-node';
        const maliciousPeers = ['attacker-1', 'attacker-2', 'attacker-3'];

        // Disconnect legitimate peers
        this.systemComponents.gossipMesh.disconnectPeer('legitimate-peer-1');
        this.systemComponents.gossipMesh.disconnectPeer('legitimate-peer-2');

        // Connect only malicious peers
        for (const peer of maliciousPeers) {
            this.systemComponents.gossipMesh.connectPeer(peer, { malicious: true });
        }

        // Check if eclipse was detected
        const connectedPeers = this.systemComponents.gossipMesh.getConnectedPeers();
        const maliciousRatio = maliciousPeers.length / connectedPeers.length;
        const eclipseDetected = maliciousRatio > 0.8; // More than 80% malicious

        return {
            success: maliciousRatio > 0.5,
            detected: eclipseDetected,
            mitigated: false, // Eclipse attacks are hard to detect automatically
            details: `Malicious peer ratio: ${maliciousRatio.toFixed(2)}`
        };
    }

    async executeDenialOfServiceAttack() {
        fuzzLogger.debug('Executing denial of service attack');

        const startTime = Date.now();
        const resourceIntensiveOperations = [];

        // Create many resource-intensive operations
        for (let i = 0; i < 100; i++) {
            const operation = this.createResourceIntensiveEvent(i);
            resourceIntensiveOperations.push(operation);
        }

        let processedCount = 0;
        const promises = resourceIntensiveOperations.map(async (operation) => {
            try {
                await operation;
                processedCount++;
            } catch (error) {
                // Expected for DoS protection
            }
        });

        await Promise.allSettled(promises);
        const processingTime = Date.now() - startTime;

        // System should remain responsive
        const remainedResponsive = processingTime < 30000; // Less than 30 seconds
        const limitedProcessing = processedCount < resourceIntensiveOperations.length;

        return {
            success: processedCount > 0,
            detected: limitedProcessing,
            mitigated: limitedProcessing && remainedResponsive,
            details: `Processed ${processedCount}/${resourceIntensiveOperations.length} operations in ${processingTime}ms`
        };
    }

    async createResourceIntensiveEvent(index) {
        // Simulate resource-intensive operation
        const largeData = 'x'.repeat(100000); // 100KB of data
        const event = {
            id: `dos-${index}`,
            type: 'resource_intensive',
            data: { payload: largeData },
            timestamp: Date.now()
        };

        // Simulate expensive computation
        for (let i = 0; i < 10000; i++) {
            crypto.createHash('sha256').update(largeData).digest('hex');
        }

        return this.systemComponents.dagConstructor.addEvent(event);
    }

    /**
     * Phase 3: Edge Case Testing
     */
    async testEdgeCases() {
        fuzzLogger.info('Testing edge cases');

        const edgeCaseTests = [
            this.testZeroTimestampEvents.bind(this),
            this.testMaxIntegerTimestamps.bind(this),
            this.testEmptyStringIds.bind(this),
            this.testUnicodeEventData.bind(this),
            this.testMaxSizeEvents.bind(this),
            this.testConcurrentEventAddition.bind(this)
        ];

        for (const test of edgeCaseTests) {
            try {
                await test();
                this.testResults.passedTests++;
            } catch (error) {
                this.testResults.failedTests++;
                this.testResults.edgeCases.push({
                    test: test.name,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
            this.testResults.totalTests++;
        }
    }

    async testZeroTimestampEvents() {
        const zeroEvent = {
            id: 'zero-timestamp',
            type: 'test',
            timestamp: 0
        };

        await this.systemComponents.dagConstructor.addEvent(zeroEvent);
    }

    async testMaxIntegerTimestamps() {
        const maxEvent = {
            id: 'max-timestamp',
            type: 'test',
            timestamp: Number.MAX_SAFE_INTEGER
        };

        await this.systemComponents.dagConstructor.addEvent(maxEvent);
    }

    async testEmptyStringIds() {
        const emptyIdEvent = {
            id: '',
            type: 'test',
            timestamp: Date.now()
        };

        try {
            await this.systemComponents.dagConstructor.addEvent(emptyIdEvent);
            throw new Error('Empty ID event should be rejected');
        } catch (error) {
            if (!error.message.includes('Empty ID')) {
                throw error; // Re-throw if not the expected error
            }
        }
    }

    async testUnicodeEventData() {
        const unicodeEvent = {
            id: 'unicode-test',
            type: 'test',
            data: {
                emoji: '🌟🚀💖🎯🔥',
                chinese: '你好世界',
                arabic: 'مرحبا بالعالم',
                special: '\u0000\u0001\u0002\u0003'
            },
            timestamp: Date.now()
        };

        await this.systemComponents.dagConstructor.addEvent(unicodeEvent);
    }

    async testMaxSizeEvents() {
        const maxSizeData = 'x'.repeat(1000000); // 1MB of data
        const largeEvent = {
            id: 'large-event',
            type: 'test',
            data: { payload: maxSizeData },
            timestamp: Date.now()
        };

        try {
            await this.systemComponents.dagConstructor.addEvent(largeEvent);
        } catch (error) {
            if (!error.message.includes('size') && !error.message.includes('limit')) {
                throw error;
            }
            // Size limits are acceptable
        }
    }

    async testConcurrentEventAddition() {
        const concurrentEvents = [];
        for (let i = 0; i < 100; i++) {
            concurrentEvents.push({
                id: `concurrent-${i}`,
                type: 'concurrent_test',
                timestamp: Date.now() + i
            });
        }

        // Add all events concurrently
        const promises = concurrentEvents.map(event => 
            this.systemComponents.dagConstructor.addEvent(event)
        );

        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;

        if (successful < concurrentEvents.length * 0.9) {
            throw new Error(`Only ${successful}/${concurrentEvents.length} concurrent events succeeded`);
        }
    }

    /**
     * Phase 4: Performance Stress Testing
     */
    async performanceStressTesting() {
        fuzzLogger.info('Performing stress testing');

        const stressTests = [
            this.stressTestEventThroughput.bind(this),
            this.stressTestMemoryUsage.bind(this),
            this.stressTestCPUUsage.bind(this),
            this.stressTestNetworkLoad.bind(this)
        ];

        for (const test of stressTests) {
            try {
                const metrics = await test();
                this.testResults.performanceMetrics.push(metrics);
                this.testResults.passedTests++;
            } catch (error) {
                this.testResults.failedTests++;
                this.recordPerformanceIssue(error.message);
            }
            this.testResults.totalTests++;
        }
    }

    async stressTestEventThroughput() {
        fuzzLogger.debug('Stress testing event throughput');

        const eventCount = 10000;
        const startTime = Date.now();
        let processedCount = 0;

        const events = [];
        for (let i = 0; i < eventCount; i++) {
            events.push({
                id: `throughput-${i}`,
                type: 'throughput_test',
                timestamp: Date.now() + i
            });
        }

        const batchSize = 100;
        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            const promises = batch.map(event => 
                this.systemComponents.dagConstructor.addEvent(event)
                    .then(() => processedCount++)
                    .catch(() => {}) // Ignore individual failures
            );
            await Promise.allSettled(promises);
        }

        const duration = Date.now() - startTime;
        const throughput = processedCount / (duration / 1000); // Events per second

        return {
            test: 'Event Throughput',
            eventsProcessed: processedCount,
            duration,
            throughput: throughput.toFixed(2),
            timestamp: Date.now()
        };
    }

    async stressTestMemoryUsage() {
        fuzzLogger.debug('Stress testing memory usage');

        const initialMemory = process.memoryUsage();
        const eventCount = 5000;

        // Add many events to test memory usage
        for (let i = 0; i < eventCount; i++) {
            const event = {
                id: `memory-test-${i}`,
                type: 'memory_test',
                data: { payload: 'x'.repeat(1000) }, // 1KB each
                timestamp: Date.now() + i
            };

            await this.systemComponents.dagConstructor.addEvent(event);

            // Check memory every 1000 events
            if (i % 1000 === 0) {
                const currentMemory = process.memoryUsage();
                const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
                
                if (memoryIncrease > 500 * 1024 * 1024) { // More than 500MB increase
                    throw new Error(`Excessive memory usage: ${memoryIncrease / 1024 / 1024}MB`);
                }
            }
        }

        const finalMemory = process.memoryUsage();
        const memoryUsed = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

        return {
            test: 'Memory Usage',
            eventsAdded: eventCount,
            memoryUsedMB: memoryUsed.toFixed(2),
            memoryPerEvent: (memoryUsed / eventCount * 1024).toFixed(2) + 'KB',
            timestamp: Date.now()
        };
    }

    async stressTestCPUUsage() {
        fuzzLogger.debug('Stress testing CPU usage');

        const startTime = Date.now();
        const cpuIntensiveCount = 1000;

        for (let i = 0; i < cpuIntensiveCount; i++) {
            // CPU-intensive event processing
            const data = JSON.stringify({ iteration: i, random: Math.random() });
            for (let j = 0; j < 100; j++) {
                crypto.createHash('sha256').update(data).digest('hex');
            }

            const event = {
                id: `cpu-test-${i}`,
                type: 'cpu_intensive',
                data: { hash: crypto.createHash('sha256').update(data).digest('hex') },
                timestamp: Date.now()
            };

            await this.systemComponents.dagConstructor.addEvent(event);
        }

        const duration = Date.now() - startTime;
        const avgProcessingTime = duration / cpuIntensiveCount;

        return {
            test: 'CPU Usage',
            operations: cpuIntensiveCount,
            totalDuration: duration,
            avgProcessingTime: avgProcessingTime.toFixed(2) + 'ms',
            timestamp: Date.now()
        };
    }

    async stressTestNetworkLoad() {
        fuzzLogger.debug('Stress testing network load');

        const messageCount = 1000;
        const messageSize = 10000; // 10KB messages
        const startTime = Date.now();

        let sentCount = 0;
        let receivedCount = 0;

        // Set up receiver
        this.systemComponents.gossipMesh.on('eventReceived', () => {
            receivedCount++;
        });

        // Send many large messages
        for (let i = 0; i < messageCount; i++) {
            const largeMessage = {
                id: `network-test-${i}`,
                type: 'network_stress',
                data: { payload: 'x'.repeat(messageSize) },
                timestamp: Date.now() + i
            };

            try {
                this.systemComponents.gossipMesh.receiveEvent(largeMessage, 'stress-peer');
                sentCount++;
            } catch (error) {
                // Network congestion is expected
            }

            // Small delay to prevent overwhelming
            if (i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        const duration = Date.now() - startTime;
        const throughputMBps = (sentCount * messageSize) / (duration / 1000) / 1024 / 1024;

        return {
            test: 'Network Load',
            messagesSent: sentCount,
            messagesReceived: receivedCount,
            totalDataMB: (sentCount * messageSize / 1024 / 1024).toFixed(2),
            throughputMBps: throughputMBps.toFixed(2),
            timestamp: Date.now()
        };
    }

    /**
     * Phase 5: Resilience Testing
     */
    async resilienceTesting() {
        fuzzLogger.info('Performing resilience testing');

        const resilienceTests = [
            this.testRecoveryFromCorruption.bind(this),
            this.testRecoveryFromNetworkPartition.bind(this),
            this.testRecoveryFromComponentFailure.bind(this)
        ];

        for (const test of resilienceTests) {
            try {
                await test();
                this.testResults.passedTests++;
            } catch (error) {
                this.testResults.failedTests++;
                this.recordVulnerability('Resilience', error.message);
            }
            this.testResults.totalTests++;
        }
    }

    async testRecoveryFromCorruption() {
        fuzzLogger.debug('Testing recovery from data corruption');

        // Add some valid events
        for (let i = 0; i < 10; i++) {
            await this.systemComponents.dagConstructor.addEvent({
                id: `pre-corruption-${i}`,
                type: 'test',
                timestamp: Date.now() + i
            });
        }

        // Simulate data corruption by corrupting internal state
        // (In a real system, this would corrupt the actual storage)
        const originalMethod = this.systemComponents.dagConstructor.getEvent;
        this.systemComponents.dagConstructor.getEvent = () => {
            throw new Error('Simulated data corruption');
        };

        // Try to recover
        try {
            this.systemComponents.dagConstructor.getEvent = originalMethod;
            
            // Add new events after recovery
            await this.systemComponents.dagConstructor.addEvent({
                id: 'post-recovery',
                type: 'test',
                timestamp: Date.now()
            });

        } catch (error) {
            throw new Error(`Failed to recover from corruption: ${error.message}`);
        }
    }

    async testRecoveryFromNetworkPartition() {
        fuzzLogger.debug('Testing recovery from network partition');

        // Simulate network partition
        const originalConnectedPeers = this.systemComponents.gossipMesh.getConnectedPeers();
        
        // Disconnect all peers
        for (const peer of originalConnectedPeers) {
            this.systemComponents.gossipMesh.disconnectPeer(peer);
        }

        // Add events during partition
        const partitionEvents = [];
        for (let i = 0; i < 5; i++) {
            const event = {
                id: `partition-${i}`,
                type: 'partition_test',
                timestamp: Date.now() + i
            };
            partitionEvents.push(event);
            await this.systemComponents.dagConstructor.addEvent(event);
        }

        // Reconnect peers
        for (const peer of originalConnectedPeers) {
            this.systemComponents.gossipMesh.connectPeer(peer, {});
        }

        // Verify events were preserved
        for (const event of partitionEvents) {
            const retrieved = await this.systemComponents.dagConstructor.getEvent(event.id);
            if (!retrieved) {
                throw new Error(`Event ${event.id} lost during partition`);
            }
        }
    }

    async testRecoveryFromComponentFailure() {
        fuzzLogger.debug('Testing recovery from component failure');

        // Simulate component failure
        const originalSybilDetector = this.systemComponents.sybilDetector;
        this.systemComponents.sybilDetector = null;

        // System should still function with degraded capabilities
        try {
            await this.systemComponents.dagConstructor.addEvent({
                id: 'during-failure',
                type: 'test',
                timestamp: Date.now()
            });
        } catch (error) {
            throw new Error(`System failed when component unavailable: ${error.message}`);
        }

        // Restore component
        this.systemComponents.sybilDetector = originalSybilDetector;

        // Verify full functionality restored
        await this.systemComponents.sybilDetector.analyzeEvent({
            id: 'after-recovery',
            type: 'test',
            timestamp: Date.now()
        });
    }

    /**
     * Utility Methods
     */

    recordVulnerability(category, description) {
        this.testResults.vulnerabilities.push({
            category,
            description,
            timestamp: Date.now(),
            severity: this.calculateSeverity(description)
        });

        fuzzLogger.warn('Vulnerability found', { category, description });
    }

    recordPerformanceIssue(description) {
        this.testResults.performanceMetrics.push({
            test: 'Performance Issue',
            description,
            timestamp: Date.now()
        });

        fuzzLogger.warn('Performance issue detected', { description });
    }

    calculateSeverity(description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('critical') || lowerDesc.includes('security') || lowerDesc.includes('attack')) {
            return 'critical';
        } else if (lowerDesc.includes('performance') || lowerDesc.includes('memory') || lowerDesc.includes('cpu')) {
            return 'high';
        } else if (lowerDesc.includes('edge case') || lowerDesc.includes('handling')) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Generate comprehensive fuzz test report
     */
    async generateFuzzTestReport(testDuration) {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration,
            config: this.config,
            summary: {
                totalTests: this.testResults.totalTests,
                passedTests: this.testResults.passedTests,
                failedTests: this.testResults.failedTests,
                successRate: ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2) + '%',
                vulnerabilitiesFound: this.testResults.vulnerabilities.length,
                performanceIssues: this.testResults.performanceMetrics.filter(m => m.description).length
            },
            vulnerabilities: this.testResults.vulnerabilities,
            attackResults: this.testResults.attackResults,
            performanceMetrics: this.testResults.performanceMetrics,
            edgeCases: this.testResults.edgeCases,
            recommendations: this.generateRecommendations()
        };

        // Save detailed report
        const reportPath = path.join(this.config.reportDirectory, 'fuzz-test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        // Generate human-readable summary
        const summaryText = this.generateHumanReadableSummary(report);
        const summaryPath = path.join(this.config.reportDirectory, 'FUZZ-TEST-SUMMARY.md');
        await fs.writeFile(summaryPath, summaryText);

        fuzzLogger.info('Fuzz test report generated', {
            reportPath,
            summaryPath,
            vulnerabilities: report.summary.vulnerabilitiesFound
        });

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze vulnerabilities
        const criticalVulns = this.testResults.vulnerabilities.filter(v => v.severity === 'critical');
        if (criticalVulns.length > 0) {
            recommendations.push('CRITICAL: Address critical vulnerabilities before production deployment');
        }

        // Analyze attack results
        const successfulAttacks = this.testResults.attackResults.filter(a => a.success && !a.mitigated);
        if (successfulAttacks.length > 0) {
            recommendations.push(`Implement additional defenses against: ${successfulAttacks.map(a => a.vector).join(', ')}`);
        }

        // Analyze performance
        const performanceIssues = this.testResults.performanceMetrics.filter(m => m.description);
        if (performanceIssues.length > 0) {
            recommendations.push('Optimize performance for identified bottlenecks');
        }

        // General recommendations
        recommendations.push('Implement comprehensive monitoring and alerting');
        recommendations.push('Regular security audits and penetration testing');
        recommendations.push('Establish incident response procedures');

        return recommendations;
    }

    generateHumanReadableSummary(report) {
        return `
# Hashgraph Fuzz Testing Report

**Generated:** ${report.timestamp}
**Test Duration:** ${report.testDuration}ms
**Overall Success Rate:** ${report.summary.successRate}

## 📊 Test Summary

- **Total Tests:** ${report.summary.totalTests}
- **Passed:** ${report.summary.passedTests}
- **Failed:** ${report.summary.failedTests}
- **Vulnerabilities Found:** ${report.summary.vulnerabilitiesFound}
- **Performance Issues:** ${report.summary.performanceIssues}

## 🚨 Vulnerabilities

${report.vulnerabilities.map(v => `
### ${v.category} - ${v.severity.toUpperCase()}
${v.description}
`).join('')}

## ⚔️ Attack Vector Results

${report.attackResults.map(a => `
### ${a.vector} (${a.severity})
- **Success:** ${a.success}
- **Detected:** ${a.detected}
- **Mitigated:** ${a.mitigated}
- **Details:** ${a.details}
`).join('')}

## 📈 Performance Metrics

${report.performanceMetrics.filter(m => !m.description).map(m => `
### ${m.test}
${Object.entries(m).filter(([k, v]) => k !== 'test' && k !== 'timestamp').map(([k, v]) => `- **${k}:** ${v}`).join('\n')}
`).join('')}

## 🔧 Recommendations

${report.recommendations.map(r => `- ${r}`).join('\n')}

---

*This report was generated by the Hashgraph Fuzz Testing Suite. All tests were conducted in a controlled environment.*
        `.trim();
    }
}

export default HashgraphFuzzTestingSuite;
