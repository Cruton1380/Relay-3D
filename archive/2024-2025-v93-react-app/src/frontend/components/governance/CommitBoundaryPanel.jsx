// frontend/components/governance/CommitBoundaryPanel.jsx
/**
 * Commit Boundary Panel
 * 
 * Constitutional UI (Principle 1):
 * "Only commits with authority + evidence can change state"
 * 
 * This is the ONLY way to advance state: DRAFT → HOLD → PROPOSE → COMMIT → REVERT
 * 
 * Features:
 * - Shows current state
 * - Shows required authority for next transition
 * - Shows evidence checklist (what's missing)
 * - "Advance State" button (enabled only when gates pass)
 * - "Revert" button (requires custody signature)
 */

import React, { useState, useEffect } from 'react';
import './CommitBoundaryPanel.css';

const CommitBoundaryPanel = ({ objectId, objectType, onStateChange }) => {
  const [currentState, setCurrentState] = useState(null);
  const [nextStates, setNextStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNextState, setSelectedNextState] = useState(null);
  const [reason, setReason] = useState('');
  const [evidenceRefs, setEvidenceRefs] = useState([]);
  const [authorityRef, setAuthorityRef] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Fetch current state and allowed next states
  useEffect(() => {
    if (!objectId) return;

    fetchCurrentState();
  }, [objectId]);

  const fetchCurrentState = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/state/${objectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // Object doesn't exist yet, default to DRAFT
          setCurrentState({
            current_state: 'DRAFT',
            state_name: 'Draft (reversible, local)',
            next_possible_states: ['HOLD', 'PROPOSE']
          });
          setNextStates(['HOLD', 'PROPOSE']);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch state: ${response.statusText}`);
      }

      const data = await response.json();
      setCurrentState(data);
      setNextStates(data.next_possible_states || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceState = async () => {
    if (!selectedNextState || !reason) {
      alert('Please select a state and provide a reason');
      return;
    }

    setTransitioning(true);
    setError(null);

    try {
      const response = await fetch('/api/state/transition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          object_id: objectId,
          object_type: objectType,
          from_state: currentState.current_state,
          to_state: selectedNextState,
          authority_ref: authorityRef || `user:${getCurrentUserId()}`,
          evidence_refs: evidenceRefs,
          reason: reason,
          signature: selectedNextState === 'COMMIT' || selectedNextState === 'REVERT' 
            ? await requestSignature() 
            : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transition failed');
      }

      const data = await response.json();

      // Update UI
      alert(`Successfully transitioned to ${data.new_state}`);
      setReason('');
      setSelectedNextState(null);
      setEvidenceRefs([]);

      // Refresh state
      await fetchCurrentState();

      // Notify parent
      if (onStateChange) {
        onStateChange(data.commit);
      }
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const getCurrentUserId = () => {
    // TODO: Get from auth context
    return 'current-user';
  };

  const requestSignature = async () => {
    // TODO: Implement custody signature request
    // For now, return placeholder
    const userConsent = window.confirm(
      'This action requires custody signature. Proceed?'
    );
    return userConsent ? 'placeholder-signature' : null;
  };

  const addEvidenceRef = () => {
    const ref = prompt('Enter evidence commit ID:');
    if (ref) {
      setEvidenceRefs([...evidenceRefs, ref]);
    }
  };

  const removeEvidenceRef = (index) => {
    setEvidenceRefs(evidenceRefs.filter((_, i) => i !== index));
  };

  const getStateColor = (state) => {
    const colors = {
      DRAFT: '#888888',
      HOLD: '#ffaa00',
      PROPOSE: '#00aaff',
      COMMIT: '#00ff88',
      REVERT: '#ff4444'
    };
    return colors[state] || '#888888';
  };

  const requiresSignature = (state) => {
    return state === 'COMMIT' || state === 'REVERT';
  };

  const requiresEvidence = (state) => {
    return state === 'COMMIT';
  };

  const canAdvance = () => {
    if (!selectedNextState || !reason) return false;
    if (requiresEvidence(selectedNextState) && evidenceRefs.length === 0) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="commit-boundary-panel loading">
        <div className="spinner"></div>
        <p>Loading state...</p>
      </div>
    );
  }

  if (error && !currentState) {
    return (
      <div className="commit-boundary-panel error">
        <p className="error-message">Error: {error}</p>
        <button onClick={fetchCurrentState}>Retry</button>
      </div>
    );
  }

  return (
    <div className="commit-boundary-panel">
      <div className="panel-header">
        <h3>Commit Boundary</h3>
        <p className="constitutional-note">
          Only commits with authority + evidence can change state
        </p>
      </div>

      {/* Current State */}
      <div className="current-state-section">
        <h4>Current State</h4>
        <div 
          className="state-badge"
          style={{ backgroundColor: getStateColor(currentState.current_state) }}
        >
          <span className="state-name">{currentState.current_state}</span>
          <span className="state-description">{currentState.state_name}</span>
        </div>
      </div>

      {/* Next State Selection */}
      {nextStates.length > 0 && (
        <div className="next-state-section">
          <h4>Advance State</h4>
          
          <div className="state-options">
            {nextStates.map(state => (
              <button
                key={state}
                className={`state-option ${selectedNextState === state ? 'selected' : ''}`}
                onClick={() => setSelectedNextState(state)}
                style={{
                  borderColor: getStateColor(state)
                }}
              >
                <span className="state-name">{state}</span>
                {requiresSignature(state) && (
                  <span className="requirement-badge signature">
                    🔒 Signature Required
                  </span>
                )}
                {requiresEvidence(state) && (
                  <span className="requirement-badge evidence">
                    📋 Evidence Required
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedNextState && (
            <div className="transition-form">
              {/* Reason */}
              <div className="form-group">
                <label>Reason for Transition *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this transition is needed..."
                  rows={3}
                />
              </div>

              {/* Evidence */}
              {requiresEvidence(selectedNextState) && (
                <div className="form-group">
                  <label>Evidence References *</label>
                  <div className="evidence-list">
                    {evidenceRefs.map((ref, index) => (
                      <div key={index} className="evidence-item">
                        <span>{ref}</span>
                        <button onClick={() => removeEvidenceRef(index)}>✕</button>
                      </div>
                    ))}
                    <button className="add-evidence-btn" onClick={addEvidenceRef}>
                      + Add Evidence
                    </button>
                  </div>
                  {evidenceRefs.length === 0 && (
                    <p className="requirement-warning">
                      ⚠️ COMMIT requires at least one evidence reference
                    </p>
                  )}
                </div>
              )}

              {/* Authority */}
              <div className="form-group">
                <label>Authority Reference</label>
                <input
                  type="text"
                  value={authorityRef}
                  onChange={(e) => setAuthorityRef(e.target.value)}
                  placeholder={`Default: user:${getCurrentUserId()}`}
                />
              </div>

              {/* Advance Button */}
              <button
                className="advance-btn"
                onClick={handleAdvanceState}
                disabled={!canAdvance() || transitioning}
              >
                {transitioning ? 'Transitioning...' : `Advance to ${selectedNextState}`}
              </button>

              {error && (
                <p className="error-message">{error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Terminal State */}
      {nextStates.length === 0 && (
        <div className="terminal-state-notice">
          <p>
            This is a terminal state. Create a new object to continue.
          </p>
        </div>
      )}

      {/* State History Link */}
      <div className="panel-footer">
        <button
          className="history-btn"
          onClick={() => window.open(`/api/state/${objectId}/history`, '_blank')}
        >
          View State History
        </button>
      </div>
    </div>
  );
};

export default CommitBoundaryPanel;
