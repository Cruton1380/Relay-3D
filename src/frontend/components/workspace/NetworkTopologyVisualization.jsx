/**
 * NetworkTopologyVisualization - Simplified network monitoring component
 * Base Model 1 workspace integration
 */
import React, { useState, useEffect } from 'react';

const NetworkTopologyVisualization = ({ panelId, title, type }) => {
  const [networkStatus, setNetworkStatus] = useState('healthy');
  const [nodeCount, setNodeCount] = useState(12);
  const [connectionCount, setConnectionCount] = useState(47);
  const [latency, setLatency] = useState(45);
  const [uptime, setUptime] = useState(99.7);

  // Simulate network metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(20, Math.min(100, prev + (Math.random() - 0.5) * 10)));
      setNodeCount(prev => Math.max(8, Math.min(20, prev + (Math.random() > 0.7 ? 1 : -1))));
      setConnectionCount(prev => Math.max(30, Math.min(80, prev + (Math.random() - 0.5) * 5)));
      
      // Update status based on metrics
      if (latency > 80) {
        setNetworkStatus('degraded');
      } else if (latency < 30) {
        setNetworkStatus('excellent');
      } else {
        setNetworkStatus('healthy');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [latency]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'healthy': return '#3b82f6';
      case 'degraded': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#ffffff' }}>
          {title || 'Network Topology'}
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Real-time network monitoring and topology visualization
        </p>
      </div>

      {/* Network Status */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: 'rgba(45, 45, 45, 0.5)',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(networkStatus),
            marginRight: '8px'
          }} />
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            color: getStatusColor(networkStatus)
          }}>
            {networkStatus.toUpperCase()}
          </span>
        </div>
        
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Uptime: {uptime}% | Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          padding: '8px 12px',
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
            {nodeCount}
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Active Nodes
          </div>
        </div>
        
        <div style={{ 
          padding: '8px 12px',
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
            {connectionCount}
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Connections
          </div>
        </div>
        
        <div style={{ 
          padding: '8px 12px',
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
            {latency.toFixed(0)}ms
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Avg Latency
          </div>
        </div>
        
        <div style={{ 
          padding: '8px 12px',
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
            {uptime}%
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Uptime
          </div>
        </div>
      </div>

      {/* Simple Topology Visualization */}
      <div style={{ 
        flex: 1,
        backgroundColor: 'rgba(20, 20, 20, 0.5)',
        borderRadius: '6px',
        padding: '12px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          Network Topology
        </div>
        
        {/* Simulated network nodes */}
        <div style={{ position: 'relative', height: '100%' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                left: `${20 + (i * 15)}%`,
                top: `${30 + (i * 10)}%`,
                animation: 'pulse 2s infinite'
              }}
            />
          ))}
          
          {/* Connection lines */}
          <svg style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}>
            <line x1="20%" y1="35%" x2="35%" y2="40%" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
            <line x1="35%" y1="40%" x2="50%" y2="35%" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
            <line x1="50%" y1="35%" x2="65%" y2="40%" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
            <line x1="65%" y1="40%" x2="80%" y2="35%" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default NetworkTopologyVisualization; 