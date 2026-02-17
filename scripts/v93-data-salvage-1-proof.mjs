import fs from 'node:fs/promises';
import path from 'node:path';
import { runAdapter } from './v93-to-relay-state-adapter.mjs';

const DATE = new Date().toISOString().slice(0, 10);
const PROOF_DIR = path.resolve('archive', 'proofs', `v93-data-salvage-1-${DATE}`);
const LOG_PATH = path.resolve(PROOF_DIR, 'proof.log');

const logs = [];
function log(line) {
  const text = `[V93-SALVAGE-PROOF] ${line}`;
  logs.push(text);
  console.log(text);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  await fs.mkdir(PROOF_DIR, { recursive: true });
  log(`start date=${DATE}`);

  const result = await runAdapter({ outputDir: PROOF_DIR });
  const parity = result.relayBridge.parity;
  log(`stage=adapter-run output=${path.basename(result.outputPath)} parity=${path.basename(result.parityPath)} result=PASS`);

  assert(parity.countsPass, 'counts parity failed');
  assert(parity.distributionPass, 'distribution parity failed');
  assert(parity.locationCoveragePass, 'location coverage failed');
  assert(parity.malformedCount === 0, `malformed records present: ${parity.malformedCount}`);
  log(`stage=parity-check counts=PASS distribution=PASS locationCoverage=PASS malformed=0`);

  const topicCount = result.relayBridge.aggregates.topicDistribution.length;
  const countryCount = result.relayBridge.aggregates.countryDistribution.length;
  assert(topicCount > 0, 'topic distribution empty');
  assert(countryCount > 0, 'country distribution empty');
  log(`stage=distribution-check topics=${topicCount} countries=${countryCount} result=PASS`);

  await fs.writeFile(LOG_PATH, `${logs.join('\n')}\n`, 'utf8');
  log(`done log=${LOG_PATH}`);
}

main().catch(async (error) => {
  log(`failed error="${error.message}"`);
  await fs.writeFile(LOG_PATH, `${logs.join('\n')}\n`, 'utf8');
  process.exit(1);
});
