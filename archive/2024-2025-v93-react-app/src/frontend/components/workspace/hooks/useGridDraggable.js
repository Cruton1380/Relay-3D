/**
 * Grid-based Draggable Hook
 * Provides snap-to-grid functionality with proper layout zones
 */
import { useState, useCallback, useRef, useEffect } from 'react';

// Grid configuration
const GRID_SIZE = 20; // Base grid unit in pixels
const MIN_WINDOW_WIDTH = 16 * GRID_SIZE; // 320px minimum
const MIN_WINDOW_HEIGHT = 12 * GRID_SIZE; // 240px minimum
const DEFAULT_WINDOW_WIDTH = 20 * GRID_SIZE; // 400px default
const DEFAULT_WINDOW_HEIGHT = 15 * GRID_SIZE; // 300px default
const WINDOW_PADDING = 1 * GRID_SIZE; // 20px padding between windows

// Window size presets based on content type
const WINDOW_PRESETS = {
  'small': { width: 16 * GRID_SIZE, height: 12 * GRID_SIZE }, // 320x240
  'medium': { width: 20 * GRID_SIZE, height: 15 * GRID_SIZE }, // 400x300
  'large': { width: 25 * GRID_SIZE, height: 20 * GRID_SIZE }, // 500x400
  'wide': { width: 30 * GRID_SIZE, height: 15 * GRID_SIZE }, // 600x300
  'tall': { width: 20 * GRID_SIZE, height: 25 * GRID_SIZE }, // 400x500
  'panel': { width: 15 * GRID_SIZE, height: 30 * GRID_SIZE }, // 300x600
};

export const useGridDraggable = ({ 
  ref, 
  position, 
  onPositionChange, 
  windowType = 'medium',
  disabled = false,
  customSize = null 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showLayoutSuggestions, setShowLayoutSuggestions] = useState(false);
  const [activeZone, setActiveZone] = useState(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const [gridPositions, setGridPositions] = useState([]);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Get window dimensions based on type or custom size
  const getWindowDimensions = useCallback(() => {
    if (customSize) return customSize;
    return WINDOW_PRESETS[windowType] || WINDOW_PRESETS.medium;
  }, [windowType, customSize]);

  // Calculate grid layout zones
  const calculateGridZones = useCallback(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const windowDims = getWindowDimensions();
    
    // Calculate grid cells that fit in viewport
    const cols = Math.floor((viewport.width - WINDOW_PADDING) / (windowDims.width + WINDOW_PADDING));
    const rows = Math.floor((viewport.height - WINDOW_PADDING) / (windowDims.height + WINDOW_PADDING));
    
    const zones = [];
    
    // Generate grid positions
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = WINDOW_PADDING + col * (windowDims.width + WINDOW_PADDING);
        const y = WINDOW_PADDING + row * (windowDims.height + WINDOW_PADDING);
        
        zones.push({
          id: `grid-${row}-${col}`,
          type: 'grid',
          x: x,
          y: y,
          width: windowDims.width,
          height: windowDims.height,
          row: row,
          col: col
        });
      }
    }
    
    // Add special zones
    const specialZones = [
      // Full width zones
      {
        id: 'top-full',
        type: 'special',
        x: WINDOW_PADDING,
        y: WINDOW_PADDING,
        width: viewport.width - (WINDOW_PADDING * 2),
        height: windowDims.height,
        zone: 'top-full'
      },
      {
        id: 'bottom-full',
        type: 'special',
        x: WINDOW_PADDING,
        y: viewport.height - windowDims.height - WINDOW_PADDING,
        width: viewport.width - (WINDOW_PADDING * 2),
        height: windowDims.height,
        zone: 'bottom-full'
      },
      // Half zones
      {
        id: 'left-half',
        type: 'special',
        x: WINDOW_PADDING,
        y: WINDOW_PADDING,
        width: Math.floor((viewport.width - WINDOW_PADDING * 3) / 2),
        height: viewport.height - (WINDOW_PADDING * 2),
        zone: 'left-half'
      },
      {
        id: 'right-half',
        type: 'special',
        x: Math.floor(viewport.width / 2) + WINDOW_PADDING / 2,
        y: WINDOW_PADDING,
        width: Math.floor((viewport.width - WINDOW_PADDING * 3) / 2),
        height: viewport.height - (WINDOW_PADDING * 2),
        zone: 'right-half'
      },
      // Center zone
      {
        id: 'center',
        type: 'special',
        x: Math.floor((viewport.width - windowDims.width) / 2),
        y: Math.floor((viewport.height - windowDims.height) / 2),
        width: windowDims.width,
        height: windowDims.height,
        zone: 'center'
      }
    ];
    
    return [...zones, ...specialZones];
  }, [getWindowDimensions]);

  // Find nearest snap zone
  const findNearestZone = useCallback((mousePos) => {
    const zones = calculateGridZones();
    const windowDims = getWindowDimensions();
    
    // Calculate window center point
    const windowCenter = {
      x: mousePos.x + windowDims.width / 2,
      y: mousePos.y + windowDims.height / 2
    };
    
    let nearestZone = null;
    let minDistance = Infinity;
    
    zones.forEach(zone => {
      const zoneCenter = {
        x: zone.x + zone.width / 2,
        y: zone.y + zone.height / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(windowCenter.x - zoneCenter.x, 2) + 
        Math.pow(windowCenter.y - zoneCenter.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });
    
    // Only return zone if we're close enough (within snap distance)
    const snapDistance = Math.max(windowDims.width, windowDims.height) / 2;
    return minDistance < snapDistance ? nearestZone : null;
  }, [calculateGridZones, getWindowDimensions]);

  // Smooth snap animation
  const smoothSnapTo = useCallback((targetPosition) => {
    if (!onPositionChange || !ref.current) return;
    
    setIsSnapping(true);
    ref.current.classList.add('snapping');
    
    const startPos = position;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentPos = {
        x: startPos.x + (targetPosition.x - startPos.x) * easeOut,
        y: startPos.y + (targetPosition.y - startPos.y) * easeOut
      };

      onPositionChange(currentPos);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSnapping(false);
        if (ref.current) {
          ref.current.classList.remove('snapping');
        }
      }
    };

    requestAnimationFrame(animate);
  }, [position, onPositionChange, ref]);

  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    if (disabled || isSnapping) return;
    
    e.preventDefault();
    setIsDragging(true);
    setShowLayoutSuggestions(true);
    
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, [disabled, isSnapping, ref]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !onPositionChange) return;
    
    const newPosition = {
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y
    };
    
    // Find nearest zone for highlighting
    const nearestZone = findNearestZone(newPosition);
    setActiveZone(nearestZone);
    
    onPositionChange(newPosition);
  }, [isDragging, onPositionChange, findNearestZone]);

  // Handle mouse up
  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setShowLayoutSuggestions(false);
    
    // Snap to nearest zone if close enough
    const finalPosition = {
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y
    };
    
    const nearestZone = findNearestZone(finalPosition);
    if (nearestZone) {
      smoothSnapTo({ x: nearestZone.x, y: nearestZone.y });
    }
    
    setActiveZone(null);
  }, [isDragging, findNearestZone, smoothSnapTo]);

  // Set up event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate layout zones for rendering
  useEffect(() => {
    if (showLayoutSuggestions) {
      const zones = calculateGridZones();
      setGridPositions(zones);
    } else {
      setGridPositions([]);
    }
  }, [showLayoutSuggestions, calculateGridZones]);

  return {
    isDragging,
    showLayoutSuggestions,
    activeZone,
    isSnapping,
    gridPositions,
    handleMouseDown,
    windowDimensions: getWindowDimensions()
  };
};
