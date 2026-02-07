/**
 * BiometricCapture - Simplified biometric capture component
 * Base Model 1 workspace integration
 */
import React, { useState, useRef, useEffect } from 'react';

const BiometricCapture = ({ panelId, title, type }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureQuality, setCaptureQuality] = useState(0);
  const [status, setStatus] = useState('ready');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCapture = async () => {
    try {
      setStatus('starting');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        setStatus('capturing');
        console.log('✅ Biometric capture started');
      }
    } catch (error) {
      console.error('❌ Failed to start biometric capture:', error);
      setStatus('error');
    }
  };

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setStatus('ready');
    console.log('🛑 Biometric capture stopped');
  };

  const captureFrame = () => {
    if (!videoRef.current || !isCapturing) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    
    context.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Simulate quality analysis
    const quality = Math.random() * 100;
    setCaptureQuality(quality);
    
    console.log('📸 Frame captured, quality:', quality.toFixed(1));
    return imageData;
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCapture();
      }
    };
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#ffffff' }}>
          {title || 'Biometric Capture'}
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Camera-based biometric authentication system
        </p>
      </div>

      {/* Video Preview */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#1a1a1a', 
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '12px',
        position: 'relative'
      }}>
        {isCapturing ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Camera preview
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {!isCapturing ? (
          <button
            onClick={startCapture}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Start Capture
          </button>
        ) : (
          <>
            <button
              onClick={captureFrame}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Capture Frame
            </button>
            <button
              onClick={stopCapture}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Status */}
      <div style={{ 
        padding: '8px 12px', 
        backgroundColor: 'rgba(45, 45, 45, 0.5)',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '4px' }}>
          Status: <span style={{ color: status === 'capturing' ? '#10b981' : '#6b7280' }}>
            {status}
          </span>
        </div>
        {captureQuality > 0 && (
          <div>
            Quality: <span style={{ color: captureQuality > 70 ? '#10b981' : '#f59e0b' }}>
              {captureQuality.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiometricCapture; 