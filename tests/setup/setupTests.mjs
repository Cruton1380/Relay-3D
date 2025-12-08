// File: test/setup/setupTests.mjs

/**
 * @fileoverview Main test setup file
 * Sets up the test environment for both backend and frontend tests
 */
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JSDOM } from 'jsdom';

// Configure React Testing Library to work with React 18
import { configure } from '@testing-library/react';
configure({ 
  testIdAttribute: 'data-testid',
  reactStrictMode: true,
});

// Mock environment variables
process.env.NODE_ENV = 'test';

// Setup browser environment for Node.js tests
const setupBrowserEnv = () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });

  // Mock crypto API
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      subtle: {
        digest: () => Promise.resolve(new ArrayBuffer(32)),
      },
      randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }),
    };
  }

  // Mock fetch
  global.fetch = vi.fn();
  global.Response = dom.window.Response;
  global.Request = dom.window.Request;
  global.Headers = dom.window.Headers;
  
  // Mock WebSocket
  global.WebSocket = class MockWebSocket {
    constructor() {
      this.readyState = 1;
      this.onopen = null;
      this.onclose = null;
      this.onmessage = null;
      this.onerror = null;
      
      setTimeout(() => {
        if (this.onopen) this.onopen({ target: this });
      }, 0);
    }
    
    send(data) {
      // Mock implementation
    }
    
    close() {
      if (this.onclose) this.onclose({ target: this });
    }
  };
};

// Setup for Node.js environment
const setupNodeEnv = () => {
  // Mock environment variables
  process.env.NODE_ENV = 'test';
  
  // Note: Module mocks (vi.mock) should be done in individual test files
  // not in the global setup file to avoid test discovery issues
};

// Run the setup
setupBrowserEnv();
setupNodeEnv();

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// Global test helpers
global.waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
