/**
 * Relay Dev Server
 * Minimal static HTTP server for local development.
 * Zero dependencies — uses only Node.js built-in modules.
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const port = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.geojson': 'application/geo+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.wasm': 'application/wasm',
};

const server = http.createServer(async (req, res) => {
    if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    let pathname = '/';
    try {
        pathname = new URL(req.url || '/', 'http://localhost').pathname;
    } catch {
        pathname = '/';
    }

    if (pathname === '/') pathname = '/index.html';

    const filePath = path.join(rootDir, pathname);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    try {
        const stat = await fs.stat(resolved);

        // Directory listing (needed for boundary file discovery)
        if (stat.isDirectory()) {
            const entries = await fs.readdir(resolved);
            const links = entries.map(e => `<a href="${e}">${e}</a>`).join('\n');
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(`<pre>${links}</pre>`);
            return;
        }

        const ext = path.extname(resolved).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const data = await fs.readFile(resolved);

        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
        });
        res.end(data);
    } catch {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(port, () => {
    console.log(`\n  Relay Dev Server`);
    console.log(`  http://localhost:${port}\n`);
});
