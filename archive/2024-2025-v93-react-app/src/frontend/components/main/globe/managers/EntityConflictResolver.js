// ============================================================================
// EntityConflictResolver.js - Prevents Entity Management Conflicts
// ============================================================================
// Single source of truth for entity management across all systems
// ============================================================================

export class EntityConflictResolver {
  constructor(viewer, entitiesRef) {
    this.viewer = viewer;
    this.entitiesRef = entitiesRef;
    
    // Track entity ownership
    this.entityOwners = new Map(); // entityId -> owner
    this.owners = new Set(['geographic', 'channels', 'ui']);
    
    // Override viewer.entities methods
    this.setupEntityProtection();
    
    console.log('🛡️ EntityConflictResolver initialized');
  }

  // ============================================================================
  // ENTITY OWNERSHIP MANAGEMENT
  // ============================================================================

  registerEntity(entity, owner) {
    if (!this.owners.has(owner)) {
      throw new Error(`Invalid entity owner: ${owner}`);
    }
    
    this.entityOwners.set(entity.id, owner);
    // Only log every 100th registration to reduce spam
    if (this.entityOwners.size % 100 === 0) {
      console.log(`📝 Registered ${this.entityOwners.size} entities (latest: ${entity.id} to ${owner})`);
    }
  }

  unregisterEntity(entityId) {
    this.entityOwners.delete(entityId);
    // Only log unregistration for non-geographic entities to reduce spam
    if (!entityId.includes('province:') && !entityId.includes('country:')) {
      console.log(`📝 Unregistered entity ${entityId}`);
    }
  }

  getEntityOwner(entityId) {
    return this.entityOwners.get(entityId);
  }

  // ============================================================================
  // PROTECTED ENTITY OPERATIONS
  // ============================================================================

  setupEntityProtection() {
    const originalRemove = this.viewer.entities.remove.bind(this.viewer.entities);
    const originalRemoveAll = this.viewer.entities.removeAll.bind(this.viewer.entities);

    // Override remove to check ownership
    this.viewer.entities.remove = (entity) => {
      if (typeof entity === 'string') {
        // Remove by ID
        const owner = this.getEntityOwner(entity);
        if (owner === 'geographic') {
          console.log(`🛡️ Blocked removal of geographic entity: ${entity}`);
          return false;
        }
      } else if (entity && entity.id) {
        // Remove by entity object
        const owner = this.getEntityOwner(entity.id);
        if (owner === 'geographic') {
          console.log(`🛡️ Blocked removal of geographic entity: ${entity.id}`);
          return false;
        }
      }
      
      // Allow removal and unregister
      const result = originalRemove(entity);
      if (entity && entity.id) {
        this.unregisterEntity(entity.id);
      }
      return result;
    };

    // Override removeAll to be selective
    this.viewer.entities.removeAll = () => {
      const allEntities = Array.from(this.viewer.entities.values);
      let removed = 0;
      let protectedCount = 0;
      
      allEntities.forEach(entity => {
        const owner = this.getEntityOwner(entity.id);
        if (owner === 'geographic') {
          protectedCount++;
        } else {
          originalRemove(entity);
          this.unregisterEntity(entity.id);
          removed++;
        }
      });
      
      console.log(`🛡️ Selective removeAll: ${removed} removed, ${protectedCount} protected`);
      return removed;
    };
  }

  // ============================================================================
  // CLEANUP OPERATIONS
  // ============================================================================

  clearByOwner(owner) {
    const entitiesToRemove = [];
    
    this.entityOwners.forEach((entityOwner, entityId) => {
      if (entityOwner === owner) {
        const entity = this.viewer.entities.getById(entityId);
        if (entity) {
          entitiesToRemove.push(entity);
        }
      }
    });
    
    entitiesToRemove.forEach(entity => {
      this.viewer.entities.remove(entity);
      this.unregisterEntity(entity.id);
    });
    
    console.log(`🧹 Cleared ${entitiesToRemove.length} entities for owner: ${owner}`);
    return entitiesToRemove.length;
  }

  clearAll() {
    const count = this.viewer.entities.values.length;
    this.viewer.entities.removeAll();
    this.entityOwners.clear();
    console.log(`🧹 Cleared all ${count} entities`);
    return count;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getStats() {
    const stats = {
      total: this.viewer.entities.values.length,
      byOwner: {}
    };
    
    this.owners.forEach(owner => {
      stats.byOwner[owner] = 0;
    });
    
    this.entityOwners.forEach(owner => {
      if (stats.byOwner[owner] !== undefined) {
        stats.byOwner[owner]++;
      }
    });
    
    return stats;
  }
}
