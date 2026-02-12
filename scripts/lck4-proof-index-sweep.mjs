import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const INDEX_FILE = path.join(PROOFS_DIR, 'PROOF-INDEX.md');
const LOG_FILE = path.join(PROOFS_DIR, `lck4-proof-index-console-${DATE_TAG}.log`);

const LOCKS = [
  {
    id: 'LCK-1',
    header: '## LCK-1:',
    consoleFile: 'lck1-boundary-console-2026-02-11.log',
    screenshotFile: 'lck1-boundary-screenshot-2026-02-11.png'
  },
  {
    id: 'LCK-2',
    header: '## LCK-2:',
    consoleFile: 'lck2-vote-canon-console-2026-02-11.log'
  },
  {
    id: 'LCK-3',
    header: '## LCK-3:',
    consoleFile: 'lck3-governance-console-2026-02-11.log'
  }
];

const lines = [];
const log = (msg) => {
  const text = String(msg);
  lines.push(text);
  // eslint-disable-next-line no-console
  console.log(text);
};

const exists = async (absPath) => {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
};

const extractSection = (fullText, headerPrefix) => {
  const start = fullText.indexOf(headerPrefix);
  if (start < 0) return '';
  const tail = fullText.slice(start);
  const nextIdx = tail.indexOf('\n## ', 1);
  return nextIdx < 0 ? tail : tail.slice(0, nextIdx);
};

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  const indexText = await fs.readFile(INDEX_FILE, 'utf8');

  const missing = [];

  for (const lock of LOCKS) {
    const section = extractSection(indexText, lock.header);
    if (!section) {
      missing.push(`${lock.id}:section`);
      continue;
    }

    const hasCriteriaBlock = section.includes('**Current Result**:') || section.includes('**Pass Criteria Verified**:');
    if (!hasCriteriaBlock) missing.push(`${lock.id}:criteria-block`);

    const hasCommand = section.includes('**Verification Command**:');
    if (!hasCommand) missing.push(`${lock.id}:command-block`);

    if (section.includes('MISSING:')) {
      missing.push(`${lock.id}:missing-placeholder`);
    }

    const consoleAbs = path.join(PROOFS_DIR, lock.consoleFile);
    const consoleOk = await exists(consoleAbs);
    if (!consoleOk) missing.push(`${lock.id}:console-artifact`);

    let artifactCount = consoleOk ? 1 : 0;
    if (lock.screenshotFile) {
      const shotAbs = path.join(PROOFS_DIR, lock.screenshotFile);
      const shotOk = await exists(shotAbs);
      if (!shotOk) missing.push(`${lock.id}:screenshot-artifact`);
      if (shotOk) artifactCount += 1;
    }

    log(`[PROOF] audit lockGroup=${lock.id} result=${(artifactCount > 0 && !missing.some(m => m.startsWith(`${lock.id}:`))) ? 'PASS' : 'FAIL'} artifacts=${artifactCount}`);
  }

  if (missing.length > 0) {
    log(`[REFUSAL] reason=PROOF_INDEX_INCOMPLETE missing=${missing.join(',')}`);
    log('[PROOF] index-sync result=FAIL missing=' + missing.length);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
    return;
  }

  log('[PROOF] index-sync result=PASS missing=0');
  await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
}

main().catch(async (err) => {
  const fatal = `[LCK4] fatal=${err?.stack || err}`;
  // eslint-disable-next-line no-console
  console.error(fatal);
  try {
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    await fs.writeFile(LOG_FILE, `${fatal}\n`, 'utf8');
  } catch {
    // ignore
  }
  process.exitCode = 1;
});

