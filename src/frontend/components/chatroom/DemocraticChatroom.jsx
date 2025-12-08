/**
 * Democratic Chatroom Component
 * Real-time chatroom with community-driven moderation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, ThumbsUp, ThumbsDown, Settings, Info } from 'lucide-react';
import websocketService from '../../services/websocketService';
import { useEnvironment } from '../../hooks/useEnvironment';
import './DemocraticChatroom.css';

const DemocraticChatroom = ({ channelId, channelData, userId = 'demo-user-1' }) => {
  const { isTestMode } = useEnvironment();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [moderationStatus, setModerationStatus] = useState(null);
  const [chatroomSettings, setChatroomSettings] = useState({
    moderationThreshold: 10,
    filterThreshold: -10,
    enableReactions: true,
    enableVoting: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Join chatroom on component mount
  useEffect(() => {
    if (channelId) {
      joinChatroom();
      setupWebSocketListeners();
    }

    return () => {
      leaveChatroom();
      cleanupWebSocketListeners();
    };
  }, [channelId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const joinChatroom = async () => {
    try {
      setLoading(true);
      console.log('Joining chatroom:', channelId);

      // Join chatroom via API
      const response = await fetch(`http://localhost:3002/api/channels/${channelId}/chatroom/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to join chatroom: ${response.status}`);
      }

      const result = await response.json();
      console.log('Chatroom join result:', result);

      if (result.success) {
        setModerationStatus(result.moderationStatus);
        setConnected(true);
        
        // Load initial messages
        await loadMessages();
        
        // Connect to WebSocket for real-time updates
        await connectWebSocket();
      }
    } catch (error) {
      console.error('Error joining chatroom:', error);
      setError(`Failed to join chatroom: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const leaveChatroom = async () => {
    try {
      if (!connected) return;

      await fetch(`http://localhost:3002/api/channels/${channelId}/chatroom/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      setConnected(false);
    } catch (error) {
      console.error('Error leaving chatroom:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/channels/${channelId}/chatroom/messages?limit=50`);
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(`Failed to load messages: ${error.message}`);
    }
  };

  const connectWebSocket = async () => {
    try {
      // Initialize WebSocket connection for real-time updates
      await websocketService.connect();
      
      // Subscribe to chatroom events
      websocketService.subscribe('chatroom', {
        'message-sent': handleNewMessage,
        'user-joined': handleUserJoined,
        'user-left': handleUserLeft,
        'vote-cast': handleVoteCast,
        'score-update': handleScoreUpdate
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      // Continue without real-time updates
    }
  };

  const setupWebSocketListeners = () => {
    // WebSocket event listeners for real-time updates
  };

  const cleanupWebSocketListeners = () => {
    // Clean up WebSocket listeners
    if (websocketService.isConnected()) {
      websocketService.unsubscribe('chatroom');
    }
  };

  const handleNewMessage = (data) => {
    console.log('New message received:', data);
    setMessages(prev => [...prev, data.message]);
  };

  const handleUserJoined = (data) => {
    console.log('User joined:', data);
    setActiveUsers(prev => [...prev.filter(u => u.id !== data.userId), {
      id: data.userId,
      joinedAt: Date.now()
    }]);
  };

  const handleUserLeft = (data) => {
    console.log('User left:', data);
    setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
  };

  const handleVoteCast = (data) => {
    console.log('Vote cast:', data);
    // Update message scores in real-time
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, voteScore: data.result.newScore }
        : msg
    ));
  };

  const handleScoreUpdate = (data) => {
    console.log('Score update:', data);
    // Update user moderation status if it affects current user
    if (data.targetUserId === userId) {
      setModerationStatus(prev => ({
        ...prev,
        userScore: data.newScore,
        percentile: data.newPercentile
      }));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!connected) {
      setError('Not connected to chatroom');
      return;
    }

    // Check if user is muted
    if (moderationStatus?.isMuted) {
      setError('You are muted in this channel due to low community standing');
      return;
    }

    try {
      const messageData = {
        channelId,
        userId,
        content: newMessage.trim(),
        messageType: 'text',
        timestamp: Date.now()
      };

      const response = await fetch(`http://localhost:3002/api/channels/${channelId}/chatroom/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setNewMessage('');
        setError(null);
        
        // Message will be added via WebSocket event
        // Or add optimistically if WebSocket not available
        if (!websocketService.isConnected()) {
          setMessages(prev => [...prev, result.message]);
        }
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
    }
  };

  const voteOnMessage = async (messageId, voteType) => {
    try {
      const response = await fetch(`http://localhost:3002/api/channels/${channelId}/chatroom/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterId: userId,
          targetUserId: messages.find(m => m.id === messageId)?.senderId,
          voteType,
          messageId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to cast vote: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update will come via WebSocket or update optimistically
        if (!websocketService.isConnected()) {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, voteScore: result.newScore }
              : msg
          ));
        }
      }

    } catch (error) {
      console.error('Error casting vote:', error);
      setError(`Failed to cast vote: ${error.message}`);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getModerationStatusColor = (status) => {
    if (!status) return 'var(--text-muted)';
    
    if (status.isMuted) return 'var(--error-color)';
    if (status.percentile >= 80) return 'var(--success-color)';
    if (status.percentile >= 50) return 'var(--warning-color)';
    return 'var(--text-muted)';
  };

  const getModerationStatusText = (status) => {
    if (!status) return 'Unknown';
    
    if (status.isMuted) return 'Muted';
    if (status.percentile >= 80) return 'Trusted';
    if (status.percentile >= 50) return 'Active';
    return 'New';
  };

  if (loading) {
    return (
      <div className="chatroom-container loading">
        <div className="loading-spinner">Loading chatroom...</div>
      </div>
    );
  }

  return (
    <div className="chatroom-container">
      {/* Chatroom Header */}
      <div className="chatroom-header">
        <div className="header-info">
          <h3 className="chatroom-title">
            💬 {channelData?.name || 'Democratic Chatroom'}
          </h3>
          <div className="connection-status">
            <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="header-stats">
          <div className="active-users">
            <Users size={16} />
            <span>{activeUsers.length} active</span>
          </div>
          {moderationStatus && (
            <div 
              className="moderation-status"
              style={{ color: getModerationStatusColor(moderationStatus) }}
            >
              <span>{getModerationStatusText(moderationStatus)}</span>
              {moderationStatus.percentile !== undefined && (
                <span className="percentile">({moderationStatus.percentile}%)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Messages List */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.senderId === userId ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {message.senderName || message.senderId.substring(0, 8)}
                </span>
                <span className="message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.voteScore !== undefined && (
                  <span className={`vote-score ${message.voteScore < 0 ? 'negative' : 'positive'}`}>
                    {message.voteScore > 0 ? '+' : ''}{message.voteScore}
                  </span>
                )}
              </div>
              <div className="message-content">
                {message.content}
              </div>
              {chatroomSettings.enableVoting && message.senderId !== userId && (
                <div className="message-actions">
                  <button 
                    className="vote-button upvote"
                    onClick={() => voteOnMessage(message.id, 'upvote')}
                    title="Upvote this message"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button 
                    className="vote-button downvote"
                    onClick={() => voteOnMessage(message.id, 'downvote')}
                    title="Downvote this message"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        {moderationStatus?.isMuted ? (
          <div className="muted-notice">
            You are muted in this channel. Improve your community standing to participate.
          </div>
        ) : (
          <div className="message-input-wrapper">
            <input
              type="text"
              className="message-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              maxLength={2000}
              disabled={!connected}
            />
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={!newMessage.trim() || !connected}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Chatroom Info */}
      {isTestMode && (
        <div className="chatroom-debug">
          <h4>🧪 Debug Info</h4>
          <div className="debug-grid">
            <div>Channel: {channelId}</div>
            <div>Messages: {messages.length}</div>
            <div>Connected: {connected ? 'Yes' : 'No'}</div>
            <div>WebSocket: {websocketService.isConnected() ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemocraticChatroom;
