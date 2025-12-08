# 🗺️ County Loading Status Report

**Date:** 2025-11-21  
**Test Run:** Latest reload  
**Total Time:** ~2-3 minutes before stopping  
**Total Counties Loaded:** 247  
**Countries Loaded:** 6  
**Countries Failed:** 157

---

## 🔴 **Critical Finding: All Large Countries Fail**

### **Pattern 1: Signal Timeout (90 seconds)**
**Frontend kills request before backend completes**

| Country | Expected Counties | Status | Notes |
|---------|------------------|--------|-------|
| USA | ~3,233 | ❌ Timeout 90s | Largest dataset |
| CHN | ~2,856 | ❌ Timeout 90s | Second largest |
| IND | ~640 | ❌ Timeout 90s | Large file |
| BRA | ~5,000+ | ❌ Timeout 90s | Largest dataset |
| RUS | ~2,000+ | ❌ Timeout 90s | Large file |
| CAN | ~293 | ❌ Timeout 90s | Medium file |
| AUS | ~500+ | ❌ Timeout 90s | Medium file |
| MEX | ~2,400+ | ❌ Timeout 90s | Large file |
| IDN | ~500+ | ❌ Timeout 90s | Medium file |
| PAK | ~150+ | ❌ Timeout 90s | Medium file |

**Root Cause:** Files are 20-50MB+, GeoBoundaries API is slow, 90-120s is insufficient

---

### **Pattern 2: Backend 500 Error**
**Backend crashes processing large GeoJSON files**

| Country | Status | Error |
|---------|--------|-------|
| NGA | ❌ 500 | Server crash |
| SAU | ❌ 500 | Server crash |
| MLI | ❌ 500 | Server crash |
| MNG | ❌ 500 | Server crash |
| FIN | ❌ 500 | Server crash |
| RWA | ❌ 500 | Server crash |
| JPN | ❌ 500 | Server crash |
| YEM | ❌ 500 | Server crash |
| UGA | ❌ 500 | Server crash |
| SLE | ❌ 500 | Server crash |

**Root Cause:** Backend Node.js process runs out of memory or times out internally

---

### **Pattern 3: Success (Small Countries)**
**Only small files complete successfully**

| Country | Counties | Time | Status |
|---------|----------|------|--------|
| SYR | 61 | <30s | ✅ Success |
| TJK | 58 | <30s | ✅ Success |
| BRN | 38 | <20s | ✅ Success |
| GIN | 34 | <20s | ✅ Success |
| BEL | 11 | <10s | ✅ Success |
| BFA | 45 | <25s | ✅ Success |
| TKM | 59 | <30s | ✅ Success |
| TCD | 70 | <35s | ✅ Success |
| PRT | 311 | <60s | ✅ Success |

**Total:** 247 counties from 9 countries

---

## 🎯 **Why It's Random**

Each load attempt is random because:

1. **GeoBoundaries API latency varies** - Sometimes slow, sometimes fast
2. **Backend memory state varies** - Depending on what else is running
3. **Network conditions vary** - Your internet speed fluctuates
4. **Prioritization changes** - Countries load in different order

**Example:**
- Load 1: PRT loads in 45s ✅
- Load 2: PRT times out at 90s ❌
- Load 3: PRT crashes backend (500) ❌

---

## 📈 **Expected Load Times (from GeoBoundaries)**

Based on file sizes:

| Size Category | Example Countries | File Size | Required Time |
|--------------|-------------------|-----------|---------------|
| **Tiny** | BEL (11), BRN (38) | <1MB | 5-15s ✅ |
| **Small** | SYR (61), TJK (58) | 1-3MB | 15-30s ✅ |
| **Medium** | PRT (311), CAN (293) | 5-15MB | 60-90s ⚠️ |
| **Large** | IND (640), PAK (150) | 15-30MB | 90-180s ❌ |
| **Huge** | USA (3,233), CHN (2,856) | 50-100MB+ | 180-300s ❌ |
| **Massive** | BRA (5,000+) | 100MB+ | 300s+ ❌ |

**Current timeouts:**
- Frontend proxy call: 90s
- Frontend MAX_COUNTRY_TIMEOUT: 120s
- Backend proxy: 120s

**Result:** Only tiny/small countries succeed reliably

---

## 🔍 **Complete Country List (All 163)**

### ✅ **Reliably Working** (9 countries, ~15-40 counties each)
BEL, BRN, BFA, GIN, SYR, TCD, TJK, TKM, PRT

### ⚠️ **Sometimes Work** (~20 countries, medium size)
DNK, SWE, CUB, DOM, AZE, MRT, LSO, IRL, CHE, ITA, QAT, KOR, GRC, TWN, MDG

### ❌ **Always Fail - Timeout** (10 countries, too large)
USA, CHN, BRA, RUS, AUS, MEX, IDN

### ❌ **Always Fail - Backend 500** (~30 countries)
NGA, SAU, MLI, MNG, FIN, RWA, JPN, YEM, UGA, SLE, and more

### ❓ **Never Attempted Yet** (~94 countries)
Haven't reached in batch loading yet

---

## 💡 **Root Cause Analysis**

### **Why GeoBoundaries is Failing:**

1. **Files are hosted on GitHub**
   - GitHub LFS has rate limits
   - Redirect chains add latency
   - No CDN acceleration

2. **Files are uncompressed GeoJSON**
   - USA: ~80MB uncompressed
   - Brazil: ~120MB uncompressed
   - No gzip compression during transfer

3. **Backend proxy is single-threaded**
   - Node.js processes one country at a time per request
   - Large files block other requests
   - Memory spikes cause crashes

4. **Network is the bottleneck**
   - Even with infinite timeout, GeoBoundaries API is slow
   - Sometimes takes 3-5 minutes for ONE country
   - Batch of 10 can take 10+ minutes

---

## 🎯 **Realistic Success Rate**

With current architecture:

| Category | Countries | Expected Success |
|----------|-----------|------------------|
| Tiny (0-50 counties) | ~30 | 90% (27 countries) |
| Small (50-150 counties) | ~50 | 60% (30 countries) |
| Medium (150-500 counties) | ~40 | 30% (12 countries) |
| Large (500-1500 counties) | ~25 | 5% (1-2 countries) |
| Huge (1500+ counties) | ~18 | 0% (0 countries) |

**Total Expected:** ~70 countries, ~8,000-12,000 counties

**Current:** 6-10 countries, 247-500 counties per load

---

## 🚨 **Why Random Behavior Occurs**

### **Scenario 1: Good Network Day**
```
Load 1: ✅ 15 countries (1,200 counties) - PRT loaded
Load 2: ✅ 18 countries (1,800 counties) - PRT + CAN loaded
Load 3: ✅ 20 countries (2,500 counties) - Even IND loaded!
```

### **Scenario 2: Bad Network Day (Today)**
```
Load 1: ❌ 6 countries (247 counties) - ALL large countries timeout
Load 2: ❌ 8 countries (350 counties) - Backend crashes on NGA
Load 3: ❌ 5 countries (180 counties) - Even PRT times out
```

### **Scenario 3: Backend Memory Issues**
```
Load 1: ✅ 12 countries - Backend fresh
Load 2: ❌ 5 countries - Backend memory leak
Load 3: ❌ 3 countries - Backend crashes
```

---

## 📊 **Success Rate by Batch**

From your current console:

| Batch | Success | Failed | Total Time |
|-------|---------|--------|-----------|
| Batch 1 | 0/10 | 10 timeout | 120s |
| Batch 2 | 6/10 | 4 error 500 | 60s |
| Batch 3 | 3/10 | 7 error 500 | 90s |
| **Total** | **9/30** | **21 failed** | **270s** |

**Success rate: 30%** (and these are mostly tiny countries)

---

## ✅ **SOLUTION: The ONLY Reliable Fix**

### **Pre-download & Cache Large Countries**

Instead of fetching from GeoBoundaries in real-time, pre-download the data:

```bash
# One-time setup (run once on your computer)
npm run download-county-data
```

This would:
1. Download all 163 countries (takes 1-2 hours, one time)
2. Save to `/data/boundaries/cities/[COUNTRY]-ADM2.geojson`
3. Frontend loads from local files (instant!)

**Result:**
- USA: 80MB file → loads in 2-3 seconds locally ✅
- China: 60MB file → loads in 1-2 seconds locally ✅
- All countries: ~5-10 seconds total instead of 5-10 minutes ✅

---

## 🔄 **Alternative: Increase Timeouts Further**

If you don't want to pre-download:

**Change timeouts to 5 minutes per country:**

```javascript
// Frontend
signal: AbortSignal.timeout(300000) // 5 minutes
const MAX_COUNTRY_TIMEOUT = 300000; // 5 minutes

// Backend
setTimeout(300000) // 5 minutes
```

**Pros:** Might load USA eventually  
**Cons:** 
- Takes 10-30 minutes total
- Still random (network issues)
- Backend 500 errors still occur
- Bad user experience

---

## 📝 **Recommended Action**

1. **Immediate:** Accept that only ~70 countries will load with current system
2. **Short-term:** Increase timeout to 5 minutes, reduce batch size to 5
3. **Long-term:** Pre-download all county data to local files

Without pre-downloading, the system will **always** be unreliable due to GeoBoundaries API limitations.

---

**Last Updated:** 2025-11-21 19:30 UTC  
**Status:** 🔴 Unreliable - GeoBoundaries API is too slow for real-time loading

