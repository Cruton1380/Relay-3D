/**
 * Analytics API Routes
 * 
 * API endpoints for Timeline and Globe analytics visualization
 */

import express from 'express';
import TimelineAnalyticsEngine from '../services/timelineAnalyticsEngine.mjs';
import GlobeAnalyticsEngine from '../services/globeAnalyticsEngine.mjs';
import { authenticateToken } from '../middleware/auth.mjs';
import { validateRequest } from '../middleware/validation.mjs';
import logger from '../utils/logging/logger.mjs';

const router = express.Router();

// Initialize analytics engines
const timelineAnalytics = new TimelineAnalyticsEngine();
const globeAnalytics = new GlobeAnalyticsEngine();

/**
 * Timeline Analytics Routes
 */

// Get timeline data for a topic row
router.get('/timeline/:topicRowId', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        const filters = {
            timespan: req.query.timespan || 'full',
            userTypes: req.query.userTypes ? req.query.userTypes.split(',') : undefined,
            timeRange: req.query.timeRange || '7d',
            smoothing: req.query.smoothing || 'moderate'
        };

        const timeline = await timelineAnalytics.generateTopicRowTimeline(topicRowId, filters);

        res.json({
            success: true,
            data: timeline,
            metadata: {
                topicRowId,
                filters,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Timeline analytics error', { error: error.message, topicRowId: req.params.topicRowId });
        res.status(500).json({
            success: false,
            error: 'Failed to generate timeline analytics',
            message: error.message
        });
    }
});

// Compare multiple topic row timelines
router.post('/timeline/compare', authenticateToken, validateRequest('timelineCompare'), async (req, res) => {
    try {
        const { topicRowIds, comparisonType = 'overlay', filters = {} } = req.body;

        if (!topicRowIds || !Array.isArray(topicRowIds) || topicRowIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 topic row IDs required for comparison'
            });
        }

        const comparison = await timelineAnalytics.compareTopicRowTimelines(topicRowIds, comparisonType);

        res.json({
            success: true,
            data: comparison,
            metadata: {
                comparisonType,
                topicRowCount: topicRowIds.length,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Timeline comparison error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to compare timelines',
            message: error.message
        });
    }
});

// Get available filters for timeline
router.get('/timeline/:topicRowId/filters', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        const filters = timelineAnalytics.getAvailableFilters(topicRowId);

        res.json({
            success: true,
            data: {
                availableFilters: filters,
                defaultFilters: timelineAnalytics.getDefaultFilters()
            }
        });

    } catch (error) {
        logger.error('Timeline filters error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get timeline filters'
        });
    }
});

/**
 * Globe Analytics Routes
 */

// Initialize globe visualization
router.post('/globe/initialize', authenticateToken, async (req, res) => {
    try {
        const { containerId, options = {} } = req.body;

        if (!containerId) {
            return res.status(400).json({
                success: false,
                error: 'Container ID is required'
            });
        }

        const globeConfig = await globeAnalytics.initializeGlobeVisualization(containerId, options);

        res.json({
            success: true,
            data: globeConfig,
            metadata: {
                containerId,
                initializedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Globe initialization error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to initialize globe visualization',
            message: error.message
        });
    }
});

// Get globe plot data for topic row
router.get('/globe/:topicRowId/plots', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        const filters = {
            userTypes: req.query.userTypes ? req.query.userTypes.split(',') : undefined,
            timeRange: req.query.timeRange || '24h',
            regions: req.query.regions ? req.query.regions.split(',') : undefined,
            channels: req.query.channels ? req.query.channels.split(',') : undefined
        };

        const plotData = await globeAnalytics.plotVotingUsers(topicRowId, filters);

        res.json({
            success: true,
            data: plotData,
            metadata: {
                topicRowId,
                filters,
                plotCount: Object.values(plotData).reduce((sum, plots) => sum + plots.length, 0),
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Globe plots error', { error: error.message, topicRowId: req.params.topicRowId });
        res.status(500).json({
            success: false,
            error: 'Failed to generate globe plots',
            message: error.message
        });
    }
});

// Get regional boundaries for analysis
router.get('/globe/:topicRowId/boundaries', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        const analysisRegions = await globeAnalytics.getRegionalBoundariesForTopicRow(topicRowId);
        const boundaries = await globeAnalytics.createRegionalBoundaries(analysisRegions);

        res.json({
            success: true,
            data: boundaries,
            metadata: {
                topicRowId,
                boundaryCount: boundaries.length,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Globe boundaries error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get regional boundaries'
        });
    }
});

// Compare multiple topic rows on globe
router.post('/globe/compare', authenticateToken, validateRequest('globeCompare'), async (req, res) => {
    try {
        const { topicRowIds, comparisonMode = 'split_view', filters = {} } = req.body;

        if (!topicRowIds || !Array.isArray(topicRowIds) || topicRowIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 topic row IDs required for comparison'
            });
        }

        const comparison = await globeAnalytics.compareTopicRowsOnGlobe(topicRowIds, comparisonMode);

        res.json({
            success: true,
            data: comparison,
            metadata: {
                comparisonMode,
                topicRowCount: topicRowIds.length,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Globe comparison error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to compare globe data',
            message: error.message
        });
    }
});

// Start real-time updates for globe
router.post('/globe/:topicRowId/realtime/start', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        await globeAnalytics.startRealTimeGlobeUpdates(topicRowId);

        res.json({
            success: true,
            message: 'Real-time globe updates started',
            data: {
                topicRowId,
                startedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Globe real-time start error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to start real-time updates'
        });
    }
});

/**
 * Combined Analytics Routes
 */

// Get combined timeline and globe data
router.get('/combined/:topicRowId', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        const filters = {
            timespan: req.query.timespan || 'full',
            userTypes: req.query.userTypes ? req.query.userTypes.split(',') : undefined,
            timeRange: req.query.timeRange || '7d'
        };

        const [timeline, globePlots] = await Promise.all([
            timelineAnalytics.generateTopicRowTimeline(topicRowId, filters),
            globeAnalytics.plotVotingUsers(topicRowId, filters)
        ]);

        res.json({
            success: true,
            data: {
                timeline,
                globe: globePlots
            },
            metadata: {
                topicRowId,
                filters,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Combined analytics error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to generate combined analytics'
        });
    }
});

// Export analytics data
router.post('/export', authenticateToken, async (req, res) => {
    try {
        const { topicRowIds, format = 'json', includeTimeline = true, includeGlobe = true } = req.body;

        if (!topicRowIds || !Array.isArray(topicRowIds)) {
            return res.status(400).json({
                success: false,
                error: 'Topic row IDs required'
            });
        }

        const exportData = {
            metadata: {
                exportedAt: Date.now(),
                topicRowIds,
                format,
                privacyLevel: 'maximum'
            }
        };

        if (includeTimeline) {
            exportData.timelines = await Promise.all(
                topicRowIds.map(id => timelineAnalytics.generateTopicRowTimeline(id))
            );
        }

        if (includeGlobe) {
            exportData.globeData = await Promise.all(
                topicRowIds.map(id => globeAnalytics.plotVotingUsers(id))
            );
        }

        // Set appropriate headers for download
        const filename = `relay-analytics-${Date.now()}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');

        if (format === 'json') {
            res.json(exportData);
        } else {
            // Convert to CSV format
            const csvData = convertAnalyticsToCSV(exportData);
            res.send(csvData);
        }

    } catch (error) {
        logger.error('Analytics export error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to export analytics data'
        });
    }
});

/**
 * General Analytics Routes
 */

// Get available topic rows for analytics
router.get('/topic-rows', authenticateToken, async (req, res) => {
    try {
        const filters = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
            minVotes: parseInt(req.query.minVotes) || 1,
            timeRange: req.query.timeRange || '30d'
        };

        const topicRows = await timelineAnalytics.getAvailableTopicRows(filters);

        res.json({
            success: true,
            data: {
                topicRows: topicRows.map(row => ({
                    id: row.id,
                    title: row.title,
                    voteCount: row.voteCount,
                    lastActivity: row.lastActivity,
                    regions: row.activeRegions || [],
                    participants: row.participantCount || 0
                })),
                totalCount: topicRows.length,
                hasMore: topicRows.length === filters.limit
            },
            metadata: {
                filters,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Topic rows fetch error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch topic rows'
        });
    }
});

// Get voting users data for globe visualization
router.get('/globe/:topicRowId/voting-users', authenticateToken, async (req, res) => {
    try {
        const { topicRowId } = req.params;
        const filters = {
            userTypes: req.query.userTypes ? req.query.userTypes.split(',') : ['active', 'local'],
            timeRange: req.query.timeRange || '24h',
            privacyLevel: req.query.privacyLevel || 'maximum',
            showClusters: req.query.showClusters === 'true'
        };

        const votingData = await globeAnalytics.plotVotingUsers(topicRowId, filters);
        const regionalBoundaries = await globeAnalytics.getRegionalBoundariesForTopicRow(topicRowId);

        res.json({
            success: true,
            data: {
                userPlots: votingData.userPlots || [],
                regionalBoundaries: regionalBoundaries || [],
                availableRegions: regionalBoundaries.map(region => ({
                    id: region.id,
                    name: region.name,
                    userCount: region.userCount || 0
                })),
                totalVotes: votingData.totalVotes || 0,
                activeRegions: votingData.activeRegions || 0,
                lastUpdated: Date.now()
            },
            metadata: {
                topicRowId,
                filters,
                generatedAt: Date.now()
            }
        });

    } catch (error) {
        logger.error('Globe voting users error', { error: error.message, topicRowId: req.params.topicRowId });
        res.status(500).json({
            success: false,
            error: 'Failed to get voting users data',
            message: error.message
        });
    }
});

/**
 * Utility functions
 */

function convertAnalyticsToCSV(data) {
    // Simple CSV conversion - in production, use a proper CSV library
    const lines = [];
    lines.push('Timestamp,TopicRowId,UserType,VoteWeight,UserCount,Region');
    
    // Add timeline data
    if (data.timelines) {
        data.timelines.forEach((timeline, index) => {
            const topicRowId = data.metadata.topicRowIds[index];
            Object.values(timeline.trackingLines).forEach(line => {
                line.dataPoints.forEach(point => {
                    lines.push(`${point.timestamp},${topicRowId},${line.lineType},${point.voteWeight},${point.userCount},${point.region || ''}`);
                });
            });
        });
    }
    
    return lines.join('\n');
}

// Error handling middleware for analytics routes
router.use((error, req, res, next) => {
    logger.error('Analytics API error', { 
        error: error.message, 
        stack: error.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal analytics service error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
});

export default router;
