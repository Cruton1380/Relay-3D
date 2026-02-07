import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useVoting } from '../../hooks/useVoting';
import { useWebSocket } from '../../hooks/useWebSocket';
import './CandidateMomentum.css';

const CandidateMomentum = ({ 
  height = 400, 
  width = 800, 
  compact = false,
  topicsFilter = null,
  showTrending = true,
  realTimeUpdate = true 
}) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  
  const [momentumData, setMomentumData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [viewMode, setViewMode] = useState('momentum'); // momentum, velocity, prediction
  const [trendingCandidates, setTrendingCandidates] = useState([]);
  
  const { getFilteredVotes, getActivityStats } = useVoting();
  const { subscribe, unsubscribe } = useWebSocket();

  const timeframeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' }
  ];

  const viewModeOptions = [
    { value: 'momentum', label: 'Momentum Score' },
    { value: 'velocity', label: 'Vote Velocity' },
    { value: 'prediction', label: 'Trend Prediction' }
  ];

  useEffect(() => {
    if (realTimeUpdate) {
      subscribe('vote-updates', handleVoteUpdate);
      subscribe('candidate-updates', handleCandidateUpdate);
    }
    
    fetchMomentumData();
    
    const interval = setInterval(fetchMomentumData, 30000); // Update every 30 seconds
    
    return () => {
      if (realTimeUpdate) {
        unsubscribe('vote-updates', handleVoteUpdate);
        unsubscribe('candidate-updates', handleCandidateUpdate);
      }
      clearInterval(interval);
    };
  }, [selectedTimeframe, topicsFilter, realTimeUpdate]);

  useEffect(() => {
    if (!loading && momentumData.length > 0) {
      renderMomentumChart();
    }
  }, [momentumData, viewMode, width, height, compact]);

  const fetchMomentumData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vote data with momentum calculations
      const filters = {
        timeRange: selectedTimeframe,
        includeMomentum: true,
        includeVelocity: true,
        topics: topicsFilter
      };

      const votes = await getFilteredVotes(filters);
      
      if (votes && votes.length > 0) {
        const processedData = await processCandidateMomentum(votes);
        setMomentumData(processedData);
        
        if (showTrending) {
          const trending = calculateTrendingCandidates(processedData);
          setTrendingCandidates(trending);
        }
      } else {
        // Generate visualization sample data
        const mockData = generateMockMomentumData();
        setMomentumData(mockData);
        if (showTrending) {
          setTrendingCandidates(calculateTrendingCandidates(mockData));
        }
      }
    } catch (err) {
      console.error('Failed to fetch momentum data:', err);
      setError('Failed to load candidate momentum data');
      // Fallback to mock data
      const mockData = generateMockMomentumData();
      setMomentumData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const processCandidateMomentum = async (votes) => {
    const candidateMap = new Map();
    const timeWindows = generateTimeWindows(selectedTimeframe);
    
    // Group votes by candidate and time windows
    votes.forEach(vote => {
      const candidateId = vote.candidateId || vote.choice;
      const candidateName = vote.candidateName || vote.choiceName || candidateId;
      const timestamp = new Date(vote.timestamp);
      
      if (!candidateMap.has(candidateId)) {
        candidateMap.set(candidateId, {
          id: candidateId,
          name: candidateName,
          topic: vote.topic,
          timeSeriesData: new Map(),
          totalVotes: 0,
          recentVotes: 0,
          velocityData: [],
          activityScores: []
        });
      }
      
      const candidate = candidateMap.get(candidateId);
      candidate.totalVotes++;
      
      // Categorize vote by time window
      const windowKey = getTimeWindowKey(timestamp, timeWindows);
      if (!candidate.timeSeriesData.has(windowKey)) {
        candidate.timeSeriesData.set(windowKey, { count: 0, timestamp: windowKey });
      }
      candidate.timeSeriesData.get(windowKey).count++;
      
      // Track recent activity (last 25% of timeframe)
      const recentThreshold = new Date(Date.now() - getTimeframeMs(selectedTimeframe) * 0.25);
      if (timestamp > recentThreshold) {
        candidate.recentVotes++;
      }
      
      // Add activity score if available
      if (vote.activityData?.percentile) {
        candidate.activityScores.push(vote.activityData.percentile);
      }
    });

    // Calculate momentum metrics for each candidate
    const processedCandidates = Array.from(candidateMap.values()).map(candidate => {
      const timeSeries = Array.from(candidate.timeSeriesData.values())
        .sort((a, b) => a.timestamp - b.timestamp);
      
      const momentum = calculateMomentumScore(timeSeries);
      const velocity = calculateVelocity(timeSeries);
      const prediction = calculateTrendPrediction(timeSeries, momentum, velocity);
      const avgActivityScore = candidate.activityScores.length > 0 
        ? candidate.activityScores.reduce((sum, score) => sum + score, 0) / candidate.activityScores.length
        : 50;

      return {
        ...candidate,
        timeSeries,
        momentum,
        velocity,
        prediction,
        avgActivityScore,
        recentPercentage: candidate.totalVotes > 0 ? (candidate.recentVotes / candidate.totalVotes) * 100 : 0,
        momentumClass: getMomentumClass(momentum),
        isRising: momentum > 0,
        isFalling: momentum < -0.1
      };
    });

    return processedCandidates.sort((a, b) => b.momentum - a.momentum);
  };

  const generateTimeWindows = (timeframe) => {
    const now = new Date();
    const totalMs = getTimeframeMs(timeframe);
    const intervals = timeframe === '1h' ? 12 : timeframe === '6h' ? 24 : 48; // 5min, 15min, 30min intervals
    const intervalMs = totalMs / intervals;
    
    const windows = [];
    for (let i = 0; i < intervals; i++) {
      windows.push(new Date(now.getTime() - (intervals - i) * intervalMs));
    }
    return windows;
  };

  const getTimeframeMs = (timeframe) => {
    const timeframeMap = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000
    };
    return timeframeMap[timeframe] || 86400000;
  };

  const getTimeWindowKey = (timestamp, windows) => {
    for (let i = 0; i < windows.length - 1; i++) {
      if (timestamp >= windows[i] && timestamp < windows[i + 1]) {
        return windows[i].getTime();
      }
    }
    return windows[windows.length - 1].getTime();
  };

  const calculateMomentumScore = (timeSeries) => {
    if (timeSeries.length < 2) return 0;
    
    // Calculate weighted momentum based on recent activity
    const weights = timeSeries.map((_, i) => Math.pow(1.2, i)); // Exponential weighting
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 1; i < timeSeries.length; i++) {
      const change = timeSeries[i].count - timeSeries[i - 1].count;
      weightedSum += change * weights[i];
      totalWeight += weights[i];
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const calculateVelocity = (timeSeries) => {
    if (timeSeries.length < 3) return 0;
    
    // Calculate acceleration (change in momentum)
    const recent = timeSeries.slice(-3);
    const velocities = [];
    
    for (let i = 1; i < recent.length; i++) {
      velocities.push(recent[i].count - recent[i - 1].count);
    }
    
    return velocities.length > 1 
      ? velocities[velocities.length - 1] - velocities[0]
      : velocities[0] || 0;
  };

  const calculateTrendPrediction = (timeSeries, momentum, velocity) => {
    if (timeSeries.length < 2) return 0;
    
    // Simple linear prediction based on momentum and velocity
    const currentValue = timeSeries[timeSeries.length - 1].count;
    const prediction = currentValue + momentum + (velocity * 0.5);
    
    return Math.max(0, prediction);
  };

  const getMomentumClass = (momentum) => {
    if (momentum > 2) return 'high-momentum';
    if (momentum > 0.5) return 'medium-momentum';
    if (momentum > -0.5) return 'stable';
    if (momentum > -2) return 'declining';
    return 'falling';
  };

  const calculateTrendingCandidates = (candidates) => {
    return candidates
      .filter(c => c.momentum > 0.5 || c.velocity > 1)
      .sort((a, b) => (b.momentum + b.velocity) - (a.momentum + a.velocity))
      .slice(0, 5);
  };

  const generateMockMomentumData = () => {
    const topics = ['Budget Allocation', 'Climate Policy', 'Infrastructure', 'Healthcare', 'Education'];
    const candidates = [];
    
    topics.forEach(topic => {
      const numCandidates = Math.floor(Math.random() * 4) + 2; // 2-5 candidates per topic
      
      for (let i = 0; i < numCandidates; i++) {
        const candidateId = `${topic.toLowerCase().replace(/\s+/g, '-')}-candidate-${i + 1}`;
        const momentum = (Math.random() - 0.3) * 4; // -1.2 to 2.8
        const velocity = (Math.random() - 0.5) * 3; // -1.5 to 1.5
        const totalVotes = Math.floor(Math.random() * 500) + 50;
        
        // Generate time series data
        const timeSeries = [];
        const now = new Date();
        const intervals = 24;
        let cumulativeVotes = 0;
        
        for (let j = 0; j < intervals; j++) {
          const timestamp = new Date(now.getTime() - (intervals - j) * 3600000);
          const increment = Math.max(0, Math.floor(Math.random() * 20) + momentum);
          cumulativeVotes += increment;
          
          timeSeries.push({
            timestamp: timestamp.getTime(),
            count: increment
          });
        }
        
        candidates.push({
          id: candidateId,
          name: `Option ${String.fromCharCode(65 + i)}`,
          topic,
          totalVotes,
          recentVotes: Math.floor(totalVotes * 0.4),
          timeSeries,
          momentum,
          velocity,
          prediction: Math.max(0, totalVotes + momentum * 10),
          avgActivityScore: Math.random() * 40 + 40, // 40-80
          recentPercentage: Math.random() * 60 + 20, // 20-80%
          momentumClass: getMomentumClass(momentum),
          isRising: momentum > 0,
          isFalling: momentum < -0.1
        });
      }
    });
    
    return candidates.sort((a, b) => b.momentum - a.momentum);
  };

  const handleVoteUpdate = useCallback((data) => {
    if (data && data.candidateId) {
      setMomentumData(prevData => {
        return prevData.map(candidate => {
          if (candidate.id === data.candidateId) {
            const updatedCandidate = { ...candidate };
            updatedCandidate.totalVotes += 1;
            updatedCandidate.recentVotes += 1;
            
            // Update time series
            const now = new Date();
            const lastEntry = updatedCandidate.timeSeries[updatedCandidate.timeSeries.length - 1];
            if (lastEntry && now.getTime() - lastEntry.timestamp < 3600000) {
              lastEntry.count += 1;
            } else {
              updatedCandidate.timeSeries.push({
                timestamp: now.getTime(),
                count: 1
              });
            }
            
            // Recalculate momentum
            updatedCandidate.momentum = calculateMomentumScore(updatedCandidate.timeSeries);
            updatedCandidate.momentumClass = getMomentumClass(updatedCandidate.momentum);
            
            return updatedCandidate;
          }
          return candidate;
        });
      });
    }
  }, []);

  const handleCandidateUpdate = useCallback((data) => {
    if (data && data.updates) {
      setMomentumData(prevData => {
        const updatedData = [...prevData];
        data.updates.forEach(update => {
          const index = updatedData.findIndex(c => c.id === update.candidateId);
          if (index >= 0) {
            updatedData[index] = { ...updatedData[index], ...update };
          }
        });
        return updatedData;
      });
    }
  }, []);

  const renderMomentumChart = () => {
    if (!svgRef.current || !momentumData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = compact 
      ? { top: 10, right: 10, bottom: 30, left: 60 }
      : { top: 20, right: 40, bottom: 40, left: 80 };
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data based on view mode
    const getValue = (d) => {
      switch (viewMode) {
        case 'velocity': return d.velocity;
        case 'prediction': return d.prediction;
        default: return d.momentum;
      }
    };

    const sortedData = [...momentumData].sort((a, b) => getValue(b) - getValue(a));
    const displayData = compact ? sortedData.slice(0, 10) : sortedData.slice(0, 20);

    // Scales
    const xScale = d3.scaleBand()
      .domain(displayData.map(d => d.name))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(displayData, getValue))
      .nice()
      .range([innerHeight, 0]);

    // Color scale based on momentum
    const colorScale = d3.scaleSequential()
      .domain(d3.extent(displayData, d => d.momentum))
      .interpolator(d3.interpolateRdYlGn);

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Draw bars
    const bars = g.selectAll(".momentum-bar")
      .data(displayData)
      .enter().append("rect")
      .attr("class", "momentum-bar")
      .attr("x", d => xScale(d.name))
      .attr("y", d => getValue(d) >= 0 ? yScale(getValue(d)) : yScale(0))
      .attr("width", xScale.bandwidth())
      .attr("height", d => Math.abs(yScale(getValue(d)) - yScale(0)))
      .attr("fill", d => colorScale(d.momentum))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 2);
        
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.name}</strong><br/>
            <em>${d.topic}</em><br/>
            Momentum: ${d.momentum.toFixed(2)}<br/>
            Velocity: ${d.velocity.toFixed(2)}<br/>
            Total Votes: ${d.totalVotes}<br/>
            Recent: ${d.recentPercentage.toFixed(1)}%<br/>
            Avg Activity: ${d.avgActivityScore.toFixed(0)}th percentile
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 1);
        tooltip.style("opacity", 0);
      });

    // Add axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${yScale(0)})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", compact ? "10px" : "12px");

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale))
      .style("font-size", compact ? "10px" : "12px");

    // Add zero line
    if (yScale.domain()[0] < 0 && yScale.domain()[1] > 0) {
      g.append("line")
        .attr("class", "zero-line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#666")
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.7);
    }

    // Add labels
    if (!compact) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(viewModeOptions.find(opt => opt.value === viewMode)?.label || 'Score');

      g.append("text")
        .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Candidates");
    }
  };

  if (loading) {
    return (
      <div className="candidate-momentum loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading candidate momentum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-momentum error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMomentumData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`candidate-momentum ${compact ? 'compact' : 'full'}`}>
      {!compact && (
        <div className="momentum-controls">
          <div className="control-group">
            <label htmlFor="timeframe-select">Timeframe:</label>
            <select 
              id="timeframe-select"
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="viewmode-select">View:</label>
            <select 
              id="viewmode-select"
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
            >
              {viewModeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      <div className="momentum-container">
        <svg ref={svgRef}></svg>
        <div ref={tooltipRef} className="momentum-tooltip"></div>
      </div>
      
      {showTrending && trendingCandidates.length > 0 && !compact && (
        <div className="trending-sidebar">
          <h3>🔥 Trending Now</h3>
          <div className="trending-list">
            {trendingCandidates.map((candidate, index) => (
              <div key={candidate.id} className={`trending-item ${candidate.momentumClass}`}>
                <div className="trending-rank">#{index + 1}</div>
                <div className="trending-info">
                  <div className="trending-name">{candidate.name}</div>
                  <div className="trending-topic">{candidate.topic}</div>
                  <div className="trending-metrics">
                    <span className="momentum-score">
                      {candidate.momentum > 0 ? '📈' : '📉'} {candidate.momentum.toFixed(1)}
                    </span>
                    <span className="vote-count">{candidate.recentVotes} recent votes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateMomentum;
