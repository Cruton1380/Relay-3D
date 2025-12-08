/**
 * Governance Panel - Democratic Governance Interface
 * Migrated from legacy GovernanceCenterPage.jsx
 * Provides committee management, proposal tracking, and democratic decision-making
 */
import React, { useState, useEffect } from 'react';

const GovernancePanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPreview, setIsPreview] = useState(true);

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
    console.log('Viewing committee:', committee.name);
    // TODO: Implement committee detail view
  };

  const handleViewProposal = (proposal) => {
    console.log('Viewing proposal:', proposal.title);
    // TODO: Implement proposal detail view
  };

  const handleJoinMeeting = (meeting) => {
    console.log('Joining meeting:', meeting.topic);
    // TODO: Implement meeting join functionality
  };

  return (
    <div className="governance-panel">
      {/* Header */}
      <div className="governance-header">
        <h2 className="text-2xl font-bold text-primary-blue mb-2">🏛️ Governance Center</h2>
        <p className="text-secondary mb-4">Participate in democratic governance and community decision-making</p>
        
        {isPreview && (
          <div className="bg-blue-50 border-l-4 border-primary-blue p-4 mb-6">
            <h3 className="text-primary-blue font-semibold mb-2">Preview Mode Active</h3>
            <p className="text-secondary">
              You're viewing governance data in read-only mode. Join Relay to participate in democratic governance.
            </p>
          </div>
        )}
      </div>

      {/* Governance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {governanceStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-xl font-bold text-primary-blue mb-1">{stat.value}</div>
            <div className="text-xs text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {['overview', 'committees', 'proposals', 'meetings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-primary-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="governance-content">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">New proposal submitted: "Enhanced Biometric Privacy Protection Act"</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Digital Infrastructure Committee meeting scheduled for tomorrow</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Community Safety Council reached consensus on emergency protocols</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-3 bg-primary-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  📋 Submit Proposal
                </button>
                <button className="p-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  🏛️ Join Committee
                </button>
                <button className="p-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  📅 Schedule Meeting
                </button>
                <button className="p-3 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                  📊 View Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'committees' && (
          <div className="space-y-4">
            {activeCommittees.map((committee) => (
              <div key={committee.id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-blue">{committee.name}</h3>
                    <p className="text-secondary text-sm mb-2">{committee.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-secondary">
                      <span>👥 {committee.members} members</span>
                      <span>📍 {committee.location}</span>
                      <span>✅ {committee.recentDecisions} recent decisions</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {committee.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-secondary">
                    <p>Chair: {committee.chair}</p>
                    <p>Next Meeting: {committee.nextMeeting}</p>
                  </div>
                  <button
                    onClick={() => handleViewCommittee(committee)}
                    className="px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {recentProposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">{proposal.title}</h3>
                    <p className="text-secondary text-sm mb-3">{proposal.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-secondary">
                      <span>👤 {proposal.author}</span>
                      <span>📂 {proposal.category}</span>
                      <span>📅 {proposal.daysActive} days active</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(proposal.stage)}`}>
                      {proposal.stage}
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-2">{proposal.support}%</div>
                    <div className="text-xs text-secondary">Support</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${proposal.support}%` }}
                    ></div>
                  </div>
                  <button
                    onClick={() => handleViewProposal(proposal)}
                    className="ml-4 px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">{meeting.committee}</h3>
                    <p className="text-secondary text-sm mb-3">{meeting.topic}</p>
                    <div className="flex items-center space-x-4 text-xs text-secondary">
                      <span>📅 {meeting.date}</span>
                      <span>🕐 {meeting.time}</span>
                      <span>📍 {meeting.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {meeting.isPublic ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Public
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-secondary">
                    {meeting.isPublic ? "Open to all community members" : "Committee members only"}
                  </div>
                  <button
                    onClick={() => handleJoinMeeting(meeting)}
                    className="px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Join Meeting
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernancePanel; 