/**
 * Blockchain User Registration Service
 * Handles user keypair registration and token tracking on blockchain
 */

import blockchain from '../blockchain-service/index.mjs';
import crypto from 'crypto';

export class BlockchainUserService {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        await blockchain.initialize();
        this.initialized = true;
    }

    /**
     * Register a new user on the blockchain
     */
    async registerUser(userData) {
        const { userId, publicKey, biometricHash, invitedBy, initialTokens } = userData;
        
        // Create nonce for this transaction
        const nonce = crypto.randomUUID();
        
        // Prepare user registration data
        const registrationData = {
            userId,
            publicKey,
            biometricHashSignature: this.hashBiometric(biometricHash),
            invitedBy,
            initialTokens,
            registeredAt: Date.now(),
            onboardingComplete: true
        };
        
        // Add to blockchain
        await blockchain.addTransaction('user_registration', registrationData, nonce);
        await blockchain.mine();
        
        return {
            success: true,
            userId,
            blockchainRegistered: true,
            tokenCount: initialTokens
        };
    }

    /**
     * Update user token count on blockchain
     */
    async updateUserTokens(userId, newTokenCount, reason) {
        const currentTokens = await this.getUserTokenCount(userId);
        const nonce = crypto.randomUUID();
        
        const tokenUpdate = {
            userId,
            previousTokens: currentTokens,
            newTokens: newTokenCount,
            reason,
            timestamp: Date.now()
        };
        
        await blockchain.addTransaction('token_update', tokenUpdate, nonce);
        await blockchain.mine();
        
        return newTokenCount;
    }

    /**
     * Adjust user token count by a delta amount (positive or negative)
     */
    async adjustUserTokens(userId, deltaTokens, reason) {
        const currentTokens = await this.getUserTokenCount(userId);
        const newTokenCount = Math.max(0, currentTokens + deltaTokens); // Ensure non-negative
        
        return await this.updateUserTokens(userId, newTokenCount, reason);
    }

    /**
     * Get user's current token count from blockchain
     */
    async getUserTokenCount(userId) {
        let tokenCount = 0;
        
        // Traverse blockchain to find user registration and updates
        for (const block of blockchain.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'user_registration' && tx.data.userId === userId) {
                    tokenCount = tx.data.initialTokens;
                } else if (tx.type === 'token_update' && tx.data.userId === userId) {
                    tokenCount = tx.data.newTokens;
                }
            }
        }
        
        return tokenCount;
    }

    /**
     * Verify user exists on blockchain
     */
    async verifyUserExists(publicKey) {
        for (const block of blockchain.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'user_registration' && tx.data.publicKey === publicKey) {
                    return {
                        exists: true,
                        userId: tx.data.userId,
                        registeredAt: tx.data.registeredAt,
                        invitedBy: tx.data.invitedBy
                    };
                }
            }
        }
        
        return { exists: false };
    }

    /**
     * Check for duplicate registrations
     */
    async checkForDuplicates(publicKey, biometricSignature) {
        for (const block of blockchain.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'user_registration') {
                    if (tx.data.publicKey === publicKey) {
                        return { isDuplicate: true, type: 'keypair', existingUserId: tx.data.userId };
                    }
                    if (tx.data.biometricHashSignature === biometricSignature) {
                        return { isDuplicate: true, type: 'biometric', existingUserId: tx.data.userId };
                    }
                }
            }
        }
        
        return { isDuplicate: false };
    }

    /**
     * Hash biometric data for blockchain storage (privacy protection)
     */
    hashBiometric(biometricHash) {
        if (!biometricHash) {
            return crypto.createHash('sha256').update('default-biometric-hash').digest('hex');
        }
        return crypto.createHash('sha256').update(biometricHash).digest('hex');
    }

    /**
     * Get blockchain statistics
     */
    getBlockchainStats() {
        const stats = blockchain.getStats();
        
        // Count registered users
        let userCount = 0;
        for (const block of blockchain.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'user_registration') {
                    userCount++;
                }
            }
        }
        
        return {
            ...stats,
            registeredUsers: userCount
        };
    }
}

export default new BlockchainUserService();
