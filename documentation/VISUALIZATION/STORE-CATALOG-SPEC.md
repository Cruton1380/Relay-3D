# 🎮 Store Catalog — Steam-Like Game Distribution as Lens

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## Core Principle

> **The Store is a lens over public game-project filaments, not a separate authority.**

In Relay, a game store (like Steam) is **not** a database of games—it's a **curated projection** of game filaments that have been published. Each game listing projects metadata from the game's root filament, and downloads point to build artifacts (commits with artifact hashes).

**Key Insight:**
> Store catalog = lens, not storage.  
> Game truth lives in filaments. Store shows discoverable public projections.

---

## Table of Contents

1. [Store as Lens](#store-as-lens)
2. [Catalog Filament](#catalog-filament)
3. [Game Listing Structure](#game-listing-structure)
4. [Publishing Workflow](#publishing-workflow)
5. [Ratings & Reviews](#ratings--reviews)
6. [Downloads & Versioning](#downloads--versioning)
7. [Curation & Moderation](#curation--moderation)
8. [Community vs Official Catalogs](#community-vs-official-catalogs)
9. [Revenue & Monetization](#revenue--monetization)
10. [Implementation Guide](#implementation-guide)
11. [Real-World Scenarios](#real-world-scenarios)
12. [FAQ](#faq)

---

## Store as Lens

### What the Store Shows

The Store is a **queryable projection** that surfaces:

1. **Game listings** (title, description, screenshots, trailer)
2. **Ratings** (aggregated from review filaments)
3. **Version history** (release commits)
4. **Download links** (build artifact pointers)

**Critical:**
> The Store **never stores game data**. It only stores **references** (pointers to game filaments + release commits).

---

### Store Query Example

```typescript
// User browses store
const storeResults = await query('/store/games', {
  category: 'RPG',
  sortBy: 'rating',
  limit: 20
});

// Returns:
// [
//   {
//     gameId: 'game.project.epic-quest',
//     title: 'Epic Quest',
//     rating: 4.5,
//     releaseFilament: 'release.001',
//     latestVersion: 'v0.1.0',
//     // ... metadata projection
//   },
//   // ... more games
// ]
```

---

## Catalog Filament

### Structure

The catalog itself is a **filament** (`store.catalog.<id>`):

```
store.catalog.global
├─ Commit 1: Added Epic Quest
├─ Commit 2: Added Dungeon Crawler
├─ Commit 3: Removed spam game (moderation)
├─ Commit 4: Featured Game of the Week (Epic Quest)
└─ Commit 5: Added category: Strategy
```

**Each commit is a catalog update:**
```typescript
{
  commit_class: 'CATALOG_UPDATE',
  faces: {
    output: {
      listings: [
        {
          gameId: 'game.project.epic-quest',
          releaseFilament: 'release.001',
          featured: true,
          categories: ['RPG', 'Fantasy']
        },
        // ... other games
      ]
    },
    input: {
      previousListings: [/* before state */]
    },
    semantic: 'Featured Epic Quest as Game of the Week',
    identity: 'user:store-curator',
    evidence: {
      type: 'curation',
      reason: 'High player engagement + positive reviews'
    }
  }
}
```

---

## Game Listing Structure

### Metadata Projection

Each game listing **projects** from the game's root filament:

```typescript
interface GameListing {
  // From game.project.<id>
  gameId: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  
  // From release filament
  latestRelease: {
    version: string;
    releaseDate: number;
    releaseNotes: string;
  };
  
  // From asset filaments (screenshots, trailer)
  media: {
    screenshots: string[];  // Image hashes
    trailer: string;        // Video hash
    icon: string;           // Icon hash
  };
  
  // Aggregated from review filaments
  rating: {
    average: number;  // 0-5 stars
    count: number;    // Total reviews
  };
  
  // Download info
  builds: {
    platform: 'windows' | 'linux' | 'macos' | 'web';
    artifactHash: string;  // Build output hash
    downloadUrl: string;   // CDN URL
    size: number;          // Bytes
  }[];
  
  // Pricing (optional)
  price?: {
    usd: number;
    tokens?: number;  // Relay token pricing
  };
}
```

---

## Publishing Workflow

### Steps to Publish a Game

#### **1. Create Game Project**

Developer creates root filament:
```typescript
createFilament({
  type: 'game.project',
  title: 'Epic Quest',
  genre: 'RPG'
});
```

---

#### **2. Develop Game**

Developer commits throughout development:
- Scene edits
- Asset creation
- System implementation
- Testing

(All commits to `main` branch or feature branches)

---

#### **3. Create Release**

When ready, developer creates release filament:
```typescript
createRelease({
  gameProjectId: 'game.project.epic-quest',
  version: 'v0.1.0',
  label: 'Alpha',
  builds: [
    { platform: 'windows', buildFilament: 'build.windows.001', commitIndex: 1 },
    { platform: 'linux', buildFilament: 'build.linux.001', commitIndex: 1 }
  ],
  releaseNotes: 'First playable alpha...'
});
```

---

#### **4. Submit to Store**

Developer submits game to catalog:
```typescript
submitToStore({
  gameProjectId: 'game.project.epic-quest',
  releaseFilament: 'release.001',
  catalogId: 'store.catalog.global',
  
  // Listing metadata
  listing: {
    title: 'Epic Quest',
    description: 'A fantasy RPG adventure...',
    screenshots: ['ipfs://Qm...001', 'ipfs://Qm...002'],
    trailer: 'ipfs://Qm...trailer',
    price: { usd: 14.99 },
    categories: ['RPG', 'Fantasy', 'Singleplayer']
  }
});
```

**Result:** Creates proposal commit to catalog filament (requires curator approval for official catalog)

---

#### **5. Curator Reviews (GATE)**

Store curator reviews submission:
- Checks content policy compliance
- Checks game quality (playable? complete?)
- Checks metadata accuracy
- Checks pricing reasonableness

**Curator approves** → Game added to catalog (GATE commit + merge)

---

#### **6. Game Goes Live**

Game appears in store:
- Discoverable via search
- Browsable in category pages
- Downloadable by players

---

## Ratings & Reviews

### Reviews as Filaments

Each game has a **reviews filament** (`game.reviews.<game-id>`):

```
game.reviews.epic-quest
├─ Commit 1: Review by Player A (5 stars, "Amazing!")
├─ Commit 2: Review by Player B (4 stars, "Great, but buggy")
├─ Commit 3: Review by Player C (3 stars, "Mediocre")
└─ ...
```

**Review Commit Structure:**
```typescript
{
  commit_class: 'REVIEW_ADD',
  faces: {
    output: {
      rating: 5,  // 1-5 stars
      text: 'Amazing game! Great story and combat.',
      playTime: 120,  // Minutes played
      recommendedFor: ['RPG fans', 'Story lovers']
    },
    semantic: 'Player review: 5 stars',
    identity: 'user:player-alice',
    evidence: {
      type: 'review',
      verified: true,  // Did player actually play? (playtime > 30 min)
      timestamp: Date.now()
    }
  }
}
```

---

### Rating Aggregation

**Query Hook:**
```typescript
// /store/game-rating?gameId=epic-quest
export async function game_rating({ gameId }) {
  const reviews = await getFilament(`game.reviews.${gameId}`);
  const commits = reviews.timeBoxes;
  
  const ratings = commits.map(c => c.faces.output.rating);
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
  return {
    average: average.toFixed(1),
    count: ratings.length,
    distribution: {
      5: ratings.filter(r => r === 5).length,
      4: ratings.filter(r => r === 4).length,
      3: ratings.filter(r => r === 3).length,
      2: ratings.filter(r => r === 2).length,
      1: ratings.filter(r => r === 1).length
    }
  };
}
```

---

## Downloads & Versioning

### Download Flow

```
Player clicks "Download Epic Quest"
  ↓
Store looks up latest release filament: release.001
  ↓
Gets build for player's platform (Windows)
  ↓
Reads artifact hash from build commit
  ↓
Generates download URL: https://relay-cdn.com/<hash>
  ↓
Player downloads build artifact
  ↓
Player verifies hash (integrity check)
  ↓
Player installs and plays
```

---

### Versioning

**Multiple versions coexist:**

```
store.catalog.global listing for Epic Quest:
├─ v0.1.0 (Alpha) → release.001 → build.windows.001:commit-1
├─ v0.2.0 (Beta) → release.002 → build.windows.001:commit-5
└─ v1.0.0 (Release) → release.003 → build.windows.002:commit-1
```

**Players can:**
- Download latest version (default)
- Download specific version (e.g., for speedrunning, nostalgia)
- See changelog (release commits + filament history)

---

## Curation & Moderation

### Curator Roles

**Curators** are users with `store-curator` permission. They can:
- ✅ Approve/reject store submissions (GATE)
- ✅ Feature games (highlight in catalog)
- ✅ Remove games (moderation—spam, abuse, copyright violations)
- ✅ Create categories/collections

**Governance:**
- Curator actions are **commits** (auditable)
- Curator permissions can be **voted on** (community decides who curates)
- Removed games remain in history (audit trail preserved)

---

### Moderation Flow

```
Player reports game for copyright violation
  ↓
Moderator reviews game:
  - Inspects game filaments (scenes, assets)
  - Checks evidence (AI generation prompts, asset sources)
  - Checks copyright database
  ↓
If violation confirmed:
  - Create CATALOG_UPDATE commit (remove game)
  - Archive game filament (mark as removed)
  - Notify developer (with reason)
  ↓
Developer can appeal:
  - Provide evidence (license, permission)
  - Governance votes on appeal
  - If upheld → game restored (GATE + SCAR)
```

---

## Community vs Official Catalogs

### Multiple Catalog Branches

**Official Catalog:**
```
store.catalog.global:main
├─ Curated by official store team
├─ Quality requirements (playtesting, content policy)
└─ Featured listings, editorial picks
```

**Community Catalog:**
```
store.catalog.global:community
├─ Curated by community moderators
├─ Lower barrier to entry (experimental games)
└─ Community voting for features
```

**Regional Catalogs:**
```
store.catalog.japan
├─ Japan-specific games
├─ Localized content
└─ Region-appropriate policies (content ratings)
```

---

### Forking Catalogs

**Anyone can fork the catalog** and create their own:

```
store.catalog.indie-only
├─ Forked from store.catalog.global:community
├─ Filter: Only indie games (< 5 person teams)
└─ Governance: Indie developer voting
```

**Benefits:**
- **Decentralization**: No single authority controls discovery
- **Customization**: Niche catalogs for specific audiences
- **Governance**: Each catalog can have its own rules

---

## Revenue & Monetization

### Payment Models

#### **1. Paid Games**

Developer sets price in release commit:
```typescript
{
  version: 'v1.0.0',
  price: { usd: 19.99 },
  // ...
}
```

**Payment Flow:**
1. Player purchases game (via Relay wallet)
2. Payment recorded as commit on `game.purchases.<player-id>` filament
3. Player granted download permission (license commit)
4. Developer receives revenue (minus store fee)

---

#### **2. Free-to-Play + In-App Purchases**

Game is free, but has in-game items for sale:

```
game.project.epic-quest:
  price: free
  
game.items.epic-quest:
  ├─ item:sword-of-fire (price: $4.99)
  ├─ item:dragon-mount (price: $9.99)
  └─ item:cosmetic-armor (price: $2.99)
```

**Purchase Flow:**
1. Player buys item in-game
2. Payment creates commit on player's `game.inventory.<player-id>` filament
3. Item unlocked (permission commit)

---

#### **3. Donations / Pay-What-You-Want**

Developer allows donations:
```typescript
{
  version: 'v1.0.0',
  price: { usd: 0, suggestedDonation: 5.00 },
  // ...
}
```

---

### Revenue Distribution

**Store Fee Model:**
- Relay takes X% (e.g., 15-30%, governance-votable)
- Developer receives remainder
- Modders (if game allows modding) can receive share (configurable)

**Filament:**
```
game.revenue.epic-quest
├─ Commit 1: Sale to Player A ($19.99, dev: $16.99, store: $3.00)
├─ Commit 2: Sale to Player B ($19.99, dev: $16.99, store: $3.00)
└─ ...
```

**Audit Trail:** Developers can audit every sale (transparent revenue).

---

## Implementation Guide

### Catalog Data Model

```typescript
interface StoreCatalog {
  catalogId: string;
  name: string;
  description: string;
  
  // Catalog governance
  curators: string[];  // User IDs with curator permission
  governance: {
    submissionApprovalRequired: boolean;
    communityVoting: boolean;
  };
  
  // Listings (pointers to game filaments)
  listings: GameListingReference[];
}

interface GameListingReference {
  gameId: string;           // game.project.<id>
  releaseFilament: string;  // release.<id>
  addedAt: number;
  curatorApproved: boolean;
  featured: boolean;
  categories: string[];
}
```

---

### Query Hooks

```typescript
// /store/catalog?catalogId=global
export async function store_catalog({ catalogId }) {
  // 1. Load catalog filament
  const catalog = await getFilament(`store.catalog.${catalogId}`);
  const latestCommit = catalog.timeBoxes[catalog.timeBoxes.length - 1];
  const listings = latestCommit.faces.output.listings;
  
  // 2. For each listing, fetch game metadata
  const games = await Promise.all(
    listings.map(async (ref) => {
      const game = await getFilament(ref.gameId);
      const release = await getFilament(ref.releaseFilament);
      const reviews = await getFilament(`game.reviews.${ref.gameId}`);
      
      // Project metadata
      return {
        gameId: ref.gameId,
        title: game.title,
        description: game.description,
        rating: aggregateRating(reviews),
        latestVersion: release.version,
        // ...
      };
    })
  );
  
  return { games };
}

// /store/game-details?gameId=epic-quest
export async function game_details({ gameId }) {
  const game = await getFilament(gameId);
  const releases = await getFilament(`release.${gameId.split('.').pop()}`);
  const reviews = await getFilament(`game.reviews.${gameId.split('.').pop()}`);
  
  return {
    title: game.title,
    description: game.description,
    screenshots: game.media.screenshots,
    trailer: game.media.trailer,
    releases: releases.timeBoxes.map(tb => ({
      version: tb.faces.output.version,
      date: tb.timestamp,
      notes: tb.faces.output.releaseNotes
    })),
    rating: aggregateRating(reviews),
    reviews: reviews.timeBoxes.slice(-10).map(tb => tb.faces.output)  // Latest 10 reviews
  };
}
```

---

## Real-World Scenarios

### Scenario 1: Indie Developer Publishes First Game

**Week 1:** Develop game
- Create `game.project.my-first-game`
- Build levels, assets, systems
- Test locally

**Week 2:** Prepare release
- Create builds for Windows, Linux
- Create `release.001` filament (v1.0.0)
- Upload builds to CDN (get artifact hashes)

**Week 3:** Submit to store
- Submit to `store.catalog.global` (official catalog)
- Provide metadata (title, description, screenshots)
- Set price: $9.99

**Week 4:** Curator reviews
- Curator plays game (quality check)
- Curator approves (GATE commit)
- Game added to catalog (visible to players)

**Week 5:** Players discover & buy
- Game appears in "New Releases" section
- Players buy, download, play
- Players leave reviews (review filaments)

---

### Scenario 2: AAA Studio Publishes Update

**Context:** Big studio releases v2.0 of popular game.

**Process:**
1. Studio creates `release.010` filament (v2.0.0)
2. Builds for all platforms (Windows, Linux, Mac, consoles)
3. Updates store listing (new screenshots, trailer)
4. Creates catalog update commit:
   ```typescript
   {
     operation: 'update-listing',
     gameId: 'game.project.epic-quest',
     releaseFilament: 'release.010',  // Point to new release
     featured: true  // Feature the update
   }
   ```
5. Players see "Update available" in library
6. Players download v2.0 (new build artifacts)

---

### Scenario 3: Community Catalog for Indie Games

**Context:** Community creates indie-focused catalog.

**Process:**
1. Community forks official catalog:
   ```bash
   git branch store.catalog.indie-only store.catalog.global:main
   ```
2. Community adds indie-only curation rules
3. Community votes on featured games (governance)
4. Players subscribe to indie catalog (alternative discovery)

**Benefit:** Multiple curated catalogs coexist (official, community, regional, genre-specific).

---

## FAQ

### General

**Q: Is the store centralized?**  
A: **Catalog filaments** can be forked (decentralized curation). **Build artifacts** are distributed (CDN, IPFS, peer-to-peer).

**Q: Can I create my own store?**  
A: Yes. Fork the catalog filament, set your own rules, host your own storefront UI.

**Q: What about console releases (PlayStation, Xbox)?**  
A: Build process can target consoles. Distribution may require platform-specific stores (PlayStation Store, Xbox Store) as additional channels.

---

### For Developers

**Q: How do I update my game?**  
A: Create new `release` commit with updated version. Store listing automatically shows latest release.

**Q: Can I do early access?**  
A: Yes. Mark release as `label: 'Early Access'`. Players see warning + can buy at reduced price.

**Q: What about beta testing?**  
A: Create release on separate branch (`beta`). Invite beta testers (grant download permission). Merge to `main` when ready.

---

### For Players

**Q: How do I find games?**  
A: Browse store catalog (categories, featured, top-rated) or search (if game has public discoverability).

**Q: Can I refund a game?**  
A: **Policy-dependent**. Store can offer refunds (recorded as refund commit, revenue reversed).

**Q: What if a game is removed from the store?**  
A: If you already downloaded it, **you keep it** (license commit is permanent). If you haven't, you can't download anymore (unless store is forked).

---

### Technical

**Q: How do you prevent piracy?**  
A: **License commits** (player must have purchase commit to receive download permission). DRM optional (developer choice).

**Q: What about game updates?**  
A: **Auto-update**: Client polls for new release commits, downloads new builds automatically (configurable).

**Q: Can I host my own build artifacts?**  
A: Yes. Developer can provide custom CDN URLs. Relay doesn't force centralized hosting.

---

## Conclusion

The **Store Catalog** model ensures:
- ✅ **Store as lens** (projection of game filaments, not separate database)
- ✅ **Forkable catalogs** (decentralized curation)
- ✅ **Auditable listings** (every catalog change is a commit)
- ✅ **Versioned games** (players can download specific versions)
- ✅ **Transparent revenue** (every sale is a commit)
- ✅ **Community governance** (catalogs can be voted on, moderated, forked)

By treating the store as a **lens over game filaments**, Relay enables **Steam-like discovery and distribution** with **full decentralization** and **audit trails**.

---

**See Also:**
- [Game Production Model](GAME-PRODUCTION-MODEL.md) (How games are built)
- [Multi-Domain Editing](MULTI-DOMAIN-EDITING.md) (Creative tools for games)
- [AI Participation Model](AI-PARTICIPATION-MODEL.md) (AI-generated game content)
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md) (Game visibility settings)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
