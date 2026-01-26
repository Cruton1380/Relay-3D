# ✅ Step 0 Pre-Launch Verification Checklist

Use this checklist to confirm Step 0 blockchain wiring is production-ready before proceeding to Phase 1.

---

## 🔧 System Configuration

### **1. File Structure Verification**
- [ ] `src/backend/services/privacyFilter.mjs` exists
- [ ] `src/backend/services/auditService.mjs` exists
- [ ] `src/backend/services/blockchainSyncService.mjs` exists
- [ ] `src/frontend/services/cryptoService.js` has `signVote()` function
- [ ] `src/backend/voting/votingEngine.mjs` imports blockchain modules
- [ ] `src/backend/routes/vote.mjs` has POST `/cast` endpoint
- [ ] `src/backend/routes/vote.mjs` has GET `/verify/:voteId` endpoint

### **2. Data Directories**
- [ ] `data/blockchain/` directory exists or will be created
- [ ] `data/audit/` directory exists or will be created
- [ ] Server has write permissions to both directories

---

## 🧪 Functional Testing

### **3. Backend Server Startup**
```powershell
node src/backend/server.mjs
```
- [ ] Server starts without errors
- [ ] Console shows: "✅ Blockchain sync service connected to vote ledger"
- [ ] Console shows: "🔗 Blockchain sync service initialized"
- [ ] No module import errors

### **4. Frontend Key Generation**
**Open browser console on Relay page:**
```javascript
const crypto = await import('./services/cryptoService.js');
await crypto.generateKeypair();
const publicKey = await crypto.exportPublicKey();
console.log('Public key:', publicKey);
```
- [ ] Key generation completes without errors
- [ ] Public key is in PEM format
- [ ] Starts with `-----BEGIN PUBLIC KEY-----`

### **5. Vote Submission Test**
**In browser console:**
```javascript
const crypto = await import('./services/cryptoService.js');
const voteData = {
  topicId: 'test-topic',
  candidateId: 'test-candidate',
  voteType: 'FOR',
  timestamp: Date.now(),
  nonce: crypto.generateNonce()
};

const voteHash = await crypto.hashVoteData(voteData);
const signature = await crypto.signVote(voteHash);
const publicKey = await crypto.exportPublicKey();

const response = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...voteData,
    signature,
    publicKey,
    privacyLevel: 'province'
  })
});

const result = await response.json();
console.log('Vote result:', result);
```
- [ ] Response has `success: true`
- [ ] `result.blockchain.transactionHash` exists
- [ ] `result.blockchain.voteId` exists
- [ ] `result.blockchain.status` is 'pending' or 'confirmed'
- [ ] No errors in backend logs

### **6. Vote Verification Test**
```javascript
const voteId = result.blockchain.voteId;
const verifyResponse = await fetch(`http://localhost:3002/api/vote/verify/${voteId}`);
const verification = await verifyResponse.json();
console.log('Verification:', verification);
```
- [ ] Response has `success: true`
- [ ] `verification.valid` is `true`
- [ ] `verification.blockchain.transactionHash` matches submission
- [ ] `verification.signature.verified` is `true`

---

## 🔒 Security Testing

### **7. Replay Attack Prevention**
```javascript
// Use same nonce twice
const nonce = crypto.generateNonce();

// First submission
await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({ ...voteData, nonce, signature, publicKey })
});

// Second submission with SAME nonce
const replayResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({ ...voteData, nonce, signature, publicKey })
});

const replayResult = await replayResponse.json();
console.log('Replay result:', replayResult);
```
- [ ] Second submission fails
- [ ] Error message contains "Nonce has already been used" or "replay"
- [ ] Nonce recorded in `data/blockchain/nonces.jsonl`

### **8. Invalid Signature Rejection**
```javascript
const invalidSignature = 'FAKE_SIGNATURE_123';
const invalidResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({
    ...voteData,
    signature: invalidSignature,
    publicKey: await crypto.exportPublicKey(),
    nonce: crypto.generateNonce()
  })
});

const invalidResult = await invalidResponse.json();
console.log('Invalid signature result:', invalidResult);
```
- [ ] Submission fails
- [ ] Error message contains "Invalid" or "signature"
- [ ] Vote not recorded to blockchain

---

## 🔐 Privacy Testing

### **9. GPS Privacy Filtering**
```javascript
// Test with province privacy (should strip GPS)
const provinceVote = {
  ...voteData,
  location: {
    lat: 40.7128,
    lng: -74.0060,
    city: 'New York',
    province: 'New York',
    country: 'USA'
  },
  privacyLevel: 'province'
};

const provinceResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({
    ...provinceVote,
    signature: await crypto.signVote(await crypto.hashVoteData(provinceVote)),
    publicKey: await crypto.exportPublicKey(),
    nonce: crypto.generateNonce()
  })
});

// Check blockchain doesn't contain raw GPS
// Backend should log sanitized vote without lat/lng
```
- [ ] Vote submission succeeds
- [ ] Backend logs show sanitized location (no lat/lng)
- [ ] Only province/country in blockchain transaction

### **10. GPS Opt-In Works**
```javascript
// Test with GPS privacy (user explicitly opts in)
const gpsVote = { ...provinceVote, privacyLevel: 'gps' };
// Should KEEP GPS coordinates this time
```
- [ ] Vote submission succeeds
- [ ] GPS coordinates preserved when `privacyLevel === 'gps'`

---

## 📋 Audit Trail Testing

### **11. Audit Log Created**
```powershell
cat data/audit/vote-audit.jsonl
```
- [ ] File exists
- [ ] Contains JSON entries (one per line)
- [ ] Each entry has `voteId`
- [ ] Each entry has `transactionHash`
- [ ] Each entry has `voteHash`
- [ ] Timestamp format is ISO 8601

### **12. Nonce File Created**
```powershell
cat data/blockchain/nonces.jsonl
```
- [ ] File exists
- [ ] Contains nonces from test votes
- [ ] Format: `{"value":"nonce-string"}`

---

## 🔄 Blockchain Sync Testing

### **13. Vote Status Updates**
```javascript
// Submit vote
const { blockchain: { voteId } } = await submitVote(...);

// Check status immediately
const verify1 = await fetch(`http://localhost:3002/api/vote/verify/${voteId}`);
const status1 = await verify1.json();
console.log('Initial status:', status1.blockchain.status);

// Wait 5 seconds for block mining
await new Promise(resolve => setTimeout(resolve, 5000));

// Check status again
const verify2 = await fetch(`http://localhost:3002/api/vote/verify/${voteId}`);
const status2 = await verify2.json();
console.log('After mining:', status2.blockchain);
```
- [ ] Initial status is 'pending'
- [ ] After mining, status changes to 'confirmed'
- [ ] `blockNumber` populated after confirmation
- [ ] Confirmation count increments with new blocks

---

## 🚀 Frontend Integration Testing

### **14. ChannelExplorerPage Vote**
- [ ] Navigate to Channel Explorer page
- [ ] Click to vote on a channel
- [ ] Check browser console for: "✅ Vote recorded to blockchain"
- [ ] Check backend logs for successful vote processing
- [ ] Vote submission includes signature

### **15. VotingDashboard Vote**
- [ ] Navigate to Voting Dashboard
- [ ] Cast a vote
- [ ] Check browser console for transaction hash
- [ ] Verify signature was generated
- [ ] Vote recorded to backend

---

## 📊 Performance Testing

### **16. Vote Submission Speed**
```javascript
const start = Date.now();
await submitVote(...);
const duration = Date.now() - start;
console.log('Vote duration:', duration, 'ms');
```
- [ ] Vote completes in <500ms
- [ ] Average time ~100-200ms
- [ ] No timeout errors

---

## 🛡️ Error Handling Testing

### **17. Backend Unavailable**
```javascript
// Stop backend server, then try to vote
const offlineResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify(...)
});
```
- [ ] Frontend shows appropriate error message
- [ ] No unhandled promise rejections
- [ ] Frontend gracefully degrades (optimistic update)

### **18. Missing Required Fields**
```javascript
// Submit vote without signature
const missingResponse = await fetch('http://localhost:3002/api/vote/cast', {
  method: 'POST',
  body: JSON.stringify({ topicId: 'test', candidateId: 'test' })
});
```
- [ ] Backend returns 400 or 500 status
- [ ] Error message indicates missing fields
- [ ] Vote not recorded

---

## 📁 Data Persistence Testing

### **19. Server Restart Persistence**
1. Submit vote with nonce `test-nonce-persist`
2. Stop backend server
3. Start backend server
4. Try to submit vote with same nonce `test-nonce-persist`

- [ ] Nonce still rejected after restart
- [ ] `nonces.jsonl` loaded on startup
- [ ] Backend logs show "Loaded X nonces from storage"

---

## 🎯 Production Readiness Checklist

### **20. Final Validation**
- [ ] All 19 previous checks passed ✅
- [ ] No errors in backend logs
- [ ] No errors in browser console
- [ ] Audit files created and populated
- [ ] Blockchain sync service operational
- [ ] Vote verification endpoint working
- [ ] Privacy filtering operational
- [ ] Replay protection confirmed
- [ ] Signature verification working

---

## 📝 Sign-Off

### **Tested By:** ___________________________
### **Date:** ___________________________
### **All Checks Passed:** [ ] YES  [ ] NO

### **Notes:**
```
[Any issues or observations during testing]
```

---

## ✅ If All Checks Pass:

**Step 0 is COMPLETE and PRODUCTION READY! 🎉**

**Next Action:** Proceed to Phase 1 (Location Tracking) in `IMMEDIATE-ACTION-ITEMS.md`

---

## 🚨 If Any Checks Fail:

1. Check backend logs: `logs/application-$(Get-Date -Format 'yyyy-MM-dd').log`
2. Review error messages in browser console
3. Verify all files were created correctly
4. Check imports in `votingEngine.mjs`
5. Confirm blockchain service initialized
6. Test with minimal vote data first
7. Consult `STEP-0-INTEGRATION-TEST-GUIDE.md` for debugging

---

**Documentation References:**
- Full implementation: `STEP-0-BLOCKCHAIN-WIRING-COMPLETE.md`
- Testing guide: `STEP-0-INTEGRATION-TEST-GUIDE.md`
- Summary: `STEP-0-COMPLETE-SUMMARY.md`
