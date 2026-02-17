/**
 * @fileoverview Dictionary System Indexer Script
 * Builds the initial dictionary by indexing all existing content
 */
import dictionaryIndexer from '../src/backend/dictionary/dictionaryIndexer.mjs';
import logger from '../src/backend/utils/logging/logger.mjs';
import { eventBus } from '../src/backend/event-bus/index.mjs';
import topicRowVoteManager from '../src/backend/channel-service/topicRowVoteManager.mjs';
import categorySystem from '../src/backend/dictionary/categorySystem.mjs';
import dictionaryTextParser from '../src/backend/dictionary/dictionaryTextParser.mjs';
import dictionarySearchService from '../src/backend/dictionary/dictionarySearchService.mjs';

const mainLogger = logger.child({ script: 'dictionary-indexer' });

/**
 * Main function to run the indexing process
 */
async function main() {
  try {
    mainLogger.info('Dictionary indexing process started');
    
    // Initialize services in correct order
    mainLogger.info('Initializing services...');
    
    mainLogger.info('Initializing topic row vote manager...');
    await topicRowVoteManager.initialize();
    
    mainLogger.info('Initializing category system...');
    await categorySystem.initialize();
    
    mainLogger.info('Initializing dictionary text parser...');
    await dictionaryTextParser.initialize();
    
    mainLogger.info('Initializing dictionary search service...');
    await dictionarySearchService.initialize();
    
    mainLogger.info('Initializing dictionary indexer...');
    await dictionaryIndexer.initialize();
    
    // Run the indexing process
    mainLogger.info('Starting full indexing process...');
    const stats = await dictionaryIndexer.runFullIndexing();
    
    // Output results
    mainLogger.info('Dictionary indexing completed successfully', { stats });
    console.log('\n============= Indexing Results =============');
    console.log(`Messages Processed: ${stats.processedMessages}`);
    console.log(`Posts Processed: ${stats.processedPosts}`);
    console.log(`Terms Detected: ${stats.detectedTerms}`);
    console.log(`New Topic Rows: ${stats.newTopicRows}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('===========================================\n');
    
    // Clean exit
    process.exit(0);
  } catch (error) {
    mainLogger.error('Dictionary indexing failed', { error: error.message });
    console.error('Dictionary indexing failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
