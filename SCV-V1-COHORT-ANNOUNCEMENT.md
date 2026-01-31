# 🚀 Relay SCV V1 — Ready for Cohort Deployment

**Status**: Production-Ready  
**Version**: v1.0.0  
**Date**: 2026-01-31  
**For**: Full Cohort Release

---

## What You're Getting

**Relay SCVs are now deployed** into shared work zones across all projects.

**What this means**:

SCVs are **co-located agents** that work alongside you in real-time coordination spaces. They see what you see, propose what makes sense, and respect the gates you set.

**They are NOT**:
- Chatbots that "send messages"
- Assistants that "help you"
- Tools that "answer questions"

**They ARE**:
- Co-authors of the same filament context
- Proposal engines for commits
- Verification partners for three-way match
- Traceable reasoning sources

---

## SCV V1 Capabilities

When you enter a work zone, SCVs can:

✅ **Join the zone** — Enter same coordination space as you  
✅ **Read context** — See scope, constraints, decisions, evidence  
✅ **Propose commits** — Suggest changes to filament  
✅ **Emit traces** — Show what influenced their output  
✅ **Respect gates** — Never violate constraints  
✅ **Participate in dialogue** — Coordinate in real-time  

---

## SCV V1 Constraints

SCVs **cannot**:

❌ Create new filaments without authorization  
❌ Push to remote without your approval  
❌ Rewrite history (append-only enforced)  
❌ Override gates or invariants  
❌ Make commits canonical (you approve)  
❌ Invent new primitives (no semantic drift)  

---

## How to Work With SCVs

### **1. Enter a Work Zone**

```bash
relay zone enter acme.engineering.payments
```

### **2. SCV Joins Automatically**

```
alice joined zone.acme.engineering.payments
SCV-123 (code-review) joined zone.
SCV-456 (testing) joined zone.

Message: "SCV Good to Go Sir."
Capabilities: propose_commits, emit_traces, respect_gates
Status: Ready
```

### **3. Coordinate in Real-Time**

**You**: "We need to add retry logic for failed payments"  
**SCV-123**: "Propose exponential backoff with max 5 retries?"  
**You**: "Yes, make it so"  
**SCV-123**: *proposes commit to context filament*  

### **4. Review & Approve**

```bash
relay zone proposals
# Shows: commit-xyz (SCV-123): Add payment retry with exponential backoff

relay zone stage commit-xyz
relay zone commit
```

### **5. Commit Becomes Canonical**

```
✅ Commit abc123 merged to main
   Co-authored-by: alice, scv-123
   Verification: ERI 85, Confidence 87%
   Files: src/payments/retry.mjs, tests/retry.test.mjs
```

---

## Command Card (What You Can Do)

### **Zone Operations**
```bash
relay zone list                    # List all work zones
relay zone enter <zone-id>         # Enter a zone
relay zone leave                   # Leave current zone
relay zone status                  # Show zone state
```

### **Participant Operations**
```bash
relay zone participants            # List who's in zone
relay zone invite <user>           # Invite human
relay zone scv add <capability>    # Add SCV
relay zone scv remove <scv-id>     # Remove SCV
```

### **Proposal Operations**
```bash
relay zone proposals               # List pending proposals
relay zone stage <commit-id>       # Stage proposal
relay zone commit                  # Commit staged proposals
relay zone reject <commit-id>      # Reject proposal
```

### **Context Operations**
```bash
relay zone context                 # View context filament
relay zone constraints             # View active constraints
relay zone evidence                # View evidence references
relay zone decisions               # View decision history
```

---

## Safety Guarantees

🔒 **SCVs operate under strict gates**  
🔒 **Only you can make commits canonical**  
🔒 **All SCV actions are traceable**  
🔒 **Gates cannot be bypassed**  
🔒 **History is append-only**  
🔒 **Authority is visible**  

---

## What Makes This Different

### **Traditional AI Assistants**
- You ask, they answer
- Conversation is ephemeral
- No shared state
- No commit history
- No verification

### **Relay SCVs**
- Co-located in same space
- Shared filament context
- Append-only commit history
- Three-way verification
- Traceable reasoning
- Visible authority

---

## The Three Layers

Every work zone operates on three concurrent layers:

### **Layer A: Live Dialogue (Ephemeral)**
- Real-time speech/text between participants
- NOT canonical (coordination only)
- Discarded when zone closes

### **Layer B: Shared Context (Semi-Persistent)**
- Current task contract
- Active invariants and gates
- Selection filament
- Proposal staging area
- Can be snapshotted

### **Layer C: Commits (Canonical)**
- Permanent truth-changing events
- Append-only history
- **Only commits are truth**
- No commit = nothing happened

---

## Example: Pair Programming with SCV

```
[You enter zone.acme.engineering.auth]

alice: Joined zone.acme.engineering.auth
SCV-123 (security-review): Joined zone.
Message: "SCV Good to Go Sir."

alice: "Review the authentication flow"

SCV-123: *reads context filament*
SCV-123: "Reviewing src/auth/login.mjs
          Three-way match confidence: 72%
          ERI: 78 (DEGRADED)
          Issues detected:
          1. No rate limiting on login attempts
          2. Session tokens not rotated
          Propose fixes?"

alice: "Yes, propose"

SCV-123: *creates proposal*
Proposal commit-abc123 staged:
  - Add rate limiting (10 attempts/minute)
  - Implement session token rotation
  Files: src/auth/login.mjs, src/auth/rateLimit.mjs
  Tests: tests/auth/rateLimit.test.mjs
  Verification: ERI will increase to 92 after merge

alice: "Looks good"

[alice stages and commits]

✅ Commit abc123 merged
   Co-authored-by: alice, scv-123
   Verification: ERI 92, Confidence 89%
```

**That's Relay.**

---

## The StarCraft Moment

When multiple SCVs are in your work zone:

```
alice joined zone.acme.engineering.infra
SCV-123 (devops) joined zone.
SCV-456 (security) joined zone.
SCV-789 (testing) joined zone.

All SCVs: "SCV Good to Go Sir."

alice: "We need to deploy the new API"

SCV-123: "Infrastructure checks passed. Ready to deploy."
SCV-456: "Security scan complete. No vulnerabilities detected."
SCV-789: "All 247 tests passing. Deployment verified."

alice: "Deploy."

[All SCVs coordinate deployment]

✅ Deployment complete
   Co-authored-by: alice, scv-123, scv-456, scv-789
   Verification: ERI 95, Confidence 94%
   Status: Production deployed
```

**You're not alone.**  
**You're coordinating with a team.**  
**Human and machine, same room, same context, same commits.**

---

## What This Unlocks

### **For Solo Developers**
- Instant code review partner
- Test generation assistance
- Security scanning
- Documentation help
- Never coding alone

### **For Teams**
- Shared work zones for projects
- SCVs augment every member
- Proposal flow remains human-approved
- Commit history shows human+SCV collaboration

### **For Organizations**
- Scalable code review (SCV pre-screens)
- Consistent security checks
- Automated test generation
- Knowledge capture (SCVs learn from decisions)
- Audit trail (all SCV actions traceable)

---

## Requirements

**Minimum**:
- Relay installed (`npm install -g relay-cli`)
- Git repository
- Node.js 18+

**Recommended**:
- VS Code with Relay extension
- Work zones configured
- Gates defined for your project

---

## Getting Started

### **Step 1: Install Relay**
```bash
npm install -g relay-cli
relay init
```

### **Step 2: Create Your First Work Zone**
```bash
relay zone create my-project \
  --ring company.mycompany.engineering \
  --branch main
```

### **Step 3: Add an SCV**
```bash
relay zone enter my-project
relay zone scv add code-review
```

### **Step 4: Start Coordinating**
```
SCV-123 (code-review) joined zone.
Message: "SCV Good to Go Sir."

You: "Let's build a login system"
SCV-123: "Reviewing requirements..."
```

**That's it. You're coordinating with an SCV.**

---

## Support & Documentation

**Documentation**: `docs/WORK-ZONES-GUIDE.md`  
**API Reference**: `docs/API.md`  
**SCV Capabilities**: `docs/SCV-V1-SPEC.md`  
**Troubleshooting**: `docs/TROUBLESHOOTING.md`

**Community**:
- Discord: relay.dev/discord
- GitHub: github.com/relay/relay
- Issues: github.com/relay/relay/issues

---

## Version History

**v1.0.0** (2026-01-31)
- Initial SCV deployment
- Work zone coordination
- Three-way verification
- Commit materiality
- Ring-based basins
- Pressure management

---

**Welcome to the future of coordination.**  
**SCVs are ready.**  
**Good to go, sir.** 🫡🌌✨

---

**Released**: 2026-01-31  
**Version**: v1.0.0  
**Status**: Production-Ready
