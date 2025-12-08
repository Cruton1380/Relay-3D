//frontend/js/components/InviteManager.js
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth.jsx';
import './InviteManager.css';

const InviteManager = () => {
  const [invites, setInvites] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCount, setInviteCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [treeView, setTreeView] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInvites();
    }
  }, [user]);

  const fetchInvites = async () => {
    try {
      const response = await apiGet('/invite/user');
      setInvites(response.invites || []);
    } catch (err) {
      setError('Failed to load invites');
      console.error(err);
    }
  };

  const createInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await apiPost('/invite/create', {
        initialInviteCount: inviteCount || 1
      });
      
      setInviteCode(response.code);
      setSuccess('Invite created successfully!');
      fetchInvites();
    } catch (err) {
      setError(err.message || 'Failed to create invite');
      console.error(err);
    }
  };

  const copyInviteToClipboard = () => {
    navigator.clipboard.writeText(inviteCode)
      .then(() => setSuccess('Copied to clipboard!'))
      .catch(() => setError('Failed to copy'));
  };

  // Tree visualization of invite hierarchy
  const renderInviteTree = (inviteData, level = 0) => {
    if (!inviteData || !inviteData.length) return null;
    
    return (
      <ul className="invite-tree">
        {inviteData.map((invite) => (
          <li key={invite.id} className="invite-node">
            <div className="invite-info" style={{ marginLeft: `${level * 20}px` }}>
              <span className="invite-code">{invite.code}</span>
              <span className={`invite-status ${invite.used ? 'used' : 'available'}`}>
                {invite.used ? 'Used by ' + invite.usedBy : 'Available'}
              </span>
              <span className="invite-count">Remaining: {invite.remainingInvites}</span>
            </div>
            {invite.children && renderInviteTree(invite.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="invite-manager">
      <h2>Invite Management</h2>
      
      <div className="invite-controls">
        <form onSubmit={createInvite}>
          <div className="form-group">
            <label htmlFor="inviteCount">Invite Tokens:</label>
            <input
              type="number"
              id="inviteCount"
              min="1"
              max={user?.maxInviteCount || 5}
              value={inviteCount}
              onChange={(e) => setInviteCount(parseInt(e.target.value))}
              placeholder="Number of invites"
            />
          </div>
          <button type="submit" className="create-invite-btn">Create Invite</button>
        </form>
      </div>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      
      {inviteCode && (
        <div className="invite-code-display">
          <p>New Invite Code: <strong>{inviteCode}</strong></p>
          <button onClick={copyInviteToClipboard}>Copy to Clipboard</button>
        </div>
      )}
      
      <div className="view-controls">
        <button 
          className={treeView ? 'active' : ''}
          onClick={() => setTreeView(true)}
        >
          Tree View
        </button>
        <button
          className={!treeView ? 'active' : ''}
          onClick={() => setTreeView(false)}
        >
          List View
        </button>
      </div>
      
      <div className="invites-container">
        {treeView ? (
          <div className="tree-view">
            <h3>Invite Tree</h3>
            {renderInviteTree(invites)}
          </div>
        ) : (
          <div className="list-view">
            <h3>Your Invites</h3>
            {invites.length === 0 ? (
              <p>No invites found</p>
            ) : (
              <ul className="invite-list">
                {invites.map((invite) => (
                  <li key={invite.id} className="invite-item">
                    <span className="invite-code">{invite.code}</span>
                    <span className={`invite-status ${invite.used ? 'used' : 'available'}`}>
                      {invite.used ? 'Used' : 'Available'}
                    </span>
                    <span className="invite-count">Remaining: {invite.remainingInvites}</span>
                    {invite.used && <span className="invite-user">Used by: {invite.usedBy}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteManager;
