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

const failWithHints = (msg, hints = []) => {
  console.error(`[SLICE-GATE] FAIL ${msg}`);
  hints.forEach((h) => console.error(`[SLICE-GATE] HINT ${h}`));
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
if (!activeText) failWithHints('missing docs/process/ACTIVE-SLICE.md', [
  'Create docs/process/ACTIVE-SLICE.md using the current slice header template.'
]);

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

if (!sliceName) failWithHints('ACTIVE-SLICE missing Slice', [
  'Add: Slice: <RAIL>-<SLICE> in docs/process/ACTIVE-SLICE.md'
]);
if (!baselineHead) failWithHints('ACTIVE-SLICE missing BaselineHead', [
  'Add: BaselineHead: <git rev-parse HEAD>'
]);
if (!proofPathRel) failWithHints('ACTIVE-SLICE missing ProofArtifact', [
  'Add: ProofArtifact: archive/proofs/<RAIL>-<SLICE>-<YYYY-MM-DD>.log'
]);

const currentHead = getHead();
const baselineMatches = currentHead === baselineHead || currentHead.startsWith(baselineHead);
if (!baselineMatches) {
  failWithHints(`baseline mismatch active=${baselineHead} current=${currentHead}`, [
    'Run git rev-parse HEAD and update BaselineHead in docs/process/ACTIVE-SLICE.md',
    `Expected BaselineHead to match current HEAD prefix: ${currentHead.slice(0, 7)}...`
  ]);
}

const proofPath = path.join(ROOT, proofPathRel);
if (!fs.existsSync(proofPath)) {
  failWithHints(`proof artifact missing ${proofPathRel}`, [
    `Expected proof path: ${proofPathRel}`,
    'Generate proof log, then ensure it is committed under archive/proofs/.'
  ]);
}

const proofIndex = read(proofIndexPath);
if (!proofIndex) failWithHints('missing archive/proofs/PROOF-INDEX.md', [
  'Create or restore archive/proofs/PROOF-INDEX.md before committing this slice.'
]);
if (!proofIndex.includes(proofPathRel)) {
  failWithHints(`proof artifact not indexed ${proofPathRel}`, [
    `Add index entry containing exact path: ${proofPathRel}`,
    `Expected index pattern: - \`${proofPathRel}\``
  ]);
}

const register = read(registerPath);
if (!register) failWithHints('missing docs/process/SLICE-REGISTER.md', [
  'Create docs/process/SLICE-REGISTER.md and add a row for the active slice.'
]);
if (!register.includes(sliceName)) {
  failWithHints(`slice missing in register "${sliceName}"`, [
    `Add a register row with Slice ID exactly matching: ${sliceName}`,
    'Include proof path, contract refs, reviewer, and result columns in that row.'
  ]);
}

pass(`slice="${sliceName}" baseline=${baselineHead} proofIndexed=YES`);

