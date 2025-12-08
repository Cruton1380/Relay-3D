/**
 * Simple Storage Economy Component
 * 
 * One-click interface for:
 * - Enabling storage provider mode (earn passive income)
 * - Purchasing storage space (pay with wallet/payment method)
 * - Managing wallet and viewing earnings
 */

import React, { useState, useEffect } from 'react';
import walletService from '../services/walletService';
import './SimpleStorageEconomy.css';

const SimpleStorageEconomy = () => {    const [walletData, setWalletData] = useState(null);
    const [storageMode, setStorageMode] = useState('consumer'); // 'consumer' or 'provider'
    const [loading, setLoading] = useState(false);
    const [showWallet, setShowWallet] = useState(false);
    const [currentUserId] = useState('user_123'); // In real app, would come from auth context

    useEffect(() => {
        // Load wallet data from backend
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            const data = await walletService.getWalletInfo(currentUserId);
            setWalletData(data);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        }
    };    const handleEnableStorageProvider = async (spaceGB) => {
        setLoading(true);
        try {
            const result = await walletService.enableStorageProvider(currentUserId, spaceGB);
            
            if (result.success) {
                // Update local wallet data
                setWalletData(prev => ({
                    ...prev,
                    storageProvider: {
                        enabled: true,
                        allocatedSpace: spaceGB,
                        currentEarnings: 0,
                        estimatedMonthly: result.estimatedEarnings
                    }
                }));
                alert(`✅ Storage provider enabled! You're now earning from ${spaceGB}GB of shared storage.`);
            } else {
                alert('❌ Failed to enable storage provider');
            }
        } catch (error) {
            console.error('Error enabling storage provider:', error);
            alert('❌ Failed to enable storage provider');
        } finally {
            setLoading(false);
        }
    };    const handlePurchaseStorage = async (planType) => {
        setLoading(true);
        try {
            // Get default payment method
            const defaultPaymentMethod = walletData.paymentMethods.find(pm => pm.isDefault);
            if (!defaultPaymentMethod) {
                alert('❌ No payment method available. Please add a payment method first.');
                return;
            }

            const result = await walletService.purchaseStorage(currentUserId, planType, defaultPaymentMethod.id);
            
            if (result.success) {
                // Reload wallet data to get updated balance
                await loadWalletData();
                alert(`✅ Storage purchased! Transaction ID: ${result.transactionId}`);
            } else {
                alert('❌ Failed to purchase storage');
            }
        } catch (error) {
            console.error('Error purchasing storage:', error);
            alert('❌ Failed to purchase storage');
        } finally {
            setLoading(false);
        }    };

    const handleDownloadTaxDocuments = async (year) => {
        try {
            const result = await walletService.getTaxDocuments(currentUserId, year);
            if (result.success) {
                alert(`✅ Tax documents for ${year} are being prepared. You'll receive a download link shortly.`);
            } else {
                alert('❌ Failed to generate tax documents');
            }
        } catch (error) {
            console.error('Error downloading tax documents:', error);
            alert('❌ Failed to download tax documents');
        }
    };

    if (!walletData) {
        return (
            <div className="simple-storage-loading">
                <div className="loading-spinner"></div>
                <p>Loading your storage economy...</p>
            </div>
        );
    }

    return (
        <div className="simple-storage-economy">
            <div className="economy-header">
                <h2>💰 Storage Economy</h2>
                <p>Earn passive income by sharing storage, or buy space when you need it</p>
                  <div className="balance-display">
                    <div className="balance-card">
                        <span className="balance-label">Wallet Balance</span>
                        <span className="balance-amount">${walletData.balances.available.toFixed(2)}</span>
                    </div>
                    <button 
                        className="wallet-button"
                        onClick={() => setShowWallet(true)}
                    >
                        💳 Manage Wallet
                    </button>
                </div>
            </div>

            <div className="economy-modes">
                <div className="mode-tabs">
                    <button 
                        className={`mode-tab ${storageMode === 'consumer' ? 'active' : ''}`}
                        onClick={() => setStorageMode('consumer')}
                    >
                        💾 Buy Storage
                    </button>
                    <button 
                        className={`mode-tab ${storageMode === 'provider' ? 'active' : ''}`}
                        onClick={() => setStorageMode('provider')}
                    >
                        💸 Earn from Storage
                    </button>
                </div>

                {storageMode === 'consumer' && (
                    <div className="consumer-mode">
                        <h3>💾 Purchase Storage Space</h3>
                        <p>Buy secure, decentralized storage space with one click</p>
                        
                        <div className="storage-plans">
                            <div className="plan-card">
                                <h4>Basic</h4>
                                <div className="plan-space">10 GB</div>
                                <div className="plan-price">$20/month</div>
                                <button 
                                    className="plan-button"
                                    onClick={() => handlePurchaseStorage('basic')}
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Processing...' : '💳 Buy Now'}
                                </button>
                            </div>
                            
                            <div className="plan-card popular">
                                <div className="popular-badge">Most Popular</div>
                                <h4>Secure</h4>
                                <div className="plan-space">25 GB</div>
                                <div className="plan-price">$62.50/month</div>
                                <button 
                                    className="plan-button"
                                    onClick={() => handlePurchaseStorage('secure')}
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Processing...' : '💳 Buy Now'}
                                </button>
                            </div>
                            
                            <div className="plan-card">
                                <h4>Vault</h4>
                                <div className="plan-space">100 GB</div>
                                <div className="plan-price">$300/month</div>
                                <button 
                                    className="plan-button"
                                    onClick={() => handlePurchaseStorage('vault')}
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Processing...' : '💳 Buy Now'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="payment-info">
                            <p>💳 Payment will be charged to your default payment method</p>
                            <p>🛡️ All storage is encrypted and distributed across the network</p>
                        </div>
                    </div>
                )}

                {storageMode === 'provider' && (
                    <div className="provider-mode">
                        {!walletData.storageProvider.enabled ? (
                            <div className="enable-provider">
                                <h3>💸 Earn Passive Income</h3>
                                <p>Share your unused storage space and earn money automatically</p>
                                
                                <div className="provider-options">
                                    <div className="provider-card" onClick={() => handleEnableStorageProvider(50)}>
                                        <h4>Starter Provider</h4>
                                        <div className="provider-space">50 GB</div>
                                        <div className="provider-earnings">~$117/month</div>
                                        <button className="enable-button" disabled={loading}>
                                            {loading ? '⏳ Enabling...' : '🚀 Enable Now'}
                                        </button>
                                    </div>
                                    
                                    <div className="provider-card recommended" onClick={() => handleEnableStorageProvider(100)}>
                                        <div className="recommended-badge">Recommended</div>
                                        <h4>Standard Provider</h4>
                                        <div className="provider-space">100 GB</div>
                                        <div className="provider-earnings">~$234/month</div>
                                        <button className="enable-button" disabled={loading}>
                                            {loading ? '⏳ Enabling...' : '🚀 Enable Now'}
                                        </button>
                                    </div>
                                    
                                    <div className="provider-card" onClick={() => handleEnableStorageProvider(200)}>
                                        <h4>Power Provider</h4>
                                        <div className="provider-space">200 GB</div>
                                        <div className="provider-earnings">~$468/month</div>
                                        <button className="enable-button" disabled={loading}>
                                            {loading ? '⏳ Enabling...' : '🚀 Enable Now'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="provider-benefits">
                                    <h4>✨ Benefits of Being a Storage Provider:</h4>
                                    <ul>
                                        <li>🕐 Passive income 24/7</li>
                                        <li>🏠 Use your existing hardware</li>
                                        <li>📊 Transparent earnings tracking</li>
                                        <li>📈 Automatic tax documentation</li>
                                        <li>🛡️ Secure, encrypted data only</li>
                                        <li>⚡ One-click enable/disable</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="provider-active">
                                <h3>🎉 Storage Provider Active!</h3>
                                <p>You're earning passive income from your shared storage</p>
                                
                                <div className="provider-stats">
                                    <div className="stat-card">
                                        <div className="stat-icon">💾</div>
                                        <div className="stat-value">{walletData.storageProvider.allocatedSpace} GB</div>
                                        <div className="stat-label">Allocated Space</div>
                                    </div>
                                    
                                    <div className="stat-card">
                                        <div className="stat-icon">💰</div>
                                        <div className="stat-value">${walletData.storageProvider.currentEarnings.toFixed(2)}</div>
                                        <div className="stat-label">Current Earnings</div>
                                    </div>
                                    
                                    <div className="stat-card">
                                        <div className="stat-icon">📈</div>
                                        <div className="stat-value">${walletData.storageProvider.estimatedMonthly.toFixed(2)}</div>
                                        <div className="stat-label">Est. Monthly</div>
                                    </div>
                                </div>
                                
                                <div className="provider-actions">
                                    <button className="secondary-button">⚙️ Adjust Settings</button>
                                    <button className="danger-button">⏹️ Disable Provider</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Wallet Modal */}
            {showWallet && (
                <div className="modal-overlay" onClick={() => setShowWallet(false)}>
                    <div className="wallet-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>💳 Relay Wallet</h3>
                            <button className="close-button" onClick={() => setShowWallet(false)}>✕</button>
                        </div>
                          <div className="wallet-content">
                            <div className="wallet-balance">
                                <h4>Current Balance</h4>
                                <div className="balance-display-large">${walletData.balances.available.toFixed(2)}</div>
                                {walletData.balances.pending > 0 && (
                                    <div className="pending-balance">
                                        Pending: ${walletData.balances.pending.toFixed(2)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="wallet-section">
                                <h4>💸 Earnings This Month</h4>
                                <div className="earnings-breakdown">
                                    <div className="earning-item">
                                        <span>Storage Provider:</span>
                                        <span>${walletData.balances.earnings.storage.toFixed(2)}</span>
                                    </div>
                                    <div className="earning-item">
                                        <span>Job Contracts:</span>
                                        <span>${walletData.balances.earnings.jobs.toFixed(2)}</span>
                                    </div>
                                    <div className="earning-item">
                                        <span>Channel Donations:</span>
                                        <span>${walletData.balances.earnings.channels.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="wallet-section">
                                <h4>💳 Payment Methods</h4>
                                <div className="payment-methods">
                                    {walletData.paymentMethods.map(method => (
                                        <div key={method.id} className="payment-method">
                                            <span>💳 •••• {method.last4}</span>
                                            {method.isDefault && <span className="default-badge">Default</span>}
                                        </div>
                                    ))}
                                    <button className="add-payment-button">+ Add Payment Method</button>
                                </div>
                            </div>
                              <div className="wallet-section">
                                <h4>📊 Tax Documentation</h4>
                                <p>Automatic tax reporting for all earnings and expenses</p>
                                <div className="tax-actions">
                                    <button 
                                        className="secondary-button"
                                        onClick={() => handleDownloadTaxDocuments(2025)}
                                        disabled={loading}
                                    >
                                        📄 Download 2025 Tax Report
                                    </button>
                                    <button className="secondary-button">⚙️ Tax Settings</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleStorageEconomy;
