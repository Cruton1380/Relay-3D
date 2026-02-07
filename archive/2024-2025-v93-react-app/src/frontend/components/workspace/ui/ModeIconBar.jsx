import React from 'react';
import { useMode, MODES } from '../../../context/ModeContext';

const ModeIconBar = () => {
  const { currentMode, setMode } = useMode();

  const modeConfig = [
    { key: MODES.SEARCH, icon: '🔍', label: 'Search', description: 'Find channels, topics, people' },
    { key: MODES.DEVELOPER, icon: '⚙️', label: 'Developer', description: 'Logs, system control, AI' },
    { key: MODES.CHANNELS, icon: '💬', label: 'Channels', description: 'Interact with channels' },
    { key: MODES.REGION, icon: '🏛️', label: 'Region', description: 'Borders, voting, governance' },
    { key: MODES.PROXIMITY, icon: '📍', label: 'Proximity', description: 'Nearby users, broadcasts' },
    { key: MODES.MAP, icon: '🗺️', label: 'Map', description: '2D street-level view' }
  ];

  return (
    <div className="mode-icon-bar">
      <div className="mode-icons">
        {modeConfig.map(({ key, icon, label, description }) => (
          <button
            key={key}
            className={`mode-icon ${currentMode === key ? 'active' : ''}`}
            onClick={() => setMode(key)}
            title={`${label}: ${description}`}
          >
            <span className="mode-icon-emoji">{icon}</span>
            <span className="mode-icon-label">{label}</span>
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .mode-icon-bar {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 0 12px 12px 0;
          padding: 8px 4px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mode-icons {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mode-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          padding: 4px;
        }

        .mode-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .mode-icon.active {
          background: rgba(64, 156, 255, 0.3);
          border-color: rgba(64, 156, 255, 0.6);
          color: white;
          box-shadow: 0 0 12px rgba(64, 156, 255, 0.4);
        }

        .mode-icon-emoji {
          font-size: 16px;
          margin-bottom: 2px;
        }

        .mode-icon-label {
          font-size: 8px;
          text-align: center;
          line-height: 1;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default ModeIconBar; 