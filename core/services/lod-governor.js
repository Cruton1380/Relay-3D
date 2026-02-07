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
        // Format: { levelName, inThreshold, outThreshold }
        this.levels = [
            { name: 'LANIAKEA', in: 400000, out: 450000 },  // > 400km
            { name: 'PLANETARY', in: 100000, out: 120000 },  // 100-400km
            { name: 'REGION', in: 50000, out: 60000 },       // 50-100km
            { name: 'COMPANY', in: 15000, out: 18000 },      // 15-50km
            { name: 'SHEET', in: 5000, out: 6000 },          // 5-15km
            { name: 'CELL', in: 0, out: 500 }                // < 5km
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
     */
    determineLODLevel(height) {
        // If no current level, use "in" thresholds
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
        
        // Check if we should zoom out (height increased)
        for (let i = 0; i < currentIndex; i++) {
            if (height >= this.levels[i].out) {
                return this.levels[i].name;
            }
        }
        
        // Check if we should zoom in (height decreased)
        for (let i = currentIndex + 1; i < this.levels.length; i++) {
            if (height < this.levels[i].in) {
                return this.levels[i].name;
            }
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
