 # Relay Full System Outline + Canon Verification Prompt
 
 ## 1) Relay Full System Outline
 
 ### A. Canon and Truth Model
 
 - Canonical statement + safe language
 - Continuous verification, non-destructive audits, coherence operators
 - Forbidden terms list (keep language non-adversarial)
 - Git as OS
 - Append-only commits as coordination events
 - Revert is visible, no hidden mutation
 - Commit materiality
 - DRAFT → HOLD → PROPOSE → COMMIT → REVERT
 - Material boundaries rule (time/actions/risk/visibility/dependencies)
 - Work zones
 - zone.<company>.<dept>.<project>
 - Live dialogue (ephemeral) vs context (semi-persistent) vs commits (canonical)
 
 ### B. Verification Physics
 
 - Three-way match engine
 - Intent ↔ Reality ↔ Projection
 - Pressure loop (continuous verification)
 - Attest → Compare → Score → Stage repair → Verify → Checkpoint
 - Pressure invariants
 - Pressure Budget (humane)
 - Confidence Floor (honest)
 - Repair Effectiveness (learning, recommendations only)
 - Resilience states
 - NORMAL → DEGRADED → INDETERMINATE → REFUSAL
 - Fail-soft rules + explicit refusal commits
 - ERI (distance from core)
 - Score + confidence + missing inputs
 - Never show certainty without coverage
 
 ### C. Cryptographic Architecture
 
 - Leaf-level encryption
 - Leaves (cells/events) encrypted; above-leaf is hashes + signatures + Merkle roots
 - Permission patterns
 - Envelope encryption recommended (one ciphertext + per-recipient wraps)
 - Revocation
 - Explicit commits + key rotation; cannot “unshare” what was already decrypted
 - Selective disclosure
 - Peer-to-peer plaintext disclosure + Merkle inclusion proof
 
 ### D. Data Structures and Storage
 
 - Filaments
 - Primary identity/time structure; files are projections
 - Timeboxes
 - Material slices; micro-timeboxes on filaments align to branch timebox bands
 - Snapshots + replay
 - Deterministic snapshots with replay proof metadata (for cold start)
 - Outbox pattern
 - Downstream side effects as outbox commits: ENQUEUE/ATTEMPT/SUCCESS/FAIL
 - Policies as filaments
 - All policy versions commit-addressed; avoid implicit “latest”
 
 ### E. Visualization World (3D Cognition)
 
 - Spatial epistemology
 - Down = history/replay, Surface = present coordination, Outward = unknown/projection
 - Surface geometry (Laniakea / basins / filaments)
 - Core = reconciliation
 - Rings = basins (company/dept/project)
 - Filaments = append-only flow
 - Scars = reconciliation evidence
 - Nothing orbits (flows only)
 - LOD ladder (performance physics)
 - LANIAKEA → PLANETARY → REGION → COMPANY → SHEET → CELL
 - Never render adjacent scales fully at once
 - One graph enforcement
 - One scene graph / one build id; lenses toggle visibility only
 
 ### F. Globe / Geospatial Layer (Cesium-first product)
 
 - ENU coordinate system
 - Correct tangent frame (east/north/up) per lat/lon
 - Anchors
 - Tree anchored to real lat/lon; anchor marker independent of buildings
 - Boundaries
 - Defined by commits; containLL implementable; local-up extrusion
 - Global relationships
 - Core-routed relationships (A→core→B) as proof primitive (planetary view)
 - Proof artifacts
 - Each gate PASS requires screenshot + console log + spec copy
 
 ### G. Company Tree / Spreadsheet Filament System
 
 - Topology
 - Core → trunk → branches → sheets → cells
 - No hubs; bundling along length only
 - Sheet orientation
 - Sheet normal = −T (branch tangent), sheet axes = N×B (perpendicular)
 - Cell geometry
 - Cells are explicit; each cell has a tip anchor
 - Filament staging
 - Stage 1: Cell→Spine (one per cell)
 - Stage 2: Spine→Branch (one per sheet)
 - Formula relationships
 - Dependency graph + topological order; cycles create refusal/scar
 - Material time history
 - Each cell has time-lane + timecubes
 - Parallel identity preservation unless mergeable (no formula/history)
 
 ### H. HUD and Interaction
 
 - HUD as help
 - HUD is a lens and command card, not a dashboard authority
 - Controls
 - HOLD / RECONCILE / FORK / MERGE (and reconcile process gates)
 - Flight/navigation
 - World-up flight, pointer lock, safe HOLD behavior
 - Inspectors
 - Timebox inspector, filament inspector, provenance inspector
 - Training embedded
 - Object-local training units; STOP/HOLD/FORK for learning
 
 ### I. Governance and Human Workflows (including HR)
 
 - Governance cadence
 - Decision rhythm, reconciliation windows, sunset rules
 - Stage gates
 - Each phase has pass/fail, proof artifacts, refusal conditions
 - Stigmergic coordination
 - Traces in environment, not messaging reliance
 - HR reminder cycles on branches
 - HR policies as filaments (commit-addressed)
 - Reminders as timeboxes/commit events
 - Recurrence schedules as governed policy, not hidden automation
 - Workflows: onboarding, performance cycles, trainings, compliance checks
 - Email/thread rules
- One topic per thread, summaries at decision points, no “silence-as-approval”
 
 ### J. Code IDE and Developer Experience
 
 - Repo layout
 - Core renderer-agnostic modules vs app (Cesium/Three) adapters
 - Contracts tests
 - Topology lint, ENU correctness, LOD stability, one-graph enforcement, etc.
 - Commit types
 - Visual commits (BOUNDARY_DEFINE, TREE_ANCHOR_SET…)
 - Work commits (TASK_, POLICY_, REFUSAL_*, etc.)
 - CI
 - Lint for forbidden language
 - Gate tests must pass before moving phases
 
 ### K. Optional Modules (if in scope)
 
 - File organization
 - Local-only observer → planner (dry run) → approval → execute (gated)
 - Integrations
 - ERP/AP/Procurement connectors via outbox and attestations
 - AI agents
 - SCV onboarding agent, coherence agent, review agent (all constrained, no auto-execution)
 
 ---
 
 ## 2) Prompt to Canon: Review All Instructions One-By-One and Verify Completion
 
 Copy/paste this to Canon verbatim:
 
 CANON — RELAY FULL SYSTEM VERIFICATION REVIEW (NO PUSH, NO PAPER PASS)
 
 You are Canon performing a deterministic, document-driven verification review of the Relay system.
 
 Hard constraints
 
 You are not authorized to push, publish, merge, or change remotes.
 
 You may read, analyze, and propose patch commits in theory only.
 
 You must not claim “complete” without proof artifacts.
 
 Objective
 
 Produce a full outline of Relay components (match the project’s canonical structure).
 
 Review each instruction/spec document one by one, extract:
 
 What the document locks (invariants)
 
 What code modules/files it expects to exist
 
 What gates/tests/proofs are required
 
 Verify the current implementation state against each requirement:
 
 PASS only with evidence (file paths, logs, screenshots, test outputs)
 
 Otherwise mark DEGRADED / INDETERMINATE / REFUSAL with reason codes
 
 Output a Module Completion Matrix:
 
 Module name
 
 Required artifacts
 
 Current status (PASS/DEGRADED/INDETERMINATE/REFUSAL)
 
 Missing items
 
 Next patch (append-only) to reach PASS
 
 Required format (every response)
 
 Layer 0 — Summary Headers
 
 What you reviewed (list of docs)
 
 What is PASS vs not
 
 What is blocked and why
 
 What is the next single highest-leverage fix
 
 Layer 1 — Evidence
 
 For each module:
 
 Cite exact file paths that exist
 
 Cite exact tests/logs/proof artifacts that exist
 
 If absent, say “Missing proof artifact” or “Missing gate definition”
 
 Verification rules
 
 A module cannot be PASS without:
 
 gate definition
 
 proof artifact(s)
 
 refusal condition(s)
 
 If you cannot locate artifacts, mark INDETERMINATE (not PASS).
 
 If you detect a physics violation (hub regression, sheet endpoints, orbit bias, hidden authority, etc.), mark REFUSAL with a reason code.
 
 Deliverables (in order)
 
 Relay Master Outline (the whole system, end-to-end)
 
 Document Index (all instruction/spec docs found, ordered by authority)
 
 Module Completion Matrix
 
 Patch Queue (max 10 items) — append-only, smallest first
 
 Begin now.
