/**
 * Channel Donation Component
 * 
 * Allows users to donate to channels using the unified wallet system
 * Same payment structure as storage economy
 */

import React, { useState, useEffect } from 'react';
import walletService from '../services/walletService';
import './ChannelDonation.css';

const ChannelDonation = ({ channelId, channelName, channelOwner }) => {
    const [walletData, setWalletData] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [donationMessage, setDonationMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDonationHistory, setShowDonationHistory] = useState(false);
    const [donationHistory, setDonationHistory] = useState(null);
    const [currentUserId] = useState('user_123');

    // Preset donation amounts
    const presetAmounts = [5, 10, 25, 50, 100];

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            const data = await walletService.getWalletInfo(currentUserId);
            setWalletData(data);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        }
    };

    const handleDonation = async () => {
        if (!donationAmount || parseFloat(donationAmount) <= 0) {
            alert('Please enter a valid donation amount');
            return;
        }

        if (!walletData || !walletData.paymentMethods.length) {
            alert('No payment method available. Please add a payment method first.');
            return;
        }

        setLoading(true);
        try {
            const defaultPaymentMethod = walletData.paymentMethods.find(pm => pm.isDefault);
            
            const result = await walletService.donateToChannel(
                currentUserId,
                channelId,
                parseFloat(donationAmount),
                donationMessage,
                defaultPaymentMethod.id
            );

            if (result.success) {
                alert(`✅ Thank you! $${donationAmount} donated to ${channelName}`);
                setDonationAmount('');
                setDonationMessage('');
                await loadWalletData(); // Refresh wallet balance
            } else {
                alert('❌ Failed to process donation');
            }
        } catch (error) {
            console.error('Error processing donation:', error);
            alert('❌ Failed to process donation');
        } finally {
            setLoading(false);
        }
    };

    const loadDonationHistory = async () => {
        try {
            const history = await walletService.getDonationHistory(currentUserId, 'all', 20);
            setDonationHistory(history);
            setShowDonationHistory(true);
        } catch (error) {
            console.error('Failed to load donation history:', error);
        }
    };

    if (!walletData) {
        return <div className="donation-loading">Loading wallet...</div>;
    }

    return (
        <div className="channel-donation">
            <div className="donation-header">
                <h3>💝 Support {channelName}</h3>
                <p>Help keep this channel running with a donation</p>
            </div>

            <div className="wallet-info">
                <div className="balance-display">
                    <span className="balance-label">Your Balance</span>
                    <span className="balance-amount">${walletData.balances.available.toFixed(2)}</span>
                </div>
            </div>

            <div className="donation-form">
                <div className="preset-amounts">
                    <label>Quick Amounts:</label>
                    <div className="preset-buttons">
                        {presetAmounts.map(amount => (
                            <button
                                key={amount}
                                className={`preset-button ${donationAmount === amount.toString() ? 'selected' : ''}`}
                                onClick={() => setDonationAmount(amount.toString())}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="custom-amount">
                    <label htmlFor="donation-amount">Custom Amount ($):</label>
                    <input
                        id="donation-amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="amount-input"
                    />
                </div>

                <div className="donation-message">
                    <label htmlFor="donation-message">Message (optional):</label>
                    <textarea
                        id="donation-message"
                        value={donationMessage}
                        onChange={(e) => setDonationMessage(e.target.value)}
                        placeholder="Leave a message for the channel owner..."
                        className="message-input"
                        rows="3"
                    />
                </div>

                <div className="payment-method-info">
                    <div className="payment-method">
                        <span>💳 Payment Method:</span>
                        {walletData.paymentMethods.length > 0 ? (
                            <span className="payment-info">
                                {walletData.paymentMethods.find(pm => pm.isDefault)?.type} ••••{' '}
                                {walletData.paymentMethods.find(pm => pm.isDefault)?.last4}
                            </span>
                        ) : (
                            <span className="no-payment">No payment method</span>
                        )}
                    </div>
                </div>

                <button
                    className="donate-button"
                    onClick={handleDonation}
                    disabled={loading || !donationAmount || !walletData.paymentMethods.length}
                >
                    {loading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Processing...
                        </>
                    ) : (
                        `💝 Donate $${donationAmount || '0'}`
                    )}
                </button>

                <div className="tax-info">
                    <small>
                        📊 Donations may be tax deductible. Tax documentation will be included in your annual tax report.
                    </small>
                </div>
            </div>

            <div className="donation-actions">
                <button
                    className="history-button"
                    onClick={loadDonationHistory}
                >
                    📈 View Donation History
                </button>
            </div>

            {showDonationHistory && donationHistory && (
                <div className="donation-history-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>💝 Your Donation History</h3>
                            <button 
                                className="close-button"
                                onClick={() => setShowDonationHistory(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="donation-summary">
                            <div className="summary-stat">
                                <span className="stat-label">Total Sent</span>
                                <span className="stat-value">${donationHistory.totals.sent.toFixed(2)}</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-label">Total Received</span>
                                <span className="stat-value">${donationHistory.totals.received.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="donation-list">
                            {donationHistory.donations.map(donation => (
                                <div key={donation.id} className="donation-item">
                                    <div className="donation-info">
                                        <span className={`donation-type ${donation.type.includes('sent') ? 'sent' : 'received'}`}>
                                            {donation.type.includes('sent') ? '📤 Sent' : '📥 Received'}
                                        </span>
                                        <span className="donation-description">{donation.description}</span>
                                    </div>
                                    <div className="donation-details">
                                        <span className={`donation-amount ${donation.amount > 0 ? 'positive' : 'negative'}`}>
                                            ${Math.abs(donation.amount).toFixed(2)}
                                        </span>
                                        <span className="donation-date">
                                            {new Date(donation.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChannelDonation;
