import React, { useState, useEffect } from 'react';
import { apiPost, apiGet } from '../../services/apiClient';
import './HotspotCheckinModal.css';

const PROXIMITY_METHODS = {
  BLUETOOTH: 'bluetooth',
  WIFI_AWARE: 'wifi_aware',
  QR_SCAN: 'qr_scan',
  NFC: 'nfc'
};

export function HotspotCheckinModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userLocation = null 
}) {
  const [step, setStep] = useState('hotspot_search');
  const [nearbyHotspots, setNearbyHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [checkinSession, setCheckinSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proximityMethod, setProximityMethod] = useState(null);
  const [dwellTimer, setDwellTimer] = useState(null);

  useEffect(() => {
    if (isOpen) {
      findNearbyHotspots();
    }
  }, [isOpen, userLocation]);

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (dwellTimer) {
        clearInterval(dwellTimer);
      }
    };
  }, [dwellTimer]);

  const findNearbyHotspots = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiGet('/api/hotspots/nearby', {
        lat: userLocation?.lat || 0,
        lng: userLocation?.lng || 0,
        radius: 10 // 10km radius
      });

      if (response.success) {
        setNearbyHotspots(response.data.hotspots || []);
      } else {
        setError('Failed to find nearby hotspots');
      }
    } catch (err) {
      setError(err.message || 'Failed to find nearby hotspots');
    } finally {
      setIsLoading(false);
    }
  };

  const selectHotspot = (hotspot) => {
    setSelectedHotspot(hotspot);
    setStep('proximity_detection');
  };

  const detectProximity = async (method) => {
    try {
      setIsLoading(true);
      setError(null);
      setProximityMethod(method);

      let proximityData;

      switch (method) {
        case PROXIMITY_METHODS.BLUETOOTH:
          proximityData = await detectBluetoothProximity();
          break;
        case PROXIMITY_METHODS.QR_SCAN:
          proximityData = await scanQRCode();
          break;
        case PROXIMITY_METHODS.WIFI_AWARE:
          proximityData = await detectWifiAware();
          break;
        case PROXIMITY_METHODS.NFC:
          proximityData = await detectNFC();
          break;
        default:
          throw new Error('Invalid proximity method');
      }

      if (proximityData.success) {
        await initiateCheckin(proximityData);
      } else {
        setError('Proximity detection failed. Please get closer to the hotspot.');
      }
    } catch (err) {
      setError(err.message || 'Proximity detection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const detectBluetoothProximity = async () => {
    // Simulate Bluetooth proximity detection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          method: PROXIMITY_METHODS.BLUETOOTH,
          rssi: -65, // Simulated signal strength
          bluetoothSignal: 'hotspot_beacon_' + selectedHotspot.id
        });
      }, 2000);
    });
  };

  const scanQRCode = async () => {
    // In real implementation, this would open camera for QR scanning
    // For demo, simulate QR scan
    return new Promise((resolve) => {
      setTimeout(() => {
        const qrData = JSON.stringify({
          hotspotId: selectedHotspot.id,
          timestamp: Date.now()
        });
        resolve({
          success: true,
          method: PROXIMITY_METHODS.QR_SCAN,
          qrData
        });
      }, 1500);
    });
  };

  const detectWifiAware = async () => {
    // Simulate WiFi Aware proximity detection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          method: PROXIMITY_METHODS.WIFI_AWARE,
          wifiAwareDistance: 3.2 // meters
        });
      }, 2500);
    });
  };

  const detectNFC = async () => {
    // Simulate NFC detection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          method: PROXIMITY_METHODS.NFC,
          nfcTag: selectedHotspot.publicKey
        });
      }, 1000);
    });
  };

  const initiateCheckin = async (proximityData) => {
    try {
      const response = await apiPost('/api/hotspots/initiate-checkin', {
        hotspotId: selectedHotspot.id,
        proximityData
      });

      if (response.success) {
        setCheckinSession(response.data);
        setStep('dwell_time');
        startDwellTimer();
      } else {
        setError(response.message || 'Failed to initiate check-in');
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate check-in');
    }
  };

  const startDwellTimer = () => {
    let remainingTime = 30; // 30 seconds minimum dwell time
    
    const timer = setInterval(() => {
      remainingTime--;
      
      if (remainingTime <= 0) {
        clearInterval(timer);
        setStep('biometric_verification');
      }
    }, 1000);

    setDwellTimer(timer);
  };

  const completeBiometricVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate biometric capture
      const biometricData = await captureBiometric();

      const response = await apiPost('/api/hotspots/complete-biometric', {
        sessionId: checkinSession.sessionId,
        biometricData
      });

      if (response.success) {
        if (response.data.success) {
          setStep('success');
          onSuccess(response.data);
        } else {
          setError(response.data.message || 'Please stay near the hotspot longer');
        }
      } else {
        setError(response.message || 'Biometric verification failed');
      }
    } catch (err) {
      setError(err.message || 'Biometric verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const captureBiometric = async () => {
    // Simulate biometric capture (face scan, etc.)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          hash: 'bio_' + Math.random().toString(36).substring(2, 15),
          timestamp: Date.now()
        });
      }, 2000);
    });
  };

  const renderHotspotSearch = () => (
    <div className="checkin-step hotspot-search">
      <h3>Find Community Hotspot</h3>
      <p>Select a nearby community hotspot for verification</p>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Searching for nearby hotspots...</p>
        </div>
      ) : (
        <>
          {nearbyHotspots.length === 0 ? (
            <div className="no-hotspots">
              <div className="no-hotspots-icon">🏢</div>
              <h4>No Hotspots Nearby</h4>
              <p>No community hotspots found within 10km of your location.</p>
              <button onClick={findNearbyHotspots} className="retry-button">
                Retry Search
              </button>
            </div>
          ) : (
            <div className="hotspots-list">
              {nearbyHotspots.map((hotspot) => (
                <div 
                  key={hotspot.id} 
                  className="hotspot-item"
                  onClick={() => selectHotspot(hotspot)}
                >
                  <div className="hotspot-info">
                    <div className="hotspot-name">
                      {hotspot.type === 'community_center' ? '🏢' : '📱'} 
                      {hotspot.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="hotspot-details">
                      <span className="distance">{hotspot.distance.toFixed(1)}km away</span>
                      <span className="trust-level">Trust: {hotspot.trustLevel}</span>
                      <span className="checkins">{hotspot.totalCheckins} check-ins</span>
                    </div>
                  </div>
                  <div className="hotspot-methods">
                    {hotspot.capabilities.map(method => (
                      <span key={method} className={`method-badge ${method}`}>
                        {method.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderProximityDetection = () => (
    <div className="checkin-step proximity-detection">
      <h3>Proximity Verification</h3>
      <p>Get close to the hotspot and select a verification method</p>

      <div className="selected-hotspot">
        <div className="hotspot-card">
          <div className="hotspot-type">
            {selectedHotspot.type === 'community_center' ? '🏢' : '📱'}
          </div>
          <div className="hotspot-info">
            <div className="hotspot-name">{selectedHotspot.type.replace('_', ' ').toUpperCase()}</div>
            <div className="hotspot-distance">{selectedHotspot.distance.toFixed(1)}km away</div>
          </div>
        </div>
      </div>

      <div className="proximity-methods">
        {selectedHotspot.capabilities.map((method) => (
          <button
            key={method}
            onClick={() => detectProximity(method)}
            disabled={isLoading}
            className={`proximity-method ${method}`}
          >
            <div className="method-icon">
              {method === 'bluetooth' && '🔵'}
              {method === 'qr_scan' && '📱'}
              {method === 'wifi_aware' && '📶'}
              {method === 'nfc' && '📡'}
            </div>
            <div className="method-info">
              <div className="method-name">{method.replace('_', ' ').toUpperCase()}</div>
              <div className="method-description">
                {method === 'bluetooth' && 'Automatic detection via Bluetooth'}
                {method === 'qr_scan' && 'Scan QR code displayed at hotspot'}
                {method === 'wifi_aware' && 'WiFi proximity detection'}
                {method === 'nfc' && 'Tap your device to the NFC tag'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="proximity-scanning">
          <div className="scanning-animation">
            <div className="scan-pulse"></div>
          </div>
          <p>Detecting proximity via {proximityMethod?.replace('_', ' ')}...</p>
        </div>
      )}
    </div>
  );

  const renderDwellTime = () => (
    <div className="checkin-step dwell-time">
      <h3>Stay Near Hotspot</h3>
      <p>Please remain close to the hotspot for security verification</p>

      <div className="dwell-timer">
        <div className="timer-circle">
          <div className="timer-icon">⏱️</div>
        </div>
        <p>Verification in progress...</p>
        <div className="timer-note">Stay within 5 meters of the hotspot</div>
      </div>

      <div className="verification-info">
        <div className="info-item">
          <span className="info-label">Method:</span>
          <span className="info-value">{proximityMethod?.replace('_', ' ')}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Hotspot:</span>
          <span className="info-value">{selectedHotspot?.type?.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );

  const renderBiometricVerification = () => (
    <div className="checkin-step biometric-verification">
      <h3>Biometric Verification</h3>
      <p>Complete your identity verification with a biometric scan</p>

      <div className="biometric-scanner">
        <div className="scanner-frame">
          <div className="scanner-icon">👤</div>
        </div>
        <p>Position your face in the frame and tap to scan</p>
      </div>

      <button
        onClick={completeBiometricVerification}
        disabled={isLoading}
        className="biometric-button"
      >
        {isLoading ? 'Scanning...' : 'Start Biometric Scan'}
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="checkin-step success">
      <div className="success-animation">
        <div className="success-icon">✅</div>
      </div>
      <h3>Check-in Successful!</h3>
      <p>Your community hotspot verification is complete</p>

      <div className="success-details">
        <div className="detail-item">
          <span className="detail-label">Trust Points Earned:</span>
          <span className="detail-value">+15</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Verification Method:</span>
          <span className="detail-value">{proximityMethod?.replace('_', ' ')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Hotspot Type:</span>
          <span className="detail-value">{selectedHotspot?.type?.replace('_', ' ')}</span>
        </div>
      </div>

      <button onClick={onClose} className="close-button">
        Complete
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="hotspot-checkin-overlay">
      <div className="hotspot-checkin-modal">
        <div className="modal-header">
          <h2>Community Hotspot Check-in</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {step === 'hotspot_search' && renderHotspotSearch()}
          {step === 'proximity_detection' && renderProximityDetection()}
          {step === 'dwell_time' && renderDwellTime()}
          {step === 'biometric_verification' && renderBiometricVerification()}
          {step === 'success' && renderSuccess()}
        </div>

        <div className="modal-progress">
          <div className="progress-steps">
            <div className={`step ${step === 'hotspot_search' ? 'active' : step !== 'hotspot_search' ? 'completed' : ''}`}>
              Find Hotspot
            </div>
            <div className={`step ${step === 'proximity_detection' ? 'active' : ['dwell_time', 'biometric_verification', 'success'].includes(step) ? 'completed' : ''}`}>
              Proximity
            </div>
            <div className={`step ${step === 'dwell_time' ? 'active' : ['biometric_verification', 'success'].includes(step) ? 'completed' : ''}`}>
              Dwell Time
            </div>
            <div className={`step ${step === 'biometric_verification' ? 'active' : step === 'success' ? 'completed' : ''}`}>
              Biometric
            </div>
            <div className={`step ${step === 'success' ? 'active' : ''}`}>
              Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotspotCheckinModal;
