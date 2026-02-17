import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DEFAULT = path.resolve(ROOT, 'data', 'demos', 'demo-voting-data.json');

const iso2ToIso3 = {
  US: 'USA',
  IT: 'ITA',
  DE: 'DEU',
  JP: 'JPN',
  BR: 'BRA',
  AU: 'AUS',
  CA: 'CAN'
};

function toIso3(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw.length === 3) return raw;
  if (raw.length === 2) return iso2ToIso3[raw] || '';
  return '';
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stableSort(arr, keyFn) {
  return [...arr].sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

export function adaptV93VotingData(sourceJson) {
  const channels = Array.isArray(sourceJson?.channels) ? sourceJson.channels : [];
  const votes = [];
  const seedCandidates = [];
  const malformed = [];
  const topicTotals = new Map();
  const countryTotals = new Map();
  let relayVoteTotal = 0;
  let sourceVoteTotal = 0;

  for (const channel of channels) {
    const channelId = slugify(channel?.id);
    const lat = normalizeNumber(channel?.location?.latitude);
    const lon = normalizeNumber(channel?.location?.longitude);
    const countryCode = toIso3(channel?.countryCode || channel?.location?.countryCode);
    const category = String(channel?.category || 'Uncategorized');
    const reliability = normalizeNumber(channel?.reliabilityScore);
    const channelVotes = normalizeNumber(channel?.totalVotes) || 0;
    sourceVoteTotal += channelVotes;

    if (!channelId || lat === null || lon === null) {
      malformed.push({ type: 'channel', id: String(channel?.id || 'unknown'), reason: 'MISSING_ID_OR_COORDINATE' });
      continue;
    }

    const candidates = Array.isArray(channel?.candidates) ? channel.candidates : [];
    const candidateCount = candidates.length;
    const topCandidate = candidates.reduce((best, next) => {
      const bestVotes = normalizeNumber(best?.votes) || -1;
      const nextVotes = normalizeNumber(next?.votes) || -1;
      return nextVotes > bestVotes ? next : best;
    }, null);

    const seedId = `v93-${channelId}`;
    seedCandidates.push({
      id: seedId,
      channelId,
      source: 'v93-channel',
      name: String(channel?.name || channelId),
      lat,
      lon,
      countryCode,
      regionId: String(channel?.region_id || ''),
      category,
      totalVotes: channelVotes,
      candidateCount,
      reliabilityScore: reliability,
      topCandidateId: String(topCandidate?.id || ''),
      lastActivity: String(channel?.lastActivity || '')
    });

    topicTotals.set(category, (topicTotals.get(category) || 0) + channelVotes);
    if (countryCode) {
      countryTotals.set(countryCode, (countryTotals.get(countryCode) || 0) + channelVotes);
    }

    for (const candidate of candidates) {
      const candidateId = slugify(candidate?.id);
      const cVotes = normalizeNumber(candidate?.votes);
      const cLat = normalizeNumber(candidate?.location?.lat);
      const cLon = normalizeNumber(candidate?.location?.lng);
      if (!candidateId || cVotes === null || cLat === null || cLon === null) {
        malformed.push({
          type: 'candidate',
          id: String(candidate?.id || 'unknown'),
          channelId,
          reason: 'MISSING_ID_VOTES_OR_COORDINATE'
        });
        continue;
      }
      relayVoteTotal += cVotes;
      votes.push({
        id: `vote.${channelId}.${candidateId}`,
        channelId,
        candidateId,
        topic: category,
        lat: cLat,
        lon: cLon,
        countryCode,
        regionId: String(channel?.region_id || ''),
        votes: cVotes,
        reliability: normalizeNumber(candidate?.user?.reliability),
        contributor: String(candidate?.user?.username || ''),
        content: String(candidate?.content || ''),
        lastActivity: String(channel?.lastActivity || '')
      });
    }
  }

  const topicDistribution = stableSort(
    Array.from(topicTotals.entries()).map(([topic, totalVotes]) => ({ topic, totalVotes })),
    (x) => x.topic
  );
  const countryDistribution = stableSort(
    Array.from(countryTotals.entries()).map(([countryCode, totalVotes]) => ({ countryCode, totalVotes })),
    (x) => x.countryCode
  );

  const parity = {
    channels: channels.length,
    seeds: seedCandidates.length,
    relayVotes: votes.length,
    sourceVoteTotal,
    relayVoteTotal,
    countsPass: seedCandidates.length > 0 && votes.length > 0,
    locationCoveragePass: seedCandidates.length > 0 && malformed.filter((m) => m.reason.includes('COORDINATE')).length === 0,
    distributionPass: topicDistribution.length > 0 && countryDistribution.length > 0,
    malformedCount: malformed.length
  };

  const relayBridge = {
    metadata: {
      adapterVersion: 'v93-bridge-v1',
      source: 'data/demos/demo-voting-data.json',
      generatedAt: new Date().toISOString()
    },
    votes: stableSort(votes, (x) => x.id),
    seedCandidates: stableSort(seedCandidates, (x) => x.id),
    aggregates: {
      topicDistribution,
      countryDistribution
    },
    parity,
    malformed
  };

  return relayBridge;
}

export async function runAdapter({
  sourcePath = SOURCE_DEFAULT,
  outputDir
} = {}) {
  const sourceRaw = await fs.readFile(sourcePath, 'utf8');
  const sourceJson = JSON.parse(sourceRaw);
  const relayBridge = adaptV93VotingData(sourceJson);
  const date = new Date().toISOString().slice(0, 10);
  const resolvedOutputDir = outputDir || path.resolve(ROOT, 'archive', 'proofs', `v93-data-salvage-1-${date}`);
  await fs.mkdir(resolvedOutputDir, { recursive: true });

  const outputPath = path.resolve(resolvedOutputDir, 'v93-relay-bridge-output.json');
  const parityPath = path.resolve(resolvedOutputDir, 'v93-parity-report.json');

  await fs.writeFile(outputPath, JSON.stringify(relayBridge, null, 2));
  await fs.writeFile(parityPath, JSON.stringify(relayBridge.parity, null, 2));

  return {
    sourcePath,
    outputDir: resolvedOutputDir,
    outputPath,
    parityPath,
    relayBridge
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runAdapter()
    .then((result) => {
      const p = result.relayBridge.parity;
      console.log(`[V93-SALVAGE] adapter source=${result.sourcePath} channels=${p.channels} votes=${p.relayVotes} seeds=${p.seeds}`);
      console.log(`[V93-SALVAGE] parity counts=${p.countsPass ? 'PASS' : 'FAIL'} distribution=${p.distributionPass ? 'PASS' : 'FAIL'} locationCoverage=${p.locationCoveragePass ? 'PASS' : 'FAIL'} malformed=${p.malformedCount}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[REFUSAL] reason=V93_SALVAGE_ADAPTER_FAILED detail="${error.message}"`);
      process.exit(1);
    });
}
