/**
 * RELAY NETWORK - MODERATION AUDIT DAG
 * 
 * Hashgraph-inspired moderation audit system that creates a traceable DAG
 * of all moderation actions (flagging, disputes, takedowns, appeals).
 * 
 * Features:
 * - Every moderation action becomes a node in the audit DAG
 * - Full traceability and ancestry tracking for moderation decisions
 * - Export capabilities for transparency and external audit
 * - Integration with existing Relay moderation workflows
 * - Cryptographic signatures for moderation action integrity
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class ModerationAuditDAG {
    constructor(options = {}) {
        this.auditNodes = new Map(); // node_id -> audit_node
        this.actionsByContent = new Map(); // content_id -> [action_ids]
        this.actionsByModerator = new Map(); // moderator_id -> [action_ids]
        this.actionsByType = new Map(); // action_type -> [action_ids]
        this.pendingActions = new Set(); // Actions pending review
        
        this.config = {
            maxRetentionDays: options.maxRetentionDays || 365,
            signatureRequired: options.signatureRequired !== false,
            exportPath: options.exportPath || './data/moderation-audit',
            pruneIntervalMs: options.pruneIntervalMs || 24 * 60 * 60 * 1000, // Daily
            ...options
        };

        this.startPruningSchedule();
    }

    /**
     * Create a new moderation audit node
     */
    async createModerationAction(actionData) {
        const {
            action_type, // 'flag', 'dispute', 'takedown', 'appeal', 'review', 'reinstate'
            moderator_id,
            content_id,
            channel_id,
            reason,
            evidence = {},
            parent_action_id = null, // Previous action this responds to
            metadata = {}
        } = actionData;

        const action_id = this.generateActionId();
        const timestamp = Date.now();

        // Find ancestry in the moderation chain
        const parentNode = parent_action_id ? this.auditNodes.get(parent_action_id) : null;
        const ancestry = this.buildActionAncestry(parent_action_id);

        // Create audit node
        const auditNode = {
            action_id,
            action_type,
            moderator_id,
            content_id,
            channel_id,
            reason,
            evidence,
            parent_action_id,
            ancestry,
            timestamp,
            metadata,
            status: 'active', // 'active', 'superseded', 'appealed'
            signatures: {}
        };

        // Sign the action if required
        if (this.config.signatureRequired) {
            auditNode.signatures.moderator = await this.signAction(auditNode, moderator_id);
        }

        // Store the audit node
        this.auditNodes.set(action_id, auditNode);

        // Index by various criteria
        this.indexModerationAction(auditNode);

        // Update parent status if this supersedes it
        if (parentNode && this.isSupersedingAction(action_type)) {
            parentNode.status = 'superseded';
            parentNode.superseded_by = action_id;
        }

        // Emit event for real-time tracking
        this.emitAuditEvent('action_created', auditNode);

        return action_id;
    }

    /**
     * Build ancestry chain for action traceability
     */
    buildActionAncestry(parent_action_id) {
        const ancestry = [];
        let current_id = parent_action_id;

        while (current_id && ancestry.length < 100) { // Prevent infinite loops
            const node = this.auditNodes.get(current_id);
            if (!node) break;

            ancestry.push({
                action_id: current_id,
                action_type: node.action_type,
                moderator_id: node.moderator_id,
                timestamp: node.timestamp
            });

            current_id = node.parent_action_id;
        }

        return ancestry;
    }

    /**
     * Index moderation action for efficient querying
     */
    indexModerationAction(auditNode) {
        const { action_id, content_id, moderator_id, action_type, status } = auditNode;

        // Index by content
        if (!this.actionsByContent.has(content_id)) {
            this.actionsByContent.set(content_id, []);
        }
        this.actionsByContent.get(content_id).push(action_id);

        // Index by moderator
        if (!this.actionsByModerator.has(moderator_id)) {
            this.actionsByModerator.set(moderator_id, []);
        }
        this.actionsByModerator.get(moderator_id).push(action_id);

        // Index by action type
        if (!this.actionsByType.has(action_type)) {
            this.actionsByType.set(action_type, []);
        }
        this.actionsByType.get(action_type).push(action_id);

        // Track pending actions
        if (this.requiresReview(action_type)) {
            this.pendingActions.add(action_id);
        }
    }

    /**
     * Get complete moderation history for content
     */
    getContentModerationHistory(content_id) {
        const action_ids = this.actionsByContent.get(content_id) || [];
        const actions = action_ids.map(id => this.auditNodes.get(id)).filter(Boolean);
        
        // Sort by timestamp for chronological order
        actions.sort((a, b) => a.timestamp - b.timestamp);

        return {
            content_id,
            total_actions: actions.length,
            actions,
            current_status: this.getCurrentContentStatus(content_id),
            moderation_chain: this.buildModerationChain(content_id)
        };
    }

    /**
     * Build the complete moderation decision chain
     */
    buildModerationChain(content_id) {
        const actions = this.getContentModerationHistory(content_id).actions;
        const chain = [];

        for (const action of actions) {
            const chainEntry = {
                action_id: action.action_id,
                action_type: action.action_type,
                moderator_id: action.moderator_id,
                timestamp: action.timestamp,
                reason: action.reason,
                status: action.status,
                children: []
            };

            // Find actions that reference this one as parent
            const children = actions.filter(a => a.parent_action_id === action.action_id);
            chainEntry.children = children.map(c => c.action_id);

            chain.push(chainEntry);
        }

        return chain;
    }

    /**
     * Get moderator activity and patterns
     */
    getModeratorActivity(moderator_id, timeframe_ms = 7 * 24 * 60 * 60 * 1000) {
        const action_ids = this.actionsByModerator.get(moderator_id) || [];
        const since = Date.now() - timeframe_ms;
        
        const recentActions = action_ids
            .map(id => this.auditNodes.get(id))
            .filter(action => action && action.timestamp >= since);

        const actionTypes = {};
        const overturned = [];
        const disputed = [];

        for (const action of recentActions) {
            actionTypes[action.action_type] = (actionTypes[action.action_type] || 0) + 1;

            if (action.status === 'superseded') {
                overturned.push(action.action_id);
            }

            // Check if this action has been disputed
            const disputes = action_ids
                .map(id => this.auditNodes.get(id))
                .filter(a => a && a.parent_action_id === action.action_id && a.action_type === 'dispute');
            
            if (disputes.length > 0) {
                disputed.push({ action_id: action.action_id, disputes: disputes.length });
            }
        }

        return {
            moderator_id,
            timeframe_ms,
            total_actions: recentActions.length,
            action_types: actionTypes,
            overturned_count: overturned.length,
            disputed_count: disputed.length,
            overturned_actions: overturned,
            disputed_actions: disputed,
            reliability_score: this.calculateModeratorReliability(moderator_id)
        };
    }

    /**
     * Calculate moderator reliability based on audit history
     */
    calculateModeratorReliability(moderator_id) {
        const activity = this.getModeratorActivity(moderator_id, 30 * 24 * 60 * 60 * 1000); // 30 days
        
        if (activity.total_actions === 0) return 1.0;

        const overturnRate = activity.overturned_count / activity.total_actions;
        const disputeRate = activity.disputed_count / activity.total_actions;
        
        // Reliability decreases with higher overturn and dispute rates
        const reliability = Math.max(0, 1.0 - (overturnRate * 0.7) - (disputeRate * 0.3));
        
        return Math.round(reliability * 100) / 100;
    }

    /**
     * Detect suspicious moderation patterns
     */
    detectSuspiciousModerationPatterns() {
        const suspiciousPatterns = [];
        const now = Date.now();
        const recent_window = 24 * 60 * 60 * 1000; // 24 hours

        // Check for rapid-fire moderation by same moderator
        for (const [moderator_id, action_ids] of this.actionsByModerator) {
            const recentActions = action_ids
                .map(id => this.auditNodes.get(id))
                .filter(action => action && (now - action.timestamp) < recent_window);

            if (recentActions.length > 50) { // Threshold for suspicious activity
                suspiciousPatterns.push({
                    type: 'rapid_moderation',
                    moderator_id,
                    action_count: recentActions.length,
                    timeframe: recent_window,
                    risk_level: 'high'
                });
            }
        }

        // Check for coordinated moderation (multiple moderators targeting same content)
        for (const [content_id, action_ids] of this.actionsByContent) {
            const recentActions = action_ids
                .map(id => this.auditNodes.get(id))
                .filter(action => action && (now - action.timestamp) < recent_window);

            const uniqueModerators = new Set(recentActions.map(a => a.moderator_id));
            
            if (uniqueModerators.size > 3 && recentActions.length > 5) {
                suspiciousPatterns.push({
                    type: 'coordinated_moderation',
                    content_id,
                    moderator_count: uniqueModerators.size,
                    action_count: recentActions.length,
                    moderators: Array.from(uniqueModerators),
                    risk_level: 'medium'
                });
            }
        }

        return suspiciousPatterns;
    }

    /**
     * Export audit DAG for transparency and external analysis
     */
    async exportAuditDAG(format = 'json', filters = {}) {
        const { since, action_types, moderators, content_ids } = filters;
        
        let actions = Array.from(this.auditNodes.values());

        // Apply filters
        if (since) {
            actions = actions.filter(a => a.timestamp >= since);
        }
        if (action_types && action_types.length > 0) {
            actions = actions.filter(a => action_types.includes(a.action_type));
        }
        if (moderators && moderators.length > 0) {
            actions = actions.filter(a => moderators.includes(a.moderator_id));
        }
        if (content_ids && content_ids.length > 0) {
            actions = actions.filter(a => content_ids.includes(a.content_id));
        }

        const exportData = {
            export_timestamp: Date.now(),
            total_actions: actions.length,
            filters,
            audit_nodes: actions,
            metadata: {
                export_format: format,
                relay_network_version: '1.0.0',
                audit_dag_version: '1.0.0'
            }
        };

        if (format === 'graphviz') {
            return this.generateGraphvizFormat(exportData);
        }

        // Ensure export directory exists
        await fs.mkdir(this.config.exportPath, { recursive: true });
        
        const filename = `moderation-audit-${Date.now()}.json`;
        const filepath = path.join(this.config.exportPath, filename);
        
        await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
        
        return {
            filepath,
            format,
            action_count: actions.length,
            export_data: exportData
        };
    }

    /**
     * Generate Graphviz DOT format for visualization
     */
    generateGraphvizFormat(exportData) {
        const { audit_nodes } = exportData;
        
        let dot = 'digraph ModerationAuditDAG {\n';
        dot += '  rankdir=TB;\n';
        dot += '  node [shape=box, style=rounded];\n\n';

        // Add nodes
        for (const action of audit_nodes) {
            const color = this.getActionColor(action.action_type);
            const label = `${action.action_type}\\n${action.moderator_id}\\n${new Date(action.timestamp).toISOString().split('T')[0]}`;
            
            dot += `  "${action.action_id}" [label="${label}", fillcolor="${color}", style="filled,rounded"];\n`;
        }

        dot += '\n';

        // Add edges (parent-child relationships)
        for (const action of audit_nodes) {
            if (action.parent_action_id) {
                dot += `  "${action.parent_action_id}" -> "${action.action_id}";\n`;
            }
        }

        dot += '}\n';
        
        return dot;
    }

    /**
     * Get color for action type in visualizations
     */
    getActionColor(action_type) {
        const colors = {
            'flag': '#ffcc00',
            'dispute': '#ff6600',
            'takedown': '#ff0000',
            'appeal': '#0066ff',
            'review': '#00cc00',
            'reinstate': '#00ff66'
        };
        return colors[action_type] || '#cccccc';
    }

    /**
     * Utility methods
     */
    generateActionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    async signAction(auditNode, moderator_id) {
        // In a real implementation, this would use the moderator's private key
        const data = JSON.stringify({
            action_id: auditNode.action_id,
            action_type: auditNode.action_type,
            content_id: auditNode.content_id,
            timestamp: auditNode.timestamp
        });
        
        return crypto.createHash('sha256').update(data + moderator_id).digest('hex');
    }

    isSupersedingAction(action_type) {
        return ['takedown', 'reinstate', 'review'].includes(action_type);
    }

    requiresReview(action_type) {
        return ['appeal', 'dispute'].includes(action_type);
    }

    getCurrentContentStatus(content_id) {
        const actions = this.actionsByContent.get(content_id) || [];
        const latestActions = actions
            .map(id => this.auditNodes.get(id))
            .filter(action => action && action.status === 'active')
            .sort((a, b) => b.timestamp - a.timestamp);

        if (latestActions.length === 0) return 'normal';

        const latest = latestActions[0];
        const statusMap = {
            'flag': 'flagged',
            'takedown': 'removed',
            'reinstate': 'normal',
            'review': 'under_review'
        };

        return statusMap[latest.action_type] || 'normal';
    }

    emitAuditEvent(event_type, data) {
        // Integration point for real-time updates
        console.log(`[ModerationAudit] ${event_type}:`, data.action_id);
    }

    /**
     * Periodic cleanup of old audit records
     */
    startPruningSchedule() {
        setInterval(() => {
            this.pruneOldAuditRecords();
        }, this.config.pruneIntervalMs);
    }

    async pruneOldAuditRecords() {
        const cutoff = Date.now() - (this.config.maxRetentionDays * 24 * 60 * 60 * 1000);
        let pruned = 0;

        for (const [action_id, auditNode] of this.auditNodes) {
            if (auditNode.timestamp < cutoff) {
                this.auditNodes.delete(action_id);
                this.removeFromIndexes(auditNode);
                pruned++;
            }
        }

        if (pruned > 0) {
            console.log(`[ModerationAudit] Pruned ${pruned} old audit records`);
        }
    }

    removeFromIndexes(auditNode) {
        const { action_id, content_id, moderator_id, action_type } = auditNode;

        // Remove from content index
        const contentActions = this.actionsByContent.get(content_id);
        if (contentActions) {
            const index = contentActions.indexOf(action_id);
            if (index > -1) contentActions.splice(index, 1);
        }

        // Remove from moderator index
        const moderatorActions = this.actionsByModerator.get(moderator_id);
        if (moderatorActions) {
            const index = moderatorActions.indexOf(action_id);
            if (index > -1) moderatorActions.splice(index, 1);
        }

        // Remove from type index
        const typeActions = this.actionsByType.get(action_type);
        if (typeActions) {
            const index = typeActions.indexOf(action_id);
            if (index > -1) typeActions.splice(index, 1);
        }

        // Remove from pending actions
        this.pendingActions.delete(action_id);
    }
}

export default ModerationAuditDAG;
