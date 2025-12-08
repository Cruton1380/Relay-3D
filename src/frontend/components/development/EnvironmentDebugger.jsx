import React, { useState, useEffect } from 'react';
import { useEnvironment } from '../../hooks/useEnvironment';
import dataService from '../../services/dataService';

const EnvironmentDebugger = () => {
  const environmentState = useEnvironment();
  const [dataInfo, setDataInfo] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Check data source info
  useEffect(() => {
    const updateDataInfo = async () => {
      const channels = await dataService.getChannels();
      const sourceInfo = dataService.getDataSourceInfo();
      setDataInfo({
        channelCount: channels.length,
        hasTestMarkers: channels.some(c => c.isTestData),
        sourceInfo
      });
      setLastUpdate(Date.now());
    };
    
    updateDataInfo();
    
    // Listen for environment changes
    const handleChange = () => {
      setTimeout(updateDataInfo, 100); // Small delay to let changes propagate
    };
    
    window.addEventListener('environmentChanged', handleChange);
    
    return () => {
      window.removeEventListener('environmentChanged', handleChange);
    };
  }, [environmentState.shouldShowTestData]);
  
  // Don't show in production builds or when not in test mode
  if (process.env.NODE_ENV === 'production' || !environmentState.isTestMode) {
    return null;
  }
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 10000,
      maxWidth: '350px',
      border: '1px solid #333'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#00ff00' }}>Environment Debug</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Environment State:</strong><br/>
        • isTestMode: <span style={{ color: environmentState.isTestMode ? '#00ff00' : '#ff6666' }}>{String(environmentState.isTestMode)}</span><br/>
        • shouldShowTestData: <span style={{ color: environmentState.shouldShowTestData ? '#00ff00' : '#ff6666' }}>{String(environmentState.shouldShowTestData)}</span><br/>
        • showTestData setting: <span style={{ color: environmentState.settings?.showTestData ? '#00ff00' : '#ff6666' }}>{String(environmentState.settings?.showTestData)}</span><br/>
        • isProduction: <span style={{ color: environmentState.isProduction ? '#ffaa00' : '#00ff00' }}>{String(environmentState.isProduction)}</span>
      </div>
      
      {dataInfo && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Data State:</strong><br/>
          • Channels loaded: {dataInfo.channelCount}<br/>
          • Has test markers: <span style={{ color: dataInfo.hasTestMarkers ? '#00ff00' : '#ff6666' }}>{String(dataInfo.hasTestMarkers)}</span><br/>
          • Data source: <span style={{ color: dataInfo.sourceInfo.source === 'test' ? '#00ff00' : '#ffaa00' }}>{dataInfo.sourceInfo.source}</span><br/>
          • Last update: {formatTime(lastUpdate)}
        </div>
      )}
      
      <div style={{ fontSize: '9px', color: '#999', borderTop: '1px solid #333', paddingTop: '4px' }}>
        Logic: shouldShowTestData = {environmentState.isTestMode} && {String(environmentState.settings?.showTestData)}
      </div>
    </div>
  );
};

export default EnvironmentDebugger;
