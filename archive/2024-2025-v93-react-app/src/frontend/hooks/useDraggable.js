/**
 * Enhanced Draggable Hook
 * Provides smooth drag functionality with snap zones and layout suggestions
 */
import { useState, useCallback, useRef, useEffect } from 'react';

const SNAP_DISTANCE = 40;
const LAYOUT_ZONES = {
  'top-left': { x: 20, y: 20, width: 400, height: 300 },
  'top-right': { x: -420, y: 20, width: 400, height: 300 },
  'bottom-left': { x: 20, y: -320, width: 400, height: 300 },
  'bottom-right': { x: -420, y: -320, width: 400, height: 300 },
  'center': { x: -200, y: -150, width: 400, height: 300 },
  'left-edge': { x: 20, y: -150, width: 380, height: 300 },
  'right-edge': { x: -400, y: -150, width: 380, height: 300 },
  'top-edge': { x: -200, y: 20, width: 400, height: 280 },
  'bottom-edge': { x: -200, y: -300, width: 400, height: 280 }
};

export const useDraggable = ({ ref, position, onPositionChange, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showLayoutSuggestions, setShowLayoutSuggestions] = useState(false);
  const [activeZone, setActiveZone] = useState(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const snapTimeoutRef = useRef(null);

  const getViewportDimensions = useCallback(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }), []);

  const getElementDimensions = useCallback(() => {
    if (!ref.current) return { width: 400, height: 300 };
    const rect = ref.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, [ref]);

  const calculateZonePosition = useCallback((zone, viewport, element) => {
    const zoneConfig = LAYOUT_ZONES[zone];
    if (!zoneConfig) return null;

    let x = zoneConfig.x;
    let y = zoneConfig.y;

    // Handle relative positioning
    if (x < 0) x = viewport.width + x;
    if (y < 0) y = viewport.height + y;

    // Handle center positioning
    if (zone === 'center') {
      x = (viewport.width - element.width) / 2;
      y = (viewport.height - element.height) / 2;
    }
    if (zone === 'left-edge') {
      y = (viewport.height - element.height) / 2;
    }
    if (zone === 'right-edge') {
      x = viewport.width - element.width - 20;
      y = (viewport.height - element.height) / 2;
    }
    if (zone === 'top-edge') {
      x = (viewport.width - element.width) / 2;
    }
    if (zone === 'bottom-edge') {
      x = (viewport.width - element.width) / 2;
      y = viewport.height - element.height - 20;
    }

    return { x, y };
  }, []);

  const detectActiveZone = useCallback((currentPos, viewport, element) => {
    const center = {
      x: currentPos.x + element.width / 2,
      y: currentPos.y + element.height / 2
    };

    // Define zone detection areas
    const zones = [
      { name: 'top-left', area: { x: 0, y: 0, width: viewport.width * 0.3, height: viewport.height * 0.3 } },
      { name: 'top-right', area: { x: viewport.width * 0.7, y: 0, width: viewport.width * 0.3, height: viewport.height * 0.3 } },
      { name: 'bottom-left', area: { x: 0, y: viewport.height * 0.7, width: viewport.width * 0.3, height: viewport.height * 0.3 } },
      { name: 'bottom-right', area: { x: viewport.width * 0.7, y: viewport.height * 0.7, width: viewport.width * 0.3, height: viewport.height * 0.3 } },
      { name: 'left-edge', area: { x: 0, y: viewport.height * 0.3, width: 60, height: viewport.height * 0.4 } },
      { name: 'right-edge', area: { x: viewport.width - 60, y: viewport.height * 0.3, width: 60, height: viewport.height * 0.4 } },
      { name: 'top-edge', area: { x: viewport.width * 0.3, y: 0, width: viewport.width * 0.4, height: 60 } },
      { name: 'bottom-edge', area: { x: viewport.width * 0.3, y: viewport.height - 60, width: viewport.width * 0.4, height: 60 } },
      { name: 'center', area: { x: viewport.width * 0.4, y: viewport.height * 0.4, width: viewport.width * 0.2, height: viewport.height * 0.2 } }
    ];

    for (const zone of zones) {
      const { area } = zone;
      if (center.x >= area.x && center.x <= area.x + area.width &&
          center.y >= area.y && center.y <= area.y + area.height) {
        return zone.name;
      }
    }

    return null;
  }, []);

  const smoothSnapTo = useCallback((targetPosition) => {
    if (!onPositionChange || !ref.current) return;
    
    setIsSnapping(true);
    
    // Add snapping class for CSS animation
    ref.current.classList.add('snapping');
    
    const startPos = position;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
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
        // Remove snapping class
        if (ref.current) {
          ref.current.classList.remove('snapping');
        }
      }
    };

    requestAnimationFrame(animate);
  }, [position, onPositionChange, ref]);

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

    const handleMouseMove = (e) => {
      if (!onPositionChange) return;

      const viewport = getViewportDimensions();
      const element = getElementDimensions();
      
      let newPosition = {
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y
      };
      
      // Keep within viewport bounds with padding
      const padding = 10;
      newPosition.x = Math.max(padding, Math.min(newPosition.x, viewport.width - element.width - padding));
      newPosition.y = Math.max(padding, Math.min(newPosition.y, viewport.height - element.height - padding));
      
      // Detect active zone for visual feedback
      const zone = detectActiveZone(newPosition, viewport, element);
      setActiveZone(zone);
      
      onPositionChange(newPosition);
    };

    const handleMouseUp = () => {
      const viewport = getViewportDimensions();
      const element = getElementDimensions();
      
      // Snap to zone if active
      if (activeZone) {
        const targetPosition = calculateZonePosition(activeZone, viewport, element);
        if (targetPosition) {
          smoothSnapTo(targetPosition);
        }
      }
      
      // Cleanup
      setIsDragging(false);
      setShowLayoutSuggestions(false);
      setActiveZone(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, isSnapping, ref, onPositionChange, getViewportDimensions, getElementDimensions, detectActiveZone, calculateZonePosition, activeZone, smoothSnapTo]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging && onPositionChange && position) {
        const viewport = getViewportDimensions();
        const element = getElementDimensions();
        
        // Ensure overlay stays within bounds on resize
        let newPosition = { ...position };
        const padding = 10;
        
        newPosition.x = Math.max(padding, Math.min(newPosition.x, viewport.width - element.width - padding));
        newPosition.y = Math.max(padding, Math.min(newPosition.y, viewport.height - element.height - padding));
        
        if (newPosition.x !== position.x || newPosition.y !== position.y) {
          onPositionChange(newPosition);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging, position, onPositionChange, getViewportDimensions, getElementDimensions]);

  return {
    isDragging,
    showLayoutSuggestions,
    activeZone,
    isSnapping,
    handleMouseDown
  };
};
