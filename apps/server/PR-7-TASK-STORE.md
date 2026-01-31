# PR #7: Task Store - Build Queue (Shopping as Production)

**Date:** 2026-01-28  
**Status:** READY TO IMPLEMENT  
**Reference:** `architecture@c9` (Personal HUD + Physical Globe), `architecture@c10` (Ontological Foundation)

---

## GOAL

Implement **task store** to enable shopping-as-production: clicking a building, selecting products, and adding them to a build queue that shows progression through production/packing/dispatch/transit/delivery.

**Key principle:** Shopping is not checkout. Shopping is **unit production** (StarCraft model).

---

## THE STARCRAFT MODEL

### How StarCraft Works

**Player clicks Barracks:**
1. Building panel opens (shows available units)
2. Player clicks "Marine" (adds to production queue)
3. Marine enters build queue at bottom of screen
4. Progress bar shows production time
5. When complete, Marine spawns and is ready

**No "cart."** No "checkout." Just: select unit → add to queue → watch it build → use it.

---

### How Relay Works (Same Model)

**User clicks Apple Store on globe:**
1. Building panel opens (shows catalog - iPhones, MacBooks)
2. User clicks "iPhone 15 Pro" (adds to build queue)
3. Task enters build queue bar at bottom of HUD
4. Progress bar shows production + delivery time
5. When complete, shipment spawns as drone flying to user
6. User receives product (task complete)

**No "cart."** No "checkout." Just: select product → add to queue → watch it pack/ship/deliver → receive it.

---

## NEW TRUTH ENTITIES

### Task

**Definition:** A task is a unit production order. It represents work being done (packing, shipping, delivering).

**Fields:**
```rust
pub struct Task {
    pub task_id: TaskId,                      // "task.apple_iphone_001"
    pub task_type: TaskType,                  // production | shipment | verification | etc.
    pub building_ref: BuildingId,             // Where task originates
    pub requester_ref: UnitId,                // Who requested (for personal HUD)
    pub product_ref: Option<String>,          // What's being produced (if vendor task)
    pub state: TaskState,                     // queued | packing | dispatched | in_transit | delivered | failed
    pub progress: TaskProgress,               // Time-based or step-based
    pub estimated_completion: u64,            // Timestamp (seconds since epoch)
    pub priority: TaskPriority,               // normal | urgent | background
    pub failure_count: u32,                   // Number of failures (failure budget tracking)
    pub props: serde_json::Map<String, JsonValue>, // Free-form metadata
}

pub struct TaskId(String);

pub enum TaskType {
    Production,   // Vendor building produces product
    Shipment,     // Logistics building ships product
    Verification, // Civic building verifies claim
    Commitment,   // Partnership building fulfills commitment
}

pub enum TaskState {
    Queued,       // In build queue, not started
    Packing,      // Vendor is preparing product
    Dispatched,   // Package handed off to logistics
    InTransit,    // Drone is flying
    Delivered,    // Arrived at destination
    Failed,       // Task failed (scar recorded)
}

pub struct TaskProgress {
    pub started_at: Option<u64>,   // Timestamp when work began
    pub elapsed_seconds: u64,      // How long task has been active
    pub total_seconds: u64,        // Estimated total time
    pub percentage: f32,           // 0.0 to 1.0
}

pub enum TaskPriority {
    Background,   // Low priority (can wait)
    Normal,       // Default
    Urgent,       // High priority (attention alert)
}
```

---

## NEW EVENTS (APPEND-ONLY)

### 1. TASK_CREATED

**When:** User adds item to build queue  
**Payload:**
```json
{
  "task_id": "task.apple_iphone_001",
  "task_type": "production",
  "building_ref": "building.apple_store.nyc_001",
  "requester_ref": "unit.alice.001",
  "product_ref": "iphone_15_pro",
  "state": "queued",
  "estimated_completion": 1706464800,
  "priority": "normal"
}
```

**Causality:** References building, requester, product (from catalog)

---

### 2. TASK_PROGRESSED

**When:** Task moves to next state  
**Payload:**
```json
{
  "task_id": "task.apple_iphone_001",
  "from_state": "queued",
  "to_state": "packing",
  "progress": {
    "started_at": 1706461200,
    "elapsed_seconds": 1800,
    "total_seconds": 3600,
    "percentage": 0.5
  }
}
```

**Causality:** References previous TASK_CREATED or TASK_PROGRESSED

---

### 3. TASK_COMPLETED

**When:** Task reaches "delivered" state  
**Payload:**
```json
{
  "task_id": "task.apple_iphone_001",
  "final_state": "delivered",
  "completion_time": 1706464800,
  "total_elapsed_seconds": 7200
}
```

**Causality:** References TASK_CREATED

---

### 4. TASK_FAILED

**When:** Task fails (vendor out of stock, shipment delayed, etc.)  
**Payload:**
```json
{
  "task_id": "task.apple_iphone_001",
  "failure_reason": "VENDOR_OUT_OF_STOCK",
  "failure_count": 1,
  "retry_available": true,
  "scar_recorded": true
}
```

**Causality:** References TASK_CREATED

---

## API ENDPOINTS

### Truth Endpoints

#### GET /api/relay-physics/tasks

**Purpose:** List all tasks (or filtered by requester)

**Query params:**
- `requester_ref` (optional) - Filter by requester (for personal HUD)
- `building_ref` (optional) - Filter by building
- `state` (optional) - Filter by state (queued, in_transit, etc.)

**Response:**
```json
[
  {
    "task_id": "task.apple_iphone_001",
    "task_type": "production",
    "building_ref": "building.apple_store.nyc_001",
    "requester_ref": "unit.alice.001",
    "product_ref": "iphone_15_pro",
    "state": "packing",
    "progress": {
      "percentage": 0.65,
      "elapsed_seconds": 2340,
      "total_seconds": 3600
    },
    "estimated_completion": 1706464800,
    "priority": "normal"
  }
]
```

**Cache:** `Cache-Control: private, max-age=5` (frequently updated)

---

#### POST /api/relay-physics/tasks

**Purpose:** Create new task (add to build queue)

**Request:**
```json
{
  "task_type": "production",
  "building_ref": "building.apple_store.nyc_001",
  "requester_ref": "unit.alice.001",
  "product_ref": "iphone_15_pro",
  "priority": "normal"
}
```

**Response:**
```json
{
  "result": "TaskCreated",
  "event_id": 123,
  "task": {
    "task_id": "task.apple_iphone_001",
    "state": "queued",
    "estimated_completion": 1706464800
  }
}
```

**Error cases:**
- Building not found → `400 BUILDING_NOT_FOUND`
- Product not in catalog → `400 PRODUCT_NOT_FOUND`
- Requester lacks authority → `403 AUTHORITY_DENIED`

---

#### PATCH /api/relay-physics/tasks/:id/progress

**Purpose:** Update task progress (called by system or building owner)

**Request:**
```json
{
  "to_state": "packing",
  "progress_percentage": 0.5
}
```

**Response:**
```json
{
  "result": "TaskProgressed",
  "event_id": 124,
  "task": {
    "task_id": "task.apple_iphone_001",
    "state": "packing",
    "progress": {
      "percentage": 0.5,
      "elapsed_seconds": 1800,
      "total_seconds": 3600
    }
  }
}
```

---

### Render Endpoint

#### GET /api/relay-physics/render/world (UPDATED)

**Purpose:** Now includes task nodes for build queue visualization

**Response (new nodes):**
```json
{
  "nodes": [
    {
      "id": "task.apple_iphone_001",
      "kind": "task",
      "transform": {
        "position": [0, 0, 0],
        "scale": [1, 1, 1]
      },
      "material": "task_packing",
      "props": {
        "task_id": "task.apple_iphone_001",
        "task_type": "production",
        "building_ref": "building.apple_store.nyc_001",
        "requester_ref": "unit.alice.001",
        "product_ref": "iphone_15_pro",
        "state": "packing",
        "progress_percentage": 0.65,
        "estimated_completion": 1706464800,
        "priority": "normal"
      }
    }
  ]
}
```

**Task node properties:**
- `kind`: `"task"` (new node kind)
- `transform`: Minimal (tasks don't have physical position until shipped)
- `material`: Based on state (`task_queued`, `task_packing`, `task_in_transit`, `task_delivered`, `task_failed`)
- `props`: Full task data for UI rendering

---

## DETERMINISM RULES

### Task ID Generation

**Rule:** Task IDs are deterministic from (building_ref + requester_ref + timestamp + product_ref)

**Implementation:**
```rust
fn generate_task_id(
    building_ref: &BuildingId,
    requester_ref: &UnitId,
    product_ref: &str,
    timestamp: u64,
) -> TaskId {
    let combined = format!(
        "{}:{}:{}:{}",
        building_ref.as_str(),
        requester_ref.as_str(),
        product_ref,
        timestamp
    );
    
    let hash = sha256(&combined);
    TaskId(format!("task.{}", &hash[0..16]))
}
```

**Key property:** Same inputs → Same task ID (deterministic)

---

### Progress Calculation

**Rule:** Progress is deterministic from (start time + elapsed time + total time)

**Implementation:**
```rust
fn calculate_progress(
    started_at: u64,
    current_time: u64,
    total_seconds: u64,
) -> TaskProgress {
    let elapsed = current_time.saturating_sub(started_at);
    let percentage = (elapsed as f32 / total_seconds as f32).min(1.0);
    
    TaskProgress {
        started_at: Some(started_at),
        elapsed_seconds: elapsed,
        total_seconds,
        percentage,
    }
}
```

**Key property:** Same times → Same progress (deterministic)

---

### Task State Transitions

**Rule:** State transitions are explicit (no auto-transitions without events)

**Valid transitions:**
```
queued → packing → dispatched → in_transit → delivered
       ↘ failed (from any state)
```

**Invalid:**
```
queued → in_transit (must go through packing, dispatched)
delivered → queued (no rewind)
```

---

## LINK TO BUILDINGS

### Building as Production Source

**Rule:** Every task references a building (production source)

**Implementation:**
```rust
pub struct Task {
    pub building_ref: BuildingId,  // Required - where task originates
    ...
}
```

**When task created:**
1. Verify building exists
2. Verify building has product in catalog (if production task)
3. Verify building is active (not disabled)

**When task progresses:**
1. Building owner can update task state
2. System can auto-update based on time

---

### Building Catalog Integration

**Rule:** Production tasks must reference valid catalog items

**Implementation:**
```rust
fn validate_production_task(
    building: &Building,
    product_ref: &str,
) -> Result<(), Error> {
    // Check catalog
    let catalog_item = building.catalog.iter()
        .find(|item| item.product_id == product_ref)
        .ok_or(Error::ProductNotFound)?;
    
    // Check stock
    if !catalog_item.in_stock {
        return Err(Error::ProductOutOfStock);
    }
    
    Ok(())
}
```

**Key property:** Only valid products can be produced

---

## FAILURE BUDGET TRACKING

**Note:** architecture@c10 identified "failure as first-class state" as a missing layer.

**PR #7 implementation:** Basic failure recording only.

**What PR #7 includes:**
- `failure_count` field in Task
- `TASK_FAILED` event
- Failure reason enum

**What PR #7 does NOT include (defer to PR #9):**
- Failure budgets per building
- Risk zones on globe
- Experimental area marking
- Failure cost/scar visualization

**Reason:** Prove spatial layer (buildings + tasks + shipments) first, then add failure governance.

---

## ATTENTION PRIORITY

**Note:** architecture@c10 identified "attention economics" as a missing layer.

**PR #7 implementation:** Basic priority field only.

**What PR #7 includes:**
- `priority` field (normal | urgent | background)
- Priority stored in task
- Priority in RenderSpec props

**What PR #7 does NOT include (defer to PR #10):**
- Alert routing based on priority
- Attention escalation rules
- Automatic batching
- Interrupt logic

**Reason:** Prove spatial layer first, then add attention governance.

---

## FILE STRUCTURE

### New Files

```
apps/server/src/relay_physics/
├── task_store.rs               (NEW - Task storage + operations)
└── types.rs                    (UPDATED - Add Task types)

relay/fixtures/
└── tasks_seed.json             (NEW - Demo tasks - optional)
```

### Updated Files

```
apps/server/src/relay_physics/
├── mod.rs                      (UPDATED - Add task module)
├── events.rs                   (UPDATED - Add task events)
├── renderspec_generator.rs     (UPDATED - Add task nodes)
└── main_integration.rs         (UPDATED - Add task endpoints)
```

---

## TESTING

### Unit Tests

#### Test 1: Create Task
```rust
#[test]
fn test_create_task() {
    let mut task_store = TaskStore::new();
    let building_store = BuildingStore::new();
    
    // Create task
    let task = Task {
        task_id: TaskId::new("task.test.001"),
        task_type: TaskType::Production,
        building_ref: BuildingId::new("building.test.001"),
        requester_ref: UnitId::new("unit.alice.001"),
        product_ref: Some("test_product".to_string()),
        state: TaskState::Queued,
        progress: TaskProgress::default(),
        estimated_completion: 1706464800,
        priority: TaskPriority::Normal,
        failure_count: 0,
        props: serde_json::Map::new(),
    };
    
    task_store.create(task).unwrap();
    
    assert_eq!(task_store.list_all().len(), 1);
}
```

---

#### Test 2: Progress Task
```rust
#[test]
fn test_progress_task() {
    let mut task_store = TaskStore::new();
    
    // Create and progress
    let task_id = TaskId::new("task.test.001");
    task_store.create(/* ... */).unwrap();
    
    task_store.progress(
        &task_id,
        TaskState::Packing,
        0.5
    ).unwrap();
    
    let task = task_store.get(&task_id).unwrap();
    assert_eq!(task.state, TaskState::Packing);
    assert_eq!(task.progress.percentage, 0.5);
}
```

---

#### Test 3: Replay Tasks
```rust
#[test]
fn test_replay_tasks() {
    // Create tasks
    let mut task_store1 = TaskStore::new();
    task_store1.create(/* ... */).unwrap();
    
    // Replay from events
    let mut task_store2 = TaskStore::new();
    let events = event_log.load_all().unwrap();
    task_store2.replay_from_events(&events);
    
    assert_eq!(task_store1.list_all().len(), task_store2.list_all().len());
}
```

---

### Manual Tests

#### Test 1: Create Task via API
```bash
curl -X POST http://localhost:3002/api/relay-physics/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "production",
    "building_ref": "building.apple_store.nyc_001",
    "requester_ref": "unit.alice.001",
    "product_ref": "iphone_15_pro",
    "priority": "normal"
  }'
```

**Expected:** `TaskCreated` event + task in list

---

#### Test 2: List Tasks
```bash
curl http://localhost:3002/api/relay-physics/tasks?requester_ref=unit.alice.001 | jq .
```

**Expected:** Array of tasks for Alice

---

#### Test 3: Progress Task
```bash
curl -X PATCH http://localhost:3002/api/relay-physics/tasks/task.apple_iphone_001/progress \
  -H "Content-Type: application/json" \
  -d '{
    "to_state": "packing",
    "progress_percentage": 0.5
  }'
```

**Expected:** `TaskProgressed` event

---

#### Test 4: Render World with Tasks
```bash
curl http://localhost:3002/api/relay-physics/render/world | jq '.nodes[] | select(.kind=="task")'
```

**Expected:** Task nodes with progress data

---

## IMPLEMENTATION CHECKLIST

### Step 1: Types
- [ ] Add `Task`, `TaskId`, `TaskType`, `TaskState`, `TaskProgress`, `TaskPriority` to `types.rs`

### Step 2: Events
- [ ] Add `TASK_CREATED`, `TASK_PROGRESSED`, `TASK_COMPLETED`, `TASK_FAILED` to `events.rs`

### Step 3: Task Store
- [ ] Create `task_store.rs`
- [ ] Implement `create()`, `progress()`, `complete()`, `fail()`, `get()`, `list_all()`, `list_by_requester()`
- [ ] Implement `replay_from_events()`

### Step 4: RenderSpec Generator
- [ ] Update `renderspec_generator.rs`
- [ ] Add `create_task_node()`
- [ ] Update `generate_world_scene()` to include tasks

### Step 5: API Endpoints
- [ ] Add `GET /tasks` handler
- [ ] Add `POST /tasks` handler
- [ ] Add `PATCH /tasks/:id/progress` handler
- [ ] Update `relay_router()` in `main_integration.rs`

### Step 6: Init Integration
- [ ] Update `init_relay_physics_state()` to include task store
- [ ] Add `task_store` to `AppState`

### Step 7: Tests
- [ ] Write 3 unit tests
- [ ] Run 4 manual tests

---

## SUCCESS CRITERIA

✅ Tasks can be created via API  
✅ Tasks link to buildings (building_ref)  
✅ Tasks link to requesters (requester_ref for personal HUD)  
✅ Task progress can be updated  
✅ Tasks reach completion (delivered state)  
✅ Tasks can fail (with failure count)  
✅ `/render/world` includes task nodes  
✅ Task state transitions are valid  
✅ Replay reconstructs same tasks (deterministic)  
✅ Tests pass (unit + manual)

---

## NEXT STEPS (AFTER PR #7)

### PR #8: Shipment Store
- Shipments represent drones in flight
- `SHIPMENT_CREATE`, `SHIPMENT_UPDATE_POSITION`, `SHIPMENT_ARRIVE` events
- Route interpolation (position calculation)
- Animation intents for drone movement

**Link to PR #7:** When task reaches "dispatched" state, create shipment.

---

## VISUAL CONCEPT (FOR FRONTEND)

### Build Queue Bar (Bottom of HUD)

```
┌─────────────────────────────────────────────────────────┐
│ BUILD QUEUE (3 tasks)                                   │
├─────────────────────────────────────────────────────────┤
│ [████████░░] iPhone 15 Pro      Packing (65%)   2min    │
│ [███░░░░░░░] MacBook Air        Queued          --      │
│ [████████░░] AirPods Pro        Dispatched      30sec   │
└─────────────────────────────────────────────────────────┘
```

**Elements:**
- Progress bar (visual percentage)
- Product name
- State (queued, packing, dispatched, etc.)
- Time remaining (estimated)
- Click to expand details

---

## STARCRAFT PARALLEL (FINAL CONFIRMATION)

| StarCraft | Relay | Purpose |
|-----------|-------|---------|
| Click Barracks | Click Apple Store | Select production building |
| Select Marine | Select iPhone 15 Pro | Choose unit to produce |
| Add to queue | Add to build queue | Commit to production |
| Progress bar | Progress bar | Show build time |
| Marine spawns | Shipment spawns | Unit becomes active |
| Marine ready | Product delivered | User receives item |

**No cart. No checkout. Just production.**

---

**Status:** READY TO IMPLEMENT  
**Reference:** `architecture@c9`, `architecture@c10`  
**Estimate:** 4-6 hours

---

**Bottom line:** Tasks are units in production. The build queue is the visible commitment. Shopping is StarCraft.

---

**END OF PR #7 SPEC**
