#!/usr/bin/env node

/**
 * @fileoverview Complete System Startup Script
 * Starts the entire Relay Network system with one command
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

class CompleteSystemStarter {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
    this.setupGracefulShutdown();
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      console.log(`\n🛑 Received ${signal}, shutting down all services...`);
      
      for (const [name, process] of this.processes) {
        try {
          console.log(`   Stopping ${name}...`);
          process.kill('SIGTERM');
        } catch (error) {
          console.log(`   Error stopping ${name}: ${error.message}`);
        }
      }
      
      // Wait a moment for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      for (const [name, process] of this.processes) {
        try {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        } catch (error) {
          // Process already dead
        }
      }
      
      console.log('✅ All services stopped');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Wait for a service to be ready
   */
  async waitForService(port, serviceName, maxWaitSeconds = 30) {
    console.log(`⏳ Waiting for ${serviceName} on port ${port}...`);
    
    for (let i = 0; i < maxWaitSeconds; i++) {
      try {
        const { stdout } = await execAsync(`netstat -an | findstr ":${port}"`);
        if (stdout.includes('LISTENING')) {
          console.log(`✅ ${serviceName} is ready!`);
          return true;
        }
      } catch (error) {
        // Port not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`❌ Timeout waiting for ${serviceName}`);
    return false;
  }

  /**
   * Start a service
   */
  startService(name, command, args = []) {
    console.log(`🚀 Starting ${name}...`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error starting ${name}:`, error.message);
    });

    child.on('exit', (code) => {
      if (code !== 0 && !this.isShuttingDown) {
        console.error(`❌ ${name} exited with code ${code}`);
      }
    });

    this.processes.set(name, child);
    return child;
  }

  /**
   * Start the complete system
   */
  async start() {
    console.log('🎯 RELAY NETWORK - COMPLETE SYSTEM STARTUP');
    console.log('==========================================');
    console.log('');

    try {
      // Step 1: Clean up ports
      console.log('🧹 Step 1: Cleaning up ports...');
      const cleanupProcess = spawn('node', ['scripts/cleanup-ports.mjs'], {
        stdio: 'inherit',
        shell: true
      });
      
      await new Promise((resolve) => {
        cleanupProcess.on('exit', resolve);
      });
      console.log('');

      // Step 2: Start backend
      console.log('🔧 Step 2: Starting backend server...');
      this.startService('Backend', 'npm', ['run', 'dev:backend']);
      
      // Wait for backend to be ready
      const backendReady = await this.waitForService(3002, 'Backend', 30);
      if (!backendReady) {
        throw new Error('Backend failed to start');
      }
      console.log('');

      // Step 3: Start frontend
      console.log('🎨 Step 3: Starting frontend server...');
      this.startService('Frontend', 'npm', ['run', 'dev:frontend']);
      
      // Wait for frontend to be ready
      const frontendReady = await this.waitForService(5175, 'Frontend', 20);
      if (!frontendReady) {
        throw new Error('Frontend failed to start');
      }
      console.log('');

      // Step 4: Open browser
      console.log('🌐 Step 4: Opening browser...');
      try {
        await execAsync('start http://localhost:5175');
        console.log('✅ Browser opened to http://localhost:5175');
      } catch (error) {
        console.log('⚠️  Could not open browser automatically');
        console.log('   Please navigate to: http://localhost:5175');
      }
      console.log('');

      // Step 5: Show status
      console.log('🎉 RELAY NETWORK SYSTEM STATUS');
      console.log('==============================');
      console.log('✅ Backend:  http://localhost:3002');
      console.log('✅ Frontend: http://localhost:5175');
      console.log('✅ Health:   http://localhost:3002/health');
      console.log('');
      console.log('🚀 System launched successfully!');
      console.log('');
      console.log('💡 Commands:');
      console.log('   • Press Ctrl+C to stop all services');
      console.log('   • Backend logs: Check the Backend terminal');
      console.log('   • Frontend logs: Check the Frontend terminal');
      console.log('');

      // Keep the process alive
      console.log('🔄 System running. Press Ctrl+C to stop...');
      process.stdin.resume();

    } catch (error) {
      console.error('❌ Failed to start system:', error.message);
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Shutdown all services
   */
  async shutdown() {
    console.log('🛑 Shutting down all services...');
    
    for (const [name, process] of this.processes) {
      try {
        process.kill('SIGTERM');
      } catch (error) {
        // Process already dead
      }
    }
    
    // Wait for processes to exit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ All services stopped');
  }
}

// Start the system if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const starter = new CompleteSystemStarter();
  starter.start().catch(console.error);
}

export default CompleteSystemStarter;
