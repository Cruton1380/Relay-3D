# 💑 Dating as Handshake Filaments — Relay-Native Dating Layer

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-28

---

## 🔒 Core Invariant

> **"Dating is a mutual consent + scoped visibility handshake rendered as geometry, not a 'profile marketplace.' Every step is consensual, revocable, and auditable to participants."**

This is **not** a dating app clone. This is **human connection** built on consent substrate.

---

## Table of Contents

1. [Core Object: Handshake Filament](#core-object-handshake-filament)
2. [Discovery Modes](#discovery-modes)
3. [Stages of Reveal (Privacy Ladder)](#stages-of-reveal-privacy-ladder)
4. [Safety Model (Evidence, Not Surveillance)](#safety-model-evidence-not-surveillance)
5. [Authenticity Without Doxxing](#authenticity-without-doxxing)
6. [Commit Schemas](#commit-schemas)
7. [Physical Reality Integration](#physical-reality-integration)
8. [Real-World Use Cases](#real-world-use-cases)
9. [Critical Locks](#critical-locks)
10. [FAQ](#faq)

---

## Core Object: Handshake Filament

### Definition

**When two people match, Relay creates a `handshake.<A>-<B>` filament.**

**It encodes:**
- Mutual permissions (what each person chose to reveal)
- Escalation history (every step is a commit)
- Consent state (current stage, revocable)

**Key:** No one "unlocks" you globally. They unlock a **scoped lens** to you.

---

### Handshake Filament Structure

```typescript
{
  filamentId: 'handshake:alice-bob',
  commits: [
    {
      commitIndex: 0,
      op: 'HANDSHAKE_INITIATED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        initiator: 'user:alice',
        target: 'user:bob',
        stage: 1,  // Stage 1: Presence-only
        context: 'proximity',  // How they discovered each other
        timestamp: Date.now()
      }
    },
    {
      commitIndex: 1,
      op: 'STAGE_ESCALATED',
      actor: { kind: 'user', id: 'user:bob' },
      payload: {
        fromStage: 1,
        toStage: 2,  // Stage 2: Tags-only
        consentedBy: 'user:bob',
        timestamp: Date.now()
      }
    },
    {
      commitIndex: 2,
      op: 'STAGE_ESCALATED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        fromStage: 2,
        toStage: 3,  // Stage 3: Blurred preview
        consentedBy: 'user:alice',
        timestamp: Date.now()
      }
    },
    {
      commitIndex: 3,
      op: 'DM_CHANNEL_OPENED',
      payload: {
        dmFilamentId: 'dm:alice-bob',
        stage: 5,  // Stage 5: Mutual channel
        timestamp: Date.now()
      }
    }
  ]
}
```

---

### Key Properties

**✅ Mutual consent required:**
- Both parties must agree to escalate
- Either party can pause/revert
- No "unlocking" without consent

**✅ Auditable to participants:**
- Full history visible to both
- Timestamps, stages, reasons

**✅ Revocable:**
- Either party can exit handshake
- Drops to L0 (invisible)

**✅ Scoped:**
- Handshake only affects this dyad
- No global profile changes

---

## Discovery Modes

### Two Modes (Both Relay-Consistent)

#### Mode A: Proximity Discovery (Default, Reality-Like)

**Rule:** You can only discover people in your **physical radius** or **shared channels** (events, venues, communities).

**How it works:**
1. Your device detects nearby Relay users (Bluetooth LE, WiFi direct)
2. You see **presence** (L1) only — no identity
3. If both have "proximity discovery" enabled:
   - You see **tags** (L2) — "likes hiking, sci-fi"
   - No photos, no name, no profile

**Example:**
- You're at a coffee shop
- 3 presence beads appear on your globe UI
- One bead shows tags: "photographer, loves jazz"
- You can "wave" (gesture to initiate handshake)

---

#### Mode B: Intent Discovery (Opt-In)

**Rule:** You can appear in broader search, but only as allowed by your privacy ladder.

**How it works:**
1. User enables "intent discovery" (opt-in)
2. Sets discovery radius (1 mile, 10 miles, citywide)
3. Sets visibility tier (L2-L4)
4. Appears in search results for others with matching intent

**Example:**
- Alice sets: "Within 5 miles, L3 (tags + blurred preview)"
- Bob searches: "Within 5 miles, likes hiking"
- Alice appears as: Blurred profile, tags visible
- Bob can "wave" to initiate handshake

**Key:** Still no full profile unless consent handshake escalates.

---

## Stages of Reveal (Privacy Ladder)

### Six-Stage Escalation Model

**Each stage requires mutual consent. Either party can pause/revert.**

| **Stage** | **Name** | **What's Visible** | **Interactions** |
|-----------|----------|-------------------|-----------------|
| **0** | **Invisible** | Nothing (not discoverable) | None |
| **1** | **Presence-only** | "Someone is nearby" | None |
| **2** | **Tags-only** | "Likes hiking, sci-fi, jazz" | Wave gesture |
| **3** | **Blurred preview** | Voice note waveform, blurred images | Request escalation |
| **4** | **Clear preview** | Selected photos/answers, bio | View full preview |
| **5** | **Mutual channel** | DM filament opens | Can message |
| **6** | **Engage surfaces** | Shared planning, calendar, location | Full collaboration |

---

### Stage Details

#### Stage 0: Invisible

**User chose:** "Not discoverable"

**What happens:**
- Does not appear in proximity
- Does not appear in search
- Existing handshakes can continue (if already established)

---

#### Stage 1: Presence-Only

**User chose:** "Proximity detection on, but anonymous"

**What others see:**
- Presence bead (anonymous)
- No identity, no tags, no profile

**Use case:** "I'm open to meeting people, but only in shared physical spaces."

---

#### Stage 2: Tags-Only

**User chose:** "Show my interests, not my identity"

**What others see:**
- Tags/interests: "hiking, music festivals, design, sci-fi"
- No photos, no name, no bio

**Interactions:**
- Can "wave" (gesture to initiate handshake)
- If mutual wave → escalate to Stage 3

---

#### Stage 3: Blurred Preview

**User chose:** "Show hints of who I am, but not full clarity"

**What others see:**
- **Photos:** Blurred (silhouettes, colors, composition visible)
- **Audio:** Waveform only (voice note, no playback)
- **Bio:** Excerpts (first sentence only)
- **Answers:** "System-level" hints (e.g., "career: creative field")

**Interactions:**
- Can request escalation to Stage 4
- Requires mutual consent

**Example:**
```
Photos: [Blurred outdoor scene] [Blurred portrait]
Bio: "Designer who loves..." (rest hidden)
Voice: [Waveform visualization, 15s, no play button]
Interests: hiking, jazz, photography
```

---

#### Stage 4: Clear Preview

**User chose:** "Show selected profile elements, read-only"

**What others see:**
- **Photos:** Clear (user-selected photos, not all)
- **Bio:** Full text
- **Answers:** User-written responses (curated)
- **Voice:** Playable voice note (optional)

**Interactions:**
- Can view full preview
- Can request DM (Stage 5)
- Still read-only (no messaging yet)

**Key:** User controls **which** photos/answers are shown. Not full profile.

---

#### Stage 5: Mutual Channel

**Both users consented:** "Open DM channel"

**What happens:**
- DM filament created: `dm:alice-bob`
- Both can send messages
- Full conversation history (auditable to both)
- Can share location (opt-in, time-bounded)

**Interactions:**
- Text messages
- Voice messages
- Photos/videos
- Location sharing (coarse or precise, consented)

---

#### Stage 6: Engage Surfaces

**Both users consented:** "Enable collaboration tools"

**What happens:**
- Shared planning board (date ideas, notes)
- Shared calendar (propose meet times)
- Shared location (for meetups, precise)
- Optional: Shared task list, expense tracking

**Use case:** Planning a date, coordinating logistics.

**Key:** Only by **explicit mutual permission**. Not default.

---

## Safety Model (Evidence, Not Surveillance)

### Block, Report, Escalate

#### Block (Policy Enforcement)

```typescript
{
  op: 'HANDSHAKE_BLOCKED',
  actor: { kind: 'user', id: 'user:alice' },
  payload: {
    targetUser: 'user:bob',
    reason: 'not-interested' | 'uncomfortable' | 'harassment',
    effectiveAt: Date.now()
  }
}
```

**Effect:**
- Handshake drops to Stage 0 (invisible)
- DM filament locked (no new messages)
- Target cannot re-initiate handshake
- Auditable to Alice (not to Bob)

---

#### Report (Case Creation)

```typescript
{
  filamentId: 'case:report:12345',
  commits: [
    {
      op: 'CASE_CREATED',
      actor: { kind: 'user', id: 'user:alice' },
      payload: {
        reportType: 'harassment' | 'safety-concern' | 'fake-profile' | 'spam',
        targetUser: 'user:bob',
        evidence: [
          { filamentId: 'dm:alice-bob', commitIndex: 42 },
          { filamentId: 'handshake:alice-bob', commitIndex: 5 }
        ],
        description: 'Repeated unwanted messages after I said no',
        severity: 'high'
      }
    }
  ]
}
```

**Escalation:**
- Case reviewed by **jury/sortition** (Relay governance)
- Evidence visible to reviewers (governed access)
- Reviewers have access to:
  - Message history (DM filament)
  - Handshake escalation timeline
  - Previous reports (if any)

**Possible outcomes:**
- Warning to reported user
- Account suspension (time-bounded)
- Network ban (requires high consensus)

**Key:** **Evidence-based**, not secret scoring. No invisible shadow bans.

---

### Consent Revocation

**Either party can revoke consent at any stage:**

```typescript
{
  op: 'CONSENT_REVOKED',
  actor: { kind: 'user', id: 'user:alice' },
  payload: {
    fromStage: 5,
    toStage: 0,
    reason: 'changed-mind',
    effectiveAt: Date.now()
  }
}
```

**Effect:**
- Handshake reverts to Stage 0
- DM channel closes (read-only archive for Alice)
- Target sees: "Alice has ended the conversation"

**Key:** **No explanation required.** Consent is absolute.

---

### Location Safety

**Location is never broadcast as raw. Only proximity proofs (coarse, consented).**

**Three location modes:**

1. **None** (default)
   - No location shared
   - No proximity discovery

2. **Coarse** (opt-in for proximity)
   - Region/city level ("Seattle")
   - Proximity bands (0-50m, 50-200m, 200m+)
   - No precise GPS

3. **Precise** (explicit consent, time-bounded)
   - Exact coordinates (for meetups only)
   - Expires after event (e.g., 2 hours)
   - Requires mutual consent + active handshake (Stage 5+)

**Example:**
- Alice and Bob agree to meet at a café
- Bob requests precise location (Stage 6)
- Alice consents for "next 2 hours"
- Bob sees Alice's precise location
- After 2 hours: drops back to coarse

---

## Authenticity Without Doxxing

### Optional Proofs (Privacy-Preserving)

**Goal:** Raise trust without revealing identity.

| **Proof Type** | **What It Shows** | **What It Hides** |
|----------------|------------------|------------------|
| **Human-verified** | "Real person, not bot" | Identity, name, photo |
| **Continuity proof** | "Same person over time" | Identity, history |
| **Rate-limited** | "Not mass-spamming" | Activity logs |
| **Age-verified** | "18+, 21+, etc." | Exact birthdate, ID |
| **Location-verified** | "Really in Seattle" | Precise address, GPS history |

---

### Example: Human Verification

**User completes verification:**
```typescript
{
  op: 'VERIFICATION_ADDED',
  payload: {
    verifiedAt: Date.now(),
    verificationType: 'human-verified',
    method: 'biometric-hotspot',  // Your reverify concept
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000  // 30 days
  }
}
```

**What others see:**
- ✅ "Human-verified" badge
- No name, no ID, no photo

**Benefit:** Trust without doxxing.

---

### Example: Continuity Proof

**User has been on Relay for 2 years:**
```typescript
{
  op: 'CONTINUITY_PROOF_ADDED',
  payload: {
    accountAge: 730,  // Days
    activityScore: 0.85,  // Consistent, not sporadic
    verifiedSince: Date.now() - 730 * 24 * 60 * 60 * 1000
  }
}
```

**What others see:**
- ✅ "Active for 2+ years" badge
- No activity history, no logs

**Benefit:** Reduces risk of throwaway/fake accounts.

---

## Commit Schemas

### Handshake Filament Schema

```typescript
interface HandshakeFilament {
  filamentId: 'handshake:<user1>-<user2>';
  commits: Array<{
    op:
      | 'HANDSHAKE_INITIATED'
      | 'STAGE_ESCALATED'
      | 'STAGE_REVERTED'
      | 'DM_CHANNEL_OPENED'
      | 'ENGAGE_SURFACE_ENABLED'
      | 'HANDSHAKE_BLOCKED'
      | 'CONSENT_REVOKED';
    actor: { kind: 'user'; id: string };
    payload: {
      initiator?: string;
      target?: string;
      stage?: number;
      fromStage?: number;
      toStage?: number;
      consentedBy?: string;
      reason?: string;
      timestamp: number;
    };
  }>;
}
```

---

### Dating Profile Filament Schema

```typescript
interface DatingProfileFilament {
  filamentId: 'dating:profile:<userId>';
  commits: Array<{
    op:
      | 'PROFILE_CREATED'
      | 'PHOTOS_UPDATED'
      | 'BIO_UPDATED'
      | 'TAGS_UPDATED'
      | 'VOICE_NOTE_ADDED'
      | 'DISCOVERY_SETTINGS_CHANGED';
    payload: {
      photos?: Array<string>;  // Artifact IDs
      bio?: string;
      tags?: Array<string>;
      voiceNote?: string;  // Artifact ID
      discoverySettings?: {
        mode: 'proximity' | 'intent' | 'none';
        radius?: number;  // Miles
        visibilityTier?: number;  // L0-L6
      };
    };
  }>;
}
```

---

## Physical Reality Integration

### Proximity Discovery in Real Life

**Scenario:** You're at a music festival. Your Relay is set to "proximity discovery" (Stage 1-2).

**What happens:**
1. **Your device detects nearby Relay users** (Bluetooth LE, anonymous)
2. **Your globe UI shows:**
   - 🟢 Presence beads (L1, anonymous)
   - 🎵 "3 people nearby interested in jazz" (L2, tags only)

3. **You tap a presence bead:**
   - Tags appear: "jazz, photography, hiking"
   - Blurred preview (if they enabled L3)
   - "Wave" button available

4. **You wave:**
   - They get notification: "Someone nearby waved"
   - If they wave back → Handshake initiated (Stage 2)

5. **Mutual escalation:**
   - Stage 2 → Stage 3 (blurred preview)
   - Stage 3 → Stage 4 (clear preview)
   - Stage 4 → Stage 5 (DM opens)

---

### Example: Coffee Shop Proximity

**Alice and Bob are in the same café:**

**Alice's view:**
- Globe UI shows her position (blue dot)
- 🟢 Presence bead nearby (Bob, anonymous)
- Tags: "design, coffee enthusiast, hiking"

**Bob's view:**
- Globe UI shows his position (blue dot)
- 🟢 Presence bead nearby (Alice, anonymous)
- Tags: "photography, jazz, travel"

**Both have mutual interest (hiking):**
- Relay suggests: "Mutual interest: hiking. Wave to connect?"
- Both wave → Handshake initiated
- Escalate to Stage 4 → Can see profiles
- Escalate to Stage 5 → DM opens

**Meeting:**
- Alice proposes: "Want to grab coffee now?"
- Bob accepts: "Sure! Table by the window?"
- Location sharing enabled (precise, 1 hour)
- They meet in person (reality + digital integrated)

---

## Real-World Use Cases

### Use Case 1: Festival/Event Discovery

**Scenario:** You're at a conference. You want to meet people with similar interests.

**Flow:**
1. Enable proximity discovery (L2, tags only)
2. Walk around venue
3. See presence beads + tags on globe UI
4. Find someone interesting: "AI researcher, climber, sci-fi"
5. Wave to connect
6. Escalate to DM (Stage 5)
7. Plan coffee meeting (Stage 6, shared calendar)

**Benefit:** Discover people in shared physical space, not endless swiping.

---

### Use Case 2: Casual Dating (Non-Cringe)

**Scenario:** You're open to meeting someone, but don't want to be "indexed" in a dating marketplace.

**Flow:**
1. Enable proximity discovery (L3, blurred preview)
2. Go about your life (cafés, parks, events)
3. If someone nearby is interesting → wave
4. Escalate mutually (both consent)
5. DM opens (Stage 5)
6. Plan a date (Stage 6, shared planning)

**Benefit:** No profile marketplace. Meet people organically, digitally assisted.

---

### Use Case 3: Safety-First Approach

**Scenario:** You want to meet people, but prioritize safety.

**Settings:**
1. Proximity only (no intent discovery)
2. Stage 3 maximum (blurred preview, no clear photos)
3. Voice notes only (no photos until Stage 5)
4. Location: coarse only (no precise until Stage 6)

**Flow:**
1. Wave to connect (anonymous)
2. Exchange messages (DM, Stage 5)
3. Voice notes (hear tone, no visuals)
4. Meet in public (shared location, time-bounded)

**Benefit:** Full control over reveal pace. Safety by design.

---

## Critical Locks

### Two Non-Negotiable Constraints

#### 1. No Global Indexing of Private Humans

**Rule:** If someone is not explicitly discoverable, they **do not exist** to search.

**Implications:**
- ❌ No "browse all profiles" feature
- ❌ No "search by photo" (no facial recognition)
- ❌ No "view who viewed you" (unless opted in)
- ✅ Only proximity or intent-based discovery
- ✅ Presence ≠ discoverability

**Enforcement:**
- Search API requires:
  - User opted into intent discovery
  - Query matches user's discovery settings
  - Privacy ladder tier allows existence

---

#### 2. Dating Escalations Are Mutual-Consent Commits

**Rule:** Every increase in visibility is a **commit** in the handshake filament, **reversible**.

**Implications:**
- ❌ No "unlocking" profiles
- ❌ No asymmetric reveal (one sees more than other)
- ✅ Both parties consent to each stage
- ✅ Either party can revert
- ✅ Full audit trail (to participants only)

**Enforcement:**
- `STAGE_ESCALATED` commit requires:
  - Signature from both parties (or sequential consent)
  - Cannot skip stages (must escalate incrementally)
  - Revocation drops to Stage 0 immediately

---

## FAQ

### General

**Q: How is this different from Tinder/Bumble/Hinge?**  
A: No profile marketplace. Discovery is proximity-first. Reveal is staged and mutual. History is auditable. Consent is revocable.

**Q: Can I use this for casual dating? Serious relationships? Just friends?**  
A: Yes. Same substrate, different intent. Set your discovery settings accordingly.

**Q: What if I don't want to be discovered at all?**  
A: Stage 0 (Invisible). You won't appear in proximity or search. Existing handshakes can continue.

---

### Safety

**Q: What if someone is harassing me?**  
A: Block them (instant, local). Report them (case filament created). Evidence reviewed by governance (jury/sortition).

**Q: Can someone track my location?**  
A: No. Location is coarse (city-level) or proximity-only (distance bands, no GPS). Precise location requires explicit consent + time limit.

**Q: What if I change my mind after escalating?**  
A: Revoke consent (instant). Handshake reverts to Stage 0. DM channel closes. No explanation required.

---

### Privacy

**Q: Can someone see my full profile without my consent?**  
A: No. Stages are incremental. Stage 4 (clear preview) is user-selected elements only (not full profile).

**Q: What if I want to delete my profile?**  
A: Delete profile → all handshakes drop to Stage 0. Existing DMs become read-only archives (to participants). Your data is yours (exportable).

**Q: Are messages encrypted?**  
A: Yes. DM filaments support E2E encryption (optional). Keys exchanged during handshake escalation.

---

### Technical

**Q: How does proximity detection work?**  
A: Bluetooth LE + WiFi direct (anonymous beacons). No GPS broadcast. Privacy-preserving.

**Q: What if someone screenshots my profile?**  
A: We can't prevent screenshots (no system can). But: staged reveal minimizes exposure. Watermarking optional (for evidence).

**Q: Can I export my handshake history?**  
A: Yes. All your filaments are portable (Git repo). No lock-in.

---

## Conclusion

Dating in Relay is **not** a profile marketplace. It's a **mutual consent + scoped visibility handshake** where:

- ✅ **Discovery is proximity-first** (reality-like)
- ✅ **Reveal is staged** (6 incremental steps)
- ✅ **Consent is mutual** (both parties agree)
- ✅ **Safety is evidence-based** (not surveillance)
- ✅ **Authenticity is provable** (without doxxing)
- ✅ **History is auditable** (to participants)

**The One-Sentence Lock:**

> **"Dating is a mutual consent + scoped visibility handshake filament where every stage requires consent, every escalation is auditable to participants, and no one is globally indexed—proximity and intent discovery integrate physical reality with digital trust."**

---

**See Also:**
- [Social Media Spec](SOCIAL-MEDIA-SPEC.md)
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md)
- [Physical Proximity Model](PROXIMITY-DETECTION-SPEC.md)

---

*Last Updated: 2026-01-28*  
*Status: Canonical Specification*  
*Version: 1.0.0*
