/**
 * Relay KeySpace Storage Plan Selector UI Component
 * 
 * React component for selecting storage plans and configuring
 * Relay fallback options with real-time cost estimation.
 */

import React, { useState, useEffect } from 'react';
import './StoragePlanSelector.css';

const StoragePlanSelector = ({ 
    onPlanSelected, 
    fileSize = 0, 
    userRegion = null,
    storageBroker,
    initialPreferences = {} 
}) => {
    const [selectedPlan, setSelectedPlan] = useState('secure');
    const [allowRelayFallback, setAllowRelayFallback] = useState(true);
    const [billingPreference, setBillingPreference] = useState('pay-as-you-go');
    const [costEstimate, setCostEstimate] = useState(null);
    const [availabilityCheck, setAvailabilityCheck] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userCredits, setUserCredits] = useState(0);

    const planOptions = {
        basic: {
            name: 'Basic',
            description: 'Standard protection for everyday files',
            redundancy: '3 shards, need 2 to recover',
            reliability: '99.9%',
            icon: '📁',
            features: ['Client-side encryption', 'Peer-to-peer storage', 'Standard recovery'],
            recommended: false
        },
        secure: {
            name: 'Secure',
            description: 'Enhanced protection for important documents',
            redundancy: '5 shards, need 3 to recover',
            reliability: '99.99%',
            icon: '🔒',
            features: ['Advanced redundancy', 'Faster recovery', 'Geographic distribution'],
            recommended: true
        },
        vault: {
            name: 'Vault',
            description: 'Maximum protection for critical data',
            redundancy: '7 shards + guardian backup, need 4 to recover',
            reliability: '99.999%',
            icon: '🛡️',
            features: ['Triple redundancy', 'Guardian backup', 'Emergency recovery'],
            recommended: false
        }
    };

    const billingOptions = {
        'pay-as-you-go': {
            name: 'Pay-as-you-go',
            description: 'Pay only for what you use',
            icon: '💳'
        },
        'monthly': {
            name: 'Monthly Plan',
            description: 'Fixed monthly rate with usage limits',
            icon: '📅'
        },
        'prepaid': {
            name: 'Prepaid Credits',
            description: 'Purchase credits in advance',
            icon: '🎫'
        }
    };

    // Load user credits on mount
    useEffect(() => {
        if (storageBroker) {
            const credits = storageBroker.getUserCredits(getCurrentUserId());
            setUserCredits(credits);
        }
    }, [storageBroker]);

    // Update cost estimate when plan or file size changes
    useEffect(() => {
        if (fileSize > 0 && storageBroker) {
            updateCostEstimate();
        }
    }, [selectedPlan, allowRelayFallback, fileSize, storageBroker]);

    const updateCostEstimate = async () => {
        setLoading(true);
        try {
            // Get availability check
            const planConfig = storageBroker.planConfigs[selectedPlan];
            const availability = await storageBroker.storageRegistry.checkRelayFallbackNeeded(
                planConfig.totalShards,
                selectedPlan,
                userRegion
            );
            
            setAvailabilityCheck(availability);

            // Calculate cost estimate
            const estimate = await calculateCostEstimate(
                fileSize,
                selectedPlan,
                allowRelayFallback,
                availability
            );
            
            setCostEstimate(estimate);
        } catch (error) {
            console.error('Cost estimation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCostEstimate = async (size, plan, allowFallback, availability) => {
        const sizeInMB = size / (1024 * 1024);
        const planConfig = storageBroker.planConfigs[plan];
        
        // Base P2P cost
        const baseCostPerMB = 0.02; // Average P2P cost
        let p2pCost = sizeInMB * baseCostPerMB * availability.userProviderCount;
        
        // Relay fallback cost
        let relayCost = 0;
        if (allowFallback && availability.relayShardsNeeded > 0) {
            const relayCostPerMB = baseCostPerMB * 1.5; // 1.5x multiplier
            relayCost = sizeInMB * relayCostPerMB * availability.relayShardsNeeded;
        }
        
        return {
            p2pCost,
            relayCost,
            totalCost: p2pCost + relayCost,
            sizeInMB,
            p2pShards: availability.userProviderCount,
            relayShards: allowFallback ? availability.relayShardsNeeded : 0,
            fallbackRequired: availability.fallbackNeeded && allowFallback
        };
    };

    const handlePlanSelection = (planKey) => {
        setSelectedPlan(planKey);
    };

    const handleSubmit = () => {
        const preferences = {
            allowRelayFallback,
            billingPreference,
            maxRelayCostPerFile: 5.00, // $5 default limit
            preferredRegion: userRegion,
            notifyOnRelayUsage: true
        };

        onPlanSelected({
            plan: selectedPlan,
            preferences,
            costEstimate
        });
    };

    const getCurrentUserId = () => {
        // In a real app, this would come from auth context
        return 'current-user-id';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(amount);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (        <div className="storage-plan-selector">
            <div className="plan-selector-header">
                <h2>Choose Your Storage Plan</h2>
                <p>Secure, decentralized storage with end-to-end encryption</p>
                {fileSize > 0 && (
                    <div className="file-info">
                        <span>File size: {formatBytes(fileSize)}</span>
                    </div>
                )}
            </div>

            {/* Plan Options */}
            <div className="plan-options">
                {Object.entries(planOptions).map(([key, plan]) => (
                    <div 
                        key={key}
                        className={`plan-option ${selectedPlan === key ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}`}
                        onClick={() => handlePlanSelection(key)}
                    >
                        <div className="plan-header">
                            <div className="plan-icon">{plan.icon}</div>
                            <div className="plan-title">
                                <h3>{plan.name}</h3>
                                <p>{plan.description}</p>
                            </div>
                        </div>
                        
                        <div className="plan-details">
                            <div className="plan-redundancy">{plan.redundancy}</div>
                            <div className="plan-reliability">{plan.reliability}</div>
                            
                            <ul className="plan-features">
                                {plan.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>            {/* Configuration Section */}
            <div className="configuration-section">
                <h3>🛠️ Storage Configuration</h3>
                
                {/* Relay Fallback Option */}
                <div className="config-option">
                    <label className="config-label">Relay Backup Infrastructure</label>
                    <p className="config-description">Use Relay's servers when peer-to-peer storage is unavailable</p>
                    
                    <div className="fallback-toggle">
                        <input
                            type="checkbox"
                            className="fallback-checkbox"
                            checked={allowRelayFallback}
                            onChange={(e) => setAllowRelayFallback(e.target.checked)}
                        />
                        <div className="fallback-text">
                            <div>Allow Relay-hosted fallback storage</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                Same encryption, 1.5x cost when used
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Preferences */}
                <div className="config-option">
                    <label className="config-label">Billing Preference</label>
                    <p className="config-description">Choose how you want to pay for storage</p>
                    
                    <div className="billing-options">
                        {Object.entries(billingOptions).map(([key, option]) => (
                            <div 
                                key={key} 
                                className={`billing-option ${billingPreference === key ? 'selected' : ''}`}
                                onClick={() => setBillingPreference(key)}
                            >
                                <div className="billing-header">
                                    <div className="billing-icon">{option.icon}</div>
                                    <div className="billing-name">{option.name}</div>
                                </div>
                                <div className="billing-description">{option.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Credits Display */}
            {billingPreference === 'prepaid' && (
                <div className="user-credits">
                    <span className="credits-label">Available Credits:</span>
                    <span className="credits-amount">{formatCurrency(userCredits)}</span>
                </div>
            )}

            {/* Cost Estimation */}
            {costEstimate && (
                <div className="cost-estimation">
                    <h3>💰 Cost Estimate</h3>
                    
                    {loading ? (
                        <div className="loading">
                            <span className="loading-spinner"></span>
                            Calculating costs...
                        </div>
                    ) : (
                        <div className="cost-breakdown">
                            <div className="cost-item">
                                <span>P2P Storage ({costEstimate.p2pShards} shards):</span>
                                <span>{formatCurrency(costEstimate.p2pCost)}</span>
                            </div>
                            
                            {costEstimate.relayShards > 0 && (
                                <div className="cost-item">
                                    <span>Relay Fallback ({costEstimate.relayShards} shards):</span>
                                    <span>{formatCurrency(costEstimate.relayCost)}</span>
                                </div>
                            )}
                            
                            <div className="cost-item total">
                                <span>Total Monthly Cost:</span>
                                <span>{formatCurrency(costEstimate.totalCost)}</span>
                            </div>
                        </div>
                    )}
                    
                    {costEstimate.fallbackRequired && (
                        <div className="availability-warning">
                            <div className="warning-icon">⚠️</div>
                            <div className="warning-text">
                                Relay fallback required - insufficient P2P providers available
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button 
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading && <span className="loading-spinner"></span>}
                    Select {planOptions[selectedPlan].name} Plan
                </button>
            </div>
        </div>
    );
};

export default StoragePlanSelector;
