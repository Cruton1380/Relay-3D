/**
 * Crypto Service
 * Handles cryptographic operations for authentication and voting
 */

// Constants
const DB_NAME = "RelayKeyDB";
const STORE_NAME = "keys";
const DB_VERSION = 1;

// Database instance cache
let dbInstance = null;

/**
 * Open IndexedDB with caching for performance
 * @param {string} name - Database name
 * @param {number} version - Database version
 * @returns {Promise<IDBDatabase>} Database instance
 */
async function openDBCached(name = DB_NAME, version = DB_VERSION) {
  if (dbInstance && !dbInstance.closed) return dbInstance;
  
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    
    req.onsuccess = () => {
      dbInstance = req.result;
      dbInstance.onclose = () => {
        dbInstance = null; // Reset cache if the database is closed
      };
      resolve(dbInstance);
    };
    
    req.onerror = () => reject(req.error);
    
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Generate an ECDSA Ed25519 keypair for better security and compatibility
 * @returns {Promise<CryptoKeyPair>} Generated keypair
 */
export async function generateKeypair() {
  try {
    return await window.crypto.subtle.generateKey(
      "Ed25519",
      true, // extractable
      ["sign", "verify"]
    );
  } catch (err) {
    console.error("Keypair generation failed:", err);
    throw err;
  }
}

/**
 * Save keypair to IndexedDB
 * @param {CryptoKeyPair} keypair - Keypair to save
 * @returns {Promise<void>}
 */
export async function saveKeypair(keypair) {
  const db = await openDBCached();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.put(keypair.privateKey, "private");
    store.put(keypair.publicKey, "public");
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Load keypair from IndexedDB
 * @returns {Promise<CryptoKeyPair>} Loaded keypair
 */
export async function loadKeypair() {
  const db = await openDBCached();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const privateKeyReq = store.get("private");
    const publicKeyReq = store.get("public");
    
    tx.oncomplete = () => {
      if (!privateKeyReq.result || !publicKeyReq.result) {
        reject(new Error("Keys not found in IndexedDB"));
      } else {
        resolve({
          privateKey: privateKeyReq.result,
          publicKey: publicKeyReq.result
        });
      }
    };
    
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Export public key in JWK format
 * @param {CryptoKeyPair|CryptoKey} keyPair - Keypair or public key
 * @returns {Promise<Object>} JWK representation
 */
export async function exportPublicKey(keyPair) {
  const publicKey = keyPair.publicKey || keyPair;
  return window.crypto.subtle.exportKey("jwk", publicKey);
}

/**
 * Sign data using the private key
 * @param {Object|string} data - Data to sign
 * @returns {Promise<string>} Signature as hex string
 */
export async function signData(data) {
  try {
    const keypair = await loadKeypair();
    
    // Convert data to string if it's an object
    const message = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Convert to buffer for signing
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
      // Sign using WebCrypto with Ed25519
    const signature = await window.crypto.subtle.sign(
      "Ed25519",
      keypair.privateKey,
      messageBuffer
    );
    
    // Convert to hex string
    return arrayBufferToHex(signature);
  } catch (error) {
    console.error("Error signing data:", error);
    throw new Error("Failed to sign data");
  }
}

/**
 * Verify a signature
 * @param {string} message - Original message
 * @param {string} signature - Signature to verify
 * @param {CryptoKey} publicKey - Public key for verification
 * @returns {Promise<boolean>} Verification result
 */
export async function verifySignature(message, signature, publicKey) {
  try {
    // Convert message to buffer
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    
    // Convert signature from hex to ArrayBuffer
    const signatureBuffer = hexToArrayBuffer(signature);
    
    // Verify signature
    return await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: {name: "SHA-256"},
      },
      publicKey,
      signatureBuffer,
      messageBuffer
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Clear keys from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearKeys() {
  const db = await openDBCached();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.clear();
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Check if keys exist
 * @returns {Promise<boolean>} Whether keys exist
 */
export async function hasKeys() {
  try {
    const keypair = await loadKeypair();
    return !!(keypair && keypair.privateKey && keypair.publicKey);
  } catch (error) {
    return false;
  }
}

/**
 * Sign vote data with private key (specialized for voting)
 * @param {string} voteHash - Hash of vote data to sign
 * @returns {Promise<string>} Base64-encoded signature
 */
export async function signVote(voteHash) {
  try {
    const keypair = await loadKeypair();
    if (!keypair || !keypair.privateKey) {
      throw new Error('No private key available. Generate keys first.');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(voteHash);
    
    const signature = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      keypair.privateKey,
      data
    );
    
    return arrayBufferToBase64(signature);
  } catch (error) {
    console.error('❌ Vote signing failed:', error);
    throw error;
  }
}

/**
 * Generate unique nonce for vote transaction (replay protection)
 * Combines crypto-random UUID with timestamp
 * @returns {string} Unique nonce
 */
export function generateNonce() {
  return `${crypto.randomUUID()}-${Date.now()}`;
}

/**
 * Hash vote data client-side for signature
 * @param {Object} voteData - Vote object
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashVoteData(voteData) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(voteData));
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
  } catch (error) {
    console.error('❌ Vote hashing failed:', error);
    throw error;
  }
}

// Utility functions
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function hexToArrayBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

export default {
  generateKeypair,
  saveKeypair,
  loadKeypair,
  exportPublicKey,
  signData,
  verifySignature,
  clearKeys,
  hasKeys,
  signVote,
  generateNonce,
  hashVoteData
};
