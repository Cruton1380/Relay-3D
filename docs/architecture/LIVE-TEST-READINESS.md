# Live Test Readiness (Globe + Core)

Date: 2026-02-12

This document defines the exact launch commands and expected PASS lines for live system review.

## 1) Start Commands

Run in two terminals:

```bash
npm run dev:cesium
```

```bash
npm run dev:globe-services
```

## 2) Launch URLs

- Proof mode (default, control path):
  - `http://localhost:3000/relay-cesium-world.html`
- World mode (required for restore-0/1 globe features):
  - `http://localhost:3000/relay-cesium-world.html?profile=world`
- Globe services status:
  - `http://127.0.0.1:4020/api/globe/weather/status`

**Launch rule**: world mode must be selected via URL query (`?profile=world`).  
Do not use init-script profile overrides for live validation.

## 3) Expected PASS Indicators

### Cesium app server

- Startup line contains:
  - `Server running at http://localhost:3000`

### Globe services server

- Startup line contains:
  - `[GLOBE-SERVICES] listening http://127.0.0.1:4020 mode=fixture fixtureSupported=true`

### World mode runtime

- Browser console contains:
  - `[PROFILE] RELAY_PROFILE=world`
  - `[GLOBE] imagery registry enabled modes=...`
  - `[GLOBE] services weatherBase=http://127.0.0.1:4020`
- Region/cluster APIs in runtime exist:
  - `relayGlobeListClusterLevels`, `relayGlobeSetClusterLevel`
  - `relayGlobeListRegions`, `relayGlobeSetFocusRegion`, `relayGlobeFocusNextRegion`
  - `relayGlobeLoadCountrySet`, `relayGlobeGetState`
- Restore-3 scope APIs in runtime exist:
  - `loadRestore3GeoFixture`
  - `relayScopeGetState`
  - `relayScopeListCountries`, `relayScopeListRegions`, `relayScopeListSites`
  - `relayScopeSelectCountry`, `relayScopeSelectRegion`, `relayScopeSelectSite`
- Restore-4 assignment APIs in runtime exist:
  - `loadRestore4AssignmentFixture`
  - `relayGetAssignmentState`
  - `relayAssignBranchToSitePropose`, `relayAssignBranchToSiteCommit`
  - `relayScopeInspectorRefresh`
- Restore-4 world runtime behavior:
  - Scope Inspector reads deterministic local bindings only.
  - Branch/site assignment display shows in-scope and out-of-scope branch lists.
  - Cross-scope action attempts surface explicit refusal (`GOV_SCOPE_VIOLATION`).
  - No external geography APIs, no live dataset pulls, no environment-dependent map layers.
- Weather APIs in runtime exist:
  - `relayListWeatherTypes`, `relayWeatherAdd`, `relayWeatherRemove`, `relayWeatherClear`
- Topography APIs in runtime exist:
  - `relayListTopographyModes`, `relayTopographyApply`, `relayTopographyClear`

### Proof mode isolation

- Browser console contains:
  - `[PROFILE] RELAY_PROFILE=proof`
- Weather/topography calls return refusal:
  - `PROFILE_LOCKED_PROOF`

## 4) Required Proof/Regression Commands

```bash
node scripts/globe-restore-0-proof.mjs
node scripts/globe-restore-1-proof.mjs
node scripts/globe-restore-2a-proof.mjs
node scripts/globe-restore-3-proof.mjs
node scripts/globe-restore-4-proof.mjs
node scripts/usp1-ux-stabilization-proof.mjs
node scripts/cam0-filament-ride-proof.mjs
node scripts/boundary-editor-proof.mjs
node scripts/voting-ui-reactivation-proof.mjs
node scripts/restore-full-parity-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

## 5) Expected Gate Summary Lines

- `[GLOBE-RESTORE-0] gate-summary result=PASS`
- `[GLOBE-RESTORE-1] gate-summary result=PASS`
- `[GLOBE-RESTORE-2A] gate-summary result=PASS`
- `[GLOBE-RESTORE-3] gate-summary result=PASS`
- `[GLOBE-RESTORE-4] gate-summary result=PASS`
- `[USP1] gate-summary result=PASS`
- `[CAM0.4.2] gate-summary result=PASS`
- `[BOUNDARY-A1] gate-summary result=PASS`
- `[VOTE-A2] gate-summary result=PASS`
- `[PARITY] gate-summary result=PASS`
- `[OSV1] gate-summary result=PASS`
- `[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`

## 6) Scope Rails During Live Test

- No MapLibre/Deck overlay stack.
- No proximity lifecycle feature work (`F0.4`) in this restore baseline.
- No new feature slices after parity closure unless a new execution plan is approved.
- Keep restore baseline frozen; allow bug fixes and docs sync only.
