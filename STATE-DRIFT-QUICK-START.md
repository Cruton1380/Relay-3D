# State Drift System - Quick Start Guide

**Quick deployment and testing guide for the Relay State Drift Management System**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the System

```bash
# Start the backend server
cd "c:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93"
npm run dev
```

The State Drift system will automatically:
- Initialize the State Drift Engine
- Create SCV agent pool (10 agents)
- Register 525,000 demo devices
- Start continuous monitoring

### Step 2: Open the HUD

Navigate to: **http://localhost:5173/state-drift-hud**

You should see:
- 🌍 3D Earth globe
- 📊 Real-time stats (top left)
- 🤖 SCV agent status (top right)
- ⚡ Command panel (left side)
- 🔍 Filter panel (right side)
- 📈 KPI dashboard (bottom)

### Step 3: Test Basic Functions

1. **View Stats**: Check the device count (should show 525,000+ devices)
2. **Click Mass Suppression**: Test the alert
3. **Click a Scenario**: Test scenario queueing
4. **Monitor KPIs**: Watch real-time updates

---

## 🧪 Testing Scenarios

### Test 1: Mass Suppression

```bash
curl -X POST http://localhost:3002/api/state-drift/command/mass-suppression \
  -H "Content-Type: application/json" \
  -d '{"filter":{"threatLevel":"critical"}}'
```

**Expected**: Returns operation queued with device count

### Test 2: Get System Status

```bash
curl http://localhost:3002/api/state-drift/status
```

**Expected**: JSON with orchestrator status, device counts, KPIs

### Test 3: View Registered Devices

```bash
curl http://localhost:3002/api/state-drift/devices?filter=%7B%22threatLevel%22%3A%22critical%22%7D
```

**Expected**: List of devices with critical threat level

### Test 4: Execute Scenario

```bash
curl -X POST http://localhost:3002/api/state-drift/command/execute-scenario \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": {
      "id": "desktop_control_sweep",
      "name": "Desktop Control Sweep",
      "steps": [{"action": "control_desktop", "params": {"silent": true}}]
    },
    "filter": {"all": true}
  }'
```

**Expected**: Operation queued for all devices

### Test 5: Execute War Game

```bash
curl -X POST http://localhost:3002/api/state-drift/command/execute-war-game \
  -H "Content-Type: application/json" \
  -d '{
    "warGame": {
      "id": "privilege_escalation_test",
      "name": "Privilege Escalation Test",
      "phases": [{
        "name": "Test Phase",
        "attacks": [{"type": "privilege_escalation", "severity": "high"}]
      }]
    },
    "filter": {"class": "test"}
  }'
```

**Expected**: War game simulation queued

---

## 📊 Monitoring and Verification

### Check System Health

```bash
curl http://localhost:3002/api/state-drift/status | jq
```

**Look for**:
- `totalDevices`: Should be 525,000+
- `activeAgents`: Should be > 0
- `scanRate`: Should be > 10,000 devices/second
- `devicesScanned`: Increasing count

### Check KPIs

```bash
curl http://localhost:3002/api/state-drift/kpis | jq
```

**Look for**:
- `drift_detection_rate`: Detection rate in drifts/second
- `scan_throughput`: Devices scanned per second
- `exploit_suppression_ratio`: Should be near 1.0 (100%)
- `silent_takeover_rate`: Should be > 0.95 (95%)

### Check Agents

```bash
curl http://localhost:3002/api/state-drift/agents | jq
```

**Look for**:
- Agent count (should be 10+)
- Agent status (idle/active)
- Metrics per agent

---

## 🎮 Interactive Testing in HUD

### Test Mass Operations

1. Open HUD: http://localhost:5173/state-drift-hud
2. Click **🚨 MASS SUPPRESSION** button
3. Check browser console for operation details
4. Verify alert shows device count

### Test Scenarios

1. Click any scenario in "State Manipulation Scenarios" section
2. Check alert showing operation queued
3. Verify scenario appears in operations queue
4. Monitor stats for changes

### Test War Games

1. Click any war game in "War Games" section
2. Check alert showing simulation started
3. Monitor agent activity
4. Review results when complete

### Monitor Real-time Updates

1. Watch KPI values in bottom bar
2. Verify stats update every second
3. Check agent counts change during operations
4. Monitor devices under control increasing

---

## 🔧 Common Operations

### Register a New Device

```javascript
// In browser console or via API
fetch('http://localhost:3002/api/state-drift/devices/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceId: 'test_device_001',
    metadata: {
      os: 'Windows',
      role: 'workstation',
      location: { region: 'NA', country: 'US' },
      network: { type: 'enterprise' },
      permissions: ['read', 'write'],
      adRoles: ['user'],
      expectedRoles: ['user']
    }
  })
}).then(r => r.json()).then(console.log);
```

### Filter Devices by Threat Level

```bash
# Critical threats only
curl "http://localhost:3002/api/state-drift/devices?filter=%7B%22threatLevel%22%3A%22critical%22%7D"

# High threats
curl "http://localhost:3002/api/state-drift/devices?filter=%7B%22threatLevel%22%3A%22high%22%7D"

# Devices with drift
curl "http://localhost:3002/api/state-drift/devices?filter=%7B%22driftDetected%22%3Atrue%7D"
```

### Execute Custom Scenario

```javascript
fetch('http://localhost:3002/api/state-drift/command/execute-scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scenario: {
      id: 'custom_scenario',
      name: 'My Custom Scenario',
      description: 'Custom test scenario',
      steps: [
        { action: 'control_desktop', params: { silent: true, mode: 'observe' } },
        { action: 'launch_video', params: { videoId: 'training_001' } }
      ]
    },
    filter: { type: 'windows_desktop' }
  })
}).then(r => r.json()).then(console.log);
```

---

## 🐛 Troubleshooting

### Issue: HUD shows 0 devices

**Solution**:
```bash
# Check backend logs for device registration
# Look for "📊 Registered XXX demo devices"

# Manually check status
curl http://localhost:3002/api/state-drift/status | jq .driftEngine.totalDevices
```

### Issue: KPIs not updating

**Solution**:
```bash
# Check if orchestrator is running
curl http://localhost:3002/api/state-drift/status | jq .stats

# Restart backend if needed
npm run dev
```

### Issue: Operations not executing

**Solution**:
```bash
# Check operation queue
curl http://localhost:3002/api/state-drift/status | jq .operations

# Check for idle agents
curl http://localhost:3002/api/state-drift/agents | jq '[.agents[] | select(.status=="idle")] | length'
```

### Issue: High CPU usage

**Solution**:
- Reduce scan rate in `stateDriftEngine.mjs` (increase `scanInterval`)
- Reduce batch size (decrease `batchSize`)
- Limit number of devices registered

### Issue: API errors

**Solution**:
```bash
# Check backend is running
curl http://localhost:3002/health

# Check logs
# Look for error messages in terminal running npm run dev
```

---

## 📈 Performance Tuning

### Increase Scan Rate

Edit `src/backend/routes/stateDrift.mjs`:
```javascript
const driftEngine = new StateDriftEngine({
  scanInterval: 50,      // Was: 100 (ms)
  batchSize: 20000       // Was: 10000 (devices)
});
```

### Increase Agent Pool

Edit `src/backend/routes/stateDrift.mjs`:
```javascript
orchestrator = new SCVOrchestrator({
  driftEngine,
  initialAgentCount: 50,  // Was: 10
  maxAgentsPerDevice: 1000000,
  autoScaling: true
});
```

### Reduce Device Count (Testing)

Edit `src/backend/routes/stateDrift.mjs`:
```javascript
const deviceTypes = [
  { os: 'Windows', role: 'workstation', count: 1000 },  // Was: 100000
  { os: 'macOS', role: 'workstation', count: 500 },     // Was: 50000
  // ... reduce all counts
];
```

---

## 🎯 Success Criteria

System is working correctly if:

✅ **HUD loads** with 3D globe  
✅ **Stats show** 525,000+ devices  
✅ **KPIs update** every second  
✅ **Agents status** shows 10+ agents  
✅ **Scan rate** > 10,000 devices/second  
✅ **Mass suppression** queues operations  
✅ **Scenarios** can be executed  
✅ **War games** can be run  
✅ **API endpoints** respond correctly  
✅ **No console errors** in browser or backend  

---

## 🚀 Next Steps

Once basic testing is complete:

1. **Simulate Drift**: Manually mark devices as drifted
2. **Test Corrections**: Trigger automated corrections
3. **Stress Test**: Register millions of devices
4. **Custom Scenarios**: Create domain-specific scenarios
5. **War Game Library**: Expand with custom war games
6. **Integration**: Connect to real device management systems

---

## 📚 Additional Resources

- **Full Documentation**: `STATE-DRIFT-SYSTEM-COMPLETE.md`
- **API Reference**: See documentation for all endpoints
- **Architecture**: System architecture diagrams in docs
- **Code Examples**: Check test files for usage patterns

---

**System Status**: ✅ Production Ready

**Last Updated**: 2026-01-31

**Need Help?** Check the troubleshooting section or review backend logs.
