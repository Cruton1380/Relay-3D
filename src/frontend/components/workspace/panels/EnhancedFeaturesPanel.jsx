/**
 * Enhanced Features Panel
 * Showcases the recently implemented enhanced features:
 * - Sybil Defense System
 * - Channel Discovery Service
 * - Enhanced Window Management
 * - Blockchain Integration
 */
import React, { useState, useEffect } from 'react';
import sybilDefenseService from '../../../services/sybilDefenseService.js';
import channelDiscoveryService from '../../../services/channelDiscoveryService.js';

const EnhancedFeaturesPanel = ({ panel, globeState, setGlobeState, layout, updatePanel, enhancedFeaturesStatus }) => {
  const [sybilMetrics, setSybilMetrics] = useState(null);
  const [discoveryStats, setDiscoveryStats] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Load enhanced features metrics
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Load Sybil defense metrics
        if (enhancedFeaturesStatus?.sybilDefense) {
          const metrics = await sybilDefenseService.getSybilResistanceMetrics();
          setSybilMetrics(metrics);
        }

        // Load channel discovery stats
        if (enhancedFeaturesStatus?.channelDiscovery) {
          const stats = {
            discoveredChannels: channelDiscoveryService.discoveredChannels.size,
            joinedChannels: channelDiscoveryService.joinedChannels.size,
            topicRows: channelDiscoveryService.topicRows.size,
            proximityChannels: channelDiscoveryService.proximityChannels.size
          };
          setDiscoveryStats(stats);
        }
      } catch (error) {
        console.error('Failed to load enhanced features metrics:', error);
      }
    };

    loadMetrics();
  }, [enhancedFeaturesStatus]);

  // Test Sybil defense system
  const testSybilDefense = async () => {
    setIsRunningTest(true);
    try {
      const testUserId = `test-user-${Date.now()}`;
      const testData = {
        biometricData: null,
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        behaviorData: {
          eventType: 'test',
          timestamp: Date.now(),
          voteOption: 'test-candidate',
          interactionUserId: 'test-interaction'
        },
        socialData: {
          connections: ['test-connection-1', 'test-connection-2'],
          trustScore: 0.7
        },
        proximityData: {
          locations: ['test-location-1', 'test-location-2'],
          history: []
        }
      };

      const result = await sybilDefenseService.performSybilResistanceCheck(testUserId, testData);
      
      setTestResults(prev => ({
        ...prev,
        sybilDefense: {
          success: true,
          result,
          timestamp: Date.now()
        }
      }));

      console.log('✅ Sybil defense test completed:', result);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        sybilDefense: {
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }));
      console.error('❌ Sybil defense test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Test channel discovery system
  const testChannelDiscovery = async () => {
    setIsRunningTest(true);
    try {
      const result = await channelDiscoveryService.discoverChannels({
        search: 'test',
        limit: 5
      });

      setTestResults(prev => ({
        ...prev,
        channelDiscovery: {
          success: true,
          result,
          timestamp: Date.now()
        }
      }));

      console.log('✅ Channel discovery test completed:', result);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        channelDiscovery: {
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }));
      console.error('❌ Channel discovery test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  const getStatusIcon = (status) => {
    return status ? '✅' : '❌';
  };

  const getTestResultIcon = (testName) => {
    const test = testResults[testName];
    if (!test) return '⏳';
    return test.success ? '✅' : '❌';
  };

  return (
    <div className="enhanced-features-panel">
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        marginBottom: '16px', 
        color: '#ffffff',
        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
        paddingBottom: '8px'
      }}>
        🚀 Enhanced Features Status
      </h3>

      {/* Feature Status Overview */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e5e7eb' }}>
          System Status
        </h4>
        <div style={{ 
          background: 'rgba(31, 41, 55, 0.5)', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#9ca3af' }}>🛡️ Sybil Defense:</span>
            <span style={{ color: enhancedFeaturesStatus?.sybilDefense ? '#10b981' : '#ef4444' }}>
              {getStatusIcon(enhancedFeaturesStatus?.sybilDefense)} 
              {enhancedFeaturesStatus?.sybilDefense ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#9ca3af' }}>🔍 Channel Discovery:</span>
            <span style={{ color: enhancedFeaturesStatus?.channelDiscovery ? '#10b981' : '#ef4444' }}>
              {getStatusIcon(enhancedFeaturesStatus?.channelDiscovery)} 
              {enhancedFeaturesStatus?.channelDiscovery ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9ca3af' }}>🪟 Enhanced Windows:</span>
            <span style={{ color: enhancedFeaturesStatus?.enhancedWindowManagement ? '#10b981' : '#ef4444' }}>
              {getStatusIcon(enhancedFeaturesStatus?.enhancedWindowManagement)} 
              {enhancedFeaturesStatus?.enhancedWindowManagement ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Sybil Defense Metrics */}
      {sybilMetrics && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e5e7eb' }}>
            🛡️ Sybil Defense Metrics
          </h4>
          <div style={{ 
            background: 'rgba(31, 41, 55, 0.5)', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af' }}>User Profiles:</span>
              <span style={{ color: '#ffffff' }}>{sybilMetrics.userProfilesCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af' }}>Suspicious Patterns:</span>
              <span style={{ color: '#ffffff' }}>{sybilMetrics.suspiciousPatternsCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Verification Events:</span>
              <span style={{ color: '#ffffff' }}>{sybilMetrics.verificationEventsCount || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Channel Discovery Stats */}
      {discoveryStats && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e5e7eb' }}>
            🔍 Channel Discovery Stats
          </h4>
          <div style={{ 
            background: 'rgba(31, 41, 55, 0.5)', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af' }}>Discovered Channels:</span>
              <span style={{ color: '#ffffff' }}>{discoveryStats.discoveredChannels}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af' }}>Joined Channels:</span>
              <span style={{ color: '#ffffff' }}>{discoveryStats.joinedChannels}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af' }}>Topic Rows:</span>
              <span style={{ color: '#ffffff' }}>{discoveryStats.topicRows}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Proximity Channels:</span>
              <span style={{ color: '#ffffff' }}>{discoveryStats.proximityChannels}</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {(testResults.sybilDefense || testResults.channelDiscovery) && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e5e7eb' }}>
            🧪 Test Results
          </h4>
          <div style={{ 
            background: 'rgba(31, 41, 55, 0.5)', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af' }}>Sybil Defense Test:</span>
              <span style={{ color: testResults.sybilDefense?.success ? '#10b981' : '#ef4444' }}>
                {getTestResultIcon('sybilDefense')} 
                {testResults.sybilDefense?.success ? 'Passed' : 'Failed'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Channel Discovery Test:</span>
              <span style={{ color: testResults.channelDiscovery?.success ? '#10b981' : '#ef4444' }}>
                {getTestResultIcon('channelDiscovery')} 
                {testResults.channelDiscovery?.success ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e5e7eb' }}>
          🧪 Test Controls
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={testSybilDefense}
            disabled={isRunningTest || !enhancedFeaturesStatus?.sybilDefense}
            style={{
              padding: '6px 12px',
              background: enhancedFeaturesStatus?.sybilDefense 
                ? 'rgba(59, 130, 246, 0.8)' 
                : 'rgba(75, 85, 99, 0.5)',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '11px',
              cursor: enhancedFeaturesStatus?.sybilDefense && !isRunningTest ? 'pointer' : 'not-allowed',
              opacity: enhancedFeaturesStatus?.sybilDefense && !isRunningTest ? 1 : 0.6
            }}
          >
            {isRunningTest ? '⏳ Testing...' : '🛡️ Test Sybil Defense'}
          </button>
          
          <button
            onClick={testChannelDiscovery}
            disabled={isRunningTest || !enhancedFeaturesStatus?.channelDiscovery}
            style={{
              padding: '6px 12px',
              background: enhancedFeaturesStatus?.channelDiscovery 
                ? 'rgba(59, 130, 246, 0.8)' 
                : 'rgba(75, 85, 99, 0.5)',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '11px',
              cursor: enhancedFeaturesStatus?.channelDiscovery && !isRunningTest ? 'pointer' : 'not-allowed',
              opacity: enhancedFeaturesStatus?.channelDiscovery && !isRunningTest ? 1 : 0.6
            }}
          >
            {isRunningTest ? '⏳ Testing...' : '🔍 Test Discovery'}
          </button>
        </div>
      </div>

      {/* Feature Information */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e5e7eb' }}>
          📚 Feature Information
        </h4>
        <div style={{ 
          background: 'rgba(31, 41, 55, 0.5)', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
            <strong>🛡️ Sybil Defense:</strong> Multi-layer anti-fraud system with biometric, device, behavior, social, and proximity verification.
          </div>
          <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
            <strong>🔍 Channel Discovery:</strong> Advanced search with topic row organization, geographic filtering, and democratic rankings.
          </div>
          <div style={{ color: '#9ca3af' }}>
            <strong>🪟 Enhanced Windows:</strong> Grid-based window management with recent positions, layout favorites, and proximity filtering.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeaturesPanel; 