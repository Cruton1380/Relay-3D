/**
 * @fileoverview Enhanced Chatroom Search and Filter Component
 * Implements advanced discovery and moderation features
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Users, Eye, EyeOff, Star, Clock, Hash } from 'lucide-react';
import './ChatroomFilters.css';

const ChatroomFilters = ({ 
  channelId, 
  onFiltersChange, 
  filterOptions = {},
  currentUser,
  className = '' 
}) => {
  const [filters, setFilters] = useState({
    keyword: '',
    mediaOnly: false,
    topRanked: false,
    newest: false,
    visibleUsersOnly: true,
    unhideCollapsed: false,
    tags: [],
    userPercentileFilter: null,
    scoreRange: null
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Update parent component when filters change
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onFiltersChange(filters);
    }, 300); // Debounce search

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filters, onFiltersChange]);

  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  const handleKeywordChange = useCallback((e) => {
    handleFilterChange('keyword', e.target.value);
  }, [handleFilterChange]);

  const toggleFilter = useCallback((filterKey) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      keyword: '',
      mediaOnly: false,
      topRanked: false,
      newest: false,
      visibleUsersOnly: true,
      unhideCollapsed: false,
      tags: [],
      userPercentileFilter: null,
      scoreRange: null
    });
  }, []);

  const {
    totalUsers = 0,
    mutedUsers = 0,
    activeUsers = 0,
    percentileThreshold = 10,
    scoreRange = { min: 0, max: 0 }
  } = filterOptions;

  return (
    <div className={`chatroom-filters ${className}`}>
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search messages and users..."
            value={filters.keyword}
            onChange={handleKeywordChange}
            className="search-input"
          />
          {filters.keyword && (
            <button
              onClick={() => handleFilterChange('keyword', '')}
              className="clear-search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <button
          className={`filter-btn ${filters.topRanked ? 'active' : ''}`}
          onClick={() => toggleFilter('topRanked')}
          title="Show highest-scored users first"
        >
          <Star size={14} />
          Top Ranked
        </button>

        <button
          className={`filter-btn ${filters.newest ? 'active' : ''}`}
          onClick={() => toggleFilter('newest')}
          title="Show newest messages first"
        >
          <Clock size={14} />
          Newest
        </button>

        <button
          className={`filter-btn ${filters.mediaOnly ? 'active' : ''}`}
          onClick={() => toggleFilter('mediaOnly')}
          title="Show only messages with media"
        >
          <Hash size={14} />
          Media Only
        </button>

        <button
          className={`filter-btn ${filters.visibleUsersOnly ? 'active' : ''}`}
          onClick={() => toggleFilter('visibleUsersOnly')}
          title={`Hide messages from users below ${percentileThreshold}th percentile`}
        >
          <Eye size={14} />
          Visible Users
        </button>

        <button
          className={`filter-btn ${filters.unhideCollapsed ? 'active' : ''}`}
          onClick={() => toggleFilter('unhideCollapsed')}
          title="Show collapsed/filtered messages"
        >
          <EyeOff size={14} />
          Show Hidden
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="advanced-filters-toggle">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="toggle-advanced"
        >
          <Filter size={14} />
          Advanced Filters
          <span className={`chevron ${showAdvancedFilters ? 'open' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="advanced-filters-panel">
          {/* User Percentile Filter */}
          <div className="filter-group">
            <label htmlFor="percentile-filter">Minimum User Percentile:</label>
            <div className="percentile-filter">
              <input
                id="percentile-filter"
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.userPercentileFilter || 0}
                onChange={(e) => handleFilterChange('userPercentileFilter', 
                  e.target.value === '0' ? null : parseInt(e.target.value)
                )}
                className="percentile-range"
              />
              <span className="percentile-value">
                {filters.userPercentileFilter || 0}th percentile
              </span>
            </div>
          </div>

          {/* Score Range Filter */}
          <div className="filter-group">
            <label>Score Range:</label>
            <div className="score-range-filter">
              <input
                type="number"
                placeholder="Min"
                value={filters.scoreRange?.min || ''}
                onChange={(e) => handleFilterChange('scoreRange', {
                  ...filters.scoreRange,
                  min: e.target.value ? parseInt(e.target.value) : null
                })}
                className="score-input"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.scoreRange?.max || ''}
                onChange={(e) => handleFilterChange('scoreRange', {
                  ...filters.scoreRange,
                  max: e.target.value ? parseInt(e.target.value) : null
                })}
                className="score-input"
              />
            </div>
          </div>

          {/* Filter Statistics */}
          <div className="filter-stats">
            <div className="stat-item">
              <Users size={14} />
              <span>Total Users: {totalUsers}</span>
            </div>
            <div className="stat-item">
              <span className="active-users">Active: {activeUsers}</span>
            </div>
            <div className="stat-item">
              <span className="muted-users">Muted: {mutedUsers}</span>
            </div>
            <div className="stat-item">
              <span className="threshold-info">
                Threshold: {percentileThreshold}th percentile
              </span>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="filter-actions">
            <button onClick={resetFilters} className="reset-filters">
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.keyword || filters.mediaOnly || filters.topRanked || 
        filters.newest || !filters.visibleUsersOnly || filters.unhideCollapsed ||
        filters.userPercentileFilter || filters.scoreRange) && (
        <div className="active-filters-summary">
          <span className="summary-label">Active filters:</span>
          <div className="active-filter-tags">
            {filters.keyword && (
              <span className="filter-tag">
                Search: "{filters.keyword}"
                <button onClick={() => handleFilterChange('keyword', '')}>×</button>
              </span>
            )}
            {filters.mediaOnly && (
              <span className="filter-tag">
                Media Only
                <button onClick={() => toggleFilter('mediaOnly')}>×</button>
              </span>
            )}
            {filters.topRanked && (
              <span className="filter-tag">
                Top Ranked
                <button onClick={() => toggleFilter('topRanked')}>×</button>
              </span>
            )}
            {filters.newest && (
              <span className="filter-tag">
                Newest First
                <button onClick={() => toggleFilter('newest')}>×</button>
              </span>
            )}
            {!filters.visibleUsersOnly && (
              <span className="filter-tag">
                Show All Users
                <button onClick={() => toggleFilter('visibleUsersOnly')}>×</button>
              </span>
            )}
            {filters.unhideCollapsed && (
              <span className="filter-tag">
                Show Hidden
                <button onClick={() => toggleFilter('unhideCollapsed')}>×</button>
              </span>
            )}
            {filters.userPercentileFilter && (
              <span className="filter-tag">
                ≥{filters.userPercentileFilter}th percentile
                <button onClick={() => handleFilterChange('userPercentileFilter', null)}>×</button>
              </span>
            )}
            {filters.scoreRange && (
              <span className="filter-tag">
                Score: {filters.scoreRange.min || '-∞'} to {filters.scoreRange.max || '+∞'}
                <button onClick={() => handleFilterChange('scoreRange', null)}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatroomFilters;
