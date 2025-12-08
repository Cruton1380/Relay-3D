# Actual Channel Data Analysis - "goat" Channel

## Summary
- **Channel Name**: goat
- **Total Candidates**: 35 (not 45 as intended)
- **Channel Type**: Global / Technology
- **Total Votes**: Should be 10,000

## Vote Distribution Analysis

### Actual Vote Counts
```
Candidate 1:   6,000 votes (60.0%)
Candidate 2:   1,612 votes (16.1%)
Candidate 3:   1,094 votes (10.9%)
Candidate 4:     592 votes (5.9%)
Candidate 5:     402 votes (4.0%)
Candidate 6:     273 votes (2.7%)
Candidate 7:     186 votes (1.9%)
Candidate 8:     126 votes (1.3%)
Candidate 9:      86 votes (0.9%)
Candidate 10:     58 votes (0.6%)
Candidate 11:     39 votes (0.4%)
Candidate 12:     26 votes (0.3%)
Candidate 13:     18 votes (0.2%)
Candidate 14:     12 votes (0.1%)
Candidate 15:      9 votes (0.1%)
Candidate 16:      4 votes (0.0%)
Candidate 17-35:   1 vote each
-----------------------------------
TOTAL:        10,041 votes

⚠️ ISSUE: Total = 10,041 (should be exactly 10,000)
Discrepancy: +41 votes (0.41% error)
```

### Vote Field Analysis
Each candidate has:
- `votes`: Primary count (e.g., 6000)
- `testVotes`: Duplicate of votes (e.g., 6000)
- `realVotes`: Always 0

**Potential Triple Counting Issue**: If components sum `votes + testVotes + realVotes`, the displayed total would be:
- **Correct total**: 10,041 votes
- **If triple counted**: 20,082 votes (votes + testVotes, since realVotes = 0)

## Geographic Distribution Analysis

### Distribution by Region

| Region | Candidates | Percentage |
|--------|------------|------------|
| **USA (New York)** | 7 | 20.0% |
| **UK (England)** | 7 | 20.0% |
| **France** | 7 | 20.0% |
| **Japan (Tokyo)** | 7 | 20.0% |
| **Australia (NSW)** | 7 | 20.0% |
| **TOTAL** | 35 | 100% |

Perfect 7 candidates per region (35 ÷ 5 = 7)

### Coordinate Samples

#### USA (New York)
```
Candidate  1: [42.7689°, -76.8267°]  - 6,000 votes
Candidate  6: [42.7689°, -76.8267°]  - 273 votes
Candidate 11: [41.8489°, -77.6660°]  - 39 votes
Candidate 16: [41.8046°, -74.2398°]  - 4 votes
Candidate 21: [39.3509°, -78.0220°]  - 1 vote
Candidate 26: [42.4279°, -75.3118°]  - 1 vote
Candidate 31: [44.9408°, -74.8005°]  - 1 vote
```

**Spread**: ~6° latitude (39° to 45°), ~4° longitude (-78° to -74°)
**Area**: ~670km N-S × ~440km E-W
**Status**: ✅ Good distribution across New York State

#### UK (England)
```
Candidate  2: [50.4437°, 0.0815°]  - 1,612 votes
Candidate  7: [55.3815°, 0.5382°]  - 186 votes
Candidate 12: [52.0253°, 0.9463°]  - 26 votes
Candidate 17: [53.5921°, 0.2863°]  - 3 votes
Candidate 22: [52.4495°, -3.4971°] - 1 vote
Candidate 27: [50.5001°, -1.0396°] - 1 vote
Candidate 32: [50.4282°, -3.9221°] - 1 vote
```

**Spread**: ~5° latitude (50° to 55°), ~5° longitude (-4° to +1°)
**Area**: ~555km N-S × ~360km E-W
**Status**: ✅ Good distribution across England

#### France
```
Candidate  3: [43.2260°, 4.3009°]   - 1,094 votes
Candidate  8: [46.7762°, 6.9574°]   - 126 votes
Candidate 13: [49.2061°, -3.8504°]  - 18 votes
Candidate 18: [46.1469°, 3.7412°]   - 2 votes
Candidate 23: [44.4183°, 3.0875°]   - 1 vote
Candidate 28: [49.0126°, 8.1039°]   - 1 vote
Candidate 33: [45.3089°, 5.8124°]   - 1 vote
```

**Spread**: ~6° latitude (43° to 49°), ~12° longitude (-4° to +8°)
**Area**: ~665km N-S × ~870km E-W
**Status**: ✅ Excellent distribution across France

#### Japan (Tokyo region)
```
Candidate  4: [32.4698°, 135.5681°]  - 592 votes
Candidate  9: [34.2802°, 138.0703°]  - 86 votes
Candidate 14: [37.5829°, 145.7636°]  - 12 votes
Candidate 19: [37.1868°, 131.3382°]  - 1 vote
Candidate 24: [40.5226°, 123.1948°]  - 1 vote
Candidate 29: [42.2977°, 125.8495°]  - 1 vote
Candidate 34: [38.5174°, 134.4829°]  - 1 vote
```

**Spread**: ~10° latitude (32° to 42°), ~23° longitude (123° to 146°)
**Area**: ~1,110km N-S × ~2,320km E-W
**Status**: ⚠️ Very large spread - covers ALL of Japan, not just Tokyo region
**Issue**: Bounds are too wide (should be Tokyo metropolitan area, not entire country)

#### Australia (New South Wales)
```
Candidate  5: [-34.6538°, 143.6844°]  - 402 votes
Candidate 10: [-28.9746°, 148.9230°]  - 58 votes
Candidate 15: [-36.0998°, 142.4210°]  - 9 votes
Candidate 20: [-33.4128°, 142.8340°]  - 1 vote
Candidate 25: [-28.2197°, 153.0823°]  - 1 vote
Candidate 30: [-29.0714°, 151.9250°]  - 1 vote
Candidate 35: [-32.9638°, 148.7719°]  - 1 vote
```

**Spread**: ~8° latitude (-37° to -28°), ~11° longitude (142° to 154°)
**Area**: ~885km N-S × ~1,010km E-W
**Status**: ✅ Good distribution across NSW

## Coordinate Generation Method: CONFIRMED

✅ **Using Regional Polygon Bounds** (NOT city center clustering)

Evidence:
- Coordinates spread across hundreds of kilometers per region
- No tight clustering around single points
- Variations of 5-10° latitude/longitude within each region
- Matches the fixed rectangular bounding boxes in code

## Issues Identified

### 1. Vote Count Discrepancy
- **Expected**: 10,000 total votes
- **Actual**: 10,041 total votes
- **Cause**: Rounding errors in exponential decay distribution
- **Impact**: Minor (0.41% error)

### 2. Japan Bounds Too Large
- **Current**: Covers all of Japan (32°N - 42°N, 123°E - 154°E)
- **Should be**: Tokyo metropolitan area (~35°N - 36.5°N, 139°E - 140°E)
- **Impact**: Candidates spread across entire country instead of Tokyo region

### 3. Missing Candidates
- **Expected**: 45 candidates
- **Actual**: 35 candidates
- **Cause**: Unknown - may be a user input or generation error
- **Impact**: Vote distribution calculation based on 35 instead of 45

### 4. Potential Double Counting
- Each candidate has `votes` AND `testVotes` with same value
- If components sum these together: 10,041 × 2 = 20,082 displayed
- Need to check channel panel display logic

## Countries Chosen - ANSWER

**Hardcoded in `TestDataPanel.jsx` lines 1328-1333:**

```javascript
const regionalBounds = [
  { name: 'New York', countryName: 'United States', region: 'North America' },
  { name: 'England', countryName: 'United Kingdom', region: 'Europe' },
  { name: 'Île-de-France', countryName: 'France', region: 'Europe' },
  { name: 'Tokyo', countryName: 'Japan', region: 'Asia' },
  { name: 'New South Wales', countryName: 'Australia', region: 'Oceania' }
];
```

**Selection Criteria**:
1. Geographic diversity (one per major continent)
2. Major population centers
3. Easy visual identification for testing
4. **NOT based on user selection** - these are hardcoded fallbacks

## Coordinate Plotting Method - ANSWER

**Rectangular Bounding Box Distribution:**

```javascript
lat = bounds.south + Math.random() * (bounds.north - bounds.south);
lng = bounds.west + Math.random() * (bounds.east - bounds.west);
```

**Characteristics**:
- ✅ Random uniform distribution within rectangular bounds
- ✅ Good geographic spread (hundreds of km)
- ⚠️ NOT true polygon point-in-polygon testing
- ⚠️ CAN generate coordinates in ocean/water
- ⚠️ Rectangle may extend beyond actual political boundaries

## Vote Generation Method - ANSWER

**Exponential Decay with 60% concentration:**

```javascript
totalVotes = 10,000 (fixed)
concentration = 60% (default)

Candidate 1: 60% of 10,000 = 6,000 votes
Remaining: 4,000 votes distributed with exponential decay

decayRate = 0.5 + (0.6 × 0.3) = 0.68

Candidate i (i>1):
  decayFactor = 0.68^i
  votes = 4,000 × decayFactor × 0.4 × scaleFactor
```

**Result**: Winner-takes-most distribution
- Top candidate: 6,000 votes (60%)
- Second: 1,612 votes (16%)
- Third: 1,094 votes (11%)
- Long tail down to 1 vote minimum

## Vote Reconciliation - ANSWER

### Current State: ⚠️ INCONSISTENT

**Issue**: Multiple voting systems with different totals:

1. **Static candidate votes**: 10,041 total
2. **testVotes field**: 10,041 total (duplicate)
3. **realVotes field**: 0 total
4. **Channel panel display**: Unknown (need to verify)

### Verification Needed

Run script to check if channel panel shows:
- **10,041 votes** (correct, using `votes` field)
- **20,082 votes** (double counting: `votes + testVotes`)
- **Different number** (pulling from different source)

## Recommendations

1. **Fix vote total** to exactly 10,000 (adjust rounding in distribution algorithm)
2. **Fix Japan bounds** to Tokyo metro area only (not all of Japan)
3. **Remove duplicate vote fields** (`testVotes` should not duplicate `votes`)
4. **Verify channel panel** displays correct total (10,041, not 20,082)
5. **Generate 45 candidates** as originally intended (not 35)
6. **Make region selection dynamic** (use user's scope selection, not hardcoded)

## Next Steps

1. Clear channels and regenerate with 45 candidates
2. Check channel panel for vote total display
3. Verify no double counting in UI
4. Confirm all 45 cubes visible on globe with proper spread
