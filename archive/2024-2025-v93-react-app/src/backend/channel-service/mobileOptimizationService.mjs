/**
 * Mobile Optimization Service
 * Adapts proximity detection for mobile scenarios and battery constraints
 */

import EventEmitter from 'events';

export default class MobileOptimizationService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            batteryThresholds: {
                high: 0.8,      // Above 80% - full functionality
                medium: 0.5,    // 50-80% - reduced scanning
                low: 0.2,       // 20-50% - minimal scanning
                critical: 0.1   // Below 10% - emergency only
            },
            scanIntervals: {
                high: 3000,     // 3 seconds - high battery
                medium: 10000,  // 10 seconds - medium battery
                low: 30000,     // 30 seconds - low battery
                critical: 120000 // 2 minutes - critical battery
            },
            networkAdaptation: {
                wifi: true,     // Always enabled if available
                cellular: true, // Reduce on limited data
                bluetooth: true // Reduce scan intensity
            },
            motionDetection: true,
            backgroundOptimization: true,
            ...config
        };
        
        this.deviceState = {
            batteryLevel: 0.8,  // Default to 80% for testing
            isCharging: false,
            networkType: 'wifi',
            isBackground: false,
            motionState: 'stationary',
            thermalState: 'normal',
            dataUsage: 0
        };
        
        this.adaptiveSettings = {
            currentScanInterval: this.config.scanIntervals.high,
            enabledServices: new Set(['wifi', 'bluetooth', 'gps', 'ultrasonic']),
            maxConcurrentScans: 3,
            cacheTimeout: 60000
        };
        
        this.cache = new Map();
        this.scanQueue = [];
        this.isScanning = false;
        
        this.initializeMobileOptimization();
    }

    async initializeMobileOptimization() {
        // Initialize device monitoring
        await this.startDeviceMonitoring();
        
        // Set up adaptive scanning
        this.startAdaptiveScanning();
        
        // Initialize motion detection if available
        if (this.config.motionDetection) {
            await this.initializeMotionDetection();
        }
        
        // Set up background optimization
        if (this.config.backgroundOptimization) {
            this.initializeBackgroundOptimization();
        }
    }

    async startDeviceMonitoring() {
        // Battery monitoring
        if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                this.updateBatteryState(battery);
                
                battery.addEventListener('levelchange', () => this.updateBatteryState(battery));
                battery.addEventListener('chargingchange', () => this.updateBatteryState(battery));
            } catch (error) {
                console.warn('Battery API not available:', error);
                this.simulateBatteryState(); // Fallback for development
            }
        } else {
            this.simulateBatteryState();
        }
        
        // Network monitoring
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
            const connection = navigator.connection;
            this.updateNetworkState(connection);
            
            connection.addEventListener('change', () => this.updateNetworkState(connection));
        }
        
        // Thermal state monitoring (iOS specific)
        if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
            this.monitorThermalState();
        }
    }

    updateBatteryState(battery) {
        const previousLevel = this.deviceState.batteryLevel;
        
        this.deviceState.batteryLevel = battery.level;
        this.deviceState.isCharging = battery.charging;
        
        // Adapt settings based on battery level
        if (previousLevel !== battery.level) {
            this.adaptToBatteryLevel();
        }
        
        this.emit('batteryStateChanged', {
            level: battery.level,
            isCharging: battery.charging,
            adaptiveSettings: this.adaptiveSettings
        });
    }

    simulateBatteryState() {
        // For development/testing when battery API not available
        this.deviceState.batteryLevel = 0.8;
        this.deviceState.isCharging = false;
        this.adaptToBatteryLevel();
    }

    adaptToBatteryLevel() {
        const level = this.deviceState.batteryLevel;
        let mode = 'high';
        
        if (level <= this.config.batteryThresholds.critical) {
            mode = 'critical';
        } else if (level <= this.config.batteryThresholds.low) {
            mode = 'low';
        } else if (level <= this.config.batteryThresholds.medium) {
            mode = 'medium';
        }
        
        // Update scan interval
        this.adaptiveSettings.currentScanInterval = this.config.scanIntervals[mode];
        
        // Adjust enabled services
        switch (mode) {
            case 'critical':
                this.adaptiveSettings.enabledServices = new Set(['wifi']); // Only WiFi
                this.adaptiveSettings.maxConcurrentScans = 1;
                break;
            case 'low':
                this.adaptiveSettings.enabledServices = new Set(['wifi', 'bluetooth']);
                this.adaptiveSettings.maxConcurrentScans = 2;
                break;
            case 'medium':
                this.adaptiveSettings.enabledServices = new Set(['wifi', 'bluetooth', 'gps']);
                this.adaptiveSettings.maxConcurrentScans = 2;
                break;
            case 'high':
            default:
                this.adaptiveSettings.enabledServices = new Set(['wifi', 'bluetooth', 'gps', 'ultrasonic']);
                this.adaptiveSettings.maxConcurrentScans = 3;
                break;
        }
        
        this.emit('adaptiveSettingsChanged', {
            batteryMode: mode,
            settings: this.adaptiveSettings
        });
    }

    updateNetworkState(connection) {
        this.deviceState.networkType = connection.effectiveType || 'unknown';
        
        // Adapt to network conditions
        if (connection.effectiveType === '2g' || connection.saveData) {
            // Reduce network-intensive operations
            this.adaptiveSettings.cacheTimeout = 300000; // 5 minutes
        } else {
            this.adaptiveSettings.cacheTimeout = 60000; // 1 minute
        }
        
        this.emit('networkStateChanged', {
            type: this.deviceState.networkType,
            adaptiveSettings: this.adaptiveSettings
        });
    }

    async initializeMotionDetection() {
        if (typeof window === 'undefined' || !window.DeviceMotionEvent) {
            return;
        }
        
        let lastMotionTime = Date.now();
        let motionThreshold = 2; // m/s²
        
        window.addEventListener('devicemotion', (event) => {
            const acceleration = event.acceleration;
            if (!acceleration) return;
            
            const totalAcceleration = Math.sqrt(
                acceleration.x ** 2 + 
                acceleration.y ** 2 + 
                acceleration.z ** 2
            );
            
            if (totalAcceleration > motionThreshold) {
                lastMotionTime = Date.now();
                this.deviceState.motionState = 'moving';
            } else if (Date.now() - lastMotionTime > 30000) { // 30 seconds
                this.deviceState.motionState = 'stationary';
            }
            
            this.adaptToMotionState();
        });
    }

    adaptToMotionState() {
        const { motionState } = this.deviceState;
        const currentInterval = this.adaptiveSettings.currentScanInterval;
        
        if (motionState === 'stationary') {
            // Increase scan interval when stationary
            this.adaptiveSettings.currentScanInterval = Math.min(currentInterval * 2, 120000);
        } else if (motionState === 'moving') {
            // Decrease scan interval when moving
            this.adaptiveSettings.currentScanInterval = Math.max(currentInterval / 2, 3000);
        }
        
        this.emit('motionStateChanged', {
            motionState,
            adaptiveSettings: this.adaptiveSettings
        });
    }

    initializeBackgroundOptimization() {
        // Detect when app goes to background
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                this.deviceState.isBackground = document.hidden;
                this.adaptToBackgroundState();
            });
        }
        
        // Listen for page lifecycle events
        if (typeof window !== 'undefined' && 'onpagehide' in window) {
            window.addEventListener('pagehide', () => {
                this.deviceState.isBackground = true;
                this.adaptToBackgroundState();
            });
            
            window.addEventListener('pageshow', () => {
                this.deviceState.isBackground = false;
                this.adaptToBackgroundState();
            });
        }
    }

    adaptToBackgroundState() {
        if (this.deviceState.isBackground) {
            // Increase scan interval and reduce concurrent scans in background
            this.adaptiveSettings.currentScanInterval *= 2;
            this.adaptiveSettings.maxConcurrentScans = 1;
        } else {
            // Restore normal settings in foreground
            this.adaptToBatteryLevel(); // Reset based on current battery level
        }
        
        this.emit('backgroundStateChanged', {
            isBackground: this.deviceState.isBackground,
            adaptiveSettings: this.adaptiveSettings
        });
    }

    monitorThermalState() {
        // Simulate thermal monitoring (iOS provides this natively)
        let checkInterval = setInterval(() => {
            // In real implementation, this would check actual thermal state
            const simulatedThermal = Math.random() < 0.1 ? 'warm' : 'normal';
            
            if (simulatedThermal !== this.deviceState.thermalState) {
                this.deviceState.thermalState = simulatedThermal;
                this.adaptToThermalState();
            }
        }, 30000);
    }

    adaptToThermalState() {
        if (this.deviceState.thermalState === 'warm' || this.deviceState.thermalState === 'hot') {
            // Reduce intensive operations
            this.adaptiveSettings.currentScanInterval *= 2;
            this.adaptiveSettings.enabledServices.delete('ultrasonic');
            this.adaptiveSettings.maxConcurrentScans = 1;
        }
        
        this.emit('thermalStateChanged', {
            thermalState: this.deviceState.thermalState,
            adaptiveSettings: this.adaptiveSettings
        });
    }

    startAdaptiveScanning() {
        const scanLoop = () => {
            if (!this.isScanning && this.scanQueue.length > 0) {
                this.processNextScan();
            }
            
            setTimeout(scanLoop, this.adaptiveSettings.currentScanInterval);
        };
        
        scanLoop();
    }

    async addScanRequest(scanType, priority = 'normal') {
        // Check if service is enabled
        if (!this.adaptiveSettings.enabledServices.has(scanType)) {
            throw new Error(`${scanType} scanning disabled due to power optimization`);
        }
        
        // Check cache first
        const cacheKey = `${scanType}-${Date.now() - (Date.now() % this.adaptiveSettings.cacheTimeout)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const scanRequest = {
            id: crypto.randomUUID(),
            type: scanType,
            priority: priority,
            timestamp: Date.now(),
            resolve: null,
            reject: null
        };
        
        const promise = new Promise((resolve, reject) => {
            scanRequest.resolve = resolve;
            scanRequest.reject = reject;
        });
        
        // Insert based on priority
        if (priority === 'high') {
            this.scanQueue.unshift(scanRequest);
        } else {
            this.scanQueue.push(scanRequest);
        }
        
        return promise;
    }

    async processNextScan() {
        if (this.scanQueue.length === 0 || this.isScanning) {
            return;
        }
        
        this.isScanning = true;
        const scanRequest = this.scanQueue.shift();
        
        try {
            const result = await this.executeScan(scanRequest);
            
            // Cache result
            const cacheKey = `${scanRequest.type}-${Date.now() - (Date.now() % this.adaptiveSettings.cacheTimeout)}`;
            this.cache.set(cacheKey, result);
            
            // Clean old cache entries
            this.cleanCache();
            
            scanRequest.resolve(result);
            
        } catch (error) {
            scanRequest.reject(error);
        } finally {
            this.isScanning = false;
        }
    }

    async executeScan(scanRequest) {
        // Implement actual scanning based on type
        switch (scanRequest.type) {
            case 'wifi':
                return this.executeWiFiScan();
            case 'bluetooth':
                return this.executeBluetoothScan();
            case 'gps':
                return this.executeGPSScan();
            case 'ultrasonic':
                return this.executeUltrasonicScan();
            default:
                throw new Error(`Unknown scan type: ${scanRequest.type}`);
        }
    }

    async executeWiFiScan() {
        // Lightweight WiFi scan for mobile
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
            // Use platform-specific commands
            let command;
            if (process.platform === 'android') {
                command = 'dumpsys wifi | grep "SSID"';
            } else if (process.platform === 'ios') {
                command = 'system_profiler SPAirPortDataType';
            } else {
                command = 'netsh wlan show interfaces';
            }
            
            const { stdout } = await execAsync(command);
            return this.parseWiFiResults(stdout);
        } catch (error) {
            console.error('Mobile WiFi scan error:', error);
            return { networks: [], error: error.message };
        }
    }

    async executeBluetoothScan() {
        // Lightweight Bluetooth scan
        try {
            // Use platform-specific Bluetooth scanning
            const devices = await this.scanBluetoothMobile();
            return { devices, timestamp: Date.now() };
        } catch (error) {
            console.error('Mobile Bluetooth scan error:', error);
            return { devices: [], error: error.message };
        }
    }

    async executeGPSScan() {
        // Battery-optimized GPS reading
        return new Promise((resolve) => {
            if (navigator && navigator.geolocation) {
                const options = {
                    enableHighAccuracy: this.deviceState.batteryLevel > 0.5,
                    timeout: this.deviceState.batteryLevel > 0.3 ? 10000 : 5000,
                    maximumAge: this.adaptiveSettings.cacheTimeout
                };
                
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    }),
                    (error) => resolve({ error: error.message }),
                    options
                );
            } else {
                resolve({ error: 'GPS not available' });
            }
        });
    }

    async executeUltrasonicScan() {
        // Reduced intensity ultrasonic scan for mobile
        if (this.deviceState.thermalState !== 'normal') {
            throw new Error('Ultrasonic scanning disabled due to thermal constraints');
        }
        
        // Implement lightweight ultrasonic detection
        return { detected: false, reason: 'Mobile optimization - reduced intensity' };
    }

    // Utility methods
    parseWiFiResults(stdout) {
        // Parse platform-specific WiFi output
        const networks = [];
        // Implementation depends on platform
        return { networks, timestamp: Date.now() };
    }

    async scanBluetoothMobile() {
        // Platform-specific mobile Bluetooth scanning
        return [];
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (value.timestamp && now - value.timestamp > this.adaptiveSettings.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    getOptimizationStatus() {
        return {
            deviceState: this.deviceState,
            adaptiveSettings: this.adaptiveSettings,
            cacheSize: this.cache.size,
            queueLength: this.scanQueue.length,
            isScanning: this.isScanning
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.adaptToBatteryLevel(); // Reapply optimizations
    }

    cleanup() {
        this.removeAllListeners();
        this.cache.clear();
        this.scanQueue = [];
    }
}
