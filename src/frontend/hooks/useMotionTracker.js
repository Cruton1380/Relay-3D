import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadFaceModel,
  detectFacialLandmarks,
  detectBodyPose,
  detectGestures,
  detectBodyGestures,
  generateFaceFeatureHash,
  generatePoseFeatureHash,
  cleanup
} from '../utils/ml/motionTracker';

/**
 * React hook for facial and body motion tracking
 * @param {Object} options - Configuration options
 * @returns {Object} Motion tracking state and controls
 */
export function useMotionTracker({
  enabled = false,
  trackFace = true,
  trackBody = false,
  interval = 100,
  requiredGestures = []
} = {}) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [landmarks, setLandmarks] = useState(null);
  const [pose, setPose] = useState(null);
  const [detectedGestures, setDetectedGestures] = useState({});
  const [gestureHistory, setGestureHistory] = useState([]);
  const [featureHash, setFeatureHash] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const prevDataRef = useRef({ landmarks: null, pose: null });
  
  // Load face detection model
  useEffect(() => {
    if (!enabled) return;
    
    const loadModels = async () => {
      try {
        if (trackFace) {
          await loadFaceModel();
        }
        
        setIsModelLoaded(true);
        setError(null);
      } catch (err) {
        setError(`Failed to load models: ${err.message}`);
        setIsModelLoaded(false);
      }
    };
    
    loadModels();
    
    return () => {
      cleanup();
      setIsModelLoaded(false);
    };
  }, [enabled, trackFace, trackBody]);
  
  // Start camera
  const startCamera = useCallback(async () => {
    if (!isModelLoaded || streamRef.current) return;
    
    try {
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
        await videoRef.current.play();
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError(`Camera access error: ${err.message}`);
      return false;
    }
  }, [isModelLoaded]);
  
  // Stop tracking and camera
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsTracking(false);
    setLandmarks(null);
    setPose(null);
    prevDataRef.current = { landmarks: null, pose: null };
  }, []);
  
  // Start tracking
  const startTracking = useCallback(async () => {
    if (isTracking || !isModelLoaded) return;
    
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;
    
    setIsTracking(true);
    setGestureHistory([]);
    
    // Function to track motion in a frame
    const trackMotion = async () => {
      if (!videoRef.current || !streamRef.current) return;
      
      try {
        // Track face if enabled
        if (trackFace) {
          const faceLandmarks = await detectFacialLandmarks(videoRef.current);
          
          if (faceLandmarks) {
            setLandmarks(faceLandmarks);
            
            // Detect facial gestures
            const gestures = detectGestures(faceLandmarks, prevDataRef.current.landmarks);
            
            // Update gesture state
            setDetectedGestures(prev => ({
              ...prev,
              ...gestures
            }));
            
            // Generate face feature hash if not already set
            if (!featureHash && trackFace) {
              const hash = generateFaceFeatureHash(faceLandmarks);
              if (hash) {
                setFeatureHash(hash);
              }
            }
            
            // Store landmarks for next frame
            prevDataRef.current.landmarks = faceLandmarks;
          }
        }
        
        // Track body if enabled
        if (trackBody) {
          const bodyPose = await detectBodyPose(videoRef.current);
          
          if (bodyPose) {
            setPose(bodyPose);
            
            // Detect body gestures
            const bodyGestures = detectBodyGestures(bodyPose, prevDataRef.current.pose);
            
            // Update gesture state
            setDetectedGestures(prev => ({
              ...prev,
              ...bodyGestures
            }));
            
            // Generate pose feature hash if not already set and no face hash
            if (!featureHash && trackBody) {
              const hash = generatePoseFeatureHash(bodyPose);
              if (hash) {
                setFeatureHash(hash);
              }
            }
            
            // Store pose for next frame
            prevDataRef.current.pose = bodyPose;
          }
        }
        
        // Update gesture history if any gesture is detected
        const activeGestures = Object.entries(detectedGestures)
          .filter(([name, detected]) => detected && name !== 'headPose')
          .map(([name]) => name);
          
        if (activeGestures.length > 0) {
          setGestureHistory(prev => [
            ...prev, 
            { 
              gestures: activeGestures,
              timestamp: Date.now()
            }
          ]);
        }
      } catch (err) {
        console.error('Error in motion tracking:', err);
      }
    };
    
    // Set up tracking interval
    trackingIntervalRef.current = setInterval(trackMotion, interval);
    
    return () => stopTracking();
  }, [isTracking, isModelLoaded, trackFace, trackBody, featureHash, interval, startCamera, stopTracking]);
  
  // Check if required gestures have been completed
  const areRequiredGesturesComplete = useCallback(() => {
    if (!requiredGestures || requiredGestures.length === 0) {
      return true;
    }
    
    // Get unique gestures detected in history
    const detectedGestureSet = new Set();
    gestureHistory.forEach(entry => {
      entry.gestures.forEach(gesture => detectedGestureSet.add(gesture));
    });
    
    // Check if all required gestures have been detected
    return requiredGestures.every(gesture => detectedGestureSet.has(gesture));
  }, [gestureHistory, requiredGestures]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      cleanup();
    };
  }, [stopTracking]);
  
  return {
    videoRef,
    isModelLoaded,
    isTracking,
    error,
    landmarks,
    pose,
    detectedGestures,
    gestureHistory,
    featureHash,
    startTracking,
    stopTracking,
    areRequiredGesturesComplete
  };
}

export default useMotionTracker;
