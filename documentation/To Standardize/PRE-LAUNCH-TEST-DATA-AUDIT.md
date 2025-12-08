# Pre-Launch Test Data Audit and Cleanup Guide

## Overview

This guide outlines the process for auditing and removing test data from the Relay Network blockchain before production launch. All test and production data are stored in the same blockchain for transparency, with test data clearly marked for identification and removal.

## Test Data Identification

All test data in the blockchain is marked with:
- `isTestData: true`
- `testDataSource: 'integrated_demo'` (or other test sources)
- User IDs with test prefixes (e.g., 'demo-user-1')
- Timestamp and metadata indicating test origin

## Audit Endpoints

### 1. Blockchain Summary
**Endpoint**: `GET /api/vote/debug/blockchain-summary`

Provides overview of blockchain contents:
```json
{
  "blockchainSummary": {
    "totalBlocks": 150,
    "totalTransactions": 1200,
    "testDataTransactions": 300,
    "productionTransactions": 900,
    "percentageTestData": "25.00"
  }
}
```

### 2. Test Data Listing
**Endpoint**: `GET /api/vote/debug/test-data`

Lists all test data transactions:
```json
{
  "testDataCount": 300,
  "testTransactions": [
    {
      "blockIndex": 5,
      "transactionId": "uuid-123",
      "type": "vote",
      "data": {
        "isTestData": true,
        "testDataSource": "integrated_demo",
        "userId": "demo-user-1",
        "channelId": "sustainable-cities",
        "candidateId": "ronikatz228"
      }
    }
  ]
}
```

### 3. Complete Pre-Launch Audit
**Endpoint**: `GET /api/vote/admin/pre-launch-audit`

Comprehensive audit report:
```json
{
  "summary": {
    "totalBlocks": 150,
    "blocksWithTestData": 25,
    "totalTestTransactions": 300,
    "testDataSources": ["integrated_demo", "qa_testing"],
    "affectedUserIds": ["demo-user-1", "test-user-2"],
    "affectedChannelIds": ["sustainable-cities", "Local Government"]
  },
  "testTransactions": [...],
  "recommendations": [...]
}
```

## Pre-Launch Verification Process

### Step 1: Initial Audit
1. Call `/api/vote/admin/pre-launch-audit`
2. Review the percentage of test data in the blockchain
3. Verify all test data sources are accounted for
4. Document affected channels and user IDs

### Step 2: Test Data Validation
1. Confirm all test transactions have `isTestData: true`
2. Verify test data sources match expected values
3. Check that no production data is accidentally marked as test data
4. Validate that test user IDs follow expected patterns

### Step 3: Production Data Verification
1. Ensure production transactions have `isTestData: false` or undefined
2. Verify production user authentication and signatures
3. Confirm production vote counts are accurate
4. Validate blockchain integrity

## Test Data Removal Process

**⚠️ CRITICAL**: Test data removal is a destructive operation that cannot be undone. Ensure complete backups before proceeding.

### Option 1: API Endpoint (Recommended)
**Endpoint**: `DELETE /api/vote/admin/remove-test-data`

```bash
curl -X DELETE http://localhost:3002/api/vote/admin/remove-test-data \
  -H "Content-Type: application/json" \
  -d '{"confirmKey": "REMOVE_ALL_TEST_DATA_PERMANENTLY"}'
```

This endpoint will:
1. Create an automatic backup with timestamp
2. Filter out all transactions where `isTestData: true`
3. Rebuild the blockchain with only production data
4. Recalculate block hashes and maintain chain integrity
5. Save the new blockchain to disk

### Option 2: Manual Blockchain Regeneration
1. Export all production transactions (where `isTestData !== true`)
2. Create a new blockchain with only production data
3. Verify integrity of the new blockchain
4. Replace the existing blockchain
5. Run post-removal audit to confirm success

## Post-Removal Verification

### Step 1: Confirm Test Data Removal
1. Call `/api/vote/debug/test-data` - should return zero test transactions
2. Call `/api/vote/debug/blockchain-summary` - should show 0% test data
3. Verify affected channels have accurate vote counts
4. Confirm user vote histories are correct

### Step 2: Blockchain Integrity Check
1. Validate blockchain hash chain
2. Verify all block signatures
3. Confirm transaction timestamps are sequential
4. Check for any orphaned or corrupted data

### Step 3: System Functionality Test
1. Test production voting endpoints
2. Verify real-time vote updates
3. Confirm WebSocket notifications
4. Test all production features

## Rollback Plan

If issues are discovered after test data removal:

1. **Immediate Response**
   - Stop all voting operations
   - Restore from pre-removal backup
   - Notify stakeholders

2. **Investigation**
   - Identify root cause of the issue
   - Determine if rollback resolved the problem
   - Plan corrective actions

3. **Re-attempt**
   - Address identified issues
   - Re-run the removal process
   - Perform additional verification steps

## Security Considerations

- All audit operations should be performed by authorized administrators only
- Audit endpoints should be disabled or secured in production
- Blockchain backups should be encrypted and stored securely
- Test data removal logs should be preserved for compliance

## Timeline Recommendations

- **T-7 days**: Initial audit and test data identification
- **T-3 days**: Complete pre-launch audit and backup creation
- **T-1 day**: Test data removal and verification
- **T-0**: Final verification and production launch
- **T+1 day**: Post-launch monitoring and confirmation

## Emergency Contacts

- Blockchain Administrator: [contact info]
- System Administrator: [contact info]  
- Development Team Lead: [contact info]
- Security Team: [contact info]

---

**Last Updated**: July 5, 2025  
**Version**: 1.0  
**Next Review**: Before production launch

## Current Implementation Status

### ✅ Completed Features
- **Demo Voting Integration**: Test votes flow through production systems with test data markers
- **Blockchain Transparency**: All test and production data stored in same blockchain
- **Vote Switching**: Previous votes properly revoked when users change votes
- **Test Data Flagging**: All test data marked with `isTestData: true` and `testDataSource`
- **Audit Endpoints**: Complete blockchain summary and test data listing
- **Automatic Removal**: Safe test data removal with backup and confirmation
- **Real-time Updates**: Frontend aligned with backend vote state

### 🔧 Fixed Issues
- **500 Errors**: Fixed "Digest already called" error in signature generation
- **Test Data Visibility**: Demo votes now properly marked and visible in audit endpoints
- **Async/Await**: Fixed function call issues in test data generation
- **Blockchain Integration**: Fallback system ensures all test votes recorded in blockchain

### 🧪 Testing
To test the current implementation:

1. **Start Backend**: `npm run dev:backend`
2. **Test Demo Vote**: Use the frontend or run `node test-demo-endpoint.mjs`
3. **Check Audit**: Visit `/api/vote/debug/blockchain-summary`
4. **View Test Data**: Visit `/api/vote/debug/test-data`

### 📊 Test Data Identification
All demo votes are now marked with:
```json
{
  "isTestData": true,
  "testDataSource": "integrated_demo",
  "userId": "demo-user-1",
  "channelId": "sustainable-cities",
  "candidateId": "oriazoulay768",
  "metadata": {
    "demoOnlyVote": true,
    "fallbackUsed": true
  }
}
```
