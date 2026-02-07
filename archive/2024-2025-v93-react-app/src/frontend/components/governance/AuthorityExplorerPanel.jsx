// frontend/components/governance/AuthorityExplorerPanel.jsx
/**
 * Authority Explorer Panel
 * 
 * Implements Phase 1 - Deliverable C: No Hidden Authority (Principle 4)
 * 
 * Purpose:
 * - Shows who can perform what actions
 * - Displays authority grant chains (provable delegation)
 * - Makes authority discoverable and auditable
 * 
 * Key features:
 * - Query: "Who can approve POs for Maxwell?"
 * - Show grant chain: grant → grantor → root authority
 * - Display effective windows (start/expire timestamps)
 * - Show revocation status
 */

import React, { useState, useEffect } from 'react';
import './AuthorityExplorerPanel.css';

const AuthorityExplorerPanel = () => {
  const [queryType, setQueryType] = useState('can'); // 'can' | 'resolve' | 'grants'
  const [userId, setUserId] = useState('');
  const [capability, setCapability] = useState('');
  const [scope, setScope] = useState('');
  const [authorityRef, setAuthorityRef] = useState('');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Avgol-specific capability presets for quick testing
  const PRESET_CAPABILITIES = {
    PO_APPROVE: 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE',
    PO_COMMIT: 'STATE_TRANSITION:PURCHASE_ORDER:COMMIT',
    VENDOR_APPROVE: 'STATE_TRANSITION:VENDOR_MASTER:APPROVE',
    BOM_ACTIVATE: 'STATE_TRANSITION:BOM:ACTIVATE',
    AUTHORITY_GRANT: 'AUTHORITY_GRANT:*:*',
    AUTHORITY_REVOKE: 'AUTHORITY_REVOKE:*:*'
  };

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let url = '';
      
      switch (queryType) {
        case 'can':
          // Check if user has capability in scope
          url = `/api/authority/can?user=${encodeURIComponent(userId)}&cap=${encodeURIComponent(capability)}`;
          if (scope) {
            url += `&scope=${encodeURIComponent(scope)}`;
          }
          break;
          
        case 'resolve':
          // Resolve authority reference to capabilities
          url = `/api/authority/${encodeURIComponent(authorityRef)}/resolve`;
          break;
          
        case 'grants':
          // Get all grants for a user
          url = `/api/authority/grants?user=${encodeURIComponent(userId)}`;
          break;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Query failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setCapability(PRESET_CAPABILITIES[preset]);
  };

  return (
    <div className="authority-explorer-panel">
      <div className="panel-header">
        <h2>🔍 Authority Explorer</h2>
        <p className="principle-tag">Principle 4: No Hidden Authority</p>
      </div>

      <div className="query-type-selector">
        <button
          className={queryType === 'can' ? 'active' : ''}
          onClick={() => setQueryType('can')}
        >
          Can User...?
        </button>
        <button
          className={queryType === 'resolve' ? 'active' : ''}
          onClick={() => setQueryType('resolve')}
        >
          Resolve Authority
        </button>
        <button
          className={queryType === 'grants' ? 'active' : ''}
          onClick={() => setQueryType('grants')}
        >
          List Grants
        </button>
      </div>

      <div className="query-form">
        {queryType === 'can' && (
          <>
            <div className="form-group">
              <label>User ID:</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., user:avgol:procurement:maxwell"
              />
            </div>

            <div className="form-group">
              <label>Capability:</label>
              <div className="capability-input-group">
                <input
                  type="text"
                  value={capability}
                  onChange={(e) => setCapability(e.target.value)}
                  placeholder="e.g., STATE_TRANSITION:PURCHASE_ORDER:APPROVE"
                />
                <div className="preset-buttons">
                  <button onClick={() => applyPreset('PO_APPROVE')}>PO Approve</button>
                  <button onClick={() => applyPreset('PO_COMMIT')}>PO Commit</button>
                  <button onClick={() => applyPreset('VENDOR_APPROVE')}>Vendor Approve</button>
                  <button onClick={() => applyPreset('BOM_ACTIVATE')}>BOM Activate</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Scope (optional):</label>
              <input
                type="text"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g., avgol.site.maxwell or avgol.*"
              />
            </div>
          </>
        )}

        {queryType === 'resolve' && (
          <div className="form-group">
            <label>Authority Reference:</label>
            <input
              type="text"
              value={authorityRef}
              onChange={(e) => setAuthorityRef(e.target.value)}
              placeholder="e.g., user:avgol:procurement:maxwell"
            />
          </div>
        )}

        {queryType === 'grants' && (
          <div className="form-group">
            <label>User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., user:avgol:procurement:maxwell"
            />
          </div>
        )}

        <button
          className="execute-button"
          onClick={executeQuery}
          disabled={loading || !isQueryValid()}
        >
          {loading ? 'Querying...' : 'Execute Query'}
        </button>
      </div>

      {error && (
        <div className="error-display">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result-display">
          <h3>Result:</h3>
          {renderResult()}
        </div>
      )}
    </div>
  );

  function isQueryValid() {
    switch (queryType) {
      case 'can':
        return userId && capability;
      case 'resolve':
        return authorityRef;
      case 'grants':
        return userId;
      default:
        return false;
    }
  }

  function renderResult() {
    if (!result) return null;

    switch (queryType) {
      case 'can':
        return (
          <div className="can-result">
            <div className={`authorization-status ${result.authorized ? 'authorized' : 'denied'}`}>
              {result.authorized ? '✓ AUTHORIZED' : '✗ DENIED'}
            </div>
            <div className="reason">{result.reason}</div>
            
            {result.chain && result.chain.length > 0 && (
              <div className="grant-chain">
                <h4>Grant Chain:</h4>
                <div className="chain-items">
                  {result.chain.map((grant, idx) => (
                    <div key={idx} className="chain-item">
                      <div className="grant-id">Grant: {grant.grant_commit_id || grant.commit_id}</div>
                      <div className="grant-details">
                        <span>Granted by: {grant.grantor_authority_ref}</span>
                        <span>Scope: {grant.scope}</span>
                        {grant.expires_at_ms && (
                          <span className="expiry">
                            Expires: {new Date(grant.expires_at_ms).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.granted_capabilities && result.granted_capabilities.length > 0 && (
              <div className="capabilities-list">
                <h4>Granted Capabilities:</h4>
                <ul>
                  {result.granted_capabilities.map((cap, idx) => (
                    <li key={idx}>{cap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'resolve':
        return (
          <div className="resolve-result">
            <div className={`valid-status ${result.valid ? 'valid' : 'invalid'}`}>
              {result.valid ? '✓ VALID' : '✗ INVALID'}
            </div>
            
            {result.capabilities && result.capabilities.length > 0 && (
              <div className="capabilities-list">
                <h4>Capabilities:</h4>
                <ul>
                  {result.capabilities.map((cap, idx) => (
                    <li key={idx}>{cap}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.chain && result.chain.length > 0 && (
              <div className="grant-chain">
                <h4>Grant Chain ({result.chain.length} grants):</h4>
                <div className="chain-items">
                  {result.chain.map((grantId, idx) => (
                    <div key={idx} className="chain-item">
                      Grant {idx + 1}: {grantId}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'grants':
        return (
          <div className="grants-result">
            {result.grants && result.grants.length > 0 ? (
              <>
                <h4>Grants for {userId}:</h4>
                <div className="grants-list">
                  {result.grants.map((grant, idx) => (
                    <div key={idx} className="grant-card">
                      <div className="grant-header">
                        <span className="grant-id">ID: {grant.commit_id}</span>
                        {grant.expires_at_ms && (
                          <span className={`expiry ${isExpired(grant.expires_at_ms) ? 'expired' : ''}`}>
                            {isExpired(grant.expires_at_ms) ? 'EXPIRED' : 'Active'}
                          </span>
                        )}
                      </div>
                      <div className="grant-details">
                        <div><strong>Scope:</strong> {grant.scope}</div>
                        <div><strong>Capabilities:</strong></div>
                        <ul>
                          {grant.capabilities.map((cap, capIdx) => (
                            <li key={capIdx}>{cap}</li>
                          ))}
                        </ul>
                        <div><strong>Granted by:</strong> {grant.grantor_authority_ref}</div>
                        <div><strong>Granted at:</strong> {new Date(grant.timestamp_ms).toLocaleString()}</div>
                        {grant.expires_at_ms && (
                          <div><strong>Expires at:</strong> {new Date(grant.expires_at_ms).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>No grants found for this user.</p>
            )}
          </div>
        );

      default:
        return <pre>{JSON.stringify(result, null, 2)}</pre>;
    }
  }

  function isExpired(expiryMs) {
    return expiryMs && Date.now() > expiryMs;
  }
};

export default AuthorityExplorerPanel;
