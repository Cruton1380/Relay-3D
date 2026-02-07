/**
 * ROOT CONTRACT AUDIT
 * Verifies root directory adheres to ROOT-CONTRACT.md
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Allowed items at root (from ROOT-CONTRACT.md)
const ALLOWED = {
    files: [
        'relay-cesium-world.html',
        'index.html',
        'README.md',
        'CHANGELOG.md',
        'ROOT-CONTRACT.md',
        'package.json',
        'package-lock.json',
        '.gitignore',
        '.eslintrc.js',
        '.eslintrc.json',
        '.eslintrc.cjs',
        'vitest.config.js',
        'vite.config.js',
        'playwright.config.js',
        'nodemon.json',
        'LICENSE',
        'CONTRIBUTING.md'
    ],
    directories: [
        'app',
        'core',
        'data',
        'docs',
        'archive',
        'scripts',
        'tests',
        'tools',
        'config',
        '.relay',
        '.github',
        '.husky',
        '.vscode',
        '.cursor',
        'node_modules',
        'libs'
    ]
};

async function auditRoot() {
    console.log('🔍 ROOT CONTRACT AUDIT\n');
    
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    const violations = [];
    const warnings = [];
    
    for (const entry of entries) {
        const name = entry.name;
        
        // Skip hidden files/folders (except explicitly allowed)
        if (name.startsWith('.') && !ALLOWED.directories.includes(name) && !name.startsWith('.eslintrc')) {
            continue;
        }
        
        // Check if allowed
        if (entry.isDirectory()) {
            if (!ALLOWED.directories.includes(name)) {
                violations.push({ name, type: 'DIR', reason: 'Not in allowed directories list' });
            }
        } else {
            if (!ALLOWED.files.includes(name)) {
                // Special case: check for patterns
                if (name.match(/\.(md|html|txt|json|bat)$/)) {
                    violations.push({ name, type: 'FILE', reason: 'Non-core file at root' });
                } else {
                    warnings.push({ name, type: 'FILE', reason: 'Unexpected file (may be OK)' });
                }
            }
        }
    }
    
    // Report
    if (violations.length === 0 && warnings.length === 0) {
        console.log('✅ ROOT CONTRACT COMPLIANT\n');
        console.log('All files and directories are allowed.\n');
        return true;
    }
    
    if (violations.length > 0) {
        console.log(`❌ VIOLATIONS FOUND: ${violations.length}\n`);
        violations.forEach(v => {
            console.log(`  ${v.type.padEnd(5)} ${v.name}`);
            console.log(`         → ${v.reason}\n`);
        });
    }
    
    if (warnings.length > 0) {
        console.log(`⚠️  WARNINGS: ${warnings.length}\n`);
        warnings.forEach(w => {
            console.log(`  ${w.type.padEnd(5)} ${w.name}`);
            console.log(`         → ${w.reason}\n`);
        });
    }
    
    console.log('📋 ACTIONS:\n');
    console.log('1. Move violations to archive/temp/');
    console.log('2. Or update ROOT-CONTRACT.md if they should be allowed');
    console.log('3. Run this audit again until clean\n');
    
    return violations.length === 0;
}

auditRoot().then(passed => {
    process.exit(passed ? 0 : 1);
});
