# 🌍 PROXIMITY GLOBE PROOF — DESIGN SPECIFICATION

**Version**: 1.0.0  
**Status**: Design Complete, Ready to Build  
**Last Updated**: 2026-01-28

---

## Why This Is the Keystone Proof

**This proof does four critical things at once:**

1. **Proves Relay replaces apps, not just tools**
   - No app switching
   - Everything in one globe interface
   - Physical + digital unified

2. **Proves privacy + proximity can coexist**
   - You see that something exists
   - Before you see what it is
   - You may never be allowed to see more

3. **Proves the globe is not metaphor — it's literal reality**
   - Walk in real life → see on globe
   - No abstraction layer
   - Physical space = digital space

4. **Makes Relay intuitively understandable to non-technical humans**
   - "Oh, it's like a map of everything around me"
   - Privacy makes sense (distance = blur)
   - Consent makes sense (wave to connect)

---

## Table of Contents

1. [Scenario (Walk Simulation)](#scenario-walk-simulation)
2. [Three Entity Types](#three-entity-types)
3. [Beacon Model (No Surveillance)](#beacon-model-no-surveillance)
4. [Presence Decay (TTL)](#presence-decay-ttl)
5. [Privacy Enforcement](#privacy-enforcement)
6. [Commit Schemas](#commit-schemas)
7. [Visual Design](#visual-design)
8. [Implementation Architecture](#implementation-architecture)
9. [Critical Invariants](#critical-invariants)
10. [Acceptance Criteria](#acceptance-criteria)

---

## Scenario (Walk Simulation)

### User walks through a city (simulated movement for proof)

**Initial state:**
- Globe centered on Seattle downtown
- User position: blue dot at Pike Place Market

**Path:**
1. Start at Pike Place Market (47.609, -122.342)
2. Walk north on 1st Ave (0.5km)
3. Pass coffee shops, bookstores
4. Arrive at Seattle Center (47.620, -122.349)

**What user sees:**
- 🟢 Presence beads (people nearby, anonymous)
- 📍 Venue markers (stores, cafés)
- 📅 Event markers (concerts, meetups)

**Interactions:**
- Tap presence bead → see tags (if permitted)
- Tap venue marker → see menu/offers
- Tap event marker → see details, RSVP

---

## Three Entity Types

### 1. People (Presence Beads)

**Privacy tiers:**
- **L0:** Invisible (not discoverable)
- **L1:** Anonymous presence (🟢 bead, no identity)
- **L2:** Tags only ("likes hiking, jazz")
- **L3:** Blurred preview (voice waveform, blurred photo)
- **L4+:** Requires handshake (not shown in proximity)

**Key:** Distance alone never escalates tier. Only consent.

---

### 2. Venues (Stores, Cafés, etc.)

**Always visible (public entities):**
- 📍 Marker on globe
- Name visible (e.g., "Blue Bottle Coffee")
- Category (café, restaurant, store, park)

**Interactions:**
- Tap marker → view menu, offers, events
- Check in → append commit to user's feed
- See presence count ("4 people here now")

---

### 3. Events (Concerts, Meetups, etc.)

**Visibility depends on event policy:**
- Public events: always visible (📅 marker)
- Private events: only visible to attendees

**Interactions:**
- Tap marker → see event details
- RSVP → append commit to event filament
- See attendee count (if permitted)

---

## Beacon Model (No Surveillance)

### How Beacons Work

**Beacons are anonymous, ephemeral signals broadcast by devices.**

**Key properties:**
- ✅ **Anonymous** (no identity in beacon)
- ✅ **Ephemeral** (30-second TTL)
- ✅ **Local** (Bluetooth LE, 50m range)
- ✅ **Opt-in** (user controls broadcast)

---

### Beacon Structure

```typescript
interface ProximityBeacon {
  beaconId: string;  // Random UUID (rotates every 30s)
  type: 'user' | 'venue' | 'event';
  tier: number;  // L0-L6 (controls what's revealed)
  category?: string;  // For venues: 'cafe', 'restaurant', etc.
  signal: {
    rssi: number;  // Signal strength (distance estimate)
    timestamp: number;  // When beacon was received
    ttl: number;  // Time to live (default: 30000ms)
  };
}
```

**User beacon (L1, anonymous):**
```json
{
  "beaconId": "b3f2e1a0-4d5c-6b7a-8e9f-0a1b2c3d4e5f",
  "type": "user",
  "tier": 1,
  "signal": {
    "rssi": -65,
    "timestamp": 1738024800000,
    "ttl": 30000
  }
}
```

**User beacon (L2, tags visible):**
```json
{
  "beaconId": "c4g3f2b1-5e6d-7c8b-9f0g-1b2c3d4e5f6g",
  "type": "user",
  "tier": 2,
  "tags": ["hiking", "jazz", "photography"],
  "signal": {
    "rssi": -58,
    "timestamp": 1738024800000,
    "ttl": 30000
  }
}
```

**Venue beacon (always visible):**
```json
{
  "beaconId": "venue:bluebottle:seattle",
  "type": "venue",
  "tier": 5,
  "category": "cafe",
  "name": "Blue Bottle Coffee",
  "location": { "lat": 47.609, "lng": -122.342 },
  "channels": ["menu", "offers", "events"],
  "signal": {
    "rssi": -45,
    "timestamp": 1738024800000,
    "ttl": 300000
  }
}
```

---

### No Tracking Possible

**Why beacons don't enable tracking:**

1. **BeaconId rotates** (every 30 seconds)
   - Can't correlate beacons across time
   - Can't build movement history

2. **No identity in beacon** (unless L2+)
   - L1: Only "someone is here"
   - L2: Only tags, no name/photo

3. **TTL enforced** (beacons expire)
   - Old beacons removed from globe
   - No "breadcrumb trail" left behind

4. **Opt-in only** (user controls broadcast)
   - Can disable at any time
   - Can set tier (L0 = invisible)

---

## Presence Decay (TTL)

### How Presence Expires

**Every beacon has a TTL (time to live).**

**Default TTLs:**
- User beacons: 30 seconds
- Venue beacons: 5 minutes
- Event beacons: duration of event

**Decay algorithm:**
```javascript
function updatePresence(beacons) {
  const now = Date.now();
  
  // Remove expired beacons
  const activeBeacons = beacons.filter(beacon => {
    const age = now - beacon.signal.timestamp;
    return age < beacon.signal.ttl;
  });
  
  // Render with opacity based on age
  return activeBeacons.map(beacon => {
    const age = now - beacon.signal.timestamp;
    const opacity = 1 - (age / beacon.signal.ttl);  // Fade as it ages
    
    return {
      ...beacon,
      opacity: Math.max(0.3, opacity)  // Minimum 30% opacity
    };
  });
}
```

**Visual effect:**
- Fresh beacon: bright (opacity = 1.0)
- Aging beacon: fading (opacity = 0.7)
- Nearly expired: dim (opacity = 0.3)
- Expired: removed (opacity = 0)

---

## Privacy Enforcement

### Privacy Ladder Applied to Proximity

**Critical rule:** Distance alone never escalates tier. Only consent.

| **Tier** | **Distance** | **What's Visible** | **How to Escalate** |
|----------|--------------|-------------------|-------------------|
| **L0** | Any | Nothing | User opted out |
| **L1** | 0-50m | Anonymous bead (🟢) | Proximity detection on |
| **L2** | 0-50m | Tags ("hiking, jazz") | User enabled L2 broadcast |
| **L3** | 0-50m | Blurred preview | User enabled L3 broadcast |
| **L4+** | Any | Clear profile | Requires handshake (mutual consent) |

**Enforcement:**
```javascript
function resolveVisibleTier(beacon, userDistance, userPolicy) {
  // 1. Beacon declares its max tier
  const beaconTier = beacon.tier;
  
  // 2. User policy may restrict visibility
  const userMaxTier = userPolicy.maxTierForProximity;  // e.g., L2
  
  // 3. Distance gate (only if close enough)
  const distanceTier = userDistance < 50 ? beaconTier : 0;  // Within 50m
  
  // 4. Return minimum (most restrictive)
  return Math.min(beaconTier, userMaxTier, distanceTier);
}
```

**Example:**
- Beacon broadcasts L3 (blurred preview)
- User policy: max L2 (tags only)
- User distance: 30m (within range)
- Result: User sees L2 (tags only)

**Key:** User's privacy settings always win.

---

## Commit Schemas

### Proximity Beacon Schema

```typescript
interface ProximityBeacon {
  beaconId: string;
  type: 'user' | 'venue' | 'event';
  tier: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  category?: string;
  name?: string;
  tags?: Array<string>;
  location?: { lat: number; lng: number };
  channels?: Array<string>;
  signal: {
    rssi: number;  // Signal strength (-100 to 0, closer = higher)
    timestamp: number;  // When beacon was received
    ttl: number;  // Time to live (ms)
  };
}
```

---

### User Presence Filament Schema

**When user enables proximity detection, a presence filament is created:**

```typescript
{
  filamentId: 'presence:user:alice',
  commits: [
    {
      op: 'PROXIMITY_ENABLED',
      payload: {
        tier: 2,  // L2: tags only
        tags: ['hiking', 'jazz', 'photography'],
        radius: 50,  // meters
        ttl: 30000  // 30 seconds
      }
    },
    {
      op: 'PROXIMITY_DISABLED',
      payload: {
        reason: 'user-requested',
        timestamp: Date.now()
      }
    }
  ]
}
```

---

### Venue Filament Schema

**Venues are persistent filaments (not ephemeral beacons):**

```typescript
{
  filamentId: 'venue:bluebottle:seattle',
  commits: [
    {
      op: 'VENUE_CREATED',
      payload: {
        name: 'Blue Bottle Coffee',
        category: 'cafe',
        location: { lat: 47.609, lng: -122.342 },
        address: '1st Ave, Seattle, WA',
        channels: ['menu', 'offers', 'events'],
        beacon: {
          type: 'ble',
          uuid: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          major: 100,
          minor: 1
        }
      }
    },
    {
      op: 'MENU_UPDATED',
      payload: {
        items: [
          { name: 'Espresso', price: 3.50 },
          { name: 'Latte', price: 4.50 }
        ],
        updatedAt: Date.now()
      }
    }
  ]
}
```

---

### Event Filament Schema

```typescript
{
  filamentId: 'event:concert:crocodile:2026-01-28',
  commits: [
    {
      op: 'EVENT_CREATED',
      payload: {
        name: 'Local Indie Band Concert',
        venue: 'venue:crocodile:seattle',
        location: { lat: 47.618, lng: -122.348 },
        startTime: Date.now() + 3600000,  // 1 hour from now
        endTime: Date.now() + 7200000,  // 2 hours from now
        visibility: 'public',
        capacity: 200,
        attendees: []
      }
    },
    {
      op: 'ATTENDEE_RSVP',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        rsvpAt: Date.now(),
        rsvpStatus: 'attending'
      }
    }
  ]
}
```

---

## Visual Design

### Globe Rendering

**Main view: 3D globe (Cesium)**

**User position:**
- Blue dot (always centered)
- Blue circle (radius = proximity detection range)

**Entities:**
- 🟢 **User beacons** (green spheres, small)
- 📍 **Venue markers** (custom icons, medium)
- 📅 **Event markers** (calendar icons, medium)

**Color coding:**
- 🟢 Green = user presence (L1-L3)
- 🔵 Blue = venues (cafés, stores)
- 🟠 Orange = events (concerts, meetups)
- ⚪ Gray = expired/fading beacons

---

### Interaction Design

**Hover (desktop) / Tap (mobile):**

**On user beacon (L1, anonymous):**
```
┌────────────────────┐
│ 🟢 Someone nearby  │
│ Distance: 35m      │
└────────────────────┘
```

**On user beacon (L2, tags):**
```
┌────────────────────────┐
│ 🟢 Someone nearby      │
│ Distance: 42m          │
│ Interests:             │
│ • hiking               │
│ • jazz                 │
│ • photography          │
│                        │
│ [Wave to connect]      │
└────────────────────────┘
```

**On venue marker:**
```
┌────────────────────────┐
│ ☕ Blue Bottle Coffee  │
│ Distance: 15m          │
│ Category: Café         │
│ 🟢 4 people here now   │
│                        │
│ [View menu]            │
│ [Check in]             │
└────────────────────────┘
```

**On event marker:**
```
┌────────────────────────┐
│ 🎵 Local Indie Band    │
│ Venue: The Crocodile   │
│ Tonight at 7:00 PM     │
│ 🟢 12 attending        │
│                        │
│ [View details]         │
│ [RSVP]                 │
└────────────────────────┘
```

---

### Left Panel (Controls)

```
┌────────────────────────┐
│ 🌍 Proximity Globe     │
├────────────────────────┤
│ Your Position:         │
│ Pike Place Market      │
│ Seattle, WA            │
├────────────────────────┤
│ Discovery Settings:    │
│ ☑ Proximity Detection  │
│ [ ] Intent Discovery   │
│                        │
│ Visibility:            │
│ • L1: Presence only    │
│ • L2: Tags visible ✓   │
│ • L3: Blurred preview  │
│                        │
│ Radius: 50m ▓░░░░ 500m │
├────────────────────────┤
│ Nearby:                │
│ 🟢 7 people            │
│ 📍 12 venues           │
│ 📅 3 events            │
├────────────────────────┤
│ Walk Simulation:       │
│ [Start Walk] [Reset]   │
│ Speed: ▓▓░░░ (2x)      │
└────────────────────────┘
```

---

## Implementation Architecture

### Component Structure

```
ProximityGlobeProof.jsx
├── LeftPanel (controls + stats)
├── GlobeView (Cesium 3D)
│   ├── UserPositionMarker (blue dot)
│   ├── ProximityRadius (blue circle)
│   ├── UserBeacons (green spheres)
│   ├── VenueMarkers (custom icons)
│   └── EventMarkers (calendar icons)
└── EntityTooltip (hover/tap info)
```

---

### State Management

```typescript
interface ProximityGlobeState {
  userPosition: { lat: number; lng: number };
  walkPath: Array<{ lat: number; lng: number; name: string }>;
  currentPathIndex: number;
  isWalking: boolean;
  walkSpeed: number;  // 1x, 2x, 5x
  
  discoverySettings: {
    proximityEnabled: boolean;
    intentEnabled: boolean;
    tier: 0 | 1 | 2 | 3;
    radius: number;  // meters
  };
  
  nearbyBeacons: Array<ProximityBeacon>;
  selectedBeacon: ProximityBeacon | null;
}
```

---

### Walk Simulation Algorithm

```javascript
function simulateWalk(state, deltaTime) {
  if (!state.isWalking) return state;
  
  const path = state.walkPath;
  const currentIndex = state.currentPathIndex;
  
  if (currentIndex >= path.length - 1) {
    // End of path
    return { ...state, isWalking: false };
  }
  
  const current = path[currentIndex];
  const next = path[currentIndex + 1];
  
  // Interpolate between waypoints
  const speed = 0.0001 * state.walkSpeed * (deltaTime / 1000);  // degrees per second
  const direction = {
    lat: next.lat - current.lat,
    lng: next.lng - current.lng
  };
  const distance = Math.sqrt(direction.lat ** 2 + direction.lng ** 2);
  
  if (distance < speed) {
    // Reached next waypoint
    return {
      ...state,
      userPosition: next,
      currentPathIndex: currentIndex + 1
    };
  } else {
    // Move towards next waypoint
    const newPosition = {
      lat: current.lat + (direction.lat / distance) * speed,
      lng: current.lng + (direction.lng / distance) * speed
    };
    return { ...state, userPosition: newPosition };
  }
}
```

---

### Beacon Detection Algorithm

```javascript
function detectNearbyBeacons(userPosition, allBeacons, settings) {
  const now = Date.now();
  
  // Filter by distance + TTL
  const nearbyBeacons = allBeacons.filter(beacon => {
    // Check TTL
    const age = now - beacon.signal.timestamp;
    if (age > beacon.signal.ttl) return false;
    
    // Check distance
    const distance = calculateDistance(userPosition, beacon.location);
    if (distance > settings.radius) return false;
    
    return true;
  });
  
  // Apply privacy ladder
  return nearbyBeacons.map(beacon => {
    const distance = calculateDistance(userPosition, beacon.location);
    const tier = resolveVisibleTier(beacon, distance, settings);
    
    return {
      ...beacon,
      visibleTier: tier,
      distance
    };
  });
}
```

---

## Critical Invariants

### Invariant 1: You See That Something Exists Before You See What It Is

**Visual proof:**
- L1 beacon: Green sphere (no identity)
- Hover: "Someone nearby" (no name, no photo)
- Only after wave + consent → identity revealed

**Code enforcement:**
```javascript
function renderBeacon(beacon, tier) {
  if (tier === 0) return null;  // Invisible
  
  if (tier === 1) {
    // Presence only
    return <AnonymousSphere color="green" />;
  }
  
  if (tier === 2) {
    // Tags only
    return <AnonymousSphere color="green" tags={beacon.tags} />;
  }
  
  // L3+ requires handshake (not shown in proximity)
  return null;
}
```

---

### Invariant 2: Distance Alone Never Reveals Truth

**Visual proof:**
- User walks towards beacon
- Beacon remains anonymous (L1)
- Only when user explicitly escalates tier (L2) → tags appear

**Code enforcement:**
```javascript
function updateBeaconVisibility(beacon, userDistance) {
  // Distance does NOT escalate tier
  const tier = beacon.tier;  // Tier is beacon's choice, not distance-dependent
  
  // Distance only gates visibility (within range or not)
  if (userDistance > beacon.signal.maxRange) {
    return { ...beacon, visible: false };
  }
  
  return { ...beacon, visible: true, tier };
}
```

---

### Invariant 3: Only Consent Escalates Fidelity

**Visual proof:**
- User taps L2 beacon (tags visible)
- "Wave to connect" button appears
- User waves → handshake initiated
- Other user accepts → L4+ unlocked (clear profile)
- Without mutual consent → stays at L2

**Code enforcement:**
```javascript
function handleWaveGesture(userA, beaconB) {
  // Create handshake proposal
  const handshake = {
    filamentId: `handshake:${userA.id}-${beaconB.userId}`,
    commits: [
      {
        op: 'HANDSHAKE_PROPOSED',
        actor: { kind: 'user', id: userA.id },
        payload: {
          fromTier: 2,
          proposedTier: 4,  // Request clear profile
          timestamp: Date.now()
        }
      }
    ]
  };
  
  // Wait for other user's consent
  // (not automatic, requires explicit acceptance)
  return handshake;
}
```

---

## Acceptance Criteria

### Must Demonstrate

**✅ 1. Walk simulation works**
- User moves along path
- Globe updates smoothly
- Beacons appear/disappear based on proximity

**✅ 2. Three entity types visible**
- 🟢 User beacons (anonymous, L1-L2)
- 📍 Venue markers (always visible)
- 📅 Event markers (policy-dependent)

**✅ 3. Privacy ladder enforced**
- L1: Anonymous presence only
- L2: Tags visible (no identity)
- L3+: Not shown in proximity (requires handshake)

**✅ 4. Interactions don't break privacy**
- Tap L1 beacon → see "Someone nearby" (no leak)
- Tap L2 beacon → see tags + "Wave to connect" (no leak)
- Tap venue → see menu, offers (public info only)

**✅ 5. Presence decays visually**
- Fresh beacons: bright
- Aging beacons: fading
- Expired beacons: removed

**✅ 6. Distance never escalates tier**
- Walk towards L1 beacon → stays L1
- Walk towards L2 beacon → stays L2
- Only consent → escalate to L4+

---

### Visual Tests

**Test 1: "Can I see what it is before I'm allowed?"**
- ❌ NO: L1 beacon never shows identity
- ❌ NO: L2 beacon never shows photos/name
- ✅ YES: Only tags (explicit, user-declared)

**Test 2: "Does getting closer reveal more?"**
- ❌ NO: Distance doesn't change tier
- ✅ YES: Distance determines if beacon is visible at all (within range)
- ✅ YES: Distance affects opacity (fading)

**Test 3: "Can I force someone to reveal themselves?"**
- ❌ NO: Wave gesture is proposal (not command)
- ❌ NO: Other user can decline
- ✅ YES: Only mutual consent unlocks higher tiers

---

## Conclusion

**This proof locks the human side of Relay forever.**

**It demonstrates:**
- ✅ **Physical + digital integration** (walk in real life → see on globe)
- ✅ **Privacy + proximity coexistence** (you see existence before truth)
- ✅ **Consent as geometry** (only mutual agreement escalates fidelity)
- ✅ **Intuitive for non-technical humans** ("It's a map of everything around me")

**The One-Sentence Lock:**

> **"You can see that something exists before you can see what it is—and you may never be allowed to see more. This is real life. This is the system passing the human sanity test."**

---

**Ready to build: `/proof/proximity-globe`**

---

*Last Updated: 2026-01-28*  
*Status: Design Complete*  
*Version: 1.0.0*
