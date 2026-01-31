# 🤖 AI Participation Model — AI as Commit Proposer, Human as Gatekeeper

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## Core Principle

> **AI never creates filaments. AI only appends commits to existing filaments. A human or policy must "accept" (Gate) before it becomes active.**

In Relay, AI is not autonomous. AI is a **commit proposer**—it suggests changes, but **humans are gatekeepers** who decide which commits become truth.

**Critical Rules:**
> - AI cannot create new filaments (only humans/policies can)
> - AI commits require **GATE glyph** (approval) before merging to active branch
> - AI prompts/weights/outputs are stored as **evidence** (auditable)
> - Content policy + copyright guardrails enforced **before** commit acceptance

---

## Table of Contents

1. [AI Role in Relay](#ai-role-in-relay)
2. [AI-Proposed Commits](#ai-proposed-commits)
3. [Human Gate Approval](#human-gate-approval)
4. [AI as Operator](#ai-as-operator)
5. [Content Policy & Guardrails](#content-policy--guardrails)
6. [Character Generation (Games)](#character-generation-games)
7. [Asset Generation Workflow](#asset-generation-workflow)
8. [Implementation Guide](#implementation-guide)
9. [Real-World Scenarios](#real-world-scenarios)
10. [FAQ](#faq)

---

## AI Role in Relay

### What AI Can Do

✅ **Propose commits:**
- Generate textures (`asset.texture.<id>`)
- Generate meshes (`asset.mesh.<id>`)
- Generate dialogue (`character.dialogue.<id>`)
- Generate code/scripts (`system.script.<id>`)
- Generate spreadsheet formulas (`cell.formula.<id>`)

✅ **Act as operator:**
- Run calculations (e.g., `OPERATOR_RUN` for formulas)
- Process transformations (e.g., image upscaling, audio noise reduction)
- Suggest optimizations (e.g., mesh decimation, texture compression)

---

### What AI Cannot Do

❌ **Create filaments:**
- AI cannot create `character.<id>` or `asset.<id>` filaments
- Only humans or governance policies can create filaments

❌ **Commit without approval:**
- AI commits land on a **proposal branch**, not `main`
- Requires human **GATE** (approval) to merge

❌ **Bypass content policy:**
- Copyright checks, abuse prevention enforced **before** acceptance
- Rejected commits are archived, not merged

---

## AI-Proposed Commits

### Proposal Branch Model

When AI generates content, it creates a commit on a **proposal branch**:

```
Main branch (active truth):
  │
  ├─ Commit 10: Character definition (human)
  │
  ├─ (SPLIT) → ai-proposal-portrait
  │              │
  │              └─ Commit 11: AI-generated portrait (pending approval)
  │
  └─ (waiting for GATE)
```

**Key:**
- **Main branch**: Active, user-facing truth
- **AI proposal branch**: Suggested changes, not yet active
- **GATE glyph**: Human approves → merge to main

---

### AI Commit Structure

```typescript
interface AIProposedCommit {
  envelope: {
    commit_class: string;  // E.g., 'AI_ASSET_GENERATE'
    actor: 'operator:ai-generator';  // AI as actor
    proposal: true;  // Marks as proposal (not active yet)
    requiresGate: true;  // Requires human approval
    // ...
  };
  timeBox: {
    faces: {
      output: any;       // +X: Generated content (hash, URL, or data)
      input: {           // -X: Prompt + dependencies
        prompt: string;
        model: string;
        parameters: Record<string, any>;
      };
      semantic: string;  // +Y: "AI-generated portrait for hero character"
      magnitude: number; // -Y: Generation cost (tokens, time, $)
      identity: 'operator:ai-generator';  // +Z: AI operator ID
      evidence: {        // -Z: Full audit trail
        type: 'ai-generation';
        prompt: string;
        model: string;
        modelVersion: string;
        seed: number;
        weights: string;  // Model weights hash
        outputHash: string;  // Content hash
        timestamp: number;
      };
    };
  };
}
```

---

## Human Gate Approval

### GATE Glyph

**GATE** = Human decision point. Commits pass through only if approved.

**Visual:**
- Aperture/iris mechanism (opens to allow, closes to block)
- Rendered at branch merge point

---

### Approval Flow

```
1. AI generates content → Creates proposal commit
     ↓
2. User reviews proposal:
     - Views generated content (clear projection, L5)
     - Checks evidence (prompt, model, settings)
     - Checks content policy compliance
     ↓
3. User decides:
     [ APPROVE ] or [ REJECT ]
     ↓
4a. If APPROVE:
     - Create GATE commit (approval)
     - Merge proposal branch → main (SCAR glyph)
     - Content becomes active
     ↓
4b. If REJECT:
     - Archive proposal branch (marked rejected)
     - Content never becomes active
     - Audit trail preserved (for review/appeal)
```

---

### GATE Commit Structure

```typescript
{
  commit_class: 'GATE',
  glyph: 'GATE',
  faces: {
    output: {
      decision: 'approve' | 'reject',
      reason: string  // Optional justification
    },
    input: {
      proposalBranch: string;
      proposalCommit: string;
    },
    semantic: 'Approved AI-generated portrait',
    identity: 'user:alice',  // Human gatekeeper
    evidence: {
      type: 'human-review',
      reviewedAt: number,
      contentPolicyCheck: 'pass' | 'fail',
      copyrightCheck: 'pass' | 'fail'
    }
  }
}
```

---

## AI as Operator

### OPERATOR_RUN Commits

AI can also act as a **deterministic operator** (like a formula engine):

**Use Cases:**
- Spreadsheet formula evaluation
- Image upscaling (deterministic algorithm)
- Audio noise reduction
- Mesh optimization (decimation, LOD generation)

**Key Difference:**
> Operators create **direct commits** (no proposal branch needed) because:
> - Output is deterministic (same inputs → same outputs)
> - No creative "judgment" involved
> - Still auditable (algorithm + parameters in evidence)

**Example:**
```typescript
{
  commit_class: 'OPERATOR_RUN',
  glyph: 'KINK',  // Transform
  faces: {
    output: 5000,  // Calculated value
    input: {
      formula: 'SUM(A1:A10)',
      dependencies: ['cell:A1', 'cell:A2', ..., 'cell:A10']
    },
    semantic: 'Calculated budget total',
    identity: 'operator:formula-engine',
    evidence: {
      type: 'calculation',
      operator: 'SUM',
      algorithmHash: 'sha256:abc123...'
    }
  }
}
```

---

## Content Policy & Guardrails

### Three-Layer Safety Model

#### **Layer 1: Pre-Generation Filtering**

**Before AI generates:**
- Check prompt against abuse keywords
- Check prompt against copyright (e.g., "Mickey Mouse" → blocked)
- Check user's content policy settings (e.g., NSFW filter)

**If blocked:** Reject request immediately (no commit created)

---

#### **Layer 2: Post-Generation Validation**

**After AI generates, before commit:**
- Run content moderation (detect NSFW, violence, hate symbols)
- Run copyright detection (perceptual hash matching)
- Run quality checks (resolution, coherence)

**If fails:** Create commit, but mark as **rejected** (audit trail preserved)

---

#### **Layer 3: Human Review (GATE)**

**User reviews:**
- Generated content (visual inspection)
- Evidence (prompt, model, settings)
- Content policy compliance status

**User can:**
- **Approve** → Content becomes active
- **Reject** → Content archived (not active)
- **Flag** → Escalate to moderators/governance

---

### Policy Configuration

```typescript
interface ContentPolicy {
  filamentId: string;
  aiGenerationAllowed: boolean;
  
  // Pre-generation filters
  promptFilters: {
    blockCopyright: boolean;       // Block known copyrighted terms
    blockAbuse: boolean;           // Block abusive/hateful prompts
    nsfwFilter: 'strict' | 'moderate' | 'off';
  };
  
  // Post-generation validation
  outputValidation: {
    moderationRequired: boolean;   // Run content moderation
    copyrightCheck: boolean;       // Run perceptual hash matching
    qualityThreshold: number;      // Minimum quality score (0-1)
  };
  
  // Human review
  gateRequired: boolean;           // Require human GATE approval
  autoApprove: boolean;            // Auto-approve if all checks pass
  reviewers: string[];             // Who can approve (user IDs or roles)
}
```

---

## Character Generation (Games)

### Workflow: AI-Generated Game Characters

**Use Case:** Player wants to create a character with AI-generated portrait and backstory.

#### **Step 1: Player Creates Character Filament**

```typescript
// Player action (human)
createFilament({
  type: 'character',
  id: 'character:hero-001',
  initialCommit: {
    name: 'Aria Stormwind',
    class: 'Mage',
    stats: { strength: 10, intelligence: 18, dexterity: 12 }
  }
});
```

**Result:** `character:hero-001` filament exists (human-created)

---

#### **Step 2: Player Requests AI Portrait**

```typescript
// Player action
requestAIGeneration({
  filamentId: 'character:hero-001',
  assetType: 'portrait',
  prompt: 'Fantasy mage with silver hair, glowing blue eyes, wearing arcane robes',
  style: 'epic-fantasy',
  model: 'stable-diffusion-xl'
});
```

---

#### **Step 3: AI Generates Portrait (Proposal Branch)**

```typescript
// AI action
createProposalBranch({
  filamentId: 'character:hero-001',
  branchName: 'ai-proposal-portrait',
  commit: {
    commit_class: 'AI_ASSET_GENERATE',
    faces: {
      output: {
        assetType: 'image',
        url: 'ipfs://Qm...abc123',  // Generated image hash
        resolution: { width: 1024, height: 1024 },
        format: 'png'
      },
      input: {
        prompt: 'Fantasy mage with silver hair...',
        model: 'stable-diffusion-xl',
        seed: 42,
        steps: 50
      },
      evidence: {
        type: 'ai-generation',
        model: 'stable-diffusion-xl',
        modelVersion: '1.0',
        outputHash: 'sha256:def456...',
        costUSD: 0.02
      }
    }
  }
});
```

**Result:** Proposal branch `ai-proposal-portrait` exists with generated portrait

---

#### **Step 4: Player Reviews & Approves**

```
Player sees:
┌────────────────────────────────┐
│  AI-Generated Portrait Preview │
│                                │
│    [Generated Image]           │
│                                │
│  Prompt: "Fantasy mage..."     │
│  Model: stable-diffusion-xl    │
│  Quality: ✅ Pass              │
│  Copyright: ✅ Clear           │
│                                │
│  [ ✅ Approve ]  [ ❌ Reject ]  │
└────────────────────────────────┘
```

Player clicks **Approve** → System creates GATE commit and merges

---

#### **Step 5: Portrait Becomes Active**

```
character:hero-001 filament:
  ├─ Commit 1: Character definition (player)
  ├─ Commit 2: (SPLIT) → ai-proposal-portrait
  │            └─ Commit 3: AI-generated portrait
  ├─ Commit 4: (GATE) Approved by player
  └─ Commit 5: (SCAR) Merged portrait → now active
```

**Result:** Character now has AI-generated portrait (auditable, approved)

---

## Asset Generation Workflow

### Generalized AI Asset Pipeline

```typescript
async function generateAIAsset(
  filamentId: string,
  assetType: 'texture' | 'mesh' | 'audio' | 'dialogue',
  prompt: string,
  policy: ContentPolicy
): Promise<Result<ProposalBranch>> {
  
  // 1. Pre-generation filtering
  const promptCheck = validatePrompt(prompt, policy.promptFilters);
  if (!promptCheck.pass) {
    return Err({ reason: 'prompt-blocked', details: promptCheck.reason });
  }
  
  // 2. Call AI model
  const generation = await aiService.generate({
    assetType,
    prompt,
    model: selectModel(assetType),  // Different models per asset type
    parameters: getDefaultParameters(assetType)
  });
  
  // 3. Post-generation validation
  const validation = await validateOutput(generation, policy.outputValidation);
  if (!validation.pass) {
    return Err({ reason: 'validation-failed', details: validation.failures });
  }
  
  // 4. Create proposal branch
  const proposalBranch = await createProposalBranch({
    filamentId,
    branchName: `ai-proposal-${assetType}-${Date.now()}`,
    commit: {
      commit_class: 'AI_ASSET_GENERATE',
      faces: {
        output: generation.output,
        input: { prompt, model: generation.model },
        evidence: {
          type: 'ai-generation',
          prompt,
          model: generation.model,
          modelVersion: generation.modelVersion,
          outputHash: generation.hash,
          timestamp: Date.now(),
          validationResults: validation.results
        }
      }
    }
  });
  
  return Ok(proposalBranch);
}
```

---

## Implementation Guide

### AI Service Integration

```typescript
interface AIService {
  // Text-to-image
  generateImage(prompt: string, options: ImageOptions): Promise<GeneratedImage>;
  
  // Text-to-3D (mesh)
  generateMesh(prompt: string, options: MeshOptions): Promise<GeneratedMesh>;
  
  // Text-to-audio
  generateAudio(prompt: string, options: AudioOptions): Promise<GeneratedAudio>;
  
  // Text generation (dialogue, descriptions)
  generateText(prompt: string, options: TextOptions): Promise<GeneratedText>;
}

// Example: Image generation
const aiService = new StableDiffusionService();

const result = await aiService.generateImage(
  'Fantasy mage portrait',
  {
    model: 'sdxl-1.0',
    width: 1024,
    height: 1024,
    steps: 50,
    seed: 42,
    style: 'epic-fantasy'
  }
);

// Result: { imageUrl, hash, metadata }
```

---

### Approval UI Component

```typescript
function AIProposalReview({ proposalBranch }: Props) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  
  const handleApprove = async () => {
    // Create GATE commit
    await createGateCommit({
      proposalBranch: proposalBranch.id,
      decision: 'approve',
      actor: currentUser.id
    });
    
    // Merge branch
    await mergeBranch({
      source: proposalBranch.id,
      target: 'main',
      createSCAR: true
    });
    
    setDecision('approve');
  };
  
  const handleReject = async () => {
    // Create GATE commit (rejection)
    await createGateCommit({
      proposalBranch: proposalBranch.id,
      decision: 'reject',
      reason: 'Does not meet quality standards',
      actor: currentUser.id
    });
    
    // Archive branch (don't merge)
    await archiveBranch(proposalBranch.id);
    
    setDecision('reject');
  };
  
  return (
    <div>
      <h2>AI-Generated Content Review</h2>
      
      {/* Preview */}
      <AIContentPreview content={proposalBranch.latestCommit.faces.output} />
      
      {/* Evidence */}
      <section>
        <h3>Generation Details</h3>
        <pre>{JSON.stringify(proposalBranch.latestCommit.faces.evidence, null, 2)}</pre>
      </section>
      
      {/* Validation Results */}
      <section>
        <h3>Policy Checks</h3>
        <ul>
          <li>Content Moderation: {proposalBranch.validation.moderation}</li>
          <li>Copyright Check: {proposalBranch.validation.copyright}</li>
          <li>Quality Score: {proposalBranch.validation.qualityScore}</li>
        </ul>
      </section>
      
      {/* Actions */}
      {!decision && (
        <div>
          <button onClick={handleApprove}>✅ Approve</button>
          <button onClick={handleReject}>❌ Reject</button>
        </div>
      )}
      
      {decision && (
        <div>Decision: {decision === 'approve' ? 'Approved ✅' : 'Rejected ❌'}</div>
      )}
    </div>
  );
}
```

---

## Real-World Scenarios

### Scenario 1: Game Character Portrait

**Context:** Player creating a new character for RPG game.

**Flow:**
1. Player creates character filament (name, stats, class)
2. Player clicks "Generate Portrait" → enters prompt
3. AI generates image → creates proposal branch
4. Player reviews image in preview panel
5. Player approves → GATE commit + merge
6. Character now has portrait (visible in game)

**Audit Trail:**
- Commit 1: Character created (player)
- Commit 2: AI proposal branch (SPLIT)
- Commit 3: AI-generated portrait (on proposal branch)
- Commit 4: GATE approved (player)
- Commit 5: SCAR merged (portrait active)

---

### Scenario 2: Asset Library Expansion

**Context:** Game developer wants AI-generated texture variations.

**Flow:**
1. Developer selects base texture filament (`asset.texture.wood-01`)
2. Developer requests variations: "Generate 5 variations with different grain patterns"
3. AI generates 5 textures → 5 separate proposal branches
4. Developer reviews all 5 in gallery view
5. Developer approves 3, rejects 2
6. 3 approved textures merge to main, become available in asset library

**Benefit:** Rapid asset iteration with human quality control

---

### Scenario 3: Dialogue Generation for NPCs

**Context:** Game designer needs dialogue for 20 NPCs.

**Flow:**
1. Designer creates NPC character filaments (names, roles, personalities)
2. Designer requests AI dialogue: "Generate greeting dialogue for each NPC"
3. AI generates 20 dialogue options → 20 proposal branches
4. Designer reviews dialogue in script editor
5. Designer approves 15, rejects 3 (off-brand), edits 2 manually
6. Approved dialogue merges, becomes active in game

**Benefit:** Accelerates content creation while maintaining brand voice

---

## FAQ

### General

**Q: Can AI create entire games?**  
A: No. AI can generate **assets** (textures, meshes, dialogue), but **humans define structure** (game rules, levels, systems).

**Q: What if AI generates copyrighted content?**  
A: Post-generation copyright check catches this. User sees warning. If approved anyway, user assumes liability (policy-configurable).

**Q: Can I batch-approve AI generations?**  
A: Yes, if policy allows. "Approve all" option available if all validation checks pass.

---

### Technical

**Q: Where are AI-generated assets stored?**  
A: Same as any asset: **evidence pointer** (e.g., IPFS hash, cloud storage URL). Filament commit references the hash.

**Q: What if AI model changes?**  
A: Evidence stores `modelVersion`. Old generations remain valid (hash proves authenticity). New generations use new model.

**Q: Can I re-generate from same prompt?**  
A: Yes, but may produce different output (unless seed is fixed). Each generation is a new commit.

---

### Safety

**Q: Can AI bypass content policy?**  
A: No. Pre-generation filtering blocks prompts. Post-generation validation flags violations. Human GATE is final check.

**Q: What if someone approves abusive content?**  
A: **Moderators can override** (admin permission). Create new GATE commit (rejection) and archive branch. Audit trail shows who approved + who overrode.

**Q: Can AI learn from user data?**  
A: **Policy-dependent**. By default, no. If org enables model fine-tuning, explicit consent + audit trail required.

---

## Conclusion

The **AI Participation Model** ensures:
- ✅ **AI as assistant, not authority** (proposes, doesn't decide)
- ✅ **Human gatekeepers** (every AI commit requires approval)
- ✅ **Auditable AI** (prompts, models, outputs all evidenced)
- ✅ **Content safety** (three-layer filtering + validation + review)
- ✅ **No autonomous AI** (filament creation is human-only)

By treating AI as a **commit proposer** with **GATE approval**, Relay enables **rapid AI-assisted creation** while maintaining **human oversight and accountability**.

---

**See Also:**
- [Game Production Model](GAME-PRODUCTION-MODEL.md) (AI in game workflows)
- [Multi-Domain Editing](MULTI-DOMAIN-EDITING.md) (Creative tools)
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md) (AI-generated content visibility)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
