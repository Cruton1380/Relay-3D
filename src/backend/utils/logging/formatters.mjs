/**
 * Logging formatters and utility functions
 */
import winston from 'winston';
import { inspect } from 'util';

/**
 * Custom console format
 */
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Handle objects and error stacks
  let meta = '';
  if (Object.keys(metadata).length > 0) {
    // Exclude service from output since it's always the same
    const { service, ...rest } = metadata;
    if (Object.keys(rest).length > 0) {
      meta = '\n' + inspect(rest, { colors: true, depth: 4 });
    }
  }
  
  return `${timestamp} [${level}]: ${message}${meta}`;
});

/**
 * Redact sensitive information from logs
 * @param {object} data - Data to redact
 * @returns {object} Redacted data
 */
function redactSensitiveInfo(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'credential',
    'biometric', 'signature', 'privateKey'
  ];
  
  const result = { ...data };
  
  Object.keys(result).forEach(key => {
    // Check if key contains sensitive information
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      result[key] = '[REDACTED]';
    }
    // Recursively process nested objects
    else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = redactSensitiveInfo(result[key]);
    }
  });
  
  return result;
}

/**
 * Formats a log entry for security auditing
 * @param {object} logEntry - Log entry to format
 * @returns {string} Formatted log entry
 */
function formatSecurityLog(logEntry) {
  const { action, user, resource, outcome, ...rest } = logEntry;
  
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    user,
    resource,
    outcome,
    details: rest
  });
}

export const formatters = {
  consoleFormat,
  redactSensitiveInfo,
  formatSecurityLog
};
