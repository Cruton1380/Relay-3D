// pages/Relay3DFilamentPage.jsx
import React, { useState, useEffect } from 'react';
import RelayFilamentRenderer from '../components/relay-3d/RelayFilamentRenderer';
import filamentDataService from '../services/filamentDataService';
import { sampleRenderSpec } from '../components/relay-3d/data/sampleRenderSpec';
import './Relay3DFilamentPage.css';

/**
 * Relay3DFilamentPage - Demo page for 3D filament visualization
 * Integrates with votingEngine.mjs for real-time metrics
 */
export default function Relay3DFilamentPage() {
  const [renderSpec, setRenderSpec] = useState(sampleRenderSpec);
  const [isLoading, setIsLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial data load
    loadData();

    // Subscribe to real-time updates if using real data
    let unsubscribe;
    if (useRealData) {
      unsubscribe = filamentDataService.subscribeToUpdates(
        'branch.finance.ap',
        (data) => {
          setRenderSpec(data);
        }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [useRealData]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useRealData) {
        const data = await filamentDataService.fetchFilamentData();
        setRenderSpec(data);
      } else {
        // Use sample data
        setRenderSpec(sampleRenderSpec);
      }
    } catch (err) {
      console.error('Error loading filament data:', err);
      setError(err.message);
      // Fallback to sample data
      setRenderSpec(sampleRenderSpec);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (actionType, node) => {
    console.log(`🎬 Action: ${actionType}`, node);
    
    // Here you would typically call backend API
    // For now, just log the action
    
    switch (actionType) {
      case 'hold':
        console.log('Holding filament:', node?.id);
        break;
      case 'reconcile':
        console.log('Reconciling filament:', node?.id);
        // Could trigger: POST /api/filaments/:id/reconcile
        break;
      case 'fork':
        console.log('Forking filament:', node?.id);
        break;
      case 'expire':
        console.log('Expiring filament:', node?.id);
        break;
      default:
        console.log('Unknown action:', actionType);
    }
  };

  const toggleDataSource = () => {
    setUseRealData(!useRealData);
  };

  if (isLoading) {
    return (
      <div className="relay-3d-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading 3D Filament Visualization...</div>
      </div>
    );
  }

  return (
    <div className="relay-3d-filament-page">
      {/* Data source toggle */}
      <div className="data-source-toggle">
        <button
          onClick={toggleDataSource}
          className={`toggle-btn ${useRealData ? 'real' : 'sample'}`}
        >
          {useRealData ? '📡 Real Data' : '🎨 Sample Data'}
        </button>
        {error && (
          <div className="error-notice">
            ⚠️ Using fallback data: {error}
          </div>
        )}
      </div>

      {/* 3D Renderer */}
      <RelayFilamentRenderer
        renderSpec={renderSpec}
        onAction={handleAction}
      />

      {/* Info overlay */}
      <div className="info-overlay">
        <div className="info-title">Relay 3D Filament Visualization</div>
        <div className="info-subtitle">
          Invoice Payment Three-Way Match Network
        </div>
        <div className="info-metrics">
          <div className="info-metric">
            <span className="metric-label">Nodes:</span>
            <span className="metric-value">{renderSpec?.nodes?.length || 0}</span>
          </div>
          <div className="info-metric">
            <span className="metric-label">Edges:</span>
            <span className="metric-value">{renderSpec?.edges?.length || 0}</span>
          </div>
          <div className="info-metric">
            <span className="metric-label">Branch:</span>
            <span className="metric-value">{renderSpec?.branch?.branchId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Controls help */}
      <div className="controls-help">
        <div className="help-title">🎮 Controls</div>
        <div className="help-item">🖱️ Left Click + Drag: Rotate</div>
        <div className="help-item">🖱️ Right Click + Drag: Pan</div>
        <div className="help-item">🖱️ Scroll: Zoom</div>
        <div className="help-item">🖱️ Click Node: Select</div>
      </div>
    </div>
  );
}
