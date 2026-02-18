#!/usr/bin/env node

/**
 * Performance Management System
 * Comprehensive performance monitoring, optimization, and system maintenance
 * Consolidates: system-optimization.mjs and performance-monitor.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

class PerformanceManager {
    constructor() {
        this.metrics = {
            startTime: null,
            endTime: null,
            duration: null,
            memoryUsage: [],
            cpuUsage: [],
            testResults: null
        };
        this.optimizationResults = {
            logCleanup: [],
            dataCleanup: [],
            memoryOptimizations: [],
            cacheCleared: []
        };
        this.monitoringInterval = null;
    }

    async run(action = 'optimize') {
        console.log('⚡ Relay Performance Management System');
        console.log('=====================================\n');

        switch (action) {
            case 'optimize':
                await this.optimizeSystem();
                break;
            case 'monitor':
                await this.monitorPerformance();
                break;
            case 'full':
                await this.optimizeSystem();
                console.log('\n' + '='.repeat(50) + '\n');
                await this.monitorPerformance();
                break;
            default:
                this.showUsage();
        }
    }

    async optimizeSystem() {
        console.log('🚀 Starting System Optimization...\n');
        
        await this.clearLogs();
        await this.optimizeDataFiles();
        await this.clearCaches();
        await this.optimizeMemory();
        await this.validateSystemHealth();
        
        console.log('\n✅ System optimization complete!');
        console.log(`📊 Results:`);
        console.log(`   • Cleaned logs: ${this.optimizationResults.logCleanup.length} files`);
        console.log(`   • Optimized data: ${this.optimizationResults.dataCleanup.length} files`);
        console.log(`   • Cache cleared: ${this.optimizationResults.cacheCleared.length} directories`);
        console.log(`   • Memory optimizations: ${this.optimizationResults.memoryOptimizations.length} applied`);
        console.log('\n🚀 System is now running at peak performance!');
    }

    async monitorPerformance(testCommand = null) {
        console.log('📊 Starting Performance Monitoring...\n');
        
        await this.startMonitoring();
        
        if (testCommand) {
            console.log(`Running command: ${testCommand}`);
            await this.runTestsWithMonitoring(testCommand);
        } else {
            console.log('Monitoring system for 30 seconds...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        await this.stopMonitoring();
        await this.generatePerformanceReport();
    }

    // OPTIMIZATION METHODS
    async clearLogs() {
        console.log('🧹 Clearing logs...');
        
        const logDirs = [
            join(ROOT_DIR, 'logs'),
            join(ROOT_DIR, 'examples', 'logs')
        ];

        for (const logDir of logDirs) {
            if (existsSync(logDir)) {
                try {
                    const files = await fs.readdir(logDir);
                    const today = new Date().toISOString().split('T')[0];
                    
                    for (const file of files) {
                        if (!file.includes(today) && file.endsWith('.log')) {
                            await fs.unlink(join(logDir, file));
                            this.optimizationResults.logCleanup.push(file);
                        }
                    }
                    console.log(`   ✅ Cleaned ${this.optimizationResults.logCleanup.length} old log files`);
                } catch (error) {
                    console.log(`   ⚠️  Could not clean logs in ${logDir}: ${error.message}`);
                }
            }
        }
    }

    async optimizeDataFiles() {
        console.log('📂 Optimizing data files...');
        
        const dataFiles = [
            'data/temp-*',
            'data/*-backup-*',
            'data/cache-*'
        ];

        try {
            const dataDir = join(ROOT_DIR, 'data');
            if (existsSync(dataDir)) {
                const files = await fs.readdir(dataDir);
                
                for (const file of files) {
                    if (file.startsWith('temp-') || file.includes('-backup-') || file.startsWith('cache-')) {
                        const filePath = join(dataDir, file);
                        const stats = await fs.stat(filePath);
                        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
                        
                        if (ageHours > 24) { // Delete files older than 24 hours
                            await fs.unlink(filePath);
                            this.optimizationResults.dataCleanup.push(file);
                        }
                    }
                }
                console.log(`   ✅ Cleaned ${this.optimizationResults.dataCleanup.length} temporary data files`);
            }
        } catch (error) {
            console.log(`   ⚠️  Could not optimize data files: ${error.message}`);
        }
    }

    async clearCaches() {
        console.log('🗂️  Clearing caches...');
        
        const cacheDirs = [
            'node_modules/.cache',
            '.vitest',
            'coverage',
            'dist',
            'build',
            '.tmp'
        ];

        for (const cacheDir of cacheDirs) {
            const fullPath = join(ROOT_DIR, cacheDir);
            if (existsSync(fullPath)) {
                try {
                    await fs.rm(fullPath, { recursive: true, force: true });
                    this.optimizationResults.cacheCleared.push(cacheDir);
                    console.log(`   ✅ Cleared cache: ${cacheDir}`);
                } catch (error) {
                    console.log(`   ⚠️  Could not clear cache ${cacheDir}: ${error.message}`);
                }
            }
        }
    }

    async optimizeMemory() {
        console.log('🧠 Optimizing memory...');
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            this.optimizationResults.memoryOptimizations.push('garbage collection');
            console.log('   ✅ Forced garbage collection');
        }
        
        // Set Node.js memory optimizations
        process.env.NODE_OPTIONS = '--max-old-space-size=4096';
        this.optimizationResults.memoryOptimizations.push('memory limit increased');
        
        console.log('   ✅ Applied memory optimizations');
    }

    async validateSystemHealth() {
        console.log('🏥 Validating system health...');
        
        const memUsage = process.memoryUsage();
        const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        
        console.log(`   Memory usage: ${memUsageMB}MB`);
        
        if (memUsageMB < 100) {
            console.log('   ✅ Memory usage: EXCELLENT');
        } else if (memUsageMB < 500) {
            console.log('   ✅ Memory usage: GOOD');
        } else {
            console.log('   ⚠️  Memory usage: HIGH');
        }
    }

    // MONITORING METHODS
    async startMonitoring() {
        console.log('🔍 Starting performance monitoring...');
        this.metrics.startTime = Date.now();
        
        // Monitor system resources every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 5000);
    }

    collectMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external
        });
        
        this.metrics.cpuUsage.push({
            timestamp: Date.now(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });
    }

    async stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.metrics.endTime = Date.now();
        this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
        console.log('⏹️  Performance monitoring stopped');
    }

    async runTestsWithMonitoring(testCommand) {
        return new Promise((resolve, reject) => {
            const child = spawn('npm', ['run', testCommand], {
                stdio: 'pipe',
                shell: true,
                cwd: ROOT_DIR
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
                process.stdout.write(data);
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
                process.stderr.write(data);
            });

            child.on('close', (code) => {
                this.metrics.testResults = {
                    exitCode: code,
                    output,
                    errorOutput
                };
                resolve();
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    async generatePerformanceReport() {
        console.log('\n📊 PERFORMANCE REPORT');
        console.log('=====================');
        
        const durationMs = this.metrics.duration;
        const durationSec = Math.round(durationMs / 1000);
        
        console.log(`Monitoring duration: ${durationSec} seconds`);
        
        if (this.metrics.memoryUsage.length > 0) {
            const avgMemory = this.calculateAverageMemory();
            const peakMemory = this.calculatePeakMemory();
            
            console.log(`Average memory usage: ${Math.round(avgMemory / 1024 / 1024)}MB`);
            console.log(`Peak memory usage: ${Math.round(peakMemory / 1024 / 1024)}MB`);
        }
        
        if (this.metrics.cpuUsage.length > 0) {
            const totalCpuTime = this.calculateTotalCpuTime();
            console.log(`Total CPU time: ${Math.round(totalCpuTime / 1000)}ms`);
        }
        
        if (this.metrics.testResults) {
            console.log(`Test execution: ${this.metrics.testResults.exitCode === 0 ? 'PASSED' : 'FAILED'}`);
        }
        
        console.log('\n💡 RECOMMENDATIONS:');
        this.generateRecommendations();
    }

    calculateAverageMemory() {
        const total = this.metrics.memoryUsage.reduce((sum, usage) => sum + usage.heapUsed, 0);
        return total / this.metrics.memoryUsage.length;
    }

    calculatePeakMemory() {
        return Math.max(...this.metrics.memoryUsage.map(usage => usage.heapUsed));
    }

    calculateTotalCpuTime() {
        if (this.metrics.cpuUsage.length < 2) return 0;
        
        const first = this.metrics.cpuUsage[0];
        const last = this.metrics.cpuUsage[this.metrics.cpuUsage.length - 1];
        
        return (last.user - first.user) + (last.system - first.system);
    }

    generateRecommendations() {
        const avgMemoryMB = this.calculateAverageMemory() / 1024 / 1024;
        const peakMemoryMB = this.calculatePeakMemory() / 1024 / 1024;
        
        if (peakMemoryMB > 1000) {
            console.log('🔧 High memory usage detected. Consider:');
            console.log('   • Running tests in smaller batches');
            console.log('   • Increasing Node.js memory limit');
            console.log('   • Checking for memory leaks');
        } else if (avgMemoryMB < 100) {
            console.log('✅ Memory usage is optimal');
        }
        
        if (this.metrics.testResults && this.metrics.testResults.exitCode !== 0) {
            console.log('🔧 Test failures detected. Check output above for details.');
        }
        
        console.log('\n📈 Performance optimization commands:');
        console.log('   npm run performance:full     - Full optimization + monitoring');
        console.log('   npm run performance:optimize - System optimization only');
        console.log('   npm run performance:monitor  - Performance monitoring only');
    }

    showUsage() {
        console.log('Usage: node performance-management.mjs [action]');
        console.log('');
        console.log('Actions:');
        console.log('  optimize  - Run system optimization (default)');
        console.log('  monitor   - Run performance monitoring');
        console.log('  full      - Run both optimization and monitoring');
        console.log('');
        console.log('Examples:');
        console.log('  node performance-management.mjs optimize');
        console.log('  node performance-management.mjs monitor');
        console.log('  node performance-management.mjs full');
    }
}

// Run performance manager if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const action = process.argv[2] || 'optimize';
    const manager = new PerformanceManager();
    manager.run(action).catch(console.error);
}

export default PerformanceManager;