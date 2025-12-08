import React, { useState, useRef, useEffect } from 'react';
import './ArchitectBot.css';

const ArchitectBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m the Architect Bot. I can help you design system architecture, plan features, and optimize your Relay platform. What would you like to work on?',
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
        content: generateArchitectResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateArchitectResponse = (userInput) => {
    const responses = [
      "Let me analyze the architecture requirements for that feature. Based on best practices, I recommend implementing a microservices approach with proper API gateway patterns.",
      "For system scalability, consider implementing a distributed caching layer with Redis and horizontal scaling strategies. This will improve performance significantly.",
      "I suggest using a event-driven architecture pattern here. This will decouple your services and improve maintainability. Shall I draft the technical specifications?",
      "From an architectural perspective, this requires careful consideration of data consistency and transaction management. I recommend implementing the Saga pattern.",
      "The optimal solution involves creating a modular plugin system with well-defined interfaces. This will enable future extensibility and maintainability."
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
    'Design database schema',
    'Plan API architecture',
    'Optimize performance',
    'Security review',
    'Scalability analysis'
  ];

  return (
    <div className="architect-bot ai-chat">
      <div className="chat-header">
        <div className="bot-info">
          <div className="bot-avatar architect">🏗️</div>
          <div className="bot-details">
            <h4>Architect Bot</h4>
            <span className="bot-status">System Designer</span>
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
          placeholder="Ask about architecture, design patterns, or system optimization..."
          rows="2"
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ArchitectBot;
