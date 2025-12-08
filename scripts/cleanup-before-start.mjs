#!/usr/bin/env node

/**
 * @fileoverview Smart cleanup before starting services
 * Kills old backend/frontend processes but preserves npm process tree
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';
const target = process.argv[2] || 'backend'; // 'backend' or 'frontend'

async function cleanup() {
  console.log(`🧹 Cleaning up old ${target} processes...`);
  
  try {
    if (isWindows) {
      // Kill processes on specific ports
      const ports = target === 'backend' ? [3002] : [5175];
      
      for (const port of ports) {
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`);
          const lines = stdout.trim().split('\n');
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            
            if (pid && pid !== '0' && !isNaN(pid)) {
              try {
                await execAsync(`taskkill /PID ${pid} /F /T`);
                console.log(`✅ Killed old ${target} process on port ${port} (PID: ${pid})`);
              } catch (e) {
                // Process might have already exited
              }
            }
          }
        } catch (e) {
          // Port not in use - that's fine
          console.log(`✅ Port ${port} is free`);
        }
      }
      
      // Also kill any nodemon processes
      if (target === 'backend') {
        try {
          await execAsync('taskkill /IM nodemon.exe /F /T');
          console.log('✅ Killed old nodemon processes');
        } catch (e) {
          // No nodemon processes - that's fine
        }
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ ${target} cleanup complete - ready to start fresh!`);
      
    } else {
      // Unix/Linux/Mac
      const ports = target === 'backend' ? [3002] : [5175];
      
      for (const port of ports) {
        try {
          await execAsync(`lsof -ti:${port} | xargs kill -9`);
          console.log(`✅ Killed old ${target} process on port ${port}`);
        } catch (e) {
          console.log(`✅ Port ${port} is free`);
        }
      }
      
      if (target === 'backend') {
        try {
          await execAsync('pkill -9 nodemon');
          console.log('✅ Killed old nodemon processes');
        } catch (e) {
          // No nodemon - that's fine
        }
      }
      
      console.log(`✅ ${target} cleanup complete - ready to start fresh!`);
    }
  } catch (error) {
    console.error(`⚠️ Cleanup error: ${error.message}`);
    console.log('⚠️ Continuing anyway...');
  }
}

cleanup();
