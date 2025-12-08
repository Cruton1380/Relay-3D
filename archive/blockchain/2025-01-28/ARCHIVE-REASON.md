# Blockchain Services Archive - 2025-01-28

## Archived Files

1. **blockchain-index-legacy.mjs** (originally `src/backend/blockchain/index.mjs`)
   - **Reason**: Legacy blockchain implementation (101 lines)
   - **Replaced by**: `src/backend/blockchain-service/index.mjs` (390 lines)
   - **Status**: Redundant implementation causing confusion

2. **state-blockchain-wrapper.mjs** (originally `src/backend/state/blockchain.mjs`)
   - **Reason**: Wrapper service adding unnecessary complexity (42 lines)
   - **Replaced by**: Direct import of `src/backend/blockchain-service/index.mjs`
   - **Status**: Redundant wrapper layer

## Consolidation Rationale

- **Multiple implementations** were causing confusion and potential conflicts
- **Single source of truth** needed for blockchain operations
- **Maintained functionality** - all features preserved in main implementation
- **Improved maintainability** - one service to maintain instead of three

## Migration Notes

- All imports updated to use `src/backend/blockchain-service/index.mjs`
- No functionality lost - main implementation has all features
- System remains split-ready for production deployment
