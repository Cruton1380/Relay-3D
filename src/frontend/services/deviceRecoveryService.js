/**
 * @fileoverview Device Recovery Service
 * Modernized device recovery and guardian system for Base Model 1
 * Integrates legacy guardian recovery logic as clean, modular services
 */
import { apiPost } from './apiClient';

class DeviceRecoveryService {
  constructor() {
    this.isInitialized = false;
    this.guardianNetwork = new Map(); // guardianId -> guardian data
    this.recoverySessions = new Map(); // sessionId -> recovery session
    this.deviceRegistry = new Map(); // deviceId -> device data
  }

  /**
   * Initialize device recovery service
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load existing guardian network and device registry
      await this.loadGuardianNetwork();
      await this.loadDeviceRegistry();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize device recovery service:', error);
      throw error;
    }
  }

  /**
   * Set up guardian recovery network
   */
  async setupGuardianNetwork(userId, guardianData) {
    try {
      const response = await apiPost('/api/recovery/setup-guardians', {
        userId: userId,
        guardians: guardianData.guardians,
        threshold: guardianData.threshold || 3,
        metadata: guardianData.metadata
      });
      
      return {
        success: response.success,
        guardianNetwork: response.guardianNetwork,
        recoveryShares: response.recoveryShares,
        setupComplete: response.setupComplete
      };
    } catch (error) {
      console.error('Guardian network setup failed:', error);
      throw error;
    }
  }

  /**
   * Add a new guardian to the network
   */
  async addGuardian(userId, guardianInfo) {
    try {
      const response = await apiPost('/api/recovery/add-guardian', {
        userId: userId,
        guardian: guardianInfo
      });
      
      return {
        success: response.success,
        guardianId: response.guardianId,
        invitationSent: response.invitationSent,
        shareDistributed: response.shareDistributed
      };
    } catch (error) {
      console.error('Failed to add guardian:', error);
      throw error;
    }
  }

  /**
   * Remove a guardian from the network
   */
  async removeGuardian(userId, guardianId) {
    try {
      const response = await apiPost('/api/recovery/remove-guardian', {
        userId: userId,
        guardianId: guardianId
      });
      
      return {
        success: response.success,
        guardianRemoved: response.guardianRemoved,
        sharesRedistributed: response.sharesRedistributed
      };
    } catch (error) {
      console.error('Failed to remove guardian:', error);
      throw error;
    }
  }

  /**
   * Initiate account recovery process
   */
  async initiateRecovery(recoveryData) {
    try {
      const response = await apiPost('/api/recovery/initiate', {
        userId: recoveryData.userId,
        reason: recoveryData.reason,
        newDeviceInfo: recoveryData.newDeviceInfo,
        emergencyContact: recoveryData.emergencyContact,
        metadata: recoveryData.metadata
      });
      
      return {
        success: response.success,
        sessionId: response.sessionId,
        guardiansNotified: response.guardiansNotified,
        estimatedTime: response.estimatedTime,
        nextSteps: response.nextSteps
      };
    } catch (error) {
      console.error('Recovery initiation failed:', error);
      throw error;
    }
  }

  /**
   * Check recovery session status
   */
  async checkRecoveryStatus(sessionId) {
    try {
      const response = await apiPost('/api/recovery/status', {
        sessionId: sessionId
      });
      
      return {
        sessionId: response.sessionId,
        status: response.status, // pending, in_progress, completed, failed, expired
        progress: response.progress, // percentage complete
        guardianResponses: response.guardianResponses,
        thresholdMet: response.thresholdMet,
        timeRemaining: response.timeRemaining,
        nextAction: response.nextAction
      };
    } catch (error) {
      console.error('Failed to check recovery status:', error);
      throw error;
    }
  }

  /**
   * Approve recovery request (guardian action)
   */
  async approveRecovery(sessionId, guardianId, verificationData) {
    try {
      const response = await apiPost('/api/recovery/approve', {
        sessionId: sessionId,
        guardianId: guardianId,
        verificationData: verificationData
      });
      
      return {
        success: response.success,
        approvalRecorded: response.approvalRecorded,
        thresholdProgress: response.thresholdProgress,
        recoveryComplete: response.recoveryComplete
      };
    } catch (error) {
      console.error('Failed to approve recovery:', error);
      throw error;
    }
  }

  /**
   * Deny recovery request (guardian action)
   */
  async denyRecovery(sessionId, guardianId, reason) {
    try {
      const response = await apiPost('/api/recovery/deny', {
        sessionId: sessionId,
        guardianId: guardianId,
        reason: reason
      });
      
      return {
        success: response.success,
        denialRecorded: response.denialRecorded,
        securityAlert: response.securityAlert
      };
    } catch (error) {
      console.error('Failed to deny recovery:', error);
      throw error;
    }
  }

  /**
   * Complete recovery process
   */
  async completeRecovery(sessionId, newDeviceData) {
    try {
      const response = await apiPost('/api/recovery/complete', {
        sessionId: sessionId,
        newDeviceData: newDeviceData
      });
      
      return {
        success: response.success,
        accountRestored: response.accountRestored,
        newDeviceRegistered: response.newDeviceRegistered,
        securityRecommendations: response.securityRecommendations
      };
    } catch (error) {
      console.error('Failed to complete recovery:', error);
      throw error;
    }
  }

  /**
   * Add a new device to the account
   */
  async addDevice(userId, deviceData) {
    try {
      const response = await apiPost('/api/recovery/add-device', {
        userId: userId,
        deviceData: deviceData
      });
      
      return {
        success: response.success,
        deviceId: response.deviceId,
        deviceRegistered: response.deviceRegistered,
        permissions: response.permissions
      };
    } catch (error) {
      console.error('Failed to add device:', error);
      throw error;
    }
  }

  /**
   * Remove a device from the account
   */
  async removeDevice(userId, deviceId) {
    try {
      const response = await apiPost('/api/recovery/remove-device', {
        userId: userId,
        deviceId: deviceId
      });
      
      return {
        success: response.success,
        deviceRemoved: response.deviceRemoved,
        securityUpdated: response.securityUpdated
      };
    } catch (error) {
      console.error('Failed to remove device:', error);
      throw error;
    }
  }

  /**
   * Get guardian network status
   */
  async getGuardianNetworkStatus(userId) {
    try {
      const response = await apiPost('/api/recovery/guardian-status', {
        userId: userId
      });
      
      return {
        guardians: response.guardians,
        threshold: response.threshold,
        activeGuardians: response.activeGuardians,
        networkHealth: response.networkHealth,
        lastTest: response.lastTest
      };
    } catch (error) {
      console.error('Failed to get guardian network status:', error);
      throw error;
    }
  }

  /**
   * Test guardian recovery system
   */
  async testRecovery(userId) {
    try {
      const response = await apiPost('/api/recovery/test', {
        userId: userId
      });
      
      return {
        success: response.success,
        testSessionId: response.testSessionId,
        guardiansNotified: response.guardiansNotified,
        testComplete: response.testComplete
      };
    } catch (error) {
      console.error('Recovery test failed:', error);
      throw error;
    }
  }

  /**
   * Get device registry
   */
  async getDeviceRegistry(userId) {
    try {
      const response = await apiPost('/api/recovery/devices', {
        userId: userId
      });
      
      return {
        devices: response.devices,
        primaryDevice: response.primaryDevice,
        deviceCount: response.deviceCount,
        lastActivity: response.lastActivity
      };
    } catch (error) {
      console.error('Failed to get device registry:', error);
      throw error;
    }
  }

  /**
   * Update device permissions
   */
  async updateDevicePermissions(userId, deviceId, permissions) {
    try {
      const response = await apiPost('/api/recovery/update-device', {
        userId: userId,
        deviceId: deviceId,
        permissions: permissions
      });
      
      return {
        success: response.success,
        permissionsUpdated: response.permissionsUpdated,
        deviceStatus: response.deviceStatus
      };
    } catch (error) {
      console.error('Failed to update device permissions:', error);
      throw error;
    }
  }

  /**
   * Get recovery history
   */
  async getRecoveryHistory(userId) {
    try {
      const response = await apiPost('/api/recovery/history', {
        userId: userId
      });
      
      return {
        recoverySessions: response.recoverySessions,
        successfulRecoveries: response.successfulRecoveries,
        failedAttempts: response.failedAttempts,
        lastRecovery: response.lastRecovery
      };
    } catch (error) {
      console.error('Failed to get recovery history:', error);
      throw error;
    }
  }

  /**
   * Emergency recovery options
   */
  async emergencyRecovery(userId, emergencyData) {
    try {
      const response = await apiPost('/api/recovery/emergency', {
        userId: userId,
        emergencyData: emergencyData
      });
      
      return {
        success: response.success,
        emergencyOptions: response.emergencyOptions,
        verificationRequired: response.verificationRequired,
        timeEstimate: response.timeEstimate
      };
    } catch (error) {
      console.error('Emergency recovery failed:', error);
      throw error;
    }
  }

  /**
   * Generate recovery backup
   */
  async generateRecoveryBackup(userId) {
    try {
      const response = await apiPost('/api/recovery/backup', {
        userId: userId
      });
      
      return {
        success: response.success,
        backupData: response.backupData,
        backupExpiry: response.backupExpiry,
        securityLevel: response.securityLevel
      };
    } catch (error) {
      console.error('Failed to generate recovery backup:', error);
      throw error;
    }
  }

  /**
   * Validate recovery backup
   */
  async validateRecoveryBackup(backupData) {
    try {
      const response = await apiPost('/api/recovery/validate-backup', {
        backupData: backupData
      });
      
      return {
        valid: response.valid,
        userId: response.userId,
        backupAge: response.backupAge,
        securityStatus: response.securityStatus
      };
    } catch (error) {
      console.error('Failed to validate recovery backup:', error);
      throw error;
    }
  }

  /**
   * Load guardian network from backend
   */
  async loadGuardianNetwork() {
    try {
      const response = await apiPost('/api/recovery/load-guardians');
      if (response.guardians) {
        for (const guardian of response.guardians) {
          this.guardianNetwork.set(guardian.id, guardian);
        }
      }
    } catch (error) {
      console.warn('Failed to load guardian network:', error);
    }
  }

  /**
   * Load device registry from backend
   */
  async loadDeviceRegistry() {
    try {
      const response = await apiPost('/api/recovery/load-devices');
      if (response.devices) {
        for (const device of response.devices) {
          this.deviceRegistry.set(device.id, device);
        }
      }
    } catch (error) {
      console.warn('Failed to load device registry:', error);
    }
  }

  /**
   * Calculate recovery readiness score
   */
  calculateRecoveryReadiness(guardianNetwork, deviceRegistry) {
    const factors = {
      guardianCount: Math.min(guardianNetwork.size / 5, 1), // 5 guardians = 100%
      activeGuardians: this.calculateActiveGuardians(guardianNetwork),
      deviceDiversity: this.calculateDeviceDiversity(deviceRegistry),
      recentActivity: this.calculateRecentActivity(deviceRegistry),
      geographicSpread: this.calculateGeographicSpread(guardianNetwork)
    };

    const weights = {
      guardianCount: 0.3,
      activeGuardians: 0.25,
      deviceDiversity: 0.2,
      recentActivity: 0.15,
      geographicSpread: 0.1
    };

    let totalScore = 0;
    for (const [factor, value] of Object.entries(factors)) {
      totalScore += value * weights[factor];
    }

    return {
      overallScore: totalScore,
      factors: factors,
      recommendations: this.generateReadinessRecommendations(factors)
    };
  }

  /**
   * Calculate active guardians percentage
   */
  calculateActiveGuardians(guardianNetwork) {
    if (guardianNetwork.size === 0) return 0;
    
    const activeGuardians = Array.from(guardianNetwork.values())
      .filter(guardian => guardian.lastActive > Date.now() - (30 * 24 * 60 * 60 * 1000)) // 30 days
      .length;
    
    return activeGuardians / guardianNetwork.size;
  }

  /**
   * Calculate device diversity score
   */
  calculateDeviceDiversity(deviceRegistry) {
    if (deviceRegistry.size === 0) return 0;
    
    const deviceTypes = new Set();
    for (const device of deviceRegistry.values()) {
      deviceTypes.add(device.type);
    }
    
    return Math.min(deviceTypes.size / 3, 1); // 3+ device types = 100%
  }

  /**
   * Calculate recent activity score
   */
  calculateRecentActivity(deviceRegistry) {
    if (deviceRegistry.size === 0) return 0;
    
    const now = Date.now();
    const activeDevices = Array.from(deviceRegistry.values())
      .filter(device => device.lastActivity > now - (7 * 24 * 60 * 60 * 1000)) // 7 days
      .length;
    
    return activeDevices / deviceRegistry.size;
  }

  /**
   * Calculate geographic spread score
   */
  calculateGeographicSpread(guardianNetwork) {
    if (guardianNetwork.size === 0) return 0;
    
    const locations = new Set();
    for (const guardian of guardianNetwork.values()) {
      if (guardian.location) {
        locations.add(guardian.location.country);
      }
    }
    
    return Math.min(locations.size / 3, 1); // 3+ countries = 100%
  }

  /**
   * Generate readiness recommendations
   */
  generateReadinessRecommendations(factors) {
    const recommendations = [];

    if (factors.guardianCount < 0.8) {
      recommendations.push('Add more guardians to your recovery network (recommended: 5 total)');
    }

    if (factors.activeGuardians < 0.8) {
      recommendations.push('Some guardians have been inactive. Consider updating your guardian network');
    }

    if (factors.deviceDiversity < 0.7) {
      recommendations.push('Add more diverse devices to your account (phone, computer, tablet)');
    }

    if (factors.recentActivity < 0.8) {
      recommendations.push('Some devices have been inactive. Consider removing old devices');
    }

    if (factors.geographicSpread < 0.7) {
      recommendations.push('Consider adding guardians from different geographic locations');
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.guardianNetwork.clear();
    this.recoverySessions.clear();
    this.deviceRegistry.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
const deviceRecoveryService = new DeviceRecoveryService();
export default deviceRecoveryService; 