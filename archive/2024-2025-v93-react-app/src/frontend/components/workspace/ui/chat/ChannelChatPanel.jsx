/**
 * BASE MODEL 1 - Channel Chat Panel
 * Integrated real-time messaging interface
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChannelChatPanel.css';

const ChannelChatPanel = ({ panel, globeState, setGlobeState }) => {
  const channelId = globeState?.selectedChannel?.id;
  const channelName = globeState?.selectedChannel?.name || 'Unknown Channel';
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debug log to confirm component is loaded
  useEffect(() => {
    console.log('✅ ChannelChatPanel loaded and integrated!');
  }, []);

  // Mock data for now - can be replaced with real API calls
  useEffect(() => {
    if (channelId) {
      setLoading(true);
      // Simulate loading messages
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            content: `Welcome to ${channelName} discussion!`,
            sender: { name: 'System', id: 'system' },
            timestamp: new Date(Date.now() - 60000).toISOString(),
            type: 'system'
          },
          {
            id: 2,
            content: `This channel has great activity! Anyone interested in collaborating?`,
            sender: { name: 'Alice', id: 'user1' },
            timestamp: new Date(Date.now() - 30000).toISOString(),
            type: 'text'
          },
          {
            id: 3,
            content: `The discussions here are really insightful. Looking forward to more engagement.`,
            sender: { name: 'Bob', id: 'user2' },
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        ]);
        setLoading(false);
      }, 500);
    }
  }, [channelId]);

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

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      content: newMessage,
      sender: { name: 'You', id: 'current-user' },
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate API call
    try {
      // TODO: Replace with actual API call to backend
      console.log('Sending message:', message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [newMessage]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (!channelId) {
    return (
      <div className="channel-chat-panel">
        <div className="no-channel">
          <h4>✅ Channel Chat Panel Integrated!</h4>
          <p>Select a channel from the globe to start chatting</p>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
            Click on a tower/channel on the 3D globe to activate this chat panel
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="channel-info">
          <h3>Channel Chat</h3>
          <span className="channel-id">#{channelName}</span>
        </div>
        <div className="header-actions">
          <button 
            className={`search-toggle ${showSearch ? 'active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            title="Search messages"
          >
            🔍
          </button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div 
        className="messages-container" 
        ref={chatContainerRef}
      >
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.type} ${message.sender.id === 'current-user' ? 'own' : ''}`}
              >
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender">{message.sender.name}</span>
                    <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button 
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      {/* Message input */}
      <form className="message-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="message-field"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="send-btn"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChannelChatPanel;
