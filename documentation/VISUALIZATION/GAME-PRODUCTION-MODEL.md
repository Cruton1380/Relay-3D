# 🎮 Game Production Model — Games as Causality Trees with Git Backend

**Version**: 1.0.0  
**Status**: Canonical Specification  
**Last Updated**: 2026-01-27

---

## Core Principle

> **A game is not "a folder of files." It's a causality tree of filaments with an endpoint surface you can edit.**

In Relay, game production treats every asset, scene, system, and build as a **filament** with commit history. The "game" is the root filament that references all others. Git is the backend, but players/creators never see Git directly—they see familiar game dev tools backed by auditable commits.

**Key Insight:**
> "Excel at the edge, Git at depth" applied to game dev.  
> Zoom in = Unity/Unreal-like editor. Zoom out = forensic causality.

---

## Table of Contents

1. [Game as Filament Bundle](#game-as-filament-bundle)
2. [Core Game Filaments](#core-game-filaments)
3. [Asset Pipeline](#asset-pipeline)
4. [Scene Editing Workflow](#scene-editing-workflow)
5. [Game Logic & Systems](#game-logic--systems)
6. [Builds & Releases](#builds--releases)
7. [AI-Assisted Creation](#ai-assisted-creation)
8. [Multiplayer & Shared Worlds](#multiplayer--shared-worlds)
9. [Modding & Community Content](#modding--community-content)
10. [Implementation Guide](#implementation-guide)
11. [Real-World Scenarios](#real-world-scenarios)
12. [FAQ](#faq)

---

## Game as Filament Bundle

### Structure

A game project is a **bundle of interconnected filaments**:

```
game.project.<id>                (Root filament: game definition)
├─ game.scene.<id>               (Scene graph snapshots)
├─ game.entity.<id>              (ECS entity definitions)
├─ game.system.<id>              (Game logic / scripts)
├─ asset.mesh.<id>               (3D models)
├─ asset.texture.<id>            (Textures / images)
├─ asset.audio.<id>              (Sounds / music)
├─ asset.animation.<id>          (Animation data)
├─ character.<id>                (Character definitions)
├─ dialogue.<id>                 (Dialogue trees)
├─ build.<platform>.<id>         (Compiled builds)
└─ release.<id>                  (Published versions)
```

**Key Properties:**
- Each filament has independent history
- Filaments reference each other via dependencies
- Changes propagate via commit causality
- Entire project is auditable (who changed what, when, why)

---

## Core Game Filaments

### 1. `game.project.<id>` (Root)

**Purpose:** Defines the game itself.

**Initial Commit:**
```typescript
{
  commit_class: 'PROJECT_CREATE',
  faces: {
    output: {
      title: 'Epic Quest',
      genre: 'RPG',
      engine: 'relay-game-engine',
      version: '0.1.0'
    },
    semantic: 'Created new game project: Epic Quest',
    identity: 'user:dev-alice',
    evidence: {
      type: 'project-init',
      template: 'rpg-starter',
      timestamp: Date.now()
    }
  }
}
```

**Subsequent Commits:**
- Version bumps
- Settings changes (resolution, physics settings)
- Dependency updates (engine version)

---

### 2. `game.scene.<id>` (Scene Graph)

**Purpose:** Defines a game scene (level, menu, cutscene).

**Commit Example:**
```typescript
{
  commit_class: 'SCENE_EDIT',
  faces: {
    output: {
      sceneGraph: {
        entities: [
          { id: 'entity:player', position: [0, 0, 0], components: ['transform', 'player-controller'] },
          { id: 'entity:enemy-1', position: [10, 0, 5], components: ['transform', 'ai-controller'] },
          { id: 'entity:terrain', components: ['mesh-renderer'] }
        ],
        lighting: { ambient: [0.2, 0.2, 0.2], directional: { direction: [1, -1, 0], intensity: 1.0 } },
        camera: { type: 'perspective', fov: 60, near: 0.1, far: 1000 }
      },
      hash: 'sha256:abc123...'  // Scene snapshot hash
    },
    input: {
      dependencies: [
        { filamentId: 'asset.mesh.terrain-01', commitIndex: 5 },
        { filamentId: 'asset.texture.grass-01', commitIndex: 3 }
      ]
    },
    semantic: 'Added enemy spawn point in forest scene',
    identity: 'user:level-designer',
    evidence: {
      type: 'scene-edit',
      tool: '3d-viewport',
      operation: 'entity-add',
      entityType: 'enemy'
    }
  }
}
```

---

### 3. `game.entity.<id>` (ECS Entity Template)

**Purpose:** Defines reusable entity templates.

**Example: Player Character**
```typescript
{
  commit_class: 'ENTITY_DEFINE',
  faces: {
    output: {
      entityType: 'player',
      components: [
        { type: 'transform', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        { type: 'mesh-renderer', mesh: 'asset.mesh.hero-model', material: 'asset.material.hero-skin' },
        { type: 'player-controller', speed: 5.0, jumpForce: 10.0 },
        { type: 'health', maxHealth: 100, currentHealth: 100 },
        { type: 'inventory', slots: 10 }
      ]
    },
    semantic: 'Defined player character entity template',
    identity: 'user:game-designer',
    evidence: {
      type: 'entity-template',
      designDoc: 'design/player-character.md'
    }
  }
}
```

---

### 4. `game.system.<id>` (Game Logic)

**Purpose:** Defines game systems (scripts, behavior).

**Example: AI System**
```typescript
{
  commit_class: 'SYSTEM_DEFINE',
  faces: {
    output: {
      systemType: 'ai-controller',
      script: {
        language: 'javascript',
        source: `
          function update(entity, deltaTime) {
            // AI logic here
            const player = findEntity('player');
            const direction = normalize(player.position - entity.position);
            entity.velocity = direction * entity.speed;
          }
        `,
        hash: 'sha256:def456...'
      }
    },
    semantic: 'Implemented enemy AI system',
    identity: 'user:programmer',
    evidence: {
      type: 'script',
      tested: true,
      testResults: 'tests/ai-system.test.js'
    }
  }
}
```

---

## Asset Pipeline

### Asset Types as Filaments

Every asset is a filament with history:

#### **Mesh Asset (`asset.mesh.<id>`)**

**Commits:**
1. Initial import (`.obj`, `.fbx`, etc.)
2. Sculpt edits (topology changes)
3. UV unwrap
4. LOD generation (optimized versions)
5. Export variants (game-ready, high-poly reference)

**Example:**
```typescript
{
  commit_class: 'MESH_EDIT',
  faces: {
    output: {
      topology: { vertices: 1500, faces: 2000, edges: 4500 },
      bounds: { min: [-1, -1, -1], max: [1, 2, 1] },
      hash: 'ipfs://Qm...abc'  // Mesh file hash
    },
    input: {
      previousTopology: { vertices: 1200, faces: 1600 },
      tool: 'blender-sculpt'
    },
    semantic: 'Refined character head sculpt',
    identity: 'user:3d-artist',
    evidence: {
      type: 'mesh-edit',
      tool: 'blender',
      version: '4.0',
      operation: 'sculpt',
      brushes: ['clay', 'smooth']
    }
  }
}
```

---

#### **Texture Asset (`asset.texture.<id>`)**

**Commits:**
1. Initial texture (base image)
2. Color correction
3. Resolution increase (2K → 4K)
4. Compression (game-ready format)

**Example:**
```typescript
{
  commit_class: 'TEXTURE_EDIT',
  faces: {
    output: {
      resolution: { width: 4096, height: 4096 },
      format: 'PNG',
      channels: 'RGBA',
      hash: 'ipfs://Qm...def'
    },
    input: {
      previousResolution: { width: 2048, height: 2048 }
    },
    semantic: 'Upscaled hero armor texture to 4K',
    identity: 'operator:ai-upscaler',  // AI operator
    evidence: {
      type: 'upscale',
      algorithm: 'ESRGAN',
      modelVersion: '1.2'
    }
  }
}
```

---

## Scene Editing Workflow

### Unity/Unreal-Like Editor

**Endpoint Surface:** 3D viewport + inspector panel

**Tools:**
- **Select**: Entity / Prefab / Group
- **Transform**: Move / Rotate / Scale
- **Instantiate**: Place prefabs in scene
- **Configure**: Edit component properties (lighting, physics, etc.)

---

### Edit → Commit Flow

```
1. Designer opens scene filament (`game.scene.forest-01`)
     ↓
2. 3D viewport renders current scene (from latest commit)
     ↓
3. Designer engages surface (L6 permission)
     ↓
4. Designer adds enemy spawn point:
     - Selects entity prefab (`game.entity.enemy-goblin`)
     - Instantiates in scene at position (10, 0, 5)
     - Configures spawn behavior (respawn timer, loot table)
     ↓
5. System creates SCENE_EDIT commit:
     {
       output: { sceneGraph: [..., newEntity] },
       input: { dependencies: ['game.entity.enemy-goblin'] },
       semantic: 'Added goblin spawn point',
       identity: 'user:level-designer'
     }
     ↓
6. Scene updates immediately (optimistic)
     ↓
7. Designer disengages → commit finalized
```

---

## Game Logic & Systems

### ECS (Entity-Component-System) Model

**Entities:** Just IDs with component lists  
**Components:** Data only (position, health, inventory)  
**Systems:** Logic that operates on components (movement, AI, rendering)

---

### System Filaments

Each game system is a filament:

**Example: Physics System**
```
game.system.physics
├─ Commit 1: Basic rigidbody physics
├─ Commit 2: Added collision detection
├─ Commit 3: Optimized broad-phase (spatial hashing)
└─ Commit 4: Fixed tunneling bug
```

**Editing:** Systems are code/scripts. Edits create commits with:
- **+X**: New script hash (source code + compiled bytecode)
- **-X**: Previous script hash
- **-Z**: Test results, benchmark data

---

## Builds & Releases

### Build Process

**Build = Compilation of all filaments into executable artifact**

**Build Filament:**
```
build.windows.001
├─ Commit 1: Initial build (v0.1.0)
     {
       output: {
         platform: 'windows',
         architecture: 'x64',
         executable: 'epic-quest.exe',
         artifactHash: 'sha256:abc123...',
         size: 512MB
       },
       input: {
         dependencies: [
           { filamentId: 'game.project.epic-quest', commitIndex: 10 },
           { filamentId: 'game.scene.forest-01', commitIndex: 25 },
           // ... all asset filaments referenced
         ],
         buildSettings: {
           optimization: 'release',
           compression: true,
           includedScenes: ['forest-01', 'town-01']
         }
       },
       semantic: 'Built Windows release v0.1.0',
       identity: 'operator:build-pipeline',
       evidence: {
         type: 'build',
         compiler: 'esbuild',
         compilerVersion: '0.19',
         buildTime: 45000,  // 45 seconds
         warnings: 0,
         errors: 0
       }
     }
```

---

### Release Filament

**Release = Tagged, published version for distribution**

```
release.001
├─ Commit 1: v0.1.0 (Alpha)
     {
       output: {
         version: '0.1.0',
         label: 'Alpha',
         builds: [
           { platform: 'windows', filamentId: 'build.windows.001', commitIndex: 1 },
           { platform: 'linux', filamentId: 'build.linux.001', commitIndex: 1 },
           { platform: 'macos', filamentId: 'build.macos.001', commitIndex: 1 }
         ],
         releaseNotes: 'First playable alpha. Forest level + combat system.',
         downloadUrls: {
           windows: 'https://relay-cdn.com/epic-quest/v0.1.0/windows.zip',
           linux: 'https://relay-cdn.com/epic-quest/v0.1.0/linux.tar.gz',
           macos: 'https://relay-cdn.com/epic-quest/v0.1.0/macos.dmg'
         }
       },
       semantic: 'Released alpha v0.1.0',
       identity: 'user:game-director',
       evidence: {
         type: 'release',
         approved: true,
         testedBy: ['user:qa-lead'],
         signedOff: true
       }
     }
```

---

## AI-Assisted Creation

### AI in Game Production

**Use Cases:**
1. **Character portraits** (AI-generated images)
2. **Texture generation** (procedural materials)
3. **Dialogue generation** (NPC conversations)
4. **Sound effects** (AI audio synthesis)
5. **Music** (dynamic soundtracks)

**All follow the AI Participation Model:**
- AI proposes commits (on proposal branch)
- Designer reviews & approves (GATE)
- Approved content merges to main

**See:** [AI Participation Model](AI-PARTICIPATION-MODEL.md)

---

### Example: AI-Generated NPC Dialogue

```
character.npc.blacksmith
├─ Commit 1: Character definition (name, role, personality)
├─ Commit 2: (SPLIT) → ai-proposal-dialogue
│            └─ Commit 3: AI-generated greeting dialogue
├─ Commit 4: (GATE) Approved by designer
└─ Commit 5: (SCAR) Merged dialogue → now active in game
```

---

## Multiplayer & Shared Worlds

### Multiplayer as Shared Filament Access

**Single-Player:** One player edits game filaments (creative mode)  
**Multiplayer:** Multiple players view/edit same filaments (collaborative mode)

---

### Server-Authoritative Model

**Game State Filament:**
```
game.state.<session-id>
├─ Commit 1: Player A joined
├─ Commit 2: Player A moved to (5, 0, 10)
├─ Commit 3: Player B joined
├─ Commit 4: Player B attacked Player A (damage: 10)
├─ Commit 5: Player A respawned
└─ ...
```

**Authority:**
- **Server** creates commits for game events (movement, combat, spawns)
- **Clients** submit actions → server validates → creates commits
- **Clients** replay commits to reconstruct game state

**Benefits:**
- Full audit trail of game session
- Replay-able (time-travel debugging)
- Cheat-resistant (server validates)

---

## Modding & Community Content

### Mods as Forked Filaments

**Modding = Forking game filaments + adding custom content**

**Example: Custom Level Mod**

```
game.project.epic-quest (main)
  ↓ (player forks)
game.project.epic-quest:custom-levels (fork)
  ├─ Adds: game.scene.ice-cavern (new level)
  ├─ Adds: asset.mesh.ice-golem (new enemy)
  └─ Modifies: game.system.ai-controller (new AI behavior)
```

**Publishing Mod:**
1. Player creates fork (proposal branch)
2. Player develops mod (commits to fork)
3. Player publishes mod (creates `release` filament for fork)
4. Other players can "subscribe" to mod → merges fork into their local game

**Governance:**
- **Official mods**: Adopted by game developer (merge to main via SCAR)
- **Community mods**: Independent forks (distributed via Store)

---

## Implementation Guide

### Project Structure

```typescript
interface GameProject {
  projectId: string;
  title: string;
  version: string;
  
  // Filament references
  filaments: {
    root: string;              // game.project.<id>
    scenes: string[];          // game.scene.<id>[]
    entities: string[];        // game.entity.<id>[]
    systems: string[];         // game.system.<id>[]
    assets: {
      meshes: string[];        // asset.mesh.<id>[]
      textures: string[];      // asset.texture.<id>[]
      audio: string[];         // asset.audio.<id>[]
      animations: string[];    // asset.animation.<id>[]
    };
    builds: string[];          // build.<platform>.<id>[]
    releases: string[];        // release.<id>[]
  };
}
```

---

### Editor Integration

```typescript
// Game editor class
class GameEditor {
  project: GameProject;
  viewport: Viewport3D;
  inspector: InspectorPanel;
  
  async openScene(sceneId: string) {
    // Load scene filament
    const sceneFilament = await getFilament(sceneId);
    const latestCommit = sceneFilament.timeBoxes[sceneFilament.timeBoxes.length - 1];
    const sceneData = latestCommit.faces.output.sceneGraph;
    
    // Render in viewport
    this.viewport.loadScene(sceneData);
  }
  
  async addEntity(entityTemplateId: string, position: Vector3) {
    // Load entity template
    const entityTemplate = await getFilament(entityTemplateId);
    const entityData = entityTemplate.timeBoxes[entityTemplate.timeBoxes.length - 1].faces.output;
    
    // Create entity instance
    const entity = instantiateEntity(entityData, position);
    
    // Update scene
    const currentScene = this.viewport.getScene();
    currentScene.entities.push(entity);
    
    // Create commit
    await createSceneEditCommit({
      sceneId: this.viewport.sceneId,
      operation: 'entity-add',
      before: currentScene,
      after: { ...currentScene, entities: [...currentScene.entities, entity] },
      actor: currentUser.id
    });
    
    // Update viewport (optimistic)
    this.viewport.addEntity(entity);
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Indie Developer Building RPG

**Week 1: Project Setup**
- Create `game.project.my-rpg` filament
- Add starter scenes: main menu, character creation, first level
- Import asset pack (meshes, textures, audio)

**Week 2: Level Design**
- Open `game.scene.forest-01` in 3D viewport
- Place terrain, trees, enemies, loot
- Each placement = commit (auditable)

**Week 3: Game Logic**
- Implement `game.system.combat` (player attacks, enemy AI)
- Implement `game.system.inventory` (item pickup, use)
- Each system edit = commit

**Week 4: AI Content Generation**
- Request AI-generated NPC portraits (5 characters)
- Request AI-generated dialogue (greetings, quests)
- Review & approve AI proposals

**Week 5: Build & Release**
- Create builds for Windows, Linux, Mac
- Tag release v0.1.0 (Alpha)
- Publish to Relay Store

---

### Scenario 2: Team Collaboration on AAA Game

**Team Structure:**
- **Level Designer** (edits scenes)
- **3D Artist** (creates meshes, textures)
- **Programmer** (writes game systems)
- **Sound Designer** (creates audio)
- **Game Director** (approves releases)

**Workflow:**
1. **3D Artist** creates character model → commits to `asset.mesh.hero`
2. **Level Designer** references hero model in scene → creates dependency
3. **Programmer** implements hero controller system → commits to `game.system.player-controller`
4. **Sound Designer** adds footstep audio → commits to `asset.audio.footsteps`
5. **Level Designer** wires footstep audio to hero entity → scene commit
6. **Game Director** tests build → approves release

**All edits auditable:** "Who changed hero model at commit 42? Why did footstep audio break?"

---

## FAQ

### General

**Q: Can I use Relay for any game genre?**  
A: Yes. 2D, 3D, VR, multiplayer, singleplayer—all use the same substrate (filaments + commits).

**Q: Do I need to learn Git?**  
A: No. Git is the backend (invisible). You see familiar game dev tools (Unity-like editor).

**Q: Can I export my game to standard engines (Unity, Unreal)?**  
A: Potentially. Export plugins could translate Relay filaments → Unity scenes. But: you'd lose audit trail.

---

### Technical

**Q: How do you handle large assets (gigabyte textures, meshes)?**  
A: **Evidence pointers** = content hashes (IPFS, cloud storage). Filament commits store hashes, not blobs.

**Q: What about real-time multiplayer performance?**  
A: **State snapshots**: Commit every N seconds (not every frame). Clients interpolate between snapshots.

**Q: Can I use existing game engines?**  
A: Yes, as **operators**. E.g., Unity as render engine (builds scenes from Relay filaments), but truth lives in Relay.

---

### Governance

**Q: Who owns the game?**  
A: Root filament owner (game creator). Can be transferred, shared, or governed via voting.

**Q: Can players mod official games?**  
A: **Policy-dependent**. Game developer sets modding policy (open, curated, closed).

**Q: Can modders monetize?**  
A: **Yes, if allowed**. Mod filaments can have pricing/donations. Revenue shares governed by policy.

---

## Conclusion

The **Game Production Model** ensures:
- ✅ **Full audit trail** (every asset, scene, system edit is a commit)
- ✅ **Collaborative workflows** (designers, artists, programmers work on same project)
- ✅ **AI-assisted creation** (rapid content generation with human oversight)
- ✅ **Modding-friendly** (community can fork, extend, publish)
- ✅ **Git-backed** (version control, branching, merging—just like code)

By treating games as **causality trees of filaments**, Relay enables **unprecedented transparency** and **collaboration** in game development.

---

**See Also:**
- [Multi-Domain Editing](MULTI-DOMAIN-EDITING.md) (Creative tools for games)
- [AI Participation Model](AI-PARTICIPATION-MODEL.md) (AI in game content)
- [Store Catalog Spec](STORE-CATALOG-SPEC.md) (Publishing & distribution)

---

*Last Updated: 2026-01-27*  
*Status: Canonical Specification*  
*Version: 1.0.0*
