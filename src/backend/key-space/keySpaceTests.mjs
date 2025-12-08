// backend/key-space/keySpaceTests.mjs
/**
 * Comprehensive test suite for KeySpace system
 * Tests encrypted file storage, permissions, sharing, and synchronization
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { KeySpaceManager } from './keySpaceManager.mjs';
import { KeySpacePermissions, PERMISSION_LEVELS } from './keySpacePermissions.mjs';
import { KeySpaceSync, SYNC_STATES } from './keySpaceSync.mjs';

// Test configuration
const TEST_BASE_DIR = path.join(process.cwd(), 'test-keyspace');
const TEST_USER_ID = 'test-user-123';
const TEST_USER_ID_2 = 'test-user-456';
const TEST_FILE_CONTENT = 'This is test file content for KeySpace testing';

// Test instances
let keySpaceManager;
let keySpacePermissions;
let keySpaceSync;

describe('KeySpace System Tests', () => {
  beforeAll(async () => {
    // Initialize test environment
    keySpaceManager = new KeySpaceManager({ baseDir: TEST_BASE_DIR });
    keySpacePermissions = new KeySpacePermissions(TEST_BASE_DIR);
    keySpaceSync = new KeySpaceSync({ baseDir: TEST_BASE_DIR });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rmdir(TEST_BASE_DIR, { recursive: true });
    } catch (error) {
      console.warn('Test cleanup warning:', error.message);
    }
  });

  describe('KeySpaceManager', () => {
    describe('File Upload and Storage', () => {
      it('should upload and encrypt a file successfully', async () => {
        const fileData = {
          originalName: 'test-file.txt',
          mimeType: 'text/plain',
          size: TEST_FILE_CONTENT.length,
          buffer: Buffer.from(TEST_FILE_CONTENT),
          parentPath: '/',
          metadata: { description: 'Test file upload' }
        };

        const result = await keySpaceManager.uploadFile(TEST_USER_ID, fileData);

        expect(result).toHaveProperty('fileId');
        expect(result).toHaveProperty('encryptedSize');
        expect(result).toHaveProperty('uploadedAt');
        expect(result.filename).toBe('test-file.txt');
        expect(result.mimeType).toBe('text/plain');
        expect(result.size).toBe(TEST_FILE_CONTENT.length);
      });

      it('should handle chunked uploads for large files', async () => {
        // Create a large test file (2MB)
        const largeContent = Buffer.alloc(2 * 1024 * 1024, 'A');
        
        const fileData = {
          originalName: 'large-file.bin',
          mimeType: 'application/octet-stream',
          size: largeContent.length,
          buffer: largeContent,
          parentPath: '/',
          metadata: { type: 'large-file-test' }
        };

        const result = await keySpaceManager.uploadFile(TEST_USER_ID, fileData);

        expect(result).toHaveProperty('fileId');
        expect(result).toHaveProperty('chunks');
        expect(result.chunks).toBeGreaterThan(1);
        expect(result.size).toBe(largeContent.length);
      });

      it('should reject files exceeding size limit', async () => {
        // Create file larger than 100MB limit
        const oversizedFile = {
          originalName: 'oversized.bin',
          mimeType: 'application/octet-stream',
          size: 101 * 1024 * 1024, // 101MB
          buffer: Buffer.alloc(1024), // Small buffer but large reported size
          parentPath: '/',
          metadata: {}
        };

        await expect(
          keySpaceManager.uploadFile(TEST_USER_ID, oversizedFile)
        ).rejects.toThrow('File size exceeds maximum limit');
      });
    });

    describe('File Download and Decryption', () => {
      let uploadedFileId;

      beforeEach(async () => {
        const fileData = {
          originalName: 'download-test.txt',
          mimeType: 'text/plain',
          size: TEST_FILE_CONTENT.length,
          buffer: Buffer.from(TEST_FILE_CONTENT),
          parentPath: '/',
          metadata: { test: 'download' }
        };

        const result = await keySpaceManager.uploadFile(TEST_USER_ID, fileData);
        uploadedFileId = result.fileId;
      });

      it('should download and decrypt a file successfully', async () => {
        const result = await keySpaceManager.downloadFile(TEST_USER_ID, uploadedFileId);

        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('filename');
        expect(result).toHaveProperty('mimeType');
        expect(result).toHaveProperty('size');
        expect(result.data.toString()).toBe(TEST_FILE_CONTENT);
        expect(result.filename).toBe('download-test.txt');
        expect(result.mimeType).toBe('text/plain');
      });

      it('should throw error for non-existent file', async () => {
        await expect(
          keySpaceManager.downloadFile(TEST_USER_ID, 'non-existent-file-id')
        ).rejects.toThrow('File not found');
      });

      it('should throw error for unauthorized user', async () => {
        await expect(
          keySpaceManager.downloadFile('unauthorized-user', uploadedFileId)
        ).rejects.toThrow('Access denied');
      });
    });

    describe('File Listing and Search', () => {
      beforeEach(async () => {
        // Upload multiple test files
        const files = [
          { name: 'doc1.txt', content: 'Document 1 content', folder: '/' },
          { name: 'doc2.pdf', content: 'PDF content', folder: '/' },
          { name: 'image.jpg', content: 'Image data', folder: '/images' }
        ];

        for (const file of files) {
          const fileData = {
            originalName: file.name,
            mimeType: 'text/plain',
            size: file.content.length,
            buffer: Buffer.from(file.content),
            parentPath: file.folder,
            metadata: { type: 'test-file' }
          };
          await keySpaceManager.uploadFile(TEST_USER_ID, fileData);
        }
      });

      it('should list files with pagination', async () => {
        const result = await keySpaceManager.listFiles(TEST_USER_ID, {
          page: 1,
          limit: 2,
          path: '/'
        });

        expect(result).toHaveProperty('files');
        expect(result).toHaveProperty('totalCount');
        expect(result).toHaveProperty('page');
        expect(result).toHaveProperty('totalPages');
        expect(result.files).toHaveLength(2);
        expect(result.page).toBe(1);
      });

      it('should search files by name', async () => {
        const result = await keySpaceManager.searchFiles(TEST_USER_ID, {
          query: 'doc',
          type: 'name'
        });

        expect(result).toHaveProperty('files');
        expect(result.files.length).toBeGreaterThan(0);
        expect(result.files.every(file => 
          file.filename.toLowerCase().includes('doc')
        )).toBe(true);
      });

      it('should filter files by folder path', async () => {
        const result = await keySpaceManager.listFiles(TEST_USER_ID, {
          path: '/images'
        });

        expect(result.files.every(file => 
          file.path === '/images'
        )).toBe(true);
      });
    });

    describe('Folder Management', () => {
      it('should create a folder successfully', async () => {
        const result = await keySpaceManager.createFolder(TEST_USER_ID, {
          name: 'test-folder',
          parentPath: '/',
          metadata: { type: 'project' }
        });

        expect(result).toHaveProperty('folderId');
        expect(result).toHaveProperty('createdAt');
        expect(result.name).toBe('test-folder');
        expect(result.parentPath).toBe('/');
      });

      it('should prevent duplicate folder names in same path', async () => {
        await keySpaceManager.createFolder(TEST_USER_ID, {
          name: 'duplicate-folder',
          parentPath: '/'
        });

        await expect(
          keySpaceManager.createFolder(TEST_USER_ID, {
            name: 'duplicate-folder',
            parentPath: '/'
          })
        ).rejects.toThrow('Folder already exists');
      });
    });

    describe('User Statistics', () => {
      it('should calculate user storage statistics', async () => {
        const stats = await keySpaceManager.getUserStats(TEST_USER_ID);

        expect(stats).toHaveProperty('totalFiles');
        expect(stats).toHaveProperty('totalSize');
        expect(stats).toHaveProperty('storageUsed');
        expect(stats).toHaveProperty('lastActivity');
        expect(typeof stats.totalFiles).toBe('number');
        expect(typeof stats.totalSize).toBe('number');
      });
    });
  });

  describe('KeySpacePermissions', () => {
    let testFileId;

    beforeEach(async () => {
      // Upload a test file for permission testing
      const fileData = {
        originalName: 'permission-test.txt',
        mimeType: 'text/plain',
        size: TEST_FILE_CONTENT.length,
        buffer: Buffer.from(TEST_FILE_CONTENT),
        parentPath: '/',
        metadata: { test: 'permissions' }
      };

      const result = await keySpaceManager.uploadFile(TEST_USER_ID, fileData);
      testFileId = result.fileId;
    });

    describe('File Sharing', () => {
      it('should share a file with read permissions', async () => {
        const result = await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId: testFileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: PERMISSION_LEVELS.READ,
          message: 'Sharing for testing'
        });

        expect(result).toHaveProperty('shareId');
        expect(result).toHaveProperty('sharedAt');
        expect(result.permissionLevel).toBe(PERMISSION_LEVELS.READ);
        expect(result.shareWith).toBe(TEST_USER_ID_2);
      });

      it('should share a file with write permissions', async () => {
        const result = await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId: testFileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: PERMISSION_LEVELS.WRITE,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        expect(result.permissionLevel).toBe(PERMISSION_LEVELS.WRITE);
        expect(result).toHaveProperty('expiresAt');
      });

      it('should prevent unauthorized sharing', async () => {
        await expect(
          keySpacePermissions.shareFile('unauthorized-user', {
            fileId: testFileId,
            shareWith: TEST_USER_ID_2,
            permissionLevel: PERMISSION_LEVELS.READ
          })
        ).rejects.toThrow('Access denied');
      });
    });

    describe('Permission Checking', () => {
      beforeEach(async () => {
        // Share file with read permissions
        await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId: testFileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: PERMISSION_LEVELS.READ
        });
      });

      it('should allow owner full access', async () => {
        const hasRead = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID, testFileId, 'read'
        );
        const hasWrite = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID, testFileId, 'write'
        );
        const hasAdmin = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID, testFileId, 'admin'
        );

        expect(hasRead).toBe(true);
        expect(hasWrite).toBe(true);
        expect(hasAdmin).toBe(true);
      });

      it('should respect shared permissions', async () => {
        const hasRead = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, testFileId, 'read'
        );
        const hasWrite = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, testFileId, 'write'
        );

        expect(hasRead).toBe(true);
        expect(hasWrite).toBe(false);
      });

      it('should deny access to non-shared users', async () => {
        const hasAccess = await keySpacePermissions.checkFileAccess(
          'random-user', testFileId, 'read'
        );

        expect(hasAccess).toBe(false);
      });
    });

    describe('Share Revocation', () => {
      let shareId;

      beforeEach(async () => {
        const result = await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId: testFileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: PERMISSION_LEVELS.READ
        });
        shareId = result.shareId;
      });

      it('should revoke a share successfully', async () => {
        await keySpacePermissions.revokeShare(TEST_USER_ID, shareId);

        const hasAccess = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, testFileId, 'read'
        );

        expect(hasAccess).toBe(false);
      });

      it('should prevent unauthorized revocation', async () => {
        await expect(
          keySpacePermissions.revokeShare('unauthorized-user', shareId)
        ).rejects.toThrow('Access denied');
      });
    });

    describe('Group Management', () => {
      it('should create a group successfully', async () => {
        const result = await keySpacePermissions.createGroup(TEST_USER_ID, {
          name: 'Test Group',
          description: 'A group for testing',
          members: [TEST_USER_ID_2]
        });

        expect(result).toHaveProperty('groupId');
        expect(result).toHaveProperty('createdAt');
        expect(result.name).toBe('Test Group');
        expect(result.members).toContain(TEST_USER_ID_2);
      });

      it('should update group membership', async () => {
        const group = await keySpacePermissions.createGroup(TEST_USER_ID, {
          name: 'Update Test Group',
          members: []
        });

        const result = await keySpacePermissions.updateGroupMembership(
          TEST_USER_ID, group.groupId, {
            action: 'add',
            targetUserId: TEST_USER_ID_2
          }
        );

        expect(result.members).toContain(TEST_USER_ID_2);
      });
    });

    describe('Access Logging', () => {
      it('should log file access events', async () => {
        await keySpacePermissions.logAccess(TEST_USER_ID, testFileId, 'download');

        const logs = await keySpacePermissions.getAccessLogs(TEST_USER_ID, {
          fileId: testFileId
        });

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]).toHaveProperty('action');
        expect(logs[0]).toHaveProperty('timestamp');
        expect(logs[0].action).toBe('download');
      });
    });
  });

  describe('KeySpaceSync', () => {
    describe('Sync Queue Management', () => {
      it('should add items to sync queue', async () => {
        const syncItem = {
          operation: 'upload',
          fileId: 'test-file-123',
          userId: TEST_USER_ID,
          timestamp: new Date().toISOString()
        };

        await keySpaceSync.addToSyncQueue(syncItem);

        const status = await keySpaceSync.getSyncStatus(TEST_USER_ID);
        expect(status.queueLength).toBeGreaterThan(0);
      });

      it('should process sync queue items', async () => {
        const syncItem = {
          operation: 'upload',
          fileId: 'test-file-456',
          userId: TEST_USER_ID,
          timestamp: new Date().toISOString()
        };

        await keySpaceSync.addToSyncQueue(syncItem);
        await keySpaceSync.processSyncQueue();

        // Queue should be processed (though operations may be mocked)
        const status = await keySpaceSync.getSyncStatus(TEST_USER_ID);
        expect(status.lastSync).toBeDefined();
      });
    });

    describe('Sync Status', () => {
      it('should return current sync status', async () => {
        const status = await keySpaceSync.getSyncStatus(TEST_USER_ID);

        expect(status).toHaveProperty('state');
        expect(status).toHaveProperty('connectedPeers');
        expect(status).toHaveProperty('queueLength');
        expect(status).toHaveProperty('lastSync');
        expect(Object.values(SYNC_STATES)).toContain(status.state);
      });
    });

    describe('Device Management', () => {
      it('should register a device for sync', async () => {
        const deviceInfo = {
          deviceId: 'test-device-123',
          deviceName: 'Test Device',
          platform: 'test'
        };

        const result = await keySpaceSync.registerDevice(TEST_USER_ID, deviceInfo);

        expect(result).toHaveProperty('deviceId');
        expect(result).toHaveProperty('registeredAt');
        expect(result.deviceId).toBe(deviceInfo.deviceId);
      });

      it('should list user devices', async () => {
        await keySpaceSync.registerDevice(TEST_USER_ID, {
          deviceId: 'device-1',
          deviceName: 'Device 1'
        });

        const devices = await keySpaceSync.getUserDevices(TEST_USER_ID);

        expect(Array.isArray(devices)).toBe(true);
        expect(devices.length).toBeGreaterThan(0);
        expect(devices[0]).toHaveProperty('deviceId');
        expect(devices[0]).toHaveProperty('deviceName');
      });
    });

    describe('Sync History', () => {
      it('should maintain sync history', async () => {
        await keySpaceSync.addToSyncQueue({
          operation: 'upload',
          fileId: 'history-test-file',
          userId: TEST_USER_ID,
          timestamp: new Date().toISOString()
        });

        await keySpaceSync.processSyncQueue();

        const history = await keySpaceSync.getSyncHistory(TEST_USER_ID, {
          page: 1,
          limit: 10
        });

        expect(Array.isArray(history.items)).toBe(true);
        expect(history).toHaveProperty('totalCount');
        expect(history).toHaveProperty('page');
      });
    });
  });

  describe('Integration Tests', () => {
    describe('End-to-End File Sharing Workflow', () => {
      it('should complete full sharing workflow', async () => {
        // 1. Upload a file
        const fileData = {
          originalName: 'integration-test.txt',
          mimeType: 'text/plain',
          size: TEST_FILE_CONTENT.length,
          buffer: Buffer.from(TEST_FILE_CONTENT),
          parentPath: '/',
          metadata: { integration: 'test' }
        };

        const uploadResult = await keySpaceManager.uploadFile(TEST_USER_ID, fileData);

        // 2. Share the file
        const shareResult = await keySpacePermissions.shareFile(TEST_USER_ID, {
          fileId: uploadResult.fileId,
          shareWith: TEST_USER_ID_2,
          permissionLevel: PERMISSION_LEVELS.READ
        });

        // 3. Second user accesses the file
        const hasAccess = await keySpacePermissions.checkFileAccess(
          TEST_USER_ID_2, uploadResult.fileId, 'read'
        );

        // 4. Download file as second user
        const downloadResult = await keySpaceManager.downloadFile(
          TEST_USER_ID_2, uploadResult.fileId
        );

        // 5. Add to sync queue
        await keySpaceSync.addToSyncQueue({
          operation: 'share',
          fileId: uploadResult.fileId,
          userId: TEST_USER_ID,
          timestamp: new Date().toISOString()
        });

        // Verify workflow
        expect(uploadResult.fileId).toBeDefined();
        expect(shareResult.shareId).toBeDefined();
        expect(hasAccess).toBe(true);
        expect(downloadResult.data.toString()).toBe(TEST_FILE_CONTENT);
      });
    });

    describe('Cross-Device Sync Simulation', () => {
      it('should simulate multi-device synchronization', async () => {
        const device1 = 'device-1';
        const device2 = 'device-2';

        // Register devices
        await keySpaceSync.registerDevice(TEST_USER_ID, {
          deviceId: device1,
          deviceName: 'Desktop'
        });
        
        await keySpaceSync.registerDevice(TEST_USER_ID, {
          deviceId: device2,
          deviceName: 'Mobile'
        });

        // Upload file from device 1
        const fileData = {
          originalName: 'sync-test.txt',
          mimeType: 'text/plain',
          size: TEST_FILE_CONTENT.length,
          buffer: Buffer.from(TEST_FILE_CONTENT),
          parentPath: '/',
          metadata: { device: device1 }
        };

        const uploadResult = await keySpaceManager.uploadFile(TEST_USER_ID, fileData);

        // Add to sync queue
        await keySpaceSync.addToSyncQueue({
          operation: 'upload',
          fileId: uploadResult.fileId,
          userId: TEST_USER_ID,
          deviceId: device1,
          timestamp: new Date().toISOString()
        });

        // Trigger sync to device 2
        await keySpaceSync.triggerSync(TEST_USER_ID, device2);

        // Verify sync status
        const syncStatus = await keySpaceSync.getSyncStatus(TEST_USER_ID);
        expect(syncStatus.queueLength).toBeGreaterThanOrEqual(0);

        const devices = await keySpaceSync.getUserDevices(TEST_USER_ID);
        expect(devices.length).toBe(2);
      });
    });
  });
});

// Helper functions for testing
export function generateTestFile(size = 1024, name = 'test.txt') {
  return {
    originalName: name,
    mimeType: 'text/plain',
    size,
    buffer: Buffer.alloc(size, 'T'),
    parentPath: '/',
    metadata: { test: true }
  };
}

export function generateTestUser(id = null) {
  return {
    id: id || `test-user-${Math.random().toString(36).substr(2, 9)}`,
    email: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
    publicKey: crypto.randomBytes(32).toString('hex')
  };
}

export { TEST_BASE_DIR, TEST_USER_ID, TEST_USER_ID_2, TEST_FILE_CONTENT };
