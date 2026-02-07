/**
 * Personhood Verification React Hook
 * Handles human verification challenges and liveness detection
 * Migrated from frontend/js/personhood.mjs
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Verification states
export const VERIFICATION_STATE = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  CHALLENGE_ACTIVE: 'challenge_active',
  CHALLENGE_COMPLETED: 'challenge_completed',
  VERIFIED: 'verified',
  FAILED: 'failed',
  ERROR: 'error'
};

// Challenge types
export const CHALLENGE_TYPE = {
  SMILE: 'smile',
  BLINK: 'blink',
  NOD: 'nod',
  TURN_HEAD: 'turn_head',
  RAISE_HAND: 'raise_hand',
  FOLLOW_TARGET: 'follow_target',
  RANDOM_MOTION: 'random_motion'
};

export function usePersonhoodVerification(options = {}) {
  const {
    challengeSequence = [CHALLENGE_TYPE.BLINK, CHALLENGE_TYPE.SMILE],
    modelType = 'face', // 'face', 'pose', or 'both'
    timeoutDuration = 30000, // 30 seconds
    requiredConfidence = 0.8,
    autoStart = false
  } = options;
  
  // State variables
  const [verificationState, setVerificationState] = useState(VERIFICATION_STATE.IDLE);
  const [models, setModels] = useState({
    faceModel: null,
    poseModel: null
  });
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const challengeIndexRef = useRef(0);
  const detectionHistoryRef = useRef([]);
  
  // Load the required models
  const loadModels = useCallback(async () => {
    try {
      setVerificationState(VERIFICATION_STATE.INITIALIZING);
      
      // Initialize TensorFlow.js
      await tf.ready();
      
      const loadedModels = {};
      
      // Load face model if needed
      if (modelType === 'face' || modelType === 'both') {
        loadedModels.faceModel = await faceLandmarksDetection.load(
          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
          { maxFaces: 1 }
        );
      }
      
      // Load pose model if needed
      if (modelType === 'pose' || modelType === 'both') {
        loadedModels.poseModel = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: 'lightning' }
        );
      }
      
      setModels(loadedModels);
      setIsModelLoaded(true);
      setVerificationState(VERIFICATION_STATE.READY);
      return true;
    } catch (err) {
      console.error('Error loading models:', err);
      setError(`Failed to load detection models: ${err.message}`);
      setVerificationState(VERIFICATION_STATE.ERROR);
      return false;
    }
  }, [modelType]);
  
  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        return streamRef.current;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });
        
        await videoRef.current.play();
      }
      
      return stream;
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Failed to access camera: ${err.message}`);
      return null;
    }
  }, []);
  
  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);
  
  // Generate a random session ID
  const generateSessionId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }, []);
  
  // Start the verification process
  const startVerification = useCallback(async () => {
    // Reset state
    setError(null);
    setVerificationResult(null);
    setChallengeProgress(0);
    challengeIndexRef.current = 0;
    detectionHistoryRef.current = [];
    
    // Cancel any ongoing processes
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Load models if not already loaded
    if (!isModelLoaded) {
      const modelsLoaded = await loadModels();
      if (!modelsLoaded) return false;
    }
    
    // Start camera
    const stream = await startCamera();
    if (!stream) return false;
    
    // Create a new session ID
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    // Start the verification process
    setVerificationState(VERIFICATION_STATE.IN_PROGRESS);
    
    // Start the first challenge
    startNextChallenge();
    
    // Set timeout for the entire verification process
    timerRef.current = setTimeout(() => {
      cancelVerification('Verification timed out');
    }, timeoutDuration);
    
    return true;
  }, [isModelLoaded, loadModels, startCamera, startNextChallenge, timeoutDuration]);
  
  // Cancel verification
  const cancelVerification = useCallback((reason = 'Verification cancelled') => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setError(reason);
    setVerificationState(VERIFICATION_STATE.FAILED);
    stopCamera();
  }, [stopCamera]);
  
  // Start the next challenge in the sequence
  const startNextChallenge = useCallback(() => {
    if (challengeIndexRef.current >= challengeSequence.length) {
      // All challenges completed
      completeVerification(true);
      return;
    }
    
    const challenge = challengeSequence[challengeIndexRef.current];
    setCurrentChallenge(challenge);
    setChallengeProgress(0);
    setVerificationState(VERIFICATION_STATE.CHALLENGE_ACTIVE);
    
    // Start processing frames for this challenge
    processFrames(challenge);
  }, [challengeSequence, processFrames, completeVerification]);
  
  // Process video frames for challenge detection
  const processFrames = useCallback(async (challenge) => {
    if (!videoRef.current || !isModelLoaded) return;
    
    try {
      // Get detection based on challenge type
      let detection = null;
      
      if (models.faceModel && (challenge === CHALLENGE_TYPE.SMILE || 
          challenge === CHALLENGE_TYPE.BLINK || 
          challenge === CHALLENGE_TYPE.NOD || 
          challenge === CHALLENGE_TYPE.TURN_HEAD)) {
        // Face detection challenges
        detection = await models.faceModel.estimateFaces({
          input: videoRef.current,
          returnTensors: false,
          flipHorizontal: false,
          predictIrises: true
        });
      } else if (models.poseModel && (challenge === CHALLENGE_TYPE.RAISE_HAND)) {
        // Pose detection challenges
        detection = await models.poseModel.estimatePoses(videoRef.current, {
          flipHorizontal: false,
          maxPoses: 1
        });
      }
      
      // Process detection result based on challenge
      if (detection && (Array.isArray(detection) ? detection.length > 0 : true)) {
        const result = processDetection(challenge, detection);
        
        // Update progress if challenge is being completed
        if (result.detected) {
          setChallengeProgress(prev => {
            const newProgress = Math.min(prev + 0.1, 1);
            
            // If challenge is completed
            if (newProgress >= 1) {
              // Move to next challenge
              challengeIndexRef.current++;
              
              // Small delay before starting next challenge
              setTimeout(() => {
                setVerificationState(VERIFICATION_STATE.CHALLENGE_COMPLETED);
                
                setTimeout(() => {
                  startNextChallenge();
                }, 1000);
              }, 500);
              
              return 1;
            }
            
            return newProgress;
          });
        }
        
        // Add to detection history
        detectionHistoryRef.current.push({
          timestamp: Date.now(),
          challenge,
          detected: result.detected,
          confidence: result.confidence,
          data: result.data
        });
        
        // Keep history at a reasonable size
        if (detectionHistoryRef.current.length > 100) {
          detectionHistoryRef.current.shift();
        }
      }
      
      // Continue processing frames if verification is still active
      if (verificationState === VERIFICATION_STATE.CHALLENGE_ACTIVE) {
        animationFrameRef.current = requestAnimationFrame(() => processFrames(challenge));
      }
    } catch (err) {
      console.error('Frame processing error:', err);
      setError(`Error during verification: ${err.message}`);
    }
  }, [isModelLoaded, models, verificationState, processDetection, startNextChallenge]);
  
  // Process detection results based on challenge type
  const processDetection = useCallback((challenge, detection) => {
    let detected = false;
    let confidence = 0;
    let data = null;
    
    switch (challenge) {
      case CHALLENGE_TYPE.SMILE:
        if (Array.isArray(detection) && detection.length > 0) {
          // Calculate smile confidence based on mouth landmarks
          // This is a simplified implementation - real one would be more sophisticated
          const face = detection[0];
          const mouthWidth = calculateMouthWidth(face);
          const eyeDistance = calculateEyeDistance(face);
          
          // Smile ratio = mouth width relative to eye distance
          const smileRatio = mouthWidth / eyeDistance;
          confidence = Math.min(Math.max((smileRatio - 0.5) * 2, 0), 1);
          detected = confidence > requiredConfidence;
          data = { smileRatio, confidence };
        }
        break;
        
      case CHALLENGE_TYPE.BLINK:
        if (Array.isArray(detection) && detection.length > 0) {
          // Calculate blink confidence based on eye landmarks
          const face = detection[0];
          const eyeAspectRatio = calculateEyeAspectRatio(face);
          
          // Lower ratio = more closed eyes
          confidence = Math.min(Math.max(1 - eyeAspectRatio * 3, 0), 1);
          detected = confidence > requiredConfidence;
          data = { eyeAspectRatio, confidence };
        }
        break;
        
      case CHALLENGE_TYPE.NOD:
        // Would need to track face position over time
        // Simplified version just for the example
        if (Array.isArray(detection) && detection.length > 0) {
          // Check recent history for vertical head movement
          const recentDetections = detectionHistoryRef.current.slice(-15);
          if (recentDetections.length >= 10) {
            const verticalMovements = calculateVerticalMovements(recentDetections);
            confidence = Math.min(verticalMovements / 3, 1);
            detected = confidence > requiredConfidence;
            data = { verticalMovements, confidence };
          }
        }
        break;
        
      case CHALLENGE_TYPE.RAISE_HAND:
        if (Array.isArray(detection) && detection.length > 0) {
          const pose = detection[0];
          const handRaised = isHandRaised(pose);
          confidence = handRaised ? 1 : 0;
          detected = handRaised;
          data = { handRaised };
        }
        break;
        
      // Other challenge types would be implemented similarly
      
      default:
        // Unknown challenge type
        console.warn(`Unknown challenge type: ${challenge}`);
    }
    
    return { detected, confidence, data };
  }, [requiredConfidence]);
  
  // Helper functions for detection processing
  function calculateMouthWidth(face) {
    // Simplified - would use actual landmarks from face detection
    return 0.5; // Placeholder
  }
  
  function calculateEyeDistance(face) {
    // Simplified - would use actual landmarks from face detection
    return 0.3; // Placeholder
  }
  
  function calculateEyeAspectRatio(face) {
    // Simplified - would use actual landmarks from face detection
    return 0.3; // Placeholder
  }
  
  function calculateVerticalMovements(detections) {
    // Simplified - would analyze vertical movements in detection history
    return 2; // Placeholder 
  }
  
  function isHandRaised(pose) {
    // Simplified - would check if wrist is above shoulder
    return false; // Placeholder
  }
  
  // Complete the verification process
  const completeVerification = useCallback((success = true) => {
    // Cancel any ongoing processes
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Set verification result
    const result = {
      success,
      sessionId,
      completedAt: new Date().toISOString(),
      challenges: challengeSequence.slice(0, challengeIndexRef.current),
      detectionHistory: detectionHistoryRef.current
    };
    
    setVerificationResult(result);
    setVerificationState(success ? VERIFICATION_STATE.VERIFIED : VERIFICATION_STATE.FAILED);
    
    // Stop camera after a short delay
    setTimeout(() => {
      stopCamera();
    }, 1000);
    
    return result;
  }, [sessionId, challengeSequence, stopCamera]);
  
  // Reset verification to idle state
  const resetVerification = useCallback(() => {
    // Cancel any ongoing processes
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset state
    setVerificationState(VERIFICATION_STATE.IDLE);
    setCurrentChallenge(null);
    setChallengeProgress(0);
    setVerificationResult(null);
    setError(null);
    challengeIndexRef.current = 0;
    detectionHistoryRef.current = [];
    
    // Stop camera
    stopCamera();
  }, [stopCamera]);
  
  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      loadModels().then(success => {
        if (success) {
          startVerification();
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      stopCamera();
    };
  }, [autoStart, loadModels, startVerification, stopCamera]);
  
  return {
    videoRef,
    verificationState,
    isModelLoaded,
    error,
    currentChallenge,
    challengeProgress,
    verificationResult,
    sessionId,
    loadModels,
    startVerification,
    cancelVerification,
    completeVerification,
    resetVerification,
    VERIFICATION_STATE,
    CHALLENGE_TYPE
  };
}

export default usePersonhoodVerification;
