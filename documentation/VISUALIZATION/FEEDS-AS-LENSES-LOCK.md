# 🔒 FEEDS AS LENSES — FINAL SOCIAL LOCK

**Version**: 1.0.0  
**Status**: Canonical Lock (Non-Negotiable)  
**Last Updated**: 2026-01-28

---

## The Final Social Lock (Verbatim)

> **"Feeds are lenses, not sources. A feed never computes truth, never aggregates silently, and never hides causality. Every item in a feed must snap to its filament and replay its history."**

This is **not** a feature requirement. This is **the line that prevents Relay from decaying into a social network.**

---

## What This Prevents (Forever)

### ❌ Forbidden Forever

1. **"The algorithm decided"**
   - No invisible ranking
   - No silent boosting
   - No shadow suppression
   - No engagement optimization without explicit user control

2. **"This post was boosted"**
   - No paid amplification without explicit evidence
   - No "promoted" content disguised as organic
   - No hidden metrics determining visibility

3. **"Why am I seeing this?"**
   - Answer must always be traceable to:
     - A subscription (you follow this filament)
     - A proximity channel (you're near this location)
     - An explicit policy (you opted into this lens)
     - A consent handshake (you mutually agreed to see this)

---

## What This Requires (Always)

### ✅ Required Forever

1. **Every feed item must be traceable to its filament**
   - Click any post → see full filament
   - Replay commits → see how it evolved
   - Inspect topology → see why you saw it

2. **Feed rendering is deterministic**
   - Same subscriptions + same policy = same feed
   - No A/B testing of feeds
   - No "personalization" without explicit opt-in

3. **Causality is always visible**
   - "You see this because you subscribed to user:alice"
   - "You see this because you're within 200m of venue:cafe"
   - "You see this because you're in circle:close-friends"

---

## How Feeds Work in Relay

### Feed = Projection Lens Over Subscribed Filaments

**A feed is NOT:**
- ❌ A timeline stored in a database
- ❌ An aggregated view computed by servers
- ❌ A ranked list determined by algorithms

**A feed IS:**
- ✅ A lens over filaments you've subscribed to
- ✅ A projection of commits filtered by policy
- ✅ A deterministic render based on your subscriptions

---

### Feed Construction Algorithm

```javascript
function constructFeed(user) {
  // 1. Get user's subscriptions (explicit)
  const subscriptions = user.relationships.filter(r => r.type === 'FOLLOW');
  
  // 2. Get user's proximity channels (opt-in)
  const proximityChannels = user.proximitySettings.enabled
    ? getProximityFilaments(user.location, user.proximityRadius)
    : [];
  
  // 3. Get user's circles (explicit)
  const circles = user.relationships.filter(r => r.type === 'CIRCLE');
  
  // 4. Merge all filaments (no aggregation, no ranking)
  const allFilaments = [
    ...subscriptions.map(s => s.targetFilament),
    ...proximityChannels,
    ...circles.flatMap(c => c.members.map(m => m.filament))
  ];
  
  // 5. Filter by privacy ladder (policy + distance)
  const visibleCommits = allFilaments.flatMap(filament => {
    return filament.commits.filter(commit => {
      const tier = resolveTier(
        user.policyLevel,
        user.distanceToFilament(filament),
        user.permissionForFilament(filament)
      );
      return tier >= commit.requiredTier;
    });
  });
  
  // 6. Sort by EXPLICIT criteria (user-controlled)
  const sortedCommits = visibleCommits.sort((a, b) => {
    switch (user.feedSettings.sortMode) {
      case 'chronological': return b.ts - a.ts;  // Reverse chronological
      case 'proximity': return a.distance - b.distance;  // Nearest first
      case 'engagement': return b.likes - a.likes;  // Most liked (explicit)
      default: return b.ts - a.ts;  // Default: chronological
    }
  });
  
  // 7. Return with causality metadata
  return sortedCommits.map(commit => ({
    commit,
    causality: {
      reason: 'subscription' | 'proximity' | 'circle',
      sourceFilament: commit.filamentId,
      subscription: subscriptions.find(s => s.targetFilament === commit.filamentId),
      distance: user.distanceToFilament(commit.filamentId),
      tier: resolveTier(...)
    }
  }));
}
```

**Key properties:**
- ✅ **Deterministic** (same inputs → same feed)
- ✅ **Traceable** (every item has causality metadata)
- ✅ **User-controlled** (sort mode is explicit preference)
- ✅ **Privacy-preserving** (tier enforcement at render time)

---

### Feed Item Rendering

**Every feed item must display causality:**

```jsx
function FeedItem({ commit, causality }) {
  return (
    <div className="feed-item">
      {/* Main content */}
      <PostContent commit={commit} />
      
      {/* Causality footer (always visible) */}
      <div className="causality-footer">
        {causality.reason === 'subscription' && (
          <span>
            You see this because you follow {causality.subscription.targetUser}
          </span>
        )}
        {causality.reason === 'proximity' && (
          <span>
            You see this because you're within {causality.distance}m of this location
          </span>
        )}
        {causality.reason === 'circle' && (
          <span>
            You see this because you're in the "{causality.circle.name}" circle
          </span>
        )}
        
        {/* Snap to filament (always available) */}
        <button onClick={() => navigateToFilament(commit.filamentId)}>
          View full filament →
        </button>
      </div>
    </div>
  );
}
```

---

## Anti-Patterns (Explicitly Forbidden)

### ❌ Anti-Pattern 1: Silent Aggregation

**Bad:**
```javascript
// Aggregates likes without showing source
const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
```

**Good:**
```javascript
// Each like is a traceable vote commit
const likes = posts.flatMap(p => 
  p.voteFilaments.filter(v => v.commits.some(c => c.op === 'LIKE_ADDED'))
);
// User can click any like → see who, when, why
```

---

### ❌ Anti-Pattern 2: Invisible Ranking

**Bad:**
```javascript
// Ranks posts by engagement score (computed server-side)
posts.sort((a, b) => b.engagementScore - a.engagementScore);
```

**Good:**
```javascript
// User explicitly chooses sort mode
const sortMode = user.feedSettings.sortMode;  // 'chronological' | 'proximity' | 'engagement'
posts.sort((a, b) => {
  switch (sortMode) {
    case 'chronological': return b.ts - a.ts;
    case 'proximity': return a.distance - b.distance;
    case 'engagement': return b.likes - a.likes;  // Likes are explicit, countable
  }
});
```

---

### ❌ Anti-Pattern 3: Hidden Causality

**Bad:**
```html
<!-- User sees post, no explanation -->
<div class="post">
  <p>Alice shared a photo</p>
</div>
```

**Good:**
```html
<!-- Causality always visible -->
<div class="post">
  <p>Alice shared a photo</p>
  <span class="causality">
    You see this because you follow Alice
    <button>View Alice's full filament →</button>
  </span>
</div>
```

---

## Algorithmic Features (How to Do Them Safely)

### "Discover New People"

**Bad approach:** Silent recommendation engine

**Relay approach:** Explicit discovery lens

```javascript
// User explicitly enters "discovery mode"
const discoveryLens = {
  mode: 'discovery',
  criteria: {
    sharedInterests: ['hiking', 'jazz'],  // User-specified
    proximityRadius: 5000,  // User-controlled (5km)
    minHandshakeStage: 2  // Only show tags, not profiles
  }
};

// Discovery filaments are clearly labeled
<FeedItem 
  commit={commit} 
  causality={{
    reason: 'discovery',
    matchCriteria: ['hiking', 'jazz'],
    distance: 2300  // meters
  }}
/>
```

**Key:** User knows this is discovery mode, not their main feed.

---

### "Trending Topics"

**Bad approach:** Server decides what's trending

**Relay approach:** User-scoped trending lens

```javascript
// Trending = most-liked posts in your subscriptions + proximity channels
const trendingLens = {
  mode: 'trending',
  scope: 'subscriptions-and-proximity',  // User's scope
  timeWindow: 24 * 60 * 60 * 1000,  // Last 24 hours
  minLikes: 10  // User-controlled threshold
};

// Each trending item shows why it's trending
<FeedItem
  commit={commit}
  causality={{
    reason: 'trending',
    scope: 'your subscriptions',
    likes: 127,
    timeWindow: '24 hours'
  }}
/>
```

**Key:** Trending is scoped to your network, not global.

---

### "Recommended For You"

**Bad approach:** AI predicts what you'll like

**Relay approach:** AI proposes branches, user decides

```javascript
// AI creates proposal filament (not in main feed)
const aiProposal = {
  filamentId: 'ai-proposal:recommendations:user123',
  commits: [
    {
      op: 'RECOMMENDATION_PROPOSED',
      actor: { kind: 'ai', id: 'recommendation-engine' },
      payload: {
        targetFilament: 'user:bob',
        confidence: 0.87,
        reasoning: 'Shared interests: hiking, photography',
        evidence: [
          { filamentId: 'post:bob:hike-photo', commitIndex: 0 },
          { filamentId: 'user:alice:tags', commitIndex: 2 }
        ]
      }
    }
  ]
};

// User sees proposal in separate "Suggestions" section
// User can inspect reasoning + evidence
// User explicitly accepts (subscribe) or rejects
```

**Key:** AI proposes, user decides. Full evidence visible.

---

## Testing for Compliance

### How to Test If a Feed Is Compliant

**For any feed item, these must be answerable:**

1. **"Why do I see this?"**
   - Subscription? Which one?
   - Proximity? How close?
   - Circle? Which circle?

2. **"Where does this come from?"**
   - Filament ID?
   - Commit index?
   - Author?

3. **"How did this change over time?"**
   - Can I replay commits?
   - Can I see edit history?
   - Can I see who interacted?

**If any answer is "the algorithm decided" or "because engagement", FAIL.**

---

## Real-World Examples (Compliant)

### Example 1: Instagram-Style Photo Feed

**User's feed:**
- Photos from people they follow
- Photos from nearby locations (proximity)
- Photos from circles (close friends, family)

**Each photo shows:**
- Author (user:alice)
- Timestamp (commit.ts)
- Causality: "You follow Alice" | "Alice is 150m away" | "Alice is in your 'Close Friends' circle"
- Likes (countable, traceable vote commits)
- Comments (reply filaments, full history)

**User can:**
- Click photo → see full filament (all Alice's photos)
- Replay Alice's feed → see how it evolved
- Unsubscribe → Alice's photos disappear (deterministic)

---

### Example 2: Twitter-Style Text Feed

**User's feed:**
- Text posts from people they follow
- Text posts from nearby users (proximity)
- Text posts from hashtags they subscribe to

**Each post shows:**
- Author
- Timestamp
- Causality: "You follow Bob" | "Bob is 2.3km away" | "You subscribed to #relay"
- Likes, reposts (traceable)
- Replies (full thread visible)

**User can:**
- Click post → see full thread (reply filaments)
- Replay thread → see how conversation evolved
- Block author → all their posts disappear (policy change)

---

### Example 3: LinkedIn-Style Professional Feed

**User's feed:**
- Posts from professional connections
- Posts from companies they follow
- Posts from industry groups

**Each post shows:**
- Author (company or person)
- Timestamp
- Causality: "You follow TechCorp" | "You're in the 'AI Researchers' group"
- Engagement (likes, shares)
- Comments (threaded)

**User can:**
- Click post → see company's full filament
- See who else in their network interacted
- Unfollow company → their posts disappear

---

## Enforcement Checklist

**Before shipping any feed feature, verify:**

- [ ] Every feed item has a `causality` field
- [ ] Causality is displayed (not hidden)
- [ ] User can snap to source filament (button/link)
- [ ] Feed construction is deterministic (same inputs → same output)
- [ ] Sort mode is user-controlled (explicit preference)
- [ ] No silent aggregation (all metrics traceable)
- [ ] No invisible ranking (all sorting criteria explicit)
- [ ] Privacy ladder enforced (tier checks at render time)
- [ ] AI proposals are separate (not in main feed)
- [ ] Testing: "Why do I see this?" is always answerable

---

## Conclusion

**Feeds are lenses, not sources.**

This is the line that prevents Relay from becoming "just another social network."

**If a feed ever:**
- Computes truth (instead of projecting it)
- Aggregates silently (without traceable sources)
- Hides causality (without "why am I seeing this?")

**Then it has violated this lock and must be fixed.**

**The One-Sentence Lock (Repeat):**

> **"Feeds are lenses, not sources. A feed never computes truth, never aggregates silently, and never hides causality. Every item in a feed must snap to its filament and replay its history."**

---

**This lock is non-negotiable. It is the foundation of Relay's social integrity.**

---

*Last Updated: 2026-01-28*  
*Status: Canonical Lock (Forever)*  
*Version: 1.0.0*
