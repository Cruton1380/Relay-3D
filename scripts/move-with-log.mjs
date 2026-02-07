/**
 * SAFE FILE MOVE UTILITY
 * Moves files with logging for full traceability
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, '../archive/MOVE-LOG.txt');

async function logMove(source, dest, reason) {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} | ${source} → ${dest} | ${reason}\n`;
    await fs.appendFile(logFile, entry);
}

export async function moveWithLog(source, dest, reason = 'Reorganization') {
    try {
        // Ensure destination directory exists
        const destDir = path.dirname(dest);
        await fs.mkdir(destDir, { recursive: true });
        
        // Check if source exists
        try {
            await fs.access(source);
        } catch {
            console.log(`⚠️  Source not found (skipping): ${source}`);
            return false;
        }
        
        // Move file
        await fs.rename(source, dest);
        
        // Log the move
        await logMove(source, dest, reason);
        
        console.log(`✅ Moved: ${path.basename(source)} → ${dest}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to move ${source}:`, error.message);
        return false;
    }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [source, dest, reason] = process.argv.slice(2);
    if (!source || !dest) {
        console.log('Usage: node move-with-log.mjs <source> <dest> [reason]');
        process.exit(1);
    }
    await moveWithLog(source, dest, reason || 'Manual move');
}
