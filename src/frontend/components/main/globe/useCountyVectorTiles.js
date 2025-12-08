/**
 * useCountyVectorTiles.js
 * 
 * React hook for vector tile county rendering:
 * - Vector tiles (deck.gl) for ALL 50k+ county outlines (always visible)
 * 
 * This solves Cesium's entity limit by using GPU-accelerated vector tiles.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { CountyVectorTileManager } from './managers/CountyVectorTileManager';

export const useCountyVectorTiles = (viewerRef, deckOverlayRef) => {
  const vectorManagerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize the vector tile county system
   */
  const initializeCountySystem = useCallback((viewer, deck, options) => {
    if (!viewer || !deck) {
      console.error('❌ [VectorTiles] Cannot initialize - viewer or deck.gl instance not provided');
      return false;
    }
    if (vectorManagerRef.current) {
      console.log('♻️ [VectorTiles] System already initialized, reusing.');
      setIsInitialized(true);
      return true;
    }
    try {
      console.log('🔧 [VectorTiles] Initializing vector tile system...');
      
      // Initialize vector tile layer (for all county outlines)
      vectorManagerRef.current = new CountyVectorTileManager(viewer, deck, {
        urlTemplate: options?.urlTemplate || '/tiles/county/{z}/{x}/{y}.pbf',
        debugMode: true,
        onClick: options?.onClick,
        onHover: options?.onHover
      });
      
      setIsInitialized(true);
      console.log('✅ [VectorTiles] Vector tile system initialized');
      console.log('   📍 Ready to show ALL county outlines globally');
      return true;
    } catch (error) {
      console.error('❌ [VectorTiles] Failed to initialize:', error);
      return false;
    }
  }, []);

  /**
   * Show counties (vector outlines)
   */
  const showCounties = useCallback(() => {
    if (vectorManagerRef.current) {
      vectorManagerRef.current.show();
      setIsVisible(true);
      console.log('🌍 [VectorTiles] County boundaries shown globally');
    } else {
      console.warn('⚠️ [VectorTiles] System not initialized, cannot show counties.');
    }
  }, []);

  /**
   * Hide counties
   */
  const hideCounties = useCallback(() => {
    if (vectorManagerRef.current) {
      vectorManagerRef.current.hide();
      setIsVisible(false);
      console.log('🌍 [VectorTiles] County boundaries hidden');
    } else {
      console.warn('⚠️ [VectorTiles] System not initialized, cannot hide counties.');
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (vectorManagerRef.current) {
        vectorManagerRef.current = null;
      }
      setIsInitialized(false);
      setIsVisible(false);
      console.log('🧹 [VectorTiles] Cleaned up');
    };
  }, []);

  return {
    initializeCountySystem,
    showCounties,
    hideCounties,
    isVisible,
    isInitialized,
    vectorManager: vectorManagerRef.current
  };
};

export default useCountyVectorTiles;
