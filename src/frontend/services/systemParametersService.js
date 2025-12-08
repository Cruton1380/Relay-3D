/**
 * System Parameters Service
 * Handles system parameter viewing, voting, and updates
 */
import api from './apiClient';
import { signData } from './cryptoService';

/**
 * Get all system parameters
 * @returns {Promise<Object>} Parameters object
 */
export async function getSystemParameters() {
  try {
    const response = await api.get('/system/parameters');
    return response.data.parameters;
  } catch (error) {
    console.error('Error getting system parameters:', error);
    throw error;
  }
}

/**
 * Get parameter metadata (for UI display)
 * @returns {Promise<Object>} Metadata object
 */
export async function getParameterMetadata() {
  try {
    const response = await api.get('/system/parameters/metadata');
    return response.data.metadata;
  } catch (error) {
    console.error('Error getting parameter metadata:', error);
    throw error;
  }
}

/**
 * Propose a parameter change
 * @param {string} paramPath - Parameter path (e.g., 'voting.stabilityThresholdDays')
 * @param {*} value - Proposed value
 * @returns {Promise<Object>} Result with topic ID for voting
 */
export async function proposeParameterChange(paramPath, value) {
  try {
    // Create message to sign
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    const message = { 
      action: 'propose_parameter', 
      paramPath, 
      value, 
      timestamp, 
      nonce 
    };
    
    // Sign the message
    const signature = await signData(message);
    
    // Send the proposal
    const response = await api.post('/system/parameters/propose', {
      paramPath,
      value,
      signature,
      timestamp,
      nonce
    });
    
    return response.data;
  } catch (error) {
    console.error('Error proposing parameter change:', error);
    throw error;
  }
}

/**
 * Format parameter value for display
 * @param {string} paramPath - Parameter path
 * @param {*} value - Parameter value
 * @param {Object} metadata - Parameter metadata
 * @returns {string} Formatted value
 */
export function formatParameterValue(paramPath, value, metadata) {
  const paramMetadata = metadata[paramPath];
  
  if (!paramMetadata) {
    return String(value);
  }
  
  if (paramMetadata.display) {
    return paramMetadata.display(value);
  }
  
  if (paramMetadata.type === 'number') {
    if (paramMetadata.unit === 'days') {
      // Convert milliseconds to days if applicable
      if (value > 1000000) { // Likely in milliseconds
        return `${Math.floor(value / (24 * 60 * 60 * 1000))} days`;
      }
      return `${value} days`;
    }
    
    if (paramMetadata.unit === 'percent') {
      return `${(value * 100).toFixed(0)}%`;
    }
    
    return String(value);
  }
  
  if (paramMetadata.type === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }
  
  return String(value);
}

export default {
  getSystemParameters,
  getParameterMetadata,
  proposeParameterChange,
  formatParameterValue
};
