# 🔒 PROMPT FOR CLAUDE: Implement Continuous Verification Pressure System

**Transform Existing Codebase to Production-Safe, Regulator-Ready System**

**Date**: 2026-01-31  
**Status**: READY FOR EXECUTION  
**Priority**: CRITICAL

---

## 🎯 MISSION

Claude, you are implementing Relay's **Continuous Verification Pressure System** by transforming the existing state-drift codebase to align with locked philosophy, five enforced invariants, and production-safe language.

**You must:**
1. Transform all adversarial language to safe, defensive terminology
2. Implement five hardened invariants that enforce system safety
3. Build the Pressure Feed and ERI calculation systems
4. Ensure all operations are consensual, authorized, and auditable
5. Never enable intrusion, exploitation, or offensive capabilities

---

## 🔒 LOCKED PRINCIPLES (NON-NEGOTIABLE)

### **The Canonical Statement (Use Everywhere)**

> **In Relay, every user becomes a coherence operator.** Security is not a separate profession; it is continuous verification. The system runs under constant pressure tests—**consensual, non-destructive audits** that detect fragmented state via a **three-way match** (intent, observed reality, projection). Repair is staged as signed artifacts and executed only with **explicit authority**, then verified by replayable attestations. This pressure does not attack systems; it **removes attacker advantage** by closing exposure windows faster than they can be exploited. Under continuous audit pressure, 2D systems don't "get conquered"—they **become non-viable** unless they adopt append-only truth, explicit authority, and integrity proofs.

### **Core Definitions (MUST USE)**

1. **Cyber Skill** = Audit Literacy + Repair Discipline (NOT intrusion)
2. **Pressure** = Continuous Reconciliation via 6-step loop
3. **Root Reconciliation** = 4 mechanics: integrity proofs, keyed attestation, deterministic replay, checkpoint verification
4. **2D Systems** = Non-competitive (NOT conquered/destroyed)

### **Two Privacy/Governance Principles (MUST ADD)**

**Privacy Principle:**
> "Pressure is continuous verification, not continuous surveillance: minimum required data, shortest required retention, strictest required scope."

**Governance Principle:**
> "Relay learns by writing recommendations, not by mutating policy."

### **The Pressure Principle (ENFORCE)**

> "Pressure reveals. Pressure reconciles. Pressure never destroys."

**This is enforced by architecture, not hope.**

---

## 🔐 FIVE INVARIANTS (MUST IMPLEMENT)

### **Invariant 1: Pressure Budget**
```
Pressure frequency and depth are policy-bound and capacity-aware.
Excess pressure produces refusal, not overload.
```

**Implementation Required:**
- `PressureBudgetEnforcer` class
- Global limits: CPU, memory, bandwidth
- Per-anchor limits: audit frequency, cooldown
- Adaptive scaling based on load
- Refusal signaling (exit gracefully, never crash)

---

### **Invariant 2: Confidence Floor**
```
Any ERI score below minimum confidence must be displayed as "indeterminate," not safe.
```

**Implementation Required:**
- `ConfidenceFloorEnforcer` class
- Confidence calculation for all ERI scores
- Three display states: verified (green), degraded (yellow), indeterminate (gray)
- Missing input tracking
- UI components for each state

---

### **Invariant 3: Repair Effectiveness**
```
Track which repair artifacts actually close exposure over time.
System learns which fixes work, which policies are brittle.
```

**Implementation Required:**
- `RepairEffectivenessTracker` class
- Measurement schedule: immediate, 1h, 24h post-repair
- Effectiveness scoring: improvement × durability
- Learning database for repair policies
- Generate recommendations (NOT auto-apply)

---

### **Invariant 4: Data Minimization + Purpose Limitation**
```
Pressure is continuous verification, not continuous surveillance.
Collect minimum data, shortest retention, strictest scope.
```

**Implementation Required:**
- `DataMinimizationEnforcer` class
- Whitelist of allowed telemetry (NOT blacklist)
- Aggregation by default, raw opt-in only
- Time-bounded retention with auto-expiration
- PII redaction rules
- Role-based view filters
- Pseudonymization support

---

### **Invariant 5: Learning Cannot Auto-Change Policy**
```
RepairEffectivenessTracker generates recommendations only.
All policy changes require explicit authorityRef and versioned commit.
```

**Implementation Required:**
- `PolicyGovernanceEnforcer` class
- `POLICY_RECOMMENDATION` commit type
- Recommendation → authority approval → policy version commit workflow
- Learning engine CANNOT call policy change directly
- All policy changes create NEW versions (never mutate)

---

## 📋 SAFE LANGUAGE TRANSLATION (MANDATORY)

**Replace ALL instances of these terms:**

| ❌ NEVER USE | ✅ ALWAYS USE |
|--------------|---------------|
| attack | audit |
| war-game | verification scenario |
| attacker | coherence operator |
| exploit | exposure precondition / drift |
| penetration test | integrity check |
| infiltrate | verify |
| breach | exposure condition |
| takeover | authorized audit |
| mass suppression | coordinated reconciliation |
| conquer/destroy | render non-viable / non-competitive |
| hack | audit / verify |

**This applies to:**
- All code (variables, functions, classes, comments)
- All UI text (buttons, labels, tooltips)
- All API routes and responses
- All documentation
- All log messages

---

## 🎯 THE 6-STEP PRESSURE LOOP (IMPLEMENT THIS)

```javascript
async function pressureLoop() {
  while (true) {
    // INVARIANT 1: Check pressure budget
    if (!budgetEnforcer.canApplyPressure()) {
      emit('pressure_refusal', { reason: 'budget_exceeded' })
      await sleep(backoffTime)
      continue
    }
    
    // INVARIANT 4: Collect minimal data only
    const attestations = await collectAttestations()
    const minimized = dataMinimizer.collectTelemetry(attestations)
    
    // 1. ATTEST - Anchors sign state
    const signed_attestations = await signAttestations(minimized)
    
    // 2. COMPARE - Three-way match
    const comparisons = threeWayMatch.compare(signed_attestations)
    
    // 3. SCORE - ERI + confidence
    const raw_eri = eriCalculator.calculate(comparisons)
    
    // INVARIANT 2: Enforce confidence floor
    const displayable_eri = confidenceEnforcer.enforce(raw_eri)
    
    if (displayable_eri.display === 'indeterminate') {
      emit('indeterminate_eri', {
        confidence: displayable_eri.confidence,
        missing_inputs: displayable_eri.missing_inputs
      })
      await requestAdditionalTelemetry(displayable_eri.missing_inputs)
      continue
    }
    
    // 4. STAGE - Repairs (signed artifacts)
    if (displayable_eri.display === 'critical') {
      const repair = await stageRepair(displayable_eri)
      
      // 5. VERIFY - Execute ONLY if authorized
      if (await authorityManager.isAuthorized(repair)) {
        const result = await authorityManager.executeRepair(repair)
        
        // INVARIANT 3: Track effectiveness
        const effectiveness = await effectivenessTracker.track(repair)
        
        // INVARIANT 5: Generate recommendation, NOT auto-apply
        if (effectiveness.score < 0.5) {
          await policyGovernance.proposeChange(repair, effectiveness)
        }
      }
    }
    
    // 6. CHECKPOINT - Hash-chained proof
    await commitCheckpoint()
    
    await sleep(100)  // 10 Hz continuous
  }
}
```

---

## 📂 EXISTING FILES TO TRANSFORM

### **Backend Files (Change Language + Add Invariants)**

**`src/backend/state-drift/stateDriftEngine.mjs`**
- RENAME TO: `src/backend/verification/continuousVerificationEngine.mjs`
- REPLACE: All "exploit" → "exposure precondition"
- REPLACE: All "attack" → "audit"
- ADD: Pressure budget checking
- ADD: Confidence tracking
- REMOVE: Any auto-correction without authority

**`src/backend/state-drift/scvAgent.mjs`**
- RENAME TO: `src/backend/verification/coherenceAgent.mjs`
- REPLACE: `executeWarGame` → `executeVerificationScenario`
- REPLACE: `takeSilentControl` → `beginAuthorizedAudit`
- ADD: Consent verification before all operations
- ADD: authorityRef requirement
- REMOVE: Any "silent" operations

**`src/backend/state-drift/scvOrchestrator.mjs`**
- RENAME TO: `src/backend/verification/coherenceOrchestrator.mjs`
- REPLACE: `triggerMassSuppression` → `coordinatedReconciliation`
- ADD: Pressure budget tracking
- ADD: Refusal state handling
- UPDATE: All metrics to use safe language

**`src/backend/routes/stateDrift.mjs`**
- RENAME TO: `src/backend/routes/continuousVerification.mjs`
- UPDATE: All routes `/api/state-drift/*` → `/api/verification/*`
- ADD: Consent middleware
- ADD: Authority verification middleware
- UPDATE: All responses to include confidence

---

### **Frontend Files (Change Language + Add States)**

**`src/frontend/pages/StateDriftGlobeHUD.jsx`**
- RENAME TO: `src/frontend/pages/VerificationGlobeHUD.jsx`
- REPLACE: "Mass Suppression" button → "Coordinated Reconciliation"
- REPLACE: "War Games" → "Verification Scenarios"
- ADD: ERI three-state display (verified/degraded/indeterminate)
- ADD: Confidence indicators
- ADD: "HOLD to explain" functionality
- UPDATE: All UI text with safe language

**`src/frontend/App.jsx`**
- UPDATE: Route `/state-drift-hud` → `/verification-hud`
- UPDATE: Import statement

---

## 🆕 NEW FILES TO CREATE

### **Backend - Invariant Enforcers**

1. `src/backend/verification/pressureBudgetEnforcer.mjs`
2. `src/backend/verification/confidenceFloorEnforcer.mjs`
3. `src/backend/verification/repairEffectivenessTracker.mjs`
4. `src/backend/verification/dataMinimizationEnforcer.mjs`
5. `src/backend/verification/policyGovernanceEnforcer.mjs`

### **Backend - Core Systems**

6. `src/backend/verification/eriCalculator.mjs` - ERI calculation with confidence
7. `src/backend/verification/threeWayMatch.mjs` - Intent/reality/projection matching
8. `src/backend/verification/pressureFeed.mjs` - SSE feed for live pressure
9. `src/backend/verification/pressureActions.mjs` - Seven safe operations
10. `src/backend/verification/pressureLoop.mjs` - 6-step continuous loop
11. `src/backend/verification/consentManager.mjs` - Consent verification
12. `src/backend/verification/authorityManager.mjs` - Authority verification & staging

### **Backend - Routes**

13. `src/backend/routes/pressureFeed.mjs` - SSE endpoint
14. `src/backend/routes/pressureActions.mjs` - Action endpoints

### **Frontend - Components**

15. `src/frontend/components/verification/ERIDisplay.jsx` - Three-state ERI
16. `src/frontend/components/verification/PressureFeedPanel.jsx` - Live feed
17. `src/frontend/components/verification/ConfidenceIndicator.jsx` - Confidence badge
18. `src/frontend/components/verification/RepairStagingPanel.jsx` - Repair workflow

### **Tools - Linter**

19. Complete `tools/relay-lint/` directory structure (see implementation plan)
20. `relay/lint/rule_catalog/relay-lint-rules-v1.1.json`
21. `relay/lint/rule_catalog/overlays/*.overlay.json`

---

## 🔍 REFERENCE DOCUMENTS (READ THESE FIRST)

**Before implementing, READ these locked documents:**

1. **`documentation/CANONICAL-RELAY-STATEMENT.md`** - Official language and definitions
2. **`documentation/TECHNICAL/PRESSURE-SYSTEM-INVARIANTS.md`** - All five invariants (detailed)
3. **`documentation/TECHNICAL/PRESSURE-FEED-SPECIFICATION.md`** - Pressure Feed and Actions specs
4. **`documentation/RELAY-LOCKS-SUMMARY.md`** - Quick reference of all locks
5. **`PRODUCTION-READY-COMPLETE.md`** - Final readiness checklist

---

## ⚠️ ABSOLUTE PROHIBITIONS

**NEVER implement:**
- ❌ Exploit enumeration or step-by-step attack instructions
- ❌ Offensive intrusion capabilities
- ❌ Auto-escalation of privileges
- ❌ Silent state mutations without authority
- ❌ Covert data collection
- ❌ Auto-execution of repairs
- ❌ Policy changes without authority approval
- ❌ Claims of "unhackable" or "secure"

**ALWAYS implement:**
- ✅ Exposure precondition detection (observable facts)
- ✅ Consensual, authorized operations only
- ✅ Staged repairs requiring explicit approval
- ✅ Confidence tracking and honest uncertainty
- ✅ Privacy-preserving data collection
- ✅ Append-only audit trails
- ✅ Refusal states (never silent failures)

---

## 📊 IMPLEMENTATION ORDER (FOLLOW EXACTLY)

### **Step 1: Read All Locked Documents** (30 minutes)
- Read canonical statement
- Read all five invariants
- Read pressure feed specification
- Understand safe language translation

### **Step 2: Language Transformation** (Week 1 - CRITICAL)
- Rename all files (state-drift → verification)
- Replace all adversarial terms with safe terms
- Update all API routes
- Update all UI text
- Update all documentation references

### **Step 3: Add Consent & Authority Framework** (Week 1)
- Implement ConsentManager
- Implement AuthorityManager
- Add consent checks to all operations
- Add authorityRef requirements
- Implement repair staging (NO auto-execution)

### **Step 4: Implement Five Invariants** (Weeks 2-3)
- Implement PressureBudgetEnforcer
- Implement ConfidenceFloorEnforcer
- Implement RepairEffectivenessTracker
- Implement DataMinimizationEnforcer
- Implement PolicyGovernanceEnforcer
- Integrate ALL into main pressure loop

### **Step 5: Build ERI System** (Week 3)
- Implement ERICalculator with confidence
- Implement ThreeWayMatchEngine
- Implement condition taxonomy (V, C, P, A, R)
- Add missing input tracking
- Create three-state display components

### **Step 6: Build Pressure Feed** (Week 4)
- Implement SSE endpoint
- Six feed categories
- Real-time streaming
- Role-based filtering
- Pseudonymization

### **Step 7: Build Pressure Actions** (Week 4)
- Seven safe operations
- All require appropriate authority
- All logged to audit trail
- All consensual

### **Step 8: Build relay-lint:defense** (Weeks 5-6)
- Set up tools/relay-lint structure
- Implement 10 core rules
- Add semantic scanners
- Add runtime-contract scanners
- Add sector overlays
- Wire to CI/CD

### **Step 9: Update Documentation** (Week 7)
- Rename all docs with safe language
- Add canonical paragraph everywhere
- Add invariants documentation
- Update quick-start guides

### **Step 10: Testing & Verification** (Week 8)
- Create fixtures for all scenarios
- Run relay-lint:defense
- Run fixtures:assert-all
- Verify all invariants enforced
- Check all language transformed

---

## 📝 CODE EXAMPLES (FOLLOW THESE PATTERNS)

### **Example 1: Transformation Pattern**

```javascript
// ❌ OLD (UNSAFE)
async executeWarGame(warGame, devices) {
  const simulation = {
    attacksSimulated: 0,
    vulnerabilitiesFound: 0
  }
  
  for (const phase of warGame.phases) {
    await this.simulateAttack(phase, devices)
  }
}

// ✅ NEW (SAFE)
async executeVerificationScenario(scenario, anchors) {
  // Check consent
  const consent = await this.consentManager.verifyConsent(anchors)
  if (!consent.allowed) {
    return this.produceRefusal('no_consent', consent.reason)
  }
  
  // Check budget (INVARIANT 1)
  if (!this.budgetEnforcer.canApplyPressure()) {
    return this.produceRefusal('budget_exceeded')
  }
  
  const verification = {
    auditsPerformed: 0,
    exposureConditionsFound: 0,
    confidence: 0
  }
  
  for (const phase of scenario.phases) {
    // INVARIANT 4: Minimal data collection
    const telemetry = await this.dataMinimizer.collectMinimal(anchors)
    
    // Execute verification (non-destructive)
    const result = await this.performIntegrityCheck(phase, telemetry)
    verification.exposureConditionsFound += result.conditions.length
  }
  
  return verification
}
```

---

### **Example 2: ERI with Confidence**

```javascript
// ✅ CORRECT IMPLEMENTATION
function calculateERI(device, telemetry, snapshots) {
  // Calculate raw score
  const conditions = {
    visibility: checkVisibility(device, telemetry),
    configuration: checkConfiguration(device, snapshots),
    patch: checkPatchHygiene(device),
    authority: checkAuthority(device),
    recovery: checkRecovery(device)
  }
  
  const raw_score = weightedSum(conditions)
  
  // CRITICAL: Calculate confidence
  const confidence = calculateConfidence(telemetry, snapshots)
  const missing_inputs = identifyMissingInputs(telemetry, snapshots)
  
  // INVARIANT 2: Apply confidence floor
  const eri = {
    score: raw_score,
    confidence: confidence,
    missing_inputs: missing_inputs,
    visibility: determineVisibility(confidence),
    display: determineDisplay(raw_score, confidence)
  }
  
  // Enforce confidence floor
  if (confidence < 0.7) {
    eri.display = 'indeterminate'
    eri.score = null  // Don't show score when uncertain
  }
  
  return eri
}
```

---

### **Example 3: Repair Staging (NOT Auto-Execution)**

```javascript
// ✅ CORRECT IMPLEMENTATION
async stageRepair(repair_spec, operator_id) {
  // Create signed artifact
  const artifact = {
    repair_id: generateId(),
    target: repair_spec.target,
    repair_type: repair_spec.type,
    artifact_data: repair_spec.data,
    created_by: operator_id,
    created_at: Date.now(),
    status: 'STAGED',  // NOT EXECUTED
    execution_status: 'NOT_EXECUTED',
    requires_authority: true
  }
  
  // Sign artifact
  const signature = await signArtifact(artifact)
  
  // Store in staging area (NOT production)
  await this.saveStagedRepair({
    ...artifact,
    signature,
    warning: 'NOT EXECUTED - Requires explicit authority'
  })
  
  return { repair_id: artifact.repair_id, status: 'staged' }
}

async executeRepair(repair_id, authority_proof) {
  // CRITICAL: Verify authority first
  const authorized = await this.authorityManager.verify(authority_proof)
  if (!authorized) {
    return { success: false, reason: 'insufficient_authority' }
  }
  
  // Load staged repair
  const repair = await this.loadStagedRepair(repair_id)
  
  // Verify signature
  if (!await this.verifySigned(repair)) {
    return { success: false, reason: 'invalid_signature' }
  }
  
  // Execute repair
  const result = await this.applyRepair(repair)
  
  // Post-fix attestation
  const post_state = await this.captureState(repair.target)
  const attestation = await this.signAttestation(post_state)
  
  // Commit to log
  await this.commitRepairExecution({
    repair_id,
    result,
    post_attestation: attestation,
    executed_by: authority_proof.authority_id,
    executed_at: Date.now()
  })
  
  // INVARIANT 3: Track effectiveness
  await this.effectivenessTracker.track(repair)
  
  return { success: true, attestation }
}
```

---

## 🔒 EXTERNAL CONNECTIVITY (SAFE METHODS ONLY)

### **How Relay Connects to External 2D Systems**

**Relay NEVER:**
- ❌ Scans networks without authorization
- ❌ Discovers devices covertly
- ❌ Performs packet sniffing
- ❌ Breaches systems
- ❌ Escalates privileges

**Relay ALWAYS:**
- ✅ Requires explicit enrollment
- ✅ Operates on consented data only
- ✅ Uses authorized API endpoints
- ✅ Respects scope limitations
- ✅ Provides audit trails

### **Enrollment Pattern**

```javascript
// External system enrollment (authorized only)
async enrollExternalSystem(enrollment_request) {
  // Verify enrollment authority
  const authorized = await this.verifyEnrollmentAuthority(enrollment_request)
  if (!authorized) {
    return { success: false, reason: 'unauthorized_enrollment' }
  }
  
  // Create enrollment record
  const enrollment = {
    source_system_id: enrollment_request.system_id,
    scope: enrollment_request.scope,  // What data types allowed
    consent_proof: enrollment_request.consent_signature,
    allowed_operations: enrollment_request.allowed_operations,
    redaction_rules: enrollment_request.redaction_rules,
    retention_limit_days: 90,  // Policy-bound
    enrolled_at: Date.now(),
    enrolled_by: enrollment_request.authority_id
  }
  
  // Commit enrollment
  await this.commitEnrollment(enrollment)
  
  return { success: true, enrollment_id: enrollment.source_system_id }
}
```

---

## 🎨 FRONTEND UX REQUIREMENTS

### **Three-State ERI Display (MUST IMPLEMENT)**

```jsx
// Verified (Green) - High confidence
<div className="eri-verified">
  <CheckCircle color="green" />
  <span>Risk: SAFE</span>
  <Badge>Verified (95% confidence)</Badge>
</div>

// Degraded (Yellow) - Medium confidence
<div className="eri-degraded">
  <AlertTriangle color="yellow" />
  <span>Risk: WARNING</span>
  <Badge>Degraded (65% confidence)</Badge>
  <Tooltip>Based on partial data. May change as coverage improves.</Tooltip>
</div>

// Indeterminate (Gray) - Low confidence
<div className="eri-indeterminate">
  <QuestionCircle color="gray" />
  <span>Risk: INDETERMINATE</span>
  <Tooltip>
    Cannot assess risk. Only 45% of required data available.
    Missing: patch_level, service_status, auth_state
  </Tooltip>
</div>
```

---

## 📊 SUCCESS METRICS

### **Technical Verification**
- [ ] All files renamed with safe terminology
- [ ] All five invariants implemented and enforced
- [ ] ERI includes confidence in all responses
- [ ] Three-state display working
- [ ] Pressure budget preventing overload
- [ ] Learning generates recommendations only (no auto-apply)
- [ ] Data collection minimized by default
- [ ] relay-lint:defense passing all rules

### **Safety Verification**
- [ ] No "attack" language in code
- [ ] No "exploit" language in code
- [ ] No auto-execution without authority
- [ ] All operations require consent
- [ ] All state changes require authorityRef
- [ ] Privacy protected (aggregation-by-default)
- [ ] Repairs staged before execution

### **Regulatory Verification**
- [ ] Data minimization enforced
- [ ] Purpose limitation documented
- [ ] Consent management implemented
- [ ] Audit trails complete
- [ ] Policy governance explicit
- [ ] Reports use safe language

---

## 🚨 CRITICAL REMINDERS

### **Never Say**
- "Relay attacks systems"
- "Relay breaches devices"
- "Relay escalates privileges"
- "War-games simulate attacks"
- "Everyone becomes a hacker"

### **Always Say**
- "Relay verifies system coherence"
- "Relay audits with authorization"
- "Relay detects exposure preconditions"
- "Verification scenarios test integrity"
- "Everyone becomes a coherence operator"

---

## 📖 OUTPUT REQUIRED FROM YOU (CLAUDE)

### **1. File Transformation Report**
- List all files renamed
- List all term replacements made
- Show before/after for critical sections

### **2. Invariant Implementation Proof**
- Show each enforcer class implemented
- Show integration into pressure loop
- Show test results

### **3. ERI Calculation Proof**
- Show ERI with confidence
- Show three-state display
- Show missing input tracking

### **4. relay-lint:defense Setup**
- Show rule catalog
- Show sector overlays
- Show fixture assertion results

### **5. Final Verification**
- Run all tests
- Show all language transformed
- Show all invariants enforced
- Provide deployment checklist

---

## 🎯 THE ONE SENTENCE TO REMEMBER

**"Relay is continuous verification that makes everyone a coherence operator through consensual, non-destructive audits."**

This is LOCKED. This governs everything you build.

---

## 🚀 BEGIN IMPLEMENTATION

**Follow this prompt exactly.**  
**Do not skip steps.**  
**Do not invent alternatives.**  
**Read locked documents first.**  
**Use safe language only.**  
**Enforce all five invariants.**

**Philosophy is complete. Build now.** ✅

---

**END OF CLAUDE IMPLEMENTATION PROMPT**
