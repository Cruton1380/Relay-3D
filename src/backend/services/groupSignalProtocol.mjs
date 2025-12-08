/**
 * @fileoverview Group Signal Protocol implementation using Sender Keys
 * Extends Signal Protocol for encrypted group messaging in chatrooms
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import SignalProtocol from './signalProtocol.mjs';
import securityConfig from '../config/securityConfig.mjs';

class GroupSignalProtocol extends SignalProtocol {
  constructor() {
    super();
    
    // Group-specific configuration
    this.groupSessionsFilePath = path.join(process.cwd(), 'data', 'security', 'group-signal-sessions.json');
    this.senderKeysFilePath = path.join(process.cwd(), 'data', 'sender-keys.json');
    
    // In-memory stores for group sessions
    this.groupSessions = new Map(); // groupId -> session state
    this.senderKeys = new Map(); // groupId -> Map(senderId -> senderKey)
    this.membershipStates = new Map(); // groupId -> Set(memberIds)
  }

  async initialize() {
    await super.initialize();
    
    try {
      await this.loadGroupSessions();
      await this.loadSenderKeys();
      
      console.log('Group Signal Protocol initialized');
      return this;
    } catch (error) {
      console.error('Failed to initialize Group Signal Protocol:', error);
      throw error;
    }
  }

  /**
   * Create a new group session for a channel
   * @param {string} groupId - Channel/group identifier
   * @param {string} creatorId - Creator's user ID
   * @param {Array<string>} memberIds - Initial member IDs
   * @returns {Object} Group session initialization data
   */
  async createGroupSession(groupId, creatorId, memberIds = []) {
    try {
      // Generate group master key
      const groupMasterKey = crypto.randomBytes(this.keyLength);
      
      // Initialize sender key for creator
      const creatorSenderKey = await this.generateSenderKey(groupId, creatorId);
      
      // Create group session state
      const groupSession = {
        groupId,
        masterKey: groupMasterKey,
        createdAt: Date.now(),
        creatorId,
        memberIds: new Set([creatorId, ...memberIds]),
        messageNumber: 0,
        epochNumber: 0
      };
      
      // Store group session
      this.groupSessions.set(groupId, groupSession);
      this.membershipStates.set(groupId, new Set([creatorId, ...memberIds]));
      
      // Initialize sender keys map for this group
      if (!this.senderKeys.has(groupId)) {
        this.senderKeys.set(groupId, new Map());
      }
      this.senderKeys.get(groupId).set(creatorId, creatorSenderKey);
      
      await this.saveGroupSession(groupId, groupSession);
      await this.saveSenderKeys();
      
      console.log(`Created group session for ${groupId} with ${memberIds.length + 1} members`);
      
      // Log security event
      securityConfig.logSecurityEvent('group_session_created', {
        groupId,
        creatorId,
        memberCount: memberIds.length + 1,
        memberIds: Array.from(groupSession.memberIds)
      });
      
      return {
        success: true,
        groupId,
        masterKey: groupMasterKey.toString('base64'),
        senderKey: creatorSenderKey,
        memberIds: Array.from(groupSession.memberIds)
      };
    } catch (error) {
      console.error(`Failed to create group session for ${groupId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add member to group session
   * @param {string} groupId - Group identifier
   * @param {string} memberId - New member's ID
   * @param {string} addedBy - ID of user adding the member
   * @returns {Object} Addition result
   */
  async addGroupMember(groupId, memberId, addedBy) {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new Error(`Group session ${groupId} not found`);
    }

    if (!groupSession.memberIds.has(addedBy)) {
      throw new Error(`User ${addedBy} is not authorized to add members`);
    }

    try {
      // Generate sender key for new member
      const memberSenderKey = await this.generateSenderKey(groupId, memberId);
      
      // Add to group session
      groupSession.memberIds.add(memberId);
      this.membershipStates.get(groupId).add(memberId);
      this.senderKeys.get(groupId).set(memberId, memberSenderKey);
      
      // Increment epoch (forward secrecy)
      groupSession.epochNumber++;
      
      await this.saveGroupSession(groupId, groupSession);
      await this.saveSenderKeys();
      
      console.log(`Added member ${memberId} to group ${groupId}`);
      
      // Log security event
      securityConfig.logSecurityEvent('member_added', {
        groupId,
        memberId,
        addedBy,
        epochNumber: groupSession.epochNumber,
        newMemberCount: groupSession.memberIds.size
      });
      
      return {
        success: true,
        memberId,
        senderKey: memberSenderKey,
        epochNumber: groupSession.epochNumber
      };
    } catch (error) {
      console.error(`Failed to add member ${memberId} to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Remove member from group session
   * @param {string} groupId - Group identifier
   * @param {string} memberId - Member ID to remove
   * @param {string} removedBy - ID of user removing the member
   * @returns {Object} Removal result
   */
  async removeGroupMember(groupId, memberId, removedBy) {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new Error(`Group session ${groupId} not found`);
    }

    if (!groupSession.memberIds.has(removedBy)) {
      throw new Error(`User ${removedBy} is not authorized to remove members`);
    }

    try {
      // Remove from group session
      groupSession.memberIds.delete(memberId);
      this.membershipStates.get(groupId).delete(memberId);
      this.senderKeys.get(groupId).delete(memberId);
      
      // Increment epoch for forward secrecy
      groupSession.epochNumber++;
      
      await this.saveGroupSession(groupId, groupSession);
      await this.saveSenderKeys();
      
      console.log(`Removed member ${memberId} from group ${groupId}`);
      
      // Log security event
      securityConfig.logSecurityEvent('member_removed', {
        groupId,
        memberId,
        removedBy,
        epochNumber: groupSession.epochNumber,
        remainingMemberCount: groupSession.memberIds.size
      });
      
      return {
        success: true,
        memberId,
        epochNumber: groupSession.epochNumber
      };
    } catch (error) {
      console.error(`Failed to remove member ${memberId} from group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt message for group using sender key
   * @param {string} groupId - Group identifier
   * @param {string} senderId - Sender's ID
   * @param {string|Object} message - Message to encrypt
   * @returns {Object} Encrypted group message
   */
  async encryptGroupMessage(groupId, senderId, message) {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new Error(`Group session ${groupId} not found`);
    }

    if (!groupSession.memberIds.has(senderId)) {
      throw new Error(`User ${senderId} is not a member of group ${groupId}`);
    }

    try {
      const senderKey = this.senderKeys.get(groupId).get(senderId);
      if (!senderKey) {
        throw new Error(`Sender key not found for ${senderId} in group ${groupId}`);
      }

      // Derive message key from sender key chain
      const messageKey = this.deriveSenderMessageKey(senderKey, senderKey.chainIndex);
      
      // Advance sender key chain
      senderKey.chainIndex++;
      senderKey.chainKey = this.advanceChainKey(senderKey.chainKey);

      // Encrypt message
      const plaintext = typeof message === 'string' ? message : JSON.stringify(message);
      const nonce = crypto.randomBytes(this.nonceLength);
      
      const cipher = crypto.createCipher('chacha20-poly1305', messageKey);
      cipher.setAAD(nonce);
      
      let ciphertext = cipher.update(plaintext, 'utf8');
      ciphertext = Buffer.concat([ciphertext, cipher.final()]);
      const authTag = cipher.getAuthTag();

      const encryptedMessage = {
        groupId,
        senderId,
        epochNumber: groupSession.epochNumber,
        chainIndex: senderKey.chainIndex - 1,
        nonce: nonce.toString('base64'),
        ciphertext: ciphertext.toString('base64'),
        authTag: authTag.toString('base64'),
        timestamp: Date.now()
      };

      // Increment group message number
      groupSession.messageNumber++;
      
      await this.saveGroupSession(groupId, groupSession);
      await this.saveSenderKeys();

      console.log(`Encrypted group message for ${groupId} from ${senderId}`);
      
      // Log security event
      securityConfig.logSecurityEvent('encryption_success', {
        groupId,
        senderId,
        epochNumber: groupSession.epochNumber,
        messageLength: plaintext.length
      });
      
      return encryptedMessage;
    } catch (error) {
      console.error(`Failed to encrypt group message for ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Decrypt group message using sender key
   * @param {string} groupId - Group identifier
   * @param {Object} encryptedMessage - Encrypted message
   * @returns {string} Decrypted message
   */
  async decryptGroupMessage(groupId, encryptedMessage) {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new Error(`Group session ${groupId} not found`);
    }

    const { senderId, epochNumber, chainIndex, nonce, ciphertext, authTag } = encryptedMessage;

    // Verify epoch number
    if (epochNumber !== groupSession.epochNumber) {
      throw new Error('Message from different epoch - member changes detected');
    }

    try {
      const senderKey = this.senderKeys.get(groupId).get(senderId);
      if (!senderKey) {
        throw new Error(`Sender key not found for ${senderId} in group ${groupId}`);
      }

      // Derive message key for specific chain index
      const messageKey = this.deriveSenderMessageKey(senderKey, chainIndex);

      // Decrypt message
      const decipher = crypto.createDecipher('chacha20-poly1305', messageKey);
      decipher.setAAD(Buffer.from(nonce, 'base64'));
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      
      let decrypted = decipher.update(Buffer.from(ciphertext, 'base64'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      console.log(`Decrypted group message for ${groupId} from ${senderId}`);
      
      // Log security event
      securityConfig.logSecurityEvent('decryption_success', {
        groupId,
        receiverId: senderId,
        originalSenderId: encryptedMessage.senderId,
        epochNumber: encryptedMessage.epochNumber
      });
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error(`Failed to decrypt group message for ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Generate sender key for group member
   * @param {string} groupId - Group identifier
   * @param {string} memberId - Member identifier
   * @returns {Object} Sender key state
   */
  async generateSenderKey(groupId, memberId) {
    const seedData = Buffer.concat([
      Buffer.from(groupId, 'utf8'),
      Buffer.from(memberId, 'utf8'),
      crypto.randomBytes(16)
    ]);

    const chainKey = this.hkdf(seedData, Buffer.alloc(32), 'SenderKey_Chain', 32);
    const signingKey = this.hkdf(seedData, Buffer.alloc(32), 'SenderKey_Signing', 32);

    return {
      groupId,
      memberId,
      chainKey,
      signingKey,
      chainIndex: 0,
      createdAt: Date.now()
    };
  }

  /**
   * Derive message key from sender key chain
   * @param {Object} senderKey - Sender key state
   * @param {number} chainIndex - Chain index for message
   * @returns {Buffer} Message key
   */
  deriveSenderMessageKey(senderKey, chainIndex) {
    const input = Buffer.concat([
      senderKey.chainKey,
      Buffer.from([chainIndex & 0xff, (chainIndex >> 8) & 0xff])
    ]);
    return this.hkdf(input, Buffer.alloc(32), 'SenderMessage', 32);
  }

  /**
   * Load group sessions from storage
   */
  async loadGroupSessions() {
    try {
      const data = await fs.readFile(this.groupSessionsFilePath, 'utf8');
      const sessions = JSON.parse(data);
      
      for (const [groupId, sessionData] of Object.entries(sessions)) {
        const session = this.deserializeGroupSession(sessionData);
        this.groupSessions.set(groupId, session);
        this.membershipStates.set(groupId, session.memberIds);
      }
      
      console.log(`Loaded ${this.groupSessions.size} group Signal Protocol sessions`);
    } catch (error) {
      await fs.writeFile(this.groupSessionsFilePath, '{}');
    }
  }

  /**
   * Load sender keys from storage
   */
  async loadSenderKeys() {
    try {
      const data = await fs.readFile(this.senderKeysFilePath, 'utf8');
      const keys = JSON.parse(data);
      
      for (const [groupId, groupKeys] of Object.entries(keys)) {
        const senderKeysMap = new Map();
        for (const [memberId, keyData] of Object.entries(groupKeys)) {
          senderKeysMap.set(memberId, this.deserializeSenderKey(keyData));
        }
        this.senderKeys.set(groupId, senderKeysMap);
      }
      
      console.log(`Loaded sender keys for ${this.senderKeys.size} groups`);
    } catch (error) {
      await fs.writeFile(this.senderKeysFilePath, '{}');
    }
  }

  /**
   * Save group session to storage
   */
  async saveGroupSession(groupId, session) {
    try {
      const sessionsData = await fs.readFile(this.groupSessionsFilePath, 'utf8').catch(() => '{}');
      const sessions = JSON.parse(sessionsData);
      
      sessions[groupId] = this.serializeGroupSession(session);
      
      await fs.writeFile(this.groupSessionsFilePath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Failed to save group session:', error);
    }
  }

  /**
   * Save sender keys to storage
   */
  async saveSenderKeys() {
    try {
      const keysData = {};
      
      for (const [groupId, senderKeysMap] of this.senderKeys.entries()) {
        keysData[groupId] = {};
        for (const [memberId, senderKey] of senderKeysMap.entries()) {
          keysData[groupId][memberId] = this.serializeSenderKey(senderKey);
        }
      }
      
      await fs.writeFile(this.senderKeysFilePath, JSON.stringify(keysData, null, 2));
    } catch (error) {
      console.error('Failed to save sender keys:', error);
    }
  }

  /**
   * Serialize group session for storage
   */
  serializeGroupSession(session) {
    return {
      groupId: session.groupId,
      masterKey: session.masterKey.toString('base64'),
      createdAt: session.createdAt,
      creatorId: session.creatorId,
      memberIds: Array.from(session.memberIds),
      messageNumber: session.messageNumber,
      epochNumber: session.epochNumber
    };
  }

  /**
   * Deserialize group session from storage
   */
  deserializeGroupSession(data) {
    return {
      groupId: data.groupId,
      masterKey: Buffer.from(data.masterKey, 'base64'),
      createdAt: data.createdAt,
      creatorId: data.creatorId,
      memberIds: new Set(data.memberIds),
      messageNumber: data.messageNumber,
      epochNumber: data.epochNumber
    };
  }

  /**
   * Serialize sender key for storage
   */
  serializeSenderKey(senderKey) {
    return {
      groupId: senderKey.groupId,
      memberId: senderKey.memberId,
      chainKey: senderKey.chainKey.toString('base64'),
      signingKey: senderKey.signingKey.toString('base64'),
      chainIndex: senderKey.chainIndex,
      createdAt: senderKey.createdAt
    };
  }

  /**
   * Deserialize sender key from storage
   */
  deserializeSenderKey(data) {
    return {
      groupId: data.groupId,
      memberId: data.memberId,
      chainKey: Buffer.from(data.chainKey, 'base64'),
      signingKey: Buffer.from(data.signingKey, 'base64'),
      chainIndex: data.chainIndex,
      createdAt: data.createdAt
    };
  }

  /**
   * Get group members
   * @param {string} groupId - Group identifier
   * @returns {Array<string>} Member IDs
   */
  getGroupMembers(groupId) {
    const memberIds = this.membershipStates.get(groupId);
    return memberIds ? Array.from(memberIds) : [];
  }

  /**
   * Check if user is group member
   * @param {string} groupId - Group identifier
   * @param {string} userId - User identifier
   * @returns {boolean} Is member
   */
  isGroupMember(groupId, userId) {
    const memberIds = this.membershipStates.get(groupId);
    return memberIds ? memberIds.has(userId) : false;
  }
}

export default GroupSignalProtocol;
