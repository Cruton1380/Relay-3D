# UI Cognitive Recovery — Implementation Specification

**Status**: Implementation Guide  
**Date**: 2026-01-31  
**Related**: COGNITIVE-RECOVERY-PATHS.md, c14 (Surface Geometry), c17 (Work Zones)  
**Type**: UI/UX Specification

---

## Purpose

This document specifies how to implement **cognitive recovery features** in Relay's UI, translating the cognitive science principles into concrete user interactions.

**Goal**: Enable users to recover lost context by spatially retracing their path through work, rather than relying on fragile memory.

---

## Core UI Principle

> **"The UI must show paths, not just states."**

**Current state only** (insufficient):
```
You are at: feature.payments.retry
Commit: abc123
```

**Path context** (sufficient for recovery):
```
You are at: feature.payments.retry @ abc123
  ↖ Came from: feature.payments.validation (5 min ago)
  ↖ Diverged from: main (3 days ago)
  → Related: 2 other filaments touch this code
  ⚠ Unresolved: Error handling strategy
  ✓ Recent: You added retry logic (2 min ago)
```

---

## Feature 1: Context Breadcrumbs

### **Purpose**
Show where the user has been, so they can retrace their path.

### **Visual Design**

**Location**: Top of main view, below navigation bar

**Appearance**:
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumbs                                                  │
├─────────────────────────────────────────────────────────────┤
│ main → feature.payments → validation (5m ago) → retry (now) │
└─────────────────────────────────────────────────────────────┘
```

**Interactions**:
- Click any breadcrumb → Navigate to that context
- Hover breadcrumb → Show preview (files, recent activity)
- Right-click → Options (pin, bookmark, compare)

### **Data Structure**

```javascript
contextBreadcrumbs = [
  {
    filament: "main",
    commitHash: "789xyz",
    timestamp: "2026-01-31T14:00:00Z",
    activity: "Merged PR #42",
    duration: "15 minutes"
  },
  {
    filament: "feature.payments",
    commitHash: "def456",
    timestamp: "2026-01-31T14:15:00Z",
    activity: "Created feature branch",
    duration: "2 minutes"
  },
  {
    filament: "feature.payments.validation",
    commitHash: "ghi789",
    timestamp: "2026-01-31T14:20:00Z",
    activity: "Added card validation",
    duration: "10 minutes"
  },
  {
    filament: "feature.payments.retry",
    commitHash: "abc123",
    timestamp: "2026-01-31T14:30:00Z",
    activity: "Implementing retry logic (now)",
    duration: "ongoing"
  }
];
```

### **Retention Policy**

- Keep last 10 contexts (or 1 hour, whichever is more)
- Persist across sessions (local storage)
- Show "earlier today", "yesterday", "this week" groupings

---

## Feature 2: "Where Was I?" Recovery Panel

### **Purpose**
After interruption, help user quickly return to their last context.

### **Trigger**

Automatically show when:
- User returns after 15+ minutes away
- User closes/reopens tab
- User switches between projects

**Can also be manually invoked**: `Ctrl+Shift+W` or "Where was I?" button

### **Visual Design**

**Modal overlay** (center of screen, dismissible):

```
┌────────────────────────────────────────────────────────────┐
│ 🔄 Where Was I?                                      [X]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ You were last here 23 minutes ago:                        │
│                                                            │
│ 📂 feature.payments.retry                                 │
│ 📄 src/payments/retry.mjs (line 42)                      │
│                                                            │
│ Task: "Implement exponential backoff logic"               │
│                                                            │
│ Recent activity:                                           │
│   ✓ Added RetryStrategy class                            │
│   ✓ Defined retry intervals [1s, 2s, 4s, 8s]           │
│   ⏸ Left off at: Error handling for max retries          │
│                                                            │
│ Related work:                                              │
│   → 2 other developers touched this file today            │
│   ⚠ Merge conflict possible with alice's branch          │
│                                                            │
│ [Jump Back]  [See Recent Changes]  [Start Fresh]          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Data Captured (Before Interruption)**

```javascript
interruptionSnapshot = {
  timestamp: "2026-01-31T14:30:00Z",
  duration: 23 * 60 * 1000,  // 23 minutes
  
  location: {
    filament: "feature.payments.retry",
    commitHash: "abc123",
    files: ["src/payments/retry.mjs", "tests/retry.test.mjs"],
    cursorPosition: { file: "src/payments/retry.mjs", line: 42, col: 8 }
  },
  
  task: {
    description: "Implement exponential backoff logic",
    status: "in_progress",
    substeps: [
      { step: "Add RetryStrategy class", done: true },
      { step: "Define retry intervals", done: true },
      { step: "Handle max retries error", done: false }  // Where they left off
    ]
  },
  
  recentActivity: [
    { action: "edit", file: "retry.mjs", line: 35, time: "14:28" },
    { action: "edit", file: "retry.mjs", line: 42, time: "14:30" }
  ],
  
  mentalState: {
    selectedText: "throw new MaxRetriesExceededError()",  // What they were looking at
    recentSearches: ["javascript exponential backoff", "error handling patterns"],
    openTabs: ["retry.mjs", "retry.test.mjs", "MDN: Error"]
  },
  
  relatedWork: {
    otherDevelopers: [
      { name: "alice", file: "retry.mjs", time: "14:15", status: "possible_conflict" }
    ],
    relatedFilaments: ["feature.payments.validation"],
    unresolvedQuestions: ["Should we retry on network errors only, or all errors?"]
  }
};
```

### **Actions**

**"Jump Back"**:
- Navigate to filament + commit
- Open files at exact cursor position
- Restore tabs
- Show task description in HUD

**"See Recent Changes"**:
- Show git diff since user left
- Highlight conflicts or related changes
- Show who else worked on this

**"Start Fresh"**:
- Clear snapshot
- Stay at current location
- User chooses new task

---

## Feature 3: Globe "Recent Activity" Visualization

### **Purpose**
Show where user has been recently on the 3D globe, so they can visually retrace their path.

### **Visual Design**

**Globe overlay** (semi-transparent trail):

```
     🌐 Globe View
     
     ⭐ (main - core)
      ↓
      ↓ (fading blue trail)
      ↓
     🔵 (feature.payments - ring)
      ↓
      ↓ (fading green trail)
      ↓
     🟢 (current location)
```

**Trail properties**:
- **Color**: Fades from bright (recent) to transparent (old)
- **Thickness**: Thicker for longer duration at location
- **Glow**: Pulsing glow at current location
- **Dots**: Waypoints at each filament divergence

### **Interactions**

- **Hover trail segment** → Show time spent, activity summary
- **Click trail dot** → Navigate to that context
- **Drag along trail** → Scrub through time (preview contexts)

### **Data Structure**

```javascript
activityTrail = [
  {
    filament: "main",
    position: { lat: 0, lon: 0, alt: 0 },  // Core center
    timestamp: "2026-01-31T14:00:00Z",
    duration: 900000,  // 15 minutes (ms)
    activity: "Code review",
    color: "rgba(100, 150, 255, 0.3)"  // Faded blue
  },
  {
    filament: "feature.payments",
    position: { lat: 15, lon: 45, alt: 100 },
    timestamp: "2026-01-31T14:15:00Z",
    duration: 600000,  // 10 minutes
    activity: "Feature planning",
    color: "rgba(100, 255, 150, 0.5)"  // Medium green
  },
  {
    filament: "feature.payments.retry",
    position: { lat: 18, lon: 48, alt: 150 },
    timestamp: "2026-01-31T14:25:00Z",
    duration: "ongoing",
    activity: "Implementing retry logic (now)",
    color: "rgba(100, 255, 100, 1.0)",  // Bright green (current)
    glow: true
  }
];
```

### **Rendering Logic**

```javascript
function renderActivityTrail(trail) {
  for (let i = 0; i < trail.length - 1; i++) {
    const from = trail[i];
    const to = trail[i + 1];
    
    // Draw line between waypoints
    drawLine(from.position, to.position, {
      color: from.color,
      thickness: Math.log(from.duration / 1000),  // Thicker = longer stay
      opacity: calculateFade(from.timestamp, Date.now())
    });
    
    // Draw waypoint dot
    drawDot(from.position, {
      size: 5,
      color: from.color,
      label: formatTime(from.timestamp)
    });
  }
  
  // Current location (pulsing glow)
  const current = trail[trail.length - 1];
  drawDot(current.position, {
    size: 10,
    color: current.color,
    glow: true,
    pulseRate: 1000  // 1 Hz
  });
}

function calculateFade(pastTime, now) {
  const age = now - pastTime;
  const maxAge = 60 * 60 * 1000;  // 1 hour
  return Math.max(0, 1 - (age / maxAge));
}
```

---

## Feature 4: "Back" Navigation (Context-Aware)

### **Purpose**
Let user navigate back through their context history, not just browser history.

### **Behavior**

**Standard browser back**:
```
Page 1 → Page 2 → Page 3
        ←       ←        (URL history)
```

**Relay context back**:
```
Context 1 → Context 2 → Context 3
(filament A) (filament B) (filament C)
          ←            ←            (context history)
```

**Key difference**: Context back restores mental state, not just URL.

### **Implementation**

**Keyboard shortcut**: `Alt+Left` (standard back) vs `Ctrl+Alt+Left` (context back)

**Button**: Globe toolbar, labeled "Back" with tooltip "Return to previous context (Ctrl+Alt+←)"

**What gets restored**:
- Filament location
- Open files + cursor positions
- Task description
- Recent edits (undo stack if possible)
- Scroll positions

```javascript
function contextBack() {
  const history = getContextHistory();
  if (history.length < 2) {
    showToast("No previous context");
    return;
  }
  
  const currentContext = history[0];
  const previousContext = history[1];
  
  // Save current state first (for forward navigation)
  saveContextSnapshot(currentContext);
  
  // Restore previous context
  restoreContext(previousContext);
}

function restoreContext(context) {
  // Navigate to filament
  globe.navigateTo(context.filament, context.commitHash);
  
  // Open files at correct positions
  context.files.forEach(file => {
    editor.open(file.path, {
      cursorLine: file.cursorPosition.line,
      cursorCol: file.cursorPosition.col,
      scrollY: file.scrollY
    });
  });
  
  // Restore task
  hud.setTask(context.task);
  
  // Show restoration toast
  showToast(`Returned to: ${context.task.description}`, {
    action: "Forward",
    onAction: contextForward
  });
}
```

---

## Feature 5: Interruption-Safe Autosave

### **Purpose**
Automatically capture context before user leaves, so nothing is lost.

### **Triggers**

Capture context snapshot when:
- User switches tabs/windows (after 3 seconds)
- User is inactive for 5+ minutes
- User closes tab (before unload)
- User receives interruption (notification, call)

### **What Gets Saved**

```javascript
function captureContextSnapshot() {
  return {
    // When
    timestamp: Date.now(),
    
    // Where
    location: {
      filament: currentFilament,
      commitHash: currentCommit,
      files: editor.getOpenFiles().map(f => ({
        path: f.path,
        cursorPosition: editor.getCursorPosition(f),
        scrollY: editor.getScrollY(f),
        unsavedChanges: editor.getUnsavedChanges(f)
      }))
    },
    
    // What
    task: hud.getCurrentTask(),
    recentActivity: getRecentActivity(15 * 60 * 1000),  // Last 15 min
    
    // Why
    context: {
      decisions: getRecentDecisions(currentFilament),
      questions: getUnresolvedQuestions(currentFilament),
      relatedWork: getRelatedFilaments(currentFilament)
    },
    
    // Mental state cues
    mentalCues: {
      selectedText: editor.getSelectedText(),
      recentSearches: searchHistory.getRecent(5),
      openTabs: browser.getTabs(),
      clipboardHistory: clipboard.getHistory(5)
    }
  };
}

// Save to IndexedDB (persists across sessions)
function saveSnapshot(snapshot) {
  db.snapshots.add({
    id: generateId(),
    timestamp: snapshot.timestamp,
    data: snapshot,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)  // 7 days
  });
}
```

### **Recovery Flow**

```javascript
// On app load/tab focus
function checkForRecoverableContext() {
  const lastSnapshot = db.snapshots.getLatest();
  
  if (!lastSnapshot) return;
  
  const timeSinceSnapshot = Date.now() - lastSnapshot.timestamp;
  const threshold = 15 * 60 * 1000;  // 15 minutes
  
  if (timeSinceSnapshot > threshold) {
    // Show "Where Was I?" panel
    showRecoveryPanel(lastSnapshot);
  }
}
```

---

## Feature 6: Task Resume Suggestions

### **Purpose**
Proactively suggest where to resume work based on incomplete tasks.

### **Visual Design**

**Location**: HUD sidebar, "Resume Work" section

```
┌─────────────────────────────────┐
│ 🔄 Resume Work                  │
├─────────────────────────────────┤
│                                 │
│ Unfinished tasks:               │
│                                 │
│ 1. ⏸ Retry logic                │
│    feature.payments.retry       │
│    23 minutes ago               │
│    [Resume]                     │
│                                 │
│ 2. ⏸ Card validation            │
│    feature.payments.validation  │
│    2 hours ago                  │
│    [Resume]                     │
│                                 │
│ 3. ⏸ Error handling             │
│    main                         │
│    Yesterday                    │
│    [Resume]                     │
│                                 │
└─────────────────────────────────┘
```

### **Data Structure**

```javascript
incompleteTasks = [
  {
    id: "task-123",
    description: "Implement retry logic",
    filament: "feature.payments.retry",
    status: "in_progress",
    lastActivity: "2026-01-31T14:30:00Z",
    progress: {
      completed: ["Add RetryStrategy class", "Define retry intervals"],
      remaining: ["Handle max retries error", "Add tests"]
    },
    context: {
      files: ["src/payments/retry.mjs"],
      cursorPosition: { line: 42, col: 8 }
    }
  }
];
```

### **Sorting Logic**

```javascript
function sortResumeSuggestions(tasks) {
  return tasks
    .filter(t => t.status === "in_progress")
    .sort((a, b) => {
      // Prioritize by recency, progress, and importance
      const recencyScore = (Date.now() - a.lastActivity) / (60 * 1000);  // Minutes ago
      const progressScore = a.progress.completed.length / 
                           (a.progress.completed.length + a.progress.remaining.length);
      const importanceScore = a.importance || 5;  // 0-10 scale
      
      const aScore = -recencyScore + (progressScore * 10) + importanceScore;
      const bScore = -recencyScore + (progressScore * 10) + importanceScore;
      
      return bScore - aScore;
    })
    .slice(0, 5);  // Top 5
}
```

---

## Feature 7: Filament Timeline View

### **Purpose**
Show temporal progression through a filament, so user can see "what happened when".

### **Visual Design**

**Location**: Filament detail panel (right sidebar)

```
┌─────────────────────────────────────────┐
│ 📊 Timeline: feature.payments.retry     │
├─────────────────────────────────────────┤
│                                         │
│ Now ●─────────────────────────────────  │
│     │                                   │
│     │ 14:30 - You: Added error handling │
│     │                                   │
│     ●─────────────────────────────────  │
│     │                                   │
│     │ 14:25 - You: Defined retry logic  │
│     │                                   │
│     ●─────────────────────────────────  │
│     │                                   │
│     │ 14:20 - Branched from main        │
│     │                                   │
│     ●═════════════════════════════════  │
│     ║                                   │
│     ║ (main - core filament)            │
│     ║                                   │
└─────────────────────────────────────────┘
```

### **Interactions**

- **Click timeline dot** → Jump to that commit
- **Hover dot** → Show diff preview
- **Drag timeline** → Scrub through history (live preview)
- **Click "fork" icon** → See where filament diverged

### **Data Structure**

```javascript
timeline = {
  filament: "feature.payments.retry",
  events: [
    {
      type: "branch",
      timestamp: "2026-01-31T14:20:00Z",
      commitHash: "abc123",
      description: "Branched from main",
      author: "you",
      parent: { filament: "main", commitHash: "789xyz" }
    },
    {
      type: "commit",
      timestamp: "2026-01-31T14:25:00Z",
      commitHash: "def456",
      description: "Defined retry intervals",
      author: "you",
      files: ["src/payments/retry.mjs"],
      linesChanged: { added: 15, removed: 0 }
    },
    {
      type: "commit",
      timestamp: "2026-01-31T14:30:00Z",
      commitHash: "ghi789",
      description: "Added error handling",
      author: "you",
      files: ["src/payments/retry.mjs"],
      linesChanged: { added: 8, removed: 2 }
    }
  ]
};
```

---

## Feature 8: "Mental State" Indicators

### **Purpose**
Show visual cues that help user remember what they were thinking.

### **Indicators**

**1. Cursor Echo** (faint ghost cursor):
- Shows where cursor was when user left
- Fades in when user returns to file
- Animates from last position to current position

**2. Selection Highlight** (subtle glow):
- Highlights text user was looking at
- Yellow glow for 5 seconds after file open
- Can be dismissed with Esc

**3. Recent Edit Markers** (gutter icons):
- Green dot in gutter for lines edited recently
- Brightness = recency (brighter = more recent)
- Hover to see "Edited 2 minutes ago"

**4. Thought Fragment Preview** (tooltip):
- If user had text selected when they left, show it in tooltip
- "You were looking at: `throw new MaxRetriesExceededError()`"
- Helps trigger associative memory

### **Implementation**

```javascript
function showMentalStateCues(snapshot) {
  const file = snapshot.location.files[0];
  
  // Cursor echo
  if (file.cursorPosition) {
    editor.showGhostCursor(file.path, file.cursorPosition, {
      duration: 3000,
      fadeOut: true
    });
  }
  
  // Selection highlight
  if (snapshot.mentalCues.selectedText) {
    const range = editor.findText(file.path, snapshot.mentalCues.selectedText);
    if (range) {
      editor.highlight(range, {
        color: "rgba(255, 255, 0, 0.3)",
        duration: 5000
      });
      
      editor.showTooltip(range, {
        text: `You were looking at: "${snapshot.mentalCues.selectedText}"`,
        position: "above"
      });
    }
  }
  
  // Recent edit markers
  snapshot.recentActivity
    .filter(a => a.action === "edit")
    .forEach(edit => {
      editor.addGutterMarker(edit.file, edit.line, {
        icon: "green-dot",
        opacity: calculateRecency(edit.time),
        tooltip: `Edited ${formatRelativeTime(edit.time)}`
      });
    });
}
```

---

## Feature 9: Context Diff View

### **Purpose**
Show what changed while user was away, so they can catch up quickly.

### **Trigger**

Automatically shown when user returns after 15+ minutes and other developers have made changes.

### **Visual Design**

```
┌─────────────────────────────────────────────────────────┐
│ 🔄 While You Were Away (23 minutes)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Changes in feature.payments.retry:                     │
│                                                         │
│ ✓ alice committed (14:35):                            │
│   "Add retry timeout configuration"                    │
│   + 2 files: retry.mjs, config.mjs                    │
│   [View Diff]                                          │
│                                                         │
│ ⚠ Possible conflict with your work:                   │
│   Both you and alice edited retry.mjs lines 40-50     │
│   [Review Conflict]                                    │
│                                                         │
│ Other activity:                                         │
│   • bob opened PR #43 (related to payments)           │
│   • 3 new comments on issue #12                       │
│                                                         │
│ [Review All]  [Ignore]  [Merge Now]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Data Structure**

```javascript
contextDiff = {
  userLeftAt: "2026-01-31T14:30:00Z",
  userReturnedAt: "2026-01-31T14:53:00Z",
  duration: 23 * 60 * 1000,
  
  changes: [
    {
      type: "commit",
      author: "alice",
      timestamp: "2026-01-31T14:35:00Z",
      message: "Add retry timeout configuration",
      files: [
        { path: "src/payments/retry.mjs", added: 10, removed: 2 },
        { path: "src/payments/config.mjs", added: 5, removed: 0 }
      ],
      conflictsWith: "user_work"
    }
  ],
  
  potentialConflicts: [
    {
      file: "src/payments/retry.mjs",
      userLines: { start: 40, end: 50 },
      otherAuthor: "alice",
      otherLines: { start: 42, end: 48 },
      overlap: { start: 42, end: 48 }
    }
  ],
  
  relatedActivity: [
    { type: "pr", number: 43, author: "bob", title: "Add payment logging" },
    { type: "comments", issue: 12, count: 3 }
  ]
};
```

---

## Feature 10: Smart Search (Context-Aware)

### **Purpose**
Search results prioritized by current context, so relevant results appear first.

### **Behavior**

**Standard search**:
```
Search: "retry"
Results: All files containing "retry" (alphabetical)
```

**Context-aware search**:
```
Search: "retry"
Results: 
  1. Current filament files (highest priority)
  2. Related filament files
  3. Recently viewed files
  4. Everything else
```

### **Ranking Algorithm**

```javascript
function rankSearchResults(query, results) {
  const currentFilament = getCurrentFilament();
  const recentFiles = getRecentlyViewedFiles();
  const relatedFilaments = getRelatedFilaments(currentFilament);
  
  return results.map(result => {
    let score = result.textMatchScore;  // Base relevance
    
    // Boost current filament
    if (result.filament === currentFilament) {
      score *= 10;
    }
    
    // Boost related filaments
    if (relatedFilaments.includes(result.filament)) {
      score *= 5;
    }
    
    // Boost recently viewed
    if (recentFiles.includes(result.file)) {
      score *= 3;
    }
    
    // Boost same directory
    if (path.dirname(result.file) === path.dirname(getCurrentFile())) {
      score *= 2;
    }
    
    return { ...result, contextScore: score };
  }).sort((a, b) => b.contextScore - a.contextScore);
}
```

---

## Implementation Checklist

### **Week 3: Core Navigation**
- [ ] Context breadcrumbs (top nav)
- [ ] "Back" navigation (context-aware)
- [ ] Activity trail on globe
- [ ] Context history storage (IndexedDB)

### **Week 4: Interruption Recovery**
- [ ] "Where Was I?" panel
- [ ] Interruption-safe autosave
- [ ] Context snapshot capture
- [ ] Recovery cues (cursor echo, selection highlight)

### **Week 5: Timeline & Diff**
- [ ] Filament timeline view
- [ ] Context diff view
- [ ] Recent edit markers
- [ ] Conflict detection

### **Week 6: Smart Features**
- [ ] Task resume suggestions
- [ ] Context-aware search
- [ ] Mental state indicators
- [ ] Thought fragment previews

---

## Testing & Validation

### **User Testing Scenarios**

**Scenario 1: Interruption Recovery**
1. User works on feature for 10 minutes
2. User gets interrupted (meeting)
3. User returns 30 minutes later
4. **Expected**: "Where Was I?" panel shows with recovery cues
5. **Success metric**: User resumes work in < 30 seconds

**Scenario 2: Context Navigation**
1. User navigates through 5 different filaments
2. User realizes they need to go back to 3rd filament
3. User uses breadcrumbs or "back" button
4. **Expected**: Exact context restored (files, cursor, task)
5. **Success metric**: User finds their place immediately

**Scenario 3: Merge Conflict**
1. User works on file for 15 minutes
2. Another developer commits to same file
3. User refreshes/returns
4. **Expected**: Context diff shows potential conflict
5. **Success metric**: User reviews and resolves conflict

### **Observable Metrics**

```javascript
metrics = {
  // Cognitive load indicators
  contextLossEvents: 0,           // How often users "lose their place"
  contextRecoveryTime: [],        // Time to resume work (ms)
  navigationBackUsage: 0,         // How often "back" is used
  
  // Feature adoption
  whereWasIPanelShown: 0,
  whereWasIPanelUsed: 0,
  breadcrumbClicks: 0,
  timelineInteractions: 0,
  
  // Effectiveness
  interruptionRecoverySuccess: 0, // Did user resume correct context?
  conflictDetectionAccuracy: 0,   // Were conflicts correctly identified?
  searchContextRelevance: 0       // Were top results relevant?
};
```

---

## Summary: What Gets Built

### **Core Features (MUST HAVE)**
1. ✅ Context breadcrumbs
2. ✅ "Where Was I?" recovery panel
3. ✅ Globe activity trail
4. ✅ Context-aware "back" navigation
5. ✅ Interruption-safe autosave

### **Enhanced Features (SHOULD HAVE)**
6. ✅ Filament timeline view
7. ✅ Context diff view
8. ✅ Task resume suggestions
9. ✅ Mental state indicators
10. ✅ Context-aware search

### **What This Enables**

**For users**:
- Recover lost thoughts in seconds
- Navigate context spatially (not by recall)
- Resume work after interruptions
- See what changed while away
- Reduce cognitive load

**For Relay**:
- Prove cognitive recovery works
- Differentiate from traditional tools
- Reduce friction in complex coordination
- Make 3D navigation natural
- Build user trust through reliability

---

## Final Note

**This is mechanical cognition support, not magic.**

**The UI doesn't read minds.**  
**The UI externalizes context so minds don't have to hold it.**

**Test everything with real users.**  
**Iterate based on observable behavior.**  
**Keep it grounded, simple, and reliable.**

---

**Status**: Implementation specification complete ✅  
**Next**: Begin Week 3 implementation (core navigation features)  
**Related**: COGNITIVE-RECOVERY-PATHS.md (architecture principles)

**Last Updated**: 2026-01-31
