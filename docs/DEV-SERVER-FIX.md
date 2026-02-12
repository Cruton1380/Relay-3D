# Dev Server Fix - ERR_CONNECTION_REFUSED

> Status: Legacy operational note (2026-02-07).  
> Canonical product scope and architecture are defined only in `docs/architecture/RELAY-MASTER-BUILD-PLAN.md`.

**Date**: 2026-02-07  
**Issue**: Browser showing "This site can't be reached" at `http://localhost:8000`  
**Root Cause**: Dev server not running (transport failure, not rendering)

---

## ✅ Fix Applied

### 1. Server Status
- **Running**: Python HTTP server on port 8000
- **PID**: 22628
- **Serving from**: `C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93`

### 2. Canonical Launch Methods

#### Option A: Quick Launch (Double-Click)
```
start-server.bat
```
- Just double-click `start-server.bat` in the project root
- Window will show the URL automatically

#### Option B: PowerShell Script
```powershell
.\tools\dev-serve.ps1
.\tools\dev-serve.ps1 -Port 8001  # Custom port
```

#### Option C: Manual Python
```powershell
cd "C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93"
python -m http.server 8000
```

#### Option D: Manual Node.js
```powershell
cd "C:\Users\eitana\Desktop\App Development\Relay\RelayCodeBaseV93"
node scripts/dev-server.mjs
```

---

## 🔗 Correct URL

### **Use this URL in your browser:**
```
http://localhost:8000/relay-cesium-world.html
```

### ❌ **DO NOT** open the file directly:
```
file:///C:/Users/eitana/.../relay-cesium-world.html  ❌ WRONG
```

**Why**: ES6 modules require HTTP protocol due to CORS security.

---

## 🔍 Verification Checklist

Before claiming "server works", verify:

1. **Port is listening**:
   ```powershell
   netstat -ano | findstr :8000
   ```
   Should show: `LISTENING` with a PID

2. **Browser loads the page**:
   - URL bar shows `http://localhost:8000/relay-cesium-world.html`
   - No "ERR_CONNECTION_REFUSED"
   - HTML renders (even if Cesium crashes, HTML should load)

3. **Console shows initialization**:
   - Press F12 → Console tab
   - Should see: `🚀 Relay Cesium World starting...`
   - Even if rendering fails, initialization logs must appear

---

## 🚫 Anti-Drift Rule

**NEVER claim "Phase X COMPLETE" without:**
1. The launch URL (`http://localhost:PORT/relay-cesium-world.html`)
2. A screenshot of the page loaded in browser
3. A console excerpt showing initialization lines

**No URL, no proof, no PASS.**

---

## 🐛 If Port 8000 is Busy

```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill old server (replace PID with actual number)
taskkill /F /PID <PID>

# Or use a different port
.\tools\dev-serve.ps1 -Port 8001
```

---

## 📋 Current Server Status

**Server**: ✅ Running  
**URL**: http://localhost:8000/relay-cesium-world.html  
**Next Step**: Open URL in browser, hard refresh (Ctrl+Shift+R), verify Phase 3 timeboxes

---

## 🎯 Phase 3 Verification Steps

Once the server is confirmed working:

1. Open: http://localhost:8000/relay-cesium-world.html
2. Hard refresh: `Ctrl+Shift+R`
3. Press `L` to lock LOD at SHEET level
4. Press `3` for "Look Down Branch" camera preset
5. **Expected to see**:
   - 6m gap behind each cell
   - Cube stacks (varying heights 3-15 timeboxes)
   - Parallel lanes (two early convergence)
   - Bright cyan = `mustStaySeparate` (has history/formula)
   - Light blue = mergeable cells

6. **Console must show**:
   - `[FilamentRenderer] ⏰ Timeboxes rendered: <count> cubes`
   - `[LINT 1] ✅ Timebox lanes: minimum gap respected`
   - `[LINT 2] ✅ Timebox count matches cell data`

---

## 🔒 Contract Lock

This server setup is **non-negotiable** until Phase 3 proof is captured.

Do not proceed to Phase 4 without:
- Screenshot showing timeboxes + lanes
- Console log excerpt with cube/lane counts
- Confirmation URL in documentation
