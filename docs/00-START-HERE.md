# 📚 Relay Documentation - Start Here

**Last Updated**: 2026-02-06  
**Version**: v1.0 (Post-Cesium Migration)

This is the **single source of truth** for Relay documentation.

---

## 🚀 Quick Links

### For New Users
- **[Quick Start Guide](./tutorials/QUICK-START.md)** ✅ - Get running in 5 minutes
- **[Architecture Overview](./architecture/RELAY-CESIUM-ARCHITECTURE.md)** ✅ - Complete system specification
- **[Implementation Roadmap](./implementation/ROADMAP-CESIUM-FIRST.md)** ✅ - Phase-ordered plan with gates

### For Developers
- **[Development Setup](./tutorials/DEV-SETUP.md)** ✅ - Local environment configuration
- **[Testing Guide](./implementation/TESTING.md)** ✅ - Test strategies and tools
- **[Migration Guide](./MIGRATION-GUIDE.md)** ✅ - File path changes (IMPORTANT: Read before searching!)

### For Understanding the System
- **[Full Architecture](./architecture/RELAY-CESIUM-ARCHITECTURE.md)** ✅ - One canonical document
- **[Roadmap with Gates](./implementation/ROADMAP-CESIUM-FIRST.md)** ✅ - Phase-ordered implementation
- **[Stigmergic Coordination](./architecture/STIGMERGIC-COORDINATION.md)** ✅ - How coordination emerges

### For Governance & Business
- **[Pressure Model](./governance/PRESSURE-MODEL.md)** ✅ - How urgency accumulates
- **[Governance Cadence](./governance/GOVERNANCE-CADENCE.md)** ✅ - When decisions happen
- **[Stage Gates](./governance/STAGE-GATES.md)** ✅ - Checkpoints and enforcement
- **[Operating Model](./business/RELAY-OPERATING-MODEL.md)** ✅ - Roles, patterns, operations
- **[Relay for Leaders](./business/RELAY-FOR-LEADERS.md)** ✅ - Executive summary

### For Features
- **[File Organization](./features/FILE-ORGANIZATION.md)** ✅ - Desktop agent for local file organization

---

## 📂 Documentation Structure

```
docs/
├── 00-START-HERE.md                              ← You are here
├── MIGRATION-GUIDE.md                            ← Old path → New path mapping ✅
│
├── architecture/                                 ← System design
│   ├── RELAY-CESIUM-ARCHITECTURE.md              ← ONE CANONICAL DOC ✅
│   │   • System statement (globe is product)
│   │   • World topology (Earth, boundaries, trees, time)
│   │   • Core data model (RelayState)
│   │   • Renderer adapters (Cesium-specific)
│   │   • LOD system (hysteresis)
│   │   • Interaction model (picking, inspectors)
│   │   • Safety locks (no mixed engines, core/app split)
│   │   • Gates & tests
│   └── STIGMERGIC-COORDINATION.md                ← Coordination model ✅
│       • How coordination emerges
│       • Environmental signals (heat, deformation, timeboxes)
│       • No direct messaging
│
├── governance/                                   ← Decision & authority
│   ├── PRESSURE-MODEL.md                         ← How urgency accumulates ✅
│   │   • Pressure sources (votes, staleness, divergence)
│   │   • Pressure sinks (resolution, expiry, reconciliation)
│   │   • Visual encoding (heat, deformation, motion)
│   ├── GOVERNANCE-CADENCE.md                     ← When decisions happen ✅
│   │   • Weekly, monthly, event-triggered
│   │   • Promotion thresholds
│   │   • Reconciliation windows
│   │   • Sunset rules
│   └── STAGE-GATES.md                            ← Checkpoints & enforcement ✅
│       • Technical gates (boot, LOD, containsLL)
│       • Governance gates (quorum, approval, reconciliation)
│       • Documentation gates (link integrity)
│
├── business/                                     ← Operating model
│   ├── RELAY-OPERATING-MODEL.md                  ← Roles & patterns ✅
│   │   • Business roles (steward, operator, delegate)
│   │   • Organizational patterns (single tree, multi-site, consortium)
│   │   • Onboarding/offboarding
│   │   • Financial model
│   └── RELAY-FOR-LEADERS.md                      ← Executive summary ✅
│       • What is Relay (plain terms)
│       • Why it exists (problems solved)
│       • Business value
│       • Decision framework
│
├── features/                                     ← Feature specifications
│   └── FILE-ORGANIZATION.md                      ← Desktop agent ✅
│       • Local-only file organization
│       • Read-only observer
│       • Timeboxed execution with approval
│       • Full audit trail + reversibility
│
├── implementation/                               ← How to build
│   ├── ROADMAP-CESIUM-FIRST.md                   ← Phase-ordered plan ✅
│   │   • Phase 0-8 with gates
│   │   • Pass/fail criteria
│   │   • Blocked-by dependencies
│   │   • Current status per phase
│   └── TESTING.md                                ← Test strategies ✅
│       • Unit, integration, E2E, performance
│       • Gate tests (boot, LOD, containsLL)
│       • Coverage goals
│
└── tutorials/                                    ← Step-by-step
    ├── QUICK-START.md                            ← 5-minute setup ✅
    └── DEV-SETUP.md                              ← Dev environment ✅
```

**Gold standard docs complete** ✅
**All links verified** ✅

---

## 🗺 Key Architectural Decisions

### **Decision 1: Cesium-First World** (2026-02-06)
- **What**: Single Cesium scene graph, no Three.js in production
- **Why**: The globe IS the product. One world, one renderer.
- **Impact**: All filament/tree rendering uses Cesium primitives
- **Docs**: [RELAY-CESIUM-ARCHITECTURE.md](./architecture/RELAY-CESIUM-ARCHITECTURE.md) ✅

### **Decision 2: Renderer-Agnostic Core** (Lock F)
- **What**: `core/**` cannot import Cesium or DOM
- **Why**: Business logic must be testable and portable
- **Impact**: All rendering happens in `app/renderers/**`
- **Docs**: [RELAY-CESIUM-ARCHITECTURE.md](./architecture/RELAY-CESIUM-ARCHITECTURE.md) ✅

### **Decision 3: Modular Architecture** (Lock B)
- **What**: No single-file monoliths > 500 lines
- **Why**: Maintainability and code review
- **Impact**: `relay-cesium-world.html` is thin entrypoint, logic in modules
- **Docs**: [DEV-SETUP.md](./tutorials/DEV-SETUP.md) ✅

### **Decision 4: Phase-Ordered Implementation** (Gate-Driven)
- **What**: All work is phase-ordered with pass/fail gates
- **Why**: No "done" without verified gate passage
- **Impact**: See roadmap for current phase status
- **Docs**: [ROADMAP-CESIUM-FIRST.md](./implementation/ROADMAP-CESIUM-FIRST.md) ✅

---

## 📖 Common Tasks

### "I want to understand the whole system"
1. Read: [RELAY-CESIUM-ARCHITECTURE.md](./architecture/RELAY-CESIUM-ARCHITECTURE.md) ✅ (one canonical doc)
2. Check: [ROADMAP-CESIUM-FIRST.md](./implementation/ROADMAP-CESIUM-FIRST.md) ✅ (phase status)
3. Run: `npm run dev:cesium` and drop an Excel file

### "I want to add a new feature"
1. Read: [RELAY-CESIUM-ARCHITECTURE.md](./architecture/RELAY-CESIUM-ARCHITECTURE.md) ✅ (system design)
2. Check: [ROADMAP-CESIUM-FIRST.md](./implementation/ROADMAP-CESIUM-FIRST.md) ✅ (which phase?)
3. Follow: [DEV-SETUP.md](./tutorials/DEV-SETUP.md) ✅ (dev workflow)
4. Test: Run `npm run boot-gate` before committing

### "I want to get started quickly"
1. Follow: [QUICK-START.md](./tutorials/QUICK-START.md) ✅ (5 minutes)
2. Setup: [DEV-SETUP.md](./tutorials/DEV-SETUP.md) ✅ (development)
3. Test: [TESTING.md](./implementation/TESTING.md) ✅ (test strategies)

### "I can't find a file that used to exist"
1. Check: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) ✅ (old→new path mapping)
2. Search: `archive/` - Historical files preserved there

---

## 🔒 Architectural Locks (Non-Negotiable)

These rules are enforced to maintain system integrity:

| Lock | Rule | Enforced By |
|------|------|-------------|
| **Lock A** | Archive, don't delete (reversible moves) | `scripts/move-with-log.mjs` |
| **Lock B** | Thin entrypoint, modular implementation | Code review |
| **Lock C** | No dependency cleanup until boot gate passes | `npm run boot-gate` |
| **Lock D** | Boundaries are re-implemented (not "restored") | Implementation review |
| **Lock E** | Documentation preserves link integrity | `npm run link-audit` |
| **Lock F** | `core/**` cannot import Cesium | Linter + code review |

---

## 📊 Documentation Health

Run these commands to verify documentation integrity:

```bash
# Audit all markdown links
npm run link-audit

# Check for broken references
npm run verify:docs

# Generate documentation index
npm run docs:index
```

---

## 🆘 Need Help?

- **Understanding system?** Read [RELAY-CESIUM-ARCHITECTURE.md](./architecture/RELAY-CESIUM-ARCHITECTURE.md) ✅
- **Quick start?** Follow [QUICK-START.md](./tutorials/QUICK-START.md) ✅
- **Development setup?** See [DEV-SETUP.md](./tutorials/DEV-SETUP.md) ✅
- **Testing?** Check [TESTING.md](./implementation/TESTING.md) ✅
- **Bug?** Open an issue
- **Unclear docs?** Open a docs issue

---

## 📜 Historical Context

For understanding system evolution:

- **Archive**: `archive/` folder preserves all historical progress
- **Commit History**: `archive/commit-history/Commit-Nodes/`
- **Status Reports**: `archive/status-reports/`
- **Archive Index**: `archive/ARCHIVE-INDEX.md`

**Rule**: Current docs live in `docs/`. Archive is read-only historical reference.

---

*This documentation follows Relay's "One Truth" principle: single source, explicit lineage, no hidden references.*
