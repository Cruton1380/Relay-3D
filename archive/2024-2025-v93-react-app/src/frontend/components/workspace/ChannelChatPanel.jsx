/**
 * ChannelChatPanel - Simplified channel chat component
 * Base Model 1 workspace integration
 */
import React, { useState, useEffect, useRef } from 'react';

const ChannelChatPanel = ({ panelId, title, type }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef(null);

  // Simulated chat messages
  const mockMessages = [
    { id: 1, user: 'Alice', message: 'Welcome to the Climate Action channel!', timestamp: Date.now() - 300000 },
    { id: 2, user: 'Bob', message: 'Great to see everyone here. What are your thoughts on renewable energy?', timestamp: Date.now() - 240000 },
    { id: 3, user: 'Carol', message: 'I think solar power is the way forward. The technology has improved so much.', timestamp: Date.now() - 180000 },
    { id: 4, user: 'David', message: 'Agreed! But we also need better energy storage solutions.', timestamp: Date.now() - 120000 },
    { id: 5, user: 'Eve', message: 'What about wind energy? It\'s been very successful in some regions.', timestamp: Date.now() - 60000 }
  ];

  useEffect(() => {
    // Initialize with mock messages
    setMessages(mockMessages);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      user: 'You',
      message: newMessage.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    console.log('💬 Message sent:', message.message);
    
    // Simulate response after 1-3 seconds
    setTimeout(() => {
      const responses = [
        'Interesting point!',
        'I agree with that.',
        'That\'s a good question.',
        'Let\'s discuss this further.',
        'Thanks for sharing!'
      ];
      
      const response = {
        id: Date.now() + 1,
        user: 'System',
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#ffffff' }}>
          {title || 'Channel Chat'}
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Real-time messaging and channel exploration
        </p>
      </div>

      {/* Connection Status */}
      <div style={{ 
        padding: '8px 12px', 
        backgroundColor: 'rgba(45, 45, 45, 0.5)',
        borderRadius: '6px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            marginRight: '8px'
          }} />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          {messages.length} messages
        </span>
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'rgba(20, 20, 20, 0.5)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '12px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '8px',
              padding: '8px 12px',
              backgroundColor: msg.user === 'You' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 30, 30, 0.5)',
              borderRadius: '6px',
              borderLeft: `3px solid ${msg.user === 'You' ? '#3b82f6' : '#6b7280'}`
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '500',
                color: msg.user === 'You' ? '#3b82f6' : '#ffffff'
              }}>
                {msg.user}
              </span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.4' }}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '12px'
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: newMessage.trim() ? '#3b82f6' : '#4b5563',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChannelChatPanel; 