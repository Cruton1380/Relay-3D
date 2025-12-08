/**
 * CountyLoadingIndicator - SYSTEM2
 * Visual feedback for county boundary loading
 */

import React from 'react';

export const CountyLoadingIndicator = ({ progress }) => {
  if (!progress || !progress.isLoading) {
    return null;
  }

  const percentage = Math.round((progress.loaded / progress.total) * 100);
  const countiesFormatted = progress.counties?.toLocaleString() || '0';

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        zIndex: 1000,
        minWidth: '280px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Title */}
      <div style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div 
          className="spinner" 
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        Loading County Boundaries
      </div>

      {/* Current Country */}
      {progress.current && (
        <div style={{ 
          fontSize: '13px', 
          color: '#FFC107',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          📥 Loading: {progress.current}
        </div>
      )}

      {/* Progress Stats */}
      <div style={{ fontSize: '13px', marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#90CAF9' }}>Countries:</span>{' '}
          <span style={{ fontWeight: '600' }}>
            {progress.loaded} / {progress.total}
          </span>
          {' '}({percentage}%)
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#A5D6A7' }}>Counties Loaded:</span>{' '}
          <span style={{ fontWeight: '600' }}>
            {countiesFormatted}
          </span>
        </div>
        <div>
          <span style={{ color: '#CE93D8' }}>Success Rate:</span>{' '}
          <span style={{ fontWeight: '600' }}>
            {progress.success} / {progress.loaded}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
            transition: 'width 0.3s ease',
            borderRadius: '3px'
          }}
        />
      </div>

      {/* Percentage Text */}
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255,255,255,0.7)', 
        marginTop: '8px',
        textAlign: 'center'
      }}>
        {percentage}% Complete
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CountyLoadingIndicator;

