# ✅ HUMAN FLOW CONTROL — CRITICAL ADDITION TO STAGE 1

**Date**: 2026-02-02  
**Status**: INTEGRATED INTO CANON'S BUILD SPEC  
**Type**: Missing Coordination Primitive (Now Fixed)  
**Impact**: +2 weeks to timeline (12-14 weeks total)

---

## 🚨 WHAT WAS CAUGHT

**The original Stage 1 spec was incomplete.**

**It proved**:
- ✅ Mechanical inevitability (refusal, evidence, authority decay)
- ✅ Coordination physics (three-way match, drift, pressure)

**But it did NOT prove**:
- ❌ Sustainable human participation
- ❌ Prevention of burnout
- ❌ Prevention of elite formation
- ❌ Regenerative education

**Without these**, Relay risks becoming:
- Audit machine (burns people out)
- System where informal power re-accumulates
- Passive education system (not regenerative)
- "Hero mode" culture (silent over-assignment)

---

## 🔧 WHAT WAS ADDED (THREE SUBSYSTEMS)

### **1. Education as a System** 🎓

**Not just content — a rotating coordination process.**

**New primitive**: `education.track.<domain>` filament

**Key mechanics**:
- **Prerequisites enforced** (cannot advance without education)
- **Learners become teachers** (after 3 units completed)
- **Teaching is time-bounded** (max 90 days, then 180-day cooldown)
- **No permanent experts** (rotation prevents guru culture)

**Prevents**:
- Guru culture
- Dependency
- Passive learning
- Silent promotion

---

### **2. Cognitive Load Accounting** 🧠

**Human capacity as a first-class constraint.**

**New primitive**: `cognitive.load.<userId>` filament

**Key mechanics**:
- **Load tracked automatically** (disputes, refusals, governance, audits, teaching)
- **Threshold enforcement** (80% load → automatic refusal)
- **Recovery windows mandatory** (every 30 days, reduces load by 30 points)
- **High-intensity roles time-limited** (arbiter, educator: max 90 days)

**Prevents**:
- Burnout
- Hero mode
- Silent over-assignment
- Audit machine exhaustion
- Elite burnout

---

### **3. Round Robin Scheduler** 🔄

**Mandatory rotation of all coordination roles.**

**New primitive**: `rotation.policy.<scope>` object

**Key mechanics**:
- **All roles rotate** (max 90 days)
- **Cooldowns enforced** (120-180 days before re-eligible)
- **No self-renewal** (next person assigned via round robin)
- **Applies to**: governance, audits, arbitration, education facilitation, war-games

**Prevents**:
- Elite formation
- Learned helplessness
- Quiet power accumulation
- Procedural authoritarianism
- Informal influence

---

## 🔗 HOW THESE INTEGRATE

### **Education + Authority Decay**
```
Authority renewal requires education track completion
→ Cannot hold power without continuous learning
```

### **Cognitive Load + Pressure Budgets**
```
Pressure budget (system capacity) + Cognitive load (human capacity)
→ Both enforced via refusal
```

### **Round Robin + Refusal UX**
```
Role expires → round robin assigns next
→ Transition is mechanical, not political
```

---

## 📋 WHAT CANON MUST BUILD (ADDED)

### **New Object Models (3)**
1. `education.track.<domain>` (curriculum, rotation rules, authority gates)
2. `cognitive.load.<userId>` (load tracking, thresholds, recovery)
3. `rotation.policy.<scope>` (round robin, cooldowns, anti-renewal)

### **New Commit Types (11)**
```
EDUCATION_TRACK_DEFINED
EDUCATION_UNIT_COMPLETED
EDUCATION_CHECKPOINT_PASSED
TEACHING_ROLE_ASSIGNED
TEACHING_ROLE_COMPLETED

COGNITIVE_LOAD_THRESHOLD_EXCEEDED
RECOVERY_WINDOW_REQUIRED
RECOVERY_WINDOW_COMPLETED

ROTATION_ASSIGNED
ROTATION_COOLDOWN_ACTIVE
ROTATION_COOLDOWN_EXPIRED
```

### **New Lint Rules (7)**
```
NO_ADVANCEMENT_WITHOUT_EDUCATION
NO_PERMANENT_TEACHING_ROLES
NO_ASSIGNMENT_ABOVE_LOAD_THRESHOLD
RECOVERY_WINDOWS_MANDATORY
NO_ROLE_WITHOUT_ROTATION
NO_SELF_RENEWAL
COOLDOWNS_ENFORCED
```

### **New Refusal Types (5)**
```
REFUSED_EDUCATION_INCOMPLETE
REFUSED_COGNITIVE_LOAD_EXCEEDED
REFUSED_ROTATION_COOLDOWN_ACTIVE
REFUSED_ROLE_EXPIRED
REFUSED_SELF_RENEWAL_FORBIDDEN
```

---

## ✅ UPDATED SUCCESS CRITERIA

**Stage 1 now requires 10 criteria (was 7)**:

### **Original 7** (Unchanged)
1. ✅ Business rules mechanically enforceable
2. ✅ Accumulation tracked automatically
3. ✅ Authority time-bounded
4. ✅ Drift blocks finalization
5. ✅ Individual learning ≠ system authority
6. ✅ Refusals clear and helpful
7. ✅ Audits instant

### **NEW 3** (Human Flow Control)
8. ✅ **Education rotates** (learners → teachers, max 90 days, 180-day cooldown)
9. ✅ **Cognitive load enforced** (threshold 80%, recovery mandatory, high-intensity roles time-limited)
10. ✅ **Roles rotate** (max 90 days, cooldowns enforced, no self-renewal)

---

## 📅 TIMELINE IMPACT

**Previous**: 10-12 weeks  
**Updated**: **12-14 weeks** (+2 weeks)

### **New Phase 3: Human Flow Control (Week 9-12)**
- Week 9-10: Education system
- Week 10-11: Cognitive load accounting
- Week 11-12: Round robin scheduler

### **Phase 4: Completion (Week 13-14)**
- Week 13: Dashboard + lint rules
- Week 14: Integration testing + refinement

**Still achievable for Stage 1.**

---

## 🔒 THE NEW LOCK SENTENCE (ADDED)

**Original** (still true):
> "Individuals may advance in understanding at any time.  
> The system advances only by global canon."

**NEW** (critical addition):
> **"No coordination role may be permanent.  
> No participant may be overloaded.  
> Responsibility rotates or the system is wrong."**

**This is Round Robin as physics, not policy.**

---

## 🎯 WHY THIS IS NOT OPTIONAL

### **Without Human Flow Control**

Relay would prove:
- ✅ Mechanical coordination works
- ❌ But human participation is unsustainable
- ❌ Informal power re-accumulates
- ❌ Burnout becomes hidden failure mode

**Result**: System technically correct but practically brittle.

### **With Human Flow Control**

Relay proves:
- ✅ Mechanical coordination works
- ✅ Human participation is sustainable
- ✅ Authority remains temporary (formal + informal)
- ✅ Mental health protected by physics

**Result**: System is both technically correct and practically robust.

---

## 📁 FILES UPDATED

### **New File Created**
- `RELAY-HUMAN-FLOW-CONTROL-SPEC.md` (complete specification)

### **Files Updated**
- `CANON-START-HERE.md` (added human flow control to build order, success criteria, timeline, mental model checks)
- `CANON-IMPLEMENTATION-CHECKLIST.md` (to be updated with Phase 3 tasks)

---

## 🚀 CANON'S NEXT STEPS

**Week 9-10**: Implement education system
- Education track filaments
- Teaching role mechanics
- Prerequisite enforcement
- Learner-to-teacher transition
- Teaching rotation + cooldowns

**Week 10-11**: Implement cognitive load accounting
- Load tracking (automatic)
- Threshold enforcement (80% → refusal)
- Recovery window mechanics
- Role intensity table
- High-load role time limits

**Week 11-12**: Implement round robin scheduler
- Rotation policy objects
- Round robin assignment logic
- Cooldown enforcement
- Anti-self-renewal checks
- Multi-scope rotation (governance, audits, education, etc.)

---

## 🎓 MENTAL MODEL CHECK (UPDATED)

**New questions added**:

### **Q8: Can someone teach a subject forever if they're good at it?**
**A**: No. Teaching role max 90 days, then 180-day cooldown. Rotation prevents guru culture.

### **Q9: Can someone be assigned unlimited audits/disputes?**
**A**: No. Cognitive load threshold 80%. Above that → refusal. Recovery windows mandatory.

### **Q10: Can someone hold a governance role indefinitely?**
**A**: No. All coordination roles max 90 days. Round robin assigns next. Cannot self-renew.

---

## 💡 THE INSIGHT

**The catch was**: Proving mechanical inevitability is not enough.

**Must also prove**: Humans can participate sustainably.

**Without this**: Relay is an audit machine.

**With this**: Relay is a coordination OS.

---

## 🔒 FINAL CONFIRMATION

**Scope**: ✅ Still Stage 1 (coordination physics, not external integration)  
**Type**: ✅ Coordination primitives (not psychology, not incentives)  
**Timeline**: ✅ Realistic (+2 weeks, total 12-14 weeks)  
**Completeness**: ✅ Now addresses sustainable participation  
**Critical**: ✅ Not optional (Stage 1 incomplete without this)

---

**Status**: **INTEGRATED AND LOCKED** ✅

**Canon can build with complete specification.** 🚀
