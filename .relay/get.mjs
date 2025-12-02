#!/usr/bin/env node
// get.mjs — IPFS/Git miss resolver
// Env:
//  - GIT_DIR: path to bare git dir
//  - BRANCH: branch name
//  - REL_PATH: path within repo (no leading slash)
//  - CACHE_ROOT: optional cache directory (default: /srv/relay/ipfs-cache)
// Output: JSON to stdout
//  { kind: "file", contentType, bodyBase64 }
//  { kind: "dir", items: [ { name, source } ] }
//  { kind: "miss" }

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function env(name, def) { const v = process.env[name]; return v == null ? def : v; }
const GIT_DIR = env('GIT_DIR');
const BRANCH = env('BRANCH', 'main');
const REL = (env('REL_PATH', '') || '').replace(/^\/+/, '');
const CACHE_ROOT = env('CACHE_ROOT', '/srv/relay/ipfs-cache');
if (!GIT_DIR) { console.error('missing GIT_DIR'); process.exit(2); }

function git(args, opts={}) { return execFileSync('git', ['--git-dir', GIT_DIR, ...args], { encoding: 'utf8', ...opts }); }

function getRootCid() {
  try {
    const out = git(['show', `${BRANCH}:.relay/root.ipfs`]);
    const cid = out.trim();
    if (!cid) return null;
    return cid;
  } catch { return null; }
}

function listGitDir(rel) {
  try {
    const out = git(['ls-tree', '--name-only', `${BRANCH}:${rel}`]);
    return out.split(/\r?\n/).filter(Boolean);
  } catch { return []; }
}

function ipfsCat(cid, rel, timeoutMs=10000) {
  const p = spawnSync('ipfs', ['cat', `${cid}/${rel}`], { encoding: 'buffer', timeout: timeoutMs });
  if (p.status === 0 && p.stdout && p.stdout.length) {
    return Buffer.from(p.stdout);
  }
  return null;
}

function ipfsLs(cid, rel, timeoutMs=10000) {
  const p = spawnSync('ipfs', ['ls', `${cid}/${rel}`], { encoding: 'utf8', timeout: timeoutMs });
  if (p.status !== 0) return null;
  // Parse names from lines (last column typically name)
  const lines = (p.stdout || '').split(/\r?\n/).filter(Boolean);
  const names = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const name = parts[parts.length - 1];
    if (name && !/^[A-Za-z0-9]+$/.test(name)) { // crude filter; accept non-hash last column as name
      names.push(name);
    } else if (parts.length >= 3) {
      names.push(parts[2]);
    }
  }
  return names;
}

function guessContentType(p) {
  const low = p.toLowerCase();
  if (low.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (low.endsWith('.html') || low.endsWith('.htm')) return 'text/html; charset=utf-8';
  if (low.endsWith('.json')) return 'application/json';
  if (low.endsWith('.yaml') || low.endsWith('.yml')) return 'application/x-yaml';
  if (low.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (low.endsWith('.png')) return 'image/png';
  if (low.endsWith('.jpg') || low.endsWith('.jpeg')) return 'image/jpeg';
  if (low.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

function ensureCacheDir(cid) {
  const dir = path.join(CACHE_ROOT, cid);
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}

function readCache(cid, rel) {
  const dir = ensureCacheDir(cid);
  const p = path.join(dir, Buffer.from(rel).toString('hex') + '.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function writeCache(cid, rel, obj) {
  const dir = ensureCacheDir(cid);
  const p = path.join(dir, Buffer.from(rel).toString('hex') + '.json');
  try { fs.writeFileSync(p, JSON.stringify(obj)); } catch {}
}

function main() {
  const cid = getRootCid();
  // If no CID is present, return Git-only directory listing (if any)
  if (!cid) {
    const relDir = REL.replace(/\/+$/, '');
    const gitItems = listGitDir(relDir);
    const items = gitItems.map((name) => ({ name, source: 'git' }));
    console.log(JSON.stringify({ kind: 'dir', items }));
    return;
  }
  // If REL looks like a file, try IPFS cat first
  const fileBuf = ipfsCat(cid, REL, 10000);
  if (fileBuf) {
    const ct = guessContentType(REL);
    console.log(JSON.stringify({ kind: 'file', contentType: ct, bodyBase64: fileBuf.toString('base64') }));
    return;
  }
  // Directory merge: collect Git listing and IPFS listing with 10s timeout and cache
  const relDir = REL.replace(/\/+$/, '');
  const gitItems = listGitDir(relDir);
  let cached = readCache(cid, relDir);
  if (cached) { console.log(JSON.stringify(cached)); return; }
  const ipfsItems = ipfsLs(cid, relDir, 10000) || [];
  const set = new Set();
  for (const n of gitItems) set.add(n);
  for (const n of ipfsItems) set.add(n);
  const items = Array.from(set).map((name) => ({ name, source: (gitItems.includes(name) && ipfsItems.includes(name)) ? 'both' : (gitItems.includes(name) ? 'git' : 'ipfs') }));
  const out = { kind: 'dir', items };
  writeCache(cid, relDir, out);
  console.log(JSON.stringify(out));
}

try { main(); } catch (e) { console.log(JSON.stringify({ kind: 'miss', error: String(e && e.message || e) })); }
