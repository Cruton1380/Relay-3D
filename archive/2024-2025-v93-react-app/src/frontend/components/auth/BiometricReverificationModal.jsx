import React, { useState, useEffect, useRef } from 'react';
import { useCameraManager } from '../../hooks/useCameraManager';
import { useAuth } from '../../hooks/useAuth.jsx';
import { api } from '../../services/apiClient';

export function BiometricReverificationModal({ onSuccess, onCancel }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const { videoRef, isActive, startCamera, stopCamera, takeSnapshot } = useCameraManager();
  const { updateAuthStatus } = useAuth();
  
  useEffect(() => {
    const initCamera = async () => {
      try {
        await startCamera();
        setProgress(25); // Camera started successfully
      } catch (err) {
        setError(`Camera access failed: ${err.message}`);
      }
    };
    
    initCamera();
    
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);
  
  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      setProgress(50); // Starting verification
      
      const snapshot = takeSnapshot();
      if (!snapshot) {
        throw new Error('Failed to capture image');
      }
      
      // Convert data URL to blob
      const blob = await fetch(snapshot).then(r => r.blob());
      
      // Create form data
      const formData = new FormData();
      formData.append('biometricData', blob, 'verification.jpg');
      
      setProgress(75); // Sending verification data
      
      // Send to backend
      const response = await api.post('/api/biometrics/reverify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setProgress(100); // Verification complete
        updateAuthStatus({ authLevel: 'elevated' });
        
        // Delay success to show completion
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setError('Biometric verification failed. Please try again.');
      }
    } catch (err) {
      setError(`Verification error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="biometric-reverification-modal">
      <h2>Verify Your Identity</h2>
      <p>Your session requires biometric verification to continue.</p>
      
      <div className="video-container">
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={isActive ? 'active' : ''}
        />
      </div>
      
      {progress > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-indicator"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="button-group">
        <button
          onClick={onCancel}
          className="cancel-button"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="verify-button"
          disabled={!isActive || isProcessing}
        >
          {isProcessing ? 'Verifying...' : 'Verify Identity'}
        </button>
      </div>
    </div>
  );
}

export default BiometricReverificationModal;
