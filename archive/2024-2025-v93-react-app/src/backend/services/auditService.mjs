/**
 * @fileoverview Audit Service
 * Tracks all vote transactions with blockchain hashes for compliance and traceability
 */
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logging/logger.mjs';

const auditLogger = logger.child({ module: 'audit' });

// Configuration
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const AUDIT_DIR = path.join(DATA_DIR, 'audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'vote-audit.jsonl');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB rotation threshold

class AuditService {
  constructor() {
    this.initialized = false;
    this.currentFileHash = null; // Hashchain between rotated files
    this.initialize();
  }

  /**
   * Initialize audit service and ensure directory exists
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(AUDIT_DIR, { recursive: true });
      this.initialized = true;
      auditLogger.info('Audit service initialized', { auditFile: AUDIT_FILE });
    } catch (error) {
      auditLogger.error('Failed to initialize audit service', { error: error.message });
      throw error;
    }
  }

  /**
   * Record a vote transaction to audit log
   * @param {Object} auditEntry - Audit entry data
   */
  async recordVoteTransaction(auditEntry) {
    await this.initialize();

    try {
      const entry = {
        timestamp: new Date().toISOString(),
        ...auditEntry,
        // Ensure both critical hashes are present
        transactionHash: auditEntry.transactionHash || null,
        voteHash: auditEntry.voteHash || null
      };

      // Append to audit log (JSONL format - one JSON object per line)
      const line = JSON.stringify(entry) + '\n';
      await fs.appendFile(AUDIT_FILE, line, 'utf8');

      auditLogger.info('Vote transaction recorded', {
        voteId: entry.voteId,
        transactionHash: entry.transactionHash,
        voteHash: entry.voteHash
      });

      return entry;
    } catch (error) {
      auditLogger.error('Failed to record vote transaction', {
        error: error.message,
        voteId: auditEntry.voteId
      });
      throw error;
    }
  }

  /**
   * Update audit entry when vote is confirmed on blockchain
   * @param {string} voteId - Vote identifier
   * @param {number} blockNumber - Block number where transaction was mined
   * @param {string} blockHash - Hash of the block
   */
  async updateVoteConfirmation(voteId, blockNumber, blockHash) {
    await this.initialize();

    try {
      const confirmationEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'vote_confirmed',
        voteId,
        blockNumber,
        blockHash,
        confirmations: 1 // Will increment with subsequent blocks
      };

      const line = JSON.stringify(confirmationEntry) + '\n';
      await fs.appendFile(AUDIT_FILE, line, 'utf8');

      auditLogger.info('Vote confirmation recorded', {
        voteId,
        blockNumber,
        blockHash
      });

      return confirmationEntry;
    } catch (error) {
      auditLogger.error('Failed to record vote confirmation', {
        error: error.message,
        voteId
      });
      throw error;
    }
  }

  /**
   * Query audit log for specific vote
   * @param {string} voteId - Vote identifier
   * @returns {Array} All audit entries for this vote
   */
  async getVoteAuditTrail(voteId) {
    await this.initialize();

    try {
      const fileContent = await fs.readFile(AUDIT_FILE, 'utf8');
      const lines = fileContent.trim().split('\n');
      
      const entries = lines
        .map(line => JSON.parse(line))
        .filter(entry => entry.voteId === voteId);

      return entries;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No audit file yet
      }
      
      auditLogger.error('Failed to retrieve audit trail', {
        error: error.message,
        voteId
      });
      throw error;
    }
  }

  /**
   * Get all audit entries for a specific user
   * @param {string} userId - User identifier
   * @returns {Array} All audit entries for this user
   */
  async getUserAuditTrail(userId) {
    await this.initialize();

    try {
      const fileContent = await fs.readFile(AUDIT_FILE, 'utf8');
      const lines = fileContent.trim().split('\n');
      
      const entries = lines
        .map(line => JSON.parse(line))
        .filter(entry => entry.userId === userId);

      return entries;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      
      auditLogger.error('Failed to retrieve user audit trail', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Verify vote integrity by comparing stored hashes
   * @param {string} voteId - Vote identifier
   * @param {string} expectedVoteHash - Hash to verify against
   * @returns {Object} Verification result
   */
  async verifyVoteIntegrity(voteId, expectedVoteHash) {
    const auditTrail = await this.getVoteAuditTrail(voteId);
    
    if (auditTrail.length === 0) {
      return {
        valid: false,
        reason: 'No audit trail found'
      };
    }

    const originalEntry = auditTrail.find(e => e.voteHash);
    
    if (!originalEntry) {
      return {
        valid: false,
        reason: 'No vote hash in audit trail'
      };
    }

    const matches = originalEntry.voteHash === expectedVoteHash;
    
    return {
      valid: matches,
      reason: matches ? 'Hash matches' : 'Hash mismatch',
      storedHash: originalEntry.voteHash,
      providedHash: expectedVoteHash,
      auditTrail
    };
  }

  /**
   * Check if audit file needs rotation
   * @returns {boolean} True if rotation needed
   */
  async shouldRotate() {
    try {
      const stats = await fs.stat(AUDIT_FILE);
      return stats.size >= MAX_FILE_SIZE;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rotate audit log with hashchain preservation
   * Creates a new file and links it to the previous via hash
   */
  async rotateLog() {
    try {
      // Read current file content
      const currentContent = await fs.readFile(AUDIT_FILE, 'utf8');
      
      // Compute hash of entire current file
      const crypto = await import('crypto');
      this.currentFileHash = crypto.createHash('sha256').update(currentContent).digest('hex');
      
      // Create rotated filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = path.join(AUDIT_DIR, `vote-audit-${timestamp}.jsonl`);
      
      // Move current file to rotated name
      await fs.rename(AUDIT_FILE, rotatedFile);
      
      // Create new audit file with hashchain header
      const headerEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'audit_rotation',
        previousFileHash: this.currentFileHash,
        previousFile: path.basename(rotatedFile),
        message: 'Audit log rotated - hashchain preserved'
      };
      
      await fs.writeFile(AUDIT_FILE, JSON.stringify(headerEntry) + '\n', 'utf8');
      
      auditLogger.info('Audit log rotated', {
        previousFile: rotatedFile,
        previousFileHash: this.currentFileHash
      });
      
      return {
        success: true,
        rotatedFile,
        fileHash: this.currentFileHash
      };
    } catch (error) {
      auditLogger.error('Failed to rotate audit log', { error: error.message });
      throw error;
    }
  }

  /**
   * Record with automatic rotation check
   * @param {Object} auditEntry - Audit entry data
   */
  async recordWithRotation(auditEntry) {
    // Check if rotation needed before writing
    if (await this.shouldRotate()) {
      await this.rotateLog();
    }
    
    return await this.recordVoteTransaction(auditEntry);
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;
