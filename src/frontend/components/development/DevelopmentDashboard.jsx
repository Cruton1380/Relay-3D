/**
 * @fileoverview Development Dashboard Component
 * Main dashboard for managing proposals, donations, and development activities
 */
import React, { useState, useEffect } from 'react';
import { 
  Plus, Filter, Search, TrendingUp, Users, DollarSign, 
  Code, MessageSquare, Settings, ChevronDown, Eye, EyeOff 
} from 'lucide-react';
import ProposalSubmission from './ProposalSubmission';
import ProposalVoting from './ProposalVoting';
import ChannelDonation from './ChannelDonation';
import './DevelopmentDashboard.css';

const DevelopmentDashboard = ({ channelId, channelName, userRole, isChannelOwner }) => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [userVotes, setUserVotes] = useState(new Map());

  const tabs = [
    { id: 'proposals', label: 'Proposals', icon: Code },
    { id: 'donations', label: 'Donations', icon: DollarSign },
    { id: 'stats', label: 'Statistics', icon: TrendingUp }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'implemented', label: 'Implemented' },
    { value: 'funded', label: 'Funded' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'feature', label: 'Features' },
    { value: 'bugfix', label: 'Bug Fixes' },
    { value: 'upgrade', label: 'Upgrades' },
    { value: 'integration', label: 'Integrations' },
    { value: 'optimization', label: 'Optimizations' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [channelId]);

  useEffect(() => {
    filterProposals();
  }, [proposals, searchTerm, statusFilter, typeFilter]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProposals(),
        loadDashboardStats(),
        loadUserVotes()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProposals = async () => {
    try {
      const response = await fetch(`/api/development/proposals/channel/${channelId}`);
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Failed to load proposals:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`/api/development/stats/channel/${channelId}`);
      if (response.ok) {
        const stats = await response.json();
        setDashboardStats(stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const loadUserVotes = async () => {
    try {
      const response = await fetch(`/api/development/votes/user`);
      if (response.ok) {
        const data = await response.json();
        const votesMap = new Map();
        data.votes?.forEach(vote => {
          votesMap.set(vote.proposalId, vote.vote);
        });
        setUserVotes(votesMap);
      }
    } catch (error) {
      console.error('Failed to load user votes:', error);
    }
  };

  const filterProposals = () => {
    let filtered = [...proposals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.type === typeFilter);
    }

    // Sort by most recent
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredProposals(filtered);
  };

  const handleSubmitProposal = async (formData) => {
    try {
      const response = await fetch('/api/development/proposals', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowSubmissionForm(false);
        await loadProposals();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('Proposal submission failed:', error);
      throw error;
    }
  };

  const handleVote = async (proposalId, voteType) => {
    try {
      const response = await fetch(`/api/development/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote: voteType })
      });

      if (response.ok) {
        // Update local state
        const newVotes = new Map(userVotes);
        if (voteType === 'neutral') {
          newVotes.delete(proposalId);
        } else {
          newVotes.set(proposalId, voteType);
        }
        setUserVotes(newVotes);

        // Reload proposals to get updated vote counts
        await loadProposals();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote failed:', error);
      throw error;
    }
  };

  const handleDonate = async (donationData) => {
    try {
      const response = await fetch('/api/development/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationData)
      });

      if (response.ok) {
        await loadDashboardStats();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to donate');
      }
    } catch (error) {
      console.error('Donation failed:', error);
      throw error;
    }
  };

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const renderProposalsTab = () => (
    <div className="proposals-section">
      {/* Controls */}
      <div className="section-header">
        <div className="header-left">
          <h2>Development Proposals</h2>
          <span className="proposal-count">{filteredProposals.length} proposals</span>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Submit Proposal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="select-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="proposals-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading proposals...</span>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="empty-state">
            <Code size={48} />
            <h3>No proposals found</h3>
            <p>Be the first to submit a development proposal for this channel.</p>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              Submit First Proposal
            </button>
          </div>
        ) : (
          filteredProposals.map(proposal => (
            <ProposalVoting
              key={proposal.id}
              proposal={proposal}
              userVote={userVotes.get(proposal.id)}
              onVote={handleVote}
              canVote={true} // Add proximity check here
              showVoters={isChannelOwner}
            />
          ))
        )}
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ProposalSubmission
              channelId={channelId}
              channelName={channelName}
              onSubmit={handleSubmitProposal}
              onCancel={() => setShowSubmissionForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderDonationsTab = () => (
    <div className="donations-section">
      <ChannelDonation
        channelId={channelId}
        channelName={channelName}
        currentGoal={dashboardStats?.currentGoal}
        onDonate={handleDonate}
      />
    </div>
  );

  const renderStatsTab = () => (
    <div className="stats-section">
      <h2>Development Statistics</h2>
      
      {dashboardStats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <Code size={24} />
              <span>Proposals</span>
            </div>
            <div className="stat-value">{dashboardStats.totalProposals}</div>
            <div className="stat-detail">
              {dashboardStats.pendingProposals} pending
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <DollarSign size={24} />
              <span>Total Raised</span>
            </div>
            <div className="stat-value">{formatAmount(dashboardStats.totalDonations)}</div>
            <div className="stat-detail">
              sats across all time
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <Users size={24} />
              <span>Contributors</span>
            </div>
            <div className="stat-value">{dashboardStats.uniqueContributors}</div>
            <div className="stat-detail">
              active developers
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <TrendingUp size={24} />
              <span>Success Rate</span>
            </div>
            <div className="stat-value">{dashboardStats.successRate}%</div>
            <div className="stat-detail">
              proposals implemented
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading statistics...</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="development-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Development Center</h1>
          <p>Manage proposals, donations, and development activities for {channelName}</p>
        </div>
      </div>      <div className="dashboard-tabs" role="tablist">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <TabIcon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="dashboard-content">
        {activeTab === 'proposals' && renderProposalsTab()}
        {activeTab === 'donations' && renderDonationsTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </div>
    </div>
  );
};

export default DevelopmentDashboard;
