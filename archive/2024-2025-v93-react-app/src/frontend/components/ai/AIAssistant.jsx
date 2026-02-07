/**
 * @fileoverview AI Assistant Interface
 * Dual-agent chat interface for Navigator and Architect agents
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAIAgentUpdates, useWebSocket } from '../../hooks/useWebSocket.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import './AIAssistant.css';

const AIAssistant = () => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const agentUpdates = useAIAgentUpdates();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeAgent, setActiveAgent] = useState('navigator');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState({
    navigator: 'online',
    architect: 'online'
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle real-time agent updates
  useEffect(() => {
    if (agentUpdates) {
      if (agentUpdates.type === 'ai_response') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'agent',
          agent: agentUpdates.agent,
          content: agentUpdates.content,
          timestamp: new Date(),
          metadata: agentUpdates.metadata
        }]);
        setIsLoading(false);
      } else if (agentUpdates.type === 'agent_status') {
        setAgentStatus(prev => ({
          ...prev,
          [agentUpdates.agent]: agentUpdates.status
        }));
      }
    }
  }, [agentUpdates]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'agent',
      agent: 'navigator',
      content: `Hello! I'm your Relay Navigator, here to help you navigate the democratic features of Relay. I can assist with:

• 🗳️ Understanding voting and topic row competitions
• 🏘️ Finding and joining channels in your area  
• 🔐 Setting up biometric authentication and security
• 📋 Creating proposals and participating in governance
• 🤝 Building trust networks and community connections

My colleague, the Architect, specializes in technical development and can help with code, APIs, and system integration.

What would you like to explore today?`,
      timestamp: new Date(),
      metadata: { isWelcome: true }
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputText.trim(),
          agent: activeAgent,
          context: {
            conversationHistory: messages.slice(-10), // Last 10 messages for context
            userId: user?.id
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message to AI agent');
      }

      // Response will come through WebSocket
      setInputText('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchAgent = (agent) => {
    setActiveAgent(agent);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: `Switched to ${agent === 'navigator' ? 'Navigator' : 'Architect'} agent`,
      timestamp: new Date()
    }]);
  };

  const clearConversation = () => {
    setMessages([]);
    setInputText('');
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="agent-selector">
          <button
            className={`agent-button ${activeAgent === 'navigator' ? 'active' : ''}`}
            onClick={() => switchAgent('navigator')}
          >
            <div className="agent-info">
              <span className="agent-icon">🧭</span>
              <div className="agent-details">
                <span className="agent-name">Navigator</span>
                <span className="agent-role">User Guidance</span>
              </div>
              <div className={`status-indicator ${agentStatus.navigator}`}></div>
            </div>
          </button>
          
          <button
            className={`agent-button ${activeAgent === 'architect' ? 'active' : ''}`}
            onClick={() => switchAgent('architect')}
          >
            <div className="agent-info">
              <span className="agent-icon">🏗️</span>
              <div className="agent-details">
                <span className="agent-name">Architect</span>
                <span className="agent-role">Technical Development</span>
              </div>
              <div className={`status-indicator ${agentStatus.architect}`}></div>
            </div>
          </button>
        </div>

        <div className="header-actions">
          <button onClick={clearConversation} className="clear-button">
            Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="message agent-message loading">
              <div className="message-avatar">
                <span className="agent-icon">
                  {activeAgent === 'navigator' ? '🧭' : '🏗️'}
                </span>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask the ${activeAgent === 'navigator' ? 'Navigator' : 'Architect'} anything...`}
              className="message-input"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="send-button"
            >
              <span className="send-icon">📤</span>
            </button>
          </div>
          
          <div className="input-hints">
            {activeAgent === 'navigator' ? (
              <div className="hint-chips">
                <span className="hint-chip" onClick={() => setInputText("How do I vote in topic row competitions?")}>
                  How to vote
                </span>
                <span className="hint-chip" onClick={() => setInputText("Find channels near me")}>
                  Find channels
                </span>
                <span className="hint-chip" onClick={() => setInputText("Set up biometric authentication")}>
                  Setup security
                </span>
              </div>
            ) : (
              <div className="hint-chips">
                <span className="hint-chip" onClick={() => setInputText("Show me the voting API endpoints")}>
                  Voting APIs
                </span>
                <span className="hint-chip" onClick={() => setInputText("How to integrate with WebSocket service?")}>
                  WebSocket integration
                </span>
                <span className="hint-chip" onClick={() => setInputText("Create a new channel component")}>
                  Build components
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Message = ({ message }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = (content) => {
    // Simple markdown-like formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');

    return { __html: formatted };
  };

  if (message.type === 'system') {
    return (
      <div className="message system-message">
        <div className="system-content">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="message error-message">
        <div className="error-content">
          ⚠️ {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${message.type}-message`}>
      <div className="message-avatar">
        {message.type === 'user' ? (
          <span className="user-avatar">👤</span>
        ) : (
          <span className="agent-icon">
            {message.agent === 'navigator' ? '🧭' : '🏗️'}
          </span>
        )}
      </div>
      
      <div className="message-bubble">
        <div className="message-header">
          {message.type === 'agent' && (
            <span className="agent-name">
              {message.agent === 'navigator' ? 'Navigator' : 'Architect'}
            </span>
          )}
          <span className="message-time">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        <div 
          className="message-content"
          dangerouslySetInnerHTML={renderContent(message.content)}
        />
        
        {message.metadata?.actions && (
          <div className="message-actions">
            {message.metadata.actions.map((action, index) => (
              <button key={index} className="action-button">
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant; 