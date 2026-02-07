/**
 * Window Management Context
 * Global settings for window behavior with localStorage persistence
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WindowManagementContext = createContext();

// localStorage keys
const WINDOW_STATE_KEY = 'relay-window-state';
const WINDOW_SETTINGS_KEY = 'relay-window-settings';

export const useWindowManagement = () => {
  const context = useContext(WindowManagementContext);
  if (!context) {
    throw new Error('useWindowManagement must be used within a WindowManagementProvider');
  }
  return context;
};

export const WindowManagementProvider = ({ children }) => {
  // Load settings from localStorage on initialization
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(WINDOW_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load window settings from localStorage:', error);
    }
    return {
      snapToGrid: true,
      enableFreeMovement: true,
      enableResize: true,
      gridSize: 20,
      showGridLines: false,
      autoArrange: false,
      magneticEdges: true,
      minWindowWidth: 300,
      minWindowHeight: 200,
      windowTransparency: false
    };
  };

  // Load window state from localStorage on initialization
  const loadWindowState = () => {
    try {
      const saved = localStorage.getItem(WINDOW_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load window state from localStorage:', error);
    }
    return new Map();
  };

  const [settings, setSettings] = useState(loadSettings);
  const [windows, setWindows] = useState(loadWindowState);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save window settings to localStorage:', error);
    }
  }, [settings]);

  // Save window state to localStorage whenever it changes
  useEffect(() => {
    try {
      const windowState = Object.fromEntries(windows);
      localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(windowState));
    } catch (error) {
      console.warn('Failed to save window state to localStorage:', error);
    }
  }, [windows]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const registerWindow = useCallback((id, windowData) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      // Only register if not already present or if we have new data
      if (!newMap.has(id) || windowData) {
        newMap.set(id, { ...newMap.get(id), ...windowData });
      }
      return newMap;
    });
  }, []);

  const unregisterWindow = useCallback((id) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const updateWindow = useCallback((id, updates) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id) || {};
      newMap.set(id, { ...existing, ...updates });
      return newMap;
    });
  }, []);

  // Get persisted window data for a specific panel
  const getWindowData = useCallback((id) => {
    return windows.get(id) || {};
  }, [windows]);

  // Clear all persisted window data
  const clearWindowState = useCallback(() => {
    setWindows(new Map());
    try {
      localStorage.removeItem(WINDOW_STATE_KEY);
    } catch (error) {
      console.warn('Failed to clear window state from localStorage:', error);
    }
  }, []);

  // Reset a specific window to default position/size
  const resetWindow = useCallback((id) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  // Get all window data for debugging
  const getAllWindowData = useCallback(() => {
    return Object.fromEntries(windows);
  }, [windows]);

  const value = {
    settings,
    updateSettings,
    windows,
    registerWindow,
    unregisterWindow,
    updateWindow,
    getWindowData,
    clearWindowState,
    resetWindow,
    getAllWindowData
  };

  return (
    <WindowManagementContext.Provider value={value}>
      {children}
    </WindowManagementContext.Provider>
  );
};
