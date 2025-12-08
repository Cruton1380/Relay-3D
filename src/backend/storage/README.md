# 🗄️ Voter Storage System

## Overview

The Relay voter storage system provides a clean abstraction layer for storing and querying voter data at scale. It supports multiple backend implementations (in-memory, PostgreSQL/PostGIS) with a consistent API, enabling seamless migration from development to production.

### Key Features

- **Storage Abstraction**: Swap between in-memory, Redis, and PostgreSQL without changing application code
- **Spatial Indexing**: R-tree (in-memory) or PostGIS (PostgreSQL) for fast bounding box queries
- **Performance-Safe**: Sub-1ms queries for 100k voters in-memory, sub-100ms for millions in PostgreSQL
- **Scalable Architecture**: Designed to handle millions of voters with efficient spatial queries

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (voterStorageAPI.mjs, voterVisualization.mjs, etc.)    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Storage Factory (index.mjs)                 │
│          Selects backend based on STORAGE_TYPE           │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  InMemory    │  │  PostgreSQL  │  │    Redis     │
│   Storage    │  │   Storage    │  │   Storage    │
│              │  │              │  │  (Future)    │
│  • Map       │  │  • PostGIS   │  │              │
│  • R-tree    │  │  • Spatial   │  │              │
│  • Fast      │  │    indexes   │  │              │
│  • ≤100k     │  │  • Millions  │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Storage Backends

### 1. In-Memory Storage (Default)

**Best for**: Development, testing, demos (≤ 100k voters)

**Features**:
- R-tree spatial indexing via `rbush`
- Sub-1ms query latency
- No external dependencies
- Data lost on restart

**Performance**:
- Insert: ~0.1ms per voter
- Bbox query: < 1ms for 100k voters
- Memory: ~100 bytes per voter

**Configuration**:
```bash
# .env
STORAGE_TYPE=in-memory
```

### 2. PostgreSQL Storage (Production)

**Best for**: Production, millions of voters

**Features**:
- PostGIS spatial indexing
- Persistent storage
- ACID transactions
- Advanced spatial queries

**Performance**:
- Insert: ~1-5ms per voter (bulk inserts faster)
- Bbox query: < 100ms for millions of voters
- Disk: ~200 bytes per voter

**Configuration**:
```bash
# .env
STORAGE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=relay_voters
POSTGRES_USER=relay_user
POSTGRES_PASSWORD=your_secure_password
```

**Setup**:
```bash
# 1. Install PostgreSQL with PostGIS
# Ubuntu/Debian:
sudo apt-get install postgresql postgis

# macOS:
brew install postgresql postgis

# 2. Create database
createdb relay_voters

# 3. Run schema migration
psql relay_voters < src/backend/storage/postgres-schema.sql

# 4. Set environment variables
export STORAGE_TYPE=postgres
export POSTGRES_HOST=localhost
export POSTGRES_DB=relay_voters
export POSTGRES_USER=relay_user
export POSTGRES_PASSWORD=your_password

# 5. Restart backend
npm run dev:backend
```

---

## API Reference

### Storage Interface

All storage backends implement the following interface:

#### `async init()`
Initialize the storage backend.

#### `async close()`
Close connections and cleanup resources.

#### `async insertVoters(voters)`
Insert one or more voters.

**Parameters**:
```javascript
voters: Array<{
  user_id: string,
  candidate_id: string,
  channel_id: string,
  privacy_level: string,
  location_lat: number,
  location_lng: number,
  location_city?: string,
  location_province?: string,
  location_country?: string
}>
```

**Returns**: `Promise<void>`

#### `async getVotersByBBox(bbox, options)`
Query voters within a bounding box.

**Parameters**:
```javascript
bbox: {
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
}

options: {
  limit?: number,        // Max results (default: 10000)
  offset?: number,       // Pagination offset (default: 0)
  candidateId?: string,  // Filter by candidate
  channelId?: string,    // Filter by channel
  privacyLevel?: string  // Filter by privacy level
}
```

**Returns**: `Promise<Array<Voter>>`

#### `async getVoterById(userId)`
Get a single voter by user ID.

**Returns**: `Promise<Voter | null>`

#### `async count(candidateId?)`
Count total voters, optionally filtered by candidate.

**Returns**: `Promise<number>`

#### `async getStats()`
Get storage statistics.

**Returns**:
```javascript
{
  storageType: string,
  totalVoters: number,
  memoryUsageMB?: number,
  diskUsageMB?: number
}
```

#### `async clearAllVoters()`
⚠️ **WARNING**: Delete all voter data. Use with caution!

---

## Usage Examples

### Basic Query

```javascript
import { getStorage } from './storage/index.mjs';

const storage = await getStorage();

// Query voters in a bounding box
const voters = await storage.getVotersByBBox({
  minLat: 40.0,
  minLng: -75.0,
  maxLat: 41.0,
  maxLng: -74.0
}, {
  limit: 1000,
  candidateId: 'candidate-123'
});

console.log(`Found ${voters.length} voters`);
```

### Bulk Insert

```javascript
const voters = [
  {
    user_id: 'user-1',
    candidate_id: 'candidate-123',
    channel_id: 'channel-456',
    privacy_level: 'gps',
    location_lat: 40.7128,
    location_lng: -74.0060,
    location_city: 'New York',
    location_province: 'NY',
    location_country: 'USA'
  },
  // ... more voters
];

await storage.insertVoters(voters);
```

### Get Statistics

```javascript
const stats = await storage.getStats();
console.log(`Storage: ${stats.storageType}`);
console.log(`Total voters: ${stats.totalVoters}`);
console.log(`Memory usage: ${stats.memoryUsageMB} MB`);
```

---

## Migration Guide

### From File-Based to Storage System

If you have existing voter data in JSON files:

```bash
# Run the migration script
node scripts/migrate-voters-to-storage.mjs
```

This will:
1. Read existing voter data from `userLocationService` and `userPreferencesService`
2. Match voters to their votes in `votingEngine`
3. Insert them into the new storage system

### From In-Memory to PostgreSQL

1. **Setup PostgreSQL** (see PostgreSQL Storage section above)

2. **Export existing data**:
```bash
# Add export functionality to InMemoryStorage
const storage = await getStorage();
const allVoters = await storage.getVotersByBBox({
  minLat: -90, minLng: -180,
  maxLat: 90, maxLng: 180
}, { limit: 1000000 });

// Save to file
fs.writeFileSync('voters-backup.json', JSON.stringify(allVoters, null, 2));
```

3. **Switch to PostgreSQL**:
```bash
export STORAGE_TYPE=postgres
npm run dev:backend
```

4. **Import data**:
```bash
node scripts/import-voters-from-backup.mjs voters-backup.json
```

---

## Performance Tuning

### In-Memory Storage

- **Max Voters**: 100,000 (recommended)
- **Memory**: ~10 MB for 100k voters
- **Tuning**: Adjust R-tree `maxEntries` in `InMemoryStorage.mjs`

### PostgreSQL Storage

- **Indexes**: Ensure spatial index exists:
```sql
CREATE INDEX IF NOT EXISTS idx_voters_location_geom 
ON voters USING GIST (location_geom);
```

- **Query Optimization**:
```sql
-- Analyze table for query planner
ANALYZE voters;

-- Check index usage
EXPLAIN ANALYZE 
SELECT * FROM voters 
WHERE ST_Intersects(
  location_geom, 
  ST_MakeEnvelope(-75, 40, -74, 41, 4326)
);
```

- **Bulk Inserts**: Use transactions for better performance:
```javascript
// PostgreSQL automatically batches inserts
await storage.insertVoters(largeArrayOfVoters);
```

---

## Troubleshooting

### "Storage not initialized"

**Cause**: Storage backend not initialized before use.

**Fix**: Ensure `getStorage()` is called during server startup:
```javascript
// src/backend/server.mjs
import { getStorage } from './storage/index.mjs';

async function startServer() {
  await getStorage(); // Initialize storage
  // ... rest of server startup
}
```

### "Bbox query returns no results"

**Cause**: Bounding box coordinates may be inverted or out of range.

**Fix**: Ensure bbox format is correct:
```javascript
{
  minLat: -90 to 90,   // South to North
  minLng: -180 to 180, // West to East
  maxLat: -90 to 90,
  maxLng: -180 to 180
}
```

### "PostgreSQL connection failed"

**Cause**: Database not running or incorrect credentials.

**Fix**:
```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql -h localhost -U relay_user -d relay_voters

# Check environment variables
echo $POSTGRES_HOST
echo $POSTGRES_DB
```

---

## Testing

### Run Storage Tests

```bash
# Test in-memory storage
npm test -- storage/InMemoryStorage.test.mjs

# Test PostgreSQL storage (requires running DB)
npm test -- storage/PostgresStorage.test.mjs
```

### Benchmark Performance

```bash
# Run performance benchmarks
node scripts/benchmark-voter-system.mjs
```

Expected results:
- **In-Memory**: < 1ms queries for 100k voters
- **PostgreSQL**: < 100ms queries for 1M voters

---

## API Endpoints

The storage system is exposed via REST API:

### `GET /api/voters/stats`
Get storage statistics.

### `GET /api/voters/bbox`
Query voters by bounding box.

**Query Parameters**:
- `minLat`, `minLng`, `maxLat`, `maxLng` (required)
- `limit` (optional, default: 10000)
- `offset` (optional, default: 0)
- `candidateId` (optional)
- `channelId` (optional)

### `GET /api/voters/:userId`
Get a single voter by ID.

### `POST /api/voters`
Create a single voter.

### `POST /api/voters/bulk`
Create multiple voters.

### `DELETE /api/voters/:userId`
Delete a voter.

---

## Future Enhancements

- **Redis Storage**: Caching layer for hot data
- **Sharding**: Distribute data across multiple PostgreSQL instances
- **Replication**: Read replicas for high-traffic scenarios
- **Time-series**: Track voter location changes over time
- **H3 Clustering**: Pre-computed hexagonal clusters for ultra-fast rendering

---

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [API reference](#api-reference)
3. Run the [benchmark script](#testing) to validate performance
4. Check server logs for detailed error messages

---

## License

Part of the Relay Platform. See main project LICENSE.

