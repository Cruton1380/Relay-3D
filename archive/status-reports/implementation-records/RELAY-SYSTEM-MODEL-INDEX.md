# Relay System Model - Complete Index

**Status**: Foundation Complete  
**Date**: February 5, 2026  
**Purpose**: Master reference for all canonical Relay specifications

---

## System Architecture (Complete ✅)

### 1. Canon & Custody Layer
**Purpose**: Define who can write, how changes are tracked, and how authority transitions

| Document | Status | Description |
|----------|--------|-------------|
| `CANON-CUSTODY.md` | ✅ Complete | Custody as provenance, not capability. Defines custodian nodes, mirrors, lenses, and governance transitions. |
| `CANON-INVARIANTS.md` | ✅ Complete | Mechanical checks for every bundle before acceptance. 6 categories: Structural, Cryptographic, Schema, Custody, Semantic, Dependency. |
| `CANON-VAULT-SPEC.md` | ✅ Complete | NAS folder structure, access control, snapshots, and degraded operation rules. |

**Key Principle**: Canon is append-only. History never erased. Conflicts fork. Authority is explicit and expires.

---

### 2. Verification & Security Layer
**Purpose**: Ensure clients can verify Canon integrity before trusting state

| Document | Status | Description |
|----------|--------|-------------|
| `EDGE-VERIFY-ENDPOINT.md` | ✅ Complete | `/canon/verify` endpoint contract. Returns proof material (commit hash, signature, merkle root). Client DEGRADED mode rules. |
| `RELAY-VAULT-GUARDIAN-SPEC.md` | ✅ Complete | Verification daemon running on NAS. Watches `incoming/`, verifies signature+hash+invariants, accepts to `verified/` or refuses to `refused/`. |

**Key Principle**: Clients must verify Canon lineage, not just trust HTTPS. Replay attack prevention via nonce+timestamp.

---

### 3. Pressure & Capacity Layer
**Purpose**: Make system constraints explicit, not hidden

| Document | Status | Description |
|----------|--------|-------------|
| `PRESSURE-BUDGET.json` | ✅ Complete | Node constraints (max clients, bandwidth, storage, pressure threshold). Refusal behavior (503 + Retry-After). Poll backoff by pressure state. |

**Key Principle**: Pressure is explicit; no silent overload. When capacity exceeded → refuse honestly with retry guidance.

---

### 4. Operational Governance Layer
**Purpose**: Define how humans operate Relay across organizational levels

| Document | Status | Description |
|----------|--------|-------------|
| `RELAY-OPERATIONAL-POLICY.md` | ✅ Complete | Global-Regional-Local governance. Decision authority matrix. Change management. Uncertainty handling. Training and capacity management. |

**Key Principle**: Global sets direction, Regional coordinates risk, Local executes efficiently. No silent overrides.

---

## Implementation Guides (Complete ✅)

### 5. 3D Visualization & UX
**Purpose**: Define canonical rendering rules and user interaction patterns

| Document | Status | Description |
|----------|--------|-------------|
| `RELAY-3D-CANONICAL-FINAL-FIXES.md` | ✅ Complete | 3 critical fixes: Staged bundling (Cell → Row → Spine → Branch), Data-driven timeboxes, Lens-gated formula edges. |
| `RELAY-3D-IMPLEMENTATION-COMPLETE.md` | ✅ Complete | Complete 3D implementation status with RTS-freeflight controls, staged bundling, pressure rings, and formula lens. |
| `RELAY-3D-QUICK-START.md` | ✅ Complete | Quick start guide for loading and navigating the 3D prototype. |

**Key Principle**: Visualization shows forces first, objects second. Nothing orbits; everything flows. Sparse labels only where action is possible.

---

### 6. Prototype & Testing
**Purpose**: Working code demonstrating canonical principles

| Document | Status | Description |
|----------|--------|-------------|
| `filament-spreadsheet-prototype.html` | ✅ Complete | Standalone HTML/JS prototype. Implements: 3D navigation (RTS-freeflight), staged bundling, data-driven timeboxes, formula lens (G key), cycle detection, topological sorting. |

**Key Features**:
- View modes: Grid, Sheet Volume, Filament, Graph Lens, **Tree Scaffold** (canonical 3D)
- Flight controls: WASD + Q/E + Shift/Ctrl + Mouse look (pointer lock)
- Formula lens: Press 'G' to toggle dependency edges
- Deterministic rebuild: Reload 3x = identical scene

---

## Case Studies & Business Applications (Complete ✅)

### 7. Real-World Validation
**Purpose**: Demonstrate Relay solving actual business problems

| Document | Status | Description |
|----------|--------|-------------|
| `RELAY-CASE-AVGOL-ALEXANDRA.md` | ✅ Complete | Multi-site procurement crisis case study. 5 plants, fragmented data, team instability. Complete solution architecture + 5-scene 3D demo plan. |
| `AVGOL-3D-MISSION-CHECKLIST.md` | ✅ Complete | Technical checklist for first 3D business mission. Scene setup, narration scripts, day-of flow, risk mitigation. |

**Key Problem Solved**: "Snowball" of accumulating issues becomes measurable pressure with explicit refusal when capacity exceeded.

---

## System Model Completeness Checklist

### ✅ **Core Architecture Defined**
- [x] Custody model (who can write Canon)
- [x] Invariants (what gets accepted/refused)
- [x] Vault storage (where Canon lives)
- [x] Verification boundary (how clients trust)
- [x] Pressure budget (capacity limits)

### ✅ **Governance Defined**
- [x] Global-Regional-Local roles
- [x] Decision authority matrix
- [x] Change management process
- [x] Uncertainty handling rules
- [x] Training and transition procedures

### ✅ **Implementation Demonstrated**
- [x] 3D visualization prototype (working code)
- [x] Canonical rendering rules (staged bundling, timeboxes, lens)
- [x] Flight controls (RTS-freeflight, world-up)
- [x] Formula dependency visualization
- [x] Deterministic rebuild tests

### ✅ **Business Validation**
- [x] Real-world case study (Avgol multi-site procurement)
- [x] Problem → Solution mapping
- [x] 3D demo mission plan
- [x] Implementation roadmap (6 months)

---

## What's Missing (Phase 2 Development)

### 🔲 **Backend Services**
- [ ] `relay-core` API service (HTTP + SSE/WebSocket)
- [ ] `relay-vault-guardian` Docker container (actual implementation)
- [ ] `/canon/verify` endpoint (actual implementation)
- [ ] Pressure budget monitoring daemon
- [ ] Bundle signing/verification cryptography

### 🔲 **Data Persistence**
- [ ] Git repo structure for Canon
- [ ] Bundle format specification (JSON schema)
- [ ] Evidence pack format
- [ ] Merkle tree implementation
- [ ] Commit index structure

### 🔲 **Client Libraries**
- [ ] JavaScript client SDK (browser)
- [ ] Python client SDK (server-side)
- [ ] Verification library (signature checking)
- [ ] DEGRADED mode UI components

### 🔲 **Operational Tooling**
- [ ] `relay-cli` command-line tool
- [ ] Admin dashboard (pressure states, ERI scores)
- [ ] Audit log viewer
- [ ] Bundle inspector/debugger
- [ ] Training pack generator

### 🔲 **Documentation**
- [ ] API reference (OpenAPI/Swagger)
- [ ] Deployment guide (Docker Compose)
- [ ] Migration guide (existing systems → Relay)
- [ ] Troubleshooting runbook
- [ ] FAQ for operations teams

---

## Document Dependency Graph

```
CANON-CUSTODY.md
├─ defines → CANON-INVARIANTS.md (what gets verified)
├─ defines → CANON-VAULT-SPEC.md (where Canon lives)
└─ referenced by → RELAY-OPERATIONAL-POLICY.md (who has custody)

EDGE-VERIFY-ENDPOINT.md
├─ uses → CANON-CUSTODY.md (custody signatures)
└─ enforces → CANON-INVARIANTS.md (verification checks)

RELAY-VAULT-GUARDIAN-SPEC.md
├─ implements → CANON-INVARIANTS.md (verification daemon)
├─ uses → CANON-VAULT-SPEC.md (folder structure)
└─ provides → EDGE-VERIFY-ENDPOINT.md (verified bundles)

PRESSURE-BUDGET.json
└─ used by → RELAY-OPERATIONAL-POLICY.md (capacity rules)

RELAY-OPERATIONAL-POLICY.md
├─ operationalizes → CANON-CUSTODY.md (governance)
├─ uses → PRESSURE-BUDGET.json (capacity management)
└─ guides → RELAY-CASE-AVGOL-ALEXANDRA.md (real-world application)

filament-spreadsheet-prototype.html
├─ demonstrates → RELAY-3D-CANONICAL-FINAL-FIXES.md
└─ implements → cycle detection + deterministic rebuild
```

---

## Quick Navigation

### For Engineers
1. Start: `CANON-CUSTODY.md` (understand authority model)
2. Then: `CANON-INVARIANTS.md` (understand verification)
3. Build: `filament-spreadsheet-prototype.html` (see it working)

### For Operations
1. Start: `RELAY-OPERATIONAL-POLICY.md` (understand your role)
2. Reference: Decision authority matrix (Section 4)
3. Case study: `RELAY-CASE-AVGOL-ALEXANDRA.md` (see real application)

### For Business Stakeholders
1. Start: `RELAY-OPERATIONAL-POLICY.md` → Section 11 (Executive Summary)
2. Case study: `RELAY-CASE-AVGOL-ALEXANDRA.md` (problem → solution)
3. Demo: `AVGOL-3D-MISSION-CHECKLIST.md` (what to expect in demo)

### For IT/Infrastructure
1. Start: `CANON-VAULT-SPEC.md` (NAS setup)
2. Then: `RELAY-VAULT-GUARDIAN-SPEC.md` (verification daemon)
3. Security: `EDGE-VERIFY-ENDPOINT.md` (proof boundary)
4. Capacity: `PRESSURE-BUDGET.json` (limits and refusal)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 5, 2026 | Foundation complete. All core specs defined. Prototype working. First business case documented. |

---

## Next Milestones

### Milestone 2: Backend Implementation (Months 1-2)
- Implement `relay-core` API service
- Build `relay-vault-guardian` Docker container
- Create `relay-cli` tool
- Deploy to test environment

### Milestone 3: Pilot Deployment (Month 3)
- Avgol Maxwell site pilot
- Real vendor data migration
- Training for procurement team
- Pressure dashboard deployment

### Milestone 4: Multi-Site Expansion (Months 4-6)
- Russia site connection
- Cross-site vendor reconciliation
- Customer relationship tracking
- Global ERI scoring

---

**System Status**: ✅ **Foundation Complete**  
**Ready For**: Backend implementation + business pilots  
**Document Owner**: Eitan Asulin  
**Last Updated**: February 5, 2026
