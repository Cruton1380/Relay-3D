/**
 * useCesiumPrimitiveCounties.js
 * 
 * React hook for managing Cesium Primitive API county rendering.
 * Provides true 3D draping of all counties on the globe.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import CesiumPrimitiveCountyManager from './managers/CesiumPrimitiveCountyManager';
import countyCountries from './data/county-countries.json';

// Debug: Log the imported data structure
console.log('🔍 [CesiumPrimitive] county-countries.json imported:', {
  type: Array.isArray(countyCountries) ? 'array' : typeof countyCountries,
  length: Array.isArray(countyCountries) ? countyCountries.length : (countyCountries?.countries?.length || 0),
  firstFew: Array.isArray(countyCountries) ? countyCountries.slice(0, 5) : countyCountries?.countries?.slice(0, 5)
});

export function useCesiumPrimitiveCounties(viewer, options = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState(null);
  
  const managerRef = useRef(null);
  const isInitializedRef = useRef(false);

  /**
   * Initialize the primitive manager
   */
  const initialize = useCallback(async () => {
    if (!viewer || isInitializedRef.current) {
      return;
    }

    try {
      console.log('🔧 [CesiumPrimitive] Initializing primitive county system...');
      
      const manager = new CesiumPrimitiveCountyManager(viewer, {
        debugMode: true,
        fillColor: window.Cesium.Color.YELLOW.withAlpha(0.3),
        lineColor: window.Cesium.Color.BLACK,
        lineWidth: 2,
        ...options
      });

      await manager.initialize();
      managerRef.current = manager;
      isInitializedRef.current = true;

      console.log('✅ [CesiumPrimitive] Primitive county system initialized');
    } catch (err) {
      console.error('❌ [CesiumPrimitive] Initialization failed:', err);
      setError(err.message);
    }
  }, [viewer, options]);

  /**
   * Load all county data
   */
  const loadCountyData = useCallback(async () => {
    if (!managerRef.current) {
      await initialize();
    }

    if (!managerRef.current) {
      setError('Manager not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // county-countries.json is an array, not an object
      const countryList = Array.isArray(countyCountries) ? countyCountries : (countyCountries.countries || []);
      setLoadingProgress({ loaded: 0, total: countryList.length });

      console.log(`🌍 [CesiumPrimitive] Loading counties for ${countryList.length} countries...`);
      
      if (countryList.length === 0) {
        console.error('❌ [CesiumPrimitive] No countries found in county-countries.json!');
        setError('No countries found in county-countries.json');
        return;
      }

      const result = await managerRef.current.loadCountyData(countryList);
      
      setLoadingProgress({ 
        loaded: result.loaded, 
        total: countryList.length 
      });

      console.log(`✅ [CesiumPrimitive] Loading complete: ${result.loaded} succeeded, ${result.failed} failed`);
    } catch (err) {
      console.error('❌ [CesiumPrimitive] Loading failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [initialize]);

  /**
   * Show counties
   */
  const showCounties = useCallback(() => {
    if (!managerRef.current) {
      console.warn('⚠️ [CesiumPrimitive] Manager not initialized, cannot show counties');
      return false;
    }

    try {
      managerRef.current.show();
      console.log('✅ [CesiumPrimitive] Counties shown (3D draped)');
      return true;
    } catch (err) {
      console.error('❌ [CesiumPrimitive] Failed to show counties:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Hide counties
   */
  const hideCounties = useCallback(() => {
    if (!managerRef.current) {
      return false;
    }

    try {
      managerRef.current.hide();
      console.log('✅ [CesiumPrimitive] Counties hidden');
      return true;
    } catch (err) {
      console.error('❌ [CesiumPrimitive] Failed to hide counties:', err);
      return false;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  return {
    isLoading,
    loadingProgress,
    error,
    loadCountyData,
    showCounties,
    hideCounties,
    initialize
  };
}

export default useCesiumPrimitiveCounties;

