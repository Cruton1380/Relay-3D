/**
 * PostgreSQL + PostGIS Storage (SKELETON - NOT ENABLED)
 * 
 * Scalable storage for production with spatial indexing.
 * 
 * Setup required:
 * 1. Install PostgreSQL: https://www.postgresql.org/download/
 * 2. Install PostGIS extension: CREATE EXTENSION postgis;
 * 3. Run schema: psql -f src/backend/storage/postgres-schema.sql
 * 4. Set environment variables:
 *    - POSTGRES_HOST=localhost
 *    - POSTGRES_PORT=5432
 *    - POSTGRES_DB=relay_voters
 *    - POSTGRES_USER=postgres
 *    - POSTGRES_PASSWORD=your_password
 * 5. Enable in config: USE_POSTGRES_STORAGE=true
 * 
 * Performance:
 * - Insert: ~10k/s (bulk)
 * - Query: <50ms for millions of voters
 * - Memory: ~50MB (only active queries in RAM)
 * 
 * Limits:
 * - Requires PostgreSQL server
 * - Slower than in-memory for <100k voters
 * - More complex setup
 */

import { StorageInterface } from './StorageInterface.mjs';
import logger from '../utils/logging/logger.mjs';

const storageLogger = logger.child({ module: 'postgres-storage' });

export class PostgresStorage extends StorageInterface {
  constructor() {
    super();
    this.pool = null;
    this.initialized = false;
  }

  async init(config = {}) {
    if (this.initialized) {
      storageLogger.warn('PostgresStorage already initialized');
      return;
    }

    // Check if pg module is installed
    try {
      const pg = await import('pg');
      const { Pool } = pg.default || pg;

      this.pool = new Pool({
        host: config.host || process.env.POSTGRES_HOST || 'localhost',
        port: config.port || process.env.POSTGRES_PORT || 5432,
        database: config.database || process.env.POSTGRES_DB || 'relay_voters',
        user: config.user || process.env.POSTGRES_USER || 'postgres',
        password: config.password || process.env.POSTGRES_PASSWORD,
        max: config.maxConnections || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT PostGIS_version()');
      client.release();

      storageLogger.info('PostgresStorage initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      storageLogger.error('Failed to initialize PostgresStorage', { error: error.message });
      throw new Error(`PostgreSQL connection failed: ${error.message}. Install with: npm install pg`);
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      storageLogger.info('PostgresStorage connection closed');
    }
    this.initialized = false;
    return true;
  }

  async insertVoter(voter) {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const query = `
      INSERT INTO voters (
        user_id, candidate_id, channel_id, privacy_level,
        location, city, province, country, created_at
      ) VALUES (
        $1, $2, $3, $4,
        ST_SetSRID(ST_MakePoint($5, $6), 4326),
        $7, $8, $9, $10
      )
      ON CONFLICT (user_id) DO UPDATE SET
        candidate_id = EXCLUDED.candidate_id,
        location = EXCLUDED.location,
        privacy_level = EXCLUDED.privacy_level
    `;

    const values = [
      voter.userId,
      voter.candidateId,
      voter.channelId,
      voter.privacyLevel,
      voter.location.lng,
      voter.location.lat,
      voter.location.city || null,
      voter.location.province || null,
      voter.location.country || null,
      voter.createdAt || new Date()
    ];

    await this.pool.query(query, values);
    return true;
  }

  async insertVoters(voters) {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let inserted = 0;
      for (const voter of voters) {
        try {
          await this.insertVoter(voter);
          inserted++;
        } catch (error) {
          storageLogger.error('Failed to insert voter', { userId: voter.userId, error: error.message });
        }
      }

      await client.query('COMMIT');
      storageLogger.info('Bulk insert complete', { inserted, total: voters.length });
      return inserted;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getVotersByBBox(query) {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const {
      candidateId,
      bbox,
      limit = 1000,
      offset = 0,
      privacyLevel
    } = query;

    if (!bbox) {
      throw new Error('bbox required');
    }

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Spatial query using PostGIS
    conditions.push(`ST_Intersects(
      location,
      ST_MakeEnvelope($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, 4326)
    )`);
    values.push(bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat);
    paramIndex += 4;

    if (candidateId) {
      conditions.push(`candidate_id = $${paramIndex}`);
      values.push(candidateId);
      paramIndex++;
    }

    if (privacyLevel) {
      conditions.push(`privacy_level = $${paramIndex}`);
      values.push(privacyLevel);
      paramIndex++;
    }

    const sql = `
      SELECT 
        user_id, candidate_id, channel_id, privacy_level,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng,
        city, province, country, created_at
      FROM voters
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex+1}
    `;

    values.push(limit, offset);

    const result = await this.pool.query(sql, values);

    return result.rows.map(row => ({
      userId: row.user_id,
      candidateId: row.candidate_id,
      channelId: row.channel_id,
      privacyLevel: row.privacy_level,
      location: {
        lat: row.lat,
        lng: row.lng,
        city: row.city,
        province: row.province,
        country: row.country
      },
      createdAt: row.created_at
    }));
  }

  async getVoterById(userId) {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const result = await this.pool.query(`
      SELECT 
        user_id, candidate_id, channel_id, privacy_level,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng,
        city, province, country, created_at
      FROM voters
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      candidateId: row.candidate_id,
      channelId: row.channel_id,
      privacyLevel: row.privacy_level,
      location: {
        lat: row.lat,
        lng: row.lng,
        city: row.city,
        province: row.province,
        country: row.country
      },
      createdAt: row.created_at
    };
  }

  async count(query = {}) {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const { candidateId, channelId, privacyLevel, bbox } = query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (bbox) {
      conditions.push(`ST_Intersects(
        location,
        ST_MakeEnvelope($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, 4326)
      )`);
      values.push(bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat);
      paramIndex += 4;
    }

    if (candidateId) {
      conditions.push(`candidate_id = $${paramIndex}`);
      values.push(candidateId);
      paramIndex++;
    }

    if (channelId) {
      conditions.push(`channel_id = $${paramIndex}`);
      values.push(channelId);
      paramIndex++;
    }

    if (privacyLevel) {
      conditions.push(`privacy_level = $${paramIndex}`);
      values.push(privacyLevel);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM voters ${whereClause}`;

    const result = await this.pool.query(sql, values);
    return parseInt(result.rows[0].count, 10);
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
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const result = await this.pool.query('DELETE FROM voters WHERE user_id = $1', [userId]);
    return result.rowCount > 0;
  }

  async clear() {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const result = await this.pool.query('DELETE FROM voters');
    storageLogger.info('Storage cleared', { deletedVoters: result.rowCount });
    return true;
  }

  async getStats() {
    if (!this.initialized) {
      throw new Error('PostgresStorage not initialized');
    }

    const totalResult = await this.pool.query('SELECT COUNT(*) as count FROM voters');
    const byCandidateResult = await this.pool.query(`
      SELECT candidate_id, COUNT(*) as count
      FROM voters
      GROUP BY candidate_id
    `);
    const byPrivacyResult = await this.pool.query(`
      SELECT privacy_level, COUNT(*) as count
      FROM voters
      GROUP BY privacy_level
    `);

    return {
      totalVoters: parseInt(totalResult.rows[0].count, 10),
      byCandidateId: Object.fromEntries(
        byCandidateResult.rows.map(r => [r.candidate_id, parseInt(r.count, 10)])
      ),
      byPrivacyLevel: Object.fromEntries(
        byPrivacyResult.rows.map(r => [r.privacy_level, parseInt(r.count, 10)])
      ),
      storageType: 'postgresql'
    };
  }
}

