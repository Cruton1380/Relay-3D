# Relay AI Value Proposition

**How Relay Transforms AI from Chat Blob to Managed Labor**

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** CANONICAL EXPLAINER

---

## THE PROBLEM

**Current State of AI:**
- AI produces responses as one-off text blobs
- Reasoning is invisible and unauditable
- No parallelization or scheduling
- Prompts are vibes, not versioned artifacts
- Claims lack explicit evidence
- No authority model (AI "just does" things)
- Output inspection = scrolling chat
- Work is unreusable (must repeat everything)

**Result:** AI is fast but untrustworthy, creative but uncontrollable, helpful but chaotic.

---

## THE RELAY SOLUTION

**Relay turns AI from "a single answer generator" into:**

> **A coordinated workforce that produces audited, replayable, authority-gated work products.**

This gives you:
- ✅ **Speed AND trust**
- ✅ **Creativity AND control**
- ✅ **Scale without drift**

---

## HOW RELAY IMPROVES AI (7 CONCRETE MECHANISMS)

### 1. No More Invisible Reasoning

**Problem:** AI can "arrive" at an answer with no trace you can audit.

**Relay Solution:**  
Every meaningful AI step becomes a **commit event** on a filament:

```json
{
  "ref": "work.W123@c12",
  "type": "AI_REASONING_STEP",
  "timestamp": "2026-01-28T14:30:00Z",
  "authorUnitRef": "unit.ai.agent.002",
  "payload": {
    "reasoningStep": "Analyzed user requirements → identified 3 constraints",
    "output": "Constraints: must be SQL-compatible, < 100ms latency, versioned schema"
  },
  "causalRefs": {
    "inputs": ["conversation.user.001@c5"],
    "evidence": ["evidence.E45", "evidence.E46"],
    "authorityRef": "auth.ai.reasoning"
  }
}
```

**What you get:**
- ✅ Full audit trail of AI reasoning
- ✅ Can replay how AI got to answer
- ✅ Can catch errors fast (which input was wrong?)
- ✅ Evidence refs are explicit (not buried in prose)

**Example:**
```
User: "Why did the AI choose PostgreSQL?"
→ Inspect work.W123@c12 (time cube)
→ See Inputs face: ["requirement: SQL-compatible", "requirement: <100ms latency"]
→ See Evidence face: ["PostgreSQL benchmarks doc", "Schema versioning guide"]
→ See Operation face: "Database selection reasoning"
→ Answer is auditable, not mysterious
```

---

### 2. AI Becomes Parallel and Schedulable (SCVs)

**Problem:** One big agent doing everything in one chat = bottleneck + chaos.

**Relay Solution:**  
AI becomes many **SCV agents**, each with:
- A task filament (work.*)
- Clear scope (what it can touch)
- Visible state (Idle | Moving | Working | Blocked | Awaiting Authority)

**Architecture:**
```
conversation.user.001 (user's main chat)
  ↓ TASK_ASSIGN
├─ unit.ai.agent.001 → work.W123 (implement auth module)
├─ unit.ai.agent.002 → work.W124 (write tests)
└─ unit.ai.agent.003 → work.W125 (review docs)

All running in parallel.
All visible in globe world.
All independently cancelable.
```

**What you get:**
- ✅ Parallel AI work (3 agents = 3x throughput)
- ✅ Scheduling (assign tasks explicitly, not implicit)
- ✅ Visible idling (see which agent is wasting compute)
- ✅ Cancellation (forensic destruction, not silent failure)
- ✅ Scope enforcement (agent can't touch files outside scope)

**Example:**
```
Manager SCV assigns:
  - Agent A: "Implement auth" (scope: backend/auth/*)
  - Agent B: "Write tests" (scope: backend/auth/tests/*)
  - Agent C: "Update docs" (scope: docs/*)

Globe world shows:
  - Agent A: Working (attached to work.W123)
  - Agent B: Working (attached to work.W124)
  - Agent C: Blocked (awaiting Agent A completion)

User can:
  - See all 3 agents as SCVs in world
  - Cancel Agent C if not needed
  - Reassign Agent B to different task
```

---

### 3. Prompts Become Artifacts, Not Vibes

**Problem:** Prompts are vibes. Best prompts get lost. Outputs drift over time.

**Relay Solution:**  
Prompts are **first-class filaments** with versioning, branching, merging, and snapshots.

**Prompt Lifecycle:**
```
1. Create: prompt.P1@c1 (raw text)
2. Edit: prompt.P1@c2, c3, c4 (versioned iterations)
3. Branch Twice: prompt.P1@branch/A, prompt.P1@branch/B (parallel experiments)
4. Merge: prompt.P1@merge/M1 (best of both branches)
5. Compile: prompt.P1@compiled.v5 (ready for execution)
6. Snapshot: snapshot.S3 (save "this is the good one")
```

**What you get:**
- ✅ Versioned prompt history (never lose good prompts)
- ✅ Branch-twice-merge pattern (parallel prompt development)
- ✅ Snapshots (capture "prompts we liked")
- ✅ Compiled prompt artifacts (deterministic execution)
- ✅ Upgrades are proposals (not silent overwrites)

**Example:**
```
User: "The AI output quality dropped. What changed?"
→ Inspect prompt.P1 history
→ See: c42 changed system prompt from "be concise" to "be thorough"
→ Restore snapshot.S8 (last known good prompt)
→ Quality returns
```

---

### 4. Better Reliability Through Explicit Evidence

**Problem:** AI claims things without proof. Hallucinations are invisible until damage is done.

**Relay Solution:**  
**Evidence refs are mandatory** for truth-changing commits.

**Without Evidence (Blocked):**
```json
{
  "type": "AI_CLAIM",
  "payload": {
    "claim": "The API supports OAuth2"
  },
  "causalRefs": {
    "evidence": []  // ❌ Empty
  }
}
→ Verification: FAIL
→ Commit rejected: "Missing evidence for claim"
```

**With Evidence (Accepted):**
```json
{
  "type": "AI_CLAIM",
  "payload": {
    "claim": "The API supports OAuth2"
  },
  "causalRefs": {
    "evidence": [
      "evidence.E45",  // API documentation, page 12
      "evidence.E46"   // OAuth2 implementation test
    ]
  }
}
→ Verification: PASS
→ Commit accepted
```

**What you get:**
- ✅ Claims without evidence are **visually incomplete** (red flag in UI)
- ✅ Inspect Evidence face on time cube (see exactly what AI cited)
- ✅ Downstream decisions can require "evidence present" policies
- ✅ Hallucinations reduced by design (can't commit without refs)

**Example:**
```
AI: "The database supports JSON columns."
User: *inspects time cube*
→ Evidence face: [PostgreSQL JSON docs, example query]
→ User clicks evidence.E45 → sees actual PostgreSQL doc
→ Claim is verifiable, not mysterious
```

---

### 5. Authority and Permissions Stop AI from Doing the Wrong Thing

**Problem:** AI "helps" by doing things it shouldn't (e.g., deletes files, changes configs).

**Relay Solution:**  
**authorityRef is mandatory** for truth-changing actions.

**Without Authority (Blocked):**
```json
{
  "type": "FILE_DELETE",
  "payload": {
    "filePath": "production.config"
  },
  "causalRefs": {
    "authorityRef": null  // ❌ Missing
  }
}
→ Authority validation: FAIL
→ Action blocked: "Missing capability: file.delete"
→ Command Card: Button absent (not just disabled)
```

**With Authority (Allowed):**
```json
{
  "type": "FILE_DELETE",
  "payload": {
    "filePath": "temp/cache.txt"
  },
  "causalRefs": {
    "authorityRef": "auth.ai.cleanup@d5"
  }
}
→ Authority validation: PASS (AI has cleanup capability)
→ Action proceeds
```

**What you get:**
- ✅ AI can **propose** changes (always allowed)
- ✅ AI **cannot "just do it"** (requires authorityRef)
- ✅ AI **cannot bypass policy invisibly** (audit trail shows authority source)
- ✅ User sees "why blocked" (missing capability: X)

**Example:**
```
AI: "I'll delete those old log files."
→ Attempts FILE_DELETE commit
→ Authority validation: FAIL (AI lacks file.delete capability)
→ HUD shows: "Blocked: missing capability file.delete"
→ User can delegate authority OR manually approve OR deny
→ AI never silently deletes files
```

---

### 6. Inspection Becomes Physical (Time Cubes)

**Problem:** Inspecting AI output = scrolling chat. No structure. No context.

**Relay Solution:**  
AI outputs are **time cubes** (6-face commit events) that you can physically inspect.

**Time Cube Faces (LOCKED):**
```
        [ Top: Time ]
        commitIndex: 42
        timestamp: 2026-01-28T14:30:00Z

[ Left: Authority ]       [ Front: Operation ]       [ Right: Evidence ]
authorityRef:             type: AI_REASONING         evidence.E45
auth.ai.reasoning         "Analyzed requirements"    evidence.E46

        [ Bottom: Integrity ]
        hash: 0x3f2a...
        verification: PASS

        [ Back: Inputs ]
        conversation.user.001@c5
        work.W122@c8
```

**Interaction:**
1. Double-click time cube → **Forensic Inspection Mode**
2. Cube floats in isolated chamber
3. Rotate cube to see faces
4. Click face → expand details
5. Click `[Unfold Faces]` → 2D cross-shaped net

**What you get:**
- ✅ Structured inspection (not scrolling chat)
- ✅ All context visible (inputs, evidence, authority, operation, time, integrity)
- ✅ Physical manipulation (rotate, zoom, unfold)
- ✅ Diff overlay (compare AI reasoning steps)
- ✅ Snapshot inspection (return to exact view later)

**Example:**
```
User: "Why did AI suggest this architecture?"
→ Double-click work.W123@c42 (time cube)
→ Front face: "Microservices architecture recommendation"
→ Back face (Inputs): ["user requirements", "team size: 5", "budget constraints"]
→ Right face (Evidence): ["microservices guide", "team scalability research"]
→ Left face (Authority): auth.ai.architecture
→ All reasoning visible and auditable
```

---

### 7. You Can Reuse Work Instead of Repeating It

**Problem:** Every AI request starts from zero. Must repeat context every time.

**Relay Solution:**  
Everything is **filaments + commits**, enabling:

**A) Caching Verified Results**
```
work.W123@c12 (AI analyzed requirements)
→ Verification: PASS
→ Cache result: "3 constraints identified"
→ Next request: Reuse cached analysis (skip re-analysis)
```

**B) Deterministic Re-Runs**
```
sequence.S5 (prompt sequence):
  Step 1: Analyze requirements → work.W123
  Step 2: Generate architecture → work.W124
  Step 3: Write tests → work.W125

If Step 2 fails:
  → Re-run from Step 2 (reuse Step 1 result)
  → Don't start over
```

**C) Swapping One Step**
```
Original:
  Step 1: Use GPT-4 for analysis → work.W123@c5
  Step 2: Generate code → work.W124@c8

Optimization:
  Step 1: Use GPT-4o (faster) for analysis → work.W123@c6
  Step 2: Generate code (reuse downstream) → work.W124@c8

Only re-run changed step, reuse rest.
```

**What you get:**
- ✅ AI processing becomes **more like a build system** than a conversation
- ✅ Caching (don't recompute verified results)
- ✅ Incremental re-runs (change one step, keep the rest)
- ✅ Composability (reuse AI work products across projects)

**Example:**
```
User: "Analyze this codebase for security issues."
→ AI runs 3-hour analysis → work.W200@c50
→ Verification: PASS

Next day:
User: "Add one more file to the analysis."
→ Reuse work.W200@c50 (3-hour analysis cached)
→ Only analyze new file → work.W200@c51
→ Total time: 5 minutes (not 3 hours again)
```

---

## THE BIG IDEA

**Relay turns AI from "a single answer generator" into:**

```
┌─────────────────────────────────────────────────────┐
│  COORDINATED AI WORKFORCE                           │
│  (Audited, Replayable, Authority-Gated)            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐              │
│  │ AI  │  │ AI  │  │ AI  │  │ AI  │  (SCVs)      │
│  │ SCV │  │ SCV │  │ SCV │  │ SCV │              │
│  │  1  │  │  2  │  │  3  │  │  4  │              │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘              │
│     │        │        │        │                    │
│     ↓        ↓        ↓        ↓                    │
│  work.W1  work.W2  work.W3  work.W4  (Filaments)  │
│  @c5      @c8      @c12     @c3                    │
│     ↓        ↓        ↓        ↓                    │
│  [Time   [Time   [Time   [Time     (Commits)      │
│   Cube]   Cube]   Cube]   Cube]                    │
│                                                      │
│  All visible, all auditable, all replayable        │
└─────────────────────────────────────────────────────┘
```

---

## CONCRETE BENEFITS

### For Individual Users
- ✅ **Trust AI more** (audit trail shows reasoning)
- ✅ **Catch errors faster** (inspect time cubes)
- ✅ **Reuse work** (cache verified results)
- ✅ **Better prompts** (versioned, snapshotted)
- ✅ **Safer AI** (authority-gated actions)

### For Teams
- ✅ **Parallel AI work** (multiple SCVs = higher throughput)
- ✅ **Clear accountability** (which AI did what?)
- ✅ **Shared knowledge** (prompt snapshots, evidence refs)
- ✅ **Compliance-ready** (full audit trail)
- ✅ **Reproducible results** (deterministic replay)

### For Enterprises
- ✅ **Scale AI safely** (authority model prevents runaway actions)
- ✅ **Reduce hallucinations** (evidence refs mandatory)
- ✅ **Audit everything** (regulatory compliance)
- ✅ **Build systems** (not just conversations)
- ✅ **Incremental improvement** (prompt versioning)

---

## COMPARISON: TRADITIONAL AI vs RELAY AI

| Aspect | Traditional AI | Relay AI |
|--------|---------------|----------|
| **Reasoning** | Invisible black box | Commit-by-commit audit trail |
| **Parallelization** | One agent, sequential | Many SCVs, parallel |
| **Prompts** | Lost/drifting vibes | Versioned artifacts with snapshots |
| **Evidence** | Buried in prose | Explicit refs on time cube faces |
| **Authority** | No model (AI "just does") | authorityRef mandatory |
| **Inspection** | Scroll chat | Physical time cubes (6 faces) |
| **Reusability** | Must repeat everything | Cache + incremental re-runs |
| **Output** | One-off text blob | Managed, replayable work product |

---

## REAL-WORLD SCENARIOS

### Scenario 1: Code Review AI

**Traditional AI:**
```
User: "Review this pull request."
AI: "I see 3 issues: [wall of text]"
→ No audit trail
→ Can't verify AI reasoning
→ Can't reuse for similar PRs
```

**Relay AI:**
```
User: "Review this pull request."
→ SCV assigned to work.review.PR123
→ AI produces commits:
   - work.review.PR123@c1: "Analyzed code structure"
   - work.review.PR123@c2: "Found security issue" (evidence: OWASP guide)
   - work.review.PR123@c3: "Found performance issue" (evidence: profiling data)
→ Each commit is time cube (inspectable)
→ User inspects evidence faces → verifies claims
→ Next PR: Reuse cached analysis patterns
```

### Scenario 2: Multi-Agent Research

**Traditional AI:**
```
User: "Research competitors, market trends, and user feedback."
→ One agent does all 3 (slow)
→ No parallelization
→ Results are one blob
```

**Relay AI:**
```
User: "Research competitors, market trends, and user feedback."
→ 3 SCVs assigned:
   - SCV 1 → work.research.competitors
   - SCV 2 → work.research.trends
   - SCV 3 → work.research.feedback
→ All run in parallel
→ Each produces audited commits
→ Merge step combines results (merge scar shows resolution)
→ User sees 3 SCVs working in globe world
→ Can cancel/reassign if priorities change
```

### Scenario 3: Prompt Engineering

**Traditional AI:**
```
Engineer: "This prompt is good. Let's save it."
→ Copy/paste into doc
→ Doc gets lost
→ Prompt drifts over time
→ Output quality degrades
```

**Relay AI:**
```
Engineer: "This prompt is good. Let's save it."
→ Click [Snapshot Save]
→ snapshot.S12 created (prompt.P5@c15)
→ Prompt versioning: c15, c16, c17 (improvements)
→ Branch twice (experiment with 2 variations)
→ Merge best of both → prompt.P5@merge/M3
→ Compile → prompt.P5@compiled.v8
→ Future runs: Always use compiled.v8
→ Output quality stable over time
```

---

## INTEGRATION WITH RELAY v1.1.0

**How AI Fits Into Relay 3D World:**

1. **AI Agents = SCV Units**
   - Visible in globe world
   - States: Idle | Moving | Working | Blocked | Awaiting Authority
   - Can be selected, multi-selected, control-grouped (Ctrl+1..0)

2. **AI Work = Filaments**
   - work.*, conversation.*, prompt.* filaments
   - AI attaches to filaments, produces commits
   - Commit events visible as time cubes (clickable)

3. **AI Reasoning = Commit Events**
   - Each reasoning step is a commit
   - Inspectable via time cubes (6 faces)
   - Evidence refs explicit (Right face)
   - Authority refs explicit (Left face)

4. **AI Cancellation = Forensic Destruction**
   - SCV cancellation produces commit-shard explosion
   - Ghost marker → Forensic Inspection of cancel commit
   - Audit trail preserved (no silent deletion)

5. **Prompt Management = Prompt Filaments**
   - prompt.* filaments with versioning
   - Branch-twice-merge pattern
   - Snapshot save/restore
   - Compiled prompt artifacts

---

## TECHNICAL REQUIREMENTS

**Backend API (from MIGRATION-PLAN-v1.1.0.md):**
- ✅ Filament store (append-only commit log)
- ✅ Unit store (SCV agent state management)
- ✅ Authority store (delegation chains)
- ✅ Commit processor (handle AI commits)
- ✅ State projector (derive AI state from commits)

**Frontend (from RELAY-3D-WORLD-SPEC.md v1.1.0):**
- ✅ SCVUnits.jsx (render AI agents as SCVs)
- ✅ TimeCubes.jsx (render AI commits as inspectable cubes)
- ✅ ForensicInspectionMode (time cube inspection)
- ✅ PromptLibrary.jsx (manage prompt filaments)
- ✅ CommandCard.jsx (legitimacy-gated AI actions)

---

## NEXT STEPS

**To Enable Relay AI:**

**Phase 1 (Weeks 1-4): Backend**
- Implement filament/commit API
- Implement AI unit creation/management
- Implement authority validation for AI actions
- Implement prompt compilation pipeline

**Phase 2 (Weeks 5-8): Frontend**
- Render AI agents as SCVs in globe world
- Implement time cube inspection for AI commits
- Implement prompt library UI
- Implement evidence face visualization

**Phase 3 (Weeks 9-11): Integration**
- Connect AI agents to backend commit log
- Implement parallel AI scheduling
- Implement prompt versioning + snapshots
- Test all 19 acceptance criteria

---

## CONCLUSION

**Relay transforms AI from "chat blob" into "managed labor" by:**

1. ✅ Making reasoning visible (commit events)
2. ✅ Enabling parallelization (multiple SCVs)
3. ✅ Versioning prompts (artifacts, not vibes)
4. ✅ Requiring evidence (explicit refs)
5. ✅ Enforcing authority (no runaway actions)
6. ✅ Providing physical inspection (time cubes)
7. ✅ Enabling reuse (caching + incremental runs)

**Result:**
> **Speed AND trust. Creativity AND control. Scale without drift.**

This is how you make AI **production-ready for serious systems**.

---

**Status:** ✅ CANONICAL VALUE PROPOSITION  
**Version:** 1.0  
**Date:** 2026-01-28  
**Next Review:** After Phase 3 implementation (Week 11)
