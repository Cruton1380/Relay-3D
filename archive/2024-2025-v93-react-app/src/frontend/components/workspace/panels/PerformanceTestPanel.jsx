// ============================================================================
// PerformanceTestPanel.jsx - Test Optimized System Performance
// ============================================================================
// DISABLED: OptimizedGlobeManager was removed during county system cleanup
// This panel is no longer functional and should be rebuilt if needed
// ============================================================================

import React, { useState, useEffect } from 'react';

const PerformanceTestPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [optimizedManager, setOptimizedManager] = useState(null);

  // DISABLED: OptimizedGlobeManager was deleted
  // useEffect(() => {
  //   if (window.earthGlobeControls?.viewer && window.earthGlobeControls?.entitiesRef) {
  //     const { OptimizedGlobeManager } = require('../../main/globe/managers/OptimizedGlobeManager.js');
  //     const manager = new OptimizedGlobeManager(
  //       window.earthGlobeControls.viewer,
  //       window.earthGlobeControls.entitiesRef
  //     );
  //     setOptimizedManager(manager);
  //   }
  // }, []);

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  const runPerformanceTest = async () => {
    if (!optimizedManager) {
      alert('Optimized manager not initialized');
      return;
    }

    setIsRunning(true);
    const results = [];

    // Test 1: Province Loading
    const test1Start = performance.now();
    try {
      const count = await optimizedManager.loadProvinces();
      const test1End = performance.now();
      const test1Time = (test1End - test1Start) / 1000;
      
      results.push({
        test: 'Province Loading',
        time: test1Time.toFixed(2),
        entities: count,
        status: test1Time < 3 ? '✅ PASS' : '❌ FAIL',
        target: '<3s'
      });
    } catch (error) {
      results.push({
        test: 'Province Loading',
        time: 'ERROR',
        entities: 0,
        status: '❌ ERROR',
        target: '<3s',
        error: error.message
      });
    }

    // Test 2: Performance Stats
    const stats = optimizedManager.getPerformanceStats();
    results.push({
      test: 'Performance Stats',
      time: `${stats.uptime}s`,
      entities: stats.totalEntities,
      status: '✅ INFO',
      target: 'N/A'
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const clearAll = () => {
    if (optimizedManager) {
      optimizedManager.clearAll();
      setTestResults([]);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!panel.isOpen) return null;

  return (
    <div className="panel-content" style={{ 
      padding: '15px',
      background: 'rgba(0, 0, 0, 0.9)',
      borderRadius: '8px',
      color: 'white',
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>
        ⚡ Performance Test
      </h3>
      
      {/* DISABLED NOTICE */}
      <div style={{
        padding: '15px',
        background: 'rgba(255, 165, 0, 0.2)',
        border: '2px solid rgba(255, 165, 0, 0.5)',
        borderRadius: '6px',
        marginBottom: '15px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ PANEL DISABLED</div>
        <div style={{ fontSize: '0.85rem' }}>
          This panel relied on OptimizedGlobeManager which was removed during county system cleanup.
          Use AdministrativeHierarchy instead for testing.
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={runPerformanceTest}
          disabled={isRunning || !optimizedManager}
          style={{
            width: '100%',
            padding: '10px',
            background: isRunning ? 'rgba(255, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: 'white',
            cursor: isRunning ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            marginBottom: '10px'
          }}
        >
          {isRunning ? '⏳ Running Tests...' : '🚀 Run Performance Test'}
        </button>

        <button
          onClick={clearAll}
          disabled={!optimizedManager}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255, 0, 0, 0.3)',
            border: '1px solid rgba(255, 0, 0, 0.5)',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🧹 Clear All
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Test Results:</h4>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '0.8rem'
          }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '8px',
                padding: '5px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{result.test}</div>
                <div>Time: {result.time}s (Target: {result.target})</div>
                <div>Entities: {result.entities}</div>
                <div style={{ 
                  color: result.status.includes('PASS') ? '#4CAF50' : 
                        result.status.includes('FAIL') ? '#f44336' : '#2196F3'
                }}>
                  {result.status}
                </div>
                {result.error && (
                  <div style={{ color: '#f44336', fontSize: '0.7rem' }}>
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
        fontSize: '0.8rem'
      }}>
        <div><strong>System Status:</strong></div>
        <div>Optimized Manager: {optimizedManager ? '✅ Ready' : '❌ Not Ready'}</div>
        <div>Viewer: {window.earthGlobeControls?.viewer ? '✅ Ready' : '❌ Not Ready'}</div>
        <div>EntitiesRef: {window.earthGlobeControls?.entitiesRef ? '✅ Ready' : '❌ Not Ready'}</div>
      </div>
    </div>
  );
};

export default PerformanceTestPanel;
