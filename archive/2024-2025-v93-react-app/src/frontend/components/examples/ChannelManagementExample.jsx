/**
 * @fileoverview Channel Management Integration Example
 * Shows how to integrate the Development Dashboard with existing channel components
 */
import React, { useState, useEffect } from 'react';
import { 
  Settings, Code, Users, Bell, DollarSign, 
  BarChart3, Shield, ExternalLink 
} from 'lucide-react';
import { DevelopmentDashboard } from '../development';
import './ChannelManagementExample.css';

const ChannelManagementExample = ({ channelId, userRole, isChannelOwner }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [channelData, setChannelData] = useState(null);
  const [developmentStats, setDevelopmentStats] = useState(null);

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'development', label: 'Development', icon: Code },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  useEffect(() => {
    loadChannelData();
    loadDevelopmentStats();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      // Mock channel data - replace with actual API call
      const mockChannel = {
        id: channelId,
        name: 'Relay Community Channel',
        description: 'A thriving community focused on privacy and decentralization',
        memberCount: 1247,
        onlineCount: 89,
        createdAt: '2024-01-15T10:30:00Z',
        settings: {
          isPublic: true,
          allowDonations: true,
          allowProposals: true,
          requireProximity: true
        }
      };
      setChannelData(mockChannel);
    } catch (error) {
      console.error('Failed to load channel data:', error);
    }
  };

  const loadDevelopmentStats = async () => {
    try {
      const response = await fetch(`/api/development/stats/channel/${channelId}`);
      if (response.ok) {
        const stats = await response.json();
        setDevelopmentStats(stats);
      }
    } catch (error) {
      console.error('Failed to load development stats:', error);
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      <h2>Channel Overview</h2>
      
      {/* Channel Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon members">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{channelData?.memberCount || 0}</span>
            <span className="stat-label">Total Members</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon online">
            <div className="online-indicator" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{channelData?.onlineCount || 0}</span>
            <span className="stat-label">Online Now</span>
          </div>
        </div>
        
        {developmentStats && (
          <>
            <div className="stat-card">
              <div className="stat-icon proposals">
                <Code size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{developmentStats.totalProposals}</span>
                <span className="stat-label">Active Proposals</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon donations">
                <DollarSign size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-value">
                  {developmentStats.totalDonations >= 1000000 
                    ? `${(developmentStats.totalDonations / 1000000).toFixed(1)}M`
                    : developmentStats.totalDonations >= 1000 
                    ? `${(developmentStats.totalDonations / 1000).toFixed(1)}K`
                    : developmentStats.totalDonations
                  }
                </span>
                <span className="stat-label">Total Raised (sats)</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Development Activity Summary */}
      {developmentStats && (
        <div className="activity-summary">
          <h3>Development Activity</h3>
          <div className="activity-cards">
            <div className="activity-card">
              <div className="activity-header">
                <span className="activity-title">Recent Proposals</span>
                <button 
                  className="view-all-btn"
                  onClick={() => setActiveSection('development')}
                >
                  View All <ExternalLink size={14} />
                </button>
              </div>
              <div className="activity-content">
                {developmentStats.recentProposals?.slice(0, 3).map((proposal, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <Code size={16} />
                    </div>
                    <div className="activity-details">
                      <span className="activity-text">
                        {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)} proposal
                      </span>
                      <span className="activity-time">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`activity-status ${proposal.status}`}>
                      {proposal.status}
                    </div>
                  </div>
                )) || (
                  <div className="empty-activity">
                    <span>No recent proposals</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="activity-card">
              <div className="activity-header">
                <span className="activity-title">Recent Donations</span>
                <button 
                  className="view-all-btn"
                  onClick={() => setActiveSection('development')}
                >
                  View All <ExternalLink size={14} />
                </button>
              </div>
              <div className="activity-content">
                {developmentStats.recentDonations?.slice(0, 3).map((donation, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <DollarSign size={16} />
                    </div>
                    <div className="activity-details">
                      <span className="activity-text">
                        {donation.anonymous ? 'Anonymous' : donation.donorId} donated
                      </span>
                      <span className="activity-time">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="activity-amount">
                      {donation.amount >= 1000 
                        ? `${(donation.amount / 1000).toFixed(1)}K`
                        : donation.amount
                      } sats
                    </div>
                  </div>
                )) || (
                  <div className="empty-activity">
                    <span>No recent donations</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => setActiveSection('development')}
          >
            <Code size={18} />
            <div className="action-content">
              <span className="action-title">Submit Proposal</span>
              <span className="action-description">Request new features or improvements</span>
            </div>
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => setActiveSection('development')}
          >
            <DollarSign size={18} />
            <div className="action-content">
              <span className="action-title">Make Donation</span>
              <span className="action-description">Support channel development</span>
            </div>
          </button>
          
          {isChannelOwner && (
            <button 
              className="action-btn tertiary"
              onClick={() => setActiveSection('settings')}
            >
              <Settings size={18} />
              <div className="action-content">
                <span className="action-title">Channel Settings</span>
                <span className="action-description">Manage channel configuration</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="members-section">
      <h2>Channel Members</h2>
      <p>Member management features would go here...</p>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <h2>Channel Settings</h2>
      
      {isChannelOwner ? (
        <div className="settings-content">
          <div className="setting-group">
            <h3>Development Settings</h3>
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={channelData?.settings?.allowProposals}
                  onChange={(e) => {
                    // Handle setting change
                    console.log('Allow proposals:', e.target.checked);
                  }}
                />
                Allow Development Proposals
              </label>
              <span className="setting-description">
                Members can submit development proposals and feature requests
              </span>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={channelData?.settings?.allowDonations}
                  onChange={(e) => {
                    // Handle setting change
                    console.log('Allow donations:', e.target.checked);
                  }}
                />
                Allow Donations
              </label>
              <span className="setting-description">
                Members can make donations to support channel development
              </span>
            </div>
          </div>
          
          <div className="setting-group">
            <h3>Access Settings</h3>
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={channelData?.settings?.requireProximity}
                  onChange={(e) => {
                    // Handle setting change
                    console.log('Require proximity:', e.target.checked);
                  }}
                />
                Require Proximity for Voting
              </label>
              <span className="setting-description">
                Users must be in physical proximity to vote on proposals
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-access">
          <Shield size={48} />
          <h3>Access Restricted</h3>
          <p>Only channel owners can modify settings.</p>
        </div>
      )}
    </div>
  );

  if (!channelData) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading channel...</span>
      </div>
    );
  }

  return (
    <div className="channel-management">
      <div className="channel-header">
        <div className="header-content">
          <h1>{channelData.name}</h1>
          <p>{channelData.description}</p>
          <div className="header-meta">
            <span className="member-count">
              <Users size={16} />
              {channelData.memberCount} members
            </span>
            <span className="creation-date">
              Created {new Date(channelData.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="management-nav">
        {sections.map(section => {
          const SectionIcon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
            >
              <SectionIcon size={18} />
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="management-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'development' && (
          <DevelopmentDashboard
            channelId={channelId}
            channelName={channelData.name}
            userRole={userRole}
            isChannelOwner={isChannelOwner}
          />
        )}
        {activeSection === 'members' && renderMembers()}
        {activeSection === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default ChannelManagementExample;
