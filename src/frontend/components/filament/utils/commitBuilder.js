/**
 * COMMIT BUILDER
 * 
 * Core invariant: Edits target a locus (cellId / selectionSet), not "the spreadsheet."
 * 
 * A commit is the atomic truth unit:
 * - filamentId (which entity timeline)
 * - commitIndex (parent commit)
 * - operation (valueEdit | formulaEdit | ...)
 * - evidence (who, when, tool)
 * - projection (+X face = new output value)
 */

/**
 * Generate unique commit ID
 */
function generateCommitId() {
  return `commit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build a commit object from an edit operation
 * 
 * @param {object} params
 * @param {string} params.filamentId - Which filament timeline
 * @param {number} params.parentCommitIndex - Previous commit in chain
 * @param {string} params.operation - 'valueEdit' | 'formulaEdit' | 'transform'
 * @param {any} params.newValue - New output value
 * @param {string} params.locusId - Cell/selection identifier
 * @param {object} params.evidence - Who/when/tool metadata
 * @returns {object} Commit object
 */
export function buildCommit({
  filamentId,
  parentCommitIndex,
  operation,
  newValue,
  locusId,
  evidence = {},
}) {
  const timestamp = Date.now();
  const commitId = generateCommitId();

  return {
    id: commitId,
    filamentId,
    eventIndex: parentCommitIndex + 1,
    parentCommitIndex,
    timestamp,
    operation,
    locusId, // Critical: locus, not "spreadsheet"
    
    // TimeBox faces
    faces: {
      output: {
        value: newValue,
        type: typeof newValue,
      },
      semanticMeaning: {
        label: operation === 'valueEdit' ? 'Direct Value Edit' : 'Formula Edit',
      },
      magnitude: {
        confidence: 1.0, // User-initiated, high confidence
      },
      evidence: {
        type: 'userEdit',
        userId: evidence.userId || 'demo-user',
        timestamp,
        tool: evidence.tool || 'EditableCellProof',
        pointer: `${locusId}@${commitId}`,
        ...evidence,
      },
    },
  };
}

/**
 * Append commit to filament (immutable)
 * 
 * @param {object} filament - Original filament
 * @param {object} commit - New commit to append
 * @returns {object} New filament with appended commit
 */
export function appendCommit(filament, commit) {
  return {
    ...filament,
    timeBoxes: [
      ...filament.timeBoxes,
      {
        id: commit.id,
        eventIndex: commit.eventIndex,
        timestamp: commit.timestamp,
        type: commit.operation,
        locusId: commit.locusId,
        faces: commit.faces,
      },
    ],
  };
}

/**
 * Get latest projection value (endpoint state)
 * 
 * @param {object} filament - Filament object
 * @returns {any} Latest +X face output value
 */
export function getEndpointProjection(filament) {
  if (!filament.timeBoxes || filament.timeBoxes.length === 0) {
    return null;
  }
  
  const latestTimeBox = filament.timeBoxes[filament.timeBoxes.length - 1];
  return latestTimeBox.faces.output.value;
}

/**
 * Replay commits (for proof visualization)
 * 
 * @param {object} filament - Filament with commits
 * @param {number} upToIndex - Replay up to this commit index
 * @returns {array} Array of commit states
 */
export function replayCommits(filament, upToIndex = Infinity) {
  return filament.timeBoxes
    .filter(tb => tb.eventIndex <= upToIndex)
    .map(tb => ({
      eventIndex: tb.eventIndex,
      value: tb.faces.output.value,
      operation: tb.type,
      timestamp: tb.timestamp,
      evidence: tb.faces.evidence,
    }));
}
