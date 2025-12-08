/**
 * @fileoverview Modern, accessible VoteResultsDisplay component with performance optimizations
 * @version 2.0.0
 * @author RelayCodeBase Team
 */

'use strict';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../services/apiClient.js';

/**
 * Modern VoteResultsDisplay component with performance optimizations.
 * 
 * Features:
 * - React.memo for performance optimization
 * - useCallback for stable event handlers
 * - useMemo for expensive calculations
 * - Enhanced accessibility with ARIA attributes
 * - PropTypes validation for development
 * - Comprehensive JSDoc documentation
 * - Strict mode compatibility
 * - Enhanced error handling and loading states
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.topic - The topic to fetch vote results for
 * @returns {React.ReactElement} Rendered vote results display component
 * 
 * @example
 * // Basic usage
 * <VoteResultsDisplay topic="Climate Change Policy" />
 * 
 * @example
 * // With URL-encoded topic
 * <VoteResultsDisplay topic="Budget 2025 - Healthcare" />
 */
const VoteResultsDisplay = memo(function VoteResultsDisplay({ topic }) {
  const [results, setResults] = useState(null);
  const [showForeignVotes, setShowForeignVotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Memoize stable toggle handler for performance
  const handleToggleForeignVotes = useCallback(() => {
    setShowForeignVotes(prev => !prev);
  }, []);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchResults = useCallback(async () => {
    if (!topic) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/api/vote/results?topic=${encodeURIComponent(topic)}`);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch vote results:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [topic]);
  
  // Effect to fetch results when topic changes
  useEffect(() => {
    fetchResults();
    // Set up polling or websocket subscription for live updates
  }, [fetchResults]);

  // Memoize toggle label text for performance
  const toggleLabelText = useMemo(() => {
    return showForeignVotes ? 'Showing All Votes' : 'Showing Local Votes Only';
  }, [showForeignVotes]);

  // Memoize processed choice data for performance
  const processedChoices = useMemo(() => {
    if (!results?.topChoices) return [];
    
    return results.topChoices.map(choice => ({
      ...choice,
      displayCount: showForeignVotes 
        ? choice.localCount + choice.foreignCount 
        : choice.localCount,
      displayText: showForeignVotes 
        ? `${choice.localCount + choice.foreignCount} votes`
        : `${choice.localCount} votes`
    }));
  }, [results?.topChoices, showForeignVotes]);
  
  // Loading state
  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        Loading vote results...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error" role="alert" aria-live="assertive">
        Error loading vote results: {error}
      </div>
    );
  }

  // No results state
  if (!results) {
    return (
      <div className="no-results" role="status" aria-live="polite">
        No vote results available for {topic}
      </div>
    );
  }
  
  return (
    <div className="vote-results" role="main" aria-labelledby="vote-results-title">
      <h2 id="vote-results-title">Vote Results for {topic}</h2>
      
      <div className="vote-stats" role="region" aria-label="Vote statistics">
        <div className="stat-box">
          <h3>Local Votes</h3>
          <p className="count" aria-label={`${results.totalLocalVotes} local votes`}>
            {results.totalLocalVotes}
          </p>
          <p className="description">Votes from users in this region</p>
        </div>
        
        <div className="stat-box">
          <h3>Foreign Votes</h3>
          <p className="count" aria-label={`${results.totalForeignVotes} foreign votes`}>
            {results.totalForeignVotes}
          </p>
          <p className="description">Votes from users outside this region</p>
        </div>
      </div>
      
      <div className="toggle-container" role="region" aria-label="Vote display options">
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={showForeignVotes} 
            onChange={handleToggleForeignVotes}
            aria-describedby="toggle-description"
          />
          <span className="slider round" aria-hidden="true"></span>
        </label>
        <span id="toggle-description" className="toggle-label">
          {toggleLabelText}
        </span>
      </div>
      
      <div className="results-table" role="region" aria-label="Vote results breakdown">
        <h3>Top Choices</h3>
        <ul className="choice-list" role="list">
          {processedChoices.map(choice => (
            <li key={choice.name} className="choice-item" role="listitem">
              <span className="choice-name">{choice.name}</span>
              <div className="vote-bar-container" aria-label={`${choice.name}: ${choice.displayText}`}>
                <div 
                  className="vote-bar local" 
                  style={{ width: `${choice.localPercentage}%` }}
                  aria-label={`Local votes: ${choice.localPercentage}%`}
                />
                {showForeignVotes && (
                  <div 
                    className="vote-bar foreign" 
                    style={{ width: `${choice.foreignPercentage}%` }}
                    aria-label={`Foreign votes: ${choice.foreignPercentage}%`}
                  />
                )}
              </div>
              <span className="vote-count" aria-live="polite">
                {choice.displayText}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="vote-legend" role="region" aria-label="Vote color legend">
        <div className="legend-item">
          <span className="color-box local" aria-hidden="true"></span>
          <span>Local Votes</span>
        </div>
        {showForeignVotes && (
          <div className="legend-item">
            <span className="color-box foreign" aria-hidden="true"></span>
            <span>Foreign Votes</span>
          </div>
        )}
      </div>
    </div>
  );
});

// PropTypes validation for development
VoteResultsDisplay.propTypes = {
  topic: PropTypes.string.isRequired
};

// Display name for debugging
VoteResultsDisplay.displayName = 'VoteResultsDisplay';

export default VoteResultsDisplay;
