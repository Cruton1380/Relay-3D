# Deliverable C: No Hidden Authority - Implementation Complete

**Date:** February 2, 2026  
**Constitutional Principle:** Principle 4 - "All authority is discoverable"  
**Status:** ✅ COMPLETE

## Summary

Deliverable C implements **Principle 4: No Hidden Authority** — the foundational requirement that all authority in Relay must be discoverable, auditable, and provable through explicit commit chains. This prevents hidden privileges, ensures accountability, and makes the system safe for multi-site, multi-role coordination like Avgol's procurement processes.

## What Was Built

### 1. Authority Commit Types (`src/backend/commitTypes/authority.mjs`)

**Purpose:** Define the canonical way to grant and revoke authority.

**Commit Types:**
- `AUTHORITY_GRANT`: Grant capabilities to a user/role for a specific scope
- `AUTHORITY_REVOKE`: Revoke previously granted authority

**Key Features:**
- Scope-based permissions (e.g., `avgol.site.maxwell.procurement`)
- Capability strings (e.g., `STATE_TRANSITION:PURCHASE_ORDER:APPROVE`)
- Temporal authority (optional expiry timestamps)
- Grant chains (every grant references its grantor's authority)
- Custody signatures (all grants must be signed)

**Avgol-Specific Capabilities Defined:**
```javascript
APPROVE_PO: 'STATE_TRANSITION:PURCHASE_ORDER:APPROVE'
COMMIT_PO: 'STATE_TRANSITION:PURCHASE_ORDER:COMMIT'
APPROVE_VENDOR: 'STATE_TRANSITION:VENDOR_MASTER:APPROVE'
ACTIVATE_BOM: 'STATE_TRANSITION:BOM:ACTIVATE'
POST_GR: 'STATE_TRANSITION:GOODS_RECEIPT:POST'
POST_INVOICE: 'STATE_TRANSITION:INVOICE:POST'
AUTHORITY_GRANT: 'AUTHORITY_GRANT:*:*'
AUTHORITY_REVOKE: 'AUTHORITY_REVOKE:*:*'
```

### 2. Authority Resolver (`src/backend/governance/authorityResolver.mjs`)

**Purpose:** Enforce discoverable authority at runtime.

**Core Functions:**
- `resolveAuthority(authority_ref)`: Resolves to capabilities, scope, expiry, and full grant chain
- `hasCapability(authority_ref, capability, scope)`: Checks if authority has required capability
- `registerGrant(commit)`: Adds new grant to the authority store
- `registerRevoke(commit)`: Revokes a grant
- `getGrantsForUser(user_id)`: Lists all grants for a user
- `bootstrapRootAuthority(custodian_id)`: Creates initial root authority

**Key Mechanisms:**
- **In-memory authority store** (Map: grantee_id → grant commits)
- **Revocation tracking** (Set: revoked grant IDs)
- **Chain validation** (recursive check up to root authority)
- **Wildcard matching** (`AUTHORITY_GRANT:*:*` matches all grant capabilities)
- **Scope inheritance** (grants can apply to parent scopes, e.g., `avgol.*`)

### 3. Authority API Routes (`src/backend/routes/authority.mjs`)

**Purpose:** Expose authority resolution and management as REST endpoints.

**Endpoints:**

#### Query Endpoints (Read-only)
- `GET /api/authority/:authorityRef/resolve`  
  Resolve an authority reference to capabilities and grant chain.
  
- `GET /api/authority/can?user=<id>&cap=<capability>&scope=<scope>`  
  Check if a user has a specific capability in a scope.
  
- `GET /api/authority/grants?user=<id>`  
  List all grants for a user.
  
- `GET /api/authority/capabilities`  
  List all defined capabilities (including Avgol presets).

#### Management Endpoints (Require authority)
- `POST /api/authority/grant`  
  Grant authority to a user (requires `AUTHORITY_GRANT` capability).
  
  **Body:**
  ```json
  {
    "scope": "avgol.site.maxwell.procurement",
    "capabilities": ["STATE_TRANSITION:PURCHASE_ORDER:APPROVE"],
    "grantee_id": "user:avgol:procurement:maxwell",
    "grantor_authority_ref": "user:root",
    "expires_at_ms": 1735689600000,
    "signature": "..."
  }
  ```

- `POST /api/authority/revoke`  
  Revoke a previously granted authority (requires `AUTHORITY_REVOKE` capability).
  
  **Body:**
  ```json
  {
    "grant_commit_id": "commit_grant_12345",
    "revoker_authority_ref": "user:root",
    "reason": "Role change",
    "signature": "..."
  }
  ```

### 4. State Transition Authority Validation

**Updated:** `src/backend/commitTypes/stateTransition.mjs`

**New Function:**
- `validateTransitionAuthority(commit)`: Checks if the `authority_ref` in a `STATE_TRANSITION` commit has the required capability.

**Integration:**
- Every `STATE_TRANSITION` now requires authority to be discoverable.
- Transitions fail with `403 AUTHORITY_NOT_DISCOVERABLE` if authority cannot be resolved.
- Personal transitions (e.g., `DRAFT → HOLD`) bypass authority checks.

**Updated:** `src/backend/routes/commitBoundary.mjs`

**Change:** Added authority validation before accepting state transitions:
```javascript
const authValidation = validateTransitionAuthority(tempCommit);
if (!authValidation.authorized) {
  return res.status(403).json({
    error: 'AUTHORITY_NOT_DISCOVERABLE',
    message: authValidation.reason,
    constitutional_violation: 'Principle 4: All authority is discoverable'
  });
}
```

### 5. Authority Explorer Panel (Frontend UI)

**Created:** `src/frontend/components/governance/AuthorityExplorerPanel.jsx`

**Purpose:** Make authority visible and auditable for users.

**Features:**
- **Query Type Selector:**
  - "Can User...?" — Check if a user has a capability
  - "Resolve Authority" — Resolve an authority ref to capabilities
  - "List Grants" — Show all grants for a user

- **Avgol Preset Capabilities:**
  - Quick-select buttons for common capabilities (PO Approve, Vendor Approve, etc.)

- **Visual Grant Chains:**
  - Shows full delegation path: grant → grantor → root
  - Displays effective windows (start/expiry timestamps)
  - Highlights expired/revoked grants

- **Authorization Status Display:**
  - ✓ AUTHORIZED (green) or ✗ DENIED (red)
  - Shows reason for denial
  - Lists granted capabilities vs. required capability

**Created:** `src/frontend/components/governance/AuthorityExplorerPanel.css`

**Styling:** Dark theme matching Relay's visual identity, with:
- Green for authorized/valid states
- Red for denied/invalid states
- Monospace font for technical identifiers (commit IDs, capabilities)
- Hover effects and smooth transitions

## Constitutional Guarantees

With Deliverable C complete, Relay now enforces:

1. **No hidden authority:** All permissions are explicit commits in history.
2. **Provable delegation:** Every grant chain is auditable back to root authority.
3. **Temporal authority:** Grants can expire automatically.
4. **Revocation is visible:** Revoked grants remain in history with revocation commits.
5. **Scope-based access:** Authority is scoped (e.g., site-specific, not global by default).
6. **Capability-based control:** Fine-grained permissions (not just "admin" vs "user").

## How This Enables Avgol Procurement

With authority now discoverable and enforceable, we can safely implement:

### Avgol Procurement Roles (Examples)
- **Maxwell Site Procurement Manager:**  
  Scope: `avgol.site.maxwell.procurement`  
  Capabilities: `STATE_TRANSITION:PURCHASE_ORDER:APPROVE`, `STATE_TRANSITION:VENDOR_MASTER:APPROVE`

- **China Site Procurement Specialist:**  
  Scope: `avgol.site.china.procurement`  
  Capabilities: `STATE_TRANSITION:PURCHASE_ORDER:PROPOSE`

- **Global Procurement Director:**  
  Scope: `avgol.*.procurement`  
  Capabilities: `STATE_TRANSITION:PURCHASE_ORDER:COMMIT`, `STATE_TRANSITION:BOM:ACTIVATE`

- **Root Custodian (Alexandra/IT):**  
  Scope: `avgol.*`  
  Capabilities: `AUTHORITY_GRANT:*:*`, `AUTHORITY_REVOKE:*:*`

### Next Steps (Procurement Commits)
Now that authority is enforceable, the next implementation phase will add:
- `VENDOR_MASTER_SET` / `VENDOR_APPROVED_SET`
- `PO_CREATED`, `PO_LINE_ADDED`, `PO_APPROVAL_REQUESTED`, `PO_APPROVED`
- `QUOTE_ATTACHED`
- `GR_POSTED`, `INVOICE_POSTED`
- `EXCEPTION_LOGGED` (missing quotes/docs/BOM refs)

These commits will enable provable KPI calculations:
- **Approval cycle time:** `VERIFIED` if timestamps exist
- **Compliance rate:** `INDETERMINATE` when evidence missing
- **% spend under approved vendors:** depends on vendor approval commits

## Testing Requirements

### Unit Tests (Recommended)
1. **Grant without AUTHORITY_GRANT capability → 403**
2. **Revoke without AUTHORITY_REVOKE capability → 403**
3. **STATE_TRANSITION with fake authority_ref → 403 AUTHORITY_NOT_DISCOVERABLE**
4. **STATE_TRANSITION with real authority but missing capability → 403 AUTHORITY_CAPABILITY_MISSING**
5. **Expired grant → 403 AUTHORITY_EXPIRED**
6. **Revoked grant → 403 AUTHORITY_REVOKED**
7. **Wildcard grant (`AUTHORITY_GRANT:*:*`) matches specific grant request**
8. **Scope inheritance (`avgol.*`) allows access to `avgol.site.maxwell`**

### Integration Test (End-to-End)
1. Bootstrap root authority
2. Root grants `AUTHORITY_GRANT` to admin
3. Admin grants `STATE_TRANSITION:PURCHASE_ORDER:APPROVE` to procurement manager
4. Procurement manager attempts `STATE_TRANSITION` (PO: PROPOSE → APPROVE)
5. Verify:
   - Authority chain resolves correctly
   - Transition succeeds
   - Grant chain is visible in `/api/authority/can` response

## Files Created/Modified

### Backend
- ✅ `src/backend/commitTypes/authority.mjs` (CREATED)
- ✅ `src/backend/governance/authorityResolver.mjs` (CREATED)
- ✅ `src/backend/routes/authority.mjs` (CREATED)
- ✅ `src/backend/commitTypes/stateTransition.mjs` (MODIFIED - added authority validation)
- ✅ `src/backend/routes/commitBoundary.mjs` (MODIFIED - integrated authority checks)
- ✅ `src/backend/routes/index.mjs` (MODIFIED - registered authority routes)

### Frontend
- ✅ `src/frontend/components/governance/AuthorityExplorerPanel.jsx` (CREATED)
- ✅ `src/frontend/components/governance/AuthorityExplorerPanel.css` (CREATED)

### Documentation
- ✅ `DELIVERABLE-C-NO-HIDDEN-AUTHORITY-COMPLETE.md` (this file)

## Storage Model (Current Implementation)

**In-Memory (Demo):**
- `authorityGrants`: Map (grantee_id → array of grant commits)
- `revokedGrants`: Set (grant_commit_ids that are revoked)

**Production Transition:**
For production, replace with:
- **Git-backed:** Grants stored as commits in Canon repo
- **JSONL append-only log:** One grant per line, indexed by grantee_id
- **Database (optional):** Indexed table with `grantee_id`, `scope`, `capabilities`, `expires_at_ms`, `revoked_at_ms`

All storage implementations must preserve:
- Append-only history
- Full grant chain provenance
- Revocation visibility (not deletion)

## What's Next

### Immediate (Next Sprint)
**Avgol Procurement Commits:**
- Define commit types for vendor, PO, GR, invoice events
- Implement KPI calculation based on these commits
- Add integration tests for procurement workflows

### Phase 2 (After Procurement)
**Authority Enhancements:**
- **Time-limited delegation:** Auto-revoke after X days
- **Conditional grants:** Grant only if certain evidence exists
- **Multi-signature grants:** Require co-signers for sensitive capabilities
- **Audit logs:** Stream authority changes to audit endpoint

## Sign-Off

Deliverable C: No Hidden Authority is **constitutionally complete**.

All authority in Relay is now:
- ✅ Discoverable (can be queried via API)
- ✅ Auditable (full grant chain visible)
- ✅ Enforceable (state transitions fail without valid authority)
- ✅ Revocable (grants can be revoked without deletion)
- ✅ Scoped (authority is limited to specific domains)
- ✅ Provable (every grant traces back to root authority)

---

**Ready for:** Avgol procurement commit implementation and KPI tracking.
