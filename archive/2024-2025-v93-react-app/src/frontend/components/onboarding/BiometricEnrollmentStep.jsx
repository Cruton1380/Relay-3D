import React, { useState, useRef, useEffect } from 'react';
import { useCameraManager } from '../../hooks/useCameraManager';
import { apiPost } from '../../services/apiClient';

export function BiometricEnrollmentStep({ onEnrolled }) {
  const { videoRef, isActive, startCamera, stopCamera, takeSnapshot } = useCameraManager();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  
  // Start camera when component mounts
  useEffect(() => {
    const initCamera = async () => {
      try {
        await startCamera();
      } catch (err) {
        setError(`Camera access failed: ${err.message}`);
      }
    };
    
    initCamera();
    
    // Cleanup when component unmounts
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);
  
  const captureSnapshot = () => {
    if (!isActive) {
      setError('Camera is not active');
      return;
    }
    
    const snapshot = takeSnapshot();
    setCapturedImage(snapshot);
  };
  
  const resetCapture = () => {
    setCapturedImage(null);
    setError(null);
  };
  
  const handleEnroll = async () => {
    if (!capturedImage) {
      setError('Please capture an image first');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setEnrollmentProgress(25);
      
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('biometricData', blob, 'enrollment.jpg');
      
      setEnrollmentProgress(50);
      
      // Send to server
      const result = await apiPost('/onboarding/verifyBiometrics', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setEnrollmentProgress(75);
      
      if (result.success) {
        setEnrollmentProgress(100);
        setTimeout(() => {
          onEnrolled(result.biometricId);
        }, 500);
      } else {
        setError(result.message || 'Biometric enrollment failed');
        setEnrollmentProgress(0);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during enrollment');
      setEnrollmentProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="biometric-enrollment-step">
      <h2>Biometric Enrollment</h2>
      <p>We need to capture your face to create a secure biometric template.</p>
      
      <div className="camera-container">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={isActive ? 'active' : ''}
            />
            <div className="camera-overlay">
              <div className="face-guide"></div>
            </div>
          </>
        ) : (
          <div className="captured-image">
            <img src={capturedImage} alt="Captured" />
          </div>
        )}
      </div>
      
      {enrollmentProgress > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-indicator"
            style={{ width: `${enrollmentProgress}%` }}
          />
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="button-group">
        {!capturedImage ? (
          <button
            onClick={captureSnapshot}
            disabled={!isActive || isProcessing}
            className="capture-button"
          >
            Capture Image
          </button>
        ) : (
          <>
            <button
              onClick={resetCapture}
              disabled={isProcessing}
              className="reset-button"
            >
              Retake
            </button>
            <button
              onClick={handleEnroll}
              disabled={isProcessing}
              className="enroll-button"
            >
              {isProcessing ? 'Processing...' : 'Continue with this Photo'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default BiometricEnrollmentStep;
