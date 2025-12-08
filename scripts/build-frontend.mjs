#!/usr/bin/env node

/**
 * @fileoverview Frontend Build Script
 * Builds the frontend for standalone deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class FrontendBuilder {
  constructor() {
    this.buildDir = 'dist';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Build the frontend
   */
  async build() {
    console.log('🏗️  Building frontend for standalone deployment...');
    console.log(`📁 Build directory: ${this.buildDir}`);
    console.log(`🌍 Environment: ${this.isProduction ? 'production' : 'development'}`);

    try {
      // Step 1: Clean build directory
      await this.cleanBuildDir();

      // Step 2: Set environment variables
      await this.setEnvironmentVariables();

      // Step 3: Build with Vite
      await this.buildWithVite();

      // Step 4: Create deployment files
      await this.createDeploymentFiles();

      console.log('✅ Frontend build completed successfully!');
      console.log(`📦 Built files are in: ${this.buildDir}/`);
      console.log('🚀 Ready for standalone deployment (Nginx, CDN, etc.)');

    } catch (error) {
      console.error('❌ Frontend build failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Clean the build directory
   */
  async cleanBuildDir() {
    console.log('🧹 Cleaning build directory...');
    try {
      await fs.rm(this.buildDir, { recursive: true, force: true });
      console.log('✅ Build directory cleaned');
    } catch (error) {
      // Directory might not exist, that's okay
      console.log('📁 Build directory ready');
    }
  }

  /**
   * Set environment variables for build
   */
  async setEnvironmentVariables() {
    console.log('⚙️  Setting environment variables...');
    
    // Set production environment variables
    if (this.isProduction) {
      process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.relay.network';
      process.env.VITE_WS_BASE_URL = process.env.VITE_WS_BASE_URL || 'wss://api.relay.network';
      process.env.VITE_DEBUG_MODE = 'false';
    } else {
      process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3002';
      process.env.VITE_WS_BASE_URL = process.env.VITE_WS_BASE_URL || 'ws://localhost:3002';
      process.env.VITE_DEBUG_MODE = 'true';
    }

    console.log(`🔗 API Base URL: ${process.env.VITE_API_BASE_URL}`);
    console.log(`🔌 WebSocket URL: ${process.env.VITE_WS_BASE_URL}`);
  }

  /**
   * Build with Vite
   */
  async buildWithVite() {
    console.log('⚡ Building with Vite...');
    
    const command = 'npm run build:frontend';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️  Build warnings:', stderr);
    }
    
    console.log('✅ Vite build completed');
  }

  /**
   * Create deployment files
   */
  async createDeploymentFiles() {
    console.log('📄 Creating deployment files...');

    // Create nginx configuration
    await this.createNginxConfig();

    // Create deployment info
    await this.createDeploymentInfo();

    console.log('✅ Deployment files created');
  }

  /**
   * Create nginx configuration for standalone deployment
   */
  async createNginxConfig() {
    const nginxConfig = `# Relay Network Frontend - Nginx Configuration
# Place this in your nginx sites-available directory

server {
    listen 80;
    server_name your-domain.com;
    
    # Serve static files
    root /path/to/relay-network/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if backend is on same server)
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}`;

    await fs.writeFile(path.join(this.buildDir, 'nginx.conf'), nginxConfig);
  }

  /**
   * Create deployment information file
   */
  async createDeploymentInfo() {
    const deploymentInfo = {
      buildTime: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      apiBaseUrl: process.env.VITE_API_BASE_URL,
      wsBaseUrl: process.env.VITE_WS_BASE_URL,
      version: process.env.npm_package_version || '1.0.0',
      deployment: {
        type: 'standalone',
        description: 'Frontend built for standalone deployment',
        requirements: [
          'Web server (Nginx, Apache, etc.)',
          'Backend API server running separately',
          'HTTPS certificate (for production)'
        ],
        instructions: [
          '1. Copy dist/ contents to your web server',
          '2. Configure nginx.conf (included)',
          '3. Ensure backend API is accessible',
          '4. Update API_BASE_URL if needed'
        ]
      }
    };

    await fs.writeFile(
      path.join(this.buildDir, 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
  }
}

// Run build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new FrontendBuilder();
  builder.build().catch(console.error);
}

export default FrontendBuilder;
