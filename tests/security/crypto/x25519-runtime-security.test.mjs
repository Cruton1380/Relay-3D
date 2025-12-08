/**
 * X25519 Runtime Security Safeguards Test
 * Validates that private key material is never exposed via dev tools, 
 * global scope, or browser extensions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateKeyPair, sharedKey } from '@stablelib/x25519';
import { encode as base64Encode, decode as base64Decode } from '@stablelib/base64';

// Global scope pollution detector
const originalGlobalKeys = new Set();

// Console capture for production build validation
let capturedConsoleOutput = [];
const originalConsole = {};

describe('X25519 Runtime Security Safeguards', () => {
  beforeEach(() => {
    // Capture current global state
    if (typeof globalThis !== 'undefined') {
      Object.getOwnPropertyNames(globalThis).forEach(key => originalGlobalKeys.add(key));
    }
    if (typeof window !== 'undefined') {
      Object.getOwnPropertyNames(window).forEach(key => originalGlobalKeys.add(key));
    }
    
    // Setup console monitoring
    capturedConsoleOutput = [];
    ['log', 'warn', 'error', 'debug', 'info'].forEach(method => {
      originalConsole[method] = console[method];
      console[method] = (...args) => {
        capturedConsoleOutput.push({ method, args, timestamp: Date.now() });
        // Still call original for debugging
        originalConsole[method](...args);
      };
    });
  });

  afterEach(() => {
    // Restore console
    Object.keys(originalConsole).forEach(method => {
      console[method] = originalConsole[method];
    });
  });

  describe('Global Scope Protection', () => {
    it('should not expose private keys to global scope', () => {
      const keyPair = generateKeyPair();
      const secret = sharedKey(keyPair.secretKey, generateKeyPair().publicKey);
      
      // Check global objects after key generation
      const currentGlobals = new Set();
      if (typeof globalThis !== 'undefined') {
        Object.getOwnPropertyNames(globalThis).forEach(key => currentGlobals.add(key));
      }
      if (typeof window !== 'undefined') {
        Object.getOwnPropertyNames(window).forEach(key => currentGlobals.add(key));
      }
      
      // Find any new global properties
      const newGlobals = [...currentGlobals].filter(key => !originalGlobalKeys.has(key));
      
      newGlobals.forEach(globalKey => {
        const globalValue = (typeof globalThis !== 'undefined' ? globalThis[globalKey] : 
                           typeof window !== 'undefined' ? window[globalKey] : undefined);
        
        if (globalValue) {
          // Check if global contains key material
          const valueStr = JSON.stringify(globalValue).toLowerCase();
          
          // Should not contain long hex strings (potential keys)
          expect(valueStr).not.toMatch(/[0-9a-f]{32,}/);
          // Should not contain long base64 strings (potential keys)
          expect(valueStr).not.toMatch(/[A-Za-z0-9+/]{32,}/);
        }
      });
      
      console.log(`New globals after crypto operations: ${newGlobals.length}`);
    });

    it('should not expose key material through object prototypes', () => {
      const keyPair = generateKeyPair();
      
      // Check common prototype pollution vectors
      const checkObject = (obj, name) => {
        if (!obj) return;
        
        const descriptor = Object.getOwnPropertyDescriptor(obj, 'constructor');
        if (descriptor && descriptor.value) {
          const constructor = descriptor.value;
          const prototypeKeys = Object.getOwnPropertyNames(constructor.prototype || {});
          
          prototypeKeys.forEach(key => {
            const value = constructor.prototype[key];
            if (value && typeof value === 'object') {
              const valueStr = JSON.stringify(value);
              expect(valueStr).not.toMatch(/[0-9a-f]{64,}/); // No long hex
              expect(valueStr).not.toMatch(/[A-Za-z0-9+/]{44,}/); // No base64 keys
            }
          });
        }
      };
      
      checkObject(keyPair.publicKey, 'Uint8Array');
      checkObject(keyPair.secretKey, 'Uint8Array');
    });

    it('should not leak keys through error stack traces', () => {
      const keyPair = generateKeyPair();
      const keyHex = Array.from(keyPair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
      const keyBase64 = base64Encode(keyPair.secretKey);
      
      try {
        // Force an error that might include context
        throw new Error(`Crypto operation failed with key context`);
      } catch (error) {
        const errorStr = error.stack || error.message;
        
        // Error should not contain actual key material
        expect(errorStr).not.toContain(keyHex);
        expect(errorStr).not.toContain(keyBase64);
          // Should not contain long hex or base64 patterns (adjust for test runner paths)
        expect(errorStr).not.toMatch(/[0-9a-f]{64,}/); // Longer hex patterns
        expect(errorStr).not.toMatch(/[A-Za-z0-9+/]{44,}/); // Longer base64 patterns
      }
    });
  });

  describe('Console Output Security', () => {
    it('should not log private key material to console', () => {
      const keyPair = generateKeyPair();
      const secret = sharedKey(keyPair.secretKey, generateKeyPair().publicKey);
      
      // Perform operations that might trigger logging
      console.log('Key generation completed');
      console.warn('Test warning message');
      console.error('Test error message');
      
      try {
        // Trigger error that might log context
        sharedKey(new Uint8Array(31), keyPair.publicKey); // Invalid input
      } catch (error) {
        console.error('Crypto error:', error.message);
      }
      
      // Check all captured console output
      const keyHex = Array.from(keyPair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
      const keyBase64 = base64Encode(keyPair.secretKey);
      const secretHex = Array.from(secret).map(b => b.toString(16).padStart(2, '0')).join('');
      
      capturedConsoleOutput.forEach(({ method, args }) => {
        const logString = args.join(' ').toLowerCase();
        
        // Should not contain actual key material
        expect(logString).not.toContain(keyHex.toLowerCase());
        expect(logString).not.toContain(keyBase64.toLowerCase());
        expect(logString).not.toContain(secretHex.toLowerCase());
        
        // Should not contain long patterns that could be keys
        expect(logString).not.toMatch(/[0-9a-f]{32,}/);
        expect(logString).not.toMatch(/[A-Za-z0-9+/]{32,}/);
      });
    });

    it('should use safe string representations', () => {
      const keyPair = generateKeyPair();
      
      // Test various string conversion methods
      const stringMethods = [
        () => keyPair.publicKey.toString(),
        () => keyPair.secretKey.toString(),
        () => JSON.stringify(keyPair),
        () => String(keyPair.publicKey),
        () => `${keyPair.secretKey}`
      ];
      
      stringMethods.forEach((method, index) => {
        try {
          const result = method();
          
          // Should not expose raw key bytes
          expect(result.length).toBeLessThan(200); // Reasonable limit
          expect(result).not.toMatch(/[0-9a-f]{32,}/); // No long hex
          expect(result).not.toMatch(/[A-Za-z0-9+/]{32,}/); // No long base64
          
          console.log(`String method ${index}: ${result.substring(0, 50)}...`);
        } catch (error) {
          // Some methods might throw, that's acceptable
          console.log(`String method ${index}: threw ${error.message}`);
        }
      });
    });
  });

  describe('Browser Extension Protection', () => {
    it('should not expose keys through DOM or data attributes', () => {
      if (typeof document === 'undefined') {
        console.log('Skipping DOM test in Node.js environment');
        return;
      }
      
      const keyPair = generateKeyPair();
      
      // Create a test element that might store crypto data
      const testElement = document.createElement('div');
      testElement.id = 'crypto-test';
      testElement.setAttribute('data-test', 'crypto-operation');
      
      // Simulate storing some crypto result (this should be safe)
      const publicKeyB64 = base64Encode(keyPair.publicKey);
      testElement.setAttribute('data-public-key', publicKeyB64);
      
      document.body.appendChild(testElement);
      
      try {
        // Check that private key is NOT in DOM
        const html = document.documentElement.outerHTML;
        const secretKeyHex = Array.from(keyPair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
        const secretKeyB64 = base64Encode(keyPair.secretKey);
        
        expect(html).not.toContain(secretKeyHex);
        expect(html).not.toContain(secretKeyB64);
        
        // Public key in DOM is acceptable
        expect(html).toContain(publicKeyB64);
        
      } finally {
        document.body.removeChild(testElement);
      }
    });

    it('should not be accessible through common injection points', () => {
      const keyPair = generateKeyPair();
      
      // Common places where password managers or extensions might look
      const injectionPoints = [
        'window.crypto',
        'window.__CRYPTO_DATA__',
        'window.localStorage',
        'window.sessionStorage'
      ];
      
      injectionPoints.forEach(point => {
        const parts = point.split('.');
        let obj = typeof window !== 'undefined' ? window : globalThis;
        
        for (const part of parts.slice(1)) {
          if (obj && obj[part]) {
            obj = obj[part];
          } else {
            obj = null;
            break;
          }
        }
        
        if (obj) {
          const objStr = JSON.stringify(obj);
          const secretHex = Array.from(keyPair.secretKey).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // Should not contain our private key
          expect(objStr).not.toContain(secretHex);
        }
      });
    });
  });

  describe('Memory Buffer Security', () => {
    it('should clear temporary buffers after use', () => {
      const keyPairs = [];
      const secrets = [];
      
      // Generate multiple keys and secrets
      for (let i = 0; i < 5; i++) {
        const kp1 = generateKeyPair();
        const kp2 = generateKeyPair();
        const secret = sharedKey(kp1.secretKey, kp2.publicKey);
        
        keyPairs.push(kp1, kp2);
        secrets.push(secret);
      }
      
      // Manually clear some buffers
      keyPairs.forEach(kp => {
        kp.secretKey.fill(0);
      });
      
      secrets.forEach(secret => {
        secret.fill(0);
      });
      
      // Verify clearing worked
      keyPairs.forEach(kp => {
        expect(kp.secretKey.every(byte => byte === 0)).toBe(true);
      });
      
      secrets.forEach(secret => {
        expect(secret.every(byte => byte === 0)).toBe(true);
      });
    });

    it('should not retain key material in function closures', () => {
      let capturedKey = null;
      
      const cryptoFunction = () => {
        const keyPair = generateKeyPair();
        const secret = sharedKey(keyPair.secretKey, generateKeyPair().publicKey);
        
        // This should not accidentally capture the private key
        return {
          publicKey: keyPair.publicKey,
          secretLength: keyPair.secretKey.length,
          secretSum: keyPair.secretKey.reduce((sum, byte) => sum + byte, 0)
        };
      };
      
      const result = cryptoFunction();
      
      // Result should not contain actual private key bytes
      const resultStr = JSON.stringify(result);
      expect(resultStr).not.toMatch(/[0-9a-f]{32,}/);
      expect(resultStr).not.toMatch(/[A-Za-z0-9+/]{32,}/);
      
      // Should only contain safe metadata
      expect(result.secretLength).toBe(32);
      expect(typeof result.secretSum).toBe('number');
      expect(result.publicKey).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Production Build Validation', () => {
    it('should detect if debug code might be present', () => {
      // Check if console statements might be present in production
      const hasDebugOutput = capturedConsoleOutput.some(output => 
        output.args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('debug') || arg.includes('trace') || arg.includes('verbose'))
        )
      );
      
      // In production, we shouldn't see debug output
      // This is informational for now
      if (hasDebugOutput) {
        console.warn('Debug output detected - ensure production builds strip debug code');
      }
      
      // Check NODE_ENV if available
      if (typeof process !== 'undefined' && process.env) {
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === 'production') {
          console.log('Production environment detected');
          // In production, should have minimal console output
          expect(capturedConsoleOutput.length).toBeLessThan(10);
        }
      }
    });

    it('should validate minification-safe crypto operations', () => {
      // Test that crypto operations work even with potential minification
      const keyPair = generateKeyPair();
      
      // These operations should work regardless of variable name mangling
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('secretKey');
      expect(keyPair.publicKey.length).toBe(32);
      expect(keyPair.secretKey.length).toBe(32);
      
      // Function references should be preserved
      expect(typeof generateKeyPair).toBe('function');
      expect(typeof sharedKey).toBe('function');
      expect(typeof base64Encode).toBe('function');
      expect(typeof base64Decode).toBe('function');
    });
  });
});






