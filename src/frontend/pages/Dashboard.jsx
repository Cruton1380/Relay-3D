// frontend/pages/dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSessionSync } from '../auth/hooks/useSessionSync';
import BiometricStatus from '../components/biometrics/BiometricStatus';
import { checkReverificationStatus } from '../services/biometricAPI';
import Globe from '../components/visualizations/Globe';
import Timeline from '../components/visualizations/Timeline';
import MicroshardingVisualization from '../components/visualizations/MicroshardingVisualization';
import InviteTreeVisualization from '../components/visualizations/InviteTreeVisualization';
import SystemHealthDashboard from '../components/visualizations/SystemHealthDashboard';
import VotingVisualization from '../components/visualizations/VotingVisualization';
import NetworkTopologyVisualization from '../components/visualizations/NetworkTopologyVisualization';
import UserActivityAnalytics from '../components/visualizations/UserActivityAnalytics';
import RegionalHeatmap from '../components/visualizations/RegionalHeatmap';
import CandidateMomentum from '../components/visualizations/CandidateMomentum';
import FilterSystem from '../components/filters/FilterSystem';
import TutorialSystem from '../components/tutorial/TutorialSystem';
import VoteResultsDisplay from '../components/shared/VoteResultsDisplay';
import InviteManager from '../components/admin/InviteManager';
import AdvancedAnalyticsDashboard from '../components/visualizations/AdvancedAnalyticsDashboard';
import './Dashboard.css';

export default function Dashboard() {
  const { user, authLevel, isAuthenticated } = useAuth();  const [needsReverification, setNeedsReverification] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFilters, setActiveFilters] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalVotes: 0,
    activeUsers: 0,
    networkHealth: 100,
    shardingEfficiency: 95
  });
  
  // Set up session sync
  useSessionSync();
  
  useEffect(() => {
    async function checkBiometricStatus() {
      if (!isAuthenticated) return;
      
      try {
        const result = await checkReverificationStatus();
        setNeedsReverification(result.needsReverification);
      } catch (error) {
        console.error('Failed to check reverification status:', error);
      }
    }
    
    async function fetchSystemStats() {
      try {
        // Fetch system statistics from various services
        const response = await fetch('/api/system/stats');
        if (response.ok) {
          const stats = await response.json();
          setSystemStats(stats);
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    }
    
    checkBiometricStatus();
    fetchSystemStats();
    
    // Refresh stats every 30 seconds
    const statsInterval = setInterval(fetchSystemStats, 30000);
    
    return () => clearInterval(statsInterval);
  }, [isAuthenticated]);
  
  if (!isAuthenticated) {
    return (
      <div className="dashboard-login-prompt">
        <div className="login-card">
          <h2>Access Required</h2>
          <p>Please log in to access the Relay Platform Dashboard</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'voting', label: 'Voting', icon: '🗳️' },
    { id: 'regional', label: 'Regional', icon: '🗺️' },
    { id: 'momentum', label: 'Momentum', icon: '📈' },
    { id: 'filters', label: 'Filters', icon: '🔍' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'sharding', label: 'Microsharding', icon: '🔀' },
    { id: 'invites', label: 'Invite Tree', icon: '🌳' },
    { id: 'health', label: 'System Health', icon: '💚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'admin', label: 'Admin', icon: '⚙️', adminOnly: true }
  ];

  const visibleTabs = tabConfig.filter(tab => 
    !tab.adminOnly || (authLevel === 'admin' || authLevel === 'superuser')
  );
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">          <div className="user-info">
            <h1>Relay Platform Dashboard</h1>
            <p>Welcome back, <strong>{user}</strong></p>
            <span className={`auth-badge ${authLevel}`}>
              {authLevel.charAt(0).toUpperCase() + authLevel.slice(1)} Access
            </span>
            <button 
              className="tutorial-button"
              onClick={() => setShowTutorial(true)}
              title="Show Tutorial"
            >
              📚 Tutorial
            </button>
          </div>
          
          <div className="system-overview">
            <div className="stat-card">
              <span className="stat-value">{systemStats.totalVotes}</span>
              <span className="stat-label">Total Votes</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{systemStats.activeUsers}</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{systemStats.networkHealth}%</span>
              <span className="stat-label">Network Health</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{systemStats.shardingEfficiency}%</span>
              <span className="stat-label">Sharding Efficiency</span>
            </div>
          </div>
        </div>
        
        {needsReverification && (
          <BiometricStatus 
            status="requires-reverification" 
            message="Your biometric verification requires updating" 
          />
        )}
      </header>
      
      <nav className="dashboard-navigation">
        <div className="tab-list">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
      
      <main className="dashboard-content">        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="visualization-panel large">
              <h2>Global Activity</h2>
              <Globe height={400} width={600} />
            </div>
            
            <div className="visualization-panel large">
              <h2>Regional Voting Activity</h2>
              <RegionalHeatmap height={400} width={600} />
            </div>
            
            <div className="visualization-panel">
              <h2>Activity Timeline</h2>
              <Timeline height={300} width={500} />
            </div>
            
            <div className="visualization-panel">
              <h2>Candidate Momentum</h2>
              <CandidateMomentum height={300} width={500} />
            </div>
            
            <div className="visualization-panel">
              <h2>Recent Voting Results</h2>
              <VoteResultsDisplay 
                showForeignVotes={true} 
                maxChoices={5}
                refreshInterval={10000}
              />
            </div>
            
            <div className="system-status-panel">
              <h2>System Status</h2>
              <SystemHealthDashboard compact={true} />
            </div>
          </div>
        )}
        
        {activeTab === 'voting' && (
          <div className="voting-dashboard">
            <VotingVisualization />
          </div>
        )}
        
        {activeTab === 'regional' && (
          <div className="regional-dashboard">
            <div className="dashboard-grid">
              <div className="visualization-panel full-width">
                <h2>Regional Voting Heatmap</h2>
                <RegionalHeatmap height={600} width={1200} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'momentum' && (
          <div className="momentum-dashboard">
            <div className="dashboard-grid">
              <div className="visualization-panel full-width">
                <h2>Candidate Momentum Analysis</h2>
                <CandidateMomentum height={600} width={1200} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'filters' && (
          <div className="filters-dashboard">
            <FilterSystem 
              onFiltersChange={setActiveFilters}
              activeFilters={activeFilters}
            />
          </div>
        )}
        
        {activeTab === 'network' && (
          <div className="network-dashboard">
            <NetworkTopologyVisualization />
          </div>
        )}
        
        {activeTab === 'sharding' && (
          <div className="sharding-dashboard">
            <MicroshardingVisualization />
          </div>
        )}
        
        {activeTab === 'invites' && (
          <div className="invites-dashboard">
            <InviteTreeVisualization />
          </div>
        )}
        
        {activeTab === 'health' && (
          <div className="health-dashboard">
            <SystemHealthDashboard />
          </div>
        )}
          {activeTab === 'analytics' && (
          <div className="analytics-dashboard">
            <AdvancedAnalyticsDashboard
              realTimeUpdates={true}
              compact={false}
            />
          </div>
        )}
        
        {activeTab === 'admin' && (authLevel === 'admin' || authLevel === 'superuser') && (
          <div className="admin-dashboard">
            <div className="admin-grid">
              <div className="admin-panel">
                <h2>Invite Management</h2>
                <InviteManager />
              </div>
              
              <div className="admin-panel">
                <h2>System Configuration</h2>
                <p>System configuration panel will be implemented here</p>
              </div>
            </div>          </div>
        )}
      </main>
      
      {/* Tutorial System */}
      {showTutorial && (
        <TutorialSystem 
          onComplete={() => setShowTutorial(false)}
          showOnFirstVisit={true}
        />
      )}
    </div>
  );
}
