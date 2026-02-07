/**
 * BASE MODEL 1 - Biometric Capture Component
 * Integrated camera-based biometric capture system
 */
import React, { useState, useRef, useEffect } from 'react';
import './BiometricCapture.css';

const BiometricCapture = ({ onCapture, onError, instructions, panel, globeState, setGlobeState }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureQuality, setCaptureQuality] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Debug log to confirm component is loaded
  useEffect(() => {
    console.log('✅ BiometricCapture loaded and integrated!');
  }, []);
  
  useEffect(() => {
    let stream = null;
    
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
        onError && onError('Could not access camera. Please check permissions.');
      }
    }
    
    if (isCapturing) {
      setupCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCapturing, onError]);

  // Simulate quality analysis
  useEffect(() => {
    if (isCapturing && hasPermission) {
      const interval = setInterval(() => {
        const quality = Math.random() * 100;
        setCaptureQuality(quality);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isCapturing, hasPermission]);
  
  const startCapture = () => {
    setIsCapturing(true);
  };
  
  const stopCapture = () => {
    setIsCapturing(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };
  
  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    setIsAnalyzing(true);
    
    // Simulate biometric analysis
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const mockBiometricData = {
        imageData,
        quality: captureQuality,
        timestamp: Date.now(),
        features: {
          faceDetected: true,
          eyesOpen: true,
          goodLighting: captureQuality > 70
        }
      };
      
      setIsAnalyzing(false);
      onCapture && onCapture(mockBiometricData);
    }, 2000);
  };

  const getQualityColor = () => {
    if (captureQuality > 80) return '#10b981'; // green
    if (captureQuality > 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getQualityText = () => {
    if (captureQuality > 80) return 'Excellent';
    if (captureQuality > 60) return 'Good';
    if (captureQuality > 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="biometric-capture">
      <div className="integration-status">
        <h4>✅ Biometric Capture Integrated!</h4>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Camera-based biometric capture system ready for use
        </p>
      </div>
      
      <div className="capture-header">
        <h3>Biometric Capture</h3>
        <div className="status-indicator">
          {hasPermission === null && <span className="status pending">Checking permissions...</span>}
          {hasPermission === false && <span className="status error">Camera access denied</span>}
          {hasPermission === true && !isCapturing && <span className="status ready">Ready to capture</span>}
          {isCapturing && <span className="status active">Camera active</span>}
        </div>
      </div>

      {instructions && (
        <div className="instructions">
          <p>{instructions}</p>
        </div>
      )}

      <div className="capture-area">
        {hasPermission === false ? (
          <div className="error-state">
            <div className="error-icon">📷</div>
            <p>Camera access is required for biometric capture</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Retry Permission
            </button>
          </div>
        ) : (
          <>
            <div className="video-container">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="capture-video"
                style={{ display: isCapturing ? 'block' : 'none' }}
              />
              {!isCapturing && (
                <div className="placeholder">
                  <div className="camera-icon">📷</div>
                  <p>Click "Start Capture" to begin</p>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {isCapturing && (
              <div className="quality-indicator">
                <div className="quality-bar">
                  <div 
                    className="quality-fill"
                    style={{
                      width: `${captureQuality}%`,
                      backgroundColor: getQualityColor()
                    }}
                  />
                </div>
                <span className="quality-text" style={{ color: getQualityColor() }}>
                  Quality: {getQualityText()} ({Math.round(captureQuality)}%)
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="capture-controls">
        {!isCapturing ? (
          <button 
            onClick={startCapture} 
            disabled={hasPermission !== true}
            className="start-btn"
          >
            Start Capture
          </button>
        ) : (
          <div className="active-controls">
            <button 
              onClick={captureFrame} 
              disabled={isAnalyzing || captureQuality < 50}
              className="capture-btn"
            >
              {isAnalyzing ? 'Analyzing...' : 'Capture Biometric'}
            </button>
            <button onClick={stopCapture} className="stop-btn">
              Stop Camera
            </button>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="analyzing-overlay">
          <div className="spinner"></div>
          <p>Processing biometric data...</p>
        </div>
      )}
    </div>
  );
};

export default BiometricCapture;
