import React, { useState } from 'react';
import { Settings, TestTube, Globe, AlertCircle } from 'lucide-react';
import { useEnvironment } from '../../hooks/useEnvironment';
import './TestModeToggle.css';

const TestModeToggle = ({ className = '' }) => {
  const { 
    isTestMode, 
    shouldShowTestData, 
    settings,
    toggleTestMode, 
    updateSetting 
  } = useEnvironment();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTestModeToggle = async () => {
    setIsTransitioning(true);
    try {
      await toggleTestMode();
      // Brief delay to show transition state
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

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !settings?.enableTestUI) {
    return null;
  }

  return (
    <div className={`test-mode-toggle ${className}`}>
      {/* Main Toggle Button */}
      <button 
        className={`toggle-button ${isTestMode ? 'test-mode' : 'live-mode'} ${isTransitioning ? 'transitioning' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isTestMode ? 'Test Mode Active' : 'Live Mode Active'}
        disabled={isTransitioning}
      >
        {isTestMode ? (
          <TestTube className="icon" size={16} />
        ) : (
          <Globe className="icon" size={16} />
        )}
        <span className="mode-text">
          {isTransitioning ? 'Switching...' : (isTestMode ? 'Test Mode' : 'Live Mode')}
        </span>
        <Settings 
          className={`settings-icon ${isExpanded ? 'expanded' : ''}`} 
          size={14} 
        />
      </button>

      {/* Expanded Settings Panel */}
      {isExpanded && (
        <div className="settings-panel">
          <div className="panel-header">
            <h4>Environment Settings</h4>
            <button 
              className="close-button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          <div className="setting-section">
            <div className="main-toggle">
              <button 
                className={`mode-switch ${isTestMode ? 'test' : 'live'}`}
                onClick={handleTestModeToggle}
                disabled={isTransitioning}
              >
                <div className="switch-track">
                  <div className="switch-thumb">
                    {isTestMode ? (
                      <TestTube size={12} />
                    ) : (
                      <Globe size={12} />
                    )}
                  </div>
                </div>
                <span className="switch-label">
                  {isTestMode ? 'Test Mode' : 'Live Mode'}
                </span>
              </button>
            </div>

            {isTestMode && (
              <div className="test-settings">
                <div className="warning-banner">
                  <AlertCircle size={14} />
                  <span>Test mode uses demo data</span>
                </div>
                
                <div className="setting-group">
                  <label className="setting-item">
                    <input
                      type="checkbox"
                      checked={settings?.showTestData || false}
                      onChange={(e) => handleSettingChange('showTestData', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="setting-label">Show Test Data</span>
                  </label>

                  <label className="setting-item">
                    <input
                      type="checkbox"
                      checked={settings?.enableTestVoting || false}
                      onChange={(e) => handleSettingChange('enableTestVoting', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="setting-label">Enable Test Voting</span>
                  </label>

                  <label className="setting-item">
                    <input
                      type="checkbox"
                      checked={settings?.deterministicVotes || false}
                      onChange={(e) => handleSettingChange('deterministicVotes', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="setting-label">Deterministic Vote Counts</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="panel-footer">
            <small>
              Current: {shouldShowTestData ? 'Demo Data' : 'Live Data'}
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestModeToggle;
