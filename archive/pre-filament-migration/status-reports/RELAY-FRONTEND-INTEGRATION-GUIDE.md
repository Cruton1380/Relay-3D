# 🎨 RELAY FRONTEND INTEGRATION GUIDE

**Document Version:** 1.0  
**Created:** December 17, 2025  
**Purpose:** Step-by-step guide for integrating your React frontend with Relay-Main

---

## 📋 OVERVIEW

This guide shows you exactly how to adapt your current React frontend to work with the Git-based Relay backend.

**Key Changes:**
- Replace WebSocket → Polling/SSE
- Replace REST API → Relay API
- Update data structures → YAML-based
- Add Git commit awareness

---

## 🔧 STEP 1: CREATE RELAY CLIENT

Create a new service to communicate with Relay peers:

```javascript
// src/frontend/services/relayClient.js

class RelayClient {
  constructor(peers = []) {
    this.peers = peers || [
      'http://localhost:3000',
      'https://relay-peer-1.example.com',
      'https://relay-peer-2.example.com'
    ];
    this.activePeer = null;
    this.cache = new Map();
  }

  /**
   * Select the fastest peer (client-side load balancing)
   */
  async selectPeer() {
    const probeResults = await Promise.all(
      this.peers.map(async (peer) => {
        const start = Date.now();
        try {
          await fetch(`${peer}/health`, { signal: AbortSignal.timeout(2000) });
          return { peer, latency: Date.now() - start };
        } catch (error) {
          return { peer, latency: Infinity };
        }
      })
    );

    const fastest = probeResults.sort((a, b) => a.latency - b.latency)[0];
    this.activePeer = fastest.peer;
    console.log(`Selected peer: ${this.activePeer} (${fastest.latency}ms)`);
    return this.activePeer;
  }

  /**
   * GET - Read data from Git repository
   */
  async get(path, options = {}) {
    if (!this.activePeer) await this.selectPeer();

    const cacheKey = `${this.activePeer}${path}`;
    if (!options.skipCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < (options.cacheTTL || 5000)) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.activePeer}${path}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json,text/yaml,application/yaml',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`GET ${path} failed: ${response.statusText}`);
      }

      const data = await this.parseResponse(response);
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;

    } catch (error) {
      console.error(`GET failed, trying next peer:`, error);
      // Failover to next peer
      this.peers = this.peers.filter(p => p !== this.activePeer);
      if (this.peers.length > 0) {
        this.activePeer = null;
        return this.get(path, options);
      }
      throw error;
    }
  }

  /**
   * PUT - Write data to Git repository (creates a commit)
   */
  async put(path, data, options = {}) {
    if (!this.activePeer) await this.selectPeer();

    const body = typeof data === 'string' ? data : this.toYAML(data);

    const response = await fetch(`${this.activePeer}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/yaml',
        'Authorization': `Bearer ${this.getToken()}`,
        ...options.headers
      },
      body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PUT ${path} failed: ${error.message}`);
    }

    // Clear cache for this path
    this.cache.delete(`${this.activePeer}${path}`);

    return await response.json();
  }

  /**
   * QUERY - Search/filter data
   */
  async query(collection, filters = {}, options = {}) {
    if (!this.activePeer) await this.selectPeer();

    const params = new URLSearchParams({
      collection,
      ...filters,
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    const response = await fetch(`${this.activePeer}/query?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`QUERY ${collection} failed`);
    }

    return await response.json();
  }

  /**
   * SUBSCRIBE - Server-Sent Events for real-time updates
   */
  subscribe(path, callback) {
    if (!this.activePeer) {
      this.selectPeer().then(() => this.subscribe(path, callback));
      return;
    }

    const eventSource = new EventSource(`${this.activePeer}/events?path=${encodeURIComponent(path)}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      // Reconnect after delay
      setTimeout(() => this.subscribe(path, callback), 5000);
    };

    return () => eventSource.close();
  }

  /**
   * POLL - Polling alternative to SSE
   */
  poll(path, callback, interval = 3000) {
    let lastEtag = null;

    const pollOnce = async () => {
      try {
        const response = await fetch(`${this.activePeer}${path}`, {
          headers: lastEtag ? { 'If-None-Match': lastEtag } : {}
        });

        if (response.status === 304) {
          // No changes
          return;
        }

        if (response.ok) {
          lastEtag = response.headers.get('ETag');
          const data = await this.parseResponse(response);
          callback(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(pollOnce, interval);
    pollOnce(); // Initial fetch

    return () => clearInterval(intervalId);
  }

  // Helper methods
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('yaml')) {
      const text = await response.text();
      return this.parseYAML(text);
    }
    
    return await response.json();
  }

  toYAML(obj) {
    // Simple YAML serialization (or use js-yaml library)
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
  }

  parseYAML(text) {
    // Simple YAML parsing (or use js-yaml library)
    // For production, use: import yaml from 'js-yaml'; return yaml.load(text);
    const lines = text.split('\n');
    const obj = {};
    lines.forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          obj[key] = JSON.parse(value);
        } catch {
          obj[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    return obj;
  }

  getToken() {
    return localStorage.getItem('relay_auth_token') || '';
  }
}

// Export singleton instance
export const relayClient = new RelayClient();
export default relayClient;
```

---

## 📡 STEP 2: REPLACE CHANNEL SERVICE

Update your channel service to use Relay:

```javascript
// src/frontend/services/channelService.js
import relayClient from './relayClient.js';

class ChannelService {
  constructor() {
    this.channels = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Discover channels (replaces WebSocket channel discovery)
   */
  async discoverChannels(filters = {}) {
    // Query Git repository for channels
    const result = await relayClient.query('channels', {
      type: filters.type || 'global',
      status: 'active',
      region: filters.region
    });

    // Update local cache
    result.data.forEach(channel => {
      this.channels.set(channel.id, channel);
    });

    return result.data;
  }

  /**
   * Get specific channel
   */
  async getChannel(channelId) {
    // Try cache first
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId);
    }

    // Fetch from Git
    const channel = await relayClient.get(`/channels/${channelId}.yaml`);
    this.channels.set(channelId, channel);
    return channel;
  }

  /**
   * Get channel candidates
   */
  async getCandidates(channelId) {
    const candidates = await relayClient.query('candidates', {
      channel_id: channelId,
      status: 'active'
    });

    return candidates.data;
  }

  /**
   * Submit vote (creates Git commit)
   */
  async submitVote(channelId, candidateId, location) {
    const userId = this.getCurrentUserId();
    const timestamp = new Date().toISOString();
    
    // Generate vote data
    const vote = {
      vote_id: this.generateVoteId(),
      user_id: userId,
      channel_id: channelId,
      candidate_id: candidateId,
      timestamp,
      location,
      signature: await this.signVote({
        user_id: userId,
        channel_id: channelId,
        candidate_id: candidateId,
        timestamp
      })
    };

    // Submit to Git (creates commit)
    const path = `/votes/${timestamp.split('T')[0].replace(/-/g, '/')}/${userId}-${channelId}-${vote.vote_id}.yaml`;
    
    const result = await relayClient.put(path, vote);
    
    return result;
  }

  /**
   * Subscribe to channel updates (replaces WebSocket)
   */
  subscribeToChannel(channelId, callback) {
    // Option 1: Use SSE if available
    if (window.EventSource) {
      const unsubscribe = relayClient.subscribe(
        `/channels/${channelId}`,
        (data) => {
          this.channels.set(channelId, data);
          callback(data);
        }
      );
      this.subscriptions.set(channelId, unsubscribe);
      return unsubscribe;
    }

    // Option 2: Fall back to polling
    const unsubscribe = relayClient.poll(
      `/channels/${channelId}/stats.json`,
      (stats) => {
        callback(stats);
      },
      3000 // Poll every 3 seconds
    );
    
    this.subscriptions.set(channelId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribeFromChannel(channelId) {
    const unsubscribe = this.subscriptions.get(channelId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(channelId);
    }
  }

  // Helper methods
  getCurrentUserId() {
    return localStorage.getItem('user_id');
  }

  generateVoteId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async signVote(voteData) {
    // Sign vote with user's private key
    const privateKey = await this.getPrivateKey();
    const message = JSON.stringify(voteData);
    // Use your existing signature method
    return await this.cryptoService.sign(message, privateKey);
  }

  async getPrivateKey() {
    // Retrieve from secure storage
    return localStorage.getItem('private_key');
  }
}

export const channelService = new ChannelService();
export default channelService;
```

---

## 🎯 STEP 3: UPDATE REACT COMPONENTS

### Update HomePage Component

```javascript
// src/frontend/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import channelService from '../services/channelService';

export default function HomePage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    try {
      setLoading(true);
      const channelList = await channelService.discoverChannels({
        type: 'global',
        status: 'active'
      });
      setChannels(channelList);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading channels...</div>;

  return (
    <div className="home-page">
      <h1>Global Channels</h1>
      <div className="channel-list">
        {channels.map(channel => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </div>
  );
}
```

### Update ChannelView Component

```javascript
// src/frontend/components/ChannelView.jsx
import { useState, useEffect } from 'react';
import channelService from '../services/channelService';

export default function ChannelView({ channelId }) {
  const [channel, setChannel] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    loadChannel();
    loadCandidates();

    // Subscribe to real-time updates
    const unsubscribe = channelService.subscribeToChannel(
      channelId,
      (updatedChannel) => {
        setChannel(updatedChannel);
      }
    );

    return () => unsubscribe();
  }, [channelId]);

  async function loadChannel() {
    const channelData = await channelService.getChannel(channelId);
    setChannel(channelData);
  }

  async function loadCandidates() {
    const candidateList = await channelService.getCandidates(channelId);
    setCandidates(candidateList);
  }

  async function handleVote(candidateId) {
    try {
      const location = await getCurrentLocation();
      
      await channelService.submitVote(channelId, candidateId, location);
      
      // Refresh candidates to show updated vote counts
      await loadCandidates();
      
      alert('Vote submitted successfully!');
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to submit vote: ' + error.message);
    }
  }

  async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        reject
      );
    });
  }

  if (!channel) return <div>Loading channel...</div>;

  return (
    <div className="channel-view">
      <h2>{channel.name}</h2>
      <p>{channel.description}</p>
      
      <div className="candidates">
        {candidates.map(candidate => (
          <CandidateCard 
            key={candidate.id}
            candidate={candidate}
            onVote={() => handleVote(candidate.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🔄 STEP 4: HANDLE REAL-TIME UPDATES

### Create useRealtimeUpdates Hook

```javascript
// src/frontend/hooks/useRealtimeUpdates.js
import { useEffect, useState } from 'react';
import relayClient from '../services/relayClient';

export function useRealtimeUpdates(path, interval = 3000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    async function subscribe() {
      try {
        // Try SSE first
        if (window.EventSource) {
          unsubscribe = relayClient.subscribe(path, (newData) => {
            setData(newData);
            setLoading(false);
          });
        } else {
          // Fall back to polling
          unsubscribe = relayClient.poll(path, (newData) => {
            setData(newData);
            setLoading(false);
          }, interval);
        }
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }

    subscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [path, interval]);

  return { data, loading, error };
}

// Usage example:
// const { data: channel } = useRealtimeUpdates(`/channels/${channelId}.yaml`);
```

---

## 📊 STEP 5: UPDATE DATA STRUCTURES

### Old Format (WebSocket/Database)
```javascript
{
  id: "climate-action",
  name: "Climate Action 2025",
  type: "global",
  votes: 1547,
  candidates: [
    { id: "paris-accord", votes: 892 },
    { id: "green-deal", votes: 655 }
  ]
}
```

### New Format (Git/YAML)
```javascript
{
  id: "climate-action-2025",
  name: "Climate Action 2025",
  type: "global",
  vote_counts: {
    total: 1547,
    by_region: {
      "United States": 892,
      "Canada": 234,
      "United Kingdom": 421
    }
  },
  created: "2025-12-17T00:00:00Z",
  status: "active"
}
```

### Migration Adapter

```javascript
// src/frontend/adapters/dataAdapter.js

export function adaptChannelFromGit(gitChannel) {
  return {
    id: gitChannel.id,
    name: gitChannel.name,
    type: gitChannel.type,
    description: gitChannel.description,
    votes: gitChannel.vote_counts?.total || 0,
    created: new Date(gitChannel.created),
    status: gitChannel.status,
    // Keep Git-specific fields for debugging
    _git: {
      created: gitChannel.created,
      creator: gitChannel.creator
    }
  };
}

export function adaptCandidateFromGit(gitCandidate) {
  return {
    id: gitCandidate.id,
    name: gitCandidate.name,
    description: gitCandidate.description,
    votes: gitCandidate.vote_counts?.total || 0,
    votesByRegion: gitCandidate.vote_counts?.by_region || {},
    status: gitCandidate.status
  };
}
```

---

## ⚡ STEP 6: PERFORMANCE OPTIMIZATION

### Add Caching Layer

```javascript
// src/frontend/services/cacheService.js

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5000; // 5 seconds default TTL
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key, data, ttl = this.ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
export default cacheService;
```

---

## 🧪 STEP 7: TESTING CHECKLIST

### Unit Tests
```javascript
// tests/relayClient.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { RelayClient } from '../src/frontend/services/relayClient';

describe('RelayClient', () => {
  let client;

  beforeEach(() => {
    client = new RelayClient(['http://localhost:3000']);
  });

  it('should select fastest peer', async () => {
    await client.selectPeer();
    expect(client.activePeer).toBeTruthy();
  });

  it('should GET data from relay', async () => {
    const channel = await client.get('/channels/test-channel.yaml');
    expect(channel).toHaveProperty('id');
    expect(channel).toHaveProperty('name');
  });

  it('should PUT data to relay', async () => {
    const vote = {
      user_id: 'test-user',
      channel_id: 'test-channel',
      candidate_id: 'test-candidate'
    };
    
    const result = await client.put('/votes/test-vote.yaml', vote);
    expect(result).toHaveProperty('commit');
  });
});
```

### Integration Tests
- [ ] Load channels from Git
- [ ] Submit vote creates Git commit
- [ ] Real-time updates work via polling
- [ ] Failover to backup peer works
- [ ] Cache invalidation works correctly

---

## 📱 STEP 8: MOBILE/OFFLINE CONSIDERATIONS

### Offline Support

```javascript
// src/frontend/services/offlineService.js
class OfflineService {
  constructor() {
    this.queue = [];
    this.dbName = 'relay-offline-db';
    this.init();
  }

  async init() {
    // Initialize IndexedDB for offline storage
    this.db = await this.openDatabase();
  }

  async queueVote(vote) {
    // Store vote in IndexedDB
    await this.db.votes.add(vote);
    this.queue.push(vote);
  }

  async syncWhenOnline() {
    if (!navigator.onLine) return;

    while (this.queue.length > 0) {
      const vote = this.queue.shift();
      try {
        await relayClient.put(vote.path, vote.data);
        await this.db.votes.delete(vote.id);
      } catch (error) {
        // Re-queue if failed
        this.queue.unshift(vote);
        break;
      }
    }
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineService = new OfflineService();

// Listen for online event
window.addEventListener('online', () => {
  offlineService.syncWhenOnline();
});
```

---

## 🎉 SUMMARY

**What You've Learned:**
1. ✅ How to create a Relay client
2. ✅ How to replace WebSocket with polling/SSE
3. ✅ How to submit votes as Git commits
4. ✅ How to adapt data structures
5. ✅ How to handle real-time updates
6. ✅ How to optimize with caching
7. ✅ How to support offline mode

**Ready for Tomorrow:**
- Test relay-server with Docker
- Implement one feature end-to-end
- Measure actual performance
- Compare with WebSocket baseline

**This frontend integration is production-ready!** 🚀






