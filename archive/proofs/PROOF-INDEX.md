# 🔬 Relay Phase Proof Artifacts Index

**Created**: 2026-02-06  
**Purpose**: Verifiable evidence for all "PASSED" phase gates  
**Rule**: No phase is "done" without proof artifacts referenced here

---

## Governance (Docs + Review Rails)

- `archive/proofs/docs-review-policy-link-2026-02-14.log`
- `archive/proofs/docs-review-checklist-hardening-2026-02-14.log`
- `archive/proofs/node-ring-grammar-spec-2026-02-14.log`
- `archive/proofs/proof-log-tracking-policy-2026-02-14.log`

---

## LCK-1: Boundary Restore and Proof ✅ PASSED

**Date**: 2026-02-11  
**Scope**: Social Activation Lockdown Addendum (`LCK-1`) runtime evidence

**Current Result**:
- ✅ Boundary rendering restored in active Cesium runtime
- ✅ `containsLL` self-test suite PASS (inside/outside probes for ISR + USA)
- ✅ Deterministic hole fixture suite PASS (`inside hole => false`, `inside outer/outside hole => true`, `outside all => false`)
- ✅ Governance voting scope set to `BOUNDARY_ENABLED` after boundary pass
- ✅ G3 runtime gate line reports PASS

**Proof Artifacts**:
- `archive/proofs/lck1-boundary-console-2026-02-11.log`
- `archive/proofs/lck1-boundary-screenshot-2026-02-11.png`

**Required Log Lines Present**:
- `[BOUNDARY] restore result=PASS renderer=BoundaryRenderer containsLL=PASS ...`
- `[BOUNDARY] containsll suite=PASS ...`
- `[BOUNDARY] containsll hole-suite=PASS probes=3`
- `[BOUNDARY] voting-scope mode=BOUNDARY_ENABLED reason=boundary-pass`
- `[GATE] G3 status=PASS evidence=lck1-runtime-2026-02-11`

**Verification Command**:
```bash
node scripts/lck1-boundary-proof.mjs
```

**Verification Summary**:
- Browser run executed in headed mode via `node scripts/lck1-boundary-proof.mjs`.
- Artifacts refreshed on 2026-02-11 and indexed here.

---

## LCK-2: Voting Canon Unification ✅ PASSED

**Date**: 2026-02-11  
**Scope**: Social Activation Lockdown Addendum (`LCK-2`) canonical voting semantics proof

**Current Result**:
- ✅ Single quorum model verified from cadence table only (`weekly=0.30`, `monthly=0.50`, `event=0.60`, `constitutional=0.75`)
- ✅ Deterministic eligibility snapshot generated with frozen timestamp, voter count, and snapshot hash
- ✅ Flow/content voting and governance voting separation logged
- ✅ Pressure isolation logged (`voteWeight/quorum/window = UNCHANGED`)
- ✅ Strict-boundary governance logged (`global influence on company authority = DISABLED`)

**Proof Artifacts**:
- `archive/proofs/lck2-vote-canon-console-2026-02-11.log`

**Required Log Lines Present**:
- `[VOTE-CANON] quorum-model=CADENCE_TABLE status=PASS ...`
- `[VOTE-CANON] eligibility-snapshot scope=<...> voters=<n> frozenAt=<ts> snapshotHash=<hash>`
- `[VOTE-CANON] separation flowVoting=ranking-only governanceVoting=authority`
- `[VOTE-CANON] pressure-isolation voteWeight=UNCHANGED quorum=UNCHANGED window=UNCHANGED`
- `[VOTE-CANON] strict-boundary-governance globalInfluenceOnCompanyAuthority=DISABLED`

**Verification Command**:
```bash
node scripts/lck2-vote-canon-proof.mjs
```

---

## LCK-3: Governance Executable Spec ✅ PASSED

**Date**: 2026-02-11  
**Scope**: Social Activation Lockdown Addendum (`LCK-3`) executable governance lifecycle proof

**Current Result**:
- ✅ Lifecycle runner executes explicit state machine:
  - `DRAFT -> HOLD -> PROPOSE -> VOTE_WINDOW -> PASS|FAIL|VETO -> COMMIT|REFUSAL`
- ✅ Quorum evaluation uses frozen eligibility snapshot (`eligible`, `participated`, cadence threshold)
- ✅ Delegation precedence enforced (direct vote overrides delegation)
- ✅ Veto path enforced with explicit HOLD + reconciliation action log
- ✅ Stage unlock determinism logged (`commitRequired=true`)
- ✅ Scope isolation logged and enforced

**Proof Artifacts**:
- `archive/proofs/lck3-governance-console-2026-02-11.log`

**Required Log Lines Present**:
- `[GOV] state-transition from=<...> to=<...> proposalId=<...> scope=<...>`
- `[GOV] quorum-eval proposalId=<...> eligible=<n> participated=<n> threshold=<...> result=<PASS|FAIL|VETO>`
- `[GOV] delegation-resolve proposalId=<...> directVotes=<n> delegatedVotes=<n>`
- `[GOV] veto proposalId=<...> by=<role|user> action=HOLD_RECONCILE scope=<...>`
- `[GOV] stage-unlock proposalId=<...> voteResult=<...> commitRequired=true commitId=<...>`
- `[GOV] scope-isolation proposalId=<...> proposalScope=<...> commitScope=<...> result=<PASS|REFUSAL>`

**Verification Command**:
```bash
node scripts/lck3-governance-proof.mjs
```

---

## LCK-4: Proof Index Completeness ✅ PASSED

**Date**: 2026-02-11  
**Scope**: Social Activation Lockdown Addendum (`LCK-4`) prerequisite proof-index integrity sweep

**Current Result**:
- ✅ LCK-1 section has command block, criteria block, and required artifacts on disk
- ✅ LCK-2 section has command block, criteria block, and required artifacts on disk
- ✅ LCK-3 section has command block, criteria block, and required artifacts on disk
- ✅ No `MISSING:` placeholders in prerequisite lock sections (`LCK-1..LCK-3`)

**Proof Artifacts**:
- `archive/proofs/lck4-proof-index-console-2026-02-11.log`

**Required Log Lines Present**:
- `[PROOF] audit lockGroup=LCK-1 result=PASS artifacts=2`
- `[PROOF] audit lockGroup=LCK-2 result=PASS artifacts=1`
- `[PROOF] audit lockGroup=LCK-3 result=PASS artifacts=1`
- `[PROOF] index-sync result=PASS missing=0`

**Verification Command**:
```bash
node scripts/lck4-proof-index-sweep.mjs
```

---

## GLOBE-RESTORE-0: Imagery Registry + Satellite ✅ PASSED (v0)

**Date**: 2026-02-12  
**Scope**: World-only imagery registry + satellite toggle parity with proof isolation

**Current Result**:
- ✅ Profile gate introduced with default `proof`
- ✅ `RELAY_PROFILE=proof` keeps existing OSM-only runtime path unchanged
- ✅ `RELAY_PROFILE=world` enables imagery registry and runtime mode switching
- ✅ Restored v0 imagery modes: `local`, `clean-street`, `satellite`, `hybrid`, `osm`, `dark`, `minimalist`
- ✅ Toggle proof sequence passes: `osm -> satellite -> osm`
- ✅ Imagery layer invariant holds (`layerCount >= 1`)
- ✅ Required log line emitted: `[GLOBE] imagery mode=<...> provider=<...>`

**Proof Artifacts**:
- `archive/proofs/globe-restore-0-proof-console-2026-02-12.log`
- `archive/proofs/globe-restore-0-proof-2026-02-12.png`

**Verification Command**:
```bash
node scripts/globe-restore-0-proof.mjs
```

---

## AC0: Balanced Transfer Core ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: AC0 transfer conservation + mismatch posting gate + responsibility mirror proof

**Current Result**:
- ✅ Balanced transfer packet validates and passes
- ✅ Unbalanced transfer packet is refused (`UNBALANCED_TRANSFER_PACKET`)
- ✅ Unresolvable container leg is refused (`TRANSFER_PACKET_CONTAINER_UNRESOLVED`)
- ✅ 3-way match gate enforces explicit mismatch paths
- ✅ Variance mismatch path only allowed when variance leg exists
- ✅ Responsibility mirror baseline proof emits deterministic packet linkage line

**Proof Artifacts**:
- `archive/proofs/ac0-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[AC0] transfer-validate case=balanced result=PASS ...`
- `[AC0] transfer-validate case=unbalanced result=REFUSAL reason=UNBALANCED_TRANSFER_PACKET:currency`
- `[AC0] transfer-validate case=missing-container result=REFUSAL reason=TRANSFER_PACKET_CONTAINER_UNRESOLVED`
- `[AC0] match-gate case=mismatch-no-path result=MATCH_GATE_FAIL`
- `[AC0] match-gate case=mismatch-correction result=MATCH_GATE_FAIL_CORRECTION_REQUIRED`
- `[AC0] match-gate case=mismatch-variance result=ALLOW_WITH_VARIANCE`
- `[AC0] match-gate case=mismatch-variance-missing-leg result=MATCH_GATE_FAIL_VARIANCE_PACKET_MISSING`
- `[AC0] gate-summary result=PASS checks=9`

**Verification Command**:
```bash
node scripts/ac0-proof.mjs
```

---

## LGR0: Ledger v0 Projection ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Projection-only ledger from `TransferPacket` (no direct JE write surface)

**Current Result**:
- ✅ Happy path projection passes (`GR`, `INV`, `PAY`) and emits deterministic journal entries
- ✅ Trial balance computes from projected journal and passes
- ✅ Determinism holds when same packets are re-ordered (hashes match)
- ✅ Direct-entry write surface is absent in the ledger module API
- ✅ Mapping-missing refusal triggers on unmapped container reference

**Proof Artifacts**:
- `archive/proofs/lgr0-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[LGR0] project result=PASS journalEntries=<n> projectionHash=<...>`
- `[LGR0] trial-balance result=PASS rows=<n> tbHash=<...>`
- `[LGR0] determinism result=PASS orderAHash=<...> orderBHash=<...>`
- `[LGR0] direct-entry surface=ABSENT result=PASS`
- `[REFUSAL] reason=LEDGER_MAPPING_MISSING containerRef=<...>`
- `[LGR0] mapping-missing result=REFUSAL`

**Verification Command**:
```bash
node scripts/lgr0-proof.mjs
```

---

## D1: Ledger Gate ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Deterministic high-volume ledger gate over 1,000 synthetic transfer packets

**Current Result**:
- ✅ 1,000 deterministic packets generated and all packets balanced
- ✅ Projected journal entries balanced for every source packet/unit group
- ✅ Trial balance deterministic/repeatable across input order permutations
- ✅ Every projected posting row is linked to `sourceTransferPacketId` + `commitId`

**Proof Artifacts**:
- `archive/proofs/d1-ledger-gate-console-2026-02-11.log`

**Required Log Lines Present**:
- `[D1] packet-balance result=PASS packets=1000`
- `[D1] journal-balance result=PASS journalEntries=2000`
- `[D1] determinism result=PASS hashA=<...> hashB=<...>`
- `[D1] linkage result=PASS sourceTransferPacketId=REQUIRED commitId=REQUIRED`
- `[D1] gate result=PASS packets=1000 journalEntries=2000 trialBalanceRows=4`

**Verification Command**:
```bash
node scripts/d1-ledger-gate.mjs
```

---

## SG0: Stage Gates (Individual vs Global) ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Minimal executable stage gating (`ISG` learning vs `GSG` authority unlock)

**Current Result**:
- ✅ ISG allows training/preview mechanics at unlocked user stage
- ✅ GSG blocks authority-bearing mechanics until explicit COMMIT unlock
- ✅ Vote recommendation alone does not unlock global mechanics
- ✅ Stage unlock requires `commitId` and authority path

**Proof Artifacts**:
- `archive/proofs/sg0-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[REFUSAL] reason=STAGE_LOCKED requiredStage=<n> action=<...> scope=<...>`
- `[GOV] stage-unlock proposalId=<...> voteResult=PASS commitRequired=true commitId=none`
- `[GOV] stage-unlock proposalId=<...> voteResult=PASS commitRequired=true commitId=<commitId>`
- `[SG0] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/sg0-proof.mjs
```

---

## HEADLESS-0: Tier-1 Parity ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Renderer-independent parity gate for Tier-1 pipeline hashes (headless vs browser fixture run)

**Current Result**:
- ✅ Headless runner computes deterministic Tier-1 golden hashes for facts, matches, summaries, KPIs, packets, and ledger
- ✅ Runtime diagnostic exporter `relayGetGoldenStateHashes()` returns equivalent hash bundle
- ✅ Strict component-by-component comparison passes with zero divergences
- ✅ Divergence refusal rails implemented (`HEADLESS_DIVERGENCE`)

**Proof Artifacts**:
- `archive/proofs/headless-0-parity-console-2026-02-11.log`

**Required Log Lines Present**:
- `[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`
- `[REFUSAL] reason=HEADLESS_DIVERGENCE component=<...> expected=<...> actual=<...>` (emitted on mismatch path)

**Verification Command**:
```bash
node scripts/headless-tier1-parity.mjs
```

---

## P2P-CORE ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Relay-native PR→PO→GR→INV→PAY vertical slice through routes, match gate, AC0 packets, and LGR0 projection

**Current Result**:
- ✅ Scenario A (happy path) passes end-to-end: PR→PO→GR→INV→PAY
- ✅ GR/INV/PAY commits each produce validated TransferPacket + ResponsibilityPacket linkage
- ✅ 3-way match status resolves to `MATCH` in happy loop
- ✅ Scenario B (mismatch) refuses invoice commit until variance path is used
- ✅ Variance path commit succeeds only with variance container leg (`PriceVariance`)
- ✅ Ledger projection remains balanced and hashable after both scenarios

**Proof Artifacts**:
- `archive/proofs/p2p-core-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[P2P] scenario=happy result=PASS ...`
- `[AC0] scenario=happy packetsBalanced=PASS ...`
- `[LGR0] scenario=happy projectionHash=<...>`
- `[P2P] scenario=mismatch initialCommit=REFUSAL varianceCommit=PASS ...`
- `[REFUSAL] reason=MATCH_GATE_FAIL component=invoice-posting`
- `[AC0] scenario=mismatch varianceContainer=PASS container=PriceVariance`
- `[P2P] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/p2p-core-proof.mjs
```

---

## INV-CORE ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Inventory projection from TransferPackets (`on-hand` + valuation), deterministic and container-mapped

**Current Result**:
- ✅ On-hand projection computes `{ siteId, itemId, qtyOnHand }` from packet quantity legs
- ✅ Optional valuation projection computes `{ siteId, itemId, valueOnHandUSD }` from inventory currency legs
- ✅ Determinism holds under packet order shuffle (same hash)
- ✅ GR posting rule evidence validated (`+qty Inventory`, `-qty GRIR`)

**Proof Artifacts**:
- `archive/proofs/inv-core-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[INV-CORE] on-hand result=PASS rows=<n>`
- `[INV-CORE] determinism result=PASS hashA=<...> hashB=<...>`
- `[INV-CORE] posting-rules result=PASS packets=<n>`
- `[INV-CORE] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/inv-core-proof.mjs
```

---

## PAY-CORE ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Deterministic payment batch execution + AP/Cash posting + baseline bank reconciliation matching

**Current Result**:
- ✅ Deterministic `PAYBATCH-<id>` created from ordered payment IDs
- ✅ Batch execution emits payment transfer packets (`+AP`, `-CashBank`) with expected net deltas
- ✅ Ledger projection over payment packets passes balance checks
- ✅ Baseline reconciliation matcher produces deterministic `paymentId ↔ bankLineId` match objects
- ✅ Determinism holds across shuffled payment input order

**Proof Artifacts**:
- `archive/proofs/pay-core-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[PAY-CORE] batch-exec result=PASS ...`
- `[PAY-CORE] ledger-projection result=PASS ...`
- `[PAY-CORE] reconciliation result=PASS ...`
- `[PAY-CORE] determinism result=PASS hashA=<...> hashB=<...>`
- `[PAY-CORE] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pay-core-proof.mjs
```

---

## TAX0 ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Minimal tax/jurisdiction export rails with deterministic CSV/JSON outputs

**Current Result**:
- ✅ INV/PAY tax metadata normalization rails available (`jurisdiction`, `taxTreatment`, `taxRate`, `taxAmount`)
- ✅ Tax report export returns deterministic JSON and CSV outputs with stable hashes
- ✅ Determinism holds under shuffled input order
- ✅ Multi-jurisdiction coverage proven in export scenario

**Proof Artifacts**:
- `archive/proofs/tax0-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[TAX0] export result=PASS rows=<n> jsonHash=<...> csvHash=<...>`
- `[TAX0] determinism result=PASS jsonA=<...> jsonB=<...> csvA=<...> csvB=<...>`
- `[TAX0] jurisdiction-coverage result=PASS jurisdictions=<...>`
- `[TAX0] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/tax0-proof.mjs
```

---

## PAY/TAX Runtime Hardening ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Runtime guardrails for PAY commit reconciliation enforcement and TAX export validation determinism

**Current Result**:
- ✅ PAY commit refusal rail works when reconciliation enforcement is enabled and bank match is missing
- ✅ Refusal path forces `HOLD` material state (`reason=PAY_RECON_FAIL`)
- ✅ PAY commit succeeds after matching bank statement line exists for the payment
- ✅ TAX runtime validation reports invalid tax rows and stays deterministic across repeated runs

**Proof Artifacts**:
- `archive/proofs/pay-tax-runtime-hardening-console-2026-02-11.log`

**Required Log Lines Present**:
- `[PAY-CORE] runtime-guard refusal-path result=PASS reason=PAY_RECON_FAIL modeAfterFail=HOLD ...`
- `[PAY-CORE] runtime-guard matched-commit result=PASS paymentId=<...> commitId=<...> recon=MATCHED`
- `[TAX0] runtime-validate invalid-detect result=PASS invalidCount=<n>`
- `[TAX0] runtime-validate determinism result=PASS hashA=<...> hashB=<...>`
- `[PAY-TAX] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pay-tax-runtime-hardening-proof.mjs
```

---

## C1-BLOCKER: Module-Agnostic Recompute ✅ PASSED

**Date**: 2026-02-11  
**Scope**: Tier-2 blocker closure for C1 (`recomputeModuleChain` must be module-agnostic, not P2P-hardcoded)

**Current Result**:
- ✅ Initial C1 attempt surfaced blocker with explicit refusal:
  - `[REFUSAL] reason=C1_BLOCKER_MODULE_LOAD moduleAgnosticRecompute=UNREACHABLE`
- ✅ Minimal engine patch applied:
  - module registry (`moduleId -> moduleDef`)
  - sheet registry (`sheetId -> moduleId`)
  - recompute resolves module by edited sheet
- ✅ Back-to-back recompute for `P2P` and `MFG` is operational
- ✅ Scope isolation proven (`P2P` recompute does not update `MFG`, and vice versa)

**Proof Artifacts**:
- `archive/proofs/c1-module-agnostic-recompute-console-2026-02-11.log`

**Required Log Lines Present**:
- `[C1-BLOCKER] module-agnostic-recompute p2p result=PASS ...`
- `[C1-BLOCKER] module-agnostic-recompute mfg result=PASS ...`
- `[C1-BLOCKER] scope-isolation result=PASS ...`
- `[C1-BLOCKER] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/c1-module-agnostic-recompute-proof.mjs
```

---

## C1: Manufacturing Module (Config-Only) ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Config-only `MFG` module proof (`module JSON + route JSON + deterministic fixture`) running on existing platform primitives

**Current Result**:
- ✅ `MFG` module definition loads through existing `loadModule()` path
- ✅ `MFG` routes load through existing `loadRoutes()` path
- ✅ Deterministic fixture ingests append-only into fact sheets
- ✅ Match rebuild is deterministic (`hashA == hashB`)
- ✅ Summary formulas compute and KPI binding reads configured cell
- ✅ Branch metric history updates for `branch.mfg`

**Proof Artifacts**:
- `archive/proofs/c1-mfg-module-console-2026-02-11.log`

**Required Log Lines Present**:
- `[C1] module-load result=PASS module=MFG routes=4`
- `[C1] append-only result=PASS ...`
- `[C1] match-rebuild result=PASS ...`
- `[C1] match-determinism result=PASS hashA=<...> hashB=<...>`
- `[C1] summary-formulas result=PASS ...`
- `[C1] kpi-binding result=PASS metric=issueCoverage`
- `[C1] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/c1-mfg-module-proof.mjs
```

---

## D2: File Import Adapters ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Offline CSV/XLSX adapter layer (`routeId + columnMap`) that feeds existing `relayIngestBatch` path

**Current Result**:
- ✅ Extended import adapter path supports route-bound CSV and XLSX ingestion with inline column mapping
- ✅ Adapter uses existing append-only route ingest (`relayIngestBatch`) and module-agnostic recompute chain
- ✅ Proof imports tiny CSV fixture into `P2P` route and tiny XLSX fixtures into `MFG` routes
- ✅ Fact append, deterministic match rebuild, summary/KPI updates, and two-run hash stability all pass
- ✅ No renderer/UI panel changes; proof executed via script

**Proof Artifacts**:
- `archive/proofs/d2-import-proof-console-2026-02-11.log`
- `archive/proofs/d2-import-proof-screenshot-2026-02-11.png`

**Required Log Lines Present**:
- `[D2] adapter-path result=PASS ...`
- `[D2] facts-appended result=PASS ...`
- `[D2] match-rebuild result=PASS ...`
- `[D2] summary-formulas result=PASS ...`
- `[D2] kpi-bindings result=PASS ...`
- `[D2] determinism result=PASS ...`
- `[D2] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/d2-import-proof.mjs
```

---

## D3-BLOCKER: WINDOW_RUNTIME_GUARD ✅ PASSED

**Date**: 2026-02-11  
**Scope**: Runtime safety blocker for D3 ingest bridge when executing route ingestion in Node context

**Current Result**:
- ✅ Blocker surfaced during first D3 run: `D3_BLOCKER_RUNTIME_INGEST`
- ✅ Root cause isolated to unguarded `window` access in `route-engine` ingest log path
- ✅ Minimal audited fix applied (guarded `window` read, no behavior change to browser path)
- ✅ D3 proof re-run after fix and passed

**Fix Reference**:
- `app/modules/route-engine.js` (`ingestRecord` logging guard)

**Verification Command**:
```bash
node scripts/d3-webhook-proof.mjs
```

---

## D3: API/Webhook Connectors ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Thin HTTP ingest bridge (`POST /ingest`) that routes payloads to `relayIngestBatch(routeId, records)` only

**Current Result**:
- ✅ Added minimal ingest server (`scripts/d3-ingest-server.mjs`) with:
  - `POST /ingest`
  - `GET /health`
  - `GET /debug/state-hashes` (proof diagnostics)
- ✅ Auth + rate limit rails active:
  - `X-Relay-Key` required
  - token bucket per key
- ✅ Hard caps active (`maxRecords`, `maxBodyBytes`)
- ✅ Route validation + append-only route ingest enforced
- ✅ Deterministic proof metadata path requires `eventTimestamp` (`X-Relay-Proof: 1`)
- ✅ Module-agnostic recompute reused (facts -> match/summary -> KPI)

**Proof Artifacts**:
- `archive/proofs/d3-webhook-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[D3] ingest route=<id> records=<n> result=PASS`
- `[REFUSAL] reason=D3_AUTH_MISSING`
- `[REFUSAL] reason=D3_AUTH_INVALID`
- `[REFUSAL] reason=D3_ROUTE_UNKNOWN`
- `[REFUSAL] reason=D3_PAYLOAD_INVALID`
- `[REFUSAL] reason=D3_RATE_LIMIT`
- `[D3] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/d3-webhook-proof.mjs
```

---

## UX-3: Branch Steward (Visible Configuration) ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Minimal visible config surface over existing module/route registries, with changes materialized through `PROPOSE -> COMMIT` artifacts

**Current Result**:
- ✅ Added UX-3 panel in runtime (`relay-cesium-world.html`) with module selector + JSON editor for visible config
- ✅ Added runtime APIs:
  - `relayUX3ListModules()`
  - `relayUX3GetConfig(moduleId)`
  - `relayUX3ProposeConfigEdit(payload, meta?)`
  - `relayUX3CommitLatest(meta?)`
  - `relayUX3GetState()`
- ✅ Config edits route through existing governance chain (`setRelayWorkMode('PROPOSE'|'COMMIT')`) with object binding to branch UOC IDs
- ✅ Commit path applies config updates to branch KPI bindings and route field-source mappings (no new compute layer)
- ✅ Artifact linkage preserved on target branch object (`PROPOSE` + `COMMIT` chain)
- ✅ Deterministic proof hash stable across two runs

**Proof Artifacts**:
- `archive/proofs/ux3-branch-steward-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[UX3] propose result=PASS module=<...> proposalId=<...>`
- `[UX3] commit result=PASS module=<...> commitId=<...> proposalId=<...>`
- `[UX3] config-apply result=PASS branch=<...> route=<...> field=<...>`
- `[UX3] artifact-link result=PASS objectId=<...> proposalId=<...>`
- `[UX3] determinism result=PASS hashA=<...> hashB=<...>`
- `[UX3] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/ux3-branch-steward-proof.mjs
```

---

## D1: Inter-Branch Aggregation ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Deterministic branch KPI roll-up projection to trunk metrics with inspectable contributor traces

**Current Result**:
- ✅ Added projection model: `core/models/aggregation/trunk-aggregation-v0.js`
  - `aggregateBranchMetrics(branchMetricsById, policy)`
  - `hashAggregation(trunkMetrics)`
- ✅ Runtime roll-up store and APIs added:
  - `window.__relayTrunkMetrics`
  - `relayGetTrunkMetrics()`
  - `relayGetTrunkMetricContributors(metricId)`
- ✅ Trunk aggregation recomputes whenever branch KPI updates in module recompute chain
- ✅ Inspector now shows:
  - trunk metric values + hash
  - contributor rows (branch value + summary source cell + fact sheet lineage)
- ✅ Determinism validated across input order permutations

**Proof Artifacts**:
- `archive/proofs/d1-trunk-aggregation-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[D1] branch-kpi-change result=PASS ...`
- `[D1] trunk-rollup-change result=PASS ...`
- `[D1] trace result=PASS ...`
- `[D1] determinism result=PASS hashA=<...> hashB=<...>`
- `[D1] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/d1-trunk-aggregation-proof.mjs
```

---

## L0: Presence Primitives ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Tiered presence markers + focus binding + TTL trails (projection-only, consent-gated)

**Current Result**:
- ✅ Presence marker model active with tiered visibility and consent guard (`Tier 0/1/2`)
- ✅ Focus binding captured on marker updates (`focusObjectId`)
- ✅ Presence trails created on movement updates and auto-expire via TTL sweep
- ✅ Data minimization path enforced through short-retention ephemeral stores

**Proof Artifacts**:
- `archive/proofs/l0-presence-primitives-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[L0] consent-tier result=PASS ...`
- `[L0] focus-binding result=PASS ...`
- `[L0] trail result=PASS ...`
- `[L0] ttl result=PASS ...`
- `[L0] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/l0-presence-primitives-proof.mjs
```

---

## L1: SCV Presence ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Visible SCV operators (marker + status + focus + capability list) with explicit no-auto-execute rail

**Current Result**:
- ✅ SCV catalog seeded (`scv.coherence`, `scv.procurement`, `scv.compliance`) with capability lists
- ✅ SCV presence marker updates expose active task + focus target + status
- ✅ SCV direct execution refused (`SCV_EXECUTION_FORBIDDEN`)
- ✅ SCV proposed commit drafts available as non-executing outputs

**Proof Artifacts**:
- `archive/proofs/l1-scv-presence-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[L1] scv-catalog result=PASS ...`
- `[L1] scv-presence result=PASS ...`
- `[L1] no-auto-execute result=PASS ...`
- `[L1] proposed-commit-draft result=PASS ...`
- `[L1] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/l1-scv-presence-proof.mjs
```

---

## L2: Audit Requests ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Manager -> SCV scoped audit lifecycle with stage-gate refusal rails before materialization

**Current Result**:
- ✅ Audit request lifecycle implemented: create -> assign -> findings -> approve/reject
- ✅ Stage gate refusal enforced (`STAGE_LOCKED`) for out-of-stage requests
- ✅ Findings and traces persisted in request context
- ✅ Approval path can materialize proposal through existing Work Mode path

**Proof Artifacts**:
- `archive/proofs/l2-audit-requests-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[L2] stage-gate result=PASS refusal=STAGE_LOCKED`
- `[L2] request-lifecycle result=PASS ...`
- `[L2] findings result=PASS ...`
- `[L2] approval-materialize result=PASS ...`
- `[L2] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/l2-audit-requests-proof.mjs
```

---

## F0.1–F0.2: Flow Record + Playback ✅ PASSED (v0)

**Date**: 2026-02-11  
**Scope**: Pre-social flow channel baseline (record + guided/free playback) using existing UOC/actions/artifact rails only

**Current Result**:
- ✅ In-memory flow store + APIs added (`relayFlowStart/Step/End/Get/GetAll/Play`)
- ✅ FlowRecord captures: intent/tags/scope, typed steps, referenced object IDs, sparse camera waypoints, input fingerprint
- ✅ Playback runs through animated waypoints (camera fly-to, no teleport), optional guided focus/action dispatch
- ✅ Fingerprint mismatch logs stale warning while remaining runnable
- ✅ Inspector now shows playback state + step list + recent flows

**Proof Artifacts**:
- `archive/proofs/f0-flow-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[FLOW] record-start flowId=<...> target=<id> scope=<...>`
- `[FLOW] record-step flowId=<...> kind=<...> ref=<id>`
- `[FLOW] record-end flowId=<...> steps=<n> scope=<...> fingerprint=<hash>`
- `[FLOW] play flowId=<...> mode=<...>`
- `[FLOW] complete flowId=<...> result=PASS steps=<n> durationMs=<...>`
- `[F0] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/f0-flow-record-playback-proof.mjs
```

---

## CAM0.1 + CAM0.3: Animated Travel + Preset Registry ✅ PASSED (v0 slice)

**Date**: 2026-02-11  
**Scope**: Minimal camera physics slice before social activation (`animated travel` + `LOD preset registry`)

**Current Result**:
- ✅ Camera preset jumps route through animated travel (`flyTo`), not instant `setView`
- ✅ Travel contract emits canonical move logs:
  - `[MOVE] mode=travel from=<...> to=<...> reason=<...> durationMs=<...>`
- ✅ LOD preset registry API exposed:
  - `relayListCameraPresets(lod)`
  - `relayApplyCameraPreset(presetId)`
- ✅ Preset application preserves focus/selection continuity context (no recompute side effects)
- ✅ Registry output deterministic across runs

**Proof Artifacts**:
- `archive/proofs/cam0-travel-presets-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[CAM0] animated-travel result=PASS ...`
- `[CAM0] continuity result=PASS`
- `[CAM0] presets-registry result=PASS ...`
- `[CAM0] move-logs result=PASS ...`
- `[CAM0] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/cam0-travel-presets-proof.mjs
```

---

## CAM0.2: Basin Influence ✅ PASSED (v0 slice)

**Date**: 2026-02-11  
**Scope**: Optional basin orbit assist with explicit soft-lock toggle and guaranteed release path

**Current Result**:
- ✅ Basin influence derived from existing tree anchors/extents (trunk/branch) as camera-only assist
- ✅ Assist activates inside basin radius and deactivates outside basin radius
- ✅ Soft-lock toggle available and optional (`relaySetBasinSoftLock`), never mandatory/trapping
- ✅ Travel presets continue to work with basin assist enabled (no lock trap)
- ✅ Basin state exposed for inspection (`relayGetBasinState`)

**Proof Artifacts**:
- `archive/proofs/cam0-basin-influence-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[CAM] basin-enter ...`
- `[CAM] basin-exit ...`
- `[CAM] basin-softlock enabled=<true|false> target=<id>`
- `[MOVE] mode=basin ...`
- `[CAM0.2] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/cam0-basin-influence-proof.mjs
```

---

## CAM0.4: Branch Walk ✅ PASSED (v0 slice)

**Date**: 2026-02-11  
**Scope**: Minimal branch-axis snapped movement mode (camera-only, no truth/state mutation)

**Current Result**:
- ✅ Branch walk mode enters on selected branch and emits mode transition log (`[MOVE] mode=branch target=<branchId>`)
- ✅ Movement snaps to deterministic logical nodes along responsibility axis (`branch -> sheet -> match -> next match`)
- ✅ Step transitions are explicit and auditable (`[MOVE] branch-step from=<objectId> to=<objectId>`)
- ✅ Exit is guaranteed and restores prior context without trapping (`[MOVE] branch-exit restoreView=true`)
- ✅ Determinism stable across two runs (hash parity)

**Proof Artifacts**:
- `archive/proofs/cam0-branch-walk-proof-console-2026-02-11.log`

**Required Log Lines Present**:
- `[MOVE] mode=branch target=<branchId>`
- `[MOVE] branch-step from=<objectId> to=<objectId>`
- `[MOVE] branch-exit restoreView=true`
- `[CAM0.4] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/cam0-branch-walk-proof.mjs
```

---

## CAM0.4.2: Filament Ride ✅ PASSED (v0 slice)

**Date**: 2026-02-13  
**Scope**: Minimal filament-axis snapped movement mode (camera-only, no truth/state mutation)

**Current Result**:
- ✅ Filament ride mode enters on selected filament/cell and emits transition log (`[MOVE] mode=filamentRide target=<filamentId>`)
- ✅ Movement snaps deterministically timebox-by-timebox (`[MOVE] ride-step from=<timeboxId> to=<timeboxId>`)
- ✅ Exit is guaranteed and restores prior context without trapping (`[MOVE] ride-exit restoreView=true`)
- ✅ Determinism hash remains stable across repeated runs
- ✅ Regression rails pass (`OSV-1` and headless parity unchanged)

**Proof Artifacts**:
- `archive/proofs/cam0-filament-ride-proof-console-2026-02-13.log`

**Required Log Lines Present**:
- `[MOVE] mode=filamentRide target=<filamentId>`
- `[MOVE] ride-step from=<timeboxId> to=<timeboxId>`
- `[MOVE] ride-exit restoreView=true`
- `[CAM0.4.2] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/cam0-filament-ride-proof.mjs
```

---

## OSV-1: Full System Operational Validation ✅ PASSED

**Date**: 2026-02-12  
**Scope**: Cross-stack operational validation of Tier-1 + Tier-2 + CAM + D-Lens integration in one continuous proof flow

**Current Result**:
- ✅ P2P full cycle passes end-to-end (`PR -> PO -> GR -> INV -> PAY`) with packet and responsibility materialization
- ✅ Ledger projection and trial balance checks pass after live-cycle posting
- ✅ Trunk aggregation updates during live transactional flow
- ✅ Camera continuity checks pass during live data (`preset travel`, `basin assist`, `branch walk`)
- ✅ Focus Sphere continuity checks pass with restore guarantees intact
- ✅ Flow record + playback pass with deterministic hash stability across two runs
- ✅ Headless parity comparison passes (`facts`, `matches`, `summaries`, `kpis`, `packets`, `ledger`)
- ✅ Refusal rails pass for mismatch/no-variance, stage-locked action, and SCV execution refusal

**Proof Artifacts**:
- `archive/proofs/osv1-full-system-proof-console-2026-02-12.log`

**Required Log Lines Present**:
- `[OSV1] p2p-cycle result=PASS`
- `[OSV1] ledger result=PASS`
- `[OSV1] trunk-aggregation result=PASS`
- `[OSV1] camera-continuity result=PASS`
- `[OSV1] focus-continuity result=PASS`
- `[OSV1] flow-playback result=PASS`
- `[OSV1] headless-parity result=PASS`
- `[OSV1] refusal-rails result=PASS`
- `[OSV1] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/osv1-full-system-proof.mjs
```

---

## D-Lens-1: Focus Sphere ✅ PASSED (v0 slice)

**Date**: 2026-02-11  
**Scope**: Focus-lens isolation for selected UOC objects with strict exit restore guarantees

**Current Result**:
- ✅ Focus enter supports multiple object types (`match`, `sheet`, `cell`) through relay APIs
- ✅ Lens frame state exposed via `relayGetFocusState()` with frame ID + radius derived from object extent
- ✅ Exit restores prior camera view, prior selection continuity, and prior LOD continuity
- ✅ Focus transitions route through animated travel (no teleport) and emit lens logs
- ✅ Inspector shows Focus Sphere status (active/frame/target/radius)

**Proof Artifacts**:
- `archive/proofs/dlens1-focus-sphere-proof-console-2026-02-11.log`
- `archive/proofs/dlens1-focus-sphere-proof-screenshot-2026-02-11.png`

**Required Log Lines Present**:
- `[LENS] focus-enter target=<objectId> frame=<frameId>`
- `[LENS] focus-exit ... restoreView=true`
- `[LENS] focus-restore state=PASS selectionPreserved=true lodPreserved=true`
- `[D-LENS-1] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/dlens1-focus-sphere-proof.mjs
```

---

## Phase 0: Cesium Boot ✅ PASSED

**Date**: 2026-02-06  
**Gate Criteria**:
- ✅ Cesium viewer exists
- ✅ Terrain visible
- ✅ Imagery visible
- ✅ 3D buildings visible
- ✅ No console errors

**Proof Artifacts**:
MISSING: archive/proofs/phase0-console-2026-02-06.log (expected by Phase 0: Cesium Boot)
- **Boot verification**: Dev server started successfully on port 8000
- **Visual verification**: Cesium loads terrain + imagery + buildings

**Verification**:
```bash
MISSING: archive/proofs/phase0-console-2026-02-06.log (expected by Phase 0: Cesium Boot)
# Shows: "✅ Cesium Viewer initialized successfully"
```

---

## Phase 1: Excel Import → RelayState ✅ PASSED

**Date**: 2026-02-06  
**Gate Criteria**:
- ✅ Excel file drop triggers import
- ✅ relayState.tree.nodes populated
- ✅ Tree structure created (trunk, branches, sheets)
- ✅ No import errors

**Proof Artifacts**:
MISSING: archive/proofs/phase1-import-2026-02-06.log (expected by Phase 1: Excel Import → RelayState)
- **Tree structure**: relayState populated with nodes and edges
- **Verification**: HUD shows node count after import

**Verification**:
```bash
MISSING: archive/proofs/phase1-import-2026-02-06.log (expected by Phase 1: Excel Import → RelayState)
# Shows: "✅ Import complete: 4 nodes, 3 edges"
```

---

## Phase 2: Core-Routed Relationships + Primitives ✅ PASSED

**Status**: PASSED  
**Date Started**: 2026-02-06  
**Date Passed**: 2026-02-06  
**Blocked By**: ~~Architecture corrections~~ ✅ COMPLETE

**Specification**: `phase2-proof-spec.md` ✅ (stored)

**Test Scenario**:
- Two trees: Tel Aviv (32.0853, 34.7818) and NYC (40.7128, -74.0060)
- One relationship: "Shared supplier: Packaging Film"
- Camera: Planetary zoom (25-35k km altitude)

**Gate Criteria** (All required):
1. ✅ Local tree topology (no surface bridges)
2. ✅ Core-routed relationship (V-shape via Earth center)
3. ✅ Primitives used (not entities)
4. ✅ LOD functioning (PLANETARY level)
5. ✅ ENU correctness (frames computed)

**Fail Criteria** (Any fails phase):
- ❌ Surface bridge exists
- ❌ One trunk spans cities
- ❌ Core not convergence point
- ❌ Entities-only rendering
- ❌ LOD violations
- ❌ No proof artifact

**When PASSED, add**:
- Screenshot: `phase2-proof-screenshot.png`
- Console log: `phase2-proof-console.log` ✅
- Spec: `phase2-proof-spec.md` ✅

**Proof Artifacts**:
- **Console log**: `phase2-proof-console.log` ✅
- **Screenshot**: `phase2-proof-screenshot.png` ✅ (visual confirmation)
- **Spec**: `phase2-proof-spec.md` ✅

**Pass Criteria Verified** (All met):
1. ✅ Local tree topology - Two trees at separate locations (Tel Aviv + NYC)
2. ✅ Core-routed relationship - V-shape via Earth center (2 legs)
3. ✅ Primitives used - 5 primitives, 0 geometry entities
4. ✅ LOD functioning - LANIAKEA level at 28,000 km
5. ✅ ENU correctness - Trees anchored correctly

**Verification**:
```bash
# View proof spec
cat archive/proofs/phase2-proof-spec.md

# View console log
cat archive/proofs/phase2-proof-console.log

# View screenshot
# Open archive/proofs/phase2-proof-screenshot.png
```

**Important Note**: Phase 2 proof scenario used primitives. Live tree renderer still uses entities (see Phase 2.1).

---

## Phase 2.1: Primitives Migration ✅ PASSED

**Status**: ✅ PASSED  
**Date Started**: 2026-02-06  
**Date Implemented**: 2026-02-06  
**Date Verified**: 2026-02-06  
**Goal**: Migrate live tree renderer from entities to primitives with ENU coordinates  
**Blocked By**: ~~Phase 2~~ ✅ PASSED

**All Gates PASSED**:
- ✅ Gate 0: Tree independent of buildings (Ion 401 did not block)
- ✅ Gate 1: Single branch isolation (`branches=1`)
- ✅ Gate 2: ENU→World conversion (length error = 0.0m)
- ✅ Gate 3: Camera locked to branch (instant centering)
- ✅ Gate 4: Anchor marker (independent of buildings/terrain)
- ✅ Gate 5: Staged filaments (Cell→Spine→Branch, no spaghetti)

**Verified Console Output** (Single Branch Proof):
```
✅ Tree rendered:
  Primitives: 51 (trunk=1, branches=1, cell-filaments=48, spines=1)
  Entities: 107 (labels=49, cell-points=48, timebox-labels=10)

[GATE 2] Branch branch.operations:
  Anchor: (34.7818, 32.0853)
  ENU Start: (E=0, N=0, U=2000)
  ENU End: (E=800, N=0, U=2000)
  Branch Length: 800.0m (expected: 800m)
  Length Error: 0.0m
```

**Proof Artifacts** (CAPTURED):
- ✅ `archive/proofs/phase2.1-single-branch-console.log` - Console output
- ✅ Screenshots provided by user (side view + top view)
MISSING: archive/proofs/PHASE-2.1-PASSED.md (expected by Phase 2.1: Primitives Migration)

**Specs**: 
- `docs/implementation/PHASE-2.1-PRIMITIVES-MIGRATION.md` ✅
MISSING: archive/proofs/PHASE-2.1-EXECUTION-CHECKLIST.md (expected by Phase 2.1: Primitives Migration)
MISSING: archive/proofs/PHASE-2.1-IMPLEMENTATION-COMPLETE.md (expected by Phase 2.1: Primitives Migration)
MISSING: archive/proofs/GATES-1-TO-5-IMPLEMENTED.md (expected by Phase 2.1: Primitives Migration)
MISSING: archive/proofs/PHASE-2.1-PASSED.md (expected by Phase 2.1: Primitives Migration)

---

## Phase 3: Timebox Segmentation ⏹ BLOCKED

**Blocked By**: Phase 2.1 completion (primitives migration required first)

---

## Phase 4: Boundaries + containsLL ⏹ NOT STARTED

**Blocked By**: Phase 2 completion

---

## PQ-2: SheetsRendered vs Expected Gate ⏳ PENDING PROOF

**Gate Criteria**:
- [S1] SheetsExpected=... Eligible=... SkippedHidden=... SkippedEmpty=... SkippedUnsupported=...
- [S1] SheetsRendered=... Expected=...
- Mismatch emits INDETERMINATE and HUD shows Import: INDETERMINATE

**Proof Artifacts**:
MISSING: archive/proofs/pq2-sheets-pass-console.log (expected by PQ-2: SheetsRendered vs Expected)
MISSING: archive/proofs/pq2-sheets-indeterminate-console.log (expected by PQ-2: SheetsRendered vs Expected)

---

## Presence + Edit Sheet Mode ⏳ PENDING PROOF

**Gate Criteria**:
- Presence markers render + correct counts
- Presence modes: nonEmpty, selected+recent, formulasOnly
- Edit Sheet enter/exit logs + input gating
- Edit Sheet LOD lock to SHEET
- Edit in mode commits on Enter

**Proof Artifacts**:
MISSING: archive/proofs/presence-markers-pass.log (expected by Presence + Edit Sheet Mode)
MISSING: archive/proofs/presence-markers-recent.log (expected by Presence + Edit Sheet Mode)
MISSING: archive/proofs/presence-markers-formulas.log (expected by Presence + Edit Sheet Mode)
MISSING: archive/proofs/edit-sheet-pass.log (expected by Presence + Edit Sheet Mode)

---

## PQ-3: Timebox Band Alignment ✅ PASSED

**Date**: 2026-02-13  
**Scope**: Align branch micro lane markers with macro timebox slabs and emit deterministic alignment proof line.

**Current Result**:
- ✅ Runtime emits `[T] bandAlign ok=<n> maxDeltaM=<value>` using alignment count and max delta in meters
- ✅ PQ-3 proof passes in world mode with bounded delta (`maxDeltaM=0.000`, `ok=10`)
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/pq3-timebox-band-align-console-2026-02-13.log`

**Required Log Lines Present**:
- `[T] bandAlign ok=<n> maxDeltaM=<value>`
- `[PQ3] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pq3-timebox-band-align-proof.mjs
```

---

## PQ-4: Formula Reference Extraction ✅ PASSED

**Date**: 2026-02-13  
**Scope**: Parse formula references/ranges, store metadata on `CELL_FORMULA_SET`, and expose reference hints in overlay (no DAG/recalc additions).

**Current Result**:
- ✅ Runtime emits `[F] refsExtracted cell=<...> refs=<...> ranges=<...>` on formula commit
- ✅ `CELL_FORMULA_SET` commits store extracted refs/ranges metadata (`PQ4-REFS-V1`)
- ✅ Overlay formula line includes refs/ranges hints for selected formula cells
- ✅ PQ-4 proof passes in world mode
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/pq4-formula-ref-extraction-console-2026-02-13.log`

**Required Log Lines Present**:
- `[F] refsExtracted cell=<...> refs=<...> ranges=<...>`
- `[PQ4] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pq4-formula-ref-extraction-proof.mjs
```

---

## PQ-5: Dependency Graph v1 ✅ PASSED

**Date**: 2026-02-13  
**Scope**: Build deterministic formula DAG from PQ-4 refs, detect cycles, and mark affected formula cells `INDETERMINATE` (no recalc engine expansion).

**Current Result**:
- ✅ DAG built over formula cells with deterministic node/edge ordering
- ✅ Edge expansion includes concrete cell refs from ranges within sheet bounds
- ✅ Runtime emits required DAG log line on rebuild:
  - `[F] dag nodes=<n> edges=<m> cycles=<c>`
- ✅ Cycle path marks affected cells as `INDETERMINATE` and emits explicit marker log
- ✅ Acyclic and cyclic proof cases both pass in one deterministic runner
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/pq5-dependency-graph-console-2026-02-13.log`

**Required Log Lines Present**:
- `[F] dag nodes=<n> edges=<m> cycles=<c>`
- `[F] indeterminate cells=<...> reason=cycle`
- `[PQ5] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pq5-dependency-graph-proof.mjs
```

---

## PQ-6: Deterministic Replay ✅ PASSED

**Date**: 2026-02-13  
**Scope**: Deterministic replay for sheet commit semantics (`CELL_SET`/`CELL_CLEAR`/`CELL_FORMULA_SET`) and parity check against live sheet state projection.

**Current Result**:
- ✅ Runtime records deterministic sheet commit log entries with sequence ordering
- ✅ Replay reconstructs sheet cell-state projection from commit log in causal order
- ✅ Replay parity emits canonical replay hash with live-match status:
  - `[R] replayHash=<...> matchesLive=true`
- ✅ PQ-6 proof passes in world mode
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/pq6-deterministic-replay-console-2026-02-13.log`

**Required Log Lines Present**:
- `[R] replayHash=<...> matchesLive=true`
- `[PQ6] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pq6-deterministic-replay-proof.mjs
```

---

## PQ-7: Inspector v1 ✅ PASSED

**Date**: 2026-02-13  
**Scope**: Read-only provenance inspector for cell/timebox surfaces (history, last change, formula refs metadata, and indeterminate reason visibility).

**Current Result**:
- ✅ Inspector returns deterministic structure for cell inspection calls
- ✅ Cell provenance includes `cellRef`, current value/formula, refs metadata, formula state/reason, `lastCommitId`, `lastSeq`, and commit history slice
- ✅ Timebox provenance exposes deterministic commit-range summary (`commits`, `range`)
- ✅ Cycle state visibility present (`INDETERMINATE` + `CYCLE` reason) in inspector output
- ✅ Inspection paths are read-only (no state mutation during proof inspection calls)
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/pq7-inspector-console-2026-02-13.log`

**Required Log Lines Present**:
- `[I] inspect cell=<A1> commits=<n> lastSeq=<k>`
- `[I] inspect timebox=<tbId> commits=<n> range=<start-end>`
- `[PQ7] gate-summary result=PASS`

**Verification Command**:
```bash
node scripts/pq7-inspector-proof.mjs
```

## Phase 5: Votes Overlay ⏹ NOT STARTED

**Blocked By**: Phase 4 completion

---

## Phase 6: Weather Overlays ⏹ NOT STARTED

**Blocked By**: Phase 0 (complete)

---

## Phase 7: Interaction/Picking ⏹ NOT STARTED

**Blocked By**: Phases 2, 3

---

## Phase 8: Performance + Polish ⏹ NOT STARTED

**Blocked By**: All previous phases

---

## GLOBE-RESTORE-1: Weather + Topography + Services ✅ PASSED (v0)

**Date Passed**: 2026-02-12  
**Profile**: `RELAY_PROFILE=world` only (proof profile hard-off preserved)

**Scope verified**
- World-only weather overlays: `clouds`, `precipitation`, `temperature`, `radar`, `snow`
- World-only topography imagery swaps: `none`, `contour-data`, `3d-terrain`, `elevation-heatmap`
- Separate globe services server used (`scripts/globe-services-server.mjs`, port `4020`)
- Fixture mode default used for weather tile proof path
- Proof profile isolation enforced (`PROFILE_LOCKED_PROOF`)
- No overlay stack restore (MapLibre/Deck deferred)
- No boundary editor restore
- No voting/social restore

**Proof artifacts**
- `archive/proofs/globe-restore-1-proof-console-2026-02-12.log`
- `archive/proofs/globe-restore-1-proof-2026-02-12.png`

**Regression artifacts**
- `archive/proofs/osv1-full-system-proof-console-2026-02-12.log`
- `archive/proofs/headless-0-parity-console-2026-02-11.log`

**Verification commands**
```bash
node scripts/globe-restore-1-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## GLOBE-RESTORE-2A: Region/Hierarchy + Clustering Ladder ✅ PASSED (v0)

**Date Passed**: 2026-02-12  
**Profile**: `RELAY_PROFILE=world` only (proof profile hard-off preserved)

**Scope verified**
- World-only region/country hierarchy manager active (`WorldGlobeManager`)
- World-only clustering ladder active with levels: `gps`, `city`, `state`, `country`, `region`, `globe`
- World-only Bud action dispatch active on branch/trunk contracts:
  - `cycleClusterLevel`
  - `focusNextRegion`
  - `loadGlobalCore`
- World-only globe APIs/hotkeys active (`Alt+L`, `Alt+R`)
- Proof profile isolation enforced (`PROFILE_LOCKED_PROOF`)
- No MapLibre/Deck overlay restore
- No boundary editor restore
- No voting/social restore

**Proof artifacts**
- `archive/proofs/globe-restore-2a-proof-console-2026-02-12.log`
- `archive/proofs/globe-restore-2a-proof-2026-02-12.png`

**Regression verification**
- `node scripts/osv1-full-system-proof.mjs` -> PASS (`[OSV1] gate-summary result=PASS`)
- `node scripts/headless-tier1-parity.mjs` -> PASS (`[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`)

**Verification commands**
```bash
node scripts/globe-restore-2a-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## GLOBE-RESTORE-3: Region/Boundary Scope Integration ✅ PASSED (v0)

**Date Passed**: 2026-02-12  
**Profile**: `RELAY_PROFILE=world` only (proof profile hard-off preserved)

**Scope verified**
- Deterministic geography fixture loaded from static file only:
  - `app/cesium/fixtures/restore3-geo-fixture.json`
  - shape: `2 countries`, `3 regions`, `2 sites`
- No live/network geography fetch
- World-only scope overlay selection for `country`, `region`, `site`
- Governance scope visualization emitted for in-scope/out-of-scope proposals
- Cross-scope commit refusal rail enforced in world mode:
  - `[REFUSAL] reason=GOV_SCOPE_VIOLATION proposalScope=<...> selectedScope=<...>`
- Proof profile isolation enforced (`PROFILE_LOCKED_PROOF`)
- No boundary editor restore
- No voting/social UI restore
- No ingest/packet/ledger/governance logic mutation

**Proof artifacts**
- `archive/proofs/globe-restore-3-proof-console-2026-02-12.log`
- `archive/proofs/globe-restore-3-proof-2026-02-12.png`

**Regression verification**
- `node scripts/osv1-full-system-proof.mjs` -> PASS (`[OSV1] gate-summary result=PASS`)
- `node scripts/headless-tier1-parity.mjs` -> PASS (`[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`)

**Verification commands**
```bash
node scripts/globe-restore-3-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## GLOBE-RESTORE-4: Branch/Site Geospatial Assignment + Scope Inspector ✅ PASSED (v0)

**Date Passed**: 2026-02-13  
**Profile**: `RELAY_PROFILE=world` only (proof profile hard-off preserved)

**Scope verified**
- Deterministic local assignment fixture loaded from static file only:
  - `app/cesium/fixtures/restore4-assignment-fixture.json`
- No network geography fetch/external APIs used
- Branch/site assignment model active using existing `PROPOSE`/`COMMIT` rails only
- Canonical in-world Scope Inspector active and logs in-scope/out-of-scope branch counts
- Cross-scope refusal rail enforced:
  - `[REFUSAL] reason=GOV_SCOPE_VIOLATION proposalScope=<...> selectedScope=<...>`
- Proof profile isolation enforced (`PROFILE_LOCKED_PROOF`)
- No boundary editor/voting/social/MapLibre changes
- No ingest/packet/ledger/governance core logic mutations

**Proof artifacts**
- `archive/proofs/globe-restore-4-proof-console-2026-02-13.log`
- `archive/proofs/globe-restore-4-proof-2026-02-13.png`

**Regression verification**
- `node scripts/osv1-full-system-proof.mjs` -> PASS (`[OSV1] gate-summary result=PASS`)
- `node scripts/headless-tier1-parity.mjs` -> PASS (`[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`)

**Verification commands**
```bash
node scripts/globe-restore-4-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## GLOBE-RESTORE-3A: Static Dataset Expansion ✅ PASSED (v0)

**Date Passed**: 2026-02-13  
**Profile**: `RELAY_PROFILE=world` only (proof profile lock preserved)

**Scope verified**
- Deterministic world dataset fixture loaded from static file only:
  - `app/cesium/fixtures/world-dataset-v0.json`
- Multi-country anchor dataset rendered with deterministic anchor IDs and labels
- Required dataset log emitted:
  - `[GLOBE] datasetLoad anchors=<n>`
- Proof profile isolation enforced for dataset loader (`PROFILE_LOCKED_PROOF`)
- No live network dataset fetch introduced by default

**Proof artifacts**
- `archive/proofs/globe-dataset-expansion-console-2026-02-13.log`

**Regression verification**
- `node scripts/osv1-full-system-proof.mjs` -> PASS (`[OSV1] gate-summary result=PASS`)
- `node scripts/headless-tier1-parity.mjs` -> PASS (`[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`)

**Verification commands**
```bash
node scripts/globe-dataset-expansion-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## USP-1: UX Stabilization Pass v1 ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Presentation/readability hardening only (no architecture or physics changes)

**Current Result**:
- ✅ World imagery toggle stabilized (`OSM`/`Satellite`) with persistence and UX logs
- ✅ Boundaries read-only visibility surfaced; degrade path emits explicit UX log
- ✅ Debug log reduction mode defaults `OFF` and suppresses selected internal L2 spam while preserving refusals/errors/transitions
- ✅ HUD regrouped into operator sections (System State / Context / Controls)
- ✅ Multi-country anchor smoke rendered with deterministic pass log (`anchors=2`)
- ✅ No OSV-1 regression
- ✅ Headless parity remains unchanged and passing

**Proof artifacts**:
- `archive/proofs/usp1-ux-stabilization-console-2026-02-13.log`
- `archive/proofs/usp1-ux-stabilization-2026-02-13.png`

**Regression verification**:
- `node scripts/osv1-full-system-proof.mjs` -> PASS (`[OSV1] gate-summary result=PASS`)
- `node scripts/headless-tier1-parity.mjs` -> PASS (`[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`)

**Verification commands**:
```bash
node scripts/usp1-ux-stabilization-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## BOUNDARY-A1: Commit-Governed Boundary Editor ✅ PASSED (v0)

**Date Passed**: 2026-02-13  
**Scope**: Commit-governed boundary editing with draft geometry, PROPOSE artifact generation (geometryHash), COMMIT with hash verification, invalid geometry refusal, scope enforcement, and determinism.

**Current Result**:
- ✅ Draft geometry creation with vertex management (add/undo/update)
- ✅ PROPOSE artifact generation with canonical geometry hash (`fnv1a(canonicalGeoJSON)`)
- ✅ COMMIT verifies geometry hash match between propose and commit
- ✅ Invalid geometry refused (`BOUNDARY_INVALID_GEOMETRY` for insufficient vertices, NaN, out-of-range)
- ✅ Scope enforcement rail active (checked via `assertCommitScope` on commit)
- ✅ Determinism proven: identical vertices → identical hash, different vertices → different hash
- ✅ Global commit history maintained (`window.__relayBoundaryCommits`)
- ✅ All required log lines emitted (`[BOUNDARY] draft-start`, `[BOUNDARY] propose`, `[BOUNDARY] commit`, `[REFUSAL]`)
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/boundary-editor-console-2026-02-13.log`

**Required Log Lines Present**:
- `[BOUNDARY] draft-start target=<...> scope=<...>`
- `[BOUNDARY] propose proposalId=<...> target=<...> vertices=<n> geometryHash=<hash>`
- `[BOUNDARY] commit commitId=<...> proposalId=<...> geometryHash=<hash> target=<...>`
- `[REFUSAL] reason=BOUNDARY_INVALID_GEOMETRY detail=<...>`

**Verification Commands**:
```bash
node scripts/boundary-editor-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## VOTE-A2: Voting UI Reactivation ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Reactivate a minimal user-facing voting surface (topic lane + contextual panel) wired to canonical governance primitives (`LCK-2`/`LCK-3`) with strict presentation/governance separation.

**Current Result**:
- ✅ Left-to-right topic lane restored with deterministic ranking by canonical vote metrics
- ✅ Contextual Vote Panel restored with state, eligibility, quorum, and time remaining
- ✅ Presentation vote surface active (`type=presentation`) with policy-targeted cast events
- ✅ Governance vote surface active (`type=governance`) using frozen eligibility snapshots and lifecycle transitions
- ✅ Stage lock refusal rail enforced (`[REFUSAL] stageLocked`) for invalid lifecycle casts
- ✅ Invalid governance vote does not mutate vote state (`VOTE_ELIGIBILITY_MISMATCH` + stable ballot count)
- ✅ Determinism digest stable across two identical runs
- ✅ No new governance rules, cadence-table logic, eligibility semantics, or stage-gate semantics introduced
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/voting-ui-reactivation-console-2026-02-13.log`

**Required Log Lines Present**:
- `[VOTE] type=presentation policyRef=<...> action=CAST`
- `[VOTE] type=governance scope=<...>`
- `[VOTE] eligibilitySnapshot id=<...>`
- `[VOTE] lifecycleTransition state=ACTIVE`
- `[REFUSAL] stageLocked`
- `[VOTE-A2] gate-summary result=PASS`

**Verification Commands**:
```bash
node scripts/voting-ui-reactivation-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## HUD-1: Adaptive HUD + Params ✅ PASSED (v0)

**Date Passed**: 2026-02-13  
**Scope**: Single adaptive HUD (Layer 1 + contextual Layer 2) with vote-ready presentation params loader (`HUD-PARAMS-v0`) and policyRef visibility.

**Current Result**:
- ✅ Single adaptive HUD active with always-visible Layer 1 and contextual Layer 2
- ✅ Inspector is on-demand via HUD trigger and remains closed by default
- ✅ Parameter catalog loaded from local policy file with fallback defaults
- ✅ Policy identity visible in HUD (`policyRef` + `paramsVersion`)
- ✅ Required load/mode logs emitted with low-noise mode-change cadence
- ✅ No renderer/topology/compute layer expansion
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof artifacts**:
- `archive/proofs/hud1-adaptive-hud-console-2026-02-13.log`

**Required log lines present**:
- `[HUD] paramsLoaded version=HUD-PARAMS-v0 policyRef=local:HUD-PARAMS-v0`
- `[HUD] mode=<mode> layer1=<nFields> layer2=<nFields>`
- `[HUD1] gate-summary result=PASS`

**Verification commands**:
```bash
node scripts/hud1-adaptive-hud-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## RESTORE-PARITY: Full Restore Integrated Proof ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Integrated capstone parity across restored surfaces (`profile isolation`, `globe stack`, `boundary editor`, `voting UI`, `HUD policy visibility`, `movement continuity`) with regression rails.

**Current Result**:
- ✅ Proof profile isolation enforced for world-only APIs
- ✅ World profile globe stack continuity verified
- ✅ Boundary editor propose/commit/refusal path verified
- ✅ Voting surface lifecycle and refusal rails verified
- ✅ HUD policy ref/version visibility verified
- ✅ Movement continuity verified (`travel`, `branch walk`, `filament ride`, `focus`)
- ✅ Regression rails pass unchanged (`OSV-1` and `headless-tier1-parity`)

**Proof Artifacts**:
- `archive/proofs/restore-full-parity-console-2026-02-13.log`

**Required Log Lines Present**:
- `[PARITY] profileIsolation result=PASS`
- `[PARITY] globeStack result=PASS`
- `[PARITY] boundaryEditor result=PASS`
- `[PARITY] votingSurface result=PASS`
- `[PARITY] hudPolicy result=PASS`
- `[PARITY] movementContinuity result=PASS`
- `[PARITY] osv1 result=PASS`
- `[PARITY] headlessParity result=PASS`
- `[PARITY] gate-summary result=PASS`

**Verification Commands**:
```bash
node scripts/restore-full-parity-proof.mjs
node scripts/osv1-full-system-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## GAP-1: World Runtime Stabilization ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Bugfix/tuning stabilization for world runtime (`boundary request gating`, `boundary idempotency`, `planetary LOD discipline`, `world log suppression`, `operator degraded HUD status`) without model changes.

**Current Result**:
- ✅ Boundary dataset mismatch no longer causes repeated request meltdown (`max404=0` in proof evidence)
- ✅ Boundary loader idempotency prevents duplicate entity add errors
- ✅ At `LANIAKEA/PLANETARY/REGION`, sheets/lanes/markers are disabled (`sheetsDetailed=0 lanes=0 markers=0`)
- ✅ World runtime remains stable with reduced console noise under operator-only logging
- ✅ Restore parity rail remains green after GAP-1 changes
- ✅ Budget refusal branch remains implemented; over-cap path not triggered in this objective run (`requested < cap`)

**Proof Artifacts**:
- `archive/proofs/gap1-world-runtime-console-2026-02-13.log`

**Required Log Lines Present**:
- `[GAP1] boundaryDataset result=PASS ... max404=0`
- `[GAP1] lodDiscipline result=PASS level=LANIAKEA sheetsDetailed=0 lanes=0 markers=0`
- `[PARITY] gate-summary result=PASS`

**Verification Commands**:
```bash
node scripts/gap1-world-runtime-proof.mjs
node scripts/restore-full-parity-proof.mjs
```

---

## VIS-2: Company Compression (Hotfix) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: COMPANY view compression (trunk + dept spines + compact sheet tiles only; no full sheet planes/cell grids/per-cell lanes until explicit sheet enter). Includes TDZ hotfix, LOD-override for explicit sheet entry, log-prefix allow-list fix, and companyCollapsed log truthfulness gate.

**Current Result**:
- ✅ `suppressSheetDetail` TDZ bug fixed (declaration moved before first use)
- ✅ Explicit sheet entry (`scope=sheet`) overrides LOD-based suppression for the selected sheet
- ✅ `VIS` prefix added to `_worldOperatorAllowPrefixes` so VIS2+ logs survive world-profile log filtering
- ✅ `companyCollapsed result=PASS` log gated to `normalizedLod === 'COMPANY'` only
- ✅ Department spine emphasis renders at COMPANY (`deptSpinesRendered count=3`)
- ✅ Compact sheet tiles render at COMPANY (`sheetTilesRendered count=20`)
- ✅ Enter sheet expands exactly one sheet, rest stay tiles (`enterSheet expanded=1 tiles=19`)
- ✅ Exit sheet collapses back to all tiles (`exitSheet collapsed=PASS expanded=0 tiles=20`)
- ✅ Headless parity unchanged (`facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH`)
- ⚠️ OSV-1 `focus-continuity` pre-existing FAIL (unchanged from 2026-02-12)

**Proof Artifacts**:
- `archive/proofs/vis2-company-compression-console-2026-02-13.log`

**Required Log Lines Present**:
- `[VIS2] expandedSheetsAllowed=false scope=world`
- `[VIS2] deptSpinesRendered count=3`
- `[VIS2] companyCollapsed result=PASS sheetsRendered=0`
- `[VIS2] sheetTilesRendered count=20`
- `[VIS2] enterSheet expanded=1 tiles=19`
- `[VIS2] exitSheet collapsed=PASS expanded=0 tiles=20`
- `[VIS2] gate-summary result=PASS`

**Verification Commands**:
```bash
node scripts/vis2-company-compression-proof.mjs
node scripts/headless-tier1-parity.mjs
```

---

## VIS-3.1a: Flow Lens (COMPANY Overlay) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: COMPANY LOD (collapsed) read-only flow overlay: traffic bars rendered on trunk-direct department spines. Green segment ∝ edge volume; red overlay ∝ exception ratio. Uses existing `tree.edges` + match-sheet exception state only. No mutation, no new data models.  
**Proof Artifact**: `archive/proofs/vis3-flow-overlay-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-3-FLOW-LENS.md`  
**Verify**: `node scripts/vis3-flow-overlay-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS3] flowOverlay result=PASS edges=42 exceptions=11 scope=world lod=COMPANY`
- `[VIS3] trafficBarsRendered count=3`
- `[LOD-BUDGET] frame ... totalPrims=50 ...` (includes `flow-bars` in `primitiveCount.flowBars`)
- `[VIS3] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Only renders when `expandedSheetsAllowed=false` and `lod=COMPANY`.
- VIS-3.2 will add sheet-level highlights; must not change VIS-3.1a semantics.

---

## VIS-3.2: Flow Lens (SHEET Overlay) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: SHEET scope (entered) read-only overlay: exception row highlights (orange polylines across sheet width at each non-MATCH row) + route highlight connectors (cyan polylines from source fact sheets to selected match sheet). Uses existing `metadata.sourceSheets` + match-sheet `matchStatus` column. No mutation, no new data models.  
**Proof Artifact**: `archive/proofs/vis3-sheet-overlay-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-3-FLOW-LENS.md` (VIS-3.2 section)  
**Verify**: `node scripts/vis3-sheet-overlay-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS3.2] sheetOverlay begin sheet=P2P.ThreeWayMatch scope=sheet`
- `[VIS3.2] exceptionRows result=PASS sheet=P2P.ThreeWayMatch count=5`
- `[VIS3.2] routeHighlights result=PASS sheet=P2P.ThreeWayMatch edges=3`
- `[VIS3.2] budget exceptionOverlays=5 routeHighlights=3 capped=false`
- `[VIS3.2] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis3-flow-overlay-proof.mjs` → PASS
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Only renders when `expandedSheetsAllowed=true` and `selectedSheetId` exists.
- Exception overlays capped at 200; route highlights capped at 50 (budget-safe).
- VIS-3.1a semantics unchanged (COMPANY traffic bars unaffected by sheet entry).
- **LOCK**: VIS-3.2 is CLOSED as of 2026-02-13. Further changes to VIS-3.2 behavior require a `VIS-3.2b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-3.3: Click-to-Focus (SHEET Interactivity) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: SHEET scope (entered) click-to-focus interactivity: click exception row overlay → focus highlight + HUD row data; click route connector → focus highlight + jump-to-source action; jump navigates to source fact sheet. Read-only inspection only, no data mutation.  
**Proof Artifact**: `archive/proofs/vis3-click-to-focus-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-3-FLOW-LENS.md` (VIS-3.3 section)  
**Verify**: `node scripts/vis3-click-to-focus-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS3.3] clickRow result=PASS sheet=P2P.ThreeWayMatch row=3 status=PRICE_EXCEPTION`
- `[VIS3.3] clickConnector result=PASS from=P2P.POLines to=P2P.ThreeWayMatch`
- `[VIS3.3] jumpToSource result=PASS sheet=P2P.POLines`
- `[VIS3.3] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis3-sheet-overlay-proof.mjs` → PASS
- `node scripts/vis3-flow-overlay-proof.mjs` → PASS
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Click handling wired into existing LEFT_CLICK handler; detects `vis3.2-exRow-*` and `vis3.2-route-*` primitive IDs.
- Focus adds at most 2 primitives (bright yellow row + connector highlights). Budget unchanged.
- Window functions (`vis33ClickExceptionRow`, `vis33ClickRouteConnector`, `vis33JumpToSource`) available for programmatic access.
- **LOCK**: VIS-3.3 is CLOSED as of 2026-02-13. Further changes require a `VIS-3.3b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-4a: Timebox Slabs (History Pucks) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: COMPANY LOD (collapsed) trunk + department branch slab stacks; SHEET scope selected sheet slab stack (from parent branch commits). Thin rectangular pucks (BoxGeometry) stacked along time axis. Color encodes scar count (red tint) and ERI confidence (brightness). Budget-capped at 12 per object, 120 total. Truncation: most recent (latest-first). No timebox generation changes, no data mutation.  
**Proof Artifact**: `archive/proofs/vis4-timebox-slabs-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-4-TIMEBOX-SLABS.md`  
**Verify**: `node scripts/vis4-timebox-slabs-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS4] slabsRendered scope=company objects=4 slabs=12 capped=false`
- `[VIS4] companySlabs result=PASS deptBranches=3 trunkSlabs=6`
- `[VIS4] slabsRendered scope=sheet objects=1 slabs=1 capped=false`
- `[VIS4] sheetSlabs result=PASS sheet=P2P.ThreeWayMatch slabs=1`
- `[VIS4] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis3-flow-overlay-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Slabs render only when parent object renders (respects VIS-2/3 gating).
- COMPANY: trunk slabs (40x40m) along ENU up; dept branch slabs (28x28m) along branch tangent.
- SHEET: selected sheet slabs (18x18m) behind sheet plane along `timeDir`.
- Budget hard-capped: `maxSlabsPerObject=12`, `maxTotalSlabsFrame=120`. Truncation keeps most recent.
- **LOCK**: VIS-4a is CLOSED as of 2026-02-13. Further changes require a `VIS-4b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-4c: Slab Labels + Hover Inspect ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Slab labels (always-on compact text above each rendered timebox slab) + hover inspect (highlight slab on mouse-over with HUD details) + click-to-pin (toggle pinned inspect; Escape to unpin). Read-only, no timebox generation changes, no per-cell slabs, no data mutation. Slab IDs include scope: `vis4-slab-<scope>-<ownerId>-<timeboxId>`. Budget: max 150 labels per frame, max 2 hover highlight primitives.  
**Proof Artifact**: `archive/proofs/vis4c-timebox-slab-inspect-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-4-TIMEBOX-SLABS.md` (VIS-4c section)  
**Verify**: `node scripts/vis4c-timebox-slab-inspect-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS4c] labelsRendered count=<n> scope=company`
- `[VIS4c] labelsRendered count=<n> scope=sheet`
- `[VIS4c] hover slab=<id> timebox=<timeboxId> owner=<ownerId>`
- `[VIS4c] pin slab=<id> pinned=true`
- `[VIS4c] pin slab=<id> pinned=false`
- `[VIS4c] hoverClear`
- `[VIS4c] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis4-timebox-slabs-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Labels render above each slab with compact `T=<id> C=<count> S=<scars> E=<eri>` format.
- Hover highlight: bright yellow BoxGeometry overlay (`#ffeb3b`, alpha 0.45).
- Click-to-pin toggles persistent inspect; pinned state prevents hover-clear on mouse leave.
- Escape key unpins slab inspect.
- Window functions (`vis4cHoverSlab`, `vis4cPinSlab`, `vis4cUnpin`, `vis4cGetSlabIds`) available for programmatic access.
- **LOCK**: VIS-4c is CLOSED as of 2026-02-13. Further changes require a `VIS-4c-b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-4d: Timebox Slab Focus (Camera + Context Lock) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Adds focus navigation to VIS-4a/4c slabs. Click slab → camera fly-to owner, non-owner slabs fade (in-place opacity reduction via `getGeometryInstanceAttributes`). Click again while focused → zoom closer to slab stack. Escape → restore camera + restore slab colors + clear highlight. No slab regeneration, no slab count change, no LOD side effects, no data mutation.  
**Proof Artifact**: `archive/proofs/vis4d-slab-focus-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-4-TIMEBOX-SLABS.md` (VIS-4d section)  
**Verify**: `node scripts/vis4d-slab-focus-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS4D] focusOwner result=PASS owner=trunk.avgol scope=company`
- `[VIS4D] focusSlabStack result=PASS owner=trunk.avgol timeboxId=T1`
- `[VIS4D] focusClear result=PASS`
- `[VIS4D] focusOwner result=PASS owner=P2P.ThreeWayMatch scope=sheet`
- `[VIS4D] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis4-timebox-slabs-proof.mjs` → PASS
- `node scripts/vis4c-timebox-slab-inspect-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Focus uses existing camera `flyTo` system; no new camera modes introduced.
- Non-owner fade is in-place color attribute change (no new primitives for dimming).
- Owner highlight: max 1 primitive (`vis4d-focus-<ownerId>`). Total primitive budget delta ≤ +2.
- Slab count verified unchanged before/after focus (27 → 27 → 27).
- Pre-focus camera state stored and restored on Escape/clear.
- Window functions (`vis4dFocusOwner`, `vis4dFocusSlabStack`, `vis4dFocusClear`) available for programmatic access.
- **LOCK**: VIS-4d is CLOSED as of 2026-02-13. Further changes require a `VIS-4d-b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-6a: Live Timebox Pulse (Overlay Only) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: When a new timebox is detected for an owner, emits a visible pulse at the slab stack (translucent white box, 800ms), temporarily brightens owner slabs (1.3x RGB, 800ms), and optionally spikes the flow bar for dept branches at COMPANY (+15% bright green extension, 800ms). Auto-cleans all temporary primitives after timeout. Pure presentation overlay — no timebox creation, no data mutation, no LOD side effects.  
**Proof Artifact**: `archive/proofs/vis6-timebox-pulse-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-6-LIVE-PULSE.md`  
**Verify**: `node scripts/vis6-timebox-pulse-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS6] timeboxPulse owner=trunk.avgol timeboxId=T-SYNTHETIC-1 scope=company`
- `[VIS6] pulseComplete owner=trunk.avgol timeboxId=T-SYNTHETIC-1`
- `[VIS6] timeboxPulse owner=P2P.ThreeWayMatch timeboxId=T-SHEET-SYNTH-1 scope=sheet`
- `[VIS6] pulseComplete owner=P2P.ThreeWayMatch timeboxId=T-SHEET-SYNTH-1`
- `[VIS6] gate-summary result=PASS pulses=1`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis4-timebox-slabs-proof.mjs` → PASS
- `node scripts/vis4d-slab-focus-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Detection: `_vis6SeenTimeboxes` Map tracks seen timebox IDs per owner. New IDs trigger pulses on render.
- Pulse cap: max 20 concurrent. Auto-cleanup after 800ms removes all temporary primitives and restores slab colors.
- Stack glow: in-place color attribute modification (1.3x RGB), restored to `originalColor` after timeout.
- Flow spike: temporary bright polyline extension at bar end (+15% length), removed after 800ms. +1 primitive per spike.
- Slab count verified unchanged (27 → 27).
- `activePulses=1` during pulse, `activePulses=0` after cleanup.
- Window functions (`vis6SimulatePulse`, `vis6GetPulseState`) for programmatic/proof access.
- **LOCK**: VIS-6a is CLOSED as of 2026-02-13. Further changes require a `VIS-6a-b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-6b: Event Stream Pulse Propagation (Read-Only) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: Routes pulses from a deterministic in-memory event feed to the correct owner slab stack. Events processed in `(ts, id)` order, deduplicated, coalesced within 500ms windows, cap-enforced at 20 concurrent pulses. Supports `TIMEBOX_APPEARED`, `FLOW_UPDATE`, and `EXCEPTION_UPDATE` event types. Reuses VIS-6a pulse infrastructure (same primitives, same 800ms lifecycle). Pure presentation overlay — no data mutation, no persistence, no timebox generation changes.  
**Proof Artifact**: `archive/proofs/vis6b-event-stream-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-6-LIVE-PULSE.md` (VIS-6b section)  
**Verify**: `node scripts/vis6b-event-stream-proof.mjs`  
**Proof Policy**: B (expected refusal — over-cap subtest produces REFUSAL log, non-blocking)

**Required PASS lines** (must appear in artifact):
- `[VIS6B] eventAccepted id=...` (at least 3 occurrences)
- `[VIS6B] pulseTriggered id=...` (at least 3 occurrences)
- `[VIS6B] pulseCoalesced owner=...` (at least 1)
- `[REFUSAL] reason=VIS6B_PULSE_CAP_EXCEEDED ...` (exactly 1 signature — expected by design)
- `[VIS6B] summary accepted=... triggered=... coalesced=... dropped=...`
- `[VIS6B] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis4-timebox-slabs-proof.mjs` → PASS
- `node scripts/vis6-timebox-pulse-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Event feed is in-memory only (ephemeral). No persistence to disk/localStorage.
- Window API: `vis6bPushEvent`, `vis6bPushEvents`, `vis6bGetState`, `vis6bReset`, `vis6bSimulateBatch`.
- Dedup: `_vis6bSeenEventIds` Set rejects duplicate event IDs.
- Coalesce: same `(ownerId, timeboxId)` within 500ms window → one pulse, others counted as coalesced.
- Cap: max 20 concurrent pulses. Excess → `[REFUSAL] reason=VIS6B_PULSE_CAP_EXCEEDED` log.
- Unknown owner: events referencing non-existent `ownerId` are dropped (no throw).
- `vis6bReset()` clears all VIS-6b state without touching VIS-6a.
- **LOCK**: VIS-6b is CLOSED as of 2026-02-13. Further changes require a `VIS-6b-b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-6c: Transport Shim (WebSocket → VIS-6b) ✅ PASSED

**Date Passed**: 2026-02-13  
**Scope**: WebSocket client that ingests events from an external stream (`ws://127.0.0.1:4030/vis6` default), normalizes them to VIS-6b schema, and delivers via `vis6bPushEvent`/`vis6bPushEvents`. Transport only — no new primitives, no data mutation, no rendering changes. Disabled by default; requires `window.RELAY_ENABLE_VIS6C = true` and `profile=world`. Supports single and batch wire formats. Normalizes types, drops invalid events (bad JSON, missing fields, bad ts), caps at 200 events per message.  
**Proof Artifact**: `archive/proofs/vis6c-transport-shim-console-2026-02-13.log`  
**Spec**: `docs/vis/VIS-6-LIVE-PULSE.md` (VIS-6c section)  
**Verify**: `node scripts/vis6c-transport-shim-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS6C] wsConnect url=...`
- `[VIS6C] wsOpen url=...`
- `[VIS6C] wsClose code=...`
- `[VIS6C] drop reason=bad_json`
- `[VIS6C] drop reason=missing_fields`
- `[VIS6C] drop reason=bad_ts`
- `[VIS6B] eventAccepted ...` (at least 1 — proves end-to-end delivery)
- `[VIS6B] pulseTriggered ...` (at least 1 — proves pulse rendered from WS event)
- `[VIS6C] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis4-timebox-slabs-proof.mjs` → PASS
- `node scripts/vis6-timebox-pulse-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Window API: `vis6cConnect(url?)`, `vis6cDisconnect()`, `vis6cGetState()`.
- Auto-connect on page load only if `RELAY_ENABLE_VIS6C === true` AND `profile=world`.
- URL override via `window.RELAY_VIS6_WS_URL`, URL param `vis6ws=...`, or `vis6cConnect(url)`.
- Proof embeds its own WS server on port 4030; sends valid events, duplicates, bad JSON, invalid events.
- Proof verified: 5 events accepted by VIS-6b, 3 dropped at transport layer (bad_json + missing_fields + bad_ts), 1 VIS-6b dup drop, 1 coalesce, 4 pulses triggered.
- **LOCK**: VIS-6c is CLOSED as of 2026-02-13. Further changes require a `VIS-6c-b` patch with its own proof artifact and PROOF-INDEX entry.
- Regression re-run (no code change): 2026-02-14 — PASS — artifact: `archive/proofs/vis6c-transport-shim-console-2026-02-14.log`

---

## VIS-7a: Presence Markers (Ephemeral) ✅ PASSED

**Date Passed**: 2026-02-14  
**Scope**: Ephemeral "who is here / looking at what" markers. COMPANY (collapsed): markers near dept spines and trunk. SHEET: markers near selected sheet. Self-expiring after 15s TTL. Dedup by event id, coalesce 250ms per user (keep latest), cap 50 active markers. Rendering: colored box primitives (green=view, orange=edit) + optional userId labels (capped at 30). WS transport on port 4031. Pure presentation overlay — no identity, no persistence, no data mutation.  
**Proof Artifact**: `archive/proofs/vis7a-presence-console-2026-02-14.log`  
**Spec**: `docs/vis/VIS-7-PRESENCE.md`  
**Verify**: `node scripts/vis7a-presence-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS7A] presenceEngine enabled ttlMs=15000 cap=50 coalesceMs=250`
- `[VIS7A] batchApplied accepted=... active=...` (at least 1)
- `[VIS7A] rendered scope=company markers=... capped=false`
- `[VIS7A] rendered scope=sheet markers=... capped=false`
- `[REFUSAL] reason=VIS7A_MARKER_CAP_EXCEEDED active=50 dropped=...` (expected — cap burst test)
- `[VIS7A] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis6c-transport-shim-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Window API: `vis7aPushEvent`, `vis7aPushEvents`, `vis7aGetState`, `vis7aReset`, `vis7aSimulateBurst`, `vis7aConnect`, `vis7aDisconnect`.
- TTL: 15000ms default. Periodic cleanup every 2s. Updates from same (userId, targetKey) refresh TTL.
- Dedup: `_vis7aSeenIds` Set rejects duplicate event ids.
- Coalesce: same userId within 250ms → keep latest, counter incremented.
- Cap: max 50 active markers. Excess → `[REFUSAL] reason=VIS7A_MARKER_CAP_EXCEEDED` log.
- Target resolution: SHEET scope falls back through exact sheetId → any current slab → dept → company. COMPANY scope prefers trunk, falls back to any slab.
- Proof verified: 3 company markers placed, 2 sheet markers placed, 50/60 burst accepted (10 cap-dropped), TTL cleanup returned active to 0, WS transport delivered 3 markers with 1 coalesce.
- **LOCK**: VIS-7a is CLOSED as of 2026-02-14. Further changes require a `VIS-7a-b` patch with its own proof artifact and PROOF-INDEX entry.

---

## VIS-7b: Presence Inspect (Hover + Pin + HUD) ✅ PASSED

**Date Passed**: 2026-02-14  
**Scope**: Makes presence markers inspectable. Hover shows yellow highlight + HUD card (userId, mode, ageMs, target, scope). Click toggles pin (highlight persists). Click again unpins (toggle). Click different marker switches (unpin old, pin new). Escape clears pin. Max 1 highlight primitive. Display-only — no mutation, no new markers beyond VIS-7a cap. Escape priority: VIS-7b pin clears before VIS-4c slab unpin.  
**Proof Artifact**: `archive/proofs/vis7b-presence-inspect-console-2026-02-14.log`  
**Spec**: `docs/vis/VIS-7-PRESENCE.md` (VIS-7b section)  
**Verify**: `node scripts/vis7b-presence-inspect-proof.mjs`

**Required PASS lines** (must appear in artifact):
- `[VIS7B] hover marker=... result=PASS`
- `[VIS7B] pin marker=... result=PASS`
- `[VIS7B] unpin marker=... result=PASS reason=toggle`
- `[VIS7B] unpin marker=... result=PASS reason=escape`
- `[VIS7B] unpin marker=... result=PASS reason=switch`
- `[VIS7B] hudUpdate user=... fields=6 result=PASS`
- `[VIS7B] gate-summary result=PASS`

**Regressions checked**:
- `node scripts/vis2-company-compression-proof.mjs` → PASS
- `node scripts/vis6c-transport-shim-proof.mjs` → PASS
- `node scripts/vis7a-presence-proof.mjs` → PASS
- `node scripts/headless-tier1-parity.mjs` → PASS

**Notes / Locks**:
- Window API: `vis7bClickMarker`, `vis7bUnpin`, `vis7bHoverMarker`, `vis7bGetMarkerIds`, `vis7bGetInspectState`.
- Highlight: single yellow box primitive (`vis7b-highlight-*`), removed on unpin/clear.
- Pin state: `renderer._vis7bPinnedMarkerId`. Cleared by toggle, switch, escape, or VIS-7a reset.
- HUD: Updates via `hudManager.update()` with 6-field compact card on pin/hover.
- Escape priority chain: buds → VIS-4d focus → **VIS-7b presence pin** → VIS-4c slab pin → edit mode → focus mode.
- Proof verified: 3 markers placed, hover PASS, pin PASS, unpin toggle/switch/escape all PASS, highlight persists while pinned, TTL cleanup to 0.
- **LOCK**: VIS-7b is CLOSED as of 2026-02-14. Further changes require a `VIS-7b-b` patch with its own proof artifact and PROOF-INDEX entry.

---

## How to Add Proof Artifacts

### For Screenshots

```bash
# Take screenshot, save to archive/proofs/
# Name format: phase{N}-{description}-{YYYY-MM-DD}.png
```

### For Console Logs

```bash
# Copy console output to file
# Name format: phase{N}-{description}-{YYYY-MM-DD}.log
```

### For Test Outputs

```bash
# Run test, redirect output
MISSING: archive/proofs/phase0-boot-gate-2026-02-06.txt (expected by Phase 0: Cesium Boot)
```

### Update This Index

Add entry with:
- Phase number and name
- Date passed
- Artifact file paths (relative to archive/proofs/)
- Verification command

---

## Verification Commands

```bash
# List all proof artifacts
ls archive/proofs/

# View specific proof
MISSING: archive/proofs/phase0-console-2026-02-06.log (expected by Phase 0: Cesium Boot)

# Verify phase status
grep "PASSED" archive/proofs/PROOF-INDEX.md
```

---

*This index ensures every "PASSED" claim is verifiable and replayable.*
