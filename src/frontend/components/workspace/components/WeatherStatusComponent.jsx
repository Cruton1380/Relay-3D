import React, { useState, useEffect } from 'react';
import './WeatherStatusComponent.css';

/**
 * Weather Status Component
 * Displays current weather data status and service information
 */
const WeatherStatusComponent = () => {
  const [weatherStatus, setWeatherStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherStatus();
  }, []);

  const fetchWeatherStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/globe/weather/status');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWeatherStatus(result.data);
        } else {
          throw new Error('Weather status request failed');
        }
      } else {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.warn('Weather status not available:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="weather-status">
        <div className="weather-status-header">
          <span>🌤️</span>
          <span>Weather Data Status</span>
        </div>
        <div className="weather-status-content">
          <div className="loading">Loading weather data status...</div>
        </div>
      </div>
    );
  }

  if (!weatherStatus) {
    return (
      <div className="weather-status">
        <div className="weather-status-header">
          <span>🌤️</span>
          <span>Weather Data Status</span>
        </div>
        <div className="weather-status-content">
          <div className="status-error">
            <span>⚠️</span>
            <span>Weather data not available</span>
          </div>
          <div className="status-info">
            Make sure the tile server is running and weather data has been fetched.
          </div>
        </div>
      </div>
    );
  }

  const regions = weatherStatus.regions || [];
  const totalRegions = regions.length;
  const timestamp = new Date(weatherStatus.timestamp).toLocaleString();

  return (
    <div className="weather-status">
      <div className="weather-status-header">
        <span>🌤️</span>
        <span>Weather Data Status</span>
      </div>
      <div className="weather-status-content">
        <div className="status-summary">
          <div className="status-item">
            <span className="status-label">Service:</span>
            <span className="status-value">{weatherStatus.service}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Status:</span>
            <span className="status-value">{weatherStatus.status}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Coverage:</span>
            <span className="status-value">{weatherStatus.coverage}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Regions:</span>
            <span className="status-value">{totalRegions} worldwide</span>
          </div>
          <div className="status-item">
            <span className="status-label">Updated:</span>
            <span className="status-value">{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherStatusComponent;
