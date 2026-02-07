/**
 * Democratic Storage Governance Interface
 * 
 * React component for community participation in storage pricing governance.
 * Pure democratic voting - every user has equal voice in determining prices.
 */

import React, { useState, useEffect } from 'react';
import './StorageGovernance.css';

const StorageGovernance = ({ userId, governanceService }) => {
    const [currentPricing, setCurrentPricing] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [activeProposals, setActiveProposals] = useState([]);
    const [votingHistory, setVotingHistory] = useState([]);
    const [showCreateProposal, setShowCreateProposal] = useState(false);
    const [isRegisteredVoter, setIsRegisteredVoter] = useState(false);
    const [userVotes, setUserVotes] = useState(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGovernanceData();
        // Check if user is registered to vote
        checkVoterRegistration();
    }, [userId]);

    const loadGovernanceData = async () => {
        setLoading(true);
        try {
            // In real implementation, these would be API calls
            setCurrentPricing({
                p2p: { basic: 1.50, secure: 2.00, vault: 2.50 },
                relay: { basic: 2.25, secure: 3.00, vault: 3.75 }
            });

            setMarketData({
                utilizationRate: 0.65,
                providerCount: { p2p: 15, relay: 3 },
                userSatisfactionScore: 0.8,
                averageResponseTime: 120,
                totalVoters: 1247
            });

            // Mock active proposals
            setActiveProposals([
                {
                    id: 'prop_001',
                    title: 'Reduce Secure Tier Pricing by 15%',
                    description: 'Current secure tier pricing is deterring adoption. Propose 15% reduction to increase accessibility.',
                    proposerId: 'community_member_42',
                    proposedPricing: {
                        p2p: { basic: 1.50, secure: 1.70, vault: 2.50 },
                        relay: { basic: 2.25, secure: 2.55, vault: 3.75 }
                    },
                    votingEndsAt: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5 days
                    totalVotes: 156,
                    supportVotes: 89,
                    opposeVotes: 67,
                    createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
                }
            ]);

            // Mock voting history
            setVotingHistory([
                {
                    id: 'prop_history_1',
                    title: 'Increase Vault Tier Premium',
                    status: 'passed',
                    finalReason: 'Democratic majority: 234 support vs 187 oppose (55.6% approval)',
                    finalizedAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
                    participationRate: 0.34
                }
            ]);

        } catch (error) {
            console.error('Failed to load governance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkVoterRegistration = () => {
        // In real implementation, check with governanceService
        setIsRegisteredVoter(true);
    };

    const registerToVote = async () => {
        try {
            // await governanceService.registerVoter(userId);
            setIsRegisteredVoter(true);
            console.log('✅ Registered to vote with equal weight (1.0)');
        } catch (error) {
            console.error('Failed to register:', error);
        }
    };

    const castVote = async (proposalId, support, reasoning = '') => {
        try {
            // await governanceService.castVote(proposalId, userId, { support, reasoning });
            
            // Update local state
            setUserVotes(prev => new Map(prev.set(proposalId, { support, reasoning, timestamp: Date.now() })));
            
            // Update proposal vote counts
            setActiveProposals(prev => prev.map(proposal => {
                if (proposal.id === proposalId) {
                    const updatedProposal = { ...proposal };
                    
                    // Remove previous vote if exists
                    const previousVote = userVotes.get(proposalId);
                    if (previousVote) {
                        if (previousVote.support) {
                            updatedProposal.supportVotes -= 1;
                        } else {
                            updatedProposal.opposeVotes -= 1;
                        }
                        updatedProposal.totalVotes -= 1;
                    }
                    
                    // Add new vote
                    if (support) {
                        updatedProposal.supportVotes += 1;
                    } else {
                        updatedProposal.opposeVotes += 1;
                    }
                    updatedProposal.totalVotes += 1;
                    
                    return updatedProposal;
                }
                return proposal;
            }));

            console.log(`🗳️ Vote cast: ${support ? 'SUPPORT' : 'OPPOSE'}`);
        } catch (error) {
            console.error('Failed to cast vote:', error);
        }
    };

    const getMarketConditionMessage = () => {
        if (!marketData) return '';
        
        if (marketData.utilizationRate > 0.8) {
            return { 
                type: 'warning', 
                text: 'High demand detected - prices may need to increase to attract more providers',
                icon: '⚠️'
            };
        } else if (marketData.utilizationRate < 0.3) {
            return { 
                type: 'info', 
                text: 'Low utilization - prices may need to decrease to encourage more usage',
                icon: 'ℹ️'
            };
        } else {
            return { 
                type: 'success', 
                text: 'Balanced market conditions - current pricing appears appropriate',
                icon: '✅'
            };
        }
    };

    const formatTimeRemaining = (endTime) => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return 'Voting ended';
        
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        
        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h remaining`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="storage-governance">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading governance data...</p>
                </div>
            </div>
        );
    }

    const marketCondition = getMarketConditionMessage();

    return (
        <div className="storage-governance">
            <header className="governance-header">
                <h1>🗳️ Democratic Storage Governance</h1>
                <p>Community-driven pricing through equal voting rights</p>
                
                {!isRegisteredVoter && (
                    <div className="registration-notice">
                        <div className="notice-content">
                            <h3>🆔 Register to Vote</h3>
                            <p>Join the democratic process! Every user gets exactly one vote - no weighting or special privileges.</p>
                            <button className="btn btn-primary" onClick={registerToVote}>
                                Register to Vote (Equal Weight)
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Current Market State */}
            <section className="market-overview">
                <h2>📊 Market Information</h2>
                <div className="market-grid">
                    <div className="market-stat">
                        <div className="stat-icon">📈</div>
                        <div className="stat-content">
                            <h3>Network Utilization</h3>
                            <p className="stat-value">{(marketData.utilizationRate * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                    
                    <div className="market-stat">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-content">
                            <h3>Active Providers</h3>
                            <p className="stat-value">{marketData.providerCount.p2p + marketData.providerCount.relay}</p>
                            <p className="stat-detail">{marketData.providerCount.p2p} P2P + {marketData.providerCount.relay} Relay</p>
                        </div>
                    </div>
                    
                    <div className="market-stat">
                        <div className="stat-icon">😊</div>
                        <div className="stat-content">
                            <h3>User Satisfaction</h3>
                            <p className="stat-value">{(marketData.userSatisfactionScore * 100).toFixed(0)}%</p>
                        </div>
                    </div>
                    
                    <div className="market-stat">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <h3>Registered Voters</h3>
                            <p className="stat-value">{marketData.totalVoters.toLocaleString()}</p>
                            <p className="stat-detail">Equal voting power</p>
                        </div>
                    </div>
                </div>
                
                {marketCondition && (
                    <div className={`market-condition ${marketCondition.type}`}>
                        <span className="condition-icon">{marketCondition.icon}</span>
                        <span className="condition-text">{marketCondition.text}</span>
                    </div>
                )}
            </section>

            {/* Current Pricing */}
            <section className="current-pricing">
                <h2>💰 Current Pricing (Set by Community Vote)</h2>
                <div className="pricing-grid">
                    <div className="pricing-section">
                        <h3>🤝 P2P Storage</h3>
                        <div className="pricing-tiers">
                            <div className="pricing-tier">
                                <span className="tier-name">Basic</span>
                                <span className="tier-price">{formatCurrency(currentPricing.p2p.basic)}/GB/month</span>
                            </div>
                            <div className="pricing-tier">
                                <span className="tier-name">Secure</span>
                                <span className="tier-price">{formatCurrency(currentPricing.p2p.secure)}/GB/month</span>
                            </div>
                            <div className="pricing-tier">
                                <span className="tier-name">Vault</span>
                                <span className="tier-price">{formatCurrency(currentPricing.p2p.vault)}/GB/month</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pricing-section">
                        <h3>🏢 Relay Fallback</h3>
                        <div className="pricing-tiers">
                            <div className="pricing-tier">
                                <span className="tier-name">Basic</span>
                                <span className="tier-price">{formatCurrency(currentPricing.relay.basic)}/GB/month</span>
                            </div>
                            <div className="pricing-tier">
                                <span className="tier-name">Secure</span>
                                <span className="tier-price">{formatCurrency(currentPricing.relay.secure)}/GB/month</span>
                            </div>
                            <div className="pricing-tier">
                                <span className="tier-name">Vault</span>
                                <span className="tier-price">{formatCurrency(currentPricing.relay.vault)}/GB/month</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Active Proposals */}
            <section className="active-proposals">
                <div className="section-header">
                    <h2>📝 Active Proposals</h2>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowCreateProposal(true)}
                        disabled={!isRegisteredVoter}
                    >
                        Create Proposal
                    </button>
                </div>

                {activeProposals.length === 0 ? (
                    <div className="no-proposals">
                        <p>No active proposals. The community can create new pricing proposals at any time.</p>
                    </div>
                ) : (
                    <div className="proposals-list">
                        {activeProposals.map(proposal => {
                            const userVote = userVotes.get(proposal.id);
                            const supportPercentage = proposal.totalVotes > 0 ? (proposal.supportVotes / proposal.totalVotes) * 100 : 0;
                            
                            return (
                                <div key={proposal.id} className="proposal-card">
                                    <div className="proposal-header">
                                        <h3>{proposal.title}</h3>
                                        <div className="proposal-meta">
                                            <span className="time-remaining">{formatTimeRemaining(proposal.votingEndsAt)}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="proposal-description">{proposal.description}</p>
                                    
                                    <div className="proposed-changes">
                                        <h4>Proposed Changes:</h4>
                                        <div className="changes-grid">
                                            <div>
                                                <strong>P2P Secure:</strong> {formatCurrency(currentPricing.p2p.secure)} → {formatCurrency(proposal.proposedPricing.p2p.secure)}
                                                <span className={proposal.proposedPricing.p2p.secure < currentPricing.p2p.secure ? 'decrease' : 'increase'}>
                                                    ({proposal.proposedPricing.p2p.secure < currentPricing.p2p.secure ? '↓' : '↑'} {Math.abs(((proposal.proposedPricing.p2p.secure - currentPricing.p2p.secure) / currentPricing.p2p.secure * 100)).toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="voting-progress">
                                        <div className="progress-header">
                                            <span>Democratic Vote Progress</span>
                                            <span>{proposal.totalVotes} votes cast</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill support"
                                                style={{ width: `${supportPercentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="vote-counts">
                                            <span className="support-count">✅ {proposal.supportVotes} Support ({supportPercentage.toFixed(1)}%)</span>
                                            <span className="oppose-count">❌ {proposal.opposeVotes} Oppose ({(100 - supportPercentage).toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    
                                    {isRegisteredVoter && (
                                        <div className="voting-actions">
                                            {userVote ? (
                                                <div className="user-vote-status">
                                                    <span className={`vote-indicator ${userVote.support ? 'support' : 'oppose'}`}>
                                                        You voted: {userVote.support ? '✅ SUPPORT' : '❌ OPPOSE'}
                                                    </span>
                                                    <button 
                                                        className="btn btn-small"
                                                        onClick={() => setUserVotes(prev => { const updated = new Map(prev); updated.delete(proposal.id); return updated; })}
                                                    >
                                                        Change Vote
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="vote-buttons">
                                                    <button 
                                                        className="btn btn-support"
                                                        onClick={() => castVote(proposal.id, true)}
                                                    >
                                                        ✅ Support
                                                    </button>
                                                    <button 
                                                        className="btn btn-oppose"
                                                        onClick={() => castVote(proposal.id, false)}
                                                    >
                                                        ❌ Oppose
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Voting History */}
            <section className="voting-history">
                <h2>📚 Recent Governance Decisions</h2>
                <div className="history-list">
                    {votingHistory.map(decision => (
                        <div key={decision.id} className="history-item">
                            <div className="decision-header">
                                <h4>{decision.title}</h4>
                                <span className={`status-badge ${decision.status}`}>
                                    {decision.status.toUpperCase()}
                                </span>
                            </div>
                            <p className="decision-reason">{decision.finalReason}</p>
                            <div className="decision-meta">
                                <span>Participation: {(decision.participationRate * 100).toFixed(1)}%</span>
                                <span>Decided: {new Date(decision.finalizedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Democratic Principles */}
            <section className="governance-principles">
                <h2>⚖️ Democratic Principles</h2>
                <div className="principles-grid">
                    <div className="principle">
                        <h4>🟰 Equal Voting Rights</h4>
                        <p>Every registered user gets exactly one vote. No weighting based on stake, reputation, or any other factor.</p>
                    </div>
                    <div className="principle">
                        <h4>📊 Informed Democracy</h4>
                        <p>Market data is provided for voter awareness, but never overrides community decisions.</p>
                    </div>
                    <div className="principle">
                        <h4>🔄 Market Self-Correction</h4>
                        <p>Free market principles ensure natural balance between affordability and provider incentives.</p>
                    </div>
                    <div className="principle">
                        <h4>🚫 No Algorithmic Overrides</h4>
                        <p>Prices change only through democratic votes. No automatic adjustments or artificial interventions.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StorageGovernance;
