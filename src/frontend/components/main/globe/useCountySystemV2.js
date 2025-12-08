/**
 * useCountySystemV2 - SYSTEM2 Integration Hook
 * 
 * React hook to manage SYSTEM2 county boundaries
 * Completely independent from SYSTEM1 (AdministrativeHierarchy)
 * 
 * Usage in InteractiveGlobe.jsx:
 * 
 * import { useCountySystemV2 } from './useCountySystemV2';
 * 
 * const { 
 *   initializeCountySystem,
 *   loadCounties,
 *   showCounties,
 *   hideCounties,
 *   loadingProgress
 * } = useCountySystemV2(viewerRef);
 * 
 * // Initialize when viewer is ready
 * useEffect(() => {
 *   if (viewerRef.current) {
 *     initializeCountySystem(viewerRef.current);
 *   }
 * }, [viewerRef.current]);
 * 
 * // Load when county cluster level selected
 * useEffect(() => {
 *   if (clusterLevel === 'county') {
 *     loadCounties();
 *   } else {
 *     hideCounties();
 *   }
 * }, [clusterLevel]);
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import CountyBoundaryManager from './managers/CountyBoundaryManager';

// GLOBAL: Track hook instances to detect React re-renders creating duplicates
let hookInstanceCount = 0;

export const useCountySystemV2 = () => {
  const instanceIdRef = useRef(null);
  const managerRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState({
    isLoading: false,
    loaded: 0,
    total: 163,
    current: null,
    counties: 0,
    success: 0
  });

  // Track hook instances (multiple instances are OK now with singleton pattern)
  if (!instanceIdRef.current) {
    hookInstanceCount++;
    instanceIdRef.current = hookInstanceCount;
    console.log(`🆕 [SYSTEM2] Hook instance #${instanceIdRef.current} CREATED`);
    
    if (hookInstanceCount > 1) {
      console.log(`ℹ️ [SYSTEM2] Multiple hook instances detected (${hookInstanceCount} total) - this is OK!`);
      console.log(`ℹ️ [SYSTEM2] All instances share the same SINGLETON CountyBoundaryManager`);
      console.log(`ℹ️ [SYSTEM2] No conflicts or random behavior - manager is shared safely`);
    }
  }

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    console.log(`👁️ [SYSTEM2] Hook instance #${instanceIdRef.current} mounted/updated`);
    
    return () => {
      console.log(`🧹 [SYSTEM2] Hook instance #${instanceIdRef.current} unmounting`);
      hookInstanceCount--;
      console.log(`🧹 [SYSTEM2] Remaining hook instances: ${hookInstanceCount}`);
      
      // SINGLETON PATTERN: Don't dispose the manager - it's shared across all hook instances
      // The manager will persist in the viewer and be reused by other component instances
      // This prevents the "random loading" issue where components fight for control
      
      if (managerRef.current) {
        console.log(`♻️ [SYSTEM2] Hook instance #${instanceIdRef.current} releasing manager reference (manager stays alive)`);
        // Clear our reference, but don't dispose the manager itself
        managerRef.current = null;
      }
      
      console.log(`✅ [SYSTEM2] Hook instance #${instanceIdRef.current} cleanup complete`);
    };
  }, []);

  /**
   * Initialize the county system
   * SINGLETON PATTERN: CountyBoundaryManager will return existing instance if already created
   */
  const initializeCountySystem = useCallback((viewer) => {
    console.log(`🔧 [SYSTEM2] Hook instance #${instanceIdRef.current}: initializeCountySystem called`);
    
    if (!viewer) {
      console.error('❌ [SYSTEM2] Cannot initialize - no viewer provided');
      return false;
    }

    if (managerRef.current) {
      console.log(`♻️ [SYSTEM2] Hook instance #${instanceIdRef.current}: Already has manager reference`);
      console.log('♻️ [SYSTEM2] Manager has', managerRef.current.loadedCountries.size, 'loaded countries');
      return true;
    }

    console.log(`🔧 [SYSTEM2] Hook instance #${instanceIdRef.current}: Getting/creating CountyBoundaryManager...`);
    console.log('🔧 [SYSTEM2] Viewer currently has', viewer.dataSources.length, 'dataSources');
    
    try {
      // SINGLETON PATTERN: Constructor will return existing instance if already created
      managerRef.current = new CountyBoundaryManager(viewer);
      console.log(`✅ [SYSTEM2] Hook instance #${instanceIdRef.current}: Manager reference acquired`);
      console.log('✅ [SYSTEM2] Manager has', managerRef.current.loadedCountries.size, 'countries,', 
                  managerRef.current.dataSource.entities.values.length, 'entities');
      return true;
    } catch (error) {
      console.error('❌ [SYSTEM2] Failed to initialize:', error);
      console.error('❌ [SYSTEM2] Error details:', error.message);
      return false;
    }
  }, []);

  /**
   * Load all counties progressively
   */
  const loadCounties = useCallback(async () => {
    console.log('🔧 [SYSTEM2] loadCounties called');
    
    // If manager ref is null, try to get the singleton instance
    if (!managerRef.current && viewerRef.current) {
      console.log('🔄 [SYSTEM2] Re-acquiring singleton manager reference...');
      managerRef.current = CountyBoundaryManager.getInstance(viewerRef.current);
      if (managerRef.current) {
        console.log('✅ [SYSTEM2] Singleton manager re-acquired');
      }
    }
    
    if (!managerRef.current) {
      console.error('❌ [SYSTEM2] Cannot load counties - system not initialized');
      console.error('❌ [SYSTEM2] managerRef.current is null and cannot get singleton!');
      return;
    }

    if (loadingProgress.isLoading) {
      console.log('⚠️ [SYSTEM2] Counties already loading, please wait');
      console.log('⚠️ [SYSTEM2] Current progress:', loadingProgress);
      return;
    }

    console.log('🚀 [SYSTEM2] Starting county load...');
    console.log('🚀 [SYSTEM2] Manager has', managerRef.current.loadedCountries.size, 'already loaded countries');

    // Set loading state
    setLoadingProgress(prev => ({
      ...prev,
      isLoading: true,
      loaded: 0,
      counties: 0,
      success: 0
    }));

    try {
      console.log('🔍 [SYSTEM2] About to call managerRef.current.loadAllCounties()');
      console.log('🔍 [SYSTEM2] managerRef.current exists:', !!managerRef.current);
      console.log('🔍 [SYSTEM2] managerRef.current.loadAllCounties type:', typeof managerRef.current.loadAllCounties);
      
      // Load with progress updates
      const loadPromise = managerRef.current.loadAllCounties((progress) => {
        console.log('📊 [SYSTEM2] Progress update:', progress);
        setLoadingProgress({
          isLoading: true,
          loaded: progress.loaded,
          total: progress.total,
          current: progress.current,
          counties: progress.counties,
          success: progress.success
        });
      });
      
      console.log('🔍 [SYSTEM2] loadAllCounties() promise created, awaiting...');
      await loadPromise;
      console.log('🔍 [SYSTEM2] loadAllCounties() promise resolved');

      // Loading complete - show counties
      console.log('🔍 [SYSTEM2] Calling managerRef.current.show()');
      managerRef.current.show();

      // Update final state
      setLoadingProgress(prev => ({
        ...prev,
        isLoading: false,
        current: null
      }));

      console.log('✅ [SYSTEM2] Counties loaded and visible');

    } catch (error) {
      console.error('❌ [SYSTEM2] Error loading counties:', error);
      console.error('❌ [SYSTEM2] Error stack:', error.stack);
      setLoadingProgress(prev => ({
        ...prev,
        isLoading: false,
        current: null
      }));
    }
  }, [loadingProgress.isLoading]);

  /**
   * Show counties (if already loaded)
   */
  const showCounties = useCallback(() => {
    if (!managerRef.current) {
      console.error('❌ [SYSTEM2] Cannot show counties - system not initialized');
      return;
    }

    managerRef.current.show();
  }, []);

  /**
   * Hide counties
   */
  const hideCounties = useCallback(() => {
    if (!managerRef.current) {
      console.error('❌ [SYSTEM2] Cannot hide counties - system not initialized');
      return;
    }

    managerRef.current.hide();
  }, []);

  /**
   * Clear all loaded counties
   */
  const clearCounties = useCallback(() => {
    if (!managerRef.current) {
      console.error('❌ [SYSTEM2] Cannot clear counties - system not initialized');
      return;
    }

    managerRef.current.clear();
    setLoadingProgress({
      isLoading: false,
      loaded: 0,
      total: 163,
      current: null,
      counties: 0,
      success: 0
    });
  }, []);

  /**
   * Get current status
   */
  const getStatus = useCallback(() => {
    if (!managerRef.current) {
      return null;
    }

    return managerRef.current.getStatus();
  }, []);

  /**
   * Check if system is initialized
   */
  const isInitialized = useCallback(() => {
    return managerRef.current !== null;
  }, []);

  return {
    // Functions
    initializeCountySystem,
    loadCounties,
    showCounties,
    hideCounties,
    clearCounties,
    getStatus,
    isInitialized,
    
    // State
    loadingProgress,
    
    // Direct manager access (if needed)
    manager: managerRef.current
  };
};

export default useCountySystemV2;

