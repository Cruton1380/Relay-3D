/**
 * useMapboxCounties.js
 * 
 * React hook for managing Mapbox GL JS county vector tiles.
 * Provides a clean interface for showing ALL 50k+ counties globally.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { MapboxCesiumOverlay } from './integrations/MapboxCesiumIntegration';
import { MapboxCountyManager } from './managers/MapboxCountyManager';
import countyCountries from './data/county-countries.json';

export const useMapboxCounties = (viewerRef) => {
  const overlayRef = useRef(null);
  const managerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize Mapbox overlay and county manager
   */
  const initializeCountySystem = useCallback(async (viewer, options = {}) => {
    if (!viewer) {
      const errorMsg = 'Cannot initialize - viewer not provided';
      console.error('❌ [Mapbox]', errorMsg);
      setError(errorMsg);
      return false;
    }

    if (overlayRef.current && managerRef.current) {
      console.log('♻️ [Mapbox] System already initialized');
      setIsInitialized(true);
      return true;
    }

    try {
      console.log('🔧 [Mapbox] Initializing county system...');

      // Create Mapbox overlay on Cesium
      const overlay = new MapboxCesiumOverlay(viewer, {
        debugMode: options.debugMode || true
      });

      await overlay.initialize();
      overlayRef.current = overlay;

      // Create county manager
      const manager = new MapboxCountyManager(overlay, {
        tileUrl: options.tileUrl || '/tiles/county/{z}/{x}/{y}.pbf',
        sourceLayer: options.sourceLayer || 'adm2',
        lineColor: '#ffff00', // Yellow to match current style
        lineWidth: 2,
        debugMode: options.debugMode || true
      });

      manager.initialize();
      managerRef.current = manager;

      setIsInitialized(true);
      setError(null);
      console.log('✅ [Mapbox] County system initialized');
      console.log('   📍 Ready to show ALL counties globally via vector tiles');
      return true;
    } catch (err) {
      const errorMsg = `Failed to initialize: ${err.message}`;
      console.error('❌ [Mapbox]', errorMsg, err);
      setError(errorMsg);
      return false;
    }
  }, []);

  /**
   * Show county boundaries
   */
  const showCounties = useCallback(async (countryCodes = null) => {
    if (!managerRef.current) {
      console.error('❌ [Mapbox] Cannot show counties - system not initialized');
      return false;
    }

    try {
      // Use all countries if none specified
      const codes = countryCodes || countyCountries;
      console.log(`🌍 [Mapbox] Loading counties for ${codes.length} countries...`);

      // Load county data first
      console.log('🔧 [Mapbox] About to call loadCountyData()...');
      const loaded = await managerRef.current.loadCountyData(codes);
      console.log('🔧 [Mapbox] loadCountyData() returned:', loaded);
      
      if (!loaded) {
        console.error('❌ [Mapbox] Failed to load county data');
        console.error('   This means source.setData() failed or source was not found');
        return false;
      }

      // Then show the layer
      console.log('🔧 [Mapbox] loadCountyData() succeeded, now calling show()...');
      const success = managerRef.current.show();
      console.log('🔧 [Mapbox] show() returned:', success);
      
      if (success) {
        setIsVisible(true);
        console.log('🌍 [Mapbox] ALL county boundaries shown globally');
      } else {
        console.error('❌ [Mapbox] show() failed - layer not visible');
      }
      return success;
    } catch (err) {
      console.error('❌ [Mapbox] Failed to show counties:', err);
      return false;
    }
  }, []);

  /**
   * Hide county boundaries
   */
  const hideCounties = useCallback(() => {
    if (!managerRef.current) {
      console.error('❌ [Mapbox] Cannot hide counties - system not initialized');
      return false;
    }

    try {
      const success = managerRef.current.hide();
      if (success) {
        setIsVisible(false);
        console.log('🌍 [Mapbox] County boundaries hidden');
      }
      return success;
    } catch (err) {
      console.error('❌ [Mapbox] Failed to hide counties:', err);
      return false;
    }
  }, []);

  /**
   * Toggle county visibility
   */
  const toggleCounties = useCallback(() => {
    if (isVisible) {
      hideCounties();
    } else {
      showCounties();
    }
  }, [isVisible, showCounties, hideCounties]);

  /**
   * Update county style
   */
  const updateCountyStyle = useCallback((styleConfig) => {
    if (!managerRef.current) {
      console.error('❌ [Mapbox] Cannot update style - system not initialized');
      return false;
    }

    return managerRef.current.updateStyle(styleConfig);
  }, []);

  /**
   * Get current status
   */
  const getStatus = useCallback(() => {
    if (!managerRef.current) {
      return {
        initialized: false,
        visible: false,
        error: error
      };
    }

    return {
      ...managerRef.current.getStatus(),
      error: error
    };
  }, [error]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }

      if (overlayRef.current) {
        overlayRef.current.destroy();
        overlayRef.current = null;
      }

      setIsInitialized(false);
      setIsVisible(false);
      console.log('🧹 [Mapbox] Cleaned up county system');
    };
  }, []);

  return {
    // Methods
    initializeCountySystem,
    showCounties,
    hideCounties,
    toggleCounties,
    updateCountyStyle,
    getStatus,

    // State
    isVisible,
    isInitialized,
    error,

    // Refs (for advanced use)
    overlay: overlayRef.current,
    manager: managerRef.current
  };
};

export default useMapboxCounties;

