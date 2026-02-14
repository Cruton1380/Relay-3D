import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const activeSlicePath = path.join(ROOT, 'docs', 'process', 'ACTIVE-SLICE.md');
const registerPath = path.join(ROOT, 'docs', 'process', 'SLICE-REGISTER.md');
const proofIndexPath = path.join(ROOT, 'archive', 'proofs', 'PROOF-INDEX.md');

const fail = (msg) => {
  console.error(`[SLICE-GATE] FAIL ${msg}`);
  process.exit(1);
};

const pass = (msg) => {
  console.log(`[SLICE-GATE] PASS ${msg}`);
};

const read = (p) => {
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
};

const getHead = () => execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();

const activeText = read(activeSlicePath);
if (!activeText) fail('missing docs/process/ACTIVE-SLICE.md');

const statusMatch = activeText.match(/Status:\s*(.+)$/m);
const baselineMatch = activeText.match(/BaselineHead:\s*([a-f0-9]{7,40})$/m);
const proofMatch = activeText.match(/ProofArtifact:\s*(.+)$/m);
const sliceMatch = activeText.match(/Slice:\s*(.+)$/m);

const status = statusMatch ? statusMatch[1].trim().toUpperCase() : '';
const baselineHead = baselineMatch ? baselineMatch[1].trim() : '';
const proofPathRel = proofMatch ? proofMatch[1].trim() : '';
const sliceName = sliceMatch ? sliceMatch[1].trim() : '';

const draftByEnv = String(process.env.RELAY_SLICE_MODE || '').toUpperCase() === 'DRAFT';
const draftByStatus = status === 'DRAFT';
if (draftByEnv || draftByStatus) {
  pass(`bypass=DRAFT slice="${sliceName || 'unknown'}"`);
  process.exit(0);
}

if (!sliceName) fail('ACTIVE-SLICE missing Slice');
if (!baselineHead) fail('ACTIVE-SLICE missing BaselineHead');
if (!proofPathRel) fail('ACTIVE-SLICE missing ProofArtifact');

const currentHead = getHead();
const baselineMatches = currentHead === baselineHead || currentHead.startsWith(baselineHead);
if (!baselineMatches) {
  fail(`baseline mismatch active=${baselineHead} current=${currentHead}`);
}

const proofPath = path.join(ROOT, proofPathRel);
if (!fs.existsSync(proofPath)) {
  fail(`proof artifact missing ${proofPathRel}`);
}

const proofIndex = read(proofIndexPath);
if (!proofIndex) fail('missing archive/proofs/PROOF-INDEX.md');
if (!proofIndex.includes(proofPathRel)) {
  fail(`proof artifact not indexed ${proofPathRel}`);
}

const register = read(registerPath);
if (!register) fail('missing docs/process/SLICE-REGISTER.md');
if (!register.includes(sliceName)) {
  fail(`slice missing in register "${sliceName}"`);
}

pass(`slice="${sliceName}" baseline=${baselineHead} proofIndexed=YES`);

