# Relay Civilization Template Library — CIV-TEMPLATES-0

**Companion document to [RELAY-MASTER-BUILD-PLAN.md](RELAY-MASTER-BUILD-PLAN.md) §76.**

A standard catalog of civilization-grade templates that instantiate real life without inventing new physics. Every template uses the same six universal filament domains (identity, counterparty, time, magnitude, evidence, lifecycle) and the same ten universal equations. What varies per domain is the branch structure, filament types, evidence rules, consolidation gates, and disclosure defaults.

---

## 0. Library Index Format

Every template entry in this library follows a standardized index card:

| Field | Description |
|-------|-------------|
| **TemplateId** | `template.<domain>.<variant>` — globally unique identifier |
| **Tree archetype** | `person` \| `family` \| `property` \| `facility` \| `org` \| `city` \| `system` |
| **Canonical branches** | `servicePath` list — the default branch hierarchy |
| **Filament types** | `objectType` list + left/right block schema |
| **Evidence rules** | What constitutes proof (`orgConfidence` requirements) |
| **Timebox cadence** | Default period (`day` \| `week` \| `sprint` \| `month` \| `quarter`) |
| **Sinking mode** | `earth-time` \| `milestone` \| `none` |
| **Consolidation gate** | What "absorbed" (reconciled/sealed) means in this domain |
| **Disclosure defaults** | Tier rules per branch and per filament |
| **Meta-vote hooks** | Which parameters and eligibility rules are governed via §72 layered option governance |

Machine-readable JSON stubs live in `config/templates/template.<domain>.v1.json` and follow the §21.2 `TreeTemplate` schema.

---

## 1. The 13 Civilization Pillars (v1)

### 1.1 PERSON-0 — Personal Responsibility Mirror

| Field | Value |
|-------|-------|
| TemplateId | `template.person.v1` |
| Tree archetype | `person` |
| Canonical branches | `roles`, `learning`, `health`, `economic`, `social`, `arena`, `attention` |
| Filament types | `COMMIT`, `VOTE`, `NOTE`, `ACHIEVEMENT`, `CONSENT_GRANT`, `PREFERENCE` |
| Evidence rules | Self-attested for Tier 0; SCV-validated for Tier 1+; counterparty-confirmed for economic |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | Personal reflection — no mandatory balance; economic branch uses `financial-balance` |
| Disclosure defaults | Tier 0 (private) by default; user raises per branch/filament |
| Meta-vote hooks | Profile categories (§8.6), arena loadout presets, tutorial preferences |

Already exists conceptually in §8. This template formalizes it as a machine-readable configuration.

---

### 1.2 FAMILY-0 — Guardianship, Dependents & Household Obligations

| Field | Value |
|-------|-------|
| TemplateId | `template.family.v1` |
| Tree archetype | `family` |
| Canonical branches | `joint-finances`, `property`, `children`, `inheritance`, `shared-decisions`, `medical` |
| Filament types | `HOUSEHOLD_EXPENSE`, `PROPERTY_REF`, `CHILD_EVENT`, `INHERITANCE_DESIGNATION`, `GOVERNANCE_COMMIT` |
| Evidence rules | Dual-consent for shared branches; child branches require parental attestation (§63) |
| Timebox cadence | `week` |
| Sinking mode | `earth-time` |
| Consolidation gate | Shared governance — both partners must approve epoch seal on shared branches |
| Disclosure defaults | Tier 0 by default; aggregate household health visible at Tier 1 to extended family with consent |
| Meta-vote hooks | Household budget categories, inheritance rules, dissolution governance terms |

Sensitive private details are never exposed by default. Aggregate branch shape (thick = active, wilting = neglected) is the only signal visible at higher tiers.

---

### 1.3 PROPERTY-0 — Parcels, Buildings, Titles & Permits

| Field | Value |
|-------|-------|
| TemplateId | `template.property.v1` |
| Tree archetype | `property` |
| Canonical branches | `title.ownership`, `title.encumbrances`, `zoning.rules`, `tax.assessment`, `boundary.survey`, `permits`, `inspections`, `construction.phases`, `maintenance.schedule`, `utilities.connections`, `insurance.policies`, `incidents` |
| Filament types | `TITLE_TRANSFER`, `ENCUMBRANCE`, `PERMIT`, `INSPECTION`, `DAMAGE_REPORT`, `WORK_ORDER`, `TAX_ASSESSMENT` |
| Evidence rules | Title transfer: notarized deed hash + authority signature + payment settlement. Permit: licensed professional + municipal approval. Inspection: inspector responsibility + findings hash. |
| Timebox cadence | `week` |
| Sinking mode | `earth-time` |
| Consolidation gate | `financial-balance` — title chain consistent, encumbrance legs balanced, authority signatures verified |
| Disclosure defaults | Tier 1 (shapes visible); Tier 2 for authority filings; Tier 0 for personal financial details |
| Meta-vote hooks | Zoning rule parameters, permit fee schedules, inspection frequency requirements |

Full deep-dive in Section 4 below. JSON stub at `config/templates/template.property.v1.json`.

---

### 1.4 HEALTH-0 — Patient Record, Provider Record & Facility Operations

| Field | Value |
|-------|-------|
| TemplateId | `template.health.v1` |
| Tree archetype | `person` (patient), `facility` (hospital/clinic), `org` (provider) |
| Canonical branches | **Patient:** `health.timeline`, `health.conditions`, `health.medications`, `health.labResults`, `health.imaging`, `health.procedures`, `health.insuranceClaims`, `health.consent`, `health.breakGlass`. **Facility:** `ops.triage`, `ops.capacity`, `ops.incidents`, `ops.inventory`, `ops.compliance`. **Provider:** `license.attestations`, `cases.participated`, `outcomes.audit`, `breakGlass.actions`. |
| Filament types | `CLINICAL_EVENT`, `LAB_RESULT`, `PRESCRIPTION`, `PROCEDURE`, `INSURANCE_CLAIM`, `CONSENT_GRANT`, `BREAKGLASS_EVENT` |
| Evidence rules | Lab: instrument attestation + chain-of-custody + technician responsibility. Prescription: licensed prescriber + consent + fill confirmation. Break-glass: always creates scar on accessor tree, justification required within window. |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — complete evidence for event type, locked consent state, immutable hash anchors |
| Disclosure defaults | Tier 2 (strict) by default — aggregate branch shape at Tier 1; filament content at Tier 2 only with explicit consent |
| Meta-vote hooks | Clinical protocol requirements, break-glass justification windows, consent scope templates |

Full deep-dive in Section 3 below. JSON stub at `config/templates/template.health.v1.json`.

---

### 1.5 EDU-0 — Courses as Trees, Curricula as Projections

| Field | Value |
|-------|-------|
| TemplateId | `template.education.v1` |
| Tree archetype | `org` |
| Canonical branches | `curriculum`, `courses`, `students`, `teachers`, `grading`, `certification`, `community-review` |
| Filament types | `COURSE_MODULE`, `LESSON`, `ASSESSMENT`, `GRADE_COMMIT`, `CERTIFICATION_COMMIT`, `TEACHER_EVAL` |
| Evidence rules | Grading: sortition peer-review jury (§58.11). Certification: high-confidence teacher + community-verified curriculum. Teacher eval: student clarity votes + outcome tracking. |
| Timebox cadence | `week` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — all module assessments committed, teacher attestations verified |
| Disclosure defaults | Tier 1 (course structure public); Tier 2 for student grades (student controls); Tier 0 for draft work |
| Meta-vote hooks | Curriculum contents (§72), teacher qualification requirements, grading rubric parameters, certification thresholds |

Closely integrated with §58 (Education) and §73 (Universal Onboarding tutorial master list).

---

### 1.6 CIVIL-EMERGENCY-0 — Police, Fire, EMS Dispatch & Incident Timelines

| Field | Value |
|-------|-------|
| TemplateId | `template.emergency.v1` |
| Tree archetype | `city` |
| Canonical branches | `alerts`, `dispatch`, `units`, `response-tracking`, `after-action-review`, `resource-costs` |
| Filament types | `CIVIC_ALERT`, `DISPATCH_ORDER`, `UNIT_STATUS`, `RESPONSE_LOG`, `AFTER_ACTION_REPORT`, `RESOURCE_COST` |
| Evidence rules | Alert: reporter confidence + evidence refs. Dispatch: deterministic cost function output. Response: unit GPS trail + responder attestation. After-action: multi-party review. |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — incident timeline closed, all units returned, after-action committed |
| Disclosure defaults | Tier 2 (public) for aggregate dispatch data; Tier 1 for unit identities; Tier 0 for victim/patient details |
| Meta-vote hooks | CAC allocation rates, dispatch priority weights, degraded-mode thresholds |

Closely integrated with §74 (Traffic & Civic Response Module).

---

### 1.7 INFRA-0 — Roads, Utilities, Water, Power, Telecom

| Field | Value |
|-------|-------|
| TemplateId | `template.infrastructure.v1` |
| Tree archetype | `system` |
| Canonical branches | `roads`, `water`, `power`, `telecom`, `maintenance`, `outages`, `inspections`, `capacity` |
| Filament types | `MAINTENANCE_EVENT`, `OUTAGE_REPORT`, `CAPACITY_READING`, `INSPECTION`, `REPAIR_ORDER`, `UPGRADE_PROJECT` |
| Evidence rules | Maintenance: work crew responsibility + photo/sensor evidence. Outage: automated sensor + manual confirmation. Capacity: instrument readings + calibration attestation. |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — all open work orders resolved or deferred with justification |
| Disclosure defaults | Tier 2 (fully public) — infrastructure health is civic information |
| Meta-vote hooks | Maintenance frequency, capacity thresholds, upgrade priority rankings |

Each utility type (water, power, telecom) can be a sub-template with domain-specific filament schemas.

---

### 1.8 AGRI-0 — Farms, Inputs/Outputs, Inspections & Traceability

| Field | Value |
|-------|-------|
| TemplateId | `template.agriculture.v1` |
| Tree archetype | `org` |
| Canonical branches | `soil-health`, `crop-cycles`, `water-inputs`, `fertilizer-bom`, `harvest-outputs`, `inspections`, `certifications`, `recalls` |
| Filament types | `SOIL_TEST`, `PLANTING_EVENT`, `IRRIGATION_LOG`, `FERTILIZER_APPLICATION`, `HARVEST_RECORD`, `INSPECTION`, `CERTIFICATION`, `RECALL_NOTICE` |
| Evidence rules | Soil test: lab result + sample chain-of-custody. Harvest: scale readings + GPS field boundary. Certification: inspector attestation + compliance checklist. |
| Timebox cadence | `week` |
| Sinking mode | `earth-time` |
| Consolidation gate | `financial-balance` — mass balance: `inputSum - (outputSum + wasteSum) ≈ 0` per §52 |
| Disclosure defaults | Tier 1 (farm shape public); Tier 2 for certifications and recalls; Tier 0 for proprietary methods |
| Meta-vote hooks | Organic certification requirements, water usage limits, traceability depth requirements |

---

### 1.9 COMMERCE-0 — Marketplace Listings, Purchases & Fulfillment

| Field | Value |
|-------|-------|
| TemplateId | `template.commerce.v1` |
| Tree archetype | `org` |
| Canonical branches | `product-listings`, `purchase-events`, `delivery`, `returns`, `reviews`, `disputes` |
| Filament types | `PRODUCT_LISTING`, `PURCHASE_ORDER`, `DELIVERY_CONFIRMATION`, `RETURN_REQUEST`, `REVIEW`, `DISPUTE` |
| Evidence rules | Purchase: buyer confirmation + payment settlement ref. Delivery: carrier attestation + GPS trail + recipient confirmation. Return: reason code + return shipping evidence. |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | `financial-balance` — purchase price = payment settlement; returns balanced against refunds |
| Disclosure defaults | Tier 2 for listings; Tier 1 for transaction shapes; Tier 0 for buyer personal details |
| Meta-vote hooks | Return policy parameters, dispute resolution thresholds, listing quality standards |

---

### 1.10 LOGISTICS-0 — Shipments, Custody Chain & Incident Routing

| Field | Value |
|-------|-------|
| TemplateId | `template.logistics.v1` |
| Tree archetype | `system` |
| Canonical branches | `shipments`, `custody-chain`, `cold-chain`, `incidents`, `port-events`, `customs`, `routing` |
| Filament types | `SHIPMENT`, `CUSTODY_TRANSFER`, `TEMPERATURE_LOG`, `INCIDENT_REPORT`, `PORT_EVENT`, `CUSTOMS_CLEARANCE`, `ROUTE_CHANGE` |
| Evidence rules | Custody transfer: both-party attestation + GPS + timestamp. Cold chain: continuous sensor readings + threshold breach alerts. Customs: authority filing hash + document package. |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — custody chain unbroken from origin to destination, all handoffs attested |
| Disclosure defaults | Tier 1 (shipment shapes visible); Tier 2 for customs/regulatory; Tier 0 for commercial terms |
| Meta-vote hooks | Cold-chain temperature thresholds, incident severity classifications, carrier qualification requirements |

---

### 1.11 LAW-0 — Cases, Evidence, Hearings, Judgments & Appeals

| Field | Value |
|-------|-------|
| TemplateId | `template.law.v1` |
| Tree archetype | `org` |
| Canonical branches | `cases`, `evidence-bundles`, `hearings`, `judgments`, `appeals`, `enforcement`, `mediation` |
| Filament types | `CASE_FILING`, `EVIDENCE_SUBMISSION`, `HEARING_RECORD`, `JUDGMENT`, `APPEAL_FILING`, `ENFORCEMENT_ACTION`, `MEDIATION_RECORD` |
| Evidence rules | Case filing: jurisdiction attestation + party identification. Evidence: hash-anchored documents + chain of custody. Judgment: sortition jury verdict (§46) + judge attestation where applicable. |
| Timebox cadence | `week` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — case timeline closed, judgment committed, appeal window expired or waived |
| Disclosure defaults | Tier 2 for public proceedings; Tier 1 for case shapes; Tier 0 for sealed/confidential matters |
| Meta-vote hooks | Jury size parameters, evidence admission standards, appeal window durations, mediation eligibility |

Sortition-first design (§46). Traditional judge-based adjudication is a fallback, not a default.

---

### 1.12 CULTURE-0 — Libraries, Museums, Theatres & Community Centers

| Field | Value |
|-------|-------|
| TemplateId | `template.culture.v1` |
| Tree archetype | `org` |
| Canonical branches | `collection`, `exhibitions`, `events`, `provenance`, `conservation`, `community`, `funding` |
| Filament types | `WORK_RECORD`, `EXHIBITION_EVENT`, `PERFORMANCE`, `PROVENANCE_COMMIT`, `CONSERVATION_LOG`, `DONATION`, `GRANT` |
| Evidence rules | Provenance: chain of ownership attestations + expert verification. Exhibition: curatorial attestation + insurance coverage. Conservation: specialist responsibility + photo evidence. |
| Timebox cadence | `week` |
| Sinking mode | `earth-time` |
| Consolidation gate | `completeness` — collection inventory reconciled, provenance chains unbroken |
| Disclosure defaults | Tier 2 for public collections; Tier 1 for private collections; Tier 0 for donor identities (unless waived) |
| Meta-vote hooks | Acquisition criteria, exhibition curation standards, community event scheduling |

Integrates with §59 (Media & Content Circulation) for digital works.

---

### 1.13 FIN-INSTRUMENTS-0 — Credit, Loans, Insurance & Derivatives

| Field | Value |
|-------|-------|
| TemplateId | `template.finance.v1` |
| Tree archetype | `system` |
| Canonical branches | `credit-facilities`, `loans`, `insurance-contracts`, `bonds`, `derivatives`, `settlements`, `compliance` |
| Filament types | `CREDIT_FACILITY`, `LOAN_DRAWDOWN`, `LOAN_REPAYMENT`, `INSURANCE_CONTRACT`, `CLAIM`, `BOND_ISSUANCE`, `COUPON_PAYMENT`, `DERIVATIVE_POSITION`, `SETTLEMENT` |
| Evidence rules | Loan: lender attestation + borrower acceptance + collateral reference. Insurance: policyholder + underwriter dual attestation. Bond: issuer commitment + trustee verification. |
| Timebox cadence | `day` |
| Sinking mode | `earth-time` |
| Consolidation gate | `financial-balance` — debit/credit legs net to zero per unit type per §31 TransferPacket |
| Disclosure defaults | Tier 1 for instrument shapes; Tier 2 for regulatory filings; Tier 0 for position details |
| Meta-vote hooks | Interest rate governance parameters, insurance reserve requirements, compliance reporting thresholds |

Relay records truth; settlement stays external (fiat rails). Financial instruments are linked debit/credit filament pairs whose balance is enforced by the conservation consolidation gate.

---

## 2. Cross-Pillar Standards

These are not templates. They are required interfaces that all templates must implement to enable cross-tree linking, auditability, and governance.

### 2.1 Canonical Object IDs

Every entity in the civilization template library has a stable, globally unique identifier:

| Object Type | ID Format | Becomes |
|------------|-----------|---------|
| Person | `person.<id>` | Trunk on user tree |
| Family | `family.<id>` | Trunk on family tree |
| Parcel | `parcel.<geoId>` | Trunk on property tree |
| Building | `building.<id>` | Trunk-attached subtree on parcel |
| Asset | `asset.<serial>` | Trunk-attached subtree (high-value only) |
| Facility | `facility.<id>` | Trunk on facility tree |
| Course | `course.<id>` | Branch on education tree |
| Incident | `incident.<id>` | Filament on emergency branch |
| Case | `case.<id>` | Branch on law tree |
| Shipment | `shipment.<id>` | Branch on logistics tree |
| Instrument | `instrument.<id>` | Branch on finance tree |

All become trunks or trunk-attached subtrees depending on scale. A hospital is a trunk. A department within a hospital is a branch. A specific patient encounter is a filament.

### 2.2 Required Universal Truth Packets

Every cross-tree interaction must produce at least one of these standard packets:

**ResponsibilityPacket** — Who did what. Links a `userId` to a `commitId` with role (asserted / approved / executed) and evidence hash. Already defined in §31.2.

**TransferPacket** — Balance and conservation. Typed legs `{containerRef, amount, unit, reasonCode}` that must net to zero per unit type. Already defined in §31.1.

**EvidencePacket** — Proof record. Contains `evidenceHash`, `sourceType`, `provenance` (who/when/where the evidence was created), and `merkleAnchorRef` (immutable hash anchor). Used by all evidence rules across all templates.

```
EvidencePacket {
  evidenceId:       string,
  sourceType:       enum { DOCUMENT, SENSOR, ATTESTATION, EXTERNAL_HASH, PHOTO, VIDEO, GPS_TRAIL },
  evidenceHash:     string (sha256),
  provenance: {
    createdBy:      userRef | sensorRef | systemRef,
    createdAt:      timestamp,
    location:       { lat, lon, precision } | null,
    deviceRef:      string | null
  },
  merkleAnchorRef:  string (reference to Merkle chain position),
  confidenceScore:  number (0..1, computed from source reliability and corroboration)
}
```

**EligibilityPacket** — Who can vote or act. References an `EligibilityRuleSet` (§72.8) and proves the user meets the requirements through filament references and Merkle proofs.

```
EligibilityPacket {
  eligibilityId:    string,
  userId:           userRef,
  ruleSetRef:       eligRuleRef (→ §72.8 EligibilityRuleSet),
  appliesTo:        enum { L0_ITEM_VOTE, L1_BALLOT_VOTE, L2_RULE_VOTE, L3_AUDIT_VOTE, COMMIT, VIEW },
  proofRefs:        filamentRef[] (filaments that prove eligibility),
  merkleProofId:    string,
  validFrom:        timestamp,
  validUntil:       timestamp | null (null = until rules change)
}
```

**MetaVotePacket** — Who decides what can be decided. Defined in §72.8. Records a vote at Layer 1, 2, or 3 of the meta-voting stack with choice, weight, eligibility proof, and timestamp.

### 2.3 Cross-Tree Linking Protocol

When a filament on Tree A references an entity on Tree B (e.g., a healthcare claim references a facility, a property permit references an inspector), the cross-tree link must satisfy:

1. **Counterparty consent:** The referenced entity must have a consent grant (CONSENT_GRANT filament) permitting the link at the specified disclosure tier
2. **Bidirectional awareness:** Both trees record the link — Tree A as a counterparty reference, Tree B as an inbound reference on its attention branch
3. **Privacy floor:** The link is visible at the lowest common disclosure tier of both parties. If Tree A is Tier 2 and Tree B is Tier 0, the link is invisible to external observers (Tier 0 wins)
4. **One-click explainability:** Any cross-tree link is clickable to a one-sentence explanation of why the link exists (Contract #83)

---

## 3. HEALTH-1 — Healthcare Template Set (Deep-Dive)

### 3.1 Trees and Trunks

The healthcare domain spans three tree types that interlink:

| Tree | Trunk ID Format | Purpose |
|------|----------------|---------|
| **Person tree** | `tree.person.<id>` | Patient's health branches live on their personal user tree |
| **Facility tree** | `tree.facility.<id>` | Hospital or clinic operations, capacity, incidents, inventory |
| **Provider tree** | `tree.provider.<licenseId>` | Licensed practitioner's professional record |

A clinical encounter creates filaments on all three trees simultaneously: the patient's timeline, the facility's operations log, and the provider's case record. Cross-tree links connect them.

### 3.2 Core Branches — Patient Tree

| Branch | Service Path | Content |
|--------|-------------|---------|
| **Clinical Timeline** | `health.timeline` | All clinical events in chronological order |
| **Conditions** | `health.conditions` | Active and historical diagnoses |
| **Medications** | `health.medications` | Prescriptions, dosage history, pharmacy fills |
| **Lab Results** | `health.labResults` | Test results with instrument attestation |
| **Imaging** | `health.imaging` | Radiology, MRI, ultrasound — hash-anchored studies |
| **Procedures** | `health.procedures` | Surgeries, therapies, interventions |
| **Insurance Claims** | `health.insuranceClaims` | Claims filed, settlements, denials |
| **Consent** | `health.consent` | Active consent grants and disclosure permissions |
| **Break-Glass** | `health.breakGlass` | Emergency access events — always creates scars |

### 3.3 Core Branches — Facility Tree

| Branch | Service Path | Content |
|--------|-------------|---------|
| **Triage** | `ops.triage` | Incoming patient queue, severity assessment |
| **Capacity** | `ops.capacity` | Beds, staff, equipment availability in real-time |
| **Incidents** | `ops.incidents` | Outbreaks, adverse events, safety reports |
| **Inventory** | `ops.inventory` | Medical supply chain — filament-tracked stock |
| **Compliance** | `ops.compliance` | Regulatory adherence, audit trails |

### 3.4 Core Branches — Provider Tree

| Branch | Service Path | Content |
|--------|-------------|---------|
| **License Attestations** | `license.attestations` | Professional credentials, renewals, disciplinary actions |
| **Cases Participated** | `cases.participated` | Cross-tree references to patient encounters |
| **Outcomes Audit** | `outcomes.audit` | Aggregate outcome metrics (success rates, complication rates) |
| **Break-Glass Actions** | `breakGlass.actions` | Scar-like accountability trail for emergency access |

### 3.5 Filament Types

| Filament Type | ObjectType | Key Fields |
|--------------|------------|------------|
| `F-CLINICAL-ENCOUNTER-<id>` | `CLINICAL_EVENT` | eventType, patientRef, providerRef, facilityRef, occurredAt, severity, diagnosisCodes |
| `F-LAB-RESULT-<id>` | `LAB_RESULT` | testCode, patientRef, labRef, collectedAt, resultAt, value, unit, referenceRange |
| `F-PRESCRIPTION-<id>` | `PRESCRIPTION` | medicationName, patientRef, prescriberRef, pharmacyRef, prescribedAt, doseMg, frequency, durationDays |
| `F-PROCEDURE-<id>` | `PROCEDURE` | procedureCode, patientRef, providerRef, facilityRef, performedAt, riskScore, opNoteHash, implantLotRefs |
| `F-CLAIM-<id>` | `INSURANCE_CLAIM` | claimIdExternal, patientRef, payerRef, submittedAt, amount, currency, settlementStatus |
| `F-CONSENT-GRANT-<id>` | `CONSENT_GRANT` | consentType, grantorRef, granteeRef, grantedAt, scope, expiresAt |
| `F-BREAKGLASS-<id>` | `BREAKGLASS_EVENT` | eventId, patientRef, accessorRef, accessedAt, urgencyScore, justificationDueAt |

### 3.6 Evidence Rules

| Event Type | Required Evidence | orgConfidence Impact |
|-----------|-------------------|---------------------|
| **Lab result** | Instrument attestation hash + sample chain-of-custody ref + technician responsibility packet | High confidence only with all three present |
| **Prescription** | Licensed prescriber signature + patient consent scope permission + pharmacy fill confirmation (external hash acceptable) | Medium without pharmacy fill; high with |
| **Procedure** | Provider responsibility packet + facility attestation + operative note evidence hash | Low without op-note; high with |
| **Break-glass** | Always creates scar-like event on accessor's user tree. Must be justified within configurable window (default: 72h). Unjustified break-glass → permanent scar + governance escalation | Break-glass without justification tanks accessor confidence |
| **Insurance claim** | Clinical evidence refs + submission confirmation hash | Low without clinical link |

### 3.7 Consolidation Gate

Healthcare "ABSORBED" is not "paid." A timebox epoch seals when:

1. **Complete evidence** for every event type in the timebox (all required evidence rules satisfied)
2. **Locked consent state** — all active consent grants for that period are committed and immutable
3. **Immutable hash anchors** for all attachments (imaging studies, lab reports, clinical notes)
4. **Break-glass resolution** — all break-glass events in the timebox have justification commits or governance escalation

Incomplete timeboxes wilt. The branch shape tells the story: a firm healthcare branch means well-documented care. A wilting one means gaps in evidence or unresolved access events.

### 3.8 Safety and Privacy

- **Default disclosure is strict.** Patient tree health branches default to Tier 2 (requiring explicit consent for any access). Aggregate branch shape (thick = many events, wilting = evidence gaps) may be visible at Tier 1, but never individual filament content.
- **Cross-tree references** (provider ↔ patient, facility ↔ patient) are explicit and permissioned via CONSENT_GRANT filaments.
- **Break-glass is visible.** Every emergency access creates an auditable scar on both the patient tree and the accessor tree. There is no silent access.
- **Provider outcomes** are aggregated. Individual patient details are never exposed on the provider tree — only aggregate outcome statistics (success rates, complication rates) that cannot be traced back to individual patients.

---

## 4. PROPERTY-1 — Property & Asset Registry Template Set (Deep-Dive)

### 4.1 Trees and Trunks

| Tree | Trunk ID Format | Purpose |
|------|----------------|---------|
| **Parcel tree** | `tree.parcel.<geoId>` | Land parcel as trunk — the earth itself |
| **Building tree** | `tree.building.<id>` | Building attached to parcel as subtree |
| **Asset tree** | `tree.asset.<serial>` | High-value movable asset (optional) |

A parcel is the foundation. Buildings are subtrees rooted on the parcel. Transactions (title transfers, permits, inspections) create filaments across these trees.

### 4.2 Core Branches — Parcel Tree

| Branch | Service Path | Content |
|--------|-------------|---------|
| **Ownership Chain** | `title.ownership` | Complete chain of title from first recording |
| **Encumbrances** | `title.encumbrances` | Mortgages, liens, easements — all active encumbrances |
| **Zoning Rules** | `zoning.rules` | Projection branches showing applicable regulations |
| **Tax Assessment** | `tax.assessment` | Assessed values, tax payments, appeals |
| **Boundary Survey** | `boundary.survey` | Surveyor attestations, GPS boundary data, dispute history |
| **Incidents** | `incidents` | Damage reports, environmental events, disputes |

### 4.3 Core Branches — Building Tree

| Branch | Service Path | Content |
|--------|-------------|---------|
| **Permits** | `permits` | Building permits, renovation permits, occupancy permits |
| **Inspections** | `inspections` | All inspection events with findings and remediation |
| **Construction Phases** | `construction.phases` | Phase-by-phase construction record with material references |
| **Maintenance Schedule** | `maintenance.schedule` | Work orders, scheduled maintenance, repair history |
| **Utility Connections** | `utilities.connections` | Water, power, gas, telecom connection records |
| **Insurance Policies** | `insurance.policies` | Active and historical coverage |

### 4.4 Filament Types

| Filament Type | ObjectType | Key Fields |
|--------------|------------|------------|
| `F-TITLE-TRANSFER-<id>` | `TITLE_TRANSFER` | deedId, sellerRef, buyerRef, signedAt, considerationAmount, currency, parcelRef, jurisdictionRef |
| `F-MORTGAGE-<id>` | `ENCUMBRANCE` | encumbranceId, lenderRef, borrowerRef, principal, rate, maturityAt |
| `F-PERMIT-<id>` | `PERMIT` | permitId, applicantRef, authorityRef, scope, feeAmount |
| `F-INSPECTION-<id>` | `INSPECTION` | inspectionId, inspectorRef, inspectedAt, riskScore, findingsHash |
| `F-DAMAGE-REPORT-<id>` | `DAMAGE_REPORT` | reportId, reporterRef, occurredAt, severity, evidenceRefs |
| `F-REPAIR-WORKORDER-<id>` | `WORK_ORDER` | workOrderId, requestorRef, contractorRef, costEstimate, partsRefs |

### 4.5 Evidence Rules

| Event Type | Required Evidence | orgConfidence Impact |
|-----------|-------------------|---------------------|
| **Title transfer** | Notarized deed hash + legal authority signature (jurisdiction-specific) + payment settlement evidence ref (external rail acceptable) | High only with all three |
| **Permit** | Licensed engineer/architect attestation + municipal approval filament + fee settlement + inspection schedule | Medium without inspection; high with |
| **Inspection** | Inspector responsibility packet + findings attachment hash + (optional) photo evidence | Low without findings hash |
| **Encumbrance** | Contract hash + lender attestation + registry filing confirmation | High only with registry confirmation |
| **Work order** | Requestor responsibility + contractor acceptance or work evidence + completion evidence to close | Medium until completion evidence |

### 4.6 Consolidation Gate

Property "ABSORBED" means the record is sealed for that epoch:

1. **Title chain consistent** — no gaps in ownership, no conflicting claims
2. **All encumbrance legs balanced** — mortgage payments match amortization schedule (financial-balance gate)
3. **Authority signatures verified** — all government filings have valid authority attestations
4. **Merkle checkpoint anchored** — epoch data hash-linked and immutable

Incomplete epochs wilt. A wilting property branch means missing inspections, unresolved permit issues, or gaps in the ownership record.

### 4.7 Recall and Safety Cross-Links

If a product recall implicates a building material batch, Relay's lightning cascade (§3.16) makes the impact visible as geometry:

```
Material batch filaments
    → Construction phase filaments (which buildings used the batch)
        → Building inspection filaments (what was found)
            → Occupant safety notices (who is affected)
```

This is exactly how Relay makes "recall" legible as a visual lightning cascade across trees, not buried in email chains. The path is clickable. Every link is explainable. The affected buildings glow with heat (urgency) and fog (uncertainty about scope).

### 4.8 Privacy

- **Tier 1 default** for most property data — branch shapes are visible (property exists, has been inspected, has permits) but content details require Tier 2 access
- **Tier 2 for authority filings** — government regulatory data (zoning decisions, permit approvals) is public
- **Tier 0 for personal financial details** — mortgage balances, personal payment information, and purchase prices are private unless the owner raises the tier
- **Aggregate shape tells the story** — a thick, firm property branch means well-maintained with complete records. A wilting one means deferred maintenance, missing inspections, or unresolved encumbrances.

---

## 5. Integration Notes for Canon

To integrate the civilization template library cleanly:

1. **Template library format is standardized** — all templates follow the §21.2 `TreeTemplate` JSON schema. Domain-specific fields are extensions, not schema forks.
2. **Meta-voting is a reusable governance primitive** (§72) — not special-cased per domain. Every template's meta-vote hooks point to the same BallotItem → MetaVotePacket → EligibilityRuleSet pipeline.
3. **Privacy defaults are explicit per template** — health and property are high-stakes. Each template declares its default tiers.
4. **Cross-tree linking UX is one-click explainable** — "why can this provider see this record?" resolves to a CONSENT_GRANT filament with clear scope.
5. **Consolidation gates are domain-specific but share the same refusal pattern** — incomplete evidence → wilt. Balanced books → seal. Missing attestation → hold. The gate types (`financial-balance`, `completeness`, `peer-review`, `custom`) are the same across all templates; the rules inside vary.
6. **JSON stubs are machine-readable** — `config/templates/template.<domain>.v1.json` files can be loaded by the system at runtime to instantiate new trees with correct branch structure, evidence rules, and governance policies.

---

*This library is governed by §72 layered option governance. What pillars exist, what they contain, and how they evolve are all community decisions. No template is permanent except through continued community support.*
