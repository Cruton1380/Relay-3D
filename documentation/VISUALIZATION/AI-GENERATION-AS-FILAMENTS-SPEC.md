# 🤖 AI Generation as Filaments — Prompting as Authored Lifecycle

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-28

---

## 🔒 Core Invariant

> **"Prompting is an authored lifecycle, not a textbox. AI work is a filament-native conversation where intent, generation, and artifacts are inspectable truth objects."**

This is not a feature. This is **how Relay talks to AI**—both user-facing generation (image/video) and internal AI (understanding ideas, reasoning over filaments).

---

## Table of Contents

1. [The Problem with Textboxes](#the-problem-with-textboxes)
2. [Three Filament Classes](#three-filament-classes)
3. [Prompt Filaments](#prompt-filaments)
4. [Generation Filaments](#generation-filaments)
5. [Artifact Filaments](#artifact-filaments)
6. [AI Conversation as Geometry](#ai-conversation-as-geometry)
7. [Internal AI (Filament-Native Reasoning)](#internal-ai-filament-native-reasoning)
8. [Gates & Governance](#gates--governance)
9. [Image/Video Generation Flow](#imagevideo-generation-flow)
10. [Real-World Examples](#real-world-examples)
11. [Technical Architecture](#technical-architecture)
12. [FAQ](#faq)

---

## The Problem with Textboxes

### Traditional AI Interaction

**Model:**
- User types prompt in textbox
- AI generates output
- Output displayed (no history)
- Prompt forgotten
- No iteration trail
- No governance

**Example:**
```javascript
const prompt = "Generate a budget chart";
const output = await ai.generate(prompt);
displayOutput(output);  // ❌ No history, no governance
```

**Problems:**
- **No audit trail** (can't see what was asked)
- **No iteration history** (lost context)
- **No governance** (AI output is instant truth)
- **No accountability** (who approved this?)
- **No versioning** (can't compare iterations)

---

## Three Filament Classes

### Overview

**AI work requires three interlinked filament types:**

1. **`prompt.*`** — What you asked for (intent + constraints)
2. **`gen.*`** — What AI proposed (generation attempts + parameters)
3. **`artifact.*`** — What was created (image/video/audio/text outputs)

**Relationship:**
```
prompt.budget-chart-2026
  ↓ (spawns)
gen.budget-chart-attempt-1
  ↓ (produces)
artifact.budget-chart-v1.png

prompt.budget-chart-2026
  ↓ (spawns)
gen.budget-chart-attempt-2
  ↓ (produces)
artifact.budget-chart-v2.png
```

**Topology:**
- Gen filaments reference prompt (inputs)
- Artifact filaments reference gen (provenance)
- Prompt can spawn multiple gens (iterations)

---

## Prompt Filaments

### Definition

**Prompt Filament** = The user's intent, constraints, and refinements over time.

**Filament ID:** `prompt:<domain>:<id>`

**Example:** `prompt:image:logo-redesign`

---

### Commit Schema

#### Commit: PROMPT_CREATED

```typescript
{
  filamentId: 'prompt:image:logo-redesign',
  commitIndex: 0,
  ts: Date.now(),
  actor: { kind: 'user', id: 'user:alice' },
  op: 'PROMPT_CREATED',
  payload: {
    domain: 'image',              // image | video | audio | text
    intent: 'Redesign company logo with modern minimalist style',
    constraints: {
      style: 'minimalist',
      colors: ['#0088ff', '#00ff00'],
      resolution: '1024x1024',
      format: 'PNG'
    },
    context: {
      lensContext: 'brand-refresh-2026',
      policyTier: 'L6',            // Who can see/use output
      usageRights: 'internal-only'
    }
  }
}
```

---

#### Commit: PROMPT_REFINED

```typescript
{
  commitIndex: 1,
  ts: Date.now(),
  actor: { kind: 'user', id: 'user:alice' },
  op: 'PROMPT_REFINED',
  payload: {
    refinement: 'Add geometric shapes, remove gradients',
    updatedConstraints: {
      style: 'minimalist-geometric',
      gradients: false
    }
  }
}
```

---

#### Commit: PROMPT_APPROVED

```typescript
{
  commitIndex: 2,
  ts: Date.now(),
  actor: { kind: 'user', id: 'user:manager' },
  op: 'PROMPT_APPROVED',
  payload: {
    approvalNote: 'Intent is clear, proceed with generation',
    approvedBy: 'user:manager'
  }
}
```

---

### Why Prompts Are Filaments

**Reasons:**
1. **Intent evolves** (refinements are commits)
2. **Governance required** (some prompts need approval)
3. **Reusable** (same prompt → multiple generations)
4. **Auditable** ("Why did we generate this?")
5. **Privacy-gated** (prompt may contain sensitive info)

---

## Generation Filaments

### Definition

**Generation Filament** = An AI's attempt to fulfill a prompt.

**Filament ID:** `gen:<domain>:<attemptId>`

**Example:** `gen:image:logo-redesign-attempt-1`

---

### Commit Schema

#### Commit: GENERATION_STARTED

```typescript
{
  filamentId: 'gen:image:logo-redesign-attempt-1',
  commitIndex: 0,
  ts: Date.now(),
  actor: { kind: 'ai', id: 'dalle-3' },
  op: 'GENERATION_STARTED',
  refs: {
    inputs: [
      { filamentId: 'prompt:image:logo-redesign', commitIndex: 2 }
    ]
  },
  payload: {
    model: 'dalle-3',
    parameters: {
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
      seed: 42
    },
    estimatedDuration: 15000  // 15 seconds
  }
}
```

---

#### Commit: GENERATION_COMPLETED

```typescript
{
  commitIndex: 1,
  ts: Date.now(),
  actor: { kind: 'ai', id: 'dalle-3' },
  op: 'GENERATION_COMPLETED',
  payload: {
    artifactId: 'artifact:image:logo-v1.png',
    duration: 14523,  // Actual time (ms)
    status: 'SUCCESS',
    metadata: {
      model: 'dalle-3',
      revised_prompt: 'A minimalist geometric company logo...',  // AI's interpretation
      seed: 42
    }
  },
  refs: {
    outputs: [
      { filamentId: 'artifact:image:logo-v1.png', commitIndex: 0 }
    ]
  },
  evidence: {
    safetyCheck: { status: 'PASS', flags: [] },
    qualityScore: 0.89,
    computeCost: 0.04  // USD
  }
}
```

---

#### Commit: GENERATION_FAILED

```typescript
{
  commitIndex: 1,
  ts: Date.now(),
  actor: { kind: 'ai', id: 'dalle-3' },
  op: 'GENERATION_FAILED',
  payload: {
    errorType: 'SAFETY_VIOLATION',
    errorMessage: 'Prompt contains prohibited content',
    safetyFlags: ['violence', 'gore']
  },
  evidence: {
    safetyCheck: { status: 'FAIL', flags: ['violence', 'gore'] },
    retryRecommendation: 'Refine prompt to remove prohibited content'
  }
}
```

---

### Why Generations Are Filaments

**Reasons:**
1. **Multiple attempts** (same prompt → many generations)
2. **Parameters matter** (seed, model, temperature are evidence)
3. **Failures are truth** (safety violations, timeouts)
4. **Governance** (some generations need review before use)
5. **Provenance** ("Which AI made this? When? With what params?")

---

## Artifact Filaments

### Definition

**Artifact Filament** = The actual output (image, video, audio, text).

**Filament ID:** `artifact:<type>:<id>`

**Example:** `artifact:image:logo-v1.png`

---

### Commit Schema

#### Commit: ARTIFACT_CREATED

```typescript
{
  filamentId: 'artifact:image:logo-v1.png',
  commitIndex: 0,
  ts: Date.now(),
  actor: { kind: 'system', id: 'artifact-service' },
  op: 'ARTIFACT_CREATED',
  refs: {
    inputs: [
      { filamentId: 'gen:image:logo-redesign-attempt-1', commitIndex: 1 }
    ]
  },
  payload: {
    type: 'image',
    format: 'PNG',
    size: 245760,  // Bytes
    resolution: { width: 1024, height: 1024 },
    storageRef: 'ipfs://Qm...' || 's3://bucket/logo-v1.png',
    checksum: 'sha256:9f86d081...'
  },
  evidence: {
    generatedBy: 'dalle-3',
    generatedAt: 1738024800000,
    safetyCheck: { status: 'PASS', flags: [] },
    moderation: { status: 'PASS', categories: {} }
  }
}
```

---

#### Commit: ARTIFACT_EDITED

```typescript
{
  commitIndex: 1,
  ts: Date.now(),
  actor: { kind: 'user', id: 'user:alice' },
  op: 'ARTIFACT_EDITED',
  payload: {
    editType: 'CROP',
    editParams: { x: 0, y: 0, width: 800, height: 800 },
    newStorageRef: 's3://bucket/logo-v1-cropped.png',
    newChecksum: 'sha256:abc123...'
  }
}
```

---

#### Commit: ARTIFACT_APPROVED

```typescript
{
  commitIndex: 2,
  ts: Date.now(),
  actor: { kind: 'user', id: 'user:manager' },
  op: 'ARTIFACT_APPROVED',
  payload: {
    approvalType: 'FINAL_USE',
    approvedFor: 'Website, marketing materials',
    approvalNote: 'Looks great, approved for production'
  }
}
```

---

### Why Artifacts Are Filaments

**Reasons:**
1. **Versioning** (edits, crops, filters are commits)
2. **Provenance** (which gen created this? which prompt?)
3. **Governance** (approval gates before use)
4. **Usage tracking** (where is this artifact used?)
5. **Derivatives** (forks: different crops, resolutions)

---

## AI Conversation as Geometry

### Topology View

**Render the full conversation chain:**

```
prompt:logo-redesign
  ↓
gen:attempt-1 (FAIL: safety violation)
  ↓
gen:attempt-2 (SUCCESS)
  ↓
artifact:logo-v1.png
  ↓
artifact:logo-v1-cropped.png (edit)
  ↓
artifact:logo-v1-final.png (approval)
```

**3D Layout:**
```
      Prompt
        │
    ┌───┴───┐
    │       │
  Gen-1   Gen-2
  (FAIL)  (SUCCESS)
            │
        Artifact-v1
            │
       ┌────┴────┐
       │         │
  Cropped    Final
             (Approved)
```

**Benefit:** **Entire creative process visible as geometry.**

---

### Iteration History

**User refines prompt multiple times:**

```
prompt:logo-redesign
  Commit 0: PROMPT_CREATED ("minimalist style")
  Commit 1: PROMPT_REFINED ("add geometric shapes")
  Commit 2: PROMPT_REFINED ("remove gradients")
  Commit 3: PROMPT_APPROVED
  
  ↓ spawns
  
gen:attempt-1 (based on commit 0)
  → artifact:v1 (not quite right)
  
gen:attempt-2 (based on commit 1)
  → artifact:v2 (better)
  
gen:attempt-3 (based on commit 2)
  → artifact:v3 (perfect!)
```

**Rendering:**
- Timeline shows refinement progression
- Topology shows which gen used which prompt version
- Can replay: "Why did v2 look different from v1?"

---

## Internal AI (Filament-Native Reasoning)

### Core Concept

**Internal AI** (Relay's reasoning system) doesn't get "app state"—it gets **filaments**.

**What AI receives:**
1. **Relevant filament segment(s)**
   - Specific commits (not entire history)
   - Based on lens context (what user is doing)

2. **Lens context**
   - What is the user trying to do?
   - What view are they in? (globe, workflow, spreadsheet)

3. **Allowed policy tier**
   - What can AI see? (L0-L6)
   - Respects Privacy Ladder

4. **Target locus**
   - What is being edited/inspected?
   - Where should AI focus?

---

### AI Query Format

**Traditional AI prompt:**
```
User: "Analyze this budget and find anomalies"
```

**Relay AI prompt (filament-native):**
```typescript
{
  queryType: 'ANALYSIS',
  intent: 'Find budget anomalies',
  context: {
    filamentRefs: [
      { filamentId: 'budget-2026', commitIndex: 'latest' },
      { filamentId: 'budget-2025', commitIndex: 'latest' }  // For comparison
    ],
    lensContext: 'audit',
    policyTier: 'L5',  // AI sees read-only clear view
    targetLocus: 'budget-2026:Q1:total'  // Focus area
  },
  constraints: {
    thresholdVariance: 0.1,  // Flag if >10% change
    compareAgainst: 'budget-2025',
    outputFormat: 'insight-filament'  // AI creates insight filament
  }
}
```

**AI response:**
```typescript
// AI creates insight filament (proposal)
{
  filamentId: 'insight:budget-anomaly-2026-Q1',
  commits: [
    {
      commitIndex: 0,
      actor: { kind: 'ai', id: 'gpt-4-budget-analyzer' },
      op: 'INSIGHT_PROPOSED',
      refs: {
        inputs: [
          { filamentId: 'budget-2026', commitIndex: 42 },
          { filamentId: 'budget-2025', commitIndex: 38 }
        ]
      },
      payload: {
        insightType: 'ANOMALY',
        summary: 'Q1 spending increased 25% vs last year',
        details: {
          category: 'Marketing',
          expected: 100000,
          actual: 125000,
          variance: 25000,
          variancePercent: 0.25
        },
        confidence: 0.87,  // AI's confidence
        coverage: 1.0       // Read all Q1 data
      },
      evidence: {
        model: 'gpt-4',
        reasoning: '...',
        computeTokens: 1523,
        temperature: 0.2
      }
    }
  ]
}
```

---

### Why This Matters

**Benefits:**
- ✅ **AI reasoning is auditable** (see what filaments AI read)
- ✅ **AI output is governed** (proposal, not truth)
- ✅ **Confidence & coverage visible** (encoded as geometry)
- ✅ **Replay reveals AI's logic** (inspect inputs/outputs)

---

## Prompt Filaments

### Structure

```typescript
interface PromptFilament {
  id: string;  // prompt:<domain>:<id>
  commits: Array<{
    op: 'PROMPT_CREATED' | 'PROMPT_REFINED' | 'PROMPT_APPROVED' | 'PROMPT_CANCELLED';
    payload: {
      domain: 'image' | 'video' | 'audio' | 'text' | 'analysis';
      intent: string;            // What user wants
      constraints?: object;      // Style, format, limits
      context?: {
        lensContext: string;
        policyTier: string;
        usageRights: string;
      };
    };
  }>;
}
```

---

### Example: Image Generation Prompt

```javascript
const promptFilament = {
  id: 'prompt:image:product-mockup',
  commits: [
    {
      commitIndex: 0,
      op: 'PROMPT_CREATED',
      payload: {
        domain: 'image',
        intent: 'Product mockup for new smartphone app',
        constraints: {
          style: 'photorealistic',
          resolution: '2048x2048',
          elements: ['iPhone', 'hand holding phone', 'app UI visible'],
          lighting: 'natural daylight'
        }
      }
    },
    {
      commitIndex: 1,
      op: 'PROMPT_REFINED',
      payload: {
        refinement: 'Change to Android phone, darker background'
      }
    },
    {
      commitIndex: 2,
      op: 'PROMPT_APPROVED',
      payload: {
        approvedBy: 'user:design-lead'
      }
    }
  ]
};
```

---

## Generation Filaments

### Structure

```typescript
interface GenerationFilament {
  id: string;  // gen:<domain>:<attemptId>
  commits: Array<{
    op: 'GENERATION_STARTED' | 'GENERATION_COMPLETED' | 'GENERATION_FAILED';
    refs: {
      inputs: Array<{ filamentId: string; commitIndex: number }>;  // Prompt ref
      outputs?: Array<{ filamentId: string; commitIndex: number }>; // Artifact ref
    };
    payload: {
      model: string;
      parameters: object;
      status?: 'SUCCESS' | 'FAIL';
      artifactId?: string;
    };
    evidence: {
      safetyCheck: { status: string; flags: string[] };
      computeCost: number;
      duration: number;
    };
  }>;
}
```

---

### Example: DALL-E Generation

```javascript
const genFilament = {
  id: 'gen:image:product-mockup-attempt-1',
  commits: [
    {
      commitIndex: 0,
      op: 'GENERATION_STARTED',
      actor: { kind: 'ai', id: 'dalle-3' },
      refs: {
        inputs: [{ filamentId: 'prompt:image:product-mockup', commitIndex: 2 }]
      },
      payload: {
        model: 'dalle-3',
        parameters: {
          size: '2048x2048',
          quality: 'hd',
          style: 'natural',
          n: 1,
          seed: 12345
        }
      }
    },
    {
      commitIndex: 1,
      op: 'GENERATION_COMPLETED',
      payload: {
        artifactId: 'artifact:image:product-mockup-v1.png',
        duration: 18234,
        status: 'SUCCESS'
      },
      refs: {
        outputs: [{ filamentId: 'artifact:image:product-mockup-v1.png', commitIndex: 0 }]
      },
      evidence: {
        safetyCheck: { status: 'PASS', flags: [] },
        qualityScore: 0.91,
        computeCost: 0.04
      }
    }
  ]
};
```

---

## Artifact Filaments

### Structure

```typescript
interface ArtifactFilament {
  id: string;  // artifact:<type>:<filename>
  commits: Array<{
    op: 'ARTIFACT_CREATED' | 'ARTIFACT_EDITED' | 'ARTIFACT_APPROVED' | 'ARTIFACT_PUBLISHED';
    refs: {
      inputs: Array<{ filamentId: string; commitIndex: number }>;  // Gen ref
    };
    payload: {
      type: 'image' | 'video' | 'audio' | 'text';
      format: string;
      size: number;
      storageRef: string;  // IPFS, S3, etc.
      checksum: string;
    };
    evidence: {
      generatedBy: string;
      safetyCheck: object;
      moderation: object;
    };
  }>;
}
```

---

### Example: Image Artifact with Edits

```javascript
const artifactFilament = {
  id: 'artifact:image:product-mockup-v1.png',
  commits: [
    {
      commitIndex: 0,
      op: 'ARTIFACT_CREATED',
      refs: {
        inputs: [{ filamentId: 'gen:image:product-mockup-attempt-1', commitIndex: 1 }]
      },
      payload: {
        type: 'image',
        format: 'PNG',
        size: 3145728,
        resolution: { width: 2048, height: 2048 },
        storageRef: 's3://relay-artifacts/product-mockup-v1.png',
        checksum: 'sha256:abc123...'
      },
      evidence: {
        generatedBy: 'dalle-3',
        safetyCheck: { status: 'PASS' },
        moderation: { status: 'PASS' }
      }
    },
    {
      commitIndex: 1,
      op: 'ARTIFACT_EDITED',
      actor: { kind: 'user', id: 'user:designer' },
      payload: {
        editType: 'CROP',
        editParams: { x: 100, y: 100, width: 1800, height: 1800 },
        newStorageRef: 's3://relay-artifacts/product-mockup-v1-cropped.png',
        newChecksum: 'sha256:def456...'
      }
    },
    {
      commitIndex: 2,
      op: 'ARTIFACT_APPROVED',
      actor: { kind: 'user', id: 'user:design-lead' },
      payload: {
        approvalType: 'PRODUCTION_USE',
        approvedFor: 'Website, app store, social media',
        approvalNote: 'Final version approved'
      }
    }
  ]
};
```

---

## Image/Video Generation Flow

### Complete Lifecycle

**Step 1: Create Prompt**
```javascript
const promptFilament = createFilament('prompt:image:hero-banner');
appendCommit(promptFilament, {
  op: 'PROMPT_CREATED',
  payload: {
    intent: 'Hero banner for homepage',
    constraints: { resolution: '1920x1080', style: 'dramatic' }
  }
});
```

**Step 2: Refine Prompt (Optional)**
```javascript
appendCommit(promptFilament, {
  op: 'PROMPT_REFINED',
  payload: { refinement: 'Add city skyline at sunset' }
});
```

**Step 3: Approve Prompt (If Governance Required)**
```javascript
appendCommit(promptFilament, {
  op: 'PROMPT_APPROVED',
  payload: { approvedBy: 'user:marketing-lead' }
});
```

**Step 4: Generate (AI Creates Gen Filament)**
```javascript
const genFilament = createFilament('gen:image:hero-banner-attempt-1');
appendCommit(genFilament, {
  op: 'GENERATION_STARTED',
  refs: { inputs: [{ filamentId: promptFilament.id, commitIndex: 2 }] },
  payload: { model: 'dalle-3', parameters: { ... } }
});

// Wait for completion...

appendCommit(genFilament, {
  op: 'GENERATION_COMPLETED',
  payload: { artifactId: 'artifact:image:hero-banner-v1.png', status: 'SUCCESS' },
  refs: { outputs: [{ filamentId: 'artifact:image:hero-banner-v1.png', commitIndex: 0 }] }
});
```

**Step 5: Create Artifact**
```javascript
const artifactFilament = createFilament('artifact:image:hero-banner-v1.png');
appendCommit(artifactFilament, {
  op: 'ARTIFACT_CREATED',
  refs: { inputs: [{ filamentId: genFilament.id, commitIndex: 1 }] },
  payload: {
    storageRef: 's3://bucket/hero-banner-v1.png',
    checksum: 'sha256:...'
  }
});
```

**Step 6: Edit Artifact (Optional)**
```javascript
appendCommit(artifactFilament, {
  op: 'ARTIFACT_EDITED',
  payload: { editType: 'COLOR_ADJUST', editParams: { brightness: 1.2 } }
});
```

**Step 7: Approve for Use**
```javascript
appendCommit(artifactFilament, {
  op: 'ARTIFACT_APPROVED',
  payload: { approvalType: 'PRODUCTION_USE', approvedBy: 'user:cmo' }
});
```

---

## Internal AI (Filament-Native Reasoning)

### How Internal AI Works

**User asks:** "Why did Q1 spending increase?"

**Traditional AI:**
```
User → Textbox → AI → Text response
```

**Relay AI:**
```
User → Filament query → AI reads relevant commits → AI creates insight filament (proposal) → User reviews → Gate approval → Insight is truth
```

---

### Example: Budget Analysis

**User query:**
```javascript
{
  queryType: 'ANALYSIS',
  intent: 'Explain Q1 spending increase',
  context: {
    filamentRefs: [
      { filamentId: 'budget-2026', commitRange: [0, 42] },  // Q1 commits
      { filamentId: 'budget-2025', commitRange: [0, 38] }   // For comparison
    ],
    lensContext: 'audit',
    policyTier: 'L5'
  }
}
```

**AI reads filaments:**
```javascript
// AI has access to:
const q1_2026 = replayCommits('budget-2026', 0, 42);
const q1_2025 = replayCommits('budget-2025', 0, 38);

// AI computes
const increase = q1_2026.total - q1_2025.total;
const categories = analyzeByCategory(q1_2026, q1_2025);
```

**AI creates insight filament:**
```javascript
const insightFilament = createFilament('insight:budget-q1-2026-analysis');
appendCommit(insightFilament, {
  op: 'INSIGHT_PROPOSED',
  actor: { kind: 'ai', id: 'gpt-4-budget-analyzer' },
  refs: {
    inputs: [
      { filamentId: 'budget-2026', commitIndex: 42 },
      { filamentId: 'budget-2025', commitIndex: 38 }
    ]
  },
  payload: {
    summary: 'Q1 spending increased $125k (25%) vs last year',
    breakdown: [
      { category: 'Marketing', increase: 75000, reason: 'New campaign launch' },
      { category: 'Engineering', increase: 50000, reason: '3 new hires' }
    ],
    recommendations: ['Review marketing ROI', 'Evaluate hiring pace'],
    confidence: 0.89,
    coverage: 1.0  // Read all Q1 data
  },
  evidence: {
    model: 'gpt-4',
    reasoning: '...',
    computeTokens: 2345
  }
});
```

**User reviews insight:**
- Inspect geometry (see which commits AI read)
- Verify confidence & coverage
- Approve or reject

**If approved:**
```javascript
appendCommit(insightFilament, {
  op: 'INSIGHT_APPROVED',
  actor: { kind: 'user', id: 'user:cfo' },
  payload: { approvalNote: 'Analysis is accurate' }
});
```

---

## Gates & Governance

### Prompt Governance

**Some prompts require approval:**
- Sensitive topics (PII, confidential data)
- High-cost generation (video, long runs)
- Public-facing content (brand, marketing)

**Example:**
```javascript
// Prompt requires gate before generation
promptFilament.policy = {
  generateRequiresGate: true,
  requiredApprovers: ['marketing-lead'],
  requiredSignatures: 1
};

// User creates prompt
appendCommit(promptFilament, { op: 'PROMPT_CREATED', ... });

// Attempt to generate (blocked)
// → Requires GATE commit first

// Manager approves
appendCommit(promptFilament, {
  op: 'PROMPT_APPROVED',
  actor: { kind: 'user', id: 'user:marketing-lead' },
  payload: { approvalSignature: '0x1234...' }
});

// Now generation can proceed
```

---

### Generation Governance

**Some generations require review:**
- Safety violations (need override)
- High-confidence threshold (auto-approve at >0.95)
- Brand compliance (design team review)

**Example:**
```javascript
// Generation flagged for review
genFilament.commits.push({
  op: 'GENERATION_FLAGGED',
  payload: {
    flagReason: 'Brand compliance check required',
    reviewRequired: 'design-team'
  }
});

// Design team reviews
appendCommit(genFilament, {
  op: 'GENERATION_APPROVED',
  actor: { kind: 'user', id: 'user:design-lead' },
  payload: { approvalNote: 'Meets brand guidelines' }
});
```

---

### Artifact Governance

**Artifacts require approval before production use:**

```javascript
// Artifact created (not yet approved)
artifactFilament.policy = {
  productionUseRequiresGate: true,
  requiredApprovers: ['legal', 'design-lead'],
  requiredSignatures: 2
};

// Legal approves
appendCommit(artifactFilament, {
  op: 'ARTIFACT_APPROVED',
  actor: { kind: 'user', id: 'user:legal' },
  payload: { approvalType: 'LEGAL_CLEARANCE' }
});

// Design lead approves
appendCommit(artifactFilament, {
  op: 'ARTIFACT_APPROVED',
  actor: { kind: 'user', id: 'user:design-lead' },
  payload: { approvalType: 'BRAND_COMPLIANCE' }
});

// Now artifact can be used in production
```

---

## Real-World Examples

### Example 1: Marketing Banner

**Prompt:**
"Create hero banner for Q2 campaign launch"

**Flow:**
```
1. User creates prompt filament
   - Intent, constraints, context
   
2. Marketing lead approves (GATE)

3. AI generates 3 variations
   - gen:attempt-1, gen:attempt-2, gen:attempt-3
   - Each produces artifact
   
4. Design team reviews artifacts

5. Team picks artifact-v2

6. Designer crops, color-adjusts (edits)

7. CMO approves for production (GATE)

8. Artifact used on website
```

**Audit trail:**
- Can see original prompt
- Can see all 3 variations
- Can see why v2 was chosen
- Can see all edits
- Can see who approved

---

### Example 2: Budget Chart (AI-Generated)

**Prompt:**
"Generate bar chart showing Q1 spending by category"

**Flow:**
```
1. User creates prompt (linked to budget filament)

2. AI reads budget filament (L5 access)

3. AI generates chart proposal
   - gen:chart-attempt-1
   - References budget commits used
   
4. Chart artifact created
   - artifact:chart:q1-spending.png
   
5. CFO reviews, approves

6. Chart used in board presentation
```

**Key:** Chart is **derived from filaments** (not raw data). Provenance is explicit.

---

### Example 3: Code Documentation (AI-Generated)

**Prompt:**
"Write API documentation for src/utils.ts"

**Flow:**
```
1. User creates prompt (linked to code filament)

2. AI reads code filament
   - Sees function signatures, commit history, evidence
   
3. AI generates documentation
   - gen:docs-attempt-1
   - Proposes markdown text
   
4. Docs artifact created
   - artifact:text:utils-api-docs.md
   
5. Engineer reviews, edits (fixes errors)

6. Tech lead approves

7. Docs published to website
```

**Benefit:** Documentation provenance is explicit (which code version, which AI, when).

---

## Technical Architecture

### AI Service API

```typescript
interface AIGenerationService {
  // Create generation from prompt
  generate(
    promptFilamentId: string,
    promptCommitIndex: number,
    model: string,
    parameters: object
  ): Promise<GenerationFilament>;
  
  // Internal AI reasoning (filament-native)
  reason(
    queryType: string,
    intent: string,
    context: {
      filamentRefs: Array<{ filamentId: string; commitRange: [number, number] }>;
      lensContext: string;
      policyTier: string;
    }
  ): Promise<InsightFilament>;
}
```

---

### Storage Architecture

**Artifacts stored externally** (not in Git):
- IPFS (content-addressed, decentralized)
- S3 (cloud storage, signed URLs)
- CDN (for public artifacts)

**Filament stores only reference:**
```javascript
payload: {
  storageRef: 'ipfs://Qm...' || 's3://bucket/file.png',
  checksum: 'sha256:...',
  size: 3145728
}
```

**Benefit:** Git repos stay small (no binary blobs).

---

## FAQ

### General

**Q: Why are prompts filaments instead of just strings?**  
A: Prompts evolve (refinements), require governance (approvals), and are reusable. Filaments capture this lifecycle.

**Q: Can I reuse a prompt for multiple generations?**  
A: Yes. Same prompt filament can spawn multiple gen filaments (iterations).

**Q: What if generation fails?**  
A: Gen filament records failure (GENERATION_FAILED commit). User can refine prompt, retry.

---

### AI Governance

**Q: Does AI need approval for every generation?**  
A: No. Approval requirements are policy-based. Low-risk prompts (personal use, internal) can auto-generate. High-risk (public, sensitive) require gates.

**Q: Can AI approve its own outputs?**  
A: No. AI actor kind is 'ai', gates require 'user' actor signatures.

**Q: What if AI generates inappropriate content?**  
A: Safety checks flag violations, generation fails, failure filament created. Human review required to override.

---

### Technical

**Q: Where are artifacts stored?**  
A: Externally (IPFS, S3, CDN). Filaments store references (hash, URL).

**Q: Can artifacts be deleted?**  
A: No. Artifacts are immutable (filament commits cannot be deleted). Can redact visibility (Privacy Ladder → L0).

**Q: How do you handle large videos?**  
A: Store video in chunks, reference via artifact filament. Streaming handled by storage layer (not Relay).

---

## Conclusion

AI generation in Relay is **authored lifecycle, not textbox magic**:

**Three filament classes:**
1. **`prompt.*`** — Intent + constraints (what you want)
2. **`gen.*`** — AI attempts (proposals + parameters)
3. **`artifact.*`** — Outputs (images, videos, text)

**Governance:**
- Prompts can require approval
- Generations can require review
- Artifacts require approval before production use

**Internal AI:**
- Reads filaments (not raw state)
- Creates insight filaments (proposals)
- Respects Privacy Ladder (L0-L6)
- Evidence includes reasoning, confidence, coverage

**The One-Sentence Lock:**

> **"AI generation is a filament-native conversation where prompts evolve through governance, generations produce inspectable proposals, and artifacts carry full provenance—enabling auditable, governed creativity at scale."**

---

**See Also:**
- [Toaster Screensaver Spec](TOASTER-SCREENSAVER-SPEC.md)
- [Failure as Filament Spec](FAILURE-AS-FILAMENT-SPEC.md)
- [Insight Confidence & Coverage Spec](INSIGHT-CONFIDENCE-COVERAGE-SPEC.md)

---

*Last Updated: 2026-01-28*  
*Status: Canonical Specification*  
*Version: 1.0.0*
