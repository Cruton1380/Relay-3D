/**
 * Relay KeySpace Storage Market - Permissions & Access Control Module
 * 
 * Handles file access control, sharing permissions, and audit logging
 * for the decentralized storage market. Integrates with KeySpace identity
 * and guardian systems.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export class KeyspacePermissions extends EventEmitter {
    constructor(keyspaceAPI, guardianAPI) {
        super();
        this.keyspaceAPI = keyspaceAPI;
        this.guardianAPI = guardianAPI;
        
        // Access control lists for files
        this.fileACLs = new Map();
        
        // Share tokens for temporary access
        this.shareTokens = new Map();
        
        // Audit log for access events
        this.auditLog = [];
        
        // Permission types
        this.PERMISSIONS = {
            READ: 'read',
            WRITE: 'write',
            SHARE: 'share',
            DELETE: 'delete',
            ADMIN: 'admin'
        };
        
        // Share link types
        this.SHARE_TYPES = {
            PUBLIC: 'public',
            PRIVATE: 'private',
            GUARDIAN_ONLY: 'guardian-only',
            TIME_LIMITED: 'time-limited'
        };
    }

    /**
     * Initialize file permissions for a new upload
     */
    async initializeFilePermissions(fileId, ownerId, planTier = 'basic') {
        const acl = {
            fileId,
            ownerId,
            planTier,
            created: Date.now(),
            permissions: new Map([
                [ownerId, [this.PERMISSIONS.ADMIN, this.PERMISSIONS.READ, 
                          this.PERMISSIONS.WRITE, this.PERMISSIONS.SHARE, 
                          this.PERMISSIONS.DELETE]]
            ]),
            shares: new Map(),
            guardianBackup: planTier === 'vault',
            encrypted: true,
            auditEnabled: true
        };

        this.fileACLs.set(fileId, acl);
        
        await this.logAuditEvent({
            type: 'file_created',
            fileId,
            userId: ownerId,
            timestamp: Date.now(),
            metadata: { planTier }
        });

        this.emit('permissions:initialized', { fileId, ownerId, planTier });
        return acl;
    }

    /**
     * Check if user has specific permission for a file
     */
    async hasPermission(fileId, userId, permission) {
        const acl = this.fileACLs.get(fileId);
        if (!acl) {
            return false;
        }

        // Owner always has all permissions
        if (acl.ownerId === userId) {
            return true;
        }

        // Check direct permissions
        const userPermissions = acl.permissions.get(userId);
        if (userPermissions && userPermissions.includes(permission)) {
            return true;
        }

        // Check guardian permissions for vault tier files
        if (acl.planTier === 'vault' && permission === this.PERMISSIONS.READ) {
            const isGuardian = await this.guardianAPI.isGuardian(userId);
            if (isGuardian) {
                return true;
            }
        }

        // Check share token permissions
        for (const [token, shareData] of acl.shares) {
            if (shareData.userId === userId && shareData.permissions.includes(permission)) {
                // Check if share is still valid
                if (!shareData.expiresAt || Date.now() < shareData.expiresAt) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Grant permissions to a user
     */
    async grantPermission(fileId, granterId, targetUserId, permissions = []) {
        // Check if granter has admin or share permission
        const hasAdminAccess = await this.hasPermission(fileId, granterId, this.PERMISSIONS.ADMIN);
        const hasShareAccess = await this.hasPermission(fileId, granterId, this.PERMISSIONS.SHARE);
        
        if (!hasAdminAccess && !hasShareAccess) {
            throw new Error('Insufficient permissions to grant access');
        }

        const acl = this.fileACLs.get(fileId);
        if (!acl) {
            throw new Error('File not found');
        }

        // Validate target user exists in KeySpace
        const targetUser = await this.keyspaceAPI.getUser(targetUserId);
        if (!targetUser) {
            throw new Error('Target user not found');
        }

        // Grant permissions
        const existingPermissions = acl.permissions.get(targetUserId) || [];
        const newPermissions = [...new Set([...existingPermissions, ...permissions])];
        acl.permissions.set(targetUserId, newPermissions);

        await this.logAuditEvent({
            type: 'permission_granted',
            fileId,
            userId: granterId,
            targetUserId,
            permissions: newPermissions,
            timestamp: Date.now()
        });

        this.emit('permissions:granted', { 
            fileId, 
            granterId, 
            targetUserId, 
            permissions: newPermissions 
        });

        return true;
    }

    /**
     * Revoke permissions from a user
     */
    async revokePermission(fileId, revokerId, targetUserId, permissions = []) {
        const hasAdminAccess = await this.hasPermission(fileId, revokerId, this.PERMISSIONS.ADMIN);
        if (!hasAdminAccess) {
            throw new Error('Insufficient permissions to revoke access');
        }

        const acl = this.fileACLs.get(fileId);
        if (!acl) {
            throw new Error('File not found');
        }

        // Cannot revoke owner permissions
        if (acl.ownerId === targetUserId) {
            throw new Error('Cannot revoke owner permissions');
        }

        // Revoke specific permissions or all if none specified
        const existingPermissions = acl.permissions.get(targetUserId) || [];
        const permissionsToRevoke = permissions.length > 0 ? permissions : existingPermissions;
        
        const remainingPermissions = existingPermissions.filter(
            perm => !permissionsToRevoke.includes(perm)
        );

        if (remainingPermissions.length > 0) {
            acl.permissions.set(targetUserId, remainingPermissions);
        } else {
            acl.permissions.delete(targetUserId);
        }

        await this.logAuditEvent({
            type: 'permission_revoked',
            fileId,
            userId: revokerId,
            targetUserId,
            permissions: permissionsToRevoke,
            timestamp: Date.now()
        });

        this.emit('permissions:revoked', { 
            fileId, 
            revokerId, 
            targetUserId, 
            permissions: permissionsToRevoke 
        });

        return true;
    }

    /**
     * Create a share link for a file
     */
    async createShareLink(fileId, sharerId, options = {}) {
        const hasShareAccess = await this.hasPermission(fileId, sharerId, this.PERMISSIONS.SHARE);
        if (!hasShareAccess) {
            throw new Error('Insufficient permissions to create share link');
        }

        const {
            shareType = this.SHARE_TYPES.PRIVATE,
            permissions = [this.PERMISSIONS.READ],
            expiresIn = null, // milliseconds
            maxUses = null,
            targetUserId = null
        } = options;

        const shareToken = crypto.randomBytes(32).toString('hex');
        const shareData = {
            token: shareToken,
            fileId,
            sharerId,
            shareType,
            permissions,
            created: Date.now(),
            expiresAt: expiresIn ? Date.now() + expiresIn : null,
            maxUses,
            currentUses: 0,
            userId: targetUserId,
            active: true
        };

        this.shareTokens.set(shareToken, shareData);

        // Add to file ACL shares
        const acl = this.fileACLs.get(fileId);
        if (acl) {
            acl.shares.set(shareToken, shareData);
        }

        await this.logAuditEvent({
            type: 'share_created',
            fileId,
            userId: sharerId,
            shareToken,
            shareType,
            permissions,
            timestamp: Date.now()
        });

        this.emit('share:created', { fileId, sharerId, shareToken, shareData });

        return {
            shareToken,
            shareLink: `relay://storage/shared/${shareToken}`,
            expiresAt: shareData.expiresAt,
            permissions
        };
    }

    /**
     * Use a share link to access a file
     */
    async useShareLink(shareToken, userId) {
        const shareData = this.shareTokens.get(shareToken);
        if (!shareData || !shareData.active) {
            throw new Error('Invalid or expired share link');
        }

        // Check expiration
        if (shareData.expiresAt && Date.now() > shareData.expiresAt) {
            shareData.active = false;
            throw new Error('Share link has expired');
        }

        // Check usage limits
        if (shareData.maxUses && shareData.currentUses >= shareData.maxUses) {
            shareData.active = false;
            throw new Error('Share link usage limit exceeded');
        }

        // Check user restrictions
        if (shareData.userId && shareData.userId !== userId) {
            throw new Error('Share link not authorized for this user');
        }

        // Guardian-only shares
        if (shareData.shareType === this.SHARE_TYPES.GUARDIAN_ONLY) {
            const isGuardian = await this.guardianAPI.isGuardian(userId);
            if (!isGuardian) {
                throw new Error('Guardian access required');
            }
        }

        // Update usage count
        shareData.currentUses++;

        await this.logAuditEvent({
            type: 'share_used',
            fileId: shareData.fileId,
            userId,
            shareToken,
            timestamp: Date.now()
        });

        this.emit('share:used', { 
            fileId: shareData.fileId, 
            userId, 
            shareToken, 
            permissions: shareData.permissions 
        });

        return {
            fileId: shareData.fileId,
            permissions: shareData.permissions,
            tempAccess: true
        };
    }

    /**
     * Revoke a share link
     */
    async revokeShareLink(shareToken, revokerId) {
        const shareData = this.shareTokens.get(shareToken);
        if (!shareData) {
            throw new Error('Share link not found');
        }

        const hasAdminAccess = await this.hasPermission(
            shareData.fileId, 
            revokerId, 
            this.PERMISSIONS.ADMIN
        );
        
        const isShareCreator = shareData.sharerId === revokerId;

        if (!hasAdminAccess && !isShareCreator) {
            throw new Error('Insufficient permissions to revoke share link');
        }

        shareData.active = false;
        
        // Remove from file ACL
        const acl = this.fileACLs.get(shareData.fileId);
        if (acl) {
            acl.shares.delete(shareToken);
        }

        await this.logAuditEvent({
            type: 'share_revoked',
            fileId: shareData.fileId,
            userId: revokerId,
            shareToken,
            timestamp: Date.now()
        });

        this.emit('share:revoked', { 
            fileId: shareData.fileId, 
            revokerId, 
            shareToken 
        });

        return true;
    }

    /**
     * Get file permissions summary
     */
    async getFilePermissions(fileId, requesterId) {
        const hasAdminAccess = await this.hasPermission(fileId, requesterId, this.PERMISSIONS.ADMIN);
        if (!hasAdminAccess) {
            throw new Error('Insufficient permissions to view file permissions');
        }

        const acl = this.fileACLs.get(fileId);
        if (!acl) {
            throw new Error('File not found');
        }

        const permissions = [];
        for (const [userId, userPermissions] of acl.permissions) {
            permissions.push({
                userId,
                permissions: userPermissions,
                isOwner: userId === acl.ownerId
            });
        }

        const shares = [];
        for (const [token, shareData] of acl.shares) {
            if (shareData.active) {
                shares.push({
                    token,
                    shareType: shareData.shareType,
                    permissions: shareData.permissions,
                    created: shareData.created,
                    expiresAt: shareData.expiresAt,
                    currentUses: shareData.currentUses,
                    maxUses: shareData.maxUses
                });
            }
        }

        return {
            fileId,
            ownerId: acl.ownerId,
            planTier: acl.planTier,
            created: acl.created,
            permissions,
            shares,
            guardianBackup: acl.guardianBackup
        };
    }

    /**
     * Log audit event
     */
    async logAuditEvent(event) {
        const auditEntry = {
            id: crypto.randomUUID(),
            ...event,
            timestamp: event.timestamp || Date.now()
        };

        this.auditLog.push(auditEntry);

        // Keep only last 10000 events in memory
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }

        // Emit for external logging systems
        this.emit('audit:logged', auditEntry);

        return auditEntry;
    }

    /**
     * Get audit log for a file
     */
    async getAuditLog(fileId, requesterId, options = {}) {
        const hasAdminAccess = await this.hasPermission(fileId, requesterId, this.PERMISSIONS.ADMIN);
        if (!hasAdminAccess) {
            throw new Error('Insufficient permissions to view audit log');
        }

        const { 
            limit = 100, 
            startTime = 0, 
            endTime = Date.now(),
            eventTypes = null 
        } = options;

        let events = this.auditLog.filter(event => 
            event.fileId === fileId &&
            event.timestamp >= startTime &&
            event.timestamp <= endTime
        );

        if (eventTypes && eventTypes.length > 0) {
            events = events.filter(event => eventTypes.includes(event.type));
        }

        events.sort((a, b) => b.timestamp - a.timestamp);
        
        return events.slice(0, limit);
    }

    /**
     * Clean up expired shares and permissions
     */
    async cleanupExpiredAccess() {
        const now = Date.now();
        let cleanedCount = 0;

        // Clean expired share tokens
        for (const [token, shareData] of this.shareTokens) {
            if (shareData.expiresAt && now > shareData.expiresAt) {
                shareData.active = false;
                
                // Remove from file ACL
                const acl = this.fileACLs.get(shareData.fileId);
                if (acl) {
                    acl.shares.delete(token);
                }
                
                this.shareTokens.delete(token);
                cleanedCount++;
            }
        }

        this.emit('cleanup:completed', { cleanedCount, timestamp: now });
        return cleanedCount;
    }

    /**
     * Export file ACL for backup
     */
    exportFileACL(fileId) {
        const acl = this.fileACLs.get(fileId);
        if (!acl) {
            return null;
        }

        return {
            fileId: acl.fileId,
            ownerId: acl.ownerId,
            planTier: acl.planTier,
            created: acl.created,
            permissions: Object.fromEntries(acl.permissions),
            shares: Object.fromEntries(
                Array.from(acl.shares.entries()).filter(([_, shareData]) => shareData.active)
            ),
            guardianBackup: acl.guardianBackup,
            encrypted: acl.encrypted,
            auditEnabled: acl.auditEnabled
        };
    }

    /**
     * Import file ACL from backup
     */
    importFileACL(aclData) {
        const acl = {
            fileId: aclData.fileId,
            ownerId: aclData.ownerId,
            planTier: aclData.planTier,
            created: aclData.created,
            permissions: new Map(Object.entries(aclData.permissions)),
            shares: new Map(Object.entries(aclData.shares || {})),
            guardianBackup: aclData.guardianBackup,
            encrypted: aclData.encrypted,
            auditEnabled: aclData.auditEnabled
        };

        this.fileACLs.set(aclData.fileId, acl);

        // Restore share tokens
        for (const [token, shareData] of acl.shares) {
            this.shareTokens.set(token, shareData);
        }

        return true;
    }
}

export default KeyspacePermissions;
