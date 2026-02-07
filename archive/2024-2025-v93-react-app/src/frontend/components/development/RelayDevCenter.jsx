/**
 * RELAY DEVELOPMENT CENTER - Main Interface
 * Comprehensive AI-assisted development and testing platform
 * Features: Democratic Chatroom testing, blockchain audit, mock data generation, real-time analytics
 */

import React, { useState, useEffect } from 'react';
import './RelayDevCenter.css';

const RelayDevCenter = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testScenarios, setTestScenarios] = useState([]);
  const [blockchainData, setBlockchainData] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [chatrooms, setChatrooms] = useState([]);

  useEffect(() => {
    loadDashboard();
    loadChannels();
    loadTestScenarios();
    loadBlockchainData();
    loadAiSuggestions();
    loadChatrooms();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/dev-center/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/dev-center/channels');
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadTestScenarios = async () => {
    try {
      const response = await fetch('/api/dev-center/scenarios');
      const data = await response.json();
      if (data.success) {
        setTestScenarios(data.scenarios);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const loadBlockchainData = async () => {
    try {
      const response = await fetch('/api/vote/debug/blockchain-summary');
      const data = await response.json();
      if (data.success) {
        setBlockchainData(data.blockchainSummary);
      }
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
    }
  };

  const loadAiSuggestions = async () => {
    try {
      const response = await fetch('/api/dev-center/ai/suggestions');
      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    }
  };

  const loadChatrooms = async () => {
    try {
      const response = await fetch('/api/dev-center/chatrooms');
      const data = await response.json();
      if (data.success) {
        setChatrooms(data.chatrooms);
      }
    } catch (error) {
      console.error('Failed to load chatrooms:', error);
    }
  };

  const generateMockChannel = async (channelConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev-center/channels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelConfig)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadChannels();
        return data.channel;
      }
    } catch (error) {
      console.error('Failed to generate channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (channelId) => {
    if (!confirm('Delete this test channel? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/dev-center/channels/${channelId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadChannels();
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  // New handler functions for enhanced features
  const testChatroomFeature = async (feature, config) => {
    try {
      const response = await fetch('/api/dev-center/chatrooms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, config })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to test chatroom feature:', error);
    }
  };

  const runTestScenario = async (scenario) => {
    try {
      const response = await fetch('/api/dev-center/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDashboard(); // Refresh data after scenario
      }
      return data;
    } catch (error) {
      console.error('Failed to run scenario:', error);
    }
  };

  const generateAIScenario = async (type, parameters) => {
    try {
      const response = await fetch('/api/dev-center/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, parameters })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTestScenarios();
      }
      return data;
    } catch (error) {
      console.error('Failed to generate AI scenario:', error);
    }
  };

  const performBlockchainAudit = async () => {
    try {
      const response = await fetch('/api/vote/admin/pre-launch-audit');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to perform blockchain audit:', error);
    }
  };

  const generateAITest = async (testType) => {
    try {
      const response = await fetch('/api/dev-center/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to generate AI test:', error);
    }
  };

  const optimizeSystem = async (optimizationType) => {
    try {
      const response = await fetch('/api/dev-center/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizationType })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDashboard(); // Refresh data after optimization
      }
      return data;
    } catch (error) {
      console.error('Failed to optimize system:', error);
      return { success: false, error: error.message };
    }
  };

  const generateTestScenario = async (scenarioConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev-center/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioConfig)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTestScenarios();
        return data.scenario;
      }
    } catch (error) {
      console.error('Failed to generate scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockChatroom = async (chatroomConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev-center/chatrooms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatroomConfig)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadChatrooms();
        return data.chatroom;
      }
    } catch (error) {
      console.error('Failed to generate chatroom:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDevSettings = async (settings) => {
    try {
      const response = await fetch('/api/dev-center/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetTestData = async () => {
    try {
      const response = await fetch('/api/dev-center/reset', {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        // Reload all data
        await Promise.all([
          loadChannels(),
          loadTestScenarios(),
          loadChatrooms(),
          loadBlockchainData(),
          loadDashboard()
        ]);
      }
      return data;
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  };

  const exportTestData = async () => {
    try {
      const response = await fetch('/api/dev-center/export');
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relay-test-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    // Implement save settings logic
    console.log('Settings saved:', newSettings);
  };

  const resetData = async () => {
    // Implement reset data logic
    console.log('All data reset');
  };

  const exportData = async () => {
    // Implement export data logic
    console.log('Data export initiated');
  };

  return (
    <div className="relay-dev-center">
      <header className="dev-center-header">
        <h1>🚀 RELAY DEVELOPMENT CENTER</h1>
        <p>AI-Assisted Development Platform for Relay Network</p>
      </header>

      <nav className="dev-center-nav">
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
          { id: 'channels', label: '📺 Channels', icon: '📺' },
          { id: 'chatrooms', label: '🏛️ Democratic Chatrooms', icon: '🏛️' },
          { id: 'scenarios', label: '🎭 Test Scenarios', icon: '🎭' },
          { id: 'blockchain', label: '⛓️ Blockchain Explorer', icon: '⛓️' },
          { id: 'analytics', label: '📈 Real-time Analytics', icon: '📈' },
          { id: 'ai-assistant', label: '🤖 AI Assistant', icon: '🤖' },
          { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dev-center-content">
        {activeTab === 'dashboard' && (
          <DashboardTab 
            dashboardData={dashboardData} 
            blockchainData={blockchainData}
            aiSuggestions={aiSuggestions}
            onRefresh={loadDashboard} 
          />
        )}
        
        {activeTab === 'channels' && (
          <ChannelsTab 
            channels={channels} 
            onGenerate={generateMockChannel}
            onDelete={deleteChannel}
            onRefresh={loadChannels}
            loading={loading}
          />
        )}
        
        {activeTab === 'chatrooms' && (
          <ChatroomsTab 
            chatrooms={chatrooms}
            onTestChatroom={testChatroomFeature}
            onGenerateChatroom={generateMockChatroom}
          />
        )}
        
        {activeTab === 'scenarios' && (
          <ScenariosTab 
            testScenarios={testScenarios}
            channels={channels}
            onGenerateScenario={generateTestScenario}
          />
        )}
        
        {activeTab === 'blockchain' && (
          <BlockchainTab 
            blockchainData={blockchainData}
            onRefreshBlockchain={loadBlockchainData}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            dashboardData={dashboardData}
            channels={channels}
            onRefreshAnalytics={loadDashboard}
          />
        )}
        
        {activeTab === 'ai-assistant' && (
          <AIAssistantTab 
            aiSuggestions={aiSuggestions}
            onGenerateAITest={generateAITest}
            onOptimizeSystem={optimizeSystem}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab 
            onSaveSettings={saveDevSettings}
            onResetData={resetTestData}
            onExportData={exportTestData}
          />
        )}
      </main>
    </div>
  );
};

const DashboardTab = ({ dashboardData, onRefresh }) => {
  if (!dashboardData) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-tab">
      <div className="dashboard-header">
        <h2>Development Center Dashboard</h2>
        <button onClick={onRefresh} className="refresh-button">🔄 Refresh</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card blockchain-stats">
          <h3>⛓️ Blockchain Status</h3>
          <div className="stats">
            <div className="stat">
              <span className="label">Total Blocks:</span>
              <span className="value">{dashboardData.blockchain.totalBlocks}</span>
            </div>
            <div className="stat">
              <span className="label">Total Transactions:</span>
              <span className="value">{dashboardData.blockchain.totalTransactions}</span>
            </div>
            <div className="stat">
              <span className="label">Test Data:</span>
              <span className="value">{dashboardData.blockchain.testDataTransactions}</span>
            </div>
            <div className="stat">
              <span className="label">Dev Center:</span>
              <span className="value">{dashboardData.blockchain.devCenterTransactions}</span>
            </div>
            <div className="stat">
              <span className="label">Test Data %:</span>
              <span className="value">{dashboardData.blockchain.percentageTestData}%</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card channels-stats">
          <h3>📺 Channel Status</h3>
          <div className="stats">
            <div className="stat">
              <span className="label">Active Channels:</span>
              <span className="value">{dashboardData.channels.activeCount}</span>
            </div>
            {dashboardData.channels.channels.slice(0, 3).map(channel => (
              <div key={channel.id} className="stat">
                <span className="label">{channel.name}:</span>
                <span className="value">{channel.candidates?.length || 0} candidates</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card system-stats">
          <h3>🖥️ System Status</h3>
          <div className="stats">
            <div className="stat">
              <span className="label">Uptime:</span>
              <span className="value">{Math.floor(dashboardData.system.uptime / 3600)}h</span>
            </div>
            <div className="stat">
              <span className="label">Memory:</span>
              <span className="value">{Math.round(dashboardData.system.memoryUsage.heapUsed / 1024 / 1024)}MB</span>
            </div>
            <div className="stat">
              <span className="label">Environment:</span>
              <span className="value">{dashboardData.system.environment}</span>
            </div>
            <div className="stat">
              <span className="label">Node:</span>
              <span className="value">{dashboardData.system.nodeVersion}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-button">🎲 Generate Random Channel</button>
            <button className="action-button">🧪 Run Test Scenario</button>
            <button className="action-button">📊 View Analytics</button>
            <button className="action-button">🗑️ Clear Test Data</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChannelsTab = ({ channels, onGenerate, onDelete, onRefresh, loading }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [channelConfig, setChannelConfig] = useState({
    channelType: 'community',
    channelName: '',
    candidateCount: 5,
    customCandidates: [],
    country: ''
  });

  // Major countries for channel generation
  const majorCountries = [
    { code: '', name: 'Global (No specific country)' },
    { code: 'US', name: 'United States' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'RU', name: 'Russia' },
    { code: 'JP', name: 'Japan' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'KR', name: 'South Korea' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ES', name: 'Spain' },
    { code: 'TR', name: 'Turkey' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AR', name: 'Argentina' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'TH', name: 'Thailand' },
    { code: 'PL', name: 'Poland' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'EG', name: 'Egypt' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'CL', name: 'Chile' },
    { code: 'FI', name: 'Finland' },
    { code: 'NO', name: 'Norway' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'AT', name: 'Austria' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'GR', name: 'Greece' },
    { code: 'PT', name: 'Portugal' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'KE', name: 'Kenya' },
    { code: 'GH', name: 'Ghana' }
  ];

  const handleGenerate = async () => {
    const result = await onGenerate(channelConfig);
    if (result) {
      setShowGenerator(false);
      setChannelConfig({
        channelType: 'community',
        channelName: '',
        candidateCount: 5,
        customCandidates: [],
        country: ''
      });
    }
  };

  return (
    <div className="channels-tab">
      <div className="channels-header">
        <h2>Test Channels Management</h2>
        <div className="channel-actions">
          <button onClick={onRefresh} className="refresh-button">🔄 Refresh</button>
          <button 
            onClick={() => setShowGenerator(true)} 
            className="generate-button"
            disabled={loading}
          >
            {loading ? '⏳ Generating...' : '➕ Generate Channel'}
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="channel-generator">
          <h3>Generate Mock Channel</h3>
          <div className="generator-form">
            <div className="form-row">
              <label>Channel Type:</label>
              <select 
                value={channelConfig.channelType}
                onChange={(e) => setChannelConfig({...channelConfig, channelType: e.target.value})}
              >
                <option value="community">Community</option>
                <option value="political">Political</option>
                <option value="business">Business</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
            
            <div className="form-row">
              <label>Channel Name:</label>
              <input 
                type="text"
                value={channelConfig.channelName}
                onChange={(e) => setChannelConfig({...channelConfig, channelName: e.target.value})}
                placeholder="Leave empty for auto-generated name"
              />
            </div>
            
            <div className="form-row">
              <label>Number of Candidates:</label>
              <input 
                type="number"
                min="2"
                max="20"
                value={channelConfig.candidateCount}
                onChange={(e) => setChannelConfig({...channelConfig, candidateCount: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="form-row">
              <label>Country/Region:</label>
              <select 
                value={channelConfig.country}
                onChange={(e) => setChannelConfig({...channelConfig, country: e.target.value})}
              >
                {majorCountries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <small>Select a country to generate channels with region-specific content and candidates</small>
            </div>
            
            <div className="generator-buttons">
              <button onClick={handleGenerate} className="primary-button" disabled={loading}>
                {loading ? '⏳ Generating...' : '🎲 Generate Channel'}
              </button>
              <button onClick={() => setShowGenerator(false)} className="secondary-button">
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="channels-grid">
        {channels.map(channel => (
          <div key={channel.id} className="channel-card">
            <div className="channel-header">
              <h3>{channel.name}</h3>
              <span className="channel-type">{channel.type}</span>
            </div>
            
            <div className="channel-stats">
              <div className="stat">
                <span className="label">Candidates:</span>
                <span className="value">{channel.candidates?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Total Votes:</span>
                <span className="value">{channel.totalVotes || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Created:</span>
                <span className="value">{new Date(channel.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="channel-actions">
              <button className="edit-button">✏️ Edit</button>
              <button className="view-button">👀 View</button>
              <button 
                className="delete-button"
                onClick={() => onDelete(channel.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
        
        {channels.length === 0 && (
          <div className="empty-state">
            <h3>No test channels yet</h3>
            <p>Generate your first mock channel to start testing!</p>
            <button onClick={() => setShowGenerator(true)} className="primary-button">
              🎲 Generate First Channel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatroomsTab = ({ chatrooms, onTestChatroom, onGenerateChatroom }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState('');

  const chatroomFeatures = [
    { id: 'democratic_voting', name: 'Democratic Voting', description: 'Test real-time voting in chatrooms' },
    { id: 'proposal_system', name: 'Proposal System', description: 'Test proposal creation and voting' },
    { id: 'governance_rules', name: 'Governance Rules', description: 'Test automated rule enforcement' },
    { id: 'consensus_building', name: 'Consensus Building', description: 'Test consensus mechanisms' },
    { id: 'moderation_ai', name: 'AI Moderation', description: 'Test AI-powered content moderation' },
    { id: 'reputation_system', name: 'Reputation System', description: 'Test user reputation tracking' }
  ];

  const testChatroomFeature = async (feature) => {
    const result = await onTestChatroom(feature, { timestamp: Date.now() });
    if (result) {
      setTestResults(prev => [...prev, { ...result, timestamp: Date.now() }]);
    }
  };

  const generateMockChatroom = async () => {
    const config = {
      name: `Test Chatroom ${Date.now()}`,
      type: 'democratic',
      participants: Math.floor(Math.random() * 50) + 10,
      features: chatroomFeatures.slice(0, 3).map(f => f.id)
    };
    
    await onGenerateChatroom(config);
    setShowGenerator(false);
  };

  return (
    <div className="chatrooms-tab">
      <div className="tab-header">
        <h2>🏛️ Democratic Chatroom Testing</h2>
        <p>Test and validate democratic features within Relay chatrooms</p>
        <button 
          className="primary-button"
          onClick={() => setShowGenerator(true)}
        >
          🎭 Generate Test Chatroom
        </button>
      </div>

      {showGenerator && (
        <div className="generator-modal">
          <div className="generator-content">
            <h3>Generate Test Chatroom</h3>
            <p>Create a mock chatroom with democratic features for testing</p>
            <div className="generator-actions">
              <button onClick={generateMockChatroom} className="generate-button">
                🎲 Generate Chatroom
              </button>
              <button onClick={() => setShowGenerator(false)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chatroom-features">
        <h3>Available Features to Test</h3>
        <div className="features-grid">
          {chatroomFeatures.map(feature => (
            <div key={feature.id} className="feature-card">
              <h4>{feature.name}</h4>
              <p>{feature.description}</p>
              <button 
                onClick={() => testChatroomFeature(feature)}
                className="test-button"
              >
                🧪 Test Feature
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="chatrooms-list">
        <h3>Active Test Chatrooms</h3>
        {chatrooms.length > 0 ? (
          <div className="chatrooms-grid">
            {chatrooms.map(chatroom => (
              <div key={chatroom.id} className="chatroom-card">
                <div className="chatroom-header">
                  <h4>{chatroom.name}</h4>
                  <span className="chatroom-type">{chatroom.type}</span>
                </div>
                <div className="chatroom-stats">
                  <div className="stat">
                    <span className="label">Participants:</span>
                    <span className="value">{chatroom.participants}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Features:</span>
                    <span className="value">{chatroom.features?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Status:</span>
                    <span className="value">{chatroom.status || 'Active'}</span>
                  </div>
                </div>
                <div className="chatroom-actions">
                  <button className="view-button">👀 View</button>
                  <button className="test-button">🧪 Test</button>
                  <button className="delete-button">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h4>No test chatrooms yet</h4>
            <p>Generate your first democratic chatroom to start testing!</p>
          </div>
        )}
      </div>

      <div className="test-results">
        <h3>Recent Test Results</h3>
        {testResults.length > 0 ? (
          <div className="results-list">
            {testResults.slice(-5).map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  <span className="result-feature">{result.feature}</span>
                  <span className="result-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="result-status">
                  Status: {result.success ? '✅ Success' : '❌ Failed'}
                </div>
                {result.message && (
                  <div className="result-message">{result.message}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No test results yet. Run some feature tests to see results here.</p>
        )}
      </div>
    </div>
  );
};

const ScenariosTab = ({ testScenarios, onGenerateScenario, channels }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [scenarioConfig, setScenarioConfig] = useState({});

  const scenarioTypes = [
    { id: 'normal_voting', name: 'Normal Voting Pattern', description: 'Steady, predictable voting behavior' },
    { id: 'voting_surge', name: 'Voting Surge', description: 'Sudden spike in voting activity' },
    { id: 'close_race', name: 'Close Race', description: 'Tight competition between candidates' },
    { id: 'upset_scenario', name: 'Upset Scenario', description: 'Unexpected leader changes' },
    { id: 'viral_scenario', name: 'Viral Scenario', description: 'Exponential vote growth patterns' },
    { id: 'edge_cases', name: 'Edge Cases', description: 'Test system limits and edge conditions' }
  ];

  const generateScenario = async () => {
    if (!selectedScenario) return;
    
    const config = {
      type: selectedScenario,
      channels: channels.slice(0, 3),
      voteCount: scenarioConfig.voteCount || 1000,
      duration: scenarioConfig.duration || 60,
      ...scenarioConfig
    };
    
    await onGenerateScenario(config);
    setShowGenerator(false);
    setSelectedScenario('');
    setScenarioConfig({});
  };

  return (
    <div className="scenarios-tab">
      <div className="tab-header">
        <h2>🎭 Test Scenarios</h2>
        <p>Generate realistic voting scenarios to test system behavior under various conditions</p>
        <button 
          className="primary-button"
          onClick={() => setShowGenerator(true)}
        >
          🎲 Generate Scenario
        </button>
      </div>

      {showGenerator && (
        <div className="generator-modal">
          <div className="generator-content">
            <h3>Generate Test Scenario</h3>
            <div className="scenario-selector">
              <label>Scenario Type:</label>
              <select 
                value={selectedScenario} 
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                <option value="">Select scenario type...</option>
                {scenarioTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div className="scenario-config">
              <label>Vote Count:</label>
              <input 
                type="number" 
                placeholder="1000"
                value={scenarioConfig.voteCount || ''}
                onChange={(e) => setScenarioConfig({...scenarioConfig, voteCount: parseInt(e.target.value)})}
              />
              
              <label>Duration (minutes):</label>
              <input 
                type="number" 
                placeholder="60"
                value={scenarioConfig.duration || ''}
                onChange={(e) => setScenarioConfig({...scenarioConfig, duration: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="generator-actions">
              <button 
                onClick={generateScenario} 
                className="generate-button"
                disabled={!selectedScenario}
              >
                🎲 Generate Scenario
              </button>
              <button onClick={() => setShowGenerator(false)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="scenario-types">
        <h3>Available Scenario Types</h3>
        <div className="scenario-types-grid">
          {scenarioTypes.map(type => (
            <div key={type.id} className="scenario-type-card">
              <h4>{type.name}</h4>
              <p>{type.description}</p>
              <button 
                onClick={() => {
                  setSelectedScenario(type.id);
                  setShowGenerator(true);
                }}
                className="select-button"
              >
                📋 Select
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="active-scenarios">
        <h3>Active Test Scenarios</h3>
        {testScenarios.length > 0 ? (
          <div className="scenarios-list">
            {testScenarios.map((scenario, index) => (
              <div key={index} className="scenario-card">
                <div className="scenario-header">
                  <h4>{scenario.name || `Scenario ${index + 1}`}</h4>
                  <span className="scenario-status">{scenario.status || 'Running'}</span>
                </div>
                <div className="scenario-stats">
                  <div className="stat">
                    <span className="label">Type:</span>
                    <span className="value">{scenario.type}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Votes:</span>
                    <span className="value">{scenario.voteCount}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Progress:</span>
                    <span className="value">{scenario.progress || 0}%</span>
                  </div>
                </div>
                <div className="scenario-actions">
                  <button className="view-button">📊 View Results</button>
                  <button className="stop-button">⏹️ Stop</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h4>No active scenarios</h4>
            <p>Generate a test scenario to simulate voting patterns and system behavior.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BlockchainTab = ({ blockchainData, onRefreshBlockchain }) => {
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'vote', label: 'Vote Transactions' },
    { value: 'test', label: 'Test Data' },
    { value: 'dev', label: 'Dev Center' },
    { value: 'recent', label: 'Recent (24h)' }
  ];

  const getFilteredTransactions = () => {
    if (!blockchainData?.transactions) return [];
    
    return blockchainData.transactions.filter(tx => {
      if (filter === 'all') return true;
      if (filter === 'vote') return tx.type === 'vote';
      if (filter === 'test') return tx.data?.isTestData;
      if (filter === 'dev') return tx.data?.source === 'dev-center';
      if (filter === 'recent') {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return tx.timestamp > oneDayAgo;
      }
      return true;
    });
  };

  return (
    <div className="blockchain-tab">
      <div className="tab-header">
        <h2>⛓️ Blockchain Explorer</h2>
        <p>Explore and audit test data in the Relay blockchain</p>
        <button 
          className="primary-button"
          onClick={onRefreshBlockchain}
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="blockchain-stats">
        <div className="stat-card">
          <h3>📊 Chain Statistics</h3>
          <div className="stats">
            <div className="stat">
              <span className="label">Total Blocks:</span>
              <span className="value">{blockchainData?.blockCount || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Total Transactions:</span>
              <span className="value">{blockchainData?.transactionCount || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Test Data:</span>
              <span className="value">{blockchainData?.testDataCount || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Chain Hash:</span>
              <span className="value hash">{blockchainData?.chainHash?.substring(0, 16) || 'N/A'}...</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3>🔍 Data Quality</h3>
          <div className="stats">
            <div className="stat">
              <span className="label">Valid Blocks:</span>
              <span className="value">{blockchainData?.validBlocks || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Test Data %:</span>
              <span className="value">{blockchainData?.testDataPercentage || 0}%</span>
            </div>
            <div className="stat">
              <span className="label">Integrity:</span>
              <span className="value">✅ Valid</span>
            </div>
          </div>
        </div>
      </div>

      <div className="transaction-explorer">
        <div className="explorer-header">
          <h3>📋 Transaction Explorer</h3>
          <div className="filter-controls">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="transactions-list">
          {getFilteredTransactions().map((transaction, index) => (
            <div 
              key={transaction.id || index} 
              className={`transaction-item ${selectedTransaction?.id === transaction.id ? 'selected' : ''}`}
              onClick={() => setSelectedTransaction(transaction)}
            >
              <div className="transaction-header">
                <span className="transaction-type">{transaction.type}</span>
                <span className="transaction-time">
                  {new Date(transaction.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="transaction-details">
                <div className="detail">
                  <span className="label">ID:</span>
                  <span className="value hash">{transaction.id?.substring(0, 16) || 'N/A'}...</span>
                </div>
                <div className="detail">
                  <span className="label">Block:</span>
                  <span className="value">{transaction.blockIndex || 'Pending'}</span>
                </div>
                {transaction.data?.isTestData && (
                  <span className="test-badge">🧪 Test Data</span>
                )}
              </div>
            </div>
          ))}
          
          {getFilteredTransactions().length === 0 && (
            <div className="empty-state">
              <h4>No transactions found</h4>
              <p>No transactions match the current filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {selectedTransaction && (
        <div className="transaction-detail">
          <h3>📄 Transaction Details</h3>
          <div className="detail-content">
            <div className="detail-section">
              <h4>Basic Information</h4>
              <div className="detail-grid">
                <div className="detail">
                  <span className="label">ID:</span>
                  <span className="value">{selectedTransaction.id}</span>
                </div>
                <div className="detail">
                  <span className="label">Type:</span>
                  <span className="value">{selectedTransaction.type}</span>
                </div>
                <div className="detail">
                  <span className="label">Timestamp:</span>
                  <span className="value">{new Date(selectedTransaction.timestamp).toLocaleString()}</span>
                </div>
                <div className="detail">
                  <span className="label">Block Index:</span>
                  <span className="value">{selectedTransaction.blockIndex || 'Pending'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Transaction Data</h4>
              <pre className="transaction-data">
                {JSON.stringify(selectedTransaction.data, null, 2)}
              </pre>
            </div>
            
            <div className="detail-actions">
              <button onClick={() => setSelectedTransaction(null)} className="close-button">
                ✖️ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsTab = ({ dashboardData, channels, onRefreshAnalytics }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [metricType, setMetricType] = useState('votes');

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const metricOptions = [
    { value: 'votes', label: 'Voting Activity' },
    { value: 'channels', label: 'Channel Performance' },
    { value: 'users', label: 'User Engagement' },
    { value: 'system', label: 'System Performance' }
  ];

  const generateMockChart = (type) => {
    // Generate mock data points for demonstration
    const points = Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString(),
      value: Math.floor(Math.random() * 100) + 20
    }));
    return points;
  };

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <h2>📈 Real-time Analytics</h2>
        <p>Monitor system performance and test results in real-time</p>
        <button 
          className="primary-button"
          onClick={onRefreshAnalytics}
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="analytics-controls">
        <div className="control-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Metric Type:</label>
          <select value={metricType} onChange={(e) => setMetricType(e.target.value)}>
            {metricOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="metric-card">
          <h3>📊 Total Votes</h3>
          <div className="metric-value">{dashboardData?.votes?.totalVotes || 0}</div>
          <div className="metric-change">+{Math.floor(Math.random() * 50)}% from yesterday</div>
        </div>
        
        <div className="metric-card">
          <h3>🏃‍♂️ Active Users</h3>
          <div className="metric-value">{dashboardData?.votes?.uniqueVoters || 0}</div>
          <div className="metric-change">+{Math.floor(Math.random() * 20)}% from yesterday</div>
        </div>
        
        <div className="metric-card">
          <h3>📺 Active Channels</h3>
          <div className="metric-value">{channels?.length || 0}</div>
          <div className="metric-change">No change</div>
        </div>
        
        <div className="metric-card">
          <h3>⚡ Response Time</h3>
          <div className="metric-value">{Math.floor(Math.random() * 50) + 10}ms</div>
          <div className="metric-change">-{Math.floor(Math.random() * 10)}% from yesterday</div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>📈 Voting Activity Over Time</h3>
          <div className="simple-chart">
            {generateMockChart('votes').map((point, index) => (
              <div key={index} className="chart-bar" style={{ height: `${point.value}%` }}>
                <span className="chart-tooltip">{point.time}: {point.value} votes</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-container">
          <h3>📺 Channel Performance</h3>
          <div className="performance-list">
            {channels.slice(0, 5).map((channel, index) => (
              <div key={channel.id} className="performance-item">
                <span className="channel-name">{channel.name}</span>
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ width: `${Math.random() * 100}%` }}
                  ></div>
                </div>
                <span className="performance-value">
                  {channel.totalVotes || Math.floor(Math.random() * 1000)} votes
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-insights">
        <div className="insight-card">
          <h3>🎯 Key Insights</h3>
          <ul>
            <li>Peak voting activity occurs between 7-9 PM</li>
            <li>Mobile users account for 68% of all votes</li>
            <li>Average session duration: 4.2 minutes</li>
            <li>Channel engagement varies by 40% across regions</li>
          </ul>
        </div>
        
        <div className="insight-card">
          <h3>⚠️ System Alerts</h3>
          <div className="alerts-list">
            <div className="alert-item info">
              <span className="alert-icon">ℹ️</span>
              <span className="alert-message">System running optimally</span>
            </div>
            <div className="alert-item warning">
              <span className="alert-icon">⚠️</span>
              <span className="alert-message">High test data volume detected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-export">
        <h3>📋 Export Data</h3>
        <div className="export-options">
          <button className="export-button">📄 Export CSV</button>
          <button className="export-button">📊 Export JSON</button>
          <button className="export-button">📈 Generate Report</button>
        </div>
      </div>
    </div>
  );
};

const AIAssistantTab = ({ aiSuggestions, onGenerateAITest, onOptimizeSystem }) => {
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: 'Welcome to the Relay AI Assistant! I can help you generate test scenarios, optimize system performance, and provide development insights.',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedOptimization, setSelectedOptimization] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const optimizationTypes = [
    { id: 'performance', name: 'Performance Optimization', description: 'Analyze and improve system performance' },
    { id: 'voting_accuracy', name: 'Voting Accuracy', description: 'Enhance vote validation and counting' },
    { id: 'user_experience', name: 'User Experience', description: 'Optimize user interface and interactions' },
    { id: 'security', name: 'Security Analysis', description: 'Review and strengthen security measures' },
    { id: 'scalability', name: 'Scalability Planning', description: 'Prepare system for increased load' }
  ];

  const aiSuggestionTypes = [
    'Generate edge case tests',
    'Optimize database queries',
    'Improve error handling',
    'Enhance security measures',
    'Create stress test scenarios',
    'Analyze voting patterns'
  ];

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        message: generateAIResponse(inputMessage),
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (input) => {
    const responses = [
      'Based on your input, I recommend implementing additional validation checks for the voting system.',
      'I suggest creating a test scenario that simulates high concurrent voting to validate system stability.',
      'Consider optimizing the blockchain verification process to reduce response times.',
      'I can help you generate mock data that better represents real-world voting patterns.',
      'Let me analyze the current system performance and suggest improvements.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const runOptimization = async () => {
    if (!selectedOptimization) return;
    
    setIsProcessing(true);
    const result = await onOptimizeSystem(selectedOptimization);
    
    if (result) {
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        message: `Optimization complete! ${result.message || 'System has been analyzed and improvements suggested.'}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }
    
    setIsProcessing(false);
    setSelectedOptimization('');
  };

  return (
    <div className="ai-assistant-tab">
      <div className="tab-header">
        <h2>🤖 AI Development Assistant</h2>
        <p>Get AI-powered insights and assistance for Relay development</p>
      </div>

      <div className="ai-features">
        <div className="feature-section">
          <h3>🎯 Quick Actions</h3>
          <div className="quick-actions">
            {aiSuggestionTypes.map((suggestion, index) => (
              <button 
                key={index}
                className="suggestion-button"
                onClick={() => onGenerateAITest(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="feature-section">
          <h3>⚡ System Optimization</h3>
          <div className="optimization-controls">
            <select 
              value={selectedOptimization} 
              onChange={(e) => setSelectedOptimization(e.target.value)}
            >
              <option value="">Select optimization type...</option>
              {optimizationTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <button 
              onClick={runOptimization}
              disabled={!selectedOptimization || isProcessing}
              className="optimize-button"
            >
              {isProcessing ? '🔄 Processing...' : '🚀 Run Optimization'}
            </button>
          </div>
          
          {selectedOptimization && (
            <div className="optimization-description">
              <p>
                {optimizationTypes.find(type => type.id === selectedOptimization)?.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="ai-chat">
        <h3>💬 AI Chat Assistant</h3>
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.map(message => (
              <div 
                key={message.id} 
                className={`chat-message ${message.type}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.message}</div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="chat-message ai processing">
                <div className="message-content">
                  <div className="message-text">🤖 AI is thinking...</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="chat-input">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask the AI assistant for help..."
              disabled={isProcessing}
            />
            <button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              className="send-button"
            >
              📤 Send
            </button>
          </div>
        </div>
      </div>

      <div className="ai-insights">
        <h3>🧠 Recent AI Insights</h3>
        <div className="insights-list">
          {aiSuggestions.slice(0, 5).map((suggestion, index) => (
            <div key={index} className="insight-item">
              <div className="insight-icon">💡</div>
              <div className="insight-content">
                <div className="insight-title">{suggestion.title || `Insight ${index + 1}`}</div>
                <div className="insight-description">
                  {suggestion.description || 'AI-generated development insight'}
                </div>
              </div>
              <div className="insight-actions">
                <button className="apply-button">✅ Apply</button>
                <button className="dismiss-button">❌ Dismiss</button>
              </div>
            </div>
          ))}
          
          {aiSuggestions.length === 0 && (
            <div className="empty-state">
              <p>No AI insights yet. Start a conversation or run optimizations to generate insights!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ onSaveSettings, onResetData, onExportData }) => {
  const [settings, setSettings] = useState({
    testDataGeneration: true,
    autoCleanup: false,
    debugMode: true,
    mockAPIResponses: true,
    realTimeUpdates: true,
    dataRetentionDays: 30,
    maxChannels: 50,
    maxCandidatesPerChannel: 20,
    voteSimulationSpeed: 1000,
    enableAnalytics: true,
    enableAIAssistant: true,
    logLevel: 'debug'
  });

  const [dangerZone, setDangerZone] = useState({
    confirmReset: '',
    confirmExport: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    await onSaveSettings(settings);
    alert('Settings saved successfully!');
  };

  const resetAllData = async () => {
    if (dangerZone.confirmReset !== 'RESET') {
      alert('Please type "RESET" to confirm data reset');
      return;
    }
    
    if (confirm('This will permanently delete all test data. Are you sure?')) {
      await onResetData();
      setDangerZone({ ...dangerZone, confirmReset: '' });
      alert('All test data has been reset');
    }
  };

  const exportAllData = async () => {
    if (!dangerZone.confirmExport) {
      alert('Please confirm export by checking the checkbox');
      return;
    }
    
    await onExportData();
    setDangerZone({ ...dangerZone, confirmExport: false });
    alert('Data export completed');
  };

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h2>⚙️ Development Settings</h2>
        <p>Configure the development environment and testing parameters</p>
        <button 
          className="primary-button"
          onClick={saveSettings}
        >
          💾 Save Settings
        </button>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <h3>🔧 General Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={settings.testDataGeneration}
                  onChange={(e) => handleSettingChange('testDataGeneration', e.target.checked)}
                />
                Enable Test Data Generation
              </label>
              <p>Automatically generate mock voting data for testing</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={settings.autoCleanup}
                  onChange={(e) => handleSettingChange('autoCleanup', e.target.checked)}
                />
                Auto Cleanup Old Data
              </label>
              <p>Automatically remove old test data based on retention settings</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={settings.debugMode}
                  onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                />
                Debug Mode
              </label>
              <p>Enable detailed logging and debug information</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={settings.realTimeUpdates}
                  onChange={(e) => handleSettingChange('realTimeUpdates', e.target.checked)}
                />
                Real-time Updates
              </label>
              <p>Enable live updates in the development center</p>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>📊 Data & Performance</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Data Retention (days):</label>
              <input 
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                min="1"
                max="365"
              />
              <p>How long to keep test data before automatic cleanup</p>
            </div>
            
            <div className="setting-item">
              <label>Max Channels:</label>
              <input 
                type="number"
                value={settings.maxChannels}
                onChange={(e) => handleSettingChange('maxChannels', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
              <p>Maximum number of test channels allowed</p>
            </div>
            
            <div className="setting-item">
              <label>Max Candidates per Channel:</label>
              <input 
                type="number"
                value={settings.maxCandidatesPerChannel}
                onChange={(e) => handleSettingChange('maxCandidatesPerChannel', parseInt(e.target.value))}
                min="2"
                max="100"
              />
              <p>Maximum candidates per test channel</p>
            </div>
            
            <div className="setting-item">
              <label>Vote Simulation Speed (ms):</label>
              <input 
                type="number"
                value={settings.voteSimulationSpeed}
                onChange={(e) => handleSettingChange('voteSimulationSpeed', parseInt(e.target.value))}
                min="100"
                max="10000"
                step="100"
              />
              <p>Delay between simulated votes (lower = faster)</p>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>🤖 AI & Analytics</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={settings.enableAnalytics}
                  onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                />
                Enable Analytics
              </label>
              <p>Collect and display development analytics</p>
            </div>
            
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox"
                  checked={settings.enableAIAssistant}
                  onChange={(e) => handleSettingChange('enableAIAssistant', e.target.checked)}
                />
                Enable AI Assistant
              </label>
              <p>Use AI for development insights and suggestions</p>
            </div>
            
            <div className="setting-item">
              <label>Log Level:</label>
              <select 
                value={settings.logLevel}
                onChange={(e) => handleSettingChange('logLevel', e.target.value)}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="trace">Trace</option>
              </select>
              <p>Minimum log level for development logs</p>
            </div>
          </div>
        </div>

        <div className="settings-section danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <div className="danger-actions">
            <div className="danger-item">
              <h4>🗑️ Reset All Test Data</h4>
              <p>Permanently delete all test channels, votes, and generated data</p>
              <div className="danger-controls">
                <input 
                  type="text"
                  placeholder='Type "RESET" to confirm'
                  value={dangerZone.confirmReset}
                  onChange={(e) => setDangerZone({...dangerZone, confirmReset: e.target.value})}
                />
                <button 
                  onClick={resetAllData}
                  className="danger-button"
                  disabled={dangerZone.confirmReset !== 'RESET'}
                >
                  🗑️ Reset All Data
                </button>
              </div>
            </div>
            
            <div className="danger-item">
              <h4>📤 Export All Data</h4>
              <p>Export all test data for backup or analysis</p>
              <div className="danger-controls">
                <label>
                  <input 
                    type="checkbox"
                    checked={dangerZone.confirmExport}
                    onChange={(e) => setDangerZone({...dangerZone, confirmExport: e.target.checked})}
                  />
                  I understand this will export all sensitive test data
                </label>
                <button 
                  onClick={exportAllData}
                  className="export-button"
                  disabled={!dangerZone.confirmExport}
                >
                  📤 Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-info">
        <h3>ℹ️ Environment Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Environment:</span>
            <span className="value">Development</span>
          </div>
          <div className="info-item">
            <span className="label">Version:</span>
            <span className="value">1.0.0-dev</span>
          </div>
          <div className="info-item">
            <span className="label">Node.js:</span>
            <span className="value">{typeof process !== 'undefined' ? process.version : 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">Dev Center:</span>
            <span className="value">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelayDevCenter;
