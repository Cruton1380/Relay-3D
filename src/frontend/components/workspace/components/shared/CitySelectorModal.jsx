/**
 * CitySelectorModal.jsx
 * Modal component for selecting cities to navigate to on the globe
 */

import React, { useState } from 'react';

const CitySelectorModal = ({ 
  isOpen, 
  onClose, 
  onCitySelect, 
  cities = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  // Filter cities based on search term
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    if (onCitySelect) {
      onCitySelect(city);
    }
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedCity(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'rgba(20, 24, 36, 0.95)',
        border: '1px solid #409cff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: '#409cff',
            fontSize: '18px',
            fontWeight: '600',
            margin: 0
          }}>
            Select City
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              border: '1px solid rgba(64, 156, 255, 0.3)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Cities List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {filteredCities.length === 0 ? (
            <div style={{
              color: '#6b7280',
              textAlign: 'center',
              padding: '20px',
              fontSize: '14px'
            }}>
              No cities found
            </div>
          ) : (
            filteredCities.map((city) => (
              <div
                key={city.id}
                onClick={() => handleCitySelect(city)}
                style={{
                  padding: '12px',
                  margin: '4px 0',
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(64, 156, 255, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(64, 156, 255, 0.1)';
                  e.target.style.borderColor = '#409cff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(31, 41, 55, 0.5)';
                  e.target.style.borderColor = 'rgba(64, 156, 255, 0.2)';
                }}
              >
                <div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {city.name}
                  </div>
                  <div style={{
                    color: '#6b7280',
                    fontSize: '12px',
                    marginTop: '2px'
                  }}>
                    {city.country}
                  </div>
                </div>
                <div style={{
                  color: '#6b7280',
                  fontSize: '11px',
                  textAlign: 'right'
                }}>
                  {city.lat.toFixed(2)}, {city.lon.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(107, 114, 128, 0.5)',
              border: '1px solid rgba(107, 114, 128, 0.3)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitySelectorModal;
