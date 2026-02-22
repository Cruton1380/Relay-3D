# Image Generation Corrections — SCV Agent Refocus Brief

> **Read this document FIRST before regenerating any Relay image.**
> This is based on review of actual generated images and identifies specific failures that must be corrected.

---

## System State

- **Master Plan**: 336 frozen contracts, 111 top-level sections (§0–§111)
- **Blueprint Series**: 21 ASCII structural diagrams (01-21)
- **Image Brief**: RELAY-IMAGE-BRIEF.md (10 canonical images described)
- **This document**: Corrections based on review of 3 generated images

---

## Generated Image Review

### IMAGE A — Branch Cross-Section (Attempt at Image 3)

**Reference**: A photorealistic cross-section of a tree trunk with concentric rings, overlaid with data labels, a radial crack, and a "FRAUD FLAGGED" marker.

**What went RIGHT**:
- Real wood texture — photorealistic grain and rings
- Warm amber color palette — correct for Relay
- Concentric ring structure visible
- A radial crack exists
- Timebox labels (Q1-Q3 2025) are present

**What went WRONG — MUST FIX**:

| Problem | Why It's Wrong | What Relay Actually Looks Like |
|---------|---------------|-------------------------------|
| Red "FRAUD FLAGGED" badge with warning triangle | Relay never uses alarm aesthetics. No red badges. No warning triangles. Scars are quiet. | A dark radial crack — like a real wood crack. Permanent. Silent. No color other than dark/black. No icon. |
| Generic UI overlay boxes | The data labels look like floating tooltip windows from a dashboard app. | Contextual lens annotations — minimal, geometric, anchored to the exact ring depth they reference. Thin lines connecting label to ring. No drop shadows. No rounded corners. |
| Crack is a simple black line | The crack doesn't show propagation, origin timebox, or stress deformation. | The crack must originate at a specific inner ring (the timebox where the event occurred), propagate outward through every subsequent ring, and subtly distort adjacent ring geometry — stress history, not just a line. |
| "Q1 2025" labels are just text | The labels float near rings but don't encode structural information. | Each timebox ring should be visually distinct: thick ring = busy period (high commit count), thin ring = quiet period. The label should include aggregate stats (filament count, magnitude sum, confidence average). The RING ITSELF tells the story — the label just names it. |
| No twig spike | The unresolved marker is a text label, not a physical protrusion. | A twig is a small physical spike protruding from the bark edge — an unresolved filament that stayed at bark radius while everything else migrated inward. It should look like a real twig stub on a tree stump. |
| Ring thickness is uniform | All rings appear roughly the same width. | Ring thickness MUST vary. A busy quarter = thick ring. A quiet month = thin ring. The variation IS the information. Uniform rings = no data. |

**Corrected approach for Image 3**:
- Photorealistic wood cross-section (keep this — it was good)
- Warm amber outer ring (current active period, glowing slightly)
- Dimmer middle rings with varying thickness
- Dense compressed heartwood at center (dark, tight rings)
- One radial crack starting from an inner ring, propagating outward, with subtle ring deformation where it passes (rings bend slightly near the crack)
- Lens-style overlays: thin geometric lines connecting to specific rings, minimal text, no boxes
- Twig spike at bark edge: small physical wood protrusion, labeled with thin line
- Crack annotation: originating timebox, amount, commit ID, evidence count — as a thin connected label, not a badge
- NO red. NO warning icons. NO alarm aesthetics. The scar speaks for itself.

---

### IMAGE B — Personal Tree (Attempt at Image 2)

**Reference**: A tree in a circular stone basin with glowing amber particles, root tendrils, and L0/L1/L2/L3 labels on the trunk.

**What went RIGHT**:
- Circular basin at the base — correct Laniakea geometry
- Visible root system extending below
- Warm amber color palette
- Tree growing FROM the ground (not floating)

**What went WRONG — MUST FIX**:

| Problem | Why It's Wrong | What Relay Actually Looks Like |
|---------|---------------|-------------------------------|
| Sparkly/magical particles everywhere | This looks like a fantasy RPG tree. Relay is biology, not magic. | NO particles. NO sparkles. NO magical aura. The tree looks like a real oak photographed in warm afternoon light. The only glow comes from sap flowing through active branches — a faint warm pulse, like blood through a vein. |
| Branches are twisted/organic/fantasy | The branches spiral and twist artistically. | Branches are STRAIGHT CYLINDERS. Think real oak limbs. Slight lean (5-10°) from counterparty pressure. Slight droop from wilt. NEVER spiraled. NEVER corkscrewed. NEVER fantasy-curved. |
| L0/L1/L2/L3 labels on trunk | These labels don't correspond to any Relay concept correctly placed on the trunk. L0-L3 are governance layers, not trunk labels. | If showing LOD levels, they should be spatial altitude bands above the tree (§90 airspace). If showing privacy tiers, they should be on individual branches. Labels on trunk = wrong. |
| Roots glow blue/white | The roots emit ethereal light. | Roots are underground. They look like real tree roots — wood texture, same grain as trunk, dimmer color (archived data). They might have faint warm glow from retrieval activity (root heat), but NEVER blue/white ethereal light. |
| Uniform glow across tree | Every part of the tree glows the same warm amber. | Variation IS information. One branch should be thick and warm (active, well-evidenced). Another should be thinner and drooping (wilting). Another should have frost on its tip (dormant). Another should have a dark crack (scar). NO branch looks the same as any other. |
| No visible filament ribbons on bark | The bark is smooth/generic tree texture. | Zoom close enough and you MUST see horizontal ribbons running along the branch surface. Each ribbon is a committed data record. They vary in width (magnitude), opacity (confidence), and color temperature (activity). The bark IS the spreadsheet. |

**Corrected approach for Image 2**:
- Real deciduous tree (oak/beech), 3-4m tall, in circular basin
- Photographed in warm afternoon light — NO magical effects
- 6-8 main branches at natural angles, STRAIGHT cylinders
- Variation: one thick/warm branch, one thin/drooping, one with dark crack, one faintly light blue (projection)
- On closest branch: visible horizontal ribbons on bark surface (filaments)
- Small glowing orb near tree (SCV) — subtle, not prominent
- Translucent leaves falling from one branch (ephemeral data)
- Faint roots visible at ground level extending into soil
- NO sparkles. NO particles. NO uniform glow. NO fantasy.

---

### IMAGE C — Globe (Attempt at Image 1)

**Reference**: Photorealistic Earth from space showing city lights, sunrise on the horizon.

**What went RIGHT**:
- Earth from orbital perspective
- Warm-toned city light patterns
- Atmosphere and clouds present
- General sense of scale

**What went WRONG — MUST FIX**:

| Problem | Why It's Wrong | What Relay Actually Looks Like |
|---------|---------------|-------------------------------|
| Looks like a stock NASA photo | This is just Earth at night. No Relay-specific qualities. | The lights should be distinctly warm amber-GOLD, not white-electric. They should feel organic — like living canopies, not electrical grids. Irregular, clustered, breathing. |
| City grid patterns visible | The lights follow street grid patterns — these are electric city lights. | Relay tree lights don't follow grids. They cluster organically around geographic coordinates — dense clumps over cities (each tree is a person/org at their location), but NOT grid-aligned. More like bioluminescent algae bloom patterns than street lights. |
| No sense of trees as individual points | The lights blend into a continuous glow. | At this altitude, each light should be a distinct tiny point — one point per tree. Dense enough to form clusters but individually discernible at edges. Each point is warm amber-gold. Brighter points = higher Shine (more attention). |
| Sun is just atmospheric lighting | The sun is decorative. | The sun position IS the time reference. Globe rotation = Gravity. The sun should feel like the clock mechanism — the system's time source. Daylight side shows trees differently than night side (both should be visible, but night side makes tree lights pop). |

**Corrected approach for Image 1**:
- Photorealistic Earth from ~2000km altitude
- Surface covered in millions of tiny warm amber-gold points (NOT white electric)
- Dense clusters over cities, sparse scatter over rural areas
- Points are individually discernible at cluster edges (they're trees, not grid lights)
- Organic clustering pattern (NOT street grids)
- Sun visible as time source
- Atmosphere, clouds, terrain visible beneath the tree lights
- Night side of Earth shows tree lights most prominently
- Effect should feel alive — these are living data canopies, not infrastructure

---

## Universal Corrections (Apply to ALL Future Images)

### The Three Worst Recurring Failures

1. **Fantasy/magical aesthetics**: Relay is biology, not magic. Real wood. Real bark. Real rings. The data texture is the ONLY supernatural element — ribbons on bark that shouldn't be there on a real tree, but rendered as if they ARE real bark. No sparkles, no particles, no ethereal glow, no bioluminescence.

2. **Uniform rendering**: Every tree, every branch, every ring MUST vary. Variation IS information. If everything looks the same, you've failed to encode data. A Relay image with uniform elements is like a spreadsheet where every cell has the same number.

3. **Dashboard UI overlays**: Labels and annotations should feel like AR lens annotations, not web app tooltips. Thin geometric lines. Minimal text. Anchored precisely to the element they describe. No drop shadows, no rounded corners, no colored backgrounds. Think architectural drawing callouts, not Material Design cards.

### Visual Quality Bar

The target aesthetic: **Photorealistic impossible biology**. It should look like a photograph of something that cannot exist in nature — a real tree with data texture, growing from real Earth, with real wood grain that resolves into spreadsheet rows when you zoom in. The camera, lighting, and materials should be indistinguishable from a photograph. Only the subject matter is impossible.

### Contract and Section References

When generating images, the following counts are current:
- **336 frozen contracts** (NOT 314, NOT 321, NOT 328, NOT 332)
- **111 top-level sections** (§0–§111, plus §5b, §49b, §49c, §74b)
- **22 ASCII blueprints** (Series I: 01-10, Series II: 11-22)

---

## Regeneration Priority

If regenerating, do these images first (highest architectural value):

1. **Image 3 — Branch Cross-Section**: The single most important image. If someone understands the rings, they understand Relay. The cross-section IS the system explained in one frame.

2. **Image 2 — Personal Tree**: The emotional anchor. "This is my tree." If the tree looks right, everything else follows.

3. **Image 1 — Globe**: The scale statement. "Every light is someone's truth." Get the organic amber-gold points right and the rest is Earth photography.

After these three are correct, proceed to Images 4-10 in order.
