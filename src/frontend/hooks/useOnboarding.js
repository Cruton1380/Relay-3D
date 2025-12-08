/**
 * Onboarding Hook
 * React hook for onboarding flow
 */
import { useState, useCallback } from 'react';
import onboardingService from '../services/onboardingService';
import { useCameraManager } from './useCameraManager';
import { usePersonhoodVerification } from './usePersonhoodVerification';

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState('invite');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteVerified, setInviteVerified] = useState(false);
  const [biometricHash, setBiometricHash] = useState(null);
  const [personhoodVerified, setPersonhoodVerified] = useState(false);
  
  const { videoRef, startCamera, takeSnapshot } = useCameraManager();
  const { startVerification, verificationState, verificationResult } = usePersonhoodVerification();
  
  // Verify invite code
  const verifyInvite = useCallback(async (code) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await onboardingService.verifyInvite(code);
      
      if (result.success) {
        setInviteCode(code);
        setInviteVerified(true);
        setCurrentStep('biometric');
      } else {
        setError(result.message || 'Invalid invite code');
      }
      
      return result.success;
    } catch (err) {
      setError(`Failed to verify invite: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Capture biometric data
  const captureBiometric = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Start camera
      await startCamera();
      
      // Take snapshot
      const snapshot = takeSnapshot();
      
      if (!snapshot) {
        throw new Error('Failed to capture image');
      }
      
      // Convert data URL to blob for processing
      const response = await fetch(snapshot);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('biometricImage', blob, 'biometric.jpg');
      
      // Send to backend for processing
      const result = await onboardingService.verifyBiometricUniqueness(formData);
      
      if (result.success) {
        setBiometricHash(result.biometricHash);
        setCurrentStep('personhood');
      } else {
        setError(result.message || 'Biometric verification failed');
      }
      
      return result.success;
    } catch (err) {
      setError(`Failed to capture biometric: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [startCamera, takeSnapshot]);
  
  // Verify personhood
  const verifyPersonhood = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await startVerification();
      
      if (result) {
        setPersonhoodVerified(true);
        setCurrentStep('complete');
        return true;
      } else {
        setError('Personhood verification failed');
        return false;
      }
    } catch (err) {
      setError(`Failed to verify personhood: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [startVerification]);
  
  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!inviteVerified || !biometricHash || !personhoodVerified) {
      setError('Please complete all previous steps first');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await onboardingService.completeOnboarding({
        inviteCode,
        biometricHash,
        deviceInfo: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          colorDepth: window.screen.colorDepth,
          orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
          userAgent: navigator.userAgent
        }
      });
      
      return result.success;
    } catch (err) {
      setError(`Failed to complete onboarding: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, inviteVerified, biometricHash, personhoodVerified]);
  
  return {
    currentStep,
    isLoading,
    error,
    inviteCode,
    inviteVerified,
    biometricHash,
    personhoodVerified,
    videoRef,
    verificationState,
    verificationResult,
    verifyInvite,
    captureBiometric,
    verifyPersonhood,
    completeOnboarding,
    setCurrentStep
  };
}

export default useOnboarding;
