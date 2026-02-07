// frontend/components/biometrics/BiometricCapture.jsx
import React, { useState, useRef, useEffect } from 'react';

function BiometricCapture({ onCapture, onError, instructions }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureQuality, setCaptureQuality] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
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
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
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
  
  const startCapture = () => {
    setIsCapturing(true);
  };
  
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Calculate simple quality metric
    const qualityScore = calculateQuality(context, canvas.width, canvas.height);
    setCaptureQuality(qualityScore);
    
    // Pass data to parent component
    onCapture && onCapture({ 
      imageData, 
      quality: qualityScore,
      timestamp: Date.now()
    });
    
    // Stop capture
    setIsCapturing(false);
  };
  
  const calculateQuality = (context, width, height) => {
    // This is a placeholder for a real quality calculation algorithm
    return 0.7 + Math.random() * 0.3;
  };
  
  return (
    <div className="biometric-capture">
      <div className="video-container">
        {isCapturing ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="biometric-video"
            />
            <div className="capture-overlay">
              <div className="face-guide"></div>
            </div>
            <div className="instructions">
              {instructions || 'Look directly at the camera and keep your face centered'}
            </div>
          </>
        ) : (
          <div className="capture-placeholder">
            <div className="placeholder-icon">í³·</div>
            <p>Camera access required for biometric verification</p>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="controls">
        {!isCapturing ? (
          <button onClick={startCapture} className="btn btn-primary">Start Camera</button>
        ) : (
          <button onClick={captureFrame} className="btn btn-success">Capture</button>
        )}
      </div>
      
      {captureQuality > 0 && (
        <div className="quality-indicator">
          <div className="quality-bar" style={{ width: `${captureQuality * 100}%` }}></div>
          <span>Quality: {Math.round(captureQuality * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export default BiometricCapture;

