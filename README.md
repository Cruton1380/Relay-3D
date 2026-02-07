# 🌍 Relay: Crypto-Geometric Architecture

**Version**: 1.0.0 (Cesium-First Architecture)  
**Last Updated**: 2026-02-06

Relay is a **crypto-geometric system** combining 3D visualization with cryptographic validation.

**Visual Layer**: Companies as trees (leaves=encrypted data, branches=state, roots=history)  
**Validation Layer**: Merkle trees + signatures (core validates WITHOUT decrypting)  
**Architecture**: 1:Many convergence (Leaves → Branches → Company → Region → Core)

**📚 See**: `RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md` for complete spec with ASCII art

---

## ⚡ Current Status (2026-02-06)

### 🎯 Crypto-Geometric Architecture

Relay is a **crypto-geometric system** where:
- **3D visualization** shows organizational structure (trees, branches, leaves)
- **Cryptographic validation** proves integrity without exposing private data
- **Merkle trees** bundle commitments from leaves → branches → companies → regions → core
- **Encryption** protects confidentiality (at leaf level) while enabling verification (above leaves)

**Core Principle**: "Leaf = encrypted payload; everything above leaf = hashes + signatures + Merkle roots."

See **`RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md`** for complete crypto-geometric model.  
See **`RELAY-ENCRYPTION-PERMISSION-SPEC.md`** for encryption & permission details:
- **What gets encrypted**: Leaves (cells/events) only
- **What stays public**: Hashes + signatures + Merkle roots
- **Core validation**: Validates **integrity and authorization of commitments**, NOT plaintext content
- **Permission model**: Envelope encryption (Pattern B) recommended for efficiency

### ✅ What Works (Honest Assessment)
- **Cesium Globe**: OSM imagery + ellipsoid terrain ✅
- **Excel Import**: Drag-and-drop .xlsx working ✅
- **LOD Governor**: 7 levels with hysteresis ✅
- **ENU Coordinates**: All geometry in meters (not degrees) ✅
- **Primitives Rendering**: Trunk, branches, filaments as Cesium primitives ✅
- **Anchor Marker**: Cyan pin independent of buildings/terrain ✅
- **Staged Filaments**: Cell→Spine→Branch (no spaghetti) ✅
- **Visual Model**: Spreadsheet planes + cell grids + timeboxes ✅
- **Single Branch Proof**: Validation gates for correctness ✅
- **Demo Tree**: Avgol @ Tel Aviv with canonical topology ✅
- **Crash Prevention**: NaN guards + fail-soft architecture ✅
- **Phase 2 Proof**: Core-routed relationships (primitives) ✅

### 📊 Canonical Tree Topology (ENU-Based, Phase 2.1)
The system now uses **ENU (East-North-Up) coordinates** for accurate geometry:
- **Trunks**: Vertical pillars along **ENU Up** (0m → 2000m, local vertical, not world Z)
- **Branches**: Parallel ribs along **ENU East** (+X, treeOut)
  - Length: 800m along +East
  - Spacing: 35m in +North (treeSide, tight)
  - Arc: Controlled sag (150m amplitude, first 30% rises monotonically)
  - All parallel, same altitude (2000m at trunk top)
- **Sheets**: Horizontal planes **ENU Up normal** (facing upward)
  - Position: Branch endpoint + (0, 0, +300m)
  - Size: 280m × 220m (treeOut × treeSide)
  - Cell grid: 8×6 or 6×5 depending on sheet
  - Viewable from top (TopDown camera preset)
- **Filaments**: **Staged** (not direct cell→branch)
  - Stage 1: Cell → SheetBundleSpine (many thin lines, 50m below sheet)
  - Stage 2: Spine → Branch endpoint (one thick conduit)
  - Prevents spaghetti, shows hierarchical flow
- **Timeboxes**: **Dynamic spacing** (length-derived)
  - Spacing: 250m minimum between timeboxes
  - Count: Derived from limb length (not fixed 6/4)
  - Max: 12 per limb segment
  - Animation: Turgor force pulsing (based on openDrifts/scarCount)

### ⚠️ What's Degraded (Explicit Status)
- **🏢 Buildings**: DEGRADED (Ion 401 - no 3D building tiles)
- **🗺️ Boundaries**: DISABLED (feature flag off, can be re-enabled)

**HUD Display**: Capabilities panel shows real-time status of buildings, boundaries, and filament mode.

### ✅ Phase 2.1 - Primitives Migration (PASSED)
**Status**: ✅ PASSED  
**Date**: 2026-02-06  
**All Gates**: ✅ PASSED (Gates 0-5 verified)

**Verified Console Output** (Single Branch Proof):
```
✅ Tree rendered:
  Primitives: 51 (trunk=1, branches=1, cell-filaments=48, spines=1)
  Entities: 107 (labels=49, cell-points=48, timebox-labels=10)

[GATE 2] Branch Length: 800.0m (expected: 800m)
         Length Error: 0.0m
```

**Proof Artifacts**:
- ✅ `archive/proofs/phase2.1-single-branch-console.log`
- ✅ Screenshots (side + top views)
- ✅ `PHASE-2.1-PASSED.md`

### ✅ Phase 2.2 - Full Tree Restoration (IMPLEMENTED)
**Status**: ✅ Implemented, awaiting verification  
**Date**: 2026-02-06

**Changed**:
- Set `SINGLE_BRANCH_PROOF = false`
- Restored 2 branches, 2 sheets
- Expected: `Primitives: 84 (trunk=1, branches=2, cell-filaments=78, spines=2, root=1)`

**Gate B**: PASS if console shows `branches=2, spines=2`

### ✅ Phase 2.3 - Root Continuation Segment (IMPLEMENTED)
**Status**: ✅ Implemented, awaiting verification  
**Date**: 2026-02-06

**Added**:
- Root segment extending DOWN from anchor (ENU -Z)
- Depth: 500-2000m (LOD-dependent)
- Color: Dark brown (darker than trunk)
- Width: 12px (thicker than trunk)
- **NOT extending to Earth center** (local segment only)

**Console Output**:
```
[Phase 2.3] Root continuation: 1000m below anchor (aligned to ENU Up/Down)
```

**Gate C**: PASS if root visible below anchor, aligned to trunk

See `PHASE-2.2-AND-2.3-IMPLEMENTED.md` for details.

### 📋 Next: Phase 3 - Material Timeboxes
See [ROADMAP-CESIUM-FIRST.md](./docs/implementation/ROADMAP-CESIUM-FIRST.md) for full roadmap.

---

## 📚 Complete Documentation

### 🌟 Architecture & Vision
- **`RELAY-CRYPTO-GEOMETRIC-ARCHITECTURE.md`** ⭐ Complete spec (ASCII art + crypto + geometry + 1:many relationships)
- **`COMPLETE-SYSTEM-SUMMARY.md`** ⭐ Full system summary with all phases
- **`UNDERSTANDING-CONFIRMED.md`** - System overview and core principles
- **`PATH-FORWARD-SUMMARY.md`** - Implementation roadmap (Phases 2-8)

### Current Status (Phases 2.1-2.3)
- **`PHASE-2.1-PASSED.md`** ✅ All gates PASSED (verified)
- **`PHASE-2.2-AND-2.3-IMPLEMENTED.md`** ✅ Full tree + root continuation
- `GATES-1-TO-5-IMPLEMENTED.md` - Validation gates
- `SINGLE-BRANCH-PROOF-IMPLEMENTATION.md` - Step-by-step guide
- `archive/proofs/phase2.1-single-branch-console.log` - Proof artifact

### Core Code (ENU-Based Primitives)
- `app/utils/enu-coordinates.js` - ENU coordinate system + CANONICAL_LAYOUT
- `app/renderers/filament-renderer.js` - Primitives rendering (trunk, branches, filaments, root, anchor)
- `relay-cesium-world.html` - Main application + camera presets
- `core/models/relay-state.js` - Pure data model
- `core/services/lod-governor.js` - 7-level LOD system

---

## 🚀 Quick Start

### Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev:cesium

# Open in browser
# http://localhost:8000
```

### What You'll See

When you open `http://localhost:8000`:

1. **Demo tree at Tel Aviv** - Avgol company with branches (renders automatically)
2. **Map imagery** - OpenStreetMap tiles (may take 5-10 seconds to load)
3. **Boundaries** - Israel and USA outlined in bright cyan
4. **Drop zone** - "Drop Excel File" area (center of screen)

### Drop an Excel File

1. Open `http://localhost:8000`
2. Drag and drop an `.xlsx` file onto the drop zone
3. Watch your data transform into a 3D tree structure
4. Demo tree will be replaced with your data

**Troubleshooting port conflict**:
```bash
# If you get "EADDRINUSE :8000" error:
# Option 1: Kill existing server
netstat -ano | findstr :8000  # Find PID
taskkill /PID <pid> /F        # Kill process

# Option 2: Use different port
# Edit scripts/dev-server.mjs and change PORT to 8001
```

---

## 📂 Project Structure

```
relay-cesium-world.html   Single production entrypoint
index.html                Redirects to main app

app/                      Cesium-specific rendering
  ├── cesium/             Viewer initialization
  ├── renderers/          Filament/boundary renderers
  ├── ui/                 HUD, info panels
  └── excel-importer.js   Excel parsing

core/                     Renderer-agnostic logic (NO Cesium imports)
  ├── models/             State models (relayState)
  ├── services/           LOD Governor, boundaries
  └── utils/              Logging, math utilities

data/                     GeoJSON boundaries, samples
docs/                     Gold standard documentation
archive/                  Historical progress (read-only)
scripts/                  Build tools, dev server
tests/                    Test suites
```

---

## 🔒 Architectural Locks

1. **Lock F**: `core/**` cannot import Cesium (renderer-agnostic)
2. **Lock B**: No monolith files > 500 lines (modular architecture)
3. **Lock C**: No dependency cleanup until boot gate passes

See [ROOT-CONTRACT.md](./ROOT-CONTRACT.md) for full workspace rules.

---

## 📚 Documentation

**Start here**: [docs/00-START-HERE.md](./docs/00-START-HERE.md)

**Key documents**:
- [Architecture Overview](./docs/architecture/RELAY-CESIUM-ARCHITECTURE.md)
- [Migration Guide](./docs/MIGRATION-GUIDE.md) - Old→new file paths
- [Development Setup](./docs/tutorials/DEV-SETUP.md)

---

## 🧪 Testing

```bash
# Run boot gate test (validates core functionality)
npm run boot-gate

# Run unit tests
npm test

# Run link audit (check documentation integrity)
npm run link-audit
```

---

## 🛠 Development

### Available Scripts

```bash
npm run dev:cesium        # Development server (port 8000)
npm run boot-gate         # Boot gate test (must pass before cleanup)
npm run link-audit        # Check documentation links
npm test                  # Run test suite
npm run lint              # Lint code
```

### Adding Features

1. Business logic → `core/` (NO Cesium imports)
2. Rendering → `app/renderers/`
3. Documentation → `docs/`
4. Tests → `tests/`

---

## 🎯 System Overview

### What Relay Does

- **Visualizes organizations** as 3D tree structures
- **Anchors to real geography** (branches at company locations)
- **Renders spreadsheets** as sheets at branch endpoints
- **Manages LOD** (level of detail) based on camera altitude
- **Enforces governance** through explicit authority policies

### Core Concepts

- **Tree**: Organizational structure (trunk → branches → sheets)
- **Filaments**: Data dependencies (cell → cell connections)
- **Timeboxes**: Commit windows (temporal segmentation)
- **Boundaries**: Geopolitical jurisdictions (GeoJSON polygons)
- **LOD Governor**: Altitude-based detail management

---

## 🌐 Technology Stack

- **Cesium.js** - 3D globe rendering (terrain, buildings, imagery)
- **XLSX.js** - Excel file parsing
- **ES6 Modules** - Modular architecture
- **Node.js** - Development server
- **Vitest** - Testing framework

---

## 📦 Dependencies

### Core Dependencies
- `cesium` (via CDN)
- `xlsx` (via CDN)

### Dev Dependencies
- Node.js 18+
- npm 8+

See [package.json](./package.json) for full list.

---

## 🤝 Contributing

1. Read [ROOT-CONTRACT.md](./ROOT-CONTRACT.md) - Workspace rules
2. Read [docs/00-START-HERE.md](./docs/00-START-HERE.md) - Documentation index
3. Follow [Development Setup](./docs/tutorials/DEV-SETUP.md) - Project structure
4. Test with `npm run boot-gate` before committing

---

## 📜 License

MIT License - See [LICENSE](./LICENSE)

---

## 🔗 Links

- **Documentation**: [docs/00-START-HERE.md](./docs/00-START-HERE.md)
- **Architecture**: [docs/architecture/](./docs/architecture/)
- **API Reference**: [docs/api/](./docs/api/)
- **Archive**: [archive/ARCHIVE-INDEX.md](./archive/ARCHIVE-INDEX.md)

---

*Relay: One world, one scene graph, one truth.*
