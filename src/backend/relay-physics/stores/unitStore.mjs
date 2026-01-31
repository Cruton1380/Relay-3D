/**
 * UNIT STORE - SCV Agent State Management
 * 
 * Core invariants:
 * - Units are SCVs (literal worker units, not abstractions)
 * - Unit states are replay-derivable from action commits
 * - States: Idle | Moving | Working | Blocked | Awaiting Authority
 * - Task assignment is explicit (TASK_ASSIGN commit)
 * - Attachment/detachment is explicit (UNIT_ATTACH/UNIT_DETACH commits)
 * 
 * Part of Relay Physics API v1.1.0
 */

class UnitStore {
  constructor() {
    // In-memory stores (replace with DB in production)
    this.units = new Map(); // unitId → Unit
    this.actionLog = new Map(); // actionRef → ActionCommit
    this.subscribers = new Set(); // Set<callback> for unit state changes
  }

  /**
   * Create a new unit (SCV agent)
   */
  createUnit(unitData) {
    const { id, type, displayName, scope, capabilities, initialPosition } = unitData;

    if (this.units.has(id)) {
      throw new Error(`Unit ${id} already exists`);
    }

    const unit = {
      id,
      type, // "Employee" | "AI Agent"
      displayName,
      state: 'Idle', // Initial state
      position: initialPosition || { lat: 0, lng: 0, alt: 0 },
      attachedFilament: null,
      currentTask: null,
      scope,
      capabilities: [...capabilities],
      lastCommitRef: null,
      lastCommitTime: null,
      created: new Date().toISOString()
    };

    this.units.set(id, unit);
    this._notifySubscribers({ type: 'UNIT_CREATED', unit });
    return unit;
  }

  /**
   * Record unit intent (becomes an action commit)
   */
  recordIntent(unitId, intentData) {
    const unit = this.units.get(unitId);
    if (!unit) {
      throw new Error(`Unit ${unitId} not found`);
    }

    const actionIndex = this.actionLog.size + 1;
    const actionRef = `${unitId}@action.${actionIndex}`;

    const actionCommit = {
      ref: actionRef,
      unitId,
      actionIndex,
      intent: intentData.intent, // "MOVE_TO" | "ATTACH" | "DETACH"
      target: intentData.target,
      timestamp: new Date().toISOString(),
      processed: false
    };

    this.actionLog.set(actionRef, actionCommit);

    // Derive next state (this should eventually be done by stateProjector)
    const nextState = this._deriveNextState(unit, intentData);

    // Update unit state
    const oldState = unit.state;
    Object.assign(unit, nextState);

    this._notifySubscribers({
      type: 'UNIT_STATE_CHANGED',
      unitId,
      oldState,
      newState: unit.state,
      attachedFilament: unit.attachedFilament
    });

    return {
      actionRef,
      unit
    };
  }

  /**
   * Process TASK_ASSIGN commit (from filament)
   */
  processTaskAssignment(assignmentData) {
    const { targetUnit, filamentId, taskDescription } = assignmentData;
    const unit = this.units.get(targetUnit);

    if (!unit) {
      throw new Error(`Target unit ${targetUnit} not found`);
    }

    // Update unit with task assignment
    const oldState = unit.state;
    unit.currentTask = taskDescription;
    unit.state = 'Moving'; // Will move to filament

    this._notifySubscribers({
      type: 'UNIT_TASK_ASSIGNED',
      unitId: targetUnit,
      filamentId,
      task: taskDescription,
      oldState,
      newState: unit.state
    });

    return unit;
  }

  /**
   * Get all units
   */
  listUnits() {
    return Array.from(this.units.values());
  }

  /**
   * Get a specific unit
   */
  getUnit(unitId) {
    return this.units.get(unitId);
  }

  /**
   * Subscribe to unit updates (for WebSocket)
   */
  subscribe(callback) {
    this.subscribers.add(callback);
  }

  /**
   * Unsubscribe from unit updates
   */
  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  /**
   * Internal: Notify subscribers of unit changes
   */
  _notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Subscriber error:`, error);
      }
    });
  }

  /**
   * Internal: Derive next unit state from intent
   */
  _deriveNextState(unit, intentData) {
    const { intent, target } = intentData;

    switch (intent) {
      case 'MOVE_TO':
        return {
          state: 'Moving',
          // In real impl, would calculate path and update position over time
        };

      case 'ATTACH':
        return {
          state: 'Working',
          attachedFilament: target,
        };

      case 'DETACH':
        return {
          state: 'Idle',
          attachedFilament: null,
          currentTask: null,
        };

      default:
        return {};
    }
  }

  /**
   * Get stats (for debugging/monitoring)
   */
  getStats() {
    const stateBreakdown = {};
    this.units.forEach(unit => {
      stateBreakdown[unit.state] = (stateBreakdown[unit.state] || 0) + 1;
    });

    return {
      totalUnits: this.units.size,
      totalActions: this.actionLog.size,
      activeSubscriptions: this.subscribers.size,
      stateBreakdown
    };
  }
}

// Singleton instance
const unitStore = new UnitStore();

export default unitStore;
