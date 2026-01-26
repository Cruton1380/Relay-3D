/**
 * Commit Envelope Builder
 * 
 * Builds valid v1 commit envelopes for all 7 commit classes.
 * Ensures deterministic step advancement and selection IDs.
 */

import crypto from 'crypto';

class EnvelopeBuilder {
  constructor(domainId, scopeConfig) {
    this.domainId = domainId;
    this.scopeConfig = scopeConfig; // { scope_type, repo_id, branch_id, bundle_id? }
    this.stepCounter = 0; // Should be loaded from server state
  }

  /**
   * Set current step counter
   */
  setStep(step) {
    this.stepCounter = step;
  }

  /**
   * Build CELL_EDIT envelope
   */
  buildCellEdit(params) {
    const {
      rowKey,
      colId,
      before,
      after,
      editKind = 'scalar',
      sheetView = 'default',
      actorId,
      actorKind = 'human',
      deviceId = null,
      filesWritten = []
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'CELL_EDIT',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: [
          {
            t: 'CELL',
            row_key: rowKey,
            col_id: colId,
            face: null,
            step_range: null,
            spatial: null
          }
        ]
      },
      change: {
        rows_touched: [rowKey],
        cells_touched: [
          {
            row_key: rowKey,
            col_id: colId,
            before,
            after,
            edit_kind: editKind,
            sheet_view: sheetView
          }
        ],
        files_written: filesWritten,
        derived_artifacts: [],
        root_evidence_refs: []
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '', // Computed after serialization
          payload_manifest_sha256: '' // Computed from files_written
        }
      }
    };
  }

  /**
   * Build FORMULA_EDIT envelope
   */
  buildFormulaEdit(params) {
    const {
      rowKey,
      formulaId,
      beforeRef,
      afterRef,
      language = 'prompt',
      diffSummary,
      actorId,
      actorKind = 'human',
      deviceId = null,
      filesWritten = []
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'FORMULA_EDIT',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: [
          {
            t: 'CELL',
            row_key: rowKey,
            col_id: formulaId,
            face: null,
            step_range: null,
            spatial: null
          }
        ]
      },
      change: {
        rows_touched: [rowKey],
        cells_touched: [],
        files_written: filesWritten,
        derived_artifacts: [],
        root_evidence_refs: [],
        formula: {
          row_key: rowKey,
          formula_id: formulaId,
          before_ref: beforeRef,
          after_ref: afterRef,
          language,
          diff_summary: diffSummary
        }
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '',
          payload_manifest_sha256: ''
        }
      }
    };
  }

  /**
   * Build ROW_CREATE envelope
   */
  buildRowCreate(params) {
    const {
      rowKey,
      rowType,
      displayName,
      createdFrom = 'seed',
      sourceRef = null,
      initialCells = [],
      actorId,
      actorKind = 'human',
      deviceId = null,
      filesWritten = []
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'ROW_CREATE',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: [
          {
            t: 'ROW',
            row_key: rowKey,
            col_id: null,
            face: null,
            step_range: null,
            spatial: null
          }
        ]
      },
      change: {
        rows_touched: [rowKey],
        cells_touched: [],
        files_written: filesWritten,
        derived_artifacts: [],
        root_evidence_refs: [],
        row_create: {
          row_key: rowKey,
          row_type: rowType,
          display_name: displayName,
          created_from: createdFrom,
          source_ref: sourceRef
        }
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '',
          payload_manifest_sha256: ''
        }
      }
    };
  }

  /**
   * Build ROW_ARCHIVE envelope
   */
  buildRowArchive(params) {
    const {
      rowKey,
      beforeStatus,
      afterStatus = 'archived',
      reason,
      replacementRowKey = null,
      actorId,
      actorKind = 'human',
      deviceId = null,
      filesWritten = []
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'ROW_ARCHIVE',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: [
          {
            t: 'ROW',
            row_key: rowKey,
            col_id: null,
            face: null,
            step_range: null,
            spatial: null
          }
        ]
      },
      change: {
        rows_touched: [rowKey],
        cells_touched: [],
        files_written: filesWritten,
        derived_artifacts: [],
        root_evidence_refs: [],
        row_archive: {
          row_key: rowKey,
          before_status: beforeStatus,
          after_status: afterStatus,
          reason,
          replacement_row_key: replacementRowKey
        }
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '',
          payload_manifest_sha256: ''
        }
      }
    };
  }

  /**
   * Build RANGE_EDIT envelope
   */
  buildRangeEdit(params) {
    const {
      rangeKind,
      targets,
      reorder = null,
      actorId,
      actorKind = 'human',
      deviceId = null,
      filesWritten = []
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);
    const rowKeys = targets.map(t => t.row_key);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'RANGE_EDIT',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: [
          {
            t: 'STEP_RANGE',
            row_key: null,
            col_id: null,
            face: null,
            step_range: `${nextStep}..${nextStep}`,
            spatial: null
          }
        ]
      },
      change: {
        rows_touched: rowKeys,
        cells_touched: [],
        files_written: filesWritten,
        derived_artifacts: [],
        root_evidence_refs: [],
        range_edit: {
          range_kind: rangeKind,
          targets,
          ...(reorder && { reorder })
        }
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '',
          payload_manifest_sha256: ''
        }
      }
    };
  }

  /**
   * Build ATTACHMENT_ADD envelope
   */
  buildAttachmentAdd(params) {
    const {
      attachmentKind,
      path,
      sha256,
      mime,
      sizeBytes,
      linkedTo,
      actorId,
      actorKind = 'human',
      deviceId = null
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'ATTACHMENT_ADD',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: [
          {
            t: 'FACE',
            row_key: linkedTo.row_key || null,
            col_id: null,
            face: linkedTo.face || null,
            step_range: null,
            spatial: null
          }
        ]
      },
      change: {
        rows_touched: linkedTo.row_key ? [linkedTo.row_key] : [],
        cells_touched: [],
        files_written: [path],
        derived_artifacts: attachmentKind === 'derived_artifact' ? [path] : [],
        root_evidence_refs: attachmentKind === 'root_evidence' ? [path] : [],
        attachment: {
          attachment_kind: attachmentKind,
          path,
          sha256,
          mime,
          size_bytes: sizeBytes,
          linked_to: linkedTo
        }
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '',
          payload_manifest_sha256: sha256 // Attachment hash doubles as manifest
        }
      }
    };
  }

  /**
   * Build OPERATOR_RUN envelope
   */
  buildOperatorRun(params) {
    const {
      operatorId,
      inputs,
      outputs,
      status = 'success',
      durationMs = 0,
      rowKeys = [],
      derivedArtifacts = [],
      actorId,
      actorKind = 'automation',
      deviceId = null,
      filesWritten = []
    } = params;

    const nextStep = this.stepCounter + 1;
    const selectionId = this._buildSelectionId(nextStep);

    return {
      envelope_version: '1.0',
      domain_id: this.domainId,
      commit_class: 'OPERATOR_RUN',
      scope: { ...this.scopeConfig },
      step: {
        step_policy: 'DENSE_SCOPE_STEP',
        scope_step: nextStep,
        time_hint_utc: new Date().toISOString()
      },
      actor: {
        actor_id: actorId,
        actor_kind: actorKind,
        device_id: deviceId
      },
      selection: {
        selection_id: selectionId,
        targets: rowKeys.map(rowKey => ({
          t: 'ROW',
          row_key: rowKey,
          col_id: null,
          face: null,
          step_range: null,
          spatial: null
        }))
      },
      change: {
        rows_touched: rowKeys,
        cells_touched: [],
        files_written: filesWritten,
        derived_artifacts: derivedArtifacts,
        root_evidence_refs: [],
        operator: {
          operator_id: operatorId,
          inputs,
          outputs,
          status,
          ...(durationMs && { duration_ms: durationMs })
        }
      },
      validation: {
        schema_version: 'domain-registry-v1',
        hashes: {
          envelope_sha256: '',
          payload_manifest_sha256: ''
        }
      }
    };
  }

  /**
   * Finalize envelope (compute hashes)
   */
  finalize(envelope, payloadFiles = []) {
    // Compute envelope hash
    const envelopeCopy = { ...envelope, validation: { ...envelope.validation, hashes: {} } };
    const envelopeJson = JSON.stringify(envelopeCopy, null, 2);
    const envelopeHash = crypto.createHash('sha256').update(envelopeJson).digest('hex');

    // Compute payload manifest hash
    const manifestJson = JSON.stringify(payloadFiles.sort(), null, 2);
    const manifestHash = crypto.createHash('sha256').update(manifestJson).digest('hex');

    envelope.validation.hashes.envelope_sha256 = envelopeHash;
    envelope.validation.hashes.payload_manifest_sha256 = manifestHash;

    return envelope;
  }

  /**
   * Build selection ID
   */
  _buildSelectionId(step) {
    const { repo_id, branch_id } = this.scopeConfig;
    return `sel:v1/${repo_id}/${branch_id}/${step}`;
  }
}

export default EnvelopeBuilder;
export { EnvelopeBuilder };

