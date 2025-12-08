/**
 * @fileoverview Privacy Service Implementation
 */

import crypto from 'crypto';
import { getSystemParameters } from '../lib/systemParameters.mjs';

const ENCRYPTION_KEY = crypto.randomBytes(32); // In production, this would be securely stored
const IV_LENGTH = 16;

export class PrivacyService {
  constructor(systemParams) {
    this.systemParams = systemParams;
    this.userSettings = new Map();
  }

  async getPrivacySettings(userId) {
    if (!userId) {
      throw new Error('User ID required');
    }

    // Return cached settings or defaults
    return this.userSettings.get(userId) || {
      privacyLevel: this.systemParams.privacyLevel,
      anonymityThreshold: this.systemParams.anonymityThreshold,
      locationSharing: true,
      dataRetention: 'standard'
    };
  }

  async updatePrivacySettings(userId, newSettings) {
    if (!userId) {
      throw new Error('User ID required');
    }

    const currentSettings = await this.getPrivacySettings(userId);
    const updatedSettings = {
      ...currentSettings,
      ...newSettings
    };

    this.userSettings.set(userId, updatedSettings);
    return { success: true, settings: updatedSettings };
  }

  async validateAuthToken(token) {
    if (!token) {
      return { valid: false, error: 'Token required' };
    }

    // In production, this would validate against a token store
    return { valid: false, error: 'Invalid authentication token' };
  }

  async encryptData(data) {
    if (!data) {
      throw new Error('Invalid data for encryption');
    }

    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
      
      const jsonData = JSON.stringify(data);
      const encrypted = Buffer.concat([
        cipher.update(jsonData, 'utf8'),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, encrypted data, and auth tag
      const result = Buffer.concat([iv, encrypted, authTag]);
      return result.toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  async decryptData(encryptedData) {
    if (!encryptedData) {
      throw new Error('Invalid encrypted data');
    }

    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, data, and auth tag
      const iv = buffer.slice(0, IV_LENGTH);
      const authTag = buffer.slice(-16);
      const encrypted = buffer.slice(IV_LENGTH, -16);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return JSON.parse(decrypted.toString());
    } catch (error) {
      throw new Error('Invalid encrypted data');
    }
  }

  async anonymizeData(userData) {
    if (!userData) {
      throw new Error('Invalid user data');
    }

    // Create anonymized version of user data
    const anonymized = {
      userId: this._generateAnonymousId(userData.userId)
    };

    // Add fuzzy location if present
    if (userData.location && Array.isArray(userData.location)) {
      anonymized.location = this._fuzzyLocation(userData.location);
    }

    return anonymized;
  }

  _generateAnonymousId(userId) {
    return crypto
      .createHash('sha256')
      .update(userId + Date.now().toString())
      .digest('hex')
      .slice(0, 16);
  }

  _fuzzyLocation([lat, lon], radiusKm = 1) {
    // Add random offset within radius
    const earthRadiusKm = 6371;
    const randomDistance = Math.random() * radiusKm;
    const randomBearing = Math.random() * 2 * Math.PI;
    
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(randomDistance / earthRadiusKm) +
      Math.cos(latRad) * Math.sin(randomDistance / earthRadiusKm) * Math.cos(randomBearing)
    );
    
    const newLon = lonRad + Math.atan2(
      Math.sin(randomBearing) * Math.sin(randomDistance / earthRadiusKm) * Math.cos(latRad),
      Math.cos(randomDistance / earthRadiusKm) - Math.sin(latRad) * Math.sin(newLat)
    );
    
    return [
      (newLat * 180) / Math.PI,
      (newLon * 180) / Math.PI
    ];
  }
}

export async function createPrivacyService() {
  const systemParams = await getSystemParameters();
  return new PrivacyService(systemParams);
} 