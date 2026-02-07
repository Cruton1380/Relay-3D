/**
 * Context Snapshot Manager
 * 
 * Captures spatial evidence for votes: what/where/relations/when/who
 * Implements c16 commit materiality context snapshot protocol.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logging/logger.mjs';

const snapshotLogger = logger.child({ module: 'context-snapshot' });

export class ContextSnapshotManager {
  constructor() {
    this.snapshotDir = path.join(process.cwd(), '.relay', 'snapshots');
    this.ensureSnapshotDir();
  }

  /**
   * Ensure snapshot directory exists
   */
  async ensureSnapshotDir() {
    try {
      await fs.mkdir(this.snapshotDir, { recursive: true });
    } catch (error) {
      snapshotLogger.error('Failed to create snapshot directory:', error);
    }
  }

  /**
   * Capture vote context snapshot
   * 
   * @param {Object} context - Vote context
   * @returns {Promise<Object>} Snapshot metadata
   */
  async captureVoteContext(context) {
    const { voteData, userId, branchId, ringId, location, timestamp } = context;

    try {
      // Create snapshot ID
      const snapshotId = this.generateSnapshotId(voteData, userId, timestamp);

      // Build snapshot object
      const snapshot = {
        id: snapshotId,
        type: 'vote_context',
        timestamp,

        // WHAT
        content: {
          voteData: {
            candidateId: voteData.candidateId,
            topicId: voteData.topicId,
            voteWeight: voteData.voteWeight || 1.0,
            encrypted: voteData.encrypted || false
          },
          beforeState: await this.captureBeforeState(voteData),
          afterState: null // Will be set after vote is processed
        },

        // WHERE
        location: {
          branchId,
          ringId,
          geographic: location,
          filePath: this.getVoteFilePath(voteData.topicId)
        },

        // RELATIONS
        relations: {
          userId,
          relatedVotes: await this.getRelatedVotes(voteData),
          candidateRelations: await this.getCandidateRelations(voteData.candidateId),
          topicRelations: await this.getTopicRelations(voteData.topicId)
        },

        // WHEN
        temporal: {
          timestamp,
          branchAge: await this.getBranchAge(branchId),
          lastReconciliation: await this.getLastReconciliation(ringId)
        },

        // WHO
        actor: {
          userId,
          authority: await this.getUserAuthority(userId, ringId),
          voteHistory: await this.getUserVoteCount(userId)
        }
      };

      // Save snapshot to disk
      await this.saveSnapshot(snapshot);

      snapshotLogger.info('Context snapshot captured', {
        snapshotId,
        userId,
        topicId: voteData.topicId
      });

      return {
        id: snapshotId,
        path: this.getSnapshotPath(snapshotId),
        captured: true
      };

    } catch (error) {
      snapshotLogger.error('Failed to capture context snapshot:', error);
      return {
        id: null,
        captured: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique snapshot ID
   */
  generateSnapshotId(voteData, userId, timestamp) {
    const data = `${voteData.topicId}:${voteData.candidateId}:${userId}:${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Capture state before vote
   */
  async captureBeforeState(voteData) {
    return {
      currentRanking: await this.getCurrentRanking(voteData.topicId),
      candidateVoteCount: await this.getCandidateVoteCount(voteData.candidateId),
      timestamp: Date.now()
    };
  }

  /**
   * Get related votes
   */
  async getRelatedVotes(voteData) {
    // Integration point: Find other votes on same topic or candidate
    return []; // Placeholder
  }

  /**
   * Get candidate relations
   */
  async getCandidateRelations(candidateId) {
    return {
      topicsParticipating: [],
      totalVotes: 0
    }; // Placeholder
  }

  /**
   * Get topic relations
   */
  async getTopicRelations(topicId) {
    return {
      totalCandidates: 0,
      totalVotes: 0,
      activeVoters: 0
    }; // Placeholder
  }

  /**
   * Get branch age
   */
  async getBranchAge(branchId) {
    // Integration point: Git branch creation time
    return 0; // Placeholder
  }

  /**
   * Get last reconciliation timestamp
   */
  async getLastReconciliation(ringId) {
    return Date.now(); // Placeholder
  }

  /**
   * Get user authority
   */
  async getUserAuthority(userId, ringId) {
    // Integration point: User's vote weight in ring
    return {
      voteWeight: 1.0,
      ringMembership: true
    };
  }

  /**
   * Get user vote count
   */
  async getUserVoteCount(userId) {
    return {
      total: 0,
      recent: 0
    }; // Placeholder
  }

  /**
   * Get current ranking
   */
  async getCurrentRanking(topicId) {
    // Integration point: query.mjs /rankings
    return []; // Placeholder
  }

  /**
   * Get candidate vote count
   */
  async getCandidateVoteCount(candidateId) {
    return 0; // Placeholder
  }

  /**
   * Get vote file path
   */
  getVoteFilePath(topicId) {
    return `/data/votes/${topicId}.json`;
  }

  /**
   * Get snapshot file path
   */
  getSnapshotPath(snapshotId) {
    return path.join(this.snapshotDir, `${snapshotId}.json`);
  }

  /**
   * Save snapshot to disk
   */
  async saveSnapshot(snapshot) {
    const filePath = this.getSnapshotPath(snapshot.id);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  /**
   * Load snapshot from disk
   */
  async loadSnapshot(snapshotId) {
    try {
      const filePath = this.getSnapshotPath(snapshotId);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      snapshotLogger.error('Failed to load snapshot:', error);
      return null;
    }
  }

  /**
   * Update snapshot with after state
   */
  async updateAfterState(snapshotId, afterState) {
    const snapshot = await this.loadSnapshot(snapshotId);
    if (snapshot) {
      snapshot.content.afterState = afterState;
      await this.saveSnapshot(snapshot);
    }
  }
}
