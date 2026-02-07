/**
 * Coordinate Worker - Parallel coordinate generation using worker threads
 * Handles CPU-intensive coordinate generation tasks in background
 */
import { parentPort, workerData } from 'worker_threads';

// Dynamic import for boundaryService to avoid circular dependencies
async function processCoordinateChunk() {
  try {
    // Import boundaryService dynamically
    const { boundaryService } = await import('../services/boundaryService.mjs');
    
    const { chunk, chunkIndex } = workerData;
    console.log(`🔧 Worker ${chunkIndex} starting with ${chunk.length} requests`);

    const results = [];
    
    for (const request of chunk) {
      try {
        const coordinates = await boundaryService.generateCoordinatesInRegion(
          request.countryCode,
          request.provinceCode || null,
          null, // cityCode
          request.count
        );
        
        results.push(...coordinates);
        
        // Progress reporting for large batches
        if (results.length % 50 === 0) {
          console.log(`🔧 Worker ${chunkIndex} progress: ${results.length} coordinates generated`);
        }
      } catch (error) {
        console.error(`❌ Worker ${chunkIndex} failed request:`, request, error.message);
        // Continue with other requests even if one fails
      }
    }

    console.log(`✅ Worker ${chunkIndex} completed: ${results.length} total coordinates`);
    
    // Send results back to main thread
    parentPort.postMessage({
      success: true,
      chunkIndex,
      coordinates: results,
      processedCount: chunk.length
    });
    
  } catch (error) {
    console.error(`❌ Worker ${chunkIndex} fatal error:`, error);
    
    parentPort.postMessage({
      success: false,
      chunkIndex,
      error: error.message,
      coordinates: []
    });
  }
}

// Start processing when worker is created
processCoordinateChunk();