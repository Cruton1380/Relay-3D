#!/usr/bin/env node

/**
 * @fileoverview Data Backup Script
 * Creates timestamped backups of critical data directories
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class DataBackup {
  constructor() {
    this.backupDir = path.join(projectRoot, 'backups');
    this.dataDir = path.join(projectRoot, 'data');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupPath = path.join(this.backupDir, `backup-${this.timestamp}`);
  }

  log(message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  async createBackupDirectory() {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
      this.log('✅ Created backup directory', { path: this.backupPath });
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }

  async copyDirectory(source, destination) {
    try {
      const stats = await fs.stat(source);
      
      if (!stats.isDirectory()) {
        throw new Error(`Source is not a directory: ${source}`);
      }

      await fs.mkdir(destination, { recursive: true });
      
      const entries = await fs.readdir(source, { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(sourcePath, destPath);
        } else {
          await fs.copyFile(sourcePath, destPath);
        }
      }
      
      this.log(`✅ Copied directory`, { from: source, to: destination });
    } catch (error) {
      this.log(`❌ Failed to copy directory`, { from: source, error: error.message });
      throw error;
    }
  }

  async backupCriticalData() {
    this.log('🚀 Starting data backup...');
    
    const criticalPaths = [
      {
        source: path.join(this.dataDir, 'blockchain'),
        name: 'blockchain-data',
        description: 'Blockchain transaction data'
      },
      {
        source: path.join(this.dataDir, 'voting'),
        name: 'voting-data',
        description: 'Vote persistence and session data'
      },
      {
        source: path.join(this.dataDir, 'security'),
        name: 'security-data',
        description: 'Signal Protocol sessions and keys'
      },
      {
        source: path.join(this.dataDir, 'users'),
        name: 'user-data',
        description: 'User accounts and invite data'
      },
      {
        source: path.join(this.dataDir, 'system'),
        name: 'system-config',
        description: 'System configuration files'
      }
    ];

    const backupResults = [];

    for (const item of criticalPaths) {
      try {
        const destPath = path.join(this.backupPath, item.name);
        await this.copyDirectory(item.source, destPath);
        
        backupResults.push({
          name: item.name,
          description: item.description,
          status: 'success',
          path: destPath
        });
      } catch (error) {
        backupResults.push({
          name: item.name,
          description: item.description,
          status: 'failed',
          error: error.message
        });
      }
    }

    return backupResults;
  }

  async createBackupManifest(backupResults) {
    const manifest = {
      timestamp: new Date().toISOString(),
      backupPath: this.backupPath,
      projectRoot: projectRoot,
      dataDirectory: this.dataDir,
      results: backupResults,
      summary: {
        total: backupResults.length,
        successful: backupResults.filter(r => r.status === 'success').length,
        failed: backupResults.filter(r => r.status === 'failed').length
      }
    };

    const manifestPath = path.join(this.backupPath, 'backup-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    this.log('✅ Created backup manifest', { path: manifestPath });
    return manifest;
  }

  async cleanupOldBackups(maxBackups = 10) {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backupDirs = entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('backup-'))
        .map(entry => ({
          name: entry.name,
          path: path.join(this.backupDir, entry.name),
          timestamp: entry.name.replace('backup-', '')
        }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      if (backupDirs.length > maxBackups) {
        const dirsToRemove = backupDirs.slice(maxBackups);
        
        for (const dir of dirsToRemove) {
          await fs.rm(dir.path, { recursive: true, force: true });
          this.log('🗑️  Removed old backup', { path: dir.path });
        }
        
        this.log(`✅ Cleaned up ${dirsToRemove.length} old backups`);
      }
    } catch (error) {
      this.log('⚠️  Failed to cleanup old backups', { error: error.message });
    }
  }

  async generateBackupReport(manifest) {
    console.log('\n' + '='.repeat(60));
    console.log('📦 RELAY NETWORK DATA BACKUP REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🕒 Backup Time: ${manifest.timestamp}`);
    console.log(`📁 Backup Location: ${manifest.backupPath}`);
    console.log(`📊 Summary: ${manifest.summary.successful}/${manifest.summary.total} successful`);
    
    if (manifest.summary.failed > 0) {
      console.log('\n❌ FAILED BACKUPS:');
      manifest.results
        .filter(r => r.status === 'failed')
        .forEach(result => {
          console.log(`   ✗ ${result.name}: ${result.error}`);
        });
    }
    
    if (manifest.summary.successful > 0) {
      console.log('\n✅ SUCCESSFUL BACKUPS:');
      manifest.results
        .filter(r => r.status === 'success')
        .forEach(result => {
          console.log(`   ✓ ${result.name}: ${result.description}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (manifest.summary.failed === 0) {
      console.log('🎉 BACKUP STATUS: SUCCESS - All critical data backed up!');
    } else {
      console.log(`⚠️  BACKUP STATUS: PARTIAL - ${manifest.summary.failed} failures`);
    }
  }

  async run() {
    try {
      this.log('🚀 Starting Relay Network data backup...');
      this.log('📁 Data directory:', { path: this.dataDir });
      this.log('📁 Backup directory:', { path: this.backupPath });
      
      // Create backup directory
      await this.createBackupDirectory();
      
      // Backup critical data
      const backupResults = await this.backupCriticalData();
      
      // Create manifest
      const manifest = await this.createBackupManifest(backupResults);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      // Generate report
      await this.generateBackupReport(manifest);
      
      return manifest;
    } catch (error) {
      this.log('❌ Backup failed', { error: error.message });
      throw error;
    }
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔧 Backup script starting...');
  const backup = new DataBackup();
  backup.run().catch(error => {
    console.error('❌ Backup script failed:', error);
    process.exit(1);
  });
}

export default DataBackup;
