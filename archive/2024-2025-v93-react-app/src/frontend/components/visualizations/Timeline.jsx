import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useVoting } from '../../hooks/useVoting';
import ActivityFilterSlider from '../voting/ActivityFilterSlider';
import VoteResultsDisplay from '../shared/VoteResultsDisplay';
import './Timeline.css';

const Timeline = ({ height = 300, width = 800, regionFilter = null }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('day'); // day, week, month
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState(0); // Default to no filtering
  const { subscribe, unsubscribe } = useWebSocket();
  const { getFilteredVotes, getActivityStats } = useVoting();
  const [activityStats, setActivityStats] = useState(null);
  
  useEffect(() => {
    // Subscribe to timeline data updates
    subscribe('vote-timeline', handleTimelineUpdate);
    
    // Initialize with empty chart
    initChart();
    
    return () => {
      unsubscribe('vote-timeline', handleTimelineUpdate);
    };
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      updateChart();
    }
  }, [data, timeframe, width, height]);

  useEffect(() => {
    const fetchVotes = async () => {
      setLoading(true);
      
      // Get votes with filters
      const filters = {
        regionFilter,
        activityFilter: {
          minPercentile: activityFilter
        }
      };
      
      const fetchedVotes = await getFilteredVotes(filters);
      setVotes(fetchedVotes);
      
      // Get activity statistics for these votes
      if (fetchedVotes.length > 0) {
        const voteIds = fetchedVotes.map(v => v.id);
        const stats = await getActivityStats(voteIds);
        setActivityStats(stats);
      }
      
      setLoading(false);
    };
    
    fetchVotes();
  }, [regionFilter, activityFilter, getFilteredVotes, getActivityStats]);
  
  const handleTimelineUpdate = (newData) => {
    if (newData && newData.events) {
      setData(newData.events);
    }
  };

  const initChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Create base chart elements
    svg.append("g")
      .attr("class", "x-axis");
      
    svg.append("g")
      .attr("class", "y-axis");
      
    svg.append("g")
      .attr("class", "data-points");
      
    // Initialize tooltip
    d3.select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none");
  };

  const updateChart = () => {
    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Parse dates
    const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
    const formattedData = data.map(d => ({
      ...d,
      timestamp: parseDate(d.timestamp)
    }));
    
    // Set time scales based on selected timeframe
    let startDate;
    const now = new Date();
    
    if (timeframe === 'day') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
    } else if (timeframe === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }
    
    // Filter data based on timeframe
    const filteredData = formattedData.filter(d => d.timestamp >= startDate);
    
    // Set scales
    const xScale = d3.scaleTime()
      .domain([startDate, now])
      .range([margin.left, chartWidth]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.count) || 10])
      .nice()
      .range([chartHeight, margin.top]);
    
    // Update axes
    const xAxis = d3.axisBottom(xScale);
    svg.select(".x-axis")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis);
      
    const yAxis = d3.axisLeft(yScale);
    svg.select(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);
    
    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);
    
    // Update line
    const path = svg.selectAll(".timeline-path")
      .data([filteredData]);
      
    path.enter()
      .append("path")
      .attr("class", "timeline-path")
      .merge(path)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2);
      
    path.exit().remove();
    
    // Update data points
    const circles = svg.select(".data-points")
      .selectAll("circle")
      .data(filteredData);
      
    circles.enter()
      .append("circle")
      .merge(circles)
      .attr("cx", d => xScale(d.timestamp))
      .attr("cy", d => yScale(d.count))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        
        const tooltip = d3.select(tooltipRef.current);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
          
        const formatTime = d3.timeFormat("%b %d, %Y %H:%M");
        tooltip.html(`
          <strong>${d.topic || 'Global'}</strong><br>
          ${formatTime(d.timestamp)}<br>
          ${d.count} votes<br>
          ${d.reliability ? `Reliability: ${(d.reliability * 100).toFixed(1)}%` : ''}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 5);
        d3.select(tooltipRef.current)
          .transition()
          .duration(500)
          .style("opacity", 0);
      });
      
    circles.exit().remove();
  };

  const renderActivityBadge = (vote) => {
    const isActive = vote.metadata?.activity?.isActive;
    const percentile = vote.metadata?.activity?.percentile || 0;
    
    let badgeClass = 'activity-badge';
    let label = '';
    
    if (isActive) {
      if (percentile >= 80) {
        badgeClass += ' highly-active';
        label = 'Highly Active';
      } else if (percentile >= 50) {
        badgeClass += ' active';
        label = 'Active';
      } else {
        badgeClass += ' moderately-active';
        label = 'Moderately Active';
      }
    } else {
      badgeClass += ' inactive';
      label = 'Inactive';
    }
    
    return (
      <span className={badgeClass} title={`${percentile}th percentile of activity`}>
        {label}
      </span>
    );
  };
  
  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="timeframe-selector"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
        </select>
      </div>
      <svg 
        ref={svgRef} 
        width={width} 
        height={height} 
        className="timeline-chart"
      />
      <div ref={tooltipRef} className="timeline-tooltip"></div>
      
      <div className="timeline-filters">
        <ActivityFilterSlider 
          onChange={handleActivityFilterChange}
          initialValue={activityFilter}
        />
        
        {activityStats && (
          <div className="activity-summary">
            <h4>Current Filter Results</h4>
            <p>Active voters: {activityStats.distribution.active} ({Math.round(activityStats.distribution.active / activityStats.totalVotes * 100)}%)</p>
            <p>Inactive voters: {activityStats.distribution.inactive} ({Math.round(activityStats.distribution.inactive / activityStats.totalVotes * 100)}%)</p>
          </div>
        )}
      </div>
      
      <div className="timeline-content">
        {loading ? (
          <div className="loading">Loading votes...</div>
        ) : votes.length === 0 ? (
          <div className="no-votes">No votes match the current filters</div>
        ) : (
          <div className="votes-list">
            {votes.map(vote => (
              <div key={vote.id} className="vote-item">
                <div className="vote-header">
                  <h3>{vote.title || vote.topic}</h3>
                  <div className="vote-badges">
                    {vote.isLocalRegion ? (
                      <span className="region-badge local">Local</span>
                    ) : (
                      <span className="region-badge foreign">Foreign</span>
                    )}
                    {renderActivityBadge(vote)}
                  </div>
                </div>
                <VoteResultsDisplay vote={vote} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
