/**
 * BorderAnalysisPanel.jsx
 * Panel for analyzing borders between countries and regions
 * Provides visualization and analysis tools for border data
 */

import React, { useState, useEffect, useMemo } from 'react';

const BorderAnalysisPanel = ({
  selectedCountries = [],
  selectedRegions = [],
  highlightedBorders = [],
  onClose,
  onFilterChange
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compute border statistics
  const borderStats = useMemo(() => {
    const stats = {
      totalBorders: highlightedBorders.length,
      selectedCountries: selectedCountries.length,
      selectedRegions: selectedRegions.length,
      borderTypes: {
        international: 0,
        regional: 0,
        disputed: 0
      }
    };

    highlightedBorders.forEach(border => {
      if (border.type === 'international') stats.borderTypes.international++;
      else if (border.type === 'regional') stats.borderTypes.regional++;
      else if (border.type === 'disputed') stats.borderTypes.disputed++;
    });

    return stats;
  }, [selectedCountries, selectedRegions, highlightedBorders]);

  // Analyze border complexity
  const analyzeBorderComplexity = (borders) => {
    if (!borders || borders.length === 0) return 'No borders selected';
    
    const complexity = borders.reduce((acc, border) => {
      return acc + (border.length || 1) * (border.disputes || 0);
    }, 0);

    if (complexity < 10) return 'Low';
    if (complexity < 50) return 'Medium';
    return 'High';
  };

  const handleFilterChange = (type, level) => {
    if (onFilterChange) {
      onFilterChange(type, level);
    }
  };

  const renderOverviewTab = () => (
    <div className="border-analysis-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{borderStats.totalBorders}</div>
          <div className="stat-label">Total Borders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{borderStats.selectedCountries}</div>
          <div className="stat-label">Countries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{borderStats.selectedRegions}</div>
          <div className="stat-label">Regions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analyzeBorderComplexity(highlightedBorders)}</div>
          <div className="stat-label">Complexity</div>
        </div>
      </div>

      <div className="border-types">
        <h3>Border Types</h3>
        <div className="border-type-list">
          <div className="border-type-item">
            <span className="type-indicator international"></span>
            <span className="type-label">International</span>
            <span className="type-count">{borderStats.borderTypes.international}</span>
          </div>
          <div className="border-type-item">
            <span className="type-indicator regional"></span>
            <span className="type-label">Regional</span>
            <span className="type-count">{borderStats.borderTypes.regional}</span>
          </div>
          <div className="border-type-item">
            <span className="type-indicator disputed"></span>
            <span className="type-label">Disputed</span>
            <span className="type-count">{borderStats.borderTypes.disputed}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiltersTab = () => (
    <div className="border-analysis-filters">
      <h3>Filter Options</h3>
      
      <div className="filter-group">
        <label>Border Type</label>
        <div className="filter-options">
          <button 
            className="filter-btn"
            onClick={() => handleFilterChange('type', 'international')}
          >
            International
          </button>
          <button 
            className="filter-btn"
            onClick={() => handleFilterChange('type', 'regional')}
          >
            Regional
          </button>
          <button 
            className="filter-btn"
            onClick={() => handleFilterChange('type', 'disputed')}
          >
            Disputed
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label>Complexity Level</label>
        <div className="filter-options">
          <button 
            className="filter-btn"
            onClick={() => handleFilterChange('complexity', 'low')}
          >
            Low
          </button>
          <button 
            className="filter-btn"
            onClick={() => handleFilterChange('complexity', 'medium')}
          >
            Medium
          </button>
          <button 
            className="filter-btn"
            onClick={() => handleFilterChange('complexity', 'high')}
          >
            High
          </button>
        </div>
      </div>

      <div className="filter-actions">
        <button 
          className="clear-filters-btn"
          onClick={() => handleFilterChange('clear', 'all')}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="border-analysis-details">
      <h3>Border Details</h3>
      
      {highlightedBorders.length === 0 ? (
        <div className="no-data">
          <p>No borders selected for analysis</p>
          <p>Select countries or regions to view border details</p>
        </div>
      ) : (
        <div className="border-list">
          {highlightedBorders.map((border, index) => (
            <div key={index} className="border-item">
              <div className="border-header">
                <span className="border-name">{border.name || `Border ${index + 1}`}</span>
                <span className={`border-type-badge ${border.type || 'unknown'}`}>
                  {border.type || 'Unknown'}
                </span>
              </div>
              <div className="border-info">
                <div className="info-item">
                  <span className="info-label">Length:</span>
                  <span className="info-value">{border.length || 'Unknown'} km</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{border.status || 'Active'}</span>
                </div>
                {border.disputes && (
                  <div className="info-item">
                    <span className="info-label">Disputes:</span>
                    <span className="info-value">{border.disputes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(20, 24, 36, 0.95)',
      border: '1px solid #409cff',
      borderRadius: '12px',
      overflow: 'hidden',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(64, 156, 255, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          margin: 0,
          color: '#409cff',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Border Analysis
        </h2>
        <button
          onClick={onClose}
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(64, 156, 255, 0.3)'
      }}>
        {['overview', 'filters', 'details'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab ? 'rgba(64, 156, 255, 0.1)' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#409cff' : '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'capitalize',
              borderBottom: activeTab === tab ? '2px solid #409cff' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        padding: '20px',
        maxHeight: '60vh',
        overflowY: 'auto'
      }}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'filters' && renderFiltersTab()}
        {activeTab === 'details' && renderDetailsTab()}
      </div>

      {/* Inline styles for components */}
      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: rgba(31, 41, 55, 0.5);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(64, 156, 255, 0.2);
          text-align: center;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #409cff;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .border-types h3 {
          color: #ffffff;
          font-size: 16px;
          margin-bottom: 12px;
        }
        
        .border-type-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .border-type-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(31, 41, 55, 0.3);
          border-radius: 6px;
        }
        
        .type-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .type-indicator.international { background: #409cff; }
        .type-indicator.regional { background: #10b981; }
        .type-indicator.disputed { background: #f59e0b; }
        
        .type-label {
          color: #ffffff;
          flex: 1;
          font-size: 14px;
        }
        
        .type-count {
          color: #6b7280;
          font-size: 12px;
        }
        
        .filter-group {
          margin-bottom: 16px;
        }
        
        .filter-group label {
          display: block;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .filter-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          padding: 6px 12px;
          background: rgba(31, 41, 55, 0.5);
          border: 1px solid rgba(64, 156, 255, 0.3);
          border-radius: 4px;
          color: #ffffff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-btn:hover {
          background: rgba(64, 156, 255, 0.1);
          border-color: #409cff;
        }
        
        .clear-filters-btn {
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #ef4444;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .clear-filters-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }
        
        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }
        
        .border-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .border-item {
          background: rgba(31, 41, 55, 0.3);
          border: 1px solid rgba(64, 156, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
        }
        
        .border-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .border-name {
          color: #ffffff;
          font-weight: 500;
          font-size: 14px;
        }
        
        .border-type-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .border-type-badge.international {
          background: rgba(64, 156, 255, 0.2);
          color: #409cff;
        }
        
        .border-type-badge.regional {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .border-type-badge.disputed {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .border-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .info-label {
          color: #6b7280;
        }
        
        .info-value {
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default BorderAnalysisPanel;
