#!/usr/bin/env node
/**
 * Add initialVotes field to ALL candidates (testchan + any others)
 * This fixes the vote counting issue for all channel types
 * 
 * Run: node add-initial-votes-to-all-candidates.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname);

console.log('🔄 Adding initialVotes field to ALL candidates in all channels...\n');

let totalChannelsUpdated = 0;
let totalCandidatesUpdated = 0;

// Function to recursively find all JSON files
function findJsonFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (!file.startsWith('.') && file !== 'node_modules') {
        findJsonFiles(filePath, fileList);
      }
    } else if (file.endsWith('.json') && (file.includes('channel') || file.includes('candidate'))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update candidates in a channel object
function updateCandidates(data, filePath) {
  let updated = false;
  let candidatesFixed = 0;
  
  // Handle single channel object
  if (data.candidates && Array.isArray(data.candidates)) {
    data.candidates.forEach(candidate => {
      if (candidate.initialVotes === undefined) {
        // Determine initialVotes based on candidate type
        if (candidate.isOfficial || candidate.isDefault) {
          candidate.initialVotes = Math.floor(Math.random() * 50) + 120; // 120-170
        } else {
          candidate.initialVotes = 0; // User proposals start at 0
        }
        candidatesFixed++;
        updated = true;
        console.log(`  ✅ ${candidate.name || candidate.candidateName}: Added ${candidate.initialVotes} initialVotes`);
      }
    });
  }
  
  // Handle array of channels
  if (Array.isArray(data)) {
    data.forEach(channel => {
      if (channel.candidates && Array.isArray(channel.candidates)) {
        channel.candidates.forEach(candidate => {
          if (candidate.initialVotes === undefined) {
            if (candidate.isOfficial || candidate.isDefault) {
              candidate.initialVotes = Math.floor(Math.random() * 50) + 120;
            } else {
              candidate.initialVotes = 0;
            }
            candidatesFixed++;
            updated = true;
            console.log(`  ✅ ${candidate.name || candidate.candidateName}: Added ${candidate.initialVotes} initialVotes`);
          }
        });
      }
    });
  }
  
  if (updated) {
    totalChannelsUpdated++;
    totalCandidatesUpdated += candidatesFixed;
  }
  
  return { data, updated };
}

// Search for JSON files
const dataDir = join(rootDir, 'data');
const jsonFiles = existsSync(dataDir) ? findJsonFiles(dataDir) : [];

console.log(`🔍 Found ${jsonFiles.length} potential channel/candidate JSON files\n`);

jsonFiles.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let data = JSON.parse(content);
    
    const { data: updatedData, updated } = updateCandidates(data, filePath);
    
    if (updated) {
      writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
      console.log(`📝 Updated: ${filePath}\n`);
    }
  } catch (error) {
    // Silently skip files that aren't valid JSON or don't match our structure
  }
});

console.log('✅ Migration complete!');
console.log(`   - Channels updated: ${totalChannelsUpdated}`);
console.log(`   - Candidates fixed: ${totalCandidatesUpdated}`);
console.log('\n🔄 Please restart your backend server for changes to take effect.');
