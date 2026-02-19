# Relay

A coordination OS built on a Cesium 3D globe with canonical filament geometry.

## Quick Start

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## What You See

A rotating Earth. Real country, province, and city boundaries rendered from GeoJSON data.
This is Stage 0 — the empty globe waiting for its first tree.

## Architecture

The definitive system specification lives in one file:

**[docs/architecture/RELAY-MASTER-BUILD-PLAN.md](docs/architecture/RELAY-MASTER-BUILD-PLAN.md)**

Read it. Everything else is built from it.

## Repository Structure

```
docs/architecture/    The Master Plan (constitution)
data/boundaries/      GeoJSON boundaries (countries, provinces, cities)
scripts/              Dev server and tooling
app/                  Application code (built incrementally)
```

## Recovery

All prior code, proof scripts, and archives are preserved in git history under the tag `RELAY-PRE-CLEAN-ARCHIVE-V93`. To recover any file:

```bash
git checkout RELAY-PRE-CLEAN-ARCHIVE-V93 -- <path>
```
