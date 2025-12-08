/**
 * @fileoverview Channel Donation Interface Component
 * UI for making donations to support channel development
 */
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Heart, Users, Target, TrendingUp, 
  Gift, Star, Award, AlertCircle, CheckCircle 
} from 'lucide-react';
import './ChannelDonation.css';

const ChannelDonation = ({ channelId, channelName, currentGoal, onDonate }) => {
  const [donationAmount, setDonationAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [donationStats, setDonationStats] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [error, setError] = useState('');

  const presetAmounts = [1000, 5000, 10000, 25000, 50000, 100000]; // sats

  useEffect(() => {
    loadDonationStats();
    loadRecentDonations();
  }, [channelId]);

  const loadDonationStats = async () => {
    try {
      const response = await fetch(`/api/development/donations/channel/${channelId}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setDonationStats(stats);
      }
    } catch (error) {
      console.error('Failed to load donation stats:', error);
    }
  };

  const loadRecentDonations = async () => {
    try {
      const response = await fetch(`/api/development/donations/channel/${channelId}/recent`);
      if (response.ok) {
        const donations = await response.json();
        setRecentDonations(donations.donations || []);
      }
    } catch (error) {
      console.error('Failed to load recent donations:', error);
    }
  };

  const handleAmountSelect = (amount) => {
    setDonationAmount(amount.toString());
    setError('');
  };

  const validateDonation = () => {
    const amount = parseInt(donationAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid donation amount');
      return false;
    }
    
    if (amount < 100) {
      setError('Minimum donation is 100 sats');
      return false;
    }
    
    if (amount > 10000000) {
      setError('Maximum donation is 10M sats');
      return false;
    }
    
    return true;
  };

  const handleDonate = async () => {
    if (!validateDonation()) return;
    
    setIsDonating(true);
    setError('');
    
    try {
      const donationData = {
        channelId,
        amount: parseInt(donationAmount),
        message: message.trim(),
        anonymous: isAnonymous
      };
      
      await onDonate(donationData);
      
      // Reset form
      setDonationAmount('');
      setMessage('');
      setIsAnonymous(false);
      
      // Reload stats
      await loadDonationStats();
      await loadRecentDonations();
      
    } catch (error) {
      setError(error.message || 'Donation failed. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (!donationStats || !currentGoal) return 0;
    return Math.min((donationStats.totalRaised / currentGoal) * 100, 100);
  };

  const getDonorBadge = (amount) => {
    if (amount >= 1000000) return { icon: Award, label: 'Platinum Supporter', color: '#e5e7eb' };
    if (amount >= 500000) return { icon: Star, label: 'Gold Supporter', color: '#fbbf24' };
    if (amount >= 100000) return { icon: Gift, label: 'Silver Supporter', color: '#9ca3af' };
    if (amount >= 10000) return { icon: Heart, label: 'Bronze Supporter', color: '#cd7c2f' };
    return { icon: Heart, label: 'Supporter', color: '#ef4444' };
  };

  return (
    <div className="channel-donation">
      <div className="donation-header">
        <div className="header-content">
          <h2>Support {channelName}</h2>
          <p>Help fund development and improvements for this channel</p>
        </div>
        <div className="donation-icon">
          <Heart size={32} />
        </div>
      </div>

      {/* Donation Stats */}
      {donationStats && (
        <div className="donation-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{formatAmount(donationStats.totalRaised)}</span>
                <span className="stat-label">Total Raised</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{donationStats.donorCount}</span>
                <span className="stat-label">Donors</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{formatAmount(donationStats.averageDonation)}</span>
                <span className="stat-label">Avg Donation</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {currentGoal && (
            <div className="goal-progress">
              <div className="progress-header">
                <span className="progress-label">Current Goal</span>
                <span className="progress-amounts">
                  {formatAmount(donationStats.totalRaised)} / {formatAmount(currentGoal)} sats
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="progress-percentage">
                {Math.round(getProgressPercentage())}% funded
              </div>
            </div>
          )}
        </div>
      )}

      {/* Donation Form */}
      <div className="donation-form">
        <h3>Make a Donation</h3>
        
        {/* Preset Amounts */}
        <div className="preset-amounts">
          <label>Quick Amounts (sats)</label>
          <div className="amount-grid">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                type="button"
                className={`amount-btn ${donationAmount === amount.toString() ? 'selected' : ''}`}
                onClick={() => handleAmountSelect(amount)}
              >
                {formatAmount(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="form-group">
          <label htmlFor="donation-amount">Custom Amount (sats)</label>
          <input
            type="number"
            id="donation-amount"
            value={donationAmount}
            onChange={(e) => {
              setDonationAmount(e.target.value);
              setError('');
            }}
            placeholder="Enter amount in satoshis"
            min="100"
            max="10000000"
            className={`amount-input ${error ? 'error' : ''}`}
          />
        </div>

        {/* Message */}
        <div className="form-group">
          <label htmlFor="donation-message">Message (optional)</label>
          <textarea
            id="donation-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message with your donation..."
            maxLength={200}
            rows={3}
            className="message-input"
          />
          <div className="char-count">{message.length}/200</div>
        </div>

        {/* Anonymous Option */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkmark"></span>
            Donate anonymously
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Donate Button */}
        <button
          onClick={handleDonate}
          disabled={isDonating || !donationAmount}
          className="donate-btn"
        >
          {isDonating ? (
            <>
              <div className="button-spinner" />
              Processing...
            </>
          ) : (
            <>
              <Heart size={18} />
              Donate {donationAmount ? formatAmount(parseInt(donationAmount)) + ' sats' : ''}
            </>
          )}
        </button>
      </div>

      {/* Recent Donations */}
      {recentDonations.length > 0 && (
        <div className="recent-donations">
          <h3>Recent Supporters</h3>
          <div className="donations-list">
            {recentDonations.slice(0, 10).map((donation, index) => {
              const badge = getDonorBadge(donation.amount);
              const BadgeIcon = badge.icon;
              
              return (
                <div key={index} className="donation-item">
                  <div className="donor-info">
                    <div className="donor-badge" style={{ color: badge.color }}>
                      <BadgeIcon size={16} />
                    </div>
                    <div className="donor-details">
                      <span className="donor-name">
                        {donation.anonymous ? 'Anonymous' : donation.donorId}
                      </span>
                      <span className="donor-badge-label">{badge.label}</span>
                    </div>
                  </div>
                  
                  <div className="donation-details">
                    <span className="donation-amount">
                      {formatAmount(donation.amount)} sats
                    </span>
                    <span className="donation-time">
                      {formatTimestamp(donation.createdAt)}
                    </span>
                  </div>
                  
                  {donation.message && (
                    <div className="donation-message">
                      "{donation.message}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {recentDonations.length > 10 && (
            <div className="view-all">
              <button className="view-all-btn">
                View All Donations ({recentDonations.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Donation Info */}
      <div className="donation-info">
        <h4>How Donations Help</h4>
        <ul>
          <li>Fund new feature development</li>
          <li>Support bug fixes and improvements</li>
          <li>Enable channel-specific enhancements</li>
          <li>Reward contributors and developers</li>
        </ul>
        
        <div className="info-note">
          <AlertCircle size={16} />
          <span>All donations are non-refundable and support ongoing development efforts.</span>
        </div>
      </div>
    </div>
  );
};

export default ChannelDonation;
