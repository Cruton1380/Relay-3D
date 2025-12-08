# 🧪 Step 0 Integration Testing Guide

## Quick Smoke Test (5 minutes)

### **1. Start Backend Server**
```powershell
cd "c:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV90"
node src/backend/server.mjs
```

Expected output:
```
✅ Blockchain sync service connected to vote ledger
🔗 Blockchain sync service initialized
```

---

### **2. Test Vote Submission (with Signature)**

**Open browser console** on any Relay page and run:

```javascript
// Import crypto service
const crypto = await import('./services/cryptoService.js');

// Generate keys if not exists
if (!await crypto.hasKeys()) {
  await crypto.generateKeypair();
}

// Prepare vote data
const voteData = {
  topicId: 'test-topic-001',
  candidateId: 'test-candidate-001',
  voteType: 'FOR',
  timestamp: Date.now(),
  nonce: crypto.generateNonce()
};

// Hash and sign
const voteHash = await crypto.hashVoteData(voteData);
const signature = await crypto.signVote(voteHash);
const publicKey = await crypto.exportPublicKey();

// Submit vote
const response = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token'
  },
  body: JSON.stringify({
    ...voteData,
    signature,
    publicKey,
    privacyLevel: 'province'
  })
});

const result = await response.json();
console.log('✅ Vote Result:', result);
```

**Expected Output:**
```javascript
{
  success: true,
  vote: {
    topicId: 'test-topic-001',
    candidateId: 'test-candidate-001',
    voteType: 'FOR',
    timestamp: 1728234567890
  },
  blockchain: {
    transactionHash: 'a3f7e9b2c1d4e5f6...',
    status: 'pending',
    voteId: 'vote_test_test-topic-001_1728234567890',
    error: null
  }
}
```

---

### **3. Verify Vote on Blockchain**

```javascript
// Get voteId from previous response
const voteId = result.blockchain.voteId;

// Verify vote
const verifyResponse = await fetch(`http://localhost:3002/api/vote/verify/${voteId}`);
const verification = await verifyResponse.json();

console.log('🔍 Verification:', verification);
```

**Expected Output:**
```javascript
{
  success: true,
  valid: true,
  vote: { ... },
  blockchain: {
    transactionHash: 'a3f7e9b2c1d4e5f6...',
    status: 'pending', // or 'confirmed' if block mined
    confirmations: 0
  },
  signature: {
    publicKey: '****...',
    verified: true,
    algorithm: 'ecdsa-sha256'
  }
}
```

---

### **4. Check Audit Log**

```powershell
cat data/audit/vote-audit.jsonl | Select-String "test-topic-001"
```

**Expected Output:**
```json
{"timestamp":"2025-10-06T...","voteId":"vote_test_...","transactionHash":"a3f7...","voteHash":"b2c1..."}
```

---

### **5. Check Nonce File**

```powershell
cat data/blockchain/nonces.jsonl | Select-String "test-nonce"
```

Should show the nonce was recorded (prevents replay).

---

### **6. Test Privacy Filter**

**Vote with GPS privacy:**
```javascript
const gpsVoteData = {
  ...voteData,
  location: {
    lat: 40.7128,
    lng: -74.0060,
    city: 'New York',
    province: 'New York',
    country: 'USA'
  },
  privacyLevel: 'gps' // User explicitly opts in
};

// Submit with GPS
const gpsResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...gpsVoteData,
    signature: await crypto.signVote(await crypto.hashVoteData(gpsVoteData)),
    publicKey: await crypto.exportPublicKey(),
    nonce: crypto.generateNonce()
  })
});
```

**Vote with Province privacy (should strip GPS):**
```javascript
const provinceVoteData = { ...gpsVoteData, privacyLevel: 'province' };
// GPS coordinates should NOT appear in blockchain
```

---

## Advanced Integration Tests

### **Test 1: Replay Protection**

```javascript
// Try to submit same vote twice with same nonce
const nonce = crypto.generateNonce();

// First vote
await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({ ...voteData, nonce })
});

// Second vote with SAME nonce (should fail)
const replayAttempt = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({ ...voteData, nonce })
});

const replayResult = await replayAttempt.json();
console.log('🛡️ Replay blocked:', replayResult.error);
// Expected: "Nonce has already been used"
```

---

### **Test 2: Invalid Signature**

```javascript
// Submit vote with wrong signature
const badSignature = 'MEUCIQDx...FAKE...';

const invalidResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({
    ...voteData,
    signature: badSignature,
    publicKey: await crypto.exportPublicKey(),
    nonce: crypto.generateNonce()
  })
});

const invalidResult = await invalidResponse.json();
console.log('❌ Invalid signature rejected:', invalidResult.error);
// Expected: "Invalid vote signature"
```

---

### **Test 3: Vote Switch**

```javascript
// Cast initial vote for candidate A
const vote1 = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({
    topicId: 'switch-test',
    candidateId: 'candidate-A',
    signature: await crypto.signVote(...),
    publicKey: await crypto.exportPublicKey(),
    nonce: crypto.generateNonce()
  })
});

// Switch to candidate B
const vote2 = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({
    topicId: 'switch-test',
    candidateId: 'candidate-B', // Different candidate
    signature: await crypto.signVote(...),
    publicKey: await crypto.exportPublicKey(),
    nonce: crypto.generateNonce() // NEW nonce
  })
});

const switchResult = await vote2.json();
console.log('🔄 Vote switched:', switchResult.action);
// Expected: action === 'VOTE_SWITCH'
```

---

### **Test 4: Blockchain Confirmation**

```javascript
// Submit vote
const { blockchain: { voteId, transactionHash } } = await submitVote(...);

// Wait for block mining (usually happens automatically)
await new Promise(resolve => setTimeout(resolve, 5000));

// Check if confirmed
const verifyResponse = await fetch(`http://localhost:3002/api/vote/verify/${voteId}`);
const { blockchain } = await verifyResponse.json();

console.log('⛓️ Blockchain status:', blockchain.status);
console.log('📦 Block number:', blockchain.blockNumber);
console.log('✅ Confirmations:', blockchain.confirmations);
```

---

## Success Criteria

### ✅ All Tests Pass If:

1. **Vote Submission**
   - [x] Returns `blockchain.transactionHash`
   - [x] Returns `blockchain.voteId`
   - [x] Status is `pending` or `confirmed`

2. **Signature Verification**
   - [x] Valid signatures accepted
   - [x] Invalid signatures rejected with error

3. **Replay Protection**
   - [x] Same nonce rejected on second submission
   - [x] Nonce recorded in `nonces.jsonl`

4. **Privacy Filtering**
   - [x] GPS coordinates only on blockchain if `privacyLevel === 'gps'`
   - [x] Province/city privacy removes GPS before blockchain

5. **Audit Trail**
   - [x] Vote recorded in `vote-audit.jsonl`
   - [x] Contains both `voteHash` and `transactionHash`

6. **Vote Verification**
   - [x] `/api/vote/verify/:voteId` returns complete proof
   - [x] Includes signature verification status
   - [x] Shows blockchain confirmations

7. **Blockchain Sync**
   - [x] Vote status updates from `pending` to `confirmed` after block mined
   - [x] `blockNumber` populated after confirmation
   - [x] Confirmation count increments with new blocks

---

## Debugging Commands

### Check Backend Logs:
```powershell
Get-Content logs/application-$(Get-Date -Format 'yyyy-MM-dd').log -Tail 50 -Wait
```

### Check Blockchain State:
```javascript
// In browser console
const status = await fetch('http://localhost:3002/api/vote/debug/blockchain-summary');
console.log(await status.json());
```

### Check Vote Ledger:
```javascript
// Backend console
console.log(authoritativeVoteLedger);
```

---

## 🚨 Known Issues & Solutions

### Issue: "No key pair available"
**Solution:** Generate keys first:
```javascript
await cryptoService.generateKeypair();
```

### Issue: "Nonce has already been used"
**Solution:** Generate new nonce:
```javascript
const nonce = cryptoService.generateNonce(); // Creates unique nonce
```

### Issue: "Invalid vote signature"
**Solution:** Ensure vote data hasn't changed between hashing and signing:
```javascript
const voteHash = await crypto.hashVoteData(voteData);
const signature = await crypto.signVote(voteHash); // Must use same voteData
```

### Issue: Vote not confirmed after 5 minutes
**Solution:** Check if blockchain mining is running:
```javascript
// Backend should auto-mine blocks periodically
// Check logs for "Block mined" messages
```

---

## 📊 Performance Benchmarks

| Operation | Expected Time |
|-----------|---------------|
| Key generation | ~100-200ms (first time only) |
| Vote hashing | ~1-2ms |
| Vote signing | ~5-10ms |
| Signature verification | ~5-10ms |
| Privacy filtering | <1ms |
| Blockchain recording | ~50-100ms (pending) |
| Audit logging | ~10-20ms |
| **Total vote submission** | **~100-150ms** |

---

## ✅ Final Checklist

Before moving to Phase 1 (Location Tracking), confirm:

- [ ] Backend server starts without errors
- [ ] Vote submission returns `blockchain.transactionHash`
- [ ] Vote verification endpoint works
- [ ] Replay attack blocked (same nonce rejected)
- [ ] Invalid signature rejected
- [ ] Privacy filter removes GPS for non-GPS levels
- [ ] Audit log contains both hashes
- [ ] Nonce file persists across restarts
- [ ] Vote status updates to `confirmed` after block mined
- [ ] Frontend vote submission includes signature

**If all checked ✅ → Ready for Phase 1!**

---

**Next:** Start Phase 1 location tracking per `IMMEDIATE-ACTION-ITEMS.md`
