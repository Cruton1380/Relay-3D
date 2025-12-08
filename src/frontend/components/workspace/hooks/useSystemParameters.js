/**
 * @fileoverview System Parameters Hook - Advanced React hook for system parameter management
 * @version 2.0.0
 * @author RelayCodeBase Team
 */

'use strict';

import { useState, useEffect, useCallback, useMemo } from 'react';
import systemParametersService from '../services/systemParametersService';

/**
 * Custom hook for comprehensive system parameter management.
 * 
 * Features:
 * - Automatic parameter loading on mount
 * - Optimized state management with useCallback and useMemo
 * - Enhanced error handling with structured error messages
 * - Support for nested parameter paths
 * - Parameter change proposal functionality
 * - Value formatting utilities
 * - Loading state management
 * - Strict mode compatibility
 * 
 * @hook
 * @returns {Object} Hook state and methods
 * @returns {Object} returns.parameters - Current system parameters object
 * @returns {Object} returns.metadata - Parameter metadata including types and constraints
 * @returns {boolean} returns.isLoading - Loading state indicator
 * @returns {string|null} returns.error - Current error message or null
 * @returns {Function} returns.loadParameters - Function to reload parameters
 * @returns {Function} returns.proposeParameterChange - Function to propose parameter changes
 * @returns {Function} returns.formatParameterValue - Function to format parameter values
 * 
 * @example
 * // Basic usage
 * const { parameters, isLoading, error } = useSystemParameters();
 * 
 * @example
 * // With parameter change
 * const { proposeParameterChange } = useSystemParameters();
 * await proposeParameterChange('voting.threshold', 10);
 * 
 * @example
 * // With value formatting
 * const { formatParameterValue, metadata } = useSystemParameters();
 * const formattedValue = formatParameterValue('maxSessionTime', 3600);
 */
export function useSystemParameters() {  // State management with clear initial values
  const [parameters, setParameters] = useState({});
  const [metadata, setMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Memoized helper function for setting nested parameter values
  const setNestedParameterValue = useMemo(() => {
    /**
     * Sets a value in a nested object using a dot-notation path
     * @param {Object} obj - Target object to modify
     * @param {string} path - Dot-notation path (e.g., 'voting.threshold')
     * @param {*} value - Value to set
     * @returns {Object} New object with updated value
     */
    return (obj, path, value) => {
      const newObj = { ...obj };
      const pathParts = path.split('.');
      let current = newObj;
      
      // Navigate to the parent of the target property
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Set the final value
      current[pathParts[pathParts.length - 1]] = value;
      
      return newObj;
    };
  }, []);

  // Load parameters and metadata with enhanced error handling
  const loadParameters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [params, meta] = await Promise.all([
        systemParametersService.getSystemParameters(),
        systemParametersService.getParameterMetadata()
      ]);
      
      setParameters(params);
      setMetadata(meta);
      
      return { parameters: params, metadata: meta };
    } catch (err) {
      const errorMessage = `Failed to load parameters: ${err.message}`;
      setError(errorMessage);
      console.error('useSystemParameters: Parameter loading failed', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Propose a parameter change with optimized state updates
  const proposeParameterChange = useCallback(async (paramPath, value) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await systemParametersService.proposeParameterChange(paramPath, value);
      
      if (result.success) {
        // Update local parameters using the memoized helper
        setParameters(prev => setNestedParameterValue(prev, paramPath, value));
      }
      
      return result;
    } catch (err) {
      const errorMessage = `Failed to propose parameter change: ${err.message}`;
      setError(errorMessage);
      console.error('useSystemParameters: Parameter change proposal failed', { paramPath, value, error: err });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setNestedParameterValue]);
  
  // Format parameter value for display with memoized metadata dependency
  const formatParameterValue = useCallback((paramPath, value) => {
    try {
      return systemParametersService.formatParameterValue(paramPath, value, metadata);
    } catch (err) {
      console.warn('useSystemParameters: Value formatting failed', { paramPath, value, error: err });
      return value; // Fallback to raw value
    }
  }, [metadata]);
  
  // Load parameters on initial mount
  useEffect(() => {
    loadParameters();
  }, [loadParameters]);
  
  // Memoized return object for performance optimization
  const hookResult = useMemo(() => ({
    parameters,
    metadata,
    isLoading,
    error,
    loadParameters,
    proposeParameterChange,
    formatParameterValue
  }), [
    parameters,
    metadata,
    isLoading,
    error,
    loadParameters,
    proposeParameterChange,
    formatParameterValue
  ]);

  return hookResult;
}

export default useSystemParameters;
