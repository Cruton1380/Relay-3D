#!/usr/bin/env node

/**
 * Relay System Health Check
 * Comprehensive testing of system startup, connectivity, and cache busting
 * Consolidates: verify-startup.mjs, test-cache-busting.mjs, and connectivity tests
 */

class SystemHealthChecker {
    constructor() {
        this.results = {
            connectivity: {},
            cacheBusting: {},
            performance: {},
            overall: { passed: 0, failed: 0 }
        };
    }

    async runAllChecks() {
        console.log('🏥 Relay System Health Check');
        console.log('============================\n');

        await this.checkConnectivity();
        await this.checkCacheBusting();
        await this.checkPerformance();
        
        this.generateReport();
    }

    async checkConnectivity() {
        console.log('🔗 CONNECTIVITY TESTS');
        console.log('---------------------');

        const endpoints = [
            { name: 'Frontend', url: 'http://localhost:5175', description: 'Vite dev server' },
            { name: 'Backend Health', url: 'http://localhost:3002/health', description: 'Health endpoint' },
            { name: 'Backend API', url: 'http://localhost:3002/api/channels', description: 'Channels API' },
            { name: 'WebSocket Service', url: 'http://localhost:4001/health', description: 'WebSocket health' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Testing ${endpoint.name} (${endpoint.url})...`);
                const response = await fetch(endpoint.url, { timeout: 5000 });
                
                if (response.ok) {
                    console.log(`✅ ${endpoint.name}: HEALTHY`);
                    if (endpoint.name === 'Backend Health') {
                        try {
                            const data = await response.json();
                            console.log(`   Status: ${data.status || 'OK'}`);
                        } catch (e) {
                            console.log(`   Status: Response received`);
                        }
                    }
                    this.results.connectivity[endpoint.name] = { status: 'healthy', url: endpoint.url };
                    this.results.overall.passed++;
                } else {
                    console.log(`❌ ${endpoint.name}: UNHEALTHY (${response.status})`);
                    this.results.connectivity[endpoint.name] = { status: 'unhealthy', code: response.status };
                    this.results.overall.failed++;
                }
            } catch (error) {
                console.log(`❌ ${endpoint.name}: UNREACHABLE`);
                console.log(`   Error: ${error.message}`);
                this.results.connectivity[endpoint.name] = { status: 'unreachable', error: error.message };
                this.results.overall.failed++;
            }
        }
        console.log('');
    }

    async checkCacheBusting() {
        console.log('🗂️  CACHE BUSTING TESTS');
        console.log('----------------------');

        try {
            console.log('Testing cache busting implementation...');
            const response = await fetch('http://localhost:5175', { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            // Check cache headers
            const cacheControl = response.headers.get('cache-control');
            const pragma = response.headers.get('pragma');
            const expires = response.headers.get('expires');

            console.log(`Cache-Control: ${cacheControl || 'not set'}`);
            console.log(`Pragma: ${pragma || 'not set'}`);
            console.log(`Expires: ${expires || 'not set'}`);

            if (cacheControl?.includes('no-cache') || pragma === 'no-cache') {
                console.log('✅ Cache headers: PROPERLY CONFIGURED');
                this.results.cacheBusting.headers = 'configured';
                this.results.overall.passed++;
            } else {
                console.log('⚠️  Cache headers: MAY NEED ADJUSTMENT');
                this.results.cacheBusting.headers = 'needs-adjustment';
            }

            // Check for timestamp cache busting
            const html = await response.text();
            const timestampRegex = /[?&]t=\d+/g;
            const timestampMatches = html.match(timestampRegex);

            if (timestampMatches && timestampMatches.length > 0) {
                console.log(`✅ Timestamp cache busting: ACTIVE (${timestampMatches.length} parameters)`);
                this.results.cacheBusting.timestamps = timestampMatches.length;
                this.results.overall.passed++;
            } else {
                console.log('⚠️  Timestamp cache busting: NOT DETECTED');
                this.results.cacheBusting.timestamps = 0;
            }

            // Test multiple requests for different timestamps
            console.log('Testing timestamp variation...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response2 = await fetch('http://localhost:5175', { timeout: 5000 });
            const html2 = await response2.text();
            const timestampMatches2 = html2.match(timestampRegex);

            if (timestampMatches && timestampMatches2 && 
                JSON.stringify(timestampMatches) !== JSON.stringify(timestampMatches2)) {
                console.log('✅ Timestamp variation: WORKING');
                this.results.cacheBusting.variation = true;
                this.results.overall.passed++;
            } else {
                console.log('⚠️  Timestamp variation: STATIC');
                this.results.cacheBusting.variation = false;
            }

        } catch (error) {
            console.log('❌ Cache busting test failed:', error.message);
            this.results.cacheBusting.error = error.message;
            this.results.overall.failed++;
        }
        console.log('');
    }

    async checkPerformance() {
        console.log('⚡ PERFORMANCE TESTS');
        console.log('-------------------');

        try {
            console.log('Testing response times...');
            
            const endpoints = ['http://localhost:5175', 'http://localhost:3002/health'];
            
            for (const url of endpoints) {
                const startTime = Date.now();
                try {
                    const response = await fetch(url, { timeout: 10000 });
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    if (response.ok) {
                        if (responseTime < 1000) {
                            console.log(`✅ ${url}: ${responseTime}ms (FAST)`);
                        } else if (responseTime < 3000) {
                            console.log(`⚠️  ${url}: ${responseTime}ms (SLOW)`);
                        } else {
                            console.log(`❌ ${url}: ${responseTime}ms (TOO SLOW)`);
                        }
                        this.results.performance[url] = { responseTime, status: 'ok' };
                    }
                } catch (error) {
                    console.log(`❌ ${url}: TIMEOUT/ERROR`);
                    this.results.performance[url] = { error: error.message };
                }
            }

            // Memory usage check
            const memUsage = process.memoryUsage();
            console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
            this.results.performance.memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        } catch (error) {
            console.log('❌ Performance test failed:', error.message);
            this.results.performance.error = error.message;
        }
        console.log('');
    }

    generateReport() {
        console.log('📊 HEALTH CHECK SUMMARY');
        console.log('=======================');
        
        const total = this.results.overall.passed + this.results.overall.failed;
        const successRate = total > 0 ? Math.round((this.results.overall.passed / total) * 100) : 0;
        
        console.log(`Tests passed: ${this.results.overall.passed}/${total} (${successRate}%)`);
        
        if (successRate >= 90) {
            console.log('🎉 System Status: EXCELLENT');
        } else if (successRate >= 75) {
            console.log('✅ System Status: GOOD');
        } else if (successRate >= 50) {
            console.log('⚠️  System Status: NEEDS ATTENTION');
        } else {
            console.log('❌ System Status: CRITICAL ISSUES');
        }

        console.log('\n📋 RECOMMENDATIONS:');
        
        if (this.results.overall.failed === 0) {
            console.log('✅ All systems operational! Ready for development.');
            console.log('📱 Open http://localhost:5175 in your browser to use Relay Network');
        } else {
            if (Object.values(this.results.connectivity).some(r => r.status !== 'healthy')) {
                console.log('🔧 Some services are not running. Try: npm start');
            }
            if (this.results.cacheBusting.error) {
                console.log('🧹 Cache busting issues detected. Try: npm run clean:chrome');
            }
            if (Object.values(this.results.performance).some(r => r.error)) {
                console.log('⚡ Performance issues detected. Try: npm run performance:monitor');
            }
        }

        console.log('\n💡 For detailed diagnostics, run:');
        console.log('   npm run test:browser    - Browser connectivity tests');
        console.log('   npm run clean:chrome    - Clear Chrome cache');
        console.log('   npm run performance:monitor - Monitor system performance');
    }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const checker = new SystemHealthChecker();
    checker.runAllChecks().catch(console.error);
}

export default SystemHealthChecker;