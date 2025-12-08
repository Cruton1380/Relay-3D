/**
 * @fileoverview Voting Dashboard Page
 * Main page for democratic voting and topic row competitions
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const VotingDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [activeTab, setActiveTab] = useState('active');

  const sampleProposals = [
    {
      id: 1,
      title: "Community Center Renovation Project",
      description: "Proposal to renovate the Tel Aviv community center with improved accessibility features and modern meeting spaces for democratic gatherings.",
      author: "Tel Aviv Community Board",
      category: "Infrastructure",
      status: "Active",
      votes: { yes: 347, no: 23, abstain: 12 },
      totalVoters: 382,
      eligibleVoters: 450,
      timeRemaining: "2 days, 14 hours",
      location: "Tel Aviv",
      impact: "High",
      proposalDate: "2025-01-05",
      verified: true
    },
    {
      id: 2,
      title: "Environmental Protection Initiative",
      description: "Implementation of new recycling programs and green energy initiatives across all community centers in Israel.",
      author: "Environmental Committee",
      category: "Environment",
      status: "Active",
      votes: { yes: 892, no: 156, abstain: 45 },
      totalVoters: 1093,
      eligibleVoters: 1200,
      timeRemaining: "5 days, 8 hours",
      location: "National",
      impact: "Very High",
      proposalDate: "2025-01-03",
      verified: true
    },
    {
      id: 3,
      title: "Digital Education Platform Enhancement",
      description: "Upgrade biometric authentication systems in schools and implement new democratic learning modules for civic education.",
      author: "Education Ministry Representative",
      category: "Education",
      status: "Pending Review",
      votes: { yes: 234, no: 67, abstain: 19 },
      totalVoters: 320,
      eligibleVoters: 500,
      timeRemaining: "1 day, 3 hours",
      location: "Jerusalem",
      impact: "Medium",
      proposalDate: "2025-01-07",
      verified: true
    }
  ];

  const recentVoteActivity = [
    {
      id: 1,
      voter: "Community Member #2847",
      action: "voted YES",
      proposal: "Community Center Renovation",
      timestamp: "3 minutes ago",
      verified: true
    },
    {
      id: 2,
      voter: "Community Member #1934",
      action: "voted YES",
      proposal: "Environmental Protection Initiative",
      timestamp: "7 minutes ago",
      verified: true
    },
    {
      id: 3,
      voter: "Community Member #5621",
      action: "voted NO",
      proposal: "Digital Education Platform Enhancement",
      timestamp: "12 minutes ago",
      verified: true
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'Very High':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateProgress = (votes) => {
    const total = votes.yes + votes.no + votes.abstain;
    return total > 0 ? (votes.yes / total) * 100 : 0;
  };

  const handleViewProposal = (proposal) => {
    if (isPreview) {
      navigate('/onboarding');
      return;
    }
    // Normal proposal viewing for authenticated users
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isPreview) {
    return (
      <>
        <Helmet>
          <title>Voting Dashboard Preview - Relay Platform</title>
          <meta name="description" content="Preview democratic voting and proposals" />
        </Helmet>
        
        <div className="min-h-screen bg-off-white">
          {/* Preview Header */}
          <div className="bg-primary-blue text-white p-4">
            <div className="container flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Voting Dashboard - Preview Mode</h1>
                <p className="text-white/80">View active proposals and democratic voting processes (read-only)</p>
              </div>
              <button 
                onClick={handleBackToHome}
                className="btn btn-secondary"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          <div className="container py-8">
            <div className="bg-white rounded-lg p-6 mb-8 border-l-4 border-primary-blue">
              <h3 className="text-primary mb-2">🗳️ Preview Mode Active</h3>
              <p className="text-secondary">
                You're viewing real voting data in read-only mode. 
                <button 
                  onClick={() => navigate('/onboarding')}
                  className="text-primary-blue font-semibold ml-1 hover:underline"
                >
                  Join Relay
                </button> to participate in democratic voting.
              </p>
            </div>

            {/* Voting Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary-blue mb-2">12</div>
                <div className="text-sm text-secondary">Active Proposals</div>
              </div>
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">2,847</div>
                <div className="text-sm text-secondary">Votes Cast Today</div>
              </div>
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">91%</div>
                <div className="text-sm text-secondary">Participation Rate</div>
              </div>
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-sm text-secondary">Verified Secure</div>
              </div>
            </div>

            {/* Proposal Tabs */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-4 mb-6">
                {['active', 'pending', 'completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Proposals
                  </button>
                ))}
              </div>
            </div>

            {/* Active Proposals */}
            <div className="space-y-6 mb-8">
              {sampleProposals.map((proposal) => (
                <div key={proposal.id} className="card hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-primary font-semibold text-xl">{proposal.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                        {proposal.verified && (
                          <svg className="w-5 h-5 text-primary-blue" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z"/>
                          </svg>
                        )}
                      </div>
                      <p className="text-secondary mb-4">{proposal.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-secondary mb-4">
                        <span>📍 {proposal.location}</span>
                        <span>👤 {proposal.author}</span>
                        <span className={`font-semibold ${getImpactColor(proposal.impact)}`}>
                          Impact: {proposal.impact}
                        </span>
                        <span>⏰ {proposal.timeRemaining}</span>
                      </div>
                    </div>
                  </div>

                  {/* Voting Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-secondary">Voting Progress</span>
                      <span className="text-sm text-secondary">
                        {proposal.totalVoters} / {proposal.eligibleVoters} voters
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-primary-blue h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${(proposal.totalVoters / proposal.eligibleVoters) * 100}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">{proposal.votes.yes}</div>
                        <div className="text-sm text-green-700">Yes ({Math.round((proposal.votes.yes / proposal.totalVoters) * 100)}%)</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-600">{proposal.votes.no}</div>
                        <div className="text-sm text-red-700">No ({Math.round((proposal.votes.no / proposal.totalVoters) * 100)}%)</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-600">{proposal.votes.abstain}</div>
                        <div className="text-sm text-gray-700">Abstain ({Math.round((proposal.votes.abstain / proposal.totalVoters) * 100)}%)</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        proposal.category === 'Infrastructure' ? 'bg-blue-100 text-blue-800' :
                        proposal.category === 'Environment' ? 'bg-green-100 text-green-800' :
                        proposal.category === 'Education' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.category}
                      </span>
                      <span className="text-xs bg-primary-blue text-white px-2 py-1 rounded">Blockchain Verified</span>
                    </div>
                    <button 
                      onClick={() => handleViewProposal(proposal)}
                      className="btn btn-primary btn-small"
                    >
                      Vote to Participate
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Voting Activity */}
            <div className="bg-white rounded-lg p-6 mb-8">
              <h3 className="text-primary mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"/>
                </svg>
                Live Voting Activity
              </h3>
              
              <div className="space-y-3">
                {recentVoteActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{activity.voter}</div>
                        <div className="text-sm text-secondary">
                          {activity.action} on "{activity.proposal}"
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-secondary">{activity.timestamp}</span>
                      {activity.verified && (
                        <svg className="w-4 h-4 text-primary-blue" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join CTA */}
            <div className="bg-primary-blue text-white rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Make Your Voice Heard?</h3>
              <p className="text-white/90 mb-6">
                Join the democratic process. Vote on proposals, create initiatives, and help shape your community's future.
              </p>
              <button 
                onClick={() => navigate('/onboarding')}
                className="btn btn-secondary btn-large"
              >
                Join Relay Network
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Regular authenticated user view
  return (
    <>
      <Helmet>
        <title>Voting Dashboard - Relay Platform</title>
        <meta name="description" content="Participate in democratic voting and governance" />
      </Helmet>
      
      <div className="min-h-screen bg-off-white">
        <div className="container py-8">
          <h1 className="text-3xl font-bold text-primary mb-8">Voting Dashboard</h1>
          <p className="text-secondary mb-8">Participate in democratic decision-making</p>
          
          <div className="space-y-6">
            {sampleProposals.map((proposal) => (
              <div key={proposal.id} className="card hover:shadow-lg">
                <h3 className="text-primary font-semibold text-xl mb-2">{proposal.title}</h3>
                <p className="text-secondary mb-4">{proposal.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </span>
                  <button 
                    onClick={() => handleViewProposal(proposal)}
                    className="btn btn-primary btn-small"
                  >
                    View & Vote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default VotingDashboardPage; 