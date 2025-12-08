/**
 * @fileoverview Service Startup Orchestrator
 * Manages startup of all proximity channel system services with proper dependency management
 */
import { spawn } from 'child_process';

class ServiceOrchestrator {
  constructor() {
    this.services = new Map();
    this.startupOrder = [
      'hardware-scanning',
      'channel-service',
      'social-service',
      'main-backend'
    ];
      this.serviceConfigs = {
      'hardware-scanning': {
        name: 'Hardware Scanning Service',
        script: 'src/backend/hardware-scanning-service/index.mjs',
        port: process.env.HARDWARE_SERVICE_PORT || 4001,
        healthEndpoint: '/health',
        dependencies: []
      },
      'channel-service': {
        name: 'Channel Service',
        script: 'src/backend/channel-service/index.mjs',
        port: process.env.CHANNEL_SERVICE_PORT || 4003,
        healthEndpoint: '/health',
        dependencies: ['hardware-scanning']
      },
      'social-service': {
        name: 'Social Service',
        script: 'src/backend/social-service/index.mjs',
        port: process.env.SOCIAL_SERVICE_PORT || 4002,
        healthEndpoint: '/health',
        dependencies: []
      },
      'main-backend': {
        name: 'Main Backend',
        script: 'src/backend/server.mjs',
        port: process.env.PORT || 3000,
        healthEndpoint: '/api/health',
        dependencies: ['channel-service', 'social-service']
      }
    };
    
    this.shutdownInProgress = false;
    this.setupGracefulShutdown();
  }

  /**
   * Start all services in proper dependency order
   */
  async startAll() {
    console.log('🚀 Starting Relay Platform Services...');
    
    try {
      for (const serviceName of this.startupOrder) {
        await this.startService(serviceName);
        await this.waitForService(serviceName);
      }
      
      console.log('✅ All services started successfully!');
      this.logServiceStatus();
      
      // Keep the process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error('❌ Failed to start services:', error);
      await this.shutdownAll();
      process.exit(1);
    }
  }

  /**
   * Start a specific service
   * @param {string} serviceName - Name of service to start
   */
  async startService(serviceName) {
    const config = this.serviceConfigs[serviceName];
    if (!config) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Check dependencies first
    for (const dep of config.dependencies) {
      if (!this.isServiceRunning(dep)) {
        throw new Error(`Dependency ${dep} is not running for service ${serviceName}`);
      }
    }

    console.log(`🔄 Starting ${config.name}...`);

    const child = spawn('node', [config.script], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    // Store service process
    this.services.set(serviceName, {
      process: child,
      config,
      status: 'starting',
      startTime: Date.now()
    });

    // Handle service output
    child.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[${config.name}] ${message}`);
      }
    });

    child.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.error(`[${config.name}] ${message}`);
      }
    });

    // Handle service exit
    child.on('exit', (code, signal) => {
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'stopped';
        if (code !== 0 && !this.shutdownInProgress) {
          console.error(`💥 ${config.name} exited with code ${code} (signal: ${signal})`);
          this.handleServiceFailure(serviceName);
        } else {
          console.log(`🛑 ${config.name} stopped gracefully`);
        }
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to start ${config.name}:`, error);
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'error';
      }
    });
  }

  /**
   * Wait for a service to become ready
   * @param {string} serviceName - Name of service to wait for
   */
  async waitForService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const config = service.config;
    const maxAttempts = 30; // 30 seconds
    const delay = 1000; // 1 second

    console.log(`⏳ Waiting for ${config.name} to be ready...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Try to connect to service port
        const response = await this.checkServiceHealth(config.port, config.healthEndpoint);
        if (response) {
          service.status = 'running';
          console.log(`✅ ${config.name} is ready (attempt ${attempt})`);
          return;
        }
      } catch (error) {
        // Service not ready yet
      }

      if (attempt < maxAttempts) {
        await this.sleep(delay);
      }
    }

    throw new Error(`${config.name} failed to start within ${maxAttempts} seconds`);
  }

  /**
   * Check if a service is healthy
   * @param {number} port - Service port
   * @param {string} endpoint - Health check endpoint
   */
  async checkServiceHealth(port, endpoint) {
    return new Promise((resolve) => {
      const http = require('http');
      
      const req = http.request({
        hostname: 'localhost',
        port,
        path: endpoint,
        method: 'GET',
        timeout: 2000
      }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Check if a service is running
   * @param {string} serviceName - Name of service to check
   */
  isServiceRunning(serviceName) {
    const service = this.services.get(serviceName);
    return service && service.status === 'running';
  }

  /**
   * Handle service failure
   * @param {string} serviceName - Name of failed service
   */
  async handleServiceFailure(serviceName) {
    console.error(`🚨 Service failure detected: ${serviceName}`);
    
    // For now, shutdown all services on any failure
    // In production, you might want different strategies
    await this.shutdownAll();
    process.exit(1);
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdownAll() {
    if (this.shutdownInProgress) {
      return;
    }

    this.shutdownInProgress = true;
    console.log('🛑 Shutting down all services...');

    // Shutdown in reverse order
    const shutdownOrder = [...this.startupOrder].reverse();

    for (const serviceName of shutdownOrder) {
      await this.shutdownService(serviceName);
    }

    console.log('✅ All services shut down');
  }

  /**
   * Shutdown a specific service
   * @param {string} serviceName - Name of service to shutdown
   */
  async shutdownService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service || !service.process) {
      return;
    }

    const config = service.config;
    console.log(`🛑 Shutting down ${config.name}...`);

    // Send SIGTERM for graceful shutdown
    service.process.kill('SIGTERM');

    // Wait for graceful shutdown
    const shutdownPromise = new Promise((resolve) => {
      service.process.on('exit', resolve);
    });

    // Force kill after timeout
    const timeout = setTimeout(() => {
      console.warn(`⚠️ Force killing ${config.name} after timeout`);
      service.process.kill('SIGKILL');
    }, 5000);

    await shutdownPromise;
    clearTimeout(timeout);

    this.services.delete(serviceName);
    console.log(`✅ ${config.name} shut down`);
  }

  /**
   * Log status of all services
   */
  logServiceStatus() {
    console.log('\n📊 Service Status Summary:');
    console.log('================================');
    
    for (const [serviceName, service] of this.services.entries()) {
      const config = service.config;
      const uptime = Date.now() - service.startTime;
      const uptimeStr = this.formatUptime(uptime);
      
      console.log(`${config.name}: ${service.status} (${uptimeStr}) - Port ${config.port}`);
    }
    
    console.log('================================\n');
  }

  /**
   * Format uptime duration
   * @param {number} uptime - Uptime in milliseconds
   */
  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Duration in milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔔 Received ${signal}, initiating graceful shutdown...`);
      await this.shutdownAll();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    process.on('uncaughtException', async (error) => {
      console.error('🚨 Uncaught exception:', error);
      await this.shutdownAll();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('🚨 Unhandled rejection at:', promise, 'reason:', reason);
      await this.shutdownAll();
      process.exit(1);
    });
  }
}

// Start the orchestrator if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new ServiceOrchestrator();
  orchestrator.startAll().catch((error) => {
    console.error('Failed to start service orchestrator:', error);
    process.exit(1);
  });
}

export default ServiceOrchestrator;
