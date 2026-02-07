/**
 * @fileoverview Reply Indicator Component
 * Shows which message is being replied to with option to cancel
 */
import React from 'react';
import './ReplyIndicator.css';

const ReplyIndicator = ({ message, onCancel }) => {
  if (!message) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="reply-indicator">
      <div className="reply-indicator-content">
        <div className="reply-indicator-icon">
          <svg viewBox="0 0 24 24" className="reply-icon">
            <path d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z"/>
          </svg>
        </div>
        
        <div className="reply-indicator-info">
          <div className="reply-indicator-header">
            <span className="reply-indicator-label">Replying to</span>
            <span className="reply-indicator-sender">{message.senderName || 'Unknown User'}</span>
            <span className="reply-indicator-time">{formatTime(message.timestamp)}</span>
          </div>
          
          <div className="reply-indicator-message">
            {message.messageType === 'image' && (
              <div className="reply-message-type">
                <svg viewBox="0 0 24 24" className="message-type-icon">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>Image</span>
              </div>
            )}
            {message.messageType === 'file' && (
              <div className="reply-message-type">
                <svg viewBox="0 0 24 24" className="message-type-icon">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span>File</span>
              </div>
            )}
            {message.messageType === 'text' && (
              <span className="reply-message-text">
                {truncateContent(message.content)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <button 
        className="reply-indicator-cancel"
        onClick={onCancel}
        title="Cancel reply"
        aria-label="Cancel reply"
      >
        <svg viewBox="0 0 24 24" className="cancel-icon">
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>
      </button>
    </div>
  );
};

export default ReplyIndicator;
