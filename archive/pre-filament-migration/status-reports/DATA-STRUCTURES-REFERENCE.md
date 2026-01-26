# 📊 RELAY DATA STRUCTURES & TABLES REFERENCE

**Date:** October 6, 2025  
**Purpose:** Complete reference of all data structures, storage formats, and fields

---

## Table of Contents
1. [Storage Overview](#storage-overview)
2. [Users](#users)
3. [Channels](#channels)
4. [Votes](#votes)
5. [Blockchain](#blockchain)
6. [Location Data](#location-data)
7. [SQL Schema (Future Production)](#sql-schema)

---

## Storage Overview

### Current Implementation
- **Format:** JSON files + JSONL (blockchain)
- **Location:** `data/` directory
- **In-Memory:** Map-based structures for performance

### Future Production (PostgreSQL schema exists at `config/schema.sql`)

---

## 1. USERS

### Storage Location
- **File:** `data/users/users.json`
- **Format:** JSON object (Map serialized)
- **In-Memory:** `Map<userId, userData>`

### User Object Structure
```javascript
{
  userId: "user_abc123",           // Unique user ID
  username: "john_doe",             // Username
  email: "john@example.com",        // Email (optional)
  region: "usa-california-sf",      // Current region
  trustLevel: "verified",           // Trust level
  trustScore: 85,                   // Trust score (0-100)
  deviceBindingId: "device_xyz",    // Device binding UUID
  createdAt: "2025-10-01T12:00:00Z",
  lastLogin: "2025-10-06T10:00:00Z",
  isActive: true
}
```

### User Preferences (Planned for Phase 1)
**File:** `data/users/preferences.json`
```javascript
{
  userId: "user_abc123",
  privacyLevel: "province",         // 'gps' | 'city' | 'province' | 'anonymous'
  locationSharing: true,
  notificationPrefs: {
    voteReminders: true,
    channelUpdates: false
  }
}
```

### User Invites
**File:** `data/users/invites.json`
```javascript
{
  inviteCode: "INV_abc123",
  createdBy: "user_xyz",
  createdAt: "2025-10-01T12:00:00Z",
  expiresAt: "2025-11-01T12:00:00Z",
  usedBy: null,                     // null or userId
  usedAt: null
}
```

---

## 2. CHANNELS

### Storage Location
- **File:** `data/channels/channels.json` (legacy path, moved to `data/channels/`)
- **Format:** JSON object
- **In-Memory:** Map-based in channel-service

### Channel Object Structure
```javascript
{
  channelId: "created-1759723847650-owunzuicf",
  name: "Climate Action SF",
  type: "regional",                 // 'global' | 'regional' | 'local' | 'proximity'
  category: "environment",          // Channel category
  subtype: "climate",               // Subtype within category
  description: "Climate change discussion and voting",
  
  // Geographic info
  country: "US",
  countryName: "United States",
  province: "California",
  city: "San Francisco",
  location: {
    lat: 37.7749,
    lng: -122.4194,
    latitude: 37.7749,
    longitude: -122.4194,
    height: 0.1                     // Elevation
  },
  coordinates: [-122.4194, 37.7749], // [lng, lat] for GeoJSON
  
  // Privacy & encryption
  isPrivate: false,
  encryptionEnabled: false,
  
  // Metadata
  ownerId: "user_abc123",
  createdAt: "2025-10-06T04:10:47.650Z",
  candidateCount: 55,
  totalVotes: 15420,
  isTestData: false,
  
  // Members (for private channels)
  members: ["user_abc123", "user_def456"]
}
```

### Candidate Object Structure
```javascript
{
  candidateId: "candidate-1759723847623-0-7k9c1plrq",
  channelId: "created-1759723847650-owunzuicf",
  name: "John Doe",
  description: "Climate activist candidate in SF",
  
  // Location
  location: {
    lat: 37.7749,
    lng: -122.4194,
    latitude: 37.7749,
    longitude: -122.4194
  },
  
  // Geographic info
  country: "US",
  countryName: "United States",
  region: "North America",
  continent: "North America",
  province: "California",
  city: "San Francisco",
  
  // Vote tracking
  votes: 8750,
  
  // Metadata
  createdAt: "2025-10-06T04:10:47.614Z",
  isTestData: false
}
```

### Boundary Channels (Special)
**File:** `data/channels/boundary-channels.json`
```javascript
{
  channelId: "boundary-edit-global",
  name: "Global Boundary Proposals",
  type: "boundary-editor",
  proposals: [
    {
      proposalId: "prop_abc123",
      boundaryId: "country-US-CA",
      proposedBy: "user_xyz",
      changes: { /* GeoJSON diff */ },
      votes: { for: 150, against: 20 },
      status: "active"
    }
  ]
}
```

---

## 3. VOTES

### authoritative Vote Ledger (In-Memory)
**Structure:** `Map<userId, Map<topicId, voteData>>`

### Vote Data Object (Current)
```javascript
{
  voteId: "vote_abc123",            // Transaction ID
  userId: "user_abc123",
  topicId: "created-1759723847650-owunzuicf",  // Channel/topic ID
  candidateId: "candidate-xyz",
  timestamp: 1759724119817,
  reliability: 1.0,                 // Vote reliability (0-1)
  voteType: "FOR",                  // Vote type
  region: "usa-california-sf",
  
  // Blockchain tracking
  transactionHash: "0x123abc...",
  blockNumber: 42,
  status: "confirmed",              // 'pending' | 'confirmed'
  
  // NEW in Phase 1: Location data
  location: null                    // Will be populated in Phase 1
}
```

### Vote Data Object (Phase 1 - With Location)
```javascript
{
  voteId: "vote_abc123",
  userId: "user_abc123",
  topicId: "created-1759723847650-owunzuicf",
  candidateId: "candidate-xyz",
  timestamp: 1759724119817,
  reliability: 1.0,
  voteType: "FOR",
  region: "usa-california-sf",
  
  // Blockchain tracking
  transactionHash: "0x123abc...",
  blockNumber: 42,
  status: "confirmed",
  
  // Phase 1: Location data
  location: {
    // Raw coordinates (encrypted)
    lat: 37.7749,
    lng: -122.4194,
    
    // Administrative levels
    country: "United States",
    countryCode: "US",
    province: "California",
    provinceCode: "US-CA",
    city: "San Francisco",
    cityCode: "SF",
    
    // Privacy settings
    privacyLevel: "province",       // User's choice
    
    // Public location (respects privacy)
    publicLocation: {
      type: "province",             // 'gps' | 'city' | 'province' | 'anonymous'
      displayName: "California",
      coordinates: [37.5, -120.0]   // Province center (if province privacy)
    }
  }
}
```

### Session Votes (Demo/Test Data)
**File:** `data/voting/session-votes.json`
```javascript
{
  voteCounts: {
    "usa-california-san-francisco": {
      totalVotes: 15420,
      candidates: {
        "candidate-sf-001": 8750,
        "candidate-sf-002": 6670
      }
    }
  },
  timestamp: 1759728091605,
  sessionId: 12916
}
```

---

## 4. BLOCKCHAIN

### Chain Storage
**File:** `data/blockchain/chain.jsonl`
**Format:** JSON Lines (one block per line)

### Block Structure
```javascript
{
  index: 0,                         // Block number
  timestamp: "2025-10-06T04:10:47.712Z",
  transactions: [/* array of transactions */],
  previousHash: "0abc123...",       // Hash of previous block
  nonce: 4,                         // Proof-of-work nonce
  hash: "01e3be5..."                // This block's hash
}
```

### Transaction Structure (Generic)
```javascript
{
  id: "a2b8bbba-125a-4772-9161-44563c0504e3",  // Transaction UUID
  type: "channel_create",           // Transaction type
  data: {/* type-specific data */},
  timestamp: 1759723847654,
  nonce: "ac20d8dd-08df-4587-94fa-874c0e86bfd9"  // Replay protection
}
```

### Transaction Types
1. **channel_create** - Channel created
2. **candidate_create** - Candidate added to channel
3. **vote** - Vote cast
4. **all_channels_cleared** - Admin operation
5. **TEST_TRANSACTION** - Test data
6. **PERF_TEST** - Performance test

### Vote Transaction (VoteTransaction class)
```javascript
{
  id: "vote_abc123",
  timestamp: 1759724119817,
  voteData: {
    type: "vote",
    publicKey: "demo-user-1",
    topic: "created-1759723847650-owunzuicf",
    voteType: "candidate",
    choice: "candidate-xyz",
    reliability: 1.0,
    region: "usa-california-sf",
    metadata: {
      processedThroughProduction: true,
      signatureScheme: "ecdsa",
      nonce: "1s4h40z5g91"
    }
  },
  
  // Signature data
  signature: "0x123abc...",
  publicKey: "0x456def...",
  signatureAlgorithm: "ECDSA-P256",  // Algorithm used
  
  // Future Phase 2: Hashgraph integration
  hashgraphEventId: null,           // Placeholder
  voteOrderId: null,                // Global ordering
  
  // Blockchain confirmation
  transactionHash: "0x789ghi...",
  blockNumber: 42,
  blockHash: "0xabcdef...",
  
  // Privacy
  privacyLevel: "province"
}
```

### Nonce Storage
**File:** `data/blockchain/nonces.jsonl`
**Format:** JSON Lines (one nonce per line)
```javascript
{
  value: "ac20d8dd-08df-4587-94fa-874c0e86bfd9",
  timestamp: 1759723847654
}
```

---

## 5. LOCATION DATA

### Current State
- **No location tracking** - Will be added in Phase 1

### Phase 1: Location Fields

#### Raw Coordinates (Stored Encrypted)
```javascript
{
  lat: 37.7749,                     // Latitude (-90 to 90)
  lng: -122.4194                    // Longitude (-180 to 180)
}
```

#### Administrative Levels (Reverse Geocoded)
```javascript
{
  country: "United States",
  countryCode: "US",                // ISO 3166-1 alpha-2
  province: "California",
  provinceCode: "US-CA",            // ISO 3166-2
  city: "San Francisco",
  cityCode: "SF"                    // City code (varies)
}
```

#### Privacy Levels
1. **gps** - Exact coordinates visible
2. **city** - Only city center visible
3. **province** - Only province center visible
4. **anonymous** - No location visible

#### Public Location (Privacy-Aware)
```javascript
{
  type: "province",                 // Privacy level applied
  displayName: "California",
  coordinates: [37.5, -120.0]       // Center of province (if province privacy)
}
```

### Boundary Data
**Files:** `data/boundaries/`, `data/custom-boundaries/`
- **countries-10m.geojson** - Country boundaries
- **macro_regions.geojson** - Macro regions
- **custom boundaries** - User-created boundaries

---

## 6. SQL SCHEMA (Future Production)

**File:** `config/schema.sql`

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    trust_level VARCHAR(50) DEFAULT 'probationary',
    trust_score INTEGER DEFAULT 0,
    device_binding_id UUID UNIQUE,
    location_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    verification_due TIMESTAMP WITH TIME ZONE
);
```

### Password Dance Enrollments
```sql
CREATE TABLE password_dance_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phrase_hash VARCHAR(255) NOT NULL,
    gesture_type VARCHAR(50) NOT NULL,
    audio_vector_encrypted BYTEA NOT NULL,
    gesture_vector_encrypted BYTEA NOT NULL,
    combined_vector_hash VARCHAR(255) NOT NULL,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    security_level VARCHAR(20) DEFAULT 'standard'
);
```

### Trust Activities
```sql
CREATE TABLE trust_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    points_awarded INTEGER NOT NULL,
    details JSONB,
    location_context VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES users(id)
);
```

### Verification Attempts
```sql
CREATE TABLE verification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,  -- 'password_dance', 'biometric', 'hotspot'
    challenge_data JSONB,
    result BOOLEAN NOT NULL,
    confidence_score DECIMAL(5,3),
    risk_factors JSONB,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Community Hotspots
```sql
CREATE TABLE community_hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    radius_meters INTEGER DEFAULT 50,
    operator_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Hotspot Check-ins
```sql
CREATE TABLE hotspot_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotspot_id UUID NOT NULL REFERENCES community_hotspots(id) ON DELETE CASCADE,
    checkin_method VARCHAR(50) NOT NULL,  -- 'bluetooth', 'qr', 'nfc'
    dwell_time_seconds INTEGER,
    verification_completed BOOLEAN DEFAULT false,
    trust_points_awarded INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. INDEXES & RELATIONSHIPS

### In-Memory Indexes (Current)
```javascript
// User Manager
users: Map<userId, userData>
usersByRegion: Map<regionId, Set<userId>>

// Voting Engine
authoritativeVoteLedger: Map<userId, Map<topicId, voteData>>

// Channel Service
channels: Map<channelId, channelData>
channelsByType: Map<type, Set<channelId>>
channelsByLocation: Map<locationKey, Set<channelId>>

// Blockchain Service
nonces: Set<nonceValue>  // For replay protection
chain: Array<Block>
```

### Relationships
```
User (1) ----< (N) Votes
User (1) ----< (N) Channels (as owner)
Channel (1) ----< (N) Candidates
Channel (1) ----< (N) Votes (through topic)
Candidate (1) ----< (N) Votes
Block (1) ----< (N) Transactions
Transaction (1) ---- (1) Vote
```

---

## 8. DATA FLOW

### Vote Submission Flow
```
1. Frontend → Vote with location
2. routes/vote.mjs → Accept location data
3. votingEngine.mjs → Store in authoritativeVoteLedger
4. VoteTransaction → Sanitize with privacy filter
5. blockchain-service → Record transaction
6. blockchainSyncService → Update vote status
7. authoritativeVoteLedger → Update with blockNumber
```

### Location Privacy Flow
```
1. User sets privacy level → userPreferencesService
2. Vote submitted with GPS coords → votingEngine
3. Reverse geocode → boundaryAPI
4. Apply privacy filter → privacyFilter.mjs
5. Store raw location (encrypted) → authoritativeVoteLedger
6. Store public location (sanitized) → blockchain
7. Display only public location → frontend
```

---

## 9. PHASE 1 NEW FIELDS

### Vote Location Object (NEW)
```javascript
location: {
  // Raw (encrypted in production)
  lat: 37.7749,
  lng: -122.4194,
  
  // Administrative (from reverse geocoding)
  country: "United States",
  countryCode: "US",
  province: "California",
  provinceCode: "US-CA",
  city: "San Francisco",
  cityCode: "SF",
  
  // Privacy (from user preferences)
  privacyLevel: "province",
  
  // Public (sanitized for blockchain/display)
  publicLocation: {
    type: "province",
    displayName: "California",
    coordinates: [37.5, -120.0]
  }
}
```

### User Preferences (NEW)
```javascript
{
  userId: "user_abc123",
  privacyLevel: "province",         // DEFAULT
  locationSharing: true,
  coordinatePrecisionLevel: "10km"  // '1km' | '10km' | '100km' | 'province'
}
```

---

## 10. FILE LOCATIONS SUMMARY

```
data/
├── users/
│   ├── users.json                  ✅ Users
│   ├── invites.json                ✅ Invite codes
│   └── preferences.json            ⏳ Phase 1 (NEW)
│
├── channels/
│   ├── channels.json               ✅ Channels (legacy path)
│   └── boundary-channels.json      ✅ Boundary proposals
│
├── voting/
│   └── session-votes.json          ✅ Demo/test vote counts
│
├── blockchain/
│   ├── chain.jsonl                 ✅ Blockchain blocks
│   └── nonces.jsonl                ✅ Nonce replay protection
│
├── boundaries/
│   ├── countries-10m.geojson       ✅ Country boundaries
│   └── macro_regions.geojson       ✅ Macro regions
│
└── custom-boundaries/              ✅ User-created boundaries
```

---

## Conclusion

This document provides a complete reference of all data structures in Relay. **Phase 1 will add location tracking** to the vote data model, introducing new fields while maintaining backward compatibility.

**Key Takeaways:**
- Current storage: JSON files + JSONL blockchain
- Future migration: PostgreSQL schema ready at `config/schema.sql`
- Phase 1 adds: Location fields to votes with privacy controls
- All data is currently in-memory with periodic file persistence

---

**Last Updated:** October 6, 2025  
**Next Update:** After Phase 1 completion (location tracking)
