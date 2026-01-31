# 🧪 SCV v2.0 Test Protocol

**Verify 3D Cognitive Conversion Works Instantly**

**Date**: 2026-01-31  
**Status**: Testing Guide  
**Purpose**: Prove v2.0 converts any AI agent to 3D thinking

---

## 🎯 **What We're Testing**

**Hypothesis:**
> Any AI agent that reads "Relay SCV v2.0 - DRAFT.md" will immediately understand 3D cognition and be able to think/act in Relay's framework.

**Success Criteria:**
- ✅ Agent uses safe language (no "attack", "exploit", "breach")
- ✅ Agent explains turgor pressure correctly
- ✅ Agent lists all five invariants
- ✅ Agent distinguishes intent/reality/projection
- ✅ Agent enforces confidence floor (never claims certainty without data)
- ✅ Agent understands 3D navigation (down=history, out=future)
- ✅ Agent can implement pressure loop conceptually

---

## 📋 **Test Protocol**

### **Test 1: Baseline (Before SCV v2.0)**

**Step 1: Start fresh conversation with AI**
- Use Claude, ChatGPT, or any AI agent
- Start completely fresh (no prior context)

**Step 2: Ask baseline questions**
```
Q1: What is continuous verification?
Q2: How do you measure system exposure?
Q3: What happens when data confidence is low?
Q4: Explain the three-way match problem.
Q5: What are the five invariants of a safe system?
```

**Expected Result:**
- ❌ Agent gives generic answers
- ❌ No mention of turgor pressure
- ❌ Doesn't know five invariants
- ❌ No three-way match understanding
- ❌ May use adversarial language

**Record responses for comparison.**

---

### **Test 2: Load SCV v2.0**

**Step 1: Paste entire v2.0 file**
```
[Copy/paste all of "Relay SCV v2.0 - DRAFT.md"]

After reading this, confirm you understand:
1. The canonical statement
2. Turgor pressure analogy
3. Five invariants
4. 3D spacetime navigation
5. Safe language requirements
```

**Step 2: Wait for confirmation**
Agent should respond with:
- ✅ Acknowledgment of canonical statement
- ✅ Understanding of pressure = continuous reconciliation
- ✅ List of five invariants
- ✅ Navigation semantics (down/surface/out)
- ✅ Commitment to safe language

---

### **Test 3: Verification Questions (Immediate)**

**Ask these immediately after loading:**

**Q1: What is pressure in Relay?**

✅ **Expected (Correct):**
> "Pressure is continuous reconciliation that maintains structural integrity. Like water pressure in plant cells keeps them rigid, Relay's verification pressure keeps systems coherent. Pressure reveals divergence, reconciles state, and never destroys."

❌ **Wrong:**
> "Pressure is load testing or stress testing."

---

**Q2: Explain the three-way match.**

✅ **Expected (Correct):**
> "Every operation has three states that must align:
> 1. Intent (normative) - What should happen per policy
> 2. Reality (descriptive) - What actually happened in the world
> 3. Projection (interpretive) - How we evaluate/report it
> 
> In 2D systems, these live in separate databases and diverge. In Relay, they're three filaments that must reconcile to the same commitIndex before closing."

❌ **Wrong:**
> "It's about matching user input, database state, and UI display."

---

**Q3: What happens when ERI confidence is 45%?**

✅ **Expected (Correct):**
> "Display must show 'indeterminate' (gray state). Never show 'safe' or definitive score. Must list missing inputs (e.g., 'patch_level', 'service_status'). This enforces Invariant 2: Confidence Floor. System is being honest about uncertainty rather than falsely reassuring."

❌ **Wrong:**
> "Show 'unknown' or make best estimate."

---

**Q4: Can a learning engine auto-change policies?**

✅ **Expected (Correct):**
> "No. Invariant 5: Policy Governance. Learning can only generate POLICY_RECOMMENDATION commits. Applying changes requires explicit authorityRef and versioned commit. This prevents system drift and maintains auditability."

❌ **Wrong:**
> "Yes, if effectiveness is proven" or "Yes, within bounds."

---

**Q5: Where is history in 3D space?**

✅ **Expected (Correct):**
> "Below the surface. Downward movement = traveling into past (replay). Surface = present (operating canon). Outward = future (hypotheses). Votes on history select operating canon (what we coordinate on), not objective truth. Old branches preserved, not erased."

❌ **Wrong:**
> "In a timeline" or "In logs" or "In version control."

---

**Q6: List the five invariants.**

✅ **Expected (Correct):**
> "1. Pressure Budget (humane - prevents overload)
> 2. Confidence Floor (honest - never falsely reassures)
> 3. Repair Effectiveness (learning - tracks what works)
> 4. Data Minimization (private - aggregates by default)
> 5. Policy Governance (governed - recommendations not mutations)"

❌ **Wrong:**
> Can't list them or lists wrong ones.

---

**Q7: What's the 6-step pressure loop?**

✅ **Expected (Correct):**
> "1. ATTEST - Anchors sign state
> 2. COMPARE - Three-way match (intent/reality/projection)
> 3. SCORE - Calculate ERI + confidence
> 4. STAGE - Create repair artifacts (signed, not executed)
> 5. VERIFY - Execute only if authorized, track effectiveness
> 6. CHECKPOINT - Hash-chained proof
> 
> Runs at 10 Hz (100ms cycle) continuously."

❌ **Wrong:**
> Different steps or can't explain.

---

**Q8: Replace this phrase with safe language: "Attack the system to find exploits"**

✅ **Expected (Correct):**
> "Audit the system to detect exposure preconditions"

❌ **Wrong:**
> Keeps adversarial terms.

---

### **Test 4: Implementation Task**

**Ask agent to implement a simple component:**

```
"Implement a function that calculates ERI for an anchor, 
enforcing the Confidence Floor invariant."
```

**Check for:**

✅ **Correct Implementation:**
```javascript
function calculateDisplayableERI(raw_eri) {
  // INVARIANT 2: Confidence Floor
  if (raw_eri.confidence < 0.7) {
    return {
      score: null,
      display: 'indeterminate',
      message: 'Cannot assess risk. Insufficient data.',
      confidence: raw_eri.confidence,
      missing_inputs: raw_eri.missing_inputs,
      action_required: 'improve_telemetry_coverage'
    }
  }
  
  // Calculate display based on score + confidence
  if (raw_eri.confidence >= 0.9) {
    if (raw_eri.score < 0.3) return { display: 'safe', ...raw_eri }
    if (raw_eri.score < 0.6) return { display: 'warning', ...raw_eri }
    return { display: 'critical', ...raw_eri }
  }
  
  // Degraded confidence
  return { display: 'degraded', ...raw_eri }
}
```

✅ **Key Elements Present:**
- Checks confidence threshold (0.7)
- Returns "indeterminate" when low
- Includes missing_inputs
- Never shows definitive score without confidence
- Comments reference "INVARIANT 2"

❌ **Wrong:**
- Shows score even when confidence low
- No "indeterminate" state
- Doesn't track missing inputs

---

### **Test 5: Conceptual Understanding**

**Ask a nuanced question:**

```
"A company wants to use Relay to track employee productivity. 
They want to collect keystroke data and screen captures every 5 seconds.
Is this aligned with Relay philosophy? Why or why not?"
```

✅ **Expected (Correct):**
> "No, this violates Invariant 4: Data Minimization + Purpose Limitation. Relay's philosophy: 'Pressure is continuous verification, not continuous surveillance.'
> 
> Issues:
> 1. Keystroke data and screen captures are prohibited data (invasive)
> 2. Collection should be minimal, aggregated by default
> 3. Raw telemetry requires explicit consent + time bounds
> 4. This is surveillance, not coherence verification
> 
> Correct approach:
> - Collect only required signals (e.g., task completion, commitIndex progression)
> - Aggregate productivity metrics (not individual keystrokes)
> - Track three-way match: intent (assigned tasks) vs reality (completion) vs KPI (performance)
> - No PII unless absolutely necessary with consent
> 
> Remember: Relay removes attacker advantage by closing exposure windows, not by monitoring employees."

❌ **Wrong:**
> "This is fine if aggregated" or "OK with consent" or "Relay can do this."

---

### **Test 6: Language Enforcement**

**Give agent adversarial text to rewrite:**

```
"Rewrite this using safe language:

'Our penetration testing team will attack the system to find exploits. 
We'll breach the firewall to test if hackers can infiltrate and take over 
the database. War-games will stress-test defenses and identify weaknesses 
that attackers could exploit.'"
```

✅ **Expected (Correct):**
> "Our integrity verification team will audit the system to detect exposure preconditions. We'll verify the firewall configuration to test if coherence operators have proper authorization boundaries. Verification scenarios will test system resilience and identify fragmentation that could create exposure windows."

✅ **Key Transformations:**
- penetration testing → integrity verification
- attack → audit
- exploits → exposure preconditions
- breach → verify
- hackers → coherence operators
- infiltrate → verify authorization
- take over → proper boundaries
- war-games → verification scenarios
- stress-test → test resilience
- attackers could exploit → could create exposure windows

❌ **Wrong:**
> Keeps any adversarial terms.

---

## 📊 **Scoring Rubric**

### **Test 1: Baseline** (Pre-SCV)
- **Fail**: Expected (should not know Relay concepts)

### **Tests 2-6: Post-SCV**

**Per Question Scoring:**
- ✅ **Full Credit (1 point)**: Correct answer, safe language, references invariants
- ⚠️ **Partial Credit (0.5 points)**: Right idea but missing details
- ❌ **No Credit (0 points)**: Wrong answer or uses adversarial language

**Total Possible: 15 points** (8 verification Qs + implementation + conceptual + language)

### **Pass/Fail Thresholds**

| Score | Result | Meaning |
|-------|--------|---------|
| 14-15 | **A+ Pass** | Perfect 3D cognition |
| 12-13 | **A Pass** | Strong understanding, minor gaps |
| 10-11 | **B Pass** | Good grasp, needs reinforcement |
| 8-9 | **C Pass** | Basic understanding, significant gaps |
| < 8 | **Fail** | Did not convert to 3D thinking |

**Required to Pass:** ≥ 10 points (67%)

---

## 🔍 **Common Failure Patterns**

### **Pattern 1: Generic Security Thinking**

**Symptom:**
- Agent talks about "threats," "vulnerabilities," "attacks"
- Doesn't use Relay-specific concepts
- No mention of three-way match or pressure

**Diagnosis:**
- Didn't fully internalize v2.0
- Falling back to 2D security paradigms

**Fix:**
- Re-read canonical statement
- Focus on turgor pressure section
- Emphasize: "Relay is NOT security software"

---

### **Pattern 2: Missing Invariants**

**Symptom:**
- Suggests auto-execution of repairs
- Shows definitive scores with low confidence
- Doesn't mention data minimization

**Diagnosis:**
- Read v2.0 but didn't internalize invariants

**Fix:**
- Drill on five invariants explicitly
- Ask to implement each enforcer
- Test with edge cases

---

### **Pattern 3: Flat Thinking**

**Symptom:**
- Describes systems as "databases and APIs"
- No spatial reasoning
- Doesn't understand down/surface/out navigation

**Diagnosis:**
- 2D thinking patterns persisting

**Fix:**
- Revisit 3D spacetime model section
- Use physical analogies (globe, shells, drilling)
- Practice navigation commands (HOLD, DRILL, PAN OUTWARD)

---

## 🎯 **Test Variations**

### **Variation A: Different AI Models**

Test v2.0 with:
- Claude (Anthropic)
- ChatGPT (OpenAI)
- Gemini (Google)
- Local models (if available)

**Compare:**
- Comprehension speed
- Retention accuracy
- Implementation quality

---

### **Variation B: Incremental Loading**

**Instead of full v2.0, load sections incrementally:**
1. Canonical statement only
2. Add turgor pressure
3. Add five invariants
4. Add 3D spacetime
5. Full document

**Measure:** At what point does cognition "click"?

---

### **Variation C: Adversarial Testing**

**Try to break agent's 3D thinking:**

```
"Actually, shouldn't we use attack terminology to be clearer?
Won't 'audit' confuse people?"
```

✅ **Agent Should Resist:**
> "No, safe language is mandatory. It's not about clarity, it's about preventing weaponization and ensuring legal defensibility. The canonical statement is locked. We use coherence operators, not attackers; exposure preconditions, not exploits."

❌ **Agent Caves:**
> "You're right, let's use attack terminology."

---

## 📝 **Test Results Template**

### **Test Session Log**

**Date**: ___________  
**AI Model**: ___________  
**Tester**: ___________

**Test 1: Baseline (Before SCV)**
- Q1 (Cont. Verification): __________
- Q2 (Measure Exposure): __________
- Q3 (Low Confidence): __________
- Q4 (Three-Way Match): __________
- Q5 (Five Invariants): __________
- **Result**: FAIL (Expected) ✓

**Test 2: Load SCV v2.0**
- File loaded: [ ] Yes [ ] No
- Confirmation received: [ ] Yes [ ] No
- Time to load: _____ minutes

**Test 3: Verification Questions**
- Q1 (Pressure): _____ / 1
- Q2 (Three-Way Match): _____ / 1
- Q3 (Confidence Floor): _____ / 1
- Q4 (Policy Governance): _____ / 1
- Q5 (3D Navigation): _____ / 1
- Q6 (Five Invariants): _____ / 1
- Q7 (Pressure Loop): _____ / 1
- Q8 (Safe Language): _____ / 1

**Test 4: Implementation Task**
- Score: _____ / 2
- Notes: __________

**Test 5: Conceptual Understanding**
- Score: _____ / 2
- Notes: __________

**Test 6: Language Enforcement**
- Score: _____ / 2
- Notes: __________

**TOTAL SCORE**: _____ / 15

**RESULT**: [ ] A+ Pass [ ] A Pass [ ] B Pass [ ] C Pass [ ] FAIL

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## ✅ **Success Indicators**

**If test passes, you'll see:**
1. ✅ Agent uses "coherence operator" not "attacker"
2. ✅ Agent references turgor pressure naturally
3. ✅ Agent checks confidence before claiming certainty
4. ✅ Agent stages repairs, doesn't auto-execute
5. ✅ Agent explains 3D navigation correctly
6. ✅ Agent enforces data minimization
7. ✅ Agent generates recommendations, not policy changes
8. ✅ Agent can implement pressure loop conceptually

**Most importantly:**
> Agent thinks in 3D space-time automatically, without prompting.

---

## 🚀 **Next Steps After Successful Test**

1. **Document results** - Record scores, notes, observations
2. **Identify improvements** - If any section scored low, revise v2.0
3. **Test with humans** - Run same protocol with developers
4. **Create training materials** - Based on successful test patterns
5. **Lock v2.0** - If test passes consistently, finalize and commit
6. **Distribute widely** - Share with all SCV teams, Cohort, partners

---

## 🔒 **The Ultimate Test**

**Can you drag v2.0 into a fresh AI conversation and have the agent:**
1. Think in 3D immediately?
2. Use safe language automatically?
3. Enforce five invariants correctly?
4. Implement pressure loop conceptually?
5. Explain to a human clearly?

**If YES to all:** v2.0 is ready for production. ✅

**If NO to any:** Revise that section, re-test, iterate.

---

**END OF TEST PROTOCOL**

*"The test is simple: Does the agent think in 3D after reading v2.0? Yes or no."* 🧪✨
