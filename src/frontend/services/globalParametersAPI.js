// frontend/services/globalParametersAPI.js
import { apiGet, apiPost, apiPut } from './apiClient';
import { signMessage } from '../auth/utils/authUtils.js';

/**
 * Get all global parameters
 * @returns {Promise<Object>} Global parameters
 */
export async function getGlobalParameters() {
  return apiGet('/global-parameters');
}

/**
 * Get a specific global parameter
 * @param {string} paramName - Parameter name
 * @returns {Promise<Object>} Parameter data
 */
export async function getParameter(paramName) {
  return apiGet(`/global-parameters/${paramName}`);
}

/**
 * Vote on a global parameter
 * @param {string} paramName - Parameter name
 * @param {*} value - Parameter value
 * @returns {Promise<Object>} Vote result
 */
export async function voteOnParameter(paramName, value) {
  // Sign the vote
  const signature = await signMessage({
    paramName,
    value,
    timestamp: Date.now()
  });
  
  return apiPost('/global-parameters/vote', {
    paramName,
    value,
    signature
  });
}

/**
 * Get voting status for a global parameter
 * @param {string} paramName - Parameter name
 * @returns {Promise<Object>} Voting status
 */
export async function getVotingStatus(paramName) {
  return apiGet(`/global-parameters/${paramName}/voting-status`);
}

/**
 * Get parameter history
 * @param {string} paramName - Parameter name
 * @returns {Promise<Array>} Parameter history
 */
export async function getParameterHistory(paramName) {
  return apiGet(`/global-parameters/${paramName}/history`);
}

/**
 * Format parameter value for display
 * @param {string} paramPath - Parameter path
 * @param {*} value - Parameter value
 * @param {Object} metadata - Parameter metadata
 * @returns {string} Formatted value
 */
export function formatParameterValue(paramPath, value, metadata = {}) {
  // Get parameter type from metadata or infer from value
  const type = metadata.type || typeof value;
  
  switch (type) {
    case 'boolean':
      return value ? 'Enabled' : 'Disabled';
    case 'number':
      if (metadata.isPercentage) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (metadata.unit) {
        return `${value} ${metadata.unit}`;
      }
      return value.toString();
    case 'string':
      return value;
    case 'object':
      return JSON.stringify(value, null, 2);
    default:
      return String(value);
  }
}

/**
 * Initialize parameters UI
 * @param {string} containerId - Container element ID
 * @returns {Promise<void>}
 */
export async function initParametersUI(containerId = 'parameters-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  try {
    // Load parameters
    const params = await getGlobalParameters();
    
    // Load metadata
    const metadata = await getParameterMetadata();
    
    // Create parameters grid
    const grid = document.createElement('div');
    grid.className = 'parameters-grid';
    
    // Create cards for each parameter
    for (const [key, value] of Object.entries(params)) {
      const card = createParameterCard(key, value, metadata[key]);
      grid.appendChild(card);
    }
    
    // Clear container and append grid
    container.innerHTML = '';
    container.appendChild(grid);
  } catch (error) {
    console.error('Error initializing parameters UI:', error);
    container.innerHTML = `<div class="error-message">Failed to load parameters: ${error.message}</div>`;
  }
}

/**
 * Create a parameter card element
 * @param {string} key - Parameter key
 * @param {*} value - Parameter value
 * @param {Object} metadata - Parameter metadata
 * @returns {HTMLElement} Card element
 */
function createParameterCard(key, value, metadata = {}) {
  const card = document.createElement('div');
  card.className = 'parameter-card';
  
  // Parameter title
  const title = document.createElement('h3');
  title.textContent = metadata.title || formatParameterName(key);
  card.appendChild(title);
  
  // Parameter description
  if (metadata.description) {
    const description = document.createElement('div');
    description.className = 'description';
    description.textContent = metadata.description;
    card.appendChild(description);
  }
  
  // Current value
  const currentValue = document.createElement('div');
  currentValue.className = 'current-value';
  currentValue.innerHTML = `<strong>Current:</strong> <span class="value">${formatParameterValue(key, value, metadata)}</span>`;
  card.appendChild(currentValue);
  
  // Parameter controls
  const controls = document.createElement('div');
  controls.className = 'parameter-controls';
  
  // Add controls based on parameter type
  switch (metadata.type || typeof value) {
    case 'boolean':
      addToggleControl(controls, key, value, metadata);
      break;
    case 'number':
      addSliderControl(controls, key, value, metadata);
      break;
    case 'string':
      addTextControl(controls, key, value, metadata);
      break;
    default:
      addTextControl(controls, key, value, metadata, true);
  }
  
  card.appendChild(controls);
  
  return card;
}

/**
 * Format parameter name for display
 * @param {string} name - Parameter name
 * @returns {string} Formatted name
 */
function formatParameterName(name) {
  return name
    .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
    .replace(/^./, s => s.toUpperCase()) // Capitalize first letter
    .replace(/\./g, ' › '); // Replace dots with arrows
}

/**
 * Add toggle control for boolean parameters
 * @param {HTMLElement} container - Container element
 * @param {string} key - Parameter key
 * @param {boolean} value - Parameter value
 * @param {Object} metadata - Parameter metadata
 */
function addToggleControl(container, key, value, metadata) {
  const label = document.createElement('label');
  label.className = 'switch';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => {
    proposeParameterChange(key, input.checked);
  });
  
  const slider = document.createElement('span');
  slider.className = 'slider round';
  
  label.appendChild(input);
  label.appendChild(slider);
  container.appendChild(label);
}

/**
 * Add slider control for number parameters
 * @param {HTMLElement} container - Container element
 * @param {string} key - Parameter key
 * @param {number} value - Parameter value
 * @param {Object} metadata - Parameter metadata
 */
function addSliderControl(container, key, value, metadata) {
  const min = metadata.min ?? 0;
  const max = metadata.max ?? 100;
  const step = metadata.step ?? 1;
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'param-slider';
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = value;
  
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'param-input';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  
  // Sync slider and input
  slider.addEventListener('input', () => {
    input.value = slider.value;
  });
  
  input.addEventListener('input', () => {
    slider.value = input.value;
  });
  
  const button = document.createElement('button');
  button.className = 'propose-btn';
  button.textContent = 'Propose';
  button.addEventListener('click', () => {
    proposeParameterChange(key, parseFloat(input.value));
  });
  
  container.appendChild(slider);
  container.appendChild(input);
  container.appendChild(button);
}

/**
 * Add text control for string parameters
 * @param {HTMLElement} container - Container element
 * @param {string} key - Parameter key
 * @param {string} value - Parameter value
 * @param {Object} metadata - Parameter metadata
 * @param {boolean} isJson - Whether the value is JSON
 */
function addTextControl(container, key, value, metadata, isJson = false) {
  const input = document.createElement(isJson ? 'textarea' : 'input');
  input.className = 'param-input';
  input.value = isJson ? JSON.stringify(value, null, 2) : value;
  if (isJson) {
    input.rows = 5;
  }
  
  const button = document.createElement('button');
  button.className = 'propose-btn';
  button.textContent = 'Propose';
  button.addEventListener('click', () => {
    try {
      const newValue = isJson ? JSON.parse(input.value) : input.value;
      proposeParameterChange(key, newValue);
    } catch (error) {
      alert(`Invalid input: ${error.message}`);
    }
  });
  
  container.appendChild(input);
  container.appendChild(button);
}

/**
 * Propose a parameter change
 * @param {string} paramPath - Parameter path
 * @param {*} value - New parameter value
 * @returns {Promise<Object>} Proposal result
 */
export async function proposeParameterChange(paramPath, value) {
  try {
    const result = await voteOnParameter(paramPath, value);
    
    // Show success message
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = 'Change proposed successfully!';
    
    document.body.appendChild(successElement);
    setTimeout(() => {
      successElement.remove();
    }, 3000);
    
    return result;
  } catch (error) {
    console.error('Error proposing parameter change:', error);
    
    // Show error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = `Error: ${error.message}`;
    
    document.body.appendChild(errorElement);
    setTimeout(() => {
      errorElement.remove();
    }, 3000);
    
    throw error;
  }
}

/**
 * Get parameter metadata
 * @returns {Promise<Object>} Parameter metadata
 */
export async function getParameterMetadata() {
  return apiGet('/global-parameters/metadata');
}

export default {
  getGlobalParameters,
  getParameter,
  voteOnParameter,
  getVotingStatus,
  getParameterHistory,
  formatParameterValue,
  initParametersUI,
  proposeParameterChange,
  getParameterMetadata
};

