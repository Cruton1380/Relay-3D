/**
 * Hashgraph API Routes
 * Exposes Hashgraph-inspired features through REST API endpoints
 * Maintains transparency and auditability while preserving Relay's values
 */

import { Router } from 'express';
import logger from '../utils/logging/logger.mjs';

const router = Router();

/**
 * Initialize routes with Hashgraph service
 */
export function createHashgraphRoutes(hashgraphService) {
    
    /**
     * GET /api/hashgraph/health
     * Get system health and status
     */
    router.get('/health', async (req, res) => {
        try {
            const health = await hashgraphService.getSystemHealth();
            
            res.json({
                success: true,
                data: health,
                timestamp: Date.now()
            });
            
        } catch (error) {
            logger.error('Error getting Hashgraph health', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get system health',
                error: error.message
            });
        }
    });

    /**
     * GET /api/hashgraph/audit/export
     * Export audit trail for transparency
     */
    router.get('/audit/export', async (req, res) => {
        try {
            const {
                format = 'json',
                startDate,
                endDate,
                includeDAG = 'true'
            } = req.query;

            const timeRange = startDate && endDate ? {
                start: new Date(startDate),
                end: new Date(endDate)
            } : null;

            const auditData = await hashgraphService.exportAuditTrail({
                format,
                timeRange,
                includeDAG: includeDAG === 'true'
            });

            // Set appropriate headers for download
            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="relay-audit-trail.json"');
            } else if (format === 'graphviz') {
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Disposition', 'attachment; filename="relay-audit-dag.dot"');
            }

            res.json({
                success: true,
                data: auditData,
                exported: Date.now()
            });
            
        } catch (error) {
            logger.error('Error exporting audit trail', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to export audit trail',
                error: error.message
            });
        }
    });

    /**
     * GET /api/hashgraph/dag/visualization
     * Get DAG visualization data
     */
    router.get('/dag/visualization', async (req, res) => {
        try {
            const {
                channelId,
                userId,
                timeRange,
                eventType
            } = req.query;

            const filters = {};
            if (channelId) filters.channelId = channelId;
            if (userId) filters.userId = userId;
            if (eventType) filters.eventType = eventType;
            if (timeRange) {
                const [start, end] = timeRange.split(',');
                filters.timeRange = {
                    start: new Date(start),
                    end: new Date(end)
                };
            }

            const visualization = await hashgraphService.getDAGVisualization(filters);
            
            res.json({
                success: true,
                data: visualization,
                filters,
                timestamp: Date.now()
            });
            
        } catch (error) {
            logger.error('Error getting DAG visualization', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get DAG visualization',
                error: error.message
            });
        }
    });

    /**
     * GET /api/hashgraph/gossip/topology
     * Get gossip network topology
     */
    router.get('/gossip/topology', async (req, res) => {
        try {
            const { proximityRegion } = req.query;
            
            const topology = await hashgraphService.getGossipTopology(proximityRegion);
            
            res.json({
                success: true,
                data: topology,
                region: proximityRegion || 'global',
                timestamp: Date.now()
            });
            
        } catch (error) {
            logger.error('Error getting gossip topology', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get gossip topology',
                error: error.message
            });
        }
    });

    /**
     * POST /api/hashgraph/vote
     * Process a vote through Hashgraph system
     */
    router.post('/vote', async (req, res) => {
        try {
            const voteData = {
                userId: req.user?.id || req.body.userId,
                channelId: req.body.channelId,
                contentId: req.body.contentId,
                voteType: req.body.voteType,
                proximityRegion: req.body.proximityRegion
            };

            // Validate required fields
            if (!voteData.userId || !voteData.channelId || !voteData.contentId || !voteData.voteType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: userId, channelId, contentId, voteType'
                });
            }

            const result = await hashgraphService.processVote(voteData);
            
            res.json({
                success: true,
                data: result,
                message: 'Vote processed through Hashgraph system'
            });
            
        } catch (error) {
            logger.error('Error processing vote through Hashgraph', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to process vote',
                error: error.message
            });
        }
    });

    /**
     * POST /api/hashgraph/content
     * Process content posting through Hashgraph system
     */
    router.post('/content', async (req, res) => {
        try {
            const postData = {
                userId: req.user?.id || req.body.userId,
                channelId: req.body.channelId,
                content: req.body.content,
                proximityRegion: req.body.proximityRegion
            };

            // Validate required fields
            if (!postData.userId || !postData.channelId || !postData.content) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: userId, channelId, content'
                });
            }

            const result = await hashgraphService.processContentPost(postData);
            
            res.json({
                success: true,
                data: result,
                message: 'Content processed through Hashgraph system'
            });
            
        } catch (error) {
            logger.error('Error processing content through Hashgraph', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to process content',
                error: error.message
            });
        }
    });

    /**
     * POST /api/hashgraph/moderation
     * Process moderation action through Hashgraph audit system
     */
    router.post('/moderation', async (req, res) => {
        try {
            // Check if user has moderation permissions
            if (!req.user?.isModerator && !req.user?.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for moderation actions'
                });
            }

            const actionData = {
                moderatorId: req.user.id,
                actionType: req.body.actionType,
                targetUserId: req.body.targetUserId,
                targetContentId: req.body.targetContentId,
                reason: req.body.reason,
                channelId: req.body.channelId,
                proximityRegion: req.body.proximityRegion
            };

            // Validate required fields
            if (!actionData.actionType || !actionData.reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: actionType, reason'
                });
            }

            const result = await hashgraphService.processModerationAction(actionData);
            
            res.json({
                success: true,
                data: result,
                message: 'Moderation action processed with audit trail'
            });
            
        } catch (error) {
            logger.error('Error processing moderation action', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to process moderation action',
                error: error.message
            });
        }
    });

    /**
     * GET /api/hashgraph/events/:eventId/trace
     * Get event propagation trace for transparency
     */
    router.get('/events/:eventId/trace', async (req, res) => {
        try {
            const { eventId } = req.params;
            
            // This would trace how an event propagated through the network
            const trace = await hashgraphService.controller.dagConstructor.getEventTrace(eventId);
            
            res.json({
                success: true,
                data: trace,
                eventId,
                timestamp: Date.now()
            });
            
        } catch (error) {
            logger.error('Error getting event trace', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get event trace',
                error: error.message
            });
        }
    });

    /**
     * GET /api/hashgraph/sybil/assessment
     * Get current Sybil threat assessment
     */
    router.get('/sybil/assessment', async (req, res) => {
        try {
            // Only allow admins to view Sybil assessment
            if (!req.user?.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }

            const assessment = await hashgraphService.controller.sybilDetector.getThreatAssessment();
            
            res.json({
                success: true,
                data: assessment,
                timestamp: Date.now()
            });
            
        } catch (error) {
            logger.error('Error getting Sybil assessment', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get Sybil assessment',
                error: error.message
            });
        }
    });

    return router;
}

export default createHashgraphRoutes;
