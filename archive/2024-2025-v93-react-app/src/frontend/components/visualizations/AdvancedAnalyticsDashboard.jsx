/**
 * Advanced Analytics Dashboard
 * 
 * Comprehensive analytics dashboard integrating Timeline and Globe analytics
 * for Topic Row Competition analysis with real-time updates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import TimelineAnalytics from '../analytics/TimelineAnalytics';
import GlobeAnalytics from '../analytics/GlobeAnalytics';
import UserActivityAnalytics from './UserActivityAnalytics';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useWebSocket } from '../../hooks/useWebSocket';
import './AdvancedAnalyticsDashboard.css';

const AdvancedAnalyticsDashboard = ({ 
    topicRowId,
    realTimeUpdates = true,
    compact = false 
}) => {
    const { user } = useAuth();
    const { subscribe, unsubscribe } = useWebSocket();
    
    // State management
    const [activeView, setActiveView] = useState('overview');
    const [selectedTopicRow, setSelectedTopicRow] = useState(topicRowId);
    const [availableTopicRows, setAvailableTopicRows] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({
        timeline: null,
        globe: null,
        activity: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardFilters, setDashboardFilters] = useState({
        timeRange: '24h',
        userTypes: ['active', 'local'],
        privacyLevel: 'maximum',
        realTimeUpdates: realTimeUpdates
    });

    // View options for the analytics dashboard
    const viewOptions = [
        { 
            value: 'overview', 
            label: 'Overview', 
            icon: '📊',
            description: 'Combined analytics view'
        },
        { 
            value: 'timeline', 
            label: 'Timeline', 
            icon: '📈',
            description: 'Temporal voting patterns'
        },
        { 
            value: 'globe', 
            label: 'Globe', 
            icon: '🌍',
            description: 'Geographic vote distribution'
        },
        { 
            value: 'activity', 
            label: 'Activity', 
            icon: '👥',
            description: 'User activity analytics'
        },
        { 
            value: 'comparison', 
            label: 'Compare', 
            icon: '⚖️',
            description: 'Topic row comparison'
        }
    ];

    /**
     * Fetch available topic rows for selection
     */
    const fetchAvailableTopicRows = useCallback(async () => {
        try {
            const response = await fetch('/api/analytics/topic-rows', {
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
                setAvailableTopicRows(result.data.topicRows || []);
                
                // Set default topic row if none selected
                if (!selectedTopicRow && result.data.topicRows.length > 0) {
                    setSelectedTopicRow(result.data.topicRows[0].id);
                }
            }

        } catch (err) {
            console.error('Failed to fetch topic rows:', err);
        }
    }, [user.token, selectedTopicRow]);

    /**
     * Handle data updates from individual analytics components
     */
    const handleAnalyticsDataUpdate = useCallback((component, data) => {
        setAnalyticsData(prev => ({
            ...prev,
            [component]: data
        }));
    }, []);

    /**
     * Handle filter changes that affect all components
     */
    const handleGlobalFilterChange = useCallback((filterType, value) => {
        setDashboardFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    }, []);

    /**
     * Handle topic row selection change
     */
    const handleTopicRowChange = useCallback((newTopicRowId) => {
        setSelectedTopicRow(newTopicRowId);
        // Reset analytics data when changing topic rows
        setAnalyticsData({
            timeline: null,
            globe: null,
            activity: null
        });
    }, []);

    /**
     * Export analytics data
     */
    const handleExportData = useCallback(async () => {
        try {
            const exportData = {
                topicRowId: selectedTopicRow,
                timestamp: Date.now(),
                filters: dashboardFilters,
                data: analyticsData
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `analytics-export-${selectedTopicRow}-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Failed to export analytics data:', err);
        }
    }, [selectedTopicRow, dashboardFilters, analyticsData]);

    /**
     * Handle checkbox changes for user types
     */
    const handleUserTypeChange = useCallback((type) => {
        setDashboardFilters(prev => ({
            ...prev,
            userTypes: prev.userTypes.includes(type)
                ? prev.userTypes.filter(t => t !== type)
                : [...prev.userTypes, type]
        }));
    }, []);

    /**
     * Handle real-time updates toggle
     */
    const handleRealTimeUpdatesChange = useCallback(() => {
        setDashboardFilters(prev => ({
            ...prev,
            realTimeUpdates: !prev.realTimeUpdates
        }));
    }, []);

    /**
     * Set up real-time updates
     */
    useEffect(() => {
        if (!realTimeUpdates) return;

        const handleRealTimeUpdate = (data) => {
            if (data.type === 'analytics-update' && data.topicRowId === selectedTopicRow) {
                // Update relevant analytics data
                handleAnalyticsDataUpdate(data.component, data.updatedData);
            }
        };

        subscribe(`analytics-${selectedTopicRow}`, handleRealTimeUpdate);

        return () => {
            unsubscribe(`analytics-${selectedTopicRow}`, handleRealTimeUpdate);
        };
    }, [selectedTopicRow, realTimeUpdates, subscribe, unsubscribe, handleAnalyticsDataUpdate]);

    // Fetch available topic rows on mount
    useEffect(() => {
        fetchAvailableTopicRows();
    }, [fetchAvailableTopicRows]);

    // Track loading state
    useEffect(() => {
        const hasAllData = analyticsData.timeline && analyticsData.globe && analyticsData.activity;
        setLoading(!hasAllData && selectedTopicRow);
    }, [analyticsData, selectedTopicRow]);

    if (!selectedTopicRow) {
        return (
            <div className="advanced-analytics-dashboard loading">
                <div className="loading-message">
                    <div className="loading-icon">📊</div>
                    <h3>No Topic Row Selected</h3>
                    <p>Please select a topic row to view analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`advanced-analytics-dashboard ${compact ? 'compact' : ''}`}>
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div className="header-main">
                    <h2>Advanced Analytics Dashboard</h2>
                    <div className="header-stats">
                        {analyticsData.timeline && (
                            <div className="stat">
                                <span className="stat-label">Total Votes:</span>
                                <span className="stat-value">
                                    {analyticsData.timeline.totalVotes?.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {analyticsData.globe && (
                            <div className="stat">
                                <span className="stat-label">Active Regions:</span>
                                <span className="stat-value">
                                    {analyticsData.globe.activeRegions}
                                </span>
                            </div>
                        )}
                        <div className="stat">
                            <span className="stat-label">Last Update:</span>
                            <span className="stat-value">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="dashboard-controls">
                    {/* Topic Row Selector */}
                    <div className="control-group">
                        <label>Topic Row:</label>
                        <select 
                            value={selectedTopicRow}
                            onChange={(e) => handleTopicRowChange(e.target.value)}
                            className="topic-row-selector"
                            disabled={loading}
                        >
                            {availableTopicRows.map(row => (
                                <option key={row.id} value={row.id}>
                                    {row.title} ({row.voteCount} votes)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Global Filters */}
                    <div className="filter-controls">
                        <label>
                            <input
                                type="checkbox"
                                checked={dashboardFilters.realTimeUpdates}
                                onChange={handleRealTimeUpdatesChange}
                            />
                            Real-time updates
                        </label>

                        <div className="user-type-filters">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={dashboardFilters.userTypes.includes('active')}
                                    onChange={() => handleUserTypeChange('active')}
                                />
                                Active users
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={dashboardFilters.userTypes.includes('local')}
                                    onChange={() => handleUserTypeChange('local')}
                                />
                                Local users
                            </label>
                        </div>

                        <select
                            value={dashboardFilters.timeRange}
                            onChange={(e) => handleGlobalFilterChange('timeRange', e.target.value)}
                        >
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <button onClick={handleExportData} className="export-button" disabled={loading || !analyticsData.timeline}>
                        📥 Export Data
                    </button>
                </div>
            </div>

            {/* View Navigation */}
            <div className="view-navigation">
                {viewOptions.map(option => (
                    <button
                        key={option.value}
                        className={`view-tab ${activeView === option.value ? 'active' : ''}`}
                        onClick={() => setActiveView(option.value)}
                        title={option.description}
                    >
                        <span className="tab-icon">{option.icon}</span>
                        <span className="tab-label">{option.label}</span>
                    </button>
                ))}
            </div>

            {/* Analytics Content */}
            <div className="analytics-content">
                {activeView === 'overview' && (
                    <div className="overview-layout">
                        <div className="analytics-grid">
                            <div className="analytics-panel timeline-panel">
                                <h3>📈 Timeline Analysis</h3>
                                <TimelineAnalytics
                                    topicRowId={selectedTopicRow}
                                    height={300}
                                    width={600}
                                    onDataUpdate={(data) => handleAnalyticsDataUpdate('timeline', data)}
                                    realTimeUpdates={dashboardFilters.realTimeUpdates}
                                />
                            </div>
                            
                            <div className="analytics-panel globe-panel">
                                <h3>🌍 Geographic Distribution</h3>
                                <GlobeAnalytics
                                    topicRowId={selectedTopicRow}
                                    height={400}
                                    width={600}
                                    onDataUpdate={(data) => handleAnalyticsDataUpdate('globe', data)}
                                    realTimeUpdates={dashboardFilters.realTimeUpdates}
                                    privacyLevel={dashboardFilters.privacyLevel}
                                />
                            </div>
                            
                            <div className="analytics-panel activity-panel full-width">
                                <h3>👥 Activity Overview</h3>
                                <UserActivityAnalytics 
                                    compact={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'timeline' && (
                    <div className="single-view-layout">
                        <TimelineAnalytics
                            topicRowId={selectedTopicRow}
                            height={500}
                            width={1200}
                            onDataUpdate={(data) => handleAnalyticsDataUpdate('timeline', data)}
                            realTimeUpdates={dashboardFilters.realTimeUpdates}
                        />
                    </div>
                )}

                {activeView === 'globe' && (
                    <div className="single-view-layout">
                        <GlobeAnalytics
                            topicRowId={selectedTopicRow}
                            height={600}
                            width={1200}
                            onDataUpdate={(data) => handleAnalyticsDataUpdate('globe', data)}
                            realTimeUpdates={dashboardFilters.realTimeUpdates}
                            privacyLevel={dashboardFilters.privacyLevel}
                        />
                    </div>
                )}

                {activeView === 'activity' && (
                    <div className="single-view-layout">
                        <UserActivityAnalytics compact={false} />
                    </div>
                )}

                {activeView === 'comparison' && (
                    <div className="comparison-layout">
                        <div className="comparison-message">
                            <h3>🔄 Topic Row Comparison</h3>
                            <p>Multi-topic row comparison view coming soon...</p>
                            <p>This will allow side-by-side analysis of voting patterns across different topic rows.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Real-time Update Indicator */}
            {realTimeUpdates && (
                <div className="realtime-indicator">
                    <div className="pulse-dot"></div>
                    <span>Live Updates</span>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading analytics data...</p>
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalyticsDashboard;
