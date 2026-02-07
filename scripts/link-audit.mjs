/**
 * DOCUMENTATION LINK AUDIT
 * Scans all markdown files for broken links
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function findMarkdownFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await findMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

async function extractLinks(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const links = [];
    
    // Match markdown links: [text](path)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownLinkRegex.exec(content)) !== null) {
        links.push({ text: match[1], path: match[2], line: content.substring(0, match.index).split('\n').length });
    }
    
    return links;
}

async function checkLinkExists(linkPath, sourceFile) {
    // Handle URLs
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
        return true; // Skip external links
    }
    
    // Handle anchors
    if (linkPath.startsWith('#')) {
        return true; // Skip internal anchors
    }
    
    // Resolve relative path
    const sourceDir = path.dirname(sourceFile);
    const resolvedPath = path.resolve(sourceDir, linkPath);
    
    try {
        await fs.access(resolvedPath);
        return true;
    } catch {
        return false;
    }
}

async function auditLinks() {
    console.log('🔍 Starting documentation link audit...\n');
    
    const mdFiles = await findMarkdownFiles(rootDir);
    console.log(`📄 Found ${mdFiles.length} markdown files\n`);
    
    const brokenLinks = [];
    let totalLinks = 0;
    
    for (const file of mdFiles) {
        const links = await extractLinks(file);
        totalLinks += links.length;
        
        for (const link of links) {
            const exists = await checkLinkExists(link.path, file);
            if (!exists) {
                brokenLinks.push({
                    file: path.relative(rootDir, file),
                    line: link.line,
                    text: link.text,
                    path: link.path
                });
            }
        }
    }
    
    console.log(`📊 Total links checked: ${totalLinks}`);
    console.log(`❌ Broken links: ${brokenLinks.length}\n`);
    
    if (brokenLinks.length > 0) {
        console.log('🔗 Broken Links:\n');
        brokenLinks.forEach(link => {
            console.log(`  ${link.file}:${link.line}`);
            console.log(`    [${link.text}](${link.path})\n`);
        });
    } else {
        console.log('✅ All links valid!\n');
    }
    
    // Write audit report
    const reportPath = path.join(rootDir, 'archive/LINK-AUDIT-REPORT.txt');
    const report = `Link Audit Report - ${new Date().toISOString()}\n\n` +
        `Total markdown files: ${mdFiles.length}\n` +
        `Total links: ${totalLinks}\n` +
        `Broken links: ${brokenLinks.length}\n\n` +
        (brokenLinks.length > 0 ? 
            'Broken Links:\n' + brokenLinks.map(l => 
                `${l.file}:${l.line} - [${l.text}](${l.path})`
            ).join('\n') 
            : 'All links valid!');
    
    await fs.writeFile(reportPath, report);
    console.log(`📋 Audit report saved: archive/LINK-AUDIT-REPORT.txt`);
}

auditLinks().catch(console.error);
