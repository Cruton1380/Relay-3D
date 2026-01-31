# 📱 Social Media as Filaments — Relay-Native Social Layer

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-28

---

## 🔒 Core Invariant

> **"Social media is not posts—it's public (or scoped) filaments people can subscribe to, replay, and fork. A profile is a lens, not storage. Interactions are commits, not ephemeral reactions."**

This is **not** a social network clone. This is social coordination built on truth substrate.

---

## Table of Contents

1. [What a Profile Is](#what-a-profile-is)
2. [What a Post Is](#what-a-post-is)
3. [Interactions as Filaments](#interactions-as-filaments)
4. [Privacy Ladder Applied](#privacy-ladder-applied)
5. [Commit Schemas](#commit-schemas)
6. [Physical Reality Integration](#physical-reality-integration)
7. [Universal Import (Legacy Social)](#universal-import-legacy-social)
8. [Safety Model](#safety-model)
9. [Real-World Use Cases](#real-world-use-cases)
10. [FAQ](#faq)

---

## What a Profile Is

### Definition

**A profile is NOT storage. It is a user sphere lens over filaments the user owns or curates.**

**Profile = Lens over:**
- `user.<id>` — Identity + policy + proofs
- `feed.<id>` — Their public stream (owned filaments)
- `collections.<id>` — Curated bundles ("my music", "my research", "my projects")
- `relationships.<id>` — Links to other filaments (follows, blocks, circles)

---

### Key Difference from Traditional Social Media

| **Traditional** | **Relay** |
|----------------|-----------|
| Profile = database row | Profile = projection lens |
| Posts stored in timeline | Posts = filaments (commits) |
| Likes = counter increment | Likes = vote-style commits |
| DMs = messages table | DMs = private filaments |
| Deletion = data deletion | Deletion = policy change (L0) |

---

### User Filament (`user.<id>`)

**Structure:**
```typescript
{
  filamentId: 'user:alice',
  commits: [
    {
      op: 'USER_CREATED',
      payload: {
        displayName: 'Alice',
        bio: 'Designer + hiker',
        avatar: 'artifact:image:alice-avatar.png',
        location: 'Seattle',
        verifications: ['human-verified', 'continuity-proof']
      }
    },
    {
      op: 'BIO_UPDATED',
      payload: { bio: 'Designer + hiker + coffee enthusiast' }
    }
  ]
}
```

**Commits:**
- `USER_CREATED` — Initial profile creation
- `BIO_UPDATED` — Bio text changed
- `AVATAR_UPDATED` — Profile picture changed
- `VERIFICATION_ADDED` — Proof attached (human-verified, etc.)
- `POLICY_CHANGED` — Privacy settings updated

---

### Feed Filament (`feed.<id>`)

**Structure:**
```typescript
{
  filamentId: 'feed:alice',
  commits: [
    {
      op: 'POST_CREATED',
      payload: {
        postId: 'post:alice:1',
        content: 'Just finished a new design project!',
        artifacts: ['artifact:image:project-screenshot.png'],
        tags: ['design', 'ux'],
        visibility: 'public'
      }
    }
  ]
}
```

**Key:** Feed is **owned** by the user. Nobody can "post to your feed" without permission.

---

### Collections Filament (`collections.<id>`)

**Structure:**
```typescript
{
  filamentId: 'collections:alice:favorites',
  commits: [
    {
      op: 'COLLECTION_CREATED',
      payload: {
        name: 'Favorite Music',
        description: 'Songs that matter',
        visibility: 'friends'
      }
    },
    {
      op: 'ITEM_ADDED',
      refs: {
        inputs: [{ filamentId: 'artifact:audio:song.mp3', commitIndex: 0 }]
      }
    }
  ]
}
```

**Use cases:**
- Saved posts
- Reading lists
- Playlists
- Research collections
- Bookmarks

---

### Relationships Filament (`relationships.<id>`)

**Structure:**
```typescript
{
  filamentId: 'relationships:alice',
  commits: [
    {
      op: 'FOLLOW_ADDED',
      payload: {
        targetUser: 'user:bob',
        visibility: 'public'
      }
    },
    {
      op: 'BLOCK_ADDED',
      payload: {
        targetUser: 'user:charlie',
        reason: 'harassment'
      }
    }
  ]
}
```

**Relationship types:**
- `FOLLOW_ADDED` / `FOLLOW_REMOVED` — Subscribe to someone's feed
- `BLOCK_ADDED` / `BLOCK_REMOVED` — Policy enforcement
- `MUTE_ADDED` / `MUTE_REMOVED` — Local filtering
- `CIRCLE_ADDED` — Custom groups ("close friends", "family")

---

## What a Post Is

### Definition

**A post is just a commit (or a small filament) that points to an artifact.**

**Post ≠ "content uploaded to timeline"**  
**Post = commit with:**
- Text / image / video = artifact reference
- Caption / tags / location / intent = commit faces
- Edits = new commits (no silent overwrites)
- Deletions = policy changes (visibility drop to L0) + tombstone commit

---

### Post Filament (`post.<id>`)

**Structure:**
```typescript
{
  filamentId: 'post:alice:2023-12-25',
  commits: [
    {
      commitIndex: 0,
      op: 'POST_CREATED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        content: 'Holiday coding session! Built something cool.',
        artifacts: ['artifact:image:code-screenshot.png'],
        tags: ['coding', 'relay'],
        location: { type: 'coarse', region: 'Seattle' },
        visibility: 'public'
      }
    },
    {
      commitIndex: 1,
      op: 'POST_EDITED',
      payload: {
        content: 'Holiday coding session! Built something VERY cool.',
        editReason: 'Typo fix'
      }
    },
    {
      commitIndex: 2,
      op: 'POST_DELETED',
      payload: {
        reason: 'user-requested',
        tombstone: true
      }
    }
  ]
}
```

---

### Post Operations

**POST_CREATED:**
```javascript
{
  op: 'POST_CREATED',
  payload: {
    content: string,
    artifacts?: Array<artifactId>,
    tags?: Array<string>,
    location?: { type: 'coarse' | 'precise', data: any },
    visibility: 'public' | 'friends' | 'circles' | 'private',
    replyTo?: filamentId  // If replying to another post
  }
}
```

**POST_EDITED:**
```javascript
{
  op: 'POST_EDITED',
  payload: {
    content?: string,
    tags?: Array<string>,
    editReason?: string
  }
}
```

**POST_DELETED:**
```javascript
{
  op: 'POST_DELETED',
  payload: {
    reason: 'user-requested' | 'policy-violation' | 'safety',
    tombstone: true  // Leaves trace (not silent deletion)
  }
}
```

**Key:** Deletion is **not data deletion**. It's a policy change (visibility → L0) + tombstone commit for audit.

---

## Interactions as Filaments

### Likes (Vote-Style Commits)

**Like = VOTE commit on target filament**

```typescript
{
  filamentId: 'likes:post:alice:2023-12-25',
  commits: [
    {
      op: 'LIKE_ADDED',
      actor: { kind: 'user', id: 'user:bob' },
      refs: {
        inputs: [{ filamentId: 'post:alice:2023-12-25', commitIndex: 0 }]
      },
      payload: {
        likeType: 'heart',
        timestamp: Date.now()
      }
    },
    {
      op: 'LIKE_REMOVED',
      actor: { kind: 'user', id: 'user:bob' },
      payload: {
        reason: 'changed-mind'
      }
    }
  ]
}
```

**Properties:**
- ✅ **Revocable** (can unlike)
- ✅ **Time-bounded** (can expire)
- ✅ **Auditable** (see who liked when)
- ✅ **Countable** (aggregated via lens)

---

### Comments (Reply Filaments)

**Comment = reply filament referencing parent commit**

```typescript
{
  filamentId: 'reply:bob:2023-12-25',
  commits: [
    {
      op: 'REPLY_CREATED',
      actor: { kind: 'user', id: 'user:bob' },
      refs: {
        inputs: [{ filamentId: 'post:alice:2023-12-25', commitIndex: 0 }]
      },
      payload: {
        content: 'This is awesome! Great work.',
        visibility: 'public'
      }
    }
  ]
}
```

**Thread structure:**
- Parent post = `post:alice:2023-12-25`
- Reply 1 = `reply:bob:2023-12-25`
- Reply to Reply 1 = `reply:charlie:2023-12-25` (refs → Reply 1)

**Rendering:**
- Topology lens shows reply tree
- Privacy ladder controls reply visibility

---

### Reposts (Fork or Mirror)

**Repost = fork or "mirror" lens (depending on policy)**

**Two modes:**

**A) Mirror (reference only):**
```typescript
{
  op: 'POST_MIRRORED',
  refs: {
    inputs: [{ filamentId: 'post:alice:2023-12-25', commitIndex: 0 }]
  },
  payload: {
    comment: 'Check this out!',  // Optional
    preserveOriginal: true
  }
}
```

**B) Fork (derivative):**
```typescript
{
  op: 'POST_FORKED',
  refs: {
    inputs: [{ filamentId: 'post:alice:2023-12-25', commitIndex: 0 }]
  },
  payload: {
    derivativeContent: 'Building on this idea...',
    changes: 'Added my own examples'
  }
}
```

**Key:** Mirrors preserve original authorship. Forks create derivatives (with attribution).

---

### Direct Messages (Private Filaments)

**DM = private filament with strict policy + endpoints locked to participants**

```typescript
{
  filamentId: 'dm:alice-bob',
  commits: [
    {
      op: 'CONVERSATION_CREATED',
      payload: {
        participants: ['user:alice', 'user:bob'],
        visibility: 'private',
        policy: {
          tier: 'L0',  // Invisible to non-participants
          participantsOnly: true,
          noExport: true  // Optional
        }
      }
    },
    {
      op: 'MESSAGE_SENT',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        content: 'Hey Bob, want to collaborate?',
        timestamp: Date.now()
      }
    },
    {
      op: 'MESSAGE_SENT',
      actor: { kind: 'user', id: 'user:bob' },
      payload: {
        content: 'Absolutely! Let's do it.',
        timestamp: Date.now()
      }
    }
  ]
}
```

**Key features:**
- ✅ **Encrypted at rest** (optional)
- ✅ **E2E encrypted** (optional, with key exchange)
- ✅ **Participants-only** (no external access)
- ✅ **Auditable to participants** (full history)
- ✅ **Exportable** (by participants, for archival)

---

## Privacy Ladder Applied

### Social Media Privacy Stages

**Distance changes fidelity, permission controls existence.**

| **Tier** | **Social Media View** | **What's Visible** |
|----------|----------------------|-------------------|
| **L0: Invisible** | Does not exist | Nothing (user chose to hide) |
| **L1: Presence-only** | "Someone is here" | Presence bead only (no identity) |
| **L2: Boxes-only** | Anonymous posts | TimeBoxes, no content |
| **L3: Tags-only** | Post types | "Photo post", "Text post" (no actual content) |
| **L4: Blurred preview** | Blurred images | Waveform of audio, blurred photos, silhouettes |
| **L5: Read-only clear** | Full content | Can read posts, see images, but no interaction |
| **L6: Engage** | Full interaction | Can like, comment, DM, share |

---

### Example: Viewing a Profile

**Public user (no connection):**
- L2: See that posts exist (boxes)
- L3: See post types (photo/text/video)
- L4: See blurred previews
- L5: See full content (if user allows public viewing)

**Friend:**
- L5: See full content
- L6: Can interact (like, comment)

**Close circle:**
- L6: Full interaction + see private posts

**Blocked:**
- L0: User does not exist

---

### Example: Proximity Discovery

**Stranger nearby (proximity enabled):**
- L1: Presence bead (someone is here)
- L2: No identity, just "a person exists"

**Proximity + mutual opt-in:**
- L3: Tags visible ("likes hiking, sci-fi")
- L4: Blurred preview of profile

**After handshake (dating context):**
- L5: Full profile (clear)
- L6: Can message (DM channel opens)

---

## Commit Schemas

### Feed Filament Schema

```typescript
interface FeedFilament {
  filamentId: 'feed:<userId>';
  commits: Array<{
    op: 'POST_CREATED' | 'POST_SHARED' | 'POST_PINNED';
    payload: {
      postId?: string;
      content?: string;
      artifacts?: Array<string>;
      tags?: Array<string>;
      visibility?: 'public' | 'friends' | 'circles' | 'private';
    };
  }>;
}
```

---

### Reply Filament Schema

```typescript
interface ReplyFilament {
  filamentId: 'reply:<userId>:<replyId>';
  commits: Array<{
    op: 'REPLY_CREATED' | 'REPLY_EDITED' | 'REPLY_DELETED';
    refs: {
      inputs: Array<{ filamentId: string; commitIndex: number }>;
    };
    payload: {
      content: string;
      visibility: 'public' | 'friends' | 'private';
    };
  }>;
}
```

---

### DM Filament Schema

```typescript
interface DMFilament {
  filamentId: 'dm:<user1>-<user2>';
  commits: Array<{
    op: 'CONVERSATION_CREATED' | 'MESSAGE_SENT' | 'MESSAGE_READ' | 'MESSAGE_DELETED';
    actor: { kind: 'user'; id: string };
    payload: {
      participants?: Array<string>;
      content?: string;
      timestamp?: number;
      encryption?: { type: 'e2e'; keyId: string };
    };
  }>;
}
```

---

## Physical Reality Integration

### Real-World Proximity Detection

**Key feature:** Walk around in real life with proximity channel detection on, see stores/locations on globe UI.

**How it works:**

1. **Your device broadcasts proximity signal**
   - Bluetooth LE (anonymous beacon)
   - WiFi direct (optional)
   - GPS coarse location (opt-in)

2. **Other Relay users nearby are detected**
   - Distance estimate (0-50m, 50-200m, 200m+)
   - No precise GPS (privacy)
   - Only "presence" (L1) unless mutual opt-in

3. **Stores/venues broadcast their own beacons**
   - Store = `venue:starbucks:seattle-downtown`
   - Beacon includes:
     - Store name
     - Store filament ID
     - Available channels (menu, offers, events)

4. **Your Relay UI renders on globe**
   - Open globe view
   - See your position (blue dot)
   - See nearby stores (markers)
   - See nearby users (presence beads, if permitted)

---

### Example: Walking Past a Café

**Scenario:** You walk past "Blue Bottle Coffee" with Relay open.

**What happens:**
1. Café's beacon is detected (proximity)
2. Your Relay UI shows:
   - 📍 "Blue Bottle Coffee" marker on globe
   - 🟢 "2 people here" (presence count, L1)
   - 📋 "Menu available" (if you tap marker)
   - ⭐ "Your friend Alice checked in 2 hours ago" (if allowed)

3. You can:
   - View menu (if café publishes `feed:bluebottle:menu`)
   - See reviews (filaments from other users)
   - Check in (append commit to your feed)
   - See who else is here (if mutual visibility)

---

### Example: Proximity + Dating

**Scenario:** You're at a park. Someone nearby has dating discovery enabled.

**What you see (without match):**
- L1: Presence bead (someone is here)
- L2: No identity

**If you both opt into proximity discovery:**
- L3: Tags visible ("likes hiking, music festivals")
- L4: Blurred profile preview

**If you mutually "wave" (dating gesture):**
- Handshake filament created (see Dating spec)
- L5: Profile visible
- L6: Can message

---

### Venue Filament Schema

```typescript
interface VenueFilament {
  filamentId: 'venue:<venueName>:<locationId>';
  commits: Array<{
    op: 'VENUE_CREATED' | 'MENU_UPDATED' | 'EVENT_POSTED' | 'OFFER_ADDED';
    payload: {
      name: string;
      location: { lat: number; lng: number; address: string };
      category: 'cafe' | 'restaurant' | 'store' | 'event' | 'park';
      beacon?: { type: 'ble'; uuid: string };
      channels?: Array<'menu' | 'offers' | 'events' | 'reviews'>;
    };
  }>;
}
```

---

## Universal Import (Legacy Social)

### Import Existing Social Media

**Relay can import:**
- Instagram exports (posts, photos, captions)
- Twitter/X archives (tweets, replies, likes)
- Facebook data dumps (posts, messages, timeline)
- WhatsApp chats (messages, media)
- iMessage logs (conversations, attachments)

**How:**
1. User downloads their data (GDPR export)
2. Relay parses with `SocialMediaImportAdapter`
3. Creates read-only filaments (legacy)
4. Renders in Relay UI (searchable, replayable)

**Key:** Legacy data is **read-only** (not authority). You can't edit old tweets—only view them as history.

---

### Example: Import Instagram

```typescript
// Import Instagram export
const adapter = new InstagramImportAdapter();
const result = await adapter.importArchive(instagramZip);

// Creates filaments
{
  filamentId: 'legacy:instagram:alice',
  commits: [
    {
      op: 'LEGACY_POST_IMPORTED',
      payload: {
        postId: 'instagram:12345',
        content: 'Beach day! 🌊',
        artifacts: ['artifact:image:beach.jpg'],
        timestamp: '2023-06-15',
        likes: 152,
        comments: 23
      }
    }
  ]
}
```

**Benefit:** All your social history in one place, searchable, replayable, portable.

---

## Safety Model

### Block, Mute, Report

**Block = policy change + local enforcement**

```typescript
{
  op: 'BLOCK_ADDED',
  payload: {
    targetUser: 'user:charlie',
    reason: 'harassment',
    effectiveAt: Date.now()
  }
}
```

**Effect:**
- Target user drops to L0 (invisible)
- No interaction possible
- Auditable to you (not to them)

---

**Mute = local filtering**

```typescript
{
  op: 'MUTE_ADDED',
  payload: {
    targetUser: 'user:david',
    reason: 'too-noisy',
    duration: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}
```

**Effect:**
- Target's posts hidden in your feed
- Reversible
- No notification to target

---

**Report = creates case filament with evidence**

```typescript
{
  filamentId: 'case:report:12345',
  commits: [
    {
      op: 'CASE_CREATED',
      payload: {
        reportType: 'harassment',
        targetUser: 'user:eve',
        evidence: [
          { filamentId: 'dm:alice-eve', commitIndex: 42 },
          { filamentId: 'post:eve:2023-12-20', commitIndex: 0 }
        ],
        description: 'Repeated unwanted messages after block'
      }
    }
  ]
}
```

**Escalation:**
- Case reviewed by jury/sortition (governance model)
- Evidence is visible to reviewers (governed access)
- Network-level action (if approved): account suspension, content removal

**Key:** Safety is **evidence-based**, not secret scoring. No invisible bans.

---

### Location Privacy

**Location is never broadcast as raw. Only proximity proofs (coarse, consented).**

**Three location modes:**

1. **None** (default)
   - No location data shared
   - No proximity discovery

2. **Coarse** (opt-in)
   - Region/city level ("Seattle")
   - No precise GPS
   - Proximity detection (0-50m, 50-200m, 200m+)

3. **Precise** (explicit consent only)
   - Exact coordinates (for meetups, events)
   - Time-bounded (expires after event)
   - Requires mutual consent

---

## Real-World Use Cases

### Use Case 1: Artist Portfolio

**Alice is a designer. Her Relay profile:**
- `feed:alice` — Public posts (projects, work)
- `collections:alice:portfolio` — Curated best work
- `collections:alice:inspiration` — Saved posts from others

**Anyone can:**
- View her feed (L5, public)
- Subscribe to updates
- See project history (replay commits)
- Fork her designs (with attribution)

**Benefit:** Portfolio + social feed + version control in one.

---

### Use Case 2: Local Coffee Shop

**Blue Bottle Coffee has a Relay presence:**
- `venue:bluebottle:seattle` — Venue filament
- `feed:bluebottle:menu` — Menu updates
- `feed:bluebottle:events` — Events, offers

**Customers can:**
- See venue on globe (when nearby)
- View menu (no app install required)
- Check in (append commit to their feed)
- See presence ("5 people here now")

**Benefit:** No separate app. Works via proximity detection.

---

### Use Case 3: Collaborative Research

**Bob and Charlie are researchers:**
- `collections:bob:research` — Papers, notes, experiments
- `reply:charlie:2023-12-10` — Comments on Bob's work
- `dm:bob-charlie` — Private discussion

**Workflow:**
- Bob publishes findings (public feed)
- Charlie replies with questions (reply filament)
- They collaborate in DM (private filament)
- Final paper = artifact filament (published together)

**Benefit:** Research + collaboration + versioning + attribution.

---

## FAQ

### General

**Q: How is this different from Twitter/Instagram?**  
A: Posts are filaments (immutable history), not database rows. Edits are visible. Deletions are auditable. No algorithmic timeline—only subscriptions + proximity.

**Q: Can I import my existing social media?**  
A: Yes. Universal Import supports Instagram, Twitter, Facebook, WhatsApp, iMessage exports.

**Q: Do I need to be "always online"?**  
A: No. Filaments sync when connected. Offline edits append when back online.

---

### Privacy

**Q: Can anyone see my posts?**  
A: Only if you allow (via visibility setting). Default is privacy-first.

**Q: What if I delete a post?**  
A: Post visibility drops to L0 (invisible), but a tombstone commit remains (auditable to you, not to others).

**Q: Can someone "stalk" me via location?**  
A: No. Location is coarse (city-level) or proximity-only (0-50m, no GPS). Precise location requires explicit consent.

---

### Technical

**Q: Where are posts stored?**  
A: Filaments (commits) stored in Git-compatible structure. Large media (images/videos) stored as artifacts (IPFS, S3, etc.).

**Q: How do I subscribe to someone's feed?**  
A: Add `FOLLOW_ADDED` commit to your `relationships` filament. Relay pulls their public filaments.

**Q: Can I export my data?**  
A: Yes. All your filaments are portable (Git repo). No lock-in.

---

## Conclusion

Social media in Relay is **not** a timeline of ephemeral posts. It's a **network of inspectable, governed, portable filaments** where:

- ✅ **Profiles are lenses** (not storage)
- ✅ **Posts are commits** (not uploads)
- ✅ **Interactions are filaments** (not counters)
- ✅ **Privacy is geometric** (L0-L6 ladder)
- ✅ **History is preserved** (auditable, replayable)
- ✅ **Proximity is real** (physical + digital integrated)

**The One-Sentence Lock:**

> **"Social media in Relay is public or scoped filaments people subscribe to, replay, and fork—where profiles are lenses, posts are commits, and proximity integrates physical reality with digital presence."**

---

**See Also:**
- [Dating as Handshake Filaments](DATING-SPEC.md)
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md)
- [Physical Proximity Model](PROXIMITY-DETECTION-SPEC.md)

---

*Last Updated: 2026-01-28*  
*Status: Canonical Specification*  
*Version: 1.0.0*
