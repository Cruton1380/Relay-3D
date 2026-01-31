# 📦 Legacy Documentation Archive

**Purpose**: This folder contains documentation for **deprecated systems** that have been replaced by newer, better architectures.

**Status**: Archived (Read-Only)  
**Last Updated**: 2026-01-27

---

## Why These Docs Are Archived

Relay has evolved significantly. The following architectural changes made some documentation obsolete:

### **1. Truth Layer: Blockchain → Git-Native (2026-01-27)**

**Old System:**
- Blockchain + Hashgraph dual-record system
- Transactions in `chain.jsonl`
- Batch anchoring every 5 minutes
- WebSocket real-time push

**New System:**
- Git commits with structured envelopes
- Instant writes (< 100ms)
- Query hooks for aggregation
- Polling/SSE for updates

**Replaced Docs:**
- `VOTING-SYSTEM-BLOCKCHAIN.md` (was: `VOTING-SYSTEM-EXPLAINED.md`)

**See Instead:** [Git-Native Truth Model](../TECHNICAL/GIT-NATIVE-TRUTH-MODEL.md)

---

### **2. Visualization: Globe/Tower UI → Filament System (2026-01-27)**

**Old System:**
- 3D globe with voting "towers"
- Candidate cubes stacked vertically
- Height = vote count
- WebGL interactive visualization

**New System:**
- Filament System (persistent identities over time)
- TimeBoxes (atomic truth units with 6 semantic faces)
- Glyphs (8 canonical operations)
- Views: Globe (X-collapsed), Workflow (X-expanded), Spreadsheet (projection)

**Replaced Docs:**
- `VOTE-VISUALIZATION-TOWERS.md` (was: `VOTE-VISUALIZATION.md`)

**See Instead:** [Filament System Overview](../VISUALIZATION/FILAMENT-SYSTEM-OVERVIEW.md)

---

## Archived Files

| File | Original Name | Archive Date | Reason |
|------|---------------|--------------|--------|
| `VOTING-SYSTEM-BLOCKCHAIN.md` | `VOTING-SYSTEM-EXPLAINED.md` | 2026-01-27 | Blockchain/hashgraph replaced by Git |
| `VOTE-VISUALIZATION-TOWERS.md` | `VOTE-VISUALIZATION.md` | 2026-01-27 | Globe/tower UI replaced by Filament System |

---

## Should You Read These?

### ✅ **Yes, if:**
- You're maintaining an older deployment
- You're researching the evolution of Relay's architecture
- You need to migrate legacy data/code

### ❌ **No, if:**
- You're building new features (use current docs)
- You're learning Relay for the first time (start with current system)
- You're deploying fresh (use Git-native + Filament System)

---

## Migration Guides

If you need to migrate from legacy systems to current:

**Blockchain → Git:**
- See: [Migration Progress](../MIGRATION-PROGRESS.md)
- Status: 25% complete (import fixes in progress)

**Globe/Tower → Filament:**
- See: [Implementation Priority](../../src/frontend/components/filament/IMPLEMENTATION-PRIORITY.md)
- Status: Rendering complete, globe integration pending

---

## Historical Context

These systems were **not mistakes**—they were important steps in Relay's evolution:

**Blockchain + Hashgraph:**
- Proved immutability and audit trails
- Established cryptographic verification patterns
- Created foundation for Git-native migration

**Globe/Tower Visualization:**
- Proved 3D visualization was viable
- Established spatial metaphors for votes
- Created foundation for Filament System

**Lessons learned** from these systems informed the design of their replacements.

---

## Accessing Current Documentation

**Main Index:** [documentation/INDEX.md](../INDEX.md)

**Current Visualization Docs:** [documentation/VISUALIZATION/](../VISUALIZATION/)

**Current Technical Docs:** [documentation/TECHNICAL/](../TECHNICAL/)

---

*This archive ensures historical documentation remains accessible while clearly marking it as superseded.*
