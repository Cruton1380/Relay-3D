/**
 * Relay KeySpace Storage Market - Demo Script
 * 
 * Demonstrates the complete storage market functionality including
 * multi-user scenarios, file upload/download, shard recovery,
 * and guardian backup systems.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Import storage market modules
import KeyspaceShardManager from './keyspaceShardManager.mjs';
import RelayStorageRegistry from './relayStorageRegistry.mjs';
import RelayStorageBroker from './relayStorageBroker.mjs';
import KeyspacePermissions from './keyspacePermissions.mjs';
import KeyspaceRepairJob from './keyspaceRepairJob.mjs';
import KeyspaceProofOfStorage from './keyspaceProofOfStorage.mjs';
import GuardianShardVault from './guardianShardVault.mjs';

class KeyspaceStorageDemo extends EventEmitter {
    constructor() {
        super();
        this.users = new Map();
        this.demoData = new Map();
        this.demoResults = [];
        
        // Initialize storage system components
        this.initializeComponents();
        
        // Demo configuration
        this.config = {
            demoUsers: 5,
            providersPerUser: 2,
            filesPerUser: 3,
            fileSizes: [1024, 8192, 32768], // Different file sizes
            planTiers: ['basic', 'secure', 'vault'],
            demoDataDir: './demo-data'
        };
    }

    /**
     * Initialize all storage market components
     */
    async initializeComponents() {
        console.log('🔧 Initializing Relay KeySpace Storage Market components...');
        
        // Mock APIs for demo
        const mockKeyspaceAPI = this.createMockKeyspaceAPI();
        const mockGuardianAPI = this.createMockGuardianAPI();
        const mockLibp2pAPI = this.createMockLibp2pAPI();
        
        // Initialize core components
        this.shardManager = new KeyspaceShardManager();
        this.storageRegistry = new RelayStorageRegistry(mockLibp2pAPI);
        this.storageBroker = new RelayStorageBroker(this.storageRegistry, this.shardManager);
        this.permissions = new KeyspacePermissions(mockKeyspaceAPI, mockGuardianAPI);
        this.repairJob = new KeyspaceRepairJob(this.shardManager, this.storageBroker, this.storageRegistry);
        this.proofOfStorage = new KeyspaceProofOfStorage(this.storageRegistry, this.shardManager);
        this.guardianVault = new GuardianShardVault(mockGuardianAPI, this.shardManager, mockKeyspaceAPI);
        
        // Set up event listeners for monitoring
        this.setupEventListeners();
        
        console.log('✅ All components initialized successfully');
    }

    /**
     * Set up event listeners for demonstration
     */
    setupEventListeners() {
        // Storage events
        this.storageRegistry.on('provider:registered', (data) => {
            console.log(`📡 Provider registered: ${data.nodeId} (${data.region})`);
        });
        
        this.storageBroker.on('file:stored', (data) => {
            console.log(`💾 File stored: ${data.fileId} across ${data.shardCount} shards`);
        });
        
        this.repairJob.on('repair:completed', (data) => {
            console.log(`🔧 Repair completed: ${data.fileId} (${data.repairedShards} shards)`);
        });
        
        this.proofOfStorage.on('challenge:success', (data) => {
            console.log(`✅ Challenge successful: ${data.nodeId} (${data.responseTime}ms)`);
        });
        
        this.guardianVault.on('shard:stored', (data) => {
            console.log(`🛡️ Guardian storage: ${data.fileId} with ${data.guardiansCount} guardians`);
        });
    }

    /**
     * Run complete storage market demonstration
     */
    async runDemo() {
        console.log('\n🚀 Starting Relay KeySpace Storage Market Demo\n');
        
        try {
            // Create demo data directory
            await this.createDemoDataDirectory();
            
            // Phase 1: Setup demo environment
            console.log('📋 Phase 1: Setting up demo environment...');
            await this.setupDemoEnvironment();
            
            // Phase 2: User registration and provider setup
            console.log('\n👥 Phase 2: Registering users and storage providers...');
            await this.registerUsersAndProviders();
            
            // Phase 3: File upload demonstrations
            console.log('\n📤 Phase 3: Demonstrating file uploads...');
            await this.demonstrateFileUploads();
            
            // Phase 4: Permission and sharing demonstrations
            console.log('\n🔐 Phase 4: Demonstrating permissions and sharing...');
            await this.demonstratePermissionsAndSharing();
            
            // Phase 5: Storage monitoring and challenges
            console.log('\n🔍 Phase 5: Running storage monitoring and challenges...');
            await this.demonstrateMonitoringAndChallenges();
            
            // Phase 6: Failure simulation and repair
            console.log('\n⚠️ Phase 6: Simulating failures and repairs...');
            await this.demonstrateFailureAndRepair();
            
            // Phase 7: Guardian vault demonstrations
            console.log('\n🛡️ Phase 7: Demonstrating guardian vault features...');
            await this.demonstrateGuardianVault();
            
            // Phase 8: File recovery demonstrations
            console.log('\n🔄 Phase 8: Demonstrating file recovery...');
            await this.demonstrateFileRecovery();
            
            // Generate demo report
            console.log('\n📊 Generating demo report...');
            await this.generateDemoReport();
            
            console.log('\n🎉 Demo completed successfully!');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        }
    }

    /**
     * Create demo data directory
     */
    async createDemoDataDirectory() {
        try {
            await fs.mkdir(this.config.demoDataDir, { recursive: true });
            console.log(`📁 Created demo data directory: ${this.config.demoDataDir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Setup demo environment
     */
    async setupDemoEnvironment() {
        // Generate demo files of various sizes
        for (let i = 0; i < this.config.fileSizes.length; i++) {
            const size = this.config.fileSizes[i];
            const filename = `demo-file-${size}bytes.dat`;
            const filepath = path.join(this.config.demoDataDir, filename);
            
            const data = crypto.randomBytes(size);
            await fs.writeFile(filepath, data);
            
            this.demoData.set(filename, {
                path: filepath,
                size,
                data,
                checksum: crypto.createHash('sha256').update(data).digest('hex')
            });
            
            console.log(`📄 Generated demo file: ${filename} (${size} bytes)`);
        }
    }

    /**
     * Register demo users and storage providers
     */
    async registerUsersAndProviders() {
        // Register demo users
        for (let i = 1; i <= this.config.demoUsers; i++) {
            const userId = `demo-user-${i}`;
            const user = {
                userId,
                username: `DemoUser${i}`,
                keyspaceId: `keyspace-${userId}`,
                reputation: 0.8 + (Math.random() * 0.2), // 0.8-1.0
                region: ['us-east', 'eu-west', 'asia-pacific'][i % 3],
                joinedAt: Date.now() - (Math.random() * 86400000) // Random time in last 24h
            };
            
            this.users.set(userId, user);
            console.log(`👤 Registered user: ${user.username} (${user.region})`);
            
            // Register storage providers for each user
            for (let j = 1; j <= this.config.providersPerUser; j++) {
                const nodeId = `${userId}-provider-${j}`;
                await this.storageRegistry.registerProvider({
                    nodeId,
                    ownerId: userId,
                    endpoint: `storage-${i}-${j}.demo.relay.local:8080`,
                    region: user.region,
                    capacity: 1024 * 1024 * 100, // 100MB
                    used: Math.floor(Math.random() * 1024 * 1024 * 20), // 0-20MB used
                    planTiers: this.config.planTiers,
                    pricing: {
                        basic: 0.01 + (Math.random() * 0.01), // $0.01-0.02 per MB
                        secure: 0.02 + (Math.random() * 0.01),
                        vault: 0.05 + (Math.random() * 0.02)
                    },
                    badges: j === 1 ? ['verified', 'fast'] : ['reliable']
                });
            }
        }
        
        const providers = await this.storageRegistry.getAllProviders();
        console.log(`🌐 Total providers registered: ${providers.length}`);
    }

    /**
     * Demonstrate file uploads with different plan tiers
     */
    async demonstrateFileUploads() {
        let fileIndex = 0;
        
        for (const [userId, user] of this.users) {
            console.log(`\n📤 ${user.username} uploading files...`);
            
            for (let i = 0; i < this.config.filesPerUser; i++) {
                const planTier = this.config.planTiers[i % this.config.planTiers.length];
                const demoFiles = Array.from(this.demoData.keys());
                const filename = demoFiles[fileIndex % demoFiles.length];
                const fileData = this.demoData.get(filename);
                
                const fileId = `${userId}-file-${i + 1}`;
                
                try {
                    // Initialize permissions
                    await this.permissions.initializeFilePermissions(fileId, userId, planTier);
                    
                    // Store file
                    const result = await this.storageBroker.storeFile(
                        fileId,
                        fileData.data,
                        userId,
                        planTier
                    );
                    
                    // Register for monitoring
                    await this.repairJob.registerFile(fileId, result.shardMetadata, planTier);
                    
                    // Register shards for proof of storage
                    for (let shardIndex = 0; shardIndex < result.shardMetadata.totalShards; shardIndex++) {
                        const shardId = `${fileId}_shard_${shardIndex}`;
                        const nodeId = result.shardMetadata.shardLocations[shardIndex];
                        await this.proofOfStorage.registerShard(
                            shardId, 
                            nodeId, 
                            fileId, 
                            shardIndex, 
                            result.shardMetadata.shardChecksums[shardIndex]
                        );
                    }
                    
                    // Store with guardians if vault tier
                    if (planTier === 'vault') {
                        await this.guardianVault.storeShardWithGuardians(
                            fileId,
                            fileData.data,
                            0, // First shard for demo
                            userId
                        );
                    }
                    
                    console.log(`  ✅ ${filename} uploaded as ${fileId} (${planTier} tier)`);
                    console.log(`     Shards: ${result.shardMetadata.totalShards}, Cost: $${result.totalCost.toFixed(4)}`);
                    
                    this.demoResults.push({
                        type: 'upload',
                        userId,
                        fileId,
                        filename,
                        planTier,
                        size: fileData.size,
                        shardCount: result.shardMetadata.totalShards,
                        cost: result.totalCost,
                        timestamp: Date.now()
                    });
                    
                } catch (error) {
                    console.log(`  ❌ Failed to upload ${filename}: ${error.message}`);
                }
                
                fileIndex++;
            }
        }
    }

    /**
     * Demonstrate permissions and file sharing
     */
    async demonstratePermissionsAndSharing() {
        const users = Array.from(this.users.keys());
        const sharer = users[0];
        const recipient = users[1];
        
        console.log(`🔐 ${this.users.get(sharer).username} sharing with ${this.users.get(recipient).username}...`);
        
        const fileId = `${sharer}-file-1`;
        
        try {
            // Grant read permission
            await this.permissions.grantPermission(
                fileId,
                sharer,
                recipient,
                ['read']
            );
            
            // Create a share link
            const shareLink = await this.permissions.createShareLink(fileId, sharer, {
                shareType: 'private',
                permissions: ['read'],
                expiresIn: 3600000, // 1 hour
                targetUserId: recipient
            });
            
            console.log(`  ✅ Read permission granted`);
            console.log(`  🔗 Share link created: ${shareLink.shareLink}`);
            
            // Use the share link
            const access = await this.permissions.useShareLink(shareLink.shareToken, recipient);
            console.log(`  ✅ Share link used successfully`);
            
            this.demoResults.push({
                type: 'sharing',
                sharer,
                recipient,
                fileId,
                permissions: ['read'],
                shareToken: shareLink.shareToken,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.log(`  ❌ Sharing failed: ${error.message}`);
        }
    }

    /**
     * Demonstrate storage monitoring and proof-of-storage challenges
     */
    async demonstrateMonitoringAndChallenges() {
        console.log('🔍 Running proof-of-storage challenges...');
        
        // Run a few challenge rounds
        for (let i = 0; i < 3; i++) {
            await this.proofOfStorage.runChallengeRound();
            await this.sleep(2000); // Wait 2 seconds between rounds
        }
        
        // Check health of all registered files
        console.log('🏥 Checking file health...');
        await this.repairJob.runHealthCheck();
        
        // Get network statistics
        const networkStats = this.proofOfStorage.getNetworkStats();
        console.log(`  📊 Network stats: ${networkStats.totalProviders} providers, ${networkStats.totalShards} shards`);
        console.log(`     Success rate: ${(networkStats.overallSuccessRate * 100).toFixed(1)}%`);
        
        this.demoResults.push({
            type: 'monitoring',
            networkStats,
            timestamp: Date.now()
        });
    }

    /**
     * Demonstrate failure simulation and automatic repair
     */
    async demonstrateFailureAndRepair() {
        console.log('⚠️ Simulating provider failures...');
        
        // Get a random provider to simulate failure
        const providers = await this.storageRegistry.getAllProviders();
        const targetProvider = providers[Math.floor(Math.random() * providers.length)];
        
        console.log(`  💥 Simulating failure of provider: ${targetProvider.nodeId}`);
        
        // Mark provider as offline
        await this.storageRegistry.updateProviderStatus(targetProvider.nodeId, false);
        
        // Find a file that uses this provider
        let affectedFileId = null;
        for (const [userId, user] of this.users) {
            for (let i = 0; i < this.config.filesPerUser; i++) {
                const fileId = `${userId}-file-${i + 1}`;
                // In a real implementation, we'd check shard locations
                affectedFileId = fileId;
                break;
            }
            if (affectedFileId) break;
        }
        
        if (affectedFileId) {
            console.log(`  🔧 Triggering repair for affected file: ${affectedFileId}`);
            
            try {
                // Force a health check to detect the failure
                await this.repairJob.checkFileHealth(affectedFileId);
                
                // Schedule repair (in real implementation, this would be automatic)
                const repairJobId = await this.repairJob.scheduleRepair(affectedFileId, false);
                
                console.log(`  ✅ Repair job scheduled: ${repairJobId}`);
                
                this.demoResults.push({
                    type: 'repair',
                    fileId: affectedFileId,
                    failedProvider: targetProvider.nodeId,
                    repairJobId,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.log(`  ❌ Repair failed: ${error.message}`);
            }
        }
    }

    /**
     * Demonstrate guardian vault features
     */
    async demonstrateGuardianVault() {
        console.log('🛡️ Demonstrating guardian vault features...');
        
        const vaultUsers = Array.from(this.users.keys()).slice(0, 2);
        
        for (const userId of vaultUsers) {
            const fileId = `${userId}-file-3`; // Assuming third file is vault tier
            
            try {
                console.log(`  🔒 Storing vault backup for ${this.users.get(userId).username}...`);
                
                // This would normally be done during upload, but demonstrating separately
                const demoFile = Array.from(this.demoData.values())[0];
                const result = await this.guardianVault.storeShardWithGuardians(
                    fileId,
                    demoFile.data,
                    0,
                    userId,
                    { allowEmergencyRecovery: true }
                );
                
                console.log(`    ✅ Stored with ${result.guardians.length} guardians`);
                
                this.demoResults.push({
                    type: 'guardian_storage',
                    userId,
                    fileId,
                    guardianCount: result.guardians.length,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.log(`    ❌ Guardian storage failed: ${error.message}`);
            }
        }
        
        // Demonstrate guardian health monitoring
        console.log('  🏥 Checking guardian health...');
        await this.guardianVault.monitorGuardianHealth();
        
        const vaultStats = this.guardianVault.getVaultStatistics();
        console.log(`  📊 Vault stats: ${vaultStats.totalShards} shards, ${vaultStats.totalGuardians} guardians`);
    }

    /**
     * Demonstrate file recovery scenarios
     */
    async demonstrateFileRecovery() {
        console.log('🔄 Demonstrating file recovery scenarios...');
        
        const users = Array.from(this.users.keys());
        const testUser = users[0];
        const fileId = `${testUser}-file-1`;
        
        try {
            console.log(`  📥 Attempting to recover file: ${fileId}`);
            
            // Simulate file recovery request
            const recoveredFile = await this.storageBroker.retrieveFile(fileId, testUser);
            
            console.log(`  ✅ File recovered successfully (${recoveredFile.data.length} bytes)`);
            
            // Verify integrity
            const originalFile = Array.from(this.demoData.values())[0];
            const isIntact = Buffer.compare(recoveredFile.data, originalFile.data) === 0;
            
            console.log(`  🔍 Integrity check: ${isIntact ? 'PASSED' : 'FAILED'}`);
            
            this.demoResults.push({
                type: 'recovery',
                userId: testUser,
                fileId,
                success: true,
                integrityCheck: isIntact,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.log(`  ❌ Recovery failed: ${error.message}`);
            
            this.demoResults.push({
                type: 'recovery',
                userId: testUser,
                fileId,
                success: false,
                error: error.message,
                timestamp: Date.now()
            });
        }
        
        // Demonstrate emergency recovery from guardians
        if (this.guardianVault.getVaultStatistics().totalShards > 0) {
            console.log('  🚨 Demonstrating emergency recovery from guardians...');
            
            try {
                const vaultFileId = `${testUser}-file-3`;
                const recoveryId = await this.guardianVault.initiateEmergencyRecovery(
                    vaultFileId,
                    testUser,
                    'demo_recovery'
                );
                
                console.log(`  ✅ Emergency recovery initiated: ${recoveryId}`);
                
            } catch (error) {
                console.log(`  ❌ Emergency recovery failed: ${error.message}`);
            }
        }
    }

    /**
     * Generate comprehensive demo report
     */
    async generateDemoReport() {
        const report = {
            demoCompleted: Date.now(),
            summary: {
                usersRegistered: this.users.size,
                providersRegistered: (await this.storageRegistry.getAllProviders()).length,
                filesUploaded: this.demoResults.filter(r => r.type === 'upload').length,
                sharingOperations: this.demoResults.filter(r => r.type === 'sharing').length,
                repairOperations: this.demoResults.filter(r => r.type === 'repair').length,
                recoveryOperations: this.demoResults.filter(r => r.type === 'recovery').length
            },
            networkStats: this.proofOfStorage.getNetworkStats(),
            vaultStats: this.guardianVault.getVaultStatistics(),
            healthStatus: this.repairJob.getHealthStatus(),
            results: this.demoResults
        };
        
        const reportPath = path.join(this.config.demoDataDir, 'demo-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Demo report saved to: ${reportPath}`);
        
        // Print summary
        console.log('\n📈 Demo Summary:');
        console.log(`  👥 Users: ${report.summary.usersRegistered}`);
        console.log(`  🌐 Providers: ${report.summary.providersRegistered}`);
        console.log(`  📁 Files Uploaded: ${report.summary.filesUploaded}`);
        console.log(`  🔐 Sharing Operations: ${report.summary.sharingOperations}`);
        console.log(`  🔧 Repair Operations: ${report.summary.repairOperations}`);
        console.log(`  🔄 Recovery Operations: ${report.summary.recoveryOperations}`);
        console.log(`  ✅ Network Success Rate: ${(report.networkStats.overallSuccessRate * 100).toFixed(1)}%`);
        
        return report;
    }

    /**
     * Create mock KeySpace API for demo
     */
    createMockKeyspaceAPI() {
        return {
            getUser: async (userId) => {
                return this.users.get(userId) || null;
            }
        };
    }

    /**
     * Create mock Guardian API for demo
     */
    createMockGuardianAPI() {
        const mockGuardians = [
            {
                guardianId: 'guardian-1',
                ownerId: 'guardian-user-1',
                reputation: 0.95,
                uptime: 0.98,
                avgLatency: 150,
                region: 'us-east',
                endpoint: 'guardian1.relay.demo:8443'
            },
            {
                guardianId: 'guardian-2',
                ownerId: 'guardian-user-2',
                reputation: 0.92,
                uptime: 0.96,
                avgLatency: 180,
                region: 'eu-west',
                endpoint: 'guardian2.relay.demo:8443'
            },
            {
                guardianId: 'guardian-3',
                ownerId: 'guardian-user-3',
                reputation: 0.98,
                uptime: 0.99,
                avgLatency: 120,
                region: 'asia-pacific',
                endpoint: 'guardian3.relay.demo:8443'
            }
        ];
        
        return {
            getAvailableGuardians: async () => mockGuardians,
            isGuardian: async (userId) => mockGuardians.some(g => g.ownerId === userId),
            storeShardWithGuardian: async (guardianId, data, request) => {
                return { success: true, guardianId, size: data.length };
            },
            retrieveShardFromGuardian: async (guardianId, shardId, ownerId) => {
                return { 
                    success: true, 
                    data: crypto.randomBytes(1024), // Mock shard data
                    encryption: { algorithm: 'aes-256-gcm', key: 'mock', iv: 'mock', authTag: 'mock' },
                    compressed: false
                };
            },
            pingGuardian: async (guardianId) => {
                return { success: true, latency: Math.random() * 200 };
            },
            verifyShardWithGuardian: async (guardianId, shardId) => {
                return { success: Math.random() > 0.1 }; // 90% success rate
            },
            deleteShardFromGuardian: async (guardianId, shardId) => {
                return { success: true };
            }
        };
    }

    /**
     * Create mock libp2p API for demo
     */
    createMockLibp2pAPI() {
        return {
            publish: async (topic, data) => {
                console.log(`📡 Published to ${topic}:`, JSON.stringify(data).substring(0, 100) + '...');
                return true;
            },
            subscribe: async (topic, handler) => {
                console.log(`🔔 Subscribed to ${topic}`);
                return true;
            },
            getPeers: async () => {
                return Array.from(this.users.keys()).map(userId => ({ id: userId }));
            }
        };
    }

    /**
     * Sleep utility for demo timing
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup demo resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up demo resources...');
        
        // Shutdown components
        this.repairJob.shutdown();
        this.proofOfStorage.shutdown();
        this.guardianVault.shutdown();
        
        console.log('✅ Cleanup completed');
    }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new KeyspaceStorageDemo();
    
    demo.runDemo()
        .then(() => {
            console.log('\n🏁 Demo finished successfully!');
            return demo.cleanup();
        })
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Demo failed:', error);
            demo.cleanup().finally(() => process.exit(1));
        });
}

export default KeyspaceStorageDemo;
