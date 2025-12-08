/**
 * BASE MODEL 1 - Network Topology Visualization
 * Simplified network health and topology display
 */
import React, { useState, useEffect, useRef } from 'react';
import './NetworkTopologyVisualization.css';

const NetworkTopologyVisualization = ({ panel, globeState, setGlobeState, compact = false }) => {
  const containerRef = useRef(null);
  const [networkData, setNetworkData] = useState({
    nodes: [],
    links: [],
    stats: {
      totalNodes: 0,
      connectedNodes: 0,
      totalConnections: 0,
      networkHealth: 100,
      averageLatency: 0,
      dataTransferred: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'network'
  const [selectedNode, setSelectedNode] = useState(null);

  // Debug log to confirm component is loaded
  useEffect(() => {
    console.log('✅ NetworkTopologyVisualization loaded and integrated!');
  }, []);

  useEffect(() => {
    generateMockNetworkData();
    const interval = setInterval(generateMockNetworkData, 10000);
    return () => clearInterval(interval);
  }, []);

  const generateMockNetworkData = () => {
    setIsLoading(true);
    
    // Simulate network data generation
    setTimeout(() => {
      const nodeCount = 8 + Math.floor(Math.random() * 12);
      const nodes = [];
      const links = [];
      
      // Generate nodes
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: `node-${i}`,
          name: `Node ${i + 1}`,
          type: i === 0 ? 'hub' : (Math.random() > 0.7 ? 'peer' : 'relay'),
          status: Math.random() > 0.1 ? 'online' : 'offline',
          latency: Math.floor(Math.random() * 200) + 20,
          connections: Math.floor(Math.random() * 5) + 1,
          dataFlow: Math.floor(Math.random() * 1000) + 100,
          location: `Region ${Math.floor(Math.random() * 5) + 1}`,
          uptime: Math.floor(Math.random() * 720) + 60 // minutes
        });
      }
      
      // Generate links
      for (let i = 1; i < nodeCount; i++) {
        if (Math.random() > 0.3) {
          links.push({
            source: nodes[0].id,
            target: nodes[i].id,
            strength: Math.random(),
            quality: Math.random() > 0.2 ? 'good' : 'poor'
          });
        }
        
        // Add some peer-to-peer connections
        if (i < nodeCount - 1 && Math.random() > 0.5) {
          links.push({
            source: nodes[i].id,
            target: nodes[i + 1].id,
            strength: Math.random() * 0.5,
            quality: Math.random() > 0.3 ? 'good' : 'poor'
          });
        }
      }
      
      const connectedNodes = nodes.filter(n => n.status === 'online').length;
      const avgLatency = nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length;
      const healthScore = (connectedNodes / nodes.length) * 100;
      
      setNetworkData({
        nodes,
        links,
        stats: {
          totalNodes: nodes.length,
          connectedNodes,
          totalConnections: links.length,
          networkHealth: Math.round(healthScore),
          averageLatency: Math.round(avgLatency),
          dataTransferred: Math.floor(Math.random() * 50000) + 10000
        }
      });
      
      setIsLoading(false);
      setError(null);
    }, 1000);
  };

  const getNodeColor = (node) => {
    if (node.status === 'offline') return '#6b7280';
    switch (node.type) {
      case 'hub': return '#3b82f6';
      case 'peer': return '#10b981';
      case 'relay': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  const getHealthColor = (health) => {
    if (health >= 90) return '#10b981';
    if (health >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const formatUptime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDataSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (error) {
    return (
      <div className="network-topology error">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>Failed to load network data</p>
          <button onClick={generateMockNetworkData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="network-topology">
      <div className="integration-status">
        <h4>✅ Network Topology Integrated!</h4>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Network monitoring and health visualization system active
        </p>
      </div>
      
      <div className="topology-header">
        <h3>Network Topology</h3>
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'network' ? 'active' : ''}`}
            onClick={() => setViewMode('network')}
          >
            Network
          </button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="network-stats">
        <div className="stat-item">
          <span className="stat-label">Health</span>
          <span 
            className="stat-value"
            style={{ color: getHealthColor(networkData.stats.networkHealth) }}
          >
            {networkData.stats.networkHealth}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Nodes</span>
          <span className="stat-value">
            {networkData.stats.connectedNodes}/{networkData.stats.totalNodes}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Latency</span>
          <span className="stat-value">{networkData.stats.averageLatency}ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data</span>
          <span className="stat-value">{formatDataSize(networkData.stats.dataTransferred)}</span>
        </div>
      </div>

      {/* Visualization Area */}
      <div ref={containerRef} className="visualization-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading network topology...</p>
          </div>
        ) : (
          <div className={`topology-view ${viewMode}`}>
            {viewMode === 'grid' ? (
              <div className="grid-view">
                {networkData.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={`node-card ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    style={{
                      borderColor: getNodeColor(node)
                    }}
                  >
                    <div className="node-header">
                      <div 
                        className="node-indicator"
                        style={{ backgroundColor: getNodeColor(node) }}
                      />
                      <span className="node-name">{node.name}</span>
                      <span className="node-type">{node.type}</span>
                    </div>
                    <div className="node-details">
                      <div className="detail-row">
                        <span>Latency:</span>
                        <span>{node.latency}ms</span>
                      </div>
                      <div className="detail-row">
                        <span>Uptime:</span>
                        <span>{formatUptime(node.uptime)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Connections:</span>
                        <span>{node.connections}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="network-view">
                <svg width="100%" height="300" className="network-svg">
                  {/* Simplified network visualization */}
                  {networkData.nodes.map((node, index) => {
                    const x = 50 + (index % 4) * 80;
                    const y = 50 + Math.floor(index / 4) * 80;
                    return (
                      <g key={node.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r={node.type === 'hub' ? 12 : 8}
                          fill={getNodeColor(node)}
                          stroke="#fff"
                          strokeWidth="2"
                          className="network-node"
                          onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                        />
                        <text
                          x={x}
                          y={y + 25}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#a0b0d0"
                        >
                          {node.name}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Draw connections */}
                  {networkData.links.map((link, index) => {
                    const sourceIndex = networkData.nodes.findIndex(n => n.id === link.source);
                    const targetIndex = networkData.nodes.findIndex(n => n.id === link.target);
                    if (sourceIndex === -1 || targetIndex === -1) return null;
                    
                    const sourceX = 50 + (sourceIndex % 4) * 80;
                    const sourceY = 50 + Math.floor(sourceIndex / 4) * 80;
                    const targetX = 50 + (targetIndex % 4) * 80;
                    const targetY = 50 + Math.floor(targetIndex / 4) * 80;
                    
                    return (
                      <line
                        key={index}
                        x1={sourceX}
                        y1={sourceY}
                        x2={targetX}
                        y2={targetY}
                        stroke={link.quality === 'good' ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="selected-node-info">
          <h4>{selectedNode.name} Details</h4>
          <div className="info-grid">
            <div><strong>Type:</strong> {selectedNode.type}</div>
            <div><strong>Status:</strong> {selectedNode.status}</div>
            <div><strong>Location:</strong> {selectedNode.location}</div>
            <div><strong>Data Flow:</strong> {formatDataSize(selectedNode.dataFlow)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTopologyVisualization;
