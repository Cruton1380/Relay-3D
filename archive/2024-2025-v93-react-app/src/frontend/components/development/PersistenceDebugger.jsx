import React, { useState, useEffect } from 'react';

const PersistenceDebugger = () => {
  const [storageState, setStorageState] = useState({});

  const checkStorage = () => {
    const keys = ['relay_test_mode', 'relay_showTestData', 'relay_enableTestVoting', 'relay_enableTestUI', 'relay_bypassAuth', 'relay_deterministicVotes'];
    const state = {};
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      state[key] = value ? JSON.parse(value) : null;
    });
    
    setStorageState(state);
  };

  useEffect(() => {
    checkStorage();
    
    // Check storage every second
    const interval = setInterval(checkStorage, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px', 
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10000
    }}>
      <h4>localStorage Debug</h4>
      {Object.entries(storageState).map(([key, value]) => (
        <div key={key}>
          {key}: {value !== null ? String(value) : 'null'}
        </div>
      ))}
      <button onClick={checkStorage} style={{ marginTop: '5px' }}>
        Refresh
      </button>
    </div>
  );
};

export default PersistenceDebugger;
