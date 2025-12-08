/**
 * In-Memory Storage with R-tree Spatial Indexing
 * 
 * Fast, zero-setup storage for development and testing.
 * Uses rbush R-tree for O(log n) spatial queries.
 * 
 * Performance:
 * - Insert: ~350k/s
 * - Query: <1ms for 100k voters
 * - Memory: ~500 bytes per voter
 * 
 * Limits:
 * - Max ~100k voters per candidate (memory)
 * - No persistence (data lost on restart)
 * - Single-process only
 */

import RBush from 'rbush';
import { StorageInterface } from './StorageInterface.mjs';
import logger from '../utils/logging/logger.mjs';

const storageLogger = logger.child({ module: 'inmemory-storage' });

export class InMemoryStorage extends StorageInterface {
  constructor() {
    super();
    
    // Primary storage: userId → voter data
    this.voters = new Map();
    
    // Spatial index: R-tree for bbox queries
    this.spatialIndex = new RBush();
    
    // Secondary indexes for fast lookups
    this.byCandidateId = new Map(); // candidateId → Set<userId>
    this.byChannelId = new Map();   // channelId → Set<userId>
    this.byPrivacyLevel = new Map(); // privacyLevel → Set<userId>
    
    this.initialized = false;
  }

  async init(config = {}) {
    if (this.initialized) {
      storageLogger.warn('InMemoryStorage already initialized');
      return;
    }

    storageLogger.info('Initializing InMemoryStorage');
    this.initialized = true;
    
    return true;
  }

  async close() {
    storageLogger.info('Closing InMemoryStorage', { totalVoters: this.voters.size });
    
    this.voters.clear();
    this.spatialIndex.clear();
    this.byCandidateId.clear();
    this.byChannelId.clear();
    this.byPrivacyLevel.clear();
    
    this.initialized = false;
    return true;
  }

  async insertVoter(voter) {
    if (!voter.userId || !voter.candidateId || !voter.channelId) {
      throw new Error('Missing required fields: userId, candidateId, channelId');
    }

    if (!voter.location || typeof voter.location.lat !== 'number' || typeof voter.location.lng !== 'number') {
      throw new Error('Missing or invalid location: {lat, lng} required');
    }

    // Store voter data
    this.voters.set(voter.userId, {
      ...voter,
      createdAt: voter.createdAt || new Date()
    });

    // Add to spatial index (R-tree requires minX, minY, maxX, maxY)
    this.spatialIndex.insert({
      minX: voter.location.lng,
      minY: voter.location.lat,
      maxX: voter.location.lng,
      maxY: voter.location.lat,
      userId: voter.userId
    });

    // Update secondary indexes
    this._addToIndex(this.byCandidateId, voter.candidateId, voter.userId);
    this._addToIndex(this.byChannelId, voter.channelId, voter.userId);
    this._addToIndex(this.byPrivacyLevel, voter.privacyLevel, voter.userId);

    return true;
  }

  async insertVoters(voters) {
    let inserted = 0;
    
    for (const voter of voters) {
      try {
        await this.insertVoter(voter);
        inserted++;
      } catch (error) {
        storageLogger.error('Failed to insert voter', { userId: voter.userId, error: error.message });
      }
    }

    storageLogger.info('Bulk insert complete', { inserted, total: voters.length });
    return inserted;
  }

  async getVotersByBBox(query) {
    const {
      candidateId,
      bbox,
      limit = 1000,
      offset = 0,
      privacyLevel
    } = query;

    if (!bbox || typeof bbox.minLat !== 'number' || typeof bbox.maxLat !== 'number' ||
        typeof bbox.minLng !== 'number' || typeof bbox.maxLng !== 'number') {
      throw new Error('Invalid bbox: {minLat, maxLat, minLng, maxLng} required');
    }

    const startTime = Date.now();

    // Step 1: Spatial query (R-tree) - O(log n)
    const spatialResults = this.spatialIndex.search({
      minX: bbox.minLng,
      minY: bbox.minLat,
      maxX: bbox.maxLng,
      maxY: bbox.maxLat
    });

    // Step 2: Filter by candidateId and privacyLevel
    let userIds = spatialResults.map(r => r.userId);

    if (candidateId) {
      const candidateUserIds = this.byCandidateId.get(candidateId);
      if (!candidateUserIds) {
        return []; // No voters for this candidate
      }
      userIds = userIds.filter(id => candidateUserIds.has(id));
    }

    if (privacyLevel) {
      const privacyUserIds = this.byPrivacyLevel.get(privacyLevel);
      if (!privacyUserIds) {
        return []; // No voters with this privacy level
      }
      userIds = userIds.filter(id => privacyUserIds.has(id));
    }

    // Step 3: Pagination
    const paginatedIds = userIds.slice(offset, offset + limit);

    // Step 4: Fetch full voter data
    const voters = paginatedIds.map(id => this.voters.get(id)).filter(Boolean);

    const queryTime = Date.now() - startTime;
    storageLogger.debug('Bbox query complete', {
      spatialResults: spatialResults.length,
      filtered: userIds.length,
      returned: voters.length,
      queryTime: `${queryTime}ms`
    });

    return voters;
  }

  async getVoterById(userId) {
    return this.voters.get(userId) || null;
  }

  async count(query = {}) {
    const { candidateId, channelId, privacyLevel, bbox } = query;

    // If bbox provided, use spatial query
    if (bbox) {
      const voters = await this.getVotersByBBox({ ...query, limit: Infinity });
      return voters.length;
    }

    // Otherwise use secondary indexes
    if (candidateId) {
      const userIds = this.byCandidateId.get(candidateId);
      return userIds ? userIds.size : 0;
    }

    if (channelId) {
      const userIds = this.byChannelId.get(channelId);
      return userIds ? userIds.size : 0;
    }

    if (privacyLevel) {
      const userIds = this.byPrivacyLevel.get(privacyLevel);
      return userIds ? userIds.size : 0;
    }

    // Total count
    return this.voters.size;
  }

  async streamByBBox(query, callback, batchSize = 1000) {
    let offset = 0;
    let totalStreamed = 0;
    let batch;

    do {
      batch = await this.getVotersByBBox({ ...query, limit: batchSize, offset });
      
      if (batch.length > 0) {
        await callback(batch);
        totalStreamed += batch.length;
        offset += batchSize;
      }
    } while (batch.length === batchSize);

    return totalStreamed;
  }

  async deleteVoter(userId) {
    const voter = this.voters.get(userId);
    if (!voter) {
      return false;
    }

    // Remove from primary storage
    this.voters.delete(userId);

    // Remove from spatial index
    this.spatialIndex.remove({
      minX: voter.location.lng,
      minY: voter.location.lat,
      maxX: voter.location.lng,
      maxY: voter.location.lat,
      userId: voter.userId
    }, (a, b) => a.userId === b.userId);

    // Remove from secondary indexes
    this._removeFromIndex(this.byCandidateId, voter.candidateId, userId);
    this._removeFromIndex(this.byChannelId, voter.channelId, userId);
    this._removeFromIndex(this.byPrivacyLevel, voter.privacyLevel, userId);

    return true;
  }

  async clear() {
    const count = this.voters.size;
    
    this.voters.clear();
    this.spatialIndex.clear();
    this.byCandidateId.clear();
    this.byChannelId.clear();
    this.byPrivacyLevel.clear();

    storageLogger.info('Storage cleared', { deletedVoters: count });
    return true;
  }

  async getStats() {
    const memoryUsage = process.memoryUsage();
    
    return {
      totalVoters: this.voters.size,
      byCandidateId: Object.fromEntries(
        Array.from(this.byCandidateId.entries()).map(([k, v]) => [k, v.size])
      ),
      byPrivacyLevel: Object.fromEntries(
        Array.from(this.byPrivacyLevel.entries()).map(([k, v]) => [k, v.size])
      ),
      spatialIndexSize: this.spatialIndex.all().length,
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      storageType: 'in-memory'
    };
  }

  // Helper: Add to secondary index
  _addToIndex(index, key, userId) {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key).add(userId);
  }

  // Helper: Remove from secondary index
  _removeFromIndex(index, key, userId) {
    const set = index.get(key);
    if (set) {
      set.delete(userId);
      if (set.size === 0) {
        index.delete(key);
      }
    }
  }
}

