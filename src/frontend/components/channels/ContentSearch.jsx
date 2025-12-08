/**
 * @fileoverview Content Search Component
 * Advanced search interface with vote score filters and sorting options
 */
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import ContentVoteButtons from './ContentVoteButtons.jsx';
import './ContentSearch.css';

const ContentSearch = ({ 
  channelId, 
  channelService, 
  onResultClick,
  placeholder = "Search messages and content..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter states
  const [minScore, setMinScore] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [searchLimit, setSearchLimit] = useState(20);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery, filters) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await channelService.searchContent({
          query: searchQuery,
          channelId,
          minScore: filters.minScore || null,
          sortBy: filters.sortBy,
          limit: filters.limit
        });

        setResults(searchResults);
        setHasSearched(true);
      } catch (err) {
        console.error('Search failed:', err);
        setError(err.message);
        setResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300),
    [channelService, channelId]
  );

  // Effect to trigger search when query or filters change
  useEffect(() => {
    const filters = {
      minScore: minScore ? parseInt(minScore) : null,
      sortBy,
      limit: searchLimit
    };

    debouncedSearch(query, filters);

    return () => {
      debouncedSearch.cancel();
    };
  }, [query, minScore, sortBy, searchLimit, debouncedSearch]);

  const handleVoteUpdate = (contentId, voteData) => {
    setResults(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, ...voteData }
          : item
      )
    );
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  const resetFilters = () => {
    setMinScore('');
    setSortBy('relevance');
    setSearchLimit(20);
  };

  const formatScore = (score) => {
    if (!score) return '0';
    return score >= 1000 ? `${(score / 1000).toFixed(1)}k` : score.toString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const highlightSearchTerms = (text, searchQuery) => {
    if (!searchQuery.trim()) return text;
    
    const terms = searchQuery.split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="content-search">
      {/* Search Header */}
      <div className="search-header">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="search-input"
            />
            {query && (
              <button onClick={clearSearch} className="clear-search-button">
                <svg viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24">
              <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/>
            </svg>
            Filters
          </button>
        </div>

        {/* Search Filters */}
        {showFilters && (
          <div className="search-filters">
            <div className="filter-group">
              <label>Min Score:</label>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Sort By:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="score">Vote Score</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Limit:</label>
              <select value={searchLimit} onChange={(e) => setSearchLimit(parseInt(e.target.value))}>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
                <option value={100}>100 results</option>
              </select>
            </div>
            
            <button onClick={resetFilters} className="reset-filters">
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="search-results">
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <span>Searching...</span>
          </div>
        )}

        {error && (
          <div className="search-error">
            <span>Search failed: {error}</span>
            <button onClick={() => debouncedSearch(query, { minScore, sortBy, limit: searchLimit })}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="search-empty">
            <svg viewBox="0 0 24 24" className="empty-icon">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span>No results found</span>
            <p>Try adjusting your search terms or filters</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <div className="search-results-header">
              <span className="results-count">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            <div className="search-results-list">
              {results.map((result) => (
                <div 
                  key={result.id} 
                  className="search-result-item"
                  onClick={() => onResultClick && onResultClick(result)}
                >
                  <div className="result-content">
                    <div className="result-author">
                      <div className="author-avatar">
                        {result.senderAvatar ? (
                          <img src={result.senderAvatar} alt={result.senderName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {(result.senderName || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="author-name">{result.senderName || 'Unknown'}</span>
                      <span className="result-time">{formatTimeAgo(result.timestamp)}</span>
                    </div>
                    
                    <div className="result-text">
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerms(truncateContent(result.content), query)
                        }}
                      />
                    </div>
                    
                    <div className="result-meta">
                      <span className="result-score">
                        Score: {formatScore(result.voteScore || 0)}
                      </span>
                      <span className="result-type">
                        {result.messageType || 'text'}
                      </span>
                      {result.replyCount > 0 && (
                        <span className="result-replies">
                          {result.replyCount} replies
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="result-actions">
                    <ContentVoteButtons
                      contentId={result.id}
                      contentInfo={{
                        voteScore: result.voteScore || 0,
                        upvotes: result.upvotes || 0,
                        downvotes: result.downvotes || 0,
                        userVote: result.userVote || null,
                        wilsonScore: result.wilsonScore || 0
                      }}
                      channelId={channelId}
                      size="small"
                      variant="vertical"
                      onVoteUpdate={(voteData) => handleVoteUpdate(result.id, voteData)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContentSearch;
