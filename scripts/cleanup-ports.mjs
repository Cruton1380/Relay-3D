#!/usr/bin/env node

/**
 * @fileoverview Automatic Port Cleanup Script
 * Kills processes using ports 3002 and 5175 before starting services
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class PortCleanup {
  constructor() {
    this.ports = [3002, 5175];
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Get processes using specific ports
   */
  async getProcessesOnPort(port) {
    try {
      if (this.isWindows) {
        // Windows: Use netstat to find processes
        const { stdout } = await execAsync(`netstat -ano | findstr ":${port}"`);
        const lines = stdout.trim().split('\n').filter(line => line.includes('LISTENING'));
        
        const pids = [];
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !isNaN(pid)) {
            pids.push(parseInt(pid));
          }
        }
        return [...new Set(pids)]; // Remove duplicates
      } else {
        // Linux/Mac: Use lsof
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        return stdout.trim().split('\n').filter(pid => pid).map(pid => parseInt(pid));
      }
    } catch (error) {
      // Port not in use or command failed
      return [];
    }
  }

  /**
   * Kill a process by PID
   */
  async killProcess(pid) {
    try {
      if (this.isWindows) {
        await execAsync(`taskkill /PID ${pid} /F`);
        console.log(`✅ Killed process ${pid} on Windows`);
      } else {
        await execAsync(`kill -9 ${pid}`);
        console.log(`✅ Killed process ${pid} on Unix`);
      }
      return true;
    } catch (error) {
      console.log(`⚠️  Could not kill process ${pid}: ${error.message}`);
      return false;
    }
  }

  /**
   * Kill all node processes (except current one) to ensure clean state
   */
  async killAllNodeProcesses() {
    console.log('🔪 Killing all node processes for clean start...');
    
    try {
      const currentPid = process.pid;
      
      if (this.isWindows) {
        // Simple approach: Get all node PIDs and kill them
        try {
          const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get ProcessId');
          const lines = stdout.split('\n').map(line => line.trim()).filter(line => line && line !== 'ProcessId');
          const pids = lines.map(pid => parseInt(pid)).filter(pid => !isNaN(pid) && pid !== currentPid);
          
          if (pids.length === 0) {
            console.log('✅ No other node processes found');
            return;
          }
          
          console.log(`⚠️  Found ${pids.length} node process(es) to kill: ${pids.join(', ')}`);
          
          // Kill all at once
          await execAsync(`taskkill /F /T ${pids.map(pid => `/PID ${pid}`).join(' ')}`);
          console.log(`✅ Killed ${pids.length} node processes`);
          
        } catch (error) {
          // Fallback: Try killing all node.exe processes
          console.log('⚠️  Using fallback method...');
          try {
            await execAsync('taskkill /F /IM node.exe /T');
            console.log('✅ Killed all node processes via fallback');
          } catch (fallbackError) {
            console.log('✅ No node processes to kill (or already killed)');
          }
        }
        
        // Wait for processes to die
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('✅ Node process cleanup complete');
        
      } else {
        // Unix/Linux/Mac - don't kill current process
        await execAsync(`pkill -9 -f node | grep -v ${currentPid} || true`);
        console.log('✅ All node processes killed');
      }
    } catch (error) {
      console.log(`⚠️  Error during node process cleanup: ${error.message}`);
      console.log('⚠️  Continuing anyway...');
    }
  }

  /**
   * Clean up all specified ports
   */
  async cleanupPorts() {
    console.log('🧹 Starting automatic port cleanup...');
    
    for (const port of this.ports) {
      console.log(`🔍 Checking port ${port}...`);
      
      const pids = await this.getProcessesOnPort(port);
      
      if (pids.length === 0) {
        console.log(`✅ Port ${port} is free`);
        continue;
      }

      console.log(`⚠️  Port ${port} is in use by processes: ${pids.join(', ')}`);
      
      for (const pid of pids) {
        await this.killProcess(pid);
      }
      
      // Wait a moment for the port to be released
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the port is now free
      const remainingPids = await this.getProcessesOnPort(port);
      if (remainingPids.length === 0) {
        console.log(`✅ Port ${port} is now free`);
      } else {
        console.log(`❌ Port ${port} still in use by: ${remainingPids.join(', ')}`);
      }
    }
    
    console.log('🎉 Port cleanup completed!');
  }

  /**
   * Full cleanup: Kill all node processes, then clean ports
   */
  async fullCleanup() {
    await this.killAllNodeProcesses();
    await this.cleanupPorts();
  }
}

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cleanup = new PortCleanup();
  cleanup.fullCleanup().catch(console.error);
}

export default PortCleanup;
