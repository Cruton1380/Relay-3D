/**
 * @fileoverview Example Forum Discussion Component with PublicAreaFriendRequest Integration
 * Shows how to integrate friend request functionality into forum discussions
 */
import React, { useState } from 'react';
import PublicAreaFriendRequest from '../social/PublicAreaFriendRequest.jsx';
import ContentVoteButtons from '../channels/ContentVoteButtons.jsx';
import './ForumDiscussion.css';

const ForumDiscussion = ({ 
  discussion, 
  currentUser, 
  onReply, 
  onReact 
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      await onReply?.(discussion.id, replyContent);
      setReplyContent('');
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
  };

  return (
    <div className="forum-discussion">
      {/* Discussion Header */}
      <div className="discussion-header">
        <div className="discussion-meta">
          <h3 className="discussion-title">{discussion.title}</h3>
          <div className="discussion-info">
            <span className="discussion-category">{discussion.category}</span>
            <span className="discussion-timestamp">{formatTimestamp(discussion.createdAt)}</span>
            <span className="discussion-stats">
              {discussion.replyCount} replies • {discussion.viewCount} views
            </span>
          </div>
        </div>
        
        <div className="discussion-actions">
          <ContentVoteButtons
            contentId={discussion.id}
            contentInfo={{
              type: 'discussion',
              authorId: discussion.author.id,
              timestamp: discussion.createdAt,
              title: discussion.title,
              content: discussion.content,
              ...discussion
            }}
            channelId="forum"
            size="medium"
            variant="vertical"
          />
        </div>
      </div>

      {/* Original Post */}
      <div className="discussion-post">
        <div className="post-author-section">
          <div className="author-card">
            <div className="author-avatar">
              {discussion.author.avatar ? (
                <img src={discussion.author.avatar} alt={discussion.author.name} />
              ) : (
                <div className="avatar-placeholder">
                  {discussion.author.name[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="author-details">
              <h4 className="author-name">{discussion.author.name}</h4>
              <span className="author-role">{discussion.author.role || 'Member'}</span>
              <span className="author-joined">Joined {discussion.author.joinDate}</span>
            </div>
          </div>
          
          {/* Friend Request Integration */}
          <PublicAreaFriendRequest
            targetUser={discussion.author}
            context="forum"
            showInline={false}
          />
        </div>
        
        <div className="post-content">
          <div className="post-text" dangerouslySetInnerHTML={{ __html: discussion.content }} />
          
          {discussion.attachments && discussion.attachments.length > 0 && (
            <div className="post-attachments">
              {discussion.attachments.map((attachment, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{attachment.name}</span>
                  <a href={attachment.url} download className="attachment-download">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
          
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="post-tags">
              {discussion.tags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Replies Section */}
      <div className="discussion-replies">
        <div className="replies-header">
          <h4>Replies ({discussion.replyCount || 0})</h4>
          <button 
            className="toggle-replies-btn"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Hide' : 'Show'} Replies
          </button>
        </div>

        {showReplies && (
          <>
            {discussion.replies && discussion.replies.map((reply) => (
              <div key={reply.id} className="reply-item">
                <div className="reply-author-section">
                  <div className="reply-author">
                    <div className="reply-avatar">
                      {reply.author.avatar ? (
                        <img src={reply.author.avatar} alt={reply.author.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {reply.author.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="reply-author-info">
                      <span className="reply-author-name">{reply.author.name}</span>
                      <span className="reply-timestamp">{formatTimestamp(reply.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Friend Request for Reply Authors */}
                  <PublicAreaFriendRequest
                    targetUser={reply.author}
                    context="forum"
                    showInline={true}
                  />
                </div>
                
                <div className="reply-content">
                  <div className="reply-text" dangerouslySetInnerHTML={{ __html: reply.content }} />
                  
                  <div className="reply-actions">
                    <ContentVoteButtons
                      contentId={reply.id}
                      contentInfo={{
                        type: 'reply',
                        authorId: reply.author.id,
                        timestamp: reply.createdAt,
                        content: reply.content,
                        ...reply
                      }}
                      channelId="forum"
                      size="small"
                      variant="horizontal"
                    />
                    
                    <button 
                      className="reply-action-btn"
                      onClick={() => onReact?.(reply.id, 'like')}
                    >
                      👍 {reply.likes || 0}
                    </button>
                    
                    <button 
                      className="reply-action-btn"
                      onClick={() => onReply?.(reply.id)}
                    >
                      Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Reply Form */}
            <div className="reply-form">
              <h5>Add Reply</h5>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="reply-textarea"
                rows={4}
              />
              <div className="reply-form-actions">
                <button 
                  className="submit-reply-btn"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  Post Reply
                </button>
                <button 
                  className="cancel-reply-btn"
                  onClick={() => setReplyContent('')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForumDiscussion;
