// filepath: c:\Users\eitana\Desktop\RelayCodeBase\backend\di-container\services.mjs
/**
 * @fileoverview Services for Dependency Injection Container
 * Exports service instances that can be imported by other modules
 */

import logger from '../utils/logging/logger.mjs';

/**
 * Logger service for application-wide logging
 * Uses the centralized logger instance from utils/logging
 */
export const loggerService = logger;
