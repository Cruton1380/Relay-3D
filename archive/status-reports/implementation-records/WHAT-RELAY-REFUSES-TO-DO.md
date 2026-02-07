# ❌ WHAT RELAY REFUSES TO DO

**Version**: 1.0.0  
**Status**: Non-Negotiable Refusals  
**Last Updated**: 2026-01-28

---

## Purpose

This document **protects Relay** more than any code.

It lists what Relay **will never do**, no matter how profitable, popular, or convenient it might be.

**If a feature violates any of these refusals, it must not be built.**

---

## The Ten Refusals

### 1. ❌ NO RANKING WITHOUT EXPLICIT USER CONTROL

**We refuse to:**
- Rank content algorithmically without user permission
- Sort feeds by "engagement" without explicit opt-in
- Boost posts invisibly
- Suppress posts silently
- Recommend content based on inferred preferences

**Why:**
- Ranking is manipulation
- Users must control their view
- "The algorithm decided" is not acceptable

**What we do instead:**
- Users choose sort mode (chronological, proximity, engagement)
- Every feed item shows causality ("You see this because...")
- No invisible boosting
- Subscriptions + proximity + consent = discovery

---

### 2. ❌ NO INFERENCE OF INTENT

**We refuse to:**
- Predict what users want
- Infer relationships from behavior
- Assume intimacy from frequency
- Calculate relevance from engagement
- Recommend friends based on network analysis

**Why:**
- Inference is coercion
- Behavior ≠ desire
- Systems should ask, not assume

**What we do instead:**
- Users declare intent explicitly
- Relationships are commits, not metrics
- Recommendations are proposals (AI), not authority
- "I didn't choose this" is never true

---

### 3. ❌ NO SILENT AGGREGATION

**We refuse to:**
- Aggregate data without traceable sources
- Compute metrics without showing evidence
- Hide how totals are calculated
- Present statistics as truth without derivation

**Why:**
- Aggregation hides causality
- Metrics without evidence are manipulation
- "Trust the number" is not acceptable

**What we do instead:**
- Every metric traceable to commits
- Click any number → see source filaments
- Replay commits → see how total evolved
- No "black box" calculations

---

### 4. ❌ NO HIDDEN BOOSTS

**We refuse to:**
- Amplify content invisibly
- Promote posts without disclosure
- Give preferential treatment based on engagement
- Rank users by hidden scores

**Why:**
- Hidden boosts are deception
- Organic ≠ promoted
- Users deserve truth

**What we do instead:**
- All promotion is disclosed
- "Sponsored" or "Boosted" labels required
- No preferential treatment without consent
- Causality always visible

---

### 5. ❌ NO BEHAVIORAL PREDICTION

**We refuse to:**
- Predict user actions
- Train models on user behavior without consent
- Use behavior to influence future behavior
- Create "engagement loops"

**Why:**
- Prediction enables manipulation
- Feedback loops are addiction by design
- Users should act freely, not be nudged

**What we do instead:**
- AI proposes, users decide
- No "next post" designed to keep scrolling
- No infinite scroll (pagination only)
- No "recommended for you" without explicit opt-in

---

### 6. ❌ NO DARK PATTERNS

**We refuse to:**
- Make opt-out harder than opt-in
- Hide privacy settings
- Use confusing language to manipulate consent
- Pre-select invasive options
- Make leaving difficult

**Why:**
- Dark patterns are manipulation
- Consent must be informed and easy
- "I didn't know" means we failed

**What we do instead:**
- Opt-in is default (not opt-out)
- Privacy settings prominent
- Clear language always
- Leaving is one-click + data export

---

### 7. ❌ NO IMPLICIT ESCALATION

**We refuse to:**
- Escalate trust automatically
- Increase visibility without consent
- Grant authority based on usage
- Assume intimacy from frequency

**Why:**
- Implicit escalation is coercion
- Every step requires choice
- "I didn't agree to this" is never true

**What we do instead:**
- Every escalation is a commit
- Gates required for authority changes
- Consent is explicit, not inferred
- Reversible always

---

### 8. ❌ NO SURVEILLANCE

**We refuse to:**
- Track users without their knowledge
- Build shadow profiles
- Infer social graphs
- Correlate activity across contexts
- Sell user data

**Why:**
- Surveillance is violence
- Privacy is a right, not a feature
- "We know what you did" is not acceptable

**What we do instead:**
- Beacons are anonymous + ephemeral
- No persistent IDs (rotate every 30s)
- No tracking across contexts
- Proximity is local only (Bluetooth LE)
- No data sales, ever

---

### 9. ❌ NO FORCED CONSENSUS

**We refuse to:**
- Require agreement to participate
- Force reconciliation of forks
- Use majority rule to silence minority
- Make compliance cheaper than disagreement

**Why:**
- Forced consensus is authoritarianism
- Disagreement is legitimate
- Forks are geometry, not failure

**What we do instead:**
- Forking is always allowed
- Both branches remain inspectable
- Reconciliation is optional
- Disagreement costs less than compliance

---

### 10. ❌ NO ERASURE

**We refuse to:**
- Delete history
- Remove evidence
- Erase records
- Rewrite the past

**Why:**
- Erasure enables abuse
- Justice requires history
- "It never happened" is dangerous

**What we do instead:**
- Deletion = visibility change (L6 → L0)
- History preserved for safety/audit
- Evidence auditable to participants
- Takedowns are policy changes, not erasure

---

## What This Means for Features

### If a feature request requires ANY of these refusals, the answer is NO.

**Examples of features we will NEVER build:**

- ❌ "Trending" based on global engagement (violates #1, #3)
- ❌ "People you may know" based on network analysis (violates #2)
- ❌ "Recommended for you" based on behavior (violates #5)
- ❌ "Promoted posts" without explicit labels (violates #4)
- ❌ "Suggested responses" that nudge behavior (violates #5)
- ❌ Hidden "spam score" that affects visibility (violates #3, #8)
- ❌ Auto-follow based on interests (violates #2, #7)
- ❌ Engagement optimization (violates #5)
- ❌ A/B testing of feeds (violates #1, #5)
- ❌ Shadow banning (violates #9, #10)

---

## What This Means for Business

### These refusals make certain business models impossible.

**We cannot:**
- ❌ Sell user attention (requires behavioral prediction)
- ❌ Sell targeted ads (requires surveillance)
- ❌ Optimize for engagement (requires dark patterns)
- ❌ Build growth loops (requires addiction mechanics)

**We can:**
- ✅ Charge for storage (filaments as service)
- ✅ Charge for compute (presence, proximity, AI)
- ✅ Charge for features (premium lenses, tools)
- ✅ Charge organizations (enterprise governance)

**Business model must align with user interest, not conflict with it.**

---

## How to Test Compliance

### For any feature, ask:

1. **Does this require inference?**
   - If yes → violates #2
   - Fix: Make it explicit

2. **Does this hide causality?**
   - If yes → violates #3
   - Fix: Show source filaments

3. **Does this nudge behavior?**
   - If yes → violates #5
   - Fix: Remove nudge, let user decide

4. **Does this escalate implicitly?**
   - If yes → violates #7
   - Fix: Require explicit commit

5. **Does this track users?**
   - If yes → violates #8
   - Fix: Make it local + ephemeral

6. **Does this force consensus?**
   - If yes → violates #9
   - Fix: Allow forking

7. **Does this erase history?**
   - If yes → violates #10
   - Fix: Change visibility, not data

**If any answer is "yes", the feature must be redesigned or rejected.**

---

## Exceptions (None)

**There are NO exceptions to these refusals.**

**Not for:**
- Growth
- Revenue
- Convenience
- Competition
- User requests (if they conflict)

**These refusals are non-negotiable.**

---

## Enforcement

### Internal Review

**Before shipping any feature:**
1. Review against these 10 refusals
2. If any conflict → reject or redesign
3. Document decision in commit message

### External Accountability

**This document is public.**

Users can hold us accountable.

If we violate these refusals:
- Users can fork Relay (it's open)
- Users can leave (data export is easy)
- Users can sue (contracts reference this doc)

**We publish violations publicly if they occur.**

---

## Why This Document Exists

**Systems decay over time.**

**Pressure to:**
- Optimize engagement
- Maximize growth
- Monetize attention
- Capture users

**This document is the counterforce.**

**It says:**

"We will not manipulate you, even if it's profitable."

"We will not coerce you, even if it's convenient."

"We will not surveil you, even if others do."

**This is the line we will not cross.**

---

## Comparison to Other Systems

| **System** | **Ranking** | **Inference** | **Surveillance** | **Erasure** |
|------------|-------------|---------------|------------------|-------------|
| Facebook | ✅ Algorithmic | ✅ Heavy | ✅ Shadow profiles | ✅ Invisible deletions |
| Twitter/X | ✅ "For You" | ✅ Recommendations | ✅ Tracking | ✅ Shadow bans |
| Instagram | ✅ Engagement | ✅ "Suggested" | ✅ Cross-platform | ✅ No audit trail |
| LinkedIn | ✅ "Top Posts" | ✅ Network analysis | ✅ Tracking | ✅ Hidden moderation |
| TikTok | ✅ Highly algorithmic | ✅ Behavior-driven | ✅ Extensive | ✅ Opaque |
| **Relay** | ❌ User-controlled | ❌ Explicit only | ❌ Local + ephemeral | ❌ Visibility change |

**Relay is different by design.**

---

## Final Statement

**These refusals define Relay.**

**Without them, Relay is just another social network.**

**With them, Relay is a coordination substrate humans can trust.**

**This document is permanent.**

**It cannot be changed without consensus of all stakeholders (users included).**

**This is the line.**

---

*Last Updated: 2026-01-28*  
*Status: Non-Negotiable Forever*  
*Version: 1.0.0*
