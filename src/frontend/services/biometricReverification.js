
/**
 * Biometric Reverification Service
 * Handles periodic reverification of user identity
 * Migrated from biometricReverification.mjs
 */

import { apiGet, apiPost } from './apiClient';
import { checkReverificationStatus } from './biometricAPI';
import { generateFaceFeatureHash } from '../utils/ml/motionTracker';
import { calculateFeatureHash } from '../utils/ml/featureHasher';
import { useEffect, useState } from 'react';

// Constants
const DEFAULT_REVERIFICATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const MIN_REVERIFICATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_REVERIFICATION_DELAY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Start the biometric reverification process
 * @returns {Promise<Object>} Process initiation result
 */
export async function startReverificationProcess() {
  try {
    const response = await apiPost('/api/auth/start-reverification');
    return response;
  } catch (error) {
    console.error('Error starting reverification process:', error);
    throw error;
  }
}

/**
 * Submit biometric data for reverification
 * @param {string|Object} biometricData - Biometric data or element to capture from
 * @returns {Promise<Object>} Verification result
 */
export async function submitReverification(biometricData) {
  try {
    // Handle case where biometricData is an HTML element
    let featureHash;
    
    if (typeof biometricData === 'object' && biometricData instanceof HTMLElement) {
      // It's a video or image element, extract features
      const landmarks = await generateFaceFeatureHash(biometricData);
      if (!landmarks) {
        throw new Error('Failed to extract facial features');
      }
      featureHash = landmarks;
    } else if (typeof biometricData === 'string' && biometricData.startsWith('data:image')) {
      // It's a data URL, convert to image and extract features
      const img = new Image();
      img.src = biometricData;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      const landmarks = await generateFaceFeatureHash(img);
      if (!landmarks) {
        throw new Error('Failed to extract facial features');
      }
      featureHash = landmarks;
    } else if (Array.isArray(biometricData)) {
      // It's a feature array, hash it directly
      featureHash = calculateFeatureHash(biometricData);
    } else {
      // Assume it's already a hash
      featureHash = biometricData;
    }
    
    // Submit to API
    const response = await apiPost('/api/auth/submit-reverification', {
      biometricHash: featureHash,
      timestamp: Date.now()
    });
    
    return response;
  } catch (error) {
    console.error('Error submitting reverification:', error);
    throw error;
  }
}

/**
 * Get reverification history
 * @returns {Promise<Array>} Reverification history
 */
export async function getReverificationHistory() {
  try {
    const response = await apiGet('/api/auth/reverification-history');
    return response.history || [];
  } catch (error) {
    console.error('Error getting reverification history:', error);
    return [];
  }
}

/**
 * React hook for biometric reverification
 * @param {Object} options - Configuration options
 * @returns {Object} Reverification state and functions
 */
export function useBiometricReverification(options = {}) {
  const { 
    autoCheck = true, 
    checkInterval = 60 * 60 * 1000 // 1 hour
  } = options;
  
  const { isAuthenticated, elevateSession } = useAuth();
  const [needsReverification, setNeedsReverification] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [nextVerificationAt, setNextVerificationAt] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  
  // Check reverification status
  const checkStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsChecking(true);
      setError(null);
      
      const status = await checkReverificationStatus();
      
      setNeedsReverification(status.needsReverification);
      setLastVerifiedAt(status.lastVerifiedAt);
      setNextVerificationAt(status.nextVerificationRequired);
    } catch (err) {
      setError(`Failed to check reverification status: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Start reverification process
  const startReverification = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsVerifying(true);
      setError(null);
      
      await startReverificationProcess();
      
      // Return true to indicate success
      return true;
    } catch (err) {
      setError(`Failed to start reverification: ${err.message}`);
      return false;
    }
  };
  
  // Submit reverification
  const submitBiometricReverification = async (biometricData) => {
    if (!isAuthenticated) return;
    
    try {
      setIsVerifying(true);
      setError(null);
      
      const result = await submitReverification(biometricData);
      
      if (result.success) {
        // Update state based on result
        setNeedsReverification(false);
        setLastVerifiedAt(result.verifiedAt);
        setNextVerificationAt(result.nextVerificationRequired);
        
        // Elevate session if successful
        if (elevateSession) {
          await elevateSession('biometric');
        }
        
        return true;
      } else {
        setError(result.message || 'Reverification failed');
        return false;
      }
    } catch (err) {
      setError(`Failed to submit reverification: ${err.message}`);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Periodically check for reverification needs
  useEffect(() => {
    if (!autoCheck || !isAuthenticated) return;
    
    // Check immediately on mount
    checkStatus();
    
    // Set up interval for periodic checks
    const intervalId = setInterval(checkStatus, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [autoCheck, checkInterval, isAuthenticated]);
  
  return {
    needsReverification,
    lastVerifiedAt,
    nextVerificationAt,
    isChecking,
    isVerifying,
    error,
    checkStatus,
    startReverification,
    submitBiometricReverification
  };
}

export default {
  startReverificationProcess,
  submitReverification,
  getReverificationHistory,
  useBiometricReverification
};
