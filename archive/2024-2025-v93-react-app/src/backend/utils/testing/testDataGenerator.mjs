/**
 * Test Data Generator for Integrated Demo Testing
 * Generates test data that flows through production systems but is clearly marked as test data
 * All test data includes isTestData flag for blockchain transparency
 */

import crypto from 'crypto';
import { Buffer } from 'buffer';

/**
 * Generate a test public key for demo users
 * @param {string} userId - Demo user ID
 * @returns {string} Base64-encoded public key
 */
export function generateTestPublicKey(userId) {
  // Create deterministic but realistic-looking public key for testing
  const hash = crypto.createHash('sha256');
  hash.update(`test_user_${userId}_public_key`);
  const keyBytes = hash.digest();
  
  // Simulate a realistic public key structure with test data marker
  const testPublicKey = {
    kty: 'EC',
    crv: 'P-256',
    x: keyBytes.subarray(0, 16).toString('base64'),
    y: keyBytes.subarray(16, 32).toString('base64'),
    use: 'sig',
    isTestData: true, // KEY: Mark as test data
    testDataSource: 'integrated_demo',
    userId: userId
  };
  
  return Buffer.from(JSON.stringify(testPublicKey)).toString('base64');
}

/**
 * Generate a test signature for demo votes
 * @param {Object} voteData - Vote data to sign
 * @param {string} userId - Demo user ID
 * @returns {string} Base64-encoded signature
 */
export function generateTestSignature(voteData, userId) {
  // Create deterministic signature for testing with test data marker
  const message = JSON.stringify(voteData);
  const hash = crypto.createHash('sha256');
  hash.update(`test_signature_${userId}_${message}`);
  
  // Get the digest once to avoid "Digest already called" error
  const digestHex = hash.digest('hex');
  
  // Simulate a realistic signature with test data marker
  const signature = {
    r: digestHex.substring(0, 32),
    s: digestHex.substring(32, 64),
    isTestData: true, // KEY: Mark as test data
    testDataSource: 'integrated_demo',
    userId: userId,
    signedAt: Date.now()
  };
  
  return Buffer.from(JSON.stringify(signature)).toString('base64');
}

/**
 * Generate a test nonce for demo votes
 * @param {string} userId - Demo user ID
 * @param {number} timestamp - Vote timestamp
 * @returns {string} Unique nonce
 */
export function generateTestNonce(userId, timestamp) {
  return crypto.createHash('sha256')
    .update(`${userId}-${timestamp}-${Math.random()}`)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Generate test user region data
 * @param {string} userId - Demo user ID
 * @returns {string} User region
 */
export function generateTestUserRegion(userId) {
  // Distribute test users across regions for testing
  const regions = ['north-america', 'europe', 'asia-pacific', 'latin-america'];
  const hash = crypto.createHash('sha256').update(userId).digest();
  const regionIndex = hash[0] % regions.length;
  return regions[regionIndex];
}

/**
 * Generate complete test user data package
 * @param {string} userId - Demo user ID
 * @param {boolean} testMode - Whether to generate test data
 * @returns {Object} Complete test user data
 */
export function generateTestUserData(userId, testMode = true) {
  if (!testMode) {
    return null; // Don't generate test data in production mode
  }

  const timestamp = Date.now();
  const publicKey = generateTestPublicKey(userId);
  const region = generateTestUserRegion(userId);
  const nonce = generateTestNonce(userId, timestamp);

  return {
    publicKey,
    region,
    nonce,
    timestamp,
    isTestData: true,
    reliability: 1.0, // Full reliability for test users
    sybilStatus: 'verified', // Test users are pre-verified
    authStatus: 'authenticated'
  };
}

/**
 * Generate test vote data that passes validation
 * @param {Object} voteRequest - Vote request data
 * @param {Object} testUserData - Test user data
 * @returns {Object} Valid vote data for production systems
 */
export function generateTestVoteData(voteRequest, testUserData) {
  const { channelId, candidateId, userId } = voteRequest;
  
  const voteData = {
    topic: channelId,
    voteType: 'binary', // Standard vote type
    choice: candidateId,
    timestamp: testUserData.timestamp,
    nonce: testUserData.nonce,
    publicKey: testUserData.publicKey,
    signatureScheme: 'ecdsa'
  };

  // Generate signature for this vote data
  voteData.signature = generateTestSignature(voteData, userId);

  return voteData;
}

/**
 * Create test channel data with inflated candidate lists
 * @param {string} channelId - Channel ID
 * @param {boolean} testMode - Whether to inflate with test data
 * @returns {Object} Channel data with candidates
 */
export function generateTestChannelData(channelId, testMode = true) {
  if (!testMode) {
    return null;
  }

  // Generate test candidates for demonstration
  const candidatesByChannel = {
    'Local Government': [
      { id: '@seattlecitycouncil', name: 'Seattle City Council', votes: 2341 },
      { id: '@portlandgov', name: 'Portland Government', votes: 1834 },
      { id: '@sfgov', name: 'San Francisco Government', votes: 1523 },
      { id: '@vancouvercity', name: 'Vancouver City', votes: 892 },
      { id: '@bellevuecity', name: 'Bellevue City', votes: 567 }
    ],
    'sustainable-cities': [
      { id: 'oriazoulay768', name: 'Ori Azoulay - Sustainable Transport', votes: 9350 },
      { id: 'ronikatz228', name: 'Roni Katz - Urban Planning', votes: 14024 }
    ],
    'Pizza': [
      { id: '@tonypizzapalace', name: 'Tony\'s Pizza Palace', votes: 1834 },
      { id: '@pizzaloversunited', name: 'Pizza Lovers United', votes: 892 },
      { id: '@neapolitanmaster', name: 'Neapolitan Master', votes: 241 },
      { id: '@sliceparadise', name: 'Slice Paradise', votes: 423 },
      { id: '@doughdelight', name: 'Dough Delight', votes: 334 }
    ]
  };

  return candidatesByChannel[channelId] || [];
}
