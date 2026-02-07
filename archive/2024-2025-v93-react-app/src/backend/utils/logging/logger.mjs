/**
 * @fileoverview Centralized logging service
 */
import winston from 'winston';

/**
 * Application logger
 */
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatters } from './formatters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define transports
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      formatters.consoleFormat
    ),
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  new winston.transports.DailyRotateFile({
    level: 'error',
    filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
export const appLogger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'relay-platform' },
  transports,
  exitOnError: false,
});

// Create blockchain-specific logger
export const blockchainLogger = appLogger.child({ module: 'blockchain' });

// Create simplified interface for direct imports
export const logInfo = appLogger.info.bind(appLogger);
export const logError = appLogger.error.bind(appLogger);
export const logWarn = appLogger.warn.bind(appLogger);
export const logDebug = appLogger.debug.bind(appLogger);
export const logHttp = appLogger.http.bind(appLogger);

// Log action utility function
export function logAction(action, details) {
  appLogger.info(`ACTION: ${action}`, { actionDetails: details });
  return true;
}

// Export named logger for consistent imports  
export { appLogger as logger };

// Make logger the default export for backward compatibility
export default appLogger;
