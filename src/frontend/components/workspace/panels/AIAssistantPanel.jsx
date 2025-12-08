/**
 * AI Assistant Panel - Dual-Agent Chat Interface
 * Migrated from legacy AIAssistant.jsx
 * Provides Navigator and Architect agents for user guidance and technical development
 */
import React, { useState, useEffect, useRef } from 'react';

const AIAssistantPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
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
      // Simulate AI response for demo
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'agent',
          agent: activeAgent,
          content: `This is a demo response from the ${activeAgent === 'navigator' ? 'Navigator' : 'Architect'} agent. In the full implementation, this would connect to the backend AI system for real responses.`,
          timestamp: new Date(),
          metadata: { isDemo: true }
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);

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
    <div className="ai-assistant-panel">
      {/* Header */}
      <div className="ai-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🤖 AI Assistant</h2>
          <button 
            onClick={clearConversation}
            className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Agent Selector */}
        <div className="flex space-x-2">
          <button
            className={`flex-1 p-3 rounded-lg transition-colors ${
              activeAgent === 'navigator' 
                ? 'bg-white text-blue-600' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => switchAgent('navigator')}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🧭</span>
              <div className="text-left">
                <div className="font-semibold text-sm">Navigator</div>
                <div className="text-xs opacity-80">User Guidance</div>
              </div>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                agentStatus.navigator === 'online' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
          </button>
          
          <button
            className={`flex-1 p-3 rounded-lg transition-colors ${
              activeAgent === 'architect' 
                ? 'bg-white text-purple-600' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => switchAgent('architect')}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏗️</span>
              <div className="text-left">
                <div className="font-semibold text-sm">Architect</div>
                <div className="text-xs opacity-80">Technical Development</div>
              </div>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                agentStatus.architect === 'online' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="chat-container bg-white flex-1 flex flex-col">
        {/* Messages */}
        <div className="messages-container flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="message agent-message">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {activeAgent === 'navigator' ? '🧭' : '🏗️'}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask the ${activeAgent === 'navigator' ? 'Navigator' : 'Architect'} anything...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send • {activeAgent === 'navigator' ? 'Navigator' : 'Architect'} agent active
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Component
const Message = ({ message }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = (content) => {
    // Simple markdown-like rendering
    return content.split('\n').map((line, index) => (
      <div key={index} className="mb-2">
        {line.startsWith('• ') ? (
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{line.substring(2)}</span>
          </div>
        ) : (
          <span>{line}</span>
        )}
      </div>
    ));
  };

  if (message.type === 'user') {
    return (
      <div className="message user-message">
        <div className="flex items-start space-x-3 justify-end">
          <div className="flex-1 max-w-xs">
            <div className="bg-blue-600 text-white rounded-lg p-3">
              <div className="text-sm">{renderContent(message.content)}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            👤
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'agent') {
    return (
      <div className="message agent-message">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {message.agent === 'navigator' ? '🧭' : '🏗️'}
          </div>
          <div className="flex-1 max-w-xs">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm">{renderContent(message.content)}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatTimestamp(message.timestamp)} • {message.agent === 'navigator' ? 'Navigator' : 'Architect'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="message system-message">
        <div className="text-center">
          <div className="inline-block bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="message error-message">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm">
            ⚠️
          </div>
          <div className="flex-1">
            <div className="bg-red-100 border border-red-200 text-red-800 rounded-lg p-3">
              <div className="text-sm">{message.content}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AIAssistantPanel; 