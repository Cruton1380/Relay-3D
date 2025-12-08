import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFounder = searchParams.get('founder') === 'true';
  const [founderData, setFounderData] = useState(null);
  const [systemStatus, setSystemStatus] = useState('initializing');
  const { user } = useAuth();

  useEffect(() => {
    // Check for founder account setup
    if (isFounder) {
      const storedFounderData = localStorage.getItem('founderAccount');
      if (storedFounderData) {
        setFounderData(JSON.parse(storedFounderData));
        setSystemStatus('active');
      }
    }
  }, [isFounder]);

  const handleExploreChannels = () => {
    navigate('/channels');
  };

  const handleGovernanceCenter = () => {
    navigate('/governance');
  };

  const handleVotingDashboard = () => {
    navigate('/voting');
  };

  const handleFounderSettings = () => {
    navigate('/founder-dashboard');
  };

  if (isFounder && founderData) {
    return (
      <>
        <Helmet>
          <title>Founder Dashboard - Relay Platform</title>
          <meta name="description" content="Relay network founder dashboard and system administration" />
        </Helmet>
        
        <div className="min-h-screen bg-off-white">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-8">
            <div className="container">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                  </svg>
                </div>
                <h1 className="text-4xl font-bold mb-4">🎉 Founder Setup Complete!</h1>
                <p className="text-xl text-white/90 mb-4">
                  Welcome, {founderData.name}! You've successfully bootstrapped the Relay network.
                </p>
                <div className="inline-flex items-center bg-white/20 rounded-full px-6 py-2">
                  <svg className="w-5 h-5 mr-2 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                  </svg>
                  <span className="font-semibold">Founder Privileges Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Actions */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Quick Actions */}
                <div className="card">
                  <h3 className="text-primary font-bold text-xl mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <button 
                      onClick={handleExploreChannels}
                      className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Explore Channels</h4>
                        <p className="text-secondary text-sm">Browse Topic-Row competitions</p>
                      </div>
                    </button>

                    <button 
                      onClick={handleVotingDashboard}
                      className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Voting Dashboard</h4>
                        <p className="text-secondary text-sm">View active proposals</p>
                      </div>
                    </button>

                    <button 
                      onClick={handleGovernanceCenter}
                      className="flex items-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Governance Center</h4>
                        <p className="text-secondary text-sm">Democratic decision making</p>
                      </div>
                    </button>

                    <button 
                      onClick={handleFounderSettings}
                      className="flex items-center p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Founder Settings</h4>
                        <p className="text-secondary text-sm">System administration</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Network Status */}
                <div className="card">
                  <h3 className="text-primary font-bold text-xl mb-4">Network Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">1</div>
                      <div className="text-sm text-green-700">Active Users</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-blue-700">Channels</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-purple-700">Proposals</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">100%</div>
                      <div className="text-sm text-orange-700">System Health</div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="card">
                  <h3 className="text-primary font-bold text-xl mb-4">Next Steps</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-1">Create Your First Channel</h4>
                        <p className="text-secondary text-sm">Start building your community by creating channels for discussion topics</p>
                        <button 
                          onClick={handleExploreChannels}
                          className="text-blue-600 text-sm font-medium hover:underline mt-2"
                        >
                          Create Channel →
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-1">Invite Community Members</h4>
                        <p className="text-secondary text-sm">Use your founder privileges to invite the first users to your network</p>
                        <button 
                          onClick={handleFounderSettings}
                          className="text-green-600 text-sm font-medium hover:underline mt-2"
                        >
                          Manage Invites →
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-1">Configure Governance</h4>
                        <p className="text-secondary text-sm">Set up democratic rules and proposal systems for your community</p>
                        <button 
                          onClick={handleGovernanceCenter}
                          className="text-purple-600 text-sm font-medium hover:underline mt-2"
                        >
                          Setup Governance →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Founder Status Panel */}
              <div className="space-y-6">
                
                {/* Founder Info */}
                <div className="card">
                  <h3 className="text-primary font-bold text-lg mb-4">Founder Account</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Name:</span>
                      <span className="font-medium text-primary">{founderData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Email:</span>
                      <span className="font-medium text-primary">{founderData.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Status:</span>
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active Founder
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Created:</span>
                      <span className="font-medium text-primary">
                        {new Date(founderData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Founder Privileges */}
                <div className="card">
                  <h3 className="text-primary font-bold text-lg mb-4">Active Privileges</h3>
                  <div className="space-y-2">
                    {founderData.privileges.map((privilege, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                        </svg>
                        <span className="text-secondary">
                          {privilege.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="card">
                  <h3 className="text-primary font-bold text-lg mb-4">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Blockchain:</span>
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Voting System:</span>
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Security:</span>
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Secured
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Network:</span>
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Regular user dashboard
  return (
    <>
      <Helmet>
        <title>Dashboard - Relay Platform</title>
        <meta name="description" content="Your Relay platform dashboard" />
      </Helmet>
      
      <div className="min-h-screen bg-off-white">
        <div className="container py-8">
          <h1 className="text-3xl font-bold text-primary mb-8">Welcome to Relay</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={handleExploreChannels}
              className="card hover:shadow-lg transition-shadow text-center p-8"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Channels</h3>
              <p className="text-secondary">Explore community discussions</p>
            </button>

            <button 
              onClick={handleVotingDashboard}
              className="card hover:shadow-lg transition-shadow text-center p-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Voting</h3>
              <p className="text-secondary">Participate in decisions</p>
            </button>

            <button 
              onClick={handleGovernanceCenter}
              className="card hover:shadow-lg transition-shadow text-center p-8"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Governance</h3>
              <p className="text-secondary">Democratic governance</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
