// frontend/components/governance/StateAwareValue.jsx
/**
 * State-Aware Value Display (Principle 6)
 * 
 * Constitutional Rule:
 * "Systems never pretend certainty when confidence is low. 
 * INDETERMINATE is a valid, honest answer."
 * 
 * Visual treatment:
 * - VERIFIED: Green check, full opacity
 * - DEGRADED: Yellow warning, reduced opacity, show missing data
 * - INDETERMINATE: Gray question mark, minimal opacity, "we don't know" message
 */

import React from 'react';
import './StateAwareValue.css';

const StateAwareValue = ({ 
  stateAwareValue, 
  label, 
  showDetails = false,
  onDetailsClick = null 
}) => {
  if (!stateAwareValue) {
    return null;
  }

  const { value, confidence, state, missing_inputs, human_readable } = stateAwareValue;

  const getStateIcon = (state) => {
    switch (state) {
      case 'VERIFIED': return '✓';
      case 'DEGRADED': return '⚠';
      case 'INDETERMINATE': return '?';
      default: return '?';
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'VERIFIED': return '#00ff88';
      case 'DEGRADED': return '#ffaa00';
      case 'INDETERMINATE': return '#888888';
      default: return '#888888';
    }
  };

  const getOpacity = (state) => {
    switch (state) {
      case 'VERIFIED': return 1.0;
      case 'DEGRADED': return 0.7;
      case 'INDETERMINATE': return 0.4;
      default: return 0.4;
    }
  };

  const formatValue = (value, state) => {
    if (state === 'INDETERMINATE' || value === null || value === undefined) {
      return '—';
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return String(value);
  };

  return (
    <div 
      className={`state-aware-value ${state.toLowerCase()}`}
      style={{ 
        borderColor: getStateColor(state),
        opacity: getOpacity(state)
      }}
    >
      {/* Label */}
      {label && (
        <div className="value-label">
          {label}
        </div>
      )}

      {/* Value Display */}
      <div className="value-display">
        <span 
          className="state-icon"
          style={{ color: getStateColor(state) }}
        >
          {getStateIcon(state)}
        </span>
        <span className="value-text">
          {formatValue(value, state)}
        </span>
        <span 
          className="confidence-badge"
          style={{ 
            backgroundColor: getStateColor(state),
            opacity: 0.8
          }}
        >
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* State Description */}
      <div className="state-description">
        {human_readable}
      </div>

      {/* Missing Inputs Warning (for DEGRADED/INDETERMINATE) */}
      {(state === 'DEGRADED' || state === 'INDETERMINATE') && missing_inputs && missing_inputs.length > 0 && (
        <div className="missing-inputs-warning">
          <strong>Missing data:</strong>
          <ul>
            {missing_inputs.map((input, index) => (
              <li key={index}>{input}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Details Button */}
      {showDetails && (
        <button 
          className="details-btn"
          onClick={onDetailsClick}
        >
          View Details
        </button>
      )}

      {/* Action Restriction (for INDETERMINATE) */}
      {state === 'INDETERMINATE' && (
        <div className="action-restriction">
          🔒 Actions disabled: Insufficient data to proceed
        </div>
      )}
    </div>
  );
};

export default StateAwareValue;
