# Procurement Lifecycle as Filaments

**Core Principle:** The lifecycle is the product. PO/delivery/invoice/match are not "documents" — they are governed filament chains with irreversible state gates.

---

## **Six Core Filament Types:**

### **1. `po.<id>` — Purchase Order Contract Filament**

**What it is:** The authoritative PO contract that evolves through approvals, sending, amendments, and closure.

**+X (Output/Current State):**
```javascript
{
  poId: string,
  vendor: {
    id: string,
    name: string,
    contact: string
  },
  buyer: {
    userId: string,
    name: string,
    department: string
  },
  terms: {
    paymentTerms: string,        // "Net 30", "2/10 Net 30"
    incoterms: string,            // "FOB", "CIF", "DDP"
    currency: string,             // "USD", "EUR"
    shipTo: {
      location: string,
      address: string
    }
  },
  lines: [
    {
      lineId: string,
      itemId: string,
      description: string,
      qty: number,
      uom: string,                // "EA", "KG", "M"
      unitPrice: number,
      totalPrice: number
    }
  ],
  totals: {
    subtotal: number,
    tax: number,
    shipping: number,
    total: number
  },
  dates: {
    created: timestamp,
    approved: timestamp | null,
    sent: timestamp | null,
    expectedDelivery: timestamp,
    closed: timestamp | null
  },
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "MATCHED" | "CLOSED"
}
```

**-Z (Evidence/Identity):**
```javascript
{
  approvals: [
    {
      approverId: string,
      timestamp: timestamp,
      commitIndex: number,
      evidence: "signature" | "automated" | "delegated"
    }
  ],
  vendorMaster: {
    vendorFilamentId: string,   // Reference to vendor.<id> filament
    qualificationEvidence: string
  },
  budgetCheck: {
    budgetFilamentId: string,
    approved: boolean,
    availableAmount: number,
    evidence: string
  },
  policyCompliance: {
    policyFilamentId: string,
    checks: [
      { rule: string, passed: boolean, evidence: string }
    ]
  },
  attachments: [
    { type: "quote", artifactPointer: string },
    { type: "specification", artifactPointer: string }
  ]
}
```

**-Y (Magnitude/Confidence):**
```javascript
{
  confidence: {
    vendorReliability: number,   // 0-1 score
    deliveryRisk: number,         // 0-1 score
    priceVolatility: number       // 0-1 score
  },
  businessImpact: {
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    projectImpact: string
  }
}
```

**Allowed Glyphs:**
- **STAMP** = Approval commit (by approver)
- **GATE** = Approval required before "send" (governance block)
- **SCAR** = Amendment after sent (with explicit trace of what changed)
- **TWIST** = Currency/price adjustment (market-driven)
- **SPLIT** = Multi-vendor PO (references multiple vendor filaments)

**State Gates (Irreversible):**
```
DRAFT → (STAMP) → PENDING_APPROVAL → (GATE pass) → APPROVED → (send) → SENT
SENT → (partial receipt) → PARTIALLY_RECEIVED → (full receipt) → RECEIVED
RECEIVED → (match) → MATCHED → (payment) → CLOSED
```

---

### **2. `delivery.<id>` or `shipment.<id>` — Physical Movement Filament**

**What it is:** Real-time tracking of goods in transit.

**+X (Output/Current State):**
```javascript
{
  deliveryId: string,
  poReference: {
    poFilamentId: string,
    poLineIds: string[]          // Which PO lines this delivery covers
  },
  carrier: {
    name: string,
    trackingNumber: string,
    scac: string                 // Standard Carrier Alpha Code
  },
  milestones: [
    {
      event: "SHIPPED" | "IN_TRANSIT" | "CUSTOMS" | "OUT_FOR_DELIVERY" | "DELIVERED",
      timestamp: timestamp,
      location: string,
      evidence: string            // Scan, photo, signature
    }
  ],
  quantities: [
    { lineId: string, qtyShipped: number, uom: string }
  ],
  status: "SCHEDULED" | "SHIPPED" | "IN_TRANSIT" | "DELAYED" | "DELIVERED" | "EXCEPTION"
}
```

**-Z (Evidence/Identity):**
```javascript
{
  asn: {                         // Advanced Shipping Notice
    ediPointer: string,
    parsedData: object
  },
  carrierDocs: [
    { type: "BOL", artifactPointer: string },  // Bill of Lading
    { type: "PACKING_LIST", artifactPointer: string }
  ],
  iotScans: [
    { timestamp: timestamp, location: gps, sensor: "temp" | "humidity", value: number }
  ],
  photos: [
    { timestamp: timestamp, artifactPointer: string, description: string }
  ]
}
```

**Allowed Glyphs:**
- **KINK** = Delay event (carrier delay, customs hold)
- **DENT** = Damage reported during transit
- **SPLIT** = Partial shipment (backorder scenario)

---

### **3. `receipt.<id>` (GR) — Goods Receipt Filament**

**What it is:** The physical arrival event (warehouse receiving).

**+X (Output/Current State):**
```javascript
{
  receiptId: string,
  poReference: {
    poFilamentId: string,
    poLineIds: string[]
  },
  deliveryReference: {
    deliveryFilamentId: string | null
  },
  receiving: {
    location: string,
    timestamp: timestamp,
    receivedBy: {
      userId: string,
      name: string
    }
  },
  lines: [
    {
      lineId: string,
      qtyOrdered: number,
      qtyReceived: number,
      qtyRejected: number,
      condition: "GOOD" | "DAMAGED" | "INCORRECT" | "PARTIAL",
      notes: string
    }
  ],
  exceptions: [
    {
      lineId: string,
      type: "QTY_VARIANCE" | "DAMAGE" | "WRONG_ITEM",
      description: string,
      evidence: string
    }
  ],
  status: "RECEIVING" | "INSPECTING" | "ACCEPTED" | "REJECTED" | "PARTIAL_ACCEPT"
}
```

**-Z (Evidence/Identity):**
```javascript
{
  warehouseScan: {
    barcodes: string[],
    scanTimestamps: timestamp[],
    scannerDeviceId: string
  },
  receivingChecklist: [
    { check: string, passed: boolean, inspector: string }
  ],
  photos: [
    { type: "condition", artifactPointer: string, timestamp: timestamp }
  ],
  qualityInspection: {
    inspectorId: string,
    passed: boolean,
    notes: string,
    evidence: string
  }
}
```

**Allowed Glyphs:**
- **DENT** = Damage discovered at receiving
- **KINK** = Quantity shortage discovered
- **SPLIT** = Partial acceptance (reject damaged, accept good units)

---

### **4. `invoice.<id>` — Vendor Claim Filament**

**What it is:** The vendor's claim for payment.

**+X (Output/Current State):**
```javascript
{
  invoiceId: string,
  vendorInvoiceNumber: string,
  poReference: {
    poFilamentId: string,
    poLineIds: string[]
  },
  vendor: {
    vendorId: string,
    name: string,
    taxId: string
  },
  lines: [
    {
      lineId: string,
      description: string,
      qty: number,
      unitPrice: number,
      lineTotal: number
    }
  ],
  taxes: [
    { type: "VAT" | "GST" | "SALES_TAX", rate: number, amount: number }
  ],
  totals: {
    subtotal: number,
    tax: number,
    shipping: number,
    total: number
  },
  dates: {
    invoiceDate: timestamp,
    dueDate: timestamp,
    received: timestamp
  },
  paymentTerms: string,
  status: "RECEIVED" | "PENDING_MATCH" | "MATCHED" | "APPROVED" | "PAID" | "DISPUTED"
}
```

**-Z (Evidence/Identity):**
```javascript
{
  sourceDocs: [
    { type: "PDF", artifactPointer: string },
    { type: "EDI_850", artifactPointer: string, ediStandard: "X12" | "EDIFACT" }
  ],
  vendorAuth: {
    signature: string | null,
    digitalSignature: string | null,
    authMethod: "email" | "portal" | "edi"
  },
  taxRules: {
    jurisdiction: string,
    taxRateReference: string,
    calculationEvidence: string
  },
  normalization: [
    {
      step: "CURRENCY_CONVERSION" | "TAX_CALC" | "LINE_MAPPING",
      evidence: string,
      timestamp: timestamp
    }
  ]
}
```

**Allowed Glyphs:**
- **TWIST** = Currency conversion applied
- **SCAR** = Credit memo issued (correction)
- **SPLIT** = Partial billing (milestone billing scenario)

---

### **5. `match.<poId>` — Reconciliation Truth Filament** 🔥

**CRITICAL:** This is NOT a query. This is a **governed filament** that locks the truth of the match.

**What it is:** The authoritative record of whether PO + Receipt + Invoice align.

**+X (Output/Current State):**
```javascript
{
  matchId: string,
  poReference: {
    poFilamentId: string,
    poTotal: number
  },
  receiptReferences: [
    { receiptFilamentId: string, totalReceived: number }
  ],
  invoiceReferences: [
    { invoiceFilamentId: string, totalInvoiced: number }
  ],
  variances: [
    {
      type: "QTY_VARIANCE" | "PRICE_VARIANCE" | "TAX_VARIANCE" | "SHIPPING_VARIANCE",
      poLineId: string,
      expected: number,
      actual: number,
      delta: number,
      deltaPercent: number
    }
  ],
  tolerances: {
    qtyTolerance: number,        // % allowed variance
    priceTolerance: number,      // % allowed variance
    totalTolerance: number       // $ allowed variance
  },
  matchState: "PASS" | "FAIL" | "OVERRIDE" | "DISPUTE(branch)" | "RESOLVED",
  resolution: {
    type: "AUTO_PASS" | "MANUAL_OVERRIDE" | "CREDIT_MEMO" | "WRITE_OFF" | "DISPUTE",
    approvedBy: string | null,
    timestamp: timestamp | null,
    evidence: string | null
  },
  status: "PENDING" | "MATCHED" | "EXCEPTION" | "DISPUTED" | "RESOLVED" | "CLOSED"
}
```

**-Z (Evidence/Identity):**
```javascript
{
  matchPolicy: {
    policyFilamentId: string,
    rules: [
      { rule: string, threshold: number, evidence: string }
    ]
  },
  approvals: [
    {
      approverRole: "FINANCE" | "OPS" | "MANAGER",
      userId: string,
      action: "APPROVE" | "REJECT" | "ESCALATE",
      timestamp: timestamp,
      evidence: string
    }
  ],
  disputeEvidence: [
    {
      partyRole: "FINANCE" | "OPS" | "VENDOR",
      claim: string,
      evidence: string,
      timestamp: timestamp
    }
  ]
}
```

**-X (Inputs - References):**
```javascript
{
  poSnapshot: {
    poFilamentId: string,
    commitIndex: number,         // Which version of PO
    lines: [...]
  },
  receiptSnapshot: {
    receiptFilamentId: string,
    commitIndex: number,
    lines: [...]
  },
  invoiceSnapshot: {
    invoiceFilamentId: string,
    commitIndex: number,
    lines: [...]
  }
}
```

**Allowed Glyphs:**
- **GATE** = Blocks payment until pass/override
- **SPLIT** = Dispute branch (Ops branch vs Finance branch)
- **SCAR** = Resolved dispute (credit memo applied, variance accepted)
- **UNTWIST** = Dispute resolved (branches merged)

**State Gates:**
```
PENDING → (3-way match) → MATCHED (if pass) | EXCEPTION (if fail)
EXCEPTION → (manual review) → OVERRIDE (approved) | DISPUTE (rejected)
DISPUTE → (SPLIT) → [OPS_BRANCH, FINANCE_BRANCH] → (SCAR) → RESOLVED → CLOSED
```

---

### **6. `ledger.<entryId>` — Accounting Pairs (Locked Filaments)** 🔒

**CRITICAL:** Accounting is pairs. A posting event locks two (or more) filaments together.

**What it is:** A debit or credit leg of a double-entry posting.

**+X (Output/Current State):**
```javascript
{
  entryId: string,
  postingEventId: string,       // All legs share same postingEventId (lock)
  leg: "DEBIT" | "CREDIT",
  account: {
    accountCode: string,         // "1200" (Inventory), "2000" (AP)
    accountName: string,
    accountType: "ASSET" | "LIABILITY" | "EXPENSE" | "REVENUE" | "EQUITY"
  },
  amount: number,
  currency: string,
  entity: {
    entityId: string,            // Legal entity
    costCenter: string,
    department: string
  },
  dates: {
    postingDate: timestamp,
    effectiveDate: timestamp
  },
  status: "DRAFT" | "POSTED" | "REVERSED"
}
```

**-Z (Evidence/Identity):**
```javascript
{
  sourceDocuments: [
    { type: "INVOICE", filamentId: string, commitIndex: number },
    { type: "RECEIPT", filamentId: string, commitIndex: number },
    { type: "MATCH", filamentId: string, commitIndex: number }
  ],
  postingEvidence: {
    userId: string,
    timestamp: timestamp,
    tool: string,
    batchId: string | null
  },
  lockedWith: string[],          // Other entryIds in same posting (lock proof)
  reversalOf: string | null      // If this reverses another entry
}
```

**Posting Lock Invariant:**
```javascript
// All legs of a posting must:
// 1. Share the same postingEventId
// 2. Have sum(DEBIT amounts) === sum(CREDIT amounts)
// 3. Reference each other in lockedWith array
// 4. Exist at the same commitIndex or none exist

Example posting bundle for AP invoice:
ledger.ap-12345      (CREDIT, account 2000, $1000)
ledger.expense-12345 (DEBIT,  account 5000, $900)
ledger.tax-12345     (DEBIT,  account 5100, $100)

All three have postingEventId: "posting-12345"
All three reference each other in lockedWith[]
```

**Allowed Glyphs:**
- **STAMP** = Posted (finalized)
- **SCAR** = Reversal (with explicit reason)
- **GATE** = Requires approval before posting (period close, amount threshold)

---

## **Flow Example: Simple 3-Way Match**

### **Step 1: Create PO**
```
User action: Fill out PO form (feels like Excel)
Backend: Appends commits to po.PO001
Glyphs: STAMP (approval), GATE (budget check), publish commit (send to vendor)
```

### **Step 2: Goods Shipped**
```
Vendor action: Create ASN (Advanced Shipping Notice)
Backend: Creates delivery.DEL001 filament referencing po.PO001
Carrier updates: Append milestone commits (SHIPPED, IN_TRANSIT, DELIVERED)
```

### **Step 3: Goods Received**
```
Warehouse action: Scan barcodes, confirm quantities
Backend: Creates receipt.REC001 filament referencing po.PO001 and delivery.DEL001
Partial receipt? No problem — that's just reality (not "dirty data")
Glyphs: DENT (if damage), SPLIT (if partial accept)
```

### **Step 4: Invoice Arrives**
```
Vendor action: Sends invoice (PDF or EDI)
Backend: Creates invoice.INV001 filament
Normalization commits: Currency conversion, tax calc (evidence preserved)
```

### **Step 5: 3-Way Match (The Key Move)**
```
System action: Creates match.MATCH001 filament
Inputs (-X): Snapshots of po.PO001, receipt.REC001, invoice.INV001 at specific commitIndex
Output (+X): Variance analysis, matchState
Evidence (-Z): Policy rules, tolerances

If PASS: GATE opens → payment authorized
If FAIL: Exception → manual review
If DISPUTE: SPLIT → Finance branch vs Ops branch
```

### **Step 6: Post to Ledger**
```
System action: Creates locked posting bundle
ledger.ap-001    (CREDIT, AP account, $1000)
ledger.inv-001   (DEBIT, Inventory, $1000)

Lock proof: Both reference postingEventId, both exist at same commitIndex
Evidence: References match.MATCH001 (proof of 3-way match)
```

### **Step 7: Payment**
```
Payment action: Append payment commit to invoice.INV001
Ledger action: Create locked posting bundle for cash disbursement
Close action: Append close commit to po.PO001, match.MATCH001
```

---

## **What UI Feels Like (Endpoint Lens)**

Users never see "filaments" or "commits." They see:

1. **PO Creation Screen** (Excel-like or ERP form)
   - Feels like: Editing a familiar PO document
   - Reality: Appending commits to po.<id>

2. **Receiving Screen** (mobile or desktop)
   - Feels like: Checking off items on a packing slip
   - Reality: Appending commits to receipt.<id>

3. **Invoice Entry** (OCR or manual)
   - Feels like: Data entry form
   - Reality: Appending commits to invoice.<id>

4. **Reconciliation Dashboard**
   - Feels like: 3-way match report with approve/reject buttons
   - Reality: Viewing match.<id> state + appending approval commits

5. **Accounting Journal**
   - Feels like: Traditional journal entry screen
   - Reality: Viewing/creating ledger.<id> locked posting bundles

---

## **Key Invariants (Locked):**

1. **Match is NOT a query** — it's a governed filament with state gates
2. **Accounting pairs are locked filaments** — all legs exist at same commitIndex or none do
3. **Lifecycle is irreversible** — state gates enforce forward-only flow (amendments use SCAR)
4. **Evidence is mandatory** — every state transition has evidence pointers
5. **Partial/exception is normal** — not "dirty data," just reality (KINK, DENT, SPLIT glyphs)

---

## **Next Proof Recommendation:**

### **Proof 6: Mini PO Flow** (`/proof/po-flow`)

**What to prove:**
- Create simple PO (2 lines)
- Simulate partial receipt (1 line received)
- Simulate invoice (full invoice)
- Auto-create match filament
- Show variance (qty mismatch)
- Approve override
- Show linked filaments in 3D

**Why this matters:**
- Proves multi-filament orchestration
- Proves state gates work
- Proves match-as-filament (not query)
- Proves accounting pairs lock
- Shows end-to-end causality

**Complexity:** Medium-High (involves 4-5 filaments working together)

---

**Status:** Specification complete. Ready to build proof.
