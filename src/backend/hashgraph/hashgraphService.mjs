/**
 * Hashgraph Service Integration
 * Connects Hashgraph-inspired features with existing Relay services
 * Maintains backward compatibility while adding DAG-based event tracking
 */

import HashgraphIntegrationController from './hashgraphIntegrationController.mjs';
import logger from '../utils/logging/logger.mjs';

class HashgraphService {
    constructor(serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
        this.isInitialized = false;
        
        // Initialize the Hashgraph Integration Controller
        this.controller = new HashgraphIntegrationController({
            enableGossip: true,
            enableDAGTracking: true,
            enableModerationAudit: true,
            enableSybilDetection: true
        });

        this.setupServiceIntegrations();
    }

    /**
     * Set up integrations with existing Relay services
     */
    setupServiceIntegrations() {
        // Listen for voting events
        this.controller.on('actionProcessed', async (data) => {
            await this.notifyRelevantServices(data);
        });        // Handle security alerts
        this.controller.on('securityAlert', async (alert) => {
            await this.handleSecurityIntegration(alert);
        });

        // Handle proximity verification triggers
        this.controller.on('triggerSecurityResponse', async (response) => {
            await this.triggerSecurityResponse(response);
        });

        logger.info('Hashgraph service integrations configured');
    }

    /**
     * Initialize the service with existing backend services
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Get references to existing services
            this.votingService = this.serviceRegistry.get('votingService');
            this.proximityService = this.serviceRegistry.get('proximityOnboardingService');
            this.moderationService = this.serviceRegistry.get('moderationService');
            this.channelService = this.serviceRegistry.get('channelService');

            this.isInitialized = true;
            
            logger.info('Hashgraph service initialized successfully', {
                module: 'hashgraph-service'
            });

        } catch (error) {
            logger.error('Failed to initialize Hashgraph service', {
                error: error.message,
                module: 'hashgraph-service'
            });
            throw error;
        }
    }

    /**
     * Process a vote through the Hashgraph system
     */
    async processVote(voteData) {
        const {
            userId,
            channelId,
            contentId,
            voteType,
            proximityRegion
        } = voteData;

        // Process through Hashgraph system
        const result = await this.controller.processUserAction({
            type: 'vote',
            userId,
            channelId,
            proximityRegion,
            content: {
                contentId,
                voteType
            },
            metadata: {
                revocable: true, // Maintain Relay's revocable vote principle
                timestamp: Date.now()
            }
        });

        // Forward to existing voting service
        if (this.votingService) {
            await this.votingService.processVote(voteData);
        }

        return result;
    }

    /**
     * Process moderation action through Hashgraph audit trail
     */
    async processModerationAction(actionData) {
        const {
            moderatorId,
            actionType,
            targetUserId,
            targetContentId,
            reason,
            channelId,
            proximityRegion
        } = actionData;

        // Process through Hashgraph system with audit trail
        const result = await this.controller.processUserAction({
            type: actionType,
            userId: moderatorId,
            channelId,
            proximityRegion,
            content: {
                targetUserId,
                targetContentId,
                reason
            },
            metadata: {
                moderation: true,
                reversible: true, // Maintain human agency
                timestamp: Date.now()
            }
        });

        // Forward to existing moderation service
        if (this.moderationService) {
            await this.moderationService.processAction(actionData);
        }

        return result;
    }

    /**
     * Process content posting with DAG tracking
     */
    async processContentPost(postData) {
        const {
            userId,
            channelId,
            content,
            proximityRegion
        } = postData;

        // Process through Hashgraph system
        const result = await this.controller.processUserAction({
            type: 'content_post',
            userId,
            channelId,
            proximityRegion,
            content,
            metadata: {
                editable: true, // Maintain content editability
                timestamp: Date.now()
            }
        });

        // Forward to existing channel service
        if (this.channelService) {
            await this.channelService.postContent(postData);
        }

        return result;
    }

    /**
     * Handle Sybil detection integration
     */
    async handleSybilIntegration(alert) {
        logger.info('Integrating Sybil alert with existing services', {
            alertType: alert.type,
            confidence: alert.confidence
        });

        // Notify proximity service for verification
        if (this.proximityService && alert.proximity) {
            try {
                await this.proximityService.flagSuspiciousActivity({
                    region: alert.proximity,
                    users: alert.users,
                    reason: 'sybil_pattern_detected',
                    confidence: alert.confidence
                });
            } catch (error) {
                logger.error('Failed to notify proximity service of Sybil alert', {
                    error: error.message
                });
            }
        }

        // Notify moderation service
        if (this.moderationService) {
            try {
                await this.moderationService.handleAutomatedAlert({
                    type: 'sybil_detection',
                    details: alert,
                    requiresHumanReview: alert.confidence > 0.8
                });
            } catch (error) {
                logger.error('Failed to notify moderation service of Sybil alert', {
                    error: error.message
                });
            }
        }
    }

    /**
     * Trigger proximity verification check
     */
    async triggerProximityCheck(verification) {
        if (!this.proximityService) return;

        try {
            await this.proximityService.triggerVerificationChallenge({
                region: verification.region,
                users: verification.users,
                reason: verification.reason,
                priority: 'high'
            });

            logger.info('Proximity verification triggered', {
                region: verification.region,
                userCount: verification.users.length,
                reason: verification.reason
            });

        } catch (error) {
            logger.error('Failed to trigger proximity verification', {
                error: error.message,
                region: verification.region
            });
        }
    }

    /**
     * Notify relevant services of processed actions
     */
    async notifyRelevantServices(data) {
        const { originalAction, dagEvent } = data;

        // Add DAG event ID to service notifications for traceability
        const enhancedAction = {
            ...originalAction,
            dagEventId: dagEvent?.id,
            hashgraphProcessed: true
        };

        // Emit event for other services to listen
        if (this.serviceRegistry.eventBus) {
            this.serviceRegistry.eventBus.emit('hashgraph:actionProcessed', enhancedAction);
        }
    }

    /**
     * Get system health and audit information
     */
    async getSystemHealth() {
        const health = await this.controller.analyzeNetworkHealth();
        const status = this.controller.getSystemStatus();

        return {
            health,
            status,
            integrationStatus: {
                initialized: this.isInitialized,
                connectedServices: {
                    voting: !!this.votingService,
                    proximity: !!this.proximityService,
                    moderation: !!this.moderationService,
                    channel: !!this.channelService
                }
            }
        };
    }

    /**
     * Export audit trail for transparency
     */
    async exportAuditTrail(options = {}) {
        return await this.controller.exportAuditTrail(options);
    }

    /**
     * Get DAG visualization data for a specific channel or user
     */
    async getDAGVisualization(filters = {}) {
        if (!this.controller.dagConstructor) {
            throw new Error('DAG tracking not enabled');
        }

        return await this.controller.dagConstructor.getVisualizationData(filters);
    }

    /**
     * Get gossip network topology for proximity regions
     */
    async getGossipTopology(proximityRegion = null) {
        if (!this.controller.gossipMesh) {
            throw new Error('Gossip mesh not enabled');
        }

        return await this.controller.gossipMesh.getTopology(proximityRegion);
    }

    /**
     * Shutdown the service
     */
    async shutdown() {
        logger.info('Shutting down Hashgraph service');
        
        if (this.controller) {
            await this.controller.shutdown();
        }
        
        this.isInitialized = false;
    }
}

export default HashgraphService;
