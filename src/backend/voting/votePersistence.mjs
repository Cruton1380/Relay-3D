/**
 * Vote Persistence System
 * Ensures vote data is properly saved and restored across sessions
 */

import logger from '../utils/logging/logger.mjs';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PATHS } from '../config/paths.mjs';

const persistenceLogger = logger.child({ module: 'vote-persistence' });

class VotePersistence {
  constructor() {
    this.persistenceFile = join(PATHS.VOTING_DATA, 'vote-persistence.json');
    this.backupFile = join(PATHS.VOTING_DATA, 'vote-persistence.backup.json');
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = null;
  }

  /**
   * Save vote data to persistent storage
   */
  async saveVoteData(voteData) {
    try {
      // Create backup of existing data
      if (existsSync(this.persistenceFile)) {
        const existingData = readFileSync(this.persistenceFile, 'utf8');
        writeFileSync(this.backupFile, existingData);
      }

      // Save current data
      const dataToSave = {
        timestamp: Date.now(),
        version: '1.0.0',
        data: voteData,
        checksum: this.calculateChecksum(voteData)
      };

      writeFileSync(this.persistenceFile, JSON.stringify(dataToSave, null, 2));
      
      persistenceLogger.info('Vote data saved successfully', {
        topics: Object.keys(voteData.topics || {}).length,
        totalVotes: voteData.totalVotes || 0,
        checksum: dataToSave.checksum
      });

      return true;
    } catch (error) {
      persistenceLogger.error('Failed to save vote data:', error);
      return false;
    }
  }

  /**
   * Load vote data from persistent storage
   */
  async loadVoteData() {
    try {
      if (!existsSync(this.persistenceFile)) {
        persistenceLogger.info('No persistent vote data found, starting fresh');
        return this.getDefaultVoteData();
      }

      const rawData = readFileSync(this.persistenceFile, 'utf8');
      const savedData = JSON.parse(rawData);

      // Validate data integrity
      if (!this.validateDataIntegrity(savedData)) {
        persistenceLogger.warn('Data integrity check failed, attempting to restore from backup');
        return await this.loadFromBackup();
      }

      persistenceLogger.info('Vote data loaded successfully', {
        timestamp: savedData.timestamp,
        version: savedData.version,
        topics: Object.keys(savedData.data.topics || {}).length
      });

      return savedData.data;
    } catch (error) {
      persistenceLogger.error('Failed to load vote data:', error);
      return await this.loadFromBackup();
    }
  }

  /**
   * Load data from backup file
   */
  async loadFromBackup() {
    try {
      if (!existsSync(this.backupFile)) {
        persistenceLogger.warn('No backup file found, returning default data');
        return this.getDefaultVoteData();
      }

      const rawData = readFileSync(this.backupFile, 'utf8');
      const backupData = JSON.parse(rawData);

      if (this.validateDataIntegrity(backupData)) {
        persistenceLogger.info('Successfully restored from backup');
        return backupData.data;
      } else {
        persistenceLogger.error('Backup data is also corrupted, using defaults');
        return this.getDefaultVoteData();
      }
    } catch (error) {
      persistenceLogger.error('Failed to load from backup:', error);
      return this.getDefaultVoteData();
    }
  }

  /**
   * Validate data integrity
   */
  validateDataIntegrity(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.timestamp || !data.version || !data.data) {
      return false;
    }

    // Verify checksum
    const calculatedChecksum = this.calculateChecksum(data.data);
    if (data.checksum !== calculatedChecksum) {
      persistenceLogger.warn('Checksum mismatch detected');
      return false;
    }

    return true;
  }

  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(data) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Get default vote data structure
   */
  getDefaultVoteData() {
    return {
      topics: {},
      totalVotes: 0,
      lastUpdated: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave(getCurrentVoteData) {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      try {
        const currentData = getCurrentVoteData();
        await this.saveVoteData(currentData);
      } catch (error) {
        persistenceLogger.error('Auto-save failed:', error);
      }
    }, this.autoSaveInterval);

    persistenceLogger.info('Auto-save started', {
      interval: this.autoSaveInterval
    });
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      persistenceLogger.info('Auto-save stopped');
    }
  }

  /**
   * Force immediate save
   */
  async forceSave(getCurrentVoteData) {
    try {
      const currentData = getCurrentVoteData();
      const success = await this.saveVoteData(currentData);
      
      if (success) {
        persistenceLogger.info('Force save completed successfully');
      } else {
        persistenceLogger.error('Force save failed');
      }
      
      return success;
    } catch (error) {
      persistenceLogger.error('Force save error:', error);
      return false;
    }
  }
}

export default VotePersistence;
