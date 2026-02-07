/**
 * MINIMAL DEV SERVER
 * Serves static files with proper CORS headers for local development
 * Lock C: Keep until Cesium boot gate passes
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const port = process.env.PORT || 8000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.geojson': 'application/geo+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel'
};

const server = http.createServer(async (req, res) => {
    // Parse URL
    let filePath = req.url === '/' ? '/relay-cesium-world.html' : req.url;
    filePath = path.join(rootDir, filePath);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(rootDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    try {
        // Read file
        const content = await fs.readFile(filePath);
        
        // Determine content type
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // CORS headers (allow local development)
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache'
        });
        
        res.end(content);
        
        // Log request
        const timestamp = new Date().toISOString().substring(11, 19);
        console.log(`[${timestamp}] ${req.method} ${req.url} → 200`);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            console.log(`[404] ${req.url}`);
        } else if (error.code === 'EISDIR') {
            // Try index.html
            try {
                const indexPath = path.join(filePath, 'index.html');
                const content = await fs.readFile(indexPath);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            } catch {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            console.error(`[500] ${req.url}:`, error.message);
        }
    }
});

server.listen(port, () => {
    console.log('');
    console.log('🌍 Relay Dev Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`📂 Serving from: ${rootDir}`);
    console.log(`🚀 Open: http://localhost:${port}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down dev server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
