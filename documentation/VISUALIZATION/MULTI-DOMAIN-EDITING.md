# 🎨 Multi-Domain Editing — One Substrate, Many Creative Tools

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## Core Principle

> **One substrate (filaments + commits), many domain lenses (spreadsheet, 3D, video, canvas, timeline). Same editing primitives, different endpoint surfaces.**

Relay doesn't "replicate After Effects, Blender, or Unity." Instead, it defines **universal editing primitives** that work across all creative domains, then provides domain-specific **lenses** that project those primitives as familiar tools.

**Key Insight:**
> "Cell range" and "mesh selection set" are the same kind of thing: a **SelectionSet** object in a lens.  
> "Formula transform" and "modifier stack" are the same kind of thing: **dependencies** with **operations**.

---

## Table of Contents

1. [The Cross-Over: Universal Primitives](#the-cross-over-universal-primitives)
2. [Shared Edit Engine](#shared-edit-engine)
3. [Domain Lenses](#domain-lenses)
4. [Commit Grammar by Domain](#commit-grammar-by-domain)
5. [Asset Management](#asset-management)
6. [Real-World Workflows](#real-world-workflows)
7. [Implementation Guide](#implementation-guide)
8. [FAQ](#faq)

---

## The Cross-Over: Universal Primitives

### What Spreadsheets and 3D Tools Have in Common

| Primitive | Spreadsheet | 3D Scene | Video Timeline | Canvas |
|-----------|-------------|----------|----------------|--------|
| **Selection** | Cell / Range | Vertex / Face / Object | Clip / Frame | Shape / Element |
| **Transform** | Formula changes value | Translate / Rotate / Scale | Trim / Speed / Effect | Move / Resize / Style |
| **Dependencies** | Cell references | Modifiers / Rigs / Materials | Clips reference media | Layers / Groups |
| **Views** | Pivot / Chart | Camera / Render | Playback / Waveform | Zoom / Pan |
| **Constraints** | Type / Validation | Topology / Physics | FPS / Resolution | Stroke / Fill rules |

**Unification Rule:**
> All creative tools follow the same pattern:  
> **Select → Transform → Commit**

---

## Shared Edit Engine

### The Core Editing Loop

Every domain uses the same underlying engine:

```typescript
interface EditEngine {
  // 1. Selection
  createSelectionSet(type: string, identifiers: string[]): SelectionSet;
  
  // 2. Operation
  applyOperation(selection: SelectionSet, operation: Operation): Result;
  
  // 3. Constraint validation
  validateConstraints(result: Result, rules: ConstraintRules): ValidationResult;
  
  // 4. Commit building
  buildCommit(
    operation: Operation,
    before: State,
    after: State,
    evidence: Evidence
  ): Commit;
}
```

### Universal Components

#### **1. SelectionSet**

**What it is:** The "thing" you're operating on.

```typescript
interface SelectionSet {
  type: 'cell' | 'range' | 'vertex' | 'face' | 'object' | 'clip' | 'keyframe' | 'element';
  identifiers: string[];  // IDs of selected items
  domain: 'spreadsheet' | '3d' | 'video' | 'canvas' | 'timeline';
}
```

**Examples:**
```typescript
// Spreadsheet
{ type: 'range', identifiers: ['A1', 'A2', 'A3', 'A4', 'A5'], domain: 'spreadsheet' }

// 3D Scene
{ type: 'vertex', identifiers: ['mesh-cube:v0', 'mesh-cube:v1', 'mesh-cube:v2'], domain: '3d' }

// Canvas
{ type: 'element', identifiers: ['shape-star', 'shape-circle'], domain: 'canvas' }
```

---

#### **2. Operation**

**What it is:** The "action" being performed.

```typescript
interface Operation {
  type: 'transform' | 'create' | 'delete' | 'modify' | 'connect';
  tool: string;  // Domain-specific tool name
  parameters: Record<string, any>;
}
```

**Examples:**
```typescript
// Spreadsheet: Apply formula
{ type: 'transform', tool: 'formula', parameters: { expression: '=SUM(A1:A10)' } }

// 3D: Translate object
{ type: 'transform', tool: 'translate', parameters: { x: 5, y: 0, z: 0 } }

// Canvas: Change fill color
{ type: 'modify', tool: 'fill', parameters: { color: '#FF0000' } }
```

---

#### **3. ConstraintRules**

**What it is:** Domain-specific validation rules.

```typescript
interface ConstraintRules {
  domain: string;
  rules: Rule[];
}

interface Rule {
  type: 'type-check' | 'range-check' | 'topology-check' | 'dependency-check';
  validator: (state: State) => ValidationResult;
}
```

**Examples:**
```typescript
// Spreadsheet: Type validation
{ type: 'type-check', validator: (state) => state.value.type === 'number' }

// 3D: Topology validation
{ type: 'topology-check', validator: (mesh) => mesh.faces.every(f => f.vertices.length >= 3) }

// Canvas: Constraint validation
{ type: 'range-check', validator: (shape) => shape.x >= 0 && shape.x <= canvasWidth }
```

---

#### **4. CommitBuilder**

**What it is:** Converts operations into commits.

```typescript
interface CommitBuilder {
  buildCommit(
    operation: Operation,
    selection: SelectionSet,
    before: State,
    after: State,
    evidence: Evidence
  ): Commit;
}

// Same builder works across all domains
const commit = commitBuilder.buildCommit(
  { type: 'transform', tool: 'translate', parameters: { x: 5 } },
  { type: 'object', identifiers: ['cube-1'], domain: '3d' },
  { position: { x: 0, y: 0, z: 0 } },  // Before
  { position: { x: 5, y: 0, z: 0 } },  // After
  { tool: 'translate', user: 'alice', timestamp: Date.now() }
);
```

---

## Domain Lenses

### The 5 Core Creative Domains

#### **1. Spreadsheet Lens**

**Endpoint Surface:** Grid of cells (2D table)

**Tools:**
- Select: Cell / Range
- Transform: Formula / Value edit
- Dependencies: Cell references (A1, B2, etc.)
- Views: Pivot / Chart / Filter

**Commit Types:**
- `CELL_EDIT`: Single cell value change
- `FORMULA_EDIT`: Formula definition change
- `RANGE_EDIT`: Batch cell changes
- `OPERATOR_RUN`: Formula recalculation

**See:** [Editable Endpoint Lens](EDITABLE-ENDPOINT-LENS.md)

---

#### **2. 3D Scene Lens**

**Endpoint Surface:** 3D viewport (orthographic/perspective)

**Tools:**
- Select: Vertex / Edge / Face / Object
- Transform: Translate / Rotate / Scale / Extrude / Bevel / Sculpt
- Dependencies: Modifiers / Rigs / Materials / Textures / Scripts
- Views: Camera / UV / Material preview / Animation curves

**Commit Types:**
- `MESH_EDIT`: Topology/geometry change
- `TRANSFORM_EDIT`: Object transform (position/rotation/scale)
- `MODIFIER_ADD`: Modifier stack change (subdivision, mirror, etc.)
- `MATERIAL_EDIT`: Material/shader change
- `ANIMATION_EDIT`: Keyframe/curve change
- `RENDER_BAKE`: Render output (image/video hash + settings)

**Selection Examples:**
```typescript
// Select cube object
{ type: 'object', identifiers: ['mesh-cube'], domain: '3d' }

// Select specific vertices for sculpting
{ type: 'vertex', identifiers: ['mesh-cube:v0', 'mesh-cube:v5', 'mesh-cube:v12'], domain: '3d' }

// Select face for extrusion
{ type: 'face', identifiers: ['mesh-cube:f3'], domain: '3d' }
```

---

#### **3. Canvas Lens (2D Graphics)**

**Endpoint Surface:** 2D canvas (vector/raster)

**Tools:**
- Select: Shape / Element / Layer / Group
- Transform: Move / Resize / Rotate / Skew
- Dependencies: Layers / Groups / Masks / Effects
- Views: Zoom / Pan / Layer visibility

**Commit Types:**
- `SHAPE_CREATE`: New shape added
- `SHAPE_EDIT`: Shape properties changed (color, stroke, fill)
- `LAYER_REORDER`: Layer stack changed
- `EFFECT_ADD`: Effect applied (blur, shadow, etc.)
- `GROUP_CREATE`: Elements grouped

**Selection Examples:**
```typescript
// Select logo shape
{ type: 'element', identifiers: ['shape-logo-star'], domain: 'canvas' }

// Select multiple shapes for grouping
{ type: 'element', identifiers: ['shape-1', 'shape-2', 'shape-3'], domain: 'canvas' }
```

---

#### **4. Video Timeline Lens**

**Endpoint Surface:** Timeline (horizontal clips + tracks)

**Tools:**
- Select: Clip / Track / Keyframe
- Transform: Trim / Speed / Fade / Effect
- Dependencies: Clips reference media assets / Effects reference settings
- Views: Playback / Waveform / Thumbnail

**Commit Types:**
- `CLIP_ADD`: New clip added to timeline
- `CLIP_TRIM`: Clip in/out points changed
- `CLIP_SPEED`: Playback speed changed
- `TRANSITION_ADD`: Transition between clips
- `EFFECT_ADD`: Effect applied to clip
- `RENDER_EXPORT`: Export settings + output hash

**Selection Examples:**
```typescript
// Select clip for trimming
{ type: 'clip', identifiers: ['timeline-1:clip-5'], domain: 'video' }

// Select keyframe for animation
{ type: 'keyframe', identifiers: ['clip-5:effect-blur:frame-120'], domain: 'video' }
```

---

#### **5. Animation Timeline Lens**

**Endpoint Surface:** Timeline (keyframes + curves)

**Tools:**
- Select: Keyframe / Curve segment
- Transform: Move keyframe / Adjust bezier handles / Change interpolation
- Dependencies: Keyframes reference object properties
- Views: Dope sheet / Graph editor

**Commit Types:**
- `KEYFRAME_ADD`: New keyframe created
- `KEYFRAME_MOVE`: Keyframe time changed
- `CURVE_EDIT`: Animation curve handles adjusted
- `INTERPOLATION_CHANGE`: Interpolation type changed (linear/bezier/constant)

**Selection Examples:**
```typescript
// Select keyframe
{ type: 'keyframe', identifiers: ['object-cube:position-x:frame-60'], domain: 'timeline' }

// Select curve segment
{ type: 'curve', identifiers: ['object-cube:rotation-y:frames-60-120'], domain: 'timeline' }
```

---

## Commit Grammar by Domain

### Unified Commit Structure

All domains use the same commit structure:

```typescript
interface DomainCommit {
  envelope: {
    commit_class: string;  // Domain-specific
    actor: string;
    domain: string;
    // ...
  };
  timeBox: {
    faces: {
      output: any;       // +X: New state
      input: any;        // -X: Previous state / dependencies
      semantic: string;  // +Y: Human-readable meaning
      magnitude: number; // -Y: Quantitative change
      identity: string;  // +Z: Actor
      evidence: Evidence;// -Z: Tool operation + parameters
    };
  };
}
```

---

### Domain-Specific Commit Classes

#### **Spreadsheet**
- `CELL_EDIT`
- `FORMULA_EDIT`
- `RANGE_EDIT`
- `OPERATOR_RUN`

#### **3D Scene**
- `MESH_EDIT`
- `TRANSFORM_EDIT`
- `MODIFIER_ADD` / `MODIFIER_REMOVE`
- `MATERIAL_EDIT`
- `ANIMATION_EDIT`
- `RENDER_BAKE`

#### **Canvas**
- `SHAPE_CREATE` / `SHAPE_DELETE`
- `SHAPE_EDIT`
- `LAYER_REORDER`
- `EFFECT_ADD`
- `GROUP_CREATE`

#### **Video**
- `CLIP_ADD` / `CLIP_REMOVE`
- `CLIP_TRIM`
- `CLIP_SPEED`
- `TRANSITION_ADD`
- `EFFECT_ADD`
- `RENDER_EXPORT`

#### **Animation**
- `KEYFRAME_ADD` / `KEYFRAME_DELETE`
- `KEYFRAME_MOVE`
- `CURVE_EDIT`
- `INTERPOLATION_CHANGE`

---

## Asset Management

### Assets Are Filaments

Every asset (mesh, texture, audio, video, image) is a filament:

```typescript
// Mesh asset filament
asset.mesh.<id>
  ├─ Commit 1: Initial mesh (cube.obj)
  ├─ Commit 2: Sculpt edit (subdivided)
  ├─ Commit 3: UV unwrap
  └─ Commit 4: Export optimized (LOD0)

// Texture asset filament
asset.texture.<id>
  ├─ Commit 1: Initial texture (diffuse.png, hash: abc123)
  ├─ Commit 2: Color correction
  └─ Commit 3: Resolution increase (2K → 4K)

// Audio asset filament
asset.audio.<id>
  ├─ Commit 1: Raw recording (audio.wav, hash: def456)
  ├─ Commit 2: Noise reduction
  └─ Commit 3: Mastering (final.mp3, hash: ghi789)
```

---

### Asset References (Dependencies)

Projects reference assets via filament dependencies:

```typescript
// Scene commit references mesh + texture assets
{
  commit_class: 'SCENE_EDIT',
  faces: {
    input: {
      dependencies: [
        { filamentId: 'asset.mesh.cube-01', commitIndex: 4 },     // Mesh at commit 4
        { filamentId: 'asset.texture.wood-01', commitIndex: 3 }   // Texture at commit 3
      ]
    }
  }
}
```

**Benefits:**
- **Version control**: Reference specific asset versions
- **Audit trail**: Know exactly which assets were used
- **Hot reload**: When asset updates, projects can choose to upgrade

---

## Real-World Workflows

### Workflow 1: Logo Design (Canvas)

**Steps:**
1. Open `project.logo.acme` filament
2. Canvas lens projects current scene
3. Designer engages surface (L6 permission)
4. Selects star shape (`shape-star-01`)
5. Changes fill color: blue → red
6. System creates `SHAPE_EDIT` commit:
   ```typescript
   {
     commit_class: 'SHAPE_EDIT',
     faces: {
       output: { fill: '#FF0000' },
       input: { fill: '#0000FF' },
       semantic: 'Changed star fill color to red',
       evidence: { tool: 'fill-bucket', color: '#FF0000' }
     }
   }
   ```
7. Designer disengages → lock releases
8. Commit appears in filament history

---

### Workflow 2: 3D Character Modeling

**Steps:**
1. Open `project.game.character.hero` filament
2. 3D viewport lens projects scene
3. Modeler engages surface
4. Selects face (`mesh-head:f42`)
5. Extrudes face to create ear
6. System creates `MESH_EDIT` commit:
   ```typescript
   {
     commit_class: 'MESH_EDIT',
     faces: {
       output: { topology: { vertices: 150, faces: 200 }, hash: 'abc123' },
       input: { topology: { vertices: 145, faces: 195 }, hash: 'def456' },
       semantic: 'Extruded face f42 to create ear geometry',
       evidence: {
         tool: 'extrude',
         selection: ['mesh-head:f42'],
         parameters: { distance: 0.5 }
       }
     }
   }
   ```
7. Modeler continues sculpting (more commits)
8. Modeler exports mesh → creates `RENDER_BAKE` commit with artifact hash

---

### Workflow 3: Video Editing

**Steps:**
1. Open `project.video.promo` filament
2. Timeline lens projects sequence
3. Editor engages surface
4. Selects clip (`timeline-1:clip-3`)
5. Trims clip: in=10s, out=20s
6. System creates `CLIP_TRIM` commit:
   ```typescript
   {
     commit_class: 'CLIP_TRIM',
     faces: {
       output: { in: 10, out: 20, duration: 10 },
       input: { in: 0, out: 30, duration: 30 },
       semantic: 'Trimmed clip 3 to 10-second segment',
       evidence: {
         tool: 'trim',
         clipId: 'clip-3',
         before: { in: 0, out: 30 },
         after: { in: 10, out: 20 }
       }
     }
   }
   ```
7. Editor adds transition between clips → new commit
8. Editor exports video → `RENDER_EXPORT` commit with output file hash

---

## Implementation Guide

### Shared Edit Engine

```typescript
class UniversalEditEngine {
  // All domains use this
  createSelectionSet(type: string, identifiers: string[], domain: string): SelectionSet {
    return { type, identifiers, domain };
  }
  
  applyOperation(
    selection: SelectionSet,
    operation: Operation
  ): OperationResult {
    // Call domain-specific handler
    const handler = this.getDomainHandler(selection.domain);
    return handler.execute(selection, operation);
  }
  
  validateConstraints(
    result: OperationResult,
    rules: ConstraintRules
  ): ValidationResult {
    for (const rule of rules.rules) {
      const validationResult = rule.validator(result.state);
      if (!validationResult.valid) {
        return validationResult;
      }
    }
    return { valid: true };
  }
  
  buildCommit(
    operation: Operation,
    selection: SelectionSet,
    before: State,
    after: State,
    evidence: Evidence
  ): Commit {
    return {
      envelope: {
        commit_class: this.getCommitClass(operation, selection.domain),
        actor: evidence.user,
        domain: selection.domain,
        // ...
      },
      timeBox: {
        faces: {
          output: after,
          input: before,
          semantic: operation.tool + ' on ' + selection.type,
          evidence: {
            tool: operation.tool,
            parameters: operation.parameters,
            selection: selection.identifiers
          }
        }
      }
    };
  }
}
```

---

### Domain Handlers

```typescript
interface DomainHandler {
  domain: string;
  execute(selection: SelectionSet, operation: Operation): OperationResult;
  getConstraintRules(): ConstraintRules;
}

class SpreadsheetHandler implements DomainHandler {
  domain = 'spreadsheet';
  
  execute(selection: SelectionSet, operation: Operation): OperationResult {
    if (operation.type === 'transform' && operation.tool === 'formula') {
      // Apply formula to cells
      const cells = selection.identifiers.map(id => getCell(id));
      const formula = operation.parameters.expression;
      const newValues = cells.map(cell => evaluateFormula(formula, cell));
      return { success: true, state: { cells: newValues } };
    }
    // ... other operations
  }
  
  getConstraintRules(): ConstraintRules {
    return {
      domain: 'spreadsheet',
      rules: [
        { type: 'type-check', validator: (state) => validateCellTypes(state) },
        { type: 'dependency-check', validator: (state) => checkCircularRefs(state) }
      ]
    };
  }
}

class ThreeDHandler implements DomainHandler {
  domain: '3d';
  
  execute(selection: SelectionSet, operation: Operation): OperationResult {
    if (operation.type === 'transform' && operation.tool === 'translate') {
      // Translate objects/vertices
      const elements = selection.identifiers.map(id => getElement(id));
      const delta = operation.parameters;
      const newPositions = elements.map(el => ({
        x: el.position.x + delta.x,
        y: el.position.y + delta.y,
        z: el.position.z + delta.z
      }));
      return { success: true, state: { positions: newPositions } };
    }
    // ... other operations
  }
  
  getConstraintRules(): ConstraintRules {
    return {
      domain: '3d',
      rules: [
        { type: 'topology-check', validator: (mesh) => validateMeshTopology(mesh) },
        { type: 'range-check', validator: (transform) => validateTransformLimits(transform) }
      ]
    };
  }
}
```

---

## FAQ

### General

**Q: Do I need to learn all these tools?**  
A: No. Each lens provides familiar tools for that domain. Spreadsheet users never see 3D tools.

**Q: Can I switch between domains for the same project?**  
A: Yes. A game project might have spreadsheet (stats), 3D (models), and timeline (cutscenes) lenses all referencing the same project filament.

**Q: Are these tools as powerful as dedicated apps (Blender, After Effects)?**  
A: Initially, no. Relay starts with **minimum viable toolsets** that prove the model. Over time, domain lenses can reach feature parity.

---

### Technical

**Q: How do assets get imported?**  
A: Import creates a new asset filament with initial commit containing file hash + metadata. Projects reference that filament.

**Q: What if I want to use Blender files directly?**  
A: Import plugin: Parse .blend file, create commits for each object/material/texture. Or: Keep .blend as binary blob, store as evidence pointer.

**Q: Can I export to standard formats (FBX, MP4, etc.)?**  
A: Yes. `RENDER_EXPORT` commits store output file hashes. Artifacts can be downloaded in standard formats.

---

### Governance

**Q: Who can add new commit types?**  
A: Adding commit types is a **governance decision**. Proposal → community vote → merge into domain spec.

**Q: Can I create custom tools?**  
A: Yes. Custom tools are operations with custom parameters. As long as they create valid commits, they're allowed.

**Q: What if two tools conflict (e.g., both want to edit mesh topology)?**  
A: Locus locking prevents conflicts. Only one tool can edit a given locus at a time.

---

## Conclusion

The **Multi-Domain Editing** model ensures:
- ✅ **Unified substrate** (all domains use filaments + commits)
- ✅ **Domain-specific familiarity** (each lens feels like the right tool)
- ✅ **Cross-domain compatibility** (assets/projects can mix domains)
- ✅ **Auditable creativity** (every edit is a commit with evidence)
- ✅ **Collaborative workflows** (locking, presence, permissions work the same)

By treating creative tools as **lenses over a shared substrate**, Relay enables **unprecedented interoperability** without forcing users to learn a new paradigm for each domain.

---

**See Also:**
- [Engage Surface Spec](ENGAGE-SURFACE-SPEC.md) (Editing mechanics)
- [Privacy Ladder Spec](PRIVACY-LADDER-SPEC.md) (Visibility across domains)
- [Game Production Model](GAME-PRODUCTION-MODEL.md) (Game-specific workflows)
- [AI Participation Model](AI-PARTICIPATION-MODEL.md) (AI-assisted creation)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
