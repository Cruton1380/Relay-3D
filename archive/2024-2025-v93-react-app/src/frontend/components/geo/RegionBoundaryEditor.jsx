//frontend/js/components/RegionBoundaryEditor.js
/**
 * Region Boundary Editor Component
 * Allows users to draw and submit region boundaries
 */

import React, { useEffect, useRef, useState } from 'react';
import { Map, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { apiPost, apiGet } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth.jsx';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

const RegionBoundaryEditor = ({ regionId, readOnly = false }) => {
  const mapRef = useRef(null);
  const featureGroupRef = useRef(null);
  const { user } = useAuth();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Load region data
  useEffect(() => {
    const fetchRegion = async () => {
      try {
        setLoading(true);
        const data = await apiGet(`/api/regions/${regionId}`);
        setRegion(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching region data:', err);
        setError('Failed to load region data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (regionId) {
      fetchRegion();
    }
  }, [regionId]);
  
  // Initialize map with region boundary
  useEffect(() => {
    if (region && featureGroupRef.current && mapRef.current) {
      // Clear existing shapes
      featureGroupRef.current.clearLayers();
      
      // Add region boundary polygon
      if (region.boundary && region.boundary.coordinates) {
        try {
          const geoJsonLayer = L.geoJSON({
            type: 'Feature',
            properties: {},
            geometry: region.boundary
          });
          
          geoJsonLayer.eachLayer(layer => {
            featureGroupRef.current.addLayer(layer);
          });
          
          // Fit map to boundary
          const map = mapRef.current.leafletElement;
          map.fitBounds(geoJsonLayer.getBounds());
        } catch (err) {
          console.error('Error loading boundary:', err);
          setError('Invalid boundary data');
        }
      }
    }
  }, [region]);
  
  // Save changes
  const handleSave = async () => {
    if (!featureGroupRef.current) return;
    
    try {
      setSaving(true);
      
      // Convert drawn shapes to GeoJSON
      const layers = featureGroupRef.current.getLayers();
      if (layers.length === 0) {
        setError('Please draw at least one boundary area');
        setSaving(false);
        return;
      }
      
      const featureCollection = {
        type: 'FeatureCollection',
        features: []
      };
      
      layers.forEach(layer => {
        const json = layer.toGeoJSON();
        featureCollection.features.push(json);
      });
      
      // Use the first feature as the main boundary
      const boundary = featureCollection.features[0].geometry;
      
      // Save to API
      await apiPost(`/api/regions/${regionId}/boundary`, { boundary });
      
      setHasChanges(false);
      setError(null);
    } catch (err) {
      console.error('Error saving boundary:', err);
      setError('Failed to save boundary changes');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle edit events
  const handleEdit = (e) => {
    setHasChanges(true);
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (!region) {
    return <div className="error-message">Region not found</div>;
  }
  
  return (
    <div className="region-boundary-editor">
      <h2>Region Boundary: {region.name}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="map-container" style={{ height: '500px', width: '100%' }}>
        <Map 
          ref={mapRef}
          center={[0, 0]} 
          zoom={2}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <FeatureGroup ref={featureGroupRef}>
            {!readOnly && (
              <EditControl
                position="topright"
                onCreated={handleEdit}
                onEdited={handleEdit}
                onDeleted={handleEdit}
                draw={{
                  rectangle: true,
                  polygon: true,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false
                }}
              />
            )}
          </FeatureGroup>
        </Map>
      </div>
      
      <div className="actions">
        {!readOnly && (
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className={saving ? 'loading' : ''}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
      
      <div className="region-info">
        <h3>Region Information</h3>
        <p><strong>ID:</strong> {region.id}</p>
        <p><strong>Name:</strong> {region.name}</p>
        <p><strong>Description:</strong> {region.description || 'No description'}</p>
        <p><strong>Population:</strong> {region.population || 'Unknown'}</p>
        <p><strong>Created:</strong> {new Date(region.createdAt).toLocaleDateString()}</p>
        {region.lastModifiedAt && (
          <p><strong>Last Modified:</strong> {new Date(region.lastModifiedAt).toLocaleDateString()}</p>
        )}
      </div>
      
      {region.votingParameters && (
        <div className="voting-parameters">
          <h3>Voting Parameters</h3>
          <ul>
            {Object.entries(region.votingParameters).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RegionBoundaryEditor;
