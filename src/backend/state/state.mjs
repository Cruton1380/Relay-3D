//backend/state/state.mjs
import blockchain from '../blockchain-service/index.mjs';
import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import logger from '../utils/logging/logger.mjs';
import { initializeWithDemoData } from '../voting/votingEngine.mjs';

const stateLogger = logger.child({ module: 'state' });

// ----- In-Memory State -----
// voteCounts: { [topic]: { [voteType]: { [choice]: count } } }
export const voteCounts = {};
// userVotes: Map<publicKey, { [topic]: { voteType, choice } }>
export const userVotes = new Map();
export let seenNonces = new Map(); // publicKey -> Set of nonces
export { blockchain };

// ----- File Paths -----
const DATA_DIR = path.resolve('./data');
const BLOCKCHAIN_FILE = path.join(DATA_DIR, 'blockchain_data.json');
const CHAIN_LOG_FILE = path.join(DATA_DIR, 'blockchain', 'chain.jsonl');
const SESSION_FILE = path.join(DATA_DIR, 'voting', 'session-votes.json');

// ----- Test Data -----
const testData = {
  "Local Government": {
    local: {
      binary: {
        "@seattlecitycouncil": 2341,
        "@portlandgov": 1834,
        "@sfgov": 1523
      }
    },
    foreign: {},
    active: true,
    createdAt: Date.now(),
    totalVotes: 5698
  },
  "Pizza": {
    local: {
      binary: {
        "@tonypizzapalace": 1834,
        "@pizzaloversunited": 892,
        "@neapolitanmaster": 241
      }
    },
    foreign: {},
    active: true,
    createdAt: Date.now(),
    totalVotes: 2967
  }
};

// ----- Ensure directory exists before any write -----
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR, constants.F_OK);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    stateLogger.info(`Created data directory: ${DATA_DIR}`);
  }
}

// ----- Session Persistence -----

// Save current vote counts to session file
export const saveSessionVotes = async () => {
  try {
    const sessionData = {
      voteCounts,
      timestamp: Date.now(),
      sessionId: process.pid // Use process ID as simple session identifier
    };
    
    await fs.writeFile(SESSION_FILE, JSON.stringify(sessionData, null, 2));
    stateLogger.info('Session vote counts saved');
  } catch (error) {
    stateLogger.error('Failed to save session votes:', error);
  }
};

// Load vote counts from session file if available
export const loadSessionVotes = async () => {
  try {
    await fs.access(SESSION_FILE, constants.F_OK);
    const data = await fs.readFile(SESSION_FILE, 'utf8');
    const sessionData = JSON.parse(data);
    
    // Check if session is recent (within last 24 hours)
    const sessionAge = Date.now() - sessionData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge < maxAge && sessionData.voteCounts) {
      // Restore vote counts
      Object.assign(voteCounts, sessionData.voteCounts);
      stateLogger.info('Session vote counts restored', {
        topicCount: Object.keys(sessionData.voteCounts).length,
        sessionAge: Math.round(sessionAge / 1000 / 60) + ' minutes'
      });
      return true;
    } else {
      stateLogger.info('Session expired or invalid, starting fresh');
      return false;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      stateLogger.warn('Failed to load session votes:', error);
    }
    return false;
  }
};

// Clear session file
export const clearSessionVotes = async () => {
  try {
    await fs.unlink(SESSION_FILE);
    stateLogger.info('Session votes cleared');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      stateLogger.warn('Failed to clear session votes:', error);
    }
  }
};

// Auto-save votes periodically
let autoSaveInterval;
export const startAutoSave = () => {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  
  // Save every 30 seconds
  autoSaveInterval = setInterval(saveSessionVotes, 30000);
  stateLogger.info('Auto-save started (30s interval)');
};

export const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    stateLogger.info('Auto-save stopped');
  }
};

/**
 * Initialize state with test data only if explicitly enabled
 */
export async function initializeState() {
  // Try to restore from session first
  const sessionRestored = await loadSessionVotes();
  
  if (!sessionRestored) {
    // Only load test data if TEST_MODE environment variable is explicitly set
    if (process.env.TEST_MODE === 'true') {
      Object.assign(voteCounts, testData);
      stateLogger.info('Initialized state with test data (TEST_MODE enabled)');
    } else {
      stateLogger.info('Initialized state without test data');
    }
    
    // Load demo voting data if available
    await loadDemoVotingData();
  }
  
  // Start auto-save for session persistence
  startAutoSave();
}

/**
 * Load vote counts from demo-voting-data.json
 */
async function loadDemoVotingData() {
  try {
    console.log('🔄 Starting demo data loading process...');
    const demoDataPath = path.join(process.cwd(), 'data', 'demos', 'demo-voting-data.json');
    console.log('📁 Demo data path:', demoDataPath);
    
    const demoData = await fs.readFile(demoDataPath, 'utf-8');
    const parsedData = JSON.parse(demoData);
    const { channels } = parsedData;
    
    console.log('📊 Demo data loaded successfully:', { channelCount: channels?.length || 0 });
    
    // Initialize vote counts from demo data (legacy system)
    if (channels && channels.length > 0) {
      channels.forEach(channel => {
        // Initialize channel vote counts
        voteCounts[channel.id] = {
          totalVotes: channel.totalVotes || 0,
          candidates: {}
        };
        
        // Initialize candidate vote counts
        if (channel.candidates) {
          channel.candidates.forEach(candidate => {
            voteCounts[channel.id].candidates[candidate.id] = candidate.votes || 0;
          });
        }
      });
      
      stateLogger.info('Loaded vote counts from demo voting data', { 
        channels: channels.length,
        totalChannels: Object.keys(voteCounts).length 
      });
    }

    // Initialize authoritative voting system with demo data
    console.log('🚀 Initializing authoritative voting system...');
    initializeWithDemoData(parsedData);
    console.log('✅ Demo data initialization complete');
    
  } catch (error) {
    console.error('❌ Error loading demo voting data:', error);
    stateLogger.warn('Could not load demo voting data', { error: error.message });
  }
}

/**
 * Get vote counts for a specific channel
 */
export function getChannelVoteCounts(channelId) {
  return voteCounts[channelId] || { totalVotes: 0, candidates: {} };
}

/**
 * Get vote count for a specific candidate
 */
export function getCandidateVoteCount(channelId, candidateId) {
  const channelVotes = voteCounts[channelId];
  if (!channelVotes || !channelVotes.candidates) return 0;
  return channelVotes.candidates[candidateId] || 0;
}

/**
 * Update vote count for a candidate
 */
export function updateCandidateVoteCount(channelId, candidateId, newCount) {
  if (!voteCounts[channelId]) {
    voteCounts[channelId] = { totalVotes: 0, candidates: {} };
  }
  
  const oldCount = voteCounts[channelId].candidates[candidateId] || 0;
  const difference = newCount - oldCount;
  
  voteCounts[channelId].candidates[candidateId] = newCount;
  voteCounts[channelId].totalVotes = (voteCounts[channelId].totalVotes || 0) + difference;
  
  stateLogger.debug('Updated vote count', { 
    channelId, 
    candidateId, 
    oldCount, 
    newCount, 
    difference 
  });
  
  // Trigger immediate save for important changes
  saveSessionVotes().catch(err => 
    stateLogger.warn('Failed to save session after vote update:', err)
  );
}

// Demo user votes tracking (separate from main userVotes for demo purposes)
const demoUserVotes = new Map(); // userId -> { channelId: candidateId }

/**
 * Get the candidate a demo user voted for in a channel
 */
export function getDemoUserVote(userId, channelId) {
  const userVotes = demoUserVotes.get(userId);
  return userVotes ? userVotes[channelId] : null;
}

/**
 * Set/update a demo user's vote for a channel, handling vote switching
 */
export function setDemoUserVote(userId, channelId, candidateId) {
  const userVotes = demoUserVotes.get(userId) || {};
  const previousCandidate = userVotes[channelId];
  
  // Handle vote switching
  if (previousCandidate && previousCandidate !== candidateId) {
    // Decrement previous candidate's vote
    const prevCount = getCandidateVoteCount(channelId, previousCandidate);
    if (prevCount > 0) {
      updateCandidateVoteCount(channelId, previousCandidate, prevCount - 1);
      stateLogger.info('Revoked previous vote', { 
        userId, 
        channelId, 
        previousCandidate, 
        newCount: prevCount - 1 
      });
    }
  }
  
  // Set new vote (only if different from previous)
  if (previousCandidate !== candidateId) {
    userVotes[channelId] = candidateId;
    demoUserVotes.set(userId, userVotes);
    
    // Increment new candidate's vote
    const currentCount = getCandidateVoteCount(channelId, candidateId);
    updateCandidateVoteCount(channelId, candidateId, currentCount + 1);
    
    stateLogger.info('Cast new vote', { 
      userId, 
      channelId, 
      candidateId, 
      newCount: currentCount + 1,
      switched: !!previousCandidate 
    });
    
    return {
      switched: !!previousCandidate,
      previousCandidate,
      newCandidate: candidateId,
      newCount: currentCount + 1
    };
  }
  
  return {
    switched: false,
    message: 'Vote unchanged - user already voted for this candidate'
  };
}

/**
 * Remove a demo user's vote from a channel
 */
export function removeDemoUserVote(userId, channelId) {
  const userVotes = demoUserVotes.get(userId);
  if (!userVotes || !userVotes[channelId]) {
    return { success: false, message: 'No vote to remove' };
  }
  
  const candidateId = userVotes[channelId];
  const currentCount = getCandidateVoteCount(channelId, candidateId);
  
  if (currentCount > 0) {
    updateCandidateVoteCount(channelId, candidateId, currentCount - 1);
  }
  
  delete userVotes[channelId];
  if (Object.keys(userVotes).length === 0) {
    demoUserVotes.delete(userId);
  } else {
    demoUserVotes.set(userId, userVotes);
  }
  
  stateLogger.info('Removed vote', { 
    userId, 
    channelId, 
    candidateId, 
    newCount: Math.max(0, currentCount - 1) 
  });
  
  return {
    success: true,
    candidateId,
    newCount: Math.max(0, currentCount - 1)
  };
}

/**
 * Get all demo user votes (for debugging)
 */
export function getAllDemoUserVotes() {
  const result = {};
  for (const [userId, votes] of demoUserVotes.entries()) {
    result[userId] = votes;
  }
  return result;
}

/**
 * Append vote to JSON Lines file for persistence
 */
export async function appendToJSONLFile(vote) {
  try {
    const logDir = './data/votes';
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, `votes-${new Date().toISOString().split('T')[0]}.jsonl`);
    await fs.appendFile(logFile, JSON.stringify(vote) + '\n');
  } catch (error) {
    stateLogger.error('Failed to append vote to JSONL file', { error: error.message });
  }
}

// ----- Save entire blockchain to disk (atomically) -----
export async function saveBlockchain() {
  try {
    await ensureDataDir();
    const tempFile = BLOCKCHAIN_FILE + '.tmp';
    const data = JSON.stringify(blockchain.chain, null, 2);
    await fs.writeFile(tempFile, data);
    await fs.rename(tempFile, BLOCKCHAIN_FILE);
    stateLogger.info(`Saved blockchain with ${blockchain.chain.length} blocks`);
    return true;
  } catch (error) {
    stateLogger.error('Failed to save blockchain', { error: error.message });
    return false;
  }
}

// ----- Load blockchain from disk -----
export async function loadBlockchain() {
  try {
    await ensureDataDir();
    // Check if blockchain file exists
    try {
      await fs.access(BLOCKCHAIN_FILE, constants.F_OK);
    } catch (error) {
      stateLogger.info('No existing blockchain file found, starting fresh');
      return true;
    }
    
    // Read and parse blockchain file
    const data = await fs.readFile(BLOCKCHAIN_FILE, 'utf8');
    
    // Handle empty file
    if (!data || data.trim() === '') {
      stateLogger.info('Blockchain file exists but is empty, starting fresh');
      return true;
    }
    
    try {
      const chain = JSON.parse(data);
      
      // Validate the loaded chain
      if (!Array.isArray(chain) || chain.length === 0) {
        stateLogger.warn('Invalid blockchain data, starting fresh');
        return true;
      }
      
      // Rebuild blockchain from loaded data
      blockchain.chain = chain.map(blockData => {
        return new Block(
          blockData.index,
          blockData.timestamp,
          blockData.data,
          blockData.previousHash,
          blockData.hash,
          blockData.nonce
        );
      });
      
      stateLogger.info(`Loaded blockchain with ${blockchain.chain.length} blocks`);
      
      // Rebuild state from loaded chain
      await rebuildStateFromChain();
      return true;
    } catch (parseError) {
      stateLogger.warn('Error parsing blockchain data, starting fresh', { error: parseError.message });
      return true;
    }
  } catch (error) {
    stateLogger.error('Failed to load blockchain', { error: error.message });
    // Return true anyway to continue with a fresh blockchain
    return true;
  }
}

// ----- Rebuild in-memory state from blockchain -----
async function rebuildStateFromChain() {
  // Reset state first
  resetState();
  
  // Process each block to rebuild vote state
  for (const block of blockchain.chain) {
    // Skip genesis block
    if (block.index === 0) continue;
    
    // Process votes in the block
    if (block.data && block.data.votes) {
      for (const voteData of block.data.votes) {
        const { publicKey, topic, voteType, choice, reliability = 1.0 } = voteData;
        processVoteState(publicKey, topic, voteType, choice, reliability);
      }
    }
  }
  
  stateLogger.info('State rebuilt from blockchain');
  return true;
}

// Process a vote to update in-memory state (doesn't write to blockchain)
function processVoteState(publicKey, topic, voteType, choice, reliability = 1.0) {
  // Update user votes
  const userRecord = userVotes.get(publicKey) || {};
  userRecord[topic] = { voteType, choice };
  userVotes.set(publicKey, userRecord);
  
  // Update vote counts
  voteCounts[topic] = voteCounts[topic] || {};
  voteCounts[topic][voteType] = voteCounts[topic][voteType] || {};
  voteCounts[topic][voteType][choice] = (voteCounts[topic][voteType][choice] || 0) + reliability;
}

// ----- Reset in-memory state -----
export function resetState() {
  voteCounts = {};
  userVotes = new Map();
  seenNonces = new Map();
  stateLogger.info('In-memory state reset');
}

// ----- Nonce Management -----
export function isNonceUsed(publicKey, nonce) {
  const userNonces = seenNonces.get(publicKey);
  return userNonces ? userNonces.has(nonce) : false;
}

export function markNonceUsed(publicKey, nonce) {
  const userNonces = seenNonces.get(publicKey) || new Set();
  userNonces.add(nonce);
  seenNonces.set(publicKey, userNonces);
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  stateLogger.info('Shutting down gracefully...');
  stopAutoSave();
  await saveSessionVotes();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  stateLogger.info('Shutting down gracefully...');
  stopAutoSave();
  await saveSessionVotes();
  process.exit(0);
});

// Initialize state on module load
await initializeState();
