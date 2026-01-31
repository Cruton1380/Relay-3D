# 🔐 Privacy Ladder — Distance-Based Fidelity & Permission-Based Disclosure

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## Core Principle

> **Privacy like real life: distance controls fidelity, permission controls whether it exists for you at all.**

In Relay, every filament has a **visibility policy** that answers two separate questions:

1. **Discoverability**: Can you even know it exists?
2. **Fidelity**: If it exists to you, what resolution do you see at this distance?

**Critical Rule:**
> Distance never upgrades you past what policy allows.

---

## Table of Contents

1. [The Two Questions](#the-two-questions)
2. [The 7 Privacy Levels](#the-7-privacy-levels)
3. [Visibility vs Fidelity Matrix](#visibility-vs-fidelity-matrix)
4. [Default Policies by Filament Type](#default-policies-by-filament-type)
5. [Search Visibility Rules](#search-visibility-rules)
6. [Engagement Rules](#engagement-rules)
7. [Implementation Guide](#implementation-guide)
8. [Real-World Scenarios](#real-world-scenarios)
9. [Policy Configuration](#policy-configuration)
10. [FAQ](#faq)

---

## The Two Questions

### Question 1: Discoverability (Binary)

**"Can you even know it exists?"**

**Answers:**
- ❌ **No**: Filament is completely invisible (Level 0)
- ✅ **Yes**: Filament exists in your view (Levels 1-6), but fidelity depends on distance + permission

**Governed by:** `filament.policy.discoverability`

---

### Question 2: Fidelity (Graduated)

**"If it exists to you, what resolution do you see at this distance?"**

**Answers:**
- **Far**: Only coarse "master idea" or anonymous mass
- **Mid**: Boxes (structure) and types (categories)
- **Near**: Blurred projections (system visible, data hidden)
- **Close + Permission**: Clear screens, 2D interaction, editing

**Governed by:** `filament.policy.fidelityLadder` + `viewer.distance` + `viewer.permissions`

---

## The 7 Privacy Levels

| Level | Name | Discoverability | Branch Visibility | File Types | Screens | 2D Interaction | Engage | Search |
|-------|------|-----------------|-------------------|------------|---------|----------------|--------|--------|
| **0** | Invisible | ❌ No | None | None | None | ❌ | ❌ | ❌ |
| **1** | Master Idea | ⚠️ Coarse only | None | None | None | ❌ | ❌ | ⚠️ Category only |
| **2** | Boxes Only | ✅ | Anonymous structure | ❌ | None | ❌ | ❌ | ❌ |
| **3** | Types Only | ✅ | Structure + unnamed forks | ✅ Icons/tags | None | ❌ | ❌ | ⚠️ Type discovery |
| **4** | Blurred Projections | ✅ | Named branches | ✅ | ⚠️ Redacted | ❌ | ❌ | ⚠️ Metadata only |
| **5** | Clear Projections | ✅ | Full visibility | ✅ | ✅ Clear | ✅ Read-only | ❌ | ✅ Content search |
| **6** | Engage | ✅ | Full visibility | ✅ | ✅ Clear | ✅ Full | ✅ Edit | ✅ Full search |

---

### Level 0: Invisible

**What You See:** Nothing. Absolutely nothing.

**Details:**
- Filament doesn't exist in your render
- No branches, no boxes, no evidence of activity
- No contribution to "master ideas" (except maybe anonymized aggregates if policy explicitly allows)
- **Does not appear in global search**

**Use Cases:**
- Personal journal filaments
- Private medical records
- Classified documents
- Draft proposals before public review

---

### Level 1: Master Idea Only (Existence Without Structure)

**What You See:** A single coarse presence indicator.

**Examples:**
- "Private activity exists here"
- "Topic mass: Budget discussions"
- Anonymous aggregate count: "N participants"

**Details:**
- No branch count
- No file types
- No boxes or TimeBoxes
- **Search**: Maybe category-level counts ("N private items") if policy allows
- **Renders as**: Fuzzy sphere or generic "presence blob"

**Use Cases:**
- Org-wide activity indicators without revealing details
- Research topic areas without exposing specific projects
- Community engagement metrics without individual tracking

---

### Level 2: Boxes Only (Structure Without Meaning)

**What You See:** Anonymous TimeBoxes and filament spine.

**Details:**
- You can see that **structure exists** (filament has commits)
- TimeBoxes are rendered but unlabeled/unnamed
- Branches: Either hidden OR shown only as "divergence happened" (no info about where it goes)
- **File types**: ❌ Not visible
- **Search**: ❌ Not searchable

**Renders as:**
- Gray/neutral boxes along a spine
- Maybe commit count visible
- Maybe "activity pulse" (something changed recently)

**Use Cases:**
- Showing "work is happening" without revealing what
- Structural audit without content exposure
- Demonstrating activity patterns without compromising privacy

---

### Level 3: Types Only (Meaning Class Without Content)

**What You See:** Artifact class icons/tags.

**Examples:**
- 📊 "Spreadsheet"
- 🎥 "Video"
- 🎮 "3D Scene"
- 🤖 "Model Run"
- 📜 "Policy"

**Details:**
- Still no names, no values, no evidence pointers
- Branches: You may see multiple strands but unnamed (just "forked")
- **Search**: Maybe "type discovery" mode (results are anonymized: "A spreadsheet exists in this cluster")

**Renders as:**
- Colored/typed boxes with icons
- Branch structure visible
- No text labels on commits

**Use Cases:**
- Portfolio showcasing ("I work with spreadsheets, 3D, and video")
- Resource discovery ("Who in this org uses 3D tools?")
- Infrastructure mapping without exposing configs

---

### Level 4: Blurred Projections (Screens With Redaction)

**What You See:** Screens/panels, but with:
- **Blurred values**
- **Hidden identifiers**
- **Masked evidence pointers**

**Details:**
- You can infer "what system" but not "what data"
- Example: Excel sheet visible, but cell values blurred
- Example: 3D viewport visible, but mesh is silhouette only
- **Search**: Maybe inside shared group, labels/metadata only (not content)

**Renders as:**
- Gaussian blur over projection surfaces
- Wireframe/outline rendering for 3D
- Color blocks instead of text for spreadsheets

**Use Cases:**
- Demonstrating workflow without revealing sensitive data
- Training/onboarding (show the interface, not the data)
- Auditing tool usage without compromising privacy

---

### Level 5: Clear Projections (Readable 2D Allowed)

**What You See:** Full clarity.

**Details:**
- You can open the 2D projection (Excel-like, timeline, canvas, etc.) and **read**
- You can see evidence pointers allowed by policy
- **Search**: Yes, but only inside authorized scope (team/org/channel)
- Search limited to what policy allows (title/metadata vs full content)

**Interaction:**
- ✅ **Read-only 2D**
- ❌ **Cannot edit** (requires Level 6)

**Renders as:**
- Normal, clear projection
- All labels, values, evidence visible
- Zoom/pan/inspect works

**Use Cases:**
- Shared team dashboards
- Published reports
- Community-visible proposals
- Public KPI filaments

---

### Level 6: Engage (Edit/Commit Allowed)

**What You See:** Everything + edit controls.

**Details:**
- You can interact with the 2D surface:
  - Select cell/element
  - Type/modify values
  - Run transforms
- **Edits append commits** (never mutate)
- **Presence "locks on"** to engaged locus (others see active engagement)
- **Search**: Yes, plus "edit navigation" (jump to loci you have rights to edit)

**Interaction:**
- ✅ **Full 2D editing**
- ✅ **Commit creation**
- ✅ **Formula/script editing**

**Renders as:**
- Normal projection + edit UI (cursors, selection highlights, tools)
- Your presence marker shows "actively editing"

**Use Cases:**
- Team members with write access
- Designated editors/maintainers
- Authorized contributors

---

## Visibility vs Fidelity Matrix

### How Distance & Permission Interact

```
Your Permission Level (Policy Ceiling):
  │
  │  L0    L1    L2    L3    L4    L5    L6
  │  ═══   ═══   ═══   ═══   ═══   ═══   ═══
  │
Far   │  None  Mass  Boxes Boxes Boxes Boxes Boxes
  │
Mid   │  None  Mass  Boxes Types Types Types Types
  │
Near  │  None  Mass  Boxes Types Blur  Clear Clear
  │
Close │  None  Mass  Boxes Types Blur  Clear Engage
```

**Key Insight:**
> Even standing "on" the filament, if your permission is L1, you only see "mass."  
> Distance can **raise fidelity** but **never past your permission ceiling**.

---

## Default Policies by Filament Type

| Filament Type | Default Policy | Rationale |
|---------------|----------------|-----------|
| **Personal (User Sphere)** | L0 (Invisible) | Privacy by default |
| **Team Workspace** | L5 (Clear, team-scoped) | Collaboration |
| **KPI (Org-shared)** | L5 (Clear, read-only) | Transparency |
| **Infrastructure** | L0-L2 (Hidden or boxes only) | Prevents surveillance of SRE work |
| **Governance Proposal** | L3-L5 (Types → Clear) | Public review |
| **Published Game** | L5-L6 (Clear + engage for contributors) | Open development |
| **Proximity Channel** | L1-L3 (Mass → Types) | Range-based discovery |

**Policy Changes:**
- Require commit (governance)
- Visible in audit trail
- Can be voted on (for org/team filaments)

---

## Search Visibility Rules

### Global Search Returns

| Policy Level | Global Search Behavior |
|--------------|------------------------|
| **L0-L2** | ❌ Does not appear |
| **L3** | ⚠️ Optional "type-only" discovery (no content) |
| **L4** | ⚠️ Usually no (unless shared metadata allowed) |
| **L5-L6** | ✅ Yes, inside allowed scopes |

### Search Scope

**Level 5-6 search is scoped by:**
- **Team/Org membership**
- **Channel participation**
- **Geographic proximity** (for proximity channels)
- **Explicit sharing** (via link/invite)

**Never:** Global unrestricted search unless filament is explicitly marked "public discoverable"

---

## Engagement Rules

### EngageSurface Permission

To **engage** (Level 6), you need:

1. **Policy ceiling ≥ L6** (filament allows engagement)
2. **EngageSurface permission** (you're authorized to edit)
3. **Proximity or membership** (physical/logical access)
4. **Locus lock** (no conflicting active edit session)

### Engagement Flow

```
User approaches filament with L6 permission:
  ↓
User clicks "Engage" or approaches 2D surface closely
  ↓
System checks:
  - Is someone else actively editing this locus?
  - Does user have EngageSurface permission?
  ↓
If PASS → User locks onto locus (presence shows "editing")
  ↓
User edits → Creates commits → Locus unlocks on exit
```

### Locking Behavior

**Soft Lock (Default):**
- Others can see you're editing
- Others can still view (read-only)
- Others cannot edit same locus simultaneously

**Hard Lock (Optional):**
- Others cannot even view the locus while you're editing
- Used for sensitive/high-stakes edits

**No Lock (Dangerous):**
- Multiple users can edit simultaneously
- Commits are sequential (last one wins or creates conflict/SCAR)
- Only for specific collaborative scenarios

---

## Implementation Guide

### Data Model

```typescript
interface FilamentVisibilityPolicy {
  policyLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  
  // Discoverability
  globalSearchable: boolean;
  categorySearchable: boolean;  // L3 only
  
  // Fidelity by distance
  fidelityLadder: {
    far: 'none' | 'mass' | 'boxes';
    mid: 'none' | 'mass' | 'boxes' | 'types';
    near: 'none' | 'mass' | 'boxes' | 'types' | 'blur' | 'clear';
    close: 'none' | 'mass' | 'boxes' | 'types' | 'blur' | 'clear' | 'engage';
  };
  
  // Engagement
  engageSurfaceAllowed: boolean;
  lockingMode: 'soft' | 'hard' | 'none';
  
  // Scope
  scopeType: 'public' | 'org' | 'team' | 'group' | 'private';
  scopeIds?: string[];  // Org/team/group IDs if scoped
}

interface ViewerContext {
  userId: string;
  permissions: string[];  // ['view', 'edit', 'moderate', ...]
  distance: 'far' | 'mid' | 'near' | 'close';
  memberOf: string[];  // Org/team/group IDs
}

function resolveVisibility(
  policy: FilamentVisibilityPolicy,
  viewer: ViewerContext
): ResolvedVisibility {
  // 1. Check discoverability (binary)
  if (policy.policyLevel === 0) {
    return { visible: false };
  }
  
  // 2. Check scope membership
  if (policy.scopeType !== 'public') {
    const hasAccess = viewer.memberOf.some(id => policy.scopeIds?.includes(id));
    if (!hasAccess) {
      return { visible: false };
    }
  }
  
  // 3. Resolve fidelity by distance
  const fidelity = policy.fidelityLadder[viewer.distance];
  
  // 4. Cap by policy level
  const maxFidelity = policyLevelToMaxFidelity(policy.policyLevel);
  const actualFidelity = Math.min(fidelityToNumber(fidelity), maxFidelity);
  
  return {
    visible: true,
    fidelity: numberToFidelity(actualFidelity),
    canEngage: policy.engageSurfaceAllowed && viewer.permissions.includes('edit')
  };
}
```

---

### Rendering Logic

```typescript
function renderFilament(
  filament: Filament,
  viewer: ViewerContext
): React.Element {
  const visibility = resolveVisibility(filament.policy, viewer);
  
  if (!visibility.visible) {
    return null;  // Don't render at all
  }
  
  switch (visibility.fidelity) {
    case 'mass':
      return <MassIndicator filament={filament} />;
    
    case 'boxes':
      return <AnonymousTimeBoxes filament={filament} />;
    
    case 'types':
      return <TypedTimeBoxes filament={filament} showIcons />;
    
    case 'blur':
      return <BlurredProjection filament={filament} />;
    
    case 'clear':
      return <ClearProjection filament={filament} readOnly={!visibility.canEngage} />;
    
    case 'engage':
      return <EditableProjection filament={filament} onEngage={handleEngage} />;
    
    default:
      return null;
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Personal Journal (L0)

**Context:** Alice keeps a personal journal as a filament.

**Policy:**
```typescript
{
  policyLevel: 0,
  globalSearchable: false,
  scopeType: 'private',
  scopeIds: ['user:alice']
}
```

**What Others See:**
- **Far/Mid/Near/Close**: Nothing. Filament doesn't exist.
- **Search**: Does not appear in any search.

---

### Scenario 2: Team Dashboard (L5)

**Context:** Finance team shares a budget dashboard.

**Policy:**
```typescript
{
  policyLevel: 5,
  globalSearchable: false,
  fidelityLadder: {
    far: 'boxes',
    mid: 'types',
    near: 'clear',
    close: 'clear'
  },
  scopeType: 'team',
  scopeIds: ['team:finance']
}
```

**What Finance Team Sees:**
- **Far**: Anonymous boxes (structure visible)
- **Mid**: Typed boxes (📊 Spreadsheet)
- **Near/Close**: Clear, readable dashboard

**What Others See:**
- Nothing (not in scope)

---

### Scenario 3: Public KPI (L5, Public)

**Context:** City publishes monthly budget KPI.

**Policy:**
```typescript
{
  policyLevel: 5,
  globalSearchable: true,
  fidelityLadder: {
    far: 'mass',
    mid: 'types',
    near: 'clear',
    close: 'clear'
  },
  scopeType: 'public'
}
```

**What Everyone Sees:**
- **Far**: "Budget activity" mass
- **Mid**: 📊 KPI indicator
- **Near/Close**: Clear, readable KPI value + history

**Search:** Yes, appears in global search

---

### Scenario 4: Infrastructure Config (L2)

**Context:** SRE team manages database configs.

**Policy:**
```typescript
{
  policyLevel: 2,
  globalSearchable: false,
  fidelityLadder: {
    far: 'none',
    mid: 'boxes',
    near: 'boxes',
    close: 'boxes'
  },
  scopeType: 'team',
  scopeIds: ['team:sre']
}
```

**What SRE Team Sees:**
- **All distances**: Anonymous boxes (structure only)

**What Others See:**
- Nothing (not in scope)

**Why:** Prevents surveillance of SRE work while allowing SRE to see activity patterns.

---

### Scenario 5: Draft Proposal (L3 → L5)

**Context:** Alice drafts a governance proposal, then publishes.

**Initial Policy (Draft):**
```typescript
{
  policyLevel: 3,  // Types only
  scopeType: 'private',
  scopeIds: ['user:alice']
}
```

**Published Policy:**
```typescript
{
  policyLevel: 5,  // Clear projections
  globalSearchable: true,
  scopeType: 'public'
}
```

**Transition:**
- **Before publish**: Only Alice sees it
- **After publish**: Everyone can read (clear), search finds it

---

## Policy Configuration

### Setting Policy (Governance)

**For Personal Filaments:**
- User sets policy directly (sovereignty)

**For Org/Team Filaments:**
- Requires commit (policy change is auditable)
- May require vote (if governance rules demand)

**Policy Change Commit:**
```typescript
{
  commit_class: 'POLICY_CHANGE',
  filamentId: 'kpi:revenue',
  policy: {
    before: { policyLevel: 3 },
    after: { policyLevel: 5 }
  },
  actor: 'user:dept-head',
  evidence: {
    type: 'governance-vote',
    proposalId: 'prop:123',
    approvalVotes: 15,
    threshold: 10
  }
}
```

---

### Policy Inheritance

**Rule:** Branches inherit parent policy by default, but can override.

**Example:**
```
Main branch: L5 (public)
  ↓ SPLIT
Experimental branch: L2 (boxes only, team-scoped)
```

---

## FAQ

### General

**Q: Can I make a filament public after it was private?**  
A: Yes, via policy change commit. But: once public, consider it irreversible (others may have cloned/cached).

**Q: What if I want different people to see different levels?**  
A: Use **scoped policies**. Example: Team sees L5, public sees L3.

**Q: Can I change fidelity ladder without changing policy level?**  
A: Yes. Policy level is the **ceiling**, but ladder can be adjusted within that ceiling.

---

### Distance

**Q: How is "distance" calculated?**  
A: Camera distance in 3D space (globe/workflow views). For 2D views (spreadsheet), "distance" is metaphorical (focused cell = close).

**Q: Can I force a filament to always show clear (even when far)?**  
A: Yes, set all ladder values to 'clear'. But: performance cost (renders everything in full detail).

**Q: What if I zoom in but still don't have permission?**  
A: You see the maximum fidelity your **policy ceiling** allows. Zooming doesn't grant permission.

---

### Engagement

**Q: Can multiple people engage the same filament?**  
A: Yes, but they lock onto **different loci** (different cells, different commits, etc.). Same locus = conflict.

**Q: What happens if two people try to edit the same cell?**  
A: First one gets lock. Second one sees "locked by Alice" and must wait or fork.

**Q: Can I engage a blurred projection?**  
A: No. Engagement requires L6 (clear + edit permission).

---

### Search

**Q: If a filament is L5 but team-scoped, does it appear in my search?**  
A: Only if you're in that team.

**Q: Can I search for L3 (types only) filaments?**  
A: Maybe. L3 allows "type discovery" mode (search returns "A spreadsheet exists" but not the actual filament).

**Q: What about full-text search inside filaments?**  
A: Only at L5+, and only if policy allows content search (not just metadata).

---

## Conclusion

The **Privacy Ladder** ensures:
- ✅ **Privacy like real life** (distance = fidelity, permission = existence)
- ✅ **No fake content** (if you can't see it, you see nothing or abstract placeholders)
- ✅ **Graduated disclosure** (7 levels from invisible to fully engaged)
- ✅ **Auditable policy changes** (every visibility change is a commit)
- ✅ **Flexible scoping** (public, org, team, group, private)

By treating visibility as a **lens property** (not truth), Relay enables rich, graduated privacy without compromising the substrate.

---

**See Also:**
- [Engage Surface Spec](ENGAGE-SURFACE-SPEC.md) (2D interaction locking)
- [Presence + Permission Model](PRESENCE-PERMISSION-MODEL.md) (Who sees presence at which level)
- [User Sphere Model](USER-SPHERE-MODEL.md) (Personal filament projection)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
