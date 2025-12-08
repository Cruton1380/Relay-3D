/**
 * Blockchain Service
 * Handles blockchain integration for vote recording
 */

import logger from '../utils/logging/logger.mjs';
import fs from 'fs/promises';
import path from 'path';

const blockchainLogger = logger.child({ module: 'blockchain' });

class BlockchainService {
  constructor() {
    this.isTestMode = process.env.NODE_ENV !== 'production';
    this.testDataPath = './data/blockchain_data.json';
    this.testData = {
      votes: {},
      revocations: {},
      lastBlock: 0
    };
  }

  async init() {
    if (this.isTestMode) {
      try {
        const data = await fs.readFile(this.testDataPath, 'utf8');
        this.testData = JSON.parse(data);
      } catch (error) {
        // If file doesn't exist, create it with initial data
        await this.saveTestData();
      }
    }
  }

  async saveTestData() {
    if (this.isTestMode) {
      const dir = path.dirname(this.testDataPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.testDataPath, JSON.stringify(this.testData, null, 2));
    }
  }

  async recordVote({ voteId, userId, topic, choice, signature, timestamp }) {
    if (this.isTestMode) {
      this.testData.votes[voteId] = {
        userId,
        topic,
        choice,
        signature,
        timestamp,
        blockNumber: ++this.testData.lastBlock
      };
      await this.saveTestData();
      return { blockNumber: this.testData.lastBlock };
    } else {
      // Production blockchain integration would go here
      throw new Error('Production blockchain integration not implemented');
    }
  }

  async recordRevocation({ voteId, userId, topic, signature, timestamp }) {
    if (this.isTestMode) {
      this.testData.revocations[voteId] = {
        userId,
        topic,
        signature,
        timestamp,
        blockNumber: ++this.testData.lastBlock
      };
      await this.saveTestData();
      return { blockNumber: this.testData.lastBlock };
    } else {
      // Production blockchain integration would go here
      throw new Error('Production blockchain integration not implemented');
    }
  }

  async getVoteRecord(voteId) {
    if (this.isTestMode) {
      return this.testData.votes[voteId];
    } else {
      // Production blockchain query would go here
      throw new Error('Production blockchain integration not implemented');
    }
  }

  async getRevocationRecord(voteId) {
    if (this.isTestMode) {
      return this.testData.revocations[voteId];
    } else {
      // Production blockchain query would go here
      throw new Error('Production blockchain integration not implemented');
    }
  }
}

export const blockchain = new BlockchainService();
await blockchain.init();

export default blockchain; 
