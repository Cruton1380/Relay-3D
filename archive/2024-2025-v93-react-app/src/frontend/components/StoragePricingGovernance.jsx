/**
 * Storage Pricing Governance Interface
 * 
 * React component for community governance of storage pricing.
 * Allows users to view proposals, cast votes, and create new pricing proposals.
 */

import React, { useState, useEffect } from 'react';
import './StoragePricingGovernance.css';

const StoragePricingGovernance = ({ 
    governanceService, 
    currentUser,
    onPricingUpdate 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [marketOverview, setMarketOverview] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [votingStats, setVotingStats] = useState(null);
    const [userVotingWeight, setUserVotingWeight] = useState(0);
    const [showCreateProposal, setShowCreateProposal] = useState(false);
    const [loading, setLoading] = useState(true);

    // New proposal form state
    const [newProposal, setNewProposal] = useState({
        title: '',
        description: '',
        justification: '',
        p2pPricing: { basic: 0, secure: 0, vault: 0 },
        relayPricing: { basic: 0, secure: 0, vault: 0 }
    });

    useEffect(() => {
        loadGovernanceData();
        
        // Listen for governance events
        if (governanceService) {
            governanceService.on('proposal-created', loadProposals);
            governanceService.on('vote-cast', loadProposals);
            governanceService.on('proposal-finalized', handleProposalFinalized);
            governanceService.on('pricing-updated', handlePricingUpdate);
        }

        return () => {
            if (governanceService) {
                governanceService.off('proposal-created', loadProposals);
                governanceService.off('vote-cast', loadProposals);
                governanceService.off('proposal-finalized', handleProposalFinalized);
                governanceService.off('pricing-updated', handlePricingUpdate);
            }
        };
    }, [governanceService]);

    const loadGovernanceData = async () => {
        setLoading(true);
        try {
            if (!governanceService) return;

            const [overview, stats] = await Promise.all([
                governanceService.getMarketOverview(),
                governanceService.getVotingStats()
            ]);

            setMarketOverview(overview);
            setVotingStats(stats);
            setProposals(overview.activeProposals || []);

            // Get user's voting weight
            if (currentUser) {
                const voter = governanceService.voterRegistry.get(currentUser.id);
                setUserVotingWeight(voter?.votingWeight || 0);
            }

        } catch (error) {
            console.error('Failed to load governance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProposals = async () => {
        if (!governanceService) return;
        const overview = await governanceService.getMarketOverview();
        setProposals(overview.activeProposals || []);
    };

    const handleProposalFinalized = (event) => {
        loadProposals();
        // Show notification about proposal result
        alert(`Proposal ${event.passed ? 'PASSED' : 'FAILED'}: ${event.reason}`);
    };

    const handlePricingUpdate = (event) => {
        loadGovernanceData();
        if (onPricingUpdate) {
            onPricingUpdate(event);
        }
    };

    const handleVote = async (proposalId, support, reasoning) => {
        try {
            await governanceService.castVote(proposalId, currentUser.id, {
                support,
                reasoning
            });
            
            alert(`Vote cast: ${support ? 'SUPPORT' : 'OPPOSE'}`);
            loadProposals();
            
        } catch (error) {
            alert(`Failed to cast vote: ${error.message}`);
        }
    };

    const handleCreateProposal = async () => {
        try {
            // Validate pricing changes are within limits
            const currentPricing = marketOverview.pricing;
            const maxChange = 0.2; // 20% max change
            
            for (const tier of ['basic', 'secure', 'vault']) {
                for (const type of ['p2p', 'relay']) {
                    const currentPrice = currentPricing[type][tier];
                    const proposedPrice = newProposal[`${type}Pricing`][tier];
                    
                    if (proposedPrice <= 0) {
                        throw new Error(`${type} ${tier} price must be greater than 0`);
                    }
                    
                    const changeRatio = Math.abs(proposedPrice - currentPrice) / currentPrice;
                    if (changeRatio > maxChange) {
                        throw new Error(`Price change too large for ${type} ${tier}: ${(changeRatio * 100).toFixed(1)}% > ${(maxChange * 100)}%`);
                    }
                }
            }

            await governanceService.createPricingProposal(currentUser.id, {
                title: newProposal.title,
                description: newProposal.description,
                p2pPricing: newProposal.p2pPricing,
                relayPricing: newProposal.relayPricing,
                marketJustification: newProposal.justification
            });

            setShowCreateProposal(false);
            setNewProposal({
                title: '',
                description: '',
                justification: '',
                p2pPricing: { basic: 0, secure: 0, vault: 0 },
                relayPricing: { basic: 0, secure: 0, vault: 0 }
            });

            alert('Proposal created successfully!');
            loadProposals();

        } catch (error) {
            alert(`Failed to create proposal: ${error.message}`);
        }
    };

    const initializeProposalPricing = () => {
        if (marketOverview?.pricing) {
            setNewProposal(prev => ({
                ...prev,
                p2pPricing: { ...marketOverview.pricing.p2p },
                relayPricing: { ...marketOverview.pricing.relay }
            }));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="governance-loading">
                <div className="loading-spinner"></div>
                <p>Loading governance data...</p>
            </div>
        );
    }

    return (
        <div className="storage-pricing-governance">
            <header className="governance-header">
                <h1>🏛️ Storage Pricing Governance</h1>
                <p>Community-driven pricing for decentralized storage</p>
                
                {currentUser && (
                    <div className="user-voting-info">
                        <span>Your voting weight: <strong>{userVotingWeight.toFixed(3)}x</strong></span>
                    </div>
                )}
            </header>

            <nav className="governance-tabs">
                <button 
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button 
                    className={`tab ${activeTab === 'proposals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proposals')}
                >
                    📝 Proposals ({proposals.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'voting' ? 'active' : ''}`}
                    onClick={() => setActiveTab('voting')}
                >
                    🗳️ Voting
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="overview-grid">
                            {/* Current Pricing */}
                            <div className="overview-card">
                                <h3>💰 Current Pricing</h3>
                                {marketOverview?.pricing && (
                                    <div className="pricing-display">
                                        <div className="pricing-section">
                                            <h4>P2P Storage</h4>
                                            <div className="pricing-tiers">
                                                <span>Basic: {formatCurrency(marketOverview.pricing.p2p.basic)}/GB</span>
                                                <span>Secure: {formatCurrency(marketOverview.pricing.p2p.secure)}/GB</span>
                                                <span>Vault: {formatCurrency(marketOverview.pricing.p2p.vault)}/GB</span>
                                            </div>
                                        </div>
                                        <div className="pricing-section">
                                            <h4>Relay Infrastructure</h4>
                                            <div className="pricing-tiers">
                                                <span>Basic: {formatCurrency(marketOverview.pricing.relay.basic)}/GB</span>
                                                <span>Secure: {formatCurrency(marketOverview.pricing.relay.secure)}/GB</span>
                                                <span>Vault: {formatCurrency(marketOverview.pricing.relay.vault)}/GB</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="last-updated">
                                    Last updated: {formatDate(marketOverview?.lastUpdate)}
                                </div>
                            </div>

                            {/* Market Conditions */}
                            <div className="overview-card">
                                <h3>📈 Market Conditions</h3>
                                {marketOverview?.marketData && (
                                    <div className="market-metrics">
                                        <div className="metric">
                                            <span className="label">Utilization Rate:</span>
                                            <span className="value">{(marketOverview.marketData.utilizationRate * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="metric">
                                            <span className="label">P2P Providers:</span>
                                            <span className="value">{marketOverview.marketData.providerCount.p2p}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="label">User Satisfaction:</span>
                                            <span className="value">{(marketOverview.marketData.userSatisfactionScore * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="metric">
                                            <span className="label">Avg Response Time:</span>
                                            <span className="value">{marketOverview.marketData.averageResponseTime.toFixed(0)}ms</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Governance Stats */}
                            <div className="overview-card">
                                <h3>🗳️ Governance Statistics</h3>
                                {votingStats && (
                                    <div className="voting-metrics">
                                        <div className="metric">
                                            <span className="label">Total Voters:</span>
                                            <span className="value">{votingStats.totalVoters}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="label">Active Proposals:</span>
                                            <span className="value">{votingStats.activeProposals}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="label">Completed Proposals:</span>
                                            <span className="value">{votingStats.completedProposals}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="label">Avg Voting Weight:</span>
                                            <span className="value">{votingStats.averageWeight.toFixed(3)}x</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'proposals' && (
                    <div className="proposals-tab">
                        <div className="proposals-header">
                            <h2>Active Proposals</h2>
                            {currentUser && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        initializeProposalPricing();
                                        setShowCreateProposal(true);
                                    }}
                                >
                                    📝 Create Proposal
                                </button>
                            )}
                        </div>

                        <div className="proposals-list">
                            {proposals.length === 0 ? (
                                <div className="no-proposals">
                                    <p>No active proposals</p>
                                    <p>Be the first to propose pricing changes!</p>
                                </div>
                            ) : (
                                proposals.map(proposal => (
                                    <div key={proposal.id} className="proposal-card">
                                        <div className="proposal-header">
                                            <h3>{proposal.title}</h3>
                                            <span className="proposal-status">{proposal.status}</span>
                                        </div>
                                        
                                        <p className="proposal-description">{proposal.description}</p>
                                        
                                        <div className="proposal-pricing">
                                            <h4>Proposed Pricing Changes:</h4>
                                            {/* Show pricing comparison */}
                                            <div className="pricing-comparison">
                                                {['basic', 'secure', 'vault'].map(tier => (
                                                    <div key={tier} className="tier-comparison">
                                                        <span className="tier-name">{tier}:</span>
                                                        <span>P2P: {formatCurrency(proposal.proposedPricing.p2p[tier])}</span>
                                                        <span>Relay: {formatCurrency(proposal.proposedPricing.relay[tier])}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="proposal-voting">
                                            <div className="vote-counts">
                                                <span className="support">Support: {proposal.totalSupport.toFixed(1)}</span>
                                                <span className="opposition">Oppose: {proposal.totalOpposition.toFixed(1)}</span>
                                            </div>
                                            
                                            {currentUser && !proposal.votes.has(currentUser.id) && proposal.status === 'active' && (
                                                <div className="vote-buttons">
                                                    <button 
                                                        className="btn btn-support"
                                                        onClick={() => {
                                                            const reasoning = prompt('Why do you support this proposal?');
                                                            if (reasoning) {
                                                                handleVote(proposal.id, true, reasoning);
                                                            }
                                                        }}
                                                    >
                                                        ✅ Support
                                                    </button>
                                                    <button 
                                                        className="btn btn-oppose"
                                                        onClick={() => {
                                                            const reasoning = prompt('Why do you oppose this proposal?');
                                                            if (reasoning) {
                                                                handleVote(proposal.id, false, reasoning);
                                                            }
                                                        }}
                                                    >
                                                        ❌ Oppose
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {currentUser && proposal.votes.has(currentUser.id) && (
                                                <div className="already-voted">
                                                    You voted: {proposal.votes.get(currentUser.id).support ? 'SUPPORT' : 'OPPOSE'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="proposal-meta">
                                            <span>Created: {formatDate(proposal.createdAt)}</span>
                                            <span>Voting ends: {formatDate(proposal.votingEndsAt)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'voting' && (
                    <div className="voting-tab">
                        <h2>How Voting Works</h2>
                        
                        <div className="voting-info">
                            <div className="info-card">
                                <h3>🏋️ Voting Weight</h3>
                                <p>Your voting weight is based on your stake in the storage network:</p>
                                <ul>
                                    <li><strong>Storage Providers:</strong> Higher weight based on capacity offered</li>
                                    <li><strong>Storage Users:</strong> Weight based on usage and account age</li>
                                    <li><strong>Reputation:</strong> Good reputation increases weight</li>
                                    <li><strong>Account Age:</strong> Longer participation gives more weight</li>
                                </ul>
                            </div>

                            <div className="info-card">
                                <h3>🗳️ Voting Process</h3>
                                <p>Community proposals go through democratic review:</p>
                                <ol>
                                    <li>Community members propose pricing changes</li>
                                    <li>7-day voting period for all eligible voters</li>
                                    <li>Votes are weighted by stake in the network</li>
                                    <li>Market signals (supply/demand) influence outcome</li>
                                    <li>Proposals need both community and market approval</li>
                                    <li>Approved changes are automatically implemented</li>
                                </ol>
                            </div>

                            <div className="info-card">
                                <h3>📊 Market Factors</h3>
                                <p>Pricing considers both votes and market conditions:</p>
                                <ul>
                                    <li><strong>High Utilization:</strong> Supports price increases</li>
                                    <li><strong>Low Utilization:</strong> Supports price decreases</li>
                                    <li><strong>Provider Count:</strong> Affects competitive dynamics</li>
                                    <li><strong>User Satisfaction:</strong> Influences approval threshold</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Proposal Modal */}
            {showCreateProposal && (
                <div className="modal-overlay">
                    <div className="modal-content proposal-modal">
                        <div className="modal-header">
                            <h2>Create Pricing Proposal</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setShowCreateProposal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="proposal-form">
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={newProposal.title}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Brief title for your proposal"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={newProposal.description}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Detailed description of the proposed changes"
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>Market Justification:</label>
                                <textarea
                                    value={newProposal.justification}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, justification: e.target.value }))}
                                    placeholder="Why are these changes needed? What market conditions support this?"
                                    rows={2}
                                />
                            </div>

                            <div className="pricing-inputs">
                                <h3>Proposed P2P Pricing ($/GB/month):</h3>
                                <div className="pricing-grid">
                                    {['basic', 'secure', 'vault'].map(tier => (
                                        <div key={tier} className="pricing-input">
                                            <label>{tier}:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={newProposal.p2pPricing[tier]}
                                                onChange={(e) => setNewProposal(prev => ({
                                                    ...prev,
                                                    p2pPricing: { ...prev.p2pPricing, [tier]: parseFloat(e.target.value) || 0 }
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <h3>Proposed Relay Pricing ($/GB/month):</h3>
                                <div className="pricing-grid">
                                    {['basic', 'secure', 'vault'].map(tier => (
                                        <div key={tier} className="pricing-input">
                                            <label>{tier}:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={newProposal.relayPricing[tier]}
                                                onChange={(e) => setNewProposal(prev => ({
                                                    ...prev,
                                                    relayPricing: { ...prev.relayPricing, [tier]: parseFloat(e.target.value) || 0 }
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateProposal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleCreateProposal}
                                    disabled={!newProposal.title || !newProposal.description}
                                >
                                    Create Proposal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoragePricingGovernance;
