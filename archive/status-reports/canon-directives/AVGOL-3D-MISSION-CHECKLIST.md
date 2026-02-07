# Avgol 3D Business Mission - Technical Checklist

**Mission Date**: TBD  
**Duration**: 35-45 minutes  
**Attendees**: Alexandra Demina, Vered Israelovitz  
**Demonstrator**: Eitan Asulin

---

## Pre-Mission Setup (Week Before)

### 1. Hardware Requirements
- [ ] **Desktop** (Canon Core simulator)
  - Synology DS923+ configured per `CANON-VAULT-SPEC.md`
  - Docker running `relay-vault-guardian` (mock mode OK for demo)
  - Port 443 forwarded for remote demo (if needed)

- [ ] **Laptop** (3D Visualization)
  - GPU tested with `filament-spreadsheet-prototype.html`
  - Tree Scaffold View with 5 site nodes prepared
  - Avgol sample data loaded

- [ ] **Backup**
  - USB drive with offline copy of demo
  - Backup laptop ready

### 2. Data Preparation
- [ ] Create mock Avgol data structure:
  ```
  /avgol-demo/
  ├─ vendors/
  │  ├─ VEN-00123-acme-industrial.json
  │  ├─ VEN-00201-xyz-supplies.json
  │  └─ ... (20 vendors total)
  ├─ boms/
  │  ├─ BOM-NW-5000-REV3-maxwell.json
  │  ├─ BOM-NW-5000-RU-REV2-russia.json
  │  └─ ... (15 BOMs total)
  ├─ payment-terms/
  │  └─ ... (per vendor per site)
  ├─ warehouse-pressure/
  │  └─ maxwell-warehouse-state.json
  └─ customers/
     └─ CUST-00456-megacorp.json
  ```

- [ ] Vendor data includes:
  - 3 vendors used by multiple sites (show cross-site ERI)
  - 2 vendors with duplicate entries (show reconciliation)
  - 1 vendor with poor Russia performance (show ERI diff)

- [ ] BOM data includes:
  - Base BOM (NW-5000) with 3 site variants
  - 5 active BOMs (used in last 6 months)
  - 3 inactive BOMs (not used, but in system)

- [ ] Pressure data includes:
  - Maxwell warehouse at 73% pressure (DEGRADED)
  - 3 critical stockouts flagged
  - 47 unfulfilled orders

### 3. 3D Scene Preparation

#### Scene 1: "The Problem" (Current State)
- [ ] 5 site nodes positioned globally:
  - Maxwell (Israel) - center-left
  - Russia - top-right
  - China - right
  - India - bottom-right
  - HQ/Global - center (smaller)

- [ ] File chaos visualization:
  - Scattered BOM/payment/bid file nodes (small cubes)
  - Red lines = duplicate vendors
  - Orange lines = conflicting terms
  - Yellow lines = inactive BOMs

- [ ] Maxwell warehouse pressure ring:
  - Pulsing between yellow (0.73) and red (0.80 threshold)
  - Visible metrics overlay

- [ ] Single buyer bottleneck:
  - Small node at Maxwell with "BOTTLENECK" label
  - Red glow effect

- [ ] Interactive "Process Order" button:
  - Order request animates bouncing between sites
  - Finds 3 BOM versions
  - Warehouse pressure spikes to red
  - System state changes to "INDETERMINATE"

#### Scene 2: "Relay Transform" (Evidence Anchors)
- [ ] Canon Vault appears:
  - Golden central sphere
  - Rotating slowly
  - Labeled "Relay Canon Core"

- [ ] Evidence anchors materialize:
  - Vendor anchor (blue cube) - 20 vendors
  - BOM anchor (green prism) - 15 BOMs
  - Payment terms anchor (purple cylinder) - per vendor/site

- [ ] Filaments connect sites to anchors:
  - Smooth curved lines
  - Color-coded by evidence type
  - Thickness = usage frequency

- [ ] Interactive: Click vendor "Acme Industrial"
  - All using sites light up (Maxwell, Russia)
  - Payment terms overlay appears
  - Historical timeline shows changes

#### Scene 3: "Pressure Visibility" (Coordination)
- [ ] Pressure rings with metrics:
  - Green ring (< 0.6): India, China
  - Yellow ring (0.6-0.8): Russia, Maxwell warehouse
  - Red ring (> 0.8): Maxwell critical stockouts

- [ ] Warehouse pressure state overlay:
  ```
  WAREHOUSE PRESSURE: DEGRADED (0.73)
  ├─ Unfulfilled Orders: 47
  ├─ Awaiting Receipt: 23 (avg 12 days)
  └─ Critical Stockouts: 3
     ├─ PART-EL-0045 (Motor)
     ├─ PART-MC-0089 (Controller)
     └─ PART-HY-0234 (Hydraulic valve)
  ```

- [ ] Vendor ERI halos:
  - Acme Industrial: Green halo (0.84)
  - XYZ Supplies: Yellow halo (0.62)
  - ABC Components: Red halo (0.45)

- [ ] Interactive: Warehouse pressure exceeds 0.8
  - New order request appears
  - System refuses with message overlay
  - Suggested repair action appears

#### Scene 4: "Cross-Site Coordination" (Reality)
- [ ] Customer node (MegaCorp):
  - Positioned above site cluster
  - Labeled with customer name + ID

- [ ] Contract filaments:
  - Connect customer to Maxwell, Russia, China
  - Labeled with contract IDs
  - Thickness = annual volume

- [ ] BOM reconciliation view:
  - Base BOM at center
  - Variant branches with approval stamps
  - Differences highlighted (hover to see details)

- [ ] Interactive: Customer quote request
  - Quote request appears at Canon
  - Serving sites light up
  - Each calculates quote (animation)
  - Global account manager sees all
  - System flags price difference

#### Scene 5: "Tomorrow Promise" (Autonomy)
- [ ] Authority delegation overlay:
  - Alexandra's scope: "Approve vendors <$50k"
  - Finance scope: "Approve payment terms"
  - Engineering scope: "Approve BOM changes"

- [ ] Pressure-driven workflow animation:
  - Warehouse approaches 0.8
  - Notification sent to Alexandra
  - Expedited order suggestion
  - Non-critical orders refused

- [ ] Mirror nodes appear:
  - Russia mirror (read-only)
  - China mirror (read-only)
  - If Canon Core goes offline, mirrors continue

- [ ] Interactive: "Purchasing manager absent 6 months"
  - Alexandra node goes hollow
  - System state: DEGRADED (not broken)
  - Critical decisions queue
  - Non-critical continues
  - "NO SILENT FAILURE" banner

### 4. Narration Scripts
- [ ] Scene 1 narration recorded/practiced (2 min)
- [ ] Scene 2 narration recorded/practiced (3 min)
- [ ] Scene 3 narration recorded/practiced (4 min)
- [ ] Scene 4 narration recorded/practiced (3 min)
- [ ] Scene 5 narration recorded/practiced (3 min)
- [ ] Total: ~15 min demo + 20-30 min discussion

### 5. Technical Integration
- [ ] Modify `filament-spreadsheet-prototype.html`:
  - Add Avgol site nodes (5 locations)
  - Add evidence anchor types (vendor, BOM, payment)
  - Add pressure ring visualization
  - Add ERI halo rendering
  - Add customer node type
  - Add "Process Order" interaction
  - Add "Quote Request" interaction
  - Add "Authority Delegation" overlay

- [ ] Create Avgol-specific data loader:
  - `avgol-data-loader.js`
  - Loads vendors, BOMs, pressure states from JSON
  - Populates 3D scene with Avgol-specific nodes

- [ ] Test interactive demos:
  - "Process Order" → INDETERMINATE
  - Click vendor → show cross-site usage
  - Warehouse pressure → REFUSAL
  - Quote request → coordinated response
  - Manager absence → DEGRADED (not broken)

---

## Day-Of Mission Checklist

### Setup (2 hours before)
- [ ] Test internet connection (if remote demo)
- [ ] Test screen sharing (if remote demo)
- [ ] Test 3D prototype loads correctly
- [ ] Test all 5 scenes transition smoothly
- [ ] Test interactive elements respond
- [ ] Backup USB ready (if needed)
- [ ] Water/coffee ready
- [ ] Phone on silent

### Demo Flow (45 minutes)
**0:00-0:05** - Introduction
- [ ] Thank Alexandra for sharing the challenges
- [ ] Recap: "6 months without manager, single buyer, snowball problem"
- [ ] Promise: "Show you how Relay would handle this"

**0:05-0:10** - Scene 1: The Problem
- [ ] Show 5 sites, file chaos, pressure
- [ ] Demo "Process Order" → INDETERMINATE
- [ ] Key message: "This is invisible coordination failure"

**0:10-0:15** - Scene 2: Evidence Anchors
- [ ] Canon Vault appears, anchors materialize
- [ ] Demo click vendor → cross-site usage
- [ ] Key message: "Single source of truth, append-only"

**0:15-0:20** - Scene 3: Pressure Visibility
- [ ] Warehouse pressure metrics appear
- [ ] Demo warehouse exceeds threshold → REFUSAL
- [ ] Key message: "Snowball becomes measurement"

**0:20-0:25** - Scene 4: Cross-Site Coordination
- [ ] Customer node, contract filaments
- [ ] Demo quote request → coordinated response
- [ ] Key message: "No duplicate bids, no conflicting prices"

**0:25-0:30** - Scene 5: Tomorrow Promise
- [ ] Authority delegation, mirror nodes
- [ ] Demo manager absence → DEGRADED (not broken)
- [ ] Key message: "No silent failure, ever"

**0:30-0:45** - Discussion & Questions
- [ ] Ask: "What did you see that solves your problems?"
- [ ] Ask: "What concerns do you have?"
- [ ] Ask: "Would you want to pilot this at Maxwell first?"
- [ ] Listen more than talk
- [ ] Take notes on objections/requests

### Post-Mission Follow-Up
- [ ] Send thank-you email within 24 hours
- [ ] Include demo recording (if permission granted)
- [ ] Include case study document (`RELAY-CASE-AVGOL-ALEXANDRA.md`)
- [ ] Include pilot proposal (Maxwell-only, Month 1-2)
- [ ] Schedule follow-up call (1-2 weeks)

---

## Success Criteria

### Minimum Success:
- ✅ Alexandra understands the problem (file chaos, pressure, coordination)
- ✅ Demo completes without technical failures
- ✅ Q&A reveals genuine interest (not just politeness)

### Target Success:
- ✅ Alexandra says: "This solves our problem"
- ✅ Vered (senior stakeholder) sees value
- ✅ Request for pilot proposal
- ✅ Introduction to IT/engineering team

### Maximum Success:
- ✅ Approval for Maxwell pilot (Month 1-2)
- ✅ Budget allocated
- ✅ Alexandra becomes Relay champion internally
- ✅ Introduction to Avgol CEO/CTO

---

## Risk Mitigation Plan

### Risk: Technical demo failure
**Mitigation**:
- Backup laptop with offline demo
- USB drive with all files
- Pre-recorded video of each scene (if live fails)

### Risk: "Too complex for our buyers"
**Response**:
- "We start with Maxwell only, familiar team"
- "Alexandra as custodian, she already coordinates"
- "Buyers enter data once, no duplicates"
- Show side-by-side: current process + Relay (not replacement, enhancement)

### Risk: "We don't have budget"
**Response**:
- "What's the cost of the snowball problem?"
- "6 months without manager = how much lost efficiency?"
- "How much time does 1-by-1 vendor reconciliation take?"
- Pilot at Maxwell is small scope, measurable ROI

### Risk: "We need IT approval"
**Response**:
- "Let's schedule a technical deep-dive with IT"
- "Relay runs on existing infrastructure (no cloud lock-in)"
- "Canon Core on Maxwell server, NAS backup"
- Share `CANON-VAULT-SPEC.md` and `RELAY-VAULT-GUARDIAN-SPEC.md`

### Risk: "Language barriers across sites"
**Response**:
- "Evidence anchors are language-neutral (IDs + structured data)"
- "UI translations per site (Russian/Chinese/Hindi)"
- "Part numbers remain in original language"
- Show BOM reconciliation with side-by-side translations

---

## Key Quotes to Reference

Use these during demo to echo Alexandra's own words:

1. **Team instability**: "6 months without purchasing manager"
2. **Bottleneck**: "Just one buyer who couldn't process minimum orders"
3. **Snowball**: "Growing as a snowball"
4. **Recognition**: "Now we say it's a high focus"
5. **Current approach**: "1 by 1 by spend, vendor, criticality"
6. **Data fragmentation**: "Separated in different sites and folders"
7. **Hope**: "Maybe tomorrow we'll figure something out globally"

**Anchor Statement** (use at end):
> "Alexandra, you said 'maybe tomorrow.' Tomorrow is here. Relay doesn't stop the next crisis. But it measures it, explains it, refuses honestly, and suggests repair. That's the difference between a snowball and a system."

---

## Technical Notes

### 3D Performance Targets:
- 60 FPS with 5 site nodes + 50 evidence anchors
- Smooth transitions between scenes (< 1 sec)
- Interactive elements respond < 100ms
- No lag during pressure animations

### Data Volume:
- 20 vendors (realistic for indirect procurement)
- 15 BOMs (5 active, 10 historical)
- 5 sites
- 1 customer (multi-site)
- 50+ pressure data points

### Browser Requirements:
- Chrome/Edge (latest)
- WebGL 2.0 support
- GPU acceleration enabled
- 1920x1080 minimum resolution

---

**Status**: Ready for rehearsal  
**Next Action**: Practice each scene 3x until smooth  
**Rehearsal Date**: TBD (1 week before mission)  
**Mission Date**: TBD (coordinate with Alexandra + Vered)
