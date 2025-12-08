// backend/routes/keySpace.mjs
// KeySpace management routes for secure, distributed file storage

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.mjs';
import { validateInput } from '../middleware/validation.mjs';
import { KeySpaceManager } from '../key-space/keySpaceManager.mjs';
import { KeySpacePermissions } from '../key-space/keySpacePermissions.mjs';
import { KeySpaceSync } from '../key-space/keySpaceSync.mjs';
import logger from '../utils/logging/logger.mjs';

const router = Router();
const keySpaceLogger = logger.child({ module: 'keyspace-routes' });

// Initialize KeySpace components
const keySpaceManager = new KeySpaceManager();
const keySpacePermissions = new KeySpacePermissions(keySpaceManager.baseDir);
const keySpaceSync = new KeySpaceSync({ baseDir: keySpaceManager.baseDir });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// === FILE MANAGEMENT ROUTES ===

/**
 * POST /keyspace/files/upload
 * Upload a file to KeySpace with encryption
 */
router.post('/files/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { filename, parentPath = '/', metadata = {} } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileData = {
      originalName: filename || req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      parentPath,
      metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata
    };

    const result = await keySpaceManager.uploadFile(userId, fileData);
    
    // Add to sync queue for cross-device synchronization
    await keySpaceSync.addToSyncQueue({
      operation: 'upload',
      fileId: result.fileId,
      userId,
      timestamp: new Date().toISOString()
    });

    keySpaceLogger.info('File uploaded successfully', {
      userId,
      fileId: result.fileId,
      filename: fileData.originalName,
      size: fileData.size
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('File upload failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/files/:fileId/download
 * Download a file from KeySpace
 */
router.get('/files/:fileId/download', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Check permissions
    const hasAccess = await keySpacePermissions.checkFileAccess(userId, fileId, 'read');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await keySpaceManager.downloadFile(userId, fileId);
    
    // Log access for audit trail
    await keySpacePermissions.logAccess(userId, fileId, 'download');

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size
    });

    res.send(result.data);
  } catch (error) {
    keySpaceLogger.error('File download failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: error.message
    });
  }
});

/**
 * DELETE /keyspace/files/:fileId
 * Delete a file from KeySpace
 */
router.delete('/files/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Check permissions
    const hasAccess = await keySpacePermissions.checkFileAccess(userId, fileId, 'write');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await keySpaceManager.deleteFile(userId, fileId);
    
    // Add to sync queue
    await keySpaceSync.addToSyncQueue({
      operation: 'delete',
      fileId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Revoke all permissions for the file
    await keySpacePermissions.revokeAllFilePermissions(fileId);

    keySpaceLogger.info('File deleted successfully', { userId, fileId });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    keySpaceLogger.error('File deletion failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/files
 * List user's files with pagination and filtering
 */
router.get('/files', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      path = '/',
      search = '',
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      path,
      search,
      sortBy,
      sortOrder
    };

    const result = await keySpaceManager.listFiles(userId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('File listing failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      details: error.message
    });
  }
});

// === FOLDER MANAGEMENT ROUTES ===

/**
 * POST /keyspace/folders
 * Create a new folder
 */
router.post('/folders', authenticate, validateInput, async (req, res) => {
  try {
    const { name, parentPath = '/', metadata = {} } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    const result = await keySpaceManager.createFolder(userId, {
      name,
      parentPath,
      metadata
    });

    keySpaceLogger.info('Folder created successfully', {
      userId,
      folderId: result.folderId,
      name,
      parentPath
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('Folder creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create folder',
      details: error.message
    });
  }
});

// === SHARING AND PERMISSIONS ROUTES ===

/**
 * POST /keyspace/share
 * Share a file or folder with specific permissions
 */
router.post('/share', authenticate, validateInput, async (req, res) => {
  try {
    const { 
      fileId, 
      shareWith, 
      permissionLevel, 
      expiresAt,
      message = ''
    } = req.body;
    const userId = req.user.id;

    if (!fileId || !shareWith || !permissionLevel) {
      return res.status(400).json({
        success: false,
        error: 'fileId, shareWith, and permissionLevel are required'
      });
    }

    // Check if user has admin access to the file
    const hasAccess = await keySpacePermissions.checkFileAccess(userId, fileId, 'admin');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Only file owners can share files'
      });
    }

    const result = await keySpacePermissions.shareFile(userId, {
      fileId,
      shareWith,
      permissionLevel,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      message
    });

    keySpaceLogger.info('File shared successfully', {
      userId,
      fileId,
      shareWith,
      permissionLevel,
      shareId: result.shareId
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('File sharing failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to share file',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/shared
 * Get files shared with the current user
 */
router.get('/shared', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await keySpacePermissions.getSharedFiles(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('Shared files retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve shared files',
      details: error.message
    });
  }
});

/**
 * DELETE /keyspace/share/:shareId
 * Revoke a file share
 */
router.delete('/share/:shareId', authenticate, async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    await keySpacePermissions.revokeShare(userId, shareId);

    keySpaceLogger.info('Share revoked successfully', { userId, shareId });

    res.json({
      success: true,
      message: 'Share revoked successfully'
    });
  } catch (error) {
    keySpaceLogger.error('Share revocation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to revoke share',
      details: error.message
    });
  }
});

// === SYNCHRONIZATION ROUTES ===

/**
 * GET /keyspace/sync/status
 * Get synchronization status
 */
router.get('/sync/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await keySpaceSync.getSyncStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    keySpaceLogger.error('Sync status retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      details: error.message
    });
  }
});

/**
 * POST /keyspace/sync/trigger
 * Manually trigger synchronization
 */
router.post('/sync/trigger', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.body;

    await keySpaceSync.triggerSync(userId, deviceId);

    keySpaceLogger.info('Sync triggered manually', { userId, deviceId });

    res.json({
      success: true,
      message: 'Synchronization triggered'
    });
  } catch (error) {
    keySpaceLogger.error('Sync trigger failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/sync/history
 * Get synchronization history
 */
router.get('/sync/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const history = await keySpaceSync.getSyncHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    keySpaceLogger.error('Sync history retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get sync history',
      details: error.message
    });
  }
});

// === METADATA AND SEARCH ROUTES ===

/**
 * PUT /keyspace/files/:fileId/metadata
 * Update file metadata
 */
router.put('/files/:fileId/metadata', authenticate, validateInput, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { metadata } = req.body;
    const userId = req.user.id;

    // Check permissions
    const hasAccess = await keySpacePermissions.checkFileAccess(userId, fileId, 'write');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await keySpaceManager.updateFileMetadata(userId, fileId, metadata);

    // Add to sync queue
    await keySpaceSync.addToSyncQueue({
      operation: 'metadata_update',
      fileId,
      userId,
      timestamp: new Date().toISOString()
    });

    keySpaceLogger.info('File metadata updated', { userId, fileId });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('Metadata update failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update metadata',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/search
 * Search files by content and metadata
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      query, 
      type = 'all', 
      page = 1, 
      limit = 20 
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await keySpaceManager.searchFiles(userId, {
      query,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    keySpaceLogger.error('File search failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to search files',
      details: error.message
    });
  }
});

// === ANALYTICS AND STATISTICS ROUTES ===

/**
 * GET /keyspace/stats
 * Get user's KeySpace statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await keySpaceManager.getUserStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    keySpaceLogger.error('Stats retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/info
 * Get KeySpace system information
 */
router.get('/info', authenticate, async (req, res) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      features: {
        encryption: true,
        sync: true,
        sharing: true,
        chunking: true,
        compression: true
      },
      limits: {
        maxFileSize: '100MB',
        chunkSize: '1MB',
        replicationFactor: 3
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    keySpaceLogger.error('Info retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get system information',
      details: error.message
    });
  }
});

// === ACCESS LOG ROUTES ===

/**
 * GET /keyspace/access-logs
 * Get access logs for audit purposes
 */
router.get('/access-logs', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      fileId, 
      page = 1, 
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const logs = await keySpacePermissions.getAccessLogs(userId, {
      fileId,
      page: parseInt(page),
      limit: parseInt(limit),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    keySpaceLogger.error('Access logs retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get access logs',
      details: error.message
    });
  }
});

// === GROUP MANAGEMENT ROUTES ===

/**
 * POST /keyspace/groups
 * Create a new sharing group
 */
router.post('/groups', authenticate, validateInput, async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    const result = await keySpacePermissions.createGroup(userId, {
      name,
      description,
      members
    });

    keySpaceLogger.info('Group created successfully', {
      userId,
      groupId: result.groupId,
      name
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('Group creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create group',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/groups
 * Get user's groups
 */
router.get('/groups', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await keySpacePermissions.getUserGroups(userId);

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    keySpaceLogger.error('Groups retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get groups',
      details: error.message
    });
  }
});

/**
 * PUT /keyspace/groups/:groupId/members
 * Add or remove group members
 */
router.put('/groups/:groupId/members', authenticate, validateInput, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { action, userId: targetUserId } = req.body;
    const userId = req.user.id;

    if (!['add', 'remove'].includes(action) || !targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Valid action (add/remove) and userId are required'
      });
    }

    const result = await keySpacePermissions.updateGroupMembership(userId, groupId, {
      action,
      targetUserId
    });

    keySpaceLogger.info('Group membership updated', {
      userId,
      groupId,
      action,
      targetUserId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('Group membership update failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update group membership',
      details: error.message
    });
  }
});

// === BACKUP AND RECOVERY ROUTES ===

/**
 * POST /keyspace/backup
 * Create a backup of user's KeySpace data
 */
router.post('/backup', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeShared = false, compression = true } = req.body;

    const backup = await keySpaceManager.createBackup(userId, {
      includeShared,
      compression
    });

    keySpaceLogger.info('Backup created successfully', {
      userId,
      backupId: backup.backupId,
      size: backup.size
    });

    res.status(201).json({
      success: true,
      data: backup
    });
  } catch (error) {
    keySpaceLogger.error('Backup creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create backup',
      details: error.message
    });
  }
});

/**
 * GET /keyspace/backups
 * List user's backups
 */
router.get('/backups', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const backups = await keySpaceManager.listBackups(userId);

    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    keySpaceLogger.error('Backup listing failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list backups',
      details: error.message
    });
  }
});

/**
 * POST /keyspace/restore/:backupId
 * Restore from a backup
 */
router.post('/restore/:backupId', authenticate, async (req, res) => {
  try {
    const { backupId } = req.params;
    const userId = req.user.id;
    const { overwriteExisting = false } = req.body;

    const result = await keySpaceManager.restoreFromBackup(userId, backupId, {
      overwriteExisting
    });

    keySpaceLogger.info('Restore completed successfully', {
      userId,
      backupId,
      filesRestored: result.filesRestored
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    keySpaceLogger.error('Restore failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to restore from backup',
      details: error.message
    });
  }
});

// === ERROR HANDLERS ===

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large',        details: 'Maximum file size is 100MB'
      });
    }
  }
  next(error);
});

export default router;
