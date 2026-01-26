/**
 * Relay Pre-Commit Hook (Envelope v1 Enforcer)
 * 
 * Validates commits before they are accepted into the repository.
 * This hook is called by the Relay server before applying a PUT operation.
 * 
 * CRITICAL: Every commit that changes truth MUST include .relay/envelope.json
 * 
 * @param {Object} context - Commit context
 * @param {string} context.repo - Repository name
 * @param {string} context.branch - Branch name
 * @param {Object[]} context.files - Files being committed
 * @param {Object} context.author - Author information
 * @param {string} context.message - Commit message
 * @returns {Promise<{approved: boolean, errors?: string[]}>}
 */
export async function preCommit(context) {
  const errors = [];

  // 1. ENVELOPE PRESENCE CHECK (Hard gate)
  const envelopeFile = context.files.find(f => f.path === '.relay/envelope.json');
  if (!envelopeFile) {
    return {
      approved: false,
      errors: ['REJECT: Missing .relay/envelope.json - every commit must include an envelope']
    };
  }

  let envelope;
  try {
    envelope = JSON.parse(envelopeFile.content);
  } catch (err) {
    return {
      approved: false,
      errors: [`REJECT: Invalid JSON in envelope: ${err.message}`]
    };
  }

  // 2. ENVELOPE VERSION CHECK
  if (envelope.envelope_version !== '1.0') {
    errors.push(`Invalid envelope_version: ${envelope.envelope_version} (must be "1.0")`);
  }

  // 3. DOMAIN CONFIG VALIDATION
  const domainConfig = await loadDomainConfig(envelope.domain_id);
  if (!domainConfig) {
    errors.push(`Unknown domain_id: ${envelope.domain_id}`);
  }

  // 4. COMMIT CLASS VALIDATION
  const validCommitClasses = ['CELL_EDIT', 'FORMULA_EDIT', 'ROW_CREATE', 'ROW_ARCHIVE', 'RANGE_EDIT', 'ATTACHMENT_ADD', 'OPERATOR_RUN'];
  if (!validCommitClasses.includes(envelope.commit_class)) {
    errors.push(`Invalid commit_class: ${envelope.commit_class}`);
  }

  // 5. STEP MONOTONICITY CHECK
  const expectedNextStep = await getNextStep(envelope.scope);
  if (envelope.step.scope_step !== expectedNextStep) {
    errors.push(`Step mismatch: expected ${expectedNextStep}, got ${envelope.step.scope_step}`);
  }

  // 6. FILE MANIFEST CONSISTENCY
  const declaredFiles = envelope.change.files_written;
  const actualFiles = context.files.filter(f => f.path !== '.relay/envelope.json').map(f => f.path);
  const missingFiles = declaredFiles.filter(f => !actualFiles.includes(f));
  const extraFiles = actualFiles.filter(f => !declaredFiles.includes(f));
  
  if (missingFiles.length > 0) {
    errors.push(`Files declared but not staged: ${missingFiles.join(', ')}`);
  }
  if (extraFiles.length > 0) {
    errors.push(`Files staged but not declared: ${extraFiles.join(', ')}`);
  }

  // 7. COMMIT CLASS-SPECIFIC VALIDATION
  switch (envelope.commit_class) {
    case 'CELL_EDIT':
      if (!envelope.change.cells_touched || envelope.change.cells_touched.length !== 1) {
        errors.push('CELL_EDIT must have exactly 1 cell touched');
      }
      if (envelope.change.rows_touched.length !== 1) {
        errors.push('CELL_EDIT must touch exactly 1 row');
      }
      // Check if column is editable
      if (domainConfig) {
        const colId = envelope.change.cells_touched[0]?.col_id;
        const column = domainConfig.sheet.columns.find(c => c.id === colId);
        if (column && column.editability !== 'editable') {
          errors.push(`Column ${colId} is not editable (editability: ${column.editability})`);
        }
      }
      break;

    case 'ATTACHMENT_ADD':
      if (!envelope.change.attachment) {
        errors.push('ATTACHMENT_ADD must include change.attachment object');
      } else {
        // Verify hash matches file content
        const attachmentFile = context.files.find(f => f.path === envelope.change.attachment.path);
        if (attachmentFile) {
          const actualHash = await computeSHA256(attachmentFile.content);
          if (actualHash !== envelope.change.attachment.sha256) {
            errors.push(`Hash mismatch for ${envelope.change.attachment.path}`);
          }
        }
      }
      break;

    case 'ROW_CREATE':
      if (!envelope.change.row_create) {
        errors.push('ROW_CREATE must include change.row_create object');
      }
      break;

    case 'ROW_ARCHIVE':
      if (!envelope.change.row_archive) {
        errors.push('ROW_ARCHIVE must include change.row_archive object');
      }
      break;

    case 'RANGE_EDIT':
      if (!envelope.change.range_edit) {
        errors.push('RANGE_EDIT must include change.range_edit object');
      }
      break;

    case 'FORMULA_EDIT':
      if (!envelope.change.formula) {
        errors.push('FORMULA_EDIT must include change.formula object');
      }
      break;

    case 'OPERATOR_RUN':
      if (!envelope.change.operator) {
        errors.push('OPERATOR_RUN must include change.operator object');
      }
      break;
  }

  // 8. INVARIANT CHECKS
  // No root evidence after T0
  if (envelope.change.root_evidence_refs.length > 0 && envelope.step.scope_step > 10) {
    // Warning, not error (domain policy may allow late evidence discovery)
    console.warn(`Warning: Root evidence added at step ${envelope.step.scope_step} (should be near T0)`);
  }

  // No derived columns edited (checked above in CELL_EDIT validation)

  // Return validation result
  if (errors.length > 0) {
    return {
      approved: false,
      errors
    };
  }

  return {
    approved: true
  };
}

/**
 * Helper: Load domain configuration
 */
async function loadDomainConfig(domainId) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const configPath = path.join(process.cwd(), `domains/${domainId.replace('.', '_')}.domain.json`);
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load domain config for ${domainId}:`, error);
    return null;
  }
}

/**
 * Helper: Get next expected step for scope
 */
async function getNextStep(scope) {
  // TODO: Load from server state / Git history
  // For now, return a placeholder
  // In production, this should query the last envelope's scope_step + 1
  return 1;
}

/**
 * Helper: Compute SHA256 hash
 */
async function computeSHA256(content) {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

export default preCommit;

