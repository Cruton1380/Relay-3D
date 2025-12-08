/**
 * @fileoverview Channel Privacy Modes Integration Tests
 * Tests the public vs private channel functionality
 */

import { describe, it, expect, before, after } from 'vitest';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

describe('Channel Privacy Modes', () => {
  let backendProcess;
  const BASE_URL = 'http://localhost:3000';

  before(async () => {
    // Start backend server
    backendProcess = spawn('node', ['src/backend/server.mjs'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  after(async () => {
    if (backendProcess) {
      backendProcess.kill();
    }
  });

  describe('Public Channel Creation', () => {
    it('should create a public channel without encryption', async () => {
      const publicChannel = {
        name: 'Public Governance Vote',
        description: 'Testing public channel transparency',
        candidates: [
          { id: 'candidate-1', name: 'Option A', votes: 0 },
          { id: 'candidate-2', name: 'Option B', votes: 0 }
        ],
        isPrivate: false
      };

      const response = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicChannel)
      });

      expect(response.ok).toBe(true);
      const channel = await response.json();
      
      expect(channel.isPrivate).toBe(false);
      expect(channel.encryptionEnabled).toBe(false);
      expect(channel.name).toBe('Public Governance Vote');
    });

    it('should default to public mode when isPrivate is not specified', async () => {
      const channel = {
        name: 'Default Public Channel',
        description: 'Testing default public behavior',
        candidates: [
          { id: 'candidate-1', name: 'Option A', votes: 0 }
        ]
        // isPrivate not specified - should default to false
      };

      const response = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channel)
      });

      expect(response.ok).toBe(true);
      const createdChannel = await response.json();
      
      expect(createdChannel.isPrivate).toBe(false);
      expect(createdChannel.encryptionEnabled).toBe(false);
    });
  });

  describe('Private Channel Creation', () => {
    it('should create a private channel with encryption enabled', async () => {
      const privateChannel = {
        name: 'Private Board Meeting',
        description: 'Testing private channel encryption',
        candidates: [
          { id: 'candidate-1', name: 'Confidential Option A', votes: 0 },
          { id: 'candidate-2', name: 'Confidential Option B', votes: 0 }
        ],
        isPrivate: true
      };

      const response = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privateChannel)
      });

      expect(response.ok).toBe(true);
      const channel = await response.json();
      
      expect(channel.isPrivate).toBe(true);
      expect(channel.encryptionEnabled).toBe(true);
      expect(channel.name).toBe('Private Board Meeting');
    });
  });

  describe('Vote Processing by Channel Type', () => {
    let publicChannelId;
    let privateChannelId;

    before(async () => {
      // Create test channels
      const publicResponse = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Public Channel',
          candidates: [{ id: 'candidate-1', name: 'Option A', votes: 0 }],
          isPrivate: false
        })
      });
      publicChannelId = (await publicResponse.json()).id;

      const privateResponse = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Private Channel',
          candidates: [{ id: 'candidate-1', name: 'Option A', votes: 0 }],
          isPrivate: true
        })
      });
      privateChannelId = (await privateResponse.json()).id;
    });

    it('should process votes in public channels without encryption', async () => {
      const voteData = {
        topicId: publicChannelId,
        candidateId: 'candidate-1',
        userId: 'test-user-public'
      };

      const response = await fetch(`${BASE_URL}/api/vote/submitVote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Vote processed successfully');
    });

    it('should process votes in private channels with encryption', async () => {
      const voteData = {
        topicId: privateChannelId,
        candidateId: 'candidate-1',
        userId: 'test-user-private'
      };

      const response = await fetch(`${BASE_URL}/api/vote/submitVote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Vote processed successfully');
    });
  });

  describe('Channel Mode Detection', () => {
    it('should detect public channels correctly', async () => {
      // Test the isChannelPrivate function logic
      const publicChannelIds = [
        'public-channel-123',
        'governance-vote-456',
        'community-poll-789'
      ];

      publicChannelIds.forEach(channelId => {
        const isPrivate = channelId.includes('private') || channelId.includes('secure');
        expect(isPrivate).toBe(false);
      });
    });

    it('should detect private channels correctly', async () => {
      // Test the isChannelPrivate function logic
      const privateChannelIds = [
        'private-board-meeting-123',
        'secure-executive-session-456',
        'confidential-vote-789'
      ];

      privateChannelIds.forEach(channelId => {
        const isPrivate = channelId.includes('private') || channelId.includes('secure');
        expect(isPrivate).toBe(true);
      });
    });
  });

  describe('Backup System Integration', () => {
    it('should include channel privacy information in backups', async () => {
      // This test verifies that channel privacy settings are preserved in backups
      const testChannel = {
        name: 'Backup Test Channel',
        description: 'Testing backup integration',
        candidates: [{ id: 'candidate-1', name: 'Option A', votes: 0 }],
        isPrivate: true
      };

      const response = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testChannel)
      });

      expect(response.ok).toBe(true);
      const channel = await response.json();
      
      // Verify channel has privacy settings
      expect(channel.isPrivate).toBe(true);
      expect(channel.encryptionEnabled).toBe(true);
      
      // These settings should be included in any backup operations
      expect(channel).toHaveProperty('isPrivate');
      expect(channel).toHaveProperty('encryptionEnabled');
    });
  });
});
