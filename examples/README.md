# Relay Network Examples

This directory has been cleaned up and reorganized. Example and validation files have been moved to their appropriate locations in the project structure.

## Directory Reorganization (September 2025)

### Files Moved to `/tests/` Directory

**Integration Tests:**
- `hashgraphIntegrationTest.mjs` - Basic system integration validation (formerly simpleIntegrationTest.mjs)
- `systemValidation.test.mjs` - Comprehensive system validation (formerly workingValidation.mjs)
- `deploymentValidation.test.mjs` - Pre-deployment validation suite (formerly finalDeploymentValidation.mjs)

**Hashgraph Tests:**
- `productionReadiness.test.mjs` - Production readiness validation (formerly validateHashgraphProduction.mjs)

### Removed Files

**Development Artifacts Removed:**
- All phase1/phase2/phase3 demo files (simulation code, not production-ready)
- Stress testing frameworks (development tools, not core functionality)
- Educational demos (superseded by production implementations)

## Why This Cleanup Was Necessary

The examples directory previously contained 16 files (216KB) with significant duplication and confusion:

1. **Demo files contained simplified implementations** that didn't reflect the sophisticated production APIs
2. **Multiple simulation frameworks** created confusion about what was real vs. mock functionality  
3. **Validation scripts were scattered** across examples instead of being in the proper test directory
4. **Educational demos were outdated** compared to the mature production KeySpace and Hashgraph systems

## Current Production Systems

Instead of relying on demo files, developers should use the actual production implementations:

### KeySpace (Encrypted File Storage)
- **Production API:** `src/backend/key-space/`
  - `keySpaceManager.mjs` - Full encryption, chunking, and storage
  - `keySpacePermissions.mjs` - Advanced permission system
  - `keySpaceSync.mjs` - Cross-device synchronization
  - `keySpaceTests.mjs` - Comprehensive test suite

### Hashgraph (Consensus System)
- **Production API:** `src/backend/hashgraph/`
  - `hashgraphIntegrationController.mjs` - Main controller
  - `proximityGossipMesh.mjs` - Gossip protocol implementation
  - `dagEventConstructor.mjs` - Event construction
  - `forkDetectionSystem.mjs` - Fork detection and resolution
  - Plus 30+ other production modules

## For Developers

To understand and integrate with Relay Network:

1. **For Testing:** Use files in `/tests/` directory
2. **For API Integration:** See production modules in `/src/backend/`
3. **For Documentation:** See comprehensive guides in `/documentation/`
4. **For Quick Start:** See `/QUICK-START.md` and `/GETTING-STARTED.md`

## Directory Status: CLEANED ✅

This directory now contains only this README. All functional code has been moved to appropriate locations in the project structure, eliminating confusion between demo code and production APIs.
