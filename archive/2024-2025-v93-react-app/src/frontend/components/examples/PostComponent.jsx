/**
 * @fileoverview Example Post Component with PublicAreaFriendRequest Integration
 * Shows how to integrate friend request functionality into public posts
 */
import React, { useState } from 'react';
import PublicAreaFriendRequest from '../social/PublicAreaFriendRequest.jsx';
import ContentVoteButtons from '../channels/ContentVoteButtons.jsx';
import './PostComponent.css';

const PostComponent = ({ 
  post, 
  currentUser, 
  onReact, 
  onComment, 
  onShare 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="post-component">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} />
            ) : (
              <div className="avatar-placeholder">
                {post.author.name[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="author-info">
            <h4 className="author-name">{post.author.name}</h4>
            <span className="post-timestamp">{formatTimestamp(post.timestamp)}</span>
          </div>
        </div>
        
        {/* Friend Request Integration */}
        <div className="post-actions">
          <PublicAreaFriendRequest
            targetUser={post.author}
            context="post"
            showInline={true}
          />
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {post.image && (
          <div className="post-image">
            <img src={post.image} alt="Post content" />
          </div>
        )}
        
        <div className="post-text">
          {showFullPost ? post.content : truncateContent(post.content)}
          {post.content.length > 200 && (
            <button 
              className="read-more-btn"
              onClick={() => setShowFullPost(!showFullPost)}
            >
              {showFullPost ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="post-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Post Interactions */}
      <div className="post-interactions">
        {/* Voting */}
        <ContentVoteButtons
          contentId={post.id}
          contentInfo={{
            type: 'post',
            authorId: post.author.id,
            timestamp: post.timestamp,
            content: post.content,
            ...post
          }}
          channelId={post.channelId || 'public'}
          size="medium"
          variant="horizontal"
        />

        {/* Reaction Buttons */}
        <div className="interaction-buttons">
          <button className="interaction-btn" onClick={() => onReact?.(post.id, 'like')}>
            👍 {post.likes || 0}
          </button>
          <button 
            className="interaction-btn" 
            onClick={() => setShowComments(!showComments)}
          >
            💬 {post.commentCount || 0}
          </button>
          <button className="interaction-btn" onClick={() => onShare?.(post.id)}>
            🔗 Share
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
          <div className="comments-header">
            <h5>Comments ({post.commentCount || 0})</h5>
          </div>
          
          {post.comments && post.comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <div className="comment-avatar">
                    {comment.author.avatar ? (
                      <img src={comment.author.avatar} alt={comment.author.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {comment.author.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comment-info">
                    <span className="comment-author-name">{comment.author.name}</span>
                    <span className="comment-timestamp">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                </div>
                
                {/* Friend Request for Comment Authors */}
                <PublicAreaFriendRequest
                  targetUser={comment.author}
                  context="comment"
                  showInline={true}
                />
              </div>
              
              <div className="comment-content">
                {comment.content}
              </div>
              
              <div className="comment-actions">
                <button className="comment-action" onClick={() => onReact?.(comment.id, 'like')}>
                  👍 {comment.likes || 0}
                </button>
                <button className="comment-action" onClick={() => onComment?.(comment.id)}>
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostComponent;
