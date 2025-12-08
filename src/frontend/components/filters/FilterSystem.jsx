// frontend/components/filters/FilterSystem.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import './FilterSystem.css';

const FilterSystem = ({ onFiltersChange, activeFilters = [] }) => {
  const { user } = useAuth();
  const [availableFilters, setAvailableFilters] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);
  const [filterVotes, setFilterVotes] = useState({});
  const [showFilterCreator, setShowFilterCreator] = useState(false);
  const [newFilter, setNewFilter] = useState({ name: '', description: '', criteria: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available filters and their vote counts
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/filters/community-filters');
        if (response.ok) {
          const data = await response.json();
          setAvailableFilters(data.filters);
          setFilterVotes(data.votes);
        }
      } catch (error) {
        console.error('Failed to fetch community filters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilters();
    // Refresh filters every 2 minutes
    const interval = setInterval(fetchFilters, 120000);
    return () => clearInterval(interval);
  }, []);

  // Apply selected filters
  const handleFilterToggle = useCallback((filter) => {
    const newSelection = selectedFilters.includes(filter.id)
      ? selectedFilters.filter(id => id !== filter.id)
      : [...selectedFilters, filter.id];
    
    setSelectedFilters(newSelection);
    onFiltersChange?.(newSelection);
  }, [selectedFilters, onFiltersChange]);

  // Vote for a filter
  const handleFilterVote = async (filterId, voteType) => {
    try {
      const response = await fetch('/api/filters/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterId, voteType, userId: user })
      });
      
      if (response.ok) {
        const updatedVotes = await response.json();
        setFilterVotes(prev => ({ ...prev, [filterId]: updatedVotes }));
      }
    } catch (error) {
      console.error('Failed to vote for filter:', error);
    }
  };

  // Create new community filter
  const handleCreateFilter = async () => {
    if (!newFilter.name || !newFilter.criteria) return;

    try {
      const response = await fetch('/api/filters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFilter, createdBy: user })
      });
      
      if (response.ok) {
        const createdFilter = await response.json();
        setAvailableFilters(prev => [...prev, createdFilter]);
        setNewFilter({ name: '', description: '', criteria: '' });
        setShowFilterCreator(false);
      }
    } catch (error) {
      console.error('Failed to create filter:', error);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedFilters([]);
    onFiltersChange?.([]);
  };

  // Get top 20 filters by community votes
  const topFilters = availableFilters
    .sort((a, b) => (filterVotes[b.id]?.upvotes || 0) - (filterVotes[a.id]?.upvotes || 0))
    .slice(0, 20);

  if (isLoading) {
    return (
      <div className="filter-system loading">
        <div className="loading-spinner"></div>
        <p>Loading community filters...</p>
      </div>
    );
  }

  return (
    <div className="filter-system">
      <div className="filter-header">
        <h3>Community Filters</h3>
        <div className="filter-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowFilterCreator(!showFilterCreator)}
          >
            Create Filter
          </button>
          {selectedFilters.length > 0 && (
            <button 
              className="btn-clear"
              onClick={handleClearFilters}
            >
              Clear All ({selectedFilters.length})
            </button>
          )}
        </div>
      </div>

      {showFilterCreator && (
        <div className="filter-creator">
          <h4>Create New Community Filter</h4>
          <div className="form-group">
            <label>Filter Name</label>
            <input
              type="text"
              value={newFilter.name}
              onChange={(e) => setNewFilter(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., High Activity Users"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newFilter.description}
              onChange={(e) => setNewFilter(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this filter does..."
            />
          </div>
          <div className="form-group">
            <label>Filter Criteria (JSON)</label>
            <textarea
              value={newFilter.criteria}
              onChange={(e) => setNewFilter(prev => ({ ...prev, criteria: e.target.value }))}
              placeholder='{"activityLevel": {"min": 0.7}, "region": "local"}'
            />
          </div>
          <div className="creator-actions">
            <button className="btn-primary" onClick={handleCreateFilter}>
              Create Filter
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowFilterCreator(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="filters-grid">
        {topFilters.map(filter => {
          const votes = filterVotes[filter.id] || { upvotes: 0, downvotes: 0 };
          const isSelected = selectedFilters.includes(filter.id);
          const netVotes = votes.upvotes - votes.downvotes;

          return (
            <div 
              key={filter.id} 
              className={`filter-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="filter-info">
                <h4>{filter.name}</h4>
                <p>{filter.description}</p>
                <div className="filter-meta">
                  <span className="creator">by {filter.createdBy}</span>
                  <span className="votes">
                    <span className="upvotes">👍 {votes.upvotes}</span>
                    <span className="downvotes">👎 {votes.downvotes}</span>
                    <span className="net-score">Net: {netVotes}</span>
                  </span>
                </div>
              </div>
              
              <div className="filter-actions">
                <button
                  className={`filter-toggle ${isSelected ? 'active' : ''}`}
                  onClick={() => handleFilterToggle(filter)}
                >
                  {isSelected ? 'Remove' : 'Apply'}
                </button>
                
                <div className="vote-buttons">
                  <button
                    className="vote-btn upvote"
                    onClick={() => handleFilterVote(filter.id, 'up')}
                    title="Vote Up"
                  >
                    👍
                  </button>
                  <button
                    className="vote-btn downvote"
                    onClick={() => handleFilterVote(filter.id, 'down')}
                    title="Vote Down"
                  >
                    👎
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {topFilters.length === 0 && (
        <div className="no-filters">
          <p>No community filters available yet.</p>
          <p>Be the first to create a filter for the community!</p>
        </div>
      )}
    </div>
  );
};

export default FilterSystem;
