import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './SystemHealthDashboard.css';

const SystemHealthDashboard = ({ compact = false }) => {
  const svgRef = useRef(null);
  const [healthData, setHealthData] = useState({
    services: {},
    metrics: {
      memory: 0,
      cpu: 0,
      networkHealth: 100,
      uptime: "0d 0h 0m"
    },
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && !error) {
      initializeVisualization();
    }
  }, [healthData, compact, isLoading, error]);

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/metrics')
      ]);
      
      if (!healthResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to fetch health data');
      }
      
      const health = await healthResponse.json();
      const metrics = await metricsResponse.json();
      
      setHealthData({
        services: health.services || {},
        metrics: {
          memory: health.memory || metrics.performance?.memory || 0,
          cpu: metrics.performance?.cpu || 0,
          networkHealth: metrics.network?.health || 100,
          uptime: health.uptime || "0d 0h 0m"
        },
        recentActivity: metrics.activity?.recentActivity || []
      });
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeVisualization = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous visualization
    
    const width = compact ? 400 : 800;
    const height = compact ? 200 : 400;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    svg.attr("width", width).attr("height", height);
    
    if (compact) {
      renderCompactView(svg, width, height, margin);
    } else {
      renderFullView(svg, width, height, margin);
    }
  };

  const renderCompactView = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Service status indicators
    const services = Object.keys(healthData.services);
    const healthyServices = services.filter(s => healthData.services[s].status === 'healthy').length;
    const serviceHealthPercentage = services.length > 0 ? (healthyServices / services.length) * 100 : 100;
    
    // Create a simple gauge chart for overall health
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    const radius = Math.min(innerWidth, innerHeight) / 3;
    
    // Background arc
    const arc = d3.arc()
      .innerRadius(radius - 10)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);
    
    g.append("path")
      .attr("d", arc)
      .attr("transform", `translate(${centerX},${centerY})`)
      .attr("fill", "#e0e0e0");
    
    // Health arc
    const healthArc = d3.arc()
      .innerRadius(radius - 10)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle((serviceHealthPercentage / 100) * 2 * Math.PI);
    
    const healthColor = serviceHealthPercentage >= 90 ? "#4CAF50" : 
                       serviceHealthPercentage >= 70 ? "#FF9800" : "#F44336";
    
    g.append("path")
      .attr("d", healthArc)
      .attr("transform", `translate(${centerX},${centerY})`)
      .attr("fill", healthColor);
    
    // Center text
    g.append("text")
      .attr("x", centerX)
      .attr("y", centerY - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("fill", healthColor)
      .text(`${Math.round(serviceHealthPercentage)}%`);
    
    g.append("text")
      .attr("x", centerX)
      .attr("y", centerY + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("System Health");
  };

  const renderFullView = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Service status grid
    const services = Object.keys(healthData.services);
    const cols = Math.ceil(Math.sqrt(services.length));
    const rows = Math.ceil(services.length / cols);
    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / 3 / rows;
    
    services.forEach((service, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      const status = healthData.services[service].status;
      const color = status === 'healthy' ? "#4CAF50" : 
                   status === 'warning' ? "#FF9800" : "#F44336";
      
      // Service status rectangle
      g.append("rect")
        .attr("x", x + 5)
        .attr("y", y + 5)
        .attr("width", cellWidth - 10)
        .attr("height", cellHeight - 10)
        .attr("fill", color)
        .attr("opacity", 0.7)
        .attr("rx", 5);
      
      // Service name
      g.append("text")
        .attr("x", x + cellWidth / 2)
        .attr("y", y + cellHeight / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "white")
        .text(service.replace('-service', ''));
    });
    
    // Performance metrics bar charts
    const metricsY = (innerHeight / 3) + 20;
    const barHeight = 20;
    const barSpacing = 30;
    
    const metrics = [
      { name: 'Memory Usage', value: healthData.metrics.memory, max: 100, unit: '%' },
      { name: 'CPU Usage', value: healthData.metrics.cpu, max: 100, unit: '%' },
      { name: 'Network Health', value: healthData.metrics.networkHealth, max: 100, unit: '%' }
    ];
    
    metrics.forEach((metric, i) => {
      const y = metricsY + i * barSpacing;
      const barWidth = (metric.value / metric.max) * (innerWidth * 0.6);
      
      // Background bar
      g.append("rect")
        .attr("x", 120)
        .attr("y", y)
        .attr("width", innerWidth * 0.6)
        .attr("height", barHeight)
        .attr("fill", "#e0e0e0")
        .attr("rx", 5);
      
      // Value bar
      const color = metric.value >= 80 ? "#4CAF50" : 
                   metric.value >= 60 ? "#FF9800" : "#F44336";
      
      g.append("rect")
        .attr("x", 120)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight)
        .attr("fill", color)
        .attr("rx", 5);
      
      // Label
      g.append("text")
        .attr("x", 115)
        .attr("y", y + barHeight / 2 + 5)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(metric.name);
      
      // Value text
      g.append("text")
        .attr("x", 125 + innerWidth * 0.6)
        .attr("y", y + barHeight / 2 + 5)
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(`${metric.value.toFixed(1)}${metric.unit}`);
    });
  };

  const getOverallHealthStatus = () => {
    const services = Object.keys(healthData.services);
    if (services.length === 0) return { status: 'unknown', color: '#gray' };
    
    const healthyServices = services.filter(s => healthData.services[s].status === 'healthy').length;
    const percentage = (healthyServices / services.length) * 100;
    
    if (percentage >= 90) return { status: 'healthy', color: '#4CAF50' };
    if (percentage >= 70) return { status: 'warning', color: '#FF9800' };
    return { status: 'critical', color: '#F44336' };
  };

  if (isLoading) {
    return (
      <div className={`system-health-dashboard ${compact ? 'compact' : 'full'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading system health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`system-health-dashboard ${compact ? 'compact' : 'full'}`}>
        <div className="error-message">
          <h3>Health Monitor Unavailable</h3>
          <p>{error}</p>
          <button onClick={fetchHealthData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overallHealth = getOverallHealthStatus();

  return (
    <div className={`system-health-dashboard ${compact ? 'compact' : 'full'}`}>
      {!compact && (
        <div className="health-header">
          <h2>System Health Monitor</h2>
          <div className="health-summary">
            <span 
              className={`health-status ${overallHealth.status}`}
              style={{ color: overallHealth.color }}
            >
              {overallHealth.status.toUpperCase()}
            </span>
            <span className="uptime">Uptime: {healthData.metrics.uptime}</span>
            <span className="last-update">
              Last Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      
      <div className="health-visualization">
        <svg ref={svgRef}></svg>
      </div>
      
      {!compact && (
        <div className="health-details">
          <div className="service-count">
            <strong>Services: </strong>
            {Object.keys(healthData.services).filter(s => healthData.services[s].status === 'healthy').length}
            /{Object.keys(healthData.services).length} Healthy
          </div>
          
          {healthData.recentActivity.length > 0 && (
            <div className="recent-activity">
              <h4>Recent Activity</h4>
              <ul>
                {healthData.recentActivity.slice(0, 3).map((activity, i) => (
                  <li key={i}>
                    <span className="activity-type">{activity.type}:</span>
                    <span className="activity-count">{activity.count}</span>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
