# Canon Custody

Relay Canon is the versioned rule and history lineage that defines how verification, consent, and material commits operate.

This document defines:
- who may write Canon
- what "custody" means (provenance, not special capability)
- how custody transitions occur without hidden authority
- how other nodes mirror and verify

## Definitions

- **Canon**: the Git repository (and associated signed bundles) that contains:
  - laws/rules (rule catalog, invariants)
  - schemas
  - custody policy
  - verification contracts
  - material commit history
- **Custodian Node**: a node authorized to author and sign Canon commits.
- **Mirror Node**: a node that pulls Canon and serves read-only state; it cannot author Canon commits.
- **Lens**: a client (web/mobile/desktop view) that reads, verifies, and can submit proposals.

## Custody Principle

Custody is **special by provenance, not capability**.

- Any node can run Relay software.
- Only the custodian key can sign Canon commits accepted into the Canon lineage.
- Everyone can verify the lineage independently from signatures and hashes.

## Write Authority

### Canon Write Authority (Initial Phase)
- **ONLY** the Desktop Canon Core (primary custodian) may author and sign Canon commits.
- NAS is **not** a writer; it is a vault that accepts or refuses bundles based on verification.

### What is a Canon write?
A Canon write is any action that changes:
- rule catalog files
- invariant definitions
- schema versions
- custody policy
- verification contracts
- governance thresholds

### What is NOT a Canon write?
- drafts
- proposals (uncommitted)
- lens state (views, camera, UI)
- derived indexes and caches
- non-canonical media/assets

## Commit Materiality and Gates

All Canon changes use typed commit gates:

- **DRAFT**: local, reversible, not shared
- **HOLD**: frozen draft awaiting review
- **PROPOSE**: shared proposal; not in Canon lineage
- **COMMIT**: accepted into Canon lineage (signed)
- **REVERT**: visible rollback commit (also signed)

No Canon write occurs without COMMIT.

## Custody Keys

- Custody signing key is stored and used only on the custodian node.
- Offline storage is required for recovery (e.g., removable media).
- Loss of custody key does not erase history, but blocks future signed Canon commits until custody transition is executed.

## Compromised Custody Key

If custody key is suspected compromised (not just lost):

1. **Immediate REFUSAL** of all Canon writes
2. **Rollback** to last verified good commit
3. **Custody transition** with new key
4. **Forensic audit log** of all commits since suspected compromise
5. **Public announcement** in Canon lineage (as COMMIT with reason)

### Compromised vs Lost

- **Lost**: custody transition with continuity (history preserved)
- **Compromised**: custody transition with break + audit (suspect commits marked)

## Custody Transition (Future Phase)

Custody transition is explicit and recorded in Canon.

A custody transition requires:

1. A **PROPOSE** that includes:
   - new custodian public key(s)
   - effective date/timebox
   - transition reason (mechanical)
2. **Verification period** (timeboxed)
3. **COMMIT** containing the transition record, signed by current custodian
4. **Mirrors and lenses** update by verifying the new custody record

Optional later: multiple co-signers for specific rule classes (consent-gated).

## Mirrors and Lenses

### Mirrors
- Pull-only replication
- Verify every bundle before serving read-only state
- Never push back to Canon vault paths

### Lenses (Web/Mobile/Desktop view)
- Read-first
- Must verify Canon lineage before accepting state
- Can submit proposals to the custodian node for evaluation
- Must enter **DEGRADED mode** if verification fails

## Degraded Behavior

If custodian node is unavailable:

- Lenses may continue read-only from mirrors (if verified)
- Proposals queue locally or at the edge (as configured)
- No Canon writes occur until custodian returns or custody transition is executed

## Auditability

All custody events are:
- signed
- hashed
- replayable
- stored in append-only history

**No hidden authority.**
**No silent changes.**
