/**
 * @fileoverview Message Search Component
 * Search interface for finding messages in channels
 */
import React, { useState, useEffect } from 'react';
import './MessageSearch.css';

const MessageSearch = ({ query, results, onSearch, onSelectMessage }) => {
  const [searchInput, setSearchInput] = useState(query || '');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchInput !== query) {
        setIsSearching(true);
        onSearch(searchInput);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchInput, query, onSearch]);

  useEffect(() => {
    setIsSearching(false);
  }, [results]);

  const formatSearchResult = (message) => {
    const maxLength = 100;
    let content = message.content;
    
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    // Highlight search terms
    if (query && query.trim()) {
      const regex = new RegExp(`(${query.trim()})`, 'gi');
      content = content.replace(regex, '<mark>$1</mark>');
    }

    return content;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="message-search">
      <div className="search-input-container">
        <svg viewBox="0 0 24 24" className="search-input-icon">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
        </svg>
        <input
          type="text"
          placeholder="Search messages..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
          autoFocus
        />
        {isSearching && (
          <div className="search-spinner">
            <div className="spinner small" />
          </div>
        )}
        {searchInput && (
          <button
            className="clear-search"
            onClick={() => setSearchInput('')}
            title="Clear search"
          >
            <svg viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        )}
      </div>

      {searchInput && (
        <div className="search-results">
          {isSearching ? (
            <div className="search-loading">
              <div className="spinner small" />
              <span>Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <p>No messages found for "{searchInput}"</p>
            </div>
          ) : (
            <>
              <div className="search-results-header">
                <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="search-results-list">
                {results.map(message => (
                  <div
                    key={message.id}
                    className="search-result-item"
                    onClick={() => onSelectMessage(message)}
                  >
                    <div className="search-result-header">
                      <span className="search-result-sender">
                        {message.senderName || 'Unknown User'}
                      </span>
                      <span className="search-result-time">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div 
                      className="search-result-content"
                      dangerouslySetInnerHTML={{ __html: formatSearchResult(message) }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
