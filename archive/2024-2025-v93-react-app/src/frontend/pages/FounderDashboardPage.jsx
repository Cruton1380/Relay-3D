import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { apiGet, apiPost } from '../services/apiClient';

const FounderDashboardPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('security');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/founder-mode/status');
      if (response.success) {
        setConfig(response.config);
      } else {
        setError('Failed to load configuration');
      }
    } catch (err) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecurityFeature = async (featureName, enabled) => {
    try {
      setSaving(true);
      const response = await apiPost(`/api/founder-mode/toggle/${featureName}`, { enabled });
      
      if (response.success) {
        // Update local config
        setConfig(prev => ({
          ...prev,
          securityToggles: {
            ...prev.securityToggles,
            [featureName]: {
              ...prev.securityToggles[featureName],
              enabled
            }
          }
        }));
      } else {
        setError(response.message || 'Failed to toggle feature');
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle feature');
    } finally {
      setSaving(false);
    }
  };

  const updateTestingFeatures = async (features) => {
    try {
      setSaving(true);
      const response = await apiPost('/api/founder-mode/testing', { features });
      
      if (response.success) {
        // Reload config to get updated testing features
        await loadConfig();
      } else {
        setError(response.message || 'Failed to update testing features');
      }
    } catch (err) {
      setError(err.message || 'Failed to update testing features');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await apiPost('/api/founder-mode/reset');
      
      if (response.success) {
        await loadConfig();
      } else {
        setError(response.message || 'Failed to reset configuration');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset configuration');
    } finally {
      setSaving(false);
    }
  };

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Feature Toggles</h3>
        <p className="text-gray-600 mb-6">
          Configure which security features are required for user onboarding and system access.
        </p>

        <div className="space-y-4">
          {config.securityToggles && Object.entries(config.securityToggles).map(([key, feature]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  {!feature.canBypass && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
              </div>
              
              <div className="flex items-center ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feature.enabled}
                    onChange={(e) => toggleSecurityFeature(key, e.target.checked)}
                    disabled={!feature.canBypass || saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {feature.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>Disabling security features may compromise network integrity. Only disable features for testing purposes and re-enable them for production use.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestingFeatures = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Testing & Development Features</h3>
        <p className="text-gray-600 mb-6">
          These features are designed for testing and development purposes only.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Mock Biometric Data</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.testingFeatures?.mockBiometricData || false}
                  onChange={(e) => updateTestingFeatures({ 
                    ...config.testingFeatures, 
                    mockBiometricData: e.target.checked 
                  })}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Use simulated biometric data instead of actual facial scanning</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Simulate Proximity Success</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.testingFeatures?.simulateProximitySuccess || false}
                  onChange={(e) => updateTestingFeatures({ 
                    ...config.testingFeatures, 
                    simulateProximitySuccess: e.target.checked 
                  })}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Always return success for proximity verification attempts</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Verbose Logging</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.testingFeatures?.verboseLogging || false}
                  onChange={(e) => updateTestingFeatures({ 
                    ...config.testingFeatures, 
                    verboseLogging: e.target.checked 
                  })}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Enable detailed logging for debugging purposes</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Skip Encryption</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.testingFeatures?.skipEncryption || false}
                  onChange={(e) => updateTestingFeatures({ 
                    ...config.testingFeatures, 
                    skipEncryption: e.target.checked 
                  })}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-600">Disable encryption for testing (NOT recommended for production)</p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Development Only</h3>
            <div className="mt-1 text-sm text-red-700">
              <p>These features should NEVER be enabled in a production environment as they compromise security and privacy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemStatus = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Founder Mode</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${config.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Founder ID:</span>
                <span className="text-sm font-mono text-gray-800">
                  {config.founderId || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm text-gray-800">
                  {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Network Settings</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Empty Network Bootstrap:</span>
                <span className="text-sm font-medium text-green-600">
                  {config.onboardingSettings?.allowEmptyNetworkBootstrap ? 'Allowed' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Debug Mode:</span>
                <span className={`text-sm font-medium ${config.onboardingSettings?.debugMode ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {config.onboardingSettings?.debugMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Auto-approve Invites:</span>
                <span className="text-sm font-medium text-blue-600">
                  {config.onboardingSettings?.autoApproveFounderInvites ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Management</h3>
        
        <div className="flex gap-4">
          <button
            onClick={resetToDefaults}
            disabled={saving}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Resetting...' : 'Reset to Defaults'}
          </button>
          
          <button
            onClick={loadConfig}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Reloading...' : 'Reload Configuration'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading founder dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!config?.enabled) {
    return (
      <div className="page-container" style={{ backgroundColor: 'var(--very-light-blue)' }}>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM12 8C10.34 8 9 9.34 9 11S10.34 14 12 14 15 12.66 15 11 13.66 8 12 8Z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Founder Mode Not Active</h1>
            <p className="text-gray-600 mb-8">
              Founder mode is not currently enabled. You need to enable founder mode to access this dashboard.
            </p>
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Founder Dashboard - Relay</title>
        <meta name="description" content="Manage founder mode settings and security configuration" />
      </Helmet>
      <div className="page-container" style={{ backgroundColor: 'var(--very-light-blue)' }}>
        <div className="max-w-6xl mx-auto py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Founder Dashboard</h1>
            <p className="text-lg text-gray-600">Configure security settings and manage system behavior</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'security'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Security Settings
                </button>
                <button
                  onClick={() => setActiveTab('testing')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'testing'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Testing Features
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'system'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  System Status
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'testing' && renderTestingFeatures()}
          {activeTab === 'system' && renderSystemStatus()}
        </div>
      </div>
    </>
  );
};

export default FounderDashboardPage; 