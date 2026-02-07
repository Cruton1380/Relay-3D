/**
 * Bulk Coordinate Generation Service
 * High-performance batch processing for large-scale channel creation
 */
import { Worker } from 'worker_threads';
import { boundaryService } from './boundaryService.mjs';
import path from 'path';
import os from 'os';

class BulkCoordinateService {
  constructor() {
    this.maxConcurrentWorkers = Math.min(4, os.cpus().length);
    this.activeWorkers = new Set();
    this.requestQueue = [];
  }

  /**
   * Generate coordinates in bulk with parallel processing
   * @param {Array} requests - Array of coordinate requests
   * @returns {Promise<Array>} Generated coordinates
   */
  async generateBulkCoordinates(requests) {
    console.log(`🚀 [BulkCoordinateService] Processing ${requests.length} bulk coordinate requests`);
    
    // Validate requests
    if (!Array.isArray(requests) || requests.length === 0) {
      throw new Error('Invalid requests array');
    }

    // Split large requests into manageable chunks
    const chunks = this.chunkRequests(requests, 100); // Max 100 per chunk
    const results = [];

    // Process chunks in parallel with worker pool
    const promises = chunks.map((chunk, index) => 
      this.processChunkWithWorker(chunk, index)
    );

    const chunkResults = await Promise.all(promises);
    
    // Flatten results
    for (const chunkResult of chunkResults) {
      results.push(...chunkResult);
    }

    console.log(`✅ [BulkCoordinateService] Generated ${results.length} coordinates in bulk`);
    return results;
  }

  /**
   * Process coordinate chunk using worker thread
   */
  async processChunkWithWorker(chunk, chunkIndex) {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(process.cwd(), 'src/backend/workers/coordinateWorker.mjs');
      const worker = new Worker(workerPath, {
        workerData: { chunk, chunkIndex }
      });

      this.activeWorkers.add(worker);

      worker.on('message', (result) => {
        console.log(`✅ Worker ${chunkIndex} completed with ${result.coordinates.length} coordinates`);
        resolve(result.coordinates);
      });

      worker.on('error', (error) => {
        console.error(`❌ Worker ${chunkIndex} error:`, error);
        reject(error);
      });

      worker.on('exit', (code) => {
        this.activeWorkers.delete(worker);
        if (code !== 0) {
          reject(new Error(`Worker ${chunkIndex} stopped with exit code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        worker.terminate();
        reject(new Error(`Worker ${chunkIndex} timeout`));
      }, 30000);
    });
  }

  /**
   * Split requests into manageable chunks
   */
  chunkRequests(requests, chunkSize) {
    const chunks = [];
    for (let i = 0; i < requests.length; i += chunkSize) {
      chunks.push(requests.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Batch coordinate generation for single region with high count
   * @param {string} countryCode - Country code
   * @param {string} provinceCode - Optional province code  
   * @param {number} count - Number of coordinates to generate
   * @returns {Promise<Array>} Generated coordinates
   */
  async generateBulkCoordinatesInRegion(countryCode, provinceCode = null, count = 1000) {
    console.log(`🌍 [BulkCoordinateService] Generating ${count} coordinates in ${countryCode}${provinceCode ? `/${provinceCode}` : ''}`);
    
    if (count <= 100) {
      // Use regular service for small requests
      return await boundaryService.generateCoordinatesInRegion(countryCode, provinceCode, null, count);
    }

    // Split large count into parallel batch requests
    const batchSize = 250; // Optimal batch size for performance
    const batches = Math.ceil(count / batchSize);
    const requests = [];

    for (let i = 0; i < batches; i++) {
      const batchCount = Math.min(batchSize, count - (i * batchSize));
      requests.push({
        countryCode,
        provinceCode,
        count: batchCount,
        batchIndex: i
      });
    }

    return await this.generateBulkCoordinates(requests);
  }

  /**
   * Optimize coordinate generation with caching and pre-computation
   */
  async generateOptimizedCoordinates(params) {
    const { countryCode, provinceCode, count, useCache = true } = params;
    
    // Check cache for pre-computed coordinates
    if (useCache) {
      const cached = await this.getCachedCoordinates(countryCode, provinceCode, count);
      if (cached && cached.length >= count) {
        console.log(`💾 [BulkCoordinateService] Using cached coordinates (${cached.length} available)`);
        return cached.slice(0, count);
      }
    }

    // Generate and cache new coordinates
    const coordinates = await this.generateBulkCoordinatesInRegion(countryCode, provinceCode, count);
    
    if (useCache) {
      await this.cacheCoordinates(countryCode, provinceCode, coordinates);
    }

    return coordinates;
  }

  /**
   * Cache coordinates for faster subsequent requests
   */
  async getCachedCoordinates(countryCode, provinceCode, minCount) {
    // TODO: Implement Redis or file-based caching
    // For now, return null to always generate fresh
    return null;
  }

  async cacheCoordinates(countryCode, provinceCode, coordinates) {
    // TODO: Implement coordinate caching
    // Store in Redis with TTL or file system
  }

  /**
   * Cleanup active workers
   */
  async cleanup() {
    console.log(`🧹 [BulkCoordinateService] Terminating ${this.activeWorkers.size} active workers`);
    const terminationPromises = Array.from(this.activeWorkers).map(worker => 
      worker.terminate()
    );
    await Promise.all(terminationPromises);
    this.activeWorkers.clear();
  }
}

export const bulkCoordinateService = new BulkCoordinateService();