import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import './PrivacySettings.css';

/**
 * PrivacySettings Component
 * 
 * Allows users to configure their location privacy level
 * Integrates with userPreferencesService backend
 */
const PrivacySettings = ({ userId, onClose }) => {
  const [privacyLevel, setPrivacyLevel] = useState('province');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load current privacy level
  useEffect(() => {
    loadPrivacyLevel();
  }, [userId]);

  const loadPrivacyLevel = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/user/preferences/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPrivacyLevel(data.privacyLevel || 'province');
      }
    } catch (error) {
      console.error('Failed to load privacy level:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`http://localhost:3002/api/user/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyLevel })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Privacy settings saved successfully!' });
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        throw new Error('Failed to save privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions = [
    {
      value: 'gps',
      icon: MapPin,
      title: 'GPS - Exact Location',
      description: 'Share your exact coordinates. Voters can see your precise location on the map.',
      visibility: 'Public: Exact coordinates visible to all',
      color: '#e74c3c'
    },
    {
      value: 'city',
      icon: Eye,
      title: 'City - City Level',
      description: 'Share your city. Voters see you grouped at the city center.',
      visibility: 'Public: City name and general area visible',
      color: '#f39c12'
    },
    {
      value: 'province',
      icon: Shield,
      title: 'Province - Province Level (Recommended)',
      description: 'Share your province/state only. Voters see you grouped at the provincial level.',
      visibility: 'Public: Province/state name visible',
      color: '#27ae60'
    },
    {
      value: 'anonymous',
      icon: EyeOff,
      title: 'Anonymous - No Location',
      description: 'Don\'t share your location at all. Your vote counts but won\'t appear on maps.',
      visibility: 'Public: No location visible',
      color: '#95a5a6'
    }
  ];

  if (loading) {
    return (
      <div className="privacy-settings-modal">
        <div className="privacy-settings-content">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="privacy-settings-modal" onClick={onClose}>
      <div className="privacy-settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="privacy-header">
          <div className="privacy-title">
            <Lock size={24} />
            <h2>Location Privacy Settings</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="privacy-explanation">
          <p>
            Control how your location is shared when you vote. 
            All votes are counted regardless of privacy level.
          </p>
        </div>

        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="privacy-options">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = privacyLevel === option.value;

            return (
              <div
                key={option.value}
                className={`privacy-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setPrivacyLevel(option.value)}
                style={{
                  borderColor: isSelected ? option.color : '#ddd',
                  backgroundColor: isSelected ? `${option.color}10` : '#fff'
                }}
              >
                <div className="option-header">
                  <div className="option-icon" style={{ color: option.color }}>
                    <Icon size={28} />
                  </div>
                  <div className="option-info">
                    <h3>{option.title}</h3>
                    <p className="option-description">{option.description}</p>
                  </div>
                  <div className="option-radio">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setPrivacyLevel(option.value)}
                    />
                  </div>
                </div>
                <div className="option-visibility" style={{ color: option.color }}>
                  {option.visibility}
                </div>
              </div>
            );
          })}
        </div>

        <div className="privacy-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>

        <div className="privacy-footer">
          <p>
            <strong>Note:</strong> Changing your privacy level will apply to all future votes. 
            Existing votes retain their original privacy level.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
