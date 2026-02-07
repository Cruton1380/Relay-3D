/**
 * @fileoverview Reusable Button Component
 * @description A comprehensive, accessible button component with multiple variants and sizes
 * @version 2.0.0
 * @since 1.0.0
 */
import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Button component with comprehensive styling and accessibility features
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} [props.onClick] - Click handler function
 * @param {string} [props.type='button'] - Button HTML type
 * @param {string} [props.variant='primary'] - Button style variant
 * @param {string} [props.size='medium'] - Button size
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.ariaLabel] - Accessibility label
 * @param {boolean} [props.loading=false] - Loading state
 * @param {Object} props.props - Additional HTML button attributes
 * @returns {React.ReactElement} Rendered button component
 */
const Button = memo(({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ariaLabel,
  ...props 
}) => {
  // Memoize base classes for performance
  const baseClasses = useMemo(() => 
    'btn rounded focus:outline-none transition-colors duration-200 font-medium inline-flex items-center justify-center',
    []
  );
  
  // Enhanced variant classes with improved accessibility
  const variantClasses = useMemo(() => ({
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
    outline: 'bg-transparent border-2 border-current text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
  }), []);
  
  // Enhanced size classes
  const sizeClasses = useMemo(() => ({
    small: 'px-3 py-1.5 text-sm min-h-[32px]',
    medium: 'px-4 py-2 text-base min-h-[40px]',
    large: 'px-6 py-3 text-lg min-h-[48px]'
  }), []);
  
  // Enhanced disabled and loading classes
  const stateClasses = useMemo(() => {
    if (loading) return 'opacity-75 cursor-wait';
    if (disabled) return 'opacity-50 cursor-not-allowed';
    return 'cursor-pointer';
  }, [disabled, loading]);
  
  // Memoize final button classes
  const buttonClasses = useMemo(() => [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.medium,
    stateClasses,
    className
  ].filter(Boolean).join(' '), [
    baseClasses, 
    variantClasses, 
    variant, 
    sizeClasses, 
    size, 
    stateClasses, 
    className
  ]);
  
  // Enhanced click handler with loading state protection
  const handleClick = useMemo(() => {
    if (!onClick || loading || disabled) return undefined;
    
    return (event) => {
      try {
        onClick(event);
      } catch (error) {
        console.error('Button click handler error:', error);
      }
    };
  }, [onClick, loading, disabled]);
  
  // Determine effective disabled state
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

// Set display name for debugging
Button.displayName = 'Button';

// PropTypes for development validation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

export default Button;

