// Enhanced DI container

/**
 * Dependency Injection Container
 * Handles service registration and retrieval without configuration logic
 */
class DIContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, instance) {
    this.services.set(name, instance);
    return this;
  }

  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not registered`);
    }
    return this.services.get(name);
  }

  has(name) {
    return this.services.has(name);
  }
}

export default new DIContainer();
