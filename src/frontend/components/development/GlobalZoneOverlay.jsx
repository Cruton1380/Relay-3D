/**
 * Global Zone Overlay - Centralized zone indicator system
 * Only one instance renders zones to prevent multiple overlapping indicators
 */
import React, { useState, useEffect } from 'react';
import { useWindowManagement } from '../../contexts/WindowManagementContext';
import './overlays/EnhancedGridLayout.css';

const GlobalZoneOverlay = () => {
  const { settings } = useWindowManagement();
  const [activeZones, setActiveZones] = useState([]);
  const [activeZoneIndex, setActiveZoneIndex] = useState(null);
  const [showZones, setShowZones] = useState(false);

  useEffect(() => {
    const handleZoneUpdate = (event) => {
      const { zones, activeIndex, show } = event.detail;
      setActiveZones(zones || []);
      setActiveZoneIndex(activeIndex);
      setShowZones(show);
    };

    const handleZoneHide = () => {
      setActiveZones([]);
      setActiveZoneIndex(null);
      setShowZones(false);
    };

    // Listen for global zone update events
    window.addEventListener('relay-zones-update', handleZoneUpdate);
    window.addEventListener('relay-zones-hide', handleZoneHide);

    return () => {
      window.removeEventListener('relay-zones-update', handleZoneUpdate);
      window.removeEventListener('relay-zones-hide', handleZoneHide);
    };
  }, []);

  if (!showZones || !settings.snapToGrid) {
    return null;
  }

  return (
    <div className="enhanced-grid-layout-suggestions global-zone-overlay">
      {activeZones.map((zone, index) => (
        <div
          key={zone.id || `zone-${index}`}
          className={`enhanced-grid-zone single-recommendation ${
            activeZoneIndex === index ? 'active' : ''
          }`}
          data-type={zone.type || 'grid'}
          data-edge={zone.edge || ''}
          style={{
            left: zone.previewX || zone.x,
            top: zone.previewY || zone.y,
            width: zone.previewWidth || zone.width,
            height: zone.previewHeight || zone.height
          }}
        >
          <div className="enhanced-grid-zone-label">
            {zone.name || `Zone ${index + 1}`}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalZoneOverlay;
