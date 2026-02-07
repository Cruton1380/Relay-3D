// relay-3d/hud/MetricsPanel.jsx
import React from 'react';
import './MetricsPanel.css';

/**
 * MetricsPanel - Left HUD panel showing selected filament metrics
 */
export default function MetricsPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <div className="relay-hud-panel relay-metrics-panel">
        <div className="header">FILAMENT VISUALIZATION</div>
        <div className="subtitle">Select a node to view metrics</div>
        <div className="axes-guide">
          <div>Y↓ history_depth</div>
          <div>X→ present_surface</div>
          <div>Z⟷ speculation_outward</div>
        </div>
      </div>
    );
  }

  const {
    id,
    label,
    kind,
    confidence,
    pressure,
    deltaPR,
    status,
    metadata = {}
  } = selectedNode;

  // Calculate ERI (Expected Reality Index) - mock for now
  const eri = (confidence / 100).toFixed(2);
  const eriFloor = 0.80;

  // Determine status color
  const statusClass = status === 'RECONCILING' ? 'status-reconciling' :
                      status === 'DIVERGING' ? 'status-diverging' :
                      status === 'STABLE' ? 'status-stable' : '';

  return (
    <div className="relay-hud-panel relay-metrics-panel">
      <div className="header">SELECTED FILAMENT:</div>
      <div className="filament-id">{label || id}</div>

      <div className="metrics">
        {/* Canon: Clinical instrument data, not metaphor */}
        <div className="metric">
          <span className="label">KIND:</span>
          <span className="value">{kind}</span>
        </div>
        <div className="metric">
          <span className="label">Confidence:</span>
          <span className={`value confidence-${Math.floor(confidence / 10) * 10}`}>
            {confidence}%
          </span>
        </div>
        <div className="metric">
          <span className="label">Δ(PR):</span>
          <span className={`value heat-${deltaPR > 20 ? 'high' : deltaPR > 10 ? 'medium' : 'low'}`}>
            {deltaPR}
          </span>
        </div>
        <div className="metric">
          <span className="label">Pressure:</span>
          <span className={`value pressure-${Math.floor(pressure / 10) * 10}`}>
            {pressure}
          </span>
        </div>
        <div className="metric">
          <span className="label">Status:</span>
          <span className={`value ${statusClass}`}>
            {status}
          </span>
        </div>
      </div>

      {metadata.service && (
        <div className="details">
          <div className="detail-item">
            <span className="icon">◆</span>
            <span>Service: {metadata.service}</span>
          </div>
          {metadata.authority && (
            <div className="detail-item">
              <span className="icon">🔑</span>
              <span>Authority: {metadata.authority}</span>
            </div>
          )}
          {metadata.resource && (
            <div className="detail-item">
              <span className="icon">📦</span>
              <span>Resource: {metadata.resource}</span>
            </div>
          )}
        </div>
      )}

      <div className="axes-guide">
        <div>Y↓ history_depth</div>
        <div>X→ present_surface</div>
        <div>Z⟷ speculation_outward</div>
      </div>
    </div>
  );
}
