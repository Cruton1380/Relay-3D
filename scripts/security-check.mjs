#!/usr/bin/env node

/**
 * @fileoverview Comprehensive Security Check Script
 * Performs security audits, dependency checks, and configuration validation
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class SecurityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (details) {
      console.log(logMessage, details);
    } else {
      console.log(logMessage);
    }
  }

  async checkDependencies() {
    this.log('info', '🔍 Checking dependency vulnerabilities...');
    
    try {
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        cwd: projectRoot 
      });
      
      const audit = JSON.parse(auditOutput);
      
      if (audit.vulnerabilities) {
        const critical = Object.values(audit.vulnerabilities).filter(v => v.severity === 'critical').length;
        const high = Object.values(audit.vulnerabilities).filter(v => v.severity === 'high').length;
        const moderate = Object.values(audit.vulnerabilities).filter(v => v.severity === 'moderate').length;
        const low = Object.values(audit.vulnerabilities).filter(v => v.severity === 'low').length;
        
        this.log('info', `📊 Vulnerability Summary:`, {
          critical,
          high,
          moderate,
          low,
          total: critical + high + moderate + low
        });
        
        if (critical > 0) {
          this.issues.push(`${critical} critical vulnerabilities found`);
        }
        if (high > 0) {
          this.issues.push(`${high} high severity vulnerabilities found`);
        }
        if (moderate > 0) {
          this.warnings.push(`${moderate} moderate vulnerabilities found`);
        }
        
        // List specific critical and high vulnerabilities
        Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
          if (vuln.severity === 'critical' || vuln.severity === 'high') {
            this.log('error', `🚨 ${vuln.severity.toUpperCase()}: ${name}`, {
              via: vuln.via,
              fixAvailable: vuln.fixAvailable
            });
          }
        });
      } else {
        this.passed.push('No dependency vulnerabilities found');
      }
    } catch (error) {
      this.issues.push(`Failed to run npm audit: ${error.message}`);
    }
  }

  async checkHardcodedSecrets() {
    this.log('info', '🔍 Checking for hardcoded secrets...');
    
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']+["']/gi,
      /secret\s*[:=]\s*["'][^"']+["']/gi,
      /key\s*[:=]\s*["'][^"']+["']/gi,
      /token\s*[:=]\s*["'][^"']+["']/gi,
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
      /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi
    ];
    
    const filesToCheck = [
      'data/system/config.json',
      'src/backend/config',
      'src/backend/services',
      '.env',
      '.env.local',
      '.env.production'
    ];
    
    for (const filePath of filesToCheck) {
      try {
        const fullPath = path.join(projectRoot, filePath);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await this.checkDirectoryForSecrets(fullPath, secretPatterns);
        } else if (stats.isFile()) {
          await this.checkFileForSecrets(fullPath, secretPatterns);
        }
      } catch (error) {
        // File doesn't exist or can't be read - that's okay
      }
    }
  }

  async checkDirectoryForSecrets(dirPath, patterns) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.checkDirectoryForSecrets(fullPath, patterns);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.json'))) {
          await this.checkFileForSecrets(fullPath, patterns);
        }
      }
    } catch (error) {
      // Directory can't be read - skip
    }
  }

  async checkFileForSecrets(filePath, patterns) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      patterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          this.warnings.push(`Potential hardcoded secret in ${path.relative(projectRoot, filePath)}: ${matches[0]}`);
        }
      });
    } catch (error) {
      // File can't be read - skip
    }
  }

  async checkEnvironmentConfiguration() {
    this.log('info', '🔍 Checking environment configuration...');
    
    const envFiles = ['.env', '.env.local', '.env.production'];
    const envFilesExist = [];
    
    for (const envFile of envFiles) {
      try {
        const envPath = path.join(projectRoot, envFile);
        await fs.access(envPath);
        envFilesExist.push(envFile);
      } catch (error) {
        // File doesn't exist
      }
    }
    
    if (envFilesExist.length === 0) {
      this.warnings.push('No environment files found (.env, .env.local, .env.production)');
    } else {
      this.passed.push(`Environment files found: ${envFilesExist.join(', ')}`);
    }
    
    // Check if .env files are in .gitignore
    try {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      
      if (gitignoreContent.includes('.env')) {
        this.passed.push('.env files are properly ignored in .gitignore');
      } else {
        this.issues.push('.env files are not ignored in .gitignore');
      }
    } catch (error) {
      this.warnings.push('Could not check .gitignore file');
    }
  }

  async checkSecurityHeaders() {
    this.log('info', '🔍 Checking security headers configuration...');
    
    try {
      const appPath = path.join(projectRoot, 'src/backend/app.mjs');
      const appContent = await fs.readFile(appPath, 'utf8');
      
      const securityHeaders = [
        'helmet',
        'cors',
        'securityHeaders',
        'rateLimiter',
        'csrfProtection'
      ];
      
      securityHeaders.forEach(header => {
        if (appContent.includes(header)) {
          this.passed.push(`Security header configured: ${header}`);
        } else {
          this.warnings.push(`Security header not found: ${header}`);
        }
      });
    } catch (error) {
      this.warnings.push('Could not check security headers configuration');
    }
  }

  async checkEncryptionImplementation() {
    this.log('info', '🔍 Checking encryption implementation...');
    
    const encryptionFiles = [
      'src/backend/services/signalProtocol.mjs',
      'src/backend/services/groupSignalProtocol.mjs',
      'src/backend/config/securityConfig.mjs'
    ];
    
    for (const file of encryptionFiles) {
      try {
        const filePath = path.join(projectRoot, file);
        await fs.access(filePath);
        this.passed.push(`Encryption file exists: ${file}`);
      } catch (error) {
        this.issues.push(`Missing encryption file: ${file}`);
      }
    }
  }

  async generateReport() {
    this.log('info', '📋 Generating security report...');
    
    console.log('\n' + '='.repeat(60));
    console.log('🔒 RELAY NETWORK SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    
    if (this.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.passed.forEach(check => console.log(`   ✓ ${check}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ⚠ ${warning}`));
    }
    
    if (this.issues.length > 0) {
      console.log('\n🚨 ISSUES:');
      this.issues.forEach(issue => console.log(`   ✗ ${issue}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    const totalIssues = this.issues.length;
    const totalWarnings = this.warnings.length;
    
    if (totalIssues === 0 && totalWarnings === 0) {
      console.log('🎉 SECURITY STATUS: EXCELLENT - No issues found!');
      process.exit(0);
    } else if (totalIssues === 0) {
      console.log('✅ SECURITY STATUS: GOOD - Only minor warnings');
      process.exit(0);
    } else {
      console.log(`🚨 SECURITY STATUS: NEEDS ATTENTION - ${totalIssues} issues, ${totalWarnings} warnings`);
      process.exit(1);
    }
  }

  async run() {
    this.log('info', '🚀 Starting comprehensive security check...');
    
    await this.checkDependencies();
    await this.checkHardcodedSecrets();
    await this.checkEnvironmentConfiguration();
    await this.checkSecurityHeaders();
    await this.checkEncryptionImplementation();
    
    await this.generateReport();
  }
}

// Run the security check
const checker = new SecurityChecker();
checker.run().catch(error => {
  console.error('❌ Security check failed:', error);
  process.exit(1);
});
