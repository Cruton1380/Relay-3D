#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Starting simple backup...');

async function simpleBackup() {
  try {
    const dataDir = path.join(projectRoot, 'data');
    const backupDir = path.join(projectRoot, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    console.log('📁 Data directory:', dataDir);
    console.log('📁 Backup path:', backupPath);
    
    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true });
    console.log('✅ Created backup directory');
    
    // Copy data directory
    await copyDirectory(dataDir, backupPath);
    console.log('✅ Copied data directory');
    
    // Create manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      backupPath: backupPath,
      dataDirectory: dataDir
    };
    
    const manifestPath = path.join(backupPath, 'backup-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Created manifest');
    
    console.log('🎉 Backup completed successfully!');
    console.log('📁 Backup location:', backupPath);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function copyDirectory(source, destination) {
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
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

simpleBackup();
