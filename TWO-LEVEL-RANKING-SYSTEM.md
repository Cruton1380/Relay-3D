# Two-Level Hierarchical Ranking System ✅

**Date**: 2026-01-27  
**Commit**: `6d2fce6`  
**Status**: Implemented and ready for testing

---

## 🎯 RANKING MODEL (Canonical)

### **LEVEL 1: Channels (Top-to-Bottom)**
**Ranked by**: **Total vote count** (sum across ALL candidates in that channel)

- Higher total votes = Higher channel rank
- Channel with most aggregate votes appears first

### **LEVEL 2: Candidates (Left-to-Right)**
**Ranked by**: **Individual vote count** WITHIN each channel

- Candidates ONLY compared within same channel
- Highest votes = Rank 1 (leftmost position)
- Each channel has its own candidate ranking (independent)

---

## 📊 HIERARCHY EXAMPLE

```
🏆 Channel "coffee-shop__seattle"
   Total votes: 100 (sum of all candidates)
   Channel rank: 1 (highest globally)
   
   Candidates (left-to-right):
   1. "Bean There"    (35 votes, rank 1 within channel)
   2. "Starbucks"     (28 votes, rank 2)
   3. "Cafe Vita"     (37 votes, rank 3)

🥈 Channel "pizza-place__seattle"
   Total votes: 80
   Channel rank: 2
   
   Candidates (left-to-right):
   1. "Pizza Hut"     (45 votes, rank 1 within channel)
   2. "Dominos"       (35 votes, rank 2)

🥉 Channel "bookstore__seattle"
   Total votes: 60
   Channel rank: 3
   
   Candidates (left-to-right):
   1. "Elliott Bay"   (40 votes, rank 1 within channel)
   2. "Barnes"        (20 votes, rank 2)
```

---

## 🔌 NEW API ENDPOINT

### **GET /relay/query/channel_rankings**

**Purpose**: Get all channels ranked by total votes, with candidates per channel

**Query Parameters**:
```
?repo=<repo_id>
&branch=<branch_id>     (optional, default: main)
&search=<search_text>   (optional, filters channel names)
```

**Example Request**:
```bash
curl "http://localhost:3002/relay/query/channel_rankings?repo=seattle-voting&branch=main"
```

**Response Structure**:
```json
{
  "repo_id": "seattle-voting",
  "branch_id": "main",
  "scope": "repo",
  "scope_step": 42,
  "search_query": null,
  "channels": [
    {
      "channel_id": "coffee-shop__seattle",
      "total_votes": 100,              // ✅ Sum across ALL candidates
      "channel_rank": 1,                // ✅ Ranked by total_votes (highest = 1)
      "unique_voters": 42,              // ✅ Filament count for channel
      "candidate_count": 3,
      "candidates": [
        {
          "candidate_id": "bean-there",
          "filament_count": 35,         // ✅ Unique voters for THIS candidate
          "votes_total": 35,
          "rank": 1                      // ✅ Within channel (left-to-right)
        },
        {
          "candidate_id": "starbucks",
          "filament_count": 28,
          "votes_total": 28,
          "rank": 2
        },
        {
          "candidate_id": "cafe-vita",
          "filament_count": 37,
          "votes_total": 37,
          "rank": 3
        }
      ]
    },
    {
      "channel_id": "pizza-place__seattle",
      "total_votes": 80,
      "channel_rank": 2,
      "unique_voters": 35,
      "candidate_count": 2,
      "candidates": [
        {
          "candidate_id": "pizza-hut",
          "filament_count": 45,
          "votes_total": 45,
          "rank": 1
        },
        {
          "candidate_id": "dominos",
          "filament_count": 35,
          "votes_total": 35,
          "rank": 2
        }
      ]
    }
  ],
  "metrics": {
    "total_channels": 15,
    "total_votes_across_all": 1250,
    "total_unique_voters": 320
  }
}
```

---

## 🔍 SEARCH FILTERING

### **No Search Query** (default)
```bash
GET /relay/query/channel_rankings?repo=seattle-voting
```
**Returns**: ALL channels, ranked by total votes

---

### **With Search Query**
```bash
GET /relay/query/channel_rankings?repo=seattle-voting&search=coffee
```
**Returns**: ONLY channels matching "coffee" (case-insensitive)
- `coffee-shop__seattle` ✅ Match
- `coffee-roasters__seattle` ✅ Match
- `pizza-place__seattle` ❌ No match (filtered out)

**Channels still ranked by total votes** (among matching channels)

---

## 🆚 COMPARISON: Old vs New Endpoints

### **OLD: /voting_rankings** (Single Channel)
```bash
GET /relay/query/voting_rankings?repo=seattle-voting&channel_id=coffee-shop__seattle
```

**Returns**: Candidates for ONE specific channel
```json
{
  "channel_id": "coffee-shop__seattle",
  "candidates": [
    { "candidate_id": "bean-there", "votes_total": 35, "rank": 1 },
    { "candidate_id": "starbucks", "votes_total": 28, "rank": 2 }
  ]
}
```

**Use case**: Viewing a specific channel's candidates

---

### **NEW: /channel_rankings** (Hierarchical)
```bash
GET /relay/query/channel_rankings?repo=seattle-voting
```

**Returns**: ALL channels ranked, each with their candidates
```json
{
  "channels": [
    {
      "channel_id": "coffee-shop__seattle",
      "total_votes": 100,
      "channel_rank": 1,
      "candidates": [...]
    },
    {
      "channel_id": "pizza-place__seattle",
      "total_votes": 80,
      "channel_rank": 2,
      "candidates": [...]
    }
  ]
}
```

**Use case**: Globe view showing ALL channels ranked

---

## 🎨 GLOBE RENDERING

### **Channel Height (Radial)**
```javascript
height = channel.total_votes  // Higher total = taller on globe
```

### **Candidate Position (Within Channel)**
```javascript
// Candidates arranged left-to-right (or circular fan)
candidates.sort((a, b) => a.rank - b.rank)  // Rank 1 = leftmost
```

### **Thickness/Fill**
```javascript
thickness = channel.unique_voters      // Filament count (cardinality)
fill = channel.total_votes / max_votes  // Magnitude visualization
```

---

## 🧪 TESTING THE TWO-LEVEL SYSTEM

### **Test 1: Basic Hierarchy**

**Setup**:
```bash
# Vote in coffee-shop channel
POST /api/vote { publicKey: "alice", topic: "coffee-shop__seattle", choice: "bean-there" }
POST /api/vote { publicKey: "bob", topic: "coffee-shop__seattle", choice: "bean-there" }
POST /api/vote { publicKey: "charlie", topic: "coffee-shop__seattle", choice: "starbucks" }

# Vote in pizza channel
POST /api/vote { publicKey: "diana", topic: "pizza-place__seattle", choice: "pizza-hut" }
```

**Query**:
```bash
GET /relay/query/channel_rankings?repo=seattle-voting
```

**Expected**:
```json
{
  "channels": [
    {
      "channel_id": "coffee-shop__seattle",
      "total_votes": 3,           // alice + bob + charlie
      "channel_rank": 1,          // Higher total votes
      "candidates": [
        { "candidate_id": "bean-there", "votes_total": 2, "rank": 1 },
        { "candidate_id": "starbucks", "votes_total": 1, "rank": 2 }
      ]
    },
    {
      "channel_id": "pizza-place__seattle",
      "total_votes": 1,           // Only diana
      "channel_rank": 2,          // Lower total votes
      "candidates": [
        { "candidate_id": "pizza-hut", "votes_total": 1, "rank": 1 }
      ]
    }
  ]
}
```

---

### **Test 2: Vote Switching (Last-Vote-Wins)**

**Setup**:
```bash
# Alice switches from bean-there to starbucks
POST /api/vote { publicKey: "alice", topic: "coffee-shop__seattle", choice: "starbucks" }
```

**Expected**:
```json
{
  "channels": [
    {
      "channel_id": "coffee-shop__seattle",
      "total_votes": 3,           // Still 3 (alice, bob, charlie)
      "candidates": [
        { "candidate_id": "bean-there", "votes_total": 1, "rank": 2 },  // Lost alice's vote
        { "candidate_id": "starbucks", "votes_total": 2, "rank": 1 }    // Gained alice's vote
      ]
    }
  ]
}
```

**Key Point**: Total votes stays same (3), but candidate ranks flip

---

### **Test 3: Search Filtering**

**Query**:
```bash
GET /relay/query/channel_rankings?repo=seattle-voting&search=coffee
```

**Expected**:
```json
{
  "search_query": "coffee",
  "channels": [
    {
      "channel_id": "coffee-shop__seattle",
      "total_votes": 3,
      "channel_rank": 1,
      "candidates": [...]
    }
    // pizza-place NOT included (doesn't match "coffee")
  ]
}
```

---

## 📐 FILAMENT MODEL ALIGNMENT

### **Channels = Repositories/Categories**
- Each channel is a category (e.g., "coffee-shop__seattle")
- Channels compete for attention based on aggregate activity

### **Candidates = Branches (Competing Versions)**
- Each candidate is a branch (e.g., "bean-there" branch)
- Branches within a channel compete for selection

### **Votes = Filaments (Individual Events)**
- Each vote is one filament (one user's selection)
- Filament count = unique voters (cardinality)
- votes_total = magnitude (equal-weight for now)

---

## ✅ SUCCESS CRITERIA

**Two-level ranking is correct if**:

1. ✅ Channels ranked by **total_votes** (sum across all candidates)
2. ✅ Candidates ranked **within channel only** (not globally)
3. ✅ Search filters channels by name
4. ✅ No search = all channels ranked by total votes
5. ✅ Last-vote-wins per user per channel
6. ✅ Filament count (unique voters) tracked separately from magnitude

---

## 🚀 NEXT STEPS

### **1. Test the New Endpoint**
```bash
npm run dev:backend
curl "http://localhost:3002/relay/query/channel_rankings?repo=seattle-voting&branch=main"
```

### **2. Update Globe Renderer**
- Use `/channel_rankings` instead of `/voting_rankings`
- Render channels at different heights (by total_votes)
- Render candidates within each channel (left-to-right or fan)

### **3. Verify Search Works**
```bash
curl "http://localhost:3002/relay/query/channel_rankings?repo=seattle-voting&search=coffee"
```

---

## 📊 PERFORMANCE NOTES

**Current Implementation**:
- ✅ Single Git history walk (efficient)
- ✅ In-memory aggregation (fast for <100k votes)
- ✅ No database queries (Git-native)

**Future Optimizations** (if needed):
- Cache channel rankings (invalidate on new votes)
- Index vote events by channel (for large repos)
- Precompute totals (stored in `.relay/cache/`)

---

**Status**: ✅ Two-level ranking implemented and ready for testing  
**Next**: Test with real votes → Update globe renderer → Verify search filtering

