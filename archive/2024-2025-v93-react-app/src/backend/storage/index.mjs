/**
 * Storage Factory
 * 
 * Provides a single entry point for voter storage.
 * Automatically selects the appropriate storage backend based on configuration.
 * 
 * Usage:
 *   import { getStorage } from './storage/index.mjs';
 *   const storage = await getStorage();
 *   await storage.insertVoter(voter);
 */

import { InMemoryStorage } from './InMemoryStorage.mjs';
import { PostgresStorage } from './PostgresStorage.mjs';
import logger from '../utils/logging/logger.mjs';

const storageLogger = logger.child({ module: 'storage-factory' });

let storageInstance = null;

/**
 * Get or create storage instance
 * @param {Object} config - Storage configuration
 * @param {string} [config.type] - 'inmemory' or 'postgres' (default: from env or 'inmemory')
 * @param {boolean} [config.forceNew] - Force create new instance
 * @returns {Promise<StorageInterface>} Storage instance
 */
export async function getStorage(config = {}) {
  if (storageInstance && !config.forceNew) {
    return storageInstance;
  }

  // Determine storage type
  const storageType = config.type || 
                     process.env.STORAGE_TYPE || 
                     (process.env.USE_POSTGRES_STORAGE === 'true' ? 'postgres' : 'inmemory');

  storageLogger.info('Initializing storage', { type: storageType });

  try {
    switch (storageType.toLowerCase()) {
      case 'postgres':
      case 'postgresql':
        storageInstance = new PostgresStorage();
        await storageInstance.init(config.postgres || {});
        break;

      case 'inmemory':
      case 'memory':
      default:
        storageInstance = new InMemoryStorage();
        await storageInstance.init(config.inmemory || {});
        break;
    }

    storageLogger.info('Storage initialized successfully', { type: storageType });
    return storageInstance;
  } catch (error) {
    storageLogger.error('Failed to initialize storage', { type: storageType, error: error.message });
    
    // Fallback to in-memory if PostgreSQL fails
    if (storageType !== 'inmemory') {
      storageLogger.warn('Falling back to in-memory storage');
      storageInstance = new InMemoryStorage();
      await storageInstance.init();
      return storageInstance;
    }

    throw error;
  }
}

/**
 * Close storage connection
 */
export async function closeStorage() {
  if (storageInstance) {
    await storageInstance.close();
    storageInstance = null;
    storageLogger.info('Storage closed');
  }
}

/**
 * Get current storage instance (without initializing)
 * @returns {StorageInterface|null}
 */
export function getCurrentStorage() {
  return storageInstance;
}

// Export storage classes for direct use
export { InMemoryStorage } from './InMemoryStorage.mjs';
export { PostgresStorage } from './PostgresStorage.mjs';
export { StorageInterface } from './StorageInterface.mjs';

