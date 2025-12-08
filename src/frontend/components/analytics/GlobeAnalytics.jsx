/**
 * Globe Analytics Component
 * 
 * Interactive globe visualization for geographic vote distribution analysis
 * with privacy-preserving regional aggregation (no GPS-level location tracking).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
// import * as THREE from 'three'; // Commented out due to build issues - will use canvas/SVG instead
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth.jsx';
import './GlobeAnalytics.css';

const GlobeAnalytics = ({ 
    topicRowId, 
    height = 500, 
    width = 800,
    onDataUpdate,
    realTimeUpdates = true,
    privacyLevel = 'maximum' 
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const globeRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    const { user } = useAuth();
    const { subscribe, unsubscribe } = useWebSocket();
    
    // State management
    const [globeData, setGlobeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        userTypes: ['active', 'local'],
        timeRange: '24h',
        privacyLevel: privacyLevel,
        showClusters: true,
        showTrajectories: false,
        animationSpeed: 'normal'
    });
    const [availableRegions, setAvailableRegions] = useState([]);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [plotControls, setPlotControls] = useState({
        rotation: true,
        zoom: true,
        autoRotate: false,
        showLabels: true
    });

    // Three.js objects
    const [camera, setCamera] = useState(null);
    const [controls, setControls] = useState(null);
    const [userPlots, setUserPlots] = useState(new Map());
    const [regionBoundaries, setRegionBoundaries] = useState(new Map());    /**
     * Initialize 2D globe visualization using Canvas
     */
    const initializeGlobe = useCallback(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Store context for later use
        canvas.ctx = ctx;
        
        // Initialize globe state
        const globeState = {
            rotation: 0,
            scale: Math.min(width, height) * 0.35,
            centerX: width / 2,
            centerY: height / 2,
            mouseDown: false,
            lastMouseX: 0,
            lastMouseY: 0
        };
        
        // Set up mouse interaction
        const handleMouseDown = (e) => {
            globeState.mouseDown = true;
            globeState.lastMouseX = e.clientX;
            globeState.lastMouseY = e.clientY;
        };
        
        const handleMouseMove = (e) => {
            if (!globeState.mouseDown) return;
            
            const deltaX = e.clientX - globeState.lastMouseX;
            globeState.rotation += deltaX * 0.01;
            globeState.lastMouseX = e.clientX;
            globeState.lastMouseY = e.clientY;
            
            drawGlobe(ctx, globeState);
        };
        
        const handleMouseUp = () => {
            globeState.mouseDown = false;
        };
        
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        
        // Store globe state
        canvas.globeState = globeState;
        
        // Initial draw
        drawGlobe(ctx, globeState);
        
        // Auto-rotation animation
        let animationFrame;
        const animate = () => {
            if (plotControls.autoRotate && !globeState.mouseDown) {
                globeState.rotation += 0.005;
                drawGlobe(ctx, globeState);
            }
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
        };

    }, [width, height, plotControls.autoRotate]);

    /**
     * Draw the 2D globe representation
     */
    const drawGlobe = useCallback((ctx, globeState) => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Create gradient background
        const bgGradient = ctx.createRadialGradient(
            globeState.centerX, globeState.centerY, 0,
            globeState.centerX, globeState.centerY, globeState.scale
        );
        bgGradient.addColorStop(0, '#1a4d6b');
        bgGradient.addColorStop(0.7, '#0d2b3d');
        bgGradient.addColorStop(1, '#000011');
        
        // Draw background
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw globe sphere
        ctx.beginPath();
        ctx.arc(globeState.centerX, globeState.centerY, globeState.scale, 0, 2 * Math.PI);
        
        // Globe gradient
        const globeGradient = ctx.createRadialGradient(
            globeState.centerX - globeState.scale * 0.3, 
            globeState.centerY - globeState.scale * 0.3, 
            0,
            globeState.centerX, 
            globeState.centerY, 
            globeState.scale
        );
        globeGradient.addColorStop(0, '#4a90c2');
        globeGradient.addColorStop(0.5, '#2d5aa0');
        globeGradient.addColorStop(1, '#1e3a8a');
        
        ctx.fillStyle = globeGradient;
        ctx.fill();
        
        // Draw continent outlines (simplified)
        drawContinents(ctx, globeState);
        
        // Draw user plots if available
        if (globeData && globeData.userPlots) {
            drawUserPlots(ctx, globeState);
        }
        
        // Draw regional boundaries if selected
        if (selectedRegions.length > 0) {
            drawRegionalBoundaries(ctx, globeState);
        }
        
        // Add atmosphere glow
        ctx.beginPath();
        ctx.arc(globeState.centerX, globeState.centerY, globeState.scale + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(135, 206, 250, 0.3)';
        ctx.lineWidth = 10;
        ctx.stroke();
        
    }, [width, height, globeData, selectedRegions]);

    /**
     * Draw simplified continent outlines
     */
    const drawContinents = useCallback((ctx, globeState) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        // Simplified continent shapes (this would be more detailed in production)
        const continents = [
            // North America
            { lat: 45, lon: -100, size: 40 },
            // Europe
            { lat: 50, lon: 10, size: 25 },
            // Asia
            { lat: 35, lon: 100, size: 60 },
            // Africa
            { lat: 0, lon: 20, size: 45 },
            // South America
            { lat: -15, lon: -60, size: 35 },
            // Australia
            { lat: -25, lon: 135, size: 20 }
        ];
        
        continents.forEach(continent => {
            const point = projectToGlobe(continent.lat, continent.lon, globeState);
            if (point.visible) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, continent.size * point.scale, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    }, []);

    /**
     * Draw user voting plots on the globe
     */
    const drawUserPlots = useCallback((ctx, globeState) => {
        globeData.userPlots.forEach(plot => {
            const point = projectToGlobe(plot.latitude, plot.longitude, globeState);
            if (!point.visible) return;
            
            // Calculate plot appearance based on vote intensity
            const maxVotes = Math.max(...globeData.userPlots.map(p => p.voteCount));
            const intensity = plot.voteCount / maxVotes;
            const size = 2 + intensity * 8;
            
            // Color based on user type and intensity
            let color;
            if (plot.isCluster) {
                color = `rgba(255, 165, 0, ${0.7 + intensity * 0.3})`; // Orange for clusters
            } else {
                color = `rgba(0, 212, 255, ${0.5 + intensity * 0.5})`; // Blue for individuals
            }
            
            // Draw the plot point
            ctx.beginPath();
            ctx.arc(point.x, point.y, size * point.scale, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Add glow effect for high-intensity points
            if (intensity > 0.7) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, (size + 4) * point.scale, 0, 2 * Math.PI);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Add label for clusters if enabled
            if (plotControls.showLabels && plot.isCluster && point.scale > 0.5) {
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    plot.voteCount.toString(),
                    point.x,
                    point.y - (size + 8) * point.scale
                );
            }
        });
    }, [globeData, plotControls.showLabels]);

    /**
     * Draw regional boundaries
     */
    const drawRegionalBoundaries = useCallback((ctx, globeState) => {
        if (!globeData || !globeData.regionalBoundaries) return;
        
        ctx.strokeStyle = 'rgba(255, 102, 0, 0.7)';
        ctx.lineWidth = 2;
        
        selectedRegions.forEach(regionId => {
            const region = globeData.regionalBoundaries.find(r => r.id === regionId);
            if (!region || !region.coordinates) return;
            
            ctx.beginPath();
            let first = true;
            
            region.coordinates.forEach(coord => {
                const point = projectToGlobe(coord.lat, coord.lon, globeState);
                if (point.visible) {
                    if (first) {
                        ctx.moveTo(point.x, point.y);
                        first = false;
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                }
            });
            
            ctx.stroke();
        });
    }, [globeData, selectedRegions]);

    /**
     * Project latitude/longitude to 2D globe coordinates
     */
    const projectToGlobe = useCallback((lat, lon, globeState) => {
        // Convert to radians
        const latRad = (lat * Math.PI) / 180;
        const lonRad = ((lon + globeState.rotation * 180 / Math.PI) * Math.PI) / 180;
        
        // Simple orthographic projection
        const x = globeState.centerX + globeState.scale * Math.cos(latRad) * Math.sin(lonRad);
        const y = globeState.centerY - globeState.scale * Math.sin(latRad);
        
        // Check if point is visible on front of sphere
        const visible = Math.cos(latRad) * Math.cos(lonRad) > 0;
        
        // Calculate scale based on distance from center (depth effect)
        const distance = Math.sqrt(
            Math.pow(x - globeState.centerX, 2) + 
            Math.pow(y - globeState.centerY, 2)
        );
        const scale = Math.max(0.3, 1 - distance / globeState.scale);
        
        return { x, y, visible, scale };
    }, []);

    /**
     * Fetch globe voting data from API
     */
    const fetchGlobeData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Initialize globe visualization
            const initResponse = await fetch('/api/analytics/globe/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    containerId: `globe-${topicRowId}`,
                    options: {
                        privacyLevel: filters.privacyLevel,
                        realTimeUpdates: realTimeUpdates
                    }
                })
            });

            if (!initResponse.ok) {
                throw new Error(`HTTP ${initResponse.status}: ${initResponse.statusText}`);
            }

            // Get voting user data
            const params = new URLSearchParams({
                userTypes: filters.userTypes.join(','),
                timeRange: filters.timeRange,
                privacyLevel: filters.privacyLevel,
                showClusters: filters.showClusters.toString()
            });

            const dataResponse = await fetch(`/api/analytics/globe/${topicRowId}/voting-users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!dataResponse.ok) {
                throw new Error(`HTTP ${dataResponse.status}: ${dataResponse.statusText}`);
            }

            const result = await dataResponse.json();
            if (result.success) {
                setGlobeData(result.data);
                setAvailableRegions(result.data.availableRegions || []);
                if (onDataUpdate) {
                    onDataUpdate(result.data);
                }
            } else {
                throw new Error(result.error || 'Failed to fetch globe data');
            }

        } catch (err) {
            console.error('Failed to fetch globe data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [topicRowId, filters, user.token, onDataUpdate, realTimeUpdates]);    /**
     * Plot user data on canvas globe
     */
    const plotUserData = useCallback(() => {
        if (!globeData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        if (canvas.ctx && canvas.globeState) {
            drawGlobe(canvas.ctx, canvas.globeState);
        }

    }, [globeData, drawGlobe]);

    /**
     * Plot regional boundaries on canvas globe
     */
    const plotRegionalBoundaries = useCallback(() => {
        if (!globeData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        if (canvas.ctx && canvas.globeState) {
            drawGlobe(canvas.ctx, canvas.globeState);
        }

    }, [globeData, selectedRegions, drawGlobe]);

    /**
     * Handle filter changes
     */
    const handleFilterChange = useCallback((filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    }, []);

    /**
     * Handle plot control changes
     */
    const handlePlotControlChange = useCallback((controlType, value) => {
        setPlotControls(prev => ({
            ...prev,
            [controlType]: value
        }));
    }, []);

    /**
     * Handle region selection
     */
    const handleRegionToggle = useCallback((regionId) => {
        setSelectedRegions(prev => {
            if (prev.includes(regionId)) {
                return prev.filter(id => id !== regionId);
            } else {
                return [...prev, regionId];
            }
        });
    }, []);

    /**
     * Set up real-time updates
     */
    useEffect(() => {
        if (!realTimeUpdates || !topicRowId) return;

        const handleRealTimeUpdate = (data) => {
            if (data.topicRowId === topicRowId && data.type === 'globe-update') {
                // Update globe data with new voting information
                setGlobeData(prev => ({
                    ...prev,
                    userPlots: data.updatedPlots || prev.userPlots,
                    lastUpdated: Date.now()
                }));
            }
        };

        subscribe(`globe-analytics-${topicRowId}`, handleRealTimeUpdate);

        return () => {
            unsubscribe(`globe-analytics-${topicRowId}`, handleRealTimeUpdate);
        };
    }, [topicRowId, realTimeUpdates, subscribe, unsubscribe]);

    // Initialize globe on mount
    useEffect(() => {
        const cleanup = initializeGlobe();
        return cleanup;
    }, [initializeGlobe]);

    // Fetch data when filters change
    useEffect(() => {
        fetchGlobeData();
    }, [fetchGlobeData]);

    // Plot user data when globe data changes
    useEffect(() => {
        plotUserData();
    }, [plotUserData]);

    // Plot regional boundaries when selection changes
    useEffect(() => {
        plotRegionalBoundaries();
    }, [plotRegionalBoundaries]);    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.width = width;
                canvas.height = height;
                
                if (canvas.globeState) {
                    canvas.globeState.centerX = width / 2;
                    canvas.globeState.centerY = height / 2;
                    canvas.globeState.scale = Math.min(width, height) * 0.35;
                    
                    if (canvas.ctx) {
                        drawGlobe(canvas.ctx, canvas.globeState);
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width, height, drawGlobe]);

    if (loading) {
        return (
            <div className="globe-analytics loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading globe visualization...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="globe-analytics error">
                <div className="error-icon">🌐</div>
                <div className="error-message">{error}</div>
                <button className="retry-button" onClick={fetchGlobeData}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="globe-analytics" ref={containerRef}>
            {/* Controls Panel */}
            <div className="globe-controls">
                {/* Filter Controls */}
                <div className="control-section">
                    <h4>Filters</h4>
                    <div className="control-group">
                        <label>User Types:</label>
                        <select 
                            multiple
                            value={filters.userTypes}
                            onChange={(e) => handleFilterChange('userTypes', Array.from(e.target.selectedOptions, option => option.value))}
                        >
                            <option value="active">Active Users</option>
                            <option value="inactive">Inactive Users</option>
                            <option value="local">Local Users</option>
                            <option value="foreign">Foreign Users</option>
                            <option value="proximity">Proximity Users</option>
                        </select>
                    </div>
                    
                    <div className="control-group">
                        <label>Time Range:</label>
                        <select 
                            value={filters.timeRange}
                            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                        >
                            <option value="1h">Last Hour</option>
                            <option value="6h">Last 6 Hours</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last Week</option>
                            <option value="30d">Last Month</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Privacy Level:</label>
                        <select 
                            value={filters.privacyLevel}
                            onChange={(e) => handleFilterChange('privacyLevel', e.target.value)}
                        >
                            <option value="minimal">Minimal</option>
                            <option value="moderate">Moderate</option>
                            <option value="maximum">Maximum</option>
                        </select>
                    </div>
                </div>

                {/* Display Controls */}
                <div className="control-section">
                    <h4>Display</h4>
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.showClusters}
                                onChange={(e) => handleFilterChange('showClusters', e.target.checked)}
                            />
                            Show Clusters
                        </label>
                    </div>
                    
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={plotControls.showLabels}
                                onChange={(e) => handlePlotControlChange('showLabels', e.target.checked)}
                            />
                            Show Labels
                        </label>
                    </div>
                    
                    <div className="control-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={plotControls.autoRotate}
                                onChange={(e) => handlePlotControlChange('autoRotate', e.target.checked)}
                            />
                            Auto Rotate
                        </label>
                    </div>
                </div>

                {/* Regional Boundaries */}
                <div className="control-section">
                    <h4>Regions</h4>
                    <div className="region-selector">
                        {availableRegions.map(region => (
                            <label key={region.id} className="region-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedRegions.includes(region.id)}
                                    onChange={() => handleRegionToggle(region.id)}
                                />
                                {region.name}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Globe Visualization */}
            <div className="globe-container">
                <canvas 
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="globe-canvas"
                />
                
                {/* Stats Overlay */}
                {globeData && (
                    <div className="globe-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Votes:</span>
                            <span className="stat-value">{globeData.totalVotes?.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Active Regions:</span>
                            <span className="stat-value">{globeData.activeRegions}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Last Update:</span>
                            <span className="stat-value">
                                {new Date(globeData.lastUpdated).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobeAnalytics;
