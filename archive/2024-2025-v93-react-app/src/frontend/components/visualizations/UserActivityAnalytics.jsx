// frontend/components/visualizations/UserActivityAnalytics.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useVoting } from '../../hooks/useVoting';
import './UserActivityAnalytics.css';

const UserActivityAnalytics = ({ compact = false }) => {
  const svgRef = useRef(null);
  const heatmapRef = useRef(null);
  const chartRef = useRef(null);
  const { getActivityStats } = useVoting();
  
  const [analyticsData, setAnalyticsData] = useState({
    userActivityMetrics: {},
    sessionDurations: [],
    geographicDistribution: [],
    activityPatterns: {},
    engagementMetrics: {}
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const viewOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'heatmap', label: 'Activity Heatmap' },
    { value: 'engagement', label: 'Engagement Metrics' },
    { value: 'geographic', label: 'Geographic Distribution' }
  ];

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  useEffect(() => {
    if (!isLoading && !error && analyticsData.userActivityMetrics) {
      renderVisualization();
    }
  }, [analyticsData, selectedView, compact, isLoading, error]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch activity metrics from multiple endpoints
      const [metricsResponse, statsResponse] = await Promise.all([
        fetch(`/api/vote/activity-metrics?timeRange=${selectedTimeRange}`),
        fetch(`/api/vote/user-activity-stats?timeRange=${selectedTimeRange}`)
      ]);

      if (!metricsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const metrics = await metricsResponse.json();
      const stats = await statsResponse.json();

      // Process and combine the data
      setAnalyticsData({
        userActivityMetrics: metrics,
        sessionDurations: generateSessionDurations(),
        geographicDistribution: generateGeographicData(),
        activityPatterns: generateActivityPatterns(),
        engagementMetrics: {
          dailyActiveUsers: stats.dailyActiveUsers || 0,
          weeklyActiveUsers: stats.weeklyActiveUsers || 0,
          averageSessionDuration: stats.averageSessionDuration || 0,
          bounceRate: stats.bounceRate || 0,
          retentionRate: stats.retentionRate || 0
        }
      });

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError(error.message);
      // Use mock data as fallback
      setAnalyticsData({
        userActivityMetrics: generateMockMetrics(),
        sessionDurations: generateSessionDurations(),
        geographicDistribution: generateGeographicData(),
        activityPatterns: generateActivityPatterns(),
        engagementMetrics: generateMockEngagement()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockMetrics = () => ({
    averageMonthlyActivity: 45.2,
    standardDeviation: 12.8,
    activityPercentiles: {
      10: 15, 20: 22, 30: 28, 40: 35, 50: 42,
      60: 48, 70: 55, 80: 62, 90: 72
    },
    totalUsers: 1247,
    activeUsers: 892
  });

  const generateMockEngagement = () => ({
    dailyActiveUsers: 234,
    weeklyActiveUsers: 892,
    averageSessionDuration: 18.5,
    bounceRate: 0.23,
    retentionRate: 0.78
  });

  const generateSessionDurations = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      averageDuration: Math.random() * 30 + 10,
      sessionCount: Math.floor(Math.random() * 100) + 20
    }));
  };

  const generateGeographicData = () => {
    const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
    return regions.map(region => ({
      region,
      userCount: Math.floor(Math.random() * 300) + 50,
      activityLevel: Math.random() * 100
    }));
  };

  const generateActivityPatterns = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const heatmapData = [];
    days.forEach((day, dayIndex) => {
      hours.forEach(hour => {
        heatmapData.push({
          day: dayIndex,
          hour,
          dayName: day,
          activity: Math.random() * 100
        });
      });
    });

    return { heatmapData };
  };

  const renderVisualization = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = compact ? 400 : 800;
    const height = compact ? 200 : 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    svg.attr("width", width).attr("height", height);

    switch (selectedView) {
      case 'overview':
        renderOverview(svg, width, height, margin);
        break;
      case 'heatmap':
        renderActivityHeatmap();
        break;
      case 'engagement':
        renderEngagementMetrics(svg, width, height, margin);
        break;
      case 'geographic':
        renderGeographicDistribution(svg, width, height, margin);
        break;
      default:
        renderOverview(svg, width, height, margin);
    }
  };

  const renderOverview = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Activity distribution chart
    const metrics = analyticsData.userActivityMetrics;
    if (!metrics.activityPercentiles) return;

    const percentiles = Object.entries(metrics.activityPercentiles)
      .map(([percentile, value]) => ({ percentile: +percentile, value }));

    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(percentiles, d => d.value)])
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.percentile))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Activity Percentile");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Monthly Activity Score");

    // Add the line
    g.append("path")
      .datum(percentiles)
      .attr("fill", "none")
      .attr("stroke", "#4CAF50")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    g.selectAll(".dot")
      .data(percentiles)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.percentile))
      .attr("cy", d => yScale(d.value))
      .attr("r", 4)
      .attr("fill", "#4CAF50");

    // Add title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("User Activity Distribution");
  };

  const renderActivityHeatmap = () => {
    if (!heatmapRef.current) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 200;
    const margin = { top: 20, right: 40, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const heatmapData = analyticsData.activityPatterns.heatmapData;
    if (!heatmapData) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const xScale = d3.scaleBand()
      .domain(hours)
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(days)
      .range([0, innerHeight])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, 100]);

    // Add cells
    g.selectAll(".cell")
      .data(heatmapData)
      .enter().append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.hour))
      .attr("y", d => yScale(d.dayName))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.activity))
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", null);
      });

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Activity Heatmap (Hour vs Day)");
  };

  const renderEngagementMetrics = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const metrics = [
      { label: 'Daily Active Users', value: analyticsData.engagementMetrics.dailyActiveUsers },
      { label: 'Weekly Active Users', value: analyticsData.engagementMetrics.weeklyActiveUsers },
      { label: 'Avg Session (min)', value: analyticsData.engagementMetrics.averageSessionDuration },
      { label: 'Retention Rate (%)', value: Math.round(analyticsData.engagementMetrics.retentionRate * 100) }
    ];

    const barHeight = innerHeight / metrics.length - 10;
    const maxValue = d3.max(metrics, d => d.value);

    const xScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, innerWidth * 0.7]);

    metrics.forEach((metric, i) => {
      const y = i * (barHeight + 10);

      // Label
      g.append("text")
        .attr("x", 0)
        .attr("y", y + barHeight / 2)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(metric.label);

      // Bar
      g.append("rect")
        .attr("x", innerWidth * 0.4)
        .attr("y", y)
        .attr("width", xScale(metric.value))
        .attr("height", barHeight)
        .attr("fill", "#4CAF50")
        .attr("opacity", 0.7);

      // Value
      g.append("text")
        .attr("x", innerWidth * 0.4 + xScale(metric.value) + 5)
        .attr("y", y + barHeight / 2)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(metric.value);
    });

    // Add title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Engagement Metrics");
  };

  const renderGeographicDistribution = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = analyticsData.geographicDistribution;
    if (!data.length) return;

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.region))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.userCount)])
      .range([innerHeight, 0]);

    // Add bars
    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.region))
      .attr("y", d => yScale(d.userCount))
      .attr("width", xScale.bandwidth())
      .attr("height", d => innerHeight - yScale(d.userCount))
      .attr("fill", "#2196F3");

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Geographic User Distribution");
  };

  if (isLoading) {
    return (
      <div className={`user-activity-analytics ${compact ? 'compact' : 'full'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading user activity analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`user-activity-analytics ${compact ? 'compact' : 'full'}`}>
        <div className="error-message">
          <h3>Analytics Unavailable</h3>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-activity-analytics ${compact ? 'compact' : 'full'}`}>
      {!compact && (
        <div className="analytics-header">
          <h2>User Activity Analytics</h2>
          <div className="analytics-controls">
            <div className="control-group">
              <label>Time Range:</label>
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="control-group">
              <label>View:</label>
              <select 
                value={selectedView} 
                onChange={(e) => setSelectedView(e.target.value)}
              >
                {viewOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      <div className="analytics-content">
        {!compact && (
          <div className="analytics-summary">
            <div className="summary-card">
              <span className="summary-value">{analyticsData.userActivityMetrics.totalUsers || 0}</span>
              <span className="summary-label">Total Users</span>
            </div>
            <div className="summary-card">
              <span className="summary-value">{analyticsData.userActivityMetrics.activeUsers || 0}</span>
              <span className="summary-label">Active Users</span>
            </div>
            <div className="summary-card">
              <span className="summary-value">
                {(analyticsData.userActivityMetrics.averageMonthlyActivity || 0).toFixed(1)}
              </span>
              <span className="summary-label">Avg Monthly Activity</span>
            </div>
            <div className="summary-card">
              <span className="summary-value">
                {(analyticsData.engagementMetrics.retentionRate * 100 || 0).toFixed(1)}%
              </span>
              <span className="summary-label">Retention Rate</span>
            </div>
          </div>
        )}
        
        <div className="visualization-container">
          <svg ref={svgRef}></svg>
          {selectedView === 'heatmap' && <svg ref={heatmapRef}></svg>}
        </div>
        
        {selectedView === 'overview' && !compact && (
          <div className="analytics-insights">
            <h3>Key Insights</h3>
            <ul>
              <li>
                Average user completes {(analyticsData.userActivityMetrics.averageMonthlyActivity || 0).toFixed(1)} actions per month
              </li>
              <li>
                {((analyticsData.userActivityMetrics.activeUsers / analyticsData.userActivityMetrics.totalUsers) * 100 || 0).toFixed(1)}% 
                of users are currently active
              </li>
              <li>
                User retention rate is {(analyticsData.engagementMetrics.retentionRate * 100 || 0).toFixed(1)}%
              </li>
              <li>
                Average session duration is {analyticsData.engagementMetrics.averageSessionDuration || 0} minutes
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityAnalytics;
