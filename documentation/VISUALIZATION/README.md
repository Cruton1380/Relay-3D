# 🎨 Relay Visualization System Documentation

**Version**: 1.0.0  
**Last Updated**: 2026-01-27

---

## Overview

This folder contains the **canonical documentation** for Relay's truth visualization system, collectively known as the **Filament System**.

The Filament System replaces traditional dashboard/chart visualizations with **geometry-encoded truth**, where causality, history, and relationships are **inspectable without narration**.

---

## Core Documentation (Read in This Order)

### **1. Start Here: Filament System Overview**
📖 **[FILAMENT-SYSTEM-OVERVIEW.md](FILAMENT-SYSTEM-OVERVIEW.md)**

**What you'll learn:**
- What is a filament? (persistent identity over time)
- What is a TimeBox? (atomic truth unit with 6 semantic faces)
- What are glyphs? (8 canonical operations)
- How do views work? (Globe, Workflow, Spreadsheet, Sphere)
- How does the playback motor work?

**Who it's for:** Everyone (users, developers, stakeholders)

---

### **2. User Identity: User Sphere Model**
👤 **[USER-SPHERE-MODEL.md](USER-SPHERE-MODEL.md)**

**What you'll learn:**
- User profiles as projection lenses (not storage)
- Filament inclusion rules (auditable interactions)
- Truth branches vs lens branches
- Fly-to navigation and permissions
- Cognitive vs physical presence

**Who it's for:** Users, product designers, governance architects

---

### **3. Multi-Party Coordination: Presence + Permission**
👁️ **[PRESENCE-PERMISSION-MODEL.md](PRESENCE-PERMISSION-MODEL.md)**

**What you'll learn:**
- Presence as coordination signal (not surveillance)
- Visibility modes (invisible → public)
- Permission tiers (counts → roles → identities)
- Branch-aware presence
- Manager visibility (strict rules)

**Who it's for:** Organizations, team leads, privacy-focused users

---

### **4. Advanced Concepts**

#### **A) KPIs as Filaments**
📊 **[KPIS-AS-FILAMENTS.md](KPIS-AS-FILAMENTS.md)**

**Key insight:** KPIs are first-class states with commit history, not derived analytics.

**Covers:**
- KPI changes are commits
- Evidence requirement (-Z face)
- Definition changes require voting
- Auditable KPI evolution

---

#### **B) Topology as Emergent Lens**
🕸️ **[TOPOLOGY-AS-LENS.md](TOPOLOGY-AS-LENS.md)**

**Key insight:** Relationships are encoded in TimeBox faces, not drawn as separate edges.

**Covers:**
- Dependencies in -X input face
- Forks (SPLIT) and merges (SCAR) as glyphs
- Topology queries (dependency tree, impact analysis)
- No redundant edge objects

---

#### **C) Editable Endpoint Lens**
📝 **[EDITABLE-ENDPOINT-LENS.md](EDITABLE-ENDPOINT-LENS.md)**

**Key insight:** Spreadsheet cells project filament +X faces; edits append commits.

**Covers:**
- Spreadsheet as projection (not truth)
- Editing creates commits (optimistic)
- Formulas as first-class commits (FORMULA_EDIT → OPERATOR_RUN)
- Zoom-out reveals audit trail

---

### **5. Interaction & Privacy Models**

#### **A) Privacy Ladder**
🔐 **[PRIVACY-LADDER-SPEC.md](PRIVACY-LADDER-SPEC.md)**

**Key insight:** Distance controls fidelity, permission controls existence.

**Covers:**
- 7 privacy levels (Invisible → Engage)
- Discoverability vs fidelity
- Search visibility rules
- Default policies by filament type

---

#### **B) Engage Surface**
🎯 **[ENGAGE-SURFACE-SPEC.md](ENGAGE-SURFACE-SPEC.md)**

**Key insight:** Users lock into 2D surfaces to edit; proximity without permission = view-only.

**Covers:**
- Locus locking (cell-level, element-level)
- Engagement flow (approach → engage → edit → disengage)
- Conflict resolution
- Multi-domain surfaces

---

### **6. Creative Production Models**

#### **A) Multi-Domain Editing**
🎨 **[MULTI-DOMAIN-EDITING.md](MULTI-DOMAIN-EDITING.md)**

**Key insight:** One substrate (filaments), many lenses (spreadsheet, 3D, video, canvas).

**Covers:**
- Universal editing primitives (SelectionSet, Operation, Constraints)
- 5 creative domains (Spreadsheet, 3D, Canvas, Video, Animation)
- Shared edit engine
- Asset management

---

#### **B) AI Participation Model**
🤖 **[AI-PARTICIPATION-MODEL.md](AI-PARTICIPATION-MODEL.md)**

**Key insight:** AI proposes commits, humans are gatekeepers (GATE approval).

**Covers:**
- AI as commit proposer (not autonomous)
- Proposal branch model
- Content policy & guardrails
- Character generation for games

---

#### **C) Game Production Model**
🎮 **[GAME-PRODUCTION-MODEL.md](GAME-PRODUCTION-MODEL.md)**

**Key insight:** Games as causality trees with Git backend. Unity-like editor, forensic audit underneath.

**Covers:**
- Game as filament bundle
- Asset pipeline (meshes, textures, audio, etc.)
- Scene editing workflow
- Builds & releases
- Multiplayer as shared filament access

---

#### **D) Store Catalog**
🏪 **[STORE-CATALOG-SPEC.md](STORE-CATALOG-SPEC.md)**

**Key insight:** Steam-like store as lens over public game filaments.

**Covers:**
- Catalog as projection (not storage)
- Publishing workflow
- Ratings & reviews as filaments
- Curation & moderation
- Revenue distribution

---

## Supporting Documentation

### Technical References

**In this repo:**
- [Canonical Filament Model](../../src/frontend/components/filament/CANONICAL-MODEL.md) — Technical specification
- [Implementation Priority](../../src/frontend/components/filament/IMPLEMENTATION-PRIORITY.md) — Development roadmap
- [Presence Spec](../../src/frontend/components/filament/PRESENCE-SPEC.md) — Technical presence specification

**In main docs:**
- [System Architecture](../SYSTEM-ARCHITECTURE.md) — Git-native truth layer
- [Git-Native Truth Model](../TECHNICAL/GIT-NATIVE-TRUTH-MODEL.md) — Why Git instead of blockchain

---

## Documentation Sections

**Total:** 13 canonical docs organized by theme

**Foundation (4 docs):**
- Filament System Overview
- User Sphere Model
- Presence + Permission Model
- Git-Native Truth Model (in TECHNICAL/)

**Advanced Concepts (3 docs):**
- KPIs as Filaments
- Topology as Emergent Lens
- Editable Endpoint Lens

**Interaction & Privacy (2 docs):**
- Privacy Ladder Spec
- Engage Surface Spec

**Creative Production (4 docs):**
- Multi-Domain Editing
- AI Participation Model
- Game Production Model
- Store Catalog Spec

---

## Quick Reference

### The 3 Axes

| Axis | Meaning | Properties |
|------|---------|------------|
| **X** | Event order / Authority | Discrete, never continuous, commit-driven |
| **Y** | Magnitude | Lens-dependent (vote count, momentum, impact, etc.) |
| **Z** | Co-presence / Eligibility | Geography, jurisdiction, org, access scope |

---

### The 6 TimeBox Faces

| Face | Meaning | Example |
|------|---------|---------|
| **+X** | Output (current truth) | Vote count: 150 |
| **-X** | Input (dependencies) | Previous: 148 |
| **+Y** | Semantic (human intent) | "Budget Proposal Vote" |
| **-Y** | Magnitude (quantitative) | Importance: 0.85 |
| **+Z** | Identity (who/what) | Actor: user:alice |
| **-Z** | Evidence (proof) | Signature, document ref |

---

### The 8 Canonical Glyphs

| Glyph | Meaning | Visual |
|-------|---------|--------|
| **STAMP** | State assertion (load, declare) | Ring clamp |
| **KINK** | Transform (compute, convert) | Bend |
| **DENT** | Error/anomaly (flag, validate) | Crater |
| **TWIST** | Encrypt | Helix |
| **UNTWIST** | Decrypt | Reverse helix |
| **GATE** | Filter/conditional (if/then) | Aperture |
| **SPLIT** | Fork/branch | Y-junction |
| **SCAR** | Merge/resolution | Sutured seam |

---

### The 4 Views

| View | X-Axis | Y-Axis | Z-Axis | Purpose |
|------|--------|--------|--------|---------|
| **Globe** | Collapsed (frontier) | Magnitude (height) | Geography (lat/lon) | Macro navigation |
| **Workflow** | Expanded (history) | Magnitude | Co-presence | Audit/inspection |
| **Spreadsheet** | Projected (+X face) | Rows | Columns | Work surface |
| **Sphere** | User's filaments | User's arrangement | User's groupings | Personal lens |

---

## Design Principles

### **1. Geometry Encodes Truth**
Causality must be reconstructible from shape alone (no narration, no UI trust).

### **2. No Geometry Without Commit**
Silence is spacing (gaps), not interpolated boxes.

### **3. Presence Is a Lens**
"Who is here?" is observer metadata, not truth.

### **4. Branches Are Proposals**
Forks (SPLIT) = competing timelines. Merges (SCAR) = consensus.

### **5. Lenses Change View, Not Truth**
Same filaments, different projections (Globe ≠ Workflow ≠ Sheet ≠ Sphere).

---

## FAQ

**Q: Why "filament"?**  
A: A filament is a continuous thread (identity) through time. It persists, evolves, and remains inspectable.

**Q: Is this just a Git graph?**  
A: Conceptually similar, but adds **semantic geometry** (TimeBox faces, glyphs, spatial reasoning). You can audit by shape.

**Q: Can non-technical users understand this?**  
A: Yes. Think of it like music notation (notes on a staff) or video timelines (clips on a track). Familiar metaphors, rigorous foundation.

**Q: What if I just want a simple dashboard?**  
A: Spreadsheet view provides that (familiar grid). Workflow view is available when you need to audit.

---

## Implementation Status

**As of 2026-01-27:**

| Component | Status | Routes |
|-----------|--------|--------|
| **Filament Rendering** | ✅ Complete | `/`, `/filament-demo` |
| **Workflow Proof** | ✅ Complete | `/workflow-proof` |
| **Presence Tier 1** | ✅ Complete | Integrated |
| **User Sphere** | 📋 Documented, not rendered | Pending |
| **Globe Integration** | ⏳ Specified, not implemented | Pending |

**See:** [Implementation Priority](../../src/frontend/components/filament/IMPLEMENTATION-PRIORITY.md)

---

## Contributing

When adding new visualization features:

1. **Read CANONICAL-MODEL.md first** (ensures alignment with invariants)
2. **Check PRESENCE-SPEC.md** (if adding multi-party features)
3. **Update this README** (add new docs to reading list)
4. **Test in both scenes** (FilamentDemoScene + WorkflowProofScene)

---

## Version History

**1.0.0 (2026-01-27):**
- Initial documentation set created
- 6 canonical documents
- Filament System, User Sphere, Presence models locked
- Migration from legacy blockchain/tower visualization complete

---

*This documentation is maintained as canonical reference. Changes require explicit versioning and migration notes.*
