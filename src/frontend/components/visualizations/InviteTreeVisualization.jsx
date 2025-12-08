import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './InviteTreeVisualization.css';

const InviteTreeVisualization = () => {
  const svgRef = useRef(null);
  const [treeData, setTreeData] = useState(null);
  const [stats, setStats] = useState({
    totalInvites: 0,
    usedInvites: 0,
    availableInvites: 0,
    treeDepth: 0,
    decayFactor: 0.5
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'radial'

  useEffect(() => {
    fetchInviteTreeData();
    const interval = setInterval(fetchInviteTreeData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (treeData) {
      if (viewMode === 'tree') {
        renderTreeVisualization();
      } else {
        renderRadialVisualization();
      }
    }
  }, [treeData, viewMode]);

  const fetchInviteTreeData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/invite/tree');
      
      if (response.ok) {
        const data = await response.json();
        setTreeData(data.tree);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch invite tree data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTreeVisualization = () => {
    const svg = d3.select(svgRef.current);
    const width = 1000;
    const height = 700;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const container = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create tree layout
    const treeLayout = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Add links
    const links = container.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      )
      .style("fill", "none")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", 2);

    // Add nodes
    const nodes = container.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y}, ${d.x})`)
      .style("cursor", "pointer")
      .on("click", handleNodeClick);

    // Add node circles
    nodes.append("circle")
      .attr("r", d => Math.max(8, Math.min(20, d.data.remainingInvites * 2)))
      .attr("fill", d => getNodeColor(d.data))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", handleNodeMouseOver)
      .on("mouseout", handleNodeMouseOut);

    // Add node labels
    nodes.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -25 : 25)
      .style("text-anchor", d => d.children ? "end" : "start")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text(d => `${d.data.code || 'Root'} (${d.data.remainingInvites})`);

    // Add decay factor labels on links
    container.selectAll(".decay-label")
      .data(root.links())
      .enter()
      .append("text")
      .attr("class", "decay-label")
      .attr("x", d => (d.source.y + d.target.y) / 2)
      .attr("y", d => (d.source.x + d.target.x) / 2 - 5)
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#666")
      .text(d => `${(d.target.data.decayFactor || stats.decayFactor).toFixed(1)}x`);
  };

  const renderRadialVisualization = () => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) / 2 - 100;

    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const container = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create radial tree layout
    const treeLayout = d3.tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Add links
    const links = container.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
      )
      .style("fill", "none")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", 2);

    // Add nodes
    const nodes = container.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y}, 0)
      `)
      .style("cursor", "pointer")
      .on("click", handleNodeClick);

    // Add node circles
    nodes.append("circle")
      .attr("r", d => Math.max(6, Math.min(15, d.data.remainingInvites * 1.5)))
      .attr("fill", d => getNodeColor(d.data))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", handleNodeMouseOver)
      .on("mouseout", handleNodeMouseOut);

    // Add node labels
    nodes.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
      .style("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .style("font-size", "10px")
      .style("font-weight", "500")
      .text(d => `${d.data.code || 'Root'}`);
  };

  const getNodeColor = (nodeData) => {
    if (nodeData.used) {
      return "#ef4444"; // Red for used invites
    } else if (nodeData.remainingInvites > 0) {
      return "#10b981"; // Green for available invites
    } else {
      return "#6b7280"; // Gray for exhausted invites
    }
  };

  const handleNodeClick = (event, node) => {
    setSelectedNode(node.data);
  };

  const handleNodeMouseOver = (event, node) => {
    d3.select(event.currentTarget)
      .transition()
      .duration(200)
      .attr("stroke-width", 4)
      .attr("stroke", "#fbbf24");
  };

  const handleNodeMouseOut = (event, node) => {
    d3.select(event.currentTarget)
      .transition()
      .duration(200)
      .attr("stroke-width", 2)
      .attr("stroke", "#fff");
  };

  const calculateChildInvites = (parentInvites, decayFactor) => {
    return Math.max(1, Math.floor(parentInvites * decayFactor));
  };

  return (
    <div className="invite-tree-visualization">
      <div className="header">
        <h2>Decaying Invite Tree</h2>
        <p>Hierarchical visualization of invite distribution with decay factor</p>
      </div>

      <div className="controls">
        <div className="view-toggle">
          <button 
            className={viewMode === 'tree' ? 'active' : ''}
            onClick={() => setViewMode('tree')}
          >
            Tree View
          </button>
          <button 
            className={viewMode === 'radial' ? 'active' : ''}
            onClick={() => setViewMode('radial')}
          >
            Radial View
          </button>
        </div>
        
        <button onClick={fetchInviteTreeData} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalInvites}</div>
          <div className="stat-label">Total Invites</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.usedInvites}</div>
          <div className="stat-label">Used Invites</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.availableInvites}</div>
          <div className="stat-label">Available Invites</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.treeDepth}</div>
          <div className="stat-label">Tree Depth</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.decayFactor}</div>
          <div className="stat-label">Decay Factor</div>
        </div>
      </div>

      <div className="visualization-container">
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading invite tree...</p>
          </div>
        ) : treeData ? (
          <svg ref={svgRef}></svg>
        ) : (
          <div className="no-data">
            <p>No invite tree data available</p>
            <button onClick={fetchInviteTreeData}>Retry</button>
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="node-details">
          <h3>Invite Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Code:</label>
              <value>{selectedNode.code || 'Root'}</value>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <value className={selectedNode.used ? 'used' : 'available'}>
                {selectedNode.used ? 'Used' : 'Available'}
              </value>
            </div>
            <div className="detail-item">
              <label>Remaining Invites:</label>
              <value>{selectedNode.remainingInvites}</value>
            </div>
            <div className="detail-item">
              <label>Used By:</label>
              <value>{selectedNode.usedBy || 'N/A'}</value>
            </div>
            <div className="detail-item">
              <label>Created:</label>
              <value>{new Date(selectedNode.created).toLocaleString()}</value>
            </div>
            <div className="detail-item">
              <label>Decay Factor:</label>
              <value>{selectedNode.decayFactor || stats.decayFactor}</value>
            </div>
            {selectedNode.parentInvites && (
              <div className="detail-item">
                <label>Calculated from Parent:</label>
                <value>
                  {selectedNode.parentInvites} × {selectedNode.decayFactor || stats.decayFactor} = {calculateChildInvites(selectedNode.parentInvites, selectedNode.decayFactor || stats.decayFactor)}
                </value>
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

      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Available Invites</span>
          </div>
          <div className="legend-item">
            <div className="legend-color used"></div>
            <span>Used Invites</span>
          </div>
          <div className="legend-item">
            <div className="legend-color exhausted"></div>
            <span>Exhausted Invites</span>
          </div>
        </div>
        <div className="decay-explanation">
          <p><strong>Decay Factor:</strong> Each child receives {stats.decayFactor}× their parent's invite count (minimum 1)</p>
        </div>
      </div>
    </div>
  );
};

export default InviteTreeVisualization;
