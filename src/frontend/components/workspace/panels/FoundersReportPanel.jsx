/**
 * Founders Report Panel - System Parameter Configuration
 * Allows founders to establish all system parameters before launch
 */
import React, { useState, useEffect } from 'react';
import { Crown, Users, Settings, Save, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, DollarSign, Globe, Shield, Zap, Download, Upload, RotateCcw } from 'lucide-react';
import foundersReportService from '../services/foundersReportService.js';
import './FoundersReportPanel.css';

const FoundersReportPanel = ({ globeState, setGlobeState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // System Parameters State
  const [systemParams, setSystemParams] = useState({
    // Economic Parameters
    founderCommission: { value: 5, decisionMaker: 'founder', description: 'Percentage commission to founder' },
    regionalCommission: { value: 0, decisionMaker: 'founder', description: 'Percentage commission to regions' },
    voterRewards: { value: 2, decisionMaker: 'voters', description: 'Percentage rewards to active voters' },
    transactionFee: { value: 0.5, decisionMaker: 'founder', description: 'Transaction fee percentage' },
    
    // Channel Parameters
    channelStabilityThreshold: { value: 3, decisionMaker: 'founder', description: 'Channel stability threshold (months)' },
    channelCreationFee: { value: 10, decisionMaker: 'founder', description: 'Channel creation fee' },
    channelDeletionThreshold: { value: 6, decisionMaker: 'voters', description: 'Months of inactivity before deletion' },
    channelMaxCandidates: { value: 10, decisionMaker: 'founder', description: 'Maximum candidates per channel' },
    
    // Voting Parameters
    voteWeightDecay: { value: 0.1, decisionMaker: 'voters', description: 'Vote weight decay per month' },
    minimumVoteAge: { value: 18, decisionMaker: 'founder', description: 'Minimum age to vote' },
    voteConfirmationThreshold: { value: 60, decisionMaker: 'voters', description: 'Vote confirmation threshold (%)' },
    voteLockPeriod: { value: 24, decisionMaker: 'founder', description: 'Vote lock period (hours)' },
    
    // Governance Parameters
    governanceQuorum: { value: 25, decisionMaker: 'voters', description: 'Governance quorum percentage' },
    proposalTimeLimit: { value: 30, decisionMaker: 'founder', description: 'Proposal time limit (days)' },
    emergencyThreshold: { value: 75, decisionMaker: 'founder', description: 'Emergency action threshold (%)' },
    founderVetoPower: { value: true, decisionMaker: 'founder', description: 'Founder veto power' },
    
    // Privacy & Security
    dataRetentionPeriod: { value: 12, decisionMaker: 'founder', description: 'Data retention period (months)' },
    encryptionLevel: { value: 'AES-256', decisionMaker: 'founder', description: 'Encryption standard' },
    privacyDefault: { value: 'public', decisionMaker: 'voters', description: 'Default privacy setting' },
    auditTrailRetention: { value: 24, decisionMaker: 'founder', description: 'Audit trail retention (months)' },
    
    // Technical Parameters
    maxConnectionsPerUser: { value: 100, decisionMaker: 'founder', description: 'Maximum connections per user' },
    messageRetentionDays: { value: 90, decisionMaker: 'voters', description: 'Message retention period (days)' },
    backupFrequency: { value: 'daily', decisionMaker: 'founder', description: 'System backup frequency' },
    performanceThreshold: { value: 95, decisionMaker: 'founder', description: 'Performance threshold (%)' },
    
    // Regional Parameters
    regionalAutonomy: { value: 70, decisionMaker: 'voters', description: 'Regional autonomy percentage' },
    crossRegionVoting: { value: true, decisionMaker: 'voters', description: 'Allow cross-region voting' },
    regionalTaxRate: { value: 3, decisionMaker: 'founder', description: 'Regional tax rate (%)' },
    regionalMinimumPopulation: { value: 1000, decisionMaker: 'founder', description: 'Minimum population for region' }
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Sections configuration
  const sections = [
    { id: 'overview', label: 'Overview', icon: Crown, color: '#8b5cf6' },
    { id: 'economic', label: 'Economic', icon: DollarSign, color: '#10b981' },
    { id: 'channels', label: 'Channels', icon: Globe, color: '#3b82f6' },
    { id: 'voting', label: 'Voting', icon: Users, color: '#f59e0b' },
    { id: 'governance', label: 'Governance', icon: Shield, color: '#ef4444' },
    { id: 'privacy', label: 'Privacy & Security', icon: Eye, color: '#6366f1' },
    { id: 'technical', label: 'Technical', icon: Zap, color: '#06b6d4' },
    { id: 'regional', label: 'Regional', icon: Globe, color: '#84cc16' }
  ];

  // Validate parameters
  useEffect(() => {
    const errors = {};
    
    // Economic validation
    if (systemParams.founderCommission.value < 0 || systemParams.founderCommission.value > 50) {
      errors.founderCommission = 'Founder commission must be between 0-50%';
    }
    if (systemParams.regionalCommission.value < 0 || systemParams.regionalCommission.value > 30) {
      errors.regionalCommission = 'Regional commission must be between 0-30%';
    }
    if (systemParams.transactionFee.value < 0 || systemParams.transactionFee.value > 5) {
      errors.transactionFee = 'Transaction fee must be between 0-5%';
    }
    
    // Channel validation
    if (systemParams.channelStabilityThreshold.value < 1 || systemParams.channelStabilityThreshold.value > 12) {
      errors.channelStabilityThreshold = 'Stability threshold must be between 1-12 months';
    }
    if (systemParams.channelMaxCandidates.value < 3 || systemParams.channelMaxCandidates.value > 50) {
      errors.channelMaxCandidates = 'Max candidates must be between 3-50';
    }
    
    // Voting validation
    if (systemParams.voteWeightDecay.value < 0 || systemParams.voteWeightDecay.value > 1) {
      errors.voteWeightDecay = 'Vote weight decay must be between 0-1';
    }
    if (systemParams.minimumVoteAge.value < 13 || systemParams.minimumVoteAge.value > 120) {
      errors.minimumVoteAge = 'Minimum vote age must be between 13-120';
    }
    
    // Governance validation
    if (systemParams.governanceQuorum.value < 10 || systemParams.governanceQuorum.value > 90) {
      errors.governanceQuorum = 'Governance quorum must be between 10-90%';
    }
    
    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0);
  }, [systemParams]);

  // Update parameter
  const updateParameter = (key, field, value) => {
    setSystemParams(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // Save configuration
  const saveConfiguration = async () => {
    if (!isValid) {
      setSaveStatus({ type: 'error', message: 'Please fix validation errors before saving' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: 'info', message: 'Saving configuration...' });

    try {
      // Try to save to API first
      await foundersReportService.updateSystemParameters(systemParams);
      setSaveStatus({ type: 'success', message: 'Configuration saved to server successfully!' });
    } catch (error) {
      console.error('Failed to save to API, falling back to localStorage:', error);
      
      // Fallback to localStorage
      try {
        localStorage.setItem('foundersReport', JSON.stringify({
          systemParams,
          lastUpdated: new Date().toISOString(),
          version: '1.0'
        }));
        setSaveStatus({ type: 'success', message: 'Configuration saved locally (server unavailable)' });
      } catch (localError) {
        setSaveStatus({ type: 'error', message: 'Failed to save configuration' });
      }
    } finally {
      setIsSaving(false);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Load saved configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Try to load from API first
        const params = await foundersReportService.getCachedParameters();
        setSystemParams(params);
      } catch (error) {
        console.error('Failed to load configuration from API:', error);
        
        // Fallback to localStorage
        const saved = localStorage.getItem('foundersReport');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.systemParams) {
              setSystemParams(parsed.systemParams);
              return;
            }
          } catch (localError) {
            console.error('Failed to parse localStorage configuration:', localError);
          }
        }
        
        // Final fallback to default configuration
        setSystemParams(foundersReportService.getDefaultConfiguration().systemParams);
      }
    };
    
    loadConfiguration();
  }, []);

  // Render parameter input
  const renderParameterInput = (key, param) => {
    const error = validationErrors[key];
    const isBoolean = typeof param.value === 'boolean';
    const isSelect = param.value === 'AES-256' || param.value === 'daily' || param.value === 'public';

    return (
      <div key={key} className={`param-input ${error ? 'error' : ''}`}>
        <div className="param-header">
          <label className="param-label">{param.description}</label>
          <div className="param-decision-maker">
            <span className={`decision-badge ${param.decisionMaker}`}>
              {param.decisionMaker === 'founder' ? <Crown size={12} /> : <Users size={12} />}
              {param.decisionMaker === 'founder' ? 'Founder' : 'Voters'}
            </span>
          </div>
        </div>
        
        <div className="param-controls">
          {isBoolean ? (
            <div className="boolean-toggle">
              <input
                type="checkbox"
                checked={param.value}
                onChange={(e) => updateParameter(key, 'value', e.target.checked)}
                id={key}
              />
              <label htmlFor={key} className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          ) : isSelect ? (
            <select
              value={param.value}
              onChange={(e) => updateParameter(key, 'value', e.target.value)}
              className="param-select"
            >
              {key === 'encryptionLevel' && (
                <>
                  <option value="AES-256">AES-256</option>
                  <option value="AES-128">AES-128</option>
                  <option value="ChaCha20">ChaCha20</option>
                </>
              )}
              {key === 'backupFrequency' && (
                <>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </>
              )}
              {key === 'privacyDefault' && (
                <>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </>
              )}
            </select>
          ) : (
            <input
              type="number"
              value={param.value}
              onChange={(e) => updateParameter(key, 'value', parseFloat(e.target.value) || 0)}
              className="param-number"
              step={param.value < 1 ? 0.1 : 1}
              min={0}
            />
          )}
          
          <select
            value={param.decisionMaker}
            onChange={(e) => updateParameter(key, 'decisionMaker', e.target.value)}
            className="decision-select"
          >
            <option value="founder">Founder</option>
            <option value="voters">Voters</option>
          </select>
        </div>
        
        {error && <div className="param-error">{error}</div>}
      </div>
    );
  };

  // Get parameters for current section
  const getSectionParams = (sectionId) => {
    const sectionMap = {
      economic: ['founderCommission', 'regionalCommission', 'voterRewards', 'transactionFee'],
      channels: ['channelStabilityThreshold', 'channelCreationFee', 'channelDeletionThreshold', 'channelMaxCandidates'],
      voting: ['voteWeightDecay', 'minimumVoteAge', 'voteConfirmationThreshold', 'voteLockPeriod'],
      governance: ['governanceQuorum', 'proposalTimeLimit', 'emergencyThreshold', 'founderVetoPower'],
      privacy: ['dataRetentionPeriod', 'encryptionLevel', 'privacyDefault', 'auditTrailRetention'],
      technical: ['maxConnectionsPerUser', 'messageRetentionDays', 'backupFrequency', 'performanceThreshold'],
      regional: ['regionalAutonomy', 'crossRegionVoting', 'regionalTaxRate', 'regionalMinimumPopulation']
    };
    
    return sectionMap[sectionId] || [];
  };

  return (
    <div className="founders-report-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-content">
          <div className="header-title">
            <Crown size={20} />
            <h3>Founders Report</h3>
          </div>
          <div className="header-status">
            {isValid ? (
              <div className="status-valid">
                <CheckCircle size={16} />
                <span>Valid Configuration</span>
              </div>
            ) : (
              <div className="status-invalid">
                <AlertTriangle size={16} />
                <span>Validation Errors</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="action-button export-button"
            onClick={async () => {
              try {
                await foundersReportService.exportConfiguration();
                setSaveStatus({ type: 'success', message: 'Configuration exported successfully!' });
              } catch (error) {
                console.error('Failed to export via API, using local export:', error);
                
                // Fallback to local export
                const configData = {
                  systemParams,
                  lastUpdated: new Date().toISOString(),
                  version: '1.0',
                  exportedAt: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `founders-report-${Date.now()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                setSaveStatus({ type: 'success', message: 'Configuration exported locally!' });
              }
            }}
            title="Export Configuration"
          >
            <Download size={16} />
          </button>
          
          <button
            className="action-button reset-button"
            onClick={async () => {
              if (window.confirm('Are you sure you want to reset to default configuration?')) {
                try {
                  await foundersReportService.resetToDefaults();
                  const params = await foundersReportService.getCachedParameters();
                  setSystemParams(params);
                  setSaveStatus({ type: 'success', message: 'Configuration reset to defaults!' });
                } catch (error) {
                  console.error('Failed to reset via API, using local reset:', error);
                  
                  // Fallback to local reset
                  const defaultConfig = foundersReportService.getDefaultConfiguration();
                  setSystemParams(defaultConfig.systemParams);
                  localStorage.setItem('foundersReport', JSON.stringify(defaultConfig));
                  setSaveStatus({ type: 'success', message: 'Configuration reset locally!' });
                }
              }
            }}
            title="Reset to Defaults"
          >
            <RotateCcw size={16} />
          </button>
          
          <button
            className="save-button"
            onClick={saveConfiguration}
            disabled={isSaving || !isValid}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className={`save-status ${saveStatus.type}`}>
          {saveStatus.type === 'success' && <CheckCircle size={16} />}
          {saveStatus.type === 'error' && <AlertTriangle size={16} />}
          {saveStatus.type === 'info' && <Clock size={16} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="section-navigation">
        {sections.map(section => {
          const Icon = section.icon;
          const sectionParams = getSectionParams(section.id);
          const hasErrors = sectionParams.some(param => validationErrors[param]);
          
          return (
            <button
              key={section.id}
              className={`section-nav-btn ${activeSection === section.id ? 'active' : ''} ${hasErrors ? 'has-errors' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <Icon size={16} style={{ color: section.color }} />
              <span>{section.label}</span>
              {hasErrors && <div className="error-indicator" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="panel-content">
        {activeSection === 'overview' && (
          <div className="overview-section">
            <div className="overview-stats">
              <div className="stat-card">
                <h4>Total Parameters</h4>
                <div className="stat-value">{Object.keys(systemParams).length}</div>
              </div>
              <div className="stat-card">
                <h4>Founder Decisions</h4>
                <div className="stat-value">
                  {Object.values(systemParams).filter(p => p.decisionMaker === 'founder').length}
                </div>
              </div>
              <div className="stat-card">
                <h4>Voter Decisions</h4>
                <div className="stat-value">
                  {Object.values(systemParams).filter(p => p.decisionMaker === 'voters').length}
                </div>
              </div>
              <div className="stat-card">
                <h4>Validation Status</h4>
                <div className={`stat-value ${isValid ? 'valid' : 'invalid'}`}>
                  {isValid ? 'Valid' : `${Object.keys(validationErrors).length} Errors`}
                </div>
              </div>
            </div>
            
            <div className="overview-summary">
              <h4>System Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Economic Model:</strong> {systemParams.founderCommission.value}% founder commission, {systemParams.regionalCommission.value}% regional commission
                </div>
                <div className="summary-item">
                  <strong>Channel Policy:</strong> {systemParams.channelStabilityThreshold.value} month stability, {systemParams.channelMaxCandidates.value} max candidates
                </div>
                <div className="summary-item">
                  <strong>Voting System:</strong> {systemParams.voteConfirmationThreshold.value}% confirmation threshold, {systemParams.voteLockPeriod.value}h lock period
                </div>
                <div className="summary-item">
                  <strong>Governance:</strong> {systemParams.governanceQuorum.value}% quorum, {systemParams.proposalTimeLimit.value} day proposals
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection !== 'overview' && (
          <div className="parameters-section">
            <div className="section-header">
              <h4>{sections.find(s => s.id === activeSection)?.label} Parameters</h4>
              <p>Configure system parameters for {sections.find(s => s.id === activeSection)?.label.toLowerCase()} functionality</p>
            </div>
            
            <div className="parameters-grid">
              {getSectionParams(activeSection).map(paramKey => 
                renderParameterInput(paramKey, systemParams[paramKey])
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundersReportPanel; 