/**
 * Test file for Mobile Optimization Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MobileOptimizationService from '../../src/backend/channel-service/mobileOptimizationService.mjs';

describe('MobileOptimizationService', () => {
    let service;
    let clock;    beforeEach(() => {
        service = new MobileOptimizationService({
            batteryThresholds: {
                high: 0.8,
                medium: 0.5,
                low: 0.2,
                critical: 0.1
            },
            scanIntervals: {
                high: 3000,
                medium: 10000,
                low: 30000,
                critical: 120000
            }
        });
        clock = vi.useFakeTimers();
    });

    afterEach(() => {
        if (service) {
            service.cleanup();
        }
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default configuration', () => {
            expect(service.config.batteryThresholds).to.be.an('object');
            expect(typeof service.config.scanIntervals).toBe('object');
            expect(service.deviceState).to.be.an('object');
            expect(service.adaptiveSettings).to.be.an('object');
        });        it('should have default device state', () => {
            expect(service.deviceState.batteryLevel).toBe(0.8);
            expect(service.deviceState.isCharging).toBe(false);
            expect(service.deviceState.networkType).toBe('wifi');
            expect(service.deviceState.isBackground).toBe(false);
        });

        it('should have default adaptive settings', () => {
            expect(service.adaptiveSettings.enabledServices).to.be.a('set');
            expect(service.adaptiveSettings.currentScanInterval).to.be.a('number');
            expect(service.adaptiveSettings.maxConcurrentScans).to.be.a('number');
        });
    });

    describe('Battery State Management', () => {
        it('should adapt to high battery level', () => {
            service.deviceState.batteryLevel = 0.9;
            service.adaptToBatteryLevel();

            expect(service.adaptiveSettings.currentScanInterval).toBe(service.config.scanIntervals.high);
            expect(service.adaptiveSettings.enabledServices.has('wifi')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('bluetooth')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('gps')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('ultrasonic')).to.be.true;
        });

        it('should adapt to medium battery level', () => {
            service.deviceState.batteryLevel = 0.4; // 40% - in medium range (20-50%)
            service.adaptToBatteryLevel();

            expect(service.adaptiveSettings.currentScanInterval).toBe(service.config.scanIntervals.medium);
            expect(service.adaptiveSettings.enabledServices.has('wifi')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('bluetooth')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('gps')).to.be.true;
            expect(service.adaptiveSettings.maxConcurrentScans).toBe(2);
        });

        it('should adapt to low battery level', () => {
            service.deviceState.batteryLevel = 0.15; // 15% - in low range (below 20%)
            service.adaptToBatteryLevel();

            expect(service.adaptiveSettings.currentScanInterval).toBe(service.config.scanIntervals.low);
            expect(service.adaptiveSettings.enabledServices.has('wifi')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('bluetooth')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('gps')).to.be.false;
            expect(service.adaptiveSettings.maxConcurrentScans).toBe(2);
        });

        it('should adapt to critical battery level', () => {
            service.deviceState.batteryLevel = 0.05;
            service.adaptToBatteryLevel();

            expect(service.adaptiveSettings.currentScanInterval).toBe(service.config.scanIntervals.critical);
            expect(service.adaptiveSettings.enabledServices.has('wifi')).to.be.true;
            expect(service.adaptiveSettings.enabledServices.has('bluetooth')).to.be.false;
            expect(service.adaptiveSettings.enabledServices.has('gps')).to.be.false;
            expect(service.adaptiveSettings.enabledServices.has('ultrasonic')).to.be.false;
            expect(service.adaptiveSettings.maxConcurrentScans).toBe(1);
        });        it('should emit adaptiveSettingsChanged event', () => {
            return new Promise((resolve) => {
                service.once('adaptiveSettingsChanged', (data) => {
                    expect(typeof data.batteryMode).toBe('string');
                    expect(typeof data.settings).toBe('object');
                    resolve();
                });

                service.deviceState.batteryLevel = 0.3;
                service.adaptToBatteryLevel();
            });
        });
    });

    describe('Network State Management', () => {
        it('should adapt to slow network connections', () => {
            const mockConnection = {
                effectiveType: '2g',
                saveData: true
            };

            service.updateNetworkState(mockConnection);

            expect(service.deviceState.networkType).toBe('2g');
            expect(service.adaptiveSettings.cacheTimeout).toBe(300000); // 5 minutes
        });

        it('should adapt to fast network connections', () => {
            const mockConnection = {
                effectiveType: '4g',
                saveData: false
            };

            service.updateNetworkState(mockConnection);

            expect(service.deviceState.networkType).toBe('4g');
            expect(service.adaptiveSettings.cacheTimeout).toBe(60000); // 1 minute
        });        it('should emit networkStateChanged event', async () => {
            const eventPromise = new Promise((resolve) => {
                service.once('networkStateChanged', (data) => {
                    expect(data.type).toBe('3g');
                    expect(data.adaptiveSettings).toBeTypeOf('object');
                    resolve();
                });
            });

            service.updateNetworkState({ effectiveType: '3g' });
            await eventPromise;
        });
    });

    describe('Motion Detection', () => {
        it('should adapt to stationary state', () => {
            service.deviceState.motionState = 'stationary';
            const originalInterval = service.adaptiveSettings.currentScanInterval;
            
            service.adaptToMotionState();

            expect(service.adaptiveSettings.currentScanInterval).to.be.greaterThan(originalInterval);
        });

        it('should adapt to moving state', () => {
            service.deviceState.motionState = 'moving';
            service.adaptiveSettings.currentScanInterval = 10000; // 10 seconds
            
            service.adaptToMotionState();

            expect(service.adaptiveSettings.currentScanInterval).to.be.lessThan(10000);
        });        it('should emit motionStateChanged event', async () => {
            const eventPromise = new Promise((resolve) => {
                service.once('motionStateChanged', (data) => {
                    expect(data.motionState).toBe('moving');
                    expect(data.adaptiveSettings).toBeTypeOf('object');
                    resolve();
                });
            });

            service.deviceState.motionState = 'moving';
            service.adaptToMotionState();
            await eventPromise;
        });
    });

    describe('Background State Management', () => {
        it('should adapt when app goes to background', () => {
            const originalInterval = service.adaptiveSettings.currentScanInterval;
            const originalScans = service.adaptiveSettings.maxConcurrentScans;
            
            service.deviceState.isBackground = true;
            service.adaptToBackgroundState();

            expect(service.adaptiveSettings.currentScanInterval).to.be.greaterThan(originalInterval);
            expect(service.adaptiveSettings.maxConcurrentScans).toBe(1);
        });

        it('should restore when app comes to foreground', () => {
            // First go to background
            service.deviceState.isBackground = true;
            service.adaptToBackgroundState();

            // Then return to foreground
            service.deviceState.isBackground = false;
            service.adaptToBackgroundState();

            // Should trigger battery level adaptation (restoration)
            expect(service.adaptiveSettings.maxConcurrentScans).to.be.greaterThan(1);
        });

        it('should emit backgroundStateChanged event', async () => {
            const eventPromise = new Promise((resolve) => {
                service.once('backgroundStateChanged', (data) => {
                    expect(data.isBackground).to.be.true;
                    expect(data.adaptiveSettings).to.be.an('object');
                    resolve();
                });
            });

            service.deviceState.isBackground = true;
            service.adaptToBackgroundState();
            
            await eventPromise;
        });
    });

    describe('Thermal State Management', () => {
        it('should adapt to warm thermal state', () => {
            const originalInterval = service.adaptiveSettings.currentScanInterval;
            
            service.deviceState.thermalState = 'warm';
            service.adaptToThermalState();

            expect(service.adaptiveSettings.currentScanInterval).to.be.greaterThan(originalInterval);
            expect(service.adaptiveSettings.enabledServices.has('ultrasonic')).to.be.false;
            expect(service.adaptiveSettings.maxConcurrentScans).toBe(1);
        });

        it('should emit thermalStateChanged event', async () => {
            const eventPromise = new Promise((resolve) => {
                service.once('thermalStateChanged', (data) => {
                    expect(data.thermalState).toBe('hot');
                    expect(data.adaptiveSettings).to.be.an('object');
                    resolve();
                });
            });

            service.deviceState.thermalState = 'hot';
            service.adaptToThermalState();
            
            await eventPromise;
        });
    });

    describe('Scan Request Management', () => {
        it('should add scan request to queue', async () => {
            const promise = service.addScanRequest('wifi', 'normal');
            
            expect(service.scanQueue).to.have.length(1);
            expect(service.scanQueue[0].type).toBe('wifi');
            expect(service.scanQueue[0].priority).toBe('normal');
            expect(promise).to.be.a('promise');
        });

        it('should prioritize high priority requests', async () => {
            // Add normal priority request first
            service.addScanRequest('wifi', 'normal');
            
            // Add high priority request
            service.addScanRequest('bluetooth', 'high');

            expect(service.scanQueue).to.have.length(2);
            expect(service.scanQueue[0].type).toBe('bluetooth'); // High priority first
            expect(service.scanQueue[1].type).toBe('wifi');
        });

        it('should reject disabled services', async () => {
            // Disable wifi service
            service.adaptiveSettings.enabledServices.delete('wifi');

            try {
                await service.addScanRequest('wifi', 'normal');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('wifi scanning disabled');
            }
        });

        it('should return cached results when available', async () => {
            const mockResult = { networks: ['test'], timestamp: Date.now() };
            const cacheKey = `wifi-${Date.now() - (Date.now() % service.adaptiveSettings.cacheTimeout)}`;
            
            service.cache.set(cacheKey, mockResult);

            const result = await service.addScanRequest('wifi', 'normal');
            expect(result).toBe(mockResult);
            expect(service.scanQueue).to.have.length(0); // No queue item added
        });
    });

    describe('Scan Execution', () => {        beforeEach(() => {
            // Mock child_process for scan operations
            vi.spyOn(service, 'executeWiFiScan').mockResolvedValue({
                networks: ['TestNetwork'],
                timestamp: Date.now()
            });
            vi.spyOn(service, 'executeBluetoothScan').mockResolvedValue({
                devices: ['TestDevice'],
                timestamp: Date.now()
            });
            vi.spyOn(service, 'executeGPSScan').mockResolvedValue({
                latitude: 40.7128,
                longitude: -74.0060,
                timestamp: Date.now()
            });
            vi.spyOn(service, 'executeUltrasonicScan').mockResolvedValue({
                detected: false,
                reason: 'Mobile optimization'
            });
        });

        it('should execute WiFi scan', async () => {
            const scanRequest = { type: 'wifi', id: 'test-1' };
            const result = await service.executeScan(scanRequest);

            expect(result.networks).to.include('TestNetwork');
            expect(result.timestamp).to.be.a('number');
        });

        it('should execute Bluetooth scan', async () => {
            const scanRequest = { type: 'bluetooth', id: 'test-2' };
            const result = await service.executeScan(scanRequest);

            expect(result.devices).to.include('TestDevice');
            expect(result.timestamp).to.be.a('number');
        });

        it('should execute GPS scan', async () => {
            const scanRequest = { type: 'gps', id: 'test-3' };
            const result = await service.executeScan(scanRequest);

            expect(result.latitude).toBe(40.7128);
            expect(result.longitude).toBe(-74.0060);
        });

        it('should execute Ultrasonic scan', async () => {
            const scanRequest = { type: 'ultrasonic', id: 'test-4' };
            const result = await service.executeScan(scanRequest);

            expect(result.detected).to.be.false;
            expect(result.reason).to.include('Mobile optimization');
        });

        it('should throw error for unknown scan type', async () => {
            const scanRequest = { type: 'unknown', id: 'test-5' };
            
            try {
                await service.executeScan(scanRequest);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Unknown scan type');
            }
        });
    });

    describe('Cache Management', () => {
        it('should cache scan results', async () => {
            vi.spyOn(service, 'executeScan').mockResolvedValue({
                data: 'test-result',
                timestamp: Date.now()
            });

            // Add a scan request to trigger processing
            const scanPromise = service.addScanRequest('wifi', 'normal');
            
            // Process the scan
            await service.processNextScan();
            
            // Wait for scan to complete
            await scanPromise;

            expect(service.cache.size).to.be.greaterThan(0);
        });

        it('should clean old cache entries', () => {
            // Add old cache entry
            service.cache.set('old-key', {
                data: 'old-data',
                timestamp: Date.now() - (service.adaptiveSettings.cacheTimeout + 1000)
            });

            // Add current cache entry
            service.cache.set('current-key', {
                data: 'current-data',
                timestamp: Date.now()
            });

            service.cleanCache();

            expect(service.cache.has('old-key')).to.be.false;
            expect(service.cache.has('current-key')).to.be.true;
        });
    });

    describe('Status and Configuration', () => {
        it('should return optimization status', () => {
            const status = service.getOptimizationStatus();

            expect(status).to.have.property('deviceState');
            expect(status).to.have.property('adaptiveSettings');
            expect(status).to.have.property('cacheSize');
            expect(status).to.have.property('queueLength');
            expect(status).to.have.property('isScanning');
        });

        it('should update configuration', () => {
            const newConfig = {
                batteryThresholds: {
                    high: 0.9,
                    medium: 0.6
                }
            };

            service.updateConfig(newConfig);

            expect(service.config.batteryThresholds.high).toBe(0.9);
            expect(service.config.batteryThresholds.medium).toBe(0.6);
        });
    });

    describe('GPS Operations', () => {
        it('should handle GPS scan with high accuracy when battery is good', async () => {
            service.deviceState.batteryLevel = 0.8;

            // Mock navigator.geolocation with proper tracking
            const mockGetCurrentPosition = vi.fn().mockImplementation((success, error, options) => {
                success({
                    coords: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        accuracy: 10
                    },
                    timestamp: Date.now()
                });
            });

            global.navigator = {
                geolocation: {
                    getCurrentPosition: mockGetCurrentPosition
                }
            };

            const result = await service.executeGPSScan();

            expect(result.latitude).toBe(40.7128);
            expect(result.longitude).toBe(-74.0060);
            expect(result.accuracy).toBe(10);

            // Verify high accuracy was requested using Vitest mock calls
            const calls = mockGetCurrentPosition.mock.calls;
            expect(calls.length).toBe(1);
            const options = calls[0][2];
            expect(options.enableHighAccuracy).to.be.true;

            delete global.navigator;
        });

        it('should handle GPS scan with low accuracy when battery is low', async () => {
            service.deviceState.batteryLevel = 0.2;

            const mockGetCurrentPosition = vi.fn().mockImplementation((success, error, options) => { 
                success({
                    coords: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        accuracy: 50
                    },
                    timestamp: Date.now()
                });
            });

            global.navigator = {
                geolocation: {
                    getCurrentPosition: mockGetCurrentPosition
                }
            };

            const result = await service.executeGPSScan();

            // Verify low accuracy was requested using Vitest mock calls
            const calls = mockGetCurrentPosition.mock.calls;
            expect(calls.length).toBe(1);
            const options = calls[0][2];
            expect(options.enableHighAccuracy).to.be.false;
            expect(options.timeout).toBe(5000); // Shorter timeout for low battery

            delete global.navigator;
        });

        it('should handle GPS errors gracefully', async () => {            global.navigator = {
                geolocation: {
                    getCurrentPosition: vi.fn().mockImplementation((success, error) => { 
                        error({
                            message: 'GPS not available'
                        });
                    })
                }
            };

            const result = await service.executeGPSScan();

            expect(result.error).toBe('GPS not available');

            delete global.navigator;
        });
    });

    describe('Cleanup and Memory Management', () => {
        it('should cleanup properly', () => {
            service.scanQueue.push({ id: 'test' });
            service.cache.set('test', 'data');

            service.cleanup();

            expect(service.scanQueue).to.have.length(0);
            expect(service.cache.size).toBe(0);
            expect(service.listenerCount()).toBe(0);
        });

        it('should not process scans when already scanning', () => {
            service.isScanning = true;
            service.scanQueue.push({ id: 'test' });

            // This should not process the queue
            service.processNextScan();

            expect(service.scanQueue).to.have.length(1); // Queue unchanged
        });
    });
});






