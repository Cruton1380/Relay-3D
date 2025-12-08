/**
 * Storage Metrics Dashboard
 * 
 * Comprehensive view of storage network health, provider statistics,
 * pricing trends, and community participation metrics for the
 * decentralized KeySpace storage system.
 */

import React, { useState, useEffect } from 'react';
import './StorageMetricsDashboard.css';

const StorageMetricsDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
    const [selectedMetricType, setSelectedMetricType] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Mock data - in real implementation, would fetch from APIs
    const mockMetrics = {
        overview: {
            totalProviders: 147,
            p2pProviders: 144,
            relayProviders: 3,
            totalCapacity: 15420, // GB
            usedCapacity: 8734, // GB
            utilizationRate: 0.567,
            averagePrice: 2.34, // USD per GB/month
            activeFiles: 23847,
            totalUsers: 1204
        },
        network: {
            regions: {
                'North America': { providers: 52, capacity: 6200, utilization: 0.61 },
                'Europe': { providers: 47, capacity: 5100, utilization: 0.54 },
                'Asia Pacific': { providers: 42, capacity: 3800, utilization: 0.52 },
                'Other': { providers: 6, capacity: 320, utilization: 0.48 }
            },
            uptime: {
                p2p: 0.947,
                relay: 0.9994
            },
            latency: {
                p2p: 156, // ms average
                relay: 45 // ms average
            },
            failureRate: {
                p2p: 0.034,
                relay: 0.001
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
                active: 3,
                totalVotes: 1547,
                topProposal: {
                    id: 'prop-001',
                    proposer: 'User_4291',
                    description: 'Reduce basic tier pricing by 15% to increase adoption',
                    votes: { up: 89, down: 12 },
                    rank: 1,
                    ageHours: 36
                }
            }
        },
        governance: {
            totalVoters: 1204,
            proposalsThisMonth: 12,
            avgParticipation: 0.341,
            recentProposals: [
                { id: 'prop-003', type: 'pricing', status: 'active', votes: 101 },
                { id: 'prop-002', type: 'pricing', status: 'passed', votes: 234 },
                { id: 'prop-001', type: 'pricing', status: 'failed', votes: 89 }
            ]
        },
        costs: {
            dailyRevenue: 1847.32,
            monthlyProjected: 55419.60,
            operatingCosts: {
                relay_infrastructure: 12400.00,
                network_maintenance: 3200.00,
                governance_operations: 800.00
            },
            userCredits: {
                totalIssued: 125000.00,
                totalSpent: 47800.00,
                averageBalance: 64.20
            }
        }
    };    useEffect(() => {
        // Function to fetch real metrics from API
        const loadMetrics = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:4005/api/metrics?timeframe=${selectedTimeframe}`);
                if (response.ok) {
                    const data = await response.json();
                    setMetrics(data);
                } else {
                    console.warn('Failed to fetch metrics, using mock data');
                    setMetrics(mockMetrics);
                }
            } catch (error) {
                console.warn('API not available, using mock data:', error.message);
                setMetrics(mockMetrics);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
        
        // Set up real-time updates every 30 seconds
        const interval = setInterval(loadMetrics, 30000);
        return () => clearInterval(interval);
    }, [selectedTimeframe]);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatPercentage = (ratio) => (ratio * 100).toFixed(1) + '%';

    const formatCurrency = (amount) => '$' + amount.toFixed(2);

    const renderOverviewMetrics = () => {
        if (!metrics) return null;
        const { overview } = metrics;

        return (
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Network Size</h3>
                        <span className="metric-icon">🌐</span>
                    </div>
                    <div className="metric-value">{overview.totalProviders}</div>
                    <div className="metric-subtitle">Total Providers</div>
                    <div className="metric-breakdown">
                        <span>P2P: {overview.p2pProviders}</span>
                        <span>Relay: {overview.relayProviders}</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Storage Capacity</h3>
                        <span className="metric-icon">💾</span>
                    </div>
                    <div className="metric-value">{formatNumber(overview.totalCapacity)} GB</div>
                    <div className="metric-subtitle">Total Available</div>
                    <div className="metric-breakdown">
                        <span>Used: {formatNumber(overview.usedCapacity)} GB</span>
                        <span>Utilization: {formatPercentage(overview.utilizationRate)}</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Average Price</h3>
                        <span className="metric-icon">💰</span>
                    </div>
                    <div className="metric-value">{formatCurrency(overview.averagePrice)}</div>
                    <div className="metric-subtitle">per GB/month</div>
                    <div className="metric-breakdown">
                        <span>Active Files: {formatNumber(overview.activeFiles)}</span>
                        <span>Users: {formatNumber(overview.totalUsers)}</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Network Health</h3>
                        <span className="metric-icon">❤️</span>
                    </div>
                    <div className="metric-value">{formatPercentage(metrics.network.uptime.p2p)}</div>
                    <div className="metric-subtitle">P2P Uptime</div>
                    <div className="metric-breakdown">
                        <span>Relay: {formatPercentage(metrics.network.uptime.relay)}</span>
                        <span>Avg Latency: {metrics.network.latency.p2p}ms</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderNetworkMetrics = () => {
        if (!metrics) return null;
        const { network } = metrics;

        return (
            <div className="metrics-sections">
                <div className="metrics-section">
                    <h3>Regional Distribution</h3>
                    <div className="region-grid">
                        {Object.entries(network.regions).map(([region, data]) => (
                            <div key={region} className="region-card">
                                <h4>{region}</h4>
                                <div className="region-stats">
                                    <div>Providers: {data.providers}</div>
                                    <div>Capacity: {formatNumber(data.capacity)} GB</div>
                                    <div>Utilization: {formatPercentage(data.utilization)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="metrics-section">
                    <h3>Performance Metrics</h3>
                    <div className="performance-grid">
                        <div className="performance-card">
                            <h4>Uptime</h4>
                            <div>P2P: {formatPercentage(network.uptime.p2p)}</div>
                            <div>Relay: {formatPercentage(network.uptime.relay)}</div>
                        </div>
                        <div className="performance-card">
                            <h4>Latency</h4>
                            <div>P2P: {network.latency.p2p}ms</div>
                            <div>Relay: {network.latency.relay}ms</div>
                        </div>
                        <div className="performance-card">
                            <h4>Failure Rate</h4>
                            <div>P2P: {formatPercentage(network.failureRate.p2p)}</div>
                            <div>Relay: {formatPercentage(network.failureRate.relay)}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPricingMetrics = () => {
        if (!metrics) return null;
        const { pricing } = metrics;

        return (
            <div className="metrics-sections">
                <div className="metrics-section">
                    <h3>Current Pricing Tiers</h3>
                    <div className="pricing-grid">
                        <div className="pricing-table">
                            <h4>P2P Storage</h4>
                            <div className="tier-row">
                                <span>Basic:</span>
                                <span>{formatCurrency(pricing.current.p2p.basic)}/GB/month</span>
                            </div>
                            <div className="tier-row">
                                <span>Secure:</span>
                                <span>{formatCurrency(pricing.current.p2p.secure)}/GB/month</span>
                            </div>
                            <div className="tier-row">
                                <span>Vault:</span>
                                <span>{formatCurrency(pricing.current.p2p.vault)}/GB/month</span>
                            </div>
                        </div>
                        <div className="pricing-table">
                            <h4>Relay Storage</h4>
                            <div className="tier-row">
                                <span>Basic:</span>
                                <span>{formatCurrency(pricing.current.relay.basic)}/GB/month</span>
                            </div>
                            <div className="tier-row">
                                <span>Secure:</span>
                                <span>{formatCurrency(pricing.current.relay.secure)}/GB/month</span>
                            </div>
                            <div className="tier-row">
                                <span>Vault:</span>
                                <span>{formatCurrency(pricing.current.relay.vault)}/GB/month</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="metrics-section">
                    <h3>Democratic Governance</h3>
                    <div className="governance-stats">
                        <div className="governance-overview">
                            <div className="stat-item">
                                <span>Active Proposals:</span>
                                <span>{pricing.proposals.active}</span>
                            </div>
                            <div className="stat-item">
                                <span>Total Votes Cast:</span>
                                <span>{formatNumber(pricing.proposals.totalVotes)}</span>
                            </div>
                        </div>
                        
                        {pricing.proposals.topProposal && (
                            <div className="top-proposal">
                                <h4>🏆 Top Ranked Proposal</h4>
                                <div className="proposal-details">
                                    <div>By: {pricing.proposals.topProposal.proposer}</div>
                                    <div className="proposal-description">
                                        {pricing.proposals.topProposal.description}
                                    </div>
                                    <div className="proposal-votes">
                                        <span className="votes-up">👍 {pricing.proposals.topProposal.votes.up}</span>
                                        <span className="votes-down">👎 {pricing.proposals.topProposal.votes.down}</span>
                                        <span className="proposal-age">{pricing.proposals.topProposal.ageHours}h old</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCostMetrics = () => {
        if (!metrics) return null;
        const { costs } = metrics;

        return (
            <div className="metrics-sections">
                <div className="metrics-section">
                    <h3>Revenue & Costs</h3>
                    <div className="cost-grid">
                        <div className="cost-card revenue">
                            <h4>Revenue</h4>
                            <div className="cost-value">{formatCurrency(costs.dailyRevenue)}</div>
                            <div className="cost-subtitle">Daily</div>
                            <div className="cost-projection">
                                Monthly Projected: {formatCurrency(costs.monthlyProjected)}
                            </div>
                        </div>
                        
                        <div className="cost-card expenses">
                            <h4>Operating Costs</h4>
                            <div className="cost-breakdown">
                                <div>Relay Infrastructure: {formatCurrency(costs.operatingCosts.relay_infrastructure)}</div>
                                <div>Network Maintenance: {formatCurrency(costs.operatingCosts.network_maintenance)}</div>
                                <div>Governance Operations: {formatCurrency(costs.operatingCosts.governance_operations)}</div>
                            </div>
                            <div className="total-costs">
                                Total: {formatCurrency(
                                    costs.operatingCosts.relay_infrastructure +
                                    costs.operatingCosts.network_maintenance +
                                    costs.operatingCosts.governance_operations
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="metrics-section">
                    <h3>User Credits</h3>
                    <div className="credits-stats">
                        <div className="credits-overview">
                            <div className="credit-item">
                                <span>Total Issued:</span>
                                <span>{formatCurrency(costs.userCredits.totalIssued)}</span>
                            </div>
                            <div className="credit-item">
                                <span>Total Spent:</span>
                                <span>{formatCurrency(costs.userCredits.totalSpent)}</span>
                            </div>
                            <div className="credit-item">
                                <span>Average Balance:</span>
                                <span>{formatCurrency(costs.userCredits.averageBalance)}</span>
                            </div>
                        </div>
                        
                        <div className="credits-utilization">
                            <div className="utilization-bar">
                                <div 
                                    className="utilization-fill"
                                    style={{ 
                                        width: `${(costs.userCredits.totalSpent / costs.userCredits.totalIssued) * 100}%` 
                                    }}
                                ></div>
                            </div>
                            <div className="utilization-label">
                                Credit Utilization: {formatPercentage(costs.userCredits.totalSpent / costs.userCredits.totalIssued)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="metrics-loading">
                    <div className="loading-spinner"></div>
                    <div>Loading metrics...</div>
                </div>
            );
        }

        switch (selectedMetricType) {
            case 'overview':
                return renderOverviewMetrics();
            case 'network':
                return renderNetworkMetrics();
            case 'pricing':
                return renderPricingMetrics();
            case 'costs':
                return renderCostMetrics();
            default:
                return renderOverviewMetrics();
        }
    };

    return (
        <div className="storage-metrics-dashboard">
            <div className="dashboard-header">
                <h2>Storage Network Metrics</h2>
                <div className="dashboard-controls">
                    <select 
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="timeframe-selector"
                    >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            <div className="dashboard-tabs">
                <button 
                    className={`tab ${selectedMetricType === 'overview' ? 'active' : ''}`}
                    onClick={() => setSelectedMetricType('overview')}
                >
                    📊 Overview
                </button>
                <button 
                    className={`tab ${selectedMetricType === 'network' ? 'active' : ''}`}
                    onClick={() => setSelectedMetricType('network')}
                >
                    🌐 Network
                </button>
                <button 
                    className={`tab ${selectedMetricType === 'pricing' ? 'active' : ''}`}
                    onClick={() => setSelectedMetricType('pricing')}
                >
                    💰 Pricing & Governance
                </button>
                <button 
                    className={`tab ${selectedMetricType === 'costs' ? 'active' : ''}`}
                    onClick={() => setSelectedMetricType('costs')}
                >
                    📈 Revenue & Costs
                </button>
            </div>

            <div className="dashboard-content">
                {renderContent()}
            </div>

            <div className="dashboard-footer">
                <div className="last-updated">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
                <div className="data-source">
                    Data from decentralized storage network
                </div>
            </div>
        </div>
    );
};

export default StorageMetricsDashboard;
