# Live Presence & Time Box Architecture

**Status**: Locked Architecture Supplement  
**Date**: 2026-01-31  
**Related**: c16 (Commit Materiality), c17 (Work Zones)  
**Type**: Core Architecture Extension

---

## Purpose

This document resolves the fundamental tension between **continuous presence** (live video, real-time collaboration, streaming activity) and **discrete history** (commits, canonical events).

**The core question**:
> "If I go live in Relay, does that mean commits every millisecond? Is live broadcast a commit stream?"

**The answer**:
> "No. Live presence exists inside time boxes. Commits occur only at material boundaries. Filaments are chains of time boxes, not streams of frames."

---

## The Problem (Why This Matters)

### **If Live = Commit Stream (WRONG)**

```
Going live for 1 hour at 30fps = 108,000 commits
├─ History becomes noise
├─ Replay becomes useless
├─ Cognition collapses
├─ Storage explodes
└─ System lies (everything equally meaningful)
```

**This breaks Relay's physics.**

### **The Correct Model (LOCKED)**

```
Going live for 1 hour = 1 time box + material events
├─ Start commit: "Live session began"
├─ Time box: [continuous activity inside]
├─ Material commits: 3-10 (decisions, pauses, scope changes)
└─ End commit: "Live session ended"
```

**Result**: ~5-12 commits, not 108,000.

---

## Core Principle (LOCKED)

### **The Fundamental Distinction**

**Live presence** = **state** (continuous, ephemeral, inside time box)  
**Commit** = **event** (discrete, permanent, at boundary)

**Relay never confuses the two.**

### **Canonical Statement**

> **"Continuity lives inside time boxes. History advances only at commit boundaries."**

---

## What Is a Time Box?

### **Definition (LOCKED)**

A **time box** is:
- A bounded interval of continuous presence
- With a defined start
- With an eventual end
- Containing ephemeral state during its lifetime
- Collapsing to summary + evidence when closed

### **Properties**

```javascript
timeBox = {
  id: "timebox.zone.acme.engineering.2026-01-31-14-30",
  type: "live_presence",
  
  // Temporal bounds
  startTime: "2026-01-31T14:30:00Z",
  endTime: "2026-01-31T16:30:00Z",  // or null if ongoing
  duration: 7200000,  // 2 hours (ms)
  
  // Spatial binding
  filament: "feature.payments.retry",
  commitHash: "abc123",  // Commit that started this time box
  
  // Content
  liveState: {
    videoStream: "stream.zone.acme.engineering.2026-01-31-14-30",
    audioStream: "stream.zone.acme.engineering.2026-01-31-14-30.audio",
    cursorTrack: "cursor.zone.acme.engineering.2026-01-31-14-30",
    edits: [/* continuous edit stream */],
    speech: [/* transcription segments */]
  },
  
  // Material events (discrete commits inside time box)
  materialEvents: [
    { time: "14:45:00", commit: "def456", description: "Paused to discuss approach" },
    { time: "15:10:00", commit: "ghi789", description: "Locked decision: use exponential backoff" },
    { time: "15:45:00", commit: "jkl012", description: "Scope change: added error handling" }
  ],
  
  // Evidence (what gets archived)
  evidence: {
    videoArchive: ".relay/archives/video/timebox-xyz.mp4",
    transcript: ".relay/archives/transcripts/timebox-xyz.txt",
    activityLog: ".relay/archives/activity/timebox-xyz.json",
    keyFrames: [/* representative frames */]
  },
  
  // Status
  status: "closed",  // open, paused, closed, archived
  participants: ["alice", "scv-123"]
};
```

### **Visual Model**

```
Filament (spine):
  ● ———[════════════]———— ● ———[════]———— ●
  ^     ^            ^     ^     ^    ^     ^
  |     |            |     |     |    |     |
  |     time box 1   |     |  time   |     commit
  |     (2 hours)    |     |  box 2  |     (discrete)
  |                  |     |  (30m)  |
  commit             commit commit   commit
  (start)            (end)  (start)  (end)

Inside time box 1:
  [████████████████████████████████████████]
   ^                                      ^
   │                                      │
   continuous activity:                  │
   - video frames (30fps)                │
   - cursor movement                     │
   - edits                               │
   - speech                              │
   │                                      │
   collapsed to summary + evidence when closed
```

---

## When Does a Commit Happen During Live Activity?

### **Materiality Thresholds for Live Sessions**

**Automatic commits** (system-generated):
1. **Start commit**: User begins live session
2. **End commit**: User ends live session
3. **Disconnect commit**: Session interrupted (network, crash)
4. **Resume commit**: Session resumed after interruption

**User-triggered commits** (explicit):
5. **HOLD/Pause**: User pauses live work
6. **Decision lock**: User makes architectural decision
7. **Scope change**: User changes ring/branch/authority
8. **Annotation**: User marks key moment
9. **Publish**: User exports clip or summary

**Pressure-triggered commits** (threshold crossed):
10. **ERI drop**: Confidence falls below floor
11. **Conflict detected**: Another user's work conflicts
12. **Time threshold**: Session exceeds max duration (4 hours default)

### **Example: 2-Hour Live Coding Session**

```
14:30:00  ● START COMMIT: "Alice begins live session: Implement retry logic"
          [═════════════════════════════════════════════════════════════
14:45:00    (continuous: typing, cursor, video, speech)
            ● MATERIAL: "Alice pauses to discuss error handling with Bob"
15:10:00    (continuous: resumed, more coding)
            ● MATERIAL: "Decision locked: Use exponential backoff"
15:45:00    (continuous: implementing decision)
            ● MATERIAL: "Scope expanded: Added timeout configuration"
16:20:00    (continuous: testing, debugging)
16:30:00  ═══════════════════════════════════════════════════════════]
          ● END COMMIT: "Alice ends session: Retry logic complete"
```

**Result**: 5 commits for 2 hours of work (not 216,000)

---

## Where Does Your Image/Video Live?

### **During Live Session (Ephemeral)**

**Your video stream** is:
```javascript
liveStream = {
  id: "stream.zone.acme.engineering.2026-01-31-14-30",
  type: "live_video",
  protocol: "webrtc",
  
  // Not commits, not history
  frames: [/* 30 fps stream */],
  audio: [/* audio track */],
  
  // Addressable during session
  url: "relay://live/zone.acme.engineering/alice",
  
  // Metadata
  resolution: "1920x1080",
  bitrate: "2500kbps",
  codec: "h264",
  
  // Attached to time box
  timeBoxId: "timebox.zone.acme.engineering.2026-01-31-14-30",
  
  // Ephemeral by default
  retention: "until_session_ends"
};
```

**Key insight**: This is **state**, not **history**.

### **After Session Closes (Evidence)**

**Optional archive** (if enabled):
```javascript
evidence = {
  // Full video archive (optional)
  fullVideo: {
    path: ".relay/archives/video/timebox-xyz.mp4",
    duration: 7200000,  // 2 hours
    size: "1.8GB",
    retention: "30_days"  // or "permanent" if marked
  },
  
  // Key frames (always saved)
  keyFrames: [
    { time: "14:30:00", frame: "start.jpg", description: "Session start" },
    { time: "14:45:00", frame: "pause.jpg", description: "Discussion pause" },
    { time: "15:10:00", frame: "decision.jpg", description: "Decision locked" },
    { time: "16:30:00", frame: "end.jpg", description: "Session end" }
  ],
  
  // Transcript (always saved)
  transcript: {
    path: ".relay/archives/transcripts/timebox-xyz.txt",
    format: "timestamped_text",
    size: "24KB"
  },
  
  // Activity log (always saved)
  activityLog: {
    path: ".relay/archives/activity/timebox-xyz.json",
    contains: ["edits", "cursor_movement", "commands"],
    size: "156KB"
  }
};
```

**Key insight**: Full video is **optional evidence**, not **canonical history**.

---

## The Shape of Commits (Both, at Different Scales)

### **Question (User's Insight)**

> "Does this mean commits are filament-shaped and not nodes or glyphs? Or both?"

### **Answer: BOTH (at different scales)**

**Macro scale** (globe/filament view):
```
Commits appear as discrete nodes

● ———— ● ———— ● ———— ● ———— ●

Each dot = commit (point in spacetime)
Lines = filament continuity
Sparse, ordered, navigable
```

**Micro scale** (inside each commit):
```
Each commit is a time box (may have duration)

[████████████████████]

If duration = 0:      instant event (traditional commit)
If duration > 0:      time box (continuous activity inside)
```

**Complete model**:
```
Filament = Chain of time boxes
         = Spine with segments

● ——[═══]—— ● ——[════════]—— ● ——[═]—— ●
^    ^      ^    ^         ^    ^   ^    ^
│    │      │    │         │    │   │    │
│    time   │    │  time   │    │   │    commit
│    box    │    │  box    │    │   │    (instant)
│    (1m)   │    │  (2h)   │    │   │
commit     commit commit  commit  time commit
(instant)  (end)  (start) (end)   box  (instant)
                                  (10s)
```

**Key insight**: Commits are **both**:
- Points (when viewed from outside)
- Boxes (when viewed from inside)

**This is not contradiction — it's scale-dependent representation.**

---

## Why This Preserves Truth and Sanity

### **What This Model Gives You**

✅ **Continuity without noise**
- Live presence feels live
- History stays meaningful

✅ **History without lies**
- Only material events recorded
- Continuous state properly scoped

✅ **Replay without overload**
- Can replay at commit level (sparse)
- Can drill into time box if needed (dense)

✅ **Live presence without false permanence**
- Ephemeral state is ephemeral
- Evidence is archived only when needed

### **Matches Real-World Systems**

**Video editing**:
- Timeline (filament)
- Clips (time boxes)
- Cuts/edits (commits)

**Legal records**:
- Case timeline (filament)
- Depositions/hearings (time boxes)
- Rulings/decisions (commits)

**Human cognition**:
- Life timeline (filament)
- Experiences (time boxes)
- Memories/decisions (commits)

**Physics**:
- Worldline (filament)
- Processes (time boxes)
- Events (commits)

---

## Live Broadcast Protocol (Technical Spec)

### **Starting a Live Session**

```javascript
// User initiates live broadcast
async function startLiveSession(context) {
  // 1. Create start commit
  const startCommit = await git.commit({
    message: `Live session started: ${context.task}`,
    author: context.userId,
    metadata: {
      type: "live_start",
      task: context.task,
      expectedDuration: context.estimatedDuration
    }
  });
  
  // 2. Create time box
  const timeBox = {
    id: generateTimeBoxId(),
    type: "live_presence",
    startTime: Date.now(),
    endTime: null,  // Open-ended
    filament: context.filament,
    commitHash: startCommit.hash,
    status: "open"
  };
  
  // 3. Initialize live streams
  const streams = {
    video: initVideoStream(context.camera),
    audio: initAudioStream(context.microphone),
    cursor: initCursorTrack(),
    edits: initEditStream()
  };
  
  // 4. Bind streams to time box
  timeBox.liveState = {
    videoStream: streams.video.id,
    audioStream: streams.audio.id,
    cursorTrack: streams.cursor.id,
    edits: []
  };
  
  // 5. Save time box metadata (not streams)
  await saveTimeBox(timeBox);
  
  // 6. Broadcast presence
  await zone.broadcast({
    type: "live_presence_started",
    userId: context.userId,
    timeBoxId: timeBox.id,
    streams: {
      video: streams.video.url,
      audio: streams.audio.url
    }
  });
  
  return { timeBox, streams };
}
```

### **During Live Session (Continuous State)**

```javascript
// Continuous activity (NOT commits)
function streamActivity(timeBox, streams) {
  // Video frames (30fps)
  streams.video.on('frame', (frame) => {
    // Stream to viewers, don't commit
    zone.broadcast({
      type: "video_frame",
      timeBoxId: timeBox.id,
      frame: frame  // Ephemeral
    });
  });
  
  // Cursor movement
  editor.on('cursor', (position) => {
    // Append to cursor track (ephemeral)
    timeBox.liveState.cursorTrack.push({
      time: Date.now() - timeBox.startTime,
      position: position
    });
  });
  
  // Edits (accumulate)
  editor.on('edit', (edit) => {
    // Accumulate edits (ephemeral until commit)
    timeBox.liveState.edits.push({
      time: Date.now() - timeBox.startTime,
      file: edit.file,
      changes: edit.changes
    });
  });
  
  // Speech (transcribe)
  streams.audio.on('speech', (segment) => {
    // Append to transcript (ephemeral)
    if (!timeBox.liveState.speech) {
      timeBox.liveState.speech = [];
    }
    timeBox.liveState.speech.push({
      time: Date.now() - timeBox.startTime,
      text: segment.transcript
    });
  });
}
```

### **Material Events (Discrete Commits)**

```javascript
// User triggers material event
async function materialEvent(timeBox, event) {
  // 1. Create commit for material event
  const commit = await git.commit({
    message: event.description,
    author: timeBox.userId,
    metadata: {
      type: "material_event",
      timeBoxId: timeBox.id,
      eventTime: Date.now(),
      context: event.context
    }
  });
  
  // 2. Record in time box
  timeBox.materialEvents.push({
    time: Date.now() - timeBox.startTime,
    commit: commit.hash,
    description: event.description
  });
  
  // 3. Save time box update
  await saveTimeBox(timeBox);
  
  // 4. Broadcast to zone
  await zone.broadcast({
    type: "material_event",
    timeBoxId: timeBox.id,
    event: event.description,
    commit: commit.hash
  });
}

// Examples of material events
function onUserPause(timeBox) {
  return materialEvent(timeBox, {
    description: "Paused live session for discussion",
    context: { reason: "user_initiated" }
  });
}

function onDecisionLocked(timeBox, decision) {
  return materialEvent(timeBox, {
    description: `Decision locked: ${decision.title}`,
    context: { decision: decision }
  });
}

function onScopeChange(timeBox, newScope) {
  return materialEvent(timeBox, {
    description: `Scope changed to ${newScope.filament}`,
    context: { oldScope: timeBox.filament, newScope: newScope.filament }
  });
}
```

### **Ending Live Session**

```javascript
async function endLiveSession(timeBox) {
  // 1. Stop all streams
  stopVideoStream(timeBox.liveState.videoStream);
  stopAudioStream(timeBox.liveState.audioStream);
  
  // 2. Create end commit
  const endCommit = await git.commit({
    message: `Live session ended: ${timeBox.duration}ms`,
    author: timeBox.userId,
    metadata: {
      type: "live_end",
      timeBoxId: timeBox.id,
      duration: Date.now() - timeBox.startTime,
      materialEvents: timeBox.materialEvents.length
    }
  });
  
  // 3. Close time box
  timeBox.endTime = Date.now();
  timeBox.duration = timeBox.endTime - timeBox.startTime;
  timeBox.status = "closed";
  
  // 4. Archive evidence (if enabled)
  if (shouldArchive(timeBox)) {
    timeBox.evidence = await archiveTimeBox(timeBox);
  } else {
    // Save key frames only
    timeBox.evidence = {
      keyFrames: extractKeyFrames(timeBox),
      transcript: generateTranscript(timeBox.liveState.speech),
      activityLog: generateActivityLog(timeBox.liveState.edits)
    };
  }
  
  // 5. Save final time box state
  await saveTimeBox(timeBox);
  
  // 6. Broadcast session end
  await zone.broadcast({
    type: "live_presence_ended",
    timeBoxId: timeBox.id,
    duration: timeBox.duration,
    materialEvents: timeBox.materialEvents.length
  });
  
  return { timeBox, endCommit };
}
```

---

## Replay Mechanics (How Time Boxes Are Navigated)

### **Replay Modes**

**1. Commit-level replay** (default, fast):
```
Show only material events (commits)

14:30 ● Started live session
14:45 ● Paused for discussion
15:10 ● Decision locked
15:45 ● Scope changed
16:30 ● Ended session

Navigate: Jump between commits (sparse)
Cost: Low (5 events)
```

**2. Time box replay** (detailed, slow):
```
Show continuous activity inside time box

[14:30 ══════════════════════════════ 16:30]
       ^        ^        ^        ^
       │        │        │        │
       video    cursor   edits    speech
       30fps    track    stream   transcript

Navigate: Scrub through time (dense)
Cost: High (216,000 frames)
```

**3. Summary replay** (balanced):
```
Show key moments + evidence

14:30 [thumbnail] Started
14:45 [thumbnail] Paused (transcript available)
15:10 [thumbnail] Decision locked (key frame)
15:45 [thumbnail] Scope changed
16:30 [thumbnail] Ended (activity log available)

Navigate: Jump to key moments (medium)
Cost: Medium (5 thumbnails + metadata)
```

### **Implementation**

```javascript
// Replay at different levels
function replay(timeBox, mode) {
  switch (mode) {
    case "commits":
      // Sparse replay (commits only)
      return replayCommits(timeBox.materialEvents);
      
    case "full":
      // Dense replay (full video)
      return replayFullVideo(timeBox.evidence.fullVideo);
      
    case "summary":
      // Balanced replay (key moments)
      return replaySummary({
        keyFrames: timeBox.evidence.keyFrames,
        transcript: timeBox.evidence.transcript,
        activityLog: timeBox.evidence.activityLog
      });
      
    case "scrub":
      // Interactive scrubbing
      return replayScrubber(timeBox);
  }
}
```

---

## Default Materiality Thresholds (Live Sessions)

### **Automatic Commit Triggers**

```javascript
materialityThresholds = {
  // Time-based
  maxSessionDuration: 4 * 60 * 60 * 1000,  // 4 hours (force commit)
  minEventInterval: 30 * 1000,             // 30 seconds (debounce)
  
  // Activity-based
  minEditsForCommit: 10,                   // 10+ edits = material
  minDiscussionDuration: 5 * 60 * 1000,    // 5 min pause = material
  
  // Pressure-based
  eriDropThreshold: 70,                    // ERI < 70 = material
  conflictDetected: true,                  // Conflict = material
  
  // State-based
  scopeChange: true,                       // Ring/branch change = material
  authorityChange: true,                   // Authority change = material
  decisionLocked: true,                    // Decision lock = material
  
  // User-triggered
  explicitHold: true,                      // User hits HOLD = material
  explicitAnnotation: true,                // User annotates = material
  explicitPublish: true                    // User publishes clip = material
};
```

---

## Integration with Existing Architecture

### **Relationship to c16 (Commit Materiality)**

**c16 defined**:
- Five states (DRAFT → HOLD → PROPOSE → COMMIT → REVERT)
- Materiality thresholds (time, actions, risk, visibility, dependencies)
- Context snapshots (what/where/relations/when/who)

**This document extends c16 for live presence**:
- Time boxes = extended DRAFT state with continuous activity
- Material events = COMMIT points inside time box
- Evidence = extended context snapshot for live sessions

### **Relationship to c17 (Work Zones)**

**c17 defined**:
- Work zones = co-located collaboration spaces
- Three layers (live dialogue, shared context, commits)

**This document extends c17 for live broadcast**:
- Live broadcast = Layer A (live dialogue) made visible
- Time boxes = container for Layer A activity
- Material events = Layer C (commits) during live session

### **Relationship to Cognitive Recovery Paths**

**Cognitive recovery uses time boxes**:
- "Where Was I?" recovery = jump to last time box
- Context breadcrumbs = trail of time boxes
- Activity trail on globe = visual time box history

---

## Summary: What Is Now Locked

### **Core Principles (LOCKED)**

1. **Live presence ≠ commit stream**
2. **Continuity lives inside time boxes**
3. **History advances only at commit boundaries**
4. **Commits are both points (macro) and boxes (micro)**
5. **Filaments are chains of time boxes**
6. **Ephemeral state is properly scoped**
7. **Material events trigger commits**

### **Technical Model (LOCKED)**

**Time box**:
- Bounded interval of continuous presence
- Contains ephemeral state (video, cursor, edits, speech)
- Produces discrete commits at material boundaries
- Collapses to summary + evidence when closed

**Materiality thresholds**:
- Session start/end (automatic)
- User pause/resume (explicit)
- Decision lock (explicit)
- Scope change (automatic)
- ERI drop (pressure-triggered)
- Time threshold (automatic: 4 hours)

**Evidence**:
- Key frames (always saved)
- Transcript (always saved)
- Activity log (always saved)
- Full video (optional, retention-based)

### **What This Enables**

- Live broadcasting without commit noise
- Real-time collaboration with meaningful history
- Video replay at multiple granularities
- Continuous presence with discrete memory
- Proper separation of state vs events

---

## Implementation Status

**Architecture**: Locked ✅  
**Protocol**: Specified ✅  
**Integration**: Defined ✅  
**Implementation**: Week 5-6 (live presence features)  
**Testing**: User testing required (live sessions)

---

## Final Lock Sentence

> **"Live presence exists inside time boxes (continuous state); commits occur only at material boundaries (discrete events); filaments are chains of time boxes (both point and duration); ephemeral state is properly scoped (never conflated with history); and material thresholds determine when continuity becomes permanence."**

**This is now architecture.**  
**This is locked.**  
**This is how Relay handles live activity.**

---

**Last Updated**: 2026-01-31  
**Status**: LOCKED ✅  
**Related**: c16 (Commit Materiality), c17 (Work Zones), Cognitive Recovery Paths  
**Next**: Implementation (Week 5-6: live broadcast, time box replay, evidence archiving)
