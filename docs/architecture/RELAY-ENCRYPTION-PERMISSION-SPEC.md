# Relay Encryption & Permission Specification

**Date**: 2026-02-06  
**Status**: Canonical specification for leaf-level encryption

---

## 🔐 Core Principle

**"Leaf = encrypted payload; everything above leaf = hashes + signatures + Merkle roots."**

This means:
- **Encryption happens at the cell/event level** (leaves)
- **Everything above leaves** (timeboxes, branches, companies, regions, core) uses only hashes + signatures
- **Permissions are granted per recipient** by encrypting leaf to their public key

---

## 📊 What Gets Encrypted vs What Stays Public

### ENCRYPTED (Private Payload)

**Leaf-level content only**:
- Cell value / document content
- Attachments (files, images)
- Sensitive fields (prices, terms, schedules)
- Internal communications
- **Anything you don't want globally readable**

**Encryption target**: Individual recipient(s) using their public key(s)

---

### PUBLIC (Needed for Verification + Routing)

**Metadata + commitments**:
- `cipherHash = H(ciphertext)` - Commitment (proves "I committed to THIS ciphertext")
- `scope` - Which branch/sheet/timebox it belongs to (routing)
- `timestamp` - Or logical commit index (ordering)
- `signature` - Author signature over `(cipherHash + scope + timeboxId)`
- `recipientSetHash` (optional) - `H(sorted(recipientIds))` proves who was granted access without listing names publicly

**Result**: "Privacy without exposure" - Core sees commitments, not secrets.

---

## 🔑 Permission Model: Two Patterns

### Pattern A: Multi-Recipient Encryption (Simple, Explicit)

**Use case**: Small recipient sets, straightforward audits

**Implementation**:
```javascript
// For each leaf, encrypt to each recipient separately
const leaf = {
    leafId: "cell-A1-001",
    scope: "branch.operations.packaging",
    timestamp: 1707235200,
    
    // Multiple encrypted blobs (one per recipient)
    ciphertexts: [
        { recipientId: "user.alice", blob: E_pubkey_alice(plaintext) },
        { recipientId: "user.bob",   blob: E_pubkey_bob(plaintext) },
        { recipientId: "user.carol", blob: E_pubkey_carol(plaintext) }
    ],
    
    // Public commitment (over original plaintext)
    cipherHash: H(plaintext),  // Or H(canonical_ciphertext) if deterministic
    
    // Author signature
    signature: Sign(authorPrivKey, cipherHash || scope || timestamp)
};
```

**Pros**:
- ✅ Straightforward (one blob per recipient)
- ✅ Easy audits (can see recipient list)
- ✅ Simple revocation check (remove recipient's blob)

**Cons**:
- ⚠️ Storage overhead (N recipients = N × ciphertext size)
- ⚠️ Scales linearly with recipient count

---

### Pattern B: Envelope Encryption (Best Practice, Efficient)

**Use case**: Large recipient sets, production systems

**Implementation**:
```javascript
// For each leaf:
// 1. Generate random symmetric key K
const K = generateSymmetricKey();  // AES-256 key

// 2. Encrypt payload with K
const ciphertext = E_symmetric(K, plaintext);

// 3. Encrypt K to each recipient's public key (key wrapping)
const leaf = {
    leafId: "cell-A1-001",
    scope: "branch.operations.packaging",
    timestamp: 1707235200,
    
    // One ciphertext (symmetric encryption)
    ciphertext: ciphertext,
    
    // Multiple key wraps (small, efficient)
    wraps: [
        { recipientId: "user.alice", wrap: E_pubkey_alice(K) },
        { recipientId: "user.bob",   wrap: E_pubkey_bob(K) },
        { recipientId: "user.carol", wrap: E_pubkey_carol(K) }
    ],
    
    // Public commitment
    cipherHash: H(ciphertext),                      // Commitment to ciphertext
    wrapSetHash: H(sorted(["alice", "bob", "carol"])),  // Commitment to recipient set
    
    // Author signature
    signature: Sign(authorPrivKey, cipherHash || wrapSetHash || scope || timestamp)
};
```

**Pros**:
- ✅ Efficient (one ciphertext, N small wraps)
- ✅ Scalable (adding recipients = small overhead)
- ✅ Best practice (industry standard)

**Cons**:
- ⚠️ Slightly more complex (two encryption layers)

**Decryption process**:
1. Recipient finds their `wrap` by `recipientId`
2. Decrypt wrap with private key: `K = D_privkey(wrap)`
3. Decrypt ciphertext with K: `plaintext = D_symmetric(K, ciphertext)`

---

## 🔒 Revocation Model

### Core Constraint

**You CANNOT "unshare" a secret someone already decrypted.**

Once a recipient has decrypted the plaintext, you cannot force them to "forget" it.

---

### What You CAN Do

**1. Stop issuing new wraps to revoked user**:
```javascript
// When creating new leaves, exclude revoked user from wraps
const revokedUsers = ["user.bob"];
const activeRecipients = allRecipients.filter(r => !revokedUsers.includes(r));

// Only create wraps for active recipients
activeRecipients.forEach(recipientId => {
    wraps.push({ recipientId, wrap: E_pubkey(K) });
});
```

**2. Rotate keys for new leaves/timeboxes**:
```javascript
// Start new timebox with fresh keys
const newTimeboxId = "2026-W07";  // New week
const newAuthorKey = rotateKey(authorKey);  // Generate new keypair

// All new leaves in this timebox use new key
// Old leaves remain with old key (history intact)
```

**3. Show revocation as explicit commit** (history stays intact):
```javascript
const revocationCommit = {
    type: "REVOCATION",
    leafId: "cell-A1-001",
    revokedRecipient: "user.bob",
    effectiveTimestamp: 1707235200,
    reason: "Access revoked per policy XYZ",
    
    // Signed by author or admin
    signature: Sign(authorPrivKey, revocationCommit)
};
```

**History rule**: Revocations are **explicit** (append-only), not silent mutation.

**Audit trail**: Revocation records are signed and included in Merkle tree like any other commit.

---

## ✅ What Core CAN Validate (Without Decryption)

**Core validates integrity and authorization**:

1. ✅ **Signature validity**: `VerifySignature(pubkey, hash, sig)`
   - Proves: This key signed this hash
   
2. ✅ **Authority chain**: Is key allowed to sign for this scope?
   - Proves: This author has permission to commit to this branch
   
3. ✅ **Merkle inclusion**: Does `leafHash` appear in `timeboxRoot`?
   - Proves: This leaf was included in this timebox
   
4. ✅ **Consistency**: No double-spend, no conflicting parents
   - Proves: This leaf hash appears only once in this timebox
   
5. ✅ **History integrity**: Append-only, explicit reverts
   - Proves: No silent mutation, all changes are signed

**What this means**:
- Core can prove "Author X committed to hash Y at time T in scope S"
- Core can prove "This commitment is part of the global Merkle tree"
- Core can prove "All signatures and authority chains are valid"

---

## ❌ What Core CANNOT Validate (Plaintext Correctness)

**Core CANNOT validate semantic correctness**:

1. ❌ **Decrypt ciphertext** (no private keys)
2. ❌ **Read plaintext** (encrypted)
3. ❌ **Verify "this cell value is true"** (no access to plaintext)
4. ❌ **Validate business logic** ("is this price reasonable?")
5. ❌ **Know contract terms** (encrypted)

**What this means**:
- Core CANNOT prove "The plaintext says X"
- Core CANNOT prove "The contract price is $50k"
- Core CANNOT prove "The data is semantically correct"

**Critical distinction**:
- Core validates **THAT a commitment was made** (integrity)
- Core does NOT validate **WHAT the commitment says** (correctness)

---

## 🔍 Selective Disclosure (Peer-to-Peer)

**When plaintext verification IS needed**:

**Scenario**: Alice wants to prove to Bob that a cell contains "Contract: $50k"

**Process**:
1. Alice decrypts the leaf (has private key or K)
2. Alice provides to Bob:
   - `plaintext = "Contract: $50k"`
   - `leafHash = H(E_K(plaintext))`
   - `MerkleInclusionProof(leafHash, timeboxRoot)`
3. Bob verifies:
   - Re-encrypt: `H(E_K(plaintext)) === leafHash` ✅
   - Check proof: `MerkleProof(leafHash, timeboxRoot)` ✅
   - Check root signature: `VerifySignature(timeboxSig)` ✅

**Result**: Bob knows the plaintext AND that it was committed in that timebox.

**Core still doesn't decrypt**: Selective disclosure is peer-to-peer.

---

## 📐 Data Structure Summary (With Encryption)

### Leaf (Cell/Event)

```typescript
interface Leaf {
    leafId: string;
    scope: string;                       // branch/sheet/timebox
    timestamp: number;
    
    // ENCRYPTED (Pattern B: Envelope)
    ciphertext: Uint8Array;              // E_symmetric(K, plaintext)
    wraps: Array<{
        recipientId: string;
        wrap: Uint8Array;                // E_pubkey_recipient(K)
    }>;
    
    // PUBLIC (Commitments)
    cipherHash: string;                  // H(ciphertext)
    wrapSetHash: string;                 // H(sorted(recipientIds))
    
    // PUBLIC (Authorship)
    authorKeyId: string;
    signature: string;                   // Sign(authorPrivKey, cipherHash || scope || timestamp)
}
```

### Timebox Checkpoint

```typescript
interface TimeboxCheckpoint {
    timeboxId: string;
    leafHashes: string[];                // [cipherHash₁, cipherHash₂, ...]
    
    // PUBLIC (Aggregation)
    timeboxRoot: string;                 // MerkleRoot(leafHashes)
    timeboxSig: string;                  // Sign(branchKey, timeboxRoot || timeboxId)
}
```

**Note**: Timeboxes contain ONLY hashes, not ciphertext. No encryption at this level.

### Branch, Company, Region, Core Checkpoints

**All higher-level checkpoints**:
- Contain ONLY Merkle roots + signatures
- NO encrypted data
- NO ciphertext
- ONLY hashes aggregated into higher-level roots

```typescript
interface BranchCheckpoint {
    branchId: string;
    timeboxRoots: string[];              // Merkle roots (no ciphertext)
    branchRoot: string;                  // MerkleRoot(timeboxRoots)
    branchSig: string;                   // Sign(branchKey, branchRoot)
}

interface CompanyCheckpoint {
    companyId: string;
    branchRoots: string[];               // Merkle roots (no ciphertext)
    companyRoot: string;                 // MerkleRoot(branchRoots)
    companySig: string;                  // Sign(companyKey, companyRoot)
}

// Regional and Core follow same pattern
```

---

## 🎯 Encryption Scope Summary

### What Gets Encrypted (ONLY at Leaf Level)

```
✅ Cell content           ← YES (leaf)
✅ Document attachments   ← YES (leaf)
✅ Contract terms         ← YES (leaf)
✅ Prices, schedules      ← YES (leaf)

❌ Timebox roots          ← NO (just hashes)
❌ Branch roots           ← NO (just hashes)
❌ Company checkpoints    ← NO (just hashes + sigs)
❌ Regional checkpoints   ← NO (just hashes + sigs)
❌ Core checkpoints       ← NO (just hashes + sigs)
```

**Rule**: Encryption ONLY at leaves. Everything above = hashes + signatures.

---

## 🚀 Phase 5 Implementation Checklist (Future)

### When implementing crypto layer:

**1. Leaf Creation** (`core/crypto/leaf.js`)
- Pattern B (Envelope encryption) recommended
- Generate symmetric key K
- Encrypt plaintext with K
- Wrap K for each recipient
- Compute cipherHash + wrapSetHash
- Sign commitment

**2. Timebox Checkpointing** (`core/crypto/timebox.js`)
- Collect leafHashes (public)
- Compute MerkleRoot(leafHashes)
- Sign timeboxRoot

**3. Branch/Company/Region/Core Checkpointing** (`core/crypto/checkpoint.js`)
- Collect child roots (public)
- Compute MerkleRoot(childRoots)
- Sign checkpoint

**4. Core Validation** (`core/crypto/validator.js`)
- Verify signatures
- Verify authority chains
- Verify Merkle inclusion proofs
- Verify consistency rules
- **DO NOT attempt to decrypt**

**5. Selective Disclosure** (`core/crypto/disclosure.js`)
- Peer-to-peer (not core-mediated)
- Recipient decrypts leaf
- Provides plaintext + Merkle proof to verifier
- Verifier checks: H(plaintext) === leafHash AND MerkleProof(leafHash, root)

---

## 📋 Key Distinctions

### Core Validates vs Core CANNOT Validate

**Core CAN validate** (integrity and authorization):
- ✅ Signatures are valid
- ✅ Authority chains are correct
- ✅ Merkle roots match leaf hashes
- ✅ Inclusion proofs are correct
- ✅ History is append-only

**Core CANNOT validate** (plaintext correctness):
- ❌ Decrypt ciphertext
- ❌ Verify semantic correctness
- ❌ Know what plaintext says
- ❌ Validate business logic

**Critical wording**: "Core validates **integrity and authorization of commitments**, not plaintext content."

---

## 🎯 Implementation Notes for Phase 5

### When Canon implements crypto layer:

**DO**:
- ✅ Use envelope encryption (Pattern B) for efficiency
- ✅ Store cipherHash (public) for Merkle tree
- ✅ Sign commitments (cipherHash + scope + timestamp)
- ✅ Implement key registry (who can sign what)
- ✅ Validate signatures + authority chains
- ✅ Build Merkle trees from hashes (not ciphertext)

**DO NOT**:
- ❌ Store plaintext in checkpoints
- ❌ Attempt to validate plaintext correctness in core
- ❌ Build Merkle trees from plaintext (use hashes)
- ❌ Over-promise what core can validate
- ❌ Claim "core validates data correctness" (only integrity)

**Tight wording**:
- ✅ "Core validates integrity and authorization of commitments"
- ❌ "Core validates data correctness" (wrong!)

---

## 🔐 Revocation Model (Important)

### Core Constraint

**You CANNOT "unshare" a secret someone already decrypted.**

Once recipient has decrypted plaintext, you cannot force them to "forget" it.

---

### What You CAN Do (Going Forward)

**1. Stop issuing new wraps to revoked user**:
```javascript
// When creating new leaves, exclude revoked user
const revokedUsers = new Set(["user.bob"]);
const activeRecipients = allRecipients.filter(r => !revokedUsers.has(r));

// Only create wraps for active recipients
activeRecipients.forEach(recipientId => {
    const wrap = E_pubkey(recipientId, K);
    wraps.push({ recipientId, wrap });
});
```

**2. Rotate keys for new timeboxes**:
```javascript
// Start new timebox with fresh keys
const newTimeboxId = "2026-W07";
const newAuthorKey = rotateKey(authorKey);  // Generate new keypair

// All new leaves in this timebox use new key
// Old leaves remain with old key (history intact)
```

**3. Show revocation as explicit commit**:
```javascript
const revocationCommit = {
    type: "REVOCATION",
    leafId: "cell-A1-001",
    revokedRecipient: "user.bob",
    effectiveTimestamp: 1707235200,
    reason: "Access revoked per policy XYZ",
    
    // Signed by author or admin
    signature: Sign(authorPrivKey, revocationCommit)
};

// Add to Merkle tree like any other commit
timeboxLeaves.push(H(revocationCommit));
```

**History rule**: Revocations are **explicit** (append-only), not silent mutation.

**Audit trail**: Revocation records are signed and included in Merkle tree.

---

## 🎯 Summary

**Encryption**:
- ✅ At leaf level only (cells/events)
- ✅ Use envelope encryption (Pattern B) for efficiency
- ✅ Per-recipient permissions (public key encryption)

**Everything Above Leaves**:
- ✅ Hashes only (no ciphertext)
- ✅ Signatures (authorship + authority)
- ✅ Merkle roots (aggregation)

**Core Validation**:
- ✅ Validates integrity and authorization
- ❌ Does NOT validate plaintext correctness

**Revocation**:
- ✅ Stop new wraps going forward
- ✅ Rotate keys for new timeboxes
- ✅ Explicit revocation commits (append-only history)

**Critical Principle**: "Core validates **integrity and authorization of commitments**, not plaintext content."

---

**This spec ensures privacy without exposure and accurate crypto promises.**
