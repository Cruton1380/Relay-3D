/**
 * @fileoverview Biometric Authentication Service
 * Modernized biometric authentication service for Base Model 1
 * Integrates legacy biometric logic as clean, modular services
 */
import { apiPost } from './apiClient';

class BiometricAuthService {
  constructor() {
    this.isInitialized = false;
    this.videoStream = null;
    this.audioStream = null;
    this.mediaRecorder = null;
    this.recordingChunks = [];
  }

  /**
   * Initialize biometric authentication
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Biometric authentication not supported in this browser');
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize biometric service:', error);
      throw error;
    }
  }

  /**
   * Start camera for facial recognition
   */
  async startCamera(videoElement, options = {}) {
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          ...options.video
        }
      };

      this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.videoStream;
      
      return new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => resolve(this.videoStream);
        videoElement.onerror = reject;
      });
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw new Error('Camera access denied. Please enable camera permissions.');
    }
  }

  /**
   * Stop camera
   */
  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  /**
   * Capture image from video stream
   */
  captureImage(videoElement, quality = 0.8) {
    if (!videoElement || !this.videoStream) {
      throw new Error('Camera not active');
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    context.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * Start audio recording for voice biometrics
   */
  async startAudioRecording(audioElement, options = {}) {
    try {
      const constraints = {
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          ...options.audio
        }
      };

      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      audioElement.srcObject = this.audioStream;
      
      // Set up MediaRecorder for recording
      this.mediaRecorder = new MediaRecorder(this.audioStream);
      this.recordingChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };
      
      return this.audioStream;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Microphone access denied. Please enable microphone permissions.');
    }
  }

  /**
   * Stop audio recording and get recorded data
   */
  stopAudioRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordingChunks, { type: 'audio/wav' });
        this.recordingChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = reject;
      this.mediaRecorder.stop();
    });
  }

  /**
   * Enroll biometric template (facial + voice)
   */
  async enrollBiometric(userId, biometricData) {
    try {
      const { facialImage, voiceRecording, metadata } = biometricData;
      
      // Prepare enrollment data
      const enrollmentData = {
        userId,
        facialImage: facialImage.split(',')[1], // Remove data URL prefix
        voiceRecording: await this.blobToBase64(voiceRecording),
        metadata: {
          timestamp: Date.now(),
          deviceInfo: await this.getDeviceInfo(),
          quality: metadata?.quality || 0.8,
          ...metadata
        }
      };

      // Send to backend for enrollment
      const response = await apiPost('/api/biometrics/enroll', enrollmentData);
      
      if (response.success) {
        return {
          success: true,
          enrollmentId: response.enrollmentId,
          message: 'Biometric enrollment successful'
        };
      } else {
        throw new Error(response.message || 'Enrollment failed');
      }
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      throw error;
    }
  }

  /**
   * Verify biometric authentication
   */
  async verifyBiometric(userId, biometricData) {
    try {
      const { facialImage, voiceRecording, metadata } = biometricData;
      
      // Prepare verification data
      const verificationData = {
        userId,
        facialImage: facialImage.split(',')[1], // Remove data URL prefix
        voiceRecording: voiceRecording ? await this.blobToBase64(voiceRecording) : null,
        metadata: {
          timestamp: Date.now(),
          deviceInfo: await this.getDeviceInfo(),
          ...metadata
        }
      };

      // Send to backend for verification
      const response = await apiPost('/api/biometrics/verify', verificationData);
      
      if (response.success) {
        return {
          success: true,
          confidence: response.confidence,
          modality: response.modality,
          message: 'Biometric verification successful'
        };
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Biometric verification failed:', error);
      throw error;
    }
  }

  /**
   * Check if user has biometric enrollment
   */
  async hasBiometricEnrollment(userId) {
    try {
      const response = await apiPost('/api/biometrics/status', { userId });
      return response.hasEnrollment || false;
    } catch (error) {
      console.error('Failed to check biometric enrollment:', error);
      return false;
    }
  }

  /**
   * Update biometric template (re-enrollment)
   */
  async updateBiometricTemplate(userId, biometricData) {
    try {
      const { facialImage, voiceRecording, metadata } = biometricData;
      
      const updateData = {
        userId,
        facialImage: facialImage.split(',')[1],
        voiceRecording: voiceRecording ? await this.blobToBase64(voiceRecording) : null,
        metadata: {
          timestamp: Date.now(),
          deviceInfo: await this.getDeviceInfo(),
          source: 'reverification',
          ...metadata
        }
      };

      const response = await apiPost('/api/biometrics/reverify', updateData);
      
      if (response.success) {
        return {
          success: true,
          message: 'Biometric template updated successfully'
        };
      } else {
        throw new Error(response.message || 'Template update failed');
      }
    } catch (error) {
      console.error('Biometric template update failed:', error);
      throw error;
    }
  }

  /**
   * Delete biometric enrollment
   */
  async deleteBiometricEnrollment(userId) {
    try {
      const response = await apiPost('/api/biometrics/delete', { userId });
      
      if (response.success) {
        return {
          success: true,
          message: 'Biometric enrollment deleted successfully'
        };
      } else {
        throw new Error(response.message || 'Deletion failed');
      }
    } catch (error) {
      console.error('Failed to delete biometric enrollment:', error);
      throw error;
    }
  }

  /**
   * Get device information for attestation
   */
  async getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timestamp: Date.now()
    };
  }

  /**
   * Convert blob to base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Assess biometric quality
   */
  async assessBiometricQuality(biometricData) {
    try {
      const { facialImage, voiceRecording } = biometricData;
      
      const qualityData = {
        facialImage: facialImage ? await this.assessImageQuality(facialImage) : null,
        voiceRecording: voiceRecording ? await this.assessAudioQuality(voiceRecording) : null
      };

      // Calculate overall quality score
      const scores = Object.values(qualityData).filter(score => score !== null);
      const overallQuality = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

      return {
        overall: overallQuality,
        facial: qualityData.facialImage,
        voice: qualityData.voiceRecording,
        acceptable: overallQuality >= 0.7
      };
    } catch (error) {
      console.error('Failed to assess biometric quality:', error);
      return {
        overall: 0,
        acceptable: false,
        error: error.message
      };
    }
  }

  /**
   * Assess image quality for facial recognition
   */
  async assessImageQuality(imageDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple quality assessment based on brightness and contrast
        let brightness = 0;
        let contrast = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          brightness += (r + g + b) / 3;
        }
        
        brightness /= (data.length / 4);
        
        // Calculate contrast (simplified)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const pixelBrightness = (r + g + b) / 3;
          contrast += Math.abs(pixelBrightness - brightness);
        }
        
        contrast /= (data.length / 4);
        
        // Normalize scores
        const brightnessScore = Math.max(0, 1 - Math.abs(brightness - 128) / 128);
        const contrastScore = Math.min(1, contrast / 50);
        
        const quality = (brightnessScore + contrastScore) / 2;
        resolve(Math.max(0, Math.min(1, quality)));
      };
      img.src = imageDataUrl;
    });
  }

  /**
   * Assess audio quality for voice recognition
   */
  async assessAudioQuality(audioBlob) {
    // Simple audio quality assessment
    // In a real implementation, this would analyze audio characteristics
    return 0.8; // Placeholder
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopCamera();
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
const biometricAuthService = new BiometricAuthService();
export default biometricAuthService; 