/**
 * Relay Client
 * 
 * HTTP client for interacting with Relay peers (Git-based backend).
 * Replaces blockchain, hashgraph, and websocket services.
 */

class RelayClient {
  constructor(peers = []) {
    this.peers = peers.length > 0 ? peers : ['http://localhost:3001'];
    this.currentPeerIndex = 0;
  }

  /**
   * Get current peer URL
   */
  getCurrentPeer() {
    return this.peers[this.currentPeerIndex];
  }

  /**
   * Rotate to next peer (failover)
   */
  rotatePeer() {
    this.currentPeerIndex = (this.currentPeerIndex + 1) % this.peers.length;
    console.log(`Rotated to peer: ${this.getCurrentPeer()}`);
  }

  /**
   * PUT: Create or update a file (Git commit)
   * 
   * @param {string} path - File path in repo (e.g., '/repos/my-repo/votes/user123.yaml')
   * @param {Object} data - File content (will be serialized)
   * @param {Object} options - Commit options (message, author, etc.)
   * @returns {Promise<Object>} Commit result
   */
  async put(path, data, options = {}) {
    const peer = this.getCurrentPeer();
    const url = `${peer}${path}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify({
          content: data,
          message: options.message || 'Update via Relay client',
          author: options.author || { name: 'System', email: 'system@relay.local' }
        })
      });

      if (!response.ok) {
        throw new Error(`PUT failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PUT error to ${url}:`, error);
      this.rotatePeer();
      throw error;
    }
  }

  /**
   * GET: Read a file
   * 
   * @param {string} path - File path in repo
   * @param {Object} options - Get options (branch, step, etc.)
   * @returns {Promise<Object>} File content
   */
  async get(path, options = {}) {
    const peer = this.getCurrentPeer();
    const queryParams = new URLSearchParams(options).toString();
    const url = `${peer}${path}${queryParams ? `?${queryParams}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: options.headers || {}
      });

      if (!response.ok) {
        throw new Error(`GET failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET error from ${url}:`, error);
      this.rotatePeer();
      throw error;
    }
  }

  /**
   * QUERY: Call a query hook
   * 
   * @param {string} repo - Repository name
   * @param {string} endpoint - Query endpoint (e.g., '/rankings')
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Query results
   */
  async query(repo, endpoint, params = {}) {
    const path = `/repos/${repo}/query${endpoint}`;
    return await this.get(path, params);
  }

  /**
   * DELETE: Delete a file (archive in Git)
   * 
   * @param {string} path - File path in repo
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Deletion result
   */
  async delete(path, options = {}) {
    const peer = this.getCurrentPeer();
    const url = `${peer}${path}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: options.headers || {}
      });

      if (!response.ok) {
        throw new Error(`DELETE failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`DELETE error to ${url}:`, error);
      this.rotatePeer();
      throw error;
    }
  }

  /**
   * SSE: Subscribe to updates (Server-Sent Events)
   * 
   * @param {string} repo - Repository name
   * @param {string} endpoint - Query endpoint to poll
   * @param {Function} callback - Called on each update
   * @param {Object} options - Subscription options
   * @returns {Object} Subscription handle { close() }
   */
  subscribe(repo, endpoint, callback, options = {}) {
    const peer = this.getCurrentPeer();
    const path = `/repos/${repo}/query${endpoint}`;
    const params = new URLSearchParams({ ...options, since: options.since || 'latest' }).toString();
    const url = `${peer}${path}?${params}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      callback(error, null);
    };

    return {
      close: () => {
        eventSource.close();
      }
    };
  }

  /**
   * Poll: Periodically call a query endpoint
   * 
   * @param {string} repo - Repository name
   * @param {string} endpoint - Query endpoint
   * @param {Function} callback - Called on each poll
   * @param {Object} options - Polling options (interval, etc.)
   * @returns {Object} Poll handle { stop() }
   */
  poll(repo, endpoint, callback, options = {}) {
    const interval = options.interval || 5000; // 5 seconds default
    let lastStep = options.since || 0;

    const pollFn = async () => {
      try {
        const result = await this.query(repo, endpoint, { since: lastStep });
        if (result.step && result.step > lastStep) {
          lastStep = result.step;
          callback(null, result);
        }
      } catch (error) {
        callback(error, null);
      }
    };

    const intervalId = setInterval(pollFn, interval);
    pollFn(); // Initial poll

    return {
      stop: () => {
        clearInterval(intervalId);
      }
    };
  }
}

// Singleton instance
const relayClient = new RelayClient();

export default relayClient;
export { RelayClient };

