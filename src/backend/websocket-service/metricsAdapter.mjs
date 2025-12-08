/**
 * @fileoverview WebSocket metrics adapter for collecting performance statistics
 */
import BaseAdapter from './adapterBase.mjs';
import logger from '../utils/logging/logger.mjs';
import eventBus from '../event-bus/index.mjs';

class MetricsAdapter extends BaseAdapter {
  constructor() {
    // Set requiresAuth to false so metrics work even for non-authenticated clients
    super('metrics', false);
    
    // Initialize metrics storage
    this.metrics = {
      connections: {
        current: 0,
        peak: 0,
        total: 0,
        byUserAgent: new Map()
      },
      messages: {
        received: 0,
        sent: 0,
        byType: new Map(),
        byClient: new Map()
      },
      errors: {
        count: 0,
        byType: new Map()
      },
      latency: {
        samples: [],
        average: 0,
        min: Number.MAX_SAFE_INTEGER,
        max: 0
      },
      startTime: Date.now()
    };
    
    // Set up metric collection intervals
    this.snapshotInterval = null;
    
    // Bind methods
    this.handleWebSocketEvent = this.handleWebSocketEvent.bind(this);
  }

  initialize(wsService) {
    super.initialize(wsService);
    
    // Subscribe to WebSocket events for metrics collection
    eventBus.on('websocket.connect', this.handleWebSocketEvent);
    eventBus.on('websocket.disconnect', this.handleWebSocketEvent);
    eventBus.on('websocket.message', this.handleWebSocketEvent);
    eventBus.on('websocket.error', this.handleWebSocketEvent);
    
    // Set up periodic snapshots for time-series metrics
    this.snapshotInterval = setInterval(() => this.takeMetricsSnapshot(), 60000);
    
    logger.info('Metrics adapter initialized');
    return this;
  }

  shutdown() {
    // Clean up event listeners
    eventBus.off('websocket.connect', this.handleWebSocketEvent);
    eventBus.off('websocket.disconnect', this.handleWebSocketEvent);
    eventBus.off('websocket.message', this.handleWebSocketEvent);
    eventBus.off('websocket.error', this.handleWebSocketEvent);
    
    // Clear intervals
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    logger.info('Metrics adapter shut down');
  }

  handleWebSocketEvent(event) {
    const { type, client, data } = event;
    
    switch (type) {
      case 'connect':
        this.recordConnection(client);
        break;
      case 'disconnect':
        this.recordDisconnection(client);
        break;
      case 'message':
        this.recordMessage(client, data);
        break;
      case 'error':
        this.recordError(client, data);
        break;
      default:
        // Ignore unknown event types
    }
  }

  recordConnection(client) {
    // Increment connection counters
    this.metrics.connections.current++;
    this.metrics.connections.total++;
    
    // Update peak if necessary
    if (this.metrics.connections.current > this.metrics.connections.peak) {
      this.metrics.connections.peak = this.metrics.connections.current;
    }
    
    // Record user agent if available
    const userAgent = client.userAgent || 'unknown';
    const userAgentCount = this.metrics.connections.byUserAgent.get(userAgent) || 0;
    this.metrics.connections.byUserAgent.set(userAgent, userAgentCount + 1);
  }

  recordDisconnection(client) {
    // Decrement current connection counter
    this.metrics.connections.current = Math.max(0, this.metrics.connections.current - 1);
    
    // Update user agent metrics if available
    const userAgent = client.userAgent || 'unknown';
    const userAgentCount = this.metrics.connections.byUserAgent.get(userAgent) || 0;
    if (userAgentCount > 0) {
      this.metrics.connections.byUserAgent.set(userAgent, userAgentCount - 1);
    }
  }

  recordMessage(client, message) {
    // Increment message counter
    this.metrics.messages.received++;
    
    // Update message type counts
    const messageType = message?.type || 'unknown';
    const typeCount = this.metrics.messages.byType.get(messageType) || 0;
    this.metrics.messages.byType.set(messageType, typeCount + 1);
    
    // Update per-client message counts
    const clientId = client?.id || 'unknown';
    const clientCount = this.metrics.messages.byClient.get(clientId) || 0;
    this.metrics.messages.byClient.set(clientId, clientCount + 1);
    
    // Record latency if timestamp is available
    if (message?.timestamp) {
      const latency = Date.now() - message.timestamp;
      this.recordLatency(latency);
    }
  }

  recordError(client, error) {
    // Increment error counter
    this.metrics.errors.count++;
    
    // Update error type counts
    const errorType = error?.type || 'unknown';
    const typeCount = this.metrics.errors.byType.get(errorType) || 0;
    this.metrics.errors.byType.set(errorType, typeCount + 1);
  }

  recordLatency(latency) {
    // Store latency sample (keep only last 100 samples)
    this.metrics.latency.samples.push(latency);
    if (this.metrics.latency.samples.length > 100) {
      this.metrics.latency.samples.shift();
    }
    
    // Update min/max
    this.metrics.latency.min = Math.min(this.metrics.latency.min, latency);
    this.metrics.latency.max = Math.max(this.metrics.latency.max, latency);
    
    // Recalculate average
    const sum = this.metrics.latency.samples.reduce((acc, val) => acc + val, 0);
    this.metrics.latency.average = sum / this.metrics.latency.samples.length;
  }

  takeMetricsSnapshot() {
    // Create a snapshot of current metrics for time-series analysis
    const snapshot = {
      timestamp: Date.now(),
      connections: {
        current: this.metrics.connections.current,
        peak: this.metrics.connections.peak
      },
      messages: {
        received: this.metrics.messages.received,
        sent: this.metrics.messages.sent
      },
      errors: {
        count: this.metrics.errors.count
      },
      latency: {
        average: this.metrics.latency.average,
        min: this.metrics.latency.min,
        max: this.metrics.latency.max
      }
    };
    
    // Emit metric snapshot event for other services to consume
    eventBus.emit('metrics.snapshot', snapshot);
    
    // Log periodic metrics summary
    logger.debug('WebSocket metrics snapshot:', snapshot);
  }

  async handleMessage(client, message) {
    if (message.action === 'getMetrics' && client.isAuthenticated) {
      // Check if client has admin privileges
      if (!client.userData?.isAdmin) {
        this.service.sendToClient(client.id, {
          type: 'metrics',
          action: 'error',
          data: { message: 'Unauthorized access to metrics' }
        });
        return;
      }
      
      // Send metrics data to client
      this.service.sendToClient(client.id, {
        type: 'metrics',
        action: 'data',
        data: {
          metrics: this.getMetricsReport(),
          timestamp: Date.now()
        }
      });
    }
  }

  getMetricsReport() {
    // Calculate uptime
    const uptime = Date.now() - this.metrics.startTime;
    
    // Convert Maps to regular objects for JSON serialization
    const byUserAgent = Object.fromEntries(this.metrics.connections.byUserAgent);
    const messagesByType = Object.fromEntries(this.metrics.messages.byType);
    const errorsByType = Object.fromEntries(this.metrics.errors.byType);
    
    // Return formatted metrics report
    return {
      uptime,
      connections: {
        current: this.metrics.connections.current,
        peak: this.metrics.connections.peak,
        total: this.metrics.connections.total,
        byUserAgent
      },
      messages: {
        received: this.metrics.messages.received,
        sent: this.metrics.messages.sent,
        byType: messagesByType
      },
      errors: {
        count: this.metrics.errors.count,
        byType: errorsByType
      },
      latency: {
        average: this.metrics.latency.average,
        min: this.metrics.latency.min === Number.MAX_SAFE_INTEGER ? 0 : this.metrics.latency.min,
        max: this.metrics.latency.max
      }
    };
  }
}

export default new MetricsAdapter();
