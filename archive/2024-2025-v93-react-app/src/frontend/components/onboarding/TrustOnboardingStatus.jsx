import React, { useState, useEffect } from 'react';
import { apiPost } from '../../services/apiClient';
import './TrustOnboardingStatus.css';

export function TrustOnboardingStatus({ onCompleted }) {
  const [onboardingStep, setOnboardingStep] = useState('proximity_verification');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proximityData, setProximityData] = useState(null);
  const [deviceBinding, setDeviceBinding] = useState(null);

  useEffect(() => {
    initializeDeviceBinding();
  }, []);

  const initializeDeviceBinding = async () => {
    try {
      setIsLoading(true);
      
      // Generate device fingerprint
      const deviceInfo = await generateDeviceFingerprint();
      
      // Create key pair for this device
      const keyPair = await generateKeyPair();
      
      setDeviceBinding({
        deviceFingerprint: deviceInfo,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey // Store securely in production
      });
      
      setOnboardingStep('proximity_verification');
    } catch (err) {
      setError('Failed to initialize device binding');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDeviceFingerprint = async () => {
    // Generate a device fingerprint based on available browser/device characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
      canvas: canvas.toDataURL().substring(0, 50), // Truncated canvas fingerprint
      timestamp: Date.now()
    };

    return btoa(JSON.stringify(fingerprint));
  };

  const generateKeyPair = async () => {
    // In a real implementation, this would use WebCrypto API
    // For demo purposes, simulate key generation
    const mockPublicKey = 'pub_' + Math.random().toString(36).substring(2, 15);
    const mockPrivateKey = 'priv_' + Math.random().toString(36).substring(2, 15);
    
    return {
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey
    };
  };

  const handleProximityVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate proximity detection (Bluetooth, WiFi Aware, etc.)
      const proximityResult = await detectProximity();
      
      if (proximityResult.success) {
        setProximityData(proximityResult);
        setOnboardingStep('trust_initialization');
      } else {
        setError('Proximity verification failed. Please ensure you are near the inviting user.');
      }
    } catch (err) {
      setError(err.message || 'Proximity verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const detectProximity = async () => {
    // Simulate proximity detection
    // In real implementation, this would use:
    // - Bluetooth Low Energy scanning
    // - WiFi Aware discovery
    // - NFC detection
    // - QR code scanning
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful proximity detection
        resolve({
          success: true,
          method: 'bluetooth',
          signalStrength: -65, // dBm
          inviterDeviceId: 'device_' + Math.random().toString(36).substring(2, 8),
          verificationCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        });
      }, 2000);
    });
  };

  const handleTrustInitialization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize user's trust profile
      const trustProfile = {
        deviceBinding,
        proximityVerification: proximityData,
        initialTrustLevel: 'probationary',
        onboardingMethod: 'proximity_invite'
      };

      // Complete the trust onboarding
      const result = await apiPost('/api/trust/initialize', trustProfile);

      if (result.success) {
        onCompleted(trustProfile);
      } else {
        setError(result.message || 'Trust initialization failed');
      }
    } catch (err) {
      setError(err.message || 'Trust initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProximityVerification = () => (
    <div className="trust-step proximity-verification">
      <div className="step-header">
        <h3>Proximity Verification</h3>
        <p>You must be physically near an existing Relay user to continue</p>
      </div>

      <div className="proximity-instructions">
        <div className="instruction-item">
          <div className="instruction-icon">📱</div>
          <div className="instruction-text">
            <strong>Stay Close</strong><br/>
            Remain within 5 meters of the person who invited you
          </div>
        </div>
        <div className="instruction-item">
          <div className="instruction-icon">🔵</div>
          <div className="instruction-text">
            <strong>Enable Bluetooth</strong><br/>
            Make sure Bluetooth is enabled on your device
          </div>
        </div>
        <div className="instruction-item">
          <div className="instruction-icon">⏱️</div>
          <div className="instruction-text">
            <strong>Time Limit</strong><br/>
            Complete verification within 10 minutes of receiving invite
          </div>
        </div>
      </div>

      <div className="proximity-scanner">
        <div className="scanner-animation">
          <div className="scanner-pulse"></div>
          <div className="scanner-icon">🔍</div>
        </div>
        <p>Scanning for nearby Relay users...</p>
      </div>

      <button 
        onClick={handleProximityVerification}
        disabled={isLoading}
        className="verification-button primary"
      >
        {isLoading ? 'Verifying Proximity...' : 'Start Proximity Verification'}
      </button>
    </div>
  );

  const renderTrustInitialization = () => (
    <div className="trust-step trust-initialization">
      <div className="step-header">
        <h3>Trust Profile Setup</h3>
        <p>Creating your trust profile and device binding</p>
      </div>

      <div className="trust-summary">
        <div className="trust-item">
          <div className="trust-label">Initial Trust Level</div>
          <div className="trust-value probationary">Probationary</div>
        </div>
        <div className="trust-item">
          <div className="trust-label">Device Bound</div>
          <div className="trust-value">{deviceBinding?.deviceFingerprint ? 'Yes' : 'No'}</div>
        </div>
        <div className="trust-item">
          <div className="trust-label">Proximity Verified</div>
          <div className="trust-value">{proximityData?.success ? 'Yes' : 'No'}</div>
        </div>
        <div className="trust-item">
          <div className="trust-label">Verification Method</div>
          <div className="trust-value">{proximityData?.method || 'N/A'}</div>
        </div>
      </div>

      <div className="trust-explanation">
        <h4>Your Trust Journey</h4>
        <div className="trust-tier-info">
          <div className="tier probationary active">
            <div className="tier-name">Probationary</div>
            <div className="tier-description">
              Starting level • Periodic hotspot check-ins required • Limited voting weight
            </div>
          </div>
          <div className="tier trusted">
            <div className="tier-name">Trusted</div>
            <div className="tier-description">
              Earned through activity • Longer verification intervals • Standard voting weight
            </div>
          </div>
          <div className="tier verified">
            <div className="tier-name">Verified</div>
            <div className="tier-description">
              Community validated • Extended trust periods • Enhanced voting weight
            </div>
          </div>
          <div className="tier anchor">
            <div className="tier-name">Anchor</div>
            <div className="tier-description">
              Community leader • Maximum trust • Can validate others
            </div>
          </div>
        </div>
      </div>

      <div className="privacy-notice">
        <h4>Privacy & Trust</h4>
        <ul>
          <li>Your device fingerprint is stored locally and used only for verification</li>
          <li>Trust increases gradually through real community participation</li>
          <li>No behavioral tracking during onboarding - trust is earned over time</li>
          <li>Physical proximity verification ensures real human connections</li>
        </ul>
      </div>

      <button 
        onClick={handleTrustInitialization}
        disabled={isLoading}
        className="verification-button primary"
      >
        {isLoading ? 'Initializing Trust Profile...' : 'Complete Trust Setup'}
      </button>
    </div>
  );

  return (
    <div className="trust-onboarding-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {onboardingStep === 'proximity_verification' && renderProximityVerification()}
      {onboardingStep === 'trust_initialization' && renderTrustInitialization()}

      <div className="step-progress">
        <div className="progress-indicator">
          <div 
            className={`progress-step ${onboardingStep === 'proximity_verification' ? 'active' : 'completed'}`}
          >
            1. Proximity
          </div>
          <div 
            className={`progress-step ${onboardingStep === 'trust_initialization' ? 'active' : ''}`}
          >
            2. Trust Setup
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrustOnboardingStatus;
