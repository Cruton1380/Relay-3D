#!/usr/bin/env node
/**
 * RELAY MIGRATION SCRIPTS
 * Export existing data to Git-compatible YAML format
 * 
 * Usage:
 *   node relay-migration-scripts.mjs export-channels
 *   node relay-migration-scripts.mjs export-votes
 *   node relay-migration-scripts.mjs export-users
 *   node relay-migration-scripts.mjs export-all
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  dataDir: path.join(__dirname, 'data'),
  outputDir: path.join(__dirname, 'relay-git-data'),
  channelsFile: path.join(__dirname, 'data', 'channels', 'channels.json'),
  votesDB: path.join(__dirname, 'data', 'votes'), // Adjust based on your structure
  usersDB: path.join(__dirname, 'data', 'users')
};

/**
 * Convert object to YAML format
 */
function toYAML(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n${toYAML(value, indent + 1)}`;
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'object') {
          yaml += `${spaces}  -\n${toYAML(item, indent + 2)}`;
        } else {
          yaml += `${spaces}  - ${JSON.stringify(item)}\n`;
        }
      });
    } else if (typeof value === 'string') {
      yaml += `${spaces}${key}: "${value}"\n`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }

  return yaml;
}

/**
 * Export channels to Git format
 */
async function exportChannels() {
  console.log('📁 Exporting channels...');

  try {
    // Read existing channels
    const channelsData = await fs.readFile(CONFIG.channelsFile, 'utf-8');
    const channels = JSON.parse(channelsData);

    let exported = 0;

    for (const channel of channels) {
      // Determine channel type directory
      const typeDir = channel.type || 'global';
      const outputPath = path.join(
        CONFIG.outputDir,
        'channels',
        typeDir,
        `${channel.id}.yaml`
      );

      // Transform to Git format
      const gitChannel = {
        id: channel.id,
        name: channel.name,
        type: channel.type || 'global',
        description: channel.description || '',
        created: channel.created || new Date().toISOString(),
        creator: channel.creator || 'system',
        status: channel.status || 'active',
        visibility: channel.visibility || 'public',
        location: channel.location || null,
        vote_counts: {
          total: channel.totalVotes || 0,
          by_region: channel.votesByRegion || {}
        },
        metadata: {
          tags: channel.tags || [],
          category: channel.category || 'general'
        }
      };

      // Write YAML file
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, toYAML(gitChannel));

      exported++;
      console.log(`  ✓ ${channel.id}`);
    }

    console.log(`✅ Exported ${exported} channels\n`);
    return exported;

  } catch (error) {
    console.error('❌ Failed to export channels:', error.message);
    throw error;
  }
}

/**
 * Export candidates for all channels
 */
async function exportCandidates() {
  console.log('🎯 Exporting candidates...');

  try {
    const channelsData = await fs.readFile(CONFIG.channelsFile, 'utf-8');
    const channels = JSON.parse(channelsData);

    let exported = 0;

    for (const channel of channels) {
      if (!channel.candidates || channel.candidates.length === 0) continue;

      for (const candidate of channel.candidates) {
        const outputPath = path.join(
          CONFIG.outputDir,
          'channels',
          channel.id,
          'candidates',
          `${candidate.id}.yaml`
        );

        const gitCandidate = {
          id: candidate.id,
          channel_id: channel.id,
          name: candidate.name,
          description: candidate.description || '',
          created: candidate.created || new Date().toISOString(),
          proposer: candidate.proposer || 'system',
          status: candidate.status || 'active',
          vote_counts: {
            total: candidate.votes || 0,
            by_region: candidate.votesByRegion || {}
          },
          metadata: {
            tags: candidate.tags || [],
            attachments: candidate.attachments || []
          }
        };

        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, toYAML(gitCandidate));

        exported++;
        console.log(`  ✓ ${channel.id}/${candidate.id}`);
      }
    }

    console.log(`✅ Exported ${exported} candidates\n`);
    return exported;

  } catch (error) {
    console.error('❌ Failed to export candidates:', error.message);
    throw error;
  }
}

/**
 * Export votes to Git format
 * Groups votes by date: votes/YYYY/MM/DD/
 */
async function exportVotes() {
  console.log('🗳️  Exporting votes...');

  try {
    // This is a placeholder - adjust based on your actual vote storage
    // You might have votes in database, JSON files, or WebSocket history

    // Example: Read from your vote storage
    const votesPath = path.join(CONFIG.dataDir, 'votes.json');
    
    let votes = [];
    try {
      const votesData = await fs.readFile(votesPath, 'utf-8');
      votes = JSON.parse(votesData);
    } catch {
      console.log('  ℹ️  No votes.json found, skipping...');
      return 0;
    }

    let exported = 0;

    for (const vote of votes) {
      // Parse date for directory structure
      const date = new Date(vote.timestamp || Date.now());
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const outputPath = path.join(
        CONFIG.outputDir,
        'votes',
        String(year),
        month,
        day,
        `${vote.userId}-${vote.channelId}-${vote.voteId}.yaml`
      );

      const gitVote = {
        vote_id: vote.voteId || vote.id,
        user_id: vote.userId,
        channel_id: vote.channelId,
        candidate_id: vote.candidateId,
        timestamp: vote.timestamp,
        location: vote.location || null,
        signature: vote.signature || '',
        proof_of_location: vote.proofOfLocation || '',
        metadata: {
          device_fingerprint: vote.deviceFingerprint || '',
          ip_hash: vote.ipHash || ''
        }
      };

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, toYAML(gitVote));

      exported++;
      
      if (exported % 100 === 0) {
        console.log(`  ... ${exported} votes exported`);
      }
    }

    console.log(`✅ Exported ${exported} votes\n`);
    return exported;

  } catch (error) {
    console.error('❌ Failed to export votes:', error.message);
    throw error;
  }
}

/**
 * Export users to Git format
 */
async function exportUsers() {
  console.log('👤 Exporting users...');

  try {
    // Read users from your storage
    const usersPath = path.join(CONFIG.dataDir, 'users.json');
    
    let users = [];
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8');
      users = JSON.parse(usersData);
    } catch {
      console.log('  ℹ️  No users.json found, skipping...');
      return 0;
    }

    let exported = 0;

    for (const user of users) {
      const outputPath = path.join(
        CONFIG.outputDir,
        'users',
        user.id || user.userId,
        'profile.yaml'
      );

      const gitUser = {
        user_id: user.id || user.userId,
        public_key: user.publicKey || '',
        created: user.created || new Date().toISOString(),
        identity_proofs: user.identityProofs || [],
        verified: user.verified || false,
        reputation_score: user.reputationScore || 0,
        metadata: {
          displayName: user.displayName || '',
          avatar: user.avatar || ''
        }
      };

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, toYAML(gitUser));

      exported++;
      console.log(`  ✓ ${user.id || user.userId}`);
    }

    console.log(`✅ Exported ${exported} users\n`);
    return exported;

  } catch (error) {
    console.error('❌ Failed to export users:', error.message);
    throw error;
  }
}

/**
 * Create relay configuration files
 */
async function createRelayConfig() {
  console.log('⚙️  Creating Relay configuration...');

  // Create .relay directory
  const relayDir = path.join(CONFIG.outputDir, '.relay');
  await fs.mkdir(relayDir, { recursive: true });

  // Create relay.yaml
  const relayConfig = {
    name: "Globe Voting Platform",
    description: "Decentralized globe-based voting system",
    version: "1.0.0",
    client_hooks: {
      render: "/.relay/get.mjs",
      query: "/.relay/query.mjs"
    },
    permissions: {
      public: {
        read: ["channels/*", "stats/*"],
        write: []
      },
      authenticated: {
        read: ["channels/*", "stats/*", "users/{{user_id}}/*"],
        write: ["votes/*", "users/{{user_id}}/*"]
      },
      admin: {
        read: ["*"],
        write: ["channels/*", "users/*", "boundaries/*"]
      }
    }
  };

  await fs.writeFile(
    path.join(relayDir, 'relay.yaml'),
    toYAML(relayConfig)
  );

  console.log('  ✓ Created .relay/relay.yaml');

  // Create placeholder for pre-commit hook
  const preCommitStub = `// .relay/pre-commit.mjs
// Vote validation hook
// See COMPLETE-RELAY-MIGRATION-STRATEGY.md for full implementation

export async function validate(changes) {
  const errors = [];
  
  for (const change of changes) {
    if (change.path.startsWith('votes/')) {
      // TODO: Add validation logic
      // - Verify user signature
      // - Check for duplicate votes
      // - Validate candidate exists
      // - Update vote counts
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
`;

  await fs.writeFile(
    path.join(relayDir, 'pre-commit.mjs'),
    preCommitStub
  );

  console.log('  ✓ Created .relay/pre-commit.mjs (stub)');

  console.log('✅ Relay configuration created\n');
}

/**
 * Generate initial Git repository structure
 */
async function createGitStructure() {
  console.log('📦 Creating Git repository structure...');

  const directories = [
    'channels/global',
    'channels/regional',
    'channels/proximity',
    'votes',
    'users',
    'boundaries/countries',
    'boundaries/states',
    'stats/daily',
    '.relay'
  ];

  for (const dir of directories) {
    const dirPath = path.join(CONFIG.outputDir, dir);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Create .gitkeep to preserve empty directories
    await fs.writeFile(path.join(dirPath, '.gitkeep'), '');
  }

  console.log('✅ Directory structure created\n');
}

/**
 * Create README for the Git repository
 */
async function createReadme() {
  const readme = `# Globe Voting Platform - Git Repository

This repository contains all data for the decentralized globe voting platform.

## Structure

\`\`\`
/
├── channels/          # All voting channels
│   ├── global/       # Global channels
│   ├── regional/     # State/province channels
│   └── proximity/    # Location-based channels
├── votes/            # All votes (organized by date)
│   └── YYYY/MM/DD/  # Votes by date
├── users/            # User profiles
├── boundaries/       # Geographic boundaries
├── stats/            # Daily statistics
└── .relay/           # Relay configuration & hooks
    ├── relay.yaml
    ├── pre-commit.mjs
    ├── query.mjs
    └── get.mjs
\`\`\`

## Usage

### Read Data
\`\`\`bash
# Get a channel
GET /channels/global/climate-action-2025.yaml

# Query channels
QUERY /channels?type=global&status=active

# Get daily stats
GET /stats/daily/2025-12-17.yaml
\`\`\`

### Submit Vote
\`\`\`bash
# Create a vote (creates Git commit)
PUT /votes/2025/12/17/user123-climate-action-12345.yaml
\`\`\`

## Relay Peers

- http://localhost:3000 (local development)
- https://relay-peer-1.example.com (production)
- https://relay-peer-2.example.com (backup)

## Migration

This repository was migrated from a traditional WebSocket/Database architecture.
See COMPLETE-RELAY-MIGRATION-STRATEGY.md for details.

---

**Last Updated:** ${new Date().toISOString()}
`;

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'README.md'),
    readme
  );

  console.log('✅ README.md created\n');
}

/**
 * Main export function
 */
async function exportAll() {
  console.log('🚀 Starting full migration export...\n');

  const startTime = Date.now();

  try {
    // Create directory structure
    await createGitStructure();

    // Export all data
    const channelCount = await exportChannels();
    const candidateCount = await exportCandidates();
    const voteCount = await exportVotes();
    const userCount = await exportUsers();

    // Create config files
    await createRelayConfig();
    await createReadme();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('═'.repeat(50));
    console.log('🎉 MIGRATION EXPORT COMPLETE!');
    console.log('═'.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`  - Channels: ${channelCount}`);
    console.log(`  - Candidates: ${candidateCount}`);
    console.log(`  - Votes: ${voteCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Duration: ${duration}s`);
    console.log(`  - Output: ${CONFIG.outputDir}`);
    console.log('═'.repeat(50));
    console.log('\n📝 Next steps:');
    console.log('  1. Review exported data in:', CONFIG.outputDir);
    console.log('  2. Initialize Git repository:');
    console.log(`     cd ${CONFIG.outputDir}`);
    console.log('     git init');
    console.log('     git add .');
    console.log('     git commit -m "Initial data migration"');
    console.log('  3. Start relay-server and test');
    console.log('  4. Update frontend to use Relay API\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// CLI Interface
const command = process.argv[2];

switch (command) {
  case 'export-channels':
    await exportChannels();
    break;
  case 'export-candidates':
    await exportCandidates();
    break;
  case 'export-votes':
    await exportVotes();
    break;
  case 'export-users':
    await exportUsers();
    break;
  case 'export-all':
    await exportAll();
    break;
  default:
    console.log(`
🔧 Relay Migration Scripts

Usage:
  node relay-migration-scripts.mjs <command>

Commands:
  export-channels     Export channels to Git format
  export-candidates   Export candidates to Git format
  export-votes        Export votes to Git format
  export-users        Export users to Git format
  export-all          Export everything (recommended)

Example:
  node relay-migration-scripts.mjs export-all
    `);
    process.exit(0);
}





