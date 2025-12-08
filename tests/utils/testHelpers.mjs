// File: test/utils/testHelpers.mjs

/**
 * @fileoverview Common test helpers
 */
import { vi } from 'vitest';

/**
 * Creates a mock response object for testing Express handlers
 * @returns {Object} Mock response with common Express methods
 */
export function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    locals: {},
    headersSent: false,
    headers: {},
  };
  
  // Add header methods
  res.setHeader = vi.fn((name, value) => {
    res.headers[name.toLowerCase()] = value;
    return res;
  });
  
  res.getHeader = vi.fn((name) => {
    return res.headers[name.toLowerCase()];
  });
  
  return res;
}

/**
 * Creates a mock request object for testing Express handlers
 * @param {Object} options - Options to customize the request
 * @returns {Object} Mock request with common Express properties
 */
export function createMockRequest(options = {}) {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    path: '/',
    method: 'GET',
    requestId: 'test-request-id',
    user: null,
    ...options,
  };
}

/**
 * Creates a mock WebSocket connection
 * @returns {Object} Mock WebSocket object
 */
export function createMockWebSocket() {
  return {
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    readyState: 1, // OPEN
    listeners: {},
    addEventListener: vi.fn((event, listener) => {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(listener);
    }),
    removeEventListener: vi.fn((event, listener) => {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }),
    dispatchEvent: vi.fn((event) => {
      if (!this.listeners[event.type]) return;
      this.listeners[event.type].forEach(listener => listener(event));
    }),
  };
}

/**
 * Waits for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a promise that can be resolved/rejected externally
 * @returns {Object} Object with promise, resolve and reject
 */
export function createDeferred() {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}
