import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './VotingVisualization.css';

const VotingVisualization = () => {
  const svgRef = useRef(null);
  const [votingData, setVotingData] = useState({
    activeVotes: [],
    recentVotes: [],
    votingTrends: [],
    geographicDistribution: []
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedView, setSelectedView] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVotingData();
    const interval = setInterval(fetchVotingData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  useEffect(() => {
    if (!isLoading) {
      initializeVisualization();
    }
  }, [votingData, selectedView, isLoading]);

  const fetchVotingData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/vote/analytics?timeRange=${selectedTimeRange}`);
      if (response.ok) {
        const data = await response.json();
        setVotingData({
          activeVotes: data.activeVotes || generateMockActiveVotes(),
          recentVotes: data.recentVotes || generateMockRecentVotes(),
          votingTrends: data.votingTrends || generateMockTrends(),
          geographicDistribution: data.geographicDistribution || generateMockGeographic()
        });
      } else {
        // Fallback to mock data if API fails
        setVotingData({
          activeVotes: generateMockActiveVotes(),
          recentVotes: generateMockRecentVotes(),
          votingTrends: generateMockTrends(),
          geographicDistribution: generateMockGeographic()
        });
      }
    } catch (error) {
      console.error('Failed to fetch voting data:', error);
      // Use mock data as fallback
      setVotingData({
        activeVotes: generateMockActiveVotes(),
        recentVotes: generateMockRecentVotes(),
        votingTrends: generateMockTrends(),
        geographicDistribution: generateMockGeographic()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockActiveVotes = () => {
    const topics = [
      'Platform Governance Update',
      'Community Guidelines Revision',
      'Infrastructure Investment',
      'Feature Priority Vote',
      'Resource Allocation'
    ];
    
    return topics.slice(0, Math.floor(Math.random() * 3) + 2).map((topic, i) => ({
      id: i + 1,
      title: topic,
      totalVotes: Math.floor(Math.random() * 500) + 100,
      timeRemaining: Math.floor(Math.random() * 72) + 1, // 1-72 hours
      options: [
        { name: 'Option A', votes: Math.floor(Math.random() * 200) + 50, percentage: 0 },
        { name: 'Option B', votes: Math.floor(Math.random() * 200) + 50, percentage: 0 },
        { name: 'Option C', votes: Math.floor(Math.random() * 100) + 25, percentage: 0 }
      ]
    })).map(vote => {
      const total = vote.options.reduce((sum, opt) => sum + opt.votes, 0);
      vote.options.forEach(opt => {
        opt.percentage = (opt.votes / total) * 100;
      });
      vote.totalVotes = total;
      return vote;
    });
  };

  const generateMockRecentVotes = () => {
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push({
        id: i + 100,
        title: `Vote ${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        totalVotes: Math.floor(Math.random() * 300) + 50,
        outcome: Math.random() > 0.5 ? 'Passed' : 'Failed'
      });
    }
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const generateMockTrends = () => {
    const now = new Date();
    const trends = [];
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000); // Hour by hour
      trends.push({
        timestamp: time.toISOString(),
        voteCount: Math.floor(Math.random() * 50) + 10,
        participationRate: Math.random() * 40 + 60 // 60-100%
      });
    }
    
    return trends;
  };

  const generateMockGeographic = () => {
    const regions = [
      { name: 'North America', votes: Math.floor(Math.random() * 200) + 100, lat: 45, lng: -100 },
      { name: 'Europe', votes: Math.floor(Math.random() * 150) + 80, lat: 50, lng: 10 },
      { name: 'Asia', votes: Math.floor(Math.random() * 300) + 150, lat: 35, lng: 100 },
      { name: 'South America', votes: Math.floor(Math.random() * 100) + 50, lat: -15, lng: -60 },
      { name: 'Africa', votes: Math.floor(Math.random() * 80) + 40, lat: 0, lng: 20 },
      { name: 'Oceania', votes: Math.floor(Math.random() * 50) + 20, lat: -25, lng: 140 }
    ];
    
    return regions;
  };

  const initializeVisualization = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    
    svg.attr("width", width).attr("height", height);
    
    switch (selectedView) {
      case 'overview':
        renderOverview(svg, width, height, margin);
        break;
      case 'trends':
        renderTrends(svg, width, height, margin);
        break;
      case 'geographic':
        renderGeographic(svg, width, height, margin);
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
    
    // Active votes visualization
    if (votingData.activeVotes.length > 0) {
      const voteHeight = innerHeight / votingData.activeVotes.length - 20;
      
      votingData.activeVotes.forEach((vote, i) => {
        const y = i * (voteHeight + 20);
        
        // Vote title
        g.append("text")
          .attr("x", 0)
          .attr("y", y + 15)
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .attr("fill", "#333")
          .text(vote.title);
        
        // Vote options bars
        let xOffset = 0;
        const barWidth = innerWidth * 0.7;
        
        vote.options.forEach((option, j) => {
          const optionWidth = (option.percentage / 100) * barWidth;
          const color = d3.schemeCategory10[j % 10];
          
          g.append("rect")
            .attr("x", xOffset)
            .attr("y", y + 25)
            .attr("width", optionWidth)
            .attr("height", voteHeight - 40)
            .attr("fill", color)
            .attr("opacity", 0.7);
          
          // Option label
          if (optionWidth > 50) {
            g.append("text")
              .attr("x", xOffset + optionWidth / 2)
              .attr("y", y + 25 + (voteHeight - 40) / 2 + 5)
              .attr("text-anchor", "middle")
              .attr("font-size", "12px")
              .attr("fill", "white")
              .text(`${option.name} (${option.percentage.toFixed(1)}%)`);
          }
          
          xOffset += optionWidth;
        });
        
        // Vote stats
        g.append("text")
          .attr("x", barWidth + 20)
          .attr("y", y + 35)
          .attr("font-size", "12px")
          .attr("fill", "#666")
          .text(`${vote.totalVotes} votes`);
        
        g.append("text")
          .attr("x", barWidth + 20)
          .attr("y", y + 50)
          .attr("font-size", "12px")
          .attr("fill", "#666")
          .text(`${vote.timeRemaining}h remaining`);
      });
    } else {
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "#666")
        .text("No active votes");
    }
  };

  const renderTrends = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    if (votingData.votingTrends.length === 0) return;
    
    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(votingData.votingTrends, d => new Date(d.timestamp)))
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(votingData.votingTrends, d => d.voteCount)])
      .range([innerHeight, 0]);
    
    // Line generator
    const line = d3.line()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.voteCount))
      .curve(d3.curveMonotoneX);
    
    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")));
    
    g.append("g")
      .call(d3.axisLeft(yScale));
    
    // Add trend line
    g.append("path")
      .datum(votingData.votingTrends)
      .attr("fill", "none")
      .attr("stroke", "#4CAF50")
      .attr("stroke-width", 2)
      .attr("d", line);
    
    // Add data points
    g.selectAll(".dot")
      .data(votingData.votingTrends)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(new Date(d.timestamp)))
      .attr("cy", d => yScale(d.voteCount))
      .attr("r", 3)
      .attr("fill", "#4CAF50");
    
    // Labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (innerHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Vote Count");
  };

  const renderGeographic = (svg, width, height, margin) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create a simple scatter plot for geographic distribution
    const maxVotes = d3.max(votingData.geographicDistribution, d => d.votes);
    const radiusScale = d3.scaleLinear()
      .domain([0, maxVotes])
      .range([5, 30]);
    
    // Map coordinates to SVG space (simplified world map)
    const xScale = d3.scaleLinear()
      .domain([-180, 180])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([-90, 90])
      .range([innerHeight, 0]);
    
    // Draw regions as circles
    votingData.geographicDistribution.forEach(region => {
      const x = xScale(region.lng);
      const y = yScale(region.lat);
      const radius = radiusScale(region.votes);
      
      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", radius)
        .attr("fill", "#2196F3")
        .attr("opacity", 0.6)
        .attr("stroke", "#1976D2")
        .attr("stroke-width", 2);
      
      g.append("text")
        .attr("x", x)
        .attr("y", y + radius + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(`${region.name}: ${region.votes}`);
    });
  };

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const viewOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'trends', label: 'Trends' },
    { value: 'geographic', label: 'Geographic' }
  ];

  if (isLoading) {
    return (
      <div className="voting-visualization">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading voting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-visualization">
      <div className="voting-header">
        <h2>Voting Activity Dashboard</h2>
        <div className="controls">
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
      
      <div className="voting-stats">
        <div className="stat-card">
          <span className="stat-value">{votingData.activeVotes.length}</span>
          <span className="stat-label">Active Votes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {votingData.votingTrends.reduce((sum, t) => sum + t.voteCount, 0)}
          </span>
          <span className="stat-label">Total Votes ({selectedTimeRange})</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {votingData.geographicDistribution.reduce((sum, r) => sum + r.votes, 0)}
          </span>
          <span className="stat-label">Global Participation</span>
        </div>
      </div>
      
      <div className="voting-chart">
        <svg ref={svgRef}></svg>
      </div>
      
      {selectedView === 'overview' && votingData.recentVotes.length > 0 && (
        <div className="recent-votes">
          <h3>Recent Vote Results</h3>
          <div className="vote-list">
            {votingData.recentVotes.slice(0, 5).map(vote => (
              <div key={vote.id} className="vote-item">
                <span className="vote-title">{vote.title}</span>
                <span className={`vote-outcome ${vote.outcome.toLowerCase()}`}>
                  {vote.outcome}
                </span>
                <span className="vote-time">
                  {new Date(vote.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingVisualization;
