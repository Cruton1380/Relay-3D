/**
 * Storage Metrics API
 * 
 * Provides real-time metrics data for the KeySpace storage network
 * including provider statistics, pricing governance, and financial data.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.METRICS_API_PORT || 4005;

app.use(cors());
app.use(express.json());

// Simple logger
const logger = {
    info: (...args) => console.log('ℹ️ [Metrics API]', ...args),
    error: (...args) => console.error('❌ [Metrics API]', ...args)
};

// Mock data generator (in real implementation, would fetch from various services)
class StorageMetricsService {
    constructor() {
        this.lastUpdate = Date.now();
        this.generateMetrics();
        
        // Update metrics every 30 seconds
        setInterval(() => this.generateMetrics(), 30000);
    }

    generateMetrics() {
        const now = Date.now();
        
        // Simulate some realistic fluctuations
        const baseUtilization = 0.55 + (Math.sin(now / 1000000) * 0.1);
        const providerFluctuation = Math.floor(Math.random() * 10) - 5;
        
        this.metrics = {
            overview: {
                totalProviders: 147 + providerFluctuation,
                p2pProviders: 144 + providerFluctuation,
                relayProviders: 3,
                totalCapacity: 15420 + Math.floor(Math.random() * 1000),
                usedCapacity: Math.floor((15420 + Math.random() * 1000) * baseUtilization),
                utilizationRate: baseUtilization,
                averagePrice: 2.34 + (Math.random() * 0.2 - 0.1),
                activeFiles: 23847 + Math.floor(Math.random() * 500),
                totalUsers: 1204 + Math.floor(Math.random() * 20)
            },
            network: {
                regions: {
                    'North America': { 
                        providers: 52 + Math.floor(Math.random() * 5), 
                        capacity: 6200 + Math.floor(Math.random() * 300), 
                        utilization: 0.61 + (Math.random() * 0.1 - 0.05) 
                    },
                    'Europe': { 
                        providers: 47 + Math.floor(Math.random() * 5), 
                        capacity: 5100 + Math.floor(Math.random() * 300), 
                        utilization: 0.54 + (Math.random() * 0.1 - 0.05) 
                    },
                    'Asia Pacific': { 
                        providers: 42 + Math.floor(Math.random() * 5), 
                        capacity: 3800 + Math.floor(Math.random() * 300), 
                        utilization: 0.52 + (Math.random() * 0.1 - 0.05) 
                    },
                    'Other': { 
                        providers: 6 + Math.floor(Math.random() * 3), 
                        capacity: 320 + Math.floor(Math.random() * 50), 
                        utilization: 0.48 + (Math.random() * 0.1 - 0.05) 
                    }
                },
                uptime: {
                    p2p: 0.947 + (Math.random() * 0.01 - 0.005),
                    relay: 0.9994 + (Math.random() * 0.0003 - 0.00015)
                },
                latency: {
                    p2p: 156 + Math.floor(Math.random() * 40 - 20),
                    relay: 45 + Math.floor(Math.random() * 10 - 5)
                },
                failureRate: {
                    p2p: 0.034 + (Math.random() * 0.01 - 0.005),
                    relay: 0.001 + (Math.random() * 0.0005 - 0.00025)
                }
            },
            pricing: {
                current: {
                    p2p: { basic: 1.50, secure: 2.00, vault: 2.50 },
                    relay: { basic: 2.25, secure: 3.00, vault: 3.75 }
                },
                history: [
                    { date: '2025-06-01', p2p_basic: 1.65, relay_basic: 2.40 },
                    { date: '2025-06-08', p2p_basic: 1.58, relay_basic: 2.32 },
                    { date: '2025-06-15', p2p_basic: 1.50, relay_basic: 2.25 },
                    { date: '2025-06-20', p2p_basic: 1.50, relay_basic: 2.25 }
                ],
                proposals: {
                    active: 3 + Math.floor(Math.random() * 3),
                    totalVotes: 1547 + Math.floor(Math.random() * 100),
                    topProposal: {
                        id: 'prop-001',
                        proposer: 'User_4291',
                        description: 'Reduce basic tier pricing by 15% to increase adoption',
                        votes: { 
                            up: 89 + Math.floor(Math.random() * 20), 
                            down: 12 + Math.floor(Math.random() * 5) 
                        },
                        rank: 1,
                        ageHours: 36 + Math.floor((now - this.lastUpdate) / 1000 / 60 / 60)
                    }
                }
            },
            governance: {
                totalVoters: 1204 + Math.floor(Math.random() * 20),
                proposalsThisMonth: 12 + Math.floor(Math.random() * 3),
                avgParticipation: 0.341 + (Math.random() * 0.1 - 0.05),
                recentProposals: [
                    { id: 'prop-003', type: 'pricing', status: 'active', votes: 101 + Math.floor(Math.random() * 50) },
                    { id: 'prop-002', type: 'pricing', status: 'passed', votes: 234 },
                    { id: 'prop-001', type: 'pricing', status: 'failed', votes: 89 }
                ]
            },
            costs: {
                dailyRevenue: 1847.32 + (Math.random() * 200 - 100),
                monthlyProjected: 55419.60 + (Math.random() * 3000 - 1500),
                operatingCosts: {
                    relay_infrastructure: 12400.00,
                    network_maintenance: 3200.00 + (Math.random() * 400 - 200),
                    governance_operations: 800.00 + (Math.random() * 100 - 50)
                },
                userCredits: {
                    totalIssued: 125000.00 + (Math.random() * 5000),
                    totalSpent: 47800.00 + (Math.random() * 2000),
                    averageBalance: 64.20 + (Math.random() * 10 - 5)
                }
            },
            timestamp: now
        };

        this.lastUpdate = now;
        logger.info('Metrics updated');
    }

    getMetrics(timeframe = '24h') {
        // In a real implementation, timeframe would filter historical data
        return {
            ...this.metrics,
            timeframe,
            nextUpdate: this.lastUpdate + 30000
        };
    }

    getOverview() {
        return this.metrics.overview;
    }

    getNetworkMetrics() {
        return this.metrics.network;
    }

    getPricingMetrics() {
        return this.metrics.pricing;
    }

    getGovernanceMetrics() {
        return this.metrics.governance;
    }

    getCostMetrics() {
        return this.metrics.costs;
    }
}

const metricsService = new StorageMetricsService();

// API Routes
app.get('/api/metrics', (req, res) => {
    try {
        const timeframe = req.query.timeframe || '24h';
        const metrics = metricsService.getMetrics(timeframe);
        res.json(metrics);
    } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

app.get('/api/metrics/overview', (req, res) => {
    try {
        const overview = metricsService.getOverview();
        res.json(overview);
    } catch (error) {
        logger.error('Failed to get overview:', error);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});

app.get('/api/metrics/network', (req, res) => {
    try {
        const network = metricsService.getNetworkMetrics();
        res.json(network);
    } catch (error) {
        logger.error('Failed to get network metrics:', error);
        res.status(500).json({ error: 'Failed to fetch network metrics' });
    }
});

app.get('/api/metrics/pricing', (req, res) => {
    try {
        const pricing = metricsService.getPricingMetrics();
        res.json(pricing);
    } catch (error) {
        logger.error('Failed to get pricing metrics:', error);
        res.status(500).json({ error: 'Failed to fetch pricing metrics' });
    }
});

app.get('/api/metrics/governance', (req, res) => {
    try {
        const governance = metricsService.getGovernanceMetrics();
        res.json(governance);
    } catch (error) {
        logger.error('Failed to get governance metrics:', error);
        res.status(500).json({ error: 'Failed to fetch governance metrics' });
    }
});

app.get('/api/metrics/costs', (req, res) => {
    try {
        const costs = metricsService.getCostMetrics();
        res.json(costs);
    } catch (error) {
        logger.error('Failed to get cost metrics:', error);
        res.status(500).json({ error: 'Failed to fetch cost metrics' });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        service: 'storage-metrics-api'
    });
});

// Start server
app.listen(port, () => {
    logger.info(`Storage Metrics API running on port ${port}`);
    logger.info('Available endpoints:');
    logger.info('  GET /api/metrics - Complete metrics data');
    logger.info('  GET /api/metrics/overview - Network overview');
    logger.info('  GET /api/metrics/network - Network performance');
    logger.info('  GET /api/metrics/pricing - Pricing and governance');
    logger.info('  GET /api/metrics/governance - Governance statistics');
    logger.info('  GET /api/metrics/costs - Financial metrics');
    logger.info('  GET /health - Health check');
});

export default app;
