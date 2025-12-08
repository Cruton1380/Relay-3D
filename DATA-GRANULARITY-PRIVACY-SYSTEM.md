# 📊 Data Granularity-Based Privacy System

## **Simple Explanation: How Our Voter Privacy Works**

---

## 🎯 **The Core Idea**

### **Traditional Privacy (What Most Systems Do):**
```
❌ Collect GPS from everyone
❌ Hide it behind "privacy settings"
❌ User thinks data is deleted, but it's still stored
```

### **Our Privacy System (Better Approach):**
```
✅ Users choose WHAT DATA to give us from the start
✅ We never collect data they don't want to share
✅ Privacy = What you give us, not what we hide
```

---

## 🔑 **Four Privacy Levels = Four Data Types**

Think of it like asking someone "Where are you from?"

### **Level 1: GPS Sharers (40% of voters)**
```
Question: "What's your exact address?"
Answer: "123 Main Street, San Francisco, CA 94102"

What we collect:
  ✅ GPS coordinates (37.7749, -122.4194)
  ✅ City (San Francisco)
  ✅ Province/State (California)
  ✅ Country (USA)

Data source:
  - User provides: GPS coordinates
  - We calculate: Everything else from GPS
```

### **Level 2: City Sharers (30% of voters)**
```
Question: "Where do you live?"
Answer: "I live in San Francisco"

What we collect:
  ❌ GPS coordinates (not provided)
  ✅ City (San Francisco)
  ✅ Province/State (California)
  ✅ Country (USA)

Data source:
  - User provides: City name
  - We calculate: Province and Country from city
  - We never had: GPS coordinates (never existed)
```

### **Level 3: Province Sharers (20% of voters)**
```
Question: "What state are you in?"
Answer: "I'm in California"

What we collect:
  ❌ GPS coordinates (not provided)
  ❌ City (not provided)
  ✅ Province/State (California)
  ✅ Country (USA)

Data source:
  - User provides: Province/State name
  - We calculate: Country from province
  - We never had: GPS or City (never existed)
```

### **Level 4: Anonymous Voters (10% of voters)**
```
Question: "Where are you?"
Answer: "I prefer not to say"

What we collect:
  ❌ GPS coordinates (not provided)
  ❌ City (not provided)
  ❌ Province/State (not provided)
  ✅ Country (USA) - minimal requirement

Data source:
  - User provides: Country only (or we infer from IP)
  - We never had: Any detailed location (never existed)
```

---

## 📍 **How Clustering Works**

### **The Map Has 4 Zoom Levels (Menu Buttons)**

```
[Country] [Province] [City] [GPS]  ← User clicks one
```

### **What You See Depends on Two Things:**

1. **What button you clicked** (menu selection)
2. **What data voters actually gave us** (data granularity)

### **Key Principle: All Votes Are Always Shown**

When voters don't provide enough detail for the current zoom level:
- ✅ Their votes still appear on the map
- 🔒 Shown as **gray "hidden" towers** at parent region center
- 📊 Clearly labeled as privacy-protected
- 🎯 Honest representation: "We don't know the exact location"

---

## 🎨 **Visual Example: 1,000 Voters in California**

Let's say we have:
- 400 voters who shared GPS
- 300 voters who shared City only
- 200 voters who shared Province only
- 100 voters who are Anonymous

### **Scenario 1: User Clicks "Country" Button**
```
🌍 Country View:
┌─────────────────────────────────┐
│                                 │
│        USA Center               │
│     [HUGE TOWER: 1000]          │  ← ALL votes in one tower
│     Candidate A                 │
│                                 │
│   Visible: 1000/1000            │
│   Hidden: 0                     │
└─────────────────────────────────┘

All votes are known to be in USA.
Everyone appears in one large tower at USA center.
No hidden votes - we have the maximum detail everyone provided.
```

### **Scenario 2: User Clicks "Province" Button**
```
🏛️ Province View:
┌─────────────────────────────────┐
│  California                     │
│  [TOWER: 600]                   │  ← GPS + City + Province voters
│  Candidate A (green)            │
│                                 │
│  Texas                          │
│  [TOWER: 300]                   │  ← GPS + City + Province voters
│  Candidate A (green)            │
│                                 │
│  USA Center (Unknown Province)  │
│  [GRAY TOWER: 100] 🔒           │  ← Country-only voters
│  "100 votes hidden"             │
│  "Privacy: Country-level"       │
│                                 │
│  Visible: 900/1000              │
│  Hidden: 100 (shown as gray)    │
└─────────────────────────────────┘

The big country tower has "split" into:
- 600 votes at California (we know province)
- 300 votes at Texas (we know province)
- 100 votes remain at USA center (we DON'T know province)

The gray tower shows: "These voters only shared country, not province"
```

### **Scenario 3: User Clicks "City" Button**
```
🏙️ City View:
┌─────────────────────────────────┐
│  San Francisco, CA              │
│  [TOWER: 400]                   │  ← GPS + City voters
│  Candidate A (green)            │
│                                 │
│  Los Angeles, CA                │
│  [TOWER: 300]                   │  ← GPS + City voters
│  Candidate A (green)            │
│                                 │
│  California Center (Unknown City)│
│  [GRAY TOWER: 200] 🔒           │  ← Province-only voters
│  "200 votes hidden"             │
│  "Privacy: Province-level"      │
│                                 │
│  USA Center (Unknown Province)  │
│  [GRAY TOWER: 100] 🔒           │  ← Country-only voters
│  "100 votes hidden"             │
│  "Privacy: Country-level"       │
│                                 │
│  Visible: 700/1000              │
│  Hidden: 300 (shown as gray)    │
└─────────────────────────────────┘

Province towers have split further:
- California 600 → 400 at SF + 300 at LA + 200 gray at CA center
- Gray towers show voters who didn't provide city-level detail
```

### **Scenario 4: User Clicks "GPS" Button**
```
📍 GPS View:
┌─────────────────────────────────┐
│  [dot] [dot] SF                 │  ← GPS voters (individual)
│  [dot] [dot] [dot]              │
│  [dot] [dot] LA                 │
│  [dot]                          │
│                                 │
│  San Francisco Center (No GPS)  │
│  [SMALL GRAY TOWER: 200] 🔒     │  ← City-only voters
│  "200 votes hidden"             │
│                                 │
│  Los Angeles Center (No GPS)    │
│  [SMALL GRAY TOWER: 100] 🔒     │  ← City-only voters
│  "100 votes hidden"             │
│                                 │
│  California Center (No City)    │
│  [GRAY TOWER: 200] 🔒           │  ← Province-only voters
│  "200 votes hidden"             │
│                                 │
│  USA Center (No Province)       │
│  [GRAY TOWER: 100] 🔒           │  ← Country-only voters
│  "100 votes hidden"             │
│                                 │
│  Visible: 400/1000 (as dots)    │
│  Hidden: 600 (as gray towers)   │
└─────────────────────────────────┘

Maximum detail level:
- 400 GPS voters shown as individual dots
- All non-GPS votes become gray towers at their "last known location"
- Multiple gray towers at different precision levels
```

---

## 🎨 **The Tower Decomposition Effect**

### **Visual Metaphor: Drilling Down Through Layers**

```
Country View:           Province View:          City View:
    [1000]                  [600]                  [400]
    |||||                   |||||                  |||||
    |||||                   |||||                  ||||| San Francisco
    |||||                   ||||| California       
    |||||                                          [300]
    ||||| USA              [300]                   |||||
                           |||||                   ||||| Los Angeles
                           ||||| Texas             
                                                   [200] 🔒 (gray)
                           [100] 🔒 (gray)         CA Center
                           USA Center              
                                                   [100] 🔒 (gray)
                                                   USA Center
```

**As you drill down:**
1. Large towers "split" into smaller regional towers
2. Votes that lack detail "remain behind" as gray towers
3. Total height across all towers stays constant
4. Gray towers show what we DON'T know due to privacy choices

---

## 🔒 **Why This Is More Private**

### **Traditional System (Bad):**
```
User: "Show me city-level only"
System: "OK! (But I'm secretly keeping your GPS)"
Database: { gps: (37.7, -122.4), displayAs: "city" }
                ↑ This data still exists!
```

### **Our System (Good):**
```
User: "I'll share my city"
System: "Got it! What's your city?"
Database: { city: "San Francisco", gps: null }
                                          ↑ This never existed!
```

**Benefits:**
- ✅ Can't be hacked (data doesn't exist)
- ✅ Can't be subpoenaed (data doesn't exist)
- ✅ Can't accidentally leak (data doesn't exist)
- ✅ GDPR compliant (minimal data collection)
- ✅ User has true control (decides from start)

---

## 📊 **Vote Counting Rules**

### **Golden Rule: One Voter = One Vote (Always)**

```
Example: Alice votes for Candidate A

When you view at Country level:
  → Alice's vote counts: 1 vote in USA

When you view at Province level:
  → Alice's vote counts: 1 vote in California

When you view at City level:
  → Alice's vote counts: 1 vote in San Francisco

When you view at GPS level:
  → Alice's vote counts: 1 vote at GPS location
```

**No matter what view level, Alice always = 1 vote**

### **Why Visible Vote Counts Change:**

```
If Alice only shared "California" (province level):

Country view: ✅ Her vote appears (she has country data)
Province view: ✅ Her vote appears (she has province data)
City view: ❌ Her vote hidden (she never gave us city)
GPS view: ❌ Her vote hidden (she never gave us GPS)

Her vote still counts! Just not visible at detail levels
she didn't share data for.
```

---

## 🎯 **Real-World Analogy**

Think of it like a survey with different response options:

```
Survey: "Where do you live?"

Option 1 (GPS): "123 Main St, San Francisco, CA 94102"
  → We can put you on any map (precise to exact location)

Option 2 (City): "San Francisco"
  → We can put you on state maps, city maps
  → Can't put you on street-level maps (don't have address)

Option 3 (Province): "California"
  → We can put you on country maps, state maps
  → Can't put you on city maps (don't know which city)

Option 4 (Anonymous): "USA"
  → We can only include you in country statistics
  → Can't put you on any detailed maps
```

**The survey never asks for your address if you chose Option 2, 3, or 4!**

---

## 🛠️ **How We Implement This**

### **Step 1: When Voter Votes**
```
System: "How much location info do you want to share?"

User picks: "City level"

System saves:
{
  userId: "voter_123",
  dataGranularity: "city",  ← What they chose
  gps: null,                ← Never collected
  city: "San Francisco",    ← They provided this
  province: "California",   ← We derived this
  country: "USA"            ← We derived this
}
```

### **Step 2: When Displaying on Map**
```
Menu button clicked: "Province"

System checks:
  - Does voter_123 have province data? ✅ Yes
  - Show voter at California province center

Menu button clicked: "GPS"

System checks:
  - Does voter_123 have GPS data? ❌ No
  - Don't show voter (data doesn't exist)
```

### **Step 3: Clustering**
```
All voters in same location cluster together:

Province view:
  - All California voters → One big dot
  - All Texas voters → Another big dot

City view:
  - All San Francisco voters → One medium dot
  - All Los Angeles voters → Another medium dot

GPS view:
  - Each GPS voter → Individual small dot
```

---

## ✅ **Benefits of This System**

### **For Users:**
- 🔒 True privacy (data never collected)
- 🎛️ Real control (choose granularity upfront)
- 👁️ Transparency (see exactly what's shared)
- 🚫 No hidden data collection

### **For Us (Platform):**
- 📊 Flexible visualization (any zoom level)
- ⚖️ Legal compliance (GDPR, CCPA ready)
- 🛡️ Security (can't leak what we don't have)
- 🎯 User trust (honest data practices)

### **For the System:**
- ✅ No double-counting (one voter = one vote)
- 🔄 Consistent totals (sum always correct)
- 📈 Scalable (works at any level)
- 🎨 Flexible display (adapt to user needs)

---

## 🔍 **Comparison Table**

| Feature | Traditional System | Our System |
|---------|-------------------|------------|
| **Data Collection** | Always collect GPS | Collect what user provides |
| **Privacy Method** | Hide/filter stored data | Don't collect sensitive data |
| **User Control** | After collection | Before collection |
| **Data Breach Risk** | High (all data stored) | Low (minimal data stored) |
| **Transparency** | "Trust us to hide it" | "We never collected it" |
| **GDPR Compliance** | Complex | Simple |
| **Vote Counting** | Same at all levels | Visible count varies by level |
| **Map Detail** | Always available | Limited by data provided |

---

## 🗳️ **Hover Tooltips & User Experience**

### **Visible Tower Tooltip:**
```
┌─────────────────────────────────┐
│ 🗳️ Candidate A                  │
│ Location: San Francisco, CA     │
│ Votes: 400                      │
│ ├─ 250 GPS-level voters         │
│ ├─ 100 City-level voters        │
│ └─ 50 Province-level voters     │
│                                 │
│ All votes visible at this level │
└─────────────────────────────────┘
```

### **Hidden Tower Tooltip:**
```
┌─────────────────────────────────┐
│ 🔒 Privacy-Protected Votes      │
│ Location: USA (exact unknown)   │
│ Hidden Votes: 100               │
│ Privacy Level: Country-only     │
│                                 │
│ These voters chose not to share │
│ province data. Their votes count│
│ but exact location is unknown.  │
│                                 │
│ 💡 Zoom out to Country view to  │
│    see them in the main cluster │
└─────────────────────────────────┘
```

### **Candidate Summary Panel:**
```
┌─────────────────────────────────┐
│ Candidate A - Total Votes: 1000│
│                                 │
│ 📊 At Current Zoom (City):      │
│   ✓ Visible: 700 votes          │
│   🔒 Hidden: 300 votes           │
│                                 │
│ Hidden Vote Breakdown:          │
│   • 200 Province-only (CA)      │
│   • 100 Country-only (USA)      │
│                                 │
│ Change zoom level to see more   │
└─────────────────────────────────┘
```

---

## 📝 **Summary**

### **Four Key Principles:**

1. **Privacy = Granularity**
   - Users choose WHAT data to give us
   - Not WHAT we hide from view

2. **All Votes Always Visible**
   - Votes appear as normal towers (at known locations)
   - OR as gray towers (at parent region centers)
   - Total vote count always accurate

3. **Tower Decomposition**
   - As you drill down, towers split into more specific locations
   - Remainder stays as gray towers at parent centers
   - Visual representation of data availability

4. **Transparency & Trust**
   - We're honest about what we collect
   - We physically can't leak what we don't have
   - Users see exactly what's known vs. unknown

### **The Result:**

A privacy system that:
- ✅ Truly protects user data (by not collecting it)
- ✅ Gives users real control (not just settings)
- ✅ Maintains accurate vote counting (no duplicates)
- ✅ Provides flexible visualization (zoom in/out)
- ✅ Shows ALL votes (visible + hidden towers)
- ✅ Builds user trust (honest practices)
- ✅ Educates users about privacy choices

---

## 🎓 **For Developers**

When implementing:
- `dataGranularity` field = what user provided
- `gps`, `city`, `province` fields = null if not provided
- Clustering produces TWO arrays: `visible` and `hidden`
- Hidden clusters render as gray towers at parent centers
- Never fake/estimate data we don't have
- Vote count is always accurate (one voter = one vote)
- Sum of visible + hidden towers = total votes (always)

---

## 🤔 **Common Questions**

**Q: Why do vote counts change at different zoom levels?**
A: The total never changes. But some voters appear as gray "hidden" towers because they didn't share detail for that zoom level.

**Q: Is the vote still counted if shown as gray tower?**
A: Yes! Always. Gray towers are still towers - they count. We just show them at parent region center with a 🔒 icon.

**Q: Why show hidden votes at all?**
A: Transparency! Users see the full picture: "700 votes at specific locations + 300 votes somewhere in USA". Total = 1000.

**Q: Can we estimate GPS from city?**
A: No. That would violate user trust. We only use data they explicitly provided. Gray tower = honest "we don't know".

**Q: What happens when hovering over gray towers?**
A: Tooltip explains: "These voters chose country-level privacy. Zoom out to see them in main cluster."

**Q: What if we need exact locations later?**
A: We can't add it retroactively. User would need to update their choice. Gray tower would then split into specific locations.

**Q: Is this more complex than traditional privacy?**
A: Initial setup is more thoughtful, but long-term it's simpler and more trustworthy. Users appreciate the honesty.

**Q: Do gray towers have the same height as normal towers?**
A: Yes! Same vote = same height. Only difference is color (gray) and opacity (translucent) to show "location unknown".

---

## 🛠️ **Implementation Plan (Revised)**

### **Phase 1: Update Data Structures** ⏳
**Files:** `scripts/generate-voters-with-locations.mjs`

**Changes:**
```javascript
// New voter structure
{
  userId: "voter_123",
  dataGranularity: "city",  // What user provided
  
  gps: null,                // Not provided
  city: "San Francisco",    // Provided
  cityCode: "SF",
  province: "California",   // Derived
  provinceCode: "CA",
  country: "USA",           // Derived
  countryCode: "US",
  
  vote: { candidateId, topicId, timestamp }
}
```

**Distribution:**
- 40% GPS sharers (have all levels)
- 30% City sharers (city + derived province/country)
- 20% Province sharers (province + derived country)
- 10% Country sharers (country only)

---

### **Phase 2: Update Clustering Algorithm** ⏳
**Files:** `src/backend/routes/voterVisualization.mjs`

**New Function:**
```javascript
function clusterVotersWithHiddenTowers(voters, selectedLevel) {
  return {
    visible: [...],  // Normal towers at specific locations
    hidden: [...]    // Gray towers at parent region centers
  };
}
```

**Logic:**
1. For each voter, check if they have data at `selectedLevel`
2. If YES → add to `visible` cluster at specific location
3. If NO → add to `hidden` cluster at parent region center
4. Return both arrays

**Helper Functions:**
- `hasDataAtLevel(voter, level)` - Check data availability
- `getParentLevel(level)` - Get hierarchy parent
- `getParentCenterCoords(voter, parentLevel)` - Get centroid

---

### **Phase 3: Add Centroid Calculation** ⏳
**Files:** `src/backend/routes/voterVisualization.mjs`

**New Functions:**
```javascript
async function getCityCentroid(countryCode, cityCode)
async function getProvinceCentroid(countryCode, provinceCode)
async function getCountryCentroid(countryCode)
```

**Implementation:**
- Use `boundaryService.getBoundary()` to get GeoJSON
- Use `turf.centroid()` to calculate center point
- Cache results for performance
- Fallback to approximate coordinates if boundary not available

---

### **Phase 4: Update API Endpoint** ⏳
**Files:** `src/backend/routes/voterVisualization.mjs`

**Changes:**
- Accept `level` query parameter from frontend
- Return both `visible` and `hidden` clusters
- Add statistics: `totalVoters`, `visibleVoters`, `hiddenVoters`

**Response Format:**
```javascript
{
  success: true,
  level: "city",
  clusters: {
    visible: [...],
    hidden: [...]
  },
  stats: {
    total: 1000,
    visible: 700,
    hidden: 300,
    hiddenBreakdown: {
      "province-only": 200,
      "country-only": 100
    }
  }
}
```

---

### **Phase 5: Update Frontend Rendering** ⏳
**Files:** `src/frontend/components/workspace/components/Globe/GlobalChannelRenderer.jsx`

**Changes:**

**1. Render Visible Towers (Normal):**
```javascript
clusters.visible.forEach(cluster => {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, cluster.height),
    cylinder: {
      length: cluster.voteCount * 100,
      topRadius: 5000,
      bottomRadius: 5000,
      material: Cesium.Color.fromCssColorString(candidateColor)
    }
  });
});
```

**2. Render Hidden Towers (Gray):**
```javascript
clusters.hidden.forEach(cluster => {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(cluster.lng, cluster.lat, cluster.height),
    cylinder: {
      length: cluster.voteCount * 100,
      topRadius: 5000,
      bottomRadius: 5000,
      material: Cesium.Color.GRAY.withAlpha(0.4)  // Translucent
    },
    label: {
      text: `🔒 ${cluster.voteCount} votes hidden`,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2
    }
  });
});
```

**3. Add Tooltips:**
- Visible tower: Show vote breakdown by granularity
- Hidden tower: Show privacy reason and zoom-out hint

---

### **Phase 6: Update Menu Integration** ⏳
**Files:** Menu component (location TBD)

**Changes:**
- Menu button click emits `aggregationLevelChanged` event
- Event includes `{ level: 'country'|'province'|'city'|'gps' }`
- Globe listens and re-fetches clusters with new level
- Summary panel updates with visible/hidden stats

---

### **Phase 7: Add Summary Panel** ⏳
**Files:** Candidate info panel

**New UI Element:**
```
┌─────────────────────────────────┐
│ 📊 Vote Visibility (City View)  │
│                                 │
│ ✅ Visible: 700 votes            │
│ 🔒 Hidden: 300 votes             │
│                                 │
│ Hidden because:                 │
│ • 200 voters shared province    │
│   only (shown at CA center)     │
│ • 100 voters shared country     │
│   only (shown at USA center)    │
│                                 │
│ 💡 Zoom out to see all votes    │
└─────────────────────────────────┘
```

---

### **Phase 8: Testing & Validation** ⏳

**Test Cases:**
1. ✅ Vote count consistency across all zoom levels
2. ✅ Sum of visible + hidden = total (always)
3. ✅ Gray towers appear at correct parent centers
4. ✅ Tooltips display correct information
5. ✅ Menu transitions update clusters correctly
6. ✅ Performance with large vote counts (100k+ voters)

**Validation Queries:**
```bash
# Test each level
curl "localhost:3002/api/voter-visualization/topic/candidate?level=country"
curl "localhost:3002/api/voter-visualization/topic/candidate?level=province"
curl "localhost:3002/api/voter-visualization/topic/candidate?level=city"
curl "localhost:3002/api/voter-visualization/topic/candidate?level=gps"

# Verify: visible + hidden = constant across all levels
```

---

## ✅ **Success Criteria**

1. ✅ Every voter appears SOMEWHERE on map (visible or hidden tower)
2. ✅ Vote totals are consistent across all zoom levels
3. ✅ Hidden towers clearly labeled with 🔒 icon
4. ✅ Tooltips explain why votes are hidden
5. ✅ Gray towers at correct parent region centers
6. ✅ Tower heights accurately represent vote counts
7. ✅ Performance: <500ms to render 100k voters
8. ✅ No vote double-counting or lost votes

---

**Last Updated:** October 19, 2025  
**Status:** Implementation Plan Complete  
**Next Step:** Begin Phase 1 - Update voter data structure with granularity levels


