/**
 * Relay KeySpace Storage Market - Shard Stress Test
 * 
 * Comprehensive testing of sharding and reconstruction functionality
 * with various configurations, file sizes, and failure scenarios.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

// Import the shard manager
import KeyspaceShardManager from './keyspaceShardManager.mjs';

class ShardStressTest {
    constructor() {
        this.shardManager = new KeyspaceShardManager();
        this.results = [];
        this.testConfig = {
            // Test file sizes (bytes)
            fileSizes: [
                1024,        // 1KB
                8192,        // 8KB
                65536,       // 64KB
                262144,      // 256KB
                1048576,     // 1MB
                5242880      // 5MB
            ],
            // Shard configurations (N, K)
            shardConfigs: [
                { n: 3, k: 2 },   // Basic: 3 shards, need 2
                { n: 5, k: 3 },   // Secure: 5 shards, need 3
                { n: 7, k: 4 },   // Vault: 7 shards, need 4
                { n: 10, k: 6 },  // High redundancy
                { n: 15, k: 8 }   // Ultra redundancy
            ],
            // Failure scenarios (number of shards to lose)
            failureScenarios: [0, 1, 2, 3, 4, 5],
            // Number of iterations per test
            iterations: 3,
            // Output directory
            outputDir: './stress-test-results'
        };
    }

    /**
     * Run comprehensive shard stress tests
     */
    async runStressTests() {
        console.log('🧪 Starting Relay KeySpace Shard Stress Tests\n');
        
        try {
            // Create output directory
            await this.createOutputDirectory();
            
            // Generate test files
            console.log('📁 Generating test files...');
            const testFiles = await this.generateTestFiles();
            
            // Run tests for each configuration
            for (const shardConfig of this.testConfig.shardConfigs) {
                console.log(`\n🔧 Testing shard configuration: ${shardConfig.n}/${shardConfig.k}`);
                await this.testShardConfiguration(testFiles, shardConfig);
            }
            
            // Run failure scenario tests
            console.log('\n💥 Testing failure scenarios...');
            await this.testFailureScenarios(testFiles);
            
            // Run performance benchmarks
            console.log('\n⚡ Running performance benchmarks...');
            await this.runPerformanceBenchmarks(testFiles);
            
            // Generate test report
            console.log('\n📊 Generating test report...');
            await this.generateTestReport();
            
            console.log('\n✅ All stress tests completed successfully!');
            
        } catch (error) {
            console.error('❌ Stress test failed:', error.message);
            throw error;
        }
    }

    /**
     * Create output directory for test results
     */
    async createOutputDirectory() {
        try {
            await fs.mkdir(this.testConfig.outputDir, { recursive: true });
            console.log(`📂 Created output directory: ${this.testConfig.outputDir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Generate test files of various sizes
     */
    async generateTestFiles() {
        const testFiles = new Map();
        
        for (const size of this.testConfig.fileSizes) {
            const filename = `test-file-${size}bytes.dat`;
            const filepath = path.join(this.testConfig.outputDir, filename);
            
            // Generate deterministic test data for consistency
            const data = this.generateDeterministicData(size);
            await fs.writeFile(filepath, data);
            
            testFiles.set(size, {
                filename,
                filepath,
                data,
                size,
                checksum: crypto.createHash('sha256').update(data).digest('hex')
            });
            
            console.log(`  📄 Generated ${filename} (${this.formatBytes(size)})`);
        }
        
        return testFiles;
    }

    /**
     * Generate deterministic test data
     */
    generateDeterministicData(size) {
        const data = Buffer.alloc(size);
        
        // Fill with deterministic pattern
        for (let i = 0; i < size; i++) {
            data[i] = (i * 7 + 13) % 256; // Simple deterministic pattern
        }
        
        return data;
    }

    /**
     * Test a specific shard configuration
     */
    async testShardConfiguration(testFiles, shardConfig) {
        const { n, k } = shardConfig;
        
        for (const [size, fileData] of testFiles) {
            console.log(`  📋 Testing ${this.formatBytes(size)} file with ${n}/${k} sharding...`);
            
            const testResults = [];
            
            for (let iteration = 0; iteration < this.testConfig.iterations; iteration++) {
                const iterationResult = await this.runSingleTest(
                    fileData,
                    shardConfig,
                    `${n}_${k}_${size}_iter_${iteration}`
                );
                testResults.push(iterationResult);
            }
            
            // Calculate averages
            const avgResult = this.calculateAverages(testResults);
            avgResult.fileSize = size;
            avgResult.shardConfig = shardConfig;
            
            this.results.push(avgResult);
            
            console.log(`    ✅ Average: Shard ${avgResult.shardingTime.toFixed(2)}ms, ` +
                       `Reconstruct ${avgResult.reconstructionTime.toFixed(2)}ms, ` +
                       `Integrity ${avgResult.integrityCheck ? 'PASS' : 'FAIL'}`);
        }
    }

    /**
     * Run a single sharding and reconstruction test
     */
    async runSingleTest(fileData, shardConfig, testId) {
        const { n, k } = shardConfig;
        
        try {
            // Time the sharding process
            const shardStart = performance.now();
            const shardResult = await this.shardManager.createShards(
                fileData.data,
                {
                    totalShards: n,
                    threshold: k,
                    algorithm: 'shamir'
                }
            );
            const shardTime = performance.now() - shardStart;
            
            if (shardResult.shards.length !== n) {
                throw new Error(`Expected ${n} shards, got ${shardResult.shards.length}`);
            }
            
            // Verify shard integrity
            const shardsValid = this.validateShards(shardResult.shards, fileData.checksum);
            
            // Time the reconstruction process (use all shards)
            const reconstructStart = performance.now();
            const reconstructed = await this.shardManager.reconstructFile(
                shardResult.shards.map((shard, index) => ({
                    index,
                    data: shard
                })),
                shardResult.metadata
            );
            const reconstructTime = performance.now() - reconstructStart;
            
            // Verify integrity
            const integrityCheck = Buffer.compare(fileData.data, reconstructed) === 0;
            
            // Test reconstruction with minimum shards
            const minReconstructStart = performance.now();
            const minShards = shardResult.shards.slice(0, k).map((shard, index) => ({
                index,
                data: shard
            }));
            const minReconstructed = await this.shardManager.reconstructFile(
                minShards,
                shardResult.metadata
            );
            const minReconstructTime = performance.now() - minReconstructStart;
            
            const minIntegrityCheck = Buffer.compare(fileData.data, minReconstructed) === 0;
            
            return {
                testId,
                success: true,
                shardingTime: shardTime,
                reconstructionTime: reconstructTime,
                minReconstructionTime: minReconstructTime,
                integrityCheck,
                minIntegrityCheck,
                shardsValid,
                shardSizes: shardResult.shards.map(s => s.length),
                totalShardSize: shardResult.shards.reduce((sum, s) => sum + s.length, 0),
                overhead: (shardResult.shards.reduce((sum, s) => sum + s.length, 0) / fileData.size) - 1
            };
            
        } catch (error) {
            return {
                testId,
                success: false,
                error: error.message,
                shardingTime: 0,
                reconstructionTime: 0,
                integrityCheck: false
            };
        }
    }

    /**
     * Validate shard integrity
     */
    validateShards(shards, originalChecksum) {
        try {
            // Basic validation - check if shards are non-empty and properly formatted
            return shards.every(shard => 
                shard && 
                shard.length > 0 && 
                Buffer.isBuffer(shard)
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Calculate averages from multiple test iterations
     */
    calculateAverages(testResults) {
        const validResults = testResults.filter(r => r.success);
        
        if (validResults.length === 0) {
            return {
                success: false,
                error: 'All iterations failed'
            };
        }
        
        const avg = {
            success: true,
            iterations: validResults.length,
            shardingTime: validResults.reduce((sum, r) => sum + r.shardingTime, 0) / validResults.length,
            reconstructionTime: validResults.reduce((sum, r) => sum + r.reconstructionTime, 0) / validResults.length,
            minReconstructionTime: validResults.reduce((sum, r) => sum + r.minReconstructionTime, 0) / validResults.length,
            integrityCheck: validResults.every(r => r.integrityCheck),
            minIntegrityCheck: validResults.every(r => r.minIntegrityCheck),
            averageOverhead: validResults.reduce((sum, r) => sum + r.overhead, 0) / validResults.length,
            totalShardSize: validResults[0].totalShardSize // Should be same for all iterations
        };
        
        return avg;
    }

    /**
     * Test failure scenarios
     */
    async testFailureScenarios(testFiles) {
        const baseConfig = { n: 7, k: 4 }; // Use vault configuration
        const testFileSize = 65536; // Use 64KB file
        const fileData = testFiles.get(testFileSize);
        
        if (!fileData) {
            console.log('  ⚠️ Test file not available for failure scenarios');
            return;
        }
        
        console.log(`  📋 Testing failure scenarios with ${baseConfig.n}/${baseConfig.k} configuration...`);
        
        // Create initial shards
        const shardResult = await this.shardManager.createShards(
            fileData.data,
            {
                totalShards: baseConfig.n,
                threshold: baseConfig.k,
                algorithm: 'shamir'
            }
        );
        
        for (const failureCount of this.testConfig.failureScenarios) {
            if (failureCount >= baseConfig.n) {
                continue; // Can't lose all shards
            }
            
            const remainingShards = baseConfig.n - failureCount;
            console.log(`    🔥 Testing with ${failureCount} failed shards (${remainingShards} remaining)...`);
            
            try {
                // Simulate shard loss by removing random shards
                const availableShards = [...shardResult.shards];
                for (let i = 0; i < failureCount; i++) {
                    const randomIndex = Math.floor(Math.random() * availableShards.length);
                    availableShards.splice(randomIndex, 1);
                }
                
                if (availableShards.length >= baseConfig.k) {
                    // Should be able to reconstruct
                    const reconstructStart = performance.now();
                    const reconstructed = await this.shardManager.reconstructFile(
                        availableShards.map((shard, index) => ({
                            index,
                            data: shard
                        })),
                        shardResult.metadata
                    );
                    const reconstructTime = performance.now() - reconstructStart;
                    
                    const integrityCheck = Buffer.compare(fileData.data, reconstructed) === 0;
                    
                    console.log(`      ✅ Reconstruction ${integrityCheck ? 'PASSED' : 'FAILED'} ` +
                               `(${reconstructTime.toFixed(2)}ms)`);
                    
                    this.results.push({
                        testType: 'failure_scenario',
                        fileSize: testFileSize,
                        shardConfig: baseConfig,
                        failureCount,
                        remainingShards,
                        reconstructionTime,
                        integrityCheck,
                        recoverable: true
                    });
                    
                } else {
                    // Should not be able to reconstruct
                    console.log(`      ❌ Cannot reconstruct (${remainingShards} < ${baseConfig.k})`);
                    
                    this.results.push({
                        testType: 'failure_scenario',
                        fileSize: testFileSize,
                        shardConfig: baseConfig,
                        failureCount,
                        remainingShards,
                        recoverable: false
                    });
                }
                
            } catch (error) {
                console.log(`      💥 Test failed: ${error.message}`);
            }
        }
    }

    /**
     * Run performance benchmarks
     */
    async runPerformanceBenchmarks(testFiles) {
        console.log('  📊 Running performance benchmarks...');
        
        const benchmarkResults = {
            shardingThroughput: {},
            reconstructionThroughput: {},
            shardingSizeEfficiency: {},
            configurationComparison: {}
        };
        
        // Test throughput for different file sizes
        for (const [size, fileData] of testFiles) {
            console.log(`    ⚡ Benchmarking ${this.formatBytes(size)} file...`);
            
            const config = { n: 5, k: 3 }; // Use standard configuration
            
            // Measure sharding throughput
            const shardStart = performance.now();
            const shardResult = await this.shardManager.createShards(
                fileData.data,
                {
                    totalShards: config.n,
                    threshold: config.k,
                    algorithm: 'shamir'
                }
            );
            const shardTime = performance.now() - shardStart;
            
            // Measure reconstruction throughput
            const reconstructStart = performance.now();
            await this.shardManager.reconstructFile(
                shardResult.shards.map((shard, index) => ({
                    index,
                    data: shard
                })),
                shardResult.metadata
            );
            const reconstructTime = performance.now() - reconstructStart;
            
            // Calculate throughput (MB/s)
            const sizeMB = size / (1024 * 1024);
            benchmarkResults.shardingThroughput[size] = sizeMB / (shardTime / 1000);
            benchmarkResults.reconstructionThroughput[size] = sizeMB / (reconstructTime / 1000);
            
            // Storage efficiency
            const totalShardSize = shardResult.shards.reduce((sum, s) => sum + s.length, 0);
            benchmarkResults.shardingSizeEfficiency[size] = totalShardSize / size;
            
            console.log(`      Shard: ${benchmarkResults.shardingThroughput[size].toFixed(2)} MB/s, ` +
                       `Reconstruct: ${benchmarkResults.reconstructionThroughput[size].toFixed(2)} MB/s, ` +
                       `Efficiency: ${(benchmarkResults.shardingSizeEfficiency[size] * 100).toFixed(1)}%`);
        }
        
        // Compare different configurations
        const testSize = 262144; // 256KB
        const testFile = testFiles.get(testSize);
        
        if (testFile) {
            console.log(`    🔧 Comparing configurations with ${this.formatBytes(testSize)} file...`);
            
            for (const config of this.testConfig.shardConfigs) {
                const configStart = performance.now();
                const shardResult = await this.shardManager.createShards(
                    testFile.data,
                    {
                        totalShards: config.n,
                        threshold: config.k,
                        algorithm: 'shamir'
                    }
                );
                const configTime = performance.now() - configStart;
                
                const sizeMB = testSize / (1024 * 1024);
                const throughput = sizeMB / (configTime / 1000);
                const overhead = (shardResult.shards.reduce((sum, s) => sum + s.length, 0) / testSize) - 1;
                
                benchmarkResults.configurationComparison[`${config.n}_${config.k}`] = {
                    throughput,
                    overhead,
                    redundancy: (config.n - config.k) / config.n
                };
                
                console.log(`      ${config.n}/${config.k}: ${throughput.toFixed(2)} MB/s, ` +
                           `Overhead: ${(overhead * 100).toFixed(1)}%`);
            }
        }
        
        this.results.push({
            testType: 'performance_benchmark',
            benchmarks: benchmarkResults
        });
    }

    /**
     * Generate comprehensive test report
     */
    async generateTestReport() {
        const report = {
            testCompleted: new Date().toISOString(),
            testConfig: this.testConfig,
            summary: this.generateSummary(),
            detailedResults: this.results,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(this.testConfig.outputDir, 'shard-stress-test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Generate human-readable report
        const readableReport = this.generateReadableReport(report);
        const readablePath = path.join(this.testConfig.outputDir, 'shard-stress-test-summary.txt');
        await fs.writeFile(readablePath, readableReport);
        
        console.log(`📄 Test report saved to: ${reportPath}`);
        console.log(`📄 Summary report saved to: ${readablePath}`);
        
        // Print summary to console
        console.log('\n📈 Test Summary:');
        console.log(this.generateConsoleSummary(report));
        
        return report;
    }

    /**
     * Generate test summary statistics
     */
    generateSummary() {
        const configTests = this.results.filter(r => r.shardConfig);
        const failureTests = this.results.filter(r => r.testType === 'failure_scenario');
        const benchmarkTests = this.results.filter(r => r.testType === 'performance_benchmark');
        
        return {
            totalTests: this.results.length,
            configurationTests: configTests.length,
            failureScenarioTests: failureTests.length,
            performanceBenchmarks: benchmarkTests.length,
            successRate: configTests.filter(r => r.success).length / configTests.length,
            averageShardingTime: configTests.reduce((sum, r) => sum + (r.shardingTime || 0), 0) / configTests.length,
            averageReconstructionTime: configTests.reduce((sum, r) => sum + (r.reconstructionTime || 0), 0) / configTests.length,
            integrityCheckPassRate: configTests.filter(r => r.integrityCheck).length / configTests.length
        };
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        const configTests = this.results.filter(r => r.shardConfig);
        
        // Find optimal configuration for different use cases
        const fastestConfig = configTests.reduce((fastest, current) => 
            (current.shardingTime || Infinity) < (fastest.shardingTime || Infinity) ? current : fastest
        );
        
        const mostEfficientConfig = configTests.reduce((efficient, current) => 
            (current.averageOverhead || Infinity) < (efficient.averageOverhead || Infinity) ? current : efficient
        );
        
        recommendations.push({
            category: 'performance',
            recommendation: `For fastest sharding, use ${fastestConfig.shardConfig?.n}/${fastestConfig.shardConfig?.k} configuration`,
            details: `Average sharding time: ${fastestConfig.shardingTime?.toFixed(2)}ms`
        });
        
        recommendations.push({
            category: 'efficiency',
            recommendation: `For best storage efficiency, use ${mostEfficientConfig.shardConfig?.n}/${mostEfficientConfig.shardConfig?.k} configuration`,
            details: `Storage overhead: ${(mostEfficientConfig.averageOverhead * 100)?.toFixed(1)}%`
        });
        
        // Failure resilience recommendations
        const failureTests = this.results.filter(r => r.testType === 'failure_scenario');
        const maxRecoverableFailures = Math.max(...failureTests.filter(r => r.recoverable).map(r => r.failureCount));
        
        recommendations.push({
            category: 'resilience',
            recommendation: `System can recover from up to ${maxRecoverableFailures} simultaneous shard failures`,
            details: 'Consider this when designing redundancy policies'
        });
        
        return recommendations;
    }

    /**
     * Generate human-readable report
     */
    generateReadableReport(report) {
        let readable = `
Relay KeySpace Shard Stress Test Report
======================================

Test Completed: ${report.testCompleted}

SUMMARY
-------
Total Tests: ${report.summary.totalTests}
Configuration Tests: ${report.summary.configurationTests}
Failure Scenario Tests: ${report.summary.failureScenarioTests}
Performance Benchmarks: ${report.summary.performanceBenchmarks}

Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%
Integrity Check Pass Rate: ${(report.summary.integrityCheckPassRate * 100).toFixed(1)}%
Average Sharding Time: ${report.summary.averageShardingTime.toFixed(2)}ms
Average Reconstruction Time: ${report.summary.averageReconstructionTime.toFixed(2)}ms

RECOMMENDATIONS
--------------
`;

        report.recommendations.forEach((rec, index) => {
            readable += `${index + 1}. ${rec.recommendation}\n   ${rec.details}\n\n`;
        });

        readable += `
DETAILED RESULTS
---------------
See shard-stress-test-report.json for complete test data.
        `;

        return readable;
    }

    /**
     * Generate console summary
     */
    generateConsoleSummary(report) {
        return `  🧪 Total Tests: ${report.summary.totalTests}
  ✅ Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%
  🔍 Integrity Pass Rate: ${(report.summary.integrityCheckPassRate * 100).toFixed(1)}%
  ⚡ Avg Sharding: ${report.summary.averageShardingTime.toFixed(2)}ms
  🔄 Avg Reconstruction: ${report.summary.averageReconstructionTime.toFixed(2)}ms`;
    }

    /**
     * Format bytes for display
     */
    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
}

// Run stress test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const stressTest = new ShardStressTest();
    
    stressTest.runStressTests()
        .then(() => {
            console.log('\n🏁 Stress test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Stress test failed:', error);
            process.exit(1);
        });
}

export default ShardStressTest;
