/**
 * @fileoverview Channel Chat Component
 * Real-time messaging interface with reactions, threading, and search
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChannelMessages } from '../../hooks/useChannels.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Button } from '../shared/index.js';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import MessageComposer from './MessageComposer.jsx';
import MessageSearch from './MessageSearch.jsx';
import ReplyIndicator from './ReplyIndicator.jsx';
import './ChannelChat.css';

const ChannelChat = ({ channelId, onClose }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const {
    messages,
    loading,
    error,
    typingUsers,
    replyingTo,
    searchQuery,
    searchResults,
    showThreads,
    sendMessage,
    addReaction,
    replyToMessage,
    cancelReply,
    toggleThread,
    searchMessages,
    sendTypingIndicator,
    loadMoreMessages
  } = useChannelMessages(channelId, user?.id, user?.token);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop <= clientHeight + 100;
    
    setIsAtBottom(atBottom);
    setShowScrollToBottom(!atBottom && messages.length > 0);
  }, [messages.length]);

  // Load more messages when scrolling to top
  const handleScrollToTop = useCallback(async () => {
    const container = chatContainerRef.current;
    if (!container || loading) return;

    if (container.scrollTop < 100 && messages.length > 0) {
      const oldHeight = container.scrollHeight;
      const loadedCount = await loadMoreMessages(messages[0]?.timestamp);
      
      if (loadedCount > 0) {
        // Maintain scroll position after loading older messages
        setTimeout(() => {
          const newHeight = container.scrollHeight;
          container.scrollTop = newHeight - oldHeight;
        }, 100);
      }
    }
  }, [loading, messages, loadMoreMessages]);

  // Combined scroll handler
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const scrollHandler = () => {
      handleScroll();
      handleScrollToTop();
    };

    container.addEventListener('scroll', scrollHandler);
    return () => container.removeEventListener('scroll', scrollHandler);
  }, [handleScroll, handleScrollToTop]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async (content, messageType = 'text') => {
    try {
      await sendMessage(content, messageType);
      // Auto-scroll to bottom when user sends a message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage]);

  const handleTyping = useCallback((isTyping) => {
    sendTypingIndicator(isTyping);
  }, [sendTypingIndicator]);

  const handleReaction = useCallback(async (messageId, emoji) => {
    await addReaction(messageId, emoji);
  }, [addReaction]);

  const handleReply = useCallback((message) => {
    replyToMessage(message);
  }, [replyToMessage]);

  const handleToggleThread = useCallback((messageId) => {
    toggleThread(messageId);
  }, [toggleThread]);

  const handleSearch = useCallback((query) => {
    searchMessages(query);
  }, [searchMessages]);

  if (loading && messages.length === 0) {
    return (
      <div className="channel-chat">
        <div className="channel-chat-header">
          <h3>Channel Chat</h3>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="channel-chat-loading">
          <div className="spinner" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-chat">
        <div className="channel-chat-header">
          <h3>Channel Chat</h3>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="channel-chat-error">
          <p>Error loading messages: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-chat">
      {/* Header */}
      <div className="channel-chat-header">
        <h3>Channel Chat</h3>
        <div className="channel-chat-actions">
          <button
            className={`search-toggle ${showSearch ? 'active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            title="Search messages"
          >
            <svg viewBox="0 0 24 24" className="search-icon">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
            </svg>
          </button>
          <span className="online-count">
            {messages.length} messages
          </span>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <MessageSearch
          query={searchQuery}
          results={searchResults}
          onSearch={handleSearch}
          onSelectMessage={(message) => {
            // Scroll to message in chat
            const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              messageElement.classList.add('highlighted');
              setTimeout(() => messageElement.classList.remove('highlighted'), 2000);
            }
          }}
        />
      )}

      {/* Reply Indicator */}
      {replyingTo && (
        <ReplyIndicator
          message={replyingTo}
          onCancel={cancelReply}
        />
      )}

      {/* Messages Container */}
      <div 
        className="channel-chat-messages"
        ref={chatContainerRef}
      >
        {messages.length === 0 ? (
          <div className="channel-chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Load more indicator */}
            {loading && messages.length > 0 && (
              <div className="load-more-indicator">
                <div className="spinner small" />
                <span>Loading older messages...</span>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || 
                               prevMessage.senderId !== message.senderId ||
                               (message.timestamp - prevMessage.timestamp) > 300000; // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                  showAvatar={showAvatar}
                  showTimestamp={showAvatar}
                  onReact={handleReaction}
                  onReply={handleReply}
                  onToggleThread={handleToggleThread}
                  channelService={null} // Will be passed from parent
                  channelId={channelId}
                  data-message-id={message.id}
                />
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers} />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button 
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5 5 5-5H7z"/>
          </svg>
        </button>
      )}      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!channelId}
        placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type a message..."}
        replyingTo={replyingTo}
        onReply={replyToMessage}
      />
    </div>
  );
};

export default ChannelChat;
