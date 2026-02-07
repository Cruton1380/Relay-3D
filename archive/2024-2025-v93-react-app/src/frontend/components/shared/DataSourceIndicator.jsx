/**
 * DataSourceIndicator Component
 * Shows users whether they're viewing test or production data
 */
import React from 'react';
import { useEnvironment } from '../../hooks/useEnvironment.js';
import './DataSourceIndicator.css';

const DataSourceIndicator = ({ className = '' }) => {
  const { shouldShowTestData, isProduction } = useEnvironment();

  // Don't show indicator in production unless test data is explicitly enabled
  if (isProduction && !shouldShowTestData) {
    return null;
  }

  // Don't show if we're in normal production mode
  if (!shouldShowTestData) {
    return null;
  }

  return (
    <div className={`data-source-indicator ${className}`}>
      <div className="indicator-content">
        <span className="indicator-icon">🧪</span>
        <div className="indicator-text">
          <strong>Test Mode Active</strong>
          <small>Showing mock data for development</small>
        </div>
      </div>
    </div>
  );
};

export default DataSourceIndicator;
