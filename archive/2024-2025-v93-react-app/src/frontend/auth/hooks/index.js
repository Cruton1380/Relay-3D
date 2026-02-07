/**
 * Authentication Hooks
 * Exports all authentication-related hooks
 */
import { useAuth } from '../context/useAuth.js';
import { useSessionMonitor } from './useSessionMonitor.js';
import { useSessionSync } from './useSessionSync.js';

export {
  useAuth,
  useSessionMonitor,
  useSessionSync
};