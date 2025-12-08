/**
 * useWorkspaceState - Workspace panel management hook
 * Manages panel positions, visibility, and layout state
 */
import { useState, useEffect, useCallback } from 'react';
import { DOCK_ZONES, DEFAULT_PANELS } from './constants';

export const useWorkspaceState = () => {
  // Panel state
  const [panels, setPanels] = useState(DEFAULT_PANELS);
  const [dockStates, setDockStates] = useState({});
  const [layout, setLayout] = useState('default');
  const [activePanel, setActivePanel] = useState(null);
  const [snapZones, setSnapZones] = useState([]);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Check if any panels are active
  const hasActivePanels = panels.some(panel => panel.isVisible);

  // Save current state to localStorage
  const saveCurrentState = useCallback(() => {
    try {
      const state = {
        panels,
        dockStates,
        layout,
        activePanel,
        timestamp: Date.now()
      };
      localStorage.setItem('relay-workspace-state', JSON.stringify(state));
      setLastSavedTime(Date.now());
      // Workspace state saved
    } catch (error) {
      console.warn('Failed to save workspace state:', error);
    }
  }, [panels, dockStates, layout, activePanel]);

  // Load saved state from localStorage
  const loadSavedState = useCallback(() => {
    try {
      const saved = localStorage.getItem('relay-workspace-state');
      if (saved) {
        const state = JSON.parse(saved);
        setPanels(state.panels || DEFAULT_PANELS);
        setDockStates(state.dockStates || {});
        setLayout(state.layout || 'default');
        setActivePanel(state.activePanel || null);
        setLastSavedTime(state.timestamp);
        // Workspace state loaded
      }
    } catch (error) {
      console.warn('Failed to load workspace state:', error);
    }
  }, []);

  // Reset to default state
  const resetToDefault = useCallback(() => {
    setPanels(DEFAULT_PANELS);
    setDockStates({});
    setLayout('default');
    setActivePanel(null);
    setSnapZones([]);
    console.log('🔄 Workspace reset to default');
  }, []);

  // Clear all stored state
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem('relay-workspace-state');
      setLastSavedTime(null);
      console.log('🗑️ Workspace storage cleared');
    } catch (error) {
      console.warn('Failed to clear workspace storage:', error);
    }
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    const timeoutId = setTimeout(saveCurrentState, 1000);
    return () => clearTimeout(timeoutId);
  }, [panels, dockStates, layout, activePanel, saveCurrentState]);

  // Load state on mount
  useEffect(() => {
    loadSavedState();
  }, [loadSavedState]);

  return {
    panels,
    setPanels,
    dockStates,
    setDockStates,
    layout,
    setLayout,
    activePanel,
    setActivePanel,
    snapZones,
    setSnapZones,
    lastSavedTime,
    saveCurrentState,
    loadSavedState,
    resetToDefault,
    clearStorage,
    hasActivePanels
  };
}; 