/**
 * Centralized Path Configuration
 * Prevents import path issues by providing a single source of truth
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define all common paths relative to project root
export const PATHS = {
  // Backend paths
  BACKEND_ROOT: join(__dirname, '..'),
  UTILS: join(__dirname, '..', 'utils'),
  LOGGING: join(__dirname, '..', 'utils', 'logging'),
  SERVICES: join(__dirname, '..', 'services'),
  ROUTES: join(__dirname, '..', 'routes'),
  VOTING: join(__dirname, '..', 'voting'),
  AUTH: join(__dirname, '..', 'auth'),
  DATABASE: join(__dirname, '..', 'database'),
  
  // Data paths
  DATA_ROOT: join(__dirname, '..', '..', 'data'),
  BLOCKCHAIN: join(__dirname, '..', '..', 'data', 'blockchain'),
  USERS: join(__dirname, '..', '..', 'data', 'users'),
  VOTING_DATA: join(__dirname, '..', '..', 'data', 'voting'),
  
  // Logs
  LOGS: join(__dirname, '..', '..', 'logs')
};

// Helper function to get relative path from any file
export function getRelativePath(fromFile, toPath) {
  const fromDir = dirname(fromFile);
  return join(fromDir, toPath);
}

// Pre-validated import paths
export const IMPORTS = {
  LOGGER: 'file://' + join(PATHS.LOGGING, 'logger.mjs'),
  BLOCKCHAIN: 'file://' + join(PATHS.BLOCKCHAIN, 'blockchain.mjs'),
  STATE: 'file://' + join(PATHS.BACKEND_ROOT, 'state', 'state.mjs')
};
