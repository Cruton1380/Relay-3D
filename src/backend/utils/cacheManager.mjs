/**
 * Cache Management System
 * Prevents cache-related issues by providing centralized cache control
 */

import logger from '../utils/logging/logger.mjs';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const cacheLogger = logger.child({ module: 'cache-manager' });

class CacheManager {
  constructor() {
    this.cacheDirectories = [
      'node_modules/.cache',
      '.vite',
      'dist',
      'build',
      'coverage',
      'logs'
    ];
    
    this.criticalCacheFiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];
  }

  /**
   * Clear all cache directories
   */
  async clearAllCaches() {
    cacheLogger.info('Starting cache cleanup...');
    
    const cleared = [];
    const errors = [];

    for (const cacheDir of this.cacheDirectories) {
      try {
        if (existsSync(cacheDir)) {
          rmSync(cacheDir, { recursive: true, force: true });
          cleared.push(cacheDir);
          cacheLogger.debug(`Cleared cache directory: ${cacheDir}`);
        }
      } catch (error) {
        errors.push(`${cacheDir}: ${error.message}`);
        cacheLogger.warn(`Failed to clear cache directory ${cacheDir}:`, error.message);
      }
    }

    // Clear browser cache files
    await this.clearBrowserCaches();

    cacheLogger.info('Cache cleanup completed', {
      cleared: cleared.length,
      errors: errors.length,
      clearedDirs: cleared
    });

    return { cleared, errors };
  }

  /**
   * Clear browser-specific caches
   */
  async clearBrowserCaches() {
    const browserCaches = [
      'chrome-cache',
      'firefox-cache',
      'edge-cache',
      'safari-cache'
    ];

    for (const cache of browserCaches) {
      try {
        if (existsSync(cache)) {
          rmSync(cache, { recursive: true, force: true });
          cacheLogger.debug(`Cleared browser cache: ${cache}`);
        }
      } catch (error) {
        cacheLogger.warn(`Failed to clear browser cache ${cache}:`, error.message);
      }
    }
  }

  /**
   * Validate cache integrity
   */
  validateCacheIntegrity() {
    const issues = [];

    // Check for corrupted cache files
    for (const cacheFile of this.criticalCacheFiles) {
      if (existsSync(cacheFile)) {
        try {
          const content = require(cacheFile);
          if (!content || typeof content !== 'object') {
            issues.push(`Corrupted cache file: ${cacheFile}`);
          }
        } catch (error) {
          issues.push(`Invalid cache file: ${cacheFile} - ${error.message}`);
        }
      }
    }

    return issues;
  }

  /**
   * Create fresh cache directories
   */
  createFreshCaches() {
    const created = [];

    for (const cacheDir of this.cacheDirectories) {
      try {
        if (!existsSync(cacheDir)) {
          mkdirSync(cacheDir, { recursive: true });
          created.push(cacheDir);
          cacheLogger.debug(`Created cache directory: ${cacheDir}`);
        }
      } catch (error) {
        cacheLogger.warn(`Failed to create cache directory ${cacheDir}:`, error.message);
      }
    }

    return created;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      totalSize: 0,
      directories: {},
      files: 0
    };

    for (const cacheDir of this.cacheDirectories) {
      if (existsSync(cacheDir)) {
        try {
          const dirStats = this.getDirectoryStats(cacheDir);
          stats.directories[cacheDir] = dirStats;
          stats.totalSize += dirStats.size;
          stats.files += dirStats.files;
        } catch (error) {
          cacheLogger.warn(`Failed to get stats for ${cacheDir}:`, error.message);
        }
      }
    }

    return stats;
  }

  /**
   * Get directory statistics
   */
  getDirectoryStats(dirPath) {
    // Simplified version - in production, use a proper directory walker
    return {
      size: 0, // Would calculate actual size
      files: 0, // Would count actual files
      lastModified: new Date()
    };
  }
}

export default CacheManager;
