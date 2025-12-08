/**
 * @fileoverview Message Composer Component
 * Input interface for sending messages with file attachments
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../shared/index.js';
import './MessageComposer.css';

const MessageComposer = ({ 
  onSendMessage, 
  onTyping, 
  disabled = false, 
  placeholder = "Type a message...",
  maxLength = 2000,
  replyingTo = null,
  onReply = null
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && onTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 3000);
  }, [isTyping, onTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping && onTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  }, [isTyping, onTyping]);

  // Handle message input changes
  const handleMessageChange = (e) => {
    const value = e.target.value;
    
    if (value.length <= maxLength) {
      setMessage(value);
      
      if (value.trim()) {
        handleTypingStart();
      } else {
        handleTypingStop();
      }
    }
  };

  // Handle key presses
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file attachment
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // Send message
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && !attachedFile) return;
    if (disabled || isUploading) return;

    handleTypingStop();

    try {
      if (attachedFile) {
        setIsUploading(true);
        
        // Handle file upload
        const formData = new FormData();
        formData.append('file', attachedFile);
        
        // For now, we'll simulate file upload
        // In a real implementation, you would upload to your file service
        const fileUrl = URL.createObjectURL(attachedFile);
        const messageType = attachedFile.type.startsWith('image/') ? 'image' : 'file';
        
        if (replyingTo && onReply) {
          await onReply(replyingTo.id, fileUrl, messageType);
        } else {
          await onSendMessage(fileUrl, messageType);
        }
        removeAttachment();
      }
      
      if (trimmedMessage) {
        if (replyingTo && onReply) {
          await onReply(replyingTo.id, trimmedMessage, 'text');
        } else {
          await onSendMessage(trimmedMessage, 'text');
        }
      }
      
      setMessage('');
      
      // Reset textarea height
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 0);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [message, attachedFile, disabled, isUploading, onSendMessage, onReply, replyingTo, handleTypingStop]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="message-composer">
      {/* File attachment preview */}
      {attachedFile && (
        <div className="attachment-preview">
          <div className="attachment-info">
            <div className="attachment-icon">
              {attachedFile.type.startsWith('image/') ? (
                <svg viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              )}
            </div>
            <div className="attachment-details">
              <span className="attachment-name">{attachedFile.name}</span>
              <span className="attachment-size">
                {(attachedFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          </div>
          <button 
            className="remove-attachment"
            onClick={removeAttachment}
            aria-label="Remove attachment"
          >
            <svg viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Message input container */}
      <div className="message-input-container">
        {/* File attachment button */}
        <button
          className="attachment-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          title="Attach file"
        >
          <svg viewBox="0 0 24 24">
            <path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z"/>
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />

        {/* Message textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? 'Cannot send messages' : (replyingTo ? `Reply to ${replyingTo.senderName || 'message'}...` : placeholder)}
          disabled={disabled}
          className="message-textarea"
          rows={1}
          maxLength={maxLength}
        />

        {/* Character counter */}
        {message.length > maxLength * 0.8 && (
          <div className="character-counter">
            {message.length}/{maxLength}
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={handleSendMessage}
          disabled={disabled || isUploading || (!message.trim() && !attachedFile)}
          className="send-button"
          variant="primary"
          size="small"
        >
          {isUploading ? (
            <div className="spinner small" />
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;
