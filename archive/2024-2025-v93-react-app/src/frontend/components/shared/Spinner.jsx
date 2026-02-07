/**
 * @fileoverview Modern, accessible Spinner component with performance optimizations
 * @version 2.0.0
 * @author RelayCodeBase Team
 */

'use strict';

import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Size configuration mapping for spinner dimensions
 * @constant {Object<string, string>}
 */
const SIZE_CLASSES = Object.freeze({
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12'
});

/**
 * Color configuration mapping for spinner border colors
 * @constant {Object<string, string>}
 */
const COLOR_CLASSES = Object.freeze({
  primary: 'border-blue-500',
  secondary: 'border-gray-500',
  white: 'border-white'
});

/**
 * Base CSS classes applied to all spinner instances
 * @constant {string}
 */
const BASE_CLASSES = 'spinner border-2 border-t-transparent rounded-full animate-spin';

/**
 * Modern, accessible Spinner component with performance optimizations.
 * 
 * Features:
 * - React.memo for performance optimization
 * - useMemo for expensive class calculations
 * - Enhanced accessibility with ARIA attributes
 * - PropTypes validation for development
 * - Comprehensive JSDoc documentation
 * - Strict mode compatibility
 * 
 * @component
 * @param {Object} props - Component props
 * @param {('small'|'medium'|'large')} props.size - Size variant of the spinner
 * @param {('primary'|'secondary'|'white')} props.color - Color variant of the spinner
 * @returns {React.ReactElement} Rendered spinner component
 * 
 * @example
 * // Basic usage
 * <Spinner />
 * 
 * @example
 * // Custom size and color
 * <Spinner size="large" color="white" />
 */
const Spinner = memo(function Spinner({ size = 'medium', color = 'primary' }) {
  // Memoize size class calculation for performance
  const sizeClass = useMemo(() => {
    return SIZE_CLASSES[size] || SIZE_CLASSES.medium;
  }, [size]);

  // Memoize color class calculation for performance
  const colorClass = useMemo(() => {
    return COLOR_CLASSES[color] || COLOR_CLASSES.primary;
  }, [color]);

  // Memoize complete className string for performance
  const className = useMemo(() => {
    return `${BASE_CLASSES} ${sizeClass} ${colorClass}`;
  }, [sizeClass, colorClass]);

  return (
    <div 
      className={className}
      role="status" 
      aria-label="Loading"
      aria-live="polite"
      data-testid="spinner"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

// PropTypes validation for development
Spinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white'])
};

// Display name for debugging
Spinner.displayName = 'Spinner';

export default Spinner;

