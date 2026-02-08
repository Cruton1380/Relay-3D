import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, 'archive', 'proofs', 'PROOF-INDEX.md');

const content = fs.readFileSync(indexPath, 'utf-8');
const lines = content.split(/\r?\n/);

const proofExtensions = new Set(['.log', '.png', '.jpg', '.jpeg', '.webp', '.md', '.txt', '.json', '.csv']);
const references = new Map();

const normalizeRef = (ref) => ref.replace(/\\/g, '/').replace(/^\.\/+/, '');

const addReference = (ref) => {
    if (!ref) return;
    const normalized = normalizeRef(ref);
    if (!references.has(normalized)) {
        references.set(normalized, true);
    }
};

const maybeAddFromToken = (token) => {
    if (!token) return;
    const normalized = normalizeRef(token);
    if (normalized.includes('archive/proofs/')) {
        addReference(normalized);
        return;
    }
    if (normalized.includes('/')) return;
    const ext = path.extname(normalized).toLowerCase();
    if (!proofExtensions.has(ext)) return;
    addReference(`archive/proofs/${normalized}`);
};

for (const line of lines) {
    const missingMatch = line.match(/^MISSING:\s+([^\s]+)/);
    if (missingMatch) {
        addReference(missingMatch[1]);
        continue;
    }

    for (const match of line.matchAll(/archive\/proofs\/[A-Za-z0-9_.\-\/]+/g)) {
        addReference(match[0]);
    }

    for (const match of line.matchAll(/`([^`]+)`/g)) {
        maybeAddFromToken(match[1]);
    }
}

const refs = Array.from(references.keys()).sort();
let present = 0;
const missing = [];

for (const ref of refs) {
    const absolutePath = path.resolve(repoRoot, ref);
    if (fs.existsSync(absolutePath)) {
        present += 1;
    } else {
        missing.push(ref);
    }
}

console.log(`[PQ1] proofIndex total=${refs.length} present=${present} missing=${missing.length}`);
for (const ref of missing) {
    console.log(`[PQ1] missing: ${ref}`);
}
