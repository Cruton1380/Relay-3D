# Relay Stage-Gate Reveal Specification
## Progressive Complexity: Single File → Department → Company → Globe → Basin Services

**Date:** 2026-02-02  
**Status:** 🔒 CANONICAL LOCK  
**Principle:** Tree always exists. Globe revealed progressively. Complexity unlocked by material engagement.

---

## 🎯 CORE PRINCIPLES (Non-Negotiable)

### **1. Tree is Always the Primary Surface**
- Globe is NOT the default view
- Globe is an **underlay** revealed by zoom + material engagement
- Tree is the cognitive anchor, never the globe

### **2. Reveal is Stage-Gated**
- Features appear only when stage gate is met
- Stage gates require **material proof** (commits, evidence, authority usage)
- NOT unlocked by curiosity clicks or time alone

### **3. Relevancy = User Push**
- **Relevancy** is measured by intentional exploration + usage
- **Push** = commits + evidence links + authority checks + timebox replay
- Zoom alone is not enough (must pair with material engagement)

### **4. Branches are Autonomous Until Linked**
- Companies work privately on their own branches by default
- No automatic aggregation
- Linking to basins (neighborhood → city → state) is **explicit via commit**

### **5. Aggregation is Opt-In + Scoped**
- Requires `LINK_TO_BASIN` commit with:
  - `from_branch_ref`
  - `to_basin_ref`
  - `scope_shared` (what data is shared)
  - `retention_policy`
  - `authority_ref` + signature
- Without LINK commit, **nothing flows to core**

---

## 📊 STAGE LADDER (What User Sees Over Time)

### **Stage 0: Single File IDE** (Default Launch)

#### **User Experience:**
```
- Start INSIDE one branch endpoint (spreadsheet/file workspace)
- Import files, see cells, filaments, timeboxes, commit boundary
- NO globe shown
- NO "world" language
- NO multi-company awareness
```

#### **Allowed Views:**
- ✅ Spreadsheet (Grid View)
- ✅ Tree Scaffold (current branch only)
- ✅ Filaments (cell causality)
- ✅ Timeboxes (commit history)
- ✅ CommitBoundaryPanel (DRAFT/HOLD/PROPOSE/COMMIT/REVERT)
- ✅ AuthorityExplorerPanel (company branch authority only)

#### **Hidden Views:**
- ❌ Globe underlay
- ❌ Department branches
- ❌ Multi-company markers
- ❌ Basin overlays
- ❌ Policy explorer (advanced)

#### **Stage Gate to Unlock Stage 1:**

**Required Material Proof:**
1. ✅ User imports at least one file
2. ✅ User completes at least one `PROPOSE → COMMIT` cycle
3. ✅ User clicks a timebox to filter/replay history (timebox engagement)

**Relevancy Signal:**
- **Push** = commits created + timebox interaction (not just browsing)

**Unlock Trigger:**
```javascript
if (state.commits.filter(c => c.type === 'COMMIT').length >= 1 &&
    state.timeboxInteractions.length >= 1 &&
    state.fileImports.length >= 1) {
    unlockStage(1);
}
```

---

### **Stage 1: Department Work** (Within One Company Branch)

#### **User Experience:**
```
- Same tree, but NOW shows multiple department endpoints
- Departments = adjacent limbs (NOT separate scenes)
- Still NO globe visible
- Company-local only
```

#### **New Reveal:**
- ✅ Multi-pane workspace (NOW / FORK / EVIDENCE panels)
- ✅ Department scopes in AuthorityExplorer (still company-local)
- ✅ Department branches visible as limbs on same tree

#### **Hidden Views:**
- ❌ Globe underlay
- ❌ Other companies
- ❌ Geographic location
- ❌ Basin services

#### **Stage Gate to Unlock Stage 2:**

**Required Material Proof:**
1. ✅ Two departments have ≥ 10 commits each (configurable threshold)
2. ✅ At least one cross-department evidence link exists
   - Example: Procurement commit references Finance evidence

**Relevancy Signal:**
- **Push** = cross-domain work (links/evidence), not UI exploration

**Unlock Trigger:**
```javascript
const depts = getDepartments();
const crossLinks = getCrossDepartmentEvidenceLinks();

if (depts.filter(d => d.commitCount >= 10).length >= 2 &&
    crossLinks.length >= 1) {
    unlockStage(2);
}
```

---

### **Stage 2: Company Work** (Private Branch + Globe Underlay Optional)

#### **User Experience:**
```
- Tree becomes "company-scale"
- Globe is NOT a mode, it's a SUBTLE UNDERLAY revealed by zooming out
- Tree remains anchored to branch (not floating)
- Still private (no other companies visible)
```

#### **New Reveal:**
- ✅ Location mapping: Company branch has geographic anchor (lat/lon)
- ✅ Globe underlay (zoom-revealed):
  - Your company region outline
  - Your company marker
  - Earth geography (subtle, not dominant)
  - **NO other companies shown**

#### **How Underlay Works:**
```javascript
// Zoom out → Globe fades IN as underlay
// Zoom in → Globe fades OUT
function updateGlobeUnderlayOpacity(camera) {
    const altitude = camera.position.length() - globeRadius;
    
    if (altitude < 20) {
        // Close to tree: Globe invisible
        globe.material.opacity = 0;
    } else if (altitude < 100) {
        // Medium distance: Globe fades in as underlay
        const fadeT = (altitude - 20) / 80;  // 0 to 1
        globe.material.opacity = fadeT * 0.3;  // Max 30% opacity
    } else {
        // Far: Globe visible but still subtle
        globe.material.opacity = 0.3;
    }
}
```

**Visual Rule:** Globe is **UNDER** the tree, not the primary surface.

#### **Hidden Views:**
- ❌ Other companies
- ❌ Multi-company markers
- ❌ Anonymized density dots
- ❌ Basin services

#### **Stage Gate to Unlock Stage 3:**

**Required Material Proof:**
1. ✅ Company has stable usage over ≥ 3 timeboxes with commits
2. ✅ Authority chain actively used:
   - At least one `AUTHORITY_GRANT`
   - At least one `STATE_TRANSITION` requiring authority check
3. ✅ Low refusal rate (<20%) OR explicit handling (refusals lead to next actions, not abandonment)

**Relevancy Signal:**
- **Push** = sustained bounded usage + governance engagement (authority, timeboxes, refusal handling)

**Unlock Trigger:**
```javascript
const timeboxesWithCommits = getTimeboxes().filter(tb => tb.commits.length > 0);
const authorityUsage = state.commits.filter(c => c.type === 'AUTHORITY_GRANT').length;
const refusalRate = calculateRefusalRate();

if (timeboxesWithCommits.length >= 3 &&
    authorityUsage >= 1 &&
    (refusalRate < 0.20 || refusalHandlingScore > 0.7)) {
    unlockStage(3);
}
```

---

### **Stage 3: Multi-Company** (Still Private by Default)

#### **User Experience:**
```
- Your tree on globe (visible)
- Other companies exist but NOT visible by default
- Optional reveal: "Other companies exist" (anonymized markers only)
```

#### **New Reveal:**
- ✅ "World existence" becomes legible without being overwhelming:
  - **Default:** Only your branch + globe geography
  - **Optional:** Anonymized density dots (no identity, no data)
    - Only if founder enables `show_company_density: true` policy
    - Dots show "companies exist here" (no names, no details)

#### **Privacy Lock:**
```javascript
// Companies are NEVER visible to each other without explicit linking
function renderCompanies(viewer) {
    const allCompanies = getCompanies();
    
    allCompanies.forEach(company => {
        if (company.id === viewer.companyId) {
            // Always show your own company
            company.mesh.visible = true;
        } else {
            // Other companies hidden by default
            company.mesh.visible = false;
            
            // Optional: Anonymized density dot (if policy enabled)
            if (policies.show_company_density && stage >= 3) {
                const dot = createAnonymousDot(company.location);
                dot.visible = true;
                scene.add(dot);
            }
        }
    });
}
```

#### **Hidden Views:**
- ❌ Other companies' branch details
- ❌ Other companies' data
- ❌ Basin services (neighborhood/city/state)
- ❌ Core aggregation

#### **Stage Gate to Unlock Stage 4:**

**Required Material Proof:**
1. ✅ Threshold number of companies meet Stage 2/3 readiness
   - Configurable threshold (e.g., N=5 companies in same region)
2. ✅ **Founder chooses to initiate private Relay services** (explicit governance decision)
   - Not automatic!
   - Requires founder commit: `SERVICE_BASIN_INITIALIZE`

**Relevancy Signal:**
- **Push** = sustained multi-company readiness + founder governance decision

**Unlock Trigger:**
```javascript
const readyCompanies = companies.filter(c => c.stage >= 2 && c.stability >= 0.7);
const founderDecision = commits.find(c => c.type === 'SERVICE_BASIN_INITIALIZE');

if (readyCompanies.length >= 5 && founderDecision) {
    unlockStage(4);
}
```

---

### **Stage 4: Neighborhood/City/State Services** (Aggregation Begins)

#### **User Experience:**
```
- NEW LAYER appears: Service Basins (neighborhood → city → state)
- Companies can OPT-IN to link into a basin
- THIS is when "branches extend down toward core" becomes visible
- Only for linked participants (everyone else stays local)
```

#### **New Reveal:**
- ✅ Aggregation views (read-only unless authorized):
  - City-level operational summaries (aggregated from linked companies)
  - State-level basins
  - Neighborhood services
- ✅ **Visual: Branches extend downward toward core** (for linked companies)
  - Linked companies: branch visibly connects to basin trunk → city trunk → state trunk → core
  - Unlinked companies: branch remains local (ends at company root)

#### **Linking Mechanism:**
```javascript
// LINK_TO_BASIN commit (explicit opt-in)
{
    type: 'LINK_TO_BASIN',
    schemaVersion: 'relay-visual-v1',
    from_branch_ref: 'company.nw',
    to_basin_ref: 'basin.city.telaviv',
    scope_shared: [
        'operational_summaries',  // What's shared
        'anonymized_metrics'
    ],
    scope_private: [
        'cell_data',             // What stays private
        'evidence_details',
        'internal_communications'
    ],
    retention_policy: 'aggregate_only',  // No raw data retention at basin level
    authority_ref: 'authority.company.nw.ceo',
    signature: 'base64...'
}

// Visual result: Company branch now visibly connects to city basin trunk
```

#### **Privacy Enforcement:**
```javascript
// Basin can see ONLY what scope_shared permits
function getBasinView(basin, company) {
    const linkCommit = findLinkCommit(company.id, basin.id);
    
    if (!linkCommit) {
        // Not linked: NO access
        return { visible: false, data: null };
    }
    
    // Linked: Return ONLY scope_shared data
    return {
        visible: true,
        data: filterByScope(company.data, linkCommit.scope_shared)
    };
}
```

#### **Still Hidden:**
- ❌ Full global view (all companies, all basins)
- ❌ Laniakea layer
- ❌ Unlinked company details

#### **Stage Gate to Unlock Stage 5 (Full System):**

**Required Material Proof:**
1. ✅ Basin stability metrics: Basin operationally coherent for ≥ 6 timeboxes
2. ✅ Multiple basins exist and are linked (city → state → national)
3. ✅ Founder chooses to reveal full system (governance decision)

---

### **Stage 5: Full System** (Globe → Laniakea)

#### **User Experience:**
```
- Full zoom range: Laniakea → Globe → Region → Company → Cell
- All linked basins visible
- Unlinked companies still private (density dots only if opted-in)
```

#### **New Reveal:**
- ✅ Laniakea cosmic context (zoom level 6)
- ✅ Full basin network visible (for linked participants)
- ✅ National/state aggregation views
- ✅ Full policy explorer

**Still Enforced:**
- 🔒 Unlinked companies remain private
- 🔒 Raw data never aggregates (only summaries as per scope_shared)
- 🔒 All aggregation has clear lineage (which LINK commits created it)

---

## 🔑 PROGRESSIVE REVEAL MECHANISM

### **"Push" Definition (Not Zoom Alone)**

Reveal requires **TWO conditions:**

1. **Intent Vector:** User navigates/zooms toward a level (dept/company/globe/basin)
2. **Material Proof:** User has done relevant work at that level

**Material Proof Types:**
- Commits created (engagement)
- Evidence links (cross-domain work)
- Timebox replay usage (history exploration)
- Authority checks used (governance engagement)

**If EITHER missing:**
- Show **preview silhouette** (ghosted outline)
- Show **unlock hint** ("Complete X to reveal Y")
- Do NOT show full detail

---

### **Implementation Rule:**

```javascript
function shouldReveal(featureKey, user) {
    const intent = user.navigationPath.includes(featureKey);  // Zoomed toward it
    const materialProof = getMaterialProof(user, featureKey);
    
    if (intent && materialProof >= threshold) {
        return 'FULL';  // Full reveal
    } else if (intent) {
        return 'SILHOUETTE';  // Preview only
    } else {
        return 'HIDDEN';  // Not visible
    }
}

// Example
const globeReveal = shouldReveal('globe_underlay', currentUser);
if (globeReveal === 'FULL') {
    globe.material.opacity = 0.3;
} else if (globeReveal === 'SILHOUETTE') {
    globe.material.opacity = 0.05;  // Faint outline
    showUnlockHint('Complete 3 timeboxes with commits to reveal geography');
} else {
    globe.material.opacity = 0;
}
```

---

## 🏛️ FOUNDER/CEO AUTHORITY MODEL (Fractal)

### **Principle: CEO = Root Steward, Not Hidden God-Mode**

**Every basin has a CEO. The system itself is the top-most basin.**

| Level | CEO Exists? | Authority Visible? | Forkable? |
|-------|-------------|-------------------|-----------|
| System (Relay) | ✅ Founder | ✅ GENESIS commit | ✅ Yes |
| Organization | ✅ Org CEO | ✅ AUTHORITY_GRANT | ✅ Yes |
| Department | ✅ Head | ✅ AUTHORITY_GRANT | ✅ Yes |
| Project | ✅ Owner | ✅ AUTHORITY_GRANT | ✅ Yes |
| Sheet/Model | ✅ Author | ✅ AUTHORITY_GRANT | ✅ Yes |

---

### **Founder Authority Scope (Configurable at Genesis)**

#### **GENESIS_AUTHORITY_GRANT Commit:**
```javascript
{
    type: 'GENESIS_AUTHORITY_GRANT',
    schemaVersion: 'relay-visual-v1',
    timestamp: Date.now(),
    
    authority: {
        authority_id: 'authority.root.founder',
        holder_id: 'user.founder',
        scope: 'SYSTEM',  // Top-level
        capabilities: [
            'INITIALIZE_CANON',
            'DEFINE_POLICY',
            'GRANT_AUTHORITY',
            'REVOKE_AUTHORITY',
            'INITIALIZE_BASIN',
            'SET_STAGE_GATE_THRESHOLDS'
        ],
        expiry: null,  // Founder authority doesn't expire (but can be delegated)
        constraints: {
            // Even founder must obey physics
            requires_evidence_refs: true,
            subject_to_pressure_budget: true,
            actions_are_commits: true,  // NO hidden actions
            decisions_are_replayable: true
        }
    },
    
    initial_canon: {
        canon_ref: 'canon.relay.v1.0',
        rules: ['append_only', 'explicit_authority', 'pressure_not_command'],
        policies: [...],  // Initial policy filaments
        stage_gates: [...] // Initial stage gate thresholds
    },
    
    signature: 'base64...'
}
```

#### **What Founder CAN Do:**
- ✅ Set initial canon rules
- ✅ Define initial policies
- ✅ Configure initial delegation structure
- ✅ Set initial refusal thresholds
- ✅ Set initial pressure budgets
- ✅ Set initial stage gate thresholds
- ✅ Initialize basin services (when stage 4 is ready)

#### **What Founder CANNOT Do:**
- ❌ Hide authority (all grants visible via AuthorityExplorer)
- ❌ Make decisions outside commits (NO hidden actions)
- ❌ Override pressure budget without explicit override commit
- ❌ Block forks (anyone can fork at any time)
- ❌ Make canon unquestionable (canon always carries confidence + dissent_count)

---

### **Canon Initialization is Allowed, Canon Capture is Not**

**Distinction:**

✅ **Founder sets initial canon** (leadership)
```javascript
{
    type: 'CANON_INITIALIZE',
    canon_ref: 'canon.relay.v1.0',
    rules: [...],
    authority_ref: 'authority.root.founder'
}
```

❌ **Canon cannot become unquestionable truth** (prevents capture)
```javascript
// Every canon ALWAYS carries:
{
    canon_ref: 'canon.relay.v1.0',
    authority_ref: 'authority.root.founder',
    evidence_refs: [...],            // Required
    confidence: 0.85,                 // Required
    dissent_count: 3,                 // Required (visible)
    last_updated: timestamp,
    alternatives: ['canon.relay.fork-a', 'canon.relay.fork-b']  // Forks visible
}
```

---

### **CEO Has Right to Decide, Not Right to Hide**

**Implementation Rule:**

```javascript
// ALL CEO actions must be commits
function ceoAction(action, authority) {
    if (authority.authority_id !== 'authority.root.founder') {
        throw new Error('Not CEO');
    }
    
    // Even CEO must create commit
    const commit = {
        type: action.type,
        authority_ref: authority.authority_id,
        evidence_refs: action.evidence_refs,  // REQUIRED
        reason: action.reason,                 // REQUIRED
        signature: sign(action, authority.privateKey)
    };
    
    // Commit is visible, replayable, queryable
    appendCommit(commit);
}

// If someone doesn't like CEO's choice:
// - They can fork
// - They can dissent (dissent_count visible)
// - They can leave
// Just like real world, but without ambiguity
```

---

## 🔗 DATA SEPARATION AND LINKING

### **Default: Branches are Isolated**

```
Company A Branch (Tel Aviv)
  - Data: Private
  - Commits: Private
  - Evidence: Private
  - Authority: Company-local

Company B Branch (Haifa)
  - Data: Private
  - Commits: Private
  - Evidence: Private
  - Authority: Company-local

NO automatic aggregation
NO cross-company visibility
```

---

### **Linking is Explicit (LINK_TO_BASIN Commit)**

```javascript
// Company opts-in to neighborhood basin service
{
    type: 'LINK_TO_BASIN',
    schemaVersion: 'relay-visual-v1',
    timestamp: Date.now(),
    
    from_branch_ref: 'company.nw',
    to_basin_ref: 'basin.neighborhood.telaviv_business_district',
    
    scope_shared: [
        'operational_summaries',      // Aggregated metrics only
        'anonymized_divergence_count',
        'service_requests'
    ],
    
    scope_private: [
        'cell_data',                 // STAYS PRIVATE
        'evidence_details',
        'internal_authority',
        'vendor_contracts',
        'customer_data'
    ],
    
    retention_policy: 'aggregate_only',  // Basin cannot retain raw data
    
    aggregation_rules: {
        method: 'summary_only',
        no_raw_data: true,
        pseudonymized: true,
        time_bounded: true  // Data older than N timeboxes auto-purges
    },
    
    authority_ref: 'authority.company.nw.ceo',
    signature: 'base64...'
}
```

---

### **Visual Result of Linking:**

**Before LINK Commit:**
```
Company Branch (floating)
  ↓
  (ends at company root)
```

**After LINK Commit:**
```
Company Branch
  ↓
  ⚡ LINK visible (golden connection)
  ↓
Neighborhood Basin Trunk
  ↓
City Basin Trunk
  ↓
State Trunk
  ↓
National Trunk
  ↓
Earth Core (0,0,0)
```

**Privacy:** Unlinked companies still see their branch ending at company root (no core connection visible).

---

## 🎨 ZOOM-TO-UNDERLAY BEHAVIOR

### **Zoom Behavior by Stage:**

| Stage | Zoom Out Behavior | Globe Visibility |
|-------|-------------------|------------------|
| **0-1** | N/A (no zoom out) | Hidden (opacity: 0) |
| **2** | Reveals globe underlay | Fades in 0→30% |
| **3** | Globe + optional density | 30% + dots |
| **4** | Globe + basins (if linked) | 30-50% + basin overlays |
| **5** | Full system | Full opacity |

### **Implementation:**

```javascript
function updateRevealByStage(camera, currentStage) {
    const altitude = camera.position.length() - 100;
    
    switch(currentStage) {
        case 0:
        case 1:
            // No globe reveal
            globe.visible = false;
            break;
            
        case 2:
            // Globe underlay (subtle)
            globe.visible = true;
            if (altitude < 20) {
                globe.material.opacity = 0;
            } else {
                const fadeT = Math.min((altitude - 20) / 80, 1);
                globe.material.opacity = fadeT * 0.3;  // Max 30%
            }
            break;
            
        case 3:
            // Globe + optional density dots
            globe.material.opacity = 0.3;
            if (policies.show_company_density) {
                anonymousDots.forEach(dot => dot.visible = true);
            }
            break;
            
        case 4:
            // Globe + basins (for linked companies)
            globe.material.opacity = 0.5;
            basins.forEach(basin => {
                if (isLinkedToBasin(currentUser.companyId, basin.id)) {
                    basin.mesh.visible = true;
                }
            });
            break;
            
        case 5:
            // Full system
            globe.material.opacity = 1.0;
            laniakea.visible = (altitude > 400);
            break;
    }
}
```

---

## 🛡️ ANTI-MISUSE GOVERNANCE LOCKS

### **Lock 1: Canon Protection Against Narrative Domination**

**Risk:** Coordinated groups vote one canon branch into "operative truth" regardless of evidence.

**Mitigation:**

```javascript
// Canon changes must have minimum evidence threshold
{
    type: 'CANON_UPDATE',
    canon_ref: 'canon.relay.v1.1',
    evidence_refs: [...],  // REQUIRED
    min_evidence_count: 3,  // Configurable
    confidence: 0.75,       // REQUIRED
    dissent_count: 2,       // VISIBLE
    
    // Canon election constraints
    scope: 'region.israel.telaviv',  // Scope-bound (not global)
    as_of_timebox: 'timebox.2026.W05',
    label: 'operative canon (as-of-now, not eternal truth)'
}

// Canon churn limiter
if (canonFlipsInLastNTimeboxes(5) > 3) {
    // Too much churn: enter DEGRADED
    state.canonState = 'DEGRADED';
    console.warn('Canon flipping too frequently - require more evidence or longer window');
}
```

**Minority Safety:**
```javascript
// Non-canon branches remain first-class
ui.showCanonBranches({
    current_canon: {
        visible: true,
        label: 'Operative Canon (as-of-now)',
        badge: '⭐'
    },
    alternatives: {
        visible: true,
        label: 'Alternative Canons',
        access: 'one_click'  // Not buried
    }
});
```

---

### **Lock 2: Refusal Ergonomics (Refusal as Guided Fork, Not Wall)**

**Risk:** Users feel blocked and rebel against refusal-first system.

**Mitigation:**

```javascript
// Every refusal MUST include next actions
{
    type: 'REFUSAL',
    reason_code: 'INSUFFICIENT_AUTHORITY',
    missing_inputs: ['authority.dept.procurement.manager'],
    
    next_actions: [  // REQUIRED
        {
            action: 'REQUEST_AUTHORITY',
            from: 'authority.dept.procurement.manager',
            how: 'Click "Request Authority" button',
            expected_time: '< 1 timebox'
        },
        {
            action: 'ATTACH_EVIDENCE',
            what: 'Vendor quote document',
            how: 'Drag evidence file here',
            expected_time: 'immediate'
        },
        {
            action: 'OPEN_FORK',
            why: 'Work privately until authority granted',
            how: 'Click "Create Fork" button',
            expected_time: 'immediate'
        }
    ],
    
    time_to_retry: 3600,  // Seconds (if pressure budget)
    
    // UI CRITICAL: Refusal feels like guided fork, not dead end
    ui_tone: 'GUIDE'  // Not 'BLOCK'
}
```

**UI Rule:**
> *"Refusal must feel like a guided fork in the road, not a 'no'."*

---

### **Lock 3: Policy Transparency + Accountability**

**Risk:** Someone configures Relay to be "legible but unbearable" (extreme proof requirements, friction defaults).

**Mitigation:**

```javascript
// Policy transparency: Every gate/threshold inspectable
ui.addPanel('PolicyInspector', {
    show: 'Why is this hard right now?',
    data: {
        active_policies: [...],
        current_thresholds: {...},
        refusal_reasons: [...],
        policy_causing_backlog: 'policy.evidence.minimum_3_sources'  // Flagged
    }
});

// Policy pressure budget: Policies that create too many refusals get flagged
function calculatePolicyPressure(policy) {
    const refusalsFromPolicy = commits.filter(c => 
        c.type === 'REFUSAL' && c.policy_ref === policy.id
    );
    
    const refusalRate = refusalsFromPolicy.length / totalAttempts;
    
    if (refusalRate > 0.4) {
        // Policy causing >40% refusals: FLAG IT
        policy.pressure_state = 'HIGH';
        policy.visible_flag = '⚠️ Policy causing backlog';
    }
}

// Governance abuse becomes VISIBLE (not hidden)
```

---

### **Lock 4: UI ≠ Authority**

**Risk:** "Capturing operating state" - UI becomes treated as authoritative.

**Mitigation:**

```javascript
// HARD RULE: Projections are NEVER executable
ui.markProjection({
    label: 'Projected Monthly Cost',
    value: '$45,000',
    type: 'PROJECTION',  // NOT COMMIT
    badge: '📊',
    executable: false,  // Cannot be clicked to commit
    source: 'Derived from commits X, Y, Z'
});

// UI can ONLY propose; execution must be commit
button.onClick = () => {
    createProposal({
        type: 'CELL_SET',
        value: newValue,
        state: 'PROPOSE'  // NOT COMMIT (requires authority check)
    });
};

// Persist-before-emit for feeds (no "phantom reality")
function emitFeedUpdate(update) {
    const commit = persistCommit(update);  // Write first
    if (commit.state === 'COMMIT') {
        broadcastToFeed(commit);  // Emit only after persisted
    }
}

// No "latest" for policy; only pinned policy refs
policy_ref: 'policy.evidence.v1.2'  // Pinned
// NOT: policy_ref: 'policy.evidence.latest'  // FORBIDDEN
```

---

### **Lock 5: Humane Adoption - 2D Bridge Lens**

**Risk:** People keep trusting old dashboard because it feels smoother (transition failure).

**Solution: 2D Bridge Lens** (temporary, not permanent)

```javascript
// Show what legacy system claims vs what Relay verifies
ui.add2DBridgeLens({
    columns: [
        {
            title: 'Legacy System Claims',
            data: legacyDashboard.data,
            badge: '📊 PROJECTION',
            style: 'ghosted'
        },
        {
            title: 'Relay Verified',
            data: relay.commits.filter(c => c.state === 'COMMIT'),
            badge: '✅ COMMIT',
            style: 'solid'
        },
        {
            title: 'Missing',
            data: diff(legacyDashboard.data, relay.commits),
            badge: '❌ NOT VERIFIED',
            style: 'strikethrough'
        }
    ]
});

// Mark legacy state as projection unless attested
legacyData.forEach(item => {
    const relayCommit = findMatchingCommit(item);
    if (!relayCommit) {
        item.label += ' (UNVERIFIED - legacy projection)';
        item.style = 'ghosted';
    }
});
```

**Purpose:** Prevents adoption failure by making legacy data explicitly marked as unverified.

---

## 📋 CANON IMPLEMENTATION TASKS

### **Task 1: StageGate Engine**

**New Module:** `src/stageGate/StageGateEngine.js`

```javascript
class StageGateEngine {
    constructor(state) {
        this.state = state;
        this.currentStage = 0;
        this.unlockHistory = [];
    }
    
    computeStage() {
        // Check Stage 0 → 1 gate
        if (this.checkStage1Gate()) {
            this.unlockStage(1);
        }
        // Check Stage 1 → 2 gate
        if (this.currentStage >= 1 && this.checkStage2Gate()) {
            this.unlockStage(2);
        }
        // ... etc
    }
    
    isUnlocked(featureKey) {
        const featureStage = FEATURE_STAGES[featureKey];
        return this.currentStage >= featureStage;
    }
    
    unlockStage(stage) {
        if (stage > this.currentStage) {
            this.currentStage = stage;
            
            // Log unlock as commit (recoverable)
            const unlockCommit = {
                type: 'STAGE_UNLOCK',
                stage: stage,
                timestamp: Date.now(),
                material_proof: this.getMaterialProof(stage)
            };
            
            this.state.commits.push(unlockCommit);
            this.unlockHistory.push(unlockCommit);
            
            console.log(`[Relay] 🔓 Stage ${stage} unlocked`);
            this.notifySubscribers(stage);
        }
    }
    
    getMaterialProof(stage) {
        // Return what evidence triggered unlock
        switch(stage) {
            case 1:
                return {
                    commits: this.state.commits.filter(c => c.state === 'COMMIT').length,
                    timeboxInteractions: this.state.timeboxInteractions.length,
                    fileImports: this.state.fileImports.length
                };
            // ... etc
        }
    }
}
```

---

### **Task 2: Reveal Controller**

**New Module:** `src/rendering/RevealController.js`

```javascript
class RevealController {
    constructor(scene, stageGate) {
        this.scene = scene;
        this.stageGate = stageGate;
    }
    
    update(camera) {
        const stage = this.stageGate.currentStage;
        
        // Globe underlay opacity
        this.updateGlobeOpacity(camera, stage);
        
        // Basin overlays
        this.updateBasinVisibility(stage);
        
        // Multi-company markers
        this.updateCompanyMarkers(stage);
        
        // Advanced panels
        this.updatePanelVisibility(stage);
    }
    
    updateGlobeOpacity(camera, stage) {
        if (stage < 2) {
            // Stage 0-1: No globe
            globe.visible = false;
        } else if (stage === 2) {
            // Stage 2: Underlay (zoom-revealed)
            globe.visible = true;
            const altitude = camera.position.length() - 100;
            const fadeT = THREE.MathUtils.clamp((altitude - 20) / 80, 0, 1);
            globe.material.opacity = fadeT * 0.3;  // Max 30% opacity
        } else {
            // Stage 3+: More visible
            globe.material.opacity = 0.3 + (stage - 2) * 0.1;
        }
    }
}
```

---

### **Task 3: LINK_TO_BASIN Commit Handler**

**New File:** `src/commits/LinkToBasinCommit.js`

```javascript
function handleLinkToBasinCommit(commit) {
    // Validate commit
    if (!commit.from_branch_ref || !commit.to_basin_ref) {
        throw new Error('LINK_TO_BASIN missing required fields');
    }
    
    // Verify authority
    const authority = getAuthority(commit.authority_ref);
    if (!authority.capabilities.includes('LINK_TO_BASIN')) {
        return createRefusal('INSUFFICIENT_AUTHORITY', commit);
    }
    
    // Create visual link (golden connection)
    const fromBranch = scene.getObjectByName(commit.from_branch_ref);
    const toBasin = scene.getObjectByName(commit.to_basin_ref);
    
    const linkCurve = new THREE.LineCurve3(
        fromBranch.position,
        toBasin.position
    );
    
    const linkGeometry = new THREE.TubeGeometry(linkCurve, 20, 0.15, 8);
    const linkMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,  // Golden (link)
        emissive: 0xFFD700,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7
    });
    
    const linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);
    linkMesh.userData = {
        type: 'basinLink',
        commit_ref: commit.id,
        from: commit.from_branch_ref,
        to: commit.to_basin_ref,
        scope_shared: commit.scope_shared
    };
    
    scene.add(linkMesh);
    
    // Store link in state
    state.basinLinks.push({
        from: commit.from_branch_ref,
        to: commit.to_basin_ref,
        scope_shared: commit.scope_shared,
        scope_private: commit.scope_private,
        retention_policy: commit.retention_policy
    });
}
```

---

## 📘 CANONICAL STATEMENT (For Documentation)

**Official Relay Statement on Governance:**

> *"Relay is fractal. Every basin has a CEO.*  
> *The system itself is no exception.*  
> *Leadership is explicit, authority is scoped, and power is always visible.*  
>   
> *The CEO has the right to decide — not the right to hide.*  
> *All CEO actions are commits, all policies are filaments, all authority is queryable.*  
>   
> *If you disagree with leadership: you can fork, dissent, or leave.*  
> *Just like the real world — but without ambiguity."*

---

## ✅ STAGE-GATE SUMMARY

### **Stage Progression:**

```
Stage 0: Single File IDE (default launch)
  ↓ (import + commit + timebox interaction)
Stage 1: Department Work (multi-pane, company-local)
  ↓ (2 depts, 10+ commits each, cross-dept evidence)
Stage 2: Company Work (globe underlay optional)
  ↓ (3+ timeboxes, authority usage, low refusal rate)
Stage 3: Multi-Company (anonymized density optional)
  ↓ (threshold companies ready + founder decision)
Stage 4: Basin Services (neighborhood/city/state)
  ↓ (basin stability + multi-basin linking)
Stage 5: Full System (Laniakea → Core)
```

### **Key Rules:**

- 🔒 Globe never default at launch
- 🔒 Reveal requires intent + material proof
- 🔒 Companies private until explicitly linked
- 🔒 Linking via LINK_TO_BASIN commit (opt-in)
- 🔒 Founder/CEO authority explicit and visible
- 🔒 All CEO actions are commits
- 🔒 Canon always carries confidence + dissent_count

---

**The system grows from simple to complex, from local to global, from private to basin-linked.**  
**Complexity is unlocked by achievement, not by default.**

🌱 **Single File → Department → Company → Globe → Basin Services → Laniakea**

**Stage gates prevent overwhelming users. Local autonomy prevents forced aggregation.**
