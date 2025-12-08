# 🗳️ Mock Voter System Guide

## Overview

This document explains how the **production-ready** mock voter system works in Relay. Mock voters are stored in the **actual voting system infrastructure** that will be used in production.

---

## 🏗️ Architecture

### Three Core Services

Mock voters are stored across three production services:

1. **Voting Ledger** (`votingEngine.mjs`)
   - Stores all votes in `authoritativeVoteLedger`
   - Format: `Map<userId, Map<topicId, vote>>`
   - Single source of truth for all votes

2. **Location Service** (`userLocationService.mjs`)
   - Stores user location data
   - Format: `{ country, countryCode, province, provinceCode, city, cityCode, lat?, lng? }`
   - Uses `setMockUserLocation()` for test data

3. **Preferences Service** (`userPreferencesService.mjs`)
   - Stores user data granularity preference
   - Options: `'gps'`, `'city'`, `'province'`, `'country'`
   - Uses `setUserPrivacyLevel(userId, level)`

---

## 📊 Data Granularity System

### What Each Level Means

| Level | User Provides | System Has Access To |
|-------|--------------|---------------------|
| **GPS** | Exact coordinates | GPS + City + Province + Country |
| **City** | City name only | City + Province + Country (NO GPS) |
| **Province** | Province only | Province + Country (NO GPS, NO City) |
| **Country** | Country only | Country (NO GPS, NO City, NO Province) |

### Default Distribution
- 40% GPS
- 30% City  
- 20% Province
- 10% Country

---

## 🔄 Loading Mock Voters

### Step 1: Start Backend
```bash
npm run dev:backend
```

Wait for: `✅ Server ready`

### Step 2: Load Mock Voters
```bash
npm run load:mock-voters
```

This script:
1. Fetches all channels from backend
2. For each candidate, generates 100 mock voters
3. Stores votes in `authoritativeVoteLedger`
4. Stores locations in `userLocationService`
5. Stores preferences in `userPreferencesService`

---

## 🎨 Visualization Flow

### When User Hovers Over Candidate:

```
User hovers → GlobalChannelRenderer.jsx
              ↓
        loadVotersForCandidate(candidate, channel, level)
              ↓
        GET /api/visualization/voters/:topicId/candidate/:candidateId?level=province
              ↓
        voterVisualization.mjs → getUsersWithVotesForCandidate(topicId, candidateId)
              ↓
        votingEngine.mjs → Query authoritativeVoteLedger
              ↓
        For each voter:
          - getUserLocation(userId) → Get location
          - getUserPrivacyLevel(userId) → Get data granularity
              ↓
        clusterVotersByLevel(voters, level)
              ↓
        Return { visible: [...], hidden: [...] }
              ↓
        renderVotersOnGlobe()
              ↓
        ✅ Green towers (visible) + Gray towers (hidden)
```

---

## 🎯 Clustering Logic

### Visible vs Hidden Towers

**Visible Towers** (Green):
- Voters who provided data at or below the selected level
- Example: At "Province" level, show GPS/City/Province voters

**Hidden Towers** (Gray):
- Voters who provided data above the selected level  
- Example: At "Province" level, "Country-only" voters appear as gray tower at country center
- Labeled: "🔒 X hidden"

### Clustering Keys

Clusters are formed by administrative boundaries:

- **GPS Level**: Cluster by `city` + `provinceCode` + `countryCode`
- **City Level**: Cluster by `city` + `provinceCode` + `countryCode`
- **Province Level**: Cluster by `provinceCode` + `countryCode`
- **Country Level**: Cluster by `countryCode`

---

## 🚀 Production Transition

When transitioning to real users:

### ✅ Keep (Production-Ready)
- `authoritativeVoteLedger` structure
- `userLocationService` structure  
- `userPreferencesService` structure
- `clusterVotersByLevel()` algorithm
- Visualization rendering logic

### ❌ Remove (Mock Only)
- `scripts/load-mock-voters.mjs`
- `setMockUserLocation()` (use `updateUserLocation()` instead)
- Mock voter generation logic

### 🔄 Replace
Real users will:
1. Register accounts (authentication)
2. Set location via GPS or manual entry → `updateUserLocation()`
3. Set privacy preference via settings → `setUserPrivacyLevel()`
4. Cast votes → `processVote()` with signature/publicKey for blockchain

---

## 🧪 Testing the System

### Quick Test
1. Start backend: `npm run dev:backend`
2. Load mock voters: `npm run load:mock-voters`
3. Start frontend: `npm run dev:frontend`
4. Navigate to any channel
5. Hover over a candidate
6. **Expected**: See green towers (visible voters) and gray towers (hidden voters)

### Verify Data
Check console logs:
- `🗳️ Loading voters for candidate: X at level: province`
- `🗳️ Loaded X voters: Y visible, Z hidden`
- `🗳️ Successfully rendered X visible + Y hidden voter clusters`

---

## 📝 Key Differences from Old System

| Old System (❌) | New System (✅) |
|----------------|----------------|
| Demo voters in JSON file | Voters in voting ledger |
| Separate clustering logic | Production clustering |
| Bypass voting system | Use actual voting API |
| Hard to transition | Production-ready |
| Fake data structure | Real data structure |

---

## 🔍 Debugging

### No Voters Showing?
1. Check backend is running: `http://localhost:3002/health`
2. Check mock voters loaded: Look for script success message
3. Check browser console: Look for `🗳️` logs
4. Check backend logs: Look for `voterVisualization` entries

### Wrong Clusters?
- Verify `level` parameter in API call
- Check `dataGranularity` distribution in mock data
- Verify clustering algorithm in `voterVisualization.mjs`

### Performance Issues?
- Limit mock voters per candidate (default: 100)
- Ensure centroid cache is working
- Check for repeated API calls

---

## 📚 Related Files

- `src/backend/voting/votingEngine.mjs` - Voting ledger
- `src/backend/services/userLocationService.mjs` - Location storage
- `src/backend/services/userPreferencesService.mjs` - Privacy preferences
- `src/backend/routes/voterVisualization.mjs` - Clustering API
- `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx` - Visualization
- `scripts/load-mock-voters.mjs` - Mock data loader
- `DATA-GRANULARITY-PRIVACY-SYSTEM.md` - Privacy system design

---

## 🎉 Summary

The mock voter system uses the **exact same infrastructure** as production users will use. This ensures:
- ✅ No migration work when adding real users
- ✅ Testing matches production behavior
- ✅ All voting logic is properly tested
- ✅ Smooth transition path to launch

**The only difference**: Mock voters use `setMockUserLocation()` instead of GPS verification.



