# Relay Crypto-Geometric Architecture
## The Complete Spec: 3D Visualization + Merkle Tree Validation

**Date**: 2026-02-06  
**Status**: Canonical Specification

---

## 🌲 ASCII Architecture Diagram

```
                         SKY (Present/Visibility)
                    ═══════════════════════════════
                    
         Sheet (Packaging)          Sheet (Materials)
         ┌──────────────┐          ┌──────────────┐
         │ A1  B1  C1  │          │ A1  B1  C1  │
         │ A2  B2  C2  │          │ A2  B2  C2  │    ← Leaves (Cells/Events)
         │ ... (48)    │          │ ... (30)    │      Encrypted: E_pubkey(data)
         └──────┬───────┘          └──────┬───────┘      Hash: H(ciphertext)
                │ Spine                   │ Spine         Sig: Sign(privkey, hash)
                │ (many→one)              │ (many→one)
                ↓                         ↓
         ═══════╪═════════════════════════╪═══════
              Branch.Operations       Branch.Sales     ← Branches (Grouped State)
              [timeboxRoot₁]         [timeboxRoot₂]      MerkleRoot(cellHashes)
         ═══════╪═════════════════════════╪═══════
                └────────┬─────────────────┘
                         ↓
                    Trunk (Avgol)                       ← Company Local Surface
                    [companyRoot]                         MerkleRoot(branchRoots)
                         │
                    ═════╪═════  GROUND (Anchor)
                         │
                         ↓ ROOTS (History/Consolidation)
                    
                    ┌────┴────┐
                    │  Root₁  │  Root₂  │  Root₃  │     ← Many Roots (per topic/dept)
                    │   ↓     │   ↓     │   ↓     │       Carry commitments down
                    └────┬────┴────┬────┴────┬────┘
                         └────┬────┘         │
                              ↓              ↓
                         Company.Reconcile Node           ← ONE checkpoint per company
                         [companyCheckpoint]                Sign(companyKey, companyRoot)
                              │
                              ↓ (Bundle with other companies)
                    ═════════════════════════════
                         Regional Basin
                    ═════════════════════════════
                    
     Avgol            TelCo           MedCorp
       │                │                │          ← Multiple Company Checkpoints
       └────────────────┼────────────────┘
                        ↓
                Regional.Checkpoint                  ← Regional Reconciliation
                [regionRoot]                           MerkleRoot(companyRoots)
                Sign(regionKey, regionRoot)
                        │
                        ↓ (Bundle with other regions)
                    ═════════════════════════════
                      Global Core Layer
                    ═════════════════════════════
                    
    EMEA              AMER              APAC
      │                 │                 │         ← Multiple Regional Checkpoints
      └─────────────────┼─────────────────┘
                        ↓
                   Earth.Core                       ← GLOBAL CHECKPOINT
                   [coreRoot]                         MerkleRoot(regionRoots)
                   Sign(coreKey, coreRoot)
                        │
                        ↓
                   VALIDATION ANCHOR                 ← Core validates ALL
                   • Signature checks                  without decrypting
                   • Merkle proofs
                   • Authority chain
                   • Consistency rules
```

---

## 📐 Geometry + Meaning Map

### Vertical Axis (ENU Up/Down)

**UP (ENU +Z)**: Present Visibility
- **Sheets**: Spreadsheet planes (horizontal, facing up)
- **Cells**: Individual events/records (encrypted leaves)
- **Branches**: Grouped state surfaces (departments, projects)
- **Trunk**: Company identity anchor

**GROUND (ENU Z=0)**: Anchor Point
- Geographic location (lat, lon)
- ENU frame origin
- Identity root

**DOWN (ENU -Z)**: History + Consolidation
- **Roots**: Many conduits carrying commitments
- **Bundles**: Progressively merging (Merkle-tree style)
- **Checkpoints**: Reconciliation nodes (company → region → core)

### Horizontal Axes (ENU East/North)

**EAST (ENU +X)**: Tree expansion (branches extend outward)  
**NORTH (ENU +Y)**: Tree spacing (parallel branches, tight)

---

## 🔐 Cryptographic Architecture

### 1. Leaf Level (Cells/Events)

**Each leaf contains**:
```javascript
{
    // Private data (encrypted)
    ciphertext: E_pubkey(plaintext),           // Encrypted with recipient's public key
    
    // Public commitment (on-chain / global state)
    cipherHash: H(ciphertext),                 // Hash of ciphertext (public)
    leafId: "cell-A1-2026-02-06-001",
    timestamp: 1707235200,
    scope: "branch.operations.packaging",
    
    // Authorship proof
    signature: Sign(authorPrivKey, cipherHash || scope || timestamp)
}
```

**Key Properties**:
- Data is **encrypted** (confidentiality)
- Hash is **public** (commitment)
- Signature is **public** (authorship + integrity)
- Core can **verify hash + signature** without decrypting

---

### 2. Timebox Checkpoint (Periodic Reconciliation)

**Every timebox interval** (e.g., weekly):
```javascript
{
    timeboxId: "2026-W06",
    leafHashes: [
        H(ciphertext₁),
        H(ciphertext₂),
        ...
        H(ciphertextₙ)
    ],
    
    // Merkle root of all leaf hashes
    timeboxRoot: MerkleRoot(leafHashes),
    
    // Signature over root
    timeboxSig: Sign(branchKey, timeboxRoot || timeboxId)
}
```

**Merkle Tree Structure**:
```
                 timeboxRoot
                   /    \
                  /      \
            H₁₂₃₄        H₅₆₇₈
           /    \        /    \
         H₁₂    H₃₄    H₅₆    H₇₈
        /  \    /  \   /  \    /  \
       H₁  H₂  H₃  H₄ H₅  H₆  H₇  H₈
       │   │   │   │  │   │   │   │
      L₁  L₂  L₃  L₄ L₅  L₆  L₇  L₈  ← Leaves (ciphertext hashes)
```

---

### 3. Branch Checkpoint (Department/Project State)

**Each branch aggregates timeboxes**:
```javascript
{
    branchId: "branch.operations",
    timeboxRoots: [
        timeboxRoot_W01,
        timeboxRoot_W02,
        ...
        timeboxRoot_W52
    ],
    
    // Merkle root of timebox roots
    branchRoot: MerkleRoot(timeboxRoots),
    
    // Signature
    branchSig: Sign(branchKey, branchRoot || branchId)
}
```

---

### 4. Company Checkpoint (Local Reconciliation)

**One checkpoint per company**:
```javascript
{
    companyId: "company.avgol",
    branchRoots: [
        branchRoot_operations,
        branchRoot_sales,
        branchRoot_finance
    ],
    
    // Merkle root of branch roots
    companyRoot: MerkleRoot(branchRoots),
    
    // Signature by company key
    companySig: Sign(companyKey, companyRoot || companyId || timestamp)
}
```

**This is the "one relationship node" for that company's state.**

---

### 5. Root System (Many → One Bundling)

**Visual representation**:
```
Leaves (48 cells)
    ↓ (many thin roots)
Spine (sheet bundle)
    ↓ (one thick conduit)
Branch (department state)
    ↓ (multiple topic roots)
    
Root₁ (Topic: Supply Chain)
Root₂ (Topic: Quality Control)
Root₃ (Topic: Finance)
    ↓ (converge)
    
Company.Reconcile Node
[companyCheckpoint]
```

**Each root carries**:
- **Not raw data** (privacy preserved)
- **Commitments** (hashes, signatures, proofs)
- **Provenance** (who signed, when, under what authority)

---

### 6. Regional Checkpoint (Inter-Company Bundling)

**Multiple companies in a region**:
```javascript
{
    regionId: "region.middleeast",
    companyCheckpoints: [
        { companyId: "avgol", root: companyRoot_avgol, sig: companySig_avgol },
        { companyId: "telco", root: companyRoot_telco, sig: companySig_telco },
        { companyId: "medcorp", root: companyRoot_medcorp, sig: companySig_medcorp }
    ],
    
    // Merkle root of company checkpoints
    regionRoot: MerkleRoot([
        H(companyRoot_avgol || companySig_avgol),
        H(companyRoot_telco || companySig_telco),
        H(companyRoot_medcorp || companySig_medcorp)
    ]),
    
    // Regional authority signature
    regionSig: Sign(regionKey, regionRoot || regionId || timestamp)
}
```

---

### 7. Relationship Edges (Without Data Leakage)

**How Company A and Company B prove a relationship**:
```javascript
{
    relationshipId: "rel.avgol_telco.supply_contract",
    
    // Public commitments (no private data)
    edgeCommit: H(
        relationshipDescriptor ||  // "Supply contract for packaging materials"
        companyRoot_A ||
        companyRoot_B ||
        salt
    ),
    
    // Both sides sign
    sig_A: Sign(companyKey_A, edgeCommit),
    sig_B: Sign(companyKey_B, edgeCommit),
    
    // Optional: Merkle inclusion proofs
    // "The leaf representing this contract exists under companyRoot_A"
    proof_A: MerkleInclusionProof(leafHash_contract, companyRoot_A),
    proof_B: MerkleInclusionProof(leafHash_contract, companyRoot_B)
}
```

**What this proves**:
- ✅ Both companies committed to the same relationship
- ✅ The relationship exists under both company roots
- ✅ Both authorized keys signed the commitment

**What this DOES NOT reveal**:
- ❌ Contract terms (encrypted)
- ❌ Prices (encrypted)
- ❌ Internal documents (encrypted)

---

### 8. Global Core Checkpoint (Ultimate Validation)

**Earth.Core aggregates all regions**:
```javascript
{
    coreId: "earth.core",
    regionCheckpoints: [
        { regionId: "EMEA", root: regionRoot_emea, sig: regionSig_emea },
        { regionId: "AMER", root: regionRoot_amer, sig: regionSig_amer },
        { regionId: "APAC", root: regionRoot_apac, sig: regionSig_apac }
    ],
    
    // Global Merkle root
    coreRoot: MerkleRoot([
        H(regionRoot_emea || regionSig_emea),
        H(regionRoot_amer || regionSig_amer),
        H(regionRoot_apac || regionSig_apac)
    ]),
    
    // Core authority signature
    coreSig: Sign(coreKey, coreRoot || timestamp),
    
    // Validation metadata
    validationTimestamp: 1707235200,
    blockHeight: 1234567  // If anchored to blockchain
}
```

---

## 🔍 Core Validation (Without Decryption)

### What the Core Can See

**Public data**:
- Merkle roots (at every level: timebox, branch, company, region, global)
- Signatures (proving authorship and authority)
- Hashes (commitments to encrypted data)
- Key registry (who is allowed to sign what)
- Merkle inclusion proofs (when someone presents a claim)

**Private data** (encrypted, NOT visible to core):
- Cell contents (business data)
- Contract terms
- Prices, schedules, internal communications

---

### What the Core Validates

**1. Signature Validity**
```javascript
function validateSignature(checkpoint) {
    const { root, sig, keyId } = checkpoint;
    const publicKey = keyRegistry.getPublicKey(keyId);
    return VerifySignature(publicKey, root, sig);
}
```

**2. Authority Chain**
```javascript
function validateAuthority(keyId, scope) {
    // Was this key allowed to sign for this scope?
    return authorityChain.isAuthorized(keyId, scope);
}
```

**3. Merkle Correctness**
```javascript
function validateMerkleProof(leafHash, root, proof) {
    let computedHash = leafHash;
    for (const proofElement of proof) {
        computedHash = H(computedHash || proofElement);
    }
    return computedHash === root;
}
```

**4. Consistency (No Double-Spend / Fork Detection)**
```javascript
function validateConsistency(newCheckpoint, previousCheckpoint) {
    // Ensure new checkpoint extends previous (no rewrite)
    // If fork detected, require explicit fork record
    return newCheckpoint.parentRoot === previousCheckpoint.root;
}
```

**5. Non-Destructive History**
```javascript
function validateHistory(checkpointChain) {
    // Updates are append-only
    // Reverts are explicit (signed revert record)
    // No silent mutation
    return checkpointChain.every(cp => cp.isAppendOnly());
}
```

---

## 🎯 1:Many Relationships Explained

### Level 1: Cells → Spine (1:Many Convergence)

**Visual**:
```
Cell A1 ─┐
Cell A2 ─┤
Cell A3 ─┤
  ...    ├──→ Spine (Sheet Bundle) ──→ Branch
Cell H5 ─┤
Cell H6 ─┘
```

**Crypto**:
- 48 cells = 48 leaf hashes
- 1 spine = MerkleRoot(48 leaf hashes)
- Spine → Branch = 1 signed commitment

---

### Level 2: Branches → Company (1:Many Convergence)

**Visual**:
```
Branch.Operations ─┐
Branch.Sales      ─┼──→ Company.Reconcile Node
Branch.Finance    ─┘     [companyCheckpoint]
```

**Crypto**:
- 3 branches = 3 branch roots
- 1 company checkpoint = MerkleRoot(3 branch roots)
- Signed by company key

---

### Level 3: Companies → Region (1:Many Convergence)

**Visual**:
```
Company.Avgol   ─┐
Company.TelCo   ─┼──→ Region.MiddleEast
Company.MedCorp ─┘     [regionCheckpoint]
```

**Crypto**:
- N companies = N company roots
- 1 region checkpoint = MerkleRoot(N company roots)
- Signed by regional authority key

---

### Level 4: Regions → Core (1:Many Convergence)

**Visual**:
```
Region.EMEA ─┐
Region.AMER ─┼──→ Earth.Core
Region.APAC ─┘     [coreRoot]
```

**Crypto**:
- M regions = M region roots
- 1 global checkpoint = MerkleRoot(M region roots)
- Signed by core authority key

---

## 🌐 Complete Data Flow

### Upward (Present Visibility)
```
Cells (encrypted data) → visible on sheets
    ↓ hash
Sheets → visible above branches
    ↓ aggregation
Branches → visible at trunk top
    ↓ company state
Trunk → company identity (local anchor)
```

### Downward (History Consolidation)
```
Trunk (company anchor)
    ↓ roots (many)
Root bundles (topic/dept/timebox)
    ↓ converge
Company.Reconcile Node (ONE checkpoint)
    ↓ bundle with peers
Regional.Checkpoint
    ↓ bundle with peers
Earth.Core (GLOBAL checkpoint)
    ↓
Validation Anchor (verifies all without decrypting)
```

---

## 🔐 Encryption Model (Precise)

### Core Principle

**"Leaf = encrypted payload; everything above leaf = hashes + signatures + Merkle roots."**

---

### What Gets Encrypted vs What Stays Public

**ENCRYPTED (Private Payload)**:
- Cell value (data in spreadsheet cell)
- Document content (contracts, reports)
- Attachments (files, images)
- Sensitive fields (prices, terms, schedules)
- Internal communications

**Anything you don't want globally readable.**

**PUBLIC (Needed for Verification + Routing)**:
- `cipherHash = H(ciphertext)` - Commitment (proves "I committed to THIS ciphertext")
- `scope` - Which branch/sheet/timebox it belongs to (routing metadata)
- `timestamp` - Or logical commit index (ordering)
- `signature` - Author signature over `(cipherHash + scope + timeboxId)`
- `recipientSetHash` - Optional: `H(sorted(recipientIds))` proves who was granted access without listing names

**Result**: "Privacy without exposure" - Core sees commitments, not secrets.

---

### Permission Model: Per User, Per Leaf

**Two patterns for multi-recipient encryption**:

#### Pattern A: Multi-Recipient Encryption (Simple, Explicit)

**For each leaf**:
1. Encrypt the same payload separately to each recipient's public key
2. Store multiple encrypted blobs (or one blob + multiple key-wrappings)

```javascript
const leaf = {
    leafId: "cell-A1-001",
    ciphertexts: [
        { recipientId: "user.alice", blob: E_pubkey_alice(plaintext) },
        { recipientId: "user.bob",   blob: E_pubkey_bob(plaintext) }
    ],
    cipherHash: H(plaintext),  // Commitment to original plaintext
    scope: "branch.operations.packaging",
    timestamp: 1707235200,
    signature: Sign(authorPrivKey, cipherHash || scope || timestamp)
};
```

**Pros**: Straightforward, easy audits  
**Cons**: Storage overhead (N recipients = N blobs)

---

#### Pattern B: Envelope Encryption (Best Practice, Efficient)

**For each leaf**:
1. Generate random symmetric key `K`
2. Encrypt payload with `K`: `ciphertext = E_symmetric(K, plaintext)`
3. For each recipient, encrypt `K` to their public key: `wrap_i = E_pubkey_i(K)`
4. Public commitment is over `ciphertext` + `wrapSet`

```javascript
const leaf = {
    leafId: "cell-A1-001",
    ciphertext: E_symmetric(K, plaintext),        // One ciphertext
    wraps: [
        { recipientId: "user.alice", wrap: E_pubkey_alice(K) },
        { recipientId: "user.bob",   wrap: E_pubkey_bob(K) }
    ],
    cipherHash: H(ciphertext),                    // Commitment
    wrapSetHash: H(sorted([recipientId...])),     // Proves recipient set
    scope: "branch.operations.packaging",
    timestamp: 1707235200,
    signature: Sign(authorPrivKey, cipherHash || wrapSetHash || scope || timestamp)
};
```

**Pros**: Efficient (one ciphertext, N small wraps), scalable  
**Cons**: Slightly more complex (symmetric + asymmetric)

---

### Revocation (Important)

**You CANNOT "unshare" a secret someone already decrypted.**

**What you CAN do**:
1. **Stop issuing new wraps** to revoked user going forward
2. **Rotate keys** for new leaves/timeboxes (new K, new wraps)
3. **Show revocation as explicit commit** (history stays intact, signed revocation record)

```javascript
const revocationCommit = {
    type: "REVOCATION",
    leafId: "cell-A1-001",
    revokedRecipient: "user.bob",
    effectiveTimestamp: 1707235200,
    signature: Sign(authorPrivKey, revocationCommit)
};
```

**History rule**: Revocations are explicit (append-only), not silent mutation.

---

### What Users Do (Leaf Creation)

**Author creates an encrypted leaf**:
1. Write plaintext data: `"Contract with TelCo: $50k"`
2. **Encrypt with recipient's public key**: `ciphertext = E_pubkey_recipient(plaintext)`
   - Or use envelope encryption: `ciphertext = E_symmetric(K, plaintext)` + `wrap = E_pubkey(K)`
3. Hash the ciphertext: `leafHash = H(ciphertext)`
4. Sign the hash with **author's private key**: `sig = Sign(privkey_author, leafHash || scope || timestamp)`
5. Publish: `{ ciphertext (or ciphertext + wraps), leafHash, sig, scope, timestamp }`

**Why this works**:
- **Confidentiality**: Only recipient can decrypt (has private key)
- **Commitment**: Hash proves "I committed to THIS ciphertext"
- **Authorship**: Signature proves "I (author) signed this hash"
- **Core can validate**: Hash + signature are public, verifiable

---

### What Core Does (Without Decryption)

**Core receives**:
```javascript
{
    leafHash: "0x1234abcd...",
    sig: "0x9876fedc...",
    authorKeyId: "company.avgol.operations.key1",
    scope: "branch.operations",
    timestamp: 1707235200
}
```

**Core validates** (integrity and authorization):
1. **Signature**: `VerifySignature(authorPubKey, leafHash, sig)` ✅
2. **Authority**: Is `authorKeyId` allowed to sign for this scope? ✅
3. **Merkle inclusion**: Does this `leafHash` appear in the claimed timebox root? ✅
4. **Consistency**: No double-spend, no conflicting parents ✅
5. **History**: Append-only (no silent mutation) ✅

**Core CANNOT validate** (plaintext correctness):
- ❌ Decrypt ciphertext
- ❌ Read plaintext data
- ❌ Verify "this cell value is semantically true"
- ❌ Know contract terms, prices, schedules

**Critical wording**: "Core validates **integrity and authorization of commitments**, not plaintext content."

---

### Selective Disclosure (When Needed)

**If someone needs to prove plaintext correctness**:
1. Decrypt the leaf (requires private key)
2. Provide plaintext + Merkle inclusion proof
3. Verifier checks: `H(plaintext) === leafHash` AND `MerkleProof(leafHash, timeboxRoot)`

**Result**: Verifier knows the plaintext AND that it was committed in that timebox.

**Core still doesn't need to decrypt** - selective disclosure is peer-to-peer.

---

## 📊 Data Structure Summary

### Minimal Canonical Types

**Leaf** (private + public commitment):
```typescript
interface Leaf {
    // Private
    ciphertext: Uint8Array;              // Encrypted data
    
    // Public
    cipherHash: string;                  // H(ciphertext)
    leafId: string;
    timestamp: number;
    scope: string;
    signature: string;                   // Sign(authorPrivKey, cipherHash || scope || timestamp)
}
```

**Timebox Checkpoint**:
```typescript
interface TimeboxCheckpoint {
    timeboxId: string;
    leafHashes: string[];
    timeboxRoot: string;                 // MerkleRoot(leafHashes)
    timeboxSig: string;                  // Sign(branchKey, timeboxRoot || timeboxId)
}
```

**Branch Checkpoint**:
```typescript
interface BranchCheckpoint {
    branchId: string;
    timeboxRoots: string[];
    branchRoot: string;                  // MerkleRoot(timeboxRoots)
    branchSig: string;                   // Sign(branchKey, branchRoot || branchId)
}
```

**Company Checkpoint**:
```typescript
interface CompanyCheckpoint {
    companyId: string;
    branchRoots: string[];
    companyRoot: string;                 // MerkleRoot(branchRoots)
    companySig: string;                  // Sign(companyKey, companyRoot || companyId)
}
```

**Regional Checkpoint**:
```typescript
interface RegionalCheckpoint {
    regionId: string;
    companyCheckpoints: Array<{
        companyId: string;
        root: string;
        sig: string;
    }>;
    regionRoot: string;                  // MerkleRoot(companyCheckpoints)
    regionSig: string;                   // Sign(regionKey, regionRoot || regionId)
}
```

**Global Core Checkpoint**:
```typescript
interface CoreCheckpoint {
    coreId: "earth.core";
    regionCheckpoints: Array<{
        regionId: string;
        root: string;
        sig: string;
    }>;
    coreRoot: string;                    // MerkleRoot(regionCheckpoints)
    coreSig: string;                     // Sign(coreKey, coreRoot)
    timestamp: number;
}
```

---

## 🎬 Visual Rendering Rules

### 3D Scene Layers

**Layer 1: Sky (Visibility)**
- Sheets (horizontal planes, facing up)
- Cells (points on sheets, encrypted leaves)
- Labels (cell references: A1, B2, etc.)

**Layer 2: Surface (Present State)**
- Branches (horizontal ribs, parallel +East)
- Trunk (vertical cylinder, along ENU Up)
- Timeboxes (rings on trunk/branches, pulsing)

**Layer 3: Ground (Anchor)**
- Anchor marker (cyan pin, 100m tall)
- Ground point (cyan dot with company label)
- Geographic location (lat, lon, 0)

**Layer 4: Underworld (History)**
- Roots (many conduits going down)
- Root bundles (converging progressively)
- Company reconcile node (bright knot below ground)
- Regional checkpoint node (deeper knot, larger)
- Core checkpoint node (deepest, largest, glowing)

---

## 🚀 Implementation Path Forward

### Phase 2.1 (Current)
- ✅ Single branch proof with validation gates
- ✅ ENU coordinates (meters, not degrees)
- ✅ Primitives rendering (trunk, branches, filaments)
- ✅ Anchor marker (independent of buildings)
- ✅ Camera locked to branch
- ⏳ Awaiting user verification (Gates 1-5)

### Phase 2.2 (Next)
- Restore full tree (2 branches, 2 sheets)
- Capture proof artifacts (screenshots + console log)
- Mark Phase 2.1 as PASSED

### Phase 3: Timebox Segmentation
- Render timeboxes as separate geometric segments
- Implement turgor force animation (pulsing based on commits)
- LOD-based timebox visibility

### Phase 4: Root System Visualization
- Render roots going DOWN from trunk
- Show bundling (many roots → few roots → one checkpoint)
- Render company reconcile node (bright knot below ground)

### Phase 5: Regional Basin
- Render multiple companies in same region
- Show regional checkpoint node
- Visualize inter-company relationships (edges)

### Phase 6: Global Core
- Render Earth.Core node (deepest point)
- Show all regional checkpoints feeding into core
- Implement validation visualization (signature checks, Merkle proofs)

---

## 📜 Canonical Principles

1. **Anchor truth is math, not map content**
   - Tree geometry uses only: ENU frame + meters + Cartesian3
   - Buildings/terrain can degrade, tree remains provable

2. **Privacy by default, verification without decryption**
   - Data is encrypted (confidentiality)
   - Hashes are public (commitment)
   - Signatures are public (authorship)
   - Core validates integrity without seeing plaintext

3. **1:Many convergence at every level**
   - Leaves → Spine (many → one)
   - Branches → Company (many → one)
   - Companies → Region (many → one)
   - Regions → Core (many → one)

4. **Merkle trees for tamper-evidence**
   - Every checkpoint is a Merkle root
   - Inclusion proofs enable selective disclosure
   - History is append-only (no silent mutation)

5. **Direction encodes meaning**
   - UP = present visibility (sheets, cells)
   - DOWN = history consolidation (roots, checkpoints)
   - OUT = tree expansion (branches extend +East)

---

**This is the complete Relay architecture: crypto-geometric unity.**
