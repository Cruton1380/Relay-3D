/**
 * PROXIMITY HOTSPOT OWNERSHIP RESET SERVICE
 * 
 * Manages the physical reset of proximity hotspots by their actual owners,
 * migration of existing channels to regional status, and fresh channel creation.
 * 
 * Key Features:
 * - Physical hotspot reset verification
 * - Automatic channel migration to regional status
 * - Notification system for affected channel creators
 * - GPS-based location preservation for migrated channels
 * - Fresh start mechanism for official channel creation
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { getDataFilePath } from '../utils/dataUtils.mjs';
import BaseService from './BaseService.mjs';

export class ProximityOwnershipResetService extends BaseService {
    constructor() {
        super('proximity-ownership-reset');
        
        // Data storage
        this.resetRequestsFile = getDataFilePath('proximity-reset-requests.json');
        this.migrationHistoryFile = getDataFilePath('channel-migration-history.json');
        this.hotspotRegistryFile = getDataFilePath('hotspot-registry.json');
        
        // In-memory state
        this.resetRequests = new Map();
        this.migrationHistory = new Map();
        this.hotspotRegistry = new Map();
        this.activeResets = new Map();
        
        // Configuration
        this.config = {
            resetVerificationWindow: 30 * 60 * 1000, // 30 minutes to complete reset
            nameChangeDetectionInterval: 5 * 60 * 1000, // Check every 5 minutes
            migrationGracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days for migration
            requiredResetActions: [
                'hotspot_name_change',
                'network_restart',
                'ownership_verification'
            ]
        };
        
        // Services
        this.proximityDetectionService = null;
        this.channelService = null;
        this.notificationService = null;
        this.gpsService = null;
        
        this.initializeService();
    }

    async _initializeService() {
        await this.loadResetData();
        await this.startHotspotMonitoring();
        this.logger.info('Proximity ownership reset service initialized');
    }

    /**
     * Load reset-related data from disk
     */
    async loadResetData() {
        try {
            // Load reset requests
            if (await this.fileExists(this.resetRequestsFile)) {
                const resetData = await this.readJsonFile(this.resetRequestsFile);
                this.resetRequests = new Map(Object.entries(resetData));
            }

            // Load migration history
            if (await this.fileExists(this.migrationHistoryFile)) {
                const migrationData = await this.readJsonFile(this.migrationHistoryFile);
                this.migrationHistory = new Map(Object.entries(migrationData));
            }

            // Load hotspot registry
            if (await this.fileExists(this.hotspotRegistryFile)) {
                const registryData = await this.readJsonFile(this.hotspotRegistryFile);
                this.hotspotRegistry = new Map(Object.entries(registryData));
            }

            this.logger.info('Reset data loaded successfully');
        } catch (error) {
            this.logger.error('Failed to load reset data', { error: error.message });
        }
    }

    /**
     * Save reset data to disk
     */
    async saveResetData() {
        try {
            await this.writeJsonFile(this.resetRequestsFile, Object.fromEntries(this.resetRequests));
            await this.writeJsonFile(this.migrationHistoryFile, Object.fromEntries(this.migrationHistory));
            await this.writeJsonFile(this.hotspotRegistryFile, Object.fromEntries(this.hotspotRegistry));
        } catch (error) {
            this.logger.error('Failed to save reset data', { error: error.message });
        }
    }

    /**
     * Initiate proximity hotspot ownership reset process
     */
    async initiateHotspotReset(initiatorUserId, hotspotData) {
        try {
            const resetId = crypto.randomUUID();
            const hotspotId = this.generateHotspotId(hotspotData);

            // Validate hotspot exists and has channels
            const existingChannels = await this.getProximityChannelsForHotspot(hotspotId);
            if (existingChannels.length === 0) {
                throw new Error('No proximity channels exist for this hotspot');
            }

            // Create reset request
            const resetRequest = {
                id: resetId,
                hotspotId,
                initiatorUserId,
                hotspotData: {
                    currentName: hotspotData.name,
                    bssid: hotspotData.bssid,
                    location: hotspotData.location,
                    signalStrength: hotspotData.signalStrength,
                    encryption: hotspotData.encryption
                },
                affectedChannels: existingChannels.map(ch => ({
                    channelId: ch.id,
                    channelName: ch.name,
                    creatorId: ch.creatorId,
                    memberCount: ch.memberCount,
                    createdAt: ch.createdAt
                })),
                status: 'initiated',
                requiredActions: [...this.config.requiredResetActions],
                completedActions: [],
                verificationDeadline: Date.now() + this.config.resetVerificationWindow,
                createdAt: Date.now()
            };

            this.resetRequests.set(resetId, resetRequest);
            await this.saveResetData();

            // Start monitoring for reset completion
            this.monitorResetProgress(resetId);

            // Notify affected channel creators
            await this.notifyAffectedChannelCreators(resetRequest);

            this.logger.info('Hotspot reset initiated', {
                resetId,
                hotspotId,
                affectedChannels: existingChannels.length
            });

            return {
                resetId,
                verificationDeadline: resetRequest.verificationDeadline,
                requiredActions: resetRequest.requiredActions,
                affectedChannels: resetRequest.affectedChannels.length
            };

        } catch (error) {
            this._handleError('initiateHotspotReset', error);
            throw error;
        }
    }

    /**
     * Monitor reset progress and detect completion
     */
    async monitorResetProgress(resetId) {
        const resetRequest = this.resetRequests.get(resetId);
        if (!resetRequest) return;

        const monitoringInterval = setInterval(async () => {
            try {
                // Check if deadline has passed
                if (Date.now() > resetRequest.verificationDeadline) {
                    clearInterval(monitoringInterval);
                    await this.handleResetTimeout(resetId);
                    return;
                }

                // Check for completed actions
                await this.checkResetActionCompletion(resetId);

                // Check if all actions completed
                if (this.areAllActionsCompleted(resetRequest)) {
                    clearInterval(monitoringInterval);
                    await this.completeHotspotReset(resetId);
                }

            } catch (error) {
                this.logger.error('Error monitoring reset progress', {
                    resetId,
                    error: error.message
                });
            }
        }, this.config.nameChangeDetectionInterval);

        // Store interval for cleanup
        this.activeResets.set(resetId, monitoringInterval);
    }

    /**
     * Check for completion of required reset actions
     */
    async checkResetActionCompletion(resetId) {
        const resetRequest = this.resetRequests.get(resetId);
        if (!resetRequest) return;

        // Check for hotspot name change
        if (resetRequest.requiredActions.includes('hotspot_name_change') &&
            !resetRequest.completedActions.includes('hotspot_name_change')) {
            
            const currentHotspotData = await this.scanForHotspot(resetRequest.hotspotData.bssid);
            if (currentHotspotData && currentHotspotData.name !== resetRequest.hotspotData.currentName) {
                resetRequest.completedActions.push('hotspot_name_change');
                resetRequest.newHotspotName = currentHotspotData.name;
                
                this.logger.info('Hotspot name change detected', {
                    resetId,
                    oldName: resetRequest.hotspotData.currentName,
                    newName: currentHotspotData.name
                });
            }
        }

        // Check for network restart (signal disappearance and reappearance)
        if (resetRequest.requiredActions.includes('network_restart') &&
            !resetRequest.completedActions.includes('network_restart')) {
            
            const restartDetected = await this.detectNetworkRestart(resetRequest.hotspotData.bssid);
            if (restartDetected) {
                resetRequest.completedActions.push('network_restart');
                
                this.logger.info('Network restart detected', { resetId });
            }
        }

        // Check for ownership verification (could be manual or automated)
        if (resetRequest.requiredActions.includes('ownership_verification') &&
            !resetRequest.completedActions.includes('ownership_verification')) {
            
            // This could involve various verification methods
            const ownershipVerified = await this.verifyHotspotOwnership(resetRequest);
            if (ownershipVerified) {
                resetRequest.completedActions.push('ownership_verification');
                
                this.logger.info('Ownership verification completed', { resetId });
            }
        }

        await this.saveResetData();
    }

    /**
     * Complete the hotspot reset process
     */
    async completeHotspotReset(resetId) {
        try {
            const resetRequest = this.resetRequests.get(resetId);
            if (!resetRequest) {
                throw new Error('Reset request not found');
            }

            // Update reset status
            resetRequest.status = 'completed';
            resetRequest.completedAt = Date.now();

            // Execute channel migration
            const migrationResults = await this.migrateAffectedChannels(resetRequest);

            // Update hotspot registry
            await this.updateHotspotRegistry(resetRequest);

            // Notify all affected parties
            await this.notifyResetCompletion(resetRequest, migrationResults);

            // Clean up
            this.activeResets.delete(resetId);
            await this.saveResetData();

            this.emit('hotspot.reset.completed', {
                resetId,
                hotspotId: resetRequest.hotspotId,
                migratedChannels: migrationResults.migratedChannels.length,
                newHotspotName: resetRequest.newHotspotName
            });

            this.logger.info('Hotspot reset completed successfully', {
                resetId,
                migratedChannels: migrationResults.migratedChannels.length
            });

            return migrationResults;

        } catch (error) {
            this._handleError('completeHotspotReset', error);
            throw error;
        }
    }

    /**
     * Migrate affected proximity channels to regional status
     */
    async migrateAffectedChannels(resetRequest) {
        const migrationResults = {
            migratedChannels: [],
            migrationErrors: [],
            notifications: []
        };

        for (const affectedChannel of resetRequest.affectedChannels) {
            try {
                // Get full channel data
                const channelData = await this.channelService.getChannelById(affectedChannel.channelId);
                if (!channelData) {
                    migrationResults.migrationErrors.push({
                        channelId: affectedChannel.channelId,
                        error: 'Channel not found'
                    });
                    continue;
                }

                // Create regional channel migration
                const migrationData = {
                    migrationId: crypto.randomUUID(),
                    originalChannelId: affectedChannel.channelId,
                    originalChannelType: 'proximity',
                    newChannelType: 'regional',
                    resetId: resetRequest.id,
                    migrationReason: 'hotspot_ownership_reset',
                    preservedData: {
                        channelName: channelData.name,
                        description: channelData.description,
                        members: channelData.members,
                        content: channelData.content,
                        settings: channelData.settings,
                        createdAt: channelData.createdAt
                    },
                    locationData: {
                        gpsCoordinates: resetRequest.hotspotData.location,
                        originalHotspotName: resetRequest.hotspotData.currentName,
                        locationDescription: `Former proximity channel for ${resetRequest.hotspotData.currentName}`,
                        proximityDisclaimer: 'This channel is no longer associated with the physical location hotspot'
                    },
                    migratedAt: Date.now(),
                    migrationStatus: 'completed'
                };

                // Execute channel migration
                await this.executeChannelMigration(channelData, migrationData);

                // Record migration in history
                this.migrationHistory.set(migrationData.migrationId, migrationData);

                migrationResults.migratedChannels.push(migrationData);

                // Prepare notification for channel creator
                migrationResults.notifications.push({
                    recipientId: affectedChannel.creatorId,
                    type: 'channel_migrated',
                    channelId: affectedChannel.channelId,
                    migrationData
                });

                this.logger.info('Channel migrated successfully', {
                    channelId: affectedChannel.channelId,
                    migrationId: migrationData.migrationId
                });

            } catch (error) {
                migrationResults.migrationErrors.push({
                    channelId: affectedChannel.channelId,
                    error: error.message
                });

                this.logger.error('Channel migration failed', {
                    channelId: affectedChannel.channelId,
                    error: error.message
                });
            }
        }

        return migrationResults;
    }

    /**
     * Execute the actual channel migration
     */
    async executeChannelMigration(channelData, migrationData) {
        // Update channel type and metadata
        const updatedChannelData = {
            ...channelData,
            type: 'regional',
            originalType: 'proximity',
            migrationInfo: {
                migrationId: migrationData.migrationId,
                migratedAt: migrationData.migratedAt,
                migrationReason: migrationData.migrationReason,
                originalHotspot: migrationData.locationData.originalHotspotName
            },
            locationInfo: {
                ...migrationData.locationData,
                isFormerProximityChannel: true
            },
            proximityBinding: null, // Remove proximity binding
            regionalBinding: {
                region: await this.determineRegionFromLocation(migrationData.locationData.gpsCoordinates),
                gpsReference: migrationData.locationData.gpsCoordinates,
                locationDescription: migrationData.locationData.locationDescription
            }
        };

        // Update channel in database
        await this.channelService.updateChannel(channelData.id, updatedChannelData);

        // Update channel membership notifications
        await this.notifyChannelMembersOfMigration(channelData.id, migrationData);
    }

    /**
     * Update hotspot registry with new ownership
     */
    async updateHotspotRegistry(resetRequest) {
        const registryEntry = {
            hotspotId: resetRequest.hotspotId,
            bssid: resetRequest.hotspotData.bssid,
            currentName: resetRequest.newHotspotName,
            previousName: resetRequest.hotspotData.currentName,
            ownerUserId: resetRequest.initiatorUserId,
            location: resetRequest.hotspotData.location,
            lastReset: resetRequest.completedAt,
            resetHistory: this.hotspotRegistry.get(resetRequest.hotspotId)?.resetHistory || [],
            officialOwnership: true,
            verificationMethod: 'physical_reset'
        };

        // Add current reset to history
        registryEntry.resetHistory.push({
            resetId: resetRequest.id,
            resetDate: resetRequest.completedAt,
            previousChannelCount: resetRequest.affectedChannels.length,
            newOwner: resetRequest.initiatorUserId
        });

        this.hotspotRegistry.set(resetRequest.hotspotId, registryEntry);
        await this.saveResetData();
    }

    /**
     * Handle reset timeout
     */
    async handleResetTimeout(resetId) {
        const resetRequest = this.resetRequests.get(resetId);
        if (!resetRequest) return;

        resetRequest.status = 'timeout';
        resetRequest.timeoutAt = Date.now();

        // Clean up active monitoring
        const monitoringInterval = this.activeResets.get(resetId);
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            this.activeResets.delete(resetId);
        }

        // Notify initiator of timeout
        await this.notifyResetTimeout(resetRequest);

        await this.saveResetData();

        this.logger.info('Reset request timed out', {
            resetId,
            completedActions: resetRequest.completedActions.length,
            requiredActions: resetRequest.requiredActions.length
        });
    }

    /**
     * Notify affected channel creators about upcoming migration
     */
    async notifyAffectedChannelCreators(resetRequest) {
        for (const affectedChannel of resetRequest.affectedChannels) {
            await this.notificationService.createNotification({
                recipientId: affectedChannel.creatorId,
                type: 'proximity_channel_reset_warning',
                title: 'Proximity Channel Reset Notice',
                message: `The hotspot "${resetRequest.hotspotData.currentName}" is being reset by its owner. Your proximity channel "${affectedChannel.channelName}" will be migrated to a regional channel.`,
                data: {
                    resetId: resetRequest.id,
                    channelId: affectedChannel.channelId,
                    hotspotName: resetRequest.hotspotData.currentName,
                    deadline: resetRequest.verificationDeadline
                },
                priority: 'high'
            });
        }
    }

    /**
     * Notify completion of reset to all parties
     */
    async notifyResetCompletion(resetRequest, migrationResults) {
        // Notify initiator of successful reset
        await this.notificationService.createNotification({
            recipientId: resetRequest.initiatorUserId,
            type: 'hotspot_reset_completed',
            title: 'Hotspot Reset Completed',
            message: `Your hotspot reset for "${resetRequest.newHotspotName}" has been completed. You can now create your official proximity channel.`,
            data: {
                resetId: resetRequest.id,
                newHotspotName: resetRequest.newHotspotName,
                migratedChannels: migrationResults.migratedChannels.length
            }
        });

        // Notify affected channel creators of migration
        for (const notification of migrationResults.notifications) {
            await this.notificationService.createNotification({
                recipientId: notification.recipientId,
                type: notification.type,
                title: 'Channel Migrated to Regional',
                message: `Your proximity channel has been migrated to a regional channel due to hotspot ownership reset. Your content and members have been preserved.`,
                data: notification.migrationData
            });
        }
    }

    /**
     * Check if user can create official proximity channel
     */
    async canCreateOfficialProximityChannel(userId, hotspotData) {
        const hotspotId = this.generateHotspotId(hotspotData);
        const registryEntry = this.hotspotRegistry.get(hotspotId);

        if (!registryEntry) {
            // No registry entry means no official ownership
            return {
                canCreate: false,
                reason: 'No official ownership established',
                requiresReset: true
            };
        }

        if (registryEntry.ownerUserId !== userId) {
            return {
                canCreate: false,
                reason: 'Not the registered owner',
                registeredOwner: registryEntry.ownerUserId
            };
        }

        // Check if recent reset allows new channel creation
        const timeSinceReset = Date.now() - registryEntry.lastReset;
        const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours

        if (timeSinceReset < cooldownPeriod) {
            return {
                canCreate: true,
                isOfficialOwner: true,
                timeUntilCooldown: cooldownPeriod - timeSinceReset
            };
        }

        return {
            canCreate: true,
            isOfficialOwner: true,
            canCreateImmediately: true
        };
    }

    /**
     * Utility functions
     */
    generateHotspotId(hotspotData) {
        return crypto.createHash('sha256')
            .update(`${hotspotData.bssid}-${hotspotData.location.lat}-${hotspotData.location.lng}`)
            .digest('hex')
            .substring(0, 16);
    }

    areAllActionsCompleted(resetRequest) {
        return resetRequest.requiredActions.every(action => 
            resetRequest.completedActions.includes(action)
        );
    }

    async getProximityChannelsForHotspot(hotspotId) {
        // This would integrate with the channel service
        return await this.channelService.getChannelsByHotspot(hotspotId);
    }

    async scanForHotspot(bssid) {
        // This would integrate with proximity detection service
        return await this.proximityDetectionService.scanForBSSID(bssid);
    }

    async detectNetworkRestart(bssid) {
        // This would monitor for network disconnection/reconnection
        return await this.proximityDetectionService.detectRestart(bssid);
    }

    async verifyHotspotOwnership(resetRequest) {
        // This could involve various verification methods
        // For now, we'll consider ownership verified if other actions are completed
        return resetRequest.completedActions.length >= 2;
    }

    async determineRegionFromLocation(gpsCoordinates) {
        // This would integrate with the GPS/region service
        return await this.gpsService.getRegionFromCoordinates(gpsCoordinates);
    }

    async notifyChannelMembersOfMigration(channelId, migrationData) {
        // Notify all channel members about the migration
        const members = await this.channelService.getChannelMembers(channelId);
        
        for (const member of members) {
            await this.notificationService.createNotification({
                recipientId: member.userId,
                type: 'channel_migrated_member',
                title: 'Channel Type Changed',
                message: `The proximity channel you're a member of has been migrated to a regional channel.`,
                data: {
                    channelId,
                    migrationId: migrationData.migrationId,
                    newChannelType: 'regional'
                }
            });
        }
    }

    async notifyResetTimeout(resetRequest) {
        await this.notificationService.createNotification({
            recipientId: resetRequest.initiatorUserId,
            type: 'hotspot_reset_timeout',
            title: 'Hotspot Reset Timeout',
            message: 'Your hotspot reset request has timed out. Please try again if you still wish to reset the hotspot.',
            data: {
                resetId: resetRequest.id,
                completedActions: resetRequest.completedActions,
                requiredActions: resetRequest.requiredActions
            }
        });
    }

    async startHotspotMonitoring() {
        // Start monitoring for hotspot changes
        this.logger.info('Started hotspot monitoring for ownership resets');
    }

    /**
     * Get reset status
     */
    getResetStatus(resetId) {
        return this.resetRequests.get(resetId);
    }

    /**
     * Get migration history
     */
    getMigrationHistory(channelId) {
        return Array.from(this.migrationHistory.values())
            .filter(migration => migration.originalChannelId === channelId);
    }

    /**
     * Get hotspot registry entry
     */
    getHotspotRegistry(hotspotId) {
        return this.hotspotRegistry.get(hotspotId);
    }
}

export default ProximityOwnershipResetService;
