import React, { useState } from 'react';
import authoritativeVoteAPI from '../../services/authoritativeVoteAPI';

/**
 * LocationPermissionDialog Component
 * 
 * Handles user location permission request with fallback to manual entry
 * Provides privacy controls and clear explanation of data usage
 */
const LocationPermissionDialog = ({ onLocationObtained, onDismiss }) => {
  const [status, setStatus] = useState('initial'); // initial, requesting, denied, manual
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  
  // Manual entry state
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState('');

  const handleRequestLocation = async () => {
    setStatus('requesting');
    setError(null);

    try {
      const locationData = await authoritativeVoteAPI.getLocationWithGeocoding();
      
      if (locationData) {
        setLocation(locationData);
        setStatus('success');
        
        // Return location to parent component
        if (onLocationObtained) {
          onLocationObtained({
            lat: locationData.lat,
            lng: locationData.lng,
            country: locationData.country,
            province: locationData.province,
            city: locationData.city,
            accuracy: locationData.accuracy
          });
        }
      } else {
        setStatus('denied');
        setError('Location access was denied. You can enter your location manually.');
      }
    } catch (err) {
      setStatus('denied');
      setError(err.message || 'Failed to obtain location');
      console.error('Location request failed:', err);
    }
  };

  const handleManualEntry = () => {
    setManualError('');
    
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      setManualError('Please enter valid numbers for latitude and longitude');
      return;
    }

    if (lat < -90 || lat > 90) {
      setManualError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setManualError('Longitude must be between -180 and 180');
      return;
    }

    // Geocode manual coordinates
    authoritativeVoteAPI.reverseGeocode(lat, lng)
      .then(adminLevels => {
        const locationData = {
          lat,
          lng,
          ...adminLevels,
          manual: true
        };
        
        setLocation(locationData);
        setStatus('success');
        
        if (onLocationObtained) {
          onLocationObtained(locationData);
        }
      })
      .catch(err => {
        setManualError('Failed to geocode coordinates: ' + err.message);
      });
  };

  const handleSkip = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="location-permission-dialog-overlay">
      <div className="location-permission-dialog">
        <div className="dialog-header">
          <h3>📍 Location for Your Vote</h3>
          {status !== 'success' && (
            <button 
              className="close-button" 
              onClick={handleSkip}
              aria-label="Close dialog"
            >
              ✕
            </button>
          )}
        </div>

        <div className="dialog-content">
          {status === 'initial' && (
            <>
              <p className="dialog-description">
                Relay uses your location to organize votes by region and enable 
                location-based features. Your precise GPS coordinates are never 
                shared publicly.
              </p>

              <div className="privacy-info">
                <h4>🔒 Privacy Controls</h4>
                <ul>
                  <li><strong>Province Level (Default):</strong> Only your province is visible to others</li>
                  <li><strong>City Level:</strong> Show city but not exact location</li>
                  <li><strong>Anonymous:</strong> No location displayed publicly</li>
                </ul>
                <p className="note">You can change your privacy level anytime in Settings</p>
              </div>

              <div className="dialog-actions">
                <button 
                  className="btn-primary" 
                  onClick={handleRequestLocation}
                >
                  Allow Location Access
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => setStatus('manual')}
                >
                  Enter Manually
                </button>
              </div>
            </>
          )}

          {status === 'requesting' && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Requesting location permission...</p>
              <p className="note">Please allow location access in your browser</p>
            </div>
          )}

          {status === 'denied' && (
            <>
              <div className="error-message">
                <p>⚠️ {error}</p>
              </div>
              
              <div className="dialog-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => setStatus('manual')}
                >
                  Enter Location Manually
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleRequestLocation}
                >
                  Try Again
                </button>
              </div>
            </>
          )}

          {status === 'manual' && (
            <>
              <div className="manual-entry-form">
                <h4>Enter Coordinates Manually</h4>
                <p className="note">You can find your coordinates using Google Maps or other location services</p>
                
                <div className="form-group">
                  <label htmlFor="manual-lat">Latitude (-90 to 90)</label>
                  <input
                    id="manual-lat"
                    type="number"
                    step="any"
                    placeholder="e.g., 40.7128"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-lng">Longitude (-180 to 180)</label>
                  <input
                    id="manual-lng"
                    type="number"
                    step="any"
                    placeholder="e.g., -74.0060"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="form-input"
                  />
                </div>

                {manualError && (
                  <div className="error-message">
                    <p>{manualError}</p>
                  </div>
                )}

                <div className="dialog-actions">
                  <button 
                    className="btn-primary" 
                    onClick={handleManualEntry}
                  >
                    Submit Location
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setStatus('initial')}
                  >
                    Back
                  </button>
                </div>
              </div>
            </>
          )}

          {status === 'success' && location && (
            <div className="success-state">
              <div className="success-icon">✅</div>
              <h4>Location Confirmed</h4>
              
              <div className="location-details">
                {location.city && <p><strong>City:</strong> {location.city}</p>}
                {location.province && <p><strong>Province:</strong> {location.province}</p>}
                {location.country && <p><strong>Country:</strong> {location.country}</p>}
                {location.manual && <p className="note">Manually entered</p>}
              </div>

              <div className="dialog-actions">
                <button 
                  className="btn-primary" 
                  onClick={handleSkip}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .location-permission-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .location-permission-dialog {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dialog-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dialog-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-button:hover {
          color: #111827;
        }

        .dialog-content {
          padding: 24px;
        }

        .dialog-description {
          margin: 0 0 20px;
          color: #4b5563;
          line-height: 1.6;
        }

        .privacy-info {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .privacy-info h4 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .privacy-info ul {
          margin: 0 0 12px;
          padding-left: 20px;
          color: #4b5563;
        }

        .privacy-info li {
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .note {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
        }

        .dialog-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }

        .btn-secondary:hover {
          background: #eff6ff;
        }

        .loading-state,
        .success-state {
          text-align: center;
          padding: 20px 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .location-details {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          text-align: left;
        }

        .location-details p {
          margin: 8px 0;
          color: #4b5563;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .error-message p {
          margin: 0;
          color: #991b1b;
        }

        .manual-entry-form h4 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

export default LocationPermissionDialog;
