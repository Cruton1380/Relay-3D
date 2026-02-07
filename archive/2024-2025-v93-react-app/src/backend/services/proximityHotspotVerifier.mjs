/**
 * @fileoverview Proximity Hotspot Verifier - Handles community-rooted physical verification
 */
import logger from '../utils/logging/logger.mjs';
import { trustLevelService, TRUST_ACTIONS } from './trustLevelService.mjs';

const HOTSPOT_TYPES = {
  COMMUNITY_CENTER: 'community_center',
  TRUSTED_USER_DEVICE: 'trusted_user_device',
  ANCHOR_NODE: 'anchor_node'
};

const PROXIMITY_METHODS = {
  BLUETOOTH: 'bluetooth',
  WIFI_AWARE: 'wifi_aware',
  NFC: 'nfc',
  QR_SCAN: 'qr_scan'
};

const VERIFICATION_REQUIREMENTS = {
  BIOMETRIC_PING: 'biometric_ping',
  DEVICE_PRESENCE: 'device_presence',
  TIME_THRESHOLD: 'time_threshold' // Must stay near hotspot for minimum time
};

class ProximityHotspotVerifier {
  constructor() {
    this.activeHotspots = new Map(); // Store active hotspot sessions
    this.hotspotRegistry = new Map(); // Registry of approved hotspots
    this.checkinSessions = new Map(); // Active check-in sessions
  }

  /**
   * Register a new community hotspot
   */
  async registerHotspot(hotspotId, config) {
    try {
      const hotspot = {
        id: hotspotId,
        type: config.type || HOTSPOT_TYPES.COMMUNITY_CENTER,
        ownerId: config.ownerId, // For trusted user devices
        location: config.location, // GPS coordinates
        publicKey: config.publicKey,
        capabilities: config.capabilities || [PROXIMITY_METHODS.BLUETOOTH, PROXIMITY_METHODS.QR_SCAN],
        trustLevel: config.trustLevel || 'standard',
        createdAt: Date.now(),
        lastActive: Date.now(),
        totalCheckins: 0,
        isActive: true
      };

      this.hotspotRegistry.set(hotspotId, hotspot);

      logger.info('Hotspot registered', {
        hotspotId,
        type: hotspot.type,
        ownerId: config.ownerId,
        capabilities: hotspot.capabilities
      });

      return { success: true, hotspot };
    } catch (error) {
      logger.error('Error registering hotspot', { error: error.message, hotspotId });
      throw error;
    }
  }

  /**
   * Initiate a proximity check-in session
   */
  async initiateCheckin(userId, hotspotId, proximityData) {
    try {
      const hotspot = this.hotspotRegistry.get(hotspotId);
      if (!hotspot || !hotspot.isActive) {
        throw new Error('Invalid or inactive hotspot');
      }

      // Verify proximity using available methods
      const proximityVerified = await this.verifyProximity(proximityData, hotspot);
      if (!proximityVerified) {
        throw new Error('Proximity verification failed');
      }

      // Create check-in session
      const sessionId = this.generateSessionId();
      const session = {
        sessionId,
        userId,
        hotspotId,
        startTime: Date.now(),
        status: 'proximity_verified',
        proximityMethod: proximityData.method,
        biometricRequired: true,
        minDwellTime: 30000, // 30 seconds minimum
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minute timeout
      };

      this.checkinSessions.set(sessionId, session);

      logger.info('Hotspot check-in initiated', {
        sessionId,
        userId,
        hotspotId,
        proximityMethod: proximityData.method
      });

      return {
        success: true,
        sessionId,
        requirements: {
          biometricVerification: true,
          minimumDwellTime: session.minDwellTime,
          proximityMaintained: true
        },
        message: 'Stay near the hotspot and complete biometric verification'
      };
    } catch (error) {
      logger.error('Error initiating hotspot check-in', { error: error.message, userId, hotspotId });
      throw error;
    }
  }

  /**
   * Complete biometric verification for check-in
   */
  async completeBiometricVerification(sessionId, biometricData) {
    try {
      const session = this.checkinSessions.get(sessionId);
      if (!session) {
        throw new Error('Invalid check-in session');
      }

      if (Date.now() > session.expiresAt) {
        this.checkinSessions.delete(sessionId);
        throw new Error('Check-in session expired');
      }

      // Verify biometric (in real implementation, this would validate against stored template)
      const biometricValid = await this.validateBiometric(biometricData, session.userId);
      if (!biometricValid) {
        throw new Error('Biometric verification failed');
      }

      // Check minimum dwell time
      const dwellTime = Date.now() - session.startTime;
      if (dwellTime < session.minDwellTime) {
        return {
          success: false,
          message: `Please stay near the hotspot for ${Math.ceil((session.minDwellTime - dwellTime) / 1000)} more seconds`,
          remainingTime: session.minDwellTime - dwellTime
        };
      }

      // Complete the check-in
      session.status = 'completed';
      session.completedAt = Date.now();
      session.dwellTime = dwellTime;

      // Update hotspot stats
      const hotspot = this.hotspotRegistry.get(session.hotspotId);
      if (hotspot) {
        hotspot.totalCheckins++;
        hotspot.lastActive = Date.now();
      }

      // Award trust points
      await trustLevelService.recordTrustAction(
        session.userId,
        TRUST_ACTIONS.HOTSPOT_CHECKIN,
        {
          hotspotId: session.hotspotId,
          hotspotType: hotspot.type,
          dwellTime,
          proximityMethod: session.proximityMethod
        }
      );

      // Clean up session
      this.checkinSessions.delete(sessionId);

      logger.info('Hotspot check-in completed', {
        sessionId,
        userId: session.userId,
        hotspotId: session.hotspotId,
        dwellTime
      });

      return {
        success: true,
        message: 'Hotspot check-in completed successfully',
        trustPointsAwarded: 15,
        dwellTime
      };
    } catch (error) {
      logger.error('Error completing biometric verification', { error: error.message, sessionId });
      throw error;
    }
  }

  /**
   * Verify proximity using available methods
   */
  async verifyProximity(proximityData, hotspot) {
    try {
      const method = proximityData.method;

      if (!hotspot.capabilities.includes(method)) {
        return false;
      }

      switch (method) {
        case PROXIMITY_METHODS.BLUETOOTH:
          return this.verifyBluetoothProximity(proximityData, hotspot);
        
        case PROXIMITY_METHODS.WIFI_AWARE:
          return this.verifyWifiAwareProximity(proximityData, hotspot);
        
        case PROXIMITY_METHODS.NFC:
          return this.verifyNFCProximity(proximityData, hotspot);
        
        case PROXIMITY_METHODS.QR_SCAN:
          return this.verifyQRScanProximity(proximityData, hotspot);
        
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error verifying proximity', { error: error.message });
      return false;
    }
  }

  /**
   * Verify Bluetooth proximity
   */
  async verifyBluetoothProximity(proximityData, hotspot) {
    // In real implementation, this would:
    // 1. Check RSSI signal strength
    // 2. Verify hotspot Bluetooth beacon
    // 3. Ensure signal is within acceptable range
    
    if (!proximityData.bluetoothSignal || !proximityData.rssi) {
      return false;
    }

    // RSSI threshold for close proximity (typically -60 to -70 dBm for close range)
    const rssiThreshold = -70;
    const isCloseEnough = proximityData.rssi > rssiThreshold;

    logger.debug('Bluetooth proximity check', {
      rssi: proximityData.rssi,
      threshold: rssiThreshold,
      result: isCloseEnough
    });

    return isCloseEnough;
  }

  /**
   * Verify WiFi Aware proximity
   */
  async verifyWifiAwareProximity(proximityData, hotspot) {
    // WiFi Aware provides more precise proximity detection
    if (!proximityData.wifiAwareDistance) {
      return false;
    }

    // Distance threshold in meters
    const distanceThreshold = 5; // 5 meters
    const isCloseEnough = proximityData.wifiAwareDistance <= distanceThreshold;

    logger.debug('WiFi Aware proximity check', {
      distance: proximityData.wifiAwareDistance,
      threshold: distanceThreshold,
      result: isCloseEnough
    });

    return isCloseEnough;
  }

  /**
   * Verify NFC proximity
   */
  async verifyNFCProximity(proximityData, hotspot) {
    // NFC requires very close proximity (< 4cm)
    if (!proximityData.nfcTag || proximityData.nfcTag !== hotspot.publicKey) {
      return false;
    }

    logger.debug('NFC proximity verified', { hotspotId: hotspot.id });
    return true;
  }

  /**
   * Verify QR code scan proximity
   */
  async verifyQRScanProximity(proximityData, hotspot) {
    // QR code contains hotspot ID and timestamp
    if (!proximityData.qrData) {
      return false;
    }

    try {
      const qrPayload = JSON.parse(proximityData.qrData);
      const isValidHotspot = qrPayload.hotspotId === hotspot.id;
      const isRecent = Date.now() - qrPayload.timestamp < (60 * 1000); // 1 minute freshness

      logger.debug('QR scan proximity check', {
        hotspotId: qrPayload.hotspotId,
        timestamp: qrPayload.timestamp,
        isValid: isValidHotspot && isRecent
      });

      return isValidHotspot && isRecent;
    } catch (error) {
      logger.warn('Invalid QR data format', { qrData: proximityData.qrData });
      return false;
    }
  }

  /**
   * Validate biometric data
   */
  async validateBiometric(biometricData, userId) {
    // In real implementation, this would validate against stored biometric template
    // For now, simulate validation
    if (!biometricData || !biometricData.hash) {
      return false;
    }

    // Simulate biometric matching
    const isValid = biometricData.hash.length > 10; // Basic validation

    logger.debug('Biometric validation', { userId, isValid });
    return isValid;
  }

  /**
   * Get nearby hotspots
   */
  async getNearbyHotspots(userLocation, radiusKm = 10) {
    try {
      const nearbyHotspots = [];

      for (const [hotspotId, hotspot] of this.hotspotRegistry) {
        if (!hotspot.isActive) continue;

        // Calculate distance (simplified - in production use proper geo calculations)
        const distance = this.calculateDistance(userLocation, hotspot.location);
        
        if (distance <= radiusKm) {
          nearbyHotspots.push({
            id: hotspotId,
            type: hotspot.type,
            distance,
            capabilities: hotspot.capabilities,
            trustLevel: hotspot.trustLevel,
            totalCheckins: hotspot.totalCheckins
          });
        }
      }

      // Sort by distance
      nearbyHotspots.sort((a, b) => a.distance - b.distance);

      return nearbyHotspots;
    } catch (error) {
      logger.error('Error getting nearby hotspots', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate distance between two points (simplified)
   */
  calculateDistance(point1, point2) {
    // Simplified distance calculation - in production use Haversine formula
    const latDiff = Math.abs(point1.lat - point2.lat);
    const lngDiff = Math.abs(point1.lng - point2.lng);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return 'checkin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get hotspot statistics
   */
  async getHotspotStats(hotspotId) {
    const hotspot = this.hotspotRegistry.get(hotspotId);
    if (!hotspot) {
      return null;
    }

    return {
      id: hotspotId,
      type: hotspot.type,
      totalCheckins: hotspot.totalCheckins,
      lastActive: hotspot.lastActive,
      isActive: hotspot.isActive,
      trustLevel: hotspot.trustLevel
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    
    for (const [sessionId, session] of this.checkinSessions) {
      if (now > session.expiresAt) {
        this.checkinSessions.delete(sessionId);
        logger.debug('Expired check-in session cleaned up', { sessionId });
      }
    }
  }
}

export const proximityHotspotVerifier = new ProximityHotspotVerifier();
export { HOTSPOT_TYPES, PROXIMITY_METHODS };

// Clean up expired sessions every 5 minutes
setInterval(() => {
  proximityHotspotVerifier.cleanupExpiredSessions();
}, 5 * 60 * 1000);

export default proximityHotspotVerifier;
