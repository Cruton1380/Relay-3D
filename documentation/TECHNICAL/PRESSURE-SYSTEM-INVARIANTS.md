# Relay Pressure System Invariants

**The Three Rules That Complete the Circle**

**Status**: LOCKED ✅  
**Version**: 1.0.0 (Final Hardening)  
**Date**: 2026-01-31

---

## Purpose

These three invariants ensure the Pressure System remains:
- **Humane** (never overloads)
- **Honest** (never falsely reassures)
- **Learning** (continuously improves)

**These are not optional guidelines. These are enforced invariants.**

---

## Invariant 1: Pressure Budget (Prevents Audit Storms)

### The Rule

```
Pressure frequency and depth are policy-bound and capacity-aware.
Excess pressure produces refusal, not overload.
```

### Why This Matters

**Problem Without This Rule:**
```javascript
// Bad: Unlimited pressure
while (true) {
  await verifyEveryDevice()  // Could be billions
  await verifyEveryFilament()  // Could be infinite
  await verifyEveryCommit()  // Could overwhelm
}

// System collapses under its own audit load
// Users experience "audit storm" - system unusable
// Pressure becomes destructive (violates core principle)
```

**Solution With This Rule:**
```javascript
// Good: Budgeted pressure
const pressureBudget = {
  max_verifications_per_second: 1000000,  // Policy-defined cap
  max_cpu_usage: 0.10,                    // 10% CPU max
  max_memory_usage: 500 * 1024 * 1024,    // 500MB max
  max_bandwidth: 1 * 1024 * 1024,         // 1 Mbps max
  
  per_anchor_limits: {
    max_audits_per_hour: 100,             // Don't spam individual anchors
    backoff_on_refusal: true,             // Respect refusals
    cooldown_period: 300                  // 5 min between intensive audits
  }
}

async function budgetedPressureLoop() {
  while (true) {
    // Check budget before auditing
    if (exceedsBudget()) {
      // REFUSAL, not overload
      emit('pressure_budget_exceeded', {
        reason: 'capacity_limit_reached',
        action: 'backoff',
        retry_after: calculateBackoff()
      })
      
      await sleep(backoffTime)
      continue
    }
    
    // Safe to apply pressure
    await applyPressure(withinBudget())
  }
}
```

### Implementation Schema

```typescript
interface PressureBudget {
  // Global limits (system-wide)
  global: {
    max_verifications_per_second: number
    max_cpu_percent: number
    max_memory_bytes: number
    max_network_bytes_per_second: number
  }
  
  // Per-anchor limits (individual device/filament)
  per_anchor: {
    max_audits_per_hour: number
    max_audits_per_day: number
    cooldown_seconds: number
    backoff_on_refusal: boolean
  }
  
  // Per-operator limits (individual user)
  per_operator: {
    max_repair_proposals_per_hour: number
    max_simultaneous_operations: number
    rate_limit_window_seconds: number
  }
  
  // Adaptive scaling
  adaptive: {
    scale_up_threshold: number      // CPU < 50% → increase budget
    scale_down_threshold: number    // CPU > 90% → decrease budget
    adjustment_factor: number       // 10% change per adjustment
    adjustment_interval_seconds: number
  }
}
```

### Enforcement Algorithm

```javascript
class PressureBudgetEnforcer {
  constructor(budget) {
    this.budget = budget
    this.current_usage = {
      verifications_this_second: 0,
      cpu_percent: 0,
      memory_bytes: 0,
      network_bytes_this_second: 0
    }
    this.per_anchor_usage = new Map()  // anchor_id -> usage stats
  }
  
  canApplyPressure(anchor_id, operation_type) {
    // 1. Check global budget
    if (this.current_usage.verifications_this_second >= this.budget.global.max_verifications_per_second) {
      return { allowed: false, reason: 'global_verification_limit' }
    }
    
    if (this.current_usage.cpu_percent >= this.budget.global.max_cpu_percent) {
      return { allowed: false, reason: 'global_cpu_limit' }
    }
    
    if (this.current_usage.memory_bytes >= this.budget.global.max_memory_bytes) {
      return { allowed: false, reason: 'global_memory_limit' }
    }
    
    // 2. Check per-anchor budget
    const anchor_usage = this.per_anchor_usage.get(anchor_id) || { audits_this_hour: 0, last_audit: 0 }
    
    if (anchor_usage.audits_this_hour >= this.budget.per_anchor.max_audits_per_hour) {
      return { allowed: false, reason: 'per_anchor_rate_limit' }
    }
    
    const time_since_last = Date.now() - anchor_usage.last_audit
    if (time_since_last < this.budget.per_anchor.cooldown_seconds * 1000) {
      return { allowed: false, reason: 'per_anchor_cooldown' }
    }
    
    // 3. All checks passed
    return { allowed: true }
  }
  
  recordPressureApplied(anchor_id, operation_type, cost) {
    // Update global usage
    this.current_usage.verifications_this_second += 1
    
    // Update per-anchor usage
    const anchor_usage = this.per_anchor_usage.get(anchor_id) || { audits_this_hour: 0 }
    anchor_usage.audits_this_hour += 1
    anchor_usage.last_audit = Date.now()
    this.per_anchor_usage.set(anchor_id, anchor_usage)
  }
  
  produceRefusal(anchor_id, reason) {
    // Emit refusal as first-class event
    return {
      type: 'pressure_refusal',
      anchor_id,
      reason,
      timestamp: Date.now(),
      retry_after: this.calculateBackoff(reason),
      
      // Refusal is not failure - it's honest capacity signaling
      severity: 'info',
      action_required: 'respect_backoff'
    }
  }
}
```

### Key Principle

**Excess pressure produces REFUSAL, not overload.**

```
Traditional System:
├─ Load increases → System slows
├─ Load increases more → System crawls
├─ Load increases more → System crashes
└─ DESTRUCTIVE FAILURE

Relay Pressure System:
├─ Load approaches budget → System signals backpressure
├─ Load exceeds budget → System produces refusal
├─ Load continues → System maintains refusal state
└─ NON-DESTRUCTIVE REFUSAL (system stays healthy)
```

---

## Invariant 2: Confidence Floor Rule (Prevents False Reassurance)

### The Rule

```
Any ERI score below a minimum confidence must be displayed as "indeterminate," not safe.
```

### Why This Matters

**Problem Without This Rule:**
```javascript
// Bad: False reassurance
const eri = calculateERI(device)
console.log(`ERI: ${eri.score}`)  // Shows "0.2" (looks safe)

// But confidence is 0.1 (90% missing data!)
// User sees low risk, but it's actually unknown risk
// FALSE REASSURANCE - dangerous
```

**Solution With This Rule:**
```javascript
// Good: Honest uncertainty
const eri = calculateERI(device)

if (eri.confidence < CONFIDENCE_FLOOR) {
  console.log(`ERI: INDETERMINATE`)
  console.log(`Reason: Insufficient data (${eri.confidence * 100}% confidence)`)
  console.log(`Missing: ${eri.missing_inputs.join(', ')}`)
  
  // User sees: "Cannot determine risk - need more data"
  // NOT: "Risk is low" (when we don't actually know)
}
```

### Implementation Schema

```typescript
interface ERIWithConfidence {
  // The risk score (only meaningful if confidence is high)
  score: number  // 0.0 (safe) to 1.0 (critical)
  
  // The confidence in that score (critical for interpretation)
  confidence: number  // 0.0 (no data) to 1.0 (complete data)
  
  // What inputs are missing (explains low confidence)
  missing_inputs: string[]
  
  // Visibility state (derived from confidence)
  visibility: 'verified' | 'degraded' | 'blind'
  
  // Display state (what to show user)
  display: 'safe' | 'warning' | 'critical' | 'indeterminate'
}

interface ConfidencePolicy {
  // Minimum confidence required to show definitive ERI
  confidence_floor: number  // e.g., 0.7 (70%)
  
  // Thresholds for visibility states
  verified_threshold: number    // e.g., 0.9 (90% confidence)
  degraded_threshold: number    // e.g., 0.5 (50% confidence)
  blind_threshold: number       // e.g., < 0.5 (below 50%)
  
  // How to display based on confidence
  display_rules: {
    verified: 'show_score',          // High confidence → Show actual ERI
    degraded: 'show_with_warning',   // Medium confidence → Show with caveat
    blind: 'show_indeterminate'      // Low confidence → Don't show score
  }
}
```

### Enforcement Algorithm

```javascript
class ConfidenceFloorEnforcer {
  constructor(policy) {
    this.policy = policy
  }
  
  calculateDisplayableERI(raw_eri) {
    const confidence = raw_eri.confidence
    
    // CRITICAL: Never show definitive score below confidence floor
    if (confidence < this.policy.confidence_floor) {
      return {
        score: null,  // No score shown
        display: 'indeterminate',
        message: 'Insufficient data to assess risk',
        confidence,
        missing_inputs: raw_eri.missing_inputs,
        action_required: 'collect_telemetry',
        
        // Honest about uncertainty
        severity: 'warning',
        reason: `Only ${Math.round(confidence * 100)}% of required data available`
      }
    }
    
    // Above floor, but still degraded
    if (confidence < this.policy.verified_threshold) {
      return {
        score: raw_eri.score,
        display: this.scoreToDisplay(raw_eri.score),
        message: `Risk assessment based on ${Math.round(confidence * 100)}% of data (degraded)`,
        confidence,
        missing_inputs: raw_eri.missing_inputs,
        action_required: 'improve_coverage',
        
        // Show score, but flag uncertainty
        severity: 'info',
        caveat: 'Partial data - assessment may change as coverage improves'
      }
    }
    
    // High confidence - show score with confidence
    return {
      score: raw_eri.score,
      display: this.scoreToDisplay(raw_eri.score),
      message: `Risk assessment verified (${Math.round(confidence * 100)}% confidence)`,
      confidence,
      missing_inputs: [],
      
      // High confidence in score
      severity: this.scoreToSeverity(raw_eri.score),
      verified: true
    }
  }
  
  scoreToDisplay(score) {
    if (score < 0.3) return 'safe'
    if (score < 0.6) return 'warning'
    return 'critical'
  }
  
  scoreToSeverity(score) {
    if (score < 0.3) return 'low'
    if (score < 0.6) return 'medium'
    return 'high'
  }
}
```

### UI Implications

```javascript
// Frontend display logic

function renderERI(eri_data) {
  if (eri_data.display === 'indeterminate') {
    return (
      <div className="eri-indeterminate">
        <Icon name="question-circle" />
        <span>Risk: INDETERMINATE</span>
        <Tooltip>
          Cannot assess risk. Only {Math.round(eri_data.confidence * 100)}% 
          of required data available.
          
          Missing: {eri_data.missing_inputs.join(', ')}
          
          Action: Improve telemetry coverage
        </Tooltip>
      </div>
    )
  }
  
  if (eri_data.confidence < 0.9) {
    return (
      <div className="eri-degraded">
        <Icon name="alert-triangle" />
        <span>Risk: {eri_data.display.toUpperCase()}</span>
        <Badge>Degraded ({Math.round(eri_data.confidence * 100)}% confidence)</Badge>
        <Tooltip>
          Assessment based on partial data. 
          Score may change as coverage improves.
        </Tooltip>
      </div>
    )
  }
  
  return (
    <div className={`eri-verified eri-${eri_data.display}`}>
      <Icon name="check-circle" />
      <span>Risk: {eri_data.display.toUpperCase()}</span>
      <Badge>Verified ({Math.round(eri_data.confidence * 100)}% confidence)</Badge>
    </div>
  )
}
```

### Key Principle

**Never reassure when uncertain.**

```
Bad UX:
├─ Shows: "ERI: 0.2 (Safe)"
├─ Reality: 90% data missing
├─ User: "Great, I'm safe!"
└─ DANGEROUS: False reassurance

Good UX:
├─ Shows: "ERI: INDETERMINATE"
├─ Shows: "Missing 90% of data"
├─ User: "I need to improve coverage"
└─ SAFE: Honest uncertainty
```

---

## Invariant 3: Repair Effectiveness Scoring (Learning Loop)

### The Rule

```
Track which repair artifacts actually close exposure over time.
The system learns which fixes work, which policies are brittle, 
and where organizations over- or under-react.
```

### Why This Matters

**Problem Without This Rule:**
```javascript
// Bad: Repairs applied but never evaluated
async function applyRepair(repair) {
  await executeRepair(repair)
  // Done! ...but did it actually fix the problem?
  // Do we apply the same failing fix again next time?
  // Are we creating churn without improvement?
}
```

**Solution With This Rule:**
```javascript
// Good: Repairs tracked and learned from
async function applyAndTrackRepair(repair) {
  // 1. Measure pre-repair state
  const pre_eri = await calculateERI(repair.target)
  
  // 2. Apply repair
  await executeRepair(repair)
  
  // 3. Measure post-repair state (immediate)
  const post_eri_immediate = await calculateERI(repair.target)
  
  // 4. Measure durability over time
  const post_eri_1h = await scheduleDelayedERI(repair.target, 3600)
  const post_eri_24h = await scheduleDelayedERI(repair.target, 86400)
  
  // 5. Score effectiveness
  const effectiveness = {
    immediate_improvement: pre_eri.score - post_eri_immediate.score,
    durability_1h: post_eri_immediate.score - post_eri_1h.score,
    durability_24h: post_eri_immediate.score - post_eri_24h.score,
    
    effectiveness_score: calculateEffectiveness(pre_eri, post_eri_24h)
  }
  
  // 6. Learn from this repair
  await recordRepairEffectiveness(repair.id, effectiveness)
  
  // 7. Update repair recommendations
  await updateRepairPolicy(repair.artifact_type, effectiveness)
}
```

### Implementation Schema

```typescript
interface RepairEffectiveness {
  repair_id: string
  target_anchor: string
  artifact_type: string  // e.g., "patch_firewall", "reset_permissions"
  
  // Pre-repair state
  pre_repair: {
    eri_score: number
    confidence: number
    drift_detected: string[]
    timestamp: number
  }
  
  // Post-repair states (at multiple time points)
  post_repair_immediate: {
    eri_score: number
    confidence: number
    drift_remaining: string[]
    timestamp: number
  }
  
  post_repair_1h: {
    eri_score: number
    confidence: number
    drift_detected: string[]
    timestamp: number
  }
  
  post_repair_24h: {
    eri_score: number
    confidence: number
    drift_detected: string[]
    timestamp: number
  }
  
  // Effectiveness metrics
  metrics: {
    immediate_improvement: number      // e.g., 0.3 (30% risk reduction)
    durability_1h: number              // e.g., 0.95 (95% of improvement held)
    durability_24h: number             // e.g., 0.90 (90% of improvement held)
    effectiveness_score: number        // e.g., 0.85 (85% effective repair)
    
    fixed_issues: string[]             // Which drifts actually closed
    new_issues: string[]               // Which new drifts appeared (side effects)
    persistent_issues: string[]        // Which drifts weren't fixed
  }
  
  // Learning data
  learning: {
    artifact_effectiveness_avg: number   // This artifact type's average
    better_than_average: boolean         // This repair outperformed?
    recommended_for_retry: boolean       // Would we use this again?
    recommended_alternatives: string[]   // Better options discovered
  }
}

interface RepairPolicy {
  artifact_type: string
  
  // Historical effectiveness
  historical: {
    total_applications: number
    average_effectiveness: number
    average_durability: number
    success_rate: number
  }
  
  // Learned recommendations
  recommendations: {
    recommended: boolean               // Should we use this repair?
    confidence: number                 // How confident in this recommendation?
    alternatives: Array<{
      artifact_type: string
      relative_effectiveness: number
      reason: string
    }>
  }
  
  // Adaptation rules
  adaptation: {
    disable_if_effectiveness_below: number  // e.g., 0.3 (30%)
    suggest_alternatives_if_below: number   // e.g., 0.5 (50%)
    mark_as_preferred_if_above: number      // e.g., 0.9 (90%)
  }
}
```

### Enforcement Algorithm

```javascript
class RepairEffectivenessTracker {
  async trackRepair(repair) {
    // 1. Capture pre-repair state
    const pre_state = await this.captureState(repair.target)
    
    // 2. Execute repair
    const execution_result = await this.executeRepair(repair)
    
    // 3. Schedule effectiveness measurements
    const measurements = await Promise.all([
      this.measureAt(repair.target, 0),        // Immediate
      this.measureAt(repair.target, 3600),     // 1 hour
      this.measureAt(repair.target, 86400)     // 24 hours
    ])
    
    // 4. Calculate effectiveness
    const effectiveness = this.calculateEffectiveness(
      pre_state,
      measurements
    )
    
    // 5. Record to learning database
    await this.recordEffectiveness({
      repair_id: repair.id,
      artifact_type: repair.artifact_type,
      target: repair.target,
      pre_state,
      post_states: measurements,
      effectiveness
    })
    
    // 6. Update repair policy
    await this.updatePolicy(repair.artifact_type, effectiveness)
    
    return effectiveness
  }
  
  calculateEffectiveness(pre_state, measurements) {
    const [immediate, hour1, hour24] = measurements
    
    // How much did ERI improve immediately?
    const immediate_improvement = pre_state.eri - immediate.eri
    
    // How well did it hold up over time?
    const durability_1h = immediate_improvement > 0 
      ? (immediate.eri - hour1.eri) / immediate_improvement
      : 0
    
    const durability_24h = immediate_improvement > 0
      ? (immediate.eri - hour24.eri) / immediate_improvement
      : 0
    
    // Overall effectiveness score
    const effectiveness_score = 
      (immediate_improvement * 0.4) +        // 40% weight on immediate impact
      (durability_1h * 0.3) +                // 30% weight on 1h durability
      (durability_24h * 0.3)                 // 30% weight on 24h durability
    
    return {
      immediate_improvement,
      durability_1h,
      durability_24h,
      effectiveness_score,
      
      // Qualitative assessment
      assessment: this.assessQuality(effectiveness_score)
    }
  }
  
  assessQuality(score) {
    if (score >= 0.9) return 'excellent'
    if (score >= 0.7) return 'good'
    if (score >= 0.5) return 'acceptable'
    if (score >= 0.3) return 'poor'
    return 'ineffective'
  }
  
  async updatePolicy(artifact_type, effectiveness) {
    // Load current policy
    const policy = await this.getPolicy(artifact_type)
    
    // Update running averages
    policy.historical.total_applications += 1
    policy.historical.average_effectiveness = 
      this.runningAverage(
        policy.historical.average_effectiveness,
        effectiveness.effectiveness_score,
        policy.historical.total_applications
      )
    
    // Adapt recommendations
    if (policy.historical.average_effectiveness < policy.adaptation.disable_if_effectiveness_below) {
      policy.recommendations.recommended = false
      policy.recommendations.reason = 'Low historical effectiveness'
      
      // Find better alternatives
      policy.recommendations.alternatives = await this.findBetterAlternatives(artifact_type)
    }
    
    if (policy.historical.average_effectiveness > policy.adaptation.mark_as_preferred_if_above) {
      policy.recommendations.recommended = true
      policy.recommendations.confidence = 0.95
      policy.recommendations.reason = 'High historical effectiveness'
    }
    
    // Commit updated policy
    await this.savePolicy(artifact_type, policy)
  }
}
```

### Learning Dashboard

```javascript
// UI for operators to see what the system has learned

function RepairLearningDashboard() {
  const [policies, setPolicies] = useState([])
  
  useEffect(() => {
    fetchRepairPolicies().then(setPolicies)
  }, [])
  
  return (
    <div className="repair-learning-dashboard">
      <h2>Repair Effectiveness Learning</h2>
      
      <table>
        <thead>
          <tr>
            <th>Repair Type</th>
            <th>Applications</th>
            <th>Avg Effectiveness</th>
            <th>Durability</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {policies.map(policy => (
            <tr key={policy.artifact_type}>
              <td>{policy.artifact_type}</td>
              <td>{policy.historical.total_applications}</td>
              <td>
                <ProgressBar value={policy.historical.average_effectiveness * 100} />
                {Math.round(policy.historical.average_effectiveness * 100)}%
              </td>
              <td>
                <ProgressBar value={policy.historical.average_durability * 100} />
                {Math.round(policy.historical.average_durability * 100)}%
              </td>
              <td>
                {policy.recommendations.recommended ? (
                  <Badge color="green">Recommended</Badge>
                ) : (
                  <Badge color="red">Not Recommended</Badge>
                )}
                
                {policy.recommendations.alternatives.length > 0 && (
                  <Tooltip>
                    Better alternatives:
                    {policy.recommendations.alternatives.map(alt => (
                      <div key={alt.artifact_type}>
                        {alt.artifact_type} ({Math.round(alt.relative_effectiveness * 100)}% better)
                      </div>
                    ))}
                  </Tooltip>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Key Principle

**The system learns from every repair.**

```
Traditional Approach:
├─ Apply fix
├─ Move on
├─ No tracking
└─ NO LEARNING (repeat same mistakes)

Relay Approach:
├─ Apply fix
├─ Measure effectiveness (immediate, 1h, 24h)
├─ Record to learning database
├─ Update repair policy
└─ CONTINUOUS LEARNING (improve over time)

Result:
- Ineffective repairs deprecated
- Effective repairs prioritized
- Better alternatives discovered
- Organization learns what works for their context
```

---

## Invariant 4: Data Minimization + Purpose Limitation (Privacy Lock)

### The Rule

```
Pressure is continuous verification, not continuous surveillance.
Relay collects the minimum data required to compute ERI, stage repairs, and prove closure.
```

### Why This Matters

**Problem Without This Rule:**
```javascript
// Bad: Unbounded data collection
class SurveillanceSystem {
  collectTelemetry(device) {
    // Collect everything, just in case
    const data = {
      all_processes: device.getProcessList(),
      all_network_connections: device.getNetworkState(),
      all_file_access: device.getFileAccessLog(),
      all_keystrokes: device.getInputLog(),  // ❌ NOT NEEDED
      all_screen_content: device.getScreenshot(),  // ❌ NOT NEEDED
      user_location: device.getGPSCoordinates(),  // ❌ NOT NEEDED
      // ... everything
    }
    
    // Store forever
    this.storage.storeRaw(data, { retention: 'infinite' })
  }
}

// Result: Continuous surveillance, not continuous verification
// Fatal enterprise blocker
// Regulatory violation
```

**Solution With This Rule:**
```javascript
// Good: Minimal, purpose-bound data collection
class VerificationSystem {
  collectTelemetry(device) {
    // Collect ONLY what's needed for ERI calculation
    const data = {
      // Required for ERI
      config_hash: device.getConfigHash(),  // ✅ Needed
      patch_level: device.getPatchLevel(),  // ✅ Needed
      service_status: device.getServiceStatus(),  // ✅ Needed
      
      // NOT collected by default
      // keystrokes: NEVER
      // screen_content: NEVER
      // location: ONLY if explicitly required for proximity verification
    }
    
    // Aggregate by default
    const aggregated = this.aggregate(data)
    
    // Raw only if explicitly opted-in
    if (device.consent.raw_telemetry && device.consent.raw_until > Date.now()) {
      this.storage.storeRaw(data, {
        retention: device.consent.raw_retention,  // e.g., 7 days
        scope: device.consent.scope,
        redaction: device.redaction_rules
      })
    } else {
      // Store only aggregated
      this.storage.storeAggregated(aggregated, {
        retention: '90_days'  // Policy-bound
      })
    }
  }
}

// Result: Continuous verification, NOT surveillance
```

### Implementation Schema

```typescript
interface DataMinimizationPolicy {
  // What data CAN be collected (whitelist, not blacklist)
  allowed_telemetry: {
    // Required for ERI (always allowed)
    required: string[]  // e.g., ["config_hash", "patch_level", "service_status"]
    
    // Optional (requires explicit consent)
    optional: string[]  // e.g., ["network_state", "process_list"]
    
    // Never collected (hard ban)
    prohibited: string[]  // e.g., ["keystrokes", "screen_content", "biometric_data"]
  }
  
  // Default collection mode
  default_mode: "aggregated" | "raw"  // Always "aggregated"
  
  // Raw telemetry opt-in
  raw_telemetry: {
    requires_explicit_consent: boolean  // Always true
    max_retention_days: number  // e.g., 7 or 30
    automatic_expiration: boolean  // Always true
    consent_renewal_required: boolean  // Always true
  }
  
  // PII handling
  pii: {
    collection_mode: "avoid" | "pseudonymize" | "encrypt"
    redaction_rules: Array<{
      field: string
      method: "hash" | "truncate" | "remove" | "pseudonymize"
    }>
    retention_limit_days: number  // e.g., 30
  }
  
  // Export controls
  exports: {
    support_pseudonymization: boolean  // Always true
    role_based_filters: boolean  // Always true
    audit_all_exports: boolean  // Always true
  }
}

interface TelemetryConsent {
  device_id: string
  
  // Aggregated telemetry (always active, minimal)
  aggregated: {
    enabled: true  // Cannot be disabled (needed for ERI)
    retention_days: 90
    includes: string[]  // Minimal set
  }
  
  // Raw telemetry (opt-in only)
  raw: {
    enabled: boolean  // Default: false
    scope: string[]  // What specific data
    retention_days: number  // Max 30 days
    expires_at: number  // Unix timestamp
    renewal_required: boolean  // Always true
    reason: string  // Why raw data needed
  }
  
  // PII (avoided by default)
  pii: {
    collected: boolean  // Default: false
    fields: string[]  // What PII if any
    redaction: RedactionRule[]
    retention_days: number  // Max 30 days
    purpose: string  // Explicit purpose
  }
}
```

### Enforcement Algorithm

```javascript
class DataMinimizationEnforcer {
  constructor(policy) {
    this.policy = policy
  }
  
  collectTelemetry(device) {
    // 1. Check what's allowed
    const consent = device.getConsent()
    
    // 2. Collect only required data (minimal set)
    const required_data = this.collectRequired(device)
    
    // 3. Check if raw telemetry is consented
    if (consent.raw.enabled && consent.raw.expires_at > Date.now()) {
      // Raw telemetry allowed (but still minimal)
      const raw_data = this.collectRaw(device, consent.raw.scope)
      
      // 4. Apply redaction
      const redacted_data = this.applyRedaction(raw_data, consent.pii.redaction)
      
      // 5. Store with expiration
      return this.storeRaw(redacted_data, {
        retention_days: consent.raw.retention_days,
        expires_at: consent.raw.expires_at,
        device_id: this.pseudonymize(device.id)  // Never store real ID
      })
    } else {
      // No raw consent - aggregate only
      const aggregated = this.aggregate(required_data)
      
      // 6. Store aggregated (no PII)
      return this.storeAggregated(aggregated, {
        retention_days: this.policy.aggregated_retention,
        device_id: this.pseudonymize(device.id)
      })
    }
  }
  
  applyRedaction(data, rules) {
    for (const rule of rules) {
      if (data[rule.field]) {
        switch (rule.method) {
          case 'hash':
            data[rule.field] = sha256(data[rule.field])
            break
          case 'truncate':
            data[rule.field] = data[rule.field].substring(0, 8) + '...'
            break
          case 'remove':
            delete data[rule.field]
            break
          case 'pseudonymize':
            data[rule.field] = this.pseudonymize(data[rule.field])
            break
        }
      }
    }
    return data
  }
  
  prohibitedDataCheck(data) {
    // Enforce hard bans
    for (const prohibited of this.policy.allowed_telemetry.prohibited) {
      if (data[prohibited]) {
        throw new Error(`PROHIBITED DATA COLLECTED: ${prohibited}. This violates data minimization policy.`)
      }
    }
  }
}
```

### Role-Based View Filters

```typescript
interface RoleBasedView {
  role: 'auditor' | 'operator' | 'executive' | 'device_owner'
  
  allowed_views: {
    // What each role can see
    auditor: {
      aggregate_metrics: true
      device_count: true
      eri_scores: true
      drift_alerts: true
      device_identities: false  // Pseudonymized only
      raw_telemetry: false
    }
    
    operator: {
      aggregate_metrics: true
      device_count: true
      eri_scores: true
      drift_alerts: true
      device_identities: true  // If authorized for specific scope
      raw_telemetry: false  // Unless specific incident
    }
    
    executive: {
      aggregate_metrics: true
      device_count: true
      eri_scores: false  // Only summaries
      drift_alerts: false  // Only summaries
      device_identities: false
      raw_telemetry: false
    }
    
    device_owner: {
      aggregate_metrics: false  // Own device only
      device_count: false
      eri_scores: true  // Own device only
      drift_alerts: true  // Own device only
      device_identities: true  // Own device only
      raw_telemetry: true  // Own device only, if consented
    }
  }
}
```

### The Canonical Addition

**Add to canonical statement:**

> "Pressure is continuous verification, not continuous surveillance: minimum required data, shortest required retention, strictest required scope."

### Key Principle

**Without surveillance, pressure remains pressure.**

```
Surveillance System:
├─ Collects everything
├─ Stores indefinitely
├─ No consent required
├─ No minimization
└─ BECOMES THREAT

Verification System:
├─ Collects minimum needed
├─ Stores time-bounded
├─ Consent required for raw
├─ Aggregated by default
└─ REMAINS TRUSTWORTHY
```

---

## Invariant 5: Learning Cannot Auto-Change Policy (Governance Lock)

### The Rule

```
RepairEffectivenessTracker may generate recommendations, but it cannot apply 
policy changes automatically. Relay learns by writing recommendations, not by mutating policy.
```

### Why This Matters

**Problem Without This Rule:**
```javascript
// Bad: Self-modifying policy (ungoverned)
class UngoverneRepairLearning {
  async updatePolicy(artifact_type, effectiveness) {
    const policy = await this.getPolicy(artifact_type)
    
    // Automatically change thresholds based on effectiveness
    if (effectiveness < 0.5) {
      policy.threshold = effectiveness * 1.2  // ❌ Auto-changed!
    }
    
    // Automatically change ERI weights
    policy.eri_weights.security = effectiveness * 0.8  // ❌ Auto-changed!
    
    // Just save it, no approval needed
    await this.savePolicy(artifact_type, policy)  // ❌ No authority!
    
    // No audit trail
    // No one knows policy changed
    // System drifts over time
  }
}

// Result: System becomes self-tuning black box
// Breaks auditability
// Violates regulator trust
// Policy drift undetectable
```

**Solution With This Rule:**
```javascript
// Good: Recommendation-only learning (governed)
class GovernedRepairLearning {
  async updatePolicy(artifact_type, effectiveness) {
    const policy = await this.getPolicy(artifact_type)
    
    // Calculate what COULD be changed
    const recommendation = this.generateRecommendation(policy, effectiveness)
    
    // DO NOT APPLY - just record recommendation
    const recommendation_commit = {
      type: 'POLICY_RECOMMENDATION',
      artifact_type,
      current_policy: policy.version,
      current_values: {
        threshold: policy.threshold,
        eri_weights: policy.eri_weights
      },
      recommended_values: {
        threshold: recommendation.threshold,
        eri_weights: recommendation.eri_weights
      },
      evidence: {
        effectiveness_score: effectiveness,
        sample_size: recommendation.sample_size,
        confidence: recommendation.confidence
      },
      status: 'PENDING_AUTHORITY',
      created_at: Date.now(),
      created_by: 'learning_engine'
    }
    
    // Commit recommendation (NOT policy change)
    await this.commitRecommendation(recommendation_commit)
    
    // Emit event for human review
    this.emit('policy_recommendation_ready', {
      recommendation_id: recommendation_commit.id,
      requires_authority: true,
      requires_canon_selection: policy.requires_vote
    })
    
    // Policy unchanged until authorized
  }
  
  async applyPolicyChange(recommendation_id, authority_proof) {
    // 1. Verify authority
    if (!await this.verifyAuthority(authority_proof, 'policy_admin')) {
      return { success: false, reason: 'insufficient_authority' }
    }
    
    // 2. Load recommendation
    const recommendation = await this.getRecommendation(recommendation_id)
    
    // 3. If requires vote, check canon selection
    if (recommendation.requires_canon_selection) {
      const vote_result = await this.getVoteResult(recommendation_id)
      if (!vote_result.approved) {
        return { success: false, reason: 'canon_selection_rejected' }
      }
    }
    
    // 4. Create NEW policy version (never mutate)
    const new_policy = {
      ...recommendation.current_policy,
      version: recommendation.current_policy.version + 1,
      values: recommendation.recommended_values,
      changed_by: authority_proof.authority_id,
      changed_at: Date.now(),
      reason: recommendation.evidence,
      previous_version: recommendation.current_policy.version
    }
    
    // 5. Commit NEW policy (versioned)
    await this.commitPolicyVersion(new_policy)
    
    // 6. Update recommendation status
    await this.updateRecommendation(recommendation_id, {
      status: 'APPLIED',
      applied_at: Date.now(),
      applied_by: authority_proof.authority_id,
      new_policy_version: new_policy.version
    })
    
    return { success: true, new_version: new_policy.version }
  }
}

// Result: Learning generates insights, humans govern
// Full audit trail
// Regulator trust maintained
// Policy changes explicit and traceable
```

### Implementation Schema

```typescript
interface PolicyRecommendation {
  id: string
  type: 'POLICY_RECOMMENDATION'
  
  // What policy this affects
  policy_scope: {
    artifact_type?: string
    eri_component?: string
    pressure_schedule?: string
    threshold_type?: string
  }
  
  // Current state
  current: {
    policy_version: number
    values: Record<string, any>
  }
  
  // Recommended change
  recommended: {
    values: Record<string, any>
    rationale: string
  }
  
  // Evidence supporting recommendation
  evidence: {
    effectiveness_scores: number[]
    sample_size: number
    confidence: number
    time_period: { start: number, end: number }
    data_source: string
  }
  
  // Governance
  status: 'PENDING_AUTHORITY' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'APPLIED'
  requires_authority: boolean
  requires_canon_selection: boolean  // Requires vote?
  
  // Audit trail
  created_at: number
  created_by: string  // Always 'learning_engine'
  reviewed_by?: string
  applied_by?: string
  applied_at?: number
}

interface PolicyVersion {
  version: number
  artifact_type: string
  
  // Actual policy values
  values: {
    threshold?: number
    eri_weights?: Record<string, number>
    pressure_schedule?: any
    // ... other policy parameters
  }
  
  // Governance
  changed_by: string  // Authority ID
  changed_at: number
  reason: string  // Why changed
  recommendation_id?: string  // If from learning
  
  // Provenance
  previous_version: number
  commit_hash: string  // Git commit
  authority_ref: string  // Authority proof
}
```

### Enforcement Algorithm

```javascript
class PolicyGovernanceEnforcer {
  async proposeChange(policy_scope, recommended_values, evidence) {
    // Learning engine calls this
    
    // 1. Create recommendation (NOT policy change)
    const recommendation = {
      id: generateId(),
      type: 'POLICY_RECOMMENDATION',
      policy_scope,
      current: await this.getCurrentPolicy(policy_scope),
      recommended: { values: recommended_values },
      evidence,
      status: 'PENDING_AUTHORITY',
      requires_authority: true,
      requires_canon_selection: this.requiresVote(policy_scope),
      created_at: Date.now(),
      created_by: 'learning_engine'
    }
    
    // 2. Commit recommendation (append-only)
    await this.commitRecommendation(recommendation)
    
    // 3. Notify authorities
    await this.notifyAuthorities(recommendation)
    
    return { recommendation_id: recommendation.id, status: 'pending' }
  }
  
  async reviewRecommendation(recommendation_id, reviewer_id, decision) {
    // Human reviews recommendation
    
    const recommendation = await this.getRecommendation(recommendation_id)
    
    if (decision === 'approve') {
      recommendation.status = 'APPROVED'
      recommendation.reviewed_by = reviewer_id
      
      // If requires vote, trigger canon selection
      if (recommendation.requires_canon_selection) {
        await this.createVote(recommendation)
      } else {
        // Direct approval (admin authority)
        await this.applyPolicyChange(recommendation_id, {
          authority_id: reviewer_id,
          authority_type: 'admin'
        })
      }
    } else {
      recommendation.status = 'REJECTED'
      recommendation.reviewed_by = reviewer_id
    }
    
    await this.updateRecommendation(recommendation)
  }
  
  async applyPolicyChange(recommendation_id, authority_proof) {
    // Final step: actually change policy
    
    // All the governance checks from above
    // ...
    
    // Create NEW policy version
    const new_policy = {
      version: current_policy.version + 1,
      // ... new values
      changed_by: authority_proof.authority_id,
      authority_ref: authority_proof.commit_hash,
      // ... provenance
    }
    
    // Commit new policy version
    await this.commitPolicyVersion(new_policy)
    
    // CRITICAL: Old policy remains in history
    // New policy is new commit, not mutation
  }
  
  prohibitAutoMutation() {
    // Enforce: Learning engine cannot call commitPolicyVersion directly
    
    if (caller === 'learning_engine' && method === 'commitPolicyVersion') {
      throw new Error(
        'GOVERNANCE VIOLATION: Learning engine cannot commit policy changes. ' +
        'Must use proposeChange() and await authority approval.'
      )
    }
  }
}
```

### The Canonical Addition

**Add to canonical statement:**

> "Relay learns by writing recommendations, not by mutating policy."

### Key Principle

**Learning generates insights. Humans govern.**

```
Ungoverned Learning:
├─ AI observes effectiveness
├─ AI changes thresholds automatically
├─ No human in loop
├─ Policy drifts over time
└─ BLACK BOX (regulators reject)

Governed Learning:
├─ AI observes effectiveness
├─ AI writes recommendation
├─ Human reviews evidence
├─ Authority approves change
├─ Policy version committed
└─ TRANSPARENT (regulators trust)
```

---

## The Complete Pressure System (With All Five Invariants)

```javascript
// Final, complete, hardened pressure loop (all five invariants)

class HardenedPressureSystem {
  constructor() {
    this.budgetEnforcer = new PressureBudgetEnforcer(PRESSURE_BUDGET)
    this.confidenceEnforcer = new ConfidenceFloorEnforcer(CONFIDENCE_POLICY)
    this.effectivenessTracker = new RepairEffectivenessTracker()
    this.dataMinimizer = new DataMinimizationEnforcer(DATA_POLICY)
    this.policyGovernance = new PolicyGovernanceEnforcer()
  }
  
  async pressureLoop() {
    while (true) {
      // INVARIANT 1: Check budget before applying pressure
      const budget_check = this.budgetEnforcer.canApplyPressure()
      if (!budget_check.allowed) {
        this.emit('pressure_refusal', budget_check.reason)
        await this.sleep(budget_check.backoff_time)
        continue
      }
      
      // 1. ATTEST
      // INVARIANT 4: Collect minimal data only
      const attestations = await this.collectAttestations()
      const minimized = this.dataMinimizer.collectTelemetry(attestations)
      
      // 2. COMPARE
      const comparisons = this.compareThreeWay(attestations)
      
      // 3. SCORE
      const raw_eri = this.calculateERI(comparisons)
      
      // INVARIANT 2: Enforce confidence floor
      const displayable_eri = this.confidenceEnforcer.calculateDisplayableERI(raw_eri)
      
      if (displayable_eri.display === 'indeterminate') {
        // Cannot assess risk - need more data
        this.emit('indeterminate_eri', {
          reason: 'low_confidence',
          confidence: displayable_eri.confidence,
          missing_inputs: displayable_eri.missing_inputs
        })
        
        // Try to improve coverage
        await this.requestAdditionalTelemetry(displayable_eri.missing_inputs)
        continue
      }
      
      // 4. STAGE
      if (displayable_eri.display === 'critical') {
        const repair = await this.stageRepair(displayable_eri)
        
        // 5. VERIFY (if authorized)
        if (await this.isAuthorized(repair)) {
          const result = await this.executeRepair(repair)
          
          // INVARIANT 3: Track effectiveness
          const effectiveness = await this.effectivenessTracker.trackRepair(repair)
          
          // INVARIANT 5: Learning generates recommendations, not policy changes
          if (effectiveness.effectiveness_score < 0.5) {
            await this.policyGovernance.proposeChange(
              { artifact_type: repair.artifact_type },
              { disable: true },
              { effectiveness_score: effectiveness.effectiveness_score }
            )
          }
          
          this.emit('repair_completed', {
            repair_id: repair.id,
            success: result.success,
            effectiveness: effectiveness.effectiveness_score
          })
        }
      }
      
      // 6. CHECKPOINT
      await this.commitCheckpoint()
      
      // Record pressure applied (for budget tracking)
      this.budgetEnforcer.recordPressureApplied()
      
      await this.sleep(100)  // 10 Hz
    }
  }
}
```

---

## Implementation Checklist

To implement all five invariants:

### Invariant 1: Pressure Budget
- [ ] Define pressure budget policy (JSON schema)
- [ ] Implement `PressureBudgetEnforcer` class
- [ ] Add budget checking to pressure loop
- [ ] Implement refusal signaling (not overload)
- [ ] Add adaptive scaling based on load
- [ ] Dashboard for budget monitoring

### Invariant 2: Confidence Floor
- [ ] Define confidence policy (minimum thresholds)
- [ ] Implement `ConfidenceFloorEnforcer` class
- [ ] Update ERI calculation to track confidence
- [ ] UI components for indeterminate state
- [ ] Telemetry coverage improvement workflow
- [ ] Dashboard for confidence monitoring

### Invariant 3: Repair Effectiveness
- [ ] Define effectiveness measurement schedule
- [ ] Implement `RepairEffectivenessTracker` class
- [ ] Add delayed measurement scheduling
- [ ] Learning database for repair policies
- [ ] Repair recommendation engine
- [ ] Dashboard for effectiveness learning

### Invariant 4: Data Minimization
- [ ] Define data minimization policy (whitelist)
- [ ] Implement `DataMinimizationEnforcer` class
- [ ] Consent management for raw telemetry
- [ ] Aggregation-by-default system
- [ ] PII redaction rules
- [ ] Role-based view filters
- [ ] Pseudonymization engine
- [ ] Automatic data expiration

### Invariant 5: Policy Governance
- [ ] Define policy recommendation schema
- [ ] Implement `PolicyGovernanceEnforcer` class
- [ ] Recommendation commit workflow
- [ ] Authority verification for policy changes
- [ ] Canon selection integration (voting)
- [ ] Policy version management
- [ ] Audit trail for all policy changes
- [ ] Dashboard for pending recommendations

---

## Why These Five Complete the Circle

### Without These Invariants

```
System:
├─ Can overload itself (no budget)
├─ Can falsely reassure (no confidence floor)
├─ Cannot improve (no learning loop)
├─ Can become surveillance (no data minimization)
├─ Can drift ungoverned (no policy governance)
└─ DANGEROUS, FRAGILE, UNTRUSTWORTHY
```

### With These Invariants

```
System:
├─ Self-regulating (budget enforced)
├─ Honest about uncertainty (confidence enforced)
├─ Self-improving (learning enabled)
├─ Privacy-preserving (data minimized)
├─ Governed (policy changes authorized)
└─ SAFE, ROBUST, TRUSTWORTHY
```

---

## The Final Lock

**These five invariants are now LOCKED alongside the canonical statement.**

Together they create:
- **Humane pressure** (never overloads)
- **Honest assessment** (never falsely reassures)
- **Learning system** (continuously improves)
- **Privacy-preserving** (never becomes surveillance)
- **Governed** (never drifts ungoverned)

**This is structural immunity with built-in governance.**

---

## Approval Status

✅ **Invariant 1**: Pressure Budget (LOCKED)  
✅ **Invariant 2**: Confidence Floor (LOCKED)  
✅ **Invariant 3**: Repair Effectiveness (LOCKED)  
✅ **Invariant 4**: Data Minimization + Purpose Limitation (LOCKED)  
✅ **Invariant 5**: Learning Cannot Auto-Change Policy (LOCKED)

**Ready for production-safe implementation.**

---

**End of Invariants Document**

*"Pressure that respects capacity, honesty that admits uncertainty, learning that improves over time, privacy that minimizes data, and governance that authorizes change."* - Final Hardening Principle (Complete)
