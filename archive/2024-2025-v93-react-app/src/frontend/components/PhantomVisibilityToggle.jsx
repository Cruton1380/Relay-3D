/**
 * DEVELOPER PHANTOM VISIBILITY TOGGLE
 * Optional UI component for development/debugging phantom invites
 * Only available in development environment
 */

import React, { useState, useEffect } from 'react';

const PhantomVisibilityToggle = ({ onToggle, initialEnabled = false }) => {
  const [phantomVisible, setPhantomVisible] = useState(initialEnabled);
  const [phantomStats, setPhantomStats] = useState(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Check if we're in development environment
    setIsDevelopment(import.meta.env.DEV);
    
    if (import.meta.env.DEV) {
      fetchPhantomStats();
    }
  }, []);

  const fetchPhantomStats = async () => {
    try {
      const response = await fetch('/api/dev/phantom-stats');
      if (response.ok) {
        const stats = await response.json();
        setPhantomStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch phantom stats:', error);
    }
  };

  const handleToggle = () => {
    const newState = !phantomVisible;
    setPhantomVisible(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  if (!isDevelopment) {
    return null; // Don't render in production
  }

  return (
    <div className="phantom-dev-panel" style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#1a1a2e',
      color: '#eee',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      border: '2px solid #16213e'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '10px',
        gap: '8px'
      }}>
        <span style={{ 
          background: '#ff6b6b', 
          color: 'white', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          DEV
        </span>
        <span style={{ fontWeight: 'bold' }}>Phantom Debug Panel</span>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          gap: '6px'
        }}>
          <input
            type="checkbox"
            checked={phantomVisible}
            onChange={handleToggle}
            style={{ margin: 0 }}
          />
          <span>Show Phantom Invites in UI</span>
        </label>
      </div>

      {phantomStats && (
        <div style={{ 
          borderTop: '1px solid #333', 
          paddingTop: '10px',
          fontSize: '11px'
        }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            📊 Phantom Statistics:
          </div>
          <div>Total Phantoms: {phantomStats.totalPhantoms}</div>
          <div>Phantom Ratio: {(phantomStats.phantomRatio * 100).toFixed(1)}%</div>
          <div>Status: {phantomStats.enabled ? '🟢 Enabled' : '🔴 Disabled'}</div>
        </div>
      )}

      <div style={{ 
        marginTop: '10px', 
        fontSize: '10px', 
        color: '#888',
        borderTop: '1px solid #333',
        paddingTop: '8px'
      }}>
        <div>🔧 Development Tools</div>
        <button 
          onClick={fetchPhantomStats}
          style={{
            background: '#4ecdc4',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer',
            marginTop: '5px',
            marginRight: '5px'
          }}
        >
          Refresh Stats
        </button>
        <button 
          onClick={() => window.open('/api/dev/phantom-export', '_blank')}
          style={{
            background: '#f39c12',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer',
            marginTop: '5px'
          }}
        >
          Export Logs
        </button>
      </div>
    </div>
  );
};

/**
 * Enhanced Invite List Component with Phantom Visibility Toggle
 */
const InviteListWithPhantomDebug = ({ invites = [], showPhantoms = false }) => {
  const [phantomVisible, setPhantomVisible] = useState(false);
  const [allInvites, setAllInvites] = useState(invites);

  useEffect(() => {
          if (import.meta.env.DEV && phantomVisible) {
      // In development, fetch all invites including phantoms
      fetchInvitesWithPhantoms();
    } else {
      // Normal mode - only real invites
      setAllInvites(invites.filter(invite => !invite._phantom?.isPhantom));
    }
  }, [invites, phantomVisible]);

  const fetchInvitesWithPhantoms = async () => {
    try {
      const response = await fetch('/api/dev/invites-with-phantoms');
      if (response.ok) {
        const data = await response.json();
        setAllInvites(data.invites);
      }
    } catch (error) {
      console.error('Failed to fetch invites with phantoms:', error);
    }
  };

  const handlePhantomToggle = (visible) => {
    setPhantomVisible(visible);
  };

  const renderInvite = (invite, index) => {
    const isPhantom = invite._phantom?.isPhantom;
    
    return (
      <div 
        key={invite.id}
        style={{
          padding: '10px',
          margin: '5px 0',
          borderRadius: '6px',
          background: isPhantom ? '#ffe6e6' : '#f8f9fa',
          border: isPhantom ? '2px dashed #ff9999' : '1px solid #dee2e6',
          position: 'relative'
        }}
      >
        {isPhantom && (
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: '#ff6b6b',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            PHANTOM
          </div>
        )}
        
        <div style={{ fontWeight: 'bold' }}>
          {invite.profile?.displayName || invite.id}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          ID: {invite.id}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Invited by: {invite.inviterId}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Location: {invite.location?.city || 'Unknown'}
        </div>
        
        {isPhantom && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '11px', 
            color: '#666',
            background: '#fff',
            padding: '5px',
            borderRadius: '4px'
          }}>
            <div>🚫 Cannot vote or invite others</div>
            <div>🎭 Generated for privacy protection</div>
            <div>📊 Batch ID: {invite._phantom?.batchId}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PhantomVisibilityToggle 
        onToggle={handlePhantomToggle}
        initialEnabled={showPhantoms}
      />
      
      <div style={{ marginTop: '20px' }}>
        <h3>Community Invites</h3>
        {import.meta.env.DEV && (
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '10px' 
          }}>
            Showing: {allInvites.filter(i => !i._phantom?.isPhantom).length} real
            {phantomVisible && ` + ${allInvites.filter(i => i._phantom?.isPhantom).length} phantom`} invites
          </div>
        )}
        
        {allInvites.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            No invites to display
          </div>
        ) : (
          allInvites.map(renderInvite)
        )}
      </div>
    </div>
  );
};

export default PhantomVisibilityToggle;
export { InviteListWithPhantomDebug };
