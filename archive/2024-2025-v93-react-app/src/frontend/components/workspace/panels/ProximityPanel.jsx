import React from 'react';
import { usePresence } from '../hooks/usePresence';

const ProximityPanel = ({ panelId, title, type }) => {
  const {
    nearbyUsers,
    isInProximity,
    proximityChannels,
    loading,
    joinProximityChannel,
    leaveProximityChannel,
    broadcastToProximity
  } = usePresence();

  const [broadcastMessage, setBroadcastMessage] = React.useState('');

  const handleBroadcast = async () => {
    if (broadcastMessage.trim()) {
      await broadcastToProximity(broadcastMessage);
      setBroadcastMessage('');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>🔍 Scanning for nearby activity...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>📍 Proximity Mode</h3>
      
      {/* Status */}
      <div style={{ 
        padding: '12px', 
        background: isInProximity ? '#e8f5e8' : '#fff3cd', 
        borderRadius: '8px',
        marginBottom: '16px',
        border: `1px solid ${isInProximity ? '#4CAF50' : '#ffc107'}`
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {isInProximity ? '✅ Active in Proximity' : '⚠️ No Proximity Activity'}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {isInProximity ? 'You are near other users and channels' : 'No nearby users or channels detected'}
        </div>
      </div>

      {/* Nearby Users */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>👥 Nearby Users ({nearbyUsers.length})</h4>
        {nearbyUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nearbyUsers.map(user => (
              <div key={user.id} style={{
                padding: '8px 12px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {user.distance}m away • {user.status}
                  </div>
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: user.status === 'active' ? '#28a745' : '#ffc107'
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>No nearby users detected</div>
        )}
      </div>

      {/* Proximity Channels */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>💬 Proximity Channels ({proximityChannels.length})</h4>
        {proximityChannels.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proximityChannels.map(channel => (
              <div key={channel.id} style={{
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '500' }}>{channel.name}</div>
                  <button style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Join
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {channel.userCount} users • {channel.distance}m away
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>No proximity channels available</div>
        )}
      </div>

      {/* Broadcast */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>📢 Broadcast to Proximity</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Send a message to nearby users..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleBroadcast()}
          />
          <button
            onClick={handleBroadcast}
            disabled={!broadcastMessage.trim()}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: broadcastMessage.trim() ? 'pointer' : 'not-allowed',
              opacity: broadcastMessage.trim() ? 1 : 0.6
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProximityPanel; 