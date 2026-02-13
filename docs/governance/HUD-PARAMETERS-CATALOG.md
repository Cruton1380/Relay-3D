# HUD Parameters Catalog (v0)

## Purpose
This catalog defines vote-tunable presentation parameters for the adaptive HUD.
These parameters control visibility and formatting only. They do not change system truth, governance outcomes, physics, or topology.

## Policy Identity
- `paramsVersion`: `HUD-PARAMS-v0`
- `policyRef`: `local:HUD-PARAMS-v0` (currently local resolver, vote binding deferred)

## Field Definitions
- `layoutMode`
  - `compact` or `expanded`
  - Controls density and typography for desktop/mobile adaptation.
- `layer1Fields[]`
  - Always-visible strip fields.
  - Current allowed keys: `company`, `basin`, `mode`, `importStatus`, `lod`, `policyRef`.
- `modeFields`
  - Context layer fields per mode:
    - `freeFly`
    - `branchWalk`
    - `filamentRide`
    - `focus`
    - `sheetEdit`
    - `cellSelected`
  - Current context keys: `branchStep`, `filamentStep`, `focusTarget`, `cellContext`.
- `thresholds`
  - `mobileWidthPx`: compact behavior breakpoint.
  - `layer2CollapseWidthPx`: optional layer2 reduction breakpoint.
- `toggles`
  - `showInspectorButton`: show/hide HUD inspector trigger.
  - `showDebugToggles`: show/hide debug controls in HUD.
  - `showPasteCapText`: presentation hint toggle only.
- `labels`
  - Display labels for layer1 fields.

## Mode Display Matrix
- `FreeFly`: Layer 1 only by default.
- `BranchWalk`: Layer 2 shows branch step context.
- `FilamentRide`: Layer 2 shows filament/timebox step context.
- `Focus`: Layer 2 shows focus target + restore contract indicator.
- `SheetEdit` and `cellSelected`: Layer 2 shows selected cell context (cell ref/value/formula/formula state).

## Vote-Tunable Parameters (Presentation Scope Only)
- `layoutMode`
- `layer1Fields[]`
- `modeFields.*`
- `thresholds.*`
- `toggles.*`
- `labels.*`

## PolicyRef Visibility Rule
HUD must always expose active policy identity in Layer 1 via:
- `policyRef`
- `paramsVersion`

This makes active presentation policy inspectable at runtime.

## Safety Notice
HUD parameters are presentation policy, not truth policy.
Changing HUD parameters cannot mutate:
- commit history
- replay state
- governance scope decisions
- stage gates
- renderer topology/physics
