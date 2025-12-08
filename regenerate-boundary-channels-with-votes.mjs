#!/usr/bin/env node
/**
 * Regenerate boundary channels with initialVotes field
 * Run: node regenerate-boundary-channels-with-votes.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname);

const boundaryChannelsFile = join(rootDir, 'data', 'channels', 'boundary-channels.json');

console.log('🔄 Regenerating boundary channels with initialVotes field...\n');

if (!existsSync(boundaryChannelsFile)) {
  console.log('❌ No boundary-channels.json found. Channels will be generated on next server start.');
  process.exit(0);
}

// Load existing channels
const channels = JSON.parse(readFileSync(boundaryChannelsFile, 'utf-8'));
let updatedCount = 0;
let candidatesUpdated = 0;

// Update each channel's candidates with initialVotes
for (const channel of channels) {
  if (!channel.candidates || channel.candidates.length === 0) {
    continue;
  }

  updatedCount++;

  for (const candidate of channel.candidates) {
    // Skip if already has initialVotes
    if (candidate.initialVotes !== undefined) {
      continue;
    }

    candidatesUpdated++;

    // Add initialVotes based on candidate type
    if (candidate.isOfficial || candidate.isDefault) {
      // Official/default boundaries get demo votes
      candidate.initialVotes = Math.floor(Math.random() * 50) + 120; // 120-170
      console.log(`✅ ${channel.name} - ${candidate.name}: Added ${candidate.initialVotes} initialVotes`);
    } else {
      // User proposals start with 0
      candidate.initialVotes = 0;
      console.log(`✅ ${channel.name} - ${candidate.name}: Added 0 initialVotes (proposal)`);
    }

    // Reset votes to 0 (will receive blockchain votes)
    candidate.votes = 0;
  }
}

// Save updated channels
writeFileSync(boundaryChannelsFile, JSON.stringify(channels, null, 2));

console.log(`\n✅ Regeneration complete!`);
console.log(`   - Channels updated: ${updatedCount}`);
console.log(`   - Candidates updated: ${candidatesUpdated}`);
console.log(`   - File: ${boundaryChannelsFile}`);
console.log(`\n🔄 Please restart your backend server for changes to take effect.`);
