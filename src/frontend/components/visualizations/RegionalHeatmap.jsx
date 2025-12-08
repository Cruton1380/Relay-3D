import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useVoting } from '../../hooks/useVoting';
import { useWebSocket } from '../../hooks/useWebSocket';
import './RegionalHeatmap.css';

const RegionalHeatmap = ({ 
  height = 400, 
  width = 800, 
  compact = false,
  showCommunityBorders = true,
  realTimeUpdate = true 
}) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const mapRef = useRef(null);
  
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('voterDensity');
  const [timeRange, setTimeRange] = useState('24h');
  const [communityBoundaries, setCommunityBoundaries] = useState([]);
  
  const { getFilteredVotes, getActivityStats } = useVoting();
  const { subscribe, unsubscribe } = useWebSocket();

  // Regional configuration - can be made configurable
  const REGIONAL_CONFIG = {
    weightings: {
      local: 1.0,
      adjacent: 0.5,
      distant: 0.1
    },
    activityThreshold: 25 // 25th percentile
  };

  const metricOptions = [
    { value: 'voterDensity', label: 'Voter Density' },
    { value: 'activityLevel', label: 'Activity Level' },
    { value: 'participation', label: 'Participation Rate' },
    { value: 'reliability', label: 'Reliability Score' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  useEffect(() => {
    if (realTimeUpdate) {
      subscribe('regional-updates', handleRegionalUpdate);
      subscribe('vote-activity', handleVoteActivity);
    }
    
    fetchHeatmapData();
    
    return () => {
      if (realTimeUpdate) {
        unsubscribe('regional-updates', handleRegionalUpdate);
        unsubscribe('vote-activity', handleVoteActivity);
      }
    };
  }, [selectedMetric, timeRange, realTimeUpdate]);

  useEffect(() => {
    if (!loading && heatmapData.length > 0) {
      renderHeatmap();
    }
  }, [heatmapData, selectedMetric, width, height, compact, showCommunityBorders]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch regional voting data
      const filters = {
        timeRange,
        includeRegionalData: true,
        includeActivityData: true
      };

      const votes = await getFilteredVotes(filters);
      
      if (votes && votes.length > 0) {
        const processedData = await processRegionalData(votes);
        setHeatmapData(processedData);

        // Fetch community boundaries if needed
        if (showCommunityBorders) {
          await fetchCommunityBoundaries();
        }
      } else {
        // Generate visualization sample data
        setHeatmapData(generateMockRegionalData());
        if (showCommunityBorders) {
          setCommunityBoundaries(generateMockBoundaries());
        }
      }
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
      setError('Failed to load regional data');
      // Fallback to mock data
      setHeatmapData(generateMockRegionalData());
    } finally {
      setLoading(false);
    }
  };

  const processRegionalData = async (votes) => {
    const regionalMap = new Map();
    
    // Group votes by region and calculate metrics
    votes.forEach(vote => {
      const region = vote.region || vote.location?.region || 'unknown';
      const coords = vote.location?.coordinates || { lat: 0, lng: 0 };
      
      if (!regionalMap.has(region)) {
        regionalMap.set(region, {
          region,
          coordinates: coords,
          voterCount: 0,
          totalActivity: 0,
          votes: [],
          participants: new Set(),
          reliabilityScores: []
        });
      }
      
      const regionData = regionalMap.get(region);
      regionData.votes.push(vote);
      regionData.participants.add(vote.userId);
      
      // Add activity data if available
      if (vote.activityData) {
        regionData.totalActivity += vote.activityData.monthlyActivity || 0;
        if (vote.activityData.reliabilityScore) {
          regionData.reliabilityScores.push(vote.activityData.reliabilityScore);
        }
      }
    });

    // Calculate metrics for each region
    const processedRegions = Array.from(regionalMap.values()).map(region => {
      const participantCount = region.participants.size;
      const voteCount = region.votes.length;
      const avgActivity = participantCount > 0 ? region.totalActivity / participantCount : 0;
      const avgReliability = region.reliabilityScores.length > 0 
        ? region.reliabilityScores.reduce((sum, score) => sum + score, 0) / region.reliabilityScores.length 
        : 0;

      return {
        region: region.region,
        coordinates: region.coordinates,
        voterDensity: participantCount,
        voteCount,
        activityLevel: avgActivity,
        participation: participantCount / (participantCount + voteCount) || 0,
        reliability: avgReliability,
        // Weighted score based on regional config
        weightedScore: calculateRegionalWeight(region.coordinates)
      };
    });

    return processedRegions;
  };

  const calculateRegionalWeight = (coordinates) => {
    // This would calculate distance-based weighting in a real implementation
    // For now, return a mock weighted score
    return Math.random() * REGIONAL_CONFIG.weightings.local;
  };

  const generateMockRegionalData = () => {
    const regions = [
      { name: 'North America', lat: 45, lng: -100 },
      { name: 'Europe', lat: 50, lng: 10 },
      { name: 'Asia', lat: 35, lng: 100 },
      { name: 'South America', lat: -15, lng: -60 },
      { name: 'Africa', lat: 0, lng: 20 },
      { name: 'Oceania', lat: -25, lng: 140 },
      { name: 'Eastern Europe', lat: 55, lng: 30 },
      { name: 'Southeast Asia', lat: 10, lng: 110 },
      { name: 'Middle East', lat: 30, lng: 50 },
      { name: 'Central America', lat: 15, lng: -85 }
    ];

    return regions.map(region => ({
      region: region.name,
      coordinates: { lat: region.lat, lng: region.lng },
      voterDensity: Math.floor(Math.random() * 1000) + 50,
      voteCount: Math.floor(Math.random() * 500) + 25,
      activityLevel: Math.random() * 100,
      participation: Math.random() * 0.8 + 0.2,
      reliability: Math.random() * 0.4 + 0.6,
      weightedScore: Math.random()
    }));
  };

  const generateMockBoundaries = () => {
    // Mock community boundary data
    return [
      { 
        id: 'na-community',
        name: 'North American Community',
        boundaries: [
          { lat: 70, lng: -170 },
          { lat: 70, lng: -50 },
          { lat: 20, lng: -50 },
          { lat: 20, lng: -170 }
        ],
        type: 'primary'
      },
      {
        id: 'eu-community',
        name: 'European Community',
        boundaries: [
          { lat: 70, lng: -15 },
          { lat: 70, lng: 50 },
          { lat: 35, lng: 50 },
          { lat: 35, lng: -15 }
        ],
        type: 'primary'
      },
      {
        id: 'asia-community',
        name: 'Asian Community',
        boundaries: [
          { lat: 70, lng: 60 },
          { lat: 70, lng: 180 },
          { lat: 10, lng: 180 },
          { lat: 10, lng: 60 }
        ],
        type: 'primary'
      }
    ];
  };

  const fetchCommunityBoundaries = async () => {
    try {
      // In a real implementation, this would fetch from an API
      const response = await fetch('/api/community/boundaries');
      if (response.ok) {
        const boundaries = await response.json();
        setCommunityBoundaries(boundaries);
      } else {
        setCommunityBoundaries(generateMockBoundaries());
      }
    } catch (err) {
      console.error('Failed to fetch community boundaries:', err);
      setCommunityBoundaries(generateMockBoundaries());
    }
  };

  const handleRegionalUpdate = useCallback((data) => {
    if (data && data.regions) {
      setHeatmapData(prevData => {
        // Update existing regions or add new ones
        const updatedData = [...prevData];
        data.regions.forEach(update => {
          const index = updatedData.findIndex(r => r.region === update.region);
          if (index >= 0) {
            updatedData[index] = { ...updatedData[index], ...update };
          } else {
            updatedData.push(update);
          }
        });
        return updatedData;
      });
    }
  }, []);

  const handleVoteActivity = useCallback((data) => {
    if (data && data.region) {
      // Update activity for specific region
      setHeatmapData(prevData => 
        prevData.map(region => 
          region.region === data.region 
            ? { 
                ...region, 
                voteCount: region.voteCount + 1,
                voterDensity: region.voterDensity + (data.newVoter ? 1 : 0)
              }
            : region
        )
      );
    }
  }, []);

  const renderHeatmap = () => {
    if (!svgRef.current || !heatmapData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = compact 
      ? { top: 10, right: 10, bottom: 20, left: 10 }
      : { top: 20, right: 40, bottom: 40, left: 60 };
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create map projection
    const projection = d3.geoNaturalEarth1()
      .scale(compact ? 100 : 150)
      .translate([innerWidth / 2, innerHeight / 2]);

    const path = d3.geoPath().projection(projection);

    // Color scales for different metrics
    const getColorScale = (metric) => {
      const domain = d3.extent(heatmapData, d => d[metric]);
      
      switch (metric) {
        case 'voterDensity':
          return d3.scaleSequential(d3.interpolateBlues).domain(domain);
        case 'activityLevel':
          return d3.scaleSequential(d3.interpolateGreens).domain(domain);
        case 'participation':
          return d3.scaleSequential(d3.interpolateOranges).domain(domain);
        case 'reliability':
          return d3.scaleSequential(d3.interpolatePurples).domain(domain);
        default:
          return d3.scaleSequential(d3.interpolateViridis).domain(domain);
      }
    };

    const colorScale = getColorScale(selectedMetric);

    // Create radius scale for circle size
    const radiusScale = d3.scaleSqrt()
      .domain(d3.extent(heatmapData, d => d.voterDensity))
      .range([3, compact ? 15 : 25]);

    // Draw community boundaries if enabled
    if (showCommunityBorders && communityBoundaries.length > 0) {
      communityBoundaries.forEach(boundary => {
        const coordinates = boundary.boundaries.map(coord => 
          projection([coord.lng, coord.lat])
        );
        
        if (coordinates.every(coord => coord)) {
          const lineGenerator = d3.line()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveLinear);

          g.append("path")
            .datum(coordinates.concat([coordinates[0]])) // Close the path
            .attr("d", lineGenerator)
            .attr("fill", "none")
            .attr("stroke", boundary.type === 'primary' ? "#333" : "#666")
            .attr("stroke-width", boundary.type === 'primary' ? 2 : 1)
            .attr("stroke-dasharray", boundary.type === 'primary' ? "none" : "5,5")
            .attr("opacity", 0.7);
        }
      });
    }

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Draw regional data points
    const regions = g.selectAll(".region")
      .data(heatmapData)
      .enter().append("g")
      .attr("class", "region");

    regions.append("circle")
      .attr("cx", d => {
        const coords = projection([d.coordinates.lng, d.coordinates.lat]);
        return coords ? coords[0] : 0;
      })
      .attr("cy", d => {
        const coords = projection([d.coordinates.lng, d.coordinates.lat]);
        return coords ? coords[1] : 0;
      })
      .attr("r", d => radiusScale(d.voterDensity))
      .attr("fill", d => colorScale(d[selectedMetric]))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("opacity", 1);
        
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.region}</strong><br/>
            Voters: ${d.voterDensity}<br/>
            Votes: ${d.voteCount}<br/>
            Activity: ${d.activityLevel.toFixed(1)}<br/>
            Participation: ${(d.participation * 100).toFixed(1)}%<br/>
            Reliability: ${(d.reliability * 100).toFixed(1)}%
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke-width", 1)
          .attr("opacity", 0.8);
        
        tooltip.style("opacity", 0);
      });

    // Add region labels for non-compact view
    if (!compact) {
      regions.append("text")
        .attr("x", d => {
          const coords = projection([d.coordinates.lng, d.coordinates.lat]);
          return coords ? coords[0] : 0;
        })
        .attr("y", d => {
          const coords = projection([d.coordinates.lng, d.coordinates.lat]);
          return coords ? coords[1] + radiusScale(d.voterDensity) + 15 : 0;
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .text(d => d.region.length > 12 ? d.region.substring(0, 12) + "..." : d.region);
    }

    // Add legend
    if (!compact) {
      const legendWidth = 200;
      const legendHeight = 20;
      const legendX = innerWidth - legendWidth - 20;
      const legendY = innerHeight - 40;

      const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendWidth]);

      const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickSize(6);

      const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX},${legendY})`);

      // Create gradient
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "heatmap-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      // Add gradient stops
      const stops = d3.range(0, 1.1, 0.1);
      gradient.selectAll("stop")
        .data(stops)
        .enter().append("stop")
        .attr("offset", d => (d * 100) + "%")
        .attr("stop-color", d => colorScale(colorScale.domain()[0] + d * (colorScale.domain()[1] - colorScale.domain()[0])));

      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)");

      legend.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);

      legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(metricOptions.find(opt => opt.value === selectedMetric)?.label || selectedMetric);
    }
  };

  if (loading) {
    return (
      <div className="regional-heatmap loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading regional data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="regional-heatmap error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchHeatmapData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`regional-heatmap ${compact ? 'compact' : 'full'}`}>
      {!compact && (
        <div className="heatmap-controls">
          <div className="control-group">
            <label htmlFor="metric-select">Metric:</label>
            <select 
              id="metric-select"
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {metricOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="timerange-select">Time Range:</label>
            <select 
              id="timerange-select"
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label>
              <input 
                type="checkbox" 
                checked={showCommunityBorders}
                onChange={(e) => setCommunityBoundaries(e.target.checked)}
              />
              Show Community Borders
            </label>
          </div>
        </div>
      )}
      
      <div className="heatmap-container">
        <svg ref={svgRef}></svg>
        <div ref={tooltipRef} className="heatmap-tooltip"></div>
      </div>
      
      {!compact && heatmapData.length > 0 && (
        <div className="heatmap-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{heatmapData.length}</span>
              <span className="stat-label">Active Regions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {heatmapData.reduce((sum, r) => sum + r.voterDensity, 0)}
              </span>
              <span className="stat-label">Total Voters</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {(heatmapData.reduce((sum, r) => sum + r.participation, 0) / heatmapData.length * 100).toFixed(1)}%
              </span>
              <span className="stat-label">Avg Participation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalHeatmap;
