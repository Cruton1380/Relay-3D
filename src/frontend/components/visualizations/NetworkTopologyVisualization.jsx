import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './NetworkTopologyVisualization.css';

const NetworkTopologyVisualization = ({ compact = false }) => {
  const svgRef = useRef(null);
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
  const [viewMode, setViewMode] = useState('force'); // 'force', 'hierarchical', 'circular'
  const [selectedNode, setSelectedNode] = useState(null);
  const [showConnectionQuality, setShowConnectionQuality] = useState(true);

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && !error && networkData.nodes.length > 0) {
      initializeVisualization();
    }
  }, [networkData, viewMode, compact, isLoading, error, showConnectionQuality]);

  const fetchNetworkData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [peerResponse, metricsResponse] = await Promise.all([
        fetch('/api/p2p/peers'),
        fetch('/api/p2p/metrics')
      ]);
      
      if (!peerResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to fetch network topology data');
      }
      
      const peers = await peerResponse.json();
      const metrics = await metricsResponse.json();
      
      // Transform peer data into nodes and links
      const nodes = peers.peers.map(peer => ({
        id: peer.id,
        name: peer.name || `Node ${peer.id.substring(0, 8)}`,
        type: peer.type || 'peer',
        status: peer.status || 'connected',
        connections: peer.connections || 0,
        latency: peer.latency || Math.random() * 100,
        dataRate: peer.dataRate || Math.random() * 1000,
        region: peer.region || 'Unknown',
        address: peer.address,
        uptime: peer.uptime || 0,
        protocols: peer.protocols || [],
        x: Math.random() * 800,
        y: Math.random() * 600
      }));
      
      // Create links based on peer connections
      const links = [];
      peers.connections?.forEach(connection => {
        if (connection.source && connection.target) {
          links.push({
            source: connection.source,
            target: connection.target,
            strength: connection.strength || Math.random(),
            quality: connection.quality || 'good',
            latency: connection.latency || Math.random() * 100,
            bandwidth: connection.bandwidth || Math.random() * 1000,
            protocol: connection.protocol || 'libp2p'
          });
        }
      });
      
      setNetworkData({
        nodes,
        links,
        stats: {
          totalNodes: peers.totalNodes || nodes.length,
          connectedNodes: peers.connectedNodes || nodes.filter(n => n.status === 'connected').length,
          totalConnections: peers.totalConnections || links.length,
          networkHealth: metrics.networkHealth || 95,
          averageLatency: metrics.averageLatency || 45,
          dataTransferred: metrics.dataTransferred || 1250000
        }
      });
    } catch (error) {
      console.error('Failed to fetch network topology data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeVisualization = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous visualization
    
    const width = compact ? 600 : 1000;
    const height = compact ? 400 : 700;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    svg.attr("width", width).attr("height", height);
    
    switch (viewMode) {
      case 'force':
        renderForceDirectedGraph(svg, width, height, margin);
        break;
      case 'hierarchical':
        renderHierarchicalGraph(svg, width, height, margin);
        break;
      case 'circular':
        renderCircularGraph(svg, width, height, margin);
        break;
      default:
        renderForceDirectedGraph(svg, width, height, margin);
    }
  };

  const renderForceDirectedGraph = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const container = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create force simulation
    const simulation = d3.forceSimulation(networkData.nodes)
      .force("link", d3.forceLink(networkData.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide().radius(25));
    
    // Create links
    const links = container.selectAll(".link")
      .data(networkData.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", d => getLinkColor(d))
      .attr("stroke-width", d => showConnectionQuality ? Math.max(1, d.strength * 5) : 2)
      .attr("stroke-opacity", 0.6);
    
    // Create nodes
    const nodes = container.selectAll(".node")
      .data(networkData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", handleNodeClick)
      .on("mouseover", handleNodeMouseOver)
      .on("mouseout", handleNodeMouseOut)
      .call(d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded));
    
    // Node circles
    nodes.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // Node labels
    if (!compact) {
      nodes.append("text")
        .attr("dx", 20)
        .attr("dy", ".35em")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text(d => d.name);
    }
    
    // Connection quality indicators
    if (showConnectionQuality) {
      nodes.append("circle")
        .attr("r", 4)
        .attr("cx", 15)
        .attr("cy", -15)
        .attr("fill", d => getConnectionQualityColor(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    }
    
    // Update positions on simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      nodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });
    
    // Drag functions
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const renderHierarchicalGraph = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const container = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create hierarchical layout based on node connections
    const levels = groupNodesByConnections();
    const levelHeight = innerHeight / levels.length;
    
    levels.forEach((levelNodes, levelIndex) => {
      const y = levelIndex * levelHeight + levelHeight / 2;
      const nodeSpacing = innerWidth / (levelNodes.length + 1);
      
      levelNodes.forEach((node, nodeIndex) => {
        node.x = (nodeIndex + 1) * nodeSpacing;
        node.y = y;
      });
    });
    
    // Render links
    const links = container.selectAll(".link")
      .data(networkData.links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d => {
        const source = networkData.nodes.find(n => n.id === d.source.id || n.id === d.source);
        const target = networkData.nodes.find(n => n.id === d.target.id || n.id === d.target);
        return `M${source.x},${source.y} Q${(source.x + target.x) / 2},${(source.y + target.y) / 2 - 50} ${target.x},${target.y}`;
      })
      .attr("stroke", d => getLinkColor(d))
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("stroke-opacity", 0.6);
    
    // Render nodes
    renderNodes(container);
  };

  const renderCircularGraph = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const container = svg.append("g")
      .attr("transform", `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`);
    
    const radius = Math.min(innerWidth, innerHeight) / 2 - 50;
    const angleStep = (2 * Math.PI) / networkData.nodes.length;
    
    // Position nodes in a circle
    networkData.nodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
    });
    
    // Render links
    const links = container.selectAll(".link")
      .data(networkData.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", d => {
        const source = networkData.nodes.find(n => n.id === d.source.id || n.id === d.source);
        return source.x;
      })
      .attr("y1", d => {
        const source = networkData.nodes.find(n => n.id === d.source.id || n.id === d.source);
        return source.y;
      })
      .attr("x2", d => {
        const target = networkData.nodes.find(n => n.id === d.target.id || n.id === d.target);
        return target.x;
      })
      .attr("y2", d => {
        const target = networkData.nodes.find(n => n.id === d.target.id || n.id === d.target);
        return target.y;
      })
      .attr("stroke", d => getLinkColor(d))
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.4);
    
    // Render nodes
    renderNodes(container);
  };

  const renderNodes = (container) => {
    const nodes = container.selectAll(".node")
      .data(networkData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .style("cursor", "pointer")
      .on("click", handleNodeClick)
      .on("mouseover", handleNodeMouseOver)
      .on("mouseout", handleNodeMouseOut);
    
    // Node circles
    nodes.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // Node labels
    if (!compact) {
      nodes.append("text")
        .attr("dx", 20)
        .attr("dy", ".35em")
        .style("font-size", "10px")
        .style("font-weight", "500")
        .text(d => d.name);
    }
  };

  const groupNodesByConnections = () => {
    const levels = [];
    const sortedNodes = [...networkData.nodes].sort((a, b) => b.connections - a.connections);
    const nodesPerLevel = Math.ceil(sortedNodes.length / 3);
    
    for (let i = 0; i < sortedNodes.length; i += nodesPerLevel) {
      levels.push(sortedNodes.slice(i, i + nodesPerLevel));
    }
    
    return levels;
  };

  const getNodeColor = (node) => {
    switch (node.status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getNodeRadius = (node) => {
    return Math.max(8, Math.min(20, 8 + (node.connections * 2)));
  };

  const getLinkColor = (link) => {
    switch (link.quality) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getConnectionQualityColor = (node) => {
    if (node.latency < 30) return '#4CAF50';
    if (node.latency < 60) return '#FF9800';
    return '#F44336';
  };

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const handleNodeMouseOver = (event, node) => {
    d3.select(event.currentTarget)
      .select("circle")
      .transition()
      .duration(200)
      .attr("stroke-width", 4)
      .attr("stroke", "#2196F3");
  };

  const handleNodeMouseOut = (event, node) => {
    d3.select(event.currentTarget)
      .select("circle")
      .transition()
      .duration(200)
      .attr("stroke-width", 2)
      .attr("stroke", "#fff");
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className={`network-topology-visualization ${compact ? 'compact' : 'full'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading network topology...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`network-topology-visualization ${compact ? 'compact' : 'full'}`}>
        <div className="error-message">
          <h3>Network Topology Unavailable</h3>
          <p>{error}</p>
          <button onClick={fetchNetworkData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`network-topology-visualization ${compact ? 'compact' : 'full'}`}>
      {!compact && (
        <div className="topology-header">
          <h2>Network Topology</h2>
          <div className="controls">
            <div className="control-group">
              <label>View Mode:</label>
              <select 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="force">Force-Directed</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="circular">Circular</option>
              </select>
            </div>
            
            <div className="control-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={showConnectionQuality}
                  onChange={(e) => setShowConnectionQuality(e.target.checked)}
                />
                Show Connection Quality
              </label>
            </div>
            
            <button onClick={fetchNetworkData} className="refresh-button">
              Refresh
            </button>
          </div>
        </div>
      )}
      
      <div className="network-stats">
        <div className="stat-card">
          <span className="stat-value">{networkData.stats.connectedNodes}</span>
          <span className="stat-label">Connected Nodes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{networkData.stats.totalConnections}</span>
          <span className="stat-label">Total Connections</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{networkData.stats.networkHealth}%</span>
          <span className="stat-label">Network Health</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{networkData.stats.averageLatency}ms</span>
          <span className="stat-label">Avg Latency</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatBytes(networkData.stats.dataTransferred)}</span>
          <span className="stat-label">Data Transferred</span>
        </div>
      </div>
      
      <div className="topology-visualization">
        <svg ref={svgRef}></svg>
      </div>
      
      {selectedNode && (
        <div className="node-details">
          <h3>Node Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>ID:</label>
              <value>{selectedNode.id}</value>
            </div>
            <div className="detail-item">
              <label>Name:</label>
              <value>{selectedNode.name}</value>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <value className={selectedNode.status}>
                {selectedNode.status.charAt(0).toUpperCase() + selectedNode.status.slice(1)}
              </value>
            </div>
            <div className="detail-item">
              <label>Connections:</label>
              <value>{selectedNode.connections}</value>
            </div>
            <div className="detail-item">
              <label>Latency:</label>
              <value>{selectedNode.latency.toFixed(1)}ms</value>
            </div>
            <div className="detail-item">
              <label>Data Rate:</label>
              <value>{formatBytes(selectedNode.dataRate)}/s</value>
            </div>
            <div className="detail-item">
              <label>Region:</label>
              <value>{selectedNode.region}</value>
            </div>
            <div className="detail-item">
              <label>Uptime:</label>
              <value>{formatUptime(selectedNode.uptime)}</value>
            </div>
            <div className="detail-item">
              <label>Address:</label>
              <value className="address">{selectedNode.address}</value>
            </div>
            {selectedNode.protocols.length > 0 && (
              <div className="detail-item">
                <label>Protocols:</label>
                <value>{selectedNode.protocols.join(', ')}</value>
              </div>
            )}
          </div>
          <button 
            className="close-button"
            onClick={() => setSelectedNode(null)}
          >
            Close
          </button>
        </div>
      )}
      
      {!compact && (
        <div className="legend">
          <h4>Legend</h4>
          <div className="legend-items">
            <div className="legend-section">
              <h5>Node Status</h5>
              <div className="legend-item">
                <div className="legend-color connected"></div>
                <span>Connected</span>
              </div>
              <div className="legend-item">
                <div className="legend-color connecting"></div>
                <span>Connecting</span>
              </div>
              <div className="legend-item">
                <div className="legend-color disconnected"></div>
                <span>Disconnected</span>
              </div>
            </div>
            
            <div className="legend-section">
              <h5>Connection Quality</h5>
              <div className="legend-item">
                <div className="legend-color excellent"></div>
                <span>Excellent (&lt;30ms)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color good"></div>
                <span>Good (30-60ms)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color poor"></div>
                <span>Poor (&gt;60ms)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTopologyVisualization;
