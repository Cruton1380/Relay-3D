/**
 * Enhanced Development Center Overlay
 * Comprehensive development management platform that overlays on any Relay screen
 * Integrates all dev aspects into a backdrop management platform
 */
import React, { useState, useEffect, useRef } from 'react';
import { mockDevService } from '../../services/mockDevService.js';
import environmentManager from '../../utils/environmentManager.js';
import './DevCenterOverlay.css';

const DevCenterOverlay = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('environment');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // State for different dev sections
  const [environmentState, setEnvironmentState] = useState({});
  const [testData, setTestData] = useState({ channels: [], chatrooms: [] });
  const [systemMetrics, setSystemMetrics] = useState({});
  const [featureFlags, setFeatureFlags] = useState({});
  const [mockServices, setMockServices] = useState({ active: false });

  const overlayRef = useRef(null);
  const dragRef = useRef({ offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (isVisible) {
      loadDevCenterData();
    }
  }, [isVisible]);

  const loadDevCenterData = async () => {
    // Load environment state
    const envState = environmentManager.getEnvironmentState();
    setEnvironmentState(envState);

    // Load test data
    const mockData = await mockDevService.getTestData();
    const chatrooms = await mockDevService.getChatrooms();
    if (mockData && chatrooms) {
      setTestData({
        channels: mockData.channels || [],
        chatrooms: chatrooms.chatrooms || []
      });
    }

    // Mock system metrics
    setSystemMetrics({
      frontendStatus: 'running',
      backendStatus: mockDevService.isActive ? 'mock' : 'offline',
      activeConnections: Math.floor(Math.random() * 50),
      memoryUsage: Math.floor(Math.random() * 80) + 20,
      cpuUsage: Math.floor(Math.random() * 60) + 10
    });

    // Feature flags
    setFeatureFlags({
      newDragSystem: true,
      enhancedResizing: true,
      gridSnapControls: true,
      mockDataService: mockDevService.isActive,
      autoOrganize: true
    });

    setMockServices({ active: mockDevService.isActive });
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    const rect = overlayRef.current.getBoundingClientRect();
    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragRef.current.offsetX,
      y: e.clientY - dragRef.current.offsetY
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const tabs = [
    { id: 'environment', label: 'Environment', icon: '⚙️' },
    { id: 'data', label: 'Test Data', icon: '📊' },
    { id: 'features', label: 'Features', icon: '🚀' },
    { id: 'system', label: 'System', icon: '💻' },
    { id: 'builder', label: 'Feature Builder', icon: '🔧' },
    { id: 'workspace', label: 'Workspace', icon: '🎨' }
  ];

  if (!isVisible) return null;

  return (
    <div 
      className={`dev-center-overlay ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height
      }}
      ref={overlayRef}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
    >
      {/* Header */}
      <div 
        className="dev-center-header"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="header-left">
          <span className="title">🛠️ Development Center</span>
          <span className="status-indicator">
            {mockServices.active ? '🟡 Mock Mode' : '🔴 Backend Offline'}
          </span>
        </div>
        <div className="header-controls">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? '📈' : '📉'}
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Tab Navigation */}
          <div className="dev-center-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="dev-center-content">
            {activeTab === 'environment' && (
              <EnvironmentPanel 
                environmentState={environmentState}
                onEnvironmentChange={loadDevCenterData}
              />
            )}
            
            {activeTab === 'data' && (
              <TestDataPanel 
                testData={testData}
                onDataChange={loadDevCenterData}
              />
            )}
            
            {activeTab === 'features' && (
              <FeaturesPanel 
                featureFlags={featureFlags}
                onFeatureToggle={loadDevCenterData}
              />
            )}
            
            {activeTab === 'system' && (
              <SystemPanel 
                metrics={systemMetrics}
                mockServices={mockServices}
              />
            )}
            
            {activeTab === 'builder' && (
              <FeatureBuilderPanel />
            )}
            
            {activeTab === 'workspace' && (
              <WorkspacePanel />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Environment Management Panel
const EnvironmentPanel = ({ environmentState, onEnvironmentChange }) => {
  const handleToggle = async (setting) => {
    await environmentManager.updateSetting(setting, !environmentState.settings?.[setting]);
    onEnvironmentChange();
  };

  return (
    <div className="environment-panel">
      <h3>Environment Configuration</h3>
      
      <div className="setting-group">
        <h4>Test Mode Settings</h4>
        {[
          { key: 'showTestData', label: 'Show Test Data', desc: 'Display mock/test data instead of production' },
          { key: 'enableTestVoting', label: 'Enable Test Voting', desc: 'Allow voting in test mode' },
          { key: 'enableTestUI', label: 'Enable Test UI', desc: 'Show development UI elements' },
          { key: 'deterministicVotes', label: 'Deterministic Votes', desc: 'Generate consistent vote counts' }
        ].map(setting => (
          <div key={setting.key} className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={environmentState.settings?.[setting.key] || false}
                onChange={() => handleToggle(setting.key)}
              />
              <span className="setting-name">{setting.label}</span>
            </label>
            <p className="setting-description">{setting.desc}</p>
          </div>
        ))}
      </div>

      <div className="environment-info">
        <h4>Current Environment</h4>
        <div className="env-status">
          <span className={`status ${environmentState.isTestMode ? 'test' : 'production'}`}>
            {environmentState.isTestMode ? 'TEST MODE' : 'PRODUCTION MODE'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Test Data Management Panel
const TestDataPanel = ({ testData, onDataChange }) => {
  const [selectedChannel, setSelectedChannel] = useState(null);

  const generateTestChannels = async (count) => {
    await mockDevService.generateChannels(count);
    onDataChange();
  };

  const generateTestChatroom = async () => {
    await mockDevService.generateChatroom(`Test Room ${Date.now()}`, 'Generated for testing');
    onDataChange();
  };

  return (
    <div className="test-data-panel">
      <h3>Test Data Management</h3>
      
      <div className="data-section">
        <h4>Channels ({testData.channels.length})</h4>
        <div className="data-controls">
          <button onClick={() => generateTestChannels(1)}>+ Add Channel</button>
          <button onClick={() => generateTestChannels(5)}>+ Add 5 Channels</button>
        </div>
        <div className="data-list">
          {testData.channels.map(channel => (
            <div key={channel.id} className="data-item">
              <h5>{channel.title}</h5>
              <p>Votes: {channel.totalVotes}</p>
              <p>Candidates: {channel.candidates?.length || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="data-section">
        <h4>Chatrooms ({testData.chatrooms.length})</h4>
        <div className="data-controls">
          <button onClick={generateTestChatroom}>+ Add Chatroom</button>
        </div>
        <div className="data-list">
          {testData.chatrooms.map(room => (
            <div key={room.id} className="data-item">
              <h5>{room.name}</h5>
              <p>Participants: {room.participants}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Features Panel
const FeaturesPanel = ({ featureFlags, onFeatureToggle }) => {
  return (
    <div className="features-panel">
      <h3>Feature Flags</h3>
      
      <div className="feature-grid">
        {Object.entries(featureFlags).map(([feature, enabled]) => (
          <div key={feature} className={`feature-card ${enabled ? 'enabled' : 'disabled'}`}>
            <h4>{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
            <div className={`status-badge ${enabled ? 'enabled' : 'disabled'}`}>
              {enabled ? '✅ Enabled' : '❌ Disabled'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// System Monitoring Panel
const SystemPanel = ({ metrics, mockServices }) => {
  return (
    <div className="system-panel">
      <h3>System Monitoring</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Frontend</h4>
          <div className={`status ${metrics.frontendStatus}`}>{metrics.frontendStatus}</div>
        </div>
        
        <div className="metric-card">
          <h4>Backend</h4>
          <div className={`status ${metrics.backendStatus}`}>{metrics.backendStatus}</div>
        </div>
        
        <div className="metric-card">
          <h4>Connections</h4>
          <div className="value">{metrics.activeConnections}</div>
        </div>
        
        <div className="metric-card">
          <h4>Memory</h4>
          <div className="value">{metrics.memoryUsage}%</div>
        </div>
        
        <div className="metric-card">
          <h4>CPU</h4>
          <div className="value">{metrics.cpuUsage}%</div>
        </div>
      </div>

      {mockServices.active && (
        <div className="mock-services-info">
          <h4>🟡 Mock Services Active</h4>
          <p>Backend is unavailable. Using mock data and services for development.</p>
        </div>
      )}
    </div>
  );
};

// Feature Builder Panel (for creating new features)
const FeatureBuilderPanel = () => {
  const [featureName, setFeatureName] = useState('');
  const [featureType, setFeatureType] = useState('component');

  return (
    <div className="feature-builder-panel">
      <h3>Feature Builder</h3>
      <p>Build new features that others can add to their Relay systems</p>
      
      <div className="builder-form">
        <div className="form-group">
          <label>Feature Name</label>
          <input
            type="text"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            placeholder="e.g., Custom Voting Widget"
          />
        </div>
        
        <div className="form-group">
          <label>Feature Type</label>
          <select value={featureType} onChange={(e) => setFeatureType(e.target.value)}>
            <option value="component">UI Component</option>
            <option value="service">Backend Service</option>
            <option value="middleware">Middleware</option>
            <option value="theme">Theme/Styling</option>
            <option value="integration">External Integration</option>
          </select>
        </div>
        
        <button className="build-feature-btn">🔧 Generate Feature Template</button>
      </div>
      
      <div className="feature-templates">
        <h4>Quick Templates</h4>
        <div className="template-grid">
          <div className="template-card">
            <h5>Voting Widget</h5>
            <p>Custom voting interface</p>
          </div>
          <div className="template-card">
            <h5>Chat Component</h5>
            <p>Real-time messaging</p>
          </div>
          <div className="template-card">
            <h5>Data Visualizer</h5>
            <p>Charts and graphs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Workspace Management Panel
const WorkspacePanel = () => {
  return (
    <div className="workspace-panel">
      <h3>Workspace Management</h3>
      
      <div className="workspace-controls">
        <h4>Layout Controls</h4>
        <div className="control-grid">
          <button className="workspace-btn">📐 Reset to Grid</button>
          <button className="workspace-btn">🎯 Auto Organize</button>
          <button className="workspace-btn">📏 Snap All Panels</button>
          <button className="workspace-btn">🔄 Reset Layout</button>
        </div>
      </div>
      
      <div className="panel-management">
        <h4>Panel Management</h4>
        <div className="panel-list">
          <div className="panel-item">Command Center <button>📍</button></div>
          <div className="panel-item">Architect Bot <button>📍</button></div>
          <div className="panel-item">Navigator Bot <button>📍</button></div>
          <div className="panel-item">Terminal <button>📍</button></div>
          <div className="panel-item">File Explorer <button>📍</button></div>
        </div>
      </div>
    </div>
  );
};

export default DevCenterOverlay;
