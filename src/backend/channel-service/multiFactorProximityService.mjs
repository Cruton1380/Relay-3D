/**
 * Multi-factor Proximity Service
 * Combines multiple proximity signals for enhanced security and reliability
 */

import EventEmitter from 'events';

export class MultiFactorProximityService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            requiredFactors: config.requiredFactors || 2,
            confidenceThreshold: config.confidenceThreshold || 0.8,
            signalTimeout: config.signalTimeout || 30000, // 30 seconds
            ultrasonicFrequency: config.ultrasonicFrequency || 18000, // 18kHz
            ...config
        };
        
        this.activeSignals = new Map();
        this.proximityFactors = {
            wifi: { weight: 0.3, confidence: 0 },
            bluetooth: { weight: 0.3, confidence: 0 },
            gps: { weight: 0.2, confidence: 0 },
            ultrasonic: { weight: 0.2, confidence: 0 }
        };
        
        this.startMultiFactorDetection();
    }

    async startMultiFactorDetection() {
        // Start all proximity detection methods
        await Promise.all([
            this.startWiFiDetection(),
            this.startBluetoothDetection(),
            this.startGPSDetection(),
            this.startUltrasonicDetection()
        ]);
    }

    async startWiFiDetection() {
        try {
            // Enhanced WiFi scanning with signal strength analysis
            const networks = await this.scanWiFiNetworks();
            const confidence = this.calculateWiFiConfidence(networks);
            this.updateProximityFactor('wifi', confidence, networks);
        } catch (error) {
            console.error('WiFi detection error:', error);
            this.updateProximityFactor('wifi', 0, null);
        }
        
        // Continue scanning
        setTimeout(() => this.startWiFiDetection(), 5000);
    }

    async scanWiFiNetworks() {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
            const { stdout } = await execAsync('netsh wlan show profiles');
            const { stdout: details } = await execAsync('netsh wlan show interfaces');
            
            return {
                profiles: this.parseWiFiProfiles(stdout),
                currentConnection: this.parseCurrentConnection(details),
                signalStrength: this.extractSignalStrength(details)
            };
        } catch (error) {
            console.error('WiFi scan error:', error);
            return { profiles: [], currentConnection: null, signalStrength: 0 };
        }
    }

    calculateWiFiConfidence(networks) {
        if (!networks.currentConnection) return 0;
        
        // Higher confidence for stronger signals and known networks
        const signalStrength = networks.signalStrength / 100;
        const networkKnown = networks.profiles.length > 0 ? 0.3 : 0;
        
        return Math.min(signalStrength + networkKnown, 1.0);
    }

    async startBluetoothDetection() {
        try {
            const devices = await this.scanBluetoothDevices();
            const confidence = this.calculateBluetoothConfidence(devices);
            this.updateProximityFactor('bluetooth', confidence, devices);
        } catch (error) {
            console.error('Bluetooth detection error:', error);
            this.updateProximityFactor('bluetooth', 0, null);
        }
        
        setTimeout(() => this.startBluetoothDetection(), 7000);
    }

    async scanBluetoothDevices() {
        // Platform-specific Bluetooth scanning
        if (process.platform === 'win32') {
            return this.scanBluetoothWindows();
        } else if (process.platform === 'darwin') {
            return this.scanBluetoothMacOS();
        } else {
            return this.scanBluetoothLinux();
        }
    }

    async scanBluetoothWindows() {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
            // Use PowerShell to scan for Bluetooth devices
            const command = `
                Get-PnpDevice -Class Bluetooth | 
                Where-Object {$_.Status -eq "OK"} | 
                Select-Object FriendlyName, InstanceId | 
                ConvertTo-Json
            `;
            
            const { stdout } = await execAsync(`powershell -Command "${command}"`);
            return JSON.parse(stdout || '[]');
        } catch (error) {
            console.error('Bluetooth Windows scan error:', error);
            return [];
        }
    }

    async scanBluetoothMacOS() {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
            const { stdout } = await execAsync('system_profiler SPBluetoothDataType -json');
            const data = JSON.parse(stdout);
            return data.SPBluetoothDataType?.[0]?.device_title || [];
        } catch (error) {
            console.error('Bluetooth macOS scan error:', error);
            return [];
        }
    }

    async scanBluetoothLinux() {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
            const { stdout } = await execAsync('bluetoothctl devices');
            return stdout.split('\n').filter(line => line.includes('Device'));
        } catch (error) {
            console.error('Bluetooth Linux scan error:', error);
            return [];
        }
    }

    calculateBluetoothConfidence(devices) {
        if (!devices || devices.length === 0) return 0;
        
        // More devices = higher confidence in proximity
        const deviceCount = Math.min(devices.length / 5, 1.0);
        return deviceCount * 0.8; // Max 80% confidence from Bluetooth alone
    }

    async startGPSDetection() {
        try {
            const location = await this.getCurrentLocation();
            const confidence = this.calculateGPSConfidence(location);
            this.updateProximityFactor('gps', confidence, location);
        } catch (error) {
            console.error('GPS detection error:', error);
            this.updateProximityFactor('gps', 0, null);
        }
        
        setTimeout(() => this.startGPSDetection(), 10000);
    }

    async getCurrentLocation() {
        // Simulate GPS location (in production, use actual GPS API)
        return new Promise((resolve) => {
            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    }),
                    (error) => resolve(null),
                    { timeout: 10000, maximumAge: 60000 }
                );
            } else {
                // Fallback for server-side or when GPS not available
                resolve(null);
            }
        });
    }

    calculateGPSConfidence(location) {
        if (!location) return 0;
        
        // Higher confidence for more accurate GPS readings
        const accuracy = Math.max(0, 1 - (location.accuracy / 100));
        return Math.min(accuracy, 0.9);
    }

    async startUltrasonicDetection() {
        try {
            const ultrasonicData = await this.detectUltrasonicSignals();
            const confidence = this.calculateUltrasonicConfidence(ultrasonicData);
            this.updateProximityFactor('ultrasonic', confidence, ultrasonicData);
        } catch (error) {
            console.error('Ultrasonic detection error:', error);
            this.updateProximityFactor('ultrasonic', 0, null);
        }
        
        setTimeout(() => this.startUltrasonicDetection(), 8000);
    }

    async detectUltrasonicSignals() {
        // Ultrasonic detection using Web Audio API (browser) or audio libraries (Node.js)
        try {
            if (typeof window !== 'undefined' && window.AudioContext) {
                return this.detectUltrasonicBrowser();
            } else {
                return this.detectUltrasonicNode();
            }
        } catch (error) {
            console.error('Ultrasonic detection failed:', error);
            return null;
        }
    }

    async detectUltrasonicBrowser() {
        return new Promise((resolve) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        const source = audioContext.createMediaStreamSource(stream);
                        source.connect(analyser);
                        
                        const bufferLength = analyser.frequencyBinCount;
                        const dataArray = new Uint8Array(bufferLength);
                        
                        analyser.getByteFrequencyData(dataArray);
                        
                        // Check for ultrasonic frequencies
                        const ultrasonicIndex = Math.floor(this.config.ultrasonicFrequency / (audioContext.sampleRate / 2) * bufferLength);
                        const ultrasonicAmplitude = dataArray[ultrasonicIndex];
                        
                        stream.getTracks().forEach(track => track.stop());
                        audioContext.close();
                        
                        resolve({
                            detected: ultrasonicAmplitude > 50,
                            amplitude: ultrasonicAmplitude,
                            frequency: this.config.ultrasonicFrequency
                        });
                    })
                    .catch(() => resolve(null));
            } catch (error) {
                resolve(null);
            }
        });
    }

    async detectUltrasonicNode() {
        // Node.js ultrasonic detection (would require audio libraries)
        // For now, return mock data
        return {
            detected: Math.random() > 0.7,
            amplitude: Math.random() * 100,
            frequency: this.config.ultrasonicFrequency
        };
    }

    calculateUltrasonicConfidence(data) {
        if (!data || !data.detected) return 0;
        
        // Confidence based on signal amplitude
        return Math.min(data.amplitude / 100, 0.8);
    }

    updateProximityFactor(type, confidence, data) {
        this.proximityFactors[type].confidence = confidence;
        this.activeSignals.set(type, {
            confidence,
            data,
            timestamp: Date.now()
        });
        
        this.evaluateOverallProximity();
    }

    evaluateOverallProximity() {
        // Calculate weighted confidence score
        let totalWeight = 0;
        let weightedConfidence = 0;
        let activeFactorCount = 0;
        
        for (const [type, factor] of Object.entries(this.proximityFactors)) {
            if (factor.confidence > 0) {
                weightedConfidence += factor.confidence * factor.weight;
                totalWeight += factor.weight;
                activeFactorCount++;
            }
        }
        
        const overallConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;
        const meetsThreshold = overallConfidence >= this.config.confidenceThreshold;
        const hasRequiredFactors = activeFactorCount >= this.config.requiredFactors;
        
        const proximityResult = {
            confidence: overallConfidence,
            meetsThreshold,
            hasRequiredFactors,
            activeFactors: activeFactorCount,
            factors: { ...this.proximityFactors },
            isProximityConfirmed: meetsThreshold && hasRequiredFactors
        };
        
        this.emit('proximityUpdate', proximityResult);
        
        if (proximityResult.isProximityConfirmed) {
            this.emit('proximityConfirmed', proximityResult);
        }
    }

    // Utility methods
    parseWiFiProfiles(stdout) {
        const profiles = [];
        const lines = stdout.split('\n');
        
        for (const line of lines) {
            if (line.includes('All User Profile')) {
                const match = line.match(/:\s*(.+)/);
                if (match) {
                    profiles.push(match[1].trim());
                }
            }
        }
        
        return profiles;
    }

    parseCurrentConnection(stdout) {
        const lines = stdout.split('\n');
        
        for (const line of lines) {
            if (line.includes('SSID')) {
                const match = line.match(/:\s*(.+)/);
                if (match) {
                    return match[1].trim();
                }
            }
        }
        
        return null;
    }

    extractSignalStrength(stdout) {
        const lines = stdout.split('\n');
        
        for (const line of lines) {
            if (line.includes('Signal')) {
                const match = line.match(/(\d+)%/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }
        
        return 0;
    }

    getProximityStatus() {
        return {
            factors: this.proximityFactors,
            activeSignals: Object.fromEntries(this.activeSignals),
            overallConfidence: this.calculateOverallConfidence()
        };
    }

    calculateOverallConfidence() {
        let totalWeight = 0;
        let weightedConfidence = 0;
        
        for (const factor of Object.values(this.proximityFactors)) {
            if (factor.confidence > 0) {
                weightedConfidence += factor.confidence * factor.weight;
                totalWeight += factor.weight;
            }
        }
        
        return totalWeight > 0 ? weightedConfidence / totalWeight : 0;
    }

    cleanup() {
        this.removeAllListeners();
        this.activeSignals.clear();
    }
}

export default MultiFactorProximityService;
