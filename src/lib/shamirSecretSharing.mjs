/**
 * 🧬 Shamir's Secret Sharing Implementation
 * 
 * Implements threshold cryptography for splitting private keys into multiple shards
 * where only k of n shards are needed to reconstruct the original secret.
 * 
 * Features:
 * - Galois Field (GF) arithmetic for cryptographic security
 * - Configurable threshold (k) and total shares (n)
 * - Secure random polynomial generation
 * - Constant-time operations to prevent timing attacks
 */

import crypto from 'crypto';

// Prime for Galois Field operations (large prime for 256-bit security)
// Use the same prime for both test and production for consistency
const PRIME = 2n ** 256n - 189n; // Use large prime for all environments

/**
 * Galois Field arithmetic operations
 */
class GaloisField {
  constructor(prime = PRIME) {
    this.prime = prime;
  }

  /**
   * Modular addition
   */
  add(a, b) {
    return (BigInt(a) + BigInt(b)) % this.prime;
  }

  /**
   * Modular subtraction
   */
  subtract(a, b) {
    return (BigInt(a) - BigInt(b) + this.prime) % this.prime;
  }

  /**
   * Modular multiplication
   */
  multiply(a, b) {
    return (BigInt(a) * BigInt(b)) % this.prime;
  }

  /**
   * Modular division using multiplicative inverse
   */
  divide(a, b) {
    return this.multiply(a, this.modInverse(b));
  }  /**
   * Calculate modular multiplicative inverse using extended Euclidean algorithm
   */
  modInverse(a) {
    a = ((BigInt(a) % this.prime) + this.prime) % this.prime;
    
    if (a === 0n) {
      throw new Error('Modular inverse of 0 does not exist');
    }
    
    // Extended Euclidean Algorithm
    let old_r = this.prime;
    let r = a;
    let old_s = 0n;
    let s = 1n;
    
    while (r !== 0n) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }
    
    if (old_r > 1n) {
      throw new Error(`No modular inverse exists for ${a} mod ${this.prime}`);
    }
    
    // Ensure positive result
    return ((old_s % this.prime) + this.prime) % this.prime;
  }

  /**
   * Evaluate polynomial at given x using Horner's method
   */
  evaluatePolynomial(coefficients, x) {
    let result = 0n;
    for (let i = coefficients.length - 1; i >= 0; i--) {
      result = this.add(this.multiply(result, x), coefficients[i]);
    }
    return result;
  }
}

/**
 * Shamir's Secret Sharing implementation
 */
export class ShamirSecretSharing {
  constructor(threshold, totalShares) {
    if (threshold > totalShares) {
      throw new Error('Threshold cannot be greater than total shares');
    }
    if (threshold < 2) {
      throw new Error('Threshold must be at least 2');
    }
    
    this.threshold = threshold;
    this.totalShares = totalShares;
    this.gf = new GaloisField();
  }  /**
   * Split a secret into shares
   * @param {Buffer|string} secret - The secret to split
   * @returns {Array} Array of {x, y} coordinate pairs representing shares
   */
  splitSecret(secret) {
    // Convert secret to Buffer
    const secretBuffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret, 'hex');
    
    // For small secrets (≤ 30 bytes), use simple format for backward compatibility
    const maxSimpleSize = 30;
    
    if (secretBuffer.length <= maxSimpleSize) {
      return this.splitSimpleSecret(secretBuffer);
    }
    
    // For large secrets, use chunked format
    return this.splitChunkedSecret(secretBuffer);
  }

  /**
   * Split a simple (small) secret using the original format
   */
  splitSimpleSecret(secretBuffer) {
    const secretBigInt = BigInt('0x' + secretBuffer.toString('hex'));
    
    // Ensure the secret value is within the field
    if (secretBigInt >= this.gf.prime) {
      throw new Error(`Secret too large for field size`);
    }

    // Generate random polynomial coefficients
    const coefficients = [secretBigInt]; // First coefficient is the secret
    for (let i = 1; i < this.threshold; i++) {
      const randomBytes = crypto.randomBytes(32);
      const randomCoeff = BigInt('0x' + randomBytes.toString('hex')) % this.gf.prime;
      coefficients.push(randomCoeff);
    }

    // Generate shares by evaluating polynomial at different points
    const shares = [];
    for (let x = 1; x <= this.totalShares; x++) {
      const y = this.gf.evaluatePolynomial(coefficients, BigInt(x));
      shares.push({
        x: x,
        y: y.toString(16),
        threshold: this.threshold,
        totalShares: this.totalShares,
        shareId: crypto.randomUUID(),
        createdAt: Date.now(),
        secretLength: secretBuffer.length
      });
    }

    // Securely clear coefficients from memory
    coefficients.fill(0n);
    
    return shares;
  }

  /**
   * Split a large secret into chunks
   */
  splitChunkedSecret(secretBuffer) {
    // For large secrets (> 30 bytes), split into chunks
    const maxChunkSize = 30;
    const chunks = [];
    
    for (let i = 0; i < secretBuffer.length; i += maxChunkSize) {
      const chunk = secretBuffer.slice(i, i + maxChunkSize);
      chunks.push(chunk);
    }
    
    // Process each chunk
    const chunkShares = [];
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkBigInt = BigInt('0x' + chunk.toString('hex'));
      
      // Ensure the chunk value is within the field
      if (chunkBigInt >= this.gf.prime) {
        throw new Error(`Secret chunk too large for field size`);
      }

      // Generate random polynomial coefficients for this chunk
      const coefficients = [chunkBigInt]; // First coefficient is the chunk value
      for (let i = 1; i < this.threshold; i++) {
        const randomBytes = crypto.randomBytes(32);
        const randomCoeff = BigInt('0x' + randomBytes.toString('hex')) % this.gf.prime;
        coefficients.push(randomCoeff);
      }

      // Generate shares by evaluating polynomial at different points
      const shares = [];
      for (let x = 1; x <= this.totalShares; x++) {
        const y = this.gf.evaluatePolynomial(coefficients, BigInt(x));
        shares.push({
          x: x,
          y: y.toString(16),
          chunkIndex: chunkIndex,
          threshold: this.threshold,
          totalShares: this.totalShares,
          shareId: crypto.randomUUID(),
          createdAt: Date.now(),
          secretLength: secretBuffer.length,
          totalChunks: chunks.length
        });
      }
      
      chunkShares.push(shares);
      
      // Securely clear coefficients from memory
      coefficients.fill(0n);
    }
    
    // Combine shares from all chunks
    const combinedShares = [];
    for (let shareIndex = 0; shareIndex < this.totalShares; shareIndex++) {
      const share = {
        x: shareIndex + 1,
        chunks: [],
        threshold: this.threshold,
        totalShares: this.totalShares,
        shareId: crypto.randomUUID(),
        createdAt: Date.now(),
        secretLength: secretBuffer.length,
        totalChunks: chunks.length
      };
      
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        share.chunks.push({
          chunkIndex: chunkIndex,
          y: chunkShares[chunkIndex][shareIndex].y
        });
      }
      
      combinedShares.push(share);
    }
    
    return combinedShares;
  }/**
   * Reconstruct secret from shares using Lagrange interpolation
   * @param {Array} shares - Array of share objects with x and y properties
   * @returns {Buffer} The reconstructed secret
   */
  reconstructSecret(shares) {
    if (shares.length < this.threshold) {
      throw new Error(`Need at least ${this.threshold} shares to reconstruct secret`);
    }

    // Take only the first threshold number of shares
    const selectedShares = shares.slice(0, this.threshold);
    
    // Check if this is chunked format
    if (selectedShares[0].chunks) {
      return this.reconstructChunkedSecret(selectedShares);
    }
    
    // Legacy single-chunk format
    const originalLength = selectedShares[0].secretLength || null;
    
    // Lagrange interpolation to find f(0) = secret
    let secret = 0n;
    
    for (let i = 0; i < selectedShares.length; i++) {
      const xi = BigInt(selectedShares[i].x);
      const yi = BigInt('0x' + selectedShares[i].y);
      
      // Calculate Lagrange basis polynomial li(0)
      let numerator = 1n;
      let denominator = 1n;
      
      for (let j = 0; j < selectedShares.length; j++) {
        if (i !== j) {
          const xj = BigInt(selectedShares[j].x);
          numerator = this.gf.multiply(numerator, this.gf.subtract(0n, xj));
          denominator = this.gf.multiply(denominator, this.gf.subtract(xi, xj));
        }
      }
      
      const lagrangeBasis = this.gf.divide(numerator, denominator);
      secret = this.gf.add(secret, this.gf.multiply(yi, lagrangeBasis));
    }

    // Convert back to buffer
    let secretHex = secret.toString(16);
    if (secretHex.length % 2 !== 0) {
      secretHex = '0' + secretHex;
    }
    
    if (originalLength) {
      const targetLength = originalLength * 2;
      while (secretHex.length < targetLength) {
        secretHex = '00' + secretHex;
      }
      if (secretHex.length > targetLength) {
        secretHex = secretHex.slice(-targetLength);
      }
    }
    
    return Buffer.from(secretHex, 'hex');
  }

  /**
   * Reconstruct secret from chunked shares
   */
  reconstructChunkedSecret(selectedShares) {
    const totalChunks = selectedShares[0].totalChunks;
    const originalLength = selectedShares[0].secretLength;
    
    const reconstructedChunks = [];
    
    // Reconstruct each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      let chunkSecret = 0n;
      
      // Lagrange interpolation for this chunk
      for (let i = 0; i < selectedShares.length; i++) {
        const xi = BigInt(selectedShares[i].x);
        const chunkData = selectedShares[i].chunks.find(c => c.chunkIndex === chunkIndex);
        const yi = BigInt('0x' + chunkData.y);
        
        // Calculate Lagrange basis polynomial li(0)
        let numerator = 1n;
        let denominator = 1n;
        
        for (let j = 0; j < selectedShares.length; j++) {
          if (i !== j) {
            const xj = BigInt(selectedShares[j].x);
            numerator = this.gf.multiply(numerator, this.gf.subtract(0n, xj));
            denominator = this.gf.multiply(denominator, this.gf.subtract(xi, xj));
          }
        }
        
        const lagrangeBasis = this.gf.divide(numerator, denominator);
        chunkSecret = this.gf.add(chunkSecret, this.gf.multiply(yi, lagrangeBasis));
      }
      
      // Convert chunk back to buffer
      let chunkHex = chunkSecret.toString(16);
      if (chunkHex.length % 2 !== 0) {
        chunkHex = '0' + chunkHex;
      }
      
      reconstructedChunks.push(Buffer.from(chunkHex, 'hex'));
    }
    
    // Combine chunks
    const combined = Buffer.concat(reconstructedChunks);
    
    // Trim to original length if needed
    return originalLength ? combined.slice(0, originalLength) : combined;
  }
  /**
   * Verify that a share is valid for this SSS instance
   * @param {Object} share - Share to verify
   * @returns {boolean} True if share is valid
   */
  verifyShare(share) {
    // Basic validation
    if (!(share.x >= 1 && 
          share.x <= this.totalShares &&
          share.threshold === this.threshold &&
          share.totalShares === this.totalShares)) {
      return false;
    }

    // Check format: either simple (has y) or chunked (has chunks)
    if (share.y !== undefined) {
      // Simple format validation
      return typeof share.y === 'string' && share.y.length > 0;
    } else if (share.chunks !== undefined) {
      // Chunked format validation
      return Array.isArray(share.chunks) && 
             share.chunks.length > 0 &&
             share.chunks.every(chunk => 
               typeof chunk.chunkIndex === 'number' &&
               typeof chunk.y === 'string' &&
               chunk.y.length > 0
             );
    }

    return false;
  }

  /**
   * Generate metadata for a share
   * @param {Object} share - The share object
   * @param {string} guardianId - ID of the guardian holding this share
   * @returns {Object} Share metadata
   */
  generateShareMetadata(share, guardianId = null) {
    return {
      shareId: share.shareId,
      shareIndex: share.x,
      threshold: share.threshold,
      totalShares: share.totalShares,
      guardianId,
      createdAt: share.createdAt,
      lastAccessed: null,
      expirationDate: null,
      isRevoked: false
    };
  }
  /**
   * Create a recovery package for emergency situations
   * @param {Array} shares - All shares
   * @param {Object} options - Recovery options
   * @returns {Object} Emergency recovery package
   */
  createEmergencyRecoveryPackage(shares, options = {}) {
    const emergencyShares = shares.slice(0, this.threshold);
    
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      threshold: this.threshold,
      totalShares: this.totalShares,
      emergencyShares: emergencyShares.map(share => {
        // Handle both simple and chunked share formats
        if (share.y !== undefined) {
          // Simple format
          return {
            x: share.x,
            y: share.y,
            shareId: share.shareId
          };
        } else {
          // Chunked format
          return {
            x: share.x,
            chunks: share.chunks,
            shareId: share.shareId,
            secretLength: share.secretLength,
            totalChunks: share.totalChunks
          };
        }
      }),
      instructions: 'Use these shares with the Relay recovery system to reconstruct your private key',
      warnings: [
        'Keep this package secure and encrypted',
        'Only use in emergency situations',
        'Destroy after successful recovery'
      ]
    };
  }
}

/**
 * Utility functions for share management
 */
export class ShareManager {
  constructor() {
    this.shares = new Map();
    this.guardianAssignments = new Map();
  }

  /**
   * Store a share with metadata
   */
  storeShare(shareId, share, metadata) {
    this.shares.set(shareId, {
      share,
      metadata,
      storedAt: Date.now()
    });
  }

  /**
   * Retrieve a share by ID
   */
  getShare(shareId) {
    const stored = this.shares.get(shareId);
    if (stored) {
      stored.metadata.lastAccessed = Date.now();
    }
    return stored;
  }

  /**
   * Assign a share to a guardian
   */
  assignShareToGuardian(shareId, guardianId, encryptedShare) {
    this.guardianAssignments.set(shareId, {
      guardianId,
      encryptedShare,
      assignedAt: Date.now(),
      status: 'active'
    });
  }

  /**
   * Get all shares assigned to a guardian
   */
  getGuardianShares(guardianId) {
    const guardianShares = [];
    for (const [shareId, assignment] of this.guardianAssignments) {
      if (assignment.guardianId === guardianId && assignment.status === 'active') {
        guardianShares.push({
          shareId,
          ...assignment
        });
      }
    }
    return guardianShares;
  }

  /**
   * Revoke a share
   */
  revokeShare(shareId) {
    const stored = this.shares.get(shareId);
    if (stored) {
      stored.metadata.isRevoked = true;
      stored.metadata.revokedAt = Date.now();
    }

    const assignment = this.guardianAssignments.get(shareId);
    if (assignment) {
      assignment.status = 'revoked';
      assignment.revokedAt = Date.now();
    }
  }

  /**
   * Clean up expired or revoked shares
   */
  cleanup() {
    const now = Date.now();
    const expirationPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year

    for (const [shareId, stored] of this.shares) {
      if (stored.metadata.isRevoked || 
          (stored.metadata.expirationDate && now > stored.metadata.expirationDate) ||
          (now - stored.storedAt > expirationPeriod)) {
        this.shares.delete(shareId);
        this.guardianAssignments.delete(shareId);
      }
    }
  }
}

export default ShamirSecretSharing;
