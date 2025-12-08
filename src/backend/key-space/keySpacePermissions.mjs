// backend/key-space/keySpacePermissions.mjs
/**
 * KeySpace Permissions - Hierarchical file and folder permission management
 * Supports sharing, access control, and permission inheritance
 */

import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logging/logger.mjs';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { randomBytes } from '@stablelib/random';

const permissionsLogger = logger.child({ module: 'keyspace-permissions' });

// Permission levels
export const PERMISSION_LEVELS = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  ADMIN: 3
};

// Permission types
export const PERMISSION_TYPES = {
  USER: 'user',
  GROUP: 'group',
  PUBLIC: 'public'
};

/**
 * KeySpace Permissions Manager
 * Handles file/folder sharing, access control, and hierarchical permissions
 */
export class KeySpacePermissions {  constructor(baseDir) {
    this.baseDir = baseDir;
    this.permissionsDir = path.join(baseDir, 'permissions');
    this.sharesDir = path.join(baseDir, 'shares');
    this.groupsDir = path.join(baseDir, 'groups');
    this.accessLogsDir = path.join(baseDir, 'access-logs');
    this.logger = permissionsLogger;
    
    this.initializeDirectories();
  }

  /**
   * Initialize permission directories
   */  async initializeDirectories() {
    try {
      await fs.mkdir(this.permissionsDir, { recursive: true });
      await fs.mkdir(this.sharesDir, { recursive: true });
      await fs.mkdir(this.groupsDir, { recursive: true });
      await fs.mkdir(this.accessLogsDir, { recursive: true });
      
      permissionsLogger.info('Permissions directories initialized');
    } catch (error) {
      permissionsLogger.error('Failed to initialize permissions directories', { error });
      throw error;
    }
  }

  /**
   * Generate share ID for a file/folder share
   */
  generateShareId(fileId, ownerId, sharedWith) {
    const data = `${fileId}:${ownerId}:${sharedWith}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Create a file share
   */
  async createShare(ownerId, fileId, sharedWith, permission, options = {}) {
    try {
      permissionsLogger.info('Creating file share', { 
        ownerId, 
        fileId, 
        sharedWith, 
        permission 
      });

      const shareId = this.generateShareId(fileId, ownerId, sharedWith);
      
      const shareData = {
        shareId,
        fileId,
        ownerId,
        sharedWith,
        sharedWithType: options.sharedWithType || PERMISSION_TYPES.USER,
        permission: permission,
        createdAt: new Date().toISOString(),
        expiresAt: options.expiresAt || null,
        message: options.message || null,
        allowReshare: options.allowReshare || false,
        accessLog: [],
        revoked: false,
        metadata: options.metadata || {}
      };

      // Store share data
      const sharePath = path.join(this.sharesDir, `${shareId}.json`);
      await fs.writeFile(sharePath, JSON.stringify(shareData, null, 2));

      // Update file permissions
      await this.updateFilePermissions(fileId, ownerId, sharedWith, permission);

      // Log share creation
      await this.logShareActivity(shareId, 'SHARE_CREATED', {
        ownerId,
        sharedWith,
        permission
      });

      permissionsLogger.info('File share created successfully', { shareId, fileId });      return {
        shareId,
        fileId,
        sharedWith,
        shareUrl: this.generateShareUrl(shareId),
        expiresAt: shareData.expiresAt,
        permission,
        createdAt: shareData.createdAt
      };
    } catch (error) {
      permissionsLogger.error('Failed to create share', { ownerId, fileId, error });
      throw error;
    }
  }

  /**
   * Update file permissions
   */
  async updateFilePermissions(fileId, ownerId, userId, permission) {
    try {
      const permissionsPath = path.join(this.permissionsDir, `${fileId}.json`);
      
      let permissions = {};
      try {
        const permissionsContent = await fs.readFile(permissionsPath, 'utf8');
        permissions = JSON.parse(permissionsContent);
      } catch (error) {
        // Create new permissions file if it doesn't exist
        permissions = {
          fileId,
          ownerId,
          permissions: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Update permissions
      permissions.permissions[userId] = {
        level: permission,
        grantedBy: ownerId,
        grantedAt: new Date().toISOString()
      };
      permissions.updatedAt = new Date().toISOString();

      await fs.writeFile(permissionsPath, JSON.stringify(permissions, null, 2));

      permissionsLogger.debug('File permissions updated', { fileId, userId, permission });
    } catch (error) {
      permissionsLogger.error('Failed to update file permissions', { fileId, userId, error });
      throw error;
    }
  }

  /**
   * Check user permission for a file
   */
  async checkPermission(fileId, userId, requiredPermission = PERMISSION_LEVELS.READ) {
    try {
      const permissionsPath = path.join(this.permissionsDir, `${fileId}.json`);
      
      try {
        const permissionsContent = await fs.readFile(permissionsPath, 'utf8');
        const permissions = JSON.parse(permissionsContent);
        
        // Owner has all permissions
        if (permissions.ownerId === userId) {
          return { allowed: true, level: PERMISSION_LEVELS.ADMIN, reason: 'owner' };
        }
        
        // Check direct user permissions
        const userPermission = permissions.permissions[userId];
        if (userPermission && userPermission.level >= requiredPermission) {
          return { 
            allowed: true, 
            level: userPermission.level, 
            reason: 'direct_permission' 
          };
        }
        
        // Check group permissions
        const groupPermission = await this.checkGroupPermissions(userId, permissions.permissions);
        if (groupPermission && groupPermission.level >= requiredPermission) {
          return { 
            allowed: true, 
            level: groupPermission.level, 
            reason: 'group_permission' 
          };
        }
        
        return { allowed: false, level: PERMISSION_LEVELS.NONE, reason: 'no_permission' };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return { allowed: false, level: PERMISSION_LEVELS.NONE, reason: 'file_not_found' };
        }
        throw error;
      }
    } catch (error) {
      permissionsLogger.error('Failed to check permission', { fileId, userId, error });
      throw error;
    }
  }

  /**
   * Check group permissions for user
   */
  async checkGroupPermissions(userId, filePermissions) {
    try {
      // Get user's groups
      const userGroups = await this.getUserGroups(userId);
      
      let highestPermission = PERMISSION_LEVELS.NONE;
      
      for (const groupId of userGroups) {
        const groupPermission = filePermissions[`group:${groupId}`];
        if (groupPermission && groupPermission.level > highestPermission) {
          highestPermission = groupPermission.level;
        }
      }
      
      return highestPermission > PERMISSION_LEVELS.NONE ? 
        { level: highestPermission } : null;
    } catch (error) {
      permissionsLogger.error('Failed to check group permissions', { userId, error });
      return null;
    }
  }
  /**
   * Get user's groups
   */
  async getUserGroups(userId) {
    try {
      const userGroupsPath = path.join(this.groupsDir, `user_${userId}.json`);
      
      try {
        const groupsContent = await fs.readFile(userGroupsPath, 'utf8');
        const groupsData = JSON.parse(groupsContent);
        
        // Get full group details for each group ID
        const groupDetails = [];
        for (const groupId of groupsData.groups || []) {
          try {
            const groupPath = path.join(this.groupsDir, `${groupId}.json`);
            const groupContent = await fs.readFile(groupPath, 'utf8');
            const group = JSON.parse(groupContent);
            groupDetails.push(group);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              permissionsLogger.warn('Failed to load group details', { groupId, error });
            }
          }
        }
        
        return groupDetails;
      } catch (error) {
        if (error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    } catch (error) {
      permissionsLogger.error('Failed to get user groups', { userId, error });
      return [];
    }
  }

  /**
   * Get group IDs only (used internally)
   */
  async getUserGroupIds(userId) {
    try {
      const userGroupsPath = path.join(this.groupsDir, `user_${userId}.json`);
      
      try {
        const groupsContent = await fs.readFile(userGroupsPath, 'utf8');
        const groupsData = JSON.parse(groupsContent);
        return groupsData.groups || [];
      } catch (error) {
        if (error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    } catch (error) {
      permissionsLogger.error('Failed to get user group IDs', { userId, error });
      return [];
    }
  }
  /**
   * Revoke share
   */
  async revokeShare(revokedBy, shareId) {
    try {
      permissionsLogger.info('Revoking share', { shareId, revokedBy });

      const sharePath = path.join(this.sharesDir, `${shareId}.json`);
      
      const shareContent = await fs.readFile(sharePath, 'utf8');
      const shareData = JSON.parse(shareContent);
      
      // Check if user has permission to revoke
      if (shareData.ownerId !== revokedBy) {
        throw new Error('Only the owner can revoke a share');
      }
      
      // Mark as revoked
      shareData.revoked = true;
      shareData.revokedAt = new Date().toISOString();
      shareData.revokedBy = revokedBy;
      
      await fs.writeFile(sharePath, JSON.stringify(shareData, null, 2));
      
      // Remove from file permissions
      await this.removeFilePermission(shareData.fileId, shareData.sharedWith);
      
      // Log revocation
      await this.logShareActivity(shareId, 'SHARE_REVOKED', {
        revokedBy,
        originalSharedWith: shareData.sharedWith
      });
      
      permissionsLogger.info('Share revoked successfully', { shareId });

      return {
        shareId,
        revoked: true,
        revokedAt: shareData.revokedAt
      };
    } catch (error) {
      permissionsLogger.error('Failed to revoke share', { shareId, error });
      throw error;
    }
  }

  /**
   * Remove file permission
   */
  async removeFilePermission(fileId, userId) {
    try {
      const permissionsPath = path.join(this.permissionsDir, `${fileId}.json`);
      
      const permissionsContent = await fs.readFile(permissionsPath, 'utf8');
      const permissions = JSON.parse(permissionsContent);
      
      delete permissions.permissions[userId];
      permissions.updatedAt = new Date().toISOString();
      
      await fs.writeFile(permissionsPath, JSON.stringify(permissions, null, 2));
      
      permissionsLogger.debug('File permission removed', { fileId, userId });
    } catch (error) {
      permissionsLogger.error('Failed to remove file permission', { fileId, userId, error });
      throw error;
    }
  }

  /**
   * Get share information
   */
  async getShare(shareId) {
    try {
      const sharePath = path.join(this.sharesDir, `${shareId}.json`);
      
      const shareContent = await fs.readFile(sharePath, 'utf8');
      const shareData = JSON.parse(shareContent);
      
      // Check if share is expired
      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        shareData.expired = true;
      }
      
      permissionsLogger.debug('Retrieved share information', { shareId });
      return shareData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Share not found');
      }
      permissionsLogger.error('Failed to get share', { shareId, error });
      throw error;
    }
  }

  /**
   * List user's shares (both given and received)
   */
  async listUserShares(userId, options = {}) {
    try {
      const shares = await fs.readdir(this.sharesDir);
      const userShares = {
        given: [],
        received: []
      };
      
      for (const shareFile of shares) {
        if (shareFile.endsWith('.json')) {
          const sharePath = path.join(this.sharesDir, shareFile);
          const shareContent = await fs.readFile(sharePath, 'utf8');
          const shareData = JSON.parse(shareContent);
          
          // Skip revoked shares unless specifically requested
          if (shareData.revoked && !options.includeRevoked) {
            continue;
          }
          
          const shareInfo = {
            shareId: shareData.shareId,
            fileId: shareData.fileId,
            permission: shareData.permission,
            createdAt: shareData.createdAt,
            expiresAt: shareData.expiresAt,
            revoked: shareData.revoked,
            message: shareData.message
          };
          
          if (shareData.ownerId === userId) {
            shareInfo.sharedWith = shareData.sharedWith;
            userShares.given.push(shareInfo);
          } else if (shareData.sharedWith === userId) {
            shareInfo.sharedBy = shareData.ownerId;
            userShares.received.push(shareInfo);
          }
        }
      }
      
      // Sort by creation date (newest first)
      userShares.given.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      userShares.received.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      permissionsLogger.debug('Listed user shares', { 
        userId, 
        given: userShares.given.length, 
        received: userShares.received.length 
      });

      return userShares;
    } catch (error) {
      permissionsLogger.error('Failed to list user shares', { userId, error });
      throw error;
    }
  }

  /**
   * Log share activity
   */
  async logShareActivity(shareId, activity, details = {}) {
    try {
      const sharePath = path.join(this.sharesDir, `${shareId}.json`);
      
      const shareContent = await fs.readFile(sharePath, 'utf8');
      const shareData = JSON.parse(shareContent);
      
      const logEntry = {
        activity,
        timestamp: new Date().toISOString(),
        details
      };
      
      shareData.accessLog.push(logEntry);
      
      await fs.writeFile(sharePath, JSON.stringify(shareData, null, 2));
      
      permissionsLogger.debug('Share activity logged', { shareId, activity });
    } catch (error) {
      permissionsLogger.error('Failed to log share activity', { shareId, activity, error });
      // Don't throw error for logging failures
    }
  }

  /**
   * Generate share URL
   */
  generateShareUrl(shareId) {
    const baseUrl = process.env.KEYSPACE_SHARE_BASE_URL || 'https://relay.network/share';
    return `${baseUrl}/${shareId}`;
  }  /**
   * Create group
   */
  async createGroup(ownerId, groupOptions) {
    try {
      // Handle both object and separate parameters
      let groupName, description, members;
      if (typeof groupOptions === 'object' && groupOptions.name) {
        groupName = groupOptions.name;
        description = groupOptions.description || '';
        members = groupOptions.members || [];
      } else {
        // Legacy support for separate parameters
        groupName = groupOptions;
        description = arguments[2] || '';
        members = arguments[3] || [];
      }
      
      const groupId = crypto.randomBytes(16).toString('hex');
      
      const groupData = {
        groupId,
        name: groupName,
        description,
        ownerId,
        members: [ownerId, ...members],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save the group file
      const groupPath = path.join(this.groupsDir, `${groupId}.json`);
      await fs.writeFile(groupPath, JSON.stringify(groupData, null, 2));
      
      // Update member group memberships
      for (const memberId of groupData.members) {
        await this.addUserToGroup(memberId, groupId);
      }
      
      permissionsLogger.info('Group created', { groupId, groupName, ownerId });
      
      return {
        groupId,
        name: groupName,
        description,
        members,
        createdAt: groupData.createdAt
      };
    } catch (error) {
      permissionsLogger.error('Failed to create group', { ownerId, groupName: groupOptions, error });
      throw error;
    }
  }

  /**
   * Add user to group
   */
  async addUserToGroup(userId, groupId) {
    try {
      const userGroupsPath = path.join(this.groupsDir, `user_${userId}.json`);
      
      let userGroups = { groups: [] };
      try {
        const groupsContent = await fs.readFile(userGroupsPath, 'utf8');
        userGroups = JSON.parse(groupsContent);
      } catch (error) {
        // Create new user groups file if it doesn't exist
      }
      
      if (!userGroups.groups.includes(groupId)) {
        userGroups.groups.push(groupId);
        userGroups.updatedAt = new Date().toISOString();
        
        await fs.writeFile(userGroupsPath, JSON.stringify(userGroups, null, 2));
      }
      
      permissionsLogger.debug('User added to group', { userId, groupId });
    } catch (error) {
      permissionsLogger.error('Failed to add user to group', { userId, groupId, error });
      throw error;
    }
  }

  /**
   * Access file through share
   */
  async accessSharedFile(shareId, accessorId) {
    try {
      const shareData = await this.getShare(shareId);
      
      // Check if share is valid
      if (shareData.revoked) {
        throw new Error('Share has been revoked');
      }
      
      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        throw new Error('Share has expired');
      }
      
      // Log access
      await this.logShareActivity(shareId, 'FILE_ACCESSED', {
        accessorId,
        timestamp: new Date().toISOString()
      });
      
      permissionsLogger.info('File accessed through share', { shareId, accessorId });
      
      return {
        fileId: shareData.fileId,
        permission: shareData.permission,
        ownerId: shareData.ownerId,
        accessAllowed: true
      };
    } catch (error) {
      permissionsLogger.error('Failed to access shared file', { shareId, accessorId, error });
      throw error;
    }
  }

  /**
   * Get file permissions summary
   */
  async getFilePermissionsSummary(fileId) {
    try {
      const permissionsPath = path.join(this.permissionsDir, `${fileId}.json`);
      
      const permissionsContent = await fs.readFile(permissionsPath, 'utf8');
      const permissions = JSON.parse(permissionsContent);
      
      const summary = {
        fileId,
        ownerId: permissions.ownerId,
        totalShares: Object.keys(permissions.permissions).length,
        permissions: [],
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt
      };
      
      for (const [userId, permission] of Object.entries(permissions.permissions)) {
        summary.permissions.push({
          userId,
          level: permission.level,
          grantedBy: permission.grantedBy,
          grantedAt: permission.grantedAt
        });
      }      
      return summary;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          fileId,
          ownerId: null,
          totalShares: 0,
          permissions: [],
          createdAt: null,
          updatedAt: null
        };
      }
      permissionsLogger.error('Failed to get file permissions summary', { fileId, error });
      throw error;
    }
  }
  /**
   * Share a file with another user (test-compatible API)
   */
  async shareFile(ownerId, options) {
    const { fileId, shareWith, permissions = PERMISSION_LEVELS.READ, ...rest } = options;
    
    try {
      const shareResult = await this.createShare(
        ownerId, 
        fileId, 
        shareWith, 
        permissions, 
        rest
      );
        return {
        shareId: shareResult.shareId,
        fileId: shareResult.fileId,
        shareWith: shareResult.sharedWith,
        sharedWith: shareResult.sharedWith, // For test compatibility
        permissionLevel: this.getPermissionLevelName(shareResult.permission),
        sharedAt: shareResult.createdAt,
        success: true
      };
    } catch (error) {
      permissionsLogger.error('Failed to share file', { ownerId, options, error });
      throw error;
    }
  }

  getPermissionLevelName(level) {
    switch(level) {
      case PERMISSION_LEVELS.READ: return 'read';
      case PERMISSION_LEVELS.WRITE: return 'write';
      case PERMISSION_LEVELS.ADMIN: return 'admin';
      default: return 'none';
    }
  }

  /**
   * Log access events for files
   */  async logAccess(userId, fileId, action, details = {}) {
    try {
      const accessLog = {
        userId,
        fileId,
        action,
        timestamp: new Date().toISOString(),
        details
      };
      
      // Store in access logs directory
      const accessLogsPath = path.join(this.accessLogsDir, `${userId}.json`);
      
      let logs = [];
      try {
        const content = await fs.readFile(accessLogsPath, 'utf8');
        logs = JSON.parse(content);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      logs.push(accessLog);
      
      // Keep only last 1000 logs per user
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      await fs.writeFile(accessLogsPath, JSON.stringify(logs, null, 2));
      
      permissionsLogger.debug('Access logged', { userId, fileId, action });
      return accessLog;
    } catch (error) {
      permissionsLogger.error('Failed to log access', { userId, fileId, action, error });
      throw error;
    }
  }

  /**
   * Update group membership
   */
  async updateGroupMembership(userId, groupId, options) {
    const { action, targetUserId } = options;
    
    try {
      const groupPath = path.join(this.groupsDir, `${groupId}.json`);
      const groupData = JSON.parse(await fs.readFile(groupPath, 'utf8'));
      
      // Check if user is group owner
      if (groupData.ownerId !== userId) {
        throw new Error('Only group owner can modify membership');
      }
      
      if (action === 'add') {
        if (!groupData.members.includes(targetUserId)) {
          groupData.members.push(targetUserId);
        }
      } else if (action === 'remove') {
        groupData.members = groupData.members.filter(id => id !== targetUserId);
      }
      
      groupData.updatedAt = new Date().toISOString();
      
      await fs.writeFile(groupPath, JSON.stringify(groupData, null, 2));
      
      permissionsLogger.info('Group membership updated', { userId, groupId, action, targetUserId });
      return {
        groupId,
        action,
        targetUserId,
        members: groupData.members,
        success: true      };
    } catch (error) {
      permissionsLogger.error('Failed to update group membership', { userId, groupId, options, error });
      throw error;
    }  }

  /**
   * Revoke all permissions for a file
   */
  async revokeAllFilePermissions(fileId) {
    try {
      this.logger.info('Revoking all permissions for file', { fileId });
      
      // Get all shares for this file
      const shareFiles = await this.getShareFiles();
      const filesToRevoke = [];
      
      for (const file of shareFiles) {
        try {
          const sharePath = path.join(this.sharesDir, file);
          const shareContent = await fs.readFile(sharePath, 'utf8');
          const share = JSON.parse(shareContent);
          
          if (share.fileId === fileId) {
            filesToRevoke.push({ shareId: share.shareId, file });
          }
        } catch (error) {
          this.logger.warn('Error reading share file', { file, error });
        }
      }
      
      // Revoke each share
      for (const { shareId, file } of filesToRevoke) {
        try {
          const sharePath = path.join(this.sharesDir, file);
          await fs.unlink(sharePath);
          this.logger.debug('Revoked share', { shareId, fileId });
        } catch (error) {
          this.logger.warn('Error revoking share', { shareId, fileId, error });
        }
      }
      
      this.logger.info('All permissions revoked for file', { fileId, revokedCount: filesToRevoke.length });
      return { success: true, revokedCount: filesToRevoke.length };
    } catch (error) {
      this.logger.error('Failed to revoke all file permissions', { fileId, error });
      throw error;
    }
  }

  // Core permission checking methods
  async hasFileAccess(userId, fileId, permission = 'read') {
    try {
      console.log('hasFileAccess called with:', { userId, fileId, permission });      // Check if user is the owner
      const fileMetadataPath = path.join(this.baseDir, 'metadata', userId, `${fileId}.json`);
      console.log('Checking if user owns file:', fileMetadataPath);
      try {
        await fs.access(fileMetadataPath);
        console.log('User owns the file');
        return true; // User owns the file
      } catch (error) {
        console.log('User does not own the file, checking shares...');
        // File not owned by user, check shares
      }// Check direct file shares
      const shares = await this.getAllShares();
      console.log('All shares found:', shares.length);
      const userShare = shares.find(share => 
        share.fileId === fileId && 
        share.sharedWith === userId && 
        !share.revoked &&
        (!share.expiresAt || new Date(share.expiresAt) > new Date())
      );

      if (userShare) {
        console.log('Found direct share:', userShare);
        // Check permission level for direct share
        const PERMISSION_LEVELS = { read: 1, write: 2, admin: 3 };
        const requiredLevel = PERMISSION_LEVELS[permission] || 1;
        return userShare.permission >= requiredLevel;
      }

      console.log('No direct share found, checking folder inheritance...');
      // Check folder inheritance - look for shared folders that might contain this file
      const folderShares = shares.filter(share => 
        share.sharedWith === userId && 
        !share.revoked &&
        (!share.expiresAt || new Date(share.expiresAt) > new Date())
      );

      console.log('Folder shares for user:', folderShares);      for (const folderShare of folderShares) {
        console.log('Checking folder share:', folderShare.fileId);        // Check if this file could be inside the shared folder
        // In a real implementation, you'd check the file's parent folder metadata
        // For testing purposes, we'll check if the file metadata indicates it's in this folder
        
        try {
          // Look for file metadata in owner's directory          
          let fileMetadata = null;
          const metadataDir = path.join(this.baseDir, 'metadata');
          console.log('Looking for metadata in:', metadataDir);
          
          let allUserDirs = [];
          try {
            allUserDirs = await fs.readdir(metadataDir);
            console.log('Available user directories:', allUserDirs);
          } catch (error) {
            console.log('Error reading metadata directory:', error);
            continue; // Skip to next folder share
          }
          
          for (const userDir of allUserDirs) {
            try {
              // List all files in the user directory for debugging
              const userDirPath = path.join(metadataDir, userDir);
              const filesInUserDir = await fs.readdir(userDirPath);
              console.log(`Files in ${userDir} directory:`, filesInUserDir);
              
              const filePath = path.join(metadataDir, userDir, `${fileId}.json`);
              console.log('Checking file metadata at:', filePath);
              const content = await fs.readFile(filePath, 'utf8');
              fileMetadata = JSON.parse(content);
              console.log('Found file metadata:', fileMetadata);
              break;
            } catch (error) {
              console.log('Error reading metadata from directory:', userDir, error.message);
              // Continue checking other users
            }
          }          // Check if file is in the shared folder by comparing folder metadata
          if (fileMetadata) {            // Try to find the folder metadata to match names
            let folderMetadata = null;
            for (const userDir of allUserDirs) {
              try {
                // Folder metadata is stored at {baseDir}/{userId}/metadata/{folderId}.json
                const folderPath = path.join(this.baseDir, userDir, 'metadata', `${folderShare.fileId}.json`);
                const content = await fs.readFile(folderPath, 'utf8');
                folderMetadata = JSON.parse(content);
                break;
              } catch (error) {
                // Continue checking other users
              }
            }// Debug logging
            console.log('Permission inheritance check:', {
              fileId,
              userId,
              folderShareId: folderShare.fileId,
              fileMetadata: {
                parentPath: fileMetadata.parentPath,
                folderId: fileMetadata.folderId
              },
              folderMetadata: folderMetadata ? { name: folderMetadata.name } : null
            });
            
            this.logger.info('Permission inheritance check', {
              fileId,
              userId,
              folderShareId: folderShare.fileId,
              fileMetadata: {
                parentPath: fileMetadata.parentPath,
                folderId: fileMetadata.folderId
              },
              folderMetadata: folderMetadata ? { name: folderMetadata.name } : null
            });
            
            // Check if file is associated with this folder
            if ((fileMetadata.folderId === folderShare.fileId) ||
                (fileMetadata.parentPath && folderMetadata && 
                 fileMetadata.parentPath.includes(folderMetadata.name))) {
              // File is in the shared folder, check permission level
              const PERMISSION_LEVELS = { read: 1, write: 2, admin: 3 };
              const requiredLevel = PERMISSION_LEVELS[permission] || 1;
              return folderShare.permission >= requiredLevel;
            }          } else {
            console.log('No file metadata found for fileId:', fileId);
          }
        } catch (error) {
          console.log('Error checking folder share:', folderShare.fileId, error.message);
          // Continue checking other folder shares
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking file access', { userId, fileId, permission, error });
      return false;
    }
  }

  async getUserShares(userId) {
    try {
      const allShares = await this.getAllShares();
      return allShares.filter(
        share => share.ownerId === userId || share.sharedWith === userId
      );
    } catch (error) {
      this.logger.error('Error getting user shares', { userId, error });
      return [];
    }
  }

  async getShareFiles() {
    try {
      const files = await fs.readdir(this.sharesDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getAllShares() {
    try {
      const shareFiles = await this.getShareFiles();
      const shares = [];
      
      for (const file of shareFiles) {
        try {
          const sharePath = path.join(this.sharesDir, file);
          const shareContent = await fs.readFile(sharePath, 'utf8');
          const shareData = JSON.parse(shareContent);
          shares.push(shareData);
        } catch (error) {
          this.logger.warn('Failed to read share file', { file, error });
        }
      }
      
      return shares;
    } catch (error) {
      this.logger.error('Error getting all shares', { error });
      return [];
    }
  }

  // Test-compatible API methods
  async checkFileAccess(userId, fileId, permission = 'read') {
    try {
      return await this.hasFileAccess(userId, fileId, permission);
    } catch (error) {
      this.logger.error('Failed to check file access', { userId, fileId, permission, error });
      return false;
    }
  }

  async getSharedFiles(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const userShares = await this.getUserShares(userId);
      
      // Get files shared WITH this user
      const sharedWithUser = userShares.filter(share => share.sharedWith === userId);
      
      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedShares = sharedWithUser.slice(start, end);
        return {
        files: paginatedShares,
        pagination: {
          total: sharedWithUser.length,
          page,
          limit,
          totalPages: Math.ceil(sharedWithUser.length / limit)
        }
      };
    } catch (error) {
      this.logger.error('Failed to get shared files', { userId, options, error });
      return { 
        files: [], 
        pagination: { 
          total: 0, 
          page: 1, 
          limit: 10, 
          totalPages: 0 
        } 
      };
    }
  }

  async getAccessLogs(userId, options = {}) {
    try {
      const { fileId, page = 1, limit = 10 } = options;
      const accessLogsPath = path.join(this.accessLogsDir, `${userId}.json`);
      
      let logs = [];
      try {
        const content = await fs.readFile(accessLogsPath, 'utf8');
        logs = JSON.parse(content);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      // Filter by fileId if provided
      if (fileId) {
        logs = logs.filter(log => log.fileId === fileId);
      }
      
      // Sort by timestamp descending
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedLogs = logs.slice(start, end);
      
      return {
        logs: paginatedLogs,
        totalCount: logs.length,
        page,
        limit,
        totalPages: Math.ceil(logs.length / limit)
      };
    } catch (error) {
      this.logger.error('Failed to get access logs', { userId, options, error });
      return { logs: [], totalCount: 0, page: 1, limit: 10, totalPages: 0 };
    }
  }
}

export default KeySpacePermissions;
