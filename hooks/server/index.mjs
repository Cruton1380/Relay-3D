// Relay Repository Indexing Hook (Sandboxed)
// This script is triggered by the server's JIT indexing logic or manually.
// It scans for meta.yaml files and updates the branch-specific index.db.

const { listChanged, readFromTree, upsertIndex, env } = Relay.utils;

async function main() {
    const branch = env('BRANCH', 'main');
    const changes = listChanged();
    
    console.log(`[Index] Scanning ${changes.length} changes for branch ${branch}...`);
    
    upsertIndex(changes, (p) => readFromTree(p), branch);
    
    console.log(`[Index] Successfully updated index for branch ${branch}.`);
}

main().catch(err => {
    console.error('[Index] Error:', err.message);
    process.exit(1);
});
