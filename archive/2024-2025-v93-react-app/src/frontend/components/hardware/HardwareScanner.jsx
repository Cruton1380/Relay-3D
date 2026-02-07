import React, { useState, useEffect } from 'react';

/**
 * Hardware Scanner Component
 * Provides hardware-based proximity scanning functionality
 */
const HardwareScanner = ({ onScanResult, isActive = false }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanning();
    } else if (!isActive && isScanning) {
      stopScanning();
    }
  }, [isActive]);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      // Simulate hardware scanning
      const mockDevices = [
        {
          id: 'device-1',
          name: 'User Device 1',
          rssi: -45,
          distance: 2.1,
          lastSeen: Date.now()
        },
        {
          id: 'device-2', 
          name: 'User Device 2',
          rssi: -60,
          distance: 5.3,
          lastSeen: Date.now()
        }
      ];
      
      setDevices(mockDevices);
      
      if (onScanResult) {
        onScanResult(mockDevices);
      }
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setDevices([]);
  };

  if (error) {
    return (
      <div className="hardware-scanner error">
        <p>Scanning error: {error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="hardware-scanner">
      <div className="scanner-status">
        <span className={`status-indicator ${isScanning ? 'active' : 'inactive'}`}>
          {isScanning ? 'Scanning...' : 'Inactive'}
        </span>
      </div>
      
      {devices.length > 0 && (
        <div className="detected-devices">
          <h4>Detected Devices:</h4>
          <ul>
            {devices.map(device => (
              <li key={device.id} className="device-item">
                <span className="device-name">{device.name}</span>
                <span className="device-distance">{device.distance.toFixed(1)}m</span>
                <span className="device-rssi">{device.rssi}dBm</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HardwareScanner;
