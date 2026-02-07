# 🏢 Relay Business Operating Model

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Status**: Canonical

---

## Definition

**Relay Operating Model** defines how organizations use Relay, who has what responsibilities, and how business operations map to the spatial/governance system.

**Rule**: Relay is not "software you deploy." It is a coordination substrate you inhabit.

---

## Business Roles (NOT Technical Roles)

### 1. Steward

**Definition**: Person responsible for a tree or boundary

**Responsibilities**:
- Define local policies (within jurisdictional bounds)
- Delegate authority to operators
- Resolve conflicts within scope
- Reaffirm or sunset stale policies
- Set local cadence (weekly/monthly)

**Authority**:
- Can create branches within their tree
- Can delegate to operators
- Can propose policy changes (subject to governance)
- **Cannot override boundary governance**
- **Cannot bypass reconciliation**

**Example**:
- Company: CEO or designated coordinator
- Facility: Site manager
- Department: Department head
- Project: Project lead

### 2. Operator

**Definition**: Person executing commitments and maintaining tree health

**Responsibilities**:
- Execute timebox commitments
- Update cell data (formula dependencies)
- Flag issues (pressure, divergence)
- Report to steward (as needed)

**Authority**:
- Can execute within delegated scope
- Can create cells/sheets (within branch)
- Can flag pressure
- **Cannot change policy**
- **Cannot delegate further**

**Example**:
- Analyst updating forecast cells
- Engineer committing code
- Procurement specialist updating vendor relationships

### 3. Delegate

**Definition**: Person temporarily holding delegated authority

**Responsibilities**:
- Act on behalf of steward (limited scope)
- Resolve urgent issues
- Report back to steward

**Authority**:
- Time-limited (expiry date required)
- Scope-limited (specific branches/boundaries)
- Revocable (steward can revoke)

**Expiry**:
- Default: 30 days
- Max: 90 days (constitutional limit)
- Must be renewed explicitly (no auto-renewal)

### 4. Observer

**Definition**: Person with read-only access

**Responsibilities**:
- View tree/boundaries
- Monitor pressure
- Submit proposals (if governance allows)

**Authority**:
- Read-only
- **Cannot execute commitments**
- **Cannot vote** (unless governance grants it)

**Example**:
- Auditor
- Regulator
- Partner company (cross-boundary view)

---

## Organizational Patterns

### Pattern 1: Single Company Tree

**Structure**:
- One tree rooted at HQ location
- Branches for departments/facilities
- Sheets for projects/teams
- Cells for specific commitments

**Governance**:
- Steward: CEO or COO
- Operators: Department heads, project leads
- Boundary: Company legal jurisdiction

**Example**:
```
Tree Root: AVGOL HQ (Tel Aviv, 32.0853° N, 34.7818° E)
    ├─ Branch: Engineering
    │   ├─ Sheet: Product A
    │   └─ Sheet: Product B
    ├─ Branch: Sales
    │   ├─ Sheet: Region EMEA
    │   └─ Sheet: Region APAC
    └─ Branch: Operations
        ├─ Sheet: Supply Chain
        └─ Sheet: Facilities
```

### Pattern 2: Multi-Site Tree Forest

**Structure**:
- Multiple trees (one per facility/site)
- Each tree has its own lat/lon root
- Global relationships route via Earth core

**Governance**:
- Each site: Local steward
- Corporate: Boundary steward (oversees all sites)
- Relationships: Require approval from both sites

**Example**:
```
Tree A: Factory (Shanghai)
Tree B: Warehouse (Rotterdam)
Tree C: HQ (New York)

Relationship: Factory ←→ Warehouse (supply chain)
    → Core-routed filament
    → Requires approval from both stewards
```

### Pattern 3: Cross-Company Consortium

**Structure**:
- Each company: Own tree
- Shared boundary: Consortium jurisdiction
- Shared policies: Boundary-scoped

**Governance**:
- Each company: Own steward
- Consortium: Boundary steward (elected or appointed)
- Votes: Boundary-scoped, require quorum from all parties

**Example**:
```
Company A Tree (London)
Company B Tree (Berlin)
Company C Tree (Paris)

Boundary: EU Consortium
Policies: Shared procurement, shared compliance
Votes: Require 75% approval from all 3 companies
```

---

## Onboarding a New Organization

### Step 1: Define Anchor
**What**: Choose real-world lat/lon for tree root

**Considerations**:
- Legal HQ location (preferred)
- Primary facility (if no HQ)
- Symbolic location (if distributed)

**Tool**: Use Cesium view to confirm location

### Step 2: Assign Steward
**What**: Designate responsible person

**Requirements**:
- Authority to define local policies
- Accountability to organization
- Commitment to maintain tree

**Onboarding**: Steward training (30 min):
- How to navigate Relay
- How to create branches/sheets
- How to delegate to operators
- How to read pressure signals

### Step 3: Define Boundary
**What**: Import GeoJSON of jurisdiction

**Sources**:
- Legal jurisdiction (country, state, city)
- Operational scope (facility radius)
- Contractual territory (sales region)

**Tool**: Load GeoJSON into `data/boundaries/`

### Step 4: Create Initial Structure
**What**: Build first trunk/branches

**Typical First Structure**:
- Trunk: Organization core
- Branch 1: Operations
- Branch 2: Governance
- Branch 3: Relationships (external)

### Step 5: Import Data
**What**: Load Excel/CSV data into cells

**Process**:
1. Prepare Excel file (clean column headers)
2. Drag + drop into Relay
3. Verify cell dependencies (formula graph)
4. Confirm tree renders correctly

### Step 6: Set Cadence
**What**: Choose governance rhythm

**Options**:
- Weekly: Fast-moving, operational
- Monthly: Deliberate, strategic
- Event-triggered: Critical only

**Default**: Monthly (most common)

---

## Offboarding / Archival

### Scenario 1: Organization Dissolves
**Process**:
1. Mark tree as "ARCHIVED"
2. Preserve all commits/history
3. Hide tree from active views
4. Keep boundary for historical reference

**Recovery**: Can be reactivated if organization reforms

### Scenario 2: Facility Closes
**Process**:
1. Archive tree at that location
2. Transfer active commitments to other trees
3. Update relationships (reroute to active facilities)

**Audit**: Closure logged, transfer logged

### Scenario 3: Merger/Acquisition
**Process**:
1. Keep both trees initially
2. Create boundary for merged entity
3. Reconcile policies over 6-12 months
4. Eventually collapse to unified tree (or keep separate if preferred)

**Rule**: Never "delete" history—always archive.

---

## Business Operations Mapping

### Operation 1: Budget Approval

**Traditional**:
1. Analyst creates budget in Excel
2. Manager reviews via email
3. Executive approves via signature
4. Finance logs in system

**In Relay**:
1. Analyst creates budget cells (formula-linked)
2. Cells appear on sheet (branch: Finance)
3. Manager reviews (sees pressure if delayed)
4. Executive approves via vote (boundary-scoped if cross-jurisdictional)
5. Approval logged as timebox commit
6. Pressure drops, cells turn green

### Operation 2: Vendor Selection

**Traditional**:
1. Procurement posts RFP
2. Vendors respond via email
3. Committee reviews proposals
4. Decision made in meeting
5. Contract signed

**In Relay**:
1. Procurement creates proposal (boundary: company)
2. Vendors submit bids (external cells, linked via relationship filaments)
3. Committee votes (boundary-scoped)
4. Quorum + approval → decision binding
5. Contract ref logged as commit
6. Relationship filament created (company ←→ vendor)

### Operation 3: Cross-Company Partnership

**Traditional**:
1. Legal drafts agreement
2. Back-and-forth email negotiations
3. Signatures collected
4. Separate systems track obligations

**In Relay**:
1. Company A proposes relationship
2. Core-routed filament appears (A ←→ B)
3. Company B reviews (sees filament in their view)
4. Both vote (boundary: shared jurisdiction or both individual)
5. Approval → relationship becomes active
6. Commitments tracked as timeboxes on relationship filament
7. Pressure accumulates if obligations unmet

---

## Financial Model (How Organizations Pay for Relay)

### Pricing Philosophy

**Rule**: Relay is coordination substrate, not SaaS.

**Avoid**:
- Per-seat pricing (discourages collaboration)
- Per-feature pricing (fragments capability)
- Tiered pricing (creates artificial scarcity)

### Proposed Models

#### Model 1: Boundary License
**What**: Pay per boundary (jurisdiction)

**Example**:
- Small company (1 boundary): $X/month
- Multi-national (10 boundaries): $10X/month

**Rationale**: Boundaries define governance scope; larger scope = more value.

#### Model 2: Tree Density
**What**: Pay based on commitment volume

**Example**:
- < 1,000 cells: $X/month
- 1,000–10,000 cells: $2X/month
- > 10,000 cells: $5X/month

**Rationale**: More commitments = more coordination value.

#### Model 3: Flat Annual
**What**: Simple annual fee per organization

**Example**: $Y/year (unlimited trees, boundaries, cells)

**Rationale**: Predictable, aligns incentives (we want you to use more, not less).

### Recommended (Phase 1)
**Flat Annual** for early adopters, transition to **Boundary License** as system matures.

---

## Support & Training

### Steward Training (Required)
**Duration**: 2 hours

**Topics**:
- Relay philosophy (stigmergy, pressure, governance)
- How to navigate (zoom, pick, inspect)
- How to create branches/sheets
- How to delegate authority
- How to read pressure signals
- How to interpret votes

**Delivery**: Video + live Q&A + practice session

### Operator Training (Optional)
**Duration**: 30 minutes

**Topics**:
- How to update cells
- How to commit to timeboxes
- How to flag issues

**Delivery**: Video tutorial

### Observer Training (Optional)
**Duration**: 15 minutes

**Topics**:
- How to explore trees
- How to read pressure
- How to submit proposals (if allowed)

**Delivery**: Interactive walkthrough

---

## Summary

**Relay Operating Model** defines:
- Business roles: Steward, Operator, Delegate, Observer
- Organizational patterns: Single tree, multi-site, consortium
- Onboarding/offboarding procedures
- Business operations mapping (budget, procurement, partnerships)
- Financial model (boundary license, tree density, flat annual)

**Relay is not software you deploy—it's a coordination substrate you inhabit.**

---

*See also*:
- [Relay for Leaders](./RELAY-FOR-LEADERS.md) - Executive summary
- [Governance Cadence](../governance/GOVERNANCE-CADENCE.md) - Decision rhythm
- [Stigmergic Coordination](../architecture/STIGMERGIC-COORDINATION.md) - How coordination emerges
