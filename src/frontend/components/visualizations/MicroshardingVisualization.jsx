import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './MicroshardingVisualization.css';

const MicroshardingVisualization = () => {
  const svgRef = useRef(null);
  const [shardingData, setShardingData] = useState([]);
  const [stats, setStats] = useState({
    totalShards: 0,
    dataShards: 0,
    parityShards: 0,
    efficiency: 0,
    redundancyRatio: 0
  });
  const [selectedShard, setSelectedShard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShardingData();
    const interval = setInterval(fetchShardingData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (shardingData.length > 0) {
      initializeVisualization();
    }
  }, [shardingData]);

  const fetchShardingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/microsharding/stats');
      
      if (response.ok) {
        const data = await response.json();
        setShardingData(data.shards || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch sharding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeVisualization = () => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.selectAll("*").remove();

    const container = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create simulation for shard positioning
    const simulation = d3.forceSimulation(shardingData)
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter((width - margin.left - margin.right) / 2, (height - margin.top - margin.bottom) / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create shard groups
    const shardGroups = container.selectAll(".shard-group")
      .data(shardingData)
      .enter()
      .append("g")
      .attr("class", "shard-group")
      .style("cursor", "pointer")
      .on("click", handleShardClick)
      .on("mouseover", handleShardMouseOver)
      .on("mouseout", handleShardMouseOut);

    // Add shard circles
    shardGroups.append("circle")
      .attr("class", "shard")
      .attr("r", d => Math.sqrt(d.size) / 10 + 15)
      .attr("fill", d => getShardColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add shard labels
    shardGroups.append("text")
      .attr("class", "shard-label")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .style("font-size", "10px")
      .style("fill", "white")
      .style("font-weight", "bold")
      .text(d => d.type === 'data' ? 'D' : 'P');

    // Add shard status indicators
    shardGroups.append("circle")
      .attr("class", "status-indicator")
      .attr("r", 4)
      .attr("cx", 15)
      .attr("cy", -15)
      .attr("fill", d => d.healthy ? "#10b981" : "#ef4444");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      shardGroups
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // Add legend
    createLegend(container, width, height, margin);
  };

  const getShardColor = (shard) => {
    if (shard.type === 'data') {
      return shard.healthy ? "#3b82f6" : "#dc2626";
    } else {
      return shard.healthy ? "#8b5cf6" : "#dc2626";
    }
  };

  const createLegend = (container, width, height, margin) => {
    const legendData = [
      { label: "Data Shard (Healthy)", color: "#3b82f6" },
      { label: "Data Shard (Unhealthy)", color: "#dc2626" },
      { label: "Parity Shard (Healthy)", color: "#8b5cf6" },
      { label: "Parity Shard (Unhealthy)", color: "#dc2626" }
    ];

    const legend = container.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right - 200}, ${margin.top})`);

    const legendItems = legend.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems.append("circle")
      .attr("r", 8)
      .attr("fill", d => d.color);

    legendItems.append("text")
      .attr("x", 15)
      .attr("y", 0)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .text(d => d.label);
  };

  const handleShardClick = (event, shard) => {
    setSelectedShard(shard);
  };

  const handleShardMouseOver = (event, shard) => {
    // Add tooltip or highlight effect
    d3.select(event.currentTarget)
      .select(".shard")
      .transition()
      .duration(200)
      .attr("stroke-width", 4)
      .attr("stroke", "#fbbf24");
  };

  const handleShardMouseOut = (event, shard) => {
    d3.select(event.currentTarget)
      .select(".shard")
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

  return (
    <div className="microsharding-visualization">
      <div className="header">
        <h2>Microsharding Visualization</h2>
        <p>Real-time view of data distribution across the network</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalShards}</div>
          <div className="stat-label">Total Shards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.dataShards}</div>
          <div className="stat-label">Data Shards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.parityShards}</div>
          <div className="stat-label">Parity Shards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.efficiency}%</div>
          <div className="stat-label">Efficiency</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.redundancyRatio.toFixed(2)}</div>
          <div className="stat-label">Redundancy Ratio</div>
        </div>
      </div>

      <div className="visualization-container">
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading sharding data...</p>
          </div>
        ) : (
          <svg ref={svgRef}></svg>
        )}
      </div>

      {selectedShard && (
        <div className="shard-details">
          <h3>Shard Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Shard ID:</label>
              <value>{selectedShard.id}</value>
            </div>
            <div className="detail-item">
              <label>Type:</label>
              <value className={selectedShard.type}>{selectedShard.type}</value>
            </div>
            <div className="detail-item">
              <label>Size:</label>
              <value>{formatBytes(selectedShard.size)}</value>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <value className={selectedShard.healthy ? 'healthy' : 'unhealthy'}>
                {selectedShard.healthy ? 'Healthy' : 'Unhealthy'}
              </value>
            </div>
            <div className="detail-item">
              <label>Location:</label>
              <value>{selectedShard.location || 'Unknown'}</value>
            </div>
            <div className="detail-item">
              <label>Replicas:</label>
              <value>{selectedShard.replicas || 0}</value>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <value>{new Date(selectedShard.lastUpdated).toLocaleString()}</value>
            </div>
          </div>
          <button 
            className="close-button"
            onClick={() => setSelectedShard(null)}
          >
            Close
          </button>
        </div>
      )}

      <div className="controls">
        <button onClick={fetchShardingData} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button onClick={() => window.open('/api/microsharding/export', '_blank')}>
          Export Data
        </button>
      </div>
    </div>
  );
};

export default MicroshardingVisualization;
