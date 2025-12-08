/**
 * System Maintenance Scripts
 * Provides tools for system maintenance and troubleshooting
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

class SystemMaintenance {
  constructor() {
    this.projectRoot = process.cwd();
    this.cacheDirs = [
      'node_modules/.cache',
      '.vite',
      'dist',
      'build',
      'coverage'
    ];
  }

  /**
   * Full system reset - clears all caches and reinstalls dependencies
   */
  fullReset() {
    console.log('🔄 Starting full system reset...');

    try {
      // Clear all caches
      this.clearAllCaches();
      
      // Remove node_modules
      if (existsSync('node_modules')) {
        console.log('🗑️  Removing node_modules...');
        rmSync('node_modules', { recursive: true, force: true });
      }

      // Remove package-lock.json
      if (existsSync('package-lock.json')) {
        console.log('🗑️  Removing package-lock.json...');
        rmSync('package-lock.json');
      }

      // Reinstall dependencies
      console.log('📦 Reinstalling dependencies...');
      execSync('npm install', { stdio: 'inherit' });

      console.log('✅ Full system reset completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Full system reset failed:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache directories
   */
  clearAllCaches() {
    console.log('🧹 Clearing cache directories...');

    this.cacheDirs.forEach(dir => {
      if (existsSync(dir)) {
        try {
          rmSync(dir, { recursive: true, force: true });
          console.log(`✅ Cleared: ${dir}`);
        } catch (error) {
          console.warn(`⚠️  Failed to clear: ${dir} - ${error.message}`);
        }
      }
    });
  }

  /**
   * Validate system integrity
   */
  validateSystem() {
    console.log('🔍 Validating system integrity...');

    const issues = [];

    // Check critical files
    const criticalFiles = [
      'package.json',
      'src/backend/server.mjs',
      'src/backend/utils/logging/logger.mjs',
      'src/backend/voting/votingEngine.mjs'
    ];

    criticalFiles.forEach(file => {
      if (!existsSync(file)) {
        issues.push(`Missing critical file: ${file}`);
      }
    });

    // Check data directories
    const dataDirs = [
      'data',
      'data/blockchain',
      'data/users',
      'data/voting',
      'logs'
    ];

    dataDirs.forEach(dir => {
      if (!existsSync(dir)) {
        issues.push(`Missing data directory: ${dir}`);
      }
    });

    if (issues.length === 0) {
      console.log('✅ System integrity validation passed');
      return true;
    } else {
      console.log('❌ System integrity issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      return false;
    }
  }

  /**
   * Fix common issues
   */
  fixCommonIssues() {
    console.log('🔧 Fixing common issues...');

    try {
      // Create missing directories
      const dirs = ['data', 'data/blockchain', 'data/users', 'data/voting', 'logs'];
      dirs.forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
          console.log(`✅ Created directory: ${dir}`);
        }
      });

      // Clear problematic caches
      this.clearAllCaches();

      console.log('✅ Common issues fixed');
      return true;

    } catch (error) {
      console.error('❌ Failed to fix common issues:', error.message);
      return false;
    }
  }

  /**
   * Backup system data
   */
  backupData() {
    console.log('💾 Creating system backup...');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = `backup-${timestamp}`;
      
      mkdirSync(backupDir, { recursive: true });

      // Copy data directory
      if (existsSync('data')) {
        execSync(`cp -r data ${backupDir}/`, { stdio: 'inherit' });
      }

      // Copy logs
      if (existsSync('logs')) {
        execSync(`cp -r logs ${backupDir}/`, { stdio: 'inherit' });
      }

      console.log(`✅ Backup created: ${backupDir}`);
      return backupDir;

    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      return null;
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backupDir) {
    console.log(`🔄 Restoring from backup: ${backupDir}`);

    try {
      if (!existsSync(backupDir)) {
        throw new Error(`Backup directory not found: ${backupDir}`);
      }

      // Restore data
      if (existsSync(`${backupDir}/data`)) {
        if (existsSync('data')) {
          rmSync('data', { recursive: true, force: true });
        }
        execSync(`cp -r ${backupDir}/data .`, { stdio: 'inherit' });
      }

      // Restore logs
      if (existsSync(`${backupDir}/logs`)) {
        if (existsSync('logs')) {
          rmSync('logs', { recursive: true, force: true });
        }
        execSync(`cp -r ${backupDir}/logs .`, { stdio: 'inherit' });
      }

      console.log('✅ Restore completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      return false;
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const maintenance = new SystemMaintenance();
  const command = process.argv[2];

  switch (command) {
    case 'reset':
      maintenance.fullReset();
      break;
    case 'clear-cache':
      maintenance.clearAllCaches();
      break;
    case 'validate':
      maintenance.validateSystem();
      break;
    case 'fix':
      maintenance.fixCommonIssues();
      break;
    case 'backup':
      maintenance.backupData();
      break;
    case 'restore':
      const backupDir = process.argv[3];
      if (!backupDir) {
        console.error('❌ Please specify backup directory');
        process.exit(1);
      }
      maintenance.restoreFromBackup(backupDir);
      break;
    default:
      console.log(`
🔧 System Maintenance Tools

Usage: node scripts/system-maintenance.mjs <command>

Commands:
  reset       - Full system reset (clears caches, reinstalls dependencies)
  clear-cache - Clear all cache directories
  validate    - Validate system integrity
  fix         - Fix common issues
  backup      - Create system backup
  restore     - Restore from backup (requires backup directory)
      `);
  }
}

export default SystemMaintenance;
