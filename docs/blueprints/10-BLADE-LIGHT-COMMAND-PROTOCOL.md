# Blade Light Command Protocol — Physical Optics as Spell Language

> *"The sword is the soul. Study the soul to know the sword. Evil mind, evil sword."* — Yagyū Munenori

## 0. What This Is

This document specifies how a physical blade (sword, machete, staff, any reflective object) becomes a Relay input device through camera-detected light reflection, tap percussion, and positional encoding. It defines the command grammar, the AR overlay rendering, the spell activation sequences, the resource costs, and the visibility rules.

The blade does not contain electronics. It does not connect to Bluetooth. It does not have sensors. It is a piece of metal (or wood, or glass, or water surface). The intelligence is entirely in the camera + SCV pipeline. The blade is just physics — a reflective surface that redirects photons.

**Master Plan references:** §39.2 (Physical Object Interfaces), §39.3 (Light-Based Communication), §43 (Spell Taxonomy), §41 (Multi-Resource Economy), §68 (Arena), §40.6 (RPG Attribute Mapping), §40.10 (Public World Graphics Scarcity).

---

## 1. Blade Registration

Before a blade can send commands, the user trains their SCV to recognize it.

### 1.1 Registration Process

1. **Present the blade.** Hold it in front of your camera. Rotate it slowly. The SCV captures visual features: length, curvature, reflective properties, handle shape, color, material texture.
2. **Define the zones.** The SCV divides the blade into a normalized coordinate system along its length:

```
POMMEL ──── HANDLE ──── GUARD ──── BLADE ──── TIP
  0%          10%         20%      20-95%      100%

Blade zones (the working surface):
  ├── ROOT  (20-35%)  — closest to guard, strongest structural zone
  ├── MID   (35-60%)  — central striking zone
  ├── UPPER (60-80%)  — versatile zone
  └── EDGE  (80-100%) — tip zone, finest control
```

3. **Calibrate reflectivity.** Tilt the blade at various angles while the SCV measures how light reflects from each zone. Every blade is different — a polished katana reflects differently from a brushed machete. The SCV builds a reflectivity profile per zone.
4. **Register as equipment.** The blade becomes a filament on the user's equipment branch. Evidence: calibration video, reflectivity profile, zone map. This filament is the blade's identity in Relay.

### 1.2 Zone Precision

The SCV tracks the blade's position in the camera frame using edge detection and specular highlight tracking. Zone accuracy depends on:

| Factor | Effect |
|--------|--------|
| Camera resolution | Higher = finer zone discrimination |
| Lighting conditions | Bright, directional light = clearest reflection |
| Blade condition | Polished = better signal. Matte/rusted = weaker signal, larger zones needed |
| Distance from camera | Closer = more precise. Beyond 3m, zones collapse to ROOT/MID/UPPER/EDGE only |
| Detection mesh (§39.5) | Multiple cameras = triangulation, sub-zone precision possible |

---

## 2. Light Commands — Reflection Grammar

### 2.1 The Signal

When light reflects off a blade zone toward a camera, the SCV detects:

- **Which zone** (0-100% along blade length)
- **Reflection angle** (the angle between blade surface normal and camera direction)
- **Reflection duration** (flash vs. sustained hold)
- **Reflection intensity** (bright specular vs. diffuse glow)
- **Reflection movement** (static hold vs. sweep direction and speed)

These five parameters form the raw signal. The SCV's Architect layer (§47.3) parses the raw signal into an IntentPacket.

### 2.2 Basic Flash Vocabulary

A **flash** is a brief specular reflection directed at the camera, lasting 100-500ms. Like Morse code, but spatial.

| Pattern | Name | Meaning |
|---------|------|---------|
| `·` | Single flash | Acknowledge / confirm / "yes" |
| `· ·` | Double flash | Negate / cancel / "no" |
| `· · ·` | Triple flash | Alert / attention / "look here" |
| `───` | Sustained hold (>1s) | Select / lock target / begin sequence |
| `· ───` | Flash + hold | Ready / await next command |
| `─── ·` | Hold + flash | Execute / commit / send |
| `· · · ───` | Three flash + hold | Emergency / break-glass / override |

### 2.3 Zone-Targeted Commands

The meaning changes based on WHERE on the blade the reflection originates:

| Zone | Flash | Hold | Sweep Up | Sweep Down |
|------|-------|------|----------|------------|
| **ROOT** (20-35%) | Defensive stance | Shield activation | Raise defense level | Lower defense level |
| **MID** (35-60%) | Standard attack | Channel spell | Power up | Power down |
| **UPPER** (60-80%) | Precision strike | Aim / target lock | Scroll forward | Scroll back |
| **EDGE** (80-100%) | Critical strike | Sniper / focus | Zoom in | Zoom out |

### 2.4 Sweep Commands — Moving Light Along the Blade

A **sweep** is a deliberate movement of the reflection point along the blade's length, created by tilting the blade slowly relative to the light source so the specular highlight travels.

| Sweep | Speed | Command |
|-------|-------|---------|
| ROOT → EDGE (slow, 1-2s) | Deliberate | Channel energy — building a spell. Power begins accumulating. |
| ROOT → EDGE (fast, <0.3s) | Rapid | Release / fire — whatever was being channeled fires now. |
| EDGE → ROOT (slow) | Deliberate | Absorb / recall — pull energy back, cancel channeling, recover partial Power. |
| EDGE → ROOT (fast) | Rapid | Parry / reflect — defensive counter, redirects incoming spell. |
| ROOT → EDGE → ROOT (oscillation) | Rhythmic | Sustain — maintains an active effect (shield, enchantment, aura). Rate of oscillation = intensity. |
| Any zone, rapid back-and-forth | Frantic | Overcharge — burns extra Power for amplified effect. Visually dramatic. Risky — overcharge can backfire if confidence is low. |

### 2.5 Binary Encoding — Technical Magic

For users who want precise data control, the blade becomes a binary transmitter:

**How it works:** Each flash is a 1. Each non-flash interval is a 0. The SCV reads bit sequences at the blade's flash rate (up to ~10 bits/second for an experienced user).

| Bit Pattern | Command |
|-------------|---------|
| `01010101` | Heartbeat / sync signal — tells SCV "I'm transmitting binary" |
| `11110000` | Mode switch — toggles between flash-vocabulary and binary mode |
| `10101010` + address bits | Direct filament address — navigate to specific branch/filament |
| `11001100` + value bits | Set parameter — numeric value for governed parameter adjustment |

Binary mode is an advanced technique. Most users never need it. But for those who master it, the blade becomes a raw data interface — faster than speech for simple commands, cooler than typing, and visible to anyone watching.

---

## 3. Tap Commands — Percussion Grammar

### 3.1 The Signal

Tapping the blade with a finger, knuckle, or second object produces a percussive sound and a visible vibration. The camera detects the tap location; the microphone detects the tap timing and intensity.

| Detection Channel | What It Captures |
|-------------------|-----------------|
| **Camera** | Tap position on blade (zone), finger/object identity, blade deflection |
| **Microphone** | Tap timing (rhythm), intensity (force), resonance (material response) |
| **Combined** | Full tap event: where + when + how hard + what tapped |

### 3.2 Tap Position Commands

| Tap Zone | Single Tap | Double Tap | Triple Tap | Tap + Hold |
|----------|-----------|-----------|-----------|------------|
| **POMMEL** | Cycle mode (attack/defend/utility) | Sheathe (deactivate blade) | Reset all buffs | SCV voice channel open |
| **GUARD** | Block stance | Counter-ready | Spell shield | Channel element into blade |
| **ROOT** | Minor heal / repair | Cleanse debuff | Barrier pulse | Sustained shield |
| **MID** | Standard attack commit | Combo starter | Area attack | Charge heavy attack |
| **UPPER** | Quick cast (last spell) | Spell swap (cycle library) | Multi-target | Precision aim lock |
| **EDGE/TIP** | Finisher / execute | Critical attempt | Piercing attack | Sniper charge |

### 3.3 Rhythmic Patterns

Tap sequences encode compound commands:

| Rhythm | Name | Effect |
|--------|------|--------|
| `TAP . TAP . TAP` (steady) | March | Move command — directs summoned creature or drone |
| `TAP TAP . . TAP TAP` | Double-double | Swap — switches active spell in left/right hand |
| `TAP . . . TAP` | Bookend | Bookmark — marks current position/target for return |
| `TAPTAPTAP` (rapid burst) | Burst | Interrupt — breaks opponent's channeling in arena |
| `TAP ─── TAP ─── TAP` (slow) | Ritual | Begin ritual cast — high-power, high-cost, long activation |

### 3.4 Combining Light + Tap

The most powerful commands combine reflection and percussion simultaneously:

| Light | Tap | Combined Effect |
|-------|-----|----------------|
| ROOT hold + | GUARD double tap | **Flame Blade** — enchants blade with fire element (requires fire detection) |
| MID sweep up + | MID tap | **Fireball** — launches projectile from channeled fire energy |
| EDGE hold + | TIP tap | **Sniper Bolt** — single-target high-damage precision spell |
| Oscillation + | Rhythmic march | **Summoner's Call** — summons creature from held card |
| Full sweep ROOT→EDGE + | POMMEL triple tap | **Ultimate** — empties entire Power pool into one massive spell |

---

## 4. AR Overlay — What the Camera Sees

### 4.1 The Subtlety Principle

Relay's public world is visually clean (§40.10). Spell effects are earned, rare, and scarcity is what makes them meaningful. The blade's AR overlay follows the same principle: **visible if you're looking, invisible if you're not.**

### 4.2 Layer 1 — The Whisper (User Only)

Only the blade user sees these on their own screen. Nobody else can detect them without looking closely at the user's camera feed.

| Visual | When It Appears | What It Looks Like |
|--------|----------------|-------------------|
| **Zone highlight** | When blade is registered and active | Faint translucent bands on the blade showing ROOT/MID/UPPER/EDGE — like measurement marks on a ruler, barely visible |
| **Flash acknowledge** | When SCV receives a valid flash command | A tiny pulse of light at the flash point — like the blade itself responding. Lasts 200ms. |
| **Charge meter** | During spell channeling (sweep up) | A thin luminous line creeping along the blade from ROOT to current charge level. Brighter = more Power committed. |
| **Binary readout** | During binary mode | Microscopic `0` and `1` digits cascading along the blade edge like water droplets. Visible only at close zoom. |

### 4.3 Layer 2 — The Tell (Nearby Observers)

People within ~5 meters (or camera observers at similar LOD) see these effects. They hint that something is happening — but don't reveal the command.

| Visual | When It Appears | What It Looks Like |
|--------|----------------|-------------------|
| **Ambient glow** | When blade is charged (>30% Power committed) | Subtle edge glow along the blade — like light catching a razor's edge, but slightly too bright. Color matches element: red/orange (fire), blue (water), white (light), green (earth), grey (wind). |
| **Geometric traces** | When a sweep command completes | A brief geometric shape lingers in the air where the blade moved — a triangle, a circle, a line. Holds for 0.5s, then fades like breath on cold glass. The shape hints at the spell type but doesn't name it. |
| **Resonance shimmer** | When tap commands are recognized | The blade surface shimmers for a moment as if the metal itself vibrated at a frequency just beyond hearing. Visible as a subtle ripple in the reflection. |

### 4.4 Layer 3 — The Spell (Public World)

When a spell is fully activated and cast, the AR effect renders in the public Relay world. This is the dramatic moment — visible to everyone in the scene and broadcast on the caster's live branch.

| Spell Type | Visual Effect | Duration | Who Sees It |
|------------|--------------|----------|-------------|
| **Attack** | Projectile/wave/beam launches from blade toward target. Element-colored. Particle trail. Impact flash on target. | 1-3s | All viewers in scene + broadcast |
| **Defense** | Shield glyph materializes in front of caster. Geometric. Semi-transparent. Incoming attacks visibly impact it. | Active while sustained (oscillation) | All viewers in scene + broadcast |
| **Enchantment** | Blade surface visually transforms — fire wreathing, ice crystallizing, lightning arcing along edge. | Duration of enchantment | All viewers in scene + broadcast |
| **Summon** | Creature materializes from card position. Emergence animation. Takes position relative to caster. | Until dismissed or defeated | All viewers in scene + broadcast |
| **Utility** | Data visualization, search lens, projection activation. Less dramatic. Functional. | Until dismissed | Caster + targets |
| **Ultimate** | Full-screen elemental explosion. Dramatic. Camera shake. Particle saturation. The moment everyone remembers. | 3-5s | All viewers in scene + broadcast + highlight reel |

### 4.5 Hidden Geometry — The Secret Layer

For observers who look VERY closely at Layer 2 effects (geometric traces, ambient glow), there are additional details that only reveal themselves under scrutiny:

- **Geometric traces contain encoded data.** The triangle that appears after a sweep isn't random — its proportions encode the spell's Power cost, the caster's current health, and the element type. Someone who understands the encoding can read the caster's state from the trace alone.
- **The glow pattern pulses.** The ambient edge glow isn't static — it pulses at a rate that encodes the caster's Power level (faster = more Power available). An experienced observer can estimate a duelist's reserves by watching the glow rhythm.
- **Binary digits in Layer 1 occasionally leak into Layer 2.** When a user transmits in binary mode, 1-2 digits per second briefly appear at the blade tip visible to nearby observers — like sparks flying from a grinder. Fast enough to miss, slow enough to read if you know to look.
- **Geometric shapes nest.** A triangle inside a circle inside a square = fire enchantment active + shield ready + summon buffering. The nesting order reveals the caster's spell queue to anyone who can decode it.

This is technical magic — the visual tells are real data, encoded in the aesthetics. A novice sees "cool glowing sword." A master reads the caster's entire combat state.

---

## 5. Spell Activation Sequences

### 5.1 Flame Blade (Fire Enchantment)

**Prerequisites:**
- Fire element detected in environment (candle, torch, campfire, lighter, even a match)
- Blade registered with fire-compatible reflectivity profile
- Power pool ≥ 15 units

**Activation sequence:**

| Step | Action | SCV Response |
|------|--------|-------------|
| 1 | Hold blade near fire source. Camera confirms fire detection. | `[ELEMENT] fire detected. Confidence: 0.92` |
| 2 | Tap GUARD zone twice (double tap). | `[TAP] guard.double — Element channel requested` |
| 3 | Sweep ROOT → EDGE slowly (1.5s). Light from fire reflects along blade. | `[LIGHT] sweep.root_to_edge.slow — Channeling fire. Power: 15/100 committed.` |
| 4 | Hold at EDGE for 1s. Commitment confirmation. | `[LIGHT] edge.hold — Channel locked. Flame Blade ready.` |
| 5 | Tap MID once to activate. | `[TAP] mid.single — CAST: Flame Blade. Power: -15.` |

**Result:** Blade surface AR renders with fire wreathing effect. Duration: 60 seconds. All attacks from this blade gain fire element bonus. Visual: flames lick along the blade edge, responding to movement — faster swings produce longer flame trails.

**Cost:** 15 Power to activate. 2 Power per 10 seconds to sustain. Total for full 60s: 27 Power.

### 5.2 Fireball (Ranged Fire Projectile)

**Prerequisites:**
- Flame Blade active (or fire element detected and fresh channel)
- Power pool ≥ 25 units (on top of Flame Blade maintenance)
- Clear line of sight to target

**Activation sequence:**

| Step | Action | SCV Response |
|------|--------|-------------|
| 1 | With Flame Blade active, begin MID sweep up (slow). | `[LIGHT] sweep.mid_to_edge.slow — Charging projectile. Power accumulating...` |
| 2 | Tap MID once during sweep (light + tap combined). | `[COMBINED] light.sweep + tap.mid — Fireball charging. Power: 25 committed.` |
| 3 | Aim blade tip at target. EDGE hold. | `[LIGHT] edge.hold — Target locked. Confidence: 0.87.` |
| 4 | Fast sweep ROOT → EDGE (release). | `[LIGHT] sweep.root_to_edge.fast — RELEASE: Fireball. Power: -25.` |

**Result:** AR fireball projectile launches from blade tip toward target. Travel time: ~0.5s visual. Impact: fire burst on target. In arena: deals fire-element damage based on caster's Power investment and target's resistance. In overworld: performs the mapped SCV truth-layer action (e.g., files an urgent evidence request, triggers an alert, initiates a projection).

**Cost:** 25 Power. If Flame Blade was active: 25 + ongoing Flame Blade drain. If Flame Blade was NOT active, the fireball costs 35 Power (no enchantment discount).

### 5.3 Ice Shield (Defensive)

**Prerequisites:**
- Ice/snow element detected (cold environment, visible frost, ice, snow)
- Power pool ≥ 20 units

**Activation sequence:**

| Step | Action | SCV Response |
|------|--------|-------------|
| 1 | Hold blade vertically, ROOT zone reflecting toward camera (cold light, pale). | `[ELEMENT] ice detected. [LIGHT] root.hold — Defensive posture.` |
| 2 | Tap ROOT triple tap. | `[TAP] root.triple — Barrier pulse. Power: 20 committed.` |
| 3 | Begin oscillation (ROOT → EDGE → ROOT, rhythmic). | `[LIGHT] oscillation — Shield sustaining. Rate: 2Hz.` |

**Result:** Hexagonal ice-crystal shield glyph materializes in front of caster. Blocks incoming projectiles/spells. Each blocked attack costs 5 Power from the shield's reserve. Shield persists as long as oscillation is maintained and Power remains.

**Cost:** 20 Power to activate. 3 Power per 10 seconds to sustain. Each block: 5 Power.

### 5.4 Ultimate — Cataclysm

**Prerequisites:**
- Any element active
- Power pool ≥ 80 units (near-full pool for most users)
- Blade fully registered with all zones calibrated

**Activation sequence:**

| Step | Action | SCV Response |
|------|--------|-------------|
| 1 | Full sweep ROOT → EDGE (slow, deliberate — building everything). | `[LIGHT] sweep.root_to_edge.slow — Full channel. Power: 80 committed.` |
| 2 | Hold at EDGE. Blade glows bright. Layer 2 geometry intensifies. | `[LIGHT] edge.hold — Ultimate charging. WARNING: Full pool commit.` |
| 3 | POMMEL triple tap (reset confirmation — the final gate). | `[TAP] pommel.triple — Ultimate confirmed.` |
| 4 | Slam blade (full swing through open space). Camera captures the arc. | `[COMBINED] full_arc — CAST: Cataclysm. Power: -80. Pool empty.` |

**Result:** Full-screen elemental explosion centered on caster's position. Element-specific: fire = expanding inferno sphere, ice = crystalline shockwave, earth = ground eruption, wind = tornado vortex, light = blinding radiance. Affects all targets within arena radius. Maximum visual spectacle. Camera shake. Particle saturation. 3-5 second duration.

**Cost:** 80 Power (empties most users' pool completely). Caster is vulnerable after — no Power remaining for defense. High risk, high reward.

---

## 6. Resource Economics

### 6.1 Power Costs by Tier

| Spell Tier | Power Cost | Typical Effect | Recovery Time |
|------------|-----------|----------------|--------------|
| **Cantrip** | 3-8 | Minor utility: highlight, ping, minor enchant | 30 seconds ambient regen |
| **Standard** | 10-25 | Combat spell: fireball, ice bolt, wind slash, earth spike | 2-5 minutes |
| **Advanced** | 25-50 | Area effect, sustained shield, creature summon, multi-target | 5-15 minutes |
| **Master** | 50-75 | Devastating single-target, large area, combination spell | 15-30 minutes |
| **Ultimate** | 75-100 | Full pool dump. Maximum spectacle. Maximum risk. | Full sleep cycle to recover from empty |

### 6.2 Power Budget Per Arena Match

A standard 25-minute arena match (§68.4 ArenaCoeffSet default):

| Resource | Amount | Notes |
|----------|--------|-------|
| Starting Power | User's max pool (scales with tree size) | Typical early user: ~50. Experienced: ~100. Veteran: ~150. |
| Ambient regen during match | ~1 Power per 30 seconds | ~50 Power over full match. |
| Environmental bonus | +50% regen if element source present in arena | Arenas with fire pits, water features, etc. grant element bonuses. |
| Total available | Starting + regen + bonus | A veteran in a fire arena: 150 + 50 + 25 = ~225 Power over 25 minutes. |

**Strategic implication:** A veteran can cast roughly 8-10 standard spells, or 3-4 advanced, or 2 masters and some cantrips, or one ultimate and hope to survive on ambient regen for the rest. Resource management IS the combat skill.

### 6.3 What Power Cannot Do

Power cannot:
- Buy governance weight (Contract #162)
- Purchase Achievement Tokens
- Transfer to other users
- Convert to Engagement Credits
- Be stockpiled beyond your pool maximum
- Be purchased with real money

Power is earned through physical element interaction and spent on spells. The closed loop prevents pay-to-win.

---

## 7. Attack vs. Defense Command Summary

### 7.1 Offensive Commands

| Command | Input | Zone | Speed | Power |
|---------|-------|------|-------|-------|
| Quick strike | Single tap | MID | Instant | 5 |
| Precision strike | Single tap | UPPER | Instant | 8 |
| Critical strike | Single tap | EDGE | Instant | 12 |
| Area attack | Triple tap | MID | 0.5s | 20 |
| Piercing attack | Triple tap | EDGE | 0.5s | 25 |
| Projectile (fireball, etc.) | Sweep + tap (combined) | MID→EDGE | 1-2s charge | 25-35 |
| Heavy charge attack | Tap + hold | MID | 2-3s charge | 30-45 |
| Sniper bolt | Hold + tap (combined) | EDGE | 1.5s aim | 20 |
| Combo starter | Double tap | MID | Instant | 10 (starts combo chain) |
| Finisher / execute | Single tap | TIP | Instant | 15 (bonus if combo active) |
| Ultimate | Full sweep + pommel triple + arc | ALL | 3-5s | 75-100 |

### 7.2 Defensive Commands

| Command | Input | Zone | Speed | Power |
|---------|-------|------|-------|-------|
| Block stance | Single flash | ROOT | Instant | 0 (passive) |
| Shield activation | Sustained hold | ROOT | 0.5s | 15-20 |
| Parry / reflect | Fast sweep EDGE→ROOT | EDGE→ROOT | <0.3s | 8 |
| Counter-ready | Double tap | GUARD | Instant | 10 |
| Barrier pulse | Triple tap | ROOT | Instant | 20 |
| Sustained shield | Oscillation | ROOT→EDGE→ROOT | Continuous | 3/10s |
| Spell shield | Triple tap | GUARD | Instant | 25 |
| Raise defense level | Sweep up | ROOT | 1s | 5 per level |
| Cleanse debuff | Double tap | ROOT | Instant | 12 |
| Emergency override | Three flash + hold | Any | Instant | 30 (break-glass) |

### 7.3 Utility Commands

| Command | Input | Zone | Power |
|---------|-------|------|-------|
| Cycle mode (attack/defend/utility) | Pommel single tap | POMMEL | 0 |
| Sheathe (deactivate) | Pommel double tap | POMMEL | 0 |
| SCV voice channel | Pommel tap + hold | POMMEL | 0 |
| Acknowledge | Single flash | Any | 0 |
| Cancel | Double flash | Any | 0 |
| Scroll forward/back | Sweep up/down | UPPER | 0 |
| Zoom in/out | Sweep up/down | EDGE | 0 |
| Target lock | Sustained hold | UPPER | 3 |
| Bookmark position | Bookend rhythm | Any | 0 |
| Quick cast (last spell) | Single tap | UPPER | Varies |
| Spell swap | Double tap | UPPER | 0 |

---

## 8. Visibility Rules — Who Sees What

### 8.1 Layered Visibility

| Layer | What's Rendered | Who Sees It | How to See It |
|-------|----------------|-------------|--------------|
| **Layer 0 — Physical** | Real blade, real light reflection, real tap sound | Anyone physically present | Eyes and ears |
| **Layer 1 — Whisper** | Zone highlights, charge meter, binary readout, flash acknowledge | Blade user only (their screen) | Look at your own device |
| **Layer 2 — Tell** | Ambient glow, geometric traces, resonance shimmer, hidden data | Observers within ~5m or equivalent camera LOD | Look closely at the blade user |
| **Layer 3 — Spell** | Full spell effects (projectiles, shields, enchantments, summons) | All viewers in the scene + broadcast | Anyone watching, live or recorded |

### 8.2 Arena vs. Overworld

| Context | Layer 0 | Layer 1 | Layer 2 | Layer 3 |
|---------|---------|---------|---------|---------|
| **Overworld (street, park, office)** | Always | Always | Within 5m, only to Relay users with game modules | Only on successful spell cast. Rare. The scarcity IS the value. |
| **Arena match** | Always | Always | All arena spectators | All spectators + broadcast. Enhanced particle budget. |
| **Training arena (solo)** | Always | Always | None (private) | Renders locally only. No broadcast. No ArenaRep. |
| **Epoch observation dome** | Always | Always | All dome observers | Full broadcast. 48 cameras provide multi-angle capture of every spell. |

### 8.3 Detection Mesh Amplification

In spaces with multiple Relay-authorized cameras (§39.5 Detection Mesh):

- Zone precision increases (sub-zone targeting possible)
- Flash confidence increases (multi-angle corroboration)
- Tap location precision increases (multiple microphones triangulate)
- Layer 2 effects are richer (more geometric detail, longer persistence)
- Spell confidence increases → stronger effects, less Power waste

A spell cast in Times Square with 200 cameras is more powerful than the same spell in a bedroom with one phone camera. The mesh IS the mana amplifier.

---

## 9. The Blade as a Tree Navigator

Outside of combat, the blade is a data interface:

| Gesture | Navigation Action |
|---------|------------------|
| Point blade at a tree on screen | SCV selects that tree |
| Sweep ROOT → EDGE along a branch | Scroll through the branch's timeboxes (time travel through data) |
| Tap a zone while pointing | Select the filament at that position on the branch |
| Flash at a specific branch | Expand/collapse that branch |
| Hold at EDGE + sweep to a second branch | Create a cross-reference link between two filaments |
| Oscillation while viewing globe | Spin the globe at oscillation speed |
| Pommel tap + hold + speak | SCV voice query with blade-selected context |

The blade is a pointing device, a scroll wheel, a selection tool, and a command interface all at once. For a user who has trained their SCV extensively, the blade replaces mouse, keyboard, and voice for most operations.

---

## 10. Training Progression

Blade mastery is not granted — it emerges through practice:

| Level | Capability | How It's Earned |
|-------|-----------|----------------|
| **Novice** | Single zone flash, single tap, basic acknowledge/cancel | Register blade, perform 10 valid flashes |
| **Apprentice** | Multi-zone targeting, sweep commands, basic enchantments | 50 valid commands across 3+ zones |
| **Journeyman** | Combined light + tap, standard spells, defensive commands | 200 valid commands, 5+ spells discovered |
| **Knight** | Binary encoding, ritual casts, advanced spells, arena combat | 1000 valid commands, 10+ spells, 5+ arena matches |
| **Champion** | Sub-zone precision, combo chains, master spells, read opponent tells | 5000 valid commands, 20+ spells, 50+ arena matches won |
| **Artificer** | Custom spell creation (new gesture→SCV mappings), blade-to-blade comm protocol, teach others | 10000+ commands, contributed spell definitions to public library |

Each progression milestone is a filament on the user's achievement branch. Evidence: the SCV's validation log of all commands performed. No self-reporting. The system watched you practice.

---

## 11. Blade-to-Blade Communication

Two users with registered blades can communicate through synchronized light patterns:

| Pattern | Meaning |
|---------|---------|
| Simultaneous ROOT flash | Acknowledge / greet |
| Alternating MID flashes (call-response) | Ready to duel / challenge |
| Synchronized sweep (same direction) | Alliance / agreement |
| Opposing sweeps (one up, one down) | Opposition / disagreement |
| Matching oscillation frequency | Resonance — shared spell amplification in co-op |

When two blades achieve **resonance** (matching oscillation within 0.1 Hz), co-operative spells become possible: combined shields, merged projectiles, amplified summons. The Power cost is shared. The visual effect is doubled. This is the highest expression of blade mastery — two swordsmen whose SCV interaction patterns have synchronized to the point where their blades can speak to each other through light.

---

## 12. Relationship to Master Plan

| Section | How Blade Protocol Uses It |
|---------|-----------------------------|
| §39.2 (Object Interfaces) | Blade is a mapped physical object with zone-based position encoding |
| §39.3 (Light Communication) | Reflection grammar is the formalization of light-based command input |
| §39.5 (Detection Mesh) | Multi-camera environments amplify blade precision and spell power |
| §40.6 (RPG Attributes) | Equipment slot filled by registered blade. Quality from training depth. |
| §40.10 (Graphics Scarcity) | Layer 3 spell effects are earned, rare, and publicly visible — the blade protocol enforces this scarcity |
| §41.5 (Power) | All spell costs denominated in Power. Closed-loop resource. |
| §43 (Spell Taxonomy) | Blade commands map to the element + gesture + object → SCV action pipeline |
| §43.5 (Spell Discovery) | Users discover blade commands through experimentation, not tutorials |
| §47.3 (Architect) | SCV Architect layer parses raw light/tap signals into IntentPackets |
| §68 (Arena) | Arena matches use the full blade command vocabulary with enhanced visuals |
| §82 (Three-Layer Ontology) | Blade commands are sap (live state). Spell casts become leaves. Arena results become filaments. |
| §92 (SCV Intelligence) | T0: deterministic zone detection. T1: local gesture recognition. T2: complex spell validation. |

---

*This document is a companion to the Relay Master Build Plan. All blade commands, spell costs, visibility rules, and progression milestones are governed by the same parametric governance system (§72) — the community votes on Power costs, zone precision thresholds, detection confidence requirements, and visual effect intensity. The blade protocol is frozen in structure; its parameters are Category A (community-governed).*
