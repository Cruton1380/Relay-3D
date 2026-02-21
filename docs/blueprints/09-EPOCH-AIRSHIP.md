# The Epoch — Relay Aerospace Low-Orbit Airship

> *"In the year of our dreaming, we built a ship that could see the whole world — and the whole world could see us."* — Eitan Asulin

## 0. What the Epoch Is

The Epoch is a low-orbit lighter-than-air vessel — an airship in the lineage of the great modern blimps (Airlander 10, Pathfinder 1, the LTA Pathfinder) but designed in the spirit of the Blackjack and Falcon from Final Fantasy VI and the Epoch time machine from Chrono Trigger. It is not a weapon platform. It is not a luxury yacht. It is the world's first **flying Relay node** — a persistent, crewed observation and broadcast station that sees the Earth the way Relay sees data: from every angle, at every scale, with nothing hidden.

The Epoch is built by **Relay Aerospace** (`tree.org.relay-hq.relay-aerospace`), a subsidiary of Relay HQ, funded through the mission-gated treasury system (§93). Every rivet, every gas cell, every drone launch is a filament on the Epoch's companion tree.

**What it is NOT:**
- Not a Protoss Carrier or battlecruiser — no weapons of offense
- Not a space shuttle — it operates in the upper atmosphere (18–25 km), not orbit
- Not science fiction — every system described here uses existing or near-term engineering principles
- Not a one-off — the Epoch is the first vessel; the design is a template for a fleet

---

## 1. Design Heritage

### 1.1 The Blimp Lineage

The Epoch inherits from the new generation of hybrid airships:

| Ancestor | What the Epoch Takes |
|----------|---------------------|
| **Airlander 10** | Hybrid lift (helium + aerodynamic body + vectored thrust) |
| **LTA Pathfinder** | Rigid internal structure with non-flammable helium cells |
| **Zeppelin NT** | Semi-rigid gondola integration, fly-by-wire |
| **Solar Impulse** | Solar-powered endurance flight, energy management |
| **Loon (Google)** | Stratospheric station-keeping, altitude-based navigation |

### 1.2 The Fantasy Lineage

The Epoch's aesthetic and layout draw from two airships that defined a generation:

**The Blackjack / Falcon (Final Fantasy VI):**
- A long, elegant hull with a visible deck where the crew walks freely
- An interior with distinct rooms (engine room, deck, cabin, helm)
- The feeling of a *flying home* — not a cockpit, a place you live
- A bow observation point where you stand and watch the world scroll beneath you

**The Epoch (Chrono Trigger):**
- A small, fast, detachable vessel that goes *impossibly fast*
- The concept of a ship within a ship — the Epoch was separate from the Blackbird
- Time travel as an aspiration — not current capability, but the design accommodates future physics
- The dome canopy — full 360° visibility from the pilot seat

### 1.3 The Synthesis

The Relay Epoch combines both: a large, slow, majestic mothership (the Blackjack) carrying a small, fast, detachable scout ship (the Epoch Runner). The mothership is home. The Runner is speed.

---

## 2. The Mothership — Hull & Structure

### 2.1 External Profile

```
         ════════════════════════════════════════
       ╱                                          ╲
     ╱    [SOLAR SKIN — entire upper surface]       ╲
    ║                                                ║
    ║          ┌──────────────────────┐              ║
    ║          │   OBSERVATION DOME   │              ║    ← 360° capture bubble
    ║          └──────────┬───────────┘              ║
    ╚═══════════════════  │  ═══════════════════════╝
                          │
            ┌─────────────┴─────────────┐
            │      MAIN GONDOLA         │              ← crew, arena, ops
            │  ┌─────┐  ┌────┐  ┌────┐ │
            │  │HELM │  │DECK│  │BAY │ │
            │  └─────┘  └────┘  └────┘ │
            └───────┬──────┬──────┬─────┘
                    │      │      │
              [DRONE]  [RUNNER]  [DRONE]               ← detachable
               BAY     DOCK      BAY
```

**Dimensions (target):**
- Length: ~150m (comparable to Airlander 10 at 92m, scaled up)
- Width: ~60m
- Height: ~30m hull + 15m gondola
- Envelope volume: ~500,000 m³ helium
- Gross lift: ~60 metric tons (helium + aerodynamic + thrust)
- Useful payload: ~15 metric tons

### 2.2 Hull Construction

The hull is a **rigid airship** structure — not a blimp (pressure-maintained) but a rigid frame:

| Component | Material | Function |
|-----------|----------|----------|
| **Keel & longerons** | Carbon fiber composite truss | Primary structural spine |
| **Ring frames** | Aluminum-lithium alloy | Transverse shape definition |
| **Gas cells** | Helium in Tedlar/Mylar bladders | Buoyancy (non-flammable) |
| **Outer skin** | Laminated fabric + solar film | Weather protection + power generation |
| **Ballonet** | Internal air bladders | Altitude trim (compress/expand to control buoyancy) |

### 2.3 Solar Skin

The entire upper surface (~8,000 m²) is covered in thin-film solar cells:

- Power generation: ~800 kW peak at altitude (above most weather)
- Battery bank: lithium-sulfur cells, ~2 MWh capacity
- Excess power during day charges batteries + feeds all systems
- Night operations run on battery reserve
- The ship can remain aloft indefinitely in favorable conditions — "eternal flight"

### 2.4 Propulsion

Four vectored electric ducted fans (two per side, fore and aft):

| Parameter | Value |
|-----------|-------|
| Thrust per unit | ~50 kN |
| Rotation | Full 360° vectoring (hover, forward, reverse, climb, descend) |
| Power source | Solar + battery |
| Cruise speed | 80-120 km/h |
| Station-keeping | GPS-locked hover using differential thrust + altitude ballonets |
| Max altitude | ~25 km (stratospheric, above weather, above most air traffic) |

---

## 3. Internal Layout — The Flying Home

The gondola is the habitable structure suspended beneath the hull. It is not a cockpit — it is a building.

### 3.1 Deck Plan

```
LEVEL 3 — OBSERVATION DOME (top)
┌──────────────────────────────────────────────────┐
│                                                  │
│            360° CAPTURE BUBBLE                   │
│        (transparent composite dome)              │
│     cameras: 48x 8K sensors, full sphere         │
│     seating: 12 observation chairs               │
│     Relay node: renders live globe overlay        │
│                                                  │
└──────────────────────────────────────────────────┘

LEVEL 2 — OPERATIONS DECK (main)
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌────────┐  ┌────────────────┐  ┌────────────┐ │
│  │  HELM  │  │   RELAY ARENA  │  │  COMMS &   │ │
│  │        │  │                │  │  BROADCAST │ │
│  │ 2 crew │  │  360° screens  │  │            │ │
│  │ flight │  │  game floor    │  │  satellite │ │
│  │ chairs │  │  crowd seating │  │  uplinks   │ │
│  └────────┘  └────────────────┘  └────────────┘ │
│                                                  │
│  ┌──────────────────┐  ┌───────────────────────┐ │
│  │  WORKSHOP / LAB  │  │  DRONE CONTROL CENTER │ │
│  │                  │  │                       │ │
│  │  3D printers     │  │  12 operator stations │ │
│  │  repair bench    │  │  live drone feeds     │ │
│  │  spare parts     │  │  mission planning     │ │
│  └──────────────────┘  └───────────────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘

LEVEL 1 — CREW DECK (lower)
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │CABIN │ │CABIN │ │CABIN │ │CABIN │ │CABIN │  │
│  │  1   │ │  2   │ │  3   │ │  4   │ │CAPT  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                                  │
│  ┌──────────────┐  ┌──────────┐  ┌────────────┐ │
│  │   GALLEY &   │  │  COMMON  │  │  FITNESS & │ │
│  │   DINING     │  │  LOUNGE  │  │  WELLNESS  │ │
│  └──────────────┘  └──────────┘  └────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │           BOW OBSERVATION DECK           │    │
│  │  (open-air platform, windshield, rail)   │    │
│  │  Stand at the bow. Watch the world.      │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘

LEVEL 0 — BELLY (underbody)
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐   │
│  │ DRONE    │  │ RUNNER DOCK  │  │ DRONE    │   │
│  │ BAY      │  │              │  │ BAY      │   │
│  │ PORT     │  │  docking     │  │ STBD     │   │
│  │          │  │  clamps      │  │          │   │
│  │ 6 slots  │  │  fuel/charge │  │ 6 slots  │   │
│  └──────────┘  └──────────────┘  └──────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │         CARGO & EQUIPMENT HOLD           │    │
│  │  flight suits, airfoils, sails, rescue   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 3.2 Room Details

#### The Helm
Two pilot stations with full flight controls. Panoramic forward windows. HUD overlay renders the Relay globe with the ship's position, weather data, airspace boundaries, and drone positions. Fly-by-wire with manual override. The helm is always crewed during flight — no autonomous piloting of the mothership itself (the ship is too important to trust to algorithms alone).

#### The Relay Arena
A circular room (12m diameter) with floor-to-ceiling curved displays forming a 360° screen. The floor is a pressure-sensitive surface that detects movement, position, and weight distribution. This is a fully functional Relay Arena (§68) — duels, court cases, tournaments, crowd events can be hosted at 25 km altitude. The curved screens form a Device Mesh (§105) that renders the arena as an immersive sphere. Seating for 20 spectators around the perimeter. Standing room for 40.

#### The 360° Capture Bubble
The dome at the top of the observation deck is a transparent composite sphere housing 48 synchronized 8K cameras covering every direction. This is the Epoch's primary evidence-gathering apparatus. It captures:
- Continuous 360° video at 8K resolution
- Time-lapse Earth observation (cities at night, weather systems, aurora)
- Real-time Relay broadcast — anyone on Earth can "look through the Epoch's eyes" via a live branch on the Relay tree
- Evidence for treasure chests (§96) — the Epoch's footage becomes Type 3 founder archive content

#### Drone Control Center
Twelve operator stations, each controlling one or more drones. Live video feeds on individual monitors plus a shared tactical display. Mission planning interface for survey, patrol, inspect, and hover-observe missions (§101 MissionFilament). Drones launch and recover through the belly bays.

#### The Bow Observation Deck
An open-air (shielded) platform at the front of the gondola. Windshield and railing. You stand here and look down at the Earth from the edge of space. This is the Blackjack moment — the scene from FF6 where you stand on the deck and the Mode 7 world scrolls beneath you. Except it's real.

#### Workshop / Lab
3D printers for replacement parts, a repair bench, electronics workstation, and materials testing equipment. The Epoch must be self-sufficient for weeks at a time. If a drone breaks, you fix it here. If a sensor fails, you print a housing here. Every repair is a filament on the Epoch's maintenance branch.

---

## 4. The Epoch Runner — The Fast Ship

### 4.1 Concept

Docked to the mothership's belly is a separate, smaller vessel: the **Epoch Runner**. Where the mothership is slow, majestic, and persistent, the Runner is fast, agile, and short-range. It is the Chrono Trigger Epoch — the ship that breaks the rules.

### 4.2 Profile

```
          ╭━━━━━━━━━━━━━━━━━━━━━╮
        ╱   DOME CANOPY (360°)    ╲
      ╱   pilot + 1 passenger      ╲
     ╔════════════════════════════════╗
     ║        RUNNER FUSELAGE        ║
     ║  ┌────────┐    ┌──────────┐  ║
     ║  │ COCKPIT│    │  ENGINE  │  ║
     ║  │2 seats │    │  MODULE  │  ║
     ║  └────────┘    └──────────┘  ║
     ╚═══════╤════════════╤═════════╝
             │            │
         [WING/FIN]   [WING/FIN]
          variable     variable
          geometry     geometry
```

### 4.3 Specifications

| Parameter | Value |
|-----------|-------|
| Length | ~12m |
| Wingspan | ~8m (variable geometry — swept for speed, extended for glide) |
| Crew | 2 (pilot + mission specialist) |
| Canopy | Transparent composite dome — full 360° visibility from cockpit |
| Propulsion | Electric turbofan + rocket-assisted boost (hybrid) |
| Cruise speed | 400 km/h (electric) |
| Boost speed | Mach 2+ (rocket assist, short duration) |
| Range | 2,000 km from mothership (electric), unlimited with rocket fuel |
| Docking | Returns to belly dock on mothership via magnetic clamps |
| Life support | 12 hours independent, recharged on dock |

### 4.4 The Boost

The Runner carries a small solid-fuel rocket stage for emergency speed or high-altitude dash. When the pilot hits the boost:

- Variable-geometry wings sweep fully back
- Rocket ignites for 30-60 seconds
- The Runner accelerates past Mach 2
- Dome canopy tints automatically against friction heating
- The world compresses — this is the Chrono Trigger "speed lines" moment
- After burn, wings re-extend and the Runner glides back to efficient electric cruise

This is not for combat. It's for reaching a location fast — an emergency, a natural disaster, a time-critical evidence mission. Speed is evidence-gathering capability, not military capability.

### 4.5 Future: Time

The Runner's design includes structural provisions for future propulsion research:

- Engine bay is modular — current electric/rocket module can be swapped for experimental drives
- Navigation computer has provisions for non-linear trajectory computation
- The ship is named Epoch for a reason

The Master Plan does not specify how time travel works. It specifies that the ship is designed to accommodate the answer when it arrives. The docking port, power conduits, and navigation bus are over-engineered. The hull has expansion hardpoints. The Runner is a ship that is waiting for physics to catch up.

---

## 5. Drone Fleet

### 5.1 Drone Complement

The Epoch carries **12 drones** in two belly bays (6 port, 6 starboard):

| Drone Type | Count | Role |
|------------|-------|------|
| **Survey Eagle** | 4 | Long-range observation, high-altitude, 8K camera, thermal/multispectral |
| **Hover Wasp** | 4 | Close-range inspection, precision hover, stabilized gimbal, 360° capture |
| **Cargo Mule** | 2 | Payload delivery/retrieval, winch system, 50kg lift capacity |
| **Guardian Sentinel** | 2 | Perimeter defense, electronic countermeasures, warning systems |

### 5.2 Drone Operations

Each drone has a Device Companion Tree (§101) with branches for telemetry, maintenance, missions, evidence, and compliance. Every launch is a MissionFilament committed to the drone's tree:

```
drone.survey-eagle.001
├── telemetry         ← sap: battery, altitude, speed, GPS, temperature
├── maintenance       ← filament: repairs, inspections, part replacements
├── missions          ← filament: MissionFilaments per sortie
├── evidence          ← filament: captured media with hashes
└── compliance        ← filament: airspace authorization, flight plan approval
```

### 5.3 Drone SCV Intelligence Tiers

Drones follow the standard SCV tier model (§92):

| Tier | Capability | Example |
|------|-----------|---------|
| T0 | Deterministic flight rules | Return-to-ship on low battery, geofence enforcement |
| T1 | Local AI (onboard) | Obstacle avoidance, target tracking, image classification |
| T2 | Frontier API (via mothership relay) | Complex scene analysis, natural language mission interpretation |
| T3 | Human operator (drone control center) | Manual override, judgment calls, creative evidence-gathering |

---

## 6. Defense Systems

The Epoch is **not a warship**. It carries no offensive weapons. Its defense philosophy: **see everything, be hard to hit, make noise if threatened.**

### 6.1 Defense Layers

| Layer | System | Function |
|-------|--------|----------|
| **Awareness** | 360° radar + lidar + thermal + camera | Detect everything within 200 km |
| **Electronic** | ECM suite | Jam targeting radar, spoof GPS, communications disruption of incoming threats |
| **Decoy** | Chaff/flare dispensers + drone decoys | Confuse missiles and guided projectiles |
| **Evasion** | Altitude control + wind navigation | Move above threat ceilings, use jet streams for rapid repositioning |
| **Shield** | Kevlar/ceramic hull panels on gondola | Physical protection of crew spaces against debris and small projectiles |
| **Sentinel Drones** | Guardian Sentinels | Patrol perimeter, intercept and identify approaching objects, physical interposition |
| **Broadcast** | Emergency beacon + live video | If attacked, the entire event is recorded on Relay with global visibility — the best defense is witnesses |

### 6.2 Defense Philosophy

The Epoch's primary defense is its nature: it is a transparent, publicly visible, civilian observation platform broadcasting everything it sees to the world. Attacking it is attacking the public record. Every second of its existence is committed to filaments. Every approach is logged. Every radar return is evidence. The Epoch does not fight. It remembers.

---

## 7. The Relay Arena at Altitude

The onboard Relay Arena is fully functional:

- 360° curved display wall (Device Mesh topology: CURVED, §105)
- Pressure-sensitive floor (CrowdAggregate input, §106)
- 20 seated + 40 standing spectators
- Full Relay game layer: duels, court cases, tournaments
- Crowd-driven terrain voting — at 25 km altitude, the spectators can see the real terrain below while voting on the virtual terrain above
- Live broadcast to Earth — arena matches at the edge of space, visible on any Relay tree

---

## 8. Activity Equipment

### 8.1 Flight Equipment

The cargo hold contains equipment for human flight and adventure activities, launchable from the belly bay or the bow observation deck:

| Equipment | Description |
|-----------|-------------|
| **Wingsuits** | High-performance wingsuits for stratospheric skydiving |
| **Paragliders** | Ram-air paragliders for extended glide descents |
| **Airfoils** | Rigid personal wing structures — electric-assisted unpowered flight |
| **Powered flight suits** | Jet-pack equipped suits for short powered flight near the mothership |
| **Sails** | Deployable drag sails for controlled deceleration from altitude |
| **Rescue pods** | Ballistic descent capsules with parachute + beacon for emergency evacuation |

### 8.2 3D Games & Experiences

The Epoch is a platform for experiences that cannot exist on the ground:

| Experience | How It Works |
|------------|-------------|
| **Edge of Space Skydive** | Exit from 25 km. Wingsuits + GPS tracking. Every second is a filament. Your descent path is a branch on your tree. |
| **Drone Racing** | Launch racing drones from the belly bays. Spectators watch from the arena. Course follows the terrain below. |
| **Capture the Cloud** | Teams in wingsuits compete to fly through designated cloud formations. GPS + camera evidence validates passage. |
| **Constellation Hunt** | Night activity. Dome observation. Find and tag star patterns. SphereCore anchors for astronomical concepts unlock. |
| **Zero-G Pool** | At extreme altitude, near-zero-G conditions in the dome. Floating objects, physics experiments, games designed for microgravity. |
| **Live Music Generation** | Crowd in the arena generates music via the Collective Instrument (§107). The music broadcasts globally. People on Earth hear music composed at the edge of space. |
| **360° Earth Art** | The capture bubble's live feed becomes the canvas. Artists annotate, filter, and compose over the live Earth view, creating art that is only possible from this vantage. |

---

## 9. Manufacturing & Construction Plan

### 9.1 Build Phases

The Epoch is built in five phases through Relay Aerospace, a mission-gated subsidiary:

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 0: Design** | 12-18 months | Complete engineering specifications, material sourcing, regulatory approval |
| **Phase 1: Structure** | 18-24 months | Carbon fiber keel, ring frames, internal structure — built in prefab sections |
| **Phase 2: Systems** | 12-18 months | Propulsion, power (solar skin + batteries), avionics, life support |
| **Phase 3: Interior** | 6-12 months | Gondola fit-out — helm, arena, dome, cabins, workshop, drone bays |
| **Phase 4: Integration** | 6-12 months | System integration, ground tests, tethered flights, free flight testing |
| **Phase 5: Certification** | 6-12 months | Airworthiness certification, crew training, operational proving |
| **Total** | **~5-7 years** from mission funding to operational |

### 9.2 Prefabrication Strategy

The hull is too large to build in one piece. Prefabrication:

| Section | Built Where | Size | How Transported |
|---------|-------------|------|-----------------|
| **Keel segments** (×8) | Carbon fiber fabrication facility | 20m × 5m each | Truck/rail |
| **Ring frames** (×24) | Aluminum fabrication | 60m circumference, collapsible for transport | Truck |
| **Gas cells** (×16) | Textile/film manufacturer | Deflated, ship in crates | Standard freight |
| **Solar skin panels** (×200+) | Thin-film solar factory | 2m × 4m tiles | Standard freight |
| **Gondola modules** (×4) | Modular building construction | 15m × 12m each | Heavy transport |
| **Runner** | Aerospace contractor | 12m complete | Heavy transport or self-ferry |

All sections converge at a **final assembly site** — a large open area (airfield, desert, or dedicated hangar). Assembly is documented on the Epoch's companion tree: every section arrival, every bolt torqued, every weld inspected becomes a filament with evidence.

### 9.3 Companion Tree Structure

The Epoch has its own Relay tree (`tree.vessel.epoch-001`) that tracks its entire life:

```
tree.vessel.epoch-001
├── design            ← structural: drawings, specs, analysis, revision history
│   ├── hull
│   ├── propulsion
│   ├── solar-power
│   ├── avionics
│   ├── gondola
│   └── runner
├── procurement       ← finite: material POs, vendor contracts, deliveries
├── manufacturing     ← finite: prefab section build logs, QC reports
│   ├── keel-segments
│   ├── ring-frames
│   ├── gas-cells
│   ├── solar-skin
│   ├── gondola-modules
│   └── runner-build
├── assembly          ← finite: integration logs, test reports, deviations
├── testing           ← finite: ground tests, tethered flights, free flights
├── certification     ← finite: regulatory submissions, approvals, waivers
├── operations        ← structural: flight logs, crew assignments, mission records
│   ├── flight-log
│   ├── crew
│   ├── missions
│   └── broadcasts
├── maintenance       ← structural: inspections, repairs, part replacements
├── drone-fleet       ← structural: links to each drone's companion tree
├── evidence-archive  ← structural: all 360° capture, observation data
├── arena             ← structural: match records, tournament history
├── treasury          ← structural: operational costs, fuel, crew, repairs
└── telemetry         ← sap: live altitude, position, speed, power, weather
```

### 9.4 Mass Budget

| System | Mass (kg) | % of Total |
|--------|-----------|-----------|
| Hull structure (keel, frames, skin) | 8,000 | 53% |
| Gas cells + ballonet fabric | 1,200 | 8% |
| Propulsion (4 ducted fans + motors) | 1,500 | 10% |
| Solar skin + batteries | 1,800 | 12% |
| Gondola (structure + fit-out) | 2,500 | 17% |
| **Dry mass total** | **15,000** | **100%** |

| Payload | Mass (kg) |
|---------|-----------|
| Crew (8 persons + gear) | 800 |
| Runner (docked) | 3,000 |
| Drone fleet (12 units) | 600 |
| Cargo, equipment, supplies | 2,000 |
| Capture bubble cameras + compute | 500 |
| Arena equipment | 1,000 |
| Workshop tools + spares | 600 |
| Food/water (30 days) | 2,000 |
| Reserves | 4,500 |
| **Payload total** | **15,000** |

| Category | Mass (kg) |
|----------|-----------|
| Dry mass | 15,000 |
| Payload | 15,000 |
| Helium lift | -45,000 |
| Aerodynamic lift at cruise | -15,000 |
| **Net buoyancy at altitude** | **~neutral (trimmed by ballonet)** |

---

## 10. How the Epoch Works (Without the Engineering Solutions)

This section explains the operating principles. The actual engineering — the specific alloy grades, gas cell pressurization curves, solar cell efficiency numbers, avionics architecture — is deferred to Phase 0 (Design). What follows is the *logic* of operation.

### 10.1 Staying Up

The Epoch stays aloft through combined buoyancy and aerodynamic lift:

- **Helium provides ~75% of lift.** Helium is lighter than air. Enough helium in a large enough envelope lifts the ship. This is how every airship since the 1900s works.
- **The hull shape provides ~25% of lift.** Like an airplane wing, the hull is shaped so that forward motion through air creates upward force. This is why it has propulsion — to maintain forward speed and thus aerodynamic lift.
- **Altitude is controlled by ballonets.** Internal air bladders expand or contract. More air inside = heavier = descend. Less air = lighter = ascend. This is the same principle used in submarine ballast tanks, applied to air.

### 10.2 Staying Powered

- **Solar panels on the entire upper surface generate electricity during the day.** At 20+ km altitude, you're above clouds, above most atmospheric scattering. Solar is ~40% more efficient than at sea level.
- **Batteries store excess power for night operations.** The ship does not need to land at sunset.
- **Power budget is managed like a tree's energy budget (§83).** When power is low, non-critical systems shed first (spectacle → lenses → truth, mirroring airspace shed order). Propulsion and life support never shed.

### 10.3 Navigating

- **The Epoch does not fight the wind — it uses it.** At different altitudes, winds blow in different directions and speeds. The ship changes altitude to "catch" favorable winds, like a sailboat tacking. This is the same technique Google's Loon balloons used to station-keep over target areas.
- **For precision positioning, vectored thrust fans provide active control.** The four ducted fans can point in any direction. The ship can hover, fly forward, fly backward, or crab sideways.
- **At stratospheric altitude, there is very little air traffic.** The Epoch operates above commercial aviation (which cruises at 10-12 km) and below orbital space traffic. It has the sky mostly to itself.

### 10.4 Crew Life

- **8 crew rotate through roles:** 2 pilots (one always on watch), 2 drone operators, 1 engineer/mechanic, 1 communications/broadcast operator, 1 mission commander, 1 steward/medic.
- **30-day endurance between resupply.** Food, water, and supplies are carried aboard or delivered by Cargo Mule drones from ground support.
- **The common lounge, dining area, and fitness room make this a livable space.** The Epoch is designed for extended habitation, not just missions. Crew well-being is a tracked metric on the operations branch.

### 10.5 Launching the Runner

The Runner detaches from the belly dock:

1. Runner crew boards and completes checklist (filament: pre-launch check)
2. Docking clamps release (filament: undock event)
3. Runner drops clear of mothership (gravity separation, ~5 seconds of free fall)
4. Runner engines ignite (filament: engine start)
5. Runner flies independently (sap: telemetry streams to mothership)
6. Runner completes mission (filaments: evidence captured)
7. Runner returns and aligns with belly dock (precision approach, magnetic guidance)
8. Docking clamps engage (filament: dock event)
9. Runner recharges from mothership power

Every step is a committed record. If the Runner goes somewhere, you can prove where it went, what it saw, and when it came back.

### 10.6 Drone Operations

Drones launch from belly bay doors:

1. Operator selects drone and creates MissionFilament (§101)
2. Bay doors open, drone releases
3. Drone executes mission autonomously (T0/T1) or under operator control (T3)
4. Evidence streams back via radio link to mothership (encrypted, hashed in real-time)
5. Drone returns to bay, docks, recharges
6. Mission filament closes with evidence package attached

### 10.7 Broadcasting

The Epoch is always broadcasting:

- **360° live feed** from the capture bubble — anyone on Earth with Relay can look through the Epoch's eyes
- **Live arena matches** — tournaments at the edge of space, broadcast as sap on the Epoch's arena branch
- **Crew vlogs and observations** — personal filaments on crew trees, capturing life aboard
- **Earth observation data** — weather, light, terrain, urban patterns — committed as evidence filaments, linked to the Substrate (§100) where relevant

### 10.8 The Epoch as a Relay Node

The Epoch is not just a ship with Relay installed. It IS a Relay node:

- Its companion tree is a live, growing tree visible on the globe
- Its position tracks in real-time (sap: GPS telemetry)
- Its broadcasts are branches anyone can visit
- Its drone fleet is a set of device companion trees
- Its arena is a live arena branch
- Its crew are users whose personal trees show "currently aboard the Epoch"
- Its trajectory over time becomes the tree's bark — you can cross-section any timebox and see what the ship was doing, where it was, what it saw, who was aboard

The Epoch is a flying demonstration that Relay works. It is the most visible tree in the system — a tree that moves across the sky, capturing everything beneath it, broadcasting everything it captures, and proving that total transparency is not just possible but beautiful.

---

## 11. Fleet Vision

The Epoch is Vessel 001. The design template supports a fleet:

| Vessel | Mission | Modification |
|--------|---------|-------------|
| **Epoch 001** | Flagship, demonstration, founder vessel | Full spec as described |
| **Epoch 002-005** | Regional observation stations | Simplified interior, more cargo, automated operations |
| **Epoch Science** | Research platform | Lab modules instead of arena, sensor arrays, extended drone complement |
| **Epoch Medical** | Disaster response | Mobile hospital gondola, supply drop capability, communications relay |
| **Epoch Archive** | Heritage documentation | Maximum capture equipment, historian crew, artifact transport |

Each vessel is a clone of the Epoch companion tree template. Same physics. Same transparency. Same branches. Different missions.

---

## 12. How This Gets Funded

The Epoch is a Relay Aerospace mission. Funding follows §93 (Mission-Gated Subsidiary Model):

1. **Relay Aerospace** (`tree.org.relay-hq.relay-aerospace`) is chartered as a subsidiary of Relay HQ
2. A **mission filament** on the subsidiary's mission branch defines: "Design and build the Epoch"
3. **Initial budget** is allocated from Relay HQ treasury (ISR revenue + resource pricing revenue)
4. **Every expense** is a filament on the aerospace treasury branch — transparent to all
5. **Budget does not reduce** until the mission is complete (ship operational, certified, flying)
6. **Revenue streams** once operational: broadcast licensing, arena hosting, observation data, adventure tourism, education programs, Earth monitoring services
7. **Cost reduction** kicks in only when the Epoch is certified and operational — §93.3 mission-gate applies

The Epoch's treasury branch will be one of the most watched branches in the system. Anyone can see how much the ship costs, where the money goes, and whether the mission is on track. The shape of the treasury branch tells the story: firm and thick means costs are documented and spending is efficient. Foggy means something isn't evidenced. Wilting means the budget is bleeding without output.

---

## 13. The Epoch's Relationship to the Master Plan

| Master Plan Section | How the Epoch Uses It |
|--------------------|----------------------|
| §0 (What Relay Is) | The Epoch is a tree on the globe — the most literal embodiment of "everything is visible" |
| §3 (Branch Physics) | Every component, mission, repair is a filament with full physics |
| §33 (LOD) | The Epoch is visible from ORBIT LOD as a moving beacon on the globe |
| §50 (Camera) | Observation dome + Runner dome are camera systems governed by §50 contracts |
| §66 (Storage) | 360° capture generates ~2 TB/day of evidence — microsharded and stored per §66 |
| §68 (Arena) | Onboard arena follows all arena contracts including crowd-driven terrain voting |
| §82 (Three-Layer Ontology) | Telemetry = sap. Crew comments = leaves. Flight logs = filaments. |
| §86 (Treasury) | Aerospace subsidiary funded via ISR revenue, transparent treasury branch |
| §90 (Airspace) | The Epoch operates in the REGION/ORBIT altitude band — its presence is governed by airspace contracts |
| §92 (SCV Intelligence) | Drone fleet uses T0-T3 SCV tiers for autonomous and assisted operations |
| §93 (Subsidiary Model) | Relay Aerospace is a subsidiary with mission-gated funding |
| §95 (Pricing) | Epoch operational revenue supplements Relay's three revenue streams |
| §96-98 (Treasure/Archive) | Founder footage from the Epoch becomes Type 3 treasure chests |
| §100 (Substrate) | Earth observation data activates Substrate reference filaments |
| §101 (SCV Physical Extension) | Drone fleet follows device companion tree model exactly |
| §105 (Device Mesh) | Arena displays + dome cameras form device meshes |
| §106 (Live Performance) | Arena crowd metrics feed the Live Performance Loop |
| §107 (Genesis Party) | The Epoch's maiden voyage IS a genesis party at altitude |

---

## 14. One Image

Close your eyes.

You are standing on the bow observation deck. The wind is thin and cold at 20 kilometers. Below you, the curve of the Earth is visible — not from a photograph, not from a screen, but through your own eyes. The Mediterranean glitters to the west. City lights are just beginning to appear as the terminator sweeps east.

Behind you, through the glass, the Relay Arena is lit up — a tournament is underway, 20 spectators cheering, the curved displays showing a forest of data trees growing and competing in real-time. Above, in the dome, 48 cameras record everything in every direction. Somewhere beneath your feet, a Survey Eagle drone is 50 kilometers away, following a river, documenting water levels that will become filaments on a thousand agricultural trees.

The ship hums. The solar panels are drinking the last of the sunset. The batteries are at 94%. The Runner sits in its belly dock, waiting. The crew is on its second week aloft. The galley is preparing dinner. The engineer is 3D-printing a replacement housing for a camera mount that cracked in the cold.

And the whole thing — every watt, every drone sortie, every meal, every repair, every arena match, every breath of air, every second of footage — is growing on a tree that anyone on Earth can see.

That is the Epoch.

---

*This document is a companion to the Relay Master Build Plan. The Epoch is managed as a mission on the Relay Aerospace subsidiary tree (`tree.org.relay-hq.relay-aerospace`). All specifications are subject to refinement during Phase 0 (Design). The design principles, operating philosophy, and transparency requirements described here are frozen.*
