/**
 * Enhanced Grid-based Draggable Hook with Resize
 * Provides snap-to-grid, free movement, and resize functionality
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useWindowManagement } from '../../../context/WindowManagementContext';

export const useEnhancedGridDraggable = ({ 
  ref, 
  position, 
  onPositionChange,
  onSizeChange,
  windowType = 'medium',
  disabled = false,
  windowId = 'default'
}) => {
  const { settings, updateWindow } = useWindowManagement();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [showLayoutSuggestions, setShowLayoutSuggestions] = useState(false);
  const [activeZone, setActiveZone] = useState(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const [windowSize, setWindowSize] = useState(() => getDefaultSize(windowType));
  const [gridPositions, setGridPositions] = useState([]);
  
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Get default window size based on type
  function getDefaultSize(type) {
    const sizes = {
      'small': { width: 320, height: 240 },
      'medium': { width: 400, height: 300 },
      'large': { width: 500, height: 400 },
      'wide': { width: 600, height: 300 },
      'tall': { width: 400, height: 500 },
      'panel': { width: 300, height: 600 }
    };
    return sizes[type] || sizes.medium;
  }

  // Recent position management functions (defined early to avoid hoisting issues)
  const getRecentPositions = useCallback(() => {
    return JSON.parse(localStorage.getItem('relay-recent-positions') || '[]');
  }, []);

  const saveRecentPosition = useCallback((positionData) => {
    const recentPositions = JSON.parse(localStorage.getItem('relay-recent-positions') || '[]');
    const updatedPositions = [positionData, ...recentPositions.filter(pos => 
      !(Math.abs(pos.x - positionData.x) < 20 && Math.abs(pos.y - positionData.y) < 20)
    )].slice(0, 5); // Keep last 5 positions
    localStorage.setItem('relay-recent-positions', JSON.stringify(updatedPositions));
  }, []);

  // Layout management functions
  const saveLayoutUsage = useCallback((zoneId) => {
    const recentLayouts = JSON.parse(localStorage.getItem('relay-recent-layouts') || '[]');
    const updatedLayouts = [zoneId, ...recentLayouts.filter(id => id !== zoneId)].slice(0, 10);
    localStorage.setItem('relay-recent-layouts', JSON.stringify(updatedLayouts));
  }, []);

  const saveLayoutFavorite = useCallback((layoutName, zoneId) => {
    const favorites = JSON.parse(localStorage.getItem('relay-layout-favorites') || '{}');
    favorites[layoutName] = zoneId;
    localStorage.setItem('relay-layout-favorites', JSON.stringify(favorites));
  }, []);

  const getLayoutFavorites = useCallback(() => {
    return JSON.parse(localStorage.getItem('relay-layout-favorites') || '{}');
  }, []);

  const clearLayoutHistory = useCallback(() => {
    localStorage.removeItem('relay-recent-layouts');
    localStorage.removeItem('relay-layout-favorites');
    localStorage.removeItem('relay-recent-positions');
  }, []);

  // Snap position to grid
  const snapToGrid = useCallback((pos) => {
    if (!settings.snapToGrid) return pos;
    
    const gridSize = settings.gridSize;
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  }, [settings.snapToGrid, settings.gridSize]);

  // Calculate well-defined snap zones with modern layouts
  const calculateGridZones = useCallback(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const padding = 16; // Consistent padding
    const zones = [];

    // First, add recent positions as high-priority zones
    const recentPositions = getRecentPositions();
    recentPositions.forEach((pos, index) => {
      zones.push({
        id: `recent-${index}`,
        type: 'recent-position',
        name: `Recent ${index + 1}`,
        // Target dimensions (where window will actually go)
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        // Preview dimensions (small indicator for visual feedback)
        previewX: pos.x + 10,
        previewY: pos.y + 10,
        previewWidth: 60,
        previewHeight: 40,
        priority: 0, // Highest priority
        timestamp: pos.timestamp
      });
    });

    // Define basic snap layouts with target vs preview dimensions
    const basicLayouts = [
      // Primary zones - main screen areas (Top priority after recent)
      {
        id: 'left-half',
        type: 'primary',
        name: 'Left',
        edge: 'left',
        // Target dimensions (where window actually goes)
        x: padding,
        y: padding,
        width: Math.floor((viewport.width - padding * 3) / 2),
        height: viewport.height - padding * 2,
        // Preview dimensions (tiny indicator strip on left edge)
        previewX: 4,
        previewY: viewport.height / 2 - 30,
        previewWidth: 4,
        previewHeight: 60,
        priority: 1
      },
      {
        id: 'right-half',
        type: 'primary', 
        name: 'Right',
        edge: 'right',
        // Target dimensions
        x: Math.floor((viewport.width - padding * 3) / 2) + padding * 2,
        y: padding,
        width: Math.floor((viewport.width - padding * 3) / 2),
        height: viewport.height - padding * 2,
        // Preview dimensions (tiny indicator strip on right edge)
        previewX: viewport.width - 8,
        previewY: viewport.height / 2 - 30,
        previewWidth: 4,
        previewHeight: 60,
        priority: 1
      },
      {
        id: 'top-half',
        type: 'primary',
        name: 'Top',
        edge: 'top',
        // Target dimensions
        x: padding,
        y: padding,
        width: viewport.width - padding * 2,
        height: Math.floor((viewport.height - padding * 3) / 2),
        // Preview dimensions (tiny indicator strip on top edge)
        previewX: viewport.width / 2 - 30,
        previewY: 4,
        previewWidth: 60,
        previewHeight: 4,
        priority: 1
      },
      {
        id: 'bottom-half',
        type: 'primary',
        name: 'Bottom',
        edge: 'bottom',
        // Target dimensions
        x: padding,
        y: Math.floor((viewport.height - padding * 3) / 2) + padding * 2,
        width: viewport.width - padding * 2,
        height: Math.floor((viewport.height - padding * 3) / 2),
        // Preview dimensions (tiny indicator strip on bottom edge)
        previewX: viewport.width / 2 - 30,
        previewY: viewport.height - 8,
        previewWidth: 60,
        previewHeight: 4,
        priority: 1
      },

      // Corner zones for precise placement
      {
        id: 'top-left-quarter',
        type: 'quarter',
        name: 'Top Left',
        // Target dimensions
        x: padding,
        y: padding,
        width: Math.floor((viewport.width - padding * 3) / 2),
        height: Math.floor((viewport.height - padding * 3) / 2),
        // Preview dimensions (tiny corner indicator)
        previewX: 8,
        previewY: 8,
        previewWidth: 24,
        previewHeight: 16,
        priority: 2
      },
      {
        id: 'top-right-quarter',
        type: 'quarter',
        name: 'Top Right',
        // Target dimensions
        x: Math.floor((viewport.width - padding * 3) / 2) + padding * 2,
        y: padding,
        width: Math.floor((viewport.width - padding * 3) / 2),
        height: Math.floor((viewport.height - padding * 3) / 2),
        // Preview dimensions (tiny corner indicator)
        previewX: viewport.width - 32,
        previewY: 8,
        previewWidth: 24,
        previewHeight: 16,
        priority: 2
      },
      {
        id: 'bottom-left-quarter',
        type: 'quarter',
        name: 'Bottom Left',
        // Target dimensions
        x: padding,
        y: Math.floor((viewport.height - padding * 3) / 2) + padding * 2,
        width: Math.floor((viewport.width - padding * 3) / 2),
        height: Math.floor((viewport.height - padding * 3) / 2),
        // Preview dimensions (tiny corner indicator)
        previewX: 8,
        previewY: viewport.height - 24,
        previewWidth: 24,
        previewHeight: 16,
        priority: 2
      },
      {
        id: 'bottom-right-quarter',
        type: 'quarter',
        name: 'Bottom Right',
        // Target dimensions
        x: Math.floor((viewport.width - padding * 3) / 2) + padding * 2,
        y: Math.floor((viewport.height - padding * 3) / 2) + padding * 2,
        width: Math.floor((viewport.width - padding * 3) / 2),
        height: Math.floor((viewport.height - padding * 3) / 2),
        // Preview dimensions (tiny corner indicator)
        previewX: viewport.width - 32,
        previewY: viewport.height - 24,
        previewWidth: 24,
        previewHeight: 16,
        priority: 2
      },

      // Center zone
      {
        id: 'center',
        type: 'special',
        name: 'Center',
        // Target dimensions
        x: viewport.width / 4,
        y: viewport.height / 4,
        width: viewport.width / 2,
        height: viewport.height / 2,
        // Preview dimensions (small center indicator)
        previewX: viewport.width / 2 - 20,
        previewY: viewport.height / 2 - 12,
        previewWidth: 40,
        previewHeight: 24,
        priority: 3
      }
    ];

    zones.push(...basicLayouts);
    return zones;
  }, [getRecentPositions]);

  // Single zone recommendation - ONLY ONE ZONE, NO OVERLAPPING
  const getSingleRecommendedZone = useCallback((mousePos) => {
    const allZones = calculateGridZones();
    const proximityThreshold = 50; // Much tighter threshold - only show when very close to indicator
    
    let bestZone = null;
    let bestDistance = Infinity;
    
    // Find the single best zone
    for (const zone of allZones) {
      // Use preview dimensions for distance calculation (where the indicator actually appears)
      const indicatorCenterX = (zone.previewX || zone.x) + (zone.previewWidth || zone.width) / 2;
      const indicatorCenterY = (zone.previewY || zone.y) + (zone.previewHeight || zone.height) / 2;
      
      const distance = Math.sqrt(
        Math.pow(mousePos.x - indicatorCenterX, 2) + 
        Math.pow(mousePos.y - indicatorCenterY, 2)
      );
      
      // Only consider zones within threshold
      if (distance > proximityThreshold) continue;
      
      // Recent positions get absolute priority
      if (zone.type === 'recent-position') {
        if (!bestZone || bestZone.type !== 'recent-position' || distance < bestDistance) {
          bestZone = { ...zone, distance };
          bestDistance = distance;
        }
      } else if (!bestZone || bestZone.type !== 'recent-position') {
        // For non-recent zones, prioritize by distance and priority
        const isCloserDistance = distance < bestDistance - 30; // 30px threshold
        const isSamePriorityButCloser = Math.abs(distance - bestDistance) < 30 && zone.priority <= (bestZone?.priority || Infinity);
        
        if (isCloserDistance || isSamePriorityButCloser || !bestZone) {
          bestZone = { ...zone, distance };
          bestDistance = distance;
        }
      }
    }
    
    // Return exactly one zone or empty array
    return bestZone ? [bestZone] : [];
  }, [calculateGridZones]);

  // Enhanced zone filtering that returns STRICTLY ONE zone maximum
  const getRelevantZones = useCallback((mousePos) => {
    // Get the single best zone recommendation
    const singleZone = getSingleRecommendedZone(mousePos);
    
    // Absolutely ensure we never return more than one zone
    if (singleZone.length === 0) {
      return [];
    }

    // Apply additional priority boosts for recent layouts
    const recentLayouts = JSON.parse(localStorage.getItem('relay-recent-layouts') || '[]');
    
    if (recentLayouts.length > 0 && recentLayouts.includes(singleZone[0].id)) {
      // Boost the zone if it's a recently used layout
      singleZone[0].priority -= 1;
      singleZone[0].distance *= 0.9; // Slight distance preference
    }

    // CRITICAL: Always return exactly one zone (never more)
    return [singleZone[0]]; // Take only the first (and should be only) zone
  }, [getSingleRecommendedZone]);

  // Find the single recommended zone - GUARANTEES max 1 zone
  const findNearestZone = useCallback((mousePos) => {
    const relevantZones = getRelevantZones(mousePos);
    
    // CRITICAL SAFEGUARD: Never allow more than 1 zone
    const safeZones = relevantZones.slice(0, 1); // Take maximum 1 zone
    
    // With single zone system, either we have one zone (index 0) or none
    const hasZone = safeZones.length > 0;
    
    // Emit global zone update event instead of setting local state
    window.dispatchEvent(new CustomEvent('relay-zones-update', {
      detail: {
        zones: safeZones,
        activeIndex: hasZone ? 0 : null,
        show: hasZone,
        windowId
      }
    }));

    // Return 0 if we have a zone, null if we don't
    return hasZone ? 0 : null;
  }, [getRelevantZones, windowId]);

  // Get resize cursor for edge detection
  const getResizeCursor = useCallback((clientX, clientY) => {
    if (!settings.enableResize || !ref.current) return 'default';
    
    const rect = ref.current.getBoundingClientRect();
    const edgeThreshold = 8;
    
    const isNear = {
      left: clientX - rect.left < edgeThreshold,
      right: rect.right - clientX < edgeThreshold,
      top: clientY - rect.top < edgeThreshold,
      bottom: rect.bottom - clientY < edgeThreshold
    };

    if (isNear.top && isNear.left) return 'nw-resize';
    if (isNear.top && isNear.right) return 'ne-resize';
    if (isNear.bottom && isNear.left) return 'sw-resize';
    if (isNear.bottom && isNear.right) return 'se-resize';
    if (isNear.top) return 'n-resize';
    if (isNear.bottom) return 's-resize';
    if (isNear.left) return 'w-resize';
    if (isNear.right) return 'e-resize';
    
    return 'default';
  }, [settings.enableResize, ref]);

  // Handle mouse down for dragging or resizing
  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const cursor = getResizeCursor(e.clientX, e.clientY);
    const isResizeAction = cursor !== 'default';
    
    if (isResizeAction && settings.enableResize) {
      setIsResizing(true);
      setResizeDirection(cursor);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: windowSize.width,
        height: windowSize.height
      };
    } else if (settings.enableFreeMovement) {
      setIsDragging(true);
      // Don't show layout suggestions immediately - wait for mouse movement
      setShowLayoutSuggestions(false);
      setGridPositions([]); // Start with no zones visible
      setActiveZone(null);
      
      const rect = ref.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, [disabled, getResizeCursor, settings.enableResize, settings.enableFreeMovement, windowSize]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      // Handle different resize directions
      if (resizeDirection.includes('e')) newWidth += deltaX;
      if (resizeDirection.includes('w')) newWidth -= deltaX;
      if (resizeDirection.includes('s')) newHeight += deltaY;
      if (resizeDirection.includes('n')) newHeight -= deltaY;

      // Apply minimum sizes
      newWidth = Math.max(settings.minWindowWidth, newWidth);
      newHeight = Math.max(settings.minWindowHeight, newHeight);

      // Snap to grid if enabled
      if (settings.snapToGrid) {
        newWidth = Math.round(newWidth / settings.gridSize) * settings.gridSize;
        newHeight = Math.round(newHeight / settings.gridSize) * settings.gridSize;
      }

      setWindowSize({ width: newWidth, height: newHeight });
      if (onSizeChange) onSizeChange({ width: newWidth, height: newHeight });
      
    } else if (isDragging) {
      const mousePos = { x: e.clientX, y: e.clientY };
      
      // Find nearest zone with smart filtering
      const nearestZone = findNearestZone(mousePos);
      setActiveZone(nearestZone);
      
      // Only show layout suggestions if we have a nearby zone
      const hasNearbyZone = nearestZone !== null;
      setShowLayoutSuggestions(hasNearbyZone);
      
      if (settings.snapToGrid && nearestZone !== null) {
        setIsSnapping(true);
      } else {
        setIsSnapping(false);
        // Update position immediately if not snapping to a zone
        if (!settings.snapToGrid) {
          const newPos = {
            x: e.clientX - dragOffsetRef.current.x,
            y: e.clientY - dragOffsetRef.current.y
          };
          onPositionChange(newPos);
        }
      }
    }
  }, [isResizing, isDragging, resizeDirection, settings, onSizeChange, onPositionChange, findNearestZone]);

  // Handle mouse up
  const handleMouseUp = useCallback((e) => {
    if (isResizing) {
      setIsResizing(false);
      setResizeDirection(null);
      updateWindow(windowId, { width: windowSize.width, height: windowSize.height });
    } else if (isDragging) {
      if (settings.snapToGrid && activeZone !== null) {
        const currentZones = gridPositions;
        const targetZone = currentZones[activeZone];
        if (targetZone) {
          // Save layout usage for future recommendations
          if (targetZone.type !== 'recent-position') {
            saveLayoutUsage(targetZone.id);
          } else {
            // For recent positions, save the exact position data
            saveRecentPosition({
              x: targetZone.x,
              y: targetZone.y,
              width: targetZone.width,
              height: targetZone.height,
              timestamp: Date.now()
            });
          }
          
          // Snap to zone position
          onPositionChange({ x: targetZone.x, y: targetZone.y });
          
          // Always resize window to match the zone (this was the bug)
          setWindowSize({ width: targetZone.width, height: targetZone.height });
          if (onSizeChange) {
            onSizeChange({ width: targetZone.width, height: targetZone.height });
          }
        }
      } else {
        // If not snapping to a zone, save the current position as a recent position
        const currentPos = ref.current?.getBoundingClientRect();
        if (currentPos) {
          saveRecentPosition({
            x: currentPos.left,
            y: currentPos.top,
            width: currentPos.width,
            height: currentPos.height,
            timestamp: Date.now()
          });
        }
      }
      
      setIsDragging(false);
      setShowLayoutSuggestions(false);
      setActiveZone(null);
      setIsSnapping(false);
      setGridPositions([]); // Clear zones when not dragging
      
      // Emit global zone hide event
      window.dispatchEvent(new CustomEvent('relay-zones-hide', {
        detail: { windowId }
      }));
    }
  }, [isResizing, isDragging, settings.snapToGrid, activeZone, gridPositions, onPositionChange, onSizeChange, updateWindow, windowId, windowSize, saveLayoutUsage, saveRecentPosition, ref]);

  // Set up event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Listen for layout application events from favorites manager
  useEffect(() => {
    const handleApplyLayout = (event) => {
      const { layoutId } = event.detail;
      const allZones = calculateGridZones();
      const targetZone = allZones.find(zone => zone.id === layoutId);
      
      if (targetZone) {
        // Apply the layout immediately
        onPositionChange({ x: targetZone.x, y: targetZone.y });
        
        // Resize window to match zone if it's a layout zone
        if (targetZone.type !== 'special' || targetZone.id === 'maximized') {
          setWindowSize({ width: targetZone.width, height: targetZone.height });
          if (onSizeChange) {
            onSizeChange({ width: targetZone.width, height: targetZone.height });
          }
        }
        
        // Save the layout usage
        saveLayoutUsage(layoutId);
      }
    };

    window.addEventListener('relay-apply-layout', handleApplyLayout);
    
    return () => {
      window.removeEventListener('relay-apply-layout', handleApplyLayout);
    };
  }, [calculateGridZones, onPositionChange, onSizeChange, saveLayoutUsage]);

  // Initialize grid positions as empty (they'll be populated during dragging)
  useEffect(() => {
    setGridPositions([]);
  }, []);

  // Update cursor on hover
  const handleMouseEnter = useCallback((e) => {
    if (!ref.current || disabled) return;
    
    const updateCursor = (e) => {
      const cursor = getResizeCursor(e.clientX, e.clientY);
      ref.current.style.cursor = cursor;
    };
    
    ref.current.addEventListener('mousemove', updateCursor);
    
    return () => {
      if (ref.current) {
        ref.current.removeEventListener('mousemove', updateCursor);
        ref.current.style.cursor = 'default';
      }
    };
  }, [getResizeCursor, disabled]);

  return {
    isDragging,
    isResizing,
    showLayoutSuggestions: false, // Always false since zones are handled globally
    activeZone,
    isSnapping,
    gridPositions: [], // Always empty since zones are handled globally
    windowDimensions: windowSize,
    handleMouseDown,
    handleMouseEnter,
    resizeDirection,
    // Layout management functions
    saveLayoutFavorite,
    getLayoutFavorites,
    clearLayoutHistory
  };
};
