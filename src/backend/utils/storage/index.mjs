/**
 * Storage utilities
 */
import * as fileStorage from './fileStorage.mjs';
import * as caching from './caching.mjs';

// Export the storage factory function
export function storageFactory(collectionName, options = {}) {
  // Choose storage implementation based on options
  const storageType = options.type || 'file';
  
  switch (storageType) {
    case 'memory':
      return new MemoryStorage(collectionName);
    case 'file':
    default:
      return new FileStorage(collectionName, options);
  }
}

// Memory storage implementation
class MemoryStorage {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.data = new Map();
  }
  
  async init() {
    return true;
  }
  
  async get(id) {
    return this.data.get(id) || null;
  }
  
  async find(query = {}) {
    // Simple in-memory filtering
    return Array.from(this.data.values()).filter(item => {
      return Object.entries(query).every(([key, value]) => item[key] === value);
    });
  }
  
  async insert(document) {
    const id = document.id || crypto.randomUUID();
    const docToSave = { ...document, id };
    this.data.set(id, docToSave);
    return docToSave;
  }
  
  async update(id, update) {
    const existing = this.data.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...update, id };
    this.data.set(id, updated);
    return updated;
  }
  
  async delete(id) {
    const existing = this.data.get(id);
    if (!existing) return false;
    
    this.data.delete(id);
    return true;
  }
}

// File storage implementation
class FileStorage {
  constructor(collectionName, options = {}) {
    this.collectionName = collectionName;
    this.options = options;
    this.dataPath = options.dataPath || './data';
    this.filePath = `${this.dataPath}/${collectionName}.json`;
    this.data = new Map();
  }
  
  async init() {
    try {
      const fileExists = await fileStorage.exists(this.filePath);
      if (fileExists) {
        const content = await fileStorage.readFile(this.filePath);
        const parsed = JSON.parse(content);
        parsed.forEach(item => this.data.set(item.id, item));
      } else {
        // Create empty file
        await this.save();
      }
      return true;
    } catch (error) {
      console.error(`Error initializing storage for ${this.collectionName}:`, error);
      return false;
    }
  }
  
  async save() {
    const data = Array.from(this.data.values());
    await fileStorage.writeFile(this.filePath, JSON.stringify(data, null, 2));
    return true;
  }
  
  async get(id) {
    return this.data.get(id) || null;
  }
  
  async find(query = {}) {
    return Array.from(this.data.values()).filter(item => {
      return Object.entries(query).every(([key, value]) => item[key] === value);
    });
  }
  
  async insert(document) {
    const id = document.id || crypto.randomUUID();
    const docToSave = { ...document, id };
    this.data.set(id, docToSave);
    await this.save();
    return docToSave;
  }
  
  async update(id, update) {
    const existing = this.data.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...update, id };
    this.data.set(id, updated);
    await this.save();
    return updated;
  }
  
  async delete(id) {
    const existing = this.data.get(id);
    if (!existing) return false;
    
    this.data.delete(id);
    await this.save();
    return true;
  }
}

// Export storage classes for direct use
export { MemoryStorage, FileStorage };

// Export other storage modules
export { fileStorage, caching };
