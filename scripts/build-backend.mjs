#!/usr/bin/env node

/**
 * @fileoverview Backend Build Script
 * Prepares the backend for standalone deployment
 */

import fs from 'fs/promises';
import path from 'path';

class BackendBuilder {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.buildDir = 'backend-dist';
  }

  /**
   * Build the backend for standalone deployment
   */
  async build() {
    console.log('🏗️  Building backend for standalone deployment...');
    console.log(`📁 Build directory: ${this.buildDir}`);
    console.log(`🌍 Environment: ${this.isProduction ? 'production' : 'development'}`);

    try {
      // Step 1: Clean build directory
      await this.cleanBuildDir();

      // Step 2: Copy backend files
      await this.copyBackendFiles();

      // Step 3: Create deployment files
      await this.createDeploymentFiles();

      // Step 4: Create startup scripts
      await this.createStartupScripts();

      console.log('✅ Backend build completed successfully!');
      console.log(`📦 Built files are in: ${this.buildDir}/`);
      console.log('🚀 Ready for standalone deployment (PM2, Docker, etc.)');

    } catch (error) {
      console.error('❌ Backend build failed:', error.message);
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
   * Copy backend files
   */
  async copyBackendFiles() {
    console.log('📋 Copying backend files...');

    const filesToCopy = [
      'src/backend',
      'data',
      'config',
      'package.json',
      'package-lock.json',
      'node_modules'
    ];

    for (const file of filesToCopy) {
      try {
        const srcPath = file;
        const destPath = path.join(this.buildDir, file);
        
        // Create destination directory
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        
        // Copy file or directory
        await fs.cp(srcPath, destPath, { recursive: true });
        console.log(`✅ Copied: ${file}`);
      } catch (error) {
        console.log(`⚠️  Skipped: ${file} (${error.message})`);
      }
    }
  }

  /**
   * Create deployment files
   */
  async createDeploymentFiles() {
    console.log('📄 Creating deployment files...');

    // Create PM2 configuration
    await this.createPM2Config();

    // Create Docker configuration
    await this.createDockerConfig();

    // Create deployment info
    await this.createDeploymentInfo();

    console.log('✅ Deployment files created');
  }

  /**
   * Create PM2 configuration
   */
  async createPM2Config() {
    const pm2Config = {
      apps: [{
        name: 'relay-backend',
        script: 'src/backend/server.mjs',
        instances: this.isProduction ? 'max' : 1,
        exec_mode: this.isProduction ? 'cluster' : 'fork',
        env: {
          NODE_ENV: 'development',
          PORT: 3002
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 3002
        },
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=1024'
      }]
    };

    await fs.writeFile(
      path.join(this.buildDir, 'ecosystem.config.js'),
      `module.exports = ${JSON.stringify(pm2Config, null, 2)};`
    );
  }

  /**
   * Create Docker configuration
   */
  async createDockerConfig() {
    const dockerfile = `# Relay Network Backend - Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/backend/server.mjs"]`;

    const dockerCompose = `# Relay Network Backend - Docker Compose
version: '3.8'

services:
  relay-backend:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3`;

    await fs.writeFile(path.join(this.buildDir, 'Dockerfile'), dockerfile);
    await fs.writeFile(path.join(this.buildDir, 'docker-compose.yml'), dockerCompose);
  }

  /**
   * Create deployment information
   */
  async createDeploymentInfo() {
    const deploymentInfo = {
      buildTime: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      version: process.env.npm_package_version || '1.0.0',
      deployment: {
        type: 'standalone',
        description: 'Backend built for standalone deployment',
        requirements: [
          'Node.js 18+',
          'PM2 (for process management)',
          'Docker (optional)',
          'HTTPS certificate (for production)'
        ],
        instructions: [
          '1. Copy backend-dist/ to your server',
          '2. Install dependencies: npm ci --only=production',
          '3. Configure environment variables',
          '4. Start with PM2: pm2 start ecosystem.config.js',
          '5. Or use Docker: docker-compose up -d'
        ]
      }
    };

    await fs.writeFile(
      path.join(this.buildDir, 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
  }

  /**
   * Create startup scripts
   */
  async createStartupScripts() {
    console.log('📜 Creating startup scripts...');

    // PM2 startup script
    const pm2StartScript = `#!/bin/bash
# Relay Network Backend - PM2 Startup Script

echo "🚀 Starting Relay Network Backend with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

echo "✅ Relay Network Backend started successfully!"
echo "📊 Monitor with: pm2 monit"
echo "📋 View logs with: pm2 logs relay-backend"`;

    // Docker startup script
    const dockerStartScript = `#!/bin/bash
# Relay Network Backend - Docker Startup Script

echo "🚀 Starting Relay Network Backend with Docker..."

# Build the image
docker-compose build

# Start the services
docker-compose up -d

echo "✅ Relay Network Backend started successfully!"
echo "📊 Monitor with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"`;

    await fs.writeFile(path.join(this.buildDir, 'start-pm2.sh'), pm2StartScript);
    await fs.writeFile(path.join(this.buildDir, 'start-docker.sh'), dockerStartScript);

    // Make scripts executable
    await fs.chmod(path.join(this.buildDir, 'start-pm2.sh'), 0o755);
    await fs.chmod(path.join(this.buildDir, 'start-docker.sh'), 0o755);
  }
}

// Run build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new BackendBuilder();
  builder.build().catch(console.error);
}

export default BackendBuilder;
