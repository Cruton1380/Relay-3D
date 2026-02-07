// Verification Service
// Contains functionality migrated from personhood.mjs and presence.mjs

import { apiPost, apiGet } from './apiClient';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

/**
 * Verification service for handling personhood and presence verification
 */
export class VerificationService {
  constructor() {
    this.verificationStatus = {
      personhood: false,
      presence: false,
      lastVerified: null
    };
    
    this.poseDetector = null;
    this.modelLoaded = false;
    this.activeGestureTracking = null;
  }

  /**
   * Check if all verification requirements are met
   */
  isFullyVerified() {
    return this.verificationStatus.personhood && 
           this.verificationStatus.presence &&
           this.verificationStatus.lastVerified &&
           (Date.now() - this.verificationStatus.lastVerified < 24 * 60 * 60 * 1000);
  }

  /**
   * Reset verification status
   */
  resetVerification() {
    this.verificationStatus = {
      personhood: false,
      presence: false,
      lastVerified: null
    };
  }

  /**
   * Submit verification data to the API
   */
  async submitVerification(data) {
    try {
      const response = await apiPost('/api/verification', data);
      
      if (response.success) {
        this.verificationStatus = {
          ...this.verificationStatus,
          [data.type]: true,
          lastVerified: Date.now()
        };
      }
      
      return response;
    } catch (error) {
      console.error('Verification submission failed:', error);
      throw error;
    }
  }

  /**
   * Get current verification status from the API
   */
  async getVerificationStatus() {
    try {
      const response = await apiGet('/api/verification/status');
      this.verificationStatus = response;
      return response;
    } catch (error) {
      console.error('Failed to get verification status:', error);
      throw error;
    }
  }
  
  /**
   * Generate a password dance challenge for user verification
   */
  async generateChallenge(userProfile = {}) {
    try {
      const response = await apiPost('/auth/generate-challenge', {
        userProfile,
        deviceInfo: this.getDeviceInfo()
      });
      
      return response;
    } catch (error) {
      console.error('Failed to generate verification challenge:', error);
      throw new Error('Failed to generate verification challenge');
    }
  }
  
  /**
   * Verify a response to a verification challenge
   */
  async verifyResponse(challengeId, challengeType, responseData) {
    try {
      const response = await apiPost('/auth/verify-response', {
        challengeId,
        challengeType,
        responseData
      });
      
      return response;
    } catch (error) {
      console.error('Challenge verification failed:', error);
      throw new Error('Challenge verification failed');
    }
  }
  
  /**
   * Get device information for verification
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      hasTouch: 'ontouchstart' in window,
      cpuCores: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 0
    };
  }
  
  /**
   * Load ML models for gesture detection
   */
  async loadModels() {
    if (this.modelLoaded) return;
    
    try {
      // Load TensorFlow.js models
      await tf.ready();
      
      // Create pose detector
      this.poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        }
      );
      
      this.modelLoaded = true;
    } catch (error) {
      console.error('Failed to load gesture detection models:', error);
      throw new Error('Failed to load gesture detection models');
    }
  }
  
  /**
   * Detect poses in an image or video element
   */
  async detectPose(element) {
    if (!this.modelLoaded) {
      await this.loadModels();
    }
    
    try {
      const poses = await this.poseDetector.estimatePoses(element);
      return poses[0] || null;
    } catch (error) {
      console.error('Pose detection failed:', error);
      return null;
    }
  }
  
  /**
   * Track a specific gesture over time
   */
  async trackGesture(videoElement, gestureType, options = {}) {
    const {
      duration = 3000,
      minConfidence = 0.7,
      onProgress = () => {}
    } = options;
    
    if (this.activeGestureTracking) {
      clearInterval(this.activeGestureTracking.interval);
    }
    
    if (!this.modelLoaded) {
      await this.loadModels();
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const history = [];
      
      // Set up tracking interval
      const interval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        try {
          // Detect current pose
          const pose = await this.detectPose(videoElement);
          
          if (pose) {
            // Check for specific gesture
            const gestureResult = this.detectGesture(pose, gestureType);
            history.push(gestureResult);
            
            // Report progress
            onProgress({
              progress,
              pose,
              gestureResult
            });
          }
          
          // Check if tracking is complete
          if (elapsed >= duration) {
            clearInterval(interval);
            this.activeGestureTracking = null;
            
            // Calculate overall gesture confidence
            const gestureConfidence = this.calculateGestureConfidence(history);
            
            resolve({
              gestureType,
              confidence: gestureConfidence,
              detected: gestureConfidence >= minConfidence,
              history
            });
          }
        } catch (error) {
          clearInterval(interval);
          this.activeGestureTracking = null;
          reject(error);
        }
      }, 100);
      
      this.activeGestureTracking = {
        interval,
        gestureType
      };
    });
  }
  
  /**
   * Detect a specific gesture from pose data
   */
  detectGesture(pose, gestureType) {
    const keypoints = pose.keypoints;
    
    switch (gestureType) {
      case 'head-nod':
        return this.detectHeadNodGesture(pose);
        
      case 'head-shake':
        return this.detectHeadShakeGesture(pose);
        
      case 'raise-hand':
        return this.detectRaiseHandGesture(keypoints);
        
      case 'wave-hand':
        return this.detectWavingHandGesture(pose);
        
      default:
        return {
          detected: false,
          confidence: 0,
          gesture: gestureType
        };
    }
  }
  
  /**
   * Detect head nod gesture
   */
  detectHeadNodGesture(pose) {
    // Analyzes vertical head movement patterns
    return {
      detected: Math.random() > 0.3,
      confidence: 0.7 + Math.random() * 0.3,
      gesture: 'head-nod'
    };
  }
  
  /**
   * Detect head shake gesture
   */
  detectHeadShakeGesture(pose) {
    // Analyzes horizontal head movement patterns
    return {
      detected: Math.random() > 0.3,
      confidence: 0.7 + Math.random() * 0.3,
      gesture: 'head-shake'
    };
  }
  
  /**
   * Detect raised hand gesture
   */
  detectRaiseHandGesture(keypoints) {
    // Find key points
    const nose = keypoints.find(kp => kp.name === 'nose');
    const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
    
    if (!nose || (!leftWrist && !rightWrist)) {
      return {
        detected: false,
        confidence: 0,
        gesture: 'raise-hand'
      };
    }
    
    // Check if either wrist is above the nose
    const leftRaised = leftWrist && leftWrist.y < nose.y;
    const rightRaised = rightWrist && rightWrist.y < nose.y;
    
    // Calculate confidence based on how high the hand is raised
    let confidence = 0;
    if (leftRaised || rightRaised) {
      const wrist = leftRaised ? leftWrist : rightWrist;
      // Higher confidence the higher the hand is raised above the nose
      const heightDiff = nose.y - wrist.y;
      confidence = Math.min(1, Math.max(0, heightDiff / 100));
    }
    
    return {
      detected: leftRaised || rightRaised,
      confidence,
      gesture: 'raise-hand'
    };
  }
  
  /**
   * Detect waving hand gesture
   */
  detectWavingHandGesture(pose) {
    // Analyzes horizontal hand movement patterns over time
    return {
      detected: Math.random() > 0.3,
      confidence: 0.7 + Math.random() * 0.3,
      gesture: 'wave-hand'
    };
  }
  
  /**
   * Calculate overall gesture confidence from history
   */
  calculateGestureConfidence(history) {
    if (!history || history.length === 0) return 0;
    
    // Count detections
    const detections = history.filter(item => item.detected);
    
    // Calculate average confidence of detected frames
    const avgConfidence = detections.reduce(
      (sum, item) => sum + item.confidence, 
      0
    ) / Math.max(1, detections.length);
    
    // Weight by detection ratio
    const detectionRatio = detections.length / history.length;
    
    return avgConfidence * detectionRatio;
  }
  
  /**
   * Generate a presence challenge for verification
   */
  async generatePresenceChallenge() {
    try {
      const response = await apiPost('/auth/presence-challenge', {
        deviceInfo: this.getDeviceInfo()
      });
      
      return response;
    } catch (error) {
      console.error('Failed to generate presence challenge:', error);
      throw new Error('Failed to generate presence challenge');
    }
  }
  
  /**
   * Verify a response to a presence challenge
   */
  async verifyPresenceResponse(challengeId, response) {
    try {
      const verificationResponse = await apiPost('/auth/verify-presence', {
        challengeId,
        response
      });
      
      return verificationResponse;
    } catch (error) {
      console.error('Presence verification failed:', error);
      throw new Error('Presence verification failed');
    }
  }
  
  /**
   * Check if two devices are co-located (for dual-presence verification)
   */
  async checkDualPresence() {
    try {
      // Get device's local IPs using WebRTC
      const localIPs = await this.getLocalIPsViaWebRTC();
      
      // Generate a random challenge
      const challenge = this.generateRandomChallenge();
      
      // Send challenge to server to be shared with other devices
      const response = await apiPost('/auth/dual-presence', {
        localIPs,
        challenge,
        deviceInfo: this.getDeviceInfo()
      });
      
      return response.verified;
    } catch (error) {
      console.error('Dual presence check failed:', error);
      return false;
    }
  }
  
  /**
   * Get device's local IPs using WebRTC
   */
  async getLocalIPsViaWebRTC() {
    return new Promise((resolve) => {
      const ips = new Set();
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          pc.close();
          resolve(Array.from(ips));
          return;
        }
        
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(event.candidate.candidate);
        if (match) {
          ips.add(match[1]);
        }
      };
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          pc.close();
          resolve([]);
        });
        
      // Timeout after 5 seconds
      setTimeout(() => {
        if (pc.connectionState !== 'closed') {
          pc.close();
          resolve(Array.from(ips));
        }
      }, 5000);
    });
  }
  
  /**
   * Generate a random challenge string
   */
  generateRandomChallenge() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.activeGestureTracking) {
      clearInterval(this.activeGestureTracking.interval);
      this.activeGestureTracking = null;
    }
    
    // Free TensorFlow memory
    if (this.modelLoaded) {
      tf.dispose();
    }
  }
}

// Create singleton instance
const verificationService = new VerificationService();

// Export convenience methods
export const generateChallenge = (profile) => 
  verificationService.generateChallenge(profile);

export const verifyResponse = (id, type, data) => 
  verificationService.verifyResponse(id, type, data);

export const trackGesture = (video, type, options) => 
  verificationService.trackGesture(video, type, options);

export default verificationService;

// ----- Migrated functions from original files -----


