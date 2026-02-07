import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logging/logger.mjs';
import { createError } from '../utils/common/errors.mjs';
import configService from '../config-service/index.mjs';

// Create database logger
const dbLogger = logger.child({ module: 'database' });

// Base interface for storage providers
export class StorageProvider {
  async initialize() { throw new Error('Not implemented'); }
  async get(id) { throw new Error('Not implemented'); }
  async getAll() { throw new Error('Not implemented'); }
  async create(data) { throw new Error('Not implemented'); }
  async update(id, data) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
  async beginTransaction() { throw new Error('Not implemented'); }
  async commitTransaction(transaction) { throw new Error('Not implemented'); }
  async rollbackTransaction(transaction) { throw new Error('Not implemented'); }
}

// File-based implementation
export class FileStorageProvider extends StorageProvider {
  constructor(collectionName) {
    super();
    this.collectionName = collectionName;
    this.dataFile = path.join(configService.get('data.dir'), `${collectionName}.json`);
    this.data = new Map();
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    await this.ensureDataDir();
    
    try {
      await this.loadData();
      this.initialized = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, initialize with empty data
        this.data = new Map();
        this.initialized = true;
        return;
      }
      
      dbLogger.error(`Failed to initialize storage for ${this.collectionName}`, { 
        error: error.message 
      });
      throw createError('internal', `Failed to initialize storage for ${this.collectionName}`, { 
        originalError: error.message 
      });
    }
  }
  
  async ensureDataDir() {
    try {
      await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
    } catch (error) {
      dbLogger.error(`Failed to create data directory for ${this.collectionName}`, { 
        error: error.message 
      });
      throw createError('internal', 'Failed to create data directory', { 
        originalError: error.message 
      });
    }
  }
  
  async loadData() {
    try {
      const fileData = await fs.readFile(this.dataFile, 'utf8');
      const parsedData = JSON.parse(fileData);
      
      this.data = new Map();
      for (const [id, value] of Object.entries(parsedData)) {
        this.data.set(id, value);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet
        this.data = new Map();
        return;
      }
      
      throw error;
    }
  }
  
  async saveData() {
    try {
      const dataObject = {};
      for (const [id, value] of this.data.entries()) {
        dataObject[id] = value;
      }
      
      await fs.writeFile(this.dataFile, JSON.stringify(dataObject, null, 2));
    } catch (error) {
      dbLogger.error(`Failed to save data for ${this.collectionName}`, { 
        error: error.message 
      });
      throw createError('internal', `Failed to save data for ${this.collectionName}`, { 
        originalError: error.message 
      });
    }
  }
  
  async get(id) {
    if (!this.initialized) await this.initialize();
    return this.data.get(id) || null;
  }
  
  async getAll() {
    if (!this.initialized) await this.initialize();
    return Array.from(this.data.values());
  }
  
  async create(data) {
    if (!this.initialized) await this.initialize();
    
    const id = data.id || crypto.randomUUID();
    const entity = { ...data, id };
    
    this.data.set(id, entity);
    await this.saveData();
    
    return entity;
  }
  
  async update(id, data) {
    if (!this.initialized) await this.initialize();
    
    const existing = this.data.get(id);
    if (!existing) {
      throw createError('notFound', `Entity with ID ${id} not found in ${this.collectionName}`);
    }
    
    const updated = { ...existing, ...data, id };
    this.data.set(id, updated);
    await this.saveData();
    
    return updated;
  }
  
  async delete(id) {
    if (!this.initialized) await this.initialize();
    
    const existing = this.data.get(id);
    if (!existing) {
      return false;
    }
    
    this.data.delete(id);
    await this.saveData();
    
    return true;
  }
  
  // Simple transaction support for file-based storage
  async beginTransaction() {
    if (!this.initialized) await this.initialize();
    
    // Create a snapshot of current data
    return {
      snapshot: new Map(this.data),
      operations: []
    };
  }
  
  async commitTransaction(transaction) {
    await this.saveData();
    return true;
  }
  
  async rollbackTransaction(transaction) {
    // Restore from snapshot
    this.data = transaction.snapshot;
    return true;
  }
}

// Factory to create appropriate storage provider
export function createStorageProvider(collectionName, type = 'file') {
  switch (type) {
    case 'file':
      return new FileStorageProvider(collectionName);
    default:
      throw new Error(`Unsupported storage provider type: ${type}`);
  }
}
