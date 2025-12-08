#!/usr/bin/env node

console.log('🚀 Starting simplified hardware scanning service...');

import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';

console.log('📦 All imports successful');

class SimpleHardwareScanningService {
  constructor() {
    console.log('🏗️ Creating service instance...');
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.port = 4001;
    
    this.setupExpress();
    console.log('✅ Service instance created');
  }

  setupExpress() {
    console.log('⚙️ Setting up Express...');
    this.app.use(cors());
    this.app.use(express.json());

    this.app.get('/health', (req, res) => {
      res.json({
        service: 'Hardware Scanning Service',
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0'
      });
    });

    this.app.get('/api/hardware/devices', (req, res) => {
      res.json({
        devices: [],
        count: 0,
        lastScan: null
      });
    });
    
    console.log('✅ Express setup complete');
  }

  async start() {
    console.log('🌐 Starting HTTP server...');
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          console.error('❌ Server failed to start:', error);
          reject(error);
        } else {
          console.log(`✅ Hardware Scanning Service running on port ${this.port}`);
          console.log(`🔗 Health check: http://localhost:${this.port}/health`);
          resolve();
        }
      });
    });
  }
}

console.log('🚀 Creating service...');
const service = new SimpleHardwareScanningService();

console.log('🚀 Starting service...');
service.start()
  .then(() => {
    console.log('🎉 Service started successfully!');
  })
  .catch(error => {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  });

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n📤 Shutting down...');
  process.exit(0);
});
