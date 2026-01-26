# 🚀 TOMORROW'S TESTING PLAN

**Date:** December 18, 2025  
**Goal:** Get relay-server running and test your first Git-based vote  
**Time Estimate:** 2-3 hours

---

## ☀️ MORNING: SYSTEM SETUP (30 minutes)

### Step 1: Restart Your Computer
**Why:** WSL needs a fresh start after updates

```powershell
# After restart, verify WSL is working
wsl --status
wsl --list --verbose
```

### Step 2: Start Docker Desktop
**Check:** Docker icon in system tray should show "running"

```powershell
# Test Docker
docker --version
docker info

# Should see: "Server: Docker Engine..." (not an error)
```

### Step 3: Verify Environment
```powershell
cd "C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93\relay-main"

# Check files are there
dir

# You should see: Dockerfile, README.md, apps/, etc.
```

---

## 🏗️ BUILD RELAY SERVER (20 minutes)

### Step 1: Build Docker Image
```powershell
cd relay-main
docker build -t relay-server .
```

**Expected:** This will download dependencies and compile the Rust server  
**Time:** ~15-20 minutes on first build  
**Output:** "Successfully built..." and "Successfully tagged relay-server:latest"

### Step 2: Create Test Data Directory
```powershell
# Create a simple test repository
mkdir test-repo
cd test-repo
git init

# Create a test channel
mkdir -p channels/global
```

Create `channels/global/test-channel.yaml`:
```yaml
id: "test-channel"
name: "My First Test Channel"
type: "global"
description: "Testing the relay server"
created: "2025-12-18T00:00:00Z"
creator: "test-user"
status: "active"
visibility: "public"
vote_counts:
  total: 0
  by_region: {}
metadata:
  tags: ["test"]
  category: "testing"
```

```powershell
# Commit test data
git add .
git commit -m "Initial test channel"
cd ..
```

### Step 3: Start Relay Server
```powershell
# Run relay server with test repository
docker run -d `
  --name relay-test `
  -p 3000:3000 `
  -v ${PWD}/test-repo:/srv/relay/data `
  relay-server

# Check if it's running
docker ps

# See logs
docker logs relay-test
```

**Expected Output:**
```
Relay Server starting...
Loaded repository: /srv/relay/data
Server listening on :3000
```

---

## 🧪 TEST BASIC OPERATIONS (30 minutes)

### Test 1: Health Check
```powershell
# Open PowerShell or use curl
Invoke-WebRequest -Uri "http://localhost:3000/health"
```

**Expected:** `{"status": "ok"}`

### Test 2: Get Channel
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/channels/global/test-channel.yaml"
```

**Expected:** Your YAML channel data

### Test 3: Query Channels
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/query?collection=channels&type=global"
```

**Expected:** JSON list of channels

### Test 4: Submit a Vote
Create `test-vote.yaml`:
```yaml
vote_id: "test-vote-001"
user_id: "test-user"
channel_id: "test-channel"
candidate_id: "test-candidate"
timestamp: "2025-12-18T12:00:00Z"
location:
  lat: 40.7128
  lon: -74.0060
signature: "test-signature"
```

```powershell
# Submit vote (creates Git commit!)
Invoke-WebRequest -Uri "http://localhost:3000/votes/2025/12/18/test-vote-001.yaml" `
  -Method PUT `
  -Body (Get-Content test-vote.yaml) `
  -ContentType "application/yaml"
```

**Expected:** `{"status": "ok", "commit": "abc123..."}`

### Test 5: Verify Vote Was Stored
```powershell
# Check Git repository
cd test-repo
git log
git show HEAD

# You should see your vote commit!
```

---

## 🎯 TEST YOUR ACTUAL DATA (1 hour)

### Step 1: Export Your Data
```powershell
cd "C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93"

# Run migration script
node relay-migration-scripts.mjs export-all
```

**Expected Output:**
```
📁 Exporting channels...
  ✓ climate-action-2025
  ✓ ...
✅ Exported 15 channels

🎯 Exporting candidates...
  ✓ ...
✅ Exported 45 candidates

🗳️  Exporting votes...
✅ Exported 1523 votes

👤 Exporting users...
✅ Exported 234 users

🎉 MIGRATION EXPORT COMPLETE!
```

### Step 2: Initialize Git Repository
```powershell
cd relay-git-data
git init
git add .
git commit -m "Initial migration from WebSocket backend"
```

### Step 3: Start Relay Server with Your Data
```powershell
docker stop relay-test
docker rm relay-test

docker run -d `
  --name relay-production `
  -p 3000:3000 `
  -v ${PWD}/relay-git-data:/srv/relay/data `
  relay-server

docker logs -f relay-production
```

### Step 4: Test Your Real Channels
```powershell
# Get your actual channel
Invoke-WebRequest -Uri "http://localhost:3000/channels/global/climate-action-2025.yaml"

# Query your candidates
Invoke-WebRequest -Uri "http://localhost:3000/query?collection=candidates&channel_id=climate-action-2025"
```

---

## 🌐 TEST FRONTEND INTEGRATION (1 hour)

### Step 1: Update Frontend Configuration
Edit `src/frontend/config/relayConfig.js`:

```javascript
export const RELAY_PEERS = [
  'http://localhost:3000',
  // Add more peers later
];

export const USE_RELAY = true; // Toggle to switch between old/new backend
```

### Step 2: Test Channel Loading
```powershell
# Start your frontend
npm run dev:frontend

# Open browser: http://localhost:5175
```

**Open DevTools Console and test:**
```javascript
// In browser console
import relayClient from '/src/frontend/services/relayClient.js';

// Test connection
const channel = await relayClient.get('/channels/global/climate-action-2025.yaml');
console.log(channel);

// Submit test vote
const vote = await relayClient.put('/votes/test.yaml', {
  user_id: 'test',
  channel_id: 'climate-action-2025',
  candidate_id: 'paris-accord',
  timestamp: new Date().toISOString()
});
console.log(vote);
```

### Step 3: Test Real-Time Updates
```javascript
// In browser console
const unsubscribe = relayClient.poll(
  '/channels/global/climate-action-2025.yaml',
  (data) => console.log('Channel updated:', data),
  3000
);

// Let it run for 30 seconds, then stop
// setTimeout(() => unsubscribe(), 30000);
```

---

## 📊 PERFORMANCE TESTING (30 minutes)

### Test 1: Measure Vote Submission Latency
```javascript
// test-vote-latency.mjs
import fetch from 'node-fetch';

async function testVoteLatency() {
  const iterations = 100;
  const latencies = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    await fetch('http://localhost:3000/votes/test.yaml', {
      method: 'PUT',
      body: `vote_id: "test-${i}"\nuser_id: "test"\n`,
      headers: { 'Content-Type': 'application/yaml' }
    });
    
    latencies.push(Date.now() - start);
  }

  console.log('Latency Statistics:');
  console.log('  Min:', Math.min(...latencies), 'ms');
  console.log('  Max:', Math.max(...latencies), 'ms');
  console.log('  Avg:', Math.round(latencies.reduce((a, b) => a + b) / latencies.length), 'ms');
  console.log('  P95:', latencies.sort()[Math.floor(latencies.length * 0.95)], 'ms');
}

testVoteLatency();
```

**Expected Results:**
- Average: 100-200ms
- P95: <300ms
- **Goal:** Under 200ms is excellent for voting

### Test 2: Concurrent Votes
```powershell
# Test 10 concurrent votes
for ($i=0; $i -lt 10; $i++) {
  Start-Job -ScriptBlock {
    Invoke-WebRequest -Uri "http://localhost:3000/votes/concurrent-$($args[0]).yaml" `
      -Method PUT `
      -Body "vote_id: concurrent-$($args[0])`nuser_id: test`n" `
      -ContentType "application/yaml"
  } -ArgumentList $i
}

Get-Job | Wait-Job
Get-Job | Receive-Job
```

**Expected:** All votes succeed with no conflicts

---

## ✅ SUCCESS CRITERIA

By end of tomorrow, you should have:

- [x] Docker + WSL working correctly
- [x] Relay-server built and running
- [x] Test vote submitted successfully
- [x] Your actual data migrated to Git format
- [x] Relay-server serving your real channels
- [x] Frontend can read from Relay
- [x] Vote submission working end-to-end
- [x] Performance meets requirements (<200ms)
- [x] Real-time updates working (polling)

---

## 🎉 CELEBRATION CHECKLIST

When all tests pass:

1. ✅ Take a screenshot of your first Git-committed vote
2. ✅ Review the Git commit log (`git log --oneline`)
3. ✅ Show vote counts updating in real-time
4. ✅ Test failover (stop relay-server, votes still work via backup peer)
5. ✅ Check data integrity (all votes accounted for)

---

## 🆘 TROUBLESHOOTING

### Docker Won't Start
```powershell
# Check WSL is running
wsl --list --verbose

# Restart WSL
wsl --shutdown
# Wait 10 seconds
wsl

# Restart Docker Desktop
```

### Relay Server Build Fails
```powershell
# Check Docker logs
docker logs relay-test

# Common fixes:
# 1. Delete and rebuild
docker rmi relay-server
docker build -t relay-server .

# 2. Clear Docker cache
docker system prune -a
```

### Votes Not Committing
```powershell
# Check .relay/pre-commit.mjs exists
cd test-repo
dir .relay

# Test Git directly
echo "test" > test.txt
git add test.txt
git commit -m "test"
# Should work
```

### Frontend Can't Connect
```powershell
# Test relay-server is accessible
Test-NetConnection -ComputerName localhost -Port 3000

# Check CORS headers
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method OPTIONS
```

---

## 📚 REFERENCE DOCUMENTS

**For Implementation:**
- `COMPLETE-RELAY-MIGRATION-STRATEGY.md` - Complete migration guide
- `RELAY-FRONTEND-INTEGRATION-GUIDE.md` - Frontend code examples
- `relay-migration-scripts.mjs` - Data export scripts

**For Understanding:**
- `RELAY-MAIN-DEEP-ARCHITECTURE-ANALYSIS.md` - How relay-main works
- `GIT-VS-WEBSOCKET-PERFORMANCE-ANALYSIS.md` - Why Git is better

---

## 💡 TIPS FOR SUCCESS

1. **Start Simple** - Test with one channel before migrating everything
2. **Use Git Skills** - You already know Git, leverage that!
3. **Monitor Logs** - Keep `docker logs -f relay-test` open
4. **Test Incrementally** - Don't migrate everything at once
5. **Keep Backups** - Your current system keeps running during migration

---

## 🎯 TOMORROW'S GOAL

**Primary:** Submit your first vote that creates a Git commit  
**Secondary:** Get your real data working in relay-server  
**Stretch:** Connect frontend and see live updates

---

**You're ready! See you tomorrow! 🚀**






