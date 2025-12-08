/**
 * Camera Manager React Hook
 * Provides camera access, snapshot capabilities, and device management
 * Migrated from frontend/js/cameraManager.mjs
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getOptimalCameraConstraints } from '../utils/deviceUtils';

export function useCameraManager(options = {}) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [captureInProgress, setCaptureInProgress] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Check for camera permissions
  const checkPermissions = useCallback(async () => {
    try {
      // Try to access camera to check permissions
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If we get here, permission is granted
      setIsPermissionGranted(true);
      
      // Clean up the temporary stream
      tempStream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setIsPermissionGranted(false);
      } else {
        setIsPermissionGranted(null); // Unknown state
      }
      
      setError(err.message || 'Camera permission denied');
      return false;
    }
  }, []);
  
  // Get available camera devices
  const getAvailableCameras = useCallback(async () => {
    try {
      // First ensure we have permissions
      const hasPermission = isPermissionGranted || await checkPermissions();
      if (!hasPermission) return [];
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setAvailableCameras(videoDevices);
      return videoDevices;
    } catch (err) {
      console.error('Error getting camera devices:', err);
      setError('Failed to get camera devices');
      setAvailableCameras([]);
      return [];
    }
  }, [isPermissionGranted, checkPermissions]);
  
  // Start camera with specific device or constraints
  const startCamera = useCallback(async (deviceId = null) => {
    try {
      let constraints;
      
      if (deviceId) {
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            width: options.width || { ideal: 640 },
            height: options.height || { ideal: 480 }
          },
          audio: !!options.audio
        };
      } else {
        // Use optimal constraints or options
        constraints = options.useOptimalConstraints 
          ? getOptimalCameraConstraints(options.requireHD) 
          : {
              video: {
                facingMode: options.facingMode || 'user',
                width: options.width || { ideal: 640 },
                height: options.height || { ideal: 480 }
              },
              audio: !!options.audio
            };
      }
      
      // Stop any existing streams first
      stopCamera();
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise(resolve => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });
        
        await videoRef.current.play();
      }
      
      // Set the current camera ID
      if (deviceId) {
        setCurrentCameraId(deviceId);
      } else if (mediaStream.getVideoTracks().length > 0) {
        const settings = mediaStream.getVideoTracks()[0].getSettings();
        if (settings.deviceId) {
          setCurrentCameraId(settings.deviceId);
        }
      }
      
      setIsActive(true);
      setIsPermissionGranted(true);
      setError(null);
      
      return mediaStream;
    } catch (err) {
      console.error('Camera start error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setIsPermissionGranted(false);
      }
      
      setError(err.message || 'Could not access camera');
      setIsActive(false);
      return null;
    }
  }, [options, stopCamera]);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);
  
  // Switch cameras (front/back or specific device)
  const switchCamera = useCallback(async (deviceId = null) => {
    // If deviceId is not provided, try to switch between front and back
    if (!deviceId) {
      const cameras = await getAvailableCameras();
      
      if (cameras.length <= 1) {
        setError('No alternative cameras available');
        return false;
      }
      
      // Find the next camera that isn't the current one
      const currentIndex = cameras.findIndex(camera => camera.deviceId === currentCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      deviceId = cameras[nextIndex].deviceId;
    }
    
    try {
      await startCamera(deviceId);
      return true;
    } catch (err) {
      setError(`Failed to switch camera: ${err.message}`);
      return false;
    }
  }, [currentCameraId, getAvailableCameras, startCamera]);
  
  // Take a snapshot from the current video stream
  const takeSnapshot = useCallback((format = 'image/jpeg', quality = 0.9) => {
    if (!isActive || !videoRef.current) {
      setError('Camera is not active');
      return null;
    }
    
    try {
      setCaptureInProgress(true);
      
      // Create canvas if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL(format, quality);
      
      setCaptureInProgress(false);
      return dataUrl;
    } catch (err) {
      console.error('Snapshot error:', err);
      setError(`Failed to take snapshot: ${err.message}`);
      setCaptureInProgress(false);
      return null;
    }
  }, [isActive]);
  
  // Capture a high-quality snapshot with optional flash effect
  const captureHighQualitySnapshot = useCallback(async (options = {}) => {
    const { 
      format = 'image/jpeg', 
      quality = 0.9, 
      flashEffect = true,
      flashDuration = 150 
    } = options;
    
    if (!isActive || !videoRef.current) {
      setError('Camera is not active');
      return null;
    }
    
    try {
      setCaptureInProgress(true);
      
      // Create flash effect if requested
      let flashElement = null;
      
      if (flashEffect) {
        flashElement = document.createElement('div');
        flashElement.style.position = 'fixed';
        flashElement.style.top = '0';
        flashElement.style.left = '0';
        flashElement.style.width = '100%';
        flashElement.style.height = '100%';
        flashElement.style.backgroundColor = 'white';
        flashElement.style.opacity = '0.8';
        flashElement.style.zIndex = '10000';
        flashElement.style.pointerEvents = 'none';
        document.body.appendChild(flashElement);
      }
      
      // Wait a small amount of time to let the flash effect register
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Take the snapshot
      const dataUrl = takeSnapshot(format, quality);
      
      // Remove flash after duration
      if (flashElement) {
        setTimeout(() => {
          document.body.removeChild(flashElement);
        }, flashDuration);
      }
      
      setCaptureInProgress(false);
      return dataUrl;
    } catch (err) {
      console.error('High-quality capture error:', err);
      setError(`Failed to capture image: ${err.message}`);
      setCaptureInProgress(false);
      return null;
    }
  }, [isActive, takeSnapshot]);
  
  // Apply camera constraints (brightness, contrast, etc.)
  const applyConstraints = useCallback(async (constraints = {}) => {
    if (!stream) {
      setError('No active camera stream');
      return false;
    }
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      
      if (!videoTrack) {
        setError('No video track found');
        return false;
      }
      
      await videoTrack.applyConstraints(constraints);
      return true;
    } catch (err) {
      console.error('Apply constraints error:', err);
      setError(`Failed to apply camera constraints: ${err.message}`);
      return false;
    }
  }, [stream]);
  
  // Initialize on mount
  useEffect(() => {
    if (options.autoInit) {
      // Check permissions first
      checkPermissions().then(hasPermission => {
        if (hasPermission && options.startOnInit) {
          startCamera();
        }
        
        // Get available cameras
        getAvailableCameras();
      });
    }
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);
  
  return {
    videoRef,
    stream,
    isActive,
    error,
    isPermissionGranted,
    availableCameras,
    currentCameraId,
    captureInProgress,
    startCamera,
    stopCamera,
    checkPermissions,
    getAvailableCameras,
    switchCamera,
    takeSnapshot,
    captureHighQualitySnapshot,
    applyConstraints
  };
}

export default useCameraManager;

