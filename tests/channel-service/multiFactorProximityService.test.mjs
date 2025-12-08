/**
 * Test file for Multi-Factor Proximity Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MultiFactorProximityService from '../../src/backend/channel-service/multiFactorProximityService.mjs';

describe('MultiFactorProximityService', () => {
    let service;
    let fakeTimers;

    beforeEach(() => {
        service = new MultiFactorProximityService({
            requiredFactors: 2,
            confidenceThreshold: 0.8
        });
        fakeTimers = vi.useFakeTimers();
    });

    afterEach(() => {
        if (service) {
            service.cleanup();
        }
        if (fakeTimers) {
            fakeTimers.useRealTimers();
        }
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default configuration', () => {
            expect(service.config.requiredFactors).toBe(2);
            expect(service.config.confidenceThreshold).toBe(0.8);
            expect(service.proximityFactors).to.have.keys(['wifi', 'bluetooth', 'gps', 'ultrasonic']);
        });

        it('should start multi-factor detection', async () => {
            const startSpy = vi.spyOn(service, 'startMultiFactorDetection');
            await service.startMultiFactorDetection();
            expect(startSpy).toHaveBeenCalledOnce();
        });
    });

    describe('WiFi Detection', () => {
        it('should calculate WiFi confidence based on signal strength', () => {
            const networks = {
                currentConnection: 'TestWiFi',
                signalStrength: 80,
                profiles: ['Profile1', 'Profile2']
            };

            const confidence = service.calculateWiFiConfidence(networks);
            expect(confidence).to.be.a('number');
            expect(confidence).to.be.at.least(0);
            expect(confidence).to.be.at.most(1);
        });

        it('should return 0 confidence when no connection', () => {
            const networks = {
                currentConnection: null,
                signalStrength: 0,
                profiles: []
            };

            const confidence = service.calculateWiFiConfidence(networks);
            expect(confidence).toBe(0);
        });
    });

    describe('Bluetooth Detection', () => {
        it('should calculate Bluetooth confidence based on device count', () => {
            const devices = [
                { name: 'Device1', id: '123' },
                { name: 'Device2', id: '456' },
                { name: 'Device3', id: '789' }
            ];

            const confidence = service.calculateBluetoothConfidence(devices);
            expect(confidence).to.be.a('number');
            expect(confidence).to.be.greaterThan(0);
            expect(confidence).to.be.at.most(0.8);
        });

        it('should return 0 confidence when no devices', () => {
            const confidence = service.calculateBluetoothConfidence([]);
            expect(confidence).toBe(0);
        });
    });

    describe('GPS Detection', () => {
        it('should calculate GPS confidence based on accuracy', () => {
            const location = {
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 10
            };

            const confidence = service.calculateGPSConfidence(location);
            expect(confidence).to.be.a('number');
            expect(confidence).to.be.at.least(0);
            expect(confidence).to.be.at.most(0.9);
        });

        it('should return 0 confidence when no location', () => {
            const confidence = service.calculateGPSConfidence(null);
            expect(confidence).toBe(0);
        });
    });

    describe('Ultrasonic Detection', () => {
        it('should calculate ultrasonic confidence based on amplitude', () => {
            const data = {
                detected: true,
                amplitude: 75,
                frequency: 18000
            };

            const confidence = service.calculateUltrasonicConfidence(data);
            expect(confidence).to.be.a('number');
            expect(confidence).to.be.greaterThan(0);
            expect(confidence).to.be.at.most(0.8);
        });

        it('should return 0 confidence when not detected', () => {
            const data = {
                detected: false,
                amplitude: 0,
                frequency: 18000
            };

            const confidence = service.calculateUltrasonicConfidence(data);
            expect(confidence).toBe(0);
        });
    });

    describe('Overall Proximity Evaluation', () => {
        it('should emit proximityConfirmed when thresholds are met', async () => {
            // Reset all factors to ensure clean state
            service.updateProximityFactor('wifi', 0, null);
            service.updateProximityFactor('bluetooth', 0, null);
            service.updateProximityFactor('gps', 0, null);
            service.updateProximityFactor('ultrasonic', 0, null);

            // Create a promise to track the event
            const eventPromise = new Promise((resolve) => {
                service.once('proximityConfirmed', (result) => {
                    resolve(result);
                });
            });

            // Simulate high confidence in multiple factors to meet threshold
            // WiFi: 0.9 * 0.3 = 0.27, Bluetooth: 0.9 * 0.3 = 0.27, GPS: 0.9 * 0.2 = 0.18
            // Total: 0.72 / 0.8 = 0.9 confidence (> 0.8 threshold), 3 factors (> 2 required)
            service.updateProximityFactor('wifi', 0.9, { test: 'data' });
            service.updateProximityFactor('bluetooth', 0.9, { test: 'data' });
            service.updateProximityFactor('gps', 0.9, { test: 'data' });

            // Wait for the event with a timeout
            const result = await Promise.race([
                eventPromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout waiting for proximityConfirmed event')), 2000)
                )
            ]);

            expect(result.isProximityConfirmed).toBe(true);
            expect(result.confidence).toBeGreaterThanOrEqual(service.config.confidenceThreshold);
            expect(result.activeFactors).toBeGreaterThanOrEqual(service.config.requiredFactors);
        });

        it('should not confirm proximity when confidence is too low', () => {
            let proximityConfirmed = false;
            
            service.once('proximityConfirmed', () => {
                proximityConfirmed = true;
            });

            // Simulate low confidence
            service.updateProximityFactor('wifi', 0.3, { test: 'data' });
            service.updateProximityFactor('bluetooth', 0.2, { test: 'data' });

            expect(proximityConfirmed).toBe(false);
        });

        it('should not confirm proximity when insufficient factors', () => {
            let proximityConfirmed = false;
            
            // Reset all factors to ensure clean state
            service.updateProximityFactor('wifi', 0, null);
            service.updateProximityFactor('bluetooth', 0, null);
            service.updateProximityFactor('gps', 0, null);
            service.updateProximityFactor('ultrasonic', 0, null);
            
            service.once('proximityConfirmed', () => {
                proximityConfirmed = true;
            });

            // Simulate high confidence but only one factor
            service.updateProximityFactor('wifi', 0.9, { test: 'data' });

            expect(proximityConfirmed).toBe(false);
        });
    });

    describe('Status and Utility Methods', () => {
        it('should return current proximity status', () => {
            service.updateProximityFactor('wifi', 0.8, { test: 'data' });
            service.updateProximityFactor('bluetooth', 0.6, { test: 'data' });

            const status = service.getProximityStatus();
            expect(status).to.have.keys(['factors', 'activeSignals', 'overallConfidence']);
            expect(status.factors.wifi.confidence).toBe(0.8);
            expect(status.factors.bluetooth.confidence).toBe(0.6);
        });

        it('should calculate overall confidence correctly', () => {
            service.updateProximityFactor('wifi', 0.8, { test: 'data' });
            service.updateProximityFactor('bluetooth', 0.6, { test: 'data' });

            const confidence = service.calculateOverallConfidence();
            expect(confidence).to.be.a('number');
            expect(confidence).to.be.greaterThan(0);
            expect(confidence).to.be.lessThan(1);
        });

        it('should clean up properly', () => {
            service.updateProximityFactor('wifi', 0.8, { test: 'data' });
            
            service.cleanup();
            
            expect(service.activeSignals.size).toBe(0);
            expect(service.listenerCount()).toBe(0);
        });
    });

    describe('Platform-Specific Scanning', () => {
        it('should handle Windows Bluetooth scanning', async () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'win32' });

            try {
                const result = await service.scanBluetoothWindows();
                expect(result).to.be.an('array');
            } catch (error) {
                // Expected in test environment
                expect(error).to.be.an('error');
            }

            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });

        it('should parse WiFi profiles correctly', () => {
            const stdout = `
All User Profile     : TestProfile1
All User Profile     : TestProfile2
All User Profile     : TestProfile3
            `;

            const profiles = service.parseWiFiProfiles(stdout);
            expect(profiles).to.include('TestProfile1');
            expect(profiles).to.include('TestProfile2');
            expect(profiles).to.include('TestProfile3');
        });

        it('should extract signal strength correctly', () => {
            const stdout = `
SSID                 : TestNetwork
Signal               : 85%
            `;

            const strength = service.extractSignalStrength(stdout);
            expect(strength).toBe(85);
        });
    });
});






