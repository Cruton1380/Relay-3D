/**
 * In-memory caching utilities
 */
import { logger } from '../logging/logger.mjs';

// Simple in-memory cache store
const cacheStore = new Map();
const ttlTimers = new Map();

/**
 * Sets a value in the cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds
 * @returns {boolean} True if successful
 */
export function cacheSet(key, value, ttlMs = 300000) {
  try {
    // Clear any existing TTL timer
    if (ttlTimers.has(key)) {
      clearTimeout(ttlTimers.get(key));
    }
    
    // Set the value in cache
    cacheStore.set(key, value);
    
    // Set TTL timer
    if (ttlMs > 0) {
      const timer = setTimeout(() => {
        cacheStore.delete(key);
        ttlTimers.delete(key);
      }, ttlMs);
      
      ttlTimers.set(key, timer);
    }
    
    return true;
  } catch (error) {
    logger.error('Error setting cache value', error);
    return false;
  }
}

/**
 * Gets a value from the cache
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined if not found
 */
export function cacheGet(key) {
  return cacheStore.get(key);
}

/**
 * Deletes a value from the cache
 * @param {string} key - Cache key
 * @returns {boolean} True if successful
 */
export function cacheDelete(key) {
  if (ttlTimers.has(key)) {
    clearTimeout(ttlTimers.get(key));
    ttlTimers.delete(key);
  }
  return cacheStore.delete(key);
}

/**
 * Clears the entire cache
 */
export function cacheClear() {
  // Clear all TTL timers
  for (const timer of ttlTimers.values()) {
    clearTimeout(timer);
  }
  ttlTimers.clear();
  cacheStore.clear();
}

/**
 * Gets or sets a cache value with a provider function
 * @param {string} key - Cache key
 * @param {Function} provider - Function to call if cache miss
 * @param {number} ttlMs - Time to live in milliseconds
 * @returns {Promise<any>} Cached or freshly retrieved value
 */
export async function cacheGetOrSet(key, provider, ttlMs = 300000) {
  const cachedValue = cacheGet(key);
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  try {
    const value = await provider();
    cacheSet(key, value, ttlMs);
    return value;
  } catch (error) {
    logger.error(`Cache provider error for key ${key}`, error);
    throw error;
  }
}
