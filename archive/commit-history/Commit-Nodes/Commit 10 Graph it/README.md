# Relay

**A coordination system with explicit physics**

Version: 1.0 (Foundation Complete)  
Status: Ready for backend implementation and business pilots  
Date: February 5, 2026

---

## What Is Relay?

Relay is a **continuous verification environment** where:
- **Evidence anchors claims** (not votes)
- **Votes select operating canon** (not truth)
- **Pressure is measured** (not hidden)
- **Refusal is honest** (not silent)
- **Authority is explicit** (not ambient)
- **History is append-only** (never erased)

It replaces:
- ❌ File sync chaos → ✅ Evidence anchors
- ❌ Silent failures → ✅ Explicit refusal + repair guidance
- ❌ Hidden capacity limits → ✅ Measured pressure states
- ❌ Ad-hoc overrides → ✅ Scoped authority with audit trails
- ❌ "Latest wins" conflicts → ✅ Forked history with reconciliation

---

## Quick Start

### For Business Stakeholders
**Read this first**: [`RELAY-OPERATIONAL-POLICY.md`](./RELAY-OPERATIONAL-POLICY.md) → Section 11 (Executive Summary)

**See it in action**: [`RELAY-CASE-AVGOL-ALEXANDRA.md`](./RELAY-CASE-AVGOL-ALEXANDRA.md) (real multi-site procurement crisis + solution)

**Key insight**: Systems that cannot maintain coherence under pressure don't get conquered — they become **non-competitive**.

### For Engineers
**Read this first**: [`CANON-CUSTODY.md`](./CANON-CUSTODY.md) (custody = provenance, not capability)

**See the code**: [`filament-spreadsheet-prototype.html`](./filament-spreadsheet-prototype.html) (working 3D prototype)

**Key insight**: Append-only history + explicit authority + pressure measurement = **replayable coordination**.

### For Operations Teams
**Read this first**: [`RELAY-OPERATIONAL-POLICY.md`](./RELAY-OPERATIONAL-POLICY.md) → Section 3 (your role: Global/Regional/Local)

**Decision matrix**: Section 4 (what you can approve vs. what you escalate)

**Key insight**: When you don't know, **Relay refuses explicitly** instead of guessing — that's a feature, not a bug.

### For IT/Infrastructure
**Read this first**: [`CANON-VAULT-SPEC.md`](./CANON-VAULT-SPEC.md) (NAS folder structure + access control)

**Security boundary**: [`EDGE-VERIFY-ENDPOINT.md`](./EDGE-VERIFY-ENDPOINT.md) (proof, not just HTTPS)

**Key insight**: Canon custody ≠ cloud hosting. It's **explicit storage + verification** on infrastructure you control.

---

## System Architecture (5 Layers)

### Layer 1: Canon & Custody
**Who can write? How do changes propagate?**
- [`CANON-CUSTODY.md`](./CANON-CUSTODY.md) - Custody as provenance
- [`CANON-INVARIANTS.md`](./CANON-INVARIANTS.md) - Mechanical verification checks
- [`CANON-VAULT-SPEC.md`](./CANON-VAULT-SPEC.md) - Storage + snapshots

### Layer 2: Verification & Security
**How do clients trust Canon state?**
- [`EDGE-VERIFY-ENDPOINT.md`](./EDGE-VERIFY-ENDPOINT.md) - Proof boundary (`/canon/verify`)
- [`RELAY-VAULT-GUARDIAN-SPEC.md`](./RELAY-VAULT-GUARDIAN-SPEC.md) - Verification daemon (Docker)

### Layer 3: Pressure & Capacity
**What happens when overloaded?**
- [`PRESSURE-BUDGET.json`](./PRESSURE-BUDGET.json) - Explicit limits + refusal thresholds

### Layer 4: Operational Governance
**How do humans operate Relay?**
- [`RELAY-OPERATIONAL-POLICY.md`](./RELAY-OPERATIONAL-POLICY.md) - Global-Regional-Local roles + authority

### Layer 5: Visualization & UX
**How do users see and interact with system state?**
- [`filament-spreadsheet-prototype.html`](./filament-spreadsheet-prototype.html) - Working 3D prototype
- [`RELAY-3D-CANONICAL-FINAL-FIXES.md`](./RELAY-3D-CANONICAL-FINAL-FIXES.md) - Rendering specifications

**Complete system map**: [`RELAY-SYSTEM-MODEL-INDEX.md`](./RELAY-SYSTEM-MODEL-INDEX.md)

---

## Why Relay Exists

### The Problem
Organizations with multiple sites, changing teams, and scattered data face **coordination drift**:
- Duplicate vendor entries across locations
- BOMs in files, some active, most unknown
- Team changes create knowledge gaps
- Problems accumulate invisibly ("growing like a snowball")
- No single source of truth
- Silent failures compound until crisis

### The Relay Answer
1. **Evidence Anchors** replace scattered files
   - Single vendor record, multiple site relationships
   - BOMs tracked with usage evidence + confidence scores
   - Payment terms versioned and approved per site

2. **Pressure States** replace invisible accumulation
   - Warehouse capacity measured in real-time
   - Vendor performance (ERI) scored across sites
   - Thresholds explicit: Normal → Degraded → Refusal

3. **Explicit Authority** replaces ad-hoc overrides
   - Global sets policy
   - Regional coordinates risk
   - Local executes daily
   - No silent bypasses

4. **Honest Refusal** replaces silent failure
   - When capacity exceeded → refuse with reason
   - When authority missing → queue for approval
   - When data uncertain → mark as indeterminate
   - Always suggest next action

**Result**: Problems surface early, not at crisis. Teams operate confidently within their scope. Transitions (personnel changes, site additions) preserve context.

---

## Real-World Case Study

**Company**: Avgol (nonwoven fabric manufacturing)  
**Problem**: 5 global plants, scattered BOMs/vendors/payment terms, 6-month purchasing manager gap, single-buyer bottleneck, warehouse "snowball"  
**Solution**: See [`RELAY-CASE-AVGOL-ALEXANDRA.md`](./RELAY-CASE-AVGOL-ALEXANDRA.md)

**Key Quote** (Alexandra Demina, Indirect Procurement):
> "Maybe tomorrow we'll figure out there is something that can help us globally."

**Relay's Answer**: Tomorrow is here. The snowball becomes pressure. Pressure becomes measurement. Measurement becomes governance.

---

## Project Status

### ✅ **Foundation Complete** (v1.0 - February 2026)
- All core specifications defined
- 3D prototype working (deterministic rebuild tested)
- Real business case documented (Avgol multi-site procurement)
- Operational policy written (business-consumable)
- Infrastructure specs complete (NAS vault + verification daemon)

### 🔲 **Phase 2: Backend Implementation** (Target: Q2 2026)
- `relay-core` API service (HTTP + SSE)
- `relay-vault-guardian` Docker container
- `/canon/verify` endpoint (actual crypto)
- `relay-cli` command-line tool
- Bundle signing/verification

### 🔲 **Phase 3: Pilot Deployment** (Target: Q3 2026)
- Avgol Maxwell site pilot
- Real vendor + BOM data migration
- Procurement team training
- Pressure dashboard live

### 🔲 **Phase 4: Multi-Site Expansion** (Target: Q4 2026)
- Russia + China sites
- Cross-site vendor ERI
- Customer relationship coordination
- Global governance operational

---

## Key Principles (Plain Language)

1. **Evidence comes first** - Decisions based on verified data, not assumptions
2. **Decisions are explicit** - No silent overrides or hidden fixes
3. **Uncertainty is allowed** - Unclear situations marked as such, not forced into false certainty
4. **Authority is scoped** - Global/Regional/Local have different responsibilities
5. **Change is controlled** - Improvements proposed, reviewed, approved (not auto-applied)
6. **Capacity is respected** - Teams not overloaded; unresolved issues surface clearly

---

## Technical Highlights

### Append-Only History
- Canon never mutated
- Conflicts fork (don't overwrite)
- Backfills require explicit approval
- Full audit trail preserved

### Pressure Measurement
- Warehouse capacity: Normal (< 0.6) → Degraded (0.6-0.8) → Refusal (> 0.8)
- Vendor ERI scoring across sites
- Client poll backoff based on pressure state

### Deterministic Rebuild
- Reload prototype 3x → identical scene
- Timebox placement from commit buckets (not decorative)
- Formula edges from actual dependency graph

### 3D Visualization
- RTS-freeflight navigation (WASD + Q/E + mouse look)
- Staged bundling (Cell → Row → Spine → Branch)
- Formula lens (toggle with 'G' key)
- Pressure rings show real metrics

---

## Documentation Map

**Complete system index**: [`RELAY-SYSTEM-MODEL-INDEX.md`](./RELAY-SYSTEM-MODEL-INDEX.md)

### By Audience

**Business Executives**:
1. [`RELAY-OPERATIONAL-POLICY.md`](./RELAY-OPERATIONAL-POLICY.md) (Section 11: Executive Summary)
2. [`RELAY-CASE-AVGOL-ALEXANDRA.md`](./RELAY-CASE-AVGOL-ALEXANDRA.md) (Problem → Solution)

**Operations Teams**:
1. [`RELAY-OPERATIONAL-POLICY.md`](./RELAY-OPERATIONAL-POLICY.md) (Your role + decision matrix)
2. Quick Reference Cards (Appendix A)

**Engineers**:
1. [`CANON-CUSTODY.md`](./CANON-CUSTODY.md) (Authority model)
2. [`CANON-INVARIANTS.md`](./CANON-INVARIANTS.md) (Verification rules)
3. [`filament-spreadsheet-prototype.html`](./filament-spreadsheet-prototype.html) (Working code)

**IT/Infrastructure**:
1. [`CANON-VAULT-SPEC.md`](./CANON-VAULT-SPEC.md) (NAS setup)
2. [`RELAY-VAULT-GUARDIAN-SPEC.md`](./RELAY-VAULT-GUARDIAN-SPEC.md) (Verification daemon)
3. [`EDGE-VERIFY-ENDPOINT.md`](./EDGE-VERIFY-ENDPOINT.md) (Security boundary)

---

## Hardware Requirements

### Minimum (Single-Site Pilot)
- **Desktop** (Canon Core): 8 cores, 32GB RAM, NVMe SSD, GPU (RTX 2060+)
- **NAS** (Vault): Synology DS923+ (x86, 16GB RAM, 4-bay, RAID1)
- **UPS**: 900-1200VA (clean shutdown on power loss)

### Recommended (Multi-Site Production)
- **Desktop** (Canon Core): 12+ cores, 64GB RAM, NVMe SSD, GPU (RTX 3060+)
- **NAS** (Primary Vault): Synology DS923+ (32GB RAM, SSD RAID1 for Canon)
- **Secondary NAS** (Mirror): Same spec, pull-only replication
- **UPS**: Yes, always

**Full hardware spec**: See [`RELAY-OPERATIONAL-POLICY.md`](./RELAY-OPERATIONAL-POLICY.md) or Avgol case study.

---

## License & Contact

**Author**: Eitan Asulin  
**Organization**: Relay Project  
**License**: TBD (Foundation documentation is reference material)

**For business inquiries**: See [`RELAY-CASE-AVGOL-ALEXANDRA.md`](./RELAY-CASE-AVGOL-ALEXANDRA.md) for pilot engagement model.

**For technical contributions**: Foundation specs are complete; backend implementation phase starting Q2 2026.

---

## One-Sentence Summary

**Relay is a continuous verification environment where evidence anchors claims, pressure is measured, and systems that can't maintain coherence become non-competitive.**

---

**Start Here**: [`RELAY-SYSTEM-MODEL-INDEX.md`](./RELAY-SYSTEM-MODEL-INDEX.md)
