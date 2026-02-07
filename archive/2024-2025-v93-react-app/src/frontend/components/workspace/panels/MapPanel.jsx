import React from 'react';

const MapPanel = ({ panelId, title, type }) => {
  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>🗺️ Map Mode</h3>
      
      <div style={{ 
        padding: '12px', 
        background: '#e3f2fd', 
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #2196F3'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          📍 Street-Level View
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          2D fallback view of global activity and channel locations
        </div>
      </div>

      {/* Map Placeholder */}
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        borderRadius: '8px',
        border: '2px dashed #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>2D Map View</div>
          <div style={{ fontSize: '11px' }}>Street-level activity visualization</div>
        </div>
      </div>

      {/* Activity Summary */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>📊 Global Activity</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>1,247</div>
            <div style={{ fontSize: '11px', color: '#666' }}>Active Channels</div>
          </div>
          <div style={{
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>5,892</div>
            <div style={{ fontSize: '11px', color: '#666' }}>Online Users</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>🕒 Recent Activity</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { location: 'San Francisco, CA', activity: 'New channel created', time: '2 min ago' },
            { location: 'Tokyo, Japan', activity: 'Vote completed', time: '5 min ago' },
            { location: 'London, UK', activity: 'User joined proximity', time: '8 min ago' },
            { location: 'Sydney, Australia', activity: 'Channel discussion', time: '12 min ago' }
          ].map((item, index) => (
            <div key={index} style={{
              padding: '8px 12px',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '2px' }}>{item.location}</div>
              <div style={{ color: '#666', marginBottom: '2px' }}>{item.activity}</div>
              <div style={{ color: '#999', fontSize: '10px' }}>{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapPanel; 