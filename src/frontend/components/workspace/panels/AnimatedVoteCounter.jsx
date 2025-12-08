/**
 * AnimatedVoteCounter - Smooth animated number transitions for vote counts
 * Shows a visual "counting up" or "counting down" effect when votes change
 */
import React, { useState, useEffect, useRef } from 'react';

const AnimatedVoteCounter = ({ value, duration = 200, className = '', style = {} }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false); // NEW: Track if count is going up or down
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(value);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // On first render, set value immediately without animation
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      setDisplayValue(value);
      return;
    }

    // If value hasn't changed, do nothing
    if (value === displayValue) return;

    // INSTANT UPDATE: If we're going from 0 to initial value, set immediately (no animation)
    // This happens when the panel first opens and loads initial vote counts
    if (displayValue === 0 && value > 0) {
      setDisplayValue(value);
      console.log(`🚀 [AnimatedVoteCounter] Instant set: 0 → ${value} (initial load)`);
      return;
    }

    // Start animation
    const increasing = value > displayValue;
    setIsAnimating(true);
    setIsIncreasing(increasing); // Track if count is increasing or decreasing
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    
    console.log(`🔢 [AnimatedVoteCounter] Animating: ${displayValue} → ${value} (${increasing ? 'UP ⬆️' : 'DOWN ⬇️'})`);

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      // Calculate current value
      const currentValue = Math.round(
        startValueRef.current + (value - startValueRef.current) * easeOutCubic
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure final value is set and animation state is cleared
        setDisplayValue(value);
        setIsAnimating(false);
        setIsIncreasing(false); // Reset increasing flag
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Safety timeout: ensure animation state clears even if something goes wrong
    const safetyTimeout = setTimeout(() => {
      setIsAnimating(false);
      setIsIncreasing(false);
      setDisplayValue(value);
    }, duration + 100); // Add 100ms buffer

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearTimeout(safetyTimeout);
    };
  }, [value, duration, displayValue]);

  return (
    <span 
      className={className}
      style={{
        ...style,
        // Instant color transition when reverting to gray, smooth when turning green
        transition: (isAnimating && isIncreasing) ? 'color 0.15s ease, transform 0.2s ease' : 'transform 0.2s ease',
        // ✅ FIXED: Only green when INCREASING, gray when decreasing
        color: isAnimating && isIncreasing ? '#10b981' : (style.color || 'inherit'),
        transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
        display: 'inline-block',
        fontWeight: isAnimating ? '700' : (style.fontWeight || 'inherit'),
      }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
};

export default AnimatedVoteCounter;
