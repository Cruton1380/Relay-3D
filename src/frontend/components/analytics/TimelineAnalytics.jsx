/**
 * Timeline Analytics Component
 * 
 * Interactive timeline visualization for Topic Row Competition analysis
 * with multi-line tracking for different user types and vote patterns.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
// import * as d3 from 'd3'; // Temporarily disabled due to build issues
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth.jsx';
import './TimelineAnalytics.css';

// Simple d3-like utility functions to avoid dependency issues
const d3Utils = {
  scaleLinear: () => ({
    domain: function(d) { this._domain = d; return this; },
    range: function(r) { this._range = r; return this; },
    _domain: [0, 1],
    _range: [0, 100],
    call: function(val) {
      const [d0, d1] = this._domain;
      const [r0, r1] = this._range;
      return r0 + (val - d0) * (r1 - r0) / (d1 - d0);
    }
  }),
  scaleTime: () => d3Utils.scaleLinear(),
  max: (arr, fn) => Math.max(...arr.map(fn || (x => x))),
  select: (el) => ({
    selectAll: () => ({ data: () => ({ enter: () => ({ append: () => ({}) }) }) })
  })
};

// Replace d3 references with d3Utils for now
const d3 = d3Utils;

const TimelineAnalytics = ({ 
    topicRowId, 
    height = 400, 
    width = 800,
    onDataUpdate,
    realTimeUpdates = true 
}) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const { user } = useAuth();
    const { subscribe, unsubscribe } = useWebSocket();
    
    // State management
    const [timelineData, setTimelineData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        userTypes: ['active', 'local'],
        timeRange: '7d',
        showAnnotations: true,
        smoothing: 'moderate'
    });
    const [availableFilters, setAvailableFilters] = useState(null);
    const [selectedLines, setSelectedLines] = useState({
        activeUsers: true,
        inactiveUsers: false,
        foreignUsers: false,
        localUsers: true,
        proximityUsers: true,
        regionalUsers: true
    });

    // Chart dimensions and margins
    const margin = { top: 20, right: 120, bottom: 40, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    /**
     * Fetch timeline data from API
     */
    const fetchTimelineData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                timespan: filters.timespan || 'full',
                userTypes: filters.userTypes.join(','),
                timeRange: filters.timeRange,
                smoothing: filters.smoothing
            });

            const response = await fetch(`/api/analytics/timeline/${topicRowId}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                setTimelineData(result.data);
                if (onDataUpdate) {
                    onDataUpdate(result.data);
                }
            } else {
                throw new Error(result.error || 'Failed to fetch timeline data');
            }

        } catch (err) {
            console.error('Failed to fetch timeline data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [topicRowId, filters, user.token, onDataUpdate]);

    /**
     * Fetch available filters
     */
    const fetchAvailableFilters = useCallback(async () => {
        try {
            const response = await fetch(`/api/analytics/timeline/${topicRowId}/filters`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setAvailableFilters(result.data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch available filters:', err);
        }
    }, [topicRowId, user.token]);

    /**
     * Initialize timeline visualization
     */
    const initializeTimeline = useCallback(() => {
        if (!timelineData || !svgRef.current) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(getAllDataPoints(), d => new Date(d.timestamp)))
            .range([0, chartWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(getAllDataPoints(), d => d.voteWeight || d.userCount)])
            .nice()
            .range([chartHeight, 0]);

        // Create line generator
        const line = d3.line()
            .x(d => xScale(new Date(d.timestamp)))
            .y(d => yScale(d.voteWeight || d.userCount))
            .curve(d3.curveMonotoneX);

        // Add axes
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale)
                .tickFormat(d3.timeFormat('%m/%d %H:%M')));

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));

        // Add axis labels
        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (chartHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Vote Weight / User Count');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom})`)
            .style('text-anchor', 'middle')
            .text('Time');

        // Draw tracking lines
        drawTrackingLines(g, line, xScale, yScale);

        // Add legend
        drawLegend(svg);

        // Add interactive features
        addInteractivity(g, xScale, yScale);

    }, [timelineData, chartWidth, chartHeight]);

    /**
     * Get all data points from all tracking lines
     */
    const getAllDataPoints = () => {
        if (!timelineData) return [];
        
        const allPoints = [];
        Object.entries(timelineData.trackingLines).forEach(([lineType, lineData]) => {
            if (selectedLines[lineType] && lineData.dataPoints) {
                allPoints.push(...lineData.dataPoints);
            }
        });
        return allPoints;
    };

    /**
     * Draw tracking lines for different user types
     */
    const drawTrackingLines = (g, line, xScale, yScale) => {
        Object.entries(timelineData.trackingLines).forEach(([lineType, lineData]) => {
            if (!selectedLines[lineType] || !lineData.dataPoints) return;

            const lineGroup = g.append('g')
                .attr('class', `tracking-line tracking-line-${lineType}`);

            // Draw the line
            lineGroup.append('path')
                .datum(lineData.dataPoints)
                .attr('class', 'line')
                .attr('d', line)
                .style('stroke', lineData.lineStyle.color)
                .style('stroke-width', lineData.lineStyle.thickness)
                .style('stroke-dasharray', lineData.lineStyle.pattern === 'dashed' ? '5,5' : 
                                           lineData.lineStyle.pattern === 'dotted' ? '2,2' : 'none')
                .style('fill', 'none')
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .style('opacity', 0.8);

            // Add data points
            lineGroup.selectAll('.data-point')
                .data(lineData.dataPoints)
                .enter().append('circle')
                .attr('class', 'data-point')
                .attr('cx', d => xScale(new Date(d.timestamp)))
                .attr('cy', d => yScale(d.voteWeight || d.userCount))
                .attr('r', 3)
                .style('fill', lineData.lineStyle.color)
                .style('opacity', 0)
                .on('mouseover', (event, d) => showTooltip(event, d, lineType))
                .on('mouseout', hideTooltip)
                .transition()
                .duration(1000)
                .delay((d, i) => i * 50)
                .style('opacity', 1);

            // Add annotations if enabled
            if (filters.showAnnotations && lineData.annotations) {
                addAnnotations(lineGroup, lineData.annotations, xScale, yScale);
            }
        });
    };

    /**
     * Draw legend for tracking lines
     */
    const drawLegend = (svg) => {
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 110}, 30)`);

        const legendItems = Object.entries(timelineData.trackingLines)
            .filter(([lineType]) => selectedLines[lineType]);

        legendItems.forEach(([lineType, lineData], i) => {
            const legendItem = legend.append('g')
                .attr('class', 'legend-item')
                .attr('transform', `translate(0, ${i * 25})`)
                .style('cursor', 'pointer')
                .on('click', () => toggleLine(lineType));

            legendItem.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 0)
                .attr('y2', 0)
                .style('stroke', lineData.lineStyle.color)
                .style('stroke-width', lineData.lineStyle.thickness);

            legendItem.append('text')
                .attr('x', 25)
                .attr('y', 5)
                .text(formatLineTypeName(lineType))
                .style('font-size', '12px')
                .style('fill', '#333');

            legendItem.append('text')
                .attr('x', 25)
                .attr('y', 18)
                .text(`${lineData.dataPoints?.length || 0} points`)
                .style('font-size', '10px')
                .style('fill', '#666');
        });
    };

    /**
     * Add interactive features
     */
    const addInteractivity = (g, xScale, yScale) => {
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .on('zoom', (event) => {
                const { transform } = event;
                g.attr('transform', transform);
            });

        g.call(zoom);

        // Add crosshair
        const crosshair = g.append('g')
            .attr('class', 'crosshair')
            .style('display', 'none');

        crosshair.append('line')
            .attr('class', 'crosshair-x')
            .attr('y1', 0)
            .attr('y2', chartHeight);

        crosshair.append('line')
            .attr('class', 'crosshair-y')
            .attr('x1', 0)
            .attr('x2', chartWidth);

        // Mouse move handler for crosshair
        g.append('rect')
            .attr('class', 'overlay')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mousemove', (event) => {
                const [mouseX, mouseY] = d3.pointer(event);
                crosshair.style('display', null);
                crosshair.select('.crosshair-x')
                    .attr('x1', mouseX)
                    .attr('x2', mouseX);
                crosshair.select('.crosshair-y')
                    .attr('y1', mouseY)
                    .attr('y2', mouseY);
            })
            .on('mouseout', () => {
                crosshair.style('display', 'none');
            });
    };

    /**
     * Show tooltip on hover
     */
    const showTooltip = (event, data, lineType) => {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'timeline-tooltip')
            .style('opacity', 0);

        tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);

        tooltip.html(`
            <div class="tooltip-header">${formatLineTypeName(lineType)}</div>
            <div class="tooltip-content">
                <div>Time: ${new Date(data.timestamp).toLocaleString()}</div>
                <div>Vote Weight: ${data.voteWeight?.toFixed(2) || 'N/A'}</div>
                <div>User Count: ${data.userCount || 'N/A'}</div>
                ${data.engagementLevel ? `<div>Engagement: ${data.engagementLevel.toFixed(2)}</div>` : ''}
                ${data.channelChoice ? `<div>Channel: ${data.channelChoice}</div>` : ''}
            </div>
        `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    };

    /**
     * Hide tooltip
     */
    const hideTooltip = () => {
        d3.selectAll('.timeline-tooltip').remove();
    };

    /**
     * Toggle tracking line visibility
     */
    const toggleLine = (lineType) => {
        setSelectedLines(prev => ({
            ...prev,
            [lineType]: !prev[lineType]
        }));
    };

    /**
     * Format line type names for display
     */
    const formatLineTypeName = (lineType) => {
        const names = {
            activeUsers: 'Active Users',
            inactiveUsers: 'Inactive Users',
            foreignUsers: 'Foreign Users',
            localUsers: 'Local Users',
            proximityUsers: 'Proximity Users',
            regionalUsers: 'Regional Users'
        };
        return names[lineType] || lineType;
    };

    /**
     * Handle filter changes
     */
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    /**
     * Handle real-time updates
     */
    useEffect(() => {
        if (realTimeUpdates && topicRowId) {
            const handleTimelineUpdate = (data) => {
                if (data.topicRowId === topicRowId) {
                    fetchTimelineData();
                }
            };

            subscribe('timeline.updated', handleTimelineUpdate);
            return () => unsubscribe('timeline.updated', handleTimelineUpdate);
        }
    }, [realTimeUpdates, topicRowId, subscribe, unsubscribe, fetchTimelineData]);

    /**
     * Initialize component
     */
    useEffect(() => {
        fetchTimelineData();
        fetchAvailableFilters();
    }, [fetchTimelineData, fetchAvailableFilters]);

    /**
     * Update chart when data or filters change
     */
    useEffect(() => {
        if (timelineData) {
            initializeTimeline();
        }
    }, [timelineData, selectedLines, initializeTimeline]);

    /**
     * Render loading state
     */
    if (loading) {
        return (
            <div className="timeline-analytics loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading timeline data...</div>
            </div>
        );
    }

    /**
     * Render error state
     */
    if (error) {
        return (
            <div className="timeline-analytics error">
                <div className="error-icon">⚠️</div>
                <div className="error-message">{error}</div>
                <button 
                    className="retry-button"
                    onClick={fetchTimelineData}
                >
                    Retry
                </button>
            </div>
        );
    }

    /**
     * Main render
     */
    return (
        <div className="timeline-analytics" ref={containerRef}>
            {/* Controls */}
            <div className="timeline-controls">
                <div className="filter-group">
                    <label>Time Range:</label>
                    <select 
                        value={filters.timeRange}
                        onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                    >
                        <option value="1h">Last Hour</option>
                        <option value="6h">Last 6 Hours</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Smoothing:</label>
                    <select 
                        value={filters.smoothing}
                        onChange={(e) => handleFilterChange('smoothing', e.target.value)}
                    >
                        <option value="none">None</option>
                        <option value="light">Light</option>
                        <option value="moderate">Moderate</option>
                        <option value="heavy">Heavy</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.showAnnotations}
                            onChange={(e) => handleFilterChange('showAnnotations', e.target.checked)}
                        />
                        Show Annotations
                    </label>
                </div>
            </div>

            {/* Line Toggles */}
            <div className="line-toggles">
                {Object.entries(selectedLines).map(([lineType, selected]) => (
                    <label key={lineType} className="line-toggle">
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleLine(lineType)}
                        />
                        <span className="line-toggle-color" 
                              style={{ backgroundColor: timelineData?.trackingLines[lineType]?.lineStyle.color }}>
                        </span>
                        {formatLineTypeName(lineType)}
                    </label>
                ))}
            </div>

            {/* Chart */}
            <div className="timeline-chart">
                <svg
                    ref={svgRef}
                    width={width}
                    height={height}
                    className="timeline-svg"
                />
            </div>

            {/* Statistics */}
            {timelineData && (
                <div className="timeline-statistics">
                    <div className="stat-group">
                        <div className="stat-label">Total Data Points:</div>
                        <div className="stat-value">{getAllDataPoints().length}</div>
                    </div>
                    <div className="stat-group">
                        <div className="stat-label">Time Span:</div>
                        <div className="stat-value">
                            {timelineData.metadata.analysisTimespan}
                        </div>
                    </div>
                    <div className="stat-group">
                        <div className="stat-label">Last Updated:</div>
                        <div className="stat-value">
                            {new Date(timelineData.metadata.generatedAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineAnalytics;
