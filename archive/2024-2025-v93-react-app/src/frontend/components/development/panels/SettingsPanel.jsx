import React, { useState } from 'react';
import './SettingsPanel.css';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    theme: 'vscode-dark',
    autosave: true,
    showNotifications: true,
    fontSize: 13,
    tabSize: 2,
    wordWrap: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Workspace Settings</h3>
      </div>
      
      <div className="settings-content">
        <div className="setting-group">
          <h4>Appearance</h4>
          
          <div className="setting-item">
            <label>Theme</label>
            <select 
              value={settings.theme} 
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="vscode-dark">VSCode Dark</option>
              <option value="vscode-light">VSCode Light</option>
            </select>
          </div>
          
          <div className="setting-item">
            <label>Font Size</label>
            <input 
              type="number" 
              min="10" 
              max="20" 
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="setting-group">
          <h4>Editor</h4>
          
          <div className="setting-item">
            <label>Tab Size</label>
            <input 
              type="number" 
              min="2" 
              max="8" 
              value={settings.tabSize}
              onChange={(e) => handleSettingChange('tabSize', parseInt(e.target.value))}
            />
          </div>
          
          <div className="setting-item checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={settings.wordWrap}
                onChange={(e) => handleSettingChange('wordWrap', e.target.checked)}
              />
              Word Wrap
            </label>
          </div>
        </div>
        
        <div className="setting-group">
          <h4>Workspace</h4>
          
          <div className="setting-item checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={settings.autosave}
                onChange={(e) => handleSettingChange('autosave', e.target.checked)}
              />
              Auto-save Layout
            </label>
          </div>
          
          <div className="setting-item checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={settings.showNotifications}
                onChange={(e) => handleSettingChange('showNotifications', e.target.checked)}
              />
              Show Notifications
            </label>
          </div>
        </div>
        
        <div className="setting-group">
          <h4>Reset</h4>
          <button 
            className="reset-button"
            onClick={() => {
              if (confirm('Reset all settings to default?')) {
                setSettings({
                  theme: 'vscode-dark',
                  autosave: true,
                  showNotifications: true,
                  fontSize: 13,
                  tabSize: 2,
                  wordWrap: true
                });
              }
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
