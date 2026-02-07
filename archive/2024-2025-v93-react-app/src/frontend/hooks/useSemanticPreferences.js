/**
 * @fileoverview Semantic Preferences Hook
 * Manages user preferences for semantic dictionary linking
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

const DEFAULT_PREFERENCES = {
  enableSemanticLinking: true,
  linkDensity: 0.3, // 30% of words can be linked
  enableHoverPreviews: true,
  enableClickInteractions: true,
  showAmbiguityIndicators: true,
  preferredCategories: [], // Filter for specific categories
  channelOverrides: new Map(), // Per-channel settings
  fadeInAnimation: true,
  backgroundParsing: true
};

const STORAGE_KEY = 'relay_semantic_preferences';

export const useSemanticPreferences = () => {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert channelOverrides back to Map
        if (parsed.channelOverrides && Array.isArray(parsed.channelOverrides)) {
          parsed.channelOverrides = new Map(parsed.channelOverrides);
        }
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load semantic preferences from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const saveToLocalStorage = useCallback((newPrefs) => {
    try {
      // Convert Map to array for JSON serialization
      const serializable = {
        ...newPrefs,
        channelOverrides: Array.from(newPrefs.channelOverrides.entries())
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to save semantic preferences to localStorage:', error);
    }
  }, []);

  // Sync with server (if authenticated)
  const syncWithServer = useCallback(async (newPrefs) => {
    if (!isAuthenticated || !user?.token) return;

    try {
      await fetch('/api/dictionary/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: {
            ...newPrefs,
            channelOverrides: Array.from(newPrefs.channelOverrides.entries())
          }
        })
      });
    } catch (error) {
      console.warn('Failed to sync semantic preferences with server:', error);
    }
  }, [isAuthenticated, user?.token]);

  // Update preferences
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      saveToLocalStorage(newPrefs);
      syncWithServer(newPrefs);
      return newPrefs;
    });
  }, [saveToLocalStorage, syncWithServer]);

  // Get preferences for specific channel
  const getChannelPreferences = useCallback((channelId) => {
    const channelOverride = preferences.channelOverrides.get(channelId);
    return { ...preferences, ...channelOverride };
  }, [preferences]);

  // Set channel-specific preferences
  const setChannelPreferences = useCallback((channelId, channelPrefs) => {
    setPreferences(prev => {
      const newChannelOverrides = new Map(prev.channelOverrides);
      newChannelOverrides.set(channelId, channelPrefs);
      
      const newPrefs = {
        ...prev,
        channelOverrides: newChannelOverrides
      };
      
      saveToLocalStorage(newPrefs);
      syncWithServer(newPrefs);
      return newPrefs;
    });
  }, [saveToLocalStorage, syncWithServer]);

  // Clear channel-specific preferences
  const clearChannelPreferences = useCallback((channelId) => {
    setPreferences(prev => {
      const newChannelOverrides = new Map(prev.channelOverrides);
      newChannelOverrides.delete(channelId);
      
      const newPrefs = {
        ...prev,
        channelOverrides: newChannelOverrides
      };
      
      saveToLocalStorage(newPrefs);
      syncWithServer(newPrefs);
      return newPrefs;
    });
  }, [saveToLocalStorage, syncWithServer]);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    saveToLocalStorage(DEFAULT_PREFERENCES);
    syncWithServer(DEFAULT_PREFERENCES);
  }, [saveToLocalStorage, syncWithServer]);

  return {
    preferences,
    loading,
    updatePreferences,
    getChannelPreferences,
    setChannelPreferences,
    clearChannelPreferences,
    resetPreferences
  };
}; 