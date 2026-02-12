/**
 * RELAY LOD GOVERNOR
 * Core service: altitude-based LOD with hysteresis
 * RENDERER-AGNOSTIC: subscribers decide how to render, governor only decides WHAT to show
 * NO CESIUM IMPORTS ALLOWED (Lock F) - camera height must be passed in
 */

export class RelayLODGovernor {
    constructor() {
        this.currentLevel = null;
        this.subscribers = [];
        this.isMonitoring = false;
        
        // LOD thresholds (altitude in meters above ground)
        // Calibrated for Relay tree: trunk at ground, sheets ~400m wide, dock at ~550m
        // Format: { levelName, inThreshold, outThreshold }
        this.levels = [
            { name: 'LANIAKEA', in: 400000, out: 450000 },  // > 400km (globe view)
            { name: 'PLANETARY', in: 100000, out: 120000 },  // 100-400km
            { name: 'REGION', in: 20000, out: 25000 },       // 20-100km (country/city)
            { name: 'COMPANY', in: 3000, out: 4000 },        // 3-20km (see whole tree, branches only)
            { name: 'SHEET', in: 800, out: 1200 },           // 800m-3km (see sheet surfaces, cell anchors)
            { name: 'CELL', in: 0, out: 600 }                // < 800m (full cell detail, ready to dock at 550m)
        ];
    }
    
    /**
     * Subscribe to LOD level changes
     * @param {Function} callback - (level) => void
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        
        // Immediately notify of current level
        if (this.currentLevel !== null) {
            callback(this.currentLevel);
        }
    }
    
    /**
     * Determine LOD level from camera height with hysteresis
     * @param {number} height - Camera height above ground in meters
     * @returns {string} LOD level name
     *
     * Algorithm:
     *   "in" threshold = lower bound of each level (used for initial determination + zoom-in)
     *   "out" threshold = hysteresis buffer for zooming OUT to a higher level
     *
     * Initial (from null): first level from top where height >= in
     * Zoom OUT: if height >= any higher level's "out", jump to that level
     * Zoom IN: if height < current level's "in", find the correct deeper level
     */
    determineLODLevel(height) {
        // If no current level, use "in" thresholds (iterate high → low)
        if (this.currentLevel === null) {
            for (let i = 0; i < this.levels.length; i++) {
                if (height >= this.levels[i].in) {
                    return this.levels[i].name;
                }
            }
            return 'CELL'; // Default to closest
        }
        
        // Find current level index
        const currentIndex = this.levels.findIndex(l => l.name === this.currentLevel);
        if (currentIndex < 0) return this.levels[0].name; // Safety fallback
        
        // Check if we should zoom out (height increased past a higher level's "out" threshold)
        for (let i = 0; i < currentIndex; i++) {
            if (height >= this.levels[i].out) {
                return this.levels[i].name;
            }
        }
        
        // Check if we should zoom in (height dropped below current level's "in" threshold)
        if (height < this.levels[currentIndex].in) {
            // Find the correct deeper level using "in" thresholds
            for (let i = currentIndex + 1; i < this.levels.length; i++) {
                if (height >= this.levels[i].in) {
                    return this.levels[i].name;
                }
            }
            return this.levels[this.levels.length - 1].name; // Deepest level
        }
        
        // Stay in current level (hysteresis prevents thrashing)
        return this.currentLevel;
    }
    
    /**
     * Update LOD based on current camera height
     * @param {number} height - Camera height above ground in meters
     */
    update(height) {
        const newLevel = this.determineLODLevel(height);
        
        if (newLevel !== this.currentLevel) {
            const oldLevel = this.currentLevel;
            this.currentLevel = newLevel;
            
            // Notify all subscribers
            this.subscribers.forEach(callback => callback(newLevel, oldLevel));
        }
    }
    
    /**
     * Start monitoring (caller provides update loop)
     * Note: Governor does not know about rendering, so caller must call update()
     */
    startMonitoring() {
        this.isMonitoring = true;
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
    }
    
    /**
     * Get current level
     */
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    /**
     * Get level configuration
     */
    getLevelConfig(levelName) {
        return this.levels.find(l => l.name === levelName);
    }
}
