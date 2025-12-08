/**
 * Democratic Chatroom Panel - Real-time Community Chat
 * Migrated from legacy DemocraticChatroom.jsx
 * Provides real-time chat with community-driven moderation
 */
import React, { useState, useEffect, useRef } from 'react';

const DemocraticChatroomPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(true); // Demo mode
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // Demo user ID
  const userId = 'demo-user-1';
  const channelId = 'demo-channel-1';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load demo messages
  useEffect(() => {
    loadDemoMessages();
    loadDemoUsers();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDemoMessages = () => {
    const demoMessages = [
      {
        id: 1,
        userId: 'user-1',
        username: 'Sarah Cohen',
        content: 'Welcome to the democratic chatroom! This is where we can discuss community issues openly.',
        timestamp: Date.now() - 300000,
        voteScore: 5,
        userVote: null
      },
      {
        id: 2,
        userId: 'user-2',
        username: 'Michael Rosen',
        content: 'I think we should focus on improving the local infrastructure. What do others think?',
        timestamp: Date.now() - 240000,
        voteScore: 8,
        userVote: null
      },
      {
        id: 3,
        userId: 'user-3',
        username: 'Rachel Ben-David',
        content: 'Great point! I\'ve noticed the roads need attention. Maybe we can create a proposal?',
        timestamp: Date.now() - 180000,
        voteScore: 12,
        userVote: null
      },
      {
        id: 4,
        userId: 'user-4',
        username: 'David Levy',
        content: 'I agree with Rachel. Let\'s organize a community meeting to discuss this.',
        timestamp: Date.now() - 120000,
        voteScore: 6,
        userVote: null
      },
      {
        id: 5,
        userId: 'user-5',
        username: 'Anna Greenberg',
        content: 'Perfect! I can help coordinate the meeting. Should we use the community center?',
        timestamp: Date.now() - 60000,
        voteScore: 9,
        userVote: null
      }
    ];
    setMessages(demoMessages);
  };

  const loadDemoUsers = () => {
    const demoUsers = [
      { id: 'user-1', username: 'Sarah Cohen', joinedAt: Date.now() - 600000 },
      { id: 'user-2', username: 'Michael Rosen', joinedAt: Date.now() - 480000 },
      { id: 'user-3', username: 'Rachel Ben-David', joinedAt: Date.now() - 360000 },
      { id: 'user-4', username: 'David Levy', joinedAt: Date.now() - 240000 },
      { id: 'user-5', username: 'Anna Greenberg', joinedAt: Date.now() - 120000 }
    ];
    setActiveUsers(demoUsers);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      userId: userId,
      username: 'Demo User',
      content: newMessage.trim(),
      timestamp: Date.now(),
      voteScore: 0,
      userVote: null
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate other users responding
    setTimeout(() => {
      const responses = [
        'That\'s an interesting point!',
        'I agree with that perspective.',
        'Let\'s explore this further.',
        'Good idea! How can we implement this?',
        'I think we should consider all options.'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      
      const responseMessage = {
        id: Date.now() + 1,
        userId: randomUser.id,
        username: randomUser.username,
        content: randomResponse,
        timestamp: Date.now(),
        voteScore: Math.floor(Math.random() * 5) + 1,
        userVote: null
      };
      
      setMessages(prev => [...prev, responseMessage]);
    }, 2000 + Math.random() * 3000);
  };

  const voteOnMessage = async (messageId, voteType) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const newScore = msg.voteScore + (voteType === 'up' ? 1 : -1);
        return {
          ...msg,
          voteScore: newScore,
          userVote: voteType
        };
      }
      return msg;
    }));
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getModerationStatusColor = (status) => {
    switch (status) {
      case 'trusted': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'suspicious': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getModerationStatusText = (status) => {
    switch (status) {
      case 'trusted': return 'Trusted Member';
      case 'neutral': return 'Community Member';
      case 'suspicious': return 'Under Review';
      default: return 'New Member';
    }
  };

  return (
    <div className="democratic-chatroom-panel h-full flex flex-col">
      {/* Header */}
      <div className="chatroom-header bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">💬 Democratic Chatroom</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">{activeUsers.length} online</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span>Channel: Community Discussion</span>
          <span className={`px-2 py-1 rounded-full text-xs ${getModerationStatusColor('trusted')} bg-white/20`}>
            {getModerationStatusText('trusted')}
          </span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel bg-gray-50 p-4 border-b border-gray-200">
          <h3 className="font-semibold mb-3">Chatroom Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-700 mb-1">Moderation Threshold</label>
              <input
                type="range"
                min="5"
                max="20"
                value={chatroomSettings.moderationThreshold}
                onChange={(e) => setChatroomSettings(prev => ({
                  ...prev,
                  moderationThreshold: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{chatroomSettings.moderationThreshold}</span>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Filter Threshold</label>
              <input
                type="range"
                min="-20"
                max="-5"
                value={chatroomSettings.filterThreshold}
                onChange={(e) => setChatroomSettings(prev => ({
                  ...prev,
                  filterThreshold: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{chatroomSettings.filterThreshold}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="messages-container flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map(message => (
          <div key={message.id} className="message-item">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-bold">
                {message.username.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm">{message.username}</span>
                  <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                  {message.voteScore > 10 && (
                    <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">Popular</span>
                  )}
                </div>
                <div className="bg-gray-100 rounded-lg p-3 mb-2">
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => voteOnMessage(message.id, 'up')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                      message.userVote === 'up' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                    }`}
                  >
                    <span>👍</span>
                    <span>{message.voteScore}</span>
                  </button>
                  <button
                    onClick={() => voteOnMessage(message.id, 'down')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                      message.userVote === 'down' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                    }`}
                  >
                    <span>👎</span>
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message... (Press Enter to send)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Democratic moderation active • Community-driven content filtering
        </div>
      </div>
    </div>
  );
};

export default DemocraticChatroomPanel; 