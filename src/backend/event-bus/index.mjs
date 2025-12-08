import { EventEmitter } from 'events';
import logger from '../utils/logging/logger.mjs';

const eventLogger = logger.child({ module: 'event-bus' });

/**
 * Enhanced event bus with logging, error handling and context binding
 * @extends EventEmitter
 */
export class EventBus extends EventEmitter {
  /**
   * Create a new EventBus
   */
  constructor() {
    super();
    this.setMaxListeners(100); // Set high limit for listeners
    
    // Log uncaught errors in event handlers
    this.on('error', (error, eventName) => {
      eventLogger.error(`Error in event handler for "${eventName}"`, {
        error: error.message,
        stack: error.stack
      });
    });
  }
  
  /**
   * Emit an event with logging
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   * @returns {boolean} Whether the event had listeners
   */
  emit(eventName, data) {
    eventLogger.debug(`Event emitted: ${eventName}`);
    
    try {
      return super.emit(eventName, data);
    } catch (error) {
      eventLogger.error(`Error emitting event "${eventName}"`, {
        error: error.message,
        stack: error.stack
      });
      
      // Re-emit as error event
      super.emit('error', error, eventName);
      return false;
    }
  }
  
  /**
   * Register an event listener with error handling
   * @param {string} eventName - Name of the event
   * @param {Function} listener - Event listener function
   * @returns {EventBus} this
   */
  on(eventName, listener) {
    const wrappedListener = async (data) => {
      try {
        await listener(data);
      } catch (error) {
        eventLogger.error(`Error in listener for "${eventName}"`, {
          error: error.message,
          stack: error.stack
        });
        
        // Re-emit as error event
        super.emit('error', error, eventName);
      }
    };
    
    return super.on(eventName, wrappedListener);
  }
  
  /**
   * Register a one-time event listener with error handling
   * @param {string} eventName - Name of the event
   * @param {Function} listener - Event listener function
   * @returns {EventBus} this
   */
  once(eventName, listener) {
    const wrappedListener = async (data) => {
      try {
        await listener(data);
      } catch (error) {
        eventLogger.error(`Error in one-time listener for "${eventName}"`, {
          error: error.message,
          stack: error.stack
        });
        
        // Re-emit as error event
        super.emit('error', error, eventName);
      }
    };
    
    return super.once(eventName, wrappedListener);
  }
  
  /**
   * Register an event listener with a timeout
   * @param {string} eventName - Name of the event
   * @param {Function} listener - Event listener function
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Function} Function to remove the listener
   */
  onWithTimeout(eventName, listener, timeout) {
    const timeoutId = setTimeout(() => {
      this.off(eventName, wrappedListener);
      eventLogger.warn(`Listener for "${eventName}" timed out after ${timeout}ms`);
    }, timeout);
    
    const wrappedListener = async (data) => {
      clearTimeout(timeoutId);
      try {
        await listener(data);
      } catch (error) {
        eventLogger.error(`Error in listener for "${eventName}"`, {
          error: error.message,
          stack: error.stack
        });
        
        // Re-emit as error event
        super.emit('error', error, eventName);
      }
    };
    
    this.on(eventName, wrappedListener);
    
    // Return function to remove listener and clear timeout
    return () => {
      clearTimeout(timeoutId);
      this.off(eventName, wrappedListener);
    };
  }
  
  /**
   * Register an event listener with context binding
   * @param {string} eventName - Name of the event
   * @param {Object} context - Context to bind the listener to
   * @param {Function} listener - Event listener function
   * @returns {Function} Function to remove the listener
   */
  onWithContext(eventName, context, listener) {
    const boundListener = listener.bind(context);
    this.on(eventName, boundListener);
    return () => this.off(eventName, boundListener);
  }
}

// Export a singleton instance with consistent pattern
export const eventBus = new EventBus();
export default eventBus;
