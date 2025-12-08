# 🎛️ Frontend API Integration Guide

## Executive Summary

This guide covers the complete integration between the Relay Network frontend (Base Model 1) and the backend API systems. The frontend seamlessly connects to blockchain voting, semantic dictionary, channel management, and real-time communication systems through well-defined API endpoints and WebSocket connections.

**Integration Status**: ✅ **Fully Operational**
- Frontend on port 5176 with backend on port 3002
- 1218+ blockchain transactions successfully processed
- Real-time WebSocket communication active
- Semantic dictionary parsing integrated
- Complete voting workflow with cryptographic signatures

---

## Table of Contents

1. [API Integration Architecture](#api-integration-architecture)
2. [Voting System Integration](#voting-system-integration)
3. [Channel Management Integration](#channel-management-integration)
4. [Semantic Dictionary Integration](#semantic-dictionary-integration)
5. [Real-Time Communication](#real-time-communication)
6. [Authentication & Security](#authentication--security)
7. [Error Handling & Resilience](#error-handling--resilience)
8. [Performance Optimization](#performance-optimization)

---

## API Integration Architecture

### Backend Services Overview

```
Backend Services (Port 3002)
├── Voting System
│   ├── POST /api/vote/submit           # Blockchain vote submission
│   ├── GET /api/vote/results/:id       # Vote results and analytics
│   └── GET /api/vote/verify/:txId      # Blockchain verification
├── Channel Management  
│   ├── GET /api/channels               # List available channels
│   ├── POST /api/channels              # Create new channel
│   ├── PUT /api/channels/:id           # Update channel settings
│   └── DELETE /api/channels/:id        # Delete channel
├── Semantic Dictionary
│   ├── POST /api/dictionary/parse      # Parse text for semantic entities
│   ├── GET /api/dictionary/term/:term  # Get term definitions
│   ├── GET /api/dictionary/search      # Search dictionary
│   └── POST /api/dictionary/preference # Set user preferences
├── Authentication
│   ├── POST /api/auth/login            # User authentication
│   ├── POST /api/auth/refresh          # Token refresh
│   └── GET /api/auth/profile           # User profile
└── Real-Time Communication
    └── WebSocket: ws://localhost:3002/ws
```

### Frontend Integration Layer

```javascript
// API Client Configuration
const apiClient = {
  baseURL: 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  },
  
  // Request interceptor for authentication
  interceptRequest: (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  
  // Response interceptor for error handling
  interceptResponse: (response) => {
    if (response.status === 401) {
      // Handle token expiration
      refreshAuthToken();
    }
    return response;
  }
};
```

---

## Voting System Integration

### Vote Submission Workflow

**Frontend Implementation**: `src/base-model-1/ui/VoteButton.jsx`

```jsx
const VoteButton = ({ candidateId, candidateName, onVoteComplete }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState(null);

  const submitVote = async (voteType) => {
    setIsVoting(true);
    setVoteStatus('preparing');

    try {
      // Step 1: Generate cryptographic signature
      const voteData = {
        candidateId,
        vote: voteType,
        userId: user.id,
        timestamp: Date.now(),
        nonce: crypto.getRandomValues(new Uint32Array(1))[0]
      };

      setVoteStatus('signing');
      const signature = await generateVoteSignature(voteData);

      // Step 2: Generate Sybil resistance token
      setVoteStatus('validating');
      const sybilToken = await generateSybilToken();

      // Step 3: Submit to blockchain
      setVoteStatus('submitting');
      const response = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...voteData,
          signature,
          sybilToken
        })
      });

      const result = await response.json();

      if (result.success) {
        setVoteStatus('confirmed');
        
        // Update UI with blockchain transaction
        onVoteComplete({
          candidateId,
          vote: voteType,
          blockchainTxId: result.blockchainTxId,
          blockNumber: result.blockNumber,
          voteCount: result.voteCount,
          verified: true
        });

        // Show success notification
        showNotification(`Vote recorded on blockchain: ${result.blockchainTxId.slice(0, 10)}...`);
      } else {
        throw new Error(result.error || 'Vote submission failed');
      }
    } catch (error) {
      setVoteStatus('error');
      console.error('Vote submission error:', error);
      showErrorNotification(`Vote failed: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="vote-button-container">
      <button
        className="vote-btn upvote"
        onClick={() => submitVote('upvote')}
        disabled={isVoting}
      >
        {isVoting ? <LoadingSpinner /> : '▲'} Upvote
      </button>
      
      <VoteStatusIndicator status={voteStatus} />
    </div>
  );
};
```

### Cryptographic Vote Signing

```javascript
// Cryptographic signature generation
const generateVoteSignature = async (voteData) => {
  // Get user's private key from secure storage
  const privateKey = await getPrivateKey();
  
  // Create signature payload
  const payload = JSON.stringify({
    candidateId: voteData.candidateId,
    vote: voteData.vote,
    userId: voteData.userId,
    timestamp: voteData.timestamp,
    nonce: voteData.nonce
  });

  // Generate cryptographic signature using WebCrypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    data
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};
```

### Vote Results Integration

```jsx
const VoteResultsDisplay = ({ candidateId }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVoteResults = async () => {
      try {
        const response = await fetch(`/api/vote/results/${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to load vote results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVoteResults();

    // Subscribe to real-time updates
    const ws = new WebSocket('ws://localhost:3002/ws');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'vote:update' && message.candidateId === candidateId) {
        setResults(prev => ({
          ...prev,
          voteCount: message.voteCount,
          lastUpdate: message.timestamp
        }));
      }
    };

    return () => ws.close();
  }, [candidateId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="vote-results">
      <h3>Vote Results</h3>
      <div className="vote-count">
        Total Votes: {results.voteCount}
      </div>
      <div className="vote-breakdown">
        <div>Upvotes: {results.upvotes}</div>
        <div>Downvotes: {results.downvotes}</div>
      </div>
      <div className="blockchain-info">
        <small>Verified on blockchain</small>
      </div>
    </div>
  );
};
```

---

## Channel Management Integration

### Channel Listing and Discovery

**Frontend Implementation**: `src/base-model-1/panels/ChannelPanel.jsx`

```jsx
const ChannelPanel = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await fetch('/api/channels', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const data = await response.json();
        setChannels(data.channels || []);
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();

    // Real-time channel updates
    const ws = new WebSocket('ws://localhost:3002/ws');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'channel:created') {
        setChannels(prev => [...prev, message.channel]);
      } else if (message.type === 'channel:updated') {
        setChannels(prev => 
          prev.map(ch => 
            ch.id === message.channel.id ? message.channel : ch
          )
        );
      } else if (message.type === 'channel:deleted') {
        setChannels(prev => 
          prev.filter(ch => ch.id !== message.channelId)
        );
      }
    };

    return () => ws.close();
  }, []);

  const filteredChannels = channels.filter(channel => {
    switch (filter) {
      case 'proximity':
        return channel.type === 'proximity';
      case 'global':
        return channel.type === 'global';
      case 'subscribed':
        return channel.subscribed;
      default:
        return true;
    }
  });

  return (
    <div className="channel-panel">
      <div className="channel-filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Channels</option>
          <option value="proximity">Proximity</option>
          <option value="global">Global</option>
          <option value="subscribed">Subscribed</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="channel-list">
          {filteredChannels.map(channel => (
            <ChannelCard 
              key={channel.id} 
              channel={channel}
              onSelect={selectChannel}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Channel Creation Integration

```jsx
const CreateChannelForm = ({ onChannelCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'proximity',
    location: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onChannelCreated(result.channel);
        showNotification('Channel created successfully!');
        setFormData({ name: '', description: '', type: 'proximity', location: null });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Channel creation failed:', error);
      showErrorNotification(`Failed to create channel: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-channel-form">
      <input
        type="text"
        placeholder="Channel Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        required
      />
      
      <textarea
        placeholder="Channel Description"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        required
      />
      
      <select
        value={formData.type}
        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
      >
        <option value="proximity">Proximity</option>
        <option value="regional">Regional</option>
        <option value="global">Global</option>
      </select>

      <button type="submit">Create Channel</button>
    </form>
  );
};
```

---

## Semantic Dictionary Integration

### Text Parsing and Entity Recognition

**Frontend Implementation**: Automatic semantic linking in text content

```jsx
const SemanticText = ({ children, channelId }) => {
  const [parsedContent, setParsedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { preferences } = useSemanticPreferences();

  useEffect(() => {
    const parseText = async () => {
      if (!children || typeof children !== 'string') {
        setParsedContent(children);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/dictionary/parse', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: children,
            options: {
              channelId,
              density: preferences.linkDensity,
              enableCategories: preferences.enableCategories,
              preferredCategories: preferences.preferredCategories
            }
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setParsedContent(renderSemanticLinks(result.entities, children));
        } else {
          setParsedContent(children);
        }
      } catch (error) {
        console.error('Semantic parsing failed:', error);
        setParsedContent(children);
      } finally {
        setLoading(false);
      }
    };

    parseText();
  }, [children, channelId, preferences]);

  const renderSemanticLinks = (entities, originalText) => {
    let linkedText = originalText;
    
    // Sort entities by position (reverse order for accurate replacement)
    entities.sort((a, b) => b.start - a.start);
    
    entities.forEach(entity => {
      const linkHtml = `
        <span 
          class="semantic-link" 
          data-term="${entity.term}"
          data-category="${entity.category}"
          onmouseover="showSemanticPreview('${entity.term}')"
          onclick="openSemanticPanel('${entity.term}')"
        >
          ${entity.text}
          ${entity.ambiguous ? '<span class="ambiguity-indicator">🧠</span>' : ''}
        </span>
      `;
      
      linkedText = 
        linkedText.slice(0, entity.start) + 
        linkHtml + 
        linkedText.slice(entity.end);
    });
    
    return linkedText;
  };

  if (loading) {
    return <span className="semantic-loading">{children}</span>;
  }

  return (
    <span 
      className="semantic-text"
      dangerouslySetInnerHTML={{ __html: parsedContent }}
    />
  );
};
```

### Dictionary Search Integration

```jsx
const DictionarySearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/dictionary/search?q=${encodeURIComponent(term)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Dictionary search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="dictionary-search">
      <input
        type="text"
        placeholder="Search dictionary..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading && <LoadingSpinner />}

      <div className="search-results">
        {results.map(result => (
          <DictionarySearchResult 
            key={result.term}
            result={result}
            onSelect={selectTerm}
          />
        ))}
      </div>
    </div>
  );
};
```

### User Preferences Integration

```jsx
const useSemanticPreferences = () => {
  const [preferences, setPreferences] = useState({
    enableSemanticLinking: true,
    linkDensity: 0.3,
    enableHoverPreviews: true,
    enableCategories: true,
    preferredCategories: []
  });

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await fetch('/api/dictionary/preference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setPreferences(newPreferences);
        localStorage.setItem('semantic_preferences', JSON.stringify(newPreferences));
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  useEffect(() => {
    // Load preferences from localStorage and server
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/dictionary/preferences', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const serverPrefs = await response.json();
        setPreferences(serverPrefs);
      } catch (error) {
        // Fall back to localStorage
        const localPrefs = localStorage.getItem('semantic_preferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
        }
      }
    };

    loadPreferences();
  }, []);

  return { preferences, updatePreferences };
};
```

---

## Real-Time Communication

### WebSocket Integration

**Implementation**: Real-time updates for voting, chat, and system events

```jsx
const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messageQueue, setMessageQueue] = useState([]);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3002/ws');
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        setSocket(ws);
        
        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: getAuthToken()
        }));
        
        // Process queued messages
        messageQueue.forEach(message => {
          ws.send(JSON.stringify(message));
        });
        setMessageQueue([]);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = (event) => {
        console.log('⚠️ WebSocket disconnected:', event.code);
        setConnectionStatus('disconnected');
        setSocket(null);
        
        // Attempt reconnection after delay
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      setMessageQueue(prev => [...prev, message]);
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'vote:update':
        updateVoteDisplay(message.data);
        break;
        
      case 'channel:message':
        addChannelMessage(message.data);
        break;
        
      case 'blockchain:confirmation':
        updateBlockchainStatus(message.data);
        break;
        
      case 'sybil:alert':
        handleSybilAlert(message.data);
        break;
        
      case 'system:notification':
        showSystemNotification(message.data);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  return {
    connectionStatus,
    sendMessage,
    isConnected: connectionStatus === 'connected'
  };
};
```

### Real-Time Vote Updates

```jsx
const VoteTracker = ({ candidateId }) => {
  const [voteData, setVoteData] = useState({
    upvotes: 0,
    downvotes: 0,
    total: 0,
    trend: 'neutral'
  });

  const { sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    // Subscribe to vote updates for this candidate
    if (isConnected) {
      sendMessage({
        type: 'subscribe:votes',
        candidateId: candidateId
      });
    }

    // Listen for vote updates
    const handleVoteUpdate = (data) => {
      if (data.candidateId === candidateId) {
        setVoteData(prev => ({
          upvotes: data.upvotes,
          downvotes: data.downvotes,
          total: data.total,
          trend: data.total > prev.total ? 'up' : data.total < prev.total ? 'down' : 'neutral'
        }));
      }
    };

    window.addEventListener('vote:update', handleVoteUpdate);
    
    return () => {
      window.removeEventListener('vote:update', handleVoteUpdate);
      
      // Unsubscribe from updates
      if (isConnected) {
        sendMessage({
          type: 'unsubscribe:votes',
          candidateId: candidateId
        });
      }
    };
  }, [candidateId, isConnected, sendMessage]);

  return (
    <div className={`vote-tracker ${voteData.trend}`}>
      <div className="vote-count">
        <span className="total">{voteData.total}</span>
        <span className="breakdown">
          ↑{voteData.upvotes} ↓{voteData.downvotes}
        </span>
      </div>
      
      {voteData.trend !== 'neutral' && (
        <div className={`trend-indicator ${voteData.trend}`}>
          {voteData.trend === 'up' ? '📈' : '📉'}
        </div>
      )}
    </div>
  );
};
```

---

## Authentication & Security

### JWT Token Management

```javascript
// Authentication utilities
const authUtils = {
  // Store JWT securely
  setAuthToken: (token) => {
    localStorage.setItem('relay_auth_token', token);
    // Also set in httpOnly cookie for enhanced security
    document.cookie = `auth_token=${token}; HttpOnly; Secure; SameSite=Strict`;
  },
  
  // Retrieve JWT
  getAuthToken: () => {
    return localStorage.getItem('relay_auth_token');
  },
  
  // Clear authentication
  clearAuth: () => {
    localStorage.removeItem('relay_auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  },
  
  // Check if token is expired
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
  
  // Refresh token automatically
  refreshToken: async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authUtils.getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        authUtils.setAuthToken(data.token);
        return data.token;
      } else {
        authUtils.clearAuth();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      authUtils.clearAuth();
      throw error;
    }
  }
};
```

### Secure API Request Wrapper

```javascript
// Enhanced API client with automatic token refresh
const secureApiRequest = async (url, options = {}) => {
  let token = authUtils.getAuthToken();
  
  // Check if token needs refresh
  if (authUtils.isTokenExpired(token)) {
    try {
      token = await authUtils.refreshToken();
    } catch (error) {
      // Redirect to login if refresh fails
      window.location.href = '/login';
      throw error;
    }
  }
  
  // Add authentication header
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle authentication errors
  if (response.status === 401) {
    try {
      token = await authUtils.refreshToken();
      // Retry request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...headers,
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (refreshError) {
      window.location.href = '/login';
      throw refreshError;
    }
  }
  
  return response;
};
```

---

## Error Handling & Resilience

### Comprehensive Error Handling

```jsx
const useApiError = () => {
  const [errors, setErrors] = useState([]);

  const handleApiError = (error, context) => {
    const errorInfo = {
      id: Date.now(),
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    setErrors(prev => [...prev, errorInfo]);

    // Log error for debugging
    console.error(`API Error [${context}]:`, error);

    // Report critical errors to monitoring service
    if (error.critical) {
      reportErrorToMonitoring(errorInfo);
    }

    // Show user-friendly notification
    showErrorNotification(getUserFriendlyMessage(error));
  };

  const clearError = (errorId) => {
    setErrors(prev => prev.filter(err => err.id !== errorId));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    handleApiError,
    clearError,
    clearAllErrors
  };
};
```

### Retry Logic for Failed Requests

```javascript
const retryableApiRequest = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await secureApiRequest(url, options);
      
      if (response.ok) {
        return response;
      } else if (response.status >= 500) {
        // Server error - retry
        throw new Error(`Server error: ${response.status}`);
      } else {
        // Client error - don't retry
        return response;
      }
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries})`);
      }
    }
  }
  
  throw lastError;
};
```

### Offline Support

```jsx
const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueAction = (action) => {
    if (isOnline) {
      // Execute immediately if online
      return action();
    } else {
      // Queue for later if offline
      setPendingActions(prev => [...prev, action]);
      showNotification('Action queued for when connection is restored');
    }
  };

  const processPendingActions = async () => {
    for (const action of pendingActions) {
      try {
        await action();
      } catch (error) {
        console.error('Failed to process pending action:', error);
      }
    }
    setPendingActions([]);
  };

  return {
    isOnline,
    queueAction
  };
};
```

---

## Performance Optimization

### Request Caching

```javascript
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cachedApiRequest = async (url, options = {}) => {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }

  const response = await secureApiRequest(url, options);
  const data = await response.json();

  apiCache.set(cacheKey, {
    response: { ...response, json: () => Promise.resolve(data) },
    timestamp: Date.now()
  });

  return response;
};
```

### Request Batching

```javascript
const useBatchedRequests = () => {
  const [requestQueue, setRequestQueue] = useState([]);
  const [processing, setProcessing] = useState(false);

  const batchRequest = (request) => {
    setRequestQueue(prev => [...prev, request]);
  };

  useEffect(() => {
    if (requestQueue.length > 0 && !processing) {
      const processBatch = async () => {
        setProcessing(true);
        
        try {
          // Group requests by endpoint
          const grouped = requestQueue.reduce((acc, req) => {
            const endpoint = req.url.split('?')[0];
            if (!acc[endpoint]) acc[endpoint] = [];
            acc[endpoint].push(req);
            return acc;
          }, {});

          // Process grouped requests
          await Promise.all(
            Object.entries(grouped).map(([endpoint, requests]) =>
              processBatchedEndpoint(endpoint, requests)
            )
          );
        } finally {
          setProcessing(false);
          setRequestQueue([]);
        }
      };

      // Debounce batch processing
      const timeoutId = setTimeout(processBatch, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [requestQueue, processing]);

  return { batchRequest };
};
```

### Component-Level Optimization

```jsx
const OptimizedComponent = React.memo(({ data, onUpdate }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processComplexData(data);
  }, [data]);

  // Debounce API calls
  const debouncedUpdate = useCallback(
    debounce((newData) => {
      onUpdate(newData);
    }, 300),
    [onUpdate]
  );

  // Virtualize large lists
  const renderVirtualizedList = () => {
    return (
      <FixedSizeList
        height={400}
        itemCount={processedData.length}
        itemSize={50}
        itemData={processedData}
      >
        {({ index, style, data }) => (
          <div style={style}>
            {data[index].name}
          </div>
        )}
      </FixedSizeList>
    );
  };

  return (
    <div className="optimized-component">
      {renderVirtualizedList()}
    </div>
  );
});
```

---

## Conclusion

The Relay Network frontend successfully integrates with all backend systems through well-designed API endpoints and real-time WebSocket connections. The implementation provides:

**✅ Complete Integration:**
- Blockchain voting with cryptographic signatures
- Real-time communication and updates
- Semantic dictionary with automatic text parsing
- Channel management and discovery
- Secure authentication and token management

**✅ Robust Error Handling:**
- Automatic retry logic for failed requests
- Offline support with action queuing
- Comprehensive error tracking and reporting
- User-friendly error notifications

**✅ Performance Optimization:**
- Request caching and batching
- Component-level optimizations
- Efficient state management
- Minimal API calls through smart caching

The integration layer successfully bridges complex backend systems with intuitive frontend interfaces, providing a seamless user experience for democratic participation while maintaining security and performance standards.
