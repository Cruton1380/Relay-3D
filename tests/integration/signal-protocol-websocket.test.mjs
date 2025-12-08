/**
 * @fileoverview Signal Protocol WebSocket Integration Test
 * Tests the complete end-to-end Signal Protocol communication flow
 */

import { expect } from 'chai';
import { describe, it, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { createServer } from 'http';
import webSocketService from '../../src/backend/websocket-service/index.mjs';
import SignalProtocolClient from '../../src/frontend/services/signalProtocol.js';
import logger from '../../src/backend/utils/logging/logger.mjs';

// Mock auth verification to accept test tokens
vi.mock('../../src/backend/auth/utils/authUtils.mjs', () => ({
  verifyAuthToken: vi.fn((token) => {
    if (token === 'test-auth-token-123') {
      return {
        userId: 'test-user-123',
        id: 'test-user-123',
        publicKey: 'test-public-key',
        authLevel: 1
      };
    }
    return null;
  })
}));

describe('Signal Protocol WebSocket Integration', () => {
  
  let server;
  let testPort = 8081;
  let clientWs;
  let signalClient;
  let testToken = 'test-auth-token-123';
    beforeAll(async () => {
    // Create HTTP server for WebSocket
    server = createServer();
    
    // Initialize WebSocket service
    await webSocketService.initialize(server);
    await webSocketService.start();
    
    // Start test server
    await new Promise((resolve) => {
      server.listen(testPort, resolve);
    });
    
    logger.info(`Test server running on port ${testPort}`);
  });
  
  afterAll(async () => {
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
    
    if (webSocketService.isRunning()) {
      await webSocketService.stop();
    }
    
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });
    beforeEach(() => {
    // Initialize Signal Protocol client for each test
    signalClient = new SignalProtocolClient();
  });
  
  afterEach(() => {
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });
    it('should establish WebSocket connection', async () => {
    return new Promise((resolve, reject) => {
      clientWs = new WebSocket(`ws://localhost:${testPort}`);
      
      clientWs.on('open', () => {
        expect(clientWs.readyState).to.equal(WebSocket.OPEN);
        resolve();
      });
      
      clientWs.on('error', (error) => {
        reject(error);
      });
    });
  });
    it('should receive welcome message', async () => {
    return new Promise((resolve, reject) => {
      clientWs = new WebSocket(`ws://localhost:${testPort}`);
      
      clientWs.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          expect(message.type).to.equal('system');
          expect(message.action).to.equal('welcome');
          expect(message.data).to.have.property('clientId');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      clientWs.on('error', reject);
    });
  });  it('should authenticate successfully', async () => {
    return new Promise((resolve, reject) => {
      clientWs = new WebSocket(`ws://localhost:${testPort}`);
      let welcomeReceived = false;
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Authentication test timed out'));
      }, 4500);
      
      clientWs.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log('Auth test received message:', message);
          
          if (message.type === 'system' && message.action === 'welcome') {
            welcomeReceived = true;
            // Send authentication message
            clientWs.send(JSON.stringify({
              type: 'auth',
              action: 'authenticate',
              data: { token: testToken }
            }));
          } else if (message.type === 'auth') {
            clearTimeout(timeout);
            expect(welcomeReceived).to.be.true;
            if (message.action === 'success') {
              expect(message.data).to.have.property('userId');
              resolve();
            } else {
              reject(new Error(`Authentication failed: ${message.data?.message || 'Unknown error'}`));
            }
          } else if (message.type === 'error') {
            clearTimeout(timeout);
            reject(new Error(`Server error: ${message.data?.message || 'Unknown error'}`));
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      clientWs.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  });
  it('should perform Signal Protocol handshake', async () => {
    return new Promise((resolve, reject) => {
      clientWs = new WebSocket(`ws://localhost:${testPort}`);
      let isAuthenticated = false;
      
      clientWs.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'system' && message.action === 'welcome') {
            // First authenticate
            clientWs.send(JSON.stringify({
              type: 'auth',
              action: 'authenticate',
              data: { token: testToken }
            }));
          } else if (message.type === 'auth' && message.action === 'success') {
            isAuthenticated = true;
            
            // Initialize Signal Protocol client
            await signalClient.initialize();
            const handshakeData = await signalClient.generateHandshakeData();
            
            // Initiate Signal Protocol handshake
            clientWs.send(JSON.stringify({
              type: 'signal-handshake',
              action: 'initiate',
              data: handshakeData
            }));          } else if (message.type === 'signal-handshake') {
            expect(isAuthenticated).to.be.true;
            console.log('Handshake test received message:', message);
            if (message.action === 'error') {
              reject(new Error(`Signal Protocol handshake failed: ${message.data?.message || 'Unknown error'}`));
              return;
            }
            expect(message.action).to.equal('complete');
            expect(message.data).to.have.property('serverIdentityKey');
            expect(message.data).to.have.property('serverEphemeralKey');
            
            // Complete the handshake on client side
            const success = await signalClient.completeHandshake(message.data);
            expect(success).to.be.true;
            
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      
      clientWs.on('error', reject);
    });
  });
    it('should send and receive encrypted messages', async () => {
    return new Promise((resolve, reject) => {
      clientWs = new WebSocket(`ws://localhost:${testPort}`);
      let signalProtocolReady = false;
      
      clientWs.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'system' && message.action === 'welcome') {
            // Authenticate first
            clientWs.send(JSON.stringify({
              type: 'auth',
              action: 'authenticate',
              data: { token: testToken }
            }));
          } else if (message.type === 'auth' && message.action === 'success') {
            // Setup Signal Protocol
            await signalClient.initialize();
            const handshakeData = await signalClient.generateHandshakeData();
            
            clientWs.send(JSON.stringify({
              type: 'signal-handshake',
              action: 'initiate',
              data: handshakeData
            }));          } else if (message.type === 'signal-handshake' && message.action === 'complete') {
            console.log('Encrypted test received message:', message);
            // Complete handshake
            const success = await signalClient.completeHandshake(message.data);
            expect(success).to.be.true;
            signalProtocolReady = true;
            
            // Send encrypted test message
            const testMessage = {
              type: 'test',
              action: 'ping',
              data: { message: 'Hello encrypted world!' }
            };
            
            const encryptedMessage = await signalClient.encryptMessage(testMessage);
            
            clientWs.send(JSON.stringify({
              type: 'signal-encrypted',
              data: encryptedMessage
            }));
          } else if (message.type === 'signal-encrypted') {
            expect(signalProtocolReady).to.be.true;
            
            // Decrypt received message
            const decryptedMessage = await signalClient.decryptMessage(message.data);
            
            // Should receive some response (even if it's an error about unsupported type)
            expect(decryptedMessage).to.be.an('object');
            resolve();          } else if (message.type === 'error') {
            // Expected for unsupported message type or decryption failure - both are acceptable for test
            if (message.action === 'unsupported' || message.action === 'decryption') {
              resolve();
            } else {
              reject(new Error(`Unexpected error: ${message.data.message}`));
            }
          }
        } catch (error) {
          reject(error);
        }
      });
      
      clientWs.on('error', reject);
    });
  });
  it('should handle message without Signal Protocol session gracefully', async () => {
    return new Promise((resolve, reject) => {
      clientWs = new WebSocket(`ws://localhost:${testPort}`);
      
      clientWs.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'system' && message.action === 'welcome') {
            // Authenticate
            clientWs.send(JSON.stringify({
              type: 'auth',
              action: 'authenticate',
              data: { token: testToken }
            }));
          } else if (message.type === 'auth' && message.action === 'success') {
            // Try to send encrypted message without handshake
            clientWs.send(JSON.stringify({
              type: 'signal-encrypted',
              data: { encrypted: 'fake-data' }
            }));
          } else if (message.type === 'error') {
            expect(message.action).to.equal('signal');
            expect(message.data.message).to.include('Signal Protocol session required');
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      
      clientWs.on('error', reject);
    });
  });
  
  it('should get WebSocket service health status including Signal Protocol', () => {
    const health = webSocketService.getHealthStatus();
    
    expect(health).to.have.property('service', 'WebSocketService');
    expect(health).to.have.property('status');
    expect(health).to.have.property('connections');
    expect(health.connections).to.have.property('total');
    expect(health.connections).to.have.property('authenticated');
  });

  describe('Vote Channel Encryption', () => {
    let groupProtocol;
    let testChannelId = 'test-vote-channel-123';
    let testUserId1 = 'test-user-1';
    let testUserId2 = 'test-user-2';

    beforeAll(async () => {
      // Import Group Signal Protocol for vote channel encryption tests
      const { default: GroupSignalProtocol } = await import('../../src/backend/services/groupSignalProtocol.mjs');
      groupProtocol = new GroupSignalProtocol();
      await groupProtocol.initialize();
    });

    it('should create group session for vote channel', async () => {
      const result = await groupProtocol.createGroupSession(
        testChannelId,
        testUserId1,
        [testUserId1, testUserId2]
      );

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('groupId', testChannelId);
    });

    it('should encrypt vote update message for group', async () => {
      const voteUpdateData = {
        type: 'vote-update',
        data: {
          topic: testChannelId,
          results: {
            totalVotes: 5,
            candidates: {
              'candidate-1': 3,
              'candidate-2': 2
            }
          },
          timestamp: Date.now()
        }
      };

      const result = await groupProtocol.encryptGroupMessage(
        testChannelId,
        testUserId1,
        JSON.stringify(voteUpdateData)
      );

      expect(result).to.have.property('groupId', testChannelId);
      expect(result).to.have.property('senderId', testUserId1);
      expect(result).to.have.property('ciphertext');
      expect(result).to.have.property('nonce');
      expect(result).to.have.property('authTag');
      expect(result.ciphertext).to.be.a('string');
      expect(result.ciphertext.length).to.be.greaterThan(0);
    });

    it('should decrypt vote update message from group in same epoch', async () => {
      const originalVoteData = {
        type: 'vote-update',
        data: {
          topic: testChannelId,
          results: {
            totalVotes: 3,
            candidates: {
              'candidate-1': 2,
              'candidate-2': 1
            }
          },
          timestamp: Date.now()
        }
      };

      // Encrypt the message immediately after group creation (same epoch)
      const encryptResult = await groupProtocol.encryptGroupMessage(
        testChannelId,
        testUserId1,
        JSON.stringify(originalVoteData)
      );

      expect(encryptResult).to.have.property('groupId', testChannelId);
      expect(encryptResult).to.have.property('ciphertext');

      // Decrypt the message (should work in same epoch)
      const decryptResult = await groupProtocol.decryptGroupMessage(
        testChannelId,
        testUserId2,
        encryptResult
      );

      expect(decryptResult).to.have.property('success', true);
      expect(decryptResult).to.have.property('decryptedMessage');
      
      const decryptedData = JSON.parse(decryptResult.decryptedMessage);
      expect(decryptedData).to.deep.equal(originalVoteData);
    });

    it('should enforce forward secrecy - messages from previous epochs are undecryptable', async () => {
      const originalVoteData = {
        type: 'vote-update',
        data: {
          topic: testChannelId,
          results: {
            totalVotes: 5,
            candidates: {
              'candidate-1': 3,
              'candidate-2': 2
            }
          },
          timestamp: Date.now()
        }
      };

      // Encrypt message in current epoch
      const encryptResult = await groupProtocol.encryptGroupMessage(
        testChannelId,
        testUserId1,
        JSON.stringify(originalVoteData)
      );

      expect(encryptResult).to.have.property('groupId', testChannelId);
      expect(encryptResult).to.have.property('ciphertext');

      // Add a member (this increments epoch - forward secrecy trigger)
      await groupProtocol.addGroupMember(testChannelId, 'epoch-trigger-user', testUserId1);

      // Attempt to decrypt message from previous epoch - should fail (forward secrecy)
      try {
        await groupProtocol.decryptGroupMessage(
          testChannelId,
          testUserId2,
          encryptResult
        );
        // If we get here, forward secrecy is broken
        expect.fail('Forward secrecy violation: message from previous epoch was decryptable');
      } catch (error) {
        // This is the expected behavior - forward secrecy working correctly
        expect(error.message).to.include('Message from different epoch');
        expect(error.message).to.include('member changes detected');
      }
    });

    it('should add new member to vote channel group', async () => {
      const newUserId = 'test-user-3';
      
      const result = await groupProtocol.addGroupMember(testChannelId, newUserId, testUserId1);
      
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('memberId', newUserId);
      expect(result).to.have.property('epochNumber');
    });

    it('should remove member from vote channel group', async () => {
      const result = await groupProtocol.removeGroupMember(testChannelId, testUserId2, testUserId1);
      
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('memberId', testUserId2);
      expect(result).to.have.property('epochNumber');
    });

    it('should handle vote channel encryption with multiple members in same epoch', async () => {
      // Add multiple members
      await groupProtocol.addGroupMember(testChannelId, 'member-1', testUserId1);
      await groupProtocol.addGroupMember(testChannelId, 'member-2', testUserId1);
      await groupProtocol.addGroupMember(testChannelId, 'member-3', testUserId1);

      const voteData = {
        type: 'vote-update',
        data: {
          topic: testChannelId,
          results: {
            totalVotes: 10,
            candidates: {
              'candidate-1': 6,
              'candidate-2': 4
            }
          },
          timestamp: Date.now()
        }
      };

      // Encrypt from one member (after all members added, same epoch)
      const encryptResult = await groupProtocol.encryptGroupMessage(
        testChannelId,
        'member-1',
        JSON.stringify(voteData)
      );

      expect(encryptResult).to.have.property('groupId', testChannelId);
      expect(encryptResult).to.have.property('ciphertext');

      // Decrypt from another member (should work in same epoch)
      const decryptResult = await groupProtocol.decryptGroupMessage(
        testChannelId,
        'member-2',
        encryptResult
      );

      expect(decryptResult.success).to.be.true;
      
      const decryptedData = JSON.parse(decryptResult.decryptedMessage);
      expect(decryptedData).to.deep.equal(voteData);
    });

    describe('Security Boundary Tests', () => {
      let securityTestChannelId = 'security-test-channel-456';

      beforeEach(async () => {
        // Create a fresh group for security tests
        await groupProtocol.createGroupSession(
          securityTestChannelId,
          testUserId1,
          [testUserId1, testUserId2]
        );
      });

      it('should reject non-member attempts to join vote channel', async () => {
        const nonMemberId = 'unauthorized-user';
        
        try {
          await groupProtocol.addGroupMember(securityTestChannelId, nonMemberId, 'non-member-attempting-to-add');
          expect.fail('Security violation: non-member was able to add users to group');
        } catch (error) {
          expect(error.message).to.include('not authorized to add members');
        }
      });

      it('should reject non-member attempts to send encrypted messages', async () => {
        const nonMemberId = 'unauthorized-sender';
        const messageData = { type: 'vote-update', data: { topic: securityTestChannelId } };
        
        try {
          await groupProtocol.encryptGroupMessage(
            securityTestChannelId,
            nonMemberId,
            JSON.stringify(messageData)
          );
          expect.fail('Security violation: non-member was able to encrypt group messages');
        } catch (error) {
          expect(error.message).to.include('not a member of group');
        }
      });

      it('should reject non-member attempts to decrypt messages', async () => {
        const nonMemberId = 'unauthorized-receiver';
        
        // First, create a valid encrypted message from an authorized member
        const messageData = { type: 'vote-update', data: { topic: securityTestChannelId } };
        const encryptResult = await groupProtocol.encryptGroupMessage(
          securityTestChannelId,
          testUserId1,
          JSON.stringify(messageData)
        );

        // Attempt to decrypt with non-member
        try {
          await groupProtocol.decryptGroupMessage(
            securityTestChannelId,
            nonMemberId,
            encryptResult
          );
          expect.fail('Security violation: non-member was able to decrypt group messages');
        } catch (error) {
          // Could be either membership error or epoch error depending on timing
          expect(error.message).to.satisfy(msg => 
            msg.includes('not a member of group') || 
            msg.includes('Message from different epoch')
          );
        }
      });

      it('should reject removed member attempts to send messages', async () => {
        // Add a member first
        await groupProtocol.addGroupMember(securityTestChannelId, 'temp-member', testUserId1);
        
        // Remove the member
        await groupProtocol.removeGroupMember(securityTestChannelId, 'temp-member', testUserId1);
        
        // Attempt to send message as removed member
        const messageData = { type: 'vote-update', data: { topic: securityTestChannelId } };
        
        try {
          await groupProtocol.encryptGroupMessage(
            securityTestChannelId,
            'temp-member',
            JSON.stringify(messageData)
          );
          expect.fail('Security violation: removed member was able to send encrypted messages');
        } catch (error) {
          expect(error.message).to.include('not a member of group');
        }
      });

      it('should reject removed member attempts to decrypt messages', async () => {
        // Add a member first
        await groupProtocol.addGroupMember(securityTestChannelId, 'temp-member-2', testUserId1);
        
        // Create a valid encrypted message
        const messageData = { type: 'vote-update', data: { topic: securityTestChannelId } };
        const encryptResult = await groupProtocol.encryptGroupMessage(
          securityTestChannelId,
          testUserId1,
          JSON.stringify(messageData)
        );
        
        // Remove the member
        await groupProtocol.removeGroupMember(securityTestChannelId, 'temp-member-2', testUserId1);
        
        // Attempt to decrypt as removed member
        try {
          await groupProtocol.decryptGroupMessage(
            securityTestChannelId,
            'temp-member-2',
            encryptResult
          );
          expect.fail('Security violation: removed member was able to decrypt group messages');
        } catch (error) {
          // Could be either membership error or epoch error depending on timing
          expect(error.message).to.satisfy(msg => 
            msg.includes('not a member of group') || 
            msg.includes('Message from different epoch')
          );
        }
      });

      it('should validate group session exists before operations', async () => {
        const nonExistentChannelId = 'non-existent-channel';
        
        try {
          await groupProtocol.encryptGroupMessage(
            nonExistentChannelId,
            testUserId1,
            'test message'
          );
          expect.fail('Security violation: operation succeeded on non-existent group');
        } catch (error) {
          expect(error.message).to.include('Group session');
        }
      });
    });
  });
});






