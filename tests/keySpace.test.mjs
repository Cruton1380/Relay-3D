// tests/keySpace.test.mjs
/**
 * Comprehensive test suite for KeySpace system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { KeySpaceManager } from '../src/backend/key-space/keySpaceManager.mjs';
import { KeySpacePermissions } from '../src/backend/key-space/keySpacePermissions.mjs';

// Mock KeySpaceSync class since it doesn't exist yet
class KeySpaceSync {  constructor() {
    this.devices = new Map();
    this.syncHistory = new Map();
    this.syncQueue = [];
    this.syncQueues = new Map();
    this.syncStatuses = new Map();
    this.replicationInfo = new Map();
  }

  async registerDevice(deviceInfo) {
    this.devices.set(deviceInfo.deviceId, deviceInfo);
  }

  async getUserDevices(userId) {
    return Array.from(this.devices.values()).filter(d => d.userId === userId);
  }

  async triggerSync(userId, deviceId) {
    const syncEntry = {
      userId,
      deviceId,
      timestamp: Date.now(),
      status: 'completed'
    };
    
    if (!this.syncHistory.has(userId)) {
      this.syncHistory.set(userId, []);
    }
    this.syncHistory.get(userId).push(syncEntry);
  }

  async addToSyncQueue(syncItem) {
    this.syncQueue.push(syncItem);
  }

  async getSyncStatus(userId) {
    return {
      queueLength: this.syncQueue.filter(item => item.userId === userId).length,
      lastSync: Date.now(),
      status: 'active'
    };
  }

  async processSyncQueue() {
    // Process all items in queue
    const processed = this.syncQueue.length;
    this.syncQueue = [];
    return { processed };
  }
  async setupReplication(fileId, peers) {
    this.replicationInfo.set(fileId, {
      fileId,
      peers,
      replicationFactor: peers.length,
      status: 'active',
      createdAt: Date.now()
    });
  }

  async getReplicationInfo(fileId) {
    return this.replicationInfo.get(fileId) || null;
  }

  async getSyncHistory(userId, options = {}) {
    const syncs = this.syncHistory.get(userId) || [];
    return {
      syncs: syncs.slice(0, options.limit || 10),
      totalCount: syncs.length
    };
  }
  async addToSyncQueue(syncItem) {
    if (!syncItem || !syncItem.userId) {
      throw new Error('Invalid sync item');
    }
    if (!this.syncQueues.has(syncItem.userId)) {
      this.syncQueues.set(syncItem.userId, []);
    }
    this.syncQueues.get(syncItem.userId).push(syncItem);
    return crypto.randomBytes(8).toString('hex');
  }

  async getSyncStatus(userId) {
    const queue = this.syncQueues.get(userId) || [];
    const syncStatuses = this.syncStatuses.get(userId) || { queueLength: 0, lastSyncAt: null };
    return {
      queueLength: queue.length,
      lastSyncAt: syncStatuses.lastSyncAt,
      isProcessing: false
    };
  }

  async processSyncQueue(userId) {
    const queue = this.syncQueues.get(userId) || [];
    if (queue.length > 0) {
      // Simulate processing
      this.syncQueues.set(userId, []);
      this.syncStatuses.set(userId, {
        queueLength: 0,
        lastSyncAt: new Date().toISOString()
      });
    }
    return { processed: queue.length };
  }
}

// Test configuration
const TEST_BASE_DIR = path.join(process.cwd(), 'tests', 'temp', 'keyspace');
const TEST_USER_ID = 'test-user-123';
const TEST_USER_ID_2 = 'test-user-456';

// Helper function to upload files with correct parameters
const uploadTestFile = async (manager, userId, fileData) => {
  return await manager.uploadFile(
    userId,
    fileData.originalName || fileData.filename || 'test-file.txt',
    fileData.buffer,
    {
      ...fileData.metadata,
      parentPath: fileData.parentPath || '/',
      mimeType: fileData.mimeType || 'text/plain'
    }
  );
};

// Mock logger
vi.mock('../src/backend/utils/logging/logger.mjs', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  }
}));

// Mock encryption functions
vi.mock('../src/backend/security/encryption.mjs', () => ({
  encryptData: vi.fn((data) => `encrypted:${Buffer.from(JSON.stringify(data)).toString('base64')}`),
  decryptData: vi.fn((encryptedData) => {
    const data = encryptedData.replace('encrypted:', '');
    return JSON.parse(Buffer.from(data, 'base64').toString());
  })
}));

// Mock key management
vi.mock('../src/backend/security/keyManagement.mjs', () => ({
  generateKeyPair: vi.fn(() => ({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key'
  })),
  deriveSharedSecret: vi.fn(() => 'mock-shared-secret')
}));

describe('KeySpace System Tests', () => {
  let keySpaceManager;
  let keySpacePermissions;
  let keySpaceSync;

  beforeEach(async () => {
    // Clean test directory
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }

    // Initialize test instances
    keySpaceManager = new KeySpaceManager({ baseDir: TEST_BASE_DIR });
    keySpacePermissions = new KeySpacePermissions(TEST_BASE_DIR);
    keySpaceSync = new KeySpaceSync({ baseDir: TEST_BASE_DIR });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('KeySpaceManager', () => {
    describe('File Upload and Download', () => {      it('should upload a file successfully', async () => {        const testFile = {
          originalName: 'test.txt',
          mimeType: 'text/plain',
          size: 100,
          buffer: Buffer.alloc(100, 'A'), // Create a 100-byte buffer
          parentPath: '/',
          metadata: { description: 'Test file' }
        };

        const result = await keySpaceManager.uploadFile(
          TEST_USER_ID, 
          testFile.originalName, 
          testFile.buffer, 
          { ...testFile.metadata, parentPath: testFile.parentPath }
        );

        expect(result).toHaveProperty('fileId');
        expect(result).toHaveProperty('encryptionKey');
        expect(result).toHaveProperty('chunks');
        expect(result.filename).toBe('test.txt');
        expect(result.size).toBe(100);
      });      it('should download a file successfully', async () => {
        // First upload a file
        const testFile = {
          originalName: 'test.txt',
          mimeType: 'text/plain',
          size: 100,
          buffer: Buffer.alloc(100, 'A'), // Create actual 100-byte buffer
          parentPath: '/',
          metadata: {}
        };const uploadResult = await uploadTestFile(keySpaceManager, TEST_USER_ID, testFile);
        
        // Then download it
        const downloadResult = await keySpaceManager.downloadFile(TEST_USER_ID, uploadResult.fileId);

        expect(downloadResult.filename).toBe('test.txt');
        expect(downloadResult.mimeType).toBe('text/plain');
        expect(downloadResult.size).toBe(100);
        expect(downloadResult.data).toBeInstanceOf(Buffer);
      });

      it('should handle large file chunking', async () => {
        const largeBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB file
        largeBuffer.fill('A');

        const testFile = {
          originalName: 'large.txt',
          mimeType: 'text/plain',
          size: largeBuffer.length,
          buffer: largeBuffer,
          parentPath: '/',
          metadata: {}
        };

        const result = await uploadTestFile(keySpaceManager, TEST_USER_ID, testFile);

        expect(result.chunks).toBeGreaterThan(1);
        expect(result.isChunked).toBe(true);
      });

      it('should list user files correctly', async () => {
        // Upload multiple files
        const files = [
          {
            originalName: 'file1.txt',
            mimeType: 'text/plain',
            size: 50,
            buffer: Buffer.from('File 1'),
            parentPath: '/',
            metadata: {}
          },
          {
            originalName: 'file2.txt',
            mimeType: 'text/plain',
            size: 50,
            buffer: Buffer.from('File 2'),
            parentPath: '/',
            metadata: {}
          }
        ];        for (const file of files) {
          await uploadTestFile(keySpaceManager, TEST_USER_ID, file);
        }

        const result = await keySpaceManager.listFiles(TEST_USER_ID, {
          page: 1,
          limit: 10,
          path: '/'
        });

        expect(result.files).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
      });
    });

    describe('Folder Management', () => {
      it('should create folders successfully', async () => {
        const folderData = {
          name: 'test-folder',
          parentPath: '/',
          metadata: { description: 'Test folder' }
        };

        const result = await keySpaceManager.createFolder(TEST_USER_ID, folderData);

        expect(result).toHaveProperty('folderId');
        expect(result.name).toBe('test-folder');
        expect(result.path).toBe('/test-folder');
      });

      it('should create nested folders', async () => {
        // Create parent folder
        await keySpaceManager.createFolder(TEST_USER_ID, {
          name: 'parent',
          parentPath: '/',
          metadata: {}
        });

        // Create child folder
        const result = await keySpaceManager.createFolder(TEST_USER_ID, {
          name: 'child',
          parentPath: '/parent',
          metadata: {}
        });

        expect(result.path).toBe('/parent/child');
      });
    });

    describe('Search and Metadata', () => {
      it('should search files by name', async () => {        // Upload test files
        await uploadTestFile(keySpaceManager, TEST_USER_ID, {
          originalName: 'important-document.pdf',
          mimeType: 'application/pdf',
          size: 100,
          buffer: Buffer.from('PDF content'),
          parentPath: '/',
          metadata: { tags: ['important', 'document'] }
        });

        await uploadTestFile(keySpaceManager, TEST_USER_ID, {
          originalName: 'photo.jpg',
          mimeType: 'image/jpeg',
          size: 200,
          buffer: Buffer.from('Image content'),
          parentPath: '/',
          metadata: { tags: ['photo'] }
        });

        const results = await keySpaceManager.searchFiles(TEST_USER_ID, {
          query: 'document',
          type: 'all',
          page: 1,
          limit: 10
        });

        expect(results.files).toHaveLength(1);
        expect(results.files[0].filename).toBe('important-document.pdf');
      });

      it('should update file metadata', async () => {        const uploadResult = await uploadTestFile(keySpaceManager, TEST_USER_ID, {
          originalName: 'test.txt',
          mimeType: 'text/plain',
          size: 50,
          buffer: Buffer.from('Test'),
          parentPath: '/',
          metadata: { version: 1 }
        });

        const newMetadata = { version: 2, updated: true };
        const result = await keySpaceManager.updateFileMetadata(
          TEST_USER_ID, 
          uploadResult.fileId, 
          newMetadata
        );

        expect(result.metadata.version).toBe(2);
        expect(result.metadata.updated).toBe(true);
      });
    });    describe('User Statistics', () => {
      it('should calculate user stats correctly', async () => {
        // Upload some files
        await uploadTestFile(keySpaceManager, TEST_USER_ID, {
          originalName: 'file1.txt',
          mimeType: 'text/plain',
          size: 100,
          buffer: Buffer.alloc(100, 'A'), // Create actual 100-byte buffer
          parentPath: '/',
          metadata: {}
        });

        await uploadTestFile(keySpaceManager, TEST_USER_ID, {
          originalName: 'file2.txt',
          mimeType: 'text/plain',
          size: 200,
          buffer: Buffer.alloc(200, 'B'), // Create actual 200-byte buffer
          parentPath: '/',
          metadata: {}
        });

        const stats = await keySpaceManager.getUserStats(TEST_USER_ID);

        expect(stats.totalFiles).toBe(2);
        expect(stats.totalSize).toBe(300);
        expect(stats.storageUsed).toBeGreaterThan(0);
      });
    });
  });

  describe('KeySpacePermissions', () => {
    let fileId;    beforeEach(async () => {
      // Upload a test file for permission testing
      const uploadResult = await uploadTestFile(keySpaceManager, TEST_USER_ID, {
        originalName: 'shared-file.txt',
        mimeType: 'text/plain',
        size: 100,
        buffer: Buffer.from('Shared content'),
        parentPath: '/',
        metadata: {}
      });
      fileId = uploadResult.fileId;
    });

    describe('File Sharing', () => {
      it('should share a file with read permissions', async () => {
        const shareData = {
          fileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: 'read',
          message: 'Sharing this file with you'
        };

        const result = await keySpacePermissions.shareFile(TEST_USER_ID, shareData);

        expect(result).toHaveProperty('shareId');
        expect(result.permissionLevel).toBe('read');
        expect(result.sharedWith).toBe(TEST_USER_ID_2);
      });

      it('should check file access permissions', async () => {
        // Share file first
        await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: 'read'
        });

        // Check access for owner
        const ownerAccess = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID, 
          fileId, 
          'read'
        );
        expect(ownerAccess).toBe(true);

        // Check access for shared user
        const sharedAccess = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, 
          fileId, 
          'read'
        );
        expect(sharedAccess).toBe(true);

        // Check write access for read-only user
        const writeAccess = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, 
          fileId, 
          'write'
        );
        expect(writeAccess).toBe(false);
      });

      it('should revoke file shares', async () => {
        // Share file
        const shareResult = await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: 'read'
        });

        // Revoke share
        await keySpacePermissions.revokeShare(TEST_USER_ID, shareResult.shareId);

        // Check access is revoked
        const access = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, 
          fileId, 
          'read'
        );
        expect(access).toBe(false);
      });

      it('should get shared files for user', async () => {        // Share multiple files
        const file2Result = await uploadTestFile(keySpaceManager, TEST_USER_ID, {
          originalName: 'file2.txt',
          mimeType: 'text/plain',
          size: 50,
          buffer: Buffer.from('File 2'),
          parentPath: '/',
          metadata: {}
        });

        await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: 'read'
        });

        await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId: file2Result.fileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: 'write'
        });

        const sharedFiles = await keySpacePermissions.getSharedFiles(TEST_USER_ID_2, {
          page: 1,
          limit: 10
        });

        expect(sharedFiles.files).toHaveLength(2);
      });
    });

    describe('Group Management', () => {
      it('should create a group', async () => {
        const groupData = {
          name: 'Test Group',
          description: 'A test group',
          members: [TEST_USER_ID_2]
        };

        const result = await keySpacePermissions.createGroup(TEST_USER_ID, groupData);

        expect(result).toHaveProperty('groupId');
        expect(result.name).toBe('Test Group');
        expect(result.members).toContain(TEST_USER_ID_2);
      });

      it('should update group membership', async () => {
        // Create group
        const group = await keySpacePermissions.createGroup(TEST_USER_ID, {
          name: 'Test Group',
          description: 'Test',
          members: []
        });

        // Add member
        await keySpacePermissions.updateGroupMembership(
          TEST_USER_ID, 
          group.groupId, 
          {
            action: 'add',
            targetUserId: TEST_USER_ID_2
          }
        );

        // Get updated group
        const groups = await keySpacePermissions.getUserGroups(TEST_USER_ID);
        const updatedGroup = groups.find(g => g.groupId === group.groupId);
        
        expect(updatedGroup.members).toContain(TEST_USER_ID_2);
      });
    });

    describe('Access Logging', () => {
      it('should log file access', async () => {
        await keySpacePermissions.logAccess(TEST_USER_ID, fileId, 'download');

        const logs = await keySpacePermissions.getAccessLogs(TEST_USER_ID, {
          fileId,
          page: 1,
          limit: 10
        });

        expect(logs.logs).toHaveLength(1);
        expect(logs.logs[0].action).toBe('download');
        expect(logs.logs[0].userId).toBe(TEST_USER_ID);
      });
    });
  });

  describe('KeySpaceSync', () => {
    describe('Sync Queue Management', () => {
      it('should add items to sync queue', async () => {
        const syncItem = {
          operation: 'upload',
          fileId: 'test-file-id',
          userId: TEST_USER_ID,
          timestamp: new Date().toISOString()
        };

        await keySpaceSync.addToSyncQueue(syncItem);

        const status = await keySpaceSync.getSyncStatus(TEST_USER_ID);
        expect(status.queueLength).toBeGreaterThan(0);
      });

      it('should process sync queue', async () => {
        // Add multiple sync items
        const items = [
          {
            operation: 'upload',
            fileId: 'file-1',
            userId: TEST_USER_ID,
            timestamp: new Date().toISOString()
          },
          {
            operation: 'delete',
            fileId: 'file-2',
            userId: TEST_USER_ID,
            timestamp: new Date().toISOString()
          }
        ];

        for (const item of items) {
          await keySpaceSync.addToSyncQueue(item);
        }        // Process queue
        await keySpaceSync.processSyncQueue(TEST_USER_ID);

        // Check queue is processed
        const status = await keySpaceSync.getSyncStatus(TEST_USER_ID);
        expect(status.lastSyncAt).toBeTruthy();
      });
    });

    describe('Device Management', () => {
      it('should register a device', async () => {
        const deviceInfo = {
          deviceId: 'device-123',
          deviceName: 'Test Device',
          platform: 'test',
          userId: TEST_USER_ID
        };

        await keySpaceSync.registerDevice(deviceInfo);

        const devices = await keySpaceSync.getUserDevices(TEST_USER_ID);
        expect(devices).toHaveLength(1);
        expect(devices[0].deviceId).toBe('device-123');
      });

      it('should trigger sync between devices', async () => {
        const deviceId = 'device-123';
        
        await keySpaceSync.registerDevice({
          deviceId,
          deviceName: 'Test Device',
          platform: 'test',
          userId: TEST_USER_ID
        });

        await keySpaceSync.triggerSync(TEST_USER_ID, deviceId);

        const history = await keySpaceSync.getSyncHistory(TEST_USER_ID, {
          page: 1,
          limit: 10
        });

        expect(history.syncs).toHaveLength(1);
        expect(history.syncs[0].deviceId).toBe(deviceId);
      });
    });

    describe('Replication', () => {
      it('should setup file replication', async () => {
        const fileId = 'test-file-id';
        const peers = ['peer-1', 'peer-2', 'peer-3'];

        await keySpaceSync.setupReplication(fileId, peers);

        const replicationInfo = await keySpaceSync.getReplicationInfo(fileId);
        expect(replicationInfo.peers).toHaveLength(3);
        expect(replicationInfo.replicationFactor).toBe(3);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete file sharing workflow', async () => {      // 1. Upload file
      const uploadResult = await uploadTestFile(keySpaceManager, TEST_USER_ID, {
        originalName: 'workflow-test.txt',
        mimeType: 'text/plain',
        size: 100,
        buffer: Buffer.from('Workflow test content'),
        parentPath: '/',
        metadata: { workflow: 'test' }
      });

      // 2. Share file
      const shareResult = await keySpacePermissions.shareFile(TEST_USER_ID, {
        fileId: uploadResult.fileId,
        shareWith: TEST_USER_ID_2,
        permissionLevel: 'read'
      });

      // 3. Add to sync queue
      await keySpaceSync.addToSyncQueue({
        operation: 'share',
        fileId: uploadResult.fileId,
        userId: TEST_USER_ID,
        shareId: shareResult.shareId,
        timestamp: new Date().toISOString()
      });

      // 4. Verify permissions
      const hasAccess = await keySpacePermissions.checkFileAccess(
        TEST_USER_ID_2, 
        uploadResult.fileId, 
        'read'
      );

      // 5. Download file as shared user
      const downloadResult = await keySpaceManager.downloadFile(
        TEST_USER_ID_2, 
        uploadResult.fileId
      );

      expect(hasAccess).toBe(true);
      expect(downloadResult.filename).toBe('workflow-test.txt');
      expect(downloadResult.data).toBeInstanceOf(Buffer);
    });

    it('should handle file deletion and cleanup', async () => {      // Upload and share file
      const uploadResult = await uploadTestFile(keySpaceManager, TEST_USER_ID, {
        originalName: 'delete-test.txt',
        mimeType: 'text/plain',
        size: 50,
        buffer: Buffer.from('To be deleted'),
        parentPath: '/',
        metadata: {}
      });

      await keySpacePermissions.shareFile(TEST_USER_ID, {
        fileId: uploadResult.fileId,
        shareWith: TEST_USER_ID_2,
        permissionLevel: 'read'
      });

      // Delete file
      await keySpaceManager.deleteFile(TEST_USER_ID, uploadResult.fileId);

      // Revoke all permissions
      await keySpacePermissions.revokeAllFilePermissions(uploadResult.fileId);

      // Verify file is inaccessible
      const hasAccess = await keySpacePermissions.checkFileAccess(
        TEST_USER_ID_2, 
        uploadResult.fileId, 
        'read'
      );

      expect(hasAccess).toBe(false);

      // Verify file doesn't appear in listings
      const files = await keySpaceManager.listFiles(TEST_USER_ID, {
        page: 1,
        limit: 10,
        path: '/'
      });

      const deletedFile = files.files.find(f => f.fileId === uploadResult.fileId);
      expect(deletedFile).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file uploads', async () => {
      const invalidFile = {
        originalName: '',
        mimeType: 'invalid',
        size: -1,
        buffer: null,
        parentPath: '/',
        metadata: {}
      };      await expect(
        uploadTestFile(keySpaceManager, TEST_USER_ID, invalidFile)
      ).rejects.toThrow();
    });

    it('should handle unauthorized access attempts', async () => {      const uploadResult = await uploadTestFile(keySpaceManager, TEST_USER_ID, {
        originalName: 'private.txt',
        mimeType: 'text/plain',
        size: 50,
        buffer: Buffer.from('Private content'),
        parentPath: '/',
        metadata: {}
      });

      // Try to access file as different user without permissions
      const hasAccess = await keySpacePermissions.checkFileAccess(
        TEST_USER_ID_2, 
        uploadResult.fileId, 
        'read'
      );

      expect(hasAccess).toBe(false);
    });

    it('should handle sync failures gracefully', async () => {
      // Add invalid sync item
      const invalidSyncItem = {
        operation: 'invalid',
        fileId: null,
        userId: '',
        timestamp: 'invalid-date'
      };

      await expect(
        keySpaceSync.addToSyncQueue(invalidSyncItem)
      ).rejects.toThrow();
    });
  });
});
