import React, { useState, useEffect } from 'react';
import { Settings, TestTube, Globe, AlertCircle, Code, Database, Activity, Eye, EyeOff, ChevronDown, ChevronUp, Zap, MessageCircle, Tv, Blocks } from 'lucide-react';
import { useEnvironment } from '../../hooks/useEnvironment';
import dataService from '../../services/dataService';
import voteService from '../../services/voteService';
import './DevelopmentPanel.css';

const DevelopmentPanel = ({ className = '' }) => {
  const { 
    isTestMode, 
    shouldShowTestData, 
    settings,
    toggleTestMode, 
    updateSetting,
    resetToProductionState 
  } = useEnvironment();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('mode');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dataInfo, setDataInfo] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Dev center state
  const [chatrooms, setChatrooms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [blockchainData, setBlockchainData] = useState(null);

  // Check data source info
  useEffect(() => {
    const updateDataInfo = async () => {
      try {
        const channels = await dataService.getChannels();
        const sourceInfo = dataService.getDataSourceInfo();
        setDataInfo({
          channelCount: channels.length,
          hasTestMarkers: channels.some(c => c.isTestData),
          sourceInfo
        });
        setLastUpdate(Date.now());
      } catch (error) {
        console.error('Failed to update data info:', error);
      }
    };
    
    updateDataInfo();
    
    // Listen for environment changes
    const handleChange = () => {
      setTimeout(updateDataInfo, 100); // Small delay to let changes propagate
    };
    
    window.addEventListener('environmentChanged', handleChange);
    
    return () => {
      window.removeEventListener('environmentChanged', handleChange);
    };
  }, [shouldShowTestData]);

  const handleTestModeToggle = async () => {
    setIsTransitioning(true);
    try {
      await toggleTestMode();
      setTimeout(() => setIsTransitioning(false), 500);
    } catch (error) {
      console.error('Failed to toggle test mode:', error);
      setIsTransitioning(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      await updateSetting(key, value);
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
    }
  };

  const handleResetToProduction = async () => {
    if (window.confirm('Reset to production mode? This will disable all test features.')) {
      try {
        await resetToProductionState();
      } catch (error) {
        console.error('Failed to reset to production:', error);
      }
    }
  };

  const clearAllVotes = async () => {
    if (!window.confirm('Clear ALL votes? This action cannot be undone.')) {
      return;
    }

    setIsPerformingAction(true);
    try {
      await voteService.clearTestVotes();
      window.dispatchEvent(new CustomEvent('votesCleared'));
      alert('All votes cleared successfully!');
    } catch (error) {
      console.error('Error clearing votes:', error);
      alert('Failed to clear votes. See console for details.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const generateTestVotes = async () => {
    setIsPerformingAction(true);
    try {
      await voteService.generateTestVotes();
      window.dispatchEvent(new CustomEvent('testVotesGenerated'));
      alert('Test votes generated successfully!');
    } catch (error) {
      console.error('Error generating test votes:', error);
      alert('Failed to generate test votes. See console for details.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  // Dev center data loading functions
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

  // Load dev center data when tabs are opened
  useEffect(() => {
    if (isOpen && activeTab === 'chatrooms') {
      loadChatrooms();
    } else if (isOpen && activeTab === 'channels') {
      loadChannels();
    } else if (isOpen && activeTab === 'blockchain') {
      loadBlockchainData();
    }
  }, [isOpen, activeTab]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !settings?.enableTestUI) {
    return null;
  }

  const tabs = [
    { id: 'mode', label: 'Test Mode', icon: TestTube },
    { id: 'data', label: 'Data Source', icon: Database },
    { id: 'actions', label: 'Test Actions', icon: Zap },
    { id: 'chatrooms', label: 'Chatrooms', icon: MessageCircle },
    { id: 'channels', label: 'Channels', icon: Tv },
    { id: 'blockchain', label: 'Blockchain', icon: Blocks },
    { id: 'debug', label: 'Debug Info', icon: Code }
  ];

  return (
    <div className={`development-panel ${className}`}>
      {/* Main Toggle Button */}
      <button 
        className={`panel-toggle ${isOpen ? 'active' : ''} ${isTestMode ? 'test-mode' : 'live-mode'}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isTestMode ? 'Test Mode Active' : 'Development Panel'}
      >
        <Settings size={16} />
        <span className="toggle-text">
          {isTransitioning ? 'Switching...' : (isTestMode ? 'Test Mode' : 'Live Mode')}
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Panel Content */}
      {isOpen && (
        <div className="panel-content">
          <div className="panel-header">
            <h3>🔧 Relay Development Panel</h3>
            <div className="environment-badge">
              <div className={`status-indicator ${isTestMode ? 'test' : 'live'}`}>
                <div className="indicator-dot"></div>
                <span className="status-text">
                  {isTestMode ? 'Test Mode Active' : 'Live Mode Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Test Mode Tab */}
            {activeTab === 'mode' && (
              <div className="tab-panel">
                <div className="mode-section">
                  <div className="mode-toggle">
                    <button 
                      className={`mode-toggle-button ${isTestMode ? 'test' : 'live'}`}
                      onClick={handleTestModeToggle}
                      disabled={isTransitioning}
                    >
                      <div className="toggle-content">
                        {isTestMode ? <TestTube size={20} /> : <Globe size={20} />}
                        <div className="toggle-labels">
                          <span className="mode-label">
                            {isTestMode ? 'Test Mode Active' : 'Live Mode Active'}
                          </span>
                          <span className="mode-description">
                            {isTestMode ? 'Using demo data and test features' : 'Using live production data'}
                          </span>
                        </div>
                      </div>
                      <div className="toggle-switch">
                        <div className={`switch ${isTestMode ? 'on' : 'off'}`}>
                          <div className="switch-handle"></div>
                        </div>
                      </div>
                    </button>
                    <div className="mode-hint">
                      <AlertCircle size={14} />
                      <span>Test mode uses demo data - not real votes</span>
                    </div>
                  </div>

                  {isTestMode && (
                    <div className="test-settings">
                      <h4>Test Settings</h4>
                      <div className="settings-grid">
                        <label className="setting-item">
                          <input
                            type="checkbox"
                            checked={settings?.showTestData || false}
                            onChange={(e) => handleSettingChange('showTestData', e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          <div className="setting-info">
                            <span className="setting-label">Show Test Data</span>
                            <span className="setting-description">Display mock channels, candidates, and voters</span>
                          </div>
                        </label>

                        <label className="setting-item">
                          <input
                            type="checkbox"
                            checked={settings?.enableTestVoting || false}
                            onChange={(e) => handleSettingChange('enableTestVoting', e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          <div className="setting-info">
                            <span className="setting-label">Enable Test Voting</span>
                            <span className="setting-description">Allow voting on test data without backend calls</span>
                          </div>
                        </label>

                        <label className="setting-item">
                          <input
                            type="checkbox"
                            checked={settings?.deterministicVotes || false}
                            onChange={(e) => handleSettingChange('deterministicVotes', e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          <div className="setting-info">
                            <span className="setting-label">Deterministic Vote Counts</span>
                            <span className="setting-description">Use stable, seeded vote counts instead of random</span>
                          </div>
                        </label>

                        <label className="setting-item">
                          <input
                            type="checkbox"
                            checked={settings?.enableTestUI || false}
                            onChange={(e) => handleSettingChange('enableTestUI', e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          <div className="setting-info">
                            <span className="setting-label">Show Test UI Elements</span>
                            <span className="setting-description">Display development-only UI components</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="action-buttons">
                    <button 
                      className="reset-button"
                      onClick={handleResetToProduction}
                    >
                      Reset to Production
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Source Tab */}
            {activeTab === 'data' && (
              <div className="tab-panel">
                <div className="data-section">
                  <div className="data-status">
                    <h4>Current Data Source</h4>
                    <div className={`status-indicator ${shouldShowTestData ? 'test' : 'live'}`}>
                      {shouldShowTestData ? (
                        <>
                          <TestTube size={16} />
                          <span>Demo Data</span>
                        </>
                      ) : (
                        <>
                          <Globe size={16} />
                          <span>Live Data</span>
                        </>
                      )}
                    </div>
                  </div>

                  {dataInfo && (
                    <div className="data-details">
                      <div className="detail-row">
                        <span className="label">Channels loaded:</span>
                        <span className="value">{dataInfo.channelCount}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Has test markers:</span>
                        <span className={`value ${dataInfo.hasTestMarkers ? 'success' : 'neutral'}`}>
                          {dataInfo.hasTestMarkers ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Data source:</span>
                        <span className={`value ${dataInfo.sourceInfo.source === 'test' ? 'success' : 'neutral'}`}>
                          {dataInfo.sourceInfo.source}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Last update:</span>
                        <span className="value">{formatTime(lastUpdate)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Actions Tab */}
            {activeTab === 'actions' && (
              <div className="tab-panel">
                <div className="actions-section">
                  <h4>🔧 Test Actions</h4>
                  <p className="section-description">
                    Perform test-specific actions for development and debugging
                  </p>

                  {isTestMode ? (
                    <div className="action-buttons-grid">
                      <button 
                        onClick={clearAllVotes} 
                        className="action-button danger"
                        disabled={isPerformingAction}
                      >
                        🗑️ Clear All Votes
                      </button>
                      
                      <button 
                        onClick={generateTestVotes} 
                        className="action-button primary"
                        disabled={isPerformingAction}
                      >
                        🎲 Generate Test Votes
                      </button>
                      
                      <button 
                        onClick={refreshPage} 
                        className="action-button secondary"
                      >
                        🔄 Refresh Page
                      </button>
                      
                      <button 
                        onClick={handleResetToProduction} 
                        className="action-button warning"
                      >
                        🏭 Reset to Production
                      </button>
                    </div>
                  ) : (
                    <div className="disabled-notice">
                      <AlertCircle size={20} />
                      <p>Test actions require Test Mode to be enabled</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chatrooms Tab */}
            {activeTab === 'chatrooms' && (
              <div className="tab-panel">
                <h4>🏛️ Democratic Chatrooms</h4>
                <div className="chatroom-section">
                  <div className="action-buttons">
                    <button onClick={loadChatrooms} className="action-button secondary">
                      🔄 Refresh Chatrooms
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/dev-center/chatrooms/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: 'Test Chatroom' })
                          });
                          const data = await response.json();
                          if (data.success) {
                            loadChatrooms();
                            alert('Test chatroom created!');
                          }
                        } catch (error) {
                          console.error('Error creating chatroom:', error);
                        }
                      }}
                      className="action-button primary"
                    >
                      ➕ Create Test Chatroom
                    </button>
                  </div>
                  
                  <div className="chatroom-list">
                    {chatrooms.length === 0 ? (
                      <p>No chatrooms found. Create a test chatroom to get started.</p>
                    ) : (
                      chatrooms.map(chatroom => (
                        <div key={chatroom.id} className="chatroom-item">
                          <div className="chatroom-info">
                            <h5>{chatroom.name}</h5>
                            <p>ID: {chatroom.id}</p>
                            <p>Messages: {chatroom.messageCount || 0}</p>
                            <p>Users: {chatroom.userCount || 0}</p>
                          </div>
                          <div className="chatroom-actions">
                            <button 
                              onClick={() => window.open(`/chatroom/${chatroom.id}`, '_blank')}
                              className="action-button small"
                            >
                              💬 Open
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Channels Tab */}
            {activeTab === 'channels' && (
              <div className="tab-panel">
                <h4>📺 Channel Management</h4>
                <div className="channel-section">
                  <div className="action-buttons">
                    <button onClick={loadChannels} className="action-button secondary">
                      🔄 Refresh Channels
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/dev-center/channels/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ count: 5 })
                          });
                          const data = await response.json();
                          if (data.success) {
                            loadChannels();
                            alert(`${data.channels.length} test channels created!`);
                          }
                        } catch (error) {
                          console.error('Error creating channels:', error);
                        }
                      }}
                      className="action-button primary"
                    >
                      ➕ Generate Test Channels
                    </button>
                  </div>
                  
                  <div className="channel-list">
                    {channels.length === 0 ? (
                      <p>No channels found. Generate test channels to get started.</p>
                    ) : (
                      channels.slice(0, 10).map(channel => (
                        <div key={channel.id} className="channel-item">
                          <div className="channel-info">
                            <h5>{channel.name}</h5>
                            <p>Votes: {channel.voteCount || 0}</p>
                            <p>Scope: {channel.scope}</p>
                          </div>
                          <div className="channel-actions">
                            <button 
                              onClick={() => window.open(`/channels`, '_blank')}
                              className="action-button small"
                            >
                              🔍 View in Explorer
                            </button>
                            <button 
                              onClick={() => window.open(`/chatroom/${channel.id}`, '_blank')}
                              className="action-button small"
                            >
                              💬 Open Chatroom
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Blockchain Tab */}
            {activeTab === 'blockchain' && (
              <div className="tab-panel">
                <h4>⛓️ Blockchain Explorer</h4>
                <div className="blockchain-section">
                  <div className="action-buttons">
                    <button onClick={loadBlockchainData} className="action-button secondary">
                      🔄 Refresh Data
                    </button>
                  </div>
                  
                  {blockchainData ? (
                    <div className="blockchain-data">
                      <div className="stat-grid">
                        <div className="stat-item">
                          <span className="stat-label">Total Blocks</span>
                          <span className="stat-value">{blockchainData.totalBlocks || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Votes</span>
                          <span className="stat-value">{blockchainData.totalVotes || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Active Shards</span>
                          <span className="stat-value">{blockchainData.activeShards || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Last Block</span>
                          <span className="stat-value">{blockchainData.lastBlockTime || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {blockchainData.recentBlocks && (
                        <div className="recent-blocks">
                          <h5>Recent Blocks</h5>
                          {blockchainData.recentBlocks.slice(0, 5).map(block => (
                            <div key={block.hash} className="block-item">
                              <span className="block-hash">{block.hash.substring(0, 16)}...</span>
                              <span className="block-votes">{block.voteCount} votes</span>
                              <span className="block-time">{block.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>Loading blockchain data...</p>
                  )}
                </div>
              </div>
            )}

            {/* Debug Info Tab */}
            {activeTab === 'debug' && (
              <div className="tab-panel">
                <div className="debug-section">
                  <h4>🐛 Debug Information</h4>
                  
                  <div className="debug-categories">
                    <div className="debug-category">
                      <h5>Environment State</h5>
                      <div className="debug-details">
                        <div className="debug-row">
                          <span className="label">Test Mode:</span>
                          <span className={`value ${isTestMode ? 'success' : 'neutral'}`}>
                            {String(isTestMode)}
                          </span>
                        </div>
                        <div className="debug-row">
                          <span className="label">Should Show Test Data:</span>
                          <span className={`value ${shouldShowTestData ? 'success' : 'neutral'}`}>
                            {String(shouldShowTestData)}
                          </span>
                        </div>
                        <div className="debug-row">
                          <span className="label">Show Test Data Setting:</span>
                          <span className={`value ${settings?.showTestData ? 'success' : 'neutral'}`}>
                            {String(settings?.showTestData)}
                          </span>
                        </div>
                        <div className="debug-row">
                          <span className="label">Is Production Build:</span>
                          <span className={`value ${process.env.NODE_ENV === 'production' ? 'warning' : 'success'}`}>
                            {String(process.env.NODE_ENV === 'production')}
                          </span>
                        </div>
                      </div>

                      <div className="logic-explanation">
                        <h5>Logic Flow</h5>
                        <code>
                          shouldShowTestData = {String(isTestMode)} && {String(settings?.showTestData)}
                        </code>
                      </div>

                      <div className="build-info">
                        <h5>Build Information</h5>
                        <div className="debug-row">
                          <span className="label">NODE_ENV:</span>
                          <span className="value">{process.env.NODE_ENV || 'development'}</span>
                        </div>
                        <div className="debug-row">
                          <span className="label">Build time:</span>
                          <span className="value">{formatTime(Date.now())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentPanel;
