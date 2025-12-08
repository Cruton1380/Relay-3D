/**
 * Mock implementation of PostgreSQL driver for testing
 * This is a temporary solution until pg can be properly installed
 */

class MockClient {
  constructor(config) {
    this.config = config;
    this.connected = false;
  }

  async connect() {
    this.connected = true;
    return Promise.resolve();
  }

  async query(text, params) {
    // Mock query implementation
    console.log('Mock PG Query:', text, params);
    return {
      rows: [],
      rowCount: 0,
      command: 'SELECT'
    };
  }

  async end() {
    this.connected = false;
    return Promise.resolve();
  }
}

class MockPool {
  constructor(config) {
    this.config = config;
    this.clients = [];
  }

  async connect() {
    const client = new MockClient(this.config);
    await client.connect();
    return client;
  }

  async query(text, params) {
    const client = await this.connect();
    const result = await client.query(text, params);
    await client.end();
    return result;
  }

  async end() {
    return Promise.resolve();
  }
}

export default {
  Client: MockClient,
  Pool: MockPool
};

export { MockClient as Client, MockPool as Pool };
