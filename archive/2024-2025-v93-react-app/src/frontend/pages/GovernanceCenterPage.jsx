import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const GovernanceCenterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [activeTab, setActiveTab] = useState('overview');

  const governanceStats = [
    { label: 'Active Committees', value: '12', icon: '🏛️' },
    { label: 'Open Proposals', value: '47', icon: '📋' },
    { label: 'Community Members', value: '3,247', icon: '👥' },
    { label: 'Decisions This Month', value: '128', icon: '✅' }
  ];

  const activeCommittees = [
    {
      id: 1,
      name: "Digital Infrastructure Committee",
      description: "Overseeing technology upgrades and digital democracy initiatives across Israel",
      members: 15,
      chair: "Dr. Sarah Cohen",
      location: "National",
      nextMeeting: "Tomorrow, 2:00 PM",
      recentDecisions: 8,
      status: "Active"
    },
    {
      id: 2,
      name: "Environmental Policy Board",
      description: "Developing sustainable environmental policies and green energy initiatives",
      members: 12,
      chair: "Michael Rosen",
      location: "Regional",
      nextMeeting: "Jan 15, 10:00 AM",
      recentDecisions: 12,
      status: "Active"
    },
    {
      id: 3,
      name: "Community Safety Council",
      description: "Coordinating community safety measures and emergency response protocols",
      members: 18,
      chair: "Rachel Ben-David",
      location: "Municipal",
      nextMeeting: "Jan 12, 4:00 PM",
      recentDecisions: 5,
      status: "Active"
    }
  ];

  const recentProposals = [
    {
      id: 1,
      title: "Enhanced Biometric Privacy Protection Act",
      author: "Privacy Rights Committee",
      category: "Privacy & Security",
      stage: "Committee Review",
      support: 89,
      daysActive: 12,
      description: "Strengthening privacy protections for biometric data processing in democratic systems"
    },
    {
      id: 2,
      title: "Community Center Accessibility Upgrade",
      author: "Accessibility Coalition",
      category: "Infrastructure",
      stage: "Public Comment",
      support: 95,
      daysActive: 8,
      description: "Mandatory accessibility improvements for all community centers and voting locations"
    },
    {
      id: 3,
      title: "Transparent Government Data Initiative",
      author: "Open Democracy Group",
      category: "Transparency",
      stage: "Final Review",
      support: 76,
      daysActive: 25,
      description: "Requiring all government data to be publicly accessible through blockchain verification"
    }
  ];

  const upcomingMeetings = [
    {
      id: 1,
      committee: "Digital Infrastructure Committee",
      topic: "Biometric Authentication Standards Review",
      date: "Tomorrow",
      time: "2:00 PM",
      location: "Tel Aviv Community Center",
      isPublic: true
    },
    {
      id: 2,
      committee: "Community Safety Council",
      topic: "Emergency Response Protocol Updates",
      date: "Jan 12",
      time: "4:00 PM",
      location: "Jerusalem Civic Center",
      isPublic: true
    },
    {
      id: 3,
      committee: "Environmental Policy Board",
      topic: "Green Energy Implementation Plan",
      date: "Jan 15",
      time: "10:00 AM",
      location: "Haifa Municipal Building",
      isPublic: true
    }
  ];

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Committee Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Public Comment':
        return 'bg-blue-100 text-blue-800';
      case 'Final Review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewCommittee = (committee) => {
    if (isPreview) {
      navigate('/onboarding');
      return;
    }
    // Normal committee viewing for authenticated users
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isPreview) {
    return (
      <>
        <Helmet>
          <title>Governance Center Preview - Relay Platform</title>
          <meta name="description" content="Preview democratic governance and committee structures" />
        </Helmet>
        
        <div className="min-h-screen bg-off-white">
          {/* Preview Header */}
          <div className="bg-primary-blue text-white p-4">
            <div className="container flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Governance Center - Preview Mode</h1>
                <p className="text-white/80">Explore democratic governance and committee processes (read-only)</p>
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
              <h3 className="text-primary mb-2">🏛️ Preview Mode Active</h3>
              <p className="text-secondary">
                You're viewing real governance data in read-only mode. 
                <button 
                  onClick={() => navigate('/onboarding')}
                  className="text-primary-blue font-semibold ml-1 hover:underline"
                >
                  Join Relay
                </button> to participate in democratic governance.
              </p>
            </div>

            {/* Governance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {governanceStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg p-6 text-center">
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-primary-blue mb-2">{stat.value}</div>
                  <div className="text-sm text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Navigation Tabs */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-4 mb-6">
                {['overview', 'committees', 'proposals', 'meetings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Committees */}
            {activeTab === 'overview' || activeTab === 'committees' ? (
              <div className="mb-8">
                <h3 className="text-primary text-2xl font-bold mb-6">Active Committees</h3>
                <div className="space-y-6">
                  {activeCommittees.map((committee) => (
                    <div key={committee.id} className="card hover:shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-primary font-semibold text-lg">{committee.name}</h4>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {committee.status}
                            </span>
                          </div>
                          <p className="text-secondary mb-4">{committee.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-secondary mb-4">
                            <div>
                              <span className="font-medium">Chair:</span> {committee.chair}
                            </div>
                            <div>
                              <span className="font-medium">Members:</span> {committee.members}
                            </div>
                            <div>
                              <span className="font-medium">Scope:</span> {committee.location}
                            </div>
                            <div>
                              <span className="font-medium">Decisions:</span> {committee.recentDecisions} this month
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-primary-blue">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"/>
                              </svg>
                              Next Meeting: {committee.nextMeeting}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-primary-blue text-white px-2 py-1 rounded">
                            Democratic Process
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Public Meetings
                          </span>
                        </div>
                        <button 
                          onClick={() => handleViewCommittee(committee)}
                          className="btn btn-primary btn-small"
                        >
                          Join to Participate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Recent Proposals */}
            {activeTab === 'overview' || activeTab === 'proposals' ? (
              <div className="mb-8">
                <h3 className="text-primary text-2xl font-bold mb-6">Recent Proposals</h3>
                <div className="space-y-4">
                  {recentProposals.map((proposal) => (
                    <div key={proposal.id} className="card hover:shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-primary font-semibold text-lg">{proposal.title}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(proposal.stage)}`}>
                              {proposal.stage}
                            </span>
                          </div>
                          <p className="text-secondary mb-3">{proposal.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-secondary">
                            <span>👤 {proposal.author}</span>
                            <span>📊 {proposal.support}% support</span>
                            <span>📅 {proposal.daysActive} days active</span>
                            <span>🏷️ {proposal.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                          <div 
                            className="bg-primary-blue h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${proposal.support}%` }}
                          ></div>
                        </div>
                        <button 
                          onClick={() => navigate('/onboarding')}
                          className="btn btn-primary btn-small"
                        >
                          Review Proposal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Upcoming Meetings */}
            {activeTab === 'overview' || activeTab === 'meetings' ? (
              <div className="mb-8">
                <h3 className="text-primary text-2xl font-bold mb-6">Upcoming Public Meetings</h3>
                <div className="bg-white rounded-lg p-6">
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <h4 className="font-semibold text-primary mb-1">{meeting.committee}</h4>
                          <p className="text-secondary text-sm mb-2">{meeting.topic}</p>
                          <div className="flex items-center gap-4 text-sm text-secondary">
                            <span>📅 {meeting.date}</span>
                            <span>🕐 {meeting.time}</span>
                            <span>📍 {meeting.location}</span>
                            {meeting.isPublic && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Public Welcome
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate('/onboarding')}
                          className="btn btn-secondary btn-small"
                        >
                          Attend Meeting
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Democratic Process Info */}
            <div className="bg-gradient-to-r from-primary-blue to-secondary-blue text-white rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">How Democratic Governance Works on Relay</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"/>
                    </svg>
                  </div>
                  <h4 className="font-bold mb-2">1. Propose</h4>
                  <p className="text-white/90">Submit proposals for community consideration</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"/>
                    </svg>
                  </div>
                  <h4 className="font-bold mb-2">2. Deliberate</h4>
                  <p className="text-white/90">Discuss in committees and public forums</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"/>
                    </svg>
                  </div>
                  <h4 className="font-bold mb-2">3. Decide</h4>
                  <p className="text-white/90">Vote with secure biometric verification</p>
                </div>
              </div>
            </div>

            {/* Join CTA */}
            <div className="bg-primary-blue text-white rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Shape Your Community?</h3>
              <p className="text-white/90 mb-6">
                Join committees, propose initiatives, and participate in democratic governance. Your voice matters in building the future.
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
        <title>Governance Center - Relay Platform</title>
        <meta name="description" content="Participate in democratic governance and committees" />
      </Helmet>
      
      <div className="min-h-screen bg-off-white">
        <div className="container py-8">
          <h1 className="text-3xl font-bold text-primary mb-8">Governance Center</h1>
          <p className="text-secondary mb-8">Participate in democratic governance and community decision-making</p>
          
          <div className="space-y-6">
            {activeCommittees.map((committee) => (
              <div key={committee.id} className="card hover:shadow-lg">
                <h3 className="text-primary font-semibold text-xl mb-2">{committee.name}</h3>
                <p className="text-secondary mb-4">{committee.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {committee.status}
                  </span>
                  <button 
                    onClick={() => handleViewCommittee(committee)}
                    className="btn btn-primary btn-small"
                  >
                    Join Committee
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

export default GovernanceCenterPage; 