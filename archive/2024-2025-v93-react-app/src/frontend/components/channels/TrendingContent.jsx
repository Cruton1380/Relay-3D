/**
 * @fileoverview Trending Content Component
 * Displays trending messages and posts based on vote scores and engagement
 */
import React, { useState, useEffect } from 'react';
import ContentVoteButtons from './ContentVoteButtons.jsx';
import './TrendingContent.css';

const TrendingContent = ({ 
  channelId, 
  channelService, 
  limit = 10, 
  timeWindow = 24,
  onContentClick 
}) => {
  const [trendingContent, setTrendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadTrendingContent();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadTrendingContent();
    }, 5 * 60 * 1000);
    
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [channelId, limit, timeWindow]);

  const loadTrendingContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const trending = await channelService.getTrendingContent(channelId, limit, timeWindow);
      setTrendingContent(trending);
    } catch (err) {
      console.error('Failed to load trending content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteUpdate = (contentId, voteData) => {
    setTrendingContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, ...voteData }
          : item
      )
    );
  };

  const formatTrendingScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
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

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="trending-content">
        <div className="trending-header">
          <h3>🔥 Trending</h3>
          <div className="trending-timeframe">
            Last {timeWindow}h
          </div>
        </div>
        <div className="trending-loading">
          <div className="loading-spinner"></div>
          <span>Loading trending content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-content">
        <div className="trending-header">
          <h3>🔥 Trending</h3>
          <button onClick={loadTrendingContent} className="refresh-button">
            <svg viewBox="0 0 24 24">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
          </button>
        </div>
        <div className="trending-error">
          <span>Failed to load trending content</span>
          <button onClick={loadTrendingContent}>Try Again</button>
        </div>
      </div>
    );
  }

  if (trendingContent.length === 0) {
    return (
      <div className="trending-content">
        <div className="trending-header">
          <h3>🔥 Trending</h3>
          <div className="trending-timeframe">
            Last {timeWindow}h
          </div>
        </div>
        <div className="trending-empty">
          <span>No trending content yet</span>
          <p>Be the first to post something amazing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-content">
      <div className="trending-header">
        <h3>🔥 Trending</h3>
        <div className="trending-timeframe">
          Last {timeWindow}h
        </div>
        <button onClick={loadTrendingContent} className="refresh-button">
          <svg viewBox="0 0 24 24">
            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
          </svg>
        </button>
      </div>

      <div className="trending-list">
        {trendingContent.map((item, index) => (
          <div 
            key={item.id} 
            className="trending-item"
            onClick={() => onContentClick && onContentClick(item)}
          >
            <div className="trending-rank">
              #{index + 1}
            </div>
            
            <div className="trending-content-info">
              <div className="trending-author">
                <div className="author-avatar">
                  {item.senderAvatar ? (
                    <img src={item.senderAvatar} alt={item.senderName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(item.senderName || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="author-name">{item.senderName || 'Unknown'}</span>
                <span className="trending-time">{formatTimeAgo(item.timestamp)}</span>
              </div>
              
              <div className="trending-content-preview">
                {truncateContent(item.content)}
              </div>
              
              <div className="trending-stats">
                <div className="trending-score">
                  <span className="score-value">
                    {formatTrendingScore(item.trendingScore || item.voteScore || 0)}
                  </span>
                  <span className="score-label">trending</span>
                </div>
                
                <div className="trending-engagement">
                  <span className="engagement-stat">
                    {item.upvotes || 0} 👍
                  </span>
                  <span className="engagement-stat">
                    {item.replyCount || 0} 💬
                  </span>
                  <span className="engagement-stat">
                    {item.reactions?.size || 0} 😊
                  </span>
                </div>
              </div>
            </div>

            <div className="trending-vote-section">
              <ContentVoteButtons
                contentId={item.id}
                contentInfo={{
                  voteScore: item.voteScore || 0,
                  upvotes: item.upvotes || 0,
                  downvotes: item.downvotes || 0,
                  userVote: item.userVote || null,
                  wilsonScore: item.wilsonScore || 0
                }}
                channelId={channelId}
                size="small"
                variant="vertical"
                onVoteUpdate={(voteData) => handleVoteUpdate(item.id, voteData)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingContent;
