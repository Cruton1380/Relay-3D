/**
 * @fileoverview Simple event bus implementation
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.events[event]) return this;
    
    if (!callback) {
      delete this.events[event];
      return this;
    }
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event, data) {
    if (!this.events[event]) return this;
    
    this.events[event].forEach(callback => {
      setTimeout(() => callback(data), 0);
    });
    return this;
  }
}

export const eventBus = new EventBus();
