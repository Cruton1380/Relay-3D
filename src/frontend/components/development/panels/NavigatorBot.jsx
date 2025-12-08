import React, { useState, useRef, useEffect } from 'react';
import './NavigatorBot.css';

const NavigatorBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m the Navigator Bot. I can help you navigate the codebase, find files, explain components, and guide you through development workflows. What can I help you find?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateNavigatorResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const generateNavigatorResponse = (userInput) => {
    const responses = [
      "I found several relevant files for that feature. The main components are located in `/src/frontend/components/`. Would you like me to show you the file structure?",
      "That functionality is implemented in the voting system. Check out `VoteButton.jsx` and `HomePage.jsx` for the core logic. The backend API is in `/src/backend/routes/vote.mjs`.",
      "For that feature, you'll want to look at the state management in `/src/backend/state/state.mjs` and the corresponding frontend components in the development folder.",
      "The blockchain integration is handled in `/src/backend/services/blockchain/`. The main entry point is `BlockchainService.mjs`. This connects to the voting system for transparency.",
      "That's part of the WebSocket system. Check `/src/backend/websocket/` for real-time features and `/src/frontend/hooks/` for the frontend integration."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    'Show file structure',
    'Find voting components',
    'Explain blockchain integration',
    'Locate API endpoints',
    'Find test files'
  ];

  return (
    <div className="navigator-bot ai-chat">
      <div className="chat-header">
        <div className="bot-info">
          <div className="bot-avatar navigator">🧭</div>
          <div className="bot-details">
            <h4>Navigator Bot</h4>
            <span className="bot-status">Code Guide</span>
          </div>
        </div>
        <div className="chat-controls">
          <button className="control-btn" title="Clear chat">
            🗑️
          </button>
          <button className="control-btn" title="Export chat">
            📄
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot typing">
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

      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action"
            onClick={() => setInput(action)}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about file locations, code structure, or how to implement features..."
          rows="2"
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default NavigatorBot;
