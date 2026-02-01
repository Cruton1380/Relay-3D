/**
 * Append-Only Event Log
 * 
 * Immutable, append-only storage for all coordination events.
 * Replaces mutable in-memory Maps with durable, auditable history.
 * 
 * RELAY PRINCIPLE: History never deleted, only reconciled.
 */

import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import logger from '../utils/logging/logger.mjs';
import crypto from 'crypto';

const eventLogger = logger.child({ module: 'event-log' });

export class EventLog {
  constructor(logName, options = {}) {
    this.logName = logName;
    this.logDir = options.logDir || join(process.cwd(), 'data', 'event-logs');
    this.logFile = join(this.logDir, `${logName}.jsonl`);
    this.cache = [];  // In-memory cache for fast queries
    this.cacheSize = options.cacheSize || 10000;
    
    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Load existing events into cache
    this.loadCache();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
      eventLogger.info('Event log directory created', { logDir: this.logDir });
    }
  }

  /**
   * Load existing events into cache
   */
  loadCache() {
    if (!existsSync(this.logFile)) {
      eventLogger.info('No existing event log', { logFile: this.logFile });
      return;
    }

    try {
      const content = readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      
      this.cache = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          eventLogger.warn('Failed to parse event log line', { error: error.message });
          return null;
        }
      }).filter(e => e !== null);

      // Keep only most recent events in cache
      if (this.cache.length > this.cacheSize) {
        this.cache = this.cache.slice(-this.cacheSize);
      }

      eventLogger.info('Event log cache loaded', {
        logName: this.logName,
        eventCount: this.cache.length
      });

    } catch (error) {
      eventLogger.error('Failed to load event log cache', {
        error: error.message,
        logFile: this.logFile
      });
      this.cache = [];
    }
  }

  /**
   * Append event to log (IMMUTABLE - NEVER DELETES)
   * 
   * @param {Object} event - Event to append
   * @returns {Promise<Object>} Appended event with metadata
   */
  async append(event) {
    try {
      // Generate event metadata
      const eventWithMetadata = {
        ...event,
        _meta: {
          eventId: event.eventId || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          logName: this.logName,
          appendedAt: Date.now(),
          sequence: this.cache.length + 1,
          hash: this.calculateEventHash(event)
        }
      };

      // Append to file (IMMUTABLE - NO OVERWRITES)
      const line = JSON.stringify(eventWithMetadata) + '\n';
      appendFileSync(this.logFile, line, 'utf8');

      // Add to cache
      this.cache.push(eventWithMetadata);
      
      // Trim cache if too large (file retains all events)
      if (this.cache.length > this.cacheSize) {
        this.cache = this.cache.slice(-this.cacheSize);
      }

      eventLogger.debug('Event appended', {
        eventId: eventWithMetadata._meta.eventId,
        sequence: eventWithMetadata._meta.sequence,
        logName: this.logName
      });

      return eventWithMetadata;

    } catch (error) {
      eventLogger.error('Failed to append event', {
        error: error.message,
        logName: this.logName
      });
      throw error;
    }
  }

  /**
   * Query events by filter
   * 
   * @param {Object} filter - Query filter
   * @returns {Array} Matching events
   */
  query(filter = {}) {
    try {
      let results = [...this.cache];

      // Filter by userId
      if (filter.userId) {
        results = results.filter(e => e.userId === filter.userId);
      }

      // Filter by topicId
      if (filter.topicId) {
        results = results.filter(e => e.topicId === filter.topicId);
      }

      // Filter by candidateId
      if (filter.candidateId) {
        results = results.filter(e => e.candidateId === filter.candidateId);
      }

      // Filter by eventType
      if (filter.eventType) {
        results = results.filter(e => e.eventType === filter.eventType);
      }

      // Filter by time range
      if (filter.startTime) {
        results = results.filter(e => e.timestamp >= filter.startTime);
      }
      if (filter.endTime) {
        results = results.filter(e => e.timestamp <= filter.endTime);
      }

      // Limit results
      if (filter.limit) {
        results = results.slice(-filter.limit);
      }

      eventLogger.debug('Event query', {
        filter,
        resultCount: results.length
      });

      return results;

    } catch (error) {
      eventLogger.error('Event query failed', {
        error: error.message,
        filter
      });
      return [];
    }
  }

  /**
   * Get most recent event matching filter
   */
  getLatest(filter = {}) {
    const results = this.query(filter);
    return results.length > 0 ? results[results.length - 1] : null;
  }

  /**
   * Get event count
   */
  count(filter = {}) {
    return this.query(filter).length;
  }

  /**
   * Calculate cryptographic hash of event
   */
  calculateEventHash(event) {
    const eventCopy = { ...event };
    delete eventCopy._meta;  // Exclude metadata from hash
    
    const eventString = JSON.stringify(eventCopy, Object.keys(eventCopy).sort());
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  /**
   * Verify event integrity
   */
  verifyEvent(event) {
    if (!event._meta || !event._meta.hash) {
      return { valid: false, reason: 'Missing hash metadata' };
    }

    const calculatedHash = this.calculateEventHash(event);
    const valid = calculatedHash === event._meta.hash;

    return {
      valid,
      reason: valid ? 'Hash verified' : 'Hash mismatch',
      calculatedHash,
      storedHash: event._meta.hash
    };
  }

  /**
   * Get log statistics
   */
  getStats() {
    return {
      logName: this.logName,
      logFile: this.logFile,
      cacheSize: this.cache.length,
      oldestCached: this.cache.length > 0 ? this.cache[0]._meta.appendedAt : null,
      newestCached: this.cache.length > 0 ? this.cache[this.cache.length - 1]._meta.appendedAt : null,
      exists: existsSync(this.logFile)
    };
  }
}

export default EventLog;
