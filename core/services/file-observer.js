/**
 * File Observer (Phase 0)
 * 
 * Read-only filesystem watcher for Desktop Relay Agent
 * Spec: docs/features/FILE-ORGANIZATION.md
 * 
 * DOES:
 * - Watch approved folders
 * - Record events (create, move, rename, delete)
 * - Calculate pressure scores (chaos metrics)
 * - Write FS_OBSERVED_EVENT commits
 * 
 * CANNOT:
 * - Execute any operations
 * - Propose changes
 * - Touch filesystem (read-only except for commit log)
 * 
 * NO Cesium imports allowed (renderer-agnostic core)
 */

import { FS_OBSERVED_EVENT } from '../models/commitTypes/fileSystemCommits.js';
import { RelayLog } from '../utils/relay-log.js';

export class FileObserver {
    /**
     * @param {string[]} approvedFolders - Absolute paths to folders to watch
     * @param {Object} commitLog - Commit log to write events to
     */
    constructor(approvedFolders = [], commitLog = null) {
        this.approvedFolders = approvedFolders;
        this.commitLog = commitLog || { append: () => {} };  // Default no-op
        this.eventLog = [];
        this.watchers = [];
        this.isObserving = false;
        
        RelayLog.info('FileObserver', `Initialized with ${approvedFolders.length} approved folders`);
    }
    
    /**
     * Check if a path is within approved scope
     * @param {string} path - Path to check
     * @returns {boolean} True if path is in scope
     */
    isInScope(path) {
        return this.approvedFolders.some(folder => 
            path.startsWith(folder)
        );
    }
    
    /**
     * Record a filesystem event
     * @param {Object} event - Event to record
     */
    recordEvent(event) {
        // Verify scope
        if (!this.isInScope(event.path)) {
            RelayLog.warn('FileObserver', `Event outside scope: ${event.path}`);
            return;
        }
        
        // Create commit
        const commit = {
            type: FS_OBSERVED_EVENT,
            eventType: event.eventType,
            path: event.path,
            timestamp: Date.now(),
            scope: this.findScope(event.path),
            metadata: event.metadata || {}
        };
        
        // Log to memory
        this.eventLog.push(commit);
        
        // Append to commit log
        this.commitLog.append(commit);
        
        RelayLog.info('FileObserver', `Recorded ${event.eventType}: ${event.path}`);
    }
    
    /**
     * Find which approved folder a path belongs to
     * @param {string} path - Path to check
     * @returns {string|null} Approved folder path or null
     */
    findScope(path) {
        for (const folder of this.approvedFolders) {
            if (path.startsWith(folder)) {
                return folder;
            }
        }
        return null;
    }
    
    /**
     * Calculate pressure (chaos) for a folder
     * @param {string} folderPath - Path to analyze
     * @returns {Object} Pressure analysis
     */
    calculatePressure(folderPath) {
        // Get events for this folder
        const folderEvents = this.eventLog.filter(event => 
            event.path.startsWith(folderPath)
        );
        
        // Analyze chaos metrics
        const uniquePaths = new Set(folderEvents.map(e => e.path));
        const creates = folderEvents.filter(e => e.eventType === 'create').length;
        const deletes = folderEvents.filter(e => e.eventType === 'delete').length;
        const moves = folderEvents.filter(e => e.eventType === 'move').length;
        const renames = folderEvents.filter(e => e.eventType === 'rename').length;
        
        // Calculate activity rate
        const activityRate = folderEvents.length / Math.max(1, 
            (Date.now() - this.getOldestEventTimestamp(folderPath)) / 86400000  // per day
        );
        
        // Calculate churn (creates + deletes)
        const churn = creates + deletes;
        
        // Estimate pressure (0.0 to 1.0)
        const pressure = Math.min(1.0, 
            (churn * 0.01) + (moves * 0.02) + (activityRate * 0.1)
        );
        
        const issues = [];
        if (creates > 50) issues.push(`${creates} files created`);
        if (churn > 100) issues.push(`High churn (${churn})`);
        if (activityRate > 10) issues.push(`High activity rate (${activityRate.toFixed(1)}/day)`);
        
        return {
            folderPath,
            pressure,
            metrics: {
                totalEvents: folderEvents.length,
                uniquePaths: uniquePaths.size,
                creates,
                deletes,
                moves,
                renames,
                activityRate: activityRate.toFixed(2),
                churn
            },
            issues,
            timestamp: Date.now()
        };
    }
    
    /**
     * Get oldest event timestamp for a folder
     * @param {string} folderPath - Folder to check
     * @returns {number} Timestamp or current time if no events
     */
    getOldestEventTimestamp(folderPath) {
        const folderEvents = this.eventLog.filter(event => 
            event.path.startsWith(folderPath)
        );
        
        if (folderEvents.length === 0) return Date.now();
        
        return Math.min(...folderEvents.map(e => e.timestamp));
    }
    
    /**
     * Get pressure analysis for all folders
     * @returns {Object[]} Array of pressure analyses
     */
    getAllPressures() {
        return this.approvedFolders.map(folder => 
            this.calculatePressure(folder)
        );
    }
    
    /**
     * Clear event log (for testing)
     */
    clearLog() {
        this.eventLog = [];
        RelayLog.info('FileObserver', 'Event log cleared');
    }
    
    /**
     * Get statistics
     * @returns {Object} Observer statistics
     */
    getStats() {
        return {
            approvedFolders: this.approvedFolders.length,
            totalEvents: this.eventLog.length,
            eventsByType: {
                create: this.eventLog.filter(e => e.eventType === 'create').length,
                move: this.eventLog.filter(e => e.eventType === 'move').length,
                rename: this.eventLog.filter(e => e.eventType === 'rename').length,
                delete: this.eventLog.filter(e => e.eventType === 'delete').length
            },
            isObserving: this.isObserving
        };
    }
}

/**
 * Phase 0 Note:
 * 
 * This implementation is Phase 0 only (read-only observer).
 * 
 * For actual filesystem watching (Node.js environment), you would use:
 * - fs.watch() (built-in Node.js)
 * - chokidar (recommended library)
 * 
 * Example integration (not included in Phase 0):
 * 
 * import chokidar from 'chokidar';
 * 
 * observeFileSystem() {
 *     for (const folder of this.approvedFolders) {
 *         const watcher = chokidar.watch(folder, {
 *             ignored: /(^|[\/\\])\../,  // Ignore dotfiles
 *             persistent: true
 *         });
 *         
 *         watcher
 *             .on('add', path => this.recordEvent({ eventType: 'create', path }))
 *             .on('change', path => this.recordEvent({ eventType: 'move', path }))
 *             .on('unlink', path => this.recordEvent({ eventType: 'delete', path }));
 *         
 *         this.watchers.push(watcher);
 *     }
 *     
 *     this.isObserving = true;
 * }
 * 
 * stopObserving() {
 *     for (const watcher of this.watchers) {
 *         watcher.close();
 *     }
 *     this.watchers = [];
 *     this.isObserving = false;
 * }
 */
