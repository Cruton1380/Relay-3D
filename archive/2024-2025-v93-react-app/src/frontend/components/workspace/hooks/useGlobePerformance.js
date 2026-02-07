import { useEffect, useState } from "react";

/**
 * Hook for monitoring and controlling globe performance
 * Provides real-time performance stats, optimization controls, and UI components
 */
export const useGlobePerformance = () => {
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    tileCount: 0,
    cacheSize: 0,
    renderTime: 0,
    cameraHeight: 0,
    loadingTiles: 0,
  });
  const [performanceMode, setPerformanceModeState] = useState("balanced");

  // Update performance stats every second
  useEffect(() => {
    const updateStats = () => {
      if (window.earthGlobeControls?.getPerformanceStats) {
        try {
          const stats = window.earthGlobeControls.getPerformanceStats();
          setPerformanceStats(stats);
        } catch (error) {
          console.warn("Failed to get performance stats:", error);
        }
      }
    };

    const interval = setInterval(updateStats, 1000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Performance mode control
  const setPerformanceMode = (mode) => {
    if (window.earthGlobeControls?.setPerformanceMode) {
      window.earthGlobeControls.setPerformanceMode(mode);
      setPerformanceModeState(mode);
      console.log(`🎛️ Performance mode changed to: ${mode}`);
    }
  };

  // Quick performance actions
  const performanceActions = {
    // Ultra-fast mode for slow devices
    enableUltraFast: () => setPerformanceMode("ultra_fast"),

    // Balanced mode for most devices
    enableBalanced: () => setPerformanceMode("balanced"),

    // Quality mode for powerful devices
    enableQuality: () => setPerformanceMode("quality"),

    // Instant camera positioning
    jumpTo: (lat, lon, altitude = 10000) => {
      if (window.earthGlobeControls?.jumpToLocation) {
        window.earthGlobeControls.jumpToLocation(lat, lon, altitude);
      }
    },

    // Get current performance stats
    getStats: () => performanceStats,

    // Check if performance is good
    isPerformanceGood: () => performanceStats.fps >= 30,

    // Auto-adjust performance based on FPS
    autoOptimize: () => {
      const { fps } = performanceStats;
      if (fps < 20) {
        console.log("🐌 Low FPS detected, switching to ultra-fast mode");
        setPerformanceMode("ultra_fast");
      } else if (fps < 30) {
        console.log("⚖️ Moderate FPS, switching to balanced mode");
        setPerformanceMode("balanced");
      } else if (fps >= 45) {
        console.log("🚀 Good FPS, enabling quality mode");
        setPerformanceMode("quality");
      }
    },
  };

  // UI Helper functions
  const getFpsColor = (fps) => {
    if (fps >= 45) return "#4CAF50"; // Green - Excellent
    if (fps >= 30) return "#FF9800"; // Orange - Good
    if (fps >= 15) return "#F44336"; // Red - Poor
    return "#9C27B0"; // Purple - Very Poor
  };

  const getPerformanceIcon = () => {
    if (isPerformanceGood()) return "🚀";
    if (performanceStats.fps >= 20) return "⚖️";
    return "🐌";
  };

  return {
    performanceStats,
    performanceMode,
    setPerformanceMode,
    getFpsColor,
    getPerformanceIcon,
    ...performanceActions,
  };
};

export default useGlobePerformance;
