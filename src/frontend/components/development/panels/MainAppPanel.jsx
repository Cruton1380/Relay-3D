import React from 'react';
import { useNavigate } from 'react-router-dom';
import RelayMainApp from '../../main/RelayMainApp';
import './MainAppPanel.css';

const MainAppPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="command-center">
      <div className="command-center-header">
        <div className="session-status">
          <div className="status-indicator active"></div>
          <span>Relay Session Active</span>
        </div>
        <div className="session-controls">
          <button 
            className="session-control-btn"
            onClick={() => navigate('/dashboard')}
            title="Go to Full Dashboard"
          >
            Expand
          </button>
          <button 
            className="session-control-btn"
            title="Session Settings"
          >
            Settings
          </button>
        </div>
      </div>
      
      <div className="workspace-container">
        <RelayMainApp />
      </div>
    </div>
  );
};

export default MainAppPanel;
