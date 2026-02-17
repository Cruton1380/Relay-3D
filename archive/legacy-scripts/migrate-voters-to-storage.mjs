// scripts/migrate-voters-to-storage.mjs
/**
 * Migration Script: Load existing voter data into new storage system
 * 
 * This script:
 * 1. Reads existing voter data from userLocationService and userPreferencesService
 * 2. Matches voters to their votes in votingEngine
 * 3. Inserts them into the new storage system (InMemoryStorage or PostgreSQL)
 */

import { getStorage } from '../src/backend/storage/index.mjs';
import { getUserLocation, initLocationService } from '../src/backend/services/userLocationService.mjs';
import { getUserPrivacyLevel, initPreferencesService } from '../src/backend/services/userPreferencesService.mjs';
import { initVotingEngine, getTopicVotes } from '../src/backend/voting/votingEngine.mjs';
import logger from '../src/backend/utils/logging/logger.mjs';

const migrationLogger = logger.child({ module: 'voter-migration' });

async function migrateVotersToStorage() {
  console.log('🔄 Starting voter data migration to new storage system...\n');
  
  try {
    // Initialize services
    migrationLogger.info('Initializing services...');
    await initLocationService();
    await initPreferencesService();
    await initVotingEngine();
    
    const storage = await getStorage();
    migrationLogger.info(`Storage backend: ${storage.constructor.name}`);
    
    // Get all votes from voting engine
    migrationLogger.info('Loading vote data from voting engine...');
    const allTopics = await getAllTopics(); // You'll need to implement this
    
    let totalVoters = 0;
    let successfulInserts = 0;
    let failedInserts = 0;
    const votersToInsert = [];
    
    for (const topic of allTopics) {
      const topicVotes = getTopicVotes(topic.id);
      
      if (!topicVotes || !topicVotes.candidates) continue;
      
      for (const [candidateId, votes] of Object.entries(topicVotes.candidates)) {
        if (!votes || !votes.voters) continue;
        
        for (const userId of votes.voters) {
          totalVoters++;
          
          // Get user location
          const location = getUserLocation(userId);
          if (!location) {
            migrationLogger.warn(`No location found for user ${userId}`);
            failedInserts++;
            continue;
          }
          
          // Get user privacy level
          const privacyLevel = getUserPrivacyLevel(userId) || 'province';
          
          // Only include voters with GPS-level data
          if (!location.lat || !location.lng) {
            migrationLogger.debug(`Skipping user ${userId} - no GPS coordinates`);
            failedInserts++;
            continue;
          }
          
          // Create voter record
          const voter = {
            user_id: userId,
            candidate_id: candidateId,
            channel_id: topic.id,
            privacy_level: privacyLevel,
            location_lat: location.lat,
            location_lng: location.lng,
            location_city: location.city || null,
            location_province: location.province || null,
            location_country: location.country || null
          };
          
          votersToInsert.push(voter);
        }
      }
    }
    
    // Bulk insert voters
    if (votersToInsert.length > 0) {
      migrationLogger.info(`Inserting ${votersToInsert.length} voters into storage...`);
      const startTime = Date.now();
      
      await storage.insertVoters(votersToInsert);
      
      const insertTime = Date.now() - startTime;
      successfulInserts = votersToInsert.length;
      
      migrationLogger.info(`✅ Inserted ${successfulInserts} voters in ${insertTime}ms`);
      migrationLogger.info(`   Average: ${(insertTime / successfulInserts).toFixed(2)}ms per voter`);
    }
    
    // Get final stats
    const stats = await storage.getStats();
    
    console.log('\n📊 Migration Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`Total voters found:      ${totalVoters}`);
    console.log(`Successfully migrated:   ${successfulInserts}`);
    console.log(`Failed/Skipped:          ${failedInserts}`);
    console.log(`Storage type:            ${stats.storageType}`);
    console.log(`Total in storage:        ${stats.totalVoters}`);
    console.log(`Memory usage:            ${stats.memoryUsageMB.toFixed(2)} MB`);
    console.log('═══════════════════════════════════════\n');
    
    // Test a bbox query
    console.log('🧪 Testing bbox query...');
    const testBbox = {
      minLat: -90,
      minLng: -180,
      maxLat: 90,
      maxLng: 180
    };
    
    const queryStart = Date.now();
    const testResult = await storage.getVotersByBBox(testBbox, { limit: 10 });
    const queryTime = Date.now() - queryStart;
    
    console.log(`✅ Query returned ${testResult.length} voters in ${queryTime}ms`);
    
    if (testResult.length > 0) {
      console.log('\n📍 Sample voter:');
      console.log(JSON.stringify(testResult[0], null, 2));
    }
    
    console.log('\n✅ Migration complete!\n');
    
  } catch (error) {
    migrationLogger.error('Migration failed:', error);
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Get all topics from voting engine
 * This is a placeholder - you'll need to implement based on your voting engine structure
 */
async function getAllTopics() {
  // TODO: Implement this based on your voting engine's data structure
  // For now, return empty array
  migrationLogger.warn('getAllTopics() not implemented - no topics will be migrated');
  return [];
}

// Run migration
migrateVotersToStorage()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

