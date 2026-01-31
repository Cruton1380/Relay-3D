#!/usr/bin/env node
/**
 * ENTRY POINT VERIFICATION SCRIPT
 * 
 * Ensures there is exactly ONE frontend entry chain:
 * - Only one main.jsx file
 * - Only one App.jsx file  
 * - index.html points to the canonical entry
 * 
 * Run: npm run verify:entry
 * 
 * Exits with code 1 if violations found.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}🔍 Verifying Frontend Entry Chain...${RESET}\n`);

let violations = [];

// ============================================================================
// 1. Check for duplicate main.jsx files
// ============================================================================
console.log('📁 Checking for main.jsx duplicates...');

const mainFiles = glob.sync('**/main.{jsx,tsx,js,ts}', {
  cwd: projectRoot,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/archive/**',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}'
  ]
});

if (mainFiles.length === 0) {
  violations.push('❌ No main.jsx/main.tsx found! Frontend has no entry point.');
} else if (mainFiles.length > 1) {
  violations.push(`❌ Multiple main files found (expected exactly 1):\n   ${mainFiles.map(f => `- ${f}`).join('\n   ')}`);
} else {
  console.log(`   ${GREEN}✓${RESET} Found exactly 1 main file: ${mainFiles[0]}`);
}

// ============================================================================
// 2. Check for duplicate App.jsx files
// ============================================================================
console.log('📁 Checking for App.jsx duplicates...');

const appFiles = glob.sync('**/App.{jsx,tsx,js,ts}', {
  cwd: projectRoot,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/archive/**',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}'
  ]
});

if (appFiles.length === 0) {
  violations.push('❌ No App.jsx/App.tsx found! Frontend has no root component.');
} else if (appFiles.length > 1) {
  violations.push(`❌ Multiple App files found (expected exactly 1):\n   ${appFiles.map(f => `- ${f}`).join('\n   ')}`);
} else {
  console.log(`   ${GREEN}✓${RESET} Found exactly 1 App file: ${appFiles[0]}`);
}

// ============================================================================
// 3. Verify index.html points to the canonical main file
// ============================================================================
console.log('🔗 Verifying index.html entry point...');

const indexHtmlPath = path.join(projectRoot, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  violations.push('❌ index.html not found at project root!');
} else {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  const scriptMatch = indexHtml.match(/<script[^>]*src=["']([^"']+)["']/);
  
  if (!scriptMatch) {
    violations.push('❌ No <script> tag found in index.html!');
  } else {
    const scriptSrc = scriptMatch[1];
    console.log(`   Found script src: ${scriptSrc}`);
    
    if (mainFiles.length === 1) {
      const expectedPath = `/${mainFiles[0].replace(/\\/g, '/')}`;
      if (scriptSrc === expectedPath) {
        console.log(`   ${GREEN}✓${RESET} index.html points to canonical main: ${scriptSrc}`);
      } else {
        violations.push(
          `❌ index.html points to: ${scriptSrc}\n` +
          `   But canonical main is: ${expectedPath}\n` +
          `   → Update index.html to reference the correct entry point!`
        );
      }
    }
  }
}

// ============================================================================
// 4. Check for orphaned Router files (common source of duplicate routing)
// ============================================================================
console.log('🛤️  Checking for duplicate Router files...');

const routerFiles = glob.sync('**/*{Router,Routes,router,routes}.{jsx,tsx,js,ts}', {
  cwd: projectRoot,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/archive/**',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}'
  ]
});

if (routerFiles.length > 3) {
  console.log(`   ${YELLOW}⚠${RESET} Multiple router-related files found (${routerFiles.length}):`);
  routerFiles.forEach(f => console.log(`   - ${f}`));
  console.log(`   ${YELLOW}→${RESET} Consider consolidating routing logic into App.jsx`);
}

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));

if (violations.length === 0) {
  console.log(`${GREEN}${BOLD}✓ All checks passed!${RESET}`);
  console.log(`${GREEN}Frontend has a single, unambiguous entry chain.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}✗ ${violations.length} violation(s) found:${RESET}\n`);
  violations.forEach(v => console.log(`${v}\n`));
  console.log(`${YELLOW}Fix these issues and run 'npm run verify:entry' again.${RESET}\n`);
  process.exit(1);
}
